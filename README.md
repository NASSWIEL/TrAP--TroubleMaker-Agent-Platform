# TroubleMaker - Integrated Application

This repository contains the code for the published paper: [Making Hallucinations Useful: A Reassessment of the Troublemaker Agent Strategy in the Age of Generative AI](https://link.springer.com/chapter/10.1007/978-3-031-99264-3_36).

## Project Overview

The Trouble Agent Platform (TrAP) is a tool designed to help medical teachers and experts automate the creation of quizzes sourced from their teaching documents. The core idea is to generate questions as *affirmations* that require **yes/no** answers, each accompanied by a justification.

The platform has two interfaces:  
- **Student side** — Students can log in to the correct session using a unique code and answer the questions.  
- **Mentor side** — Mentors can review student answers and provide feedback, either collectively by email or individually through dedicated feedback sessions.

A key concept of the platform is that a large percentage of the affirmations are intentionally false yet plausible, in order to stimulate students’ critical thinking. This is achieved with the help of an LLM/SLM, which makes the sourced information more nuanced and believable. In this way, we leverage the potential of hallucinations to generate challenging affirmations.

## Project Structure

- `mysite/apiBack/` - Django REST API backend
- `TroubleMaker/troublemaker-frontend/` - Next.js frontend application

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
- Node.js 16+
- pip and npm/yarn

### Backend Setup (Django)

1. Navigate to the backend directory:
   ```bash
   cd mysite/apiBack
   ```
2. Create and activate virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r ../../req.txt
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd TroubleMaker/troublemaker-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

The Django backend provides REST API endpoints for the application.

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the dependency checker to ensure all requirements are met
5. Submit a pull request
