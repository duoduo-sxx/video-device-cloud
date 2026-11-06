@echo off
REM ============================================================
REM 星火链证 XH-CHAIN · Windows 一键打包脚本（便携版 exe）
REM 用法：双击运行，或在命令行执行 pack-win.bat
REM ============================================================
chcp 65001 >nul
setlocal

REM 使用国内镜像加速 Electron 运行时与二进制下载
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"

echo [1/3] 安装依赖...
call npm install || goto :fail

echo [2/3] 类型检查与前端构建...
call npm run build || goto :fail

echo [3/3] 解析 Electron 版本并打包便携版...
for /f "delims=" %%i in ('npm view electron version') do set "ELECTRON_VERSION=%%i"
set "PACK_OUTPUT=release-retry-%RANDOM%"

npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml --publish never -c.electronVersion=%ELECTRON_VERSION% -c.directories.output=%PACK_OUTPUT% || goto :fail

echo.
echo 打包完成，产物目录：%PACK_OUTPUT%
goto :eof

:fail
echo.
echo 打包失败，请检查上方日志。
exit /b 1
