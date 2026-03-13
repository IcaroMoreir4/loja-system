#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [ ! -f "$BACKEND_DIR/venv/Scripts/python.exe" ]; then
  echo "[ERRO] Ambiente virtual do backend não encontrado em: $BACKEND_DIR/venv"
  echo "Instale dependências primeiro e tente novamente."
  exit 1
fi

echo "Iniciando backend na porta 8000..."
cmd.exe /c "start \"Loja System - Backend\" cmd /k \"cd /d \"$BACKEND_DIR\" && venv\\Scripts\\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000\""

echo "Iniciando frontend web..."
cmd.exe /c "start \"Loja System - Frontend\" cmd /k \"cd /d \"$FRONTEND_DIR\" && npm.cmd run web\""

echo
echo "Serviços iniciados."
echo "No Git Bash, rode: ./start-dev.sh"
echo "No PowerShell, rode: .\\start-dev.cmd"
