const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const DEV_URL = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    show: false,
    backgroundColor: '#f5f7fa',
    title: '惯性参数感知系统',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  // 主进程仅承载页面，业务逻辑全部在渲染进程（纯前端 + mock）
  if (DEV_URL) {
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.once('ready-to-show', () => win.show());

  // 外链交给系统浏览器，禁止在应用内弹新窗口
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // 屏蔽页面标题被覆盖
  win.on('page-title-updated', (event) => event.preventDefault());
}

function setupMenu() {
  Menu.setApplicationMenu(null);
}

app.whenReady().then(() => {
  setupMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
