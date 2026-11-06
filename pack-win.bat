@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

rem ===========================================================================
rem  Immersive Intelligent Control HMI - Windows portable packaging
rem  Requires: Node.js 18+ (npm)
rem  Usage:    double-click this file, or run "pack-win.bat" inside cmd
rem  Note:     electron is NOT a project dependency. The version is resolved
rem            from the npm registry and injected via -c.electronVersion.
rem ===========================================================================

cd /d "%~dp0"

echo [1/4] Configuring Electron / electron-builder mirrors...
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"

if not exist "node_modules" (
  echo [2/4] Installing dependencies... this may take a few minutes
  call npm install
  if errorlevel 1 goto :fail
) else (
  echo [2/4] node_modules already exists, skipping install
)

echo [3/4] Building frontend with Vite...
call npm run build
if errorlevel 1 goto :fail

if not exist "dist\index.html" (
  echo [ERROR] dist\index.html not found - build did not produce output.
  goto :fail
)

echo [4/4] Packaging Windows portable executable...
for /f "delims=" %%i in ('npm view electron version') do set "ELECTRON_VERSION=%%i"
if "%ELECTRON_VERSION%"=="" (
  echo [ERROR] Unable to resolve electron version from npm registry.
  goto :fail
)
echo       electron version : %ELECTRON_VERSION%

set "PACK_OUTPUT=release-retry-%RANDOM%"
echo       output directory : %PACK_OUTPUT%

npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml -c.electronVersion=%ELECTRON_VERSION% -c.directories.output=%PACK_OUTPUT%
if errorlevel 1 goto :fail

echo.
echo [OK] Package created:
for %%f in ("%PACK_OUTPUT%\*.exe") do echo       %%~nxf  (%%~zf bytes)
echo.
echo Location: %CD%\%PACK_OUTPUT%
echo.
pause
exit /b 0

:fail
echo.
echo [FAILED] Packaging aborted. Please check the messages above.
echo.
pause
exit /b 1
