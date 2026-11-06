// Electron 主进程入口（仅为打包提供启动壳，项目本身不依赖 Electron）
// 通过 electron-builder 打包时，Electron 运行时由 -c.electronVersion 指定并自动注入
const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 760,
    show: false,
    backgroundColor: '#f5f7fb',
    autoHideMenuBar: true,
    title: '视频智能化内容理解与分析系统',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  })

  win.once('ready-to-show', () => win.show())

  // HashRouter + base './'，可直接以 file:// 协议加载构建产物
  win.loadFile(path.join(__dirname, 'dist', 'index.html'))

  // 禁止打开新窗口与外部跳转（桌面端约束）
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault()
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => event.preventDefault())
})
