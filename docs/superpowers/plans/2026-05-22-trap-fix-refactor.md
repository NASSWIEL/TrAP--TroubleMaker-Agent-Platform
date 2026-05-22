# TrAP Fix & Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger tous les bugs runtime, aligner frontend↔backend, renforcer la sécurité, restructurer le projet, et supprimer le code mort — sans changer la logique métier ni l'interface visuelle.

**Architecture:** Django REST API (backend) + Next.js 15 App Router (frontend). Corrections séquentielles SP1→SP5. Chaque tâche se termine par un commit stable.

**Tech Stack:** Python 3.10 · Django 5 · DRF · google-generativeai · Next.js 15 · TypeScript · Tailwind · Radix UI · axios

---

## Fichiers touchés par sous-projet

### SP1 — Cassures Runtime
- Modify: `mysite/requirements.txt`
- Modify: `mysite/apiBack/apiBack/settings.py`
- Modify: `mysite/apiBack/api/views.py`
- Modify: `mysite/apiBack/api/admin.py`

### SP2 — Alignement Frontend↔Backend
- Create: `TroubleMaker/troublemaker-frontend/src/lib/api.ts`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/encadrant/login/page.tsx`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/etudiant/login/page.tsx`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/etudiant/activite/page.tsx`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/etudiant/activite/participer/page.tsx`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/etudiant/activite/participer/confirmer/page.tsx`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/encadrant/debrief/page.tsx`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/encadrant/liste_activite/page.tsx`
- Modify: `mysite/apiBack/api/serializers.py`
- Modify: `mysite/apiBack/apiBack/settings.py`

### SP3 — Sécurité
- Modify: `mysite/apiBack/apiBack/settings.py`
- Modify: `mysite/apiBack/api/views.py`

### SP4 — Restructuration (git mv + suppressions + update références)
- Move: `mysite/apiBack/` → `backend/`
- Rename: `backend/apiBack/` → `backend/config/`
- Move: `TroubleMaker/troublemaker-frontend/` → `frontend/`
- Delete: `Pipfile`, `Pipfile.lock`, `req.txt`, `create_test_data.py`, `excalidraw.log`
- Delete: `mysite/Pipfile`, `mysite/old/`
- Delete: `TroubleMaker/package.json`, `TroubleMaker/package-lock.json`
- Modify: `backend/manage.py`, `backend/config/wsgi.py`, `backend/config/asgi.py`, `backend/config/settings.py`
- Modify: `CLAUDE.md`, `.gitignore`

### SP5 — Code mort et auth guard
- Delete: `frontend/src/app/activite/`, `frontend/src/app/encadrant/creer_affirmation/`
- Delete: `frontend/src/components/activityForm.tsx`, `frontend/src/components/studentSelector.tsx`
- Rewrite: `frontend/src/app/encadrant/liste_affirmations/page.tsx`
- Modify: `frontend/src/app/encadrant/layout.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/components/app-sidebar.tsx`
- Modify: `frontend/src/app/encadrant/generer/page.tsx`
- Modify: `frontend/src/app/etudiant/activite/participer/confirmer/page.tsx`
- Modify: `frontend/src/app/encadrant/debrief/page.tsx`
- Modify: `frontend/src/app/etudiant/activite/participer/page.tsx`

---

## SP1 — Cassures Runtime

---

### Task 1 : Ajouter python-dotenv aux dépendances

**Files:**
- Modify: `mysite/requirements.txt`

- [ ] **Ajouter `python-dotenv` à la fin de `mysite/requirements.txt`**

  Ouvrir `mysite/requirements.txt` et ajouter à la fin :
  ```
  python-dotenv==1.0.1
  ```

- [ ] **Vérifier l'installation**

  ```powershell
  cd mysite/apiBack
  python -m venv .venv
  .venv\Scripts\activate
  pip install -r ../requirements.txt
  ```
  Attendu : pas d'erreur `ModuleNotFoundError: No module named 'dotenv'`

- [ ] **Commit**

  ```powershell
  git add mysite/requirements.txt
  git commit -m "fix: add python-dotenv to requirements"
  ```

---

### Task 2 : Valider SECRET_KEY au démarrage

**Files:**
- Modify: `mysite/apiBack/apiBack/settings.py`

- [ ] **Modifier `settings.py` pour lever une erreur si SECRET_KEY est absent**

  Remplacer dans `mysite/apiBack/apiBack/settings.py` :
  ```python
  import  os
  from pathlib import Path
  from dotenv import load_dotenv
  ```
  par :
  ```python
  import os
  from pathlib import Path
  from dotenv import load_dotenv
  from django.core.exceptions import ImproperlyConfigured
  ```

  Et remplacer :
  ```python
  SECRET_KEY = os.getenv('SECRET_KEY')
  ```
  par :
  ```python
  SECRET_KEY = os.getenv('SECRET_KEY')
  if not SECRET_KEY:
      raise ImproperlyConfigured("SECRET_KEY must be set in the environment (.env file or env var)")
  ```

- [ ] **Vérifier que le serveur refuse de démarrer sans .env**

  Depuis `mysite/apiBack/`, si `.env` n'existe pas ou ne contient pas `SECRET_KEY` :
  ```powershell
  python manage.py check
  ```
  Attendu : `ImproperlyConfigured: SECRET_KEY must be set in the environment`

- [ ] **Commit**

  ```powershell
  git add mysite/apiBack/apiBack/settings.py
  git commit -m "fix: raise ImproperlyConfigured when SECRET_KEY is missing"
  ```

---

### Task 3 : Supprimer la clé Gemini hardcodée

**Files:**
- Modify: `mysite/apiBack/api/views.py`

- [ ] **Supprimer la clé API hardcodée dans `GeminiMakeHarderAPIView.post()`**

  Dans `mysite/apiBack/api/views.py`, trouver la ligne (environ ligne 408) :
  ```python
  genai.configure(api_key="AIzaSyABqiPmXV2L_poHHdr9bKA8Fm8ehN2hWms")
  ```
  La remplacer par :
  ```python
  genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
  ```

- [ ] **Révoquer la clé leakée** dans la Google Cloud Console (IAM → API Keys → supprimer/régénérer la clé `AIzaSyABqiPmXV2L_poHHdr9bKA8Fm8ehN2hWms`)

- [ ] **Commit**

  ```powershell
  git add mysite/apiBack/api/views.py
  git commit -m "fix: remove hardcoded Gemini API key, use env var"
  ```

---

### Task 4 : Corriger l'indentation de AffirmationAPIView.post()

**Files:**
- Modify: `mysite/apiBack/api/views.py`

- [ ] **Corriger l'indentation**

  Dans `views.py`, ouvrir le fichier et chercher le commentaire :
  ```
  # POST method (Modified to link to encadrant and optionally to activity)
  ```
  Il se trouve **à l'intérieur** du corps de `get()` (8 espaces). La `def post(self, request):` qui suit a aussi 8 espaces. C'est le bug.

  Sélectionner depuis `# POST method (Modified...` jusqu'à la fin de la méthode `post` (le `return Response(serializer.errors...)` final de `post`), et réduire l'indentation de **4 espaces** pour que `def post(self, request):` soit au même niveau que `def get(self, request, pk=None):`.

  Avant (incorrect) :
  ```python
  class AffirmationAPIView(APIView):
      def get(self, request, pk=None):
          ...
              # POST method (Modified to link to encadrant and optionally to activity)
          def post(self, request):          # ← 8 espaces (à l'intérieur de get)
              if request.user.role != 'encadrant':
  ```

  Après (correct) :
  ```python
  class AffirmationAPIView(APIView):
      def get(self, request, pk=None):
          ...

      def post(self, request):              # ← 4 espaces (méthode de classe)
          if request.user.role != 'encadrant':
  ```

