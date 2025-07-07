# —————— Prerequisites & Dependency Checks ——————

# 1. Check for Python
if (-not (Get-Command python -ErrorAction SilentlyContinue) -and -not (Get-Command python3 -ErrorAction SilentlyContinue)) {
    Write-Host 'Python is not installed. Please install it to continue.' -ForegroundColor Red
    Write-Host 'https://www.python.org/downloads/' -ForegroundColor Yellow
    exit 1
}

# 2. Check for Node.js & npm
if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js and/or npm is not installed. Please install it to continue.' -ForegroundColor Red
    Write-Host 'https://nodejs.org/' -ForegroundColor Yellow
    exit 1
}

# 3. Create venv if needed
if (-not (Test-Path '.\.venv')) {
    Write-Host 'Creating Python virtual environment...' -ForegroundColor Yellow
    python -m venv .venv
    if (-not $?) {
        Write-Host 'Failed to create virtual environment.' -ForegroundColor Red
        exit 1
    }
}

# 4. Resolve executables
$venvPath = '.\.venv\Scripts'
$absolutePython = (Resolve-Path "$venvPath\python.exe").Path
$absolutePip = (Resolve-Path "$venvPath\pip.exe").Path

if (-not (Test-Path $absolutePython)) {
    Write-Host 'Could not find python.exe in .venv\Scripts.' -ForegroundColor Red
    exit 1
}

# 5. Install Python deps
if (Test-Path 'mysite/requirements.txt') {
    & $absolutePip install -r mysite/requirements.txt
}

# 6. Install Node deps
if (Test-Path 'TroubleMaker/package.json') {
    Push-Location TroubleMaker
    npm install
    Pop-Location
}
if (Test-Path 'TroubleMaker/troublemaker-frontend/package.json') {
    Push-Location TroubleMaker/troublemaker-frontend
    npm install
    Pop-Location
}

# —————— Launch Both as Background Jobs ——————

Write-Host ''
Write-Host 'Starting both servers as background jobs...' -ForegroundColor Cyan

# --- Launch Backend in new PowerShell window ---
if (Test-Path 'mysite/apiBack/manage.py') {
    $backendPath = (Resolve-Path 'mysite/apiBack').Path
    Start-Process powershell -ArgumentList @(
        '-NoExit',
        '-Command',
        "cd '$backendPath'; & '$absolutePython' manage.py runserver 8000"
    ) -WindowStyle Normal
    Write-Host "✓ Backend started in new PowerShell window" -ForegroundColor Green
}
else {
    Write-Host '✗ mysite/apiBack/manage.py not found; backend not started.' -ForegroundColor Red
}

# --- Launch Frontend in new PowerShell window ---
if (Test-Path 'TroubleMaker/troublemaker-frontend/package.json') {
    $frontendPath = (Resolve-Path 'TroubleMaker/troublemaker-frontend').Path
    Start-Process powershell -WorkingDirectory $frontendPath -ArgumentList @(
        '-NoExit',
        '-Command',
        "npm run dev; Read-Host 'Press Enter to exit'"
    ) -WindowStyle Normal
    Write-Host "✓ Frontend started in new PowerShell window" -ForegroundColor Green
}
else {
    Write-Host '✗ TroubleMaker/troublemaker-frontend/package.json not found; frontend not started.' -ForegroundColor Red
}

Write-Host ''
Write-Host 'Servers are starting in separate windows. You can close this window.' -ForegroundColor Yellow
