#!/usr/bin/env node
/**
 * 一键打包 Windows 便携版（跨平台脚本，等价于 README 中的手工命令）：
 *
 *   set ELECTRON_MIRROR=...
 *   set NPM_CONFIG_ELECTRON_MIRROR=...
 *   set ELECTRON_BUILDER_BINARIES_MIRROR=...
 *   npm install
 *   npm run build
 *   for /f ... in ('npm view electron version') ...   ← 自动解析 electron 版本
 *   npx electron-builder --win portable --x64 --config electron-builder.yml ...
 *
 * 用法：npm run dist:win   （可选参数 -- --nsis 改打安装包）
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'

const mirrorEnv = {
  ...process.env,
  ELECTRON_MIRROR: 'https://npmmirror.com/mirrors/electron/',
  NPM_CONFIG_ELECTRON_MIRROR: 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR: 'https://npmmirror.com/mirrors/electron-builder-binaries/',
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts })
  if (r.status !== 0) {
    console.error(`\n✗ 命令失败：${cmd} ${args.join(' ')}`)
    process.exit(r.status ?? 1)
  }
}

console.log('▶ [1/4] npm install（国内镜像环境变量已注入）')
run(npmCmd, ['install', '--no-audit', '--no-fund'], { env: mirrorEnv })

console.log('▶ [2/4] npm run build（类型检查 + Vite 构建）')
run(npmCmd, ['run', 'build'], { env: mirrorEnv })

console.log('▶ [3/4] 解析 Electron 版本（npm view electron version）')
const ver = spawnSync(npmCmd, ['view', 'electron', 'version'], { encoding: 'utf8', env: mirrorEnv })
if (ver.status !== 0 || !ver.stdout) {
  console.error('✗ 无法获取 electron 版本，请检查网络或手动指定 -c.electronVersion')
  process.exit(1)
}
const electronVersion = ver.stdout.trim()
console.log(`  electronVersion = ${electronVersion}`)

const outDir = `release-${Date.now()}`
mkdirSync(path.join(root, outDir), { recursive: true })

const targets = process.argv.slice(2)
const targetArgs = targets.length ? targets : ['--win', 'portable', '--x64']

const ELECTRON_BUILDER_VERSION = process.env.ELECTRON_BUILDER_VERSION || '26.18.0'

// 关键：在 Windows 上用 `-c.xxx=yyy` 覆盖配置，会被 electron-builder 误判成“配置文件路径”
// （报错 ENOENT ...\.directories.output=release），所以这里生成一份临时配置，命令行只传 --config。
const baseCfg = readFileSync(path.join(root, 'electron-builder.yml'), 'utf8')
const ciCfg = baseCfg.replace(/^(\s*)output:.*$/m, `$1output: ${outDir}`) + `\nelectronVersion: ${electronVersion}\n`
writeFileSync(path.join(root, 'electron-builder.ci.yml'), ciCfg)

console.log(`▶ [4/4] electron-builder@${ELECTRON_BUILDER_VERSION} ${targetArgs.join(' ')} → ./${outDir}`)
run(
  npxCmd,
  [
    '--yes',
    `electron-builder@${ELECTRON_BUILDER_VERSION}`,
    ...targetArgs,
    '--config', 'electron-builder.ci.yml',
    '--publish', 'never',
  ],
  { env: mirrorEnv },
)

console.log(`\n✓ 打包完成：${root}\\${outDir}\\AV-Repair-Studio-1.0.0-portable-x64.exe`)
