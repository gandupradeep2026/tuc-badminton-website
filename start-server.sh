#!/usr/bin/env bash
# TU Chemnitz Badminton - Laptop Home Server Startup Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/backend" || exit 1

echo "======================================================================"
echo "   🏸 TU CHEMNITZ BADMINTON COMMUNITY - HOME SERVER LAUNCHER"
echo "   Sporthalle Thüringer Weg 11 • 12 Badminton-Spielfelder"
echo "======================================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js could not be found. Please install Node.js: https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[SETUP] Installing dependencies in backend..."
    npm install
fi

mkdir -p data uploads

echo "Select launch mode:"
echo "  [1] Standard: Run on http://localhost:5000"
echo "  [2] Cloudflare Tunnel: Run backend + public HTTPS URL"
echo "  [3] localtunnel: Run backend + npx localtunnel"
echo ""
read -r -p "Selection (1, 2 or 3) [Default: 1]: " MODE

MODE=${MODE:-1}

if [ "$MODE" = "2" ]; then
    echo "[TUNNEL] Starting Cloudflare Quick Tunnel..."
    cloudflared tunnel --url http://localhost:5000 &
    node server.js
elif [ "$MODE" = "3" ]; then
    echo "[TUNNEL] Starting localtunnel..."
    npx localtunnel --port 5000 &
    node server.js
else
    node server.js
fi
