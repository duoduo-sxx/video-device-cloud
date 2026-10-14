@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================================
echo   视频设备云数据服务系统 - Windows 便携版单文件 exe 打包
echo ============================================================
echo.

echo [1/5] 配置 Electron / electron-builder 国内镜像...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [2/5] 安装依赖...
call npm install
if errorlevel 1 goto :fail

echo [3/5] 构建前端产物...
call npm run build
if errorlevel 1 goto :fail

echo [4/5] 解析 Electron 版本...
for /f "delims=" %%i in ('npm view electron version') do set ELECTRON_VERSION=%%i
echo       Electron 版本: %ELECTRON_VERSION%

echo [5/5] 打包 Windows 便携版单文件 exe...
call npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml -c.electronVersion=%ELECTRON_VERSION%
if errorlevel 1 goto :fail

echo.
echo 打包完成，产物位于 release\ 目录：
dir /b release\*.exe
echo.
goto :eof

:fail
echo.
echo 打包失败，请检查上方日志。
exit /b 1
