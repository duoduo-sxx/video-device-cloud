@echo off
chcp 65001 >nul
REM 一键打包 Windows 免安装版（portable x64）
REM 前置：已安装 Node.js 18+，在项目根目录双击或在 cmd 中执行本脚本

set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"

echo [1/4] 安装依赖...
call npm install || goto :error

echo [2/4] 构建前端产物...
call npm run build || goto :error

echo [3/4] 获取 Electron 版本...
for /f "delims=" %%i in ('npm view electron version') do set "ELECTRON_VERSION=%%i"
echo     Electron: %ELECTRON_VERSION%

echo [4/4] 打包 portable x64...
set "PACK_OUTPUT=release-retry-%RANDOM%"
call npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml -c.electronVersion=%ELECTRON_VERSION% -c.directories.output=%PACK_OUTPUT% || goto :error

echo.
echo 打包完成，产物目录：%PACK_OUTPUT%
exit /b 0

:error
echo.
echo 打包失败，请查看上方日志。
exit /b 1
