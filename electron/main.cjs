/**
 * 星火链证 XH-CHAIN · Electron 主进程
 *
 * 说明：
 * 1. 前端产物（dist/）是 ES Module，浏览器的 file:// 协议会因 CORS 拦截模块脚本，
 *    因此这里注册自定义协议 app://，把 dist 目录映射为标准源（standard origin）加载。
 * 2. 本项目不引入 electron 依赖（package.json 不含 electron），
 *    打包时通过命令行 -c.electronVersion 指定运行时版本，由 electron-builder 自行下载。
 */
const { app, BrowserWindow, Menu, protocol, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const APP_ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'dist');
const SCHEME = 'app';
const HOST = 'xhchain';
const APP_ID = 'cn.xhchain.desktop';

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json',
};

/** 把 URL 路径解析为 dist 内的绝对路径，并防止目录穿越 */
function resolveAsset(urlPath) {
  let clean = decodeURIComponent(urlPath || '/');
  clean = clean.split('?')[0].split('#')[0];
  if (clean === '/' || clean === '') clean = '/index.html';
  const target = path.join(DIST_DIR, clean.replace(/^\/+/, ''));
  const normalized = path.normalize(target);
  if (!normalized.startsWith(path.normalize(DIST_DIR + path.sep))) return null;
  return normalized;
}

function registerAppProtocol() {
  protocol.handle(SCHEME, (request) => {
    const url = new URL(request.url);
    const file = resolveAsset(url.pathname);
    if (!file) return new Response('Forbidden', { status: 403 });
    try {
      const body = fs.readFileSync(file);
      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      return new Response(body, {
        status: 200,
        headers: { 'content-type': type, 'cache-control': 'no-cache' },
      });
    } catch {
      // 单页应用兜底：未知路径回退到 index.html
      try {
        const body = fs.readFileSync(path.join(DIST_DIR, 'index.html'));
        return new Response(body, {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' },
        });
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    }
  });
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    show: false,
    backgroundColor: '#060A12',
    title: '星火链证 XH-CHAIN',
    autoHideMenuBar: true,
    icon: path.join(APP_ROOT, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.loadURL(`${SCHEME}://${HOST}/index.html`);

  // F12 切换开发者工具
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // 外部链接交给系统浏览器，应用内不允许跳离 app:// 源
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${SCHEME}://`)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId(APP_ID);
    Menu.setApplicationMenu(null);
    registerAppProtocol();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