- [ ] **Vérifier**

  ```powershell
  cd mysite/apiBack
  python manage.py check
  ```
  Attendu : `System check identified no issues (0 silenced).`

- [ ] **Commit**

  ```powershell
  git add mysite/apiBack/api/views.py
  git commit -m "fix: correct indentation of AffirmationAPIView.post()"
  ```

---

### Task 5 : Implémenter ChatbotAPIView

**Files:**
- Modify: `mysite/apiBack/api/views.py`

- [ ] **Implémenter `ChatbotAPIView.post()` et corriger `Generate.post()`**

  Remplacer dans `views.py` :
  ```python
  class ChatbotAPIView(APIView):
      pass
  ```
  par :
  ```python
  class ChatbotAPIView(APIView):
      permission_classes = [permissions.IsAuthenticated]

      def post(self, request):
          question = request.data.get('question')
          if not question:
              return Response(
                  {"error": "'question' est requise."},
                  status=status.HTTP_400_BAD_REQUEST
              )

          if not API_KEY:
              return Response(
                  {"error": "Gemini API Key not configured."},
                  status=status.HTTP_500_INTERNAL_SERVER_ERROR
              )

          try:
              generation_config = {
                  "temperature": 0.9,
                  "top_p": 0.95,
                  "top_k": 40,
                  "max_output_tokens": 8192,
                  "response_mime_type": "text/plain",
              }
              model = genai.GenerativeModel(
                  model_name="gemini-1.5-flash",
                  generation_config=generation_config,
              )
              prompt = f"""
              Vous êtes un expert en connaissances médicales. Votre tâche consiste à produire des affirmations médicales fausses mais plausibles qui répondent directement à la question: "{question}".

              Chaque affirmation doit :
              1. Être complexe et difficile à juger comme fausse au premier abord.
              2. Paraître scientifiquement plausible et liée au sujet médical de la question.
              3. Être directement en lien avec la question.

              Réponds **uniquement** avec un objet JSON structuré comme ceci, sans texte avant ou après:
              {{
                "affirmations": [
                  {{
                    "affirmation": "texte de l'affirmation fausse",
                    "is_correct_vf": false,
                    "explication": "explication détaillée de pourquoi cette affirmation est fausse"
                  }},
                  {{
                    "affirmation": "texte de la deuxième affirmation fausse",
                    "is_correct_vf": false,
                    "explication": "explication détaillée"
                  }},
                  {{
                    "affirmation": "texte de la troisième affirmation fausse",
                    "is_correct_vf": false,
                    "explication": "explication détaillée"
                  }}
                ]
              }}
              """
              response = model.generate_content(prompt)
              affirmations_data = extract_json_from_gemini(response.text)

              if not affirmations_data or 'affirmations' not in affirmations_data:
                  return Response(
                      {"error": "Format de réponse incorrect depuis l'API Gemini."},
                      status=status.HTTP_500_INTERNAL_SERVER_ERROR
                  )

              for aff in affirmations_data['affirmations']:
                  aff['is_correct_vf'] = False

              return Response(affirmations_data, status=status.HTTP_200_OK)

          except Exception as e:
              return Response(
                  {"error": f"Erreur lors de la génération: {str(e)}"},
                  status=status.HTTP_500_INTERNAL_SERVER_ERROR
              )
  ```

