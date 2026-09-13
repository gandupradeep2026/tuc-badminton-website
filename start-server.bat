@echo off
TITLE TU Chemnitz Badminton - Laptop Home Server
COLOR 0A
chcp 65001 >nul

echo ======================================================================
echo    🏸 TU CHEMNITZ BADMINTON COMMUNITY - HOME SERVER LAUNCHER
echo    Sporthalle Thüringer Weg 11 • 12 Badminton-Spielfelder
echo ======================================================================
echo.

cd /d "%~dp0backend"

:: Check if Node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    COLOR 0C
    echo [FEHLER] Node.js wurde nicht gefunden! Bitte installieren Sie Node.js: https://nodejs.org
    pause
    exit /b 1
)

:: Check if backend dependencies are installed
if not exist "node_modules\" (
    echo [SETUP] Installiere Server-Abhängigkeiten in /backend...
    call npm install
    echo [OK] Abhängigkeiten erfolgreich installiert.
    echo.
)

:: Check database directory
if not exist "data\" mkdir data
if not exist "uploads\" mkdir uploads

echo Wählen Sie Ihren Startmodus:
echo   [1] Standard: Backend auf Port 5000 starten (Lokales Netzwerk)
echo   [2] Cloudflare Quick Tunnel: Backend starten + Kostenlose HTTPS-URL generieren
echo   [3] localtunnel: Backend starten + freie HTTPS-URL über npx localtunnel
echo.
set /p MODE="Auswahl (1, 2 oder 3) [Standard: 1]: "

if "%MODE%"=="" set MODE=1

echo.
echo ======================================================================
echo [START] Starte TU Chemnitz Badminton API auf Port 5000...
echo 🔒 Passwort-Reset Bestätigungscodes (OTP) werden hier im Fenster angezeigt.
echo ======================================================================
echo.

if "%MODE%"=="2" (
    start "TUC Badminton - Cloudflare Tunnel" cmd /k "cloudflared tunnel --url http://localhost:5000"
    node server.js
) else if "%MODE%"=="3" (
    start "TUC Badminton - localtunnel" cmd /k "npx localtunnel --port 5000"
    node server.js
) else (
    node server.js
)

pause
