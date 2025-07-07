#!/bin/bash

# Cross-platform dependency checker for Linux distributions and macOS

if [ $EUID -eq 0 ]; then
    echo "[WARNING] You are running this script as root. This can cause permission issues with npm and pip."
fi

# Function to detect OS and package manager
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            echo "debian"
        elif command -v yum &> /dev/null || command -v dnf &> /dev/null; then
            echo "redhat"
        elif command -v pacman &> /dev/null; then
            echo "arch"
        elif command -v zypper &> /dev/null; then
            echo "suse"
        elif command -v apk &> /dev/null; then
            echo "alpine"
        else
            echo "linux-unknown"
        fi
    else
        echo "unknown"
    fi
}

# Function to provide installation instructions based on OS
show_pip_install_instructions() {
    local os_type=$(detect_os)
    echo "[ERROR] pip is not installed. Please install pip first:"
    
    case $os_type in
        "macos")
            echo "  On macOS:"
            echo "    Using Homebrew: brew install python"
            echo "    Using MacPorts: sudo port install py313-pip"
            echo "    Or install Python from: https://www.python.org/downloads/"
            ;;
        "debian")
            echo "  On Ubuntu/Debian: sudo apt update && sudo apt install python3-pip"
            ;;
        "redhat")
            if command -v dnf &> /dev/null; then
                echo "  On Fedora/RHEL 8+: sudo dnf install python3-pip"
            else
                echo "  On CentOS/RHEL: sudo yum install python3-pip"
            fi
            ;;
        "arch")
            echo "  On Arch Linux: sudo pacman -S python-pip"
            ;;
        "suse")
            echo "  On openSUSE: sudo zypper install python3-pip"
            ;;
        "alpine")
            echo "  On Alpine: sudo apk add py3-pip"
            ;;
        *)
            echo "  Install Python 3 and pip using your system's package manager"
            echo "  Or download from: https://www.python.org/downloads/"
            ;;
    esac
}

show_node_install_instructions() {
    local os_type=$(detect_os)
    echo "[ERROR] Node.js is not installed. Please install Node.js first:"
    echo "  Universal: Visit https://nodejs.org/ or use Node Version Manager (nvm)"
    echo "  nvm install: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "             then: nvm install --lts"
    
    case $os_type in
        "macos")
            echo "  On macOS:"
            echo "    Using Homebrew: brew install node"
            echo "    Using MacPorts: sudo port install nodejs18"
            ;;
        "debian")
            echo "  On Ubuntu/Debian:"
            echo "    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
            echo "    sudo apt-get install -y nodejs"
            ;;
        "redhat")
            if command -v dnf &> /dev/null; then
                echo "  On Fedora/RHEL 8+: sudo dnf install nodejs npm"
            else
                echo "  On CentOS/RHEL: sudo yum install nodejs npm"
            fi
            ;;
        "arch")
            echo "  On Arch Linux: sudo pacman -S nodejs npm"
            ;;
        "suse")
            echo "  On openSUSE: sudo zypper install nodejs18 npm18"
            ;;
        "alpine")
            echo "  On Alpine: sudo apk add nodejs npm"
            ;;
    esac
}

show_npm_install_instructions() {
    local os_type=$(detect_os)
    echo "[ERROR] npm is not installed. Please install npm:"
    
    case $os_type in
        "macos")
            echo "  On macOS:"
            echo "    Using Homebrew: brew install node (includes npm)"
            echo "    Or: brew install npm"
            ;;
        "debian")
            echo "  On Ubuntu/Debian: sudo apt install npm"
            ;;
        "redhat")
            if command -v dnf &> /dev/null; then
                echo "  On Fedora/RHEL 8+: sudo dnf install npm"
            else
                echo "  On CentOS/RHEL: sudo yum install npm"
            fi
            ;;
        "arch")
            echo "  On Arch Linux: sudo pacman -S npm"
            ;;
        "suse")
            echo "  On openSUSE: sudo zypper install npm18"
            ;;
        "alpine")
            echo "  On Alpine: sudo apk add npm"
            ;;
        *)
            echo "  Install npm using your system's package manager"
            ;;
    esac
}