- [ ] **Corriger `Generate.post()` pour passer `_data` correctement à l'inner request**

  Dans `Generate.post()`, remplacer la construction de `internal_drf_request` :
  ```python
  internal_drf_request = Request(request._request, parsers=request.parsers)
  internal_drf_request._full_data = internal_request_data
  internal_drf_request.user = request.user
  internal_drf_request.auth = request.auth
  ```
  par :
  ```python
  internal_drf_request = Request(request._request, parsers=request.parsers)
  internal_drf_request._data = internal_request_data
  internal_drf_request._full_data = internal_request_data
  internal_drf_request.user = request.user
  internal_drf_request.auth = request.auth
  ```

- [ ] **Vérifier**

  ```powershell
  python manage.py check
  ```
  Attendu : `System check identified no issues (0 silenced).`

- [ ] **Commit**

  ```powershell
  git add mysite/apiBack/api/views.py
  git commit -m "fix: implement ChatbotAPIView and fix Generate internal request"
  ```

---

### Task 6 : Corriger ActiviteLoginView — backend manquant dans login()

**Files:**
- Modify: `mysite/apiBack/api/views.py`

- [ ] **Ajouter le paramètre `backend` à l'appel `login()`**

  Dans `ActiviteLoginView.post()`, trouver :
  ```python
  login(request, user)
  ```
  Remplacer par :
  ```python
  login(request, user, backend='django.contrib.auth.backends.ModelBackend')
  ```

- [ ] **Commit**

  ```powershell
  git add mysite/apiBack/api/views.py
  git commit -m "fix: pass backend param to login() in ActiviteLoginView"
  ```

---

### Task 7 : Corriger admin.py — supprimer les champs supprimés

**Files:**
- Modify: `mysite/apiBack/api/admin.py`

- [ ] **Retirer option_1..4 du fieldsets de AffirmationAdmin**

  Dans `admin.py`, trouver :
  ```python
  ('Détails QCM (si nbr_reponses=4)', {
      'classes': ('collapse',),
      'fields': ('option_1', 'option_2', 'option_3', 'option_4', 'reponse_correcte_qcm'),
  }),
  ```
  Remplacer par :
  ```python
  ('Détails QCM (si nbr_reponses=4)', {
      'classes': ('collapse',),
      'fields': ('reponse_correcte_qcm',),
  }),
  ```

- [ ] **Vérifier**

  ```powershell
  python manage.py check
  ```
  Attendu : `System check identified no issues (0 silenced).`

- [ ] **Commit**

  ```powershell
  git add mysite/apiBack/api/admin.py
  git commit -m "fix: remove deleted option_1..4 fields from AffirmationAdmin fieldsets"
  ```

---

## SP2 — Alignement Frontend↔Backend

---

### Task 8 : Centraliser l'URL de base API dans api.ts

**Files:**
- Create: `TroubleMaker/troublemaker-frontend/src/lib/api.ts`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/encadrant/login/page.tsx`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/etudiant/login/page.tsx`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/etudiant/activite/page.tsx`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/etudiant/activite/participer/page.tsx`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/etudiant/activite/participer/confirmer/page.tsx`
- Modify: `TroubleMaker/troublemaker-frontend/src/app/encadrant/creer_affirmation/page.tsx`

- [ ] **Créer `src/lib/api.ts`**

  ```typescript
  import axios from "axios";

  export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
  });
  ```

- [ ] **Dans chaque fichier qui déclare `const API_BASE_URL = "http://localhost:8000"` (ou variante), remplacer la déclaration locale par un import**

  Supprimer la ligne locale :
  ```typescript
  const API_BASE_URL = "http://localhost:8000";
  // ou
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  ```
  Et ajouter en haut du fichier :
  ```typescript
  import { API_BASE_URL } from "@/lib/api";
  ```

  Fichiers concernés (vérifier chacun avant modification — certains ont déjà `process.env`) :
  - `src/app/encadrant/login/page.tsx` — remplacer `const API_BASE_URL = ...`
  - `src/app/etudiant/login/page.tsx` — remplacer `const API_BASE_URL = ...`
  - `src/app/etudiant/activite/page.tsx` — remplacer `const API_BASE_URL = ...`
  - `src/app/etudiant/activite/participer/page.tsx` — remplacer `const API_BASE_URL = "http://localhost:8000"`
  - `src/app/etudiant/activite/participer/confirmer/page.tsx` — remplacer `const API_BASE_URL = ...`
  - `src/app/encadrant/creer_affirmation/page.tsx` — remplacer si présent

  **Note :** Ne pas modifier les fichiers qui utilisent déjà `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'` avec les deux parties — remplacer seulement les `"http://localhost:8000"` hardcodés purs.

