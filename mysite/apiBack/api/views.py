# Standard Library Imports
import json
import os
import random
import re
import logging # Added for AuthTestView

# Django Imports
from django.contrib.auth import authenticate, logout, login
from django.shortcuts import get_object_or_404, render
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt # Consider security implications
from django.http import HttpRequest

# Django REST Framework Imports
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from rest_framework.request import Request
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

# Third-Party Imports
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except Exception as e:
    print(f"Warning: Google Generative AI not available: {e}")
    GENAI_AVAILABLE = False
    # Create a mock genai object to prevent import errors
    class MockGenAI:
        api_key = None
        def configure(self, **kwargs):
            pass
        def GenerativeModel(self, *args, **kwargs):
            return MockGenerativeModel()
    
    class MockGenerativeModel:
        def generate_content(self, *args, **kwargs):
            return MockResponse()
    
    class MockResponse:
        def __init__(self):
            self.text = "Google Generative AI is not available due to compatibility issues."
    
    genai = MockGenAI()

# Local Application Imports
from .models import Activite, Affirmation, Reponse, Debrief, Users, Categorie
from .serializers import (
    ActiviteSerializer,
    AffirmationSerializer,
    ReponseSerializer,
    DebriefSerializer,
    ReponseSerializerGET
)

# --- Authentication Views ---