echo "Checking for pip..."
PIP_CMD=""
if command -v pip &> /dev/null; then
    PIP_CMD="pip"
elif command -v pip3 &> /dev/null; then
    PIP_CMD="pip3"
elif python3 -m pip --version &> /dev/null 2>&1; then
    PIP_CMD="python3 -m pip"
else
    show_pip_install_instructions
    exit 1
fi

echo "Found pip command: $PIP_CMD"

# Check Python version compatibility
PYTHON_VERSION=$(python3 -c "import sys; print('.'.join(map(str, sys.version_info[:2])))" 2>/dev/null || echo "0.0")
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
    echo "[WARNING] Python $PYTHON_VERSION detected. Django 5.x requires Python 3.8+"
    echo "Please upgrade Python or use a compatible Django version."
fi

# Ensure Python virtual environment exists and activate it
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment in .venv..."
    if ! python3 -m venv .venv; then
        echo "[ERROR] Failed to create virtual environment. Check if python3-venv is installed."
        local os_type=$(detect_os)
        case $os_type in
            "debian")
                echo "  Try: sudo apt install python3-venv"
                ;;
            "redhat")
                echo "  Try: sudo yum install python3-venv"
                ;;
        esac
        exit 1
    fi
fi

# Activate virtual environment with cross-platform compatibility
if [ -f ".venv/bin/activate" ]; then
    # Linux/macOS
    chmod +x .venv/bin/activate 2>/dev/null
    source .venv/bin/activate
    echo "Activated virtual environment (Unix)"
elif [ -f ".venv/Scripts/activate" ]; then
    # Windows (Git Bash/WSL)
    source .venv/Scripts/activate
    echo "Activated virtual environment (Windows)"
else
    echo "[ERROR] Virtual environment activation script not found"
    exit 1
fi

echo "Checking Python dependencies from req.txt..."
if [ -f req.txt ]; then
    echo "Installing/updating dependencies from req.txt..."
    if $PIP_CMD install -r req.txt; then
        if $PIP_CMD check; then
            echo "✓ All dependencies from req.txt are satisfied"
        else
            echo "[WARNING] Some dependency conflicts detected from req.txt"
        fi
    else
        echo "[ERROR] Failed to install dependencies from req.txt"
        exit 1
    fi
else
    echo "req.txt not found."
fi

echo "Checking Python dependencies from mysite/requirements.txt..."
if [ -f mysite/requirements.txt ]; then
    echo "Installing/updating dependencies from mysite/requirements.txt..."
    if $PIP_CMD install -r mysite/requirements.txt; then
        if $PIP_CMD check; then
            echo "✓ All dependencies from mysite/requirements.txt are satisfied"
        else
            echo "[WARNING] Some dependency conflicts detected from mysite/requirements.txt"
        fi
    else
        echo "[ERROR] Failed to install dependencies from mysite/requirements.txt"
        exit 1
    fi
else
    echo "mysite/requirements.txt not found."
fi

echo "Checking for pipenv..."
if command -v pipenv &> /dev/null; then
    echo "Checking Pipenv environment in root..."
    if [ -f Pipfile ]; then
        if pipenv --venv &> /dev/null; then
            echo "✓ Pipenv environment exists in root"
        else
            echo "Creating Pipenv environment in root..."
            pipenv install --dev
        fi
        if pipenv check; then
            echo "✓ All Pipfile dependencies are satisfied in root"
        else
            echo "[WARNING] Some Pipfile dependencies missing in root. Attempting to install..."
            pipenv install --dev
        fi
    else
        echo "Pipfile not found in root."
    fi

    echo "Checking Pipenv environment in mysite..."
    if [ -f mysite/Pipfile ]; then
        (cd mysite && {
            if pipenv --venv &> /dev/null; then
                echo "✓ Pipenv environment exists in mysite"
            else
                echo "Creating Pipenv environment in mysite..."
                pipenv install --dev
            fi
            if pipenv check; then
                echo "✓ All Pipfile dependencies are satisfied in mysite"
            else
                echo "[WARNING] Some Pipfile dependencies missing in mysite. Attempting to install..."
                pipenv install --dev
            fi
        })
    else
        echo "Pipfile not found in mysite."
    fi
