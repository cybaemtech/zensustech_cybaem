#!/usr/bin/env pwsh
# ─────────────────────────────────────────────────────────────────────────────
#  start.ps1  -  Auto-start ZensusTech Backend + Frontend
# ─────────────────────────────────────────────────────────────────────────────
$ROOT     = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND  = Join-Path $ROOT "backend"
$FRONTEND = Join-Path $ROOT "frontend"

function Log-Step { param([string]$m) Write-Host "  -> $m" -ForegroundColor Yellow }
function Log-Ok   { param([string]$m) Write-Host "  OK $m" -ForegroundColor Green  }
function Log-Warn { param([string]$m) Write-Host "  !! $m" -ForegroundColor DarkYellow }
function Log-Err  { param([string]$m) Write-Host "  !! $m" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  =====================================================" -ForegroundColor Cyan
Write-Host "       ZensusTech  Auto-Start Launcher                  " -ForegroundColor Cyan
Write-Host "   Backend  -> http://localhost:8000                     " -ForegroundColor Cyan
Write-Host "   API Docs -> http://localhost:8000/docs                " -ForegroundColor Cyan
Write-Host "   Frontend -> http://localhost:3000                     " -ForegroundColor Cyan
Write-Host "  =====================================================" -ForegroundColor Cyan
Write-Host ""

# ── Find uv (check common locations) ─────────────────────────────────────────
Log-Step "Locating uv..."
$uvPaths = @(
    "$env:USERPROFILE\.local\bin\uv.exe",
    "$env:USERPROFILE\.cargo\bin\uv.exe",
    "$env:APPDATA\uv\uv.exe",
    "C:\ProgramData\uv\uv.exe",
    (Get-Command uv -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -EA SilentlyContinue)
) | Where-Object { $_ -and (Test-Path $_) }

if ($uvPaths.Count -gt 0) {
    $UV = $uvPaths[0]
    Log-Ok "Found uv at: $UV"
} else {
    # Try adding common uv paths to PATH and retry
    $env:PATH = "$env:USERPROFILE\.local\bin;$env:USERPROFILE\.cargo\bin;$env:PATH"
    $UV = Get-Command uv -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if (-not $UV) {
        Log-Err "uv not found. Run: pip install uv  OR  winget install astral-sh.uv"
    }
    Log-Ok "Found uv via PATH: $UV"
}

# ── Sync backend deps (skip if .venv already fresh) ──────────────────────────
$venvPython = Join-Path $BACKEND ".venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    Log-Ok ".venv exists, skipping uv sync (run manually if packages changed)"
} else {
    Log-Step "Running uv sync..."
    Push-Location $BACKEND
    & $UV sync --quiet
    if ($LASTEXITCODE -ne 0) { Log-Err "uv sync failed" }
    Log-Ok "Dependencies synced"
    Pop-Location
}

# ── Start Backend ─────────────────────────────────────────────────────────────
Log-Step "Launching FastAPI backend (port 8000)..."
$venvActivate = Join-Path $BACKEND ".venv\Scripts\Activate.ps1"
$uvPath       = $UV

$backendScript = @"
Write-Host '[BACKEND] Starting...' -ForegroundColor Cyan
Set-Location '$BACKEND'
& '$venvActivate'
fastapi dev app/main.py --host 0.0.0.0 --port 8000
"@

Start-Process powershell -ArgumentList @(
    "-NoExit", "-ExecutionPolicy", "Bypass",
    "-Command", $backendScript
) -WindowStyle Normal
Log-Ok "Backend window launched"

# ── Wait for backend ──────────────────────────────────────────────────────────
Log-Step "Waiting for backend to be ready..."
for ($i = 1; $i -le 25; $i++) {
    Start-Sleep 1
    try {
        $r = Invoke-WebRequest "http://localhost:8000/docs" -UseBasicParsing -TimeoutSec 2 -EA Stop
        if ($r.StatusCode -eq 200) { Log-Ok "Backend is ready!"; break }
    } catch {}
    Write-Host "    $i/25s..." -ForegroundColor DarkGray
    if ($i -eq 25) { Log-Warn "Backend may still be starting — check the backend window" }
}

# ── Start Frontend ────────────────────────────────────────────────────────────
Log-Step "Launching Vite frontend (port 3000)..."
if (-not (Test-Path (Join-Path $FRONTEND "node_modules"))) {
    Log-Step "Installing npm packages..."
    Push-Location $FRONTEND; npm install --silent; Pop-Location
}

$frontendScript = @"
Write-Host '[FRONTEND] Starting Vite...' -ForegroundColor Magenta
Set-Location '$FRONTEND'
npm run dev
"@

Start-Process powershell -ArgumentList @(
    "-NoExit", "-ExecutionPolicy", "Bypass",
    "-Command", $frontendScript
) -WindowStyle Normal
Log-Ok "Frontend window launched"

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "  Backend  -> http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs -> http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend -> http://localhost:3000" -ForegroundColor White
Write-Host ""

