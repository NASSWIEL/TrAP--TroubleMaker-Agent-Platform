# serializers.py
from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import get_user_model

from .models import Activite, Affirmation, Reponse, Debrief, Categorie

Users = get_user_model()

class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = ['id', 'role']

# New Serializer for listing students
class EtudiantListSerializer(serializers.ModelSerializer):
    """Serializer simple pour lister les étudiants (id, email, nom)."""
    nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = Users
        fields = ['id', 'email', 'nom_complet'] # Only expose necessary fields

    def get_nom_complet(self, obj):
        # Combine first and last name, fallback to username or email
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        elif obj.last_name:
            return obj.last_name
        elif obj.username:
            return obj.username
        return obj.email # Fallback to email if no name/username


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ['id', 'nom']

class AffirmationSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Affirmation mis à jour (Approach 1)."""
    activites_codes = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Affirmation
        fields = [
            'id',
            'affirmation',
            'explication',
            'nbr_reponses',       # Required (2 or 4)
            'is_correct_vf',      # Required if nbr_reponses=2
            'reponse_correcte_qcm', # Required if nbr_reponses=4
            'created_at',
            'activites_codes', # Display linked activity codes (optional)
        ]

    def get_activites_codes(self, obj):
        return [activite.code_activite for activite in obj.activites.all()]

    def validate(self, data):
        nbr_reponses = data.get('nbr_reponses', getattr(self.instance, 'nbr_reponses', None))
        is_correct_vf = data.get('is_correct_vf', getattr(self.instance, 'is_correct_vf', None))
        reponse_correcte_qcm = data.get('reponse_correcte_qcm', getattr(self.instance, 'reponse_correcte_qcm', None))

        # Validation simplifiée : is_correct_vf est maintenant permis pour tous les types
        # car toutes les affirmations ont intrinsèquement une valeur de vérité
        if nbr_reponses == 2:
            if is_correct_vf is None:
                raise serializers.ValidationError({
                    'is_correct_vf': "Ce champ est requis lorsque nbr_reponses est 2 (Vrai/Faux)."
                })
            if reponse_correcte_qcm is not None:
                 raise serializers.ValidationError({
                    'reponse_correcte_qcm': "Ce champ ne doit pas être défini lorsque nbr_reponses est 2."
                })
        elif nbr_reponses == 4:
            # Pour les réponses graduées, is_correct_vf est maintenant permis
            if is_correct_vf is None:
                raise serializers.ValidationError({
                    'is_correct_vf': "Ce champ est requis même pour les réponses graduées."
                })
            if reponse_correcte_qcm is None:
                raise serializers.ValidationError({
                    'reponse_correcte_qcm': "Ce champ est requis lorsque nbr_reponses est 4 (4 Choix)."
                })
        elif nbr_reponses is None:
             raise serializers.ValidationError({"nbr_reponses": "Le format (nbr_reponses: 2 ou 4) est requis."}) 
        else:
             raise serializers.ValidationError({"nbr_reponses": f"Format invalide ({nbr_reponses}). Doit être 2 ou 4."})

        return data

class ActiviteSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Activite.
       Handles reading nested data and writing via IDs.
    """
    destine_a = CategorieSerializer(read_only=True)
    # Use EtudiantListSerializer for a simpler representation in Activite detail
    etudiants_autorises = EtudiantListSerializer(many=True, read_only=True) 
    affirmations_associes = AffirmationSerializer(many=True, read_only=True)
    encadrant = UsersSerializer(read_only=True)

    destine_a_id = serializers.PrimaryKeyRelatedField(
        queryset=Categorie.objects.all(), source='destine_a', write_only=True, required=False, allow_null=True
    )
    # Still use PrimaryKeyRelatedField for writing, but ensure the queryset is filtered
    etudiants_autorises_ids = serializers.PrimaryKeyRelatedField(
        queryset=Users.objects.filter(role='etudiant'), source='etudiants_autorises', many=True, write_only=True, required=False
    )
    # New field to accept comma-separated email list
    etudiants_emails = serializers.CharField(write_only=True, required=False, allow_blank=True,
                                           help_text="Liste d'emails séparés par des virgules")
    
    affirmations_associes_ids = serializers.PrimaryKeyRelatedField(
        queryset=Affirmation.objects.all(), source='affirmations_associes', many=True, write_only=True, required=False
    )

    nbr_affirmations_associe = serializers.IntegerField(read_only=True)
    type_affirmation_requise_display = serializers.CharField(source='get_type_affirmation_requise_display', read_only=True)

    class Meta:
        model = Activite
        fields = [
            'code_activite', 'titre', 'presentation_publique', 'description',
            'created_at', 'encadrant',
            'destine_a', 'destine_a_id',
            'etudiants_autorises', # Readable uses EtudiantListSerializer now
            'etudiants_autorises_ids', # Writable uses PKs
            'etudiants_emails', # NEW: Accept email list
            'type_affirmation_requise',
            'type_affirmation_requise_display',
            'type_apprenant', # NEW: Type d'apprenant field
            'affirmations_associes',
            'affirmations_associes_ids',
            'nbr_affirmations_associe',
            'is_published' # Added is_published
        ]
        read_only_fields = ['encadrant', 'created_at', 'nbr_affirmations_associe', 'type_affirmation_requise_display']
        extra_kwargs = {
            'code_activite': {'validators': []}
        }

    def _process_student_emails(self, emails_string):
        """
        Process comma-separated email string and return list of User objects.
        Creates student users for emails that don't exist.
        """
        if not emails_string or not emails_string.strip():
            return []
        
        # Parse emails from comma-separated string
        email_list = [email.strip().lower() for email in emails_string.split(',') if email.strip()]
        student_users = []
        
        for email in email_list:
            # Validate email format
            if '@' not in email:
                continue
            
            # Try to get existing student user
            try:
                user = Users.objects.get(email=email, role='etudiant')
                student_users.append(user)
            except Users.DoesNotExist:
                # Create new student user
                try:
                    # Generate username from email (before @)
                    username_base = email.split('@')[0]
                    username = username_base
                    counter = 1
                    
                    # Ensure unique username
                    while Users.objects.filter(username=username).exists():
                        username = f"{username_base}{counter}"
                        counter += 1
                    
                    user = Users.objects.create_user(
                        username=username,
                        email=email,
                        role='etudiant',
                        first_name='',
                        last_name=''
                    )
                    student_users.append(user)
                    print(f"Created new student user: {email} (username: {username})")
                except Exception as e:
                    print(f"Error creating student user for {email}: {e}")
                    continue
        
        return student_users

    def create(self, validated_data):
        # Handle both email list and ID list
        etudiants_data = validated_data.pop('etudiants_autorises', [])
        emails_string = validated_data.pop('etudiants_emails', '')
        affirmations_data = validated_data.pop('affirmations_associes', [])
        validated_data['code_activite'] = validated_data.get('code_activite', '').upper()

        activite = Activite.objects.create(**validated_data)

        # Combine students from IDs and emails
        all_students = list(etudiants_data)  # From IDs
        email_students = self._process_student_emails(emails_string)  # From emails
        all_students.extend(email_students)
        
        # Remove duplicates
        unique_students = list({student.id: student for student in all_students}.values())

        if unique_students:
            activite.etudiants_autorises.set(unique_students)
        if affirmations_data:
            activite.affirmations_associes.set(affirmations_data)

        return activite

    def update(self, instance, validated_data):
        etudiants_data = validated_data.pop('etudiants_autorises', None)
        emails_string = validated_data.pop('etudiants_emails', None)
        affirmations_data = validated_data.pop('affirmations_associes', None)
        validated_data.pop('code_activite', None) # Prevent code_activite from being updated here

        instance.titre = validated_data.get('titre', instance.titre)
        instance.presentation_publique = validated_data.get('presentation_publique', instance.presentation_publique)
        instance.description = validated_data.get('description', instance.description)
        instance.destine_a = validated_data.get('destine_a', instance.destine_a)
        instance.type_affirmation_requise = validated_data.get('type_affirmation_requise', instance.type_affirmation_requise)
        instance.type_apprenant = validated_data.get('type_apprenant', instance.type_apprenant)  # NEW: Update type_apprenant
        instance.is_published = validated_data.get('is_published', instance.is_published) # Added is_published

        instance.save()

        if etudiants_data is not None:
            instance.etudiants_autorises.set(etudiants_data)
        if affirmations_data is not None:
            instance.affirmations_associes.set(affirmations_data)

        return instance