- [ ] **Créer `.env.local` dans `TroubleMaker/troublemaker-frontend/` si inexistant**

  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```

- [ ] **Vérifier**

  ```powershell
  cd TroubleMaker/troublemaker-frontend
  npm run build
  ```
  Attendu : build réussi sans erreur TypeScript.

- [ ] **Commit**

  ```powershell
  git add TroubleMaker/troublemaker-frontend/src/lib/api.ts
  git add TroubleMaker/troublemaker-frontend/src/app/
  git add TroubleMaker/troublemaker-frontend/.env.local
  git commit -m "refactor: centralize API base URL in lib/api.ts"
  ```

---

### Task 9 : Corriger l'affichage des débriefs (debriefMap key)

**Files:**
- Modify: `TroubleMaker/troublemaker-frontend/src/app/encadrant/debrief/page.tsx`

- [ ] **Corriger l'interface `Debrief` pour refléter la structure réelle de l'API**

  L'API retourne `reponse` comme un objet imbriqué (pas un entier). Trouver :
  ```typescript
  interface Debrief {
    id: number;
    feedback: string;
    reponse: number; // Response ID
    encadrant: number;
  }
  ```
  Remplacer par :
  ```typescript
  interface Debrief {
    id: number;
    feedback: string;
    reponse: { id: number; [key: string]: unknown };
    encadrant: { id: number; [key: string]: unknown };
  }
  ```

- [ ] **Corriger la construction de `debriefMap`**

  Trouver :
  ```typescript
  debriefResponse.data.forEach(debrief => {
    debriefMap.set(debrief.reponse, debrief);
  });
  ```
  Remplacer par :
  ```typescript
  debriefResponse.data.forEach(debrief => {
    debriefMap.set(debrief.reponse.id, debrief);
  });
  ```

- [ ] **Vérifier**

  ```powershell
  npm run build
  ```
  Attendu : pas d'erreur TypeScript.

- [ ] **Commit**

  ```powershell
  git add TroubleMaker/troublemaker-frontend/src/app/encadrant/debrief/page.tsx
  git commit -m "fix: use debrief.reponse.id as debriefMap key (API returns nested object)"
  ```

---

### Task 10 : Aligner AffirmationSerializer.validate() sur le modèle

**Files:**
- Modify: `mysite/apiBack/api/serializers.py`

- [ ] **Rendre `is_correct_vf` et `reponse_correcte_qcm` optionnels dans `validate()`**

  Dans `serializers.py`, trouver la méthode `validate()` de `AffirmationSerializer` et remplacer son contenu par :
  ```python
  def validate(self, data):
      nbr_reponses = data.get('nbr_reponses', getattr(self.instance, 'nbr_reponses', None))

      if nbr_reponses is None:
          raise serializers.ValidationError(
              {"nbr_reponses": "Le format (nbr_reponses: 2 ou 4) est requis."}
          )
      if nbr_reponses not in [2, 4]:
          raise serializers.ValidationError(
              {"nbr_reponses": f"Format invalide ({nbr_reponses}). Doit être 2 ou 4."}
          )

      # is_correct_vf et reponse_correcte_qcm sont optionnels (affirmations neutres)
      return data
  ```

- [ ] **Vérifier**

  ```powershell
  cd mysite/apiBack
  python manage.py check
  ```

- [ ] **Commit**

  ```powershell
  git add mysite/apiBack/api/serializers.py
  git commit -m "fix: make is_correct_vf optional in AffirmationSerializer (neutral affirmations)"
  ```

---

### Task 11 : Corriger la configuration des cookies de session (cross-origin)

**Files:**
- Modify: `mysite/apiBack/apiBack/settings.py`

- [ ] **Ajouter la configuration SameSite pour les cookies**

  Dans `settings.py`, après la ligne `CORS_ALLOW_CREDENTIALS = True`, ajouter :
  ```python
  SESSION_COOKIE_SAMESITE = 'None'
  SESSION_COOKIE_SECURE = False  # True en production HTTPS
  ```

- [ ] **Décommenter et corriger `WSGI_APPLICATION`**

  Trouver :
  ```python
  # WSGI_APPLICATION = 'apiBack.wsgi.application'
  ```
  Remplacer par (laisser commenté pour l'instant — sera mis à jour en SP4 lors du renommage) :
  ```python
  WSGI_APPLICATION = 'apiBack.wsgi.application'
  ```

- [ ] **Commit**

  ```powershell
  git add mysite/apiBack/apiBack/settings.py
  git commit -m "fix: add SESSION_COOKIE_SAMESITE=None for cross-origin session cookies"
  ```

---

### Task 12 : Corriger la redirection logout dans liste_activite

**Files:**
- Modify: `TroubleMaker/troublemaker-frontend/src/app/encadrant/liste_activite/page.tsx`

- [ ] **Remplacer le href hardcodé par router.push**

  Dans `liste_activite/page.tsx`, trouver toutes les occurrences de :
  ```typescript
  window.location.href = 'http://localhost:3000';
  ```
  Remplacer par :
  ```typescript
  router.push('/');
  ```
  S'assurer que `router` est bien importé (il l'est déjà dans ce fichier via `useRouter`).

- [ ] **Commit**

  ```powershell
  git add TroubleMaker/troublemaker-frontend/src/app/encadrant/liste_activite/page.tsx
  git commit -m "fix: replace hardcoded localhost URL with router.push('/') in logout"
  ```

---

## SP3 — Sécurité

---

### Task 13 : Corriger ALLOWED_HOSTS et sécurité settings

**Files:**
- Modify: `mysite/apiBack/apiBack/settings.py`

- [ ] **Corriger ALLOWED_HOSTS pour éviter le string vide**

  Trouver :
  ```python
  ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')
  ```
  Remplacer par :
  ```python
  ALLOWED_HOSTS = [
      h for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h
  ]
  ```

- [ ] **Commit**

  ```powershell
  git add mysite/apiBack/apiBack/settings.py
  git commit -m "fix: prevent empty string in ALLOWED_HOSTS"
  ```

---

### Task 14 : Ajouter contrôles d'accès manquants sur deux vues

**Files:**
- Modify: `mysite/apiBack/api/views.py`

- [ ] **Ajouter un role check sur `EmailToIdResolverView`**

  Dans `EmailToIdResolverView.post()`, ajouter en tout début de méthode, avant tout traitement :
  ```python
  def post(self, request):
      if request.user.role != 'encadrant':
          return Response(
              {'error': 'Permission refusée.'},
              status=status.HTTP_403_FORBIDDEN
          )
      # ... reste du code inchangé
  ```

- [ ] **Ajouter `permission_classes` sur `GeminiMakeHarderAPIView`**

  La classe `GeminiMakeHarderAPIView` n'a pas de `permission_classes`. Ajouter comme premier attribut de classe :
  ```python
  class GeminiMakeHarderAPIView(APIView):
      permission_classes = [IsAuthenticated]
      
      def post(self, request):
          # Check if user is authenticated (garde le check manuel existant en dessous)
          ...
  ```

- [ ] **Vérifier**

  ```powershell
  python manage.py check
  ```

- [ ] **Commit**

  ```powershell
  git add mysite/apiBack/api/views.py
  git commit -m "fix: add role check on EmailToIdResolverView and permission_classes on GeminiMakeHarderAPIView"
  ```

---

## SP4 — Restructuration du Projet

---

### Task 15 : Restructurer les dossiers (git mv) et supprimer les fichiers redondants

**Files:**
- Move: `mysite/apiBack/` → `backend/`
- Rename: `backend/apiBack/` → `backend/config/`
- Move: `mysite/requirements.txt` → `backend/requirements.txt`
- Move: `TroubleMaker/troublemaker-frontend/` → `frontend/`
- Delete: multiples

- [ ] **Étape 1 — Déplacer le backend**

  ```powershell
  git mv mysite/apiBack backend
  ```

- [ ] **Étape 2 — Renommer le paquet de configuration Django (résout la collision de noms)**

  ```powershell
  git mv backend/apiBack backend/config
  ```

- [ ] **Étape 3 — Déplacer requirements.txt**

  ```powershell
  git mv mysite/requirements.txt backend/requirements.txt
  ```

- [ ] **Étape 4 — Supprimer les fichiers de dépendances redondants**

  ```powershell
  git rm Pipfile Pipfile.lock req.txt
  git rm mysite/Pipfile
  ```

- [ ] **Étape 5 — Supprimer les migrations orphelines**

  ```powershell
  git rm -r mysite/old
  ```

- [ ] **Étape 6 — Supprimer les fichiers parasites**

  ```powershell
  git rm create_test_data.py excalidraw.log
  ```
  Si ces fichiers ne sont pas trackés, simplement les supprimer :
  ```powershell
  Remove-Item create_test_data.py -ErrorAction SilentlyContinue
  Remove-Item excalidraw.log -ErrorAction SilentlyContinue
  ```

- [ ] **Étape 7 — Supprimer le répertoire mysite/ désormais vide**

  ```powershell
  # mysite/ est maintenant vide (apiBack/, old/, Pipfile, requirements.txt tous traités)
  git rm -r mysite 2>$null  # si git rm voit encore mysite
  Remove-Item mysite -Recurse -Force -ErrorAction SilentlyContinue
  ```

- [ ] **Étape 8 — Déplacer le frontend**

  ```powershell
  git mv TroubleMaker/troublemaker-frontend frontend
  ```

- [ ] **Étape 9 — Supprimer les stubs redondants dans TroubleMaker/**

  ```powershell
  git rm TroubleMaker/package.json TroubleMaker/package-lock.json
  Remove-Item TroubleMaker -Recurse -Force -ErrorAction SilentlyContinue
  ```

- [ ] **Étape 10 — Mettre à jour les références Python (apiBack → config)**

  **`backend/manage.py`** — remplacer :
  ```python
  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apiBack.settings')
  ```
  par :
  ```python
  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
  ```

  **`backend/config/wsgi.py`** — remplacer :
  ```python
  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apiBack.settings')
  ```
  par :
  ```python
  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
  ```

  **`backend/config/asgi.py`** — même remplacement : `apiBack.settings` → `config.settings`

  **`backend/config/settings.py`** — remplacer :
  ```python
  ROOT_URLCONF = 'apiBack.urls'
  ```
  par :
  ```python
  ROOT_URLCONF = 'config.urls'
  ```
  Et remplacer :
  ```python
  WSGI_APPLICATION = 'apiBack.wsgi.application'
  ```
  par :
  ```python
  WSGI_APPLICATION = 'config.wsgi.application'
  ```

  **`backend/config/urls.py`** — pas de changement nécessaire (importe depuis `api.urls` qui est inchangé).

- [ ] **Étape 11 — Vérifier que Django démarre**

  ```powershell
  cd backend
  python manage.py check
  ```
  Attendu : `System check identified no issues (0 silenced).`

- [ ] **Étape 12 — Vérifier que Next.js démarre**

  ```powershell
  cd frontend
  npm run build
  ```
  Attendu : build réussi.

- [ ] **Étape 13 — Mettre à jour `.gitignore`**

  Ajouter à la fin du `.gitignore` à la racine :
  ```
  *.pdf
  *.log
  .idx/
  ```

- [ ] **Étape 14 — Mettre à jour `CLAUDE.md`**

  Remplacer toutes les occurrences de `mysite/apiBack/` par `backend/` et `TroubleMaker/troublemaker-frontend/` par `frontend/` dans `CLAUDE.md`.

  Mettre aussi à jour les commandes de setup :
  ```powershell
  # Backend
  cd backend
  python -m venv .venv
  .venv\Scripts\activate
  pip install -r requirements.txt
  python manage.py migrate
  python manage.py runserver

  # Frontend
  cd frontend
  npm install
  npm run dev
  ```

- [ ] **Commit final SP4**

  ```powershell
  git add -A
  git commit -m "refactor: restructure project (backend/, frontend/, remove redundant files)"
  ```

---

## SP5 — Code Mort et Guard d'Authentification

*À partir de cette section, les chemins utilisent la nouvelle structure (`backend/`, `frontend/`) établie en SP4.*

---

### Task 16 : Supprimer les fichiers morts

**Files:**
- Delete: `frontend/src/app/activite/` (page orpheline entière)
- Delete: `frontend/src/app/encadrant/creer_affirmation/page.tsx`
- Delete: `frontend/src/components/activityForm.tsx`
- Delete: `frontend/src/components/studentSelector.tsx`

- [ ] **Supprimer les fichiers**

  ```powershell
  git rm -r frontend/src/app/activite
  git rm frontend/src/app/encadrant/creer_affirmation/page.tsx
  git rm frontend/src/components/activityForm.tsx
  git rm frontend/src/components/studentSelector.tsx
  ```

- [ ] **Vérifier qu'aucun fichier actif n'importait ces composants**

  ```powershell
  cd frontend
  grep -r "activityForm\|studentSelector\|creer_affirmation" src/ --include="*.tsx" --include="*.ts"
  ```
  Attendu : aucune occurrence (ou seulement dans les fichiers déjà supprimés).

- [ ] **Commit**

  ```powershell
  git add -A
  git commit -m "chore: remove dead pages and unused components"
  ```

---

### Task 17 : Brancher liste_affirmations sur l'API réelle

**Files:**
- Rewrite: `frontend/src/app/encadrant/liste_affirmations/page.tsx`

- [ ] **Remplacer le contenu de `liste_affirmations/page.tsx`**

  ```tsx
  "use client";

  import React, { useState, useEffect } from "react";
  import Account from "@/components/ui/Account";
  import { Trash, Edit } from "lucide-react";
  import axios from "axios";
  import { API_BASE_URL } from "@/lib/api";

  interface Affirmation {
    id: number;
    affirmation: string;
    explication?: string;
    nbr_reponses: number;
    is_correct_vf?: boolean | null;
    reponse_correcte_qcm?: number | null;
  }

  const App = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState("encadrant@example.com");

    useEffect(() => {
      const fetchAffirmations = async () => {
        try {
          const response = await axios.get<Affirmation[]>(
            `${API_BASE_URL}/api/affirmations/`,
            { withCredentials: true }
          );
          setAffirmations(response.data);
        } catch (err) {
          console.error("Error fetching affirmations:", err);
          setError("Erreur lors du chargement des affirmations.");
        } finally {
          setLoading(false);
        }
      };

      fetchAffirmations();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value.toLowerCase());
    };

    const filteredAffirmations = affirmations.filter((aff) =>
      aff.affirmation.toLowerCase().includes(searchQuery)
    );

    const handleDeleteAffirmation = async (id: number) => {
      if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette affirmation ?")) return;
      try {
        await axios.delete(`${API_BASE_URL}/api/affirmations/${id}/`, {
          withCredentials: true,
        });
        setAffirmations((prev) => prev.filter((a) => a.id !== id));
      } catch (err) {
        console.error("Error deleting affirmation:", err);
        alert("Erreur lors de la suppression.");
      }
    };

    const handleLogout = async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/logout/`, {}, { withCredentials: true });
      } finally {
        window.location.href = "/";
      }
    };

    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
          <p className="text-xl text-gray-600">Chargement...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Liste des affirmations</h1>
            </div>
            <Account name={userEmail} email={userEmail} onLogout={handleLogout} />
          </header>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <div className="mb-8 flex justify-center items-center space-x-4">
            <input
              type="text"
              placeholder="Recherche affirmation"
              value={searchQuery}
              onChange={handleSearch}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-6">
            {filteredAffirmations.length === 0 && !loading && (
              <p className="text-center text-gray-500">Aucune affirmation trouvée.</p>
            )}
            {filteredAffirmations.map((affirmation) => (
              <div
                key={affirmation.id}
                className="bg-gray-50 p-6 rounded-lg shadow-sm flex items-start space-x-4"
              >
                <div className="flex items-center">
                  <button
                    onClick={() => handleDeleteAffirmation(affirmation.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1">
                  <p className="text-gray-800">{affirmation.affirmation}</p>
                  {affirmation.explication && (
                    <p className="text-gray-500 text-sm mt-1">{affirmation.explication}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <button
                    onClick={() => alert(`Édition de l'affirmation ID: ${affirmation.id}`)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  export default App;
  ```

- [ ] **Vérifier**

  ```powershell
  cd frontend && npm run build
  ```

- [ ] **Commit**

  ```powershell
  git add frontend/src/app/encadrant/liste_affirmations/page.tsx
  git commit -m "feat: wire liste_affirmations to real API (was mock data)"
  ```

---

### Task 18 : Activer le guard d'authentification encadrant

**Files:**
- Modify: `frontend/src/app/encadrant/layout.tsx`

- [ ] **Remplacer le contenu de `layout.tsx`**

  ```tsx
  "use client";

  import { useEffect, useState } from "react";
  import { useRouter, usePathname } from "next/navigation";
  import axios from "axios";
  import { API_BASE_URL } from "@/lib/api";

  export default function EncadrantLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      // La page de login est dans ce layout — ne pas boucler
      if (pathname === "/encadrant/login") {
        setChecking(false);
        return;
      }

      axios
        .get(`${API_BASE_URL}/api/activites/`, { withCredentials: true })
        .then(() => setChecking(false))
        .catch((err) => {
          if (err.response?.status === 403 || err.response?.status === 401) {
            router.replace("/encadrant/login");
          } else {
            // Erreur réseau ou autre — laisser passer
            setChecking(false);
          }
        });
    }, [router, pathname]);

    if (checking && pathname !== "/encadrant/login") return null;

    return <>{children}</>;
  }
  ```

- [ ] **Vérifier**

  ```powershell
  npm run build
  ```

- [ ] **Commit**

  ```powershell
  git add frontend/src/app/encadrant/layout.tsx
  git commit -m "feat: add auth guard to encadrant layout, redirect to login if unauthenticated"
  ```

---

### Task 19 : Nettoyage — layout, sidebar, generer, confirmer

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/components/app-sidebar.tsx`
- Modify: `frontend/src/app/encadrant/generer/page.tsx`
- Modify: `frontend/src/app/etudiant/activite/participer/confirmer/page.tsx`

