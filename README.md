# TroubleMaker - Integrated Application

This repository contains the code for the published paper: [Making Hallucinations Useful: A Reassessment of the Troublemaker Agent Strategy in the Age of Generative AI](https://link.springer.com/chapter/10.1007/978-3-031-99264-3_36).

## Project Overview

The Trouble Agent Platform (TrAP) is a tool designed to help medical teachers and experts automate the creation of quizzes sourced from their teaching documents. The core idea is to generate questions as *affirmations* that require **yes/no** answers, each accompanied by a justification.

The platform has two interfaces:  
- **Student side** — Students can log in to the correct session using a unique code and answer the questions.  
- **Mentor side** — Mentors can review student answers and provide feedback, either collectively by email or individually through dedicated feedback sessions.

A key concept of the platform is that a large percentage of the affirmations are intentionally false yet plausible, in order to stimulate students’ critical thinking. This is achieved with the help of an LLM/SLM, which makes the sourced information more nuanced and believable. In this way, we leverage the potential of hallucinations to generate challenging affirmations.

## Key Features

- AI-generated false-but-plausible medical affirmations via Google Gemini
- Graceful mock fallback when Gemini is unavailable or quota-exceeded
- Session-based auth; students log in with email + activity code (no password)
- Activity publishing workflow: draft → published
- Mentor debrief system for per-student written feedback
- EN/FR language switcher on all entry pages (English default, persisted in localStorage)
- Full architecture reference in `design.md`

## Project Structure

```
backend/          Django 5.1 REST API (port 8000)
  api/            models, views, serializers, urls
  config/         Django settings and root urls
  middleware/     custom CSRF disable middleware
  requirements.txt
  .env.example
frontend/         Next.js 15 App Router (port 3000)
  src/app/
    encadrant/    mentor pages
    etudiant/     student pages
  src/contexts/   LanguageContext (i18n)
  src/lib/i18n/   translations.ts (EN/FR)
check_deps.sh / check_deps.ps1
devserver.sh
design.md         full architecture reference
```

## Setup Instructions

### Quick Setup (Automated)

For a quick and automated setup, use the provided scripts:

#### 1. Check and Install Dependencies

```bash
# For Linux/macOS
./check_deps.sh

# For Windows
.\check_deps.ps1
```

This script will automatically:

- Detect your operating system and package manager
- Check for Python, Node.js, and other required dependencies
- Install missing dependencies using your system's package manager
- Set up virtual environments for Python
- Install all project dependencies for both backend and frontend

#### 2. Start Development Server

```bash
./devserver.sh
```

This script will activate the Python virtual environment and start the Django development server.

### Manual Setup

If you prefer manual setup or need more control:

#### Prerequisites

- Python 3.8+
- Node.js 18+
- pip and npm

### Backend Setup (Django)

1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Create and activate virtual environment:
   ```powershell
   python -m venv .venv
   .venv\Scripts\activate      # Windows
   # source .venv/bin/activate  # macOS/Linux
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Configure environment:
   ```powershell
   cp .env.example .env   # then fill SECRET_KEY and optionally GEMINI_API_KEY
   ```
5. Run migrations:
   ```powershell
   python manage.py migrate
   ```
6. Create an admin user:
   ```powershell
   python manage.py createsuperuser
   ```
7. Start the development server:
   ```powershell
   python manage.py runserver   # http://localhost:8000
   ```

### Frontend Setup (Next.js)

1. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the development server:
   ```powershell
   npm run dev   # http://localhost:3000
   ```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | Django secret key |
| `DEBUG` | No | `True` for dev (default: `False`) |
| `ALLOWED_HOSTS` | No | Comma-separated hosts (default: `localhost,127.0.0.1`) |
| `GEMINI_API_KEY` | No | Google Gemini API key; mock fallback used if absent |

### Frontend (optional)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base URL for client-side calls (default: empty string, same-origin proxy) |
| `API_BACKEND_URL` | Server-side proxy target (default: `http://localhost:8000`) |

## Local URLs

| URL | Description |
|---|---|
| `http://localhost:3000` | App entry — role selector |
| `http://localhost:3000/encadrant/login` | Mentor login |
| `http://localhost:3000/etudiant/login` | Student login |
| `http://localhost:8000/admin/` | Django admin |
| `http://localhost:8000/api/` | DRF browsable API |

## Available Scripts

The project includes several utility scripts to simplify development:

- **`check_deps.sh`** / **`check_deps.ps1`** - Cross-platform dependency checker and installer

  - Automatically detects your OS (Linux distributions, macOS, Windows)
  - Checks for required software (Python, Node.js, pip, npm, etc.)
  - Installs missing dependencies using your system's package manager
  - Sets up Python virtual environment
  - Installs all project dependencies

- **`devserver.sh`** - Quick development server launcher
  - Activates the Python virtual environment
  - Starts the Django development server
  - Can be configured with custom port via `$PORT` environment variable

## License

This project is licensed under the AGPL-3.0 License. See the [LICENSE](LICENSE) file for details.