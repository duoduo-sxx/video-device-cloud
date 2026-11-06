'use strict';

/**
 * MediaForge 智媒工场 —— 桌面端主进程
 *
 * 说明：项目本身不依赖 electron（package.json 中不声明 electron / electron-builder），
 * 该文件仅由 electron 运行时加载，require('electron') 由运行时注入。
 * 渲染层是纯静态产物（dist/），通过自定义 app:// 协议或 file:// 载入。
 */

const { app, BrowserWindow, Menu, protocol, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', 'dist');
const SINGLE_FILE = path.join(ROOT, 'mediaforge.html');
const INDEX_FILE = path.join(ROOT, 'index.html');

const SCHEME = 'app';
const APP_URL = `${SCHEME}://local/index.html`;

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
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.map': 'application/json; charset=utf-8',
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

let mainWindow = null;

function toLocalFile(requestUrl) {
  const url = new URL(requestUrl);
  let pathname = decodeURIComponent(url.pathname || '/');
  if (pathname === '/' || pathname === '') pathname = '/index.html';

  const target = path.resolve(ROOT, `.${pathname}`);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) return null;
  return target;
}

function registerProtocol() {
  // Electron >= 25
  if (typeof protocol.handle === 'function') {
    protocol.handle(SCHEME, async (request) => {
      const file = toLocalFile(request.url);
      if (!file) return new Response('Forbidden', { status: 403 });

      try {
        const data = await fs.promises.readFile(file);
        const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
        return new Response(data, { headers: { 'content-type': type } });
      } catch {
        // 单页应用兜底：未知路径回退到入口页
        try {
          const html = await fs.promises.readFile(INDEX_FILE);
          return new Response(html, { headers: { 'content-type': MIME['.html'] } });
        } catch {
          return new Response('Not Found', { status: 404 });
        }
      }
    });
    return true;
  }

  // Electron < 25 回退
  if (typeof protocol.registerFileProtocol === 'function') {
    protocol.registerFileProtocol(SCHEME, (request, callback) => {
      const file = toLocalFile(request.url);
      callback({ path: file || INDEX_FILE });
    });
    return true;
  }

  return false;
}

async function loadApp(win) {
  if (registerProtocol()) {
    try {
      await win.loadURL(APP_URL);
      return;
    } catch (err) {
      console.error('[mediaforge] app:// 载入失败，回退 file://', err);
    }
  }
  const entry = fs.existsSync(SINGLE_FILE) ? SINGLE_FILE : INDEX_FILE;
  await win.loadFile(entry);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    backgroundColor: '#0b0f17',
    title: 'MediaForge 智媒工场',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 外链走系统浏览器，窗口内不开新窗
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${SCHEME}://`) && !url.startsWith('file://')) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  loadApp(mainWindow).catch((err) => {
    console.error('[mediaforge] 页面载入失败', err);
  });
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.setAppUserModelId('com.mediaforge.desktop');

  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
