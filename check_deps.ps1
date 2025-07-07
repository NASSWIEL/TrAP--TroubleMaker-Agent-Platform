# Check for Python first
if (-not (Get-Command python -ErrorAction SilentlyContinue) -and -not (Get-Command python3 -ErrorAction SilentlyContinue)) {
    Write-Host "Python is not installed. Please install it to continue." -ForegroundColor Red
    Write-Host "Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed. Please install it to continue." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed. Please install it to continue." -ForegroundColor Red
    exit 1
}

# PowerShell script to check if dependencies are installed

# Ensure virtual environment exists
if (-not (Test-Path ".\.venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
    if (-not $?) {
        Write-Host "Failed to create virtual environment. Please check Python installation." -ForegroundColor Red
        exit 1
    }
}

# Define paths for virtual environment
$venvPath = ".\.venv\Scripts"
$pythonExe = "$venvPath\python.exe"
$pipExe = "$venvPath\pip.exe"

# Convert to absolute paths to avoid issues when changing directories
$absolutePythonExe = (Resolve-Path $pythonExe -ErrorAction SilentlyContinue).Path
$absolutePipExe = (Resolve-Path $pipExe -ErrorAction SilentlyContinue).Path

if (-not $absolutePythonExe -or -not (Test-Path $absolutePythonExe)) {
    Write-Host "Virtual environment Python executable not found at $pythonExe" -ForegroundColor Red
    exit 1
}

Write-Host "Checking Python dependencies from req.txt..."
if (Test-Path req.txt) {
    if (Test-Path $absolutePipExe) {
        & $absolutePipExe check | Out-Host
    }
    else {
        Write-Host "Virtual environment pip not found at $pipExe"
    }
}
else {
    Write-Host "req.txt not found."
}

Write-Host "Checking Python dependencies from mysite/requirements.txt..."
if (Test-Path "mysite/requirements.txt") {
    if (Test-Path $absolutePipExe) {
        & $absolutePipExe check | Out-Host
    }
    else {
        Write-Host "Virtual environment pip not found at $pipExe"
    }
}
else {
    Write-Host "mysite/requirements.txt not found."
}

Write-Host "Checking Pipenv environment in root..."
if (Test-Path Pipfile) {
    Write-Host "Installing Python dependencies from Pipfile..."
    pipenv install --dev
}
else {
    Write-Host "Pipfile not found in root."
}

Write-Host "Installing Python dependencies from mysite/requirements.txt..."
if (Test-Path "mysite/requirements.txt") {
    if (Test-Path $absolutePipExe) {
        & $absolutePipExe install -r mysite/requirements.txt
    }
    else {
        Write-Host "Virtual environment pip not found at $pipExe"
    }
}
else {
    Write-Host "mysite/requirements.txt not found."
}

Write-Host "Installing Node.js dependencies in TroubleMaker..."
if (Test-Path "TroubleMaker/package.json") {
    Push-Location TroubleMaker
    npm install
    Pop-Location
}
else {
    Write-Host "TroubleMaker/package.json not found."
}

Write-Host "Checking Node.js dependencies in troublemaker-frontend..."
if (Test-Path "TroubleMaker/troublemaker-frontend/package.json") {
    Push-Location TroubleMaker/troublemaker-frontend
    Write-Host "Installing Node.js dependencies from TroubleMaker/troublemaker-frontend/package.json..."
    npm install
    Pop-Location
}
else {
    Write-Host "TroubleMaker/troublemaker-frontend/package.json not found."
}

Write-Host ""
Write-Host "--- Launching Backend (Django) ---" -ForegroundColor Green
if (Test-Path "mysite/apiBack/manage.py") {
    Write-Host "Starting Django backend..."
    try {
        $workingDir = Get-Location
        Start-Process powershell -ArgumentList @(
            '-NoExit',
            '-Command',
            "cd '$workingDir'; & '$absolutePythonExe' -m pip install -r mysite/requirements.txt -q; cd mysite/apiBack; & '$absolutePythonExe' manage.py runserver 8000"
        ) -WindowStyle Normal
        Write-Host "✓ Django backend process started (check new PowerShell window)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed to start Django backend: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "✗ mysite/apiBack/manage.py not found. Backend not started." -ForegroundColor Red
}

Write-Host ""
Write-Host "--- Launching Frontend (Next.js) ---" -ForegroundColor Green
if (Test-Path "TroubleMaker/troublemaker-frontend/package.json") {
    Write-Host "Starting Next.js frontend..."
    try {
        $workingDir = Get-Location
        Start-Process powershell -ArgumentList @(
            '-NoExit',
            '-Command',
            "cd '$workingDir/TroubleMaker/troublemaker-frontend'; npm install --silent; npm run dev"
        ) -WindowStyle Normal
        Write-Host "✓ Next.js frontend process started (check new PowerShell window)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed to start Next.js frontend: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "✗ TroubleMaker/troublemaker-frontend/package.json not found. Frontend not started." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "✓ Dependencies checked and installed" -ForegroundColor Green
Write-Host "✓ Services are starting in separate windows" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Note: Allow a few moments for the servers to fully start up." -ForegroundColor Gray
