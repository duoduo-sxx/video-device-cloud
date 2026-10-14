/**
 * 前端产物本地静态服务
 * ---------------------------------------------------------------------------
 * 把 Vite 构建出的 dist（打包后位于 resources/renderer）以 http://127.0.0.1:<port>
 * 的形式提供给渲染进程，替代 file://：
 *   - 固定端口 → origin 稳定，用户在本地的数据改动可持久保留
 *   - 端口被占用时自动退回随机端口，保证一定能启动
 *
 * 单独成文件便于在普通 Node 环境下直接做冒烟测试（不依赖 Electron）。
 */

const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

/**
 * @param {string} rendererRoot 前端产物根目录（须包含 index.html）
 * @param {number} preferredPort 首选端口
 * @param {(msg: string) => void} [onLog] 日志回调
 * @returns {Promise<{ url: string, port: number, server: import('node:http').Server, close: () => void }>}
 */
async function startRendererServer(rendererRoot, preferredPort, onLog = () => {}) {
  const indexPath = path.join(rendererRoot, 'index.html')
  if (!fs.existsSync(indexPath)) {
    throw new Error(`找不到前端页面入口：${indexPath}\n请先执行构建（npm run build）后再打包。`)
  }

  const server = http.createServer((request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1')
      const pathname = decodeURIComponent(requestUrl.pathname)
      const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
      let filePath = path.resolve(rendererRoot, relativePath)

      // 不允许越出前端产物目录
      if (filePath !== rendererRoot && !filePath.startsWith(`${rendererRoot}${path.sep}`)) {
        response.writeHead(403).end('Forbidden')
        return
      }

      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        // 无扩展名的路径回落到 index.html（兼容前端路由），缺失的静态资源仍返回 404
        if (!path.extname(relativePath)) {
          filePath = indexPath
        } else {
          response.writeHead(404).end('Not found')
          return
        }
      }

      response.writeHead(200, {
        'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      })
      fs.createReadStream(filePath).pipe(response)
    } catch (error) {
      response.writeHead(500).end(String(error))
    }
  })

  const listen = (port) =>
    new Promise((resolve, reject) => {
      const onError = (error) => {
        server.removeListener('listening', onListening)
        reject(error)
      }
      const onListening = () => {
        server.removeListener('error', onError)
        const address = server.address()
        if (!address || typeof address === 'string') {
          reject(new Error('无法启动本地页面服务。'))
          return
        }
        resolve(address.port)
      }
      server.once('error', onError)
      server.once('listening', onListening)
      server.listen(port, '127.0.0.1')
    })

  let port
  try {
    port = await listen(preferredPort)
  } catch (error) {
    if (!error || error.code !== 'EADDRINUSE') throw error
    onLog(`端口 ${preferredPort} 被占用，改用随机端口启动`)
    port = await listen(0)
  }

  onLog(`前端产物目录：${rendererRoot}`)
  return {
    url: `http://127.0.0.1:${port}/index.html`,
    port,
    server,
    close: () => server.close()
  }
}

module.exports = { startRendererServer, MIME_TYPES }
