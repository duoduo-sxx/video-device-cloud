@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo ============================================================
echo   NexusPlay 游戏开发管理平台 - Windows 便携版单文件 exe 打包
echo ============================================================
echo.

echo [1/5] 配置 Electron / electron-builder 国内镜像...
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"

echo [2/5] 安装依赖（仅 Web 工程依赖，不含 electron）...
call npm install
if errorlevel 1 goto :fail

echo [3/5] 构建前端产物...
call npm run build
if errorlevel 1 goto :fail

echo [4/5] 解析 Electron 版本...
for /f "delims=" %%i in ('npm view electron version') do set "ELECTRON_VERSION=%%i"
echo       Electron 版本: %ELECTRON_VERSION%

echo [5/5] 打包 Windows 便携版单文件 exe...
call npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml -c.electronVersion=%ELECTRON_VERSION% -c.directories.output=release
if errorlevel 1 goto :retry

echo.
echo 打包完成，产物位于 release\ 目录：
dir /b release\*.exe
echo.
goto :eof

:retry
echo.
echo 首次打包失败，换输出目录再试一次（常见于目录被占用 / 杀软拦截）...
set "PACK_OUTPUT=release-retry-!RANDOM!"
call npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml -c.electronVersion=%ELECTRON_VERSION% -c.directories.output=!PACK_OUTPUT!
if errorlevel 1 goto :fail

echo.
echo 打包完成，产物位于 !PACK_OUTPUT!\ 目录：
dir /b "!PACK_OUTPUT!\*.exe"
echo.
goto :eof

:fail
echo.
echo 打包失败，请检查上方日志。
exit /b 1
