/**
 * 汇总注册全部 Mock 路由
 * 注意：注册顺序影响路径匹配（静态路径需先于 :param 路径注册），
 * 各模块内部已按此规则排列。
 */
import { defineRoutes, getRouteCount } from '../router'
import { systemRoutes } from './system'
import { deviceRoutes } from './device'
import { alarmRoutes } from './alarm'
import { storageRoutes } from './storage'
import { aiRoutes } from './ai'
import { serviceRoutes } from './service'
import { openapiRoutes } from './openapi'
import { monitorRoutes } from './monitor'

let registered = false

export function registerMockRoutes(): number {
  if (registered) return getRouteCount()
  defineRoutes([
    ...systemRoutes,
    ...deviceRoutes,
    ...alarmRoutes,
    ...storageRoutes,
    ...aiRoutes,
    ...serviceRoutes,
    ...openapiRoutes,
    ...monitorRoutes
  ] as any)
  registered = true
  return getRouteCount()
}
