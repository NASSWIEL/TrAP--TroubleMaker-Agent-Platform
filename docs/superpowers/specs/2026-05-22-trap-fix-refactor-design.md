# Design Doc — TrAP Fix & Refactor

**Date :** 2026-05-22
**Approche :** Séquentielle (A) — chaque commit laisse le projet dans un état fonctionnel
**Stack :** Django + Django REST Framework (backend) · Next.js 15 + TypeScript + Tailwind (frontend)
**Contraintes :** même logique métier, même interface visuelle, même stack technique

---

## Contexte

Audit complet du projet TrAP (TroubleMaker Agent Platform) a révélé 97 problèmes répartis en 5 catégories. Ce document spécifie les corrections à apporter dans l'ordre suivant :

- **SP1** — Cassures runtime (endpoints cassés, crash au démarrage)
- **SP2** — Corrections techniques frontend↔backend (URLs, types, config)
- **SP3** — Sécurité (validation démarrage, roles, permissions)
- **SP4** — Restructuration du projet (organisation fichiers)
- **SP5** — Code mort et guard d'authentification

---

## SP1 — Cassures Runtime

### Objectif
Rendre le backend démarrable et les endpoints de base fonctionnels.

### Corrections

**1. `mysite/requirements.txt` — ajouter `python-dotenv`**
- `settings.py` fait `from dotenv import load_dotenv` mais `python-dotenv` est absent du fichier de dépendances.
- Résultat attendu : le backend démarre sans `ImportError`.

**2. `settings.py` — valider `SECRET_KEY` au démarrage**
- Ajouter après `SECRET_KEY = os.getenv('SECRET_KEY')` :
  ```python
  if not SECRET_KEY:
      raise ImproperlyConfigured("SECRET_KEY must be set in environment")
  ```
- Importer `ImproperlyConfigured` depuis `django.core.exceptions`.

**3. `views.py` — supprimer la clé Gemini hardcodée**
- Ligne ~408 dans `GeminiMakeHarderAPIView.post()` : `genai.configure(api_key="AIzaSy...")` remplacé par `genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))`.
- La clé Google leakée doit être révoquée dans la Google Cloud Console.

**4. `views.py` — corriger l'indentation de `AffirmationAPIView.post()`**
- `post(self, request)` est actuellement indenté à l'intérieur de `get(self, request, pk=None)` → Python le traite comme une fonction locale, pas une méthode de classe.
- `POST /api/affirmations/` retourne 405. Corriger l'indentation pour en faire une méthode de classe.

**5. `views.py` — implémenter `ChatbotAPIView`**
- La classe n'a que `pass`. La vue `Generate` l'instancie et appelle `chatbot_view.post(...)` → `AttributeError` → 500 sur tout appel à `/api/generate/`.
- Implémenter `ChatbotAPIView.post()` en déléguant à `GeminiGenerateAffirmationsAPIView` (la logique existe déjà).

**6. `views.py` — corriger `ActiviteLoginView` : backend manquant dans `login()`**
- `login(request, user)` est appelé sur un `user` récupéré par `objects.get()` sans `authenticate()`, donc sans attribut `backend`.
- Ajouter `backend='django.contrib.auth.backends.ModelBackend'` : `login(request, user, backend='django.contrib.auth.backends.ModelBackend')`.

**7. `admin.py` — retirer les champs supprimés du fieldsets**
- `AffirmationAdmin.fieldsets` référence `option_1`, `option_2`, `option_3`, `option_4` supprimés en migration 0003.
- La page admin Affirmation lève `FieldError`. Retirer ces champs du `fieldsets`.

---

## SP2 — Corrections Techniques Frontend↔Backend

### Objectif
Corriger les dysfonctionnements silencieux sans changer la logique ni l'interface.

### Corrections

