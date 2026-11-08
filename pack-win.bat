@echo off
rem 数据云端协同优化传输平台 · Windows 便携版一键打包（CMD 双击 / 命令行均可）
rem 用法：pack-win.bat                  输出到 release\
rem       pack-win.bat --output release-test --electron-version 45.2.3
setlocal
cd /d "%~dp0"

set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"

if not exist node_modules (
  echo [1/3] 安装依赖...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :err
) else (
  echo [1/3] 依赖已存在，跳过 npm install
)

echo [2/3] 构建前端...
call npm run build
if errorlevel 1 goto :err

echo [3/3] 打包 Windows 便携版...
node scripts\pack-win.mjs %*
if errorlevel 1 goto :err

echo.
echo 打包成功，产物在上面的输出目录中。
exit /b 0

:err
echo.
echo 打包失败，请查看上方日志。
exit /b 1
