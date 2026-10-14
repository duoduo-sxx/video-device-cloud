/**
 * Mock 路由表与匹配器
 * 设计：使用与真实后端一致的 RESTful 风格路径，:param 表示路径参数
 */
export interface MockContext {
  params: Record<string, string>
  query: Record<string, any>
  body: any
  method: string
  path: string
}

export type MockHandler = (ctx: MockContext) => any

export interface MockRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  handler: MockHandler
  /** 该接口的模拟延时（毫秒），列表类接口给较大值以便看到骨架屏 */
  latency?: 'list' | 'fast'
}

const routes: MockRoute[] = []

export function defineRoutes(list: MockRoute[]): void {
  routes.push(...list)
}

export function getRouteCount(): number {
  return routes.length
}

interface Matched {
  route: MockRoute
  params: Record<string, string>
}

export function matchRoute(method: string, pathname: string): Matched | null {
  const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  for (const route of routes) {
    if (route.method !== method) continue
    const rSeg = route.path.replace(/^\/+/, '').split('/').filter(Boolean)
    if (rSeg.length !== segments.length) continue
    const params: Record<string, string> = {}
    let ok = true
    for (let i = 0; i < rSeg.length; i++) {
      if (rSeg[i].startsWith(':')) {
        params[rSeg[i].slice(1)] = decodeURIComponent(segments[i])
      } else if (rSeg[i] !== segments[i]) {
        ok = false
        break
      }
    }
    if (ok) return { route, params }
  }
  return null
}