**1. Créer `TroubleMaker/troublemaker-frontend/src/lib/api.ts` — centraliser l'URL de base**
- Ce fichier sera déplacé automatiquement vers `frontend/src/lib/api.ts` lors de SP4.
- Instance axios préconfigurée :
  ```typescript
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
  export const api = axios.create({ baseURL: BASE_URL, withCredentials: true });
  ```
- Remplacer toutes les occurrences `http://localhost:8000` hardcodées dans les pages par cette instance.
- Aucun changement de payload ni de logique d'appel.

**2. `debrief/page.tsx` — corriger la clé de la `debriefMap`**
- `DebriefSerializer` retourne `reponse` comme objet imbriqué, pas un entier.
- `debriefMap.set(debrief.reponse, debrief)` utilise un objet comme clé → `debriefMap.get(response.id)` retourne toujours `undefined`.
- Correction : `debriefMap.set(debrief.reponse.id, debrief)`. Les débriefs s'affichent.

**3. `api/serializers.py` — aligner `AffirmationSerializer.validate()` sur le modèle**
- Migration 0009 rend `is_correct_vf` et `reponse_correcte_qcm` optionnels (affirmations neutres).
- Le serializer les exige encore → les affirmations neutres créées via admin sont rejetées par l'API.
- Retirer les contraintes `required` sur ces champs dans `validate()`.

**4. `settings.py` — corriger la configuration des cookies de session**
- Ajouter `SESSION_COOKIE_SAMESITE = 'None'` et `SESSION_COOKIE_SECURE = False` (dev).
- Sans ça, les cookies de session peuvent être bloqués en cross-origin (localhost:3000 → localhost:8000).

**5. `liste_activite/page.tsx` — corriger la redirection logout**
- Remplacer `window.location.href = 'http://localhost:3000'` par `router.push('/')`.

---

## SP3 — Sécurité

