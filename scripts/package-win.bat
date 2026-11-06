@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."

REM MediaForge 智媒工场 —— Windows 本地打包脚本（等价于仓库 workflow 的步骤）
REM 用法：在 Windows 上双击或 cmd 执行 scripts\package-win.bat

set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"

echo [1/3] 安装依赖...
call npm install
if errorlevel 1 goto :fail

echo [2/3] 构建前端产物...
call npm run build
if errorlevel 1 goto :fail

echo [3/3] 打包 Windows 便携版（win portable x64）...
for /f "delims=" %%i in ('npm view electron version') do set "ELECTRON_VERSION=%%i"
set "PACK_OUTPUT=release-retry-%RANDOM%"
call npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml -c.electronVersion=%ELECTRON_VERSION% -c.directories.output=%PACK_OUTPUT%
if errorlevel 1 goto :fail

echo.
echo 打包完成，产物目录：%PACK_OUTPUT%
echo 便携版可执行文件：%PACK_OUTPUT%\MediaForge-*-portable-x64.exe
goto :eof

:fail
echo.
echo 打包失败，请检查上方日志。
exit /b 1
