# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TrAP (TroubleMaker Agent Platform) is a medical quiz platform where mentors (*encadrants*) generate intentionally false-but-plausible affirmations via the Gemini API to train students' critical thinking. Students (*etudiants*) answer yes/no or 4-choice questions; mentors provide debriefs.

## Repository Structure

- `backend/` — Django REST API backend
- `frontend/` — Next.js frontend

## Backend (Django)

### Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # then fill in values
python manage.py migrate
python manage.py runserver
```

### Required environment variables (`.env` in `backend/`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` for dev |
| `ALLOWED_HOSTS` | Comma-separated hosts |
| `GEMINI_API_KEY` | Google Gemini API key |

### Key commands

```powershell
python manage.py migrate           # apply migrations
python manage.py makemigrations    # create new migration
python manage.py createsuperuser   # create admin user
python manage.py loaddata api/fixtures/initial_data.json  # load fixtures
python manage.py test api          # run tests
```

### Architecture

**Custom user model** (`api.Users`): extends `AbstractUser` with a `role` field (`etudiant` | `encadrant`). Referenced via `settings.AUTH_USER_MODEL`.

**Models** (`api/models.py`):
- `Activite` — quiz session; primary key is a 1–9 char uppercase code (`code_activite`); has `is_published` flag that gates student access
- `Affirmation` — a statement with `nbr_reponses` (2=Vrai/Faux, 4=4-choice); `is_correct_vf` and `reponse_correcte_qcm` are optional (affirmations are "neutral" by default)
- `Reponse` — student answer; unique on `(activite, affirmation, etudiant)`; POST endpoint uses `update_or_create` (upsert)
- `Debrief` — one-to-one with `Reponse`; created by encadrant

**Auth**: session-based (`SessionAuthentication`). CSRF is disabled via `middleware/disable_csrf.py` — this is intentional for the API.

**AI generation** (`api/views.py`): `GeminiGenerateAffirmationsAPIView` generates 3 false affirmations; `GeminiMakeHarderAPIView` reformulates them to be harder to detect. Uses `google-generativeai` with a graceful fallback mock if unavailable.

**API endpoints** (all mounted under `/api/`):

| Path | Description |
|---|---|
| `login/encadrant/` | Password login for encadrants |
| `login/activite/` | Email + activity code login for students |
| `logout/` | Session logout |
| `activites/`, `activites/<code>/` | Activity CRUD (encadrant-scoped) |
| `affirmations/`, `affirmations/<id>/` | Affirmation CRUD |
| `reponses/`, `reponses/<id>/` | Student responses (upsert via POST) |
| `debriefs/`, `debriefs/<id>/` | Mentor feedback |
| `gemini/generate-affirmations/` | Generate 3 false affirmations |
| `gemini/make-harder/` | Reformulate affirmation to be harder |
| `users/get_ids_by_email/` | Resolve emails → user IDs |
| `categories/` | List/create categories |

**M2M fields** on `Activite`: use `etudiants_autorises_ids` and `affirmations_associes_ids` (list of PKs) in PUT/PATCH requests — the view handles these separately from regular fields.

## Frontend (Next.js)

### Setup

```powershell
cd frontend
npm install
npm run dev    # http://localhost:3000
npm run lint
npm run build
```

### Architecture

Uses Next.js 15 App Router. Two role-separated route groups:

- `/encadrant/` — mentor pages: login, create/list activities, create/list affirmations, generate (AI), activity settings, debrief
- `/etudiant/` — student pages: login, activity view, participate, confirm

**Components** (`src/components/`):
- `ui/` — shadcn/ui primitives (Radix UI based): button, card, dialog, input, etc.
- `AffirmationCard.tsx`, `activityForm.tsx`, `studentSelector.tsx`, `app-sidebar.tsx` — domain-specific

API calls use **axios** (`axios` package). The backend runs on port 8000; frontend on 3000. CORS is configured in Django settings for both.

No test suite is configured on the frontend.
