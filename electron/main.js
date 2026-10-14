/**
 * Electron 主进程（CommonJS）
 * 纯前端应用的最小外壳：加载 dist/index.html（hash 路由 + 相对资源路径，file:// 下可直接运行）
 */
const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('node:path')

const isDev = !!process.env.VITE_DEV_SERVER_URL
const APP_TITLE = '视频设备云数据服务系统'

/** 单实例锁：重复启动时聚焦已有窗口 */
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0b2545',
    title: APP_TITLE,
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 窗口标题始终使用应用名（避免页面 title 变化后显示路径）
  mainWindow.on('page-title-updated', (e) => e.preventDefault())

  // 站内新开窗口一律交给系统默认浏览器（应用内跳转不受影响）
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  // 阻止渲染进程导航到未知页面（hash 路由不触发导航，仅防御外部链接）
  mainWindow.webContents.willNavigate((e, url) => {
    const isAppUrl = url.startsWith('file://') || url.startsWith(isDev ? process.env.VITE_DEV_SERVER_URL : 'file://')
    if (!isAppUrl) e.preventDefault()
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function buildMenu() {
  const template = [
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '进入全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于本应用',
          click: () => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: APP_TITLE,
              detail: `版本 ${app.getVersion()}\nElectron ${process.versions.electron} · Chromium ${process.versions.chrome}\n纯前端演示系统，数据由本地 Mock 生成`
            })
          }
        }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  buildMenu()
  createWindow()

  app.on('activate', () => {
    // macOS：点击 Dock 图标时若无窗口则重建
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  // Windows / Linux：关闭即退出（保持常规桌面软件行为）
  if (process.platform !== 'darwin') app.quit()
})
