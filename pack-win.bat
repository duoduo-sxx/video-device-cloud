@echo off
rem ============================================================
rem 云枢 DataRelay · Windows 本地打包脚本（cmd 直接运行）
rem 用法：双击或在本目录执行 pack-win.bat
rem 产物：release-xxxx\YunShu-DataRelay-<version>-portable-x64.exe
rem ============================================================
setlocal

set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"

echo [1/3] 安装依赖...
call npm install || goto :fail

echo [2/3] 构建前端产物...
call npm run build || goto :fail

echo [3/3] 读取 Electron 版本并打包便携版...
for /f "delims=" %%i in ('npm view electron version') do set "ELECTRON_VERSION=%%i"
set "PACK_OUTPUT=release-retry-%RANDOM%"

npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml -c.electronVersion=%ELECTRON_VERSION% -c.directories.output=%PACK_OUTPUT% || goto :fail

echo.
echo 打包完成，输出目录：%PACK_OUTPUT%
goto :eof

:fail
echo.
echo 打包失败，请检查上方错误信息。
exit /b 1
