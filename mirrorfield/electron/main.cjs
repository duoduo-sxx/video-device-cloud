/**
 * Electron 主进程：只负责开窗并加载已构建好的静态前端。
 * 注意：项目本身不声明 electron 依赖，运行时由 electron-builder 打包提供，
 * 因此这里只用 require('electron')，不引入任何构建期依赖。
 */
const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('node:path')

const APP_ID = 'com.mirrorfield.desktop'
const DEV_URL = process.env.MIRRORFIELD_DEV_URL || ''

let mainWindow = null

// 单实例：重复启动时聚焦已有窗口
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 720,
    show: false,
    backgroundColor: '#070B14',
    autoHideMenuBar: true,
    title: '镜域 MirrorField',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: !app.isPackaged,
    },
  })

  Menu.setApplicationMenu(null)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (DEV_URL) {
    mainWindow.loadURL(DEV_URL)
  } else {
    // dist 使用 HashRouter + 相对路径，file:// 直接可跑
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // 内嵌应用不需要新窗口，全部拦截
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.setAppUserModelId(APP_ID)

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

// 兜底：外部链接交给系统浏览器，不允许在应用内打开
app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
})
