/**
 * 音视频自动化修补系统 · Electron 主进程
 *
 * 说明：
 * - 本项目本体是纯前端（Vite 构建，HashRouter），打包为桌面端时
 *   Electron 由 electron-builder 按传入的 electronVersion 下载运行时，
 *   项目 package.json 中【不引入】electron npm 依赖。
 * - 窗口加载 dist/index.html（相对路径资源，file:// 协议可正常工作）。
 */
const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('node:path')

const APP_TITLE = '音视频自动化修补系统 · AV Repair Studio'

if (!app.requestSingleInstanceLock()) {
  app.quit()
}

/** @type {BrowserWindow | null} */
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 720,
    show: false,
    backgroundColor: '#070a0f',
    title: APP_TITLE,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  })

  // 移除默认菜单（保留 F11 / Ctrl+Shift+I 等快捷键不受影响）
  Menu.setApplicationMenu(null)

  mainWindow.once('ready-to-show', () => mainWindow.show())

  // 阻止导航离开本地应用；外部链接交给系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault()
  })

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    // macOS 关闭窗口后点 Dock 图标重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
