/**
 * Electron 主进程（仅打包时由 electron-builder 注入的 Electron 运行时执行）
 *
 * 说明：本项目不把 electron 写入 package.json 依赖，
 * 打包时通过 `-c.electronVersion=<version>` 由 electron-builder 自行下载对应运行时。
 * 因此这里对 electron 的 require 属于运行时引用，不需要 npm 安装。
 */
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('node:path');

const APP_TITLE = '智能交互与理解软件系统与技术服务';

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 760,
    title: APP_TITLE,
    backgroundColor: '#f5f6fa',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  win.once('ready-to-show', () => win.show());

  // 外链走系统浏览器，避免在应用内打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 单实例运行
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
