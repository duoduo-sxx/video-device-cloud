@echo off
chcp 65001 >nul
rem 惯性参数感知系统 - Windows 便携版一键打包
rem 前置条件：Node 18+ 已安装，本目录已初始化

rem 使用国内镜像，避免 electron 二进制下载失败
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"

npm install || goto :fail
npm run build || goto :fail

rem 取 Electron 最新稳定版本号（项目本身不装 electron，只在打包时指定）
for /f "delims=" %%i in ('npm view electron version') do set "ELECTRON_VERSION=%%i"
echo 使用 Electron %ELECTRON_VERSION%

set "PACK_OUTPUT=release-%RANDOM%"
npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml -c.electronVersion=%ELECTRON_VERSION% -c.directories.output=%PACK_OUTPUT% || goto :fail

echo.
echo 打包完成，输出目录：%PACK_OUTPUT%
exit /b 0

:fail
echo.
echo 打包失败，请检查上方日志
exit /b 1