class ActiviteLoginView(APIView):
    """Login for 'etudiant' role using email and activity code."""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        code_activite = request.data.get('code_activite')

        if not email or not code_activite:
            return Response(
                {'error': 'Email et code_activite sont requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        code_activite = code_activite.upper()
        try:
            # Ensure the user is an etudiant
            user = Users.objects.get(email=email, role='etudiant')
        except Users.DoesNotExist:
            return Response(
                {'error': 'Aucun étudiant trouvé avec cet email.'},
                status=status.HTTP_404_NOT_FOUND
            )
        try:
            activite = Activite.objects.get(pk=code_activite)
        except Activite.DoesNotExist:
             return Response(
                {'error': f'Aucune activité trouvée avec le code {code_activite}.'},
                status=status.HTTP_404_NOT_FOUND
            )
        # Check if the student is authorized for this specific activity
        if activite.etudiants_autorises.filter(pk=user.pk).exists():
            # Also check if the activity is published for students
            if not activite.is_published:
                return Response(
                    {'error': "Cette activité n'est pas encore publiée."},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Authenticate and log in the user
            # Note: Django's login requires the backend to be configured (e.g., ModelBackend)
            # If using custom user model without password for students, login might behave unexpectedly.
            # Consider token-based auth or session management carefully.
            # Assuming standard Django auth flow works here:
            login(request, user)
            data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'code_activite': activite.code_activite, # Return the activity code used for login
                'message': 'Connexion réussie.'
            }
            return Response(data, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': "Cet utilisateur n'est pas autorisé à accéder à cette activité."},
                status=status.HTTP_403_FORBIDDEN
            )

class EncadrantLoginView(APIView):
    """Login for 'encadrant' role using email and password."""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email et mot de passe sont requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find user by email first
        try:
            user = Users.objects.get(email=email)
        except Users.DoesNotExist:
            return Response(
                {'error': 'Aucun utilisateur trouvé avec cet email.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify the role
        if user.role != 'encadrant':
            return Response(
                {'error': 'Seuls les encadrants peuvent se connecter ici.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Authenticate using Django's system
        # `authenticate` checks the password against the hashed version in the DB
        auth_user = authenticate(request, username=user.username, password=password)

        if auth_user is not None:
            # Authentication successful
            login(request, auth_user)
            data = {
                'id': auth_user.id,
                'username': auth_user.username,
                'email': auth_user.email,
                'first_name': auth_user.first_name,
                'last_name': auth_user.last_name,
                'role': auth_user.role,
                'message': 'Connexion encadrant réussie.'
            }
            return Response(data, status=status.HTTP_200_OK)
        else:
            # Authentication failed
            # Check if it was the password specifically (user exists, role is correct)
            if user.check_password(password):
                 # This case should ideally not happen if authenticate is configured correctly
                 # but indicates a potential issue with the authentication backend setup.
                 return Response(
                    {'error': 'Erreur d\'authentification inconnue.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            else:
                return Response(
                    {'error': 'Mot de passe incorrect.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

class LogoutAPIView(APIView):
    """Standard logout view."""
    permission_classes = (permissions.IsAuthenticated,) # User must be logged in to log out

    def post(self, request):
        logout(request)
        return Response({'message': 'Déconnexion réussie.'}, status=status.HTTP_200_OK)


# --- Gemini API Interaction Views ---

# Using environment variable is strongly recommended for API keys
# API_KEY = os.environ.get("GEMINI_API_KEY")
# Fallback to hardcoded key (less secure, replace with env var)
API_KEY = "AIzaSyBoY3qt37ceH8lyD0HXBufmVniCFQljzP8"
if not API_KEY:
    print("Warning: GEMINI_API_KEY environment variable not set.")
else:
    genai.configure(api_key=API_KEY)

def extract_json_from_gemini(input_text):
    """Helper function to clean and parse JSON from Gemini response."""
    # Remove markdown code block fences and language specifier
    cleaned_text = re.sub(r'^```json\s*', '', input_text.strip(), flags=re.MULTILINE)
    cleaned_text = re.sub(r'\s*```$', '', cleaned_text, flags=re.MULTILINE)
    cleaned_text = cleaned_text.strip()

    try:
        parsed_json = json.loads(cleaned_text)
        return parsed_json
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        # Fallback: Try to find the first valid JSON structure (list or dict)
        match = re.search(r"(\[.*\]|\{.*\})", cleaned_text, re.DOTALL)
        if match:
            try:
                parsed_json = json.loads(match.group(0))
                print("Warning: Used fallback regex to extract JSON.")
                return parsed_json
            except json.JSONDecodeError:
                print("Fallback JSON extraction failed.")
        return None # Indicate failure

class ChatbotAPIView(APIView):
    pass

class Generate(APIView):
    """
    Public API endpoint for generating affirmations.
    Calls ChatbotAPIView internally.
    Includes input validation.
    """
    permission_classes = [permissions.IsAuthenticated] # Secure this endpoint

    def post(self, request):
        number_str = request.data.get('number')
        question = request.data.get('question')

        if not number_str or not question:
            return Response(
                {"error": "'number' et 'question' sont requis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Input validation (from File 2)
        try:
            number = int(number_str)
            if number <= 0:
                raise ValueError("Le nombre doit être positif.")
        except (ValueError, TypeError):
            return Response({"error": "'number' doit être un entier positif."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Create instance of internal view
        chatbot_view = ChatbotAPIView()

        # 2. Prepare data for internal call
        internal_request_data = {
            "nombre": number, # Key expected by ChatbotAPIView
            "question": question
        }

        # 3. Simulate DRF Request for internal call (pass original request for context)
        #    Using Request ensures compatibility if ChatbotAPIView permissions/context needs change.
        internal_drf_request = Request(request._request, parsers=request.parsers)
        internal_drf_request._full_data = internal_request_data # Set data for the internal request
        internal_drf_request.user = request.user # Pass user context
        internal_drf_request.auth = request.auth # Pass auth context

        # 4. Call the internal view's post method
        try:
            # Directly return the Response object from the internal call
            response = chatbot_view.post(internal_drf_request)
            return response
        except Exception as e:
             # Handle potential errors during the internal call itself
             print(f"Error calling ChatbotAPIView internally: {e}")
             return Response(
                 {"error": "Erreur interne lors de la génération des affirmations.", "details": str(e)},
                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
             )

class GeminiGenerateAffirmationsAPIView(APIView):
    """
    Generates exactly 3 FALSE but plausible medical affirmations with explanations
    for a given question using the Gemini API.
    """
    permission_classes = [permissions.IsAuthenticated] # Typically requires auth

    def post(self, request):
        question = request.data.get('question')
        if not question:
            return Response({"error": "Une question est requise."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            generation_config = {
                "temperature": 0.9, # Slightly creative
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
                "response_mime_type": "text/plain", # Expecting plain text containing JSON
            }

            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash", # Or "gemini-1.5-flash" for speed/cost
                generation_config=generation_config,
            )

            prompt = f"""
            Vous êtes un expert en connaissances médicales. Votre tâche consiste à produire des affirmations médicales fausses mais plausibles qui répondent directement à la question: "{question}" donnée tout en prenant en compte le contexte suivant.

            Chaque affirmation doit :
            1. Être complexe et difficile à juger comme fausse au premier abord.
            2. Paraître scientifiquement plausible et liée au sujet médical de la question.
            3. Être directement en lien avec le contexte fourni.
            4. assure toi de respecter le formatage


            Les affirmations doivent toutes être fausses, mais paraître scientifiquement crédibles.

            Réponds **uniquement** avec un objet JSON structuré comme ceci, sans texte avant ou après:
            {{
              "affirmations": [
                {{
                  "affirmation": "texte de la première affirmation fausse",
                  "is_correct_vf": false,
                  "explication": "explication détaillée de pourquoi cette affirmation est fausse"
                }},
                {{
                  "affirmation": "texte de la deuxième affirmation fausse",
                  "is_correct_vf": false,
                  "explication": "explication détaillée de pourquoi cette affirmation est fausse"
                }},
                {{
                  "affirmation": "texte de la troisième affirmation fausse",
                  "is_correct_vf": false,
                  "explication": "explication détaillée de pourquoi cette affirmation est fausse"
                }}
              ]
            }}
            """

            # Use generate_content for simpler prompt/response
            response = model.generate_content(prompt)
            response_text = response.text
            print("[GeminiGenerateAffirmations] Raw Gemini Response Text:\n", response_text) # Debug log

            # Parse the JSON
            affirmations_data = extract_json_from_gemini(response_text)

            if not affirmations_data or 'affirmations' not in affirmations_data:
                 raise json.JSONDecodeError("Expected JSON with 'affirmations' key not found.", response_text, 0)

            # Validate structure
            if not isinstance(affirmations_data['affirmations'], list) or len(affirmations_data['affirmations']) != 3:
                print(f"Warning: Gemini returned unexpected structure or count: {len(affirmations_data.get('affirmations', []))} items.")
                # Attempt to salvage if possible, or return error
                # For now, strict error:
                return Response(
                    {"error": "Format de réponse incorrect (nombre/structure) depuis l'API Gemini."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Ensure is_correct_vf is explicitly false
            for aff in affirmations_data['affirmations']:
                aff['is_correct_vf'] = False # Override anything Gemini might have put

            return Response(affirmations_data, status=status.HTTP_200_OK) # Return the whole dict {"affirmations": [...]}

        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            return Response(
                {"error": "Impossible de décoder la réponse JSON de l'API Gemini.", "raw_response": response_text if 'response_text' in locals() else "N/A"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            import traceback
            print(f"Gemini Generation Error: {traceback.format_exc()}")
            return Response(
                {"error": f"Une erreur est survenue lors de la génération: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Renamed GeminiMakeHarder views for clarity

class GeminiMakeHarderAPIView(APIView):
    """
    API endpoint to make an affirmation harder using Google's Gemini API
    """
    def post(self, request):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return Response({'error': 'Authentification requise'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Extract data from request
        data = request.data
        affirmation = data.get('affirmation')
        explanation = data.get('explanation', '')
        
        if not affirmation:
            return Response({'error': 'Affirmation requise'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Configure the Gemini API with hardcoded API key
            genai.configure(api_key="AIzaSyABqiPmXV2L_poHHdr9bKA8Fm8ehN2hWms")
            
            # Construct the prompt
            prompt = f"""
            En tant qu'expert médical, votre tâche consiste à rendre cette affirmation médicale fausse encore plus difficile à détecter comme étant fausse.

            Affirmation originale : {affirmation}
            Explication originale de pourquoi elle est fausse : {explanation}

            Veuillez reformuler cette affirmation pour la rendre encore plus plausible et difficile à reconnaître comme étant fausse. 
            L'affirmation doit :
            1. Rester dans le même domaine médical mais être plus subtile
            2. Utiliser des termes techniques plus avancés
            3. Paraître encore plus crédible scientifiquement
            4. Conserver la même idée de base mais la rendre plus nuancée et complexe
            5. Rester fausse pour les mêmes raisons fondamentales

            Fournissez également une explication mise à jour de pourquoi cette affirmation est fausse.

            Formatez votre réponse comme suit :

            Affirmation améliorée : <insérez ici l'affirmation plus difficile>
            Explication améliorée : <expliquez pourquoi cette affirmation est fausse>
            """
            
            # Use Gemini model
            model = genai.GenerativeModel('gemini-2.5-flash-preview-04-17')
            
            # Generate the response
            response = model.generate_content(prompt)
            
            # Parse the response
            full_text = response.text
            
            # Extract the improved affirmation and explanation
            affirmation_match = re.search(r'Affirmation améliorée : (.*?)(?=\n|$)', full_text, re.DOTALL)
            explanation_match = re.search(r'Explication améliorée : (.*?)(?=\n|$)', full_text, re.DOTALL)
            
            improved_affirmation = affirmation_match.group(1).strip() if affirmation_match else affirmation
            improved_explanation = explanation_match.group(1).strip() if explanation_match else explanation
            
            return Response({
                'affirmation': improved_affirmation,
                'explanation': improved_explanation,
                'is_correct': False  # Still a false affirmation
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error making affirmation harder: {str(e)}")
            return Response({'error': f"Error making affirmation harder: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class GeminiMakeSingleAffirmationHarderAPIView(APIView):
    """
    Reformulates a single FALSE affirmation to be harder to detect, without requiring/returning an explanation.
    (Based on File 1's second GeminiMakeHarderAPIView)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        affirmation_text = request.data.get('affirmation')

        if not affirmation_text:
            return Response({'error': 'Affirmation requise'}, status=status.HTTP_400_BAD_REQUEST)

        if not genai.api_key:
             return Response({"error": "Gemini API Key not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            generation_config = {
                "temperature": 0.8, # More controlled than temp=1
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 1024, # Shorter output expected
                "response_mime_type": "text/plain",
            }

            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro", # Or flash
                generation_config=generation_config,
            )

            prompt = f"""
            Je te donne une affirmation médicale ou scientifique qui est **fausse**.
            Ta tâche est de la reformuler pour la rendre **encore plus plausible et plus difficile** à détecter comme fausse pour un étudiant en médecine ou un jeune professionnel.

            La nouvelle version doit:
            1. Rester **fausse** pour des raisons similaires à l'originale.
            2. Sembler plus crédible, subtile et scientifiquement fondée.
            3. Utiliser un langage précis, potentiellement complexe.
            4. Éviter les erreurs grossières et intégrer des éléments vrais de manière trompeuse si possible.

            Affirmation originale à améliorer: "{affirmation_text}"

            Réponds **uniquement** avec l'affirmation reformulée (la version plus difficile). Ne fournis **aucune** introduction, explication ou autre commentaire. Juste le texte de la nouvelle affirmation.
            """

            response = model.generate_content(prompt)
            harder_affirmation_text = response.text.strip()

            # Basic validation: check if response is empty or looks like an error message
            if not harder_affirmation_text or len(harder_affirmation_text) < 10 or "désolé" in harder_affirmation_text.lower():
                 print(f"Gemini returned unexpected response for making affirmation harder: {harder_affirmation_text}")
                 return Response({
                     'error': 'Failed to generate a harder affirmation.',
                     'original_affirmation': affirmation_text,
                     'gemini_response': harder_affirmation_text
                     }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


            return Response({
                'original_affirmation': affirmation_text,
                'harder_affirmation': harder_affirmation_text,
                'is_correct_vf': False # Just confirming it's still false
            }, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            print(f"Error making single affirmation harder: {traceback.format_exc()}")
            return Response({
                'error': f'Erreur lors de la génération: {str(e)}',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GeminiMakeMultipleAffirmationsHarderAPIView(APIView):
    """
    Takes a list of FALSE statements related to a question and makes them harder.
    (Based on File 1's third GeminiMakeHarderAPIView)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        statements = request.data.get('statements') # Expecting a list of strings
        question = request.data.get('question')
        field = request.data.get('field', 'médecine') # Optional context

        if not isinstance(statements, list) or not statements:
            return Response({"error": "'statements' doit être une liste non vide d'affirmations."}, status=status.HTTP_400_BAD_REQUEST)
        if not question:
            return Response({"error": "'question' est requise pour le contexte."}, status=status.HTTP_400_BAD_REQUEST)

        if not genai.api_key:
             return Response({"error": "Gemini API Key not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        statements_text = "\n".join([f"- {stmt}" for stmt in statements])
        prompt = f"""
        Contexte: Question médicale ou scientifique dans le domaine de '{field}'.
        Question: "{question}"

        Affirmations originales (toutes FAUSSES mais plausibles):
        {statements_text}

        Ta tâche est de reformuler **chacune** de ces affirmations pour les rendre **encore plus difficiles** à identifier comme fausses par des étudiants avancés.
        Les affirmations améliorées doivent :
        1. Rester **fausses** pour des raisons similaires aux originales.
        2. Paraître encore plus plausibles, subtiles et scientifiquement fondées.
        3. Utiliser un langage technique précis et potentiellement nuancé.
        4. Conserver le thème de l'affirmation originale.

        Réponds **uniquement** avec un objet JSON contenant une liste des affirmations améliorées, correspondant à l'ordre des originales.
        Format de la réponse JSON attendu:
        {{
          "statements": [
            "première affirmation améliorée",
            "deuxième affirmation améliorée",
            ...
          ]
        }}
        Ne fournis aucune explication ni texte supplémentaire avant ou après le JSON.
        """

        try:
            generation_config = {
                "temperature": 0.8,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192, # Allow ample space
                # "response_mime_type": "application/json", # Try requesting JSON directly
                 "response_mime_type": "text/plain", # Safer fallback if JSON mode fails
            }

            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro",
                generation_config=generation_config,
            )

            response = model.generate_content(prompt)
            response_text = response.text
            print("[GeminiMakeMultiple] Raw Response:\n", response_text) # Debug

            result = extract_json_from_gemini(response_text)

            if result and 'statements' in result and isinstance(result['statements'], list) and len(result['statements']) == len(statements):
                return Response({"statements": result['statements'], "is_correct_vf": [False]*len(statements)}, status=status.HTTP_200_OK)
            else:
                print(f"Failed to parse expected JSON structure. Expected {len(statements)} statements.")
                # Attempt fallback parsing if simple list is returned without the dict wrapper
                if isinstance(result, list) and len(result) == len(statements):
                     print("Warning: Using fallback list extraction.")
                     return Response({"statements": result, "is_correct_vf": [False]*len(statements)}, status=status.HTTP_200_OK)

                return Response(
                    {"error": "Échec de la génération ou du formatage des affirmations améliorées.", "raw_response": response.text},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            import traceback
            print(f"Error making multiple affirmations harder: {traceback.format_exc()}")
            return Response(
                {"error": "An error occurred while generating harder affirmations.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# --- CRUD Views for Models ---

class ActiviteAPIView(APIView):
    """CRUD operations for Activite model."""
    permission_classes = [permissions.IsAuthenticated]

    # GET method (Combined logic)
    def get(self, request, pk=None):
        user = request.user
        if pk is None:  # List view
            if user.role == 'encadrant':
                # Encadrants list their own activities
                activites = Activite.objects.filter(encadrant=user)
                serializer = ActiviteSerializer(activites, many=True, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)
            elif user.role == 'etudiant':
                # Students list only published activities they are authorized for
                activites = Activite.objects.filter(etudiants_autorises=user, is_published=True)
                serializer = ActiviteSerializer(activites, many=True, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                 # Other roles (if any) denied for now
                 return Response({"error": "Permission refusée pour ce rôle."}, status=status.HTTP_403_FORBIDDEN)
        else:  # Retrieve view (pk is code_activite)
            code_activite_upper = pk.upper()
            activite = get_object_or_404(Activite, pk=code_activite_upper)

            # Check permissions for this specific activity
            is_encadrant_owner = user.role == 'encadrant' and activite.encadrant == user
            is_authorized_etudiant = user.role == 'etudiant' and activite.etudiants_autorises.filter(pk=user.pk).exists()

            if is_encadrant_owner:
                # Encadrants can see both published and draft activities they own
                serializer = ActiviteSerializer(activite, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)
            elif is_authorized_etudiant:
                # Students can only see published activities they are authorized for
                if not activite.is_published:
                    return Response({"error": "Cette activité n'est pas encore publiée."}, status=status.HTTP_403_FORBIDDEN)
                serializer = ActiviteSerializer(activite, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # User is authenticated but not authorized for THIS activity
                return Response({"error": "Vous n'êtes pas autorisé à accéder à cette activité spécifique."}, status=status.HTTP_403_FORBIDDEN)

    # POST method (From File 1 - more robust M2M handling logic)
    def post(self, request):
        if not request.user.role == 'encadrant':
             return Response({"error": "Seuls les encadrants peuvent créer des activités."}, status=status.HTTP_403_FORBIDDEN)

        # Use context to potentially pass user to serializer if needed
        serializer = ActiviteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Check for duplicate code (case-insensitive)
            code = serializer.validated_data.get('code_activite', '').upper()
            if Activite.objects.filter(pk=code).exists():
                 return Response({"code_activite": ["Ce code d'activité existe déjà."]}, status=status.HTTP_400_BAD_REQUEST)

            # Save the activity, automatically assigning the encadrant
            # Serializer should handle M2M if using PrimaryKeyRelatedField or similar correctly defined
            activite = serializer.save(encadrant=request.user)

            # Note: If serializer doesn't handle M2M (e.g., using basic fields),
            # you might need manual handling like in File 1's original POST, but
            # it's cleaner to define M2M relations properly in the serializer.
            # Example: etudiant_ids = request.data.get('etudiants_autorises_ids') -> activite.etudiants_autorises.set(etudiant_ids)

            # Return data using the same serializer instance for consistency
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # PUT method (From File 1 - includes validation and explicit M2M update)
    def put(self, request, pk):
        if not request.user.role == 'encadrant':
             return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        code_activite_upper = pk.upper()
        # Ensure the encadrant owns the activity they are trying to update
        activite = get_object_or_404(Activite, pk=code_activite_upper, encadrant=request.user)

        # Prevent changing the primary key (code_activite) via PUT
        serializer_data = request.data.copy()
        submitted_code = serializer_data.get('code_activite')
        if submitted_code and submitted_code.upper() != code_activite_upper:
             return Response({"code_activite": ["La modification du code activité n'est pas autorisée via PUT."]}, status=status.HTTP_400_BAD_REQUEST)
        # Remove it from data passed to serializer to avoid accidental change attempts
        serializer_data.pop('code_activite', None)

        # Extract M2M IDs for separate handling if provided
        etudiant_ids = serializer_data.pop('etudiants_autorises_ids', None) # Use _ids if serializer expects this
        affirmation_ids = serializer_data.pop('affirmations_associes_ids', None)

        # Update non-M2M fields
        serializer = ActiviteSerializer(activite, data=serializer_data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_activite = serializer.save()

            # Update M2M fields if IDs were provided
            # Important: Validate these IDs exist and have the correct roles/types
            try:
                if etudiant_ids is not None:
                    valid_etudiants = Users.objects.filter(pk__in=etudiant_ids, role='etudiant')
                    if len(valid_etudiants) != len(set(etudiant_ids)): # Check if all provided IDs were valid students
                        print(f"Warning: Some student IDs in {etudiant_ids} were invalid or not students.")
                        # Decide on behavior: error out or proceed with valid ones?
                        # Erroring out is safer:
                        # return Response({"etudiants_autorises_ids": "Un ou plusieurs IDs étudiant sont invalides ou n'ont pas le rôle 'etudiant'."}, status=status.HTTP_400_BAD_REQUEST)
                    updated_activite.etudiants_autorises.set(valid_etudiants) # Use set() for replacement

                if affirmation_ids is not None:
                    valid_affirmations = Affirmation.objects.filter(pk__in=affirmation_ids)
                    if len(valid_affirmations) != len(set(affirmation_ids)):
                        print(f"Warning: Some affirmation IDs in {affirmation_ids} were invalid.")
                        # return Response({"affirmations_associes_ids": "Un ou plusieurs IDs affirmation sont invalides."}, status=status.HTTP_400_BAD_REQUEST)
                    updated_activite.affirmations_associes.set(valid_affirmations)

            except ValueError: # Handles non-integer IDs
                 return Response({"error": "Les IDs pour les relations M2M doivent être des nombres entiers."}, status=status.HTTP_400_BAD_REQUEST)
            except Users.DoesNotExist: # Should be caught by filter check above, but as fallback
                 return Response({"etudiants_autorises_ids": "Erreur lors de la validation des IDs étudiant."}, status=status.HTTP_400_BAD_REQUEST)
            except Affirmation.DoesNotExist:
                 return Response({"affirmations_associes_ids": "Erreur lors de la validation des IDs affirmation."}, status=status.HTTP_400_BAD_REQUEST)

            # Return full updated data using the serializer
            return Response(ActiviteSerializer(updated_activite, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # PATCH method (Partial update - similar to PUT but allows partial data)
    def patch(self, request, pk):
        if not request.user.role == 'encadrant':
             return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        code_activite_upper = pk.upper()
        # Ensure the encadrant owns the activity they are trying to update
        activite = get_object_or_404(Activite, pk=code_activite_upper, encadrant=request.user)

        # Prevent changing the primary key (code_activite) via PATCH
        serializer_data = request.data.copy()
        submitted_code = serializer_data.get('code_activite')
        if submitted_code and submitted_code.upper() != code_activite_upper:
             return Response({"code_activite": ["La modification du code activité n'est pas autorisée via PATCH."]}, status=status.HTTP_400_BAD_REQUEST)
        # Remove it from data passed to serializer to avoid accidental change attempts
        serializer_data.pop('code_activite', None)

        # Extract M2M IDs for separate handling if provided
        etudiant_ids = serializer_data.pop('etudiants_autorises_ids', None)
        affirmation_ids = serializer_data.pop('affirmations_associes_ids', None)

        # Update non-M2M fields with partial=True for PATCH
        serializer = ActiviteSerializer(activite, data=serializer_data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_activite = serializer.save()

            # Update M2M fields if IDs were provided
            try:
                if etudiant_ids is not None:
                    valid_etudiants = Users.objects.filter(pk__in=etudiant_ids, role='etudiant')
                    if len(valid_etudiants) != len(set(etudiant_ids)):
                        print(f"Warning: Some student IDs in {etudiant_ids} were invalid or not students.")
                    updated_activite.etudiants_autorises.set(valid_etudiants)

                if affirmation_ids is not None:
                    valid_affirmations = Affirmation.objects.filter(pk__in=affirmation_ids)
                    if len(valid_affirmations) != len(set(affirmation_ids)):
                        print(f"Warning: Some affirmation IDs in {affirmation_ids} were invalid.")
                    updated_activite.affirmations_associes.set(valid_affirmations)

            except ValueError:
                 return Response({"error": "Les IDs pour les relations M2M doivent être des nombres entiers."}, status=status.HTTP_400_BAD_REQUEST)
            except Users.DoesNotExist:
                 return Response({"etudiants_autorises_ids": "Erreur lors de la validation des IDs étudiant."}, status=status.HTTP_400_BAD_REQUEST)
            except Affirmation.DoesNotExist:
                 return Response({"affirmations_associes_ids": "Erreur lors de la validation des IDs affirmation."}, status=status.HTTP_400_BAD_REQUEST)

            # Return full updated data using the serializer
            return Response(ActiviteSerializer(updated_activite, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE method (From File 1)
    def delete(self, request, pk):
        if not request.user.role == 'encadrant':
             return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        activite = get_object_or_404(Activite, pk=pk.upper(), encadrant=request.user)
        activite.delete()
        # M2M relations are typically handled automatically by Django
        # on_delete settings in models handle FK relations
        return Response(status=status.HTTP_204_NO_CONTENT)

class AffirmationAPIView(APIView):
    """CRUD operations for Affirmation model."""
    permission_classes = [permissions.IsAuthenticated]

    # GET (Modified to show all affirmations for activity configuration)
    def get(self, request, pk=None):
        user = request.user
        # Allow encadrants to see all affirmations for activity configuration
        if user.role != 'encadrant':
             return Response({"error": "Permission refusée. Seuls les encadrants peuvent accéder directement aux affirmations de cette manière."}, status=status.HTTP_403_FORBIDDEN)

        if pk is None: 
            # List view: Show ALL affirmations, not just the encadrant's own
            # This allows encadrants to select from any available affirmation for their activities
            affirmations = Affirmation.objects.all().order_by('id')
            serializer = AffirmationSerializer(affirmations, many=True, context={'request': request})
            return Response(serializer.data)
        else: 
            # Retrieve view: Allow access to any affirmation by ID for viewing
            try:
                affirmation = Affirmation.objects.get(pk=pk)
            except Affirmation.DoesNotExist:
                return Response({"error": "Affirmation introuvable."}, status=status.HTTP_404_NOT_FOUND)
            
            serializer = AffirmationSerializer(affirmation, context={'request': request})
            return Response(serializer.data)

        # POST method (Modified to link to encadrant and optionally to activity)
    def post(self, request):
        if request.user.role != 'encadrant':
            return Response({"error": "Seuls les encadrants peuvent créer des affirmations."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AffirmationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Save the affirmation, linking it to the current encadrant
            # The Affirmation model needs an 'encadrant' field (ForeignKey to Users)
            # Ensure your AffirmationSerializer can handle 'encadrant' (e.g., read_only=True or handled in .save())
            try:
                affirmation = serializer.save(encadrant=request.user)
                message = "Affirmation créée avec succès et liée à l'encadrant."
                response_status = status.HTTP_201_CREATED
                additional_data = {}

                activity_code = request.data.get('activity_code')
                if activity_code:
                    try:
                        # Ensure the encadrant owns the activity they are linking to
                        activite = Activite.objects.get(pk=activity_code.upper(), encadrant=request.user)
                        activite.affirmations_associes.add(affirmation)
                        message += f" Et liée à l'activité {activite.code_activite}."
                        print(f"Affirmation {affirmation.id} created by {request.user.username} and linked to activity {activite.code_activite}.")
                    except Activite.DoesNotExist:
                        message += f" ATTENTION: L'activité '{activity_code}' est introuvable ou vous n'en êtes pas propriétaire. L'affirmation n'a pas été liée à cette activité."
                        additional_data["warning_activity_linking"] = f"L'activité '{activity_code}' est introuvable ou non autorisée pour la liaison."
                        print(f"Warning: Affirmation {affirmation.id} by {request.user.username} created, but linking to non-existent/unauthorized activity '{activity_code}' failed.")
                else:
                    print(f"Affirmation {affirmation.id} created by {request.user} without direct activity linking.")

                response_data = serializer.data
                response_data['message'] = message
                if additional_data:
                    response_data.update(additional_data)
                
                return Response(response_data, status=response_status)

            except Exception as e:
                # Handle cases where 'encadrant' might not be directly writable in serializer.save()
                # or other model saving errors.
                print(f"Error saving affirmation for encadrant {request.user.username}: {e}")
                return Response({"error": f"Erreur lors de la sauvegarde de l'affirmation: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # PUT (From File 1 - includes permission check)
    def put(self, request, pk):
        if request.user.role != 'encadrant':
             return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        affirmation = get_object_or_404(Affirmation, pk=pk)
        # Permission check: Encadrant must own at least one activity this affirmation is linked to
        if not affirmation.activites.filter(encadrant=request.user).exists():
            return Response({"error": "Vous n'avez pas la permission de modifier cette affirmation."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AffirmationSerializer(affirmation, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE (From File 1 - includes permission check)
    def delete(self, request, pk):
        if request.user.role != 'encadrant':
             return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        affirmation = get_object_or_404(Affirmation, pk=pk)
        # Permission check
        if not affirmation.activites.filter(encadrant=request.user).exists():
             return Response({"error": "Vous n'avez pas la permission de supprimer cette affirmation."}, status=status.HTTP_403_FORBIDDEN)

        # Consider implications: If deleted, it's removed from ALL activities it was linked to.
        # An alternative might be to *unlink* it only from the user's activities if it's used elsewhere.
        # Simple delete for now:
        affirmation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ReponseAPIView(APIView):
    """CRUD operations for Reponse model. POST handles create/update (upsert)."""
    permission_classes = [permissions.IsAuthenticated]

    # GET method (Merged - includes affirmation_id filter from File 2 concept)
    def get(self, request, pk=None):
        user = request.user

        if user.role == 'etudiant':
            if pk is None: # List responses for the student
                # Base query for the logged-in student
                reponses_qs = Reponse.objects.filter(etudiant=user)

                # Optional filtering by query parameters
                activity_code = request.query_params.get('activity_code')
                affirmation_id = request.query_params.get('affirmation_id') # For checking specific response existence

                if activity_code:
                    reponses_qs = reponses_qs.filter(activite__code_activite=activity_code.upper())
                if affirmation_id:
                    # Validate affirmation_id is an integer
                    try:
                         affirmation_id_int = int(affirmation_id)
                         reponses_qs = reponses_qs.filter(affirmation__id=affirmation_id_int)
                    except (ValueError, TypeError):
                         return Response({"error": "Le paramètre 'affirmation_id' doit être un entier."}, status=status.HTTP_400_BAD_REQUEST)

                serializer = ReponseSerializerGET(reponses_qs, many=True, context={'request': request})
                return Response(serializer.data)
            else: # Retrieve specific response by ID, ensuring ownership
                reponse = get_object_or_404(Reponse, pk=pk, etudiant=user)
                serializer = ReponseSerializerGET(reponse, context={'request': request})
                return Response(serializer.data)

        elif user.role == 'encadrant':
            # Encadrants view responses for activities they own
            activity_code = request.query_params.get('activity_code')
            if not activity_code:
                  return Response({"error": "Le paramètre 'activity_code' est requis pour les encadrants pour lister les réponses."}, status=status.HTTP_400_BAD_REQUEST)

            # Ensure the encadrant owns the activity
            activity = get_object_or_404(Activite, pk=activity_code.upper(), encadrant=user)

            if pk is None: # List all responses for the specified activity
                 reponses_qs = Reponse.objects.filter(activite=activity)
                 serializer = ReponseSerializerGET(reponses_qs, many=True, context={'request': request})
                 return Response(serializer.data)
            else: # Retrieve a specific response within that activity
                 reponse = get_object_or_404(Reponse, pk=pk, activite=activity) # Filter by activity ensures encadrant has access
                 serializer = ReponseSerializerGET(reponse, context={'request': request})
                 return Response(serializer.data)
        else:
             return Response({"error": "Permission refusée pour ce rôle."}, status=status.HTTP_403_FORBIDDEN)

    # POST method (From File 1's second definition - uses update_or_create)
    def post(self, request):
        # Only students can submit/update responses via this method
        if not request.user.role == 'etudiant':
            return Response({"error": "Seuls les étudiants peuvent soumettre ou modifier des réponses."}, status=status.HTTP_403_FORBIDDEN)

        # Pass request context to serializer (may need user or other info)
        # The serializer should validate incoming data (e.g., activity_id, affirmation_id)
        serializer = ReponseSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            # Extract validated data
            activite = serializer.validated_data['activite']
            affirmation = serializer.validated_data['affirmation']
            etudiant = request.user # The logged-in student

            # --- Perform necessary checks before saving ---
            # 1. Check if student is authorized for the activity
            if not activite.etudiants_autorises.filter(pk=etudiant.pk).exists():
                 return Response({"error": "Vous n'êtes pas autorisé pour cette activité."}, status=status.HTTP_403_FORBIDDEN)

            # 2. Check if the affirmation belongs to the activity
            if not activite.affirmations_associes.filter(pk=affirmation.pk).exists():
                 return Response({"error": "Cette affirmation n'appartient pas à l'activité spécifiée."}, status=status.HTTP_400_BAD_REQUEST)

            # 3. Prepare data for update_or_create
            #    'defaults' contains fields to be set on create or updated on match
            defaults = {
                'reponse_vf': serializer.validated_data.get('reponse_vf'), # Assumes serializer validates based on affirmation type
                'reponse_choisie_qcm': serializer.validated_data.get('reponse_choisie_qcm'),
                'justification': serializer.validated_data.get('justification', '') # Allow empty justification
            }
            # Ensure only one response type is set based on affirmation type (handled by serializer validation ideally)

            try:
                # Atomically find or create the response based on the unique combination
                reponse, created = Reponse.objects.update_or_create(
                    activite=activite,
                    affirmation=affirmation,
                    etudiant=etudiant,
                    defaults=defaults # Fields to update or set
                )

                # Return the serialized data of the created/updated object
                # Use the same serializer (ReponseSerializer) to show the saved state
                response_serializer = ReponseSerializer(reponse, context={'request': request})
                status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK # 201 if new, 200 if updated
                print(f"Reponse {'created' if created else 'updated'} with ID {reponse.id} for user {etudiant.id}, activity {activite.pk}, affirmation {affirmation.pk}. Status: {status_code}") # Server log
                return Response(response_serializer.data, status=status_code)

            except Exception as e:
                 # Catch potential DB errors or other unexpected issues
                 import traceback
                 print(f"Error during Reponse update_or_create: {traceback.format_exc()}")
                 return Response({"error": "Une erreur interne est survenue lors de l'enregistrement de la réponse."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # If serializer validation failed
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # PUT method (Kept for explicit update by ID, though POST handles upsert)
    def put(self, request, pk):
        # Only students can modify their own responses via specific ID
        if not request.user.role == 'etudiant':
            return Response({"error": "Seuls les étudiants peuvent modifier des réponses."}, status=status.HTTP_403_FORBIDDEN)

        reponse = get_object_or_404(Reponse, pk=pk, etudiant=request.user) # Ensures student owns the response

        # Prevent changing foreign keys (activite, affirmation, etudiant) via PUT
        mutable_data = request.data.copy()
        mutable_data.pop('activite', None)
        mutable_data.pop('activite_id', None)
        mutable_data.pop('affirmation', None)
        mutable_data.pop('affirmation_id', None)
        mutable_data.pop('etudiant', None)
        mutable_data.pop('etudiant_id', None)
        mutable_data.pop('id', None) # Don't allow changing the primary key itself

        # Use the same serializer for validation and saving
        serializer = ReponseSerializer(reponse, data=mutable_data, partial=True, context={'request': request})
        if serializer.is_valid():
            # Validation should check consistency (e.g., reponse_vf vs reponse_choisie_qcm)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK) # OK for successful update
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE method (Keep disabled for responses)
    def delete(self, request, pk):
         # Students generally shouldn't delete their answers once submitted
         # Encadrants might delete via admin interface if necessary
        return Response({"error": "La suppression des réponses n'est pas autorisée via l'API."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class DebriefAPIView(APIView):
    """CRUD operations for Debrief model."""
    permission_classes = [permissions.IsAuthenticated]

    # GET (From File 1)
    def get(self, request, pk=None):
        if not request.user.role == 'encadrant':
             return Response({"error": "Seuls les encadrants peuvent voir les débriefs."}, status=status.HTTP_403_FORBIDDEN)

        if pk is None: # List debriefs created by this encadrant
            debriefs = Debrief.objects.filter(encadrant=request.user)
            serializer = DebriefSerializer(debriefs, many=True, context={'request': request})
            return Response(serializer.data)
        else: # Retrieve a specific debrief owned by the encadrant
            debrief = get_object_or_404(Debrief, pk=pk, encadrant=request.user)
            serializer = DebriefSerializer(debrief, context={'request': request})
            return Response(serializer.data)

    # POST (From File 1 - includes permission and conflict check)
    
    def post(self, request):
        if not request.user.role == 'encadrant':
            return Response({"error": "Seuls les encadrants peuvent créer des débriefs."}, status=status.HTTP_403_FORBIDDEN)

        reponse_id = request.data.get('reponse_id') # Expecting reponse_id to link the debrief
        if not reponse_id:
            return Response({"error": "L'ID de la réponse (reponse_id) est requis pour créer un débrief."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reponse = Reponse.objects.get(pk=reponse_id)
        except Reponse.DoesNotExist:
            return Response({"error": f"Aucune réponse trouvée avec l'ID {reponse_id}."}, status=status.HTTP_404_NOT_FOUND)

        # Verify the encadrant owns the activity associated with the response
        if reponse.activite.encadrant != request.user:
            return Response({"error": "Vous n'êtes pas autorisé à créer un débrief pour cette réponse car elle n'appartient pas à l'une de vos activités."}, status=status.HTTP_403_FORBIDDEN)

        # Check for existing debrief for this response (optional, depends on desired logic)
        if Debrief.objects.filter(reponse=reponse).exists():
            return Response(
                {"error": f"Un débrief existe déjà pour la réponse ID {reponse_id}."},
                status=status.HTTP_409_CONFLICT # Conflict
            )

        serializer = DebriefSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Save the debrief, associating the current encadrant and the specific response
            # The Debrief model should have 'encadrant' and 'reponse' fields
            try:
                debrief = serializer.save(encadrant=request.user, reponse=reponse)
                print(f"Debrief {debrief.id} created by {request.user.username} for response {reponse.id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                print(f"Error saving debrief for encadrant {request.user.username}, response {reponse.id}: {e}")
                return Response({"error": f"Erreur lors de la sauvegarde du débrief: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    # PUT (From File 1)
    def put(self, request, pk):
        if not request.user.role == 'encadrant':
             return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        debrief = get_object_or_404(Debrief, pk=pk, encadrant=request.user) # Ensure ownership

        # Prevent changing the linked response or encadrant via PUT
        mutable_data = request.data.copy()
        mutable_data.pop('reponse', None)
        mutable_data.pop('reponse_id', None)
        mutable_data.pop('encadrant', None)
        mutable_data.pop('encadrant_id', None)

        serializer = DebriefSerializer(debrief, data=mutable_data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE (From File 1)
    def delete(self, request, pk):
        if not request.user.role == 'encadrant':
             return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        debrief = get_object_or_404(Debrief, pk=pk, encadrant=request.user) # Ensure ownership
        debrief.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Debugging/Testing Views ---

class AuthTestView(APIView):
    """
    !!! TEMPORARY DEBUGGING VIEW - REMOVE BEFORE PRODUCTION !!!
    Tests authentication methods for a given email/password.
    Exposes potentially sensitive details about authentication checks.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        logger = logging.getLogger('api.views.AuthTest') # Specific logger
        logger.warning("AuthTestView accessed. REMOVE THIS VIEW BEFORE PRODUCTION.")

        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email et mot de passe sont requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.debug(f"AuthTest attempt for email: {email}")

        results = {
            'email_provided': email,
            'user_exists': False,
            'user_role': None,
            'user_username': None,
            'is_encadrant_role': False,
            'django_authenticate_success': False,
            'check_password_success': False,
            'can_login_as_encadrant': False,
            'error_details': None
        }

        try:
            user = Users.objects.get(email=email)
            results['user_exists'] = True
            results['user_role'] = user.role
            results['user_username'] = user.username
            results['is_encadrant_role'] = user.role == 'encadrant'

            # Test 1: Django's authenticate() using username
            # Requires username in DB and working AUTHENTICATION_BACKENDS
            auth_user = authenticate(request, username=user.username, password=password)
            results['django_authenticate_success'] = auth_user is not None
            logger.debug(f"authenticate(username='{user.username}') result: {'Success' if results['django_authenticate_success'] else 'Fail'}")

            # Test 2: Direct password check using check_password()
            # This bypasses backend checks but confirms password match
            results['check_password_success'] = user.check_password(password)
            logger.debug(f"user.check_password() result: {'Success' if results['check_password_success'] else 'Fail'}")

            # Final check for encadrant login possibility
            results['can_login_as_encadrant'] = results['is_encadrant_role'] and (results['django_authenticate_success'] or results['check_password_success'])

        except Users.DoesNotExist:
            results['error_details'] = f"Aucun utilisateur trouvé avec l'email {email}"
            logger.debug(results['error_details'])
        except Exception as e:
            results['error_details'] = f"An unexpected error occurred: {str(e)}"
            logger.error(f"Unexpected error during AuthTest: {e}", exc_info=True)


        logger.debug(f"AuthTest results for {email}: {results}")
        # Return the detailed results (FOR DEBUGGING ONLY)
        return Response(results, status=status.HTTP_200_OK)

class EmailToIdResolverView(APIView):
    """Resolve student emails to their user IDs."""
    permission_classes = [IsAuthenticated]  # Only authenticated encadrants should access this

    def post(self, request):
        emails = request.data.get('emails', [])
        
        if not isinstance(emails, list):
            return Response(
                {'error': 'emails must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not emails:
            return Response({'ids': []}, status=status.HTTP_200_OK)
        
        # Clean up emails (trim whitespace, lowercase)
        cleaned_emails = [email.strip().lower() for email in emails if email.strip()]
        
        try:
            # Find students with these emails
            students = Users.objects.filter(
                email__in=cleaned_emails, 
                role='etudiant'
            ).values('id', 'email')
            
            # Create mapping from email to ID
            found_ids = [student['id'] for student in students]
            found_emails = [student['email'].lower() for student in students]
            
            # Log missing emails for debugging
            missing_emails = set(cleaned_emails) - set(found_emails)
            if missing_emails:
                print(f"Warning: Could not find student accounts for emails: {missing_emails}")
            
            return Response({
                'ids': found_ids,
                'found_count': len(found_ids),
                'requested_count': len(cleaned_emails),
                'missing_emails': list(missing_emails)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error resolving emails: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CategorieAPIView(APIView):
    """API simple pour lister et créer les catégories."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retourne toutes les catégories."""
        if request.user.role != 'encadrant':
            return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        
        categories = Categorie.objects.all().order_by('nom')
        from .serializers import CategorieSerializer
        serializer = CategorieSerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Crée une nouvelle catégorie."""
        if request.user.role != 'encadrant':
            return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        
        from .serializers import CategorieSerializer
        serializer = CategorieSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)