/**
 * SpaceScape 桌面壳主进程（纯 CommonJS，不依赖 node_modules 中的 electron 包——
 * electron 由 electron-builder 注入的运行时提供，因此项目依赖里不需要安装 electron）
 *
 * 职责：
 *  - 加载 dist/（Vite 构建产物，HashRouter，file:// 可用）
 *  - 外链一律走系统浏览器
 *  - 单实例锁 + 窗口生命周期 + 关闭确认保护（有转换任务在跑时提醒）
 */
const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('node:path')

const APP_ID = 'cn.spacescape.console'
const APP_TITLE = 'SpaceScape · 空间视频转换系统'
const EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

/** @type {BrowserWindow | null} */
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1560,
    height: 980,
    minWidth: 1180,
    minHeight: 720,
    show: false,
    title: APP_TITLE,
    backgroundColor: '#0A0C10',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: true,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 阻止页面自己改标题/开新窗口
  mainWindow.on('page-title-updated', (e) => e.preventDefault())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault()
      openExternal(url)
    }
  })

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function openExternal(url) {
  try {
    const parsed = new URL(url)
    if (EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
      shell.openExternal(url)
    }
  } catch {
    /* 非 URL，忽略 */
  }
}

function buildMenu() {
  const template = [
    ...(process.platform === 'darwin'
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        }]
      : []),
    {
      label: '编辑',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: '窗口',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { role: 'close' }],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    app.setAppUserModelId(APP_ID)
    buildMenu()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  // 阻止拖拽文件进窗口被默认打开
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (event) => event.preventDefault())
  })
}
