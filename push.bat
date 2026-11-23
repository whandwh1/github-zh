@echo off
setlocal
cd /d "%~dp0"

echo.
echo   Push github-zh to https://github.com/whandwh1/github-zh
echo   ------------------------------------------------
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] git not found.
  echo   Install Git for Windows: https://git-scm.com/download/win
  echo.
  pause
  exit /b 1
)

git push -u origin main

if errorlevel 1 (
  echo.
  echo   [FAILED] See the message above.
  echo   If it asks for a password, paste a Personal Access Token instead:
  echo   https://github.com/settings/tokens
) else (
  echo.
  echo   [OK] Pushed. Install URL:
  echo   https://raw.githubusercontent.com/whandwh1/github-zh/main/github-zh.user.js
)

echo.
echo   Press any key to close.
pause >nul
