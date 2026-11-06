/* 构建后处理：把 JS/CSS 内联进单个 HTML，便于 file:// 双击直接打开（Electron/Tauri 也可直接用） */
const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname, '..', 'dist');
const assetsDir = path.join(dist, 'assets');
const htmlPath = path.join(dist, 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('未找到 dist/index.html，请先执行 vite build');
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);
const jsFile = files.find((f) => f.endsWith('.js'));
const cssFile = files.find((f) => f.endsWith('.css'));

let html = fs.readFileSync(htmlPath, 'utf8');

if (cssFile) {
  const css = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
  html = html.replace(/<link[^>]+rel="stylesheet"[^>]*>/g, () => `<style>\n${css}\n</style>`);
}

if (jsFile) {
  const js = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');
  html = html.replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g, () => `<script type="module">\n${js}\n</script>`);
}

const out = path.join(dist, 'mediaforge.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`已生成单文件版本：${out}（${(fs.statSync(out).size / 1024 / 1024).toFixed(1)} MB）`);