- [ ] **`app/layout.tsx` — corriger lang et titre**

  Trouver :
  ```tsx
  <html lang="en">
  ```
  Remplacer par :
  ```tsx
  <html lang="fr">
  ```

  Trouver le bloc metadata :
  ```typescript
  export const metadata: Metadata = {
    title: "Create Next App",
    description: "Generated by create next app",
  };
  ```
  Remplacer par :
  ```typescript
  export const metadata: Metadata = {
    title: "TroubleMaker",
    description: "Plateforme de quiz d'affirmations médicales",
  };
  ```

- [ ] **`app-sidebar.tsx` — corriger le lien "Liste des affirmations" et supprimer imports inutilisés**

  Trouver les imports :
  ```typescript
  import {
    MessagesSquare,
    ListTodo,
    Settings,
    Home,
  } from "lucide-react";
  ```
  Remplacer par :
  ```typescript
  import {
    MessagesSquare,
    ListTodo,
  } from "lucide-react";
  ```

  Trouver dans `sidebarItems` :
  ```typescript
  {
    title: "Liste des affirmations",
    href: "/encadrant/generer",
    icon: MessagesSquare,
  },
  ```
  Remplacer par :
  ```typescript
  {
    title: "Liste des affirmations",
    href: "/encadrant/liste_affirmations",
    icon: MessagesSquare,
  },
  ```

