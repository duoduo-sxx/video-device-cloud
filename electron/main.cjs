/**
 * 云枢平台 · Electron 主进程（纯加载器，不含任何业务逻辑）
 *
 * 说明：
 * - 项目本身是纯前端（React + Vite 产物），此处仅负责打开一个窗口加载 dist/index.html
 * - 使用 .cjs 后缀，规避 package.json 中 "type": "module" 的影响，兼容所有 Electron 版本
 * - 应用为纯 Mock 数据、零网络请求，可直接 file:// 加载（vite base 已配置为 './'，路由为 HashRouter）
 */
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

/** 生产环境页面路径（打包后位于 asar 内） */
const INDEX_HTML = path.join(__dirname, '..', 'dist', 'index.html');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    autoHideMenuBar: true,
    backgroundColor: '#F5F7FA',
    title: '云枢 · 大数据价值链服务平台',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  // 隐藏菜单栏（Windows 下 Alt 键不会唤出）
  win.setMenuBarVisibility(false);

  // 页面内新开链接一律交给系统浏览器，且应用本身无外链需求，此处仅做兜底
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.loadFile(INDEX_HTML).catch((err) => {
    // dist 缺失时的兜底提示（正常打包不会出现）
    win.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          `<body style="font-family:sans-serif;background:#F5F7FA;color:#333;display:flex;align-items:center;justify-content:center;height:100vh">
             <div style="text-align:center"><h2>页面资源缺失</h2><p>${String(err)}</p></div>
           </body>`,
        ),
    );
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
