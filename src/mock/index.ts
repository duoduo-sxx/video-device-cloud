/**
 * Mock 服务入口
 * 在应用启动时调用 setupMock()，之后 axios 的全部请求都会由本地 Mock 处理。
 */
import { mockAdapter, requestMetrics } from './adapter'
import { registerMockRoutes } from './handlers'
import { getSettings, saveSettings, defaultSettings } from './utils'
import { patchStats, resetAll } from './db'
import { collectionNames, clearCollections } from './generator'
import type { MockSettings } from './utils'

export function setupMock(): void {
  const count = registerMockRoutes()
  // eslint-disable-next-line no-console
  console.info(
    `%c[Mock] 视频设备云数据服务系统 · 纯前端数据服务已就绪\n接口数量：${count} · 数据集合：${collectionNames.length} 个（按需生成）`,
    'color:#1677ff;font-weight:bold'
  )
}

export function resetMockData(): void {
  resetAll()
  clearCollections()
}

export { mockAdapter, requestMetrics, getSettings, saveSettings, defaultSettings, patchStats }
export type { MockSettings }