- [ ] **`generer/page.tsx` — supprimer l'import useCallback inutilisé**

  Trouver l'import React qui contient `useCallback` :
  ```typescript
  import { useState, useEffect, useCallback } from "react";
  ```
  S'il n'est pas utilisé dans le fichier, retirer `useCallback` :
  ```typescript
  import { useState, useEffect } from "react";
  ```
  (Vérifier d'abord avec `grep -n "useCallback" frontend/src/app/encadrant/generer/page.tsx` que ce n'est effectivement pas utilisé.)

- [ ] **`confirmer/page.tsx` — supprimer les console.log de debug et la variable globalIndex**

  Trouver et supprimer toutes les lignes du type :
  ```typescript
  console.log('Debug - Affirmation ID:', ...);
  console.log('Debug - Final displayAnswer:', displayAnswer);
  ```

  Trouver et supprimer :
  ```typescript
  const globalIndex = startIndex + idx;
  ```
  (Cette variable est assignée mais jamais utilisée dans le rendu.)

- [ ] **Vérifier**

  ```powershell
  cd frontend && npm run build
  ```

- [ ] **Commit**

  ```powershell
  git add frontend/src/app/layout.tsx
  git add frontend/src/components/app-sidebar.tsx
  git add frontend/src/app/encadrant/generer/page.tsx
  git add frontend/src/app/etudiant/activite/participer/confirmer/page.tsx
  git commit -m "chore: fix lang/title, sidebar link, remove dead code and debug logs"
  ```

