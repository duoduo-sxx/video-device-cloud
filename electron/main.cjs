const { app, BrowserWindow, Menu, protocol, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// 构建产物为 ES Module，file:// 下会被 Chromium 的 CORS 策略拦截，
// 因此注册自定义 app:// 协议来加载 dist 目录（asar 内同样可读）。
const SCHEME = 'app';
const DIST_DIR = path.join(__dirname, '..', 'dist');

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

let mainWindow = null;

function registerAppProtocol() {
  protocol.handle(SCHEME, async (request) => {
    let pathname = '/index.html';
    try {
      pathname = decodeURIComponent(new URL(request.url).pathname) || '/index.html';
    } catch {
      pathname = '/index.html';
    }

    const resolved = path.join(DIST_DIR, pathname);
    // 防目录穿越：只允许读取 dist 内的文件
    if (!resolved.startsWith(DIST_DIR + path.sep) && resolved !== DIST_DIR) {
      return new Response('Forbidden', { status: 403 });
    }

    try {
      const data = await fs.promises.readFile(resolved);
      const ext = path.extname(resolved).toLowerCase();
      return new Response(data, {
        status: 200,
        headers: { 'content-type': MIME[ext] || 'application/octet-stream' },
      });
    } catch {
      // 前端为 HashRouter，理论上不会产生路径回退，这里仅作兜底
      const fallback = await fs.promises.readFile(path.join(DIST_DIR, 'index.html'));
      return new Response(fallback, {
        status: 200,
        headers: { 'content-type': MIME['.html'] },
      });
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1280,
    minHeight: 800,
    show: false,
    backgroundColor: '#F4F6FA',
    autoHideMenuBar: true,
    title: '数据云端协同优化传输平台',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.loadURL(`${SCHEME}://local/index.html`);

  // 站内链接保持在应用内，外部链接交给系统浏览器
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

  // 未打包时保留调试快捷键
  if (!app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      const isToggle =
        input.key === 'F12' ||
        (input.control && input.shift && input.key.toLowerCase() === 'i');
      if (isToggle) {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  }

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
    app.setAppUserModelId('com.duoduo.cloudflow');
    Menu.setApplicationMenu(null);
    registerAppProtocol();

    if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
      dialog.showErrorBox(
        '资源缺失',
        '未找到 dist/index.html，请先执行 npm run build 再启动或打包。'
      );
      app.quit();
      return;
    }

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