### Objectif
Corriger les failles techniques sans toucher à la logique métier (le login étudiant sans mot de passe est un choix délibéré de l'application).

### Corrections

**1. `settings.py` — `SECRET_KEY` (couvert dans SP1)**
- Déjà spécifié ci-dessus.

**2. `settings.py` — corriger `ALLOWED_HOSTS`**
- `os.getenv('ALLOWED_HOSTS', '').split(',')` produit `['']` si la variable est absente → protection host-header désactivée.
- Remplacer par : `[h for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h]`.

**3. `views.py` — ajouter role check sur `EmailToIdResolverView`**
- Le commentaire ligne 1155 indique "Only encadrants should access this" mais aucun code n'enforce.
- Ajouter en début de `post()` :
  ```python
  if request.user.role != 'encadrant':
      return Response({'error': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)
  ```

**4. `views.py` — ajouter `permission_classes` sur `GeminiMakeHarderAPIView`**
- La classe n'a pas de `permission_classes` → DRF tombe sur la valeur par défaut globale.
- Ajouter `permission_classes = [IsAuthenticated]` au niveau classe.

---

## SP4 — Restructuration du Projet

### Objectif
Organisation propre, même stack, aucun changement fonctionnel.

### Nouvelle structure

```
TrAP--TroubleMaker-Agent-Platform/
├── backend/                    ← était mysite/apiBack/
│   ├── api/                    ← app Django (inchangée)
│   ├── config/                 ← était apiBack/ (paquet settings renommé)
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── middleware/
│   │   └── disable_csrf.py
│   ├── manage.py
│   ├── db.sqlite3
│   ├── requirements.txt        ← avec python-dotenv ajouté
│   └── .env.example
├── frontend/                   ← était TroubleMaker/troublemaker-frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── docs/
├── .gitignore
├── CLAUDE.md
└── README.md
```

### Fichiers Python à mettre à jour (renommage `apiBack/` → `config/`)

| Fichier | Ancienne valeur | Nouvelle valeur |
|---|---|---|
| `backend/manage.py` | `apiBack.settings` | `config.settings` |
| `backend/config/settings.py` | `ROOT_URLCONF = 'apiBack.urls'` | `ROOT_URLCONF = 'config.urls'` |
| `backend/config/settings.py` | `WSGI_APPLICATION` (commenté) | décommenter : `config.wsgi.application` |
| `backend/config/wsgi.py` | `apiBack.settings` | `config.settings` |
| `backend/config/asgi.py` | `apiBack.settings` | `config.settings` |

### Suppressions

| Chemin | Raison |
|---|---|
| `mysite/old/` | Migrations orphelines d'un schéma abandonné |
| `Pipfile` + `Pipfile.lock` (racine) | Vide, mauvaise version Python |
| `req.txt` (racine) | 4e fichier requirements conflictuel |
| `mysite/Pipfile` | Remplacé par `backend/requirements.txt` |
| `TroubleMaker/package.json` | Stub redondant |
| `TroubleMaker/package-lock.json` | Lock du stub redondant |
| `create_test_data.py` | Fichier vide |
| `excalidraw.log` | Log commité |

### `.gitignore` — ajouts

```
*.pdf
*.log
.idx/
```

### `CLAUDE.md` — mettre à jour les chemins

Remplacer toutes les références `mysite/apiBack/` → `backend/` et `TroubleMaker/troublemaker-frontend/` → `frontend/`.

---

## SP5 — Code Mort et Guard d'Authentification

### Objectif
Supprimer le code mort, câbler ce qui existe déjà, corriger les bugs non-fonctionnels.

### Suppressions de fichiers

| Fichier | Raison |
|---|---|
| `src/app/activite/page.tsx` | Page orpheline, données mockées, inaccessible |
| `src/app/encadrant/creer_affirmation/page.tsx` | Non liée au sidebar, envoie champs inexistants |
| `src/components/activityForm.tsx` | Jamais importé |
| `src/components/studentSelector.tsx` | Jamais importé |

### `liste_affirmations/page.tsx` — brancher sur l'API réelle

- Remplacer les données mockées et les `alert()` par des appels réels à `GET /api/affirmations/`.
- Garder exactement le même rendu visuel.

### `encadrant/layout.tsx` — activer le guard d'authentification

- Le bloc de redirection (lignes 9–14) est commenté. Le décommenter.
- Si pas de session active → rediriger vers `/encadrant/login`.
- Aucun changement visuel.

### Nettoyage code (sans impact visuel)

| Fichier | Correction |
|---|---|
| `app/layout.tsx` | `lang="en"` → `lang="fr"`, titre "Create Next App" → "TroubleMaker" |
| `app-sidebar.tsx` | Lien "Liste des affirmations" → `/encadrant/liste_affirmations` (pointe sur `/generer` actuellement). Supprimer imports `Settings`, `Home` inutilisés. |
| `not-found.tsx` | Annuler le timer de redirection dans le cleanup du `useEffect` |
| `generer/page.tsx` | Supprimer import `useCallback` inutilisé |
| `confirmer/page.tsx` | Supprimer `console.log` de debug, variable `globalIndex` inutilisée |
| `debrief/page.tsx` | Remplacer `document.getElementById` par state React contrôlé pour le textarea debrief |
| `participer/page.tsx` | Corriger double toggle de `isSubmitting` dans `handleFinalSubmit` + `submitCurrentResponse` |

---

## Ordre d'exécution

Les sous-projets sont exécutés en séquence. Chaque SP se termine par un état stable et committable.

```
SP1 → SP2 → SP3 → SP4 → SP5
```

SP4 (restructuration) intervient après que le code est corrigé, pour ne pas casser des corrections en cours de déplacement de fichiers.

---

## Ce qui est hors périmètre

- Logique métier (login étudiant sans mot de passe, flux encadrant/étudiant)
- Noms de champs API
- Comportement et apparence de l'interface utilisateur
- CSRF global (nécessite refactor auth complet, hors scope)
- `update_or_create` bypass de `clean()` (refactor modèle, hors scope)
- Tests unitaires (pas de suite de tests existante à maintenir)
