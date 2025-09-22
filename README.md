# TroubleMaker - Integrated Application

A full-stack application with Django REST API backend and Next.js frontend.

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
