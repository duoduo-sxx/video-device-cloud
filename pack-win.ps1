# 数据云端协同优化传输平台 · Windows 便携版一键打包（PowerShell）
#
# 用法：
#   powershell -ExecutionPolicy Bypass -File .\pack-win.ps1
#   powershell -ExecutionPolicy Bypass -File .\pack-win.ps1 --output release-test
#
# 说明：脚本只做「装依赖 → 构建 → 调 scripts/pack-win.mjs」，
# 真正的 electron-builder 参数由 Node 脚本统一拼装，避免 PowerShell
# 把 -c.directories.output=xxx 当成配置文件路径（会报 ENOENT）。

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
$env:NPM_CONFIG_ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
$env:ELECTRON_BUILDER_BINARIES_MIRROR = 'https://npmmirror.com/mirrors/electron-builder-binaries/'

if (-not (Test-Path 'node_modules')) {
    Write-Host '[1/3] 安装依赖...'
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host '[1/3] 依赖已存在，跳过 npm install'
}

Write-Host '[2/3] 构建前端...'
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '[3/3] 打包 Windows 便携版...'
node scripts/pack-win.mjs @args
exit $LASTEXITCODE
