/**
 * Electron 主进程（CommonJS）
 * 加载 dist/index.html（hash 路由 + 相对资源路径，file:// 下可直接运行）
 *
 * 稳定性设计：窗口立即显示（不依赖 ready-to-show），任何启动/加载异常都会写入日志
 * 并弹出提示框，避免出现"双击后毫无反应"的情况。
 * 日志位置：%APPDATA%/<应用名>/logs/main.log
 */
const { app, BrowserWindow, Menu, shell, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const isDev = !!process.env.VITE_DEV_SERVER_URL
const APP_TITLE = '视频设备云数据服务系统'

/* ---------- 日志 ---------- */
let logFile = null

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args
    .map((a) => (a instanceof Error ? a.stack : typeof a === 'object' ? JSON.stringify(a) : String(a)))
    .join(' ')}`
  // eslint-disable-next-line no-console
  console.log(line)
  try {
    if (!logFile) {
      const dir = path.join(app.getPath('userData'), 'logs')
      fs.mkdirSync(dir, { recursive: true })
      logFile = path.join(dir, 'main.log')
    }
    fs.appendFileSync(logFile, line + '\n')
  } catch {
    /* 日志写失败不影响运行 */
  }
}

/** 弹窗提示（同时写日志），用于启动/加载异常时让用户看到问题而不是无响应 */
function fatal(title, detail) {
  log(`[FATAL] ${title} :: ${detail}`)
  try {
    dialog.showErrorBox(title, `${detail}\n\n日志文件：${logFile || '(未能创建)'}`)
  } catch {
    /* ignore */
  }
}

// 部分 Windows 机器 / 虚拟机 / 远程桌面下 GPU 合成会导致窗口白屏或不出图，
// 默认关闭硬件加速；如需强制开启可设置环境变量 VC_ENABLE_GPU=1
if (process.env.VC_ENABLE_GPU !== '1') {
  app.disableHardwareAcceleration()
}

// Windows 任务栏图标归组与通知标识
app.setAppUserModelId('com.yunshi.videocloud.dataservice')

process.on('uncaughtException', (err) => fatal('程序发生异常', String(err && err.stack ? err.stack : err)))
process.on('unhandledRejection', (reason) => log('[unhandledRejection]', reason))

/* ---------- 单实例锁 ---------- */
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  log('检测到已有实例在运行，本次启动退出并聚焦已有窗口')
  app.quit()
}

let mainWindow = null

/** 解析前端入口文件：开发模式用 dev server，生产模式用 dist/index.html */
function resolveIndexFile() {
  const candidates = [
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(process.resourcesPath || '', 'app.asar', 'dist', 'index.html'),
    path.join(process.resourcesPath || '', 'app', 'dist', 'index.html')
  ]
  return candidates.find((p) => {
    try {
      return fs.existsSync(p)
    } catch {
      return false
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    show: true, // 立即显示，避免因渲染异常导致窗口永不出现
    autoHideMenuBar: true,
    backgroundColor: '#0b2545',
    title: APP_TITLE,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  })

  log(`创建窗口完成，版本 ${app.getVersion()}，Electron ${process.versions.electron}`)

  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isVisible()) mainWindow.show()
  })

  // 兜底：3 秒后仍未显示（或已被隐藏）则强制显示并置顶，保证用户一定看到窗口
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  }, 3000)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 标题固定为应用名
  mainWindow.on('page-title-updated', (e) => e.preventDefault())

  // 渲染进程控制台错误写入日志，便于排查
  mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) log(`[renderer] ${message} (${sourceId}:${line})`)
  })

  // 页面加载失败：给出明确提示，而不是静默无反应
  mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDescription, validatedURL) => {
    fatal('界面加载失败', `错误码 ${errorCode}：${errorDescription}\n地址：${validatedURL}`)
  })

  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    fatal('渲染进程异常退出', JSON.stringify(details))
  })

  // 外部链接交给系统默认浏览器；站内跳转不受影响
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (e, url) => {
    const devBase = process.env.VITE_DEV_SERVER_URL || ''
    const allowed = url.startsWith('file://') || (devBase && url.startsWith(devBase))
    if (!allowed) {
      e.preventDefault()
      if (/^https?:/i.test(url)) shell.openExternal(url)
    }
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
    return
  }

  const indexFile = resolveIndexFile()
  if (!indexFile) {
    fatal(
      '未找到前端资源',
      '打包产物中缺少 dist/index.html，请先执行构建（pnpm build）后再打包。\n' +
        `已检查路径：\n${path.join(__dirname, '..', 'dist', 'index.html')}`
    )
    return
  }
  log(`加载入口文件：${indexFile}`)
  mainWindow.loadFile(indexFile)
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
          label: '关于本系统',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: APP_TITLE,
              detail:
                `版本 ${app.getVersion()}\n` +
                `运行环境 Electron ${process.versions.electron} · Chromium ${process.versions.chrome}\n` +
                `日志目录：${path.join(app.getPath('userData'), 'logs')}`
            })
          }
        }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  log('应用启动')
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
