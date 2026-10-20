/**
 * Windows 便携版单文件 exe 打包脚本
 * ---------------------------------------------------------------------------
 * 特点：electron 与 electron-builder 都不写进项目依赖，打包时按需拉取，
 *      避免 Web 工程的 node_modules 被桌面端依赖污染。
 *
 * 等价的手工命令（Windows cmd）：
 *   set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
 *   set NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
 *   set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
 *   npm install && npm run build
 *   for /f "delims=" %i in ('npm view electron version') do set ELECTRON_VERSION=%i
 *   npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml -c.electronVersion=%ELECTRON_VERSION%
 *
 * 用法：npm run pack:win         （需在 Windows 主机或已装 wine 的环境执行）
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const isWindows = process.platform === 'win32'

const env = {
  ...process.env,
  // 国内网络下从 npmmirror 拉取 Electron 与相关二进制
  ELECTRON_MIRROR: process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/',
  NPM_CONFIG_ELECTRON_MIRROR:
    process.env.NPM_CONFIG_ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR:
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||
    'https://npmmirror.com/mirrors/electron-builder-binaries/'
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env,
    shell: isWindows, // Windows 下 npm / npx 是 .cmd，需要走 shell
    ...options
  })
  if (result.error) throw result.error
  return result.status ?? 1
}

function resolveElectronVersion() {
  const result = spawnSync('npm', ['view', 'electron', 'version'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env,
    shell: isWindows
  })
  if (result.error) throw result.error
  const version = (result.stdout || '').trim()
  if (!version) {
    throw new Error('未能获取 Electron 版本，请检查网络或手动指定 ELECTRON_VERSION 环境变量。')
  }
  return process.env.ELECTRON_VERSION || version
}

try {
  if (!existsSync(path.join(projectRoot, 'dist', 'index.html'))) {
    throw new Error('未找到 dist/index.html，请先执行 vite build（npm run build）。')
  }

  const electronVersion = resolveElectronVersion()
  console.log(`\n>>> 使用 Electron ${electronVersion} 打包 Windows 便携版\n`)

  const args = [
    '--yes',
    'electron-builder@latest',
    '--win',
    'portable',
    '--x64',
    '--config',
    'electron-builder.yml',
    `-c.electronVersion=${electronVersion}`
  ]

  let outputDir = 'release'
  let code = run('npx', [...args, `-c.directories.output=${outputDir}`])

  if (code !== 0) {
    // 换输出目录重试一次：常见于目标目录被占用、杀毒软件正在扫描等情况
    outputDir = `release-retry-${Date.now()}`
    console.log(`\n>>> 首次打包失败，换输出目录 ${outputDir} 重试一次\n`)
    code = run('npx', [...args, `-c.directories.output=${outputDir}`])
  }

  if (code !== 0) {
    throw new Error(`electron-builder 打包失败（退出码 ${code}）`)
  }

  console.log(`\n>>> 打包完成，产物位于 ${outputDir}/ 目录\n`)
} catch (error) {
  console.error(`\n[打包失败] ${(error && error.message) || error}\n`)
  process.exit(1)
}
