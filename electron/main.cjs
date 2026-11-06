/**
 * 桌面端主进程入口
 *
 * 注意：本项目 **不在 package.json 中声明 electron 依赖**，
 * 该文件中的 `require('electron')` 由 electron 运行时在启动时注入，
 * 打包时由 electron-builder 依据 -c.electronVersion 下载对应运行时。
 * 因此 `npm install` 不会、也不需要安装 electron。
 */
const { app, BrowserWindow, Menu, shell, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const APP_ID = 'com.duoduo.iceplatform'
const APP_NAME = '沉浸式智能控制人机交互系统'
const isDev = !app.isPackaged

const ROOT = path.join(__dirname, '..')
const INDEX_HTML = path.join(ROOT, 'dist', 'index.html')
const WINDOW_STATE_FILE = () => path.join(app.getPath('userData'), 'window-state.json')

/* ---------------------------------------------------------------- 单实例 */

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

/* ---------------------------------------------------- 便携模式数据目录落盘 */

// electron-builder portable 目标会注入 PORTABLE_EXECUTABLE_DIR，
// 此时把用户数据放在 exe 同级 data/ 目录，便于 U 盘携带配置。
const portableDir = process.env.PORTABLE_EXECUTABLE_DIR
if (portableDir) {
  try {
    const dataDir = path.join(portableDir, 'data')
    fs.mkdirSync(dataDir, { recursive: true })
    app.setPath('userData', dataDir)
  } catch {
    /* 目录不可写时回退到系统默认位置 */
  }
}

/* ---------------------------------------------------------- 窗口尺寸记忆 */

function readWindowState() {
  const fallback = { width: 1600, height: 1000, maximized: false }
  try {
    const raw = JSON.parse(fs.readFileSync(WINDOW_STATE_FILE(), 'utf8'))
    if (!raw || typeof raw.width !== 'number' || typeof raw.height !== 'number') return fallback
    return {
      x: Number.isFinite(raw.x) ? raw.x : undefined,
      y: Number.isFinite(raw.y) ? raw.y : undefined,
      width: Math.max(1200, raw.width),
      height: Math.max(760, raw.height),
      maximized: !!raw.maximized,
    }
  } catch {
    return fallback
  }
}

function saveWindowState(win) {
  try {
    const bounds = win.isMaximized() ? win.getNormalBounds() : win.getBounds()
    fs.writeFileSync(
      WINDOW_STATE_FILE(),
      JSON.stringify({ ...bounds, maximized: win.isMaximized() }, null, 2)
    )
  } catch {
    /* 忽略写入失败 */
  }
}

/* ------------------------------------------------------------ 主窗口创建 */

let mainWindow = null

function createWindow() {
  const state = readWindowState()

  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 1200,
    minHeight: 760,
    show: false,
    backgroundColor: '#070b12',
    title: APP_NAME,
    autoHideMenuBar: true,
    icon: path.join(ROOT, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      webSecurity: true,
    },
  })

  if (state.maximized) mainWindow.maximize()

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
  })

  if (!fs.existsSync(INDEX_HTML)) {
    dialog.showErrorBox(
      '缺少前端构建产物',
      `未找到 ${INDEX_HTML}\n\n请先执行：npm run build`
    )
    app.quit()
    return
  }

  mainWindow.loadFile(INDEX_HTML)

  // 站外链接交给系统浏览器，窗口内不允许新开窗口
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) return
    event.preventDefault()
    if (/^https?:/i.test(url)) shell.openExternal(url)
  })

  // 基础右键菜单，保证输入框可用
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const items = []
    if (params.isEditable) {
      items.push(
        { label: '撤销', role: 'undo', enabled: params.editFlags.canUndo },
        { label: '重做', role: 'redo', enabled: params.editFlags.canRedo },
        { type: 'separator' },
        { label: '剪切', role: 'cut', enabled: params.editFlags.canCut },
        { label: '复制', role: 'copy', enabled: params.editFlags.canCopy },
        { label: '粘贴', role: 'paste', enabled: params.editFlags.canPaste },
        { type: 'separator' },
        { label: '全选', role: 'selectAll' }
      )
    } else if (params.selectionText) {
      items.push({ label: '复制', role: 'copy' })
    }
    if (isDev) {
      if (items.length) items.push({ type: 'separator' })
      items.push({ label: '检查元素', click: () => mainWindow.webContents.inspectElement(params.x, params.y) })
    }
    if (items.length) Menu.buildFromTemplate(items).popup({ window: mainWindow })
  })

  // F11 全屏 / Ctrl+Shift+I 开发者工具（仅开发态）
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    if (input.key === 'F11') {
      event.preventDefault()
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
    }
    if (isDev && input.control && input.shift && input.key.toLowerCase() === 'i') {
      event.preventDefault()
      mainWindow.webContents.toggleDevTools()
    }
  })

  mainWindow.on('close', () => saveWindowState(mainWindow))
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/* ------------------------------------------------------------------ 生命周期 */

app.setAppUserModelId(APP_ID)

app.on('second-instance', () => {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.focus()
})

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

process.on('uncaughtException', (err) => {
  try {
    dialog.showErrorBox('发生未预期的错误', String((err && err.stack) || err))
  } catch {
    /* noop */
  }
})