else
    echo "[WARNING] pipenv is not installed. Skipping pipenv checks."
    echo "  Install with: $PIP_CMD install pipenv"
fi

echo "Checking for Node.js and npm..."
NODE_DEPS_OK=false

if ! command -v node &> /dev/null; then
    show_node_install_instructions
elif ! command -v npm &> /dev/null; then
    show_npm_install_instructions
else
    NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//')
    NPM_VERSION=$(npm --version 2>/dev/null)
    echo "✓ Node.js $NODE_VERSION and npm $NPM_VERSION are installed"
    
    # Check Node.js version compatibility
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "[WARNING] Node.js $NODE_VERSION detected. Next.js 15+ requires Node.js 18+"
        echo "Consider upgrading Node.js for better compatibility."
    fi
    
    NODE_DEPS_OK=true
fi

if [ "$NODE_DEPS_OK" = true ]; then
    echo "Checking Node.js dependencies in TroubleMaker..."
    if [ -f TroubleMaker/package.json ]; then
        (cd TroubleMaker && {
            if npm ls --depth=0 &> /dev/null; then
                echo "✓ All Node.js dependencies are satisfied in TroubleMaker"
            else
                echo "Installing Node.js dependencies in TroubleMaker..."
                if npm install; then
                    if npm ls --depth=0 &> /dev/null; then
                        echo "✓ Node.js dependencies installed successfully in TroubleMaker"
                    else
                        echo "[WARNING] Some Node.js dependencies may still be missing in TroubleMaker"
                    fi
                else
                    echo "[ERROR] Failed to install Node.js dependencies in TroubleMaker"
                fi
            fi
        })
    else
        echo "TroubleMaker/package.json not found."
    fi

    echo "Checking Node.js dependencies in troublemaker-frontend..."
    if [ -f TroubleMaker/troublemaker-frontend/package.json ]; then
        (cd TroubleMaker/troublemaker-frontend && {
            if npm ls --depth=0 &> /dev/null; then
                echo "✓ All Node.js dependencies are satisfied in troublemaker-frontend"
            else
                echo "Installing Node.js dependencies in troublemaker-frontend..."
                if npm install; then
                    if npm ls --depth=0 &> /dev/null; then
                        echo "✓ Node.js dependencies installed successfully in troublemaker-frontend"
                    else
                        echo "[WARNING] Some Node.js dependencies may still be missing in troublemaker-frontend"
                    fi
                else
                    echo "[ERROR] Failed to install Node.js dependencies in troublemaker-frontend"
                fi
            fi
        })
    else
        echo "TroubleMaker/troublemaker-frontend/package.json not found."
    fi
else
    echo "Skipping Node.js dependency checks due to missing Node.js/npm"
fi

echo -e "\n--- Dependency Check Summary ---"
PYTHON_OK=true
NODE_OK="$NODE_DEPS_OK"

# Check if virtual environment is activated
if [[ -n "$VIRTUAL_ENV" ]]; then
    VENV_NAME=$(basename "$VIRTUAL_ENV" 2>/dev/null || echo "unknown")
    echo "✓ Python virtual environment is active: $VENV_NAME"
else
    echo "⚠ Python virtual environment is not active"
    PYTHON_OK=false
fi

if [ "$PYTHON_OK" = true ] && [ "$NODE_OK" = true ]; then
    echo "✓ All dependencies appear to be satisfied. Proceeding to launch services..."
