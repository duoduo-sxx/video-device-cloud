#!/usr/bin/env node
/**
 * 跨 shell 的 Windows 便携版打包脚本（CMD / PowerShell / bash 都能直接跑）
 *
 *   node scripts/pack-win.mjs                        # 输出到 release/
 *   node scripts/pack-win.mjs --output release-test  # 自定义输出目录
 *   node scripts/pack-win.mjs --electron-version 45.2.3
 *   node scripts/pack-win.mjs --dry-run              # 只打印将要执行的命令
 *
 * 为什么需要这个脚本：electron-builder 的 `-c.xxx=yyy` 短别名覆盖
 * 在 PowerShell 下会被 yargs 当成 `--config` 的又一个配置文件路径
 * （源码里是 newConfig.extends = configItem），最终报
 *   ENOENT: open '...\.directories.output=release'
 * 所以这里改成生成一份 extends 基础配置的临时配置，只用 `--config` 传参。
 *
 * 项目不引入 electron / electron-builder 依赖，运行时用 npx 临时拉取。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const npx = isWin ? 'npx.cmd' : 'npx';
const npm = isWin ? 'npm.cmd' : 'npm';

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(`--${flag}`);
const getArg = (name) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return null;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : null;
};

const output = getArg('output') ?? 'release';
const dryRun = has('dry-run');
let electronVersion = getArg('electron-version');

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

// Node 版本提示：electron-builder@latest(26.x) 依赖的 @electron/rebuild 要求 Node >= 22.12
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 22) {
  console.warn(
    `! 当前 Node ${process.versions.node}，electron-builder@latest 的依赖要求 Node >= 22.12，` +
      '建议升级到 Node 22 LTS 或 24。若打包过程报奇怪的模块错误，优先怀疑这里。',
  );
}

if (!existsSync(join(root, 'dist', 'index.html'))) {
  fail('未找到 dist/index.html，请先执行 npm install && npm run build');
}

if (!electronVersion) {
  process.stdout.write('→ 查询最新 Electron 版本… ');
  const r = spawnSync(npm, ['view', 'electron', 'version'], {
    cwd: root,
    encoding: 'utf8',
    shell: isWin,
  });
  const lines = (r.stdout || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => /^\d+\.\d+\.\d+/.test(s));
  electronVersion = lines.at(-1);
  if (!electronVersion) {
    fail('获取 Electron 版本失败，可手动指定：node scripts/pack-win.mjs --electron-version 38.2.5');
  }
  console.log(electronVersion);
}

// 生成临时配置：extends 基础配置，覆盖 electron 版本与输出目录
const cfgPath = join(root, 'electron-builder.generated.yml');
const cfg = [
  '# 由 scripts/pack-win.mjs 自动生成，请勿手工修改',
  'extends: ./electron-builder.yml',
  `electronVersion: ${electronVersion}`,
  'directories:',
  `  output: ${JSON.stringify(output)}`,
  '  buildResources: build',
  '',
].join('\n');
writeFileSync(cfgPath, cfg, 'utf8');

const env = {
  ...process.env,
  ELECTRON_MIRROR: process.env.ELECTRON_MIRROR ?? 'https://npmmirror.com/mirrors/electron/',
  NPM_CONFIG_ELECTRON_MIRROR:
    process.env.NPM_CONFIG_ELECTRON_MIRROR ?? 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR:
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR ??
    'https://npmmirror.com/mirrors/electron-builder-binaries/',
};

const args = [
  '--yes',
  'electron-builder@latest',
  '--win',
  'portable',
  '--x64',
  '--config',
  cfgPath,
  '--publish',
  'never',
];

console.log(`\n→ Electron ${electronVersion}  ·  输出目录 ${output}\n  ${npx} ${args.join(' ')}\n`);

if (dryRun) {
  console.log('--dry-run：已生成配置，未执行打包。配置内容：\n');
  console.log(cfg);
  process.exit(0);
}

const r = spawnSync(
  npx,
  // Windows 下 npx 是 .cmd，必须走 shell；shell 模式下带空格的路径需要自己加引号
  args.map((a) => (isWin && /\s/.test(a) ? `"${a}"` : a)),
  { cwd: root, stdio: 'inherit', env, shell: isWin },
);
if (r.status !== 0) {
  fail(`electron-builder 退出码 ${r.status ?? r.signal}，请查看上方日志`);
}

// 汇总产物
const outAbs = resolve(root, output);
const exes = [];
const walk = (dir, depth = 0) => {
  if (!existsSync(dir) || depth > 2) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, depth + 1);
    else if (name.endsWith('.exe')) exes.push({ p, mb: (st.size / 1024 / 1024).toFixed(1) });
  }
};
walk(outAbs);

if (exes.length === 0) {
  fail(`打包结束但 ${output} 下没有 exe`);
}
console.log('\n✓ 打包完成：');
for (const { p, mb } of exes) console.log(`  ${p}  (${mb} MB)`);