# --- Reponse Serializers --- 
class ReponseSerializer(serializers.ModelSerializer):
    activite = serializers.PrimaryKeyRelatedField(queryset=Activite.objects.all(), pk_field=serializers.CharField())
    affirmation = serializers.PrimaryKeyRelatedField(queryset=Affirmation.objects.all())
    etudiant = UsersSerializer(read_only=True)
    reponse_vf = serializers.BooleanField(required=False, allow_null=True)
    reponse_choisie_qcm = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Reponse
        fields = [
            'id', 'activite', 'affirmation', 'etudiant',
            'reponse_vf', 'reponse_choisie_qcm',
            'justification', 'timestamp'
        ]
        read_only_fields = ['id', 'etudiant', 'timestamp']

    def validate(self, data):
        affirmation = data.get('affirmation', getattr(self.instance, 'affirmation', None))
        if not affirmation: raise serializers.ValidationError({"affirmation": "Affirmation est requise."})

        reponse_vf = data.get('reponse_vf', getattr(self.instance, 'reponse_vf', None) if self.instance else None)
        reponse_qcm = data.get('reponse_choisie_qcm', getattr(self.instance, 'reponse_choisie_qcm', None) if self.instance else None)

        if affirmation.nbr_reponses == 2:
            if reponse_qcm is not None: raise serializers.ValidationError({"reponse_choisie_qcm": "Réponse QCM non permise pour affirmation V/F."}) 
        elif affirmation.nbr_reponses == 4:
            if reponse_vf is not None: raise serializers.ValidationError({"reponse_vf": "Réponse V/F non permise pour affirmation QCM."}) 
        elif affirmation.nbr_reponses is None:
             raise serializers.ValidationError({"affirmation": f"L'affirmation ID {affirmation.id} n'a pas de format défini."}) 
        else: raise serializers.ValidationError({"affirmation": f"Type d'affirmation invalide ({affirmation.nbr_reponses})."}) 

        if reponse_vf is not None and reponse_qcm is not None:
             raise serializers.ValidationError("Réponse V/F et QCM fournies simultanément.") 
             
        # Allow "Je ne sais pas" responses (both values null) with optional justification
        # No additional validation needed - null values are acceptable
        return data

class ReponseSerializerGET(serializers.ModelSerializer):
    etudiant = UsersSerializer(read_only=True)
    activite = ActiviteSerializer(read_only=True)
    affirmation = AffirmationSerializer(read_only=True)
    class Meta:
        model = Reponse
        fields = [
            'id', 'activite', 'affirmation', 'etudiant',
            'reponse_vf', 'reponse_choisie_qcm',
            'justification', 'timestamp'
        ]
        read_only_fields = fields

# --- Debrief Serializer --- 
class DebriefSerializer(serializers.ModelSerializer):
    encadrant = UsersSerializer(read_only=True)
    reponse = ReponseSerializerGET(read_only=True)
    reponse_id = serializers.PrimaryKeyRelatedField(queryset=Reponse.objects.all(), source='reponse', write_only=True)
    class Meta:
        model = Debrief
        fields = ['id', 'feedback', 'reponse', 'reponse_id', 'encadrant']
        read_only_fields = ['id', 'encadrant']

    def validate_reponse_id(self, reponse_instance):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if reponse_instance.activite.encadrant != request.user:
                raise serializers.ValidationError("Vous ne pouvez débriefer que les réponses associées à vos activités.")
        return reponse_instance
