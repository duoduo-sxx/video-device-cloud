/**
 * Mock 请求适配器（axios custom adapter）
 * 直接拦截 axios 请求并交由本地 Mock 路由处理。
 * 相比 Service Worker 方案：无需额外运行时与注册流程，刷新即生效。
 */
import type { AxiosAdapter, AxiosResponse } from 'axios'
import { matchRoute } from './router'
import { delay, fail, getSettings, listDelay, uuid } from './utils'

/** 记录最近一次接口调用的耗时，供 API 调试台展示 */
export const requestMetrics = {
  lastPath: '',
  lastDuration: 0
}

interface MockError extends Error {
  code?: number
}

function parseQuery(config: any): Record<string, any> {
  const q: Record<string, any> = {}
  const url = String(config.url || '')
  const idx = url.indexOf('?')
  if (idx >= 0) {
    new URLSearchParams(url.slice(idx + 1)).forEach((v, k) => {
      q[k] = v
    })
  }
  const params = config.params
  if (params && typeof params === 'object') {
    Object.keys(params).forEach((k) => {
      const v = params[k]
      if (v === undefined || v === null || v === '') return
      q[k] = v
    })
  }
  return q
}

function parseBody(config: any): any {
  const d = config.data
  if (d === undefined || d === null || d === '') return undefined
  if (typeof d === 'string') {
    try {
      return JSON.parse(d)
    } catch {
      return d
    }
  }
  return d
}

export const mockAdapter: AxiosAdapter = async (config): Promise<AxiosResponse> => {
  const method = String(config.method || 'get').toUpperCase()
  const url = String(config.url || '')
  // 自定义 adapter 中 config.url 是相对路径（不含 baseURL），需手动拼接为与路由表一致的完整路径
  const base = String(config.baseURL || '')
  let pathname = url.split('?')[0]
  if (base && !pathname.startsWith(base)) pathname = base + pathname
  const query = parseQuery(config)
  const body = parseBody(config)
  const start = performance.now()

  const matched = matchRoute(method, pathname)

  if (!matched) {
    await delay(80)
    const resp = fail(404, `接口不存在：${method} ${pathname}`)
    return buildResponse(resp, 404, config)
  }

  await (matched.route.latency === 'list' ? listDelay() : delay())

  // 错误注入：开启后随机返回服务异常，用于验证前端错误态
  const settings = getSettings()
  if (settings.errorInject && Math.random() < 0.08) {
    const resp = fail(500, '模拟服务异常：上游服务响应超时，请稍后重试')
    requestMetrics.lastPath = pathname
    requestMetrics.lastDuration = Math.round(performance.now() - start)
    return buildResponse(resp, 500, config)
  }

  try {
    const data = matched.route.handler({ params: matched.params, query, body, method, path: pathname })
    requestMetrics.lastPath = pathname
    requestMetrics.lastDuration = Math.round(performance.now() - start)
    const payload = data && typeof data === 'object' && 'code' in data ? data : { code: 0, message: 'ok', data, traceId: uuid(), timestamp: Date.now() }
    return buildResponse(payload, (payload as any).code === 401 ? 401 : 200, config)
  } catch (e) {
    const err = e as MockError
    const code = err.code || 500
    requestMetrics.lastPath = pathname
    requestMetrics.lastDuration = Math.round(performance.now() - start)
    return buildResponse(fail(code, err.message || '服务异常'), code === 401 ? 401 : 200, config)
  }
}

function buildResponse(data: any, status: number, config: any): AxiosResponse {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config,
    request: { __mock: true }
  } as unknown as AxiosResponse
}