elif [ "$PYTHON_OK" = false ]; then
    echo "⚠ Python environment issues detected. Backend may not start properly."
elif [ "$NODE_OK" = false ]; then
    echo "⚠ Node.js/npm issues detected. Frontend may not start properly."
    echo "Please install Node.js and npm before continuing."
    exit 1
fi

echo -e "\n--- Launching Backend (Django) ---"
if [ -f mysite/apiBack/manage.py ]; then
    echo "Starting Django backend..."
    LOGFILE_BACKEND="backend.log"
    
    # Check if Django is actually available
    if ! python -c "import django" 2>/dev/null; then
        echo "[ERROR] Django is not installed or not accessible in the virtual environment"
        echo "Backend cannot be started"
    else
        # Use different approaches for background process handling
        if touch "$LOGFILE_BACKEND" 2>/dev/null; then
            echo "Backend log will be written to: $LOGFILE_BACKEND"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                (cd mysite/apiBack && DJANGO_SETTINGS_MODULE=apiBack.settings PYTHONPATH=$(pwd) python manage.py runserver > "../../$LOGFILE_BACKEND" 2>&1 &)
            else
                # Linux
                (cd mysite/apiBack && DJANGO_SETTINGS_MODULE=apiBack.settings PYTHONPATH=$(pwd) nohup python manage.py runserver > "../../$LOGFILE_BACKEND" 2>&1 &)
            fi
            sleep 3
            # Cross-platform process finding
            BACKEND_PID=$(ps aux | grep -E "python.*manage.py.*runserver" | grep -v grep | awk '{print $2}' | head -1)
            if [ -n "$BACKEND_PID" ]; then
                echo "Backend started with PID: $BACKEND_PID"
            else
                echo "Backend may have failed to start. Check $LOGFILE_BACKEND"
            fi
        else
            echo "[WARNING] Cannot write to $LOGFILE_BACKEND. Check permissions. Running without log file."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                (cd mysite/apiBack && DJANGO_SETTINGS_MODULE=apiBack.settings PYTHONPATH=$(pwd) python manage.py runserver &)
            else
                (cd mysite/apiBack && DJANGO_SETTINGS_MODULE=apiBack.settings PYTHONPATH=$(pwd) nohup python manage.py runserver &)
            fi
            sleep 3
            BACKEND_PID=$(ps aux | grep -E "python.*manage.py.*runserver" | grep -v grep | awk '{print $2}' | head -1)
            if [ -n "$BACKEND_PID" ]; then
                echo "Backend started with PID: $BACKEND_PID"
            fi
        fi
    fi
else
    echo "mysite/apiBack/manage.py not found. Backend not started."
fi