---

### Task 20 : Remplacer getElementById par state React dans debrief

**Files:**
- Modify: `frontend/src/app/encadrant/debrief/page.tsx`

- [ ] **Ajouter le state `debriefInputs`**

  Dans la section des `useState` de `DebriefPage`, ajouter :
  ```typescript
  const [debriefInputs, setDebriefInputs] = useState<Record<number, string>>({});
  ```

- [ ] **Remplacer le `<textarea>` non contrôlé par un contrôlé**

  Trouver :
  ```tsx
  <textarea
    id={`debrief-${response.id}`}
    placeholder="Entrez votre feedback pour cette réponse..."
    className="w-full mt-2 p-3 border border-gray-300 rounded-md text-lg"
    rows={3}
  />
  ```
  Remplacer par :
  ```tsx
  <textarea
    value={debriefInputs[response.id] ?? ""}
    onChange={(e) =>
      setDebriefInputs((prev) => ({
        ...prev,
        [response.id]: e.target.value,
      }))
    }
    placeholder="Entrez votre feedback pour cette réponse..."
    className="w-full mt-2 p-3 border border-gray-300 rounded-md text-lg"
    rows={3}
  />
  ```

- [ ] **Remplacer l'accès DOM par la lecture du state**

  Trouver le handler du bouton "Sauvegarder le débrief" :
  ```typescript
  onClick={() => {
    const textarea = document.getElementById(`debrief-${response.id}`) as HTMLTextAreaElement;
    const feedback = textarea?.value?.trim();
    if (feedback) {
      handleCreateDebrief(response.id, feedback);
    } else {
      alert('Veuillez entrer un feedback avant de sauvegarder.');
    }
  }}
  ```
  Remplacer par :
  ```typescript
  onClick={() => {
    const feedback = debriefInputs[response.id]?.trim();
    if (feedback) {
      handleCreateDebrief(response.id, feedback);
    } else {
      alert('Veuillez entrer un feedback avant de sauvegarder.');
    }
  }}
  ```

