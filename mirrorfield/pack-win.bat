@echo off
setlocal

rem ============================================================
rem  MirrorField - Windows portable build (single exe)
rem  Usage: double click, or run "pack-win.bat" in cmd
rem  Requires: Node.js 22+ and npm network access
rem
rem  NOTE: electron-builder 26 removed the "-c.key=value" override form.
rem  All options now live in electron-builder.yml; only electronVersion is
rem  merged in at build time via a generated config copy.
rem ============================================================

echo [1/5] configure electron mirrors
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"
set "CSC_IDENTITY_AUTO_DISCOVERY=false"

echo [2/5] npm install
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail

echo [3/5] npm run build
call npm run build
if errorlevel 1 goto :fail

echo [4/5] resolve electron version and generate config
set "ELECTRON_VERSION="
for /f "delims=" %%i in ('npm view electron version') do set "ELECTRON_VERSION=%%i"
if not defined ELECTRON_VERSION (
  echo [warn] npm view electron version failed, fallback to 33.2.0
  set "ELECTRON_VERSION=33.2.0"
)
echo electron version: %ELECTRON_VERSION%

copy /y electron-builder.yml electron-builder.ci.yml >nul
(echo electronVersion: %ELECTRON_VERSION%)>> electron-builder.ci.yml
echo --- electron-builder.ci.yml ---
type electron-builder.ci.yml

echo [5/5] electron-builder
call npx --yes electron-builder@latest --win portable --x64 --config electron-builder.ci.yml --publish never
if errorlevel 1 goto :fail

echo.
echo build ok: %CD%\release
dir /b "release\*.exe"
goto :eof

:fail
echo.
echo build failed, see log above
exit /b 1
