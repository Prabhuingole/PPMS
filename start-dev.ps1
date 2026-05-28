# ============================================================
# Sambhav PMS - Dev Startup Script
# Run this from the project root: .\start-dev.ps1
# ============================================================

function Test-PortInUse {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return ($conn -ne $null)
}

function Get-ProcessOnPort {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        return $proc
    }
    return $null
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Sambhav PMS - Dev Server Launcher" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- Check Frontend ports ---
Write-Host "--- Frontend Port Check ---" -ForegroundColor Yellow
$frontendPort = $null
foreach ($port in @(3000, 3001, 3002)) {
    if (Test-PortInUse -Port $port) {
        $proc = Get-ProcessOnPort -Port $port
        Write-Host "  ❌ Port $port is BUSY" -ForegroundColor Red -NoNewline
        if ($proc) { Write-Host " (used by: $($proc.Name) PID:$($proc.Id))" -ForegroundColor DarkRed }
        else { Write-Host "" }
    } else {
        Write-Host "  ✅ Port $port is FREE" -ForegroundColor Green
        if ($null -eq $frontendPort) { $frontendPort = $port }
    }
}

Write-Host ""
Write-Host "--- Backend Port Check ---" -ForegroundColor Yellow
$backendPort = $null
foreach ($port in @(8000, 8001)) {
    if (Test-PortInUse -Port $port) {
        $proc = Get-ProcessOnPort -Port $port
        Write-Host "  ❌ Port $port is BUSY" -ForegroundColor Red -NoNewline
        if ($proc) { Write-Host " (used by: $($proc.Name) PID:$($proc.Id))" -ForegroundColor DarkRed }
        else { Write-Host "" }
    } else {
        Write-Host "  ✅ Port $port is FREE" -ForegroundColor Green
        if ($null -eq $backendPort) { $backendPort = $port }
    }
}

Write-Host ""

if ($null -eq $frontendPort) {
    Write-Host "❌ ERROR: All frontend ports (3000, 3001, 3002) are busy!" -ForegroundColor Red
    Write-Host "   Run: Get-NetTCPConnection -LocalPort 3000,3001,3002 | Select-Object LocalPort,OwningProcess" -ForegroundColor Yellow
    exit 1
}

if ($null -eq $backendPort) {
    Write-Host "❌ ERROR: All backend ports (8000, 8001) are busy!" -ForegroundColor Red
    Write-Host "   Run: Get-NetTCPConnection -LocalPort 8000,8001 | Select-Object LocalPort,OwningProcess" -ForegroundColor Yellow
    exit 1
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Frontend  → http://localhost:$frontendPort" -ForegroundColor Green
Write-Host "  Backend   → http://localhost:$backendPort" -ForegroundColor Green
Write-Host "  API Docs  → http://localhost:$backendPort/docs" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- Update .env.local if backend port changed ---
$envPath = Join-Path $PSScriptRoot "PMS-Frontend\.env.local"
$envContent = "NEXT_PUBLIC_API_URL=http://localhost:$backendPort`n"
Set-Content -Path $envPath -Value $envContent
Write-Host "  ✅ .env.local updated: NEXT_PUBLIC_API_URL=http://localhost:$backendPort" -ForegroundColor Green
Write-Host ""

# --- Launch Backend ---
$backendPath = Join-Path $PSScriptRoot "PMS-backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting Backend on port $backendPort...' -ForegroundColor Cyan; .\.venv\Scripts\python -m uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port $backendPort"

Start-Sleep -Seconds 2

# --- Launch Frontend ---
$frontendPath = Join-Path $PSScriptRoot "PMS-Frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Starting Frontend on port $frontendPort...' -ForegroundColor Cyan; npm run dev -- --port $frontendPort --hostname 0.0.0.0"

Write-Host "✅ Both servers launched in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "Open in browser: http://localhost:$frontendPort" -ForegroundColor Cyan
Write-Host ""