echo -e "\n--- Launching Frontend (Next.js) ---"
if [ "$NODE_OK" = true ] && [ -f TroubleMaker/troublemaker-frontend/package.json ]; then
    echo "Starting Next.js frontend..."
    LOGFILE_FRONTEND="frontend.log"
    
    # Check if Next.js dependencies are available
    if (cd TroubleMaker/troublemaker-frontend && npm ls next &> /dev/null); then
        if touch "$LOGFILE_FRONTEND" 2>/dev/null; then
            echo "Frontend log will be written to: $LOGFILE_FRONTEND"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                (cd TroubleMaker/troublemaker-frontend && NODE_ENV=development npm run dev > "../../../$LOGFILE_FRONTEND" 2>&1 &)
            else
                # Linux/Windows
                (cd TroubleMaker/troublemaker-frontend && NODE_ENV=development nohup npm run dev > "../../../$LOGFILE_FRONTEND" 2>&1 &)
            fi
            sleep 3
            # Cross-platform process finding
            if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WINDIR" ]]; then
                # Windows environment - check by port
                if netstat -an 2>/dev/null | grep -q ":3000.*LISTENING" 2>/dev/null; then
                    echo "Frontend started successfully"
                else
                    echo "Frontend may have failed to start. Check $LOGFILE_FRONTEND"
                fi
            else
                # Unix-like systems
                FRONTEND_PID=$(ps aux | grep -E "npm.*run.*dev" | grep -v grep | awk '{print $2}' | head -1)
                if [ -n "$FRONTEND_PID" ]; then
                    echo "Frontend started with PID: $FRONTEND_PID"
                else
                    echo "Frontend may have failed to start. Check $LOGFILE_FRONTEND"
                fi
            fi
        else
            echo "[WARNING] Cannot write to $LOGFILE_FRONTEND. Check permissions. Running without log file."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                (cd TroubleMaker/troublemaker-frontend && NODE_ENV=development npm run dev &)
            else
                (cd TroubleMaker/troublemaker-frontend && NODE_ENV=development nohup npm run dev &)
            fi
            sleep 3
            if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WINDIR" ]]; then
                # Windows environment - check by port
                if netstat -an 2>/dev/null | grep -q ":3000.*LISTENING" 2>/dev/null; then
                    echo "Frontend started successfully"
                fi
            else
                FRONTEND_PID=$(ps aux | grep -E "npm.*run.*dev" | grep -v grep | awk '{print $2}' | head -1)
                if [ -n "$FRONTEND_PID" ]; then
                    echo "Frontend started with PID: $FRONTEND_PID"
                fi
            fi
        fi
    else
        echo "[ERROR] Next.js is not installed or dependencies are missing"
        echo "Frontend cannot be started"
    fi
elif [ "$NODE_OK" = false ]; then
    echo "Frontend not started due to Node.js/npm issues"
else
    echo "TroubleMaker/troublemaker-frontend/package.json not found. Frontend not started."
fi

echo -e "\n--- Service Status ---"
# Windows-compatible process checking
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WINDIR" ]]; then
    # Windows environment (Git Bash, MSYS2, Cygwin, WSL)
    echo "Checking services on Windows..."
    
    # Check backend by port
    if netstat -an 2>/dev/null | grep -q ":8000.*LISTENING" 2>/dev/null; then
        echo "✓ Django backend appears to be running"
        echo "  Access at: http://127.0.0.1:8000/"
    else
        echo "⚠ Django backend is not running"
    fi

    # Check frontend by port
    if netstat -an 2>/dev/null | grep -q ":3000.*LISTENING" 2>/dev/null; then
        echo "✓ Next.js frontend appears to be running"  
        echo "  Access at: http://localhost:3000/"
    else
        echo "⚠ Next.js frontend is not running"
    fi
else
    # Unix-like systems (Linux, macOS)
    if ps aux | grep -E "python.*manage.py.*runserver" | grep -v grep > /dev/null; then
        echo "✓ Django backend is running"
        echo "  Access at: http://127.0.0.1:8000/"
    else
        echo "⚠ Django backend is not running"
    fi

    if ps aux | grep -E "npm.*run.*dev" | grep -v grep > /dev/null; then
        echo "✓ Next.js frontend is running"  
        echo "  Access at: http://localhost:3000/"
    else
        echo "⚠ Next.js frontend is not running"
    fi
fi

echo -e "\nTo stop services:"
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WINDIR" ]]; then
    # Windows environment
    echo "  Backend: taskkill /F /IM python.exe (if needed)"
    echo "  Frontend: taskkill /F /IM node.exe (if needed)"
    echo "  Or close the PowerShell/terminal windows manually"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "  Backend: pkill -f 'python.*manage.py.*runserver'"
    echo "  Frontend: pkill -f 'npm.*run.*dev'"
else
    # Linux
    echo "  Backend: pkill -f 'manage.py runserver'"
    echo "  Frontend: pkill -f 'npm run dev'"
fi

echo -e "\nOS detected: $(detect_os)"
echo "Python version: $PYTHON_VERSION"
if [ "$NODE_DEPS_OK" = true ]; then
    echo "Node.js version: $NODE_VERSION"
fi