- [ ] **Vider l'input après création réussie du débrief**

  Dans `handleCreateDebrief`, après `setDebriefs(prev => ...)`, ajouter :
  ```typescript
  setDebriefInputs((prev) => ({ ...prev, [responseId]: "" }));
  ```

- [ ] **Vérifier**

  ```powershell
  npm run build
  ```

- [ ] **Commit**

  ```powershell
  git add frontend/src/app/encadrant/debrief/page.tsx
  git commit -m "fix: replace document.getElementById with controlled React state for debrief textarea"
  ```

---

### Task 21 : Corriger le double toggle isSubmitting dans participer

**Files:**
- Modify: `frontend/src/app/etudiant/activite/participer/page.tsx`

- [ ] **Retirer le `setIsSubmitting(true)` redondant de `handleFinalSubmit`**

  Dans `handleFinalSubmit`, trouver au tout début :
  ```typescript
  const handleFinalSubmit = async () => {
    if (!activite || !activityCode || isSubmitting) return;
    setIsSubmitting(true);   // ← cette ligne
    setError(null);
    
    const finalIndex = currentAffirmationIndex;
    const lastSubmissionResult = await submitCurrentResponse(finalIndex);
  ```

  `submitCurrentResponse` gère déjà `isSubmitting` (true en début, false en finally). Retirer la ligne `setIsSubmitting(true)` de `handleFinalSubmit` pour éviter le double toggle. La garde `if (isSubmitting) return` en tête suffit.

  Résultat :
  ```typescript
  const handleFinalSubmit = async () => {
    if (!activite || !activityCode || isSubmitting) return;
    setError(null);

    const finalIndex = currentAffirmationIndex;
    const lastSubmissionResult = await submitCurrentResponse(finalIndex);
  ```

- [ ] **Vérifier**

  ```powershell
  npm run build
  ```

- [ ] **Commit**

  ```powershell
  git add frontend/src/app/etudiant/activite/participer/page.tsx
  git commit -m "fix: remove duplicate setIsSubmitting(true) in handleFinalSubmit"
  ```

---

## Vérification finale

- [ ] **Backend : démarrage propre**

  ```powershell
  cd backend
  python manage.py check
  python manage.py runserver
  ```
  Attendu : `Starting development server at http://127.0.0.1:8000/`

- [ ] **Frontend : build propre**

  ```powershell
  cd frontend
  npm run build
  npm run lint
  ```
  Attendu : aucune erreur TypeScript, aucune erreur ESLint.

- [ ] **Test smoke — login encadrant**

  Démarrer les deux serveurs. Naviguer vers `http://localhost:3000/encadrant/login`. Se connecter. Vérifier que la redirection vers `liste_activite` fonctionne.

- [ ] **Test smoke — débrief**

  Naviguer vers une activité avec des réponses → Débrief. Vérifier que les débriefs existants s'affichent et que la saisie d'un nouveau débrief fonctionne.

- [ ] **Commit final**

  ```powershell
  git add -A
  git commit -m "chore: final cleanup and verification"
  ```
