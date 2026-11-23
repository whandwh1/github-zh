@echo off
setlocal
cd /d "%~dp0"

echo.
echo   Push github-zh to https://github.com/whandwh1/github-zh
echo   ------------------------------------------------
echo.

rem Double-clicked cmd does not inherit WorkBuddy's PATH, so locate git by absolute path first.
set "GITDIR="
for %%P in (
  "D:\Program Files\WorkBuddy\resources\vendor\PortableGit"
  "C:\Users\Administrator\.workbuddy\binaries\PortableGit\versions\1.3.0"
  "C:\Program Files\Git"
  "C:\Program Files (x86)\Git"
) do (
  if not defined GITDIR if exist "%%~P\cmd\git.exe" set "GITDIR=%%~P"
)

if defined GITDIR (
  set "PATH=%GITDIR%\cmd;%GITDIR%\mingw64\bin;%PATH%"
  echo   using git: %GITDIR%
) else (
  where git >nul 2>nul
  if errorlevel 1 (
    echo   [ERROR] git not found.
    echo   Install Git for Windows: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
  )
)

git --version
echo.
git push -u origin main

if errorlevel 1 (
  echo.
  echo   [FAILED] See the message above.
  echo   If it asks for Username/Password, use a Personal Access Token as password:
  echo   https://github.com/settings/tokens
) else (
  echo.
  echo   [OK] Pushed. Install URL:
  echo   https://raw.githubusercontent.com/whandwh1/github-zh/main/github-zh.user.js
)

echo.
echo   Press any key to close.
pause >nul
