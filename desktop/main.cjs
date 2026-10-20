/**
 * NexusPlay 游戏开发管理平台 · 桌面端主进程
 * ---------------------------------------------------------------------------
 * 启动流程：在 127.0.0.1 上起一个只读本地静态服务，把 Vite 构建出的前端产物
 * （打包后位于 resources/renderer）通过 http:// 提供给渲染进程。
 *
 * 为什么用本地 http 而不是 file://：
 *   1. file:// 下浏览器对 localStorage / ES Module 的限制较多，且相对资源路径
 *      容易失效，容易出现白屏或本地数据无法持久化；
 *   2. 固定端口可以让页面 origin 保持稳定，用户使用过程中的数据改动在下次打开
 *      时仍然存在。
 *
 * 说明：本进程不访问任何外部接口，前端所有业务数据均来自内置模拟数据服务。
 * 日志位置：%APPDATA%/<应用名>/logs/main.log，便携版 exe 同级目录另有一份「启动日志.log」
 */

const { app, BrowserWindow, Menu, dialog, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const { startRendererServer } = require('./renderer-server.cjs')

const APP_TITLE = '跨平台网页游戏综合开发管理系统'
const APP_ID = 'com.nexusplay.console'
/** 固定首选端口，保证页面 origin 稳定；被占用时自动退回随机端口 */
const PREFERRED_PORT = Number(process.env.NP_PORT) || 41790

let serverHandle = null
let mainWindow = null

/* ------------------------------- 日志 ------------------------------- */

let logFiles = null

/**
 * 日志同时写两处，便于用户就近查看：
 *   1. 用户数据目录（%APPDATA%/<应用名>/logs/main.log）
 *   2. 便携版 exe 所在目录（启动日志.log）——便于"双击没反应/闪退"时直接找到原因
 */
function resolveLogFiles() {
  if (logFiles) return logFiles

  const targets = []
  try {
    targets.push(path.join(app.getPath('userData'), 'logs', 'main.log'))
  } catch {
    /* ignore */
  }
  // 便携版由 electron-builder 注入 PORTABLE_EXECUTABLE_DIR；其余场景用 exe 所在目录
  const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath)
  if (exeDir) targets.push(path.join(exeDir, '启动日志.log'))

  logFiles = targets.filter((file) => {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true })
      return true
    } catch {
      return false
    }
  })
  return logFiles
}

function logPathText() {
  const files = resolveLogFiles()
  return files.length ? files.join('\n') : '(无可用日志路径)'
}

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args
    .map((a) => (a instanceof Error ? a.stack : a && typeof a === 'object' ? JSON.stringify(a) : String(a)))
    .join(' ')}`
  // eslint-disable-next-line no-console
  console.log(line)
  for (const file of resolveLogFiles()) {
    try {
      fs.appendFileSync(file, `${line}\n`)
    } catch {
      /* 某个日志文件写不进去不影响运行 */
    }
  }
}

/** 启动失败提示：showErrorBox 是模态的，会一直停在那里直到用户点确定，便于查看原因 */
function fatal(title, detail) {
  log(`[FATAL] ${title} :: ${detail}`)
  try {
    dialog.showErrorBox(title, `${detail}\n\n日志文件：\n${logPathText()}`)
  } catch {
    /* ignore */
  }
  app.quit()
}

/* ------------------------------- 主窗口 ------------------------------- */

function createWindow(rendererUrl) {
  mainWindow = new BrowserWindow({
    width: 1520,
    height: 940,
    minWidth: 1280,
    minHeight: 800,
    show: true, // 立即显示：避免渲染异常时窗口永不出现
    autoHideMenuBar: true,
    backgroundColor: '#f5f6f8', // 与浅色主题底色一致，避免启动瞬间白闪
    title: APP_TITLE,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  })

  // 标题固定为应用名，避免被页面 <title> 覆盖
  mainWindow.on('page-title-updated', (event) => event.preventDefault())

  // 兜底：若 3 秒后窗口仍不可见则强制显示并置顶
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  }, 3000)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 渲染进程的报错写入日志，便于排查
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) log(`[renderer] ${message} (${sourceId}:${line})`)
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl) => {
    fatal('界面加载失败', `错误码 ${errorCode}：${errorDescription}\n地址：${validatedUrl}`)
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log('[render-process-gone]', details)
    if (details && details.reason === 'clean-exit') return
    fatal('界面进程异常退出', JSON.stringify(details))
  })

  // 外部链接交给系统默认浏览器打开；应用内跳转不受影响
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  const origin = new URL(rendererUrl).origin
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(origin) && !url.startsWith('file://')) {
      event.preventDefault()
      if (/^https?:/i.test(url)) shell.openExternal(url)
    }
  })

  mainWindow.loadURL(rendererUrl)
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
                `日志文件：\n${logPathText()}`
            })
          }
        }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

/** 前端产物目录：打包后在 resources/renderer，本地调试用仓库里的 dist */
function getRendererRoot() {
  return app.isPackaged ? path.join(process.resourcesPath, 'renderer') : path.join(__dirname, '..', 'dist')
}

async function boot() {
  if (!serverHandle) {
    serverHandle = await startRendererServer(getRendererRoot(), PREFERRED_PORT, log)
  }
  log(`加载页面：${serverHandle.url}`)
  createWindow(serverHandle.url)
}

/* ------------------------------- 生命周期 ------------------------------- */

// 说明：这里不使用单实例锁。一旦锁未拿到（残留锁文件、同机曾异常退出等）就会在
// whenReady 之后先建窗口再退出，表现为「窗口一闪就没了」。本应用允许多开，
// 多个实例会自动使用不同端口。
app.setAppUserModelId(APP_ID)

process.on('uncaughtException', (error) => log('[uncaughtException]', error))

app.on('before-quit', () => {
  try {
    serverHandle?.close()
  } catch {
    /* ignore */
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app
  .whenReady()
  .then(async () => {
    log(`应用启动，Electron ${process.versions.electron}`)
    try {
      buildMenu()
      await boot()
    } catch (error) {
      fatal('启动失败', String((error && error.stack) || error))
    }

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length > 0) return
      try {
        await boot()
      } catch (error) {
        fatal('启动失败', String((error && error.stack) || error))
      }
    })
  })
  .catch((error) => fatal('启动失败', String((error && error.stack) || error)))
