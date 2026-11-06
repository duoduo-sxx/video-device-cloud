@echo off
setlocal

rem ============================================================
rem  MirrorField - Windows portable build (single exe)
rem  Usage: double click, or run "pack-win.bat" in cmd
rem  Requires: Node.js 18+ and ssh/npm network access
rem ============================================================

echo [1/4] configure electron mirrors
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"

echo [2/4] npm install
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail

echo [3/4] npm run build
call npm run build
if errorlevel 1 goto :fail

echo [4/4] resolve electron version and pack
set "ELECTRON_VERSION="
for /f "delims=" %%i in ('npm view electron version') do set "ELECTRON_VERSION=%%i"
if not defined ELECTRON_VERSION (
  echo [warn] npm view electron version failed, fallback to 33.2.0
  set "ELECTRON_VERSION=33.2.0"
)
echo electron version: %ELECTRON_VERSION%

set "PACK_OUTPUT=release-retry-%RANDOM%"
echo output dir: %PACK_OUTPUT%

call npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml -c.electronVersion=%ELECTRON_VERSION% -c.directories.output=%PACK_OUTPUT%
if errorlevel 1 goto :fail

echo.
echo build ok: %CD%\%PACK_OUTPUT%
dir /b "%PACK_OUTPUT%\*.exe"
goto :eof

:fail
echo.
echo build failed, see log above
exit /b 1
