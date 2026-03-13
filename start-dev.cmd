@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

if not exist "%BACKEND%\venv\Scripts\python.exe" (
  echo [ERRO] Ambiente virtual do backend nao encontrado em "%BACKEND%\venv".
  echo Rode primeiro: backend\venv\Scripts\python -m pip install -r backend\requirements.txt
  exit /b 1
)

echo Iniciando backend na porta 8000...
start "Loja System - Backend" cmd /k "cd /d "%BACKEND%" && venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo Iniciando frontend web...
start "Loja System - Frontend" cmd /k "cd /d "%FRONTEND%" && npm.cmd run web"

echo.
echo Servicos iniciados. Aguarde alguns segundos e acesse a URL mostrada pelo Expo.
echo Se quiser, abra manualmente: http://localhost:8081
echo.

endlocal
