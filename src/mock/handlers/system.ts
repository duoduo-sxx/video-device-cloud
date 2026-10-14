/**
 * Mock 接口：登录认证 / 租户 / 用户 / 角色 / 部门 / 审计日志 / 计费 / 字典 / 消息 / 数据驾驶舱
 */
import dayjs from 'dayjs'
import { defineRoutes } from '../router'
import { find, insert, nextId, patchStats, remove, resetAll, table, update } from '../db'
import { paginate, queryList, throwBiz } from '../utils'
import { getRouteCount } from '../router'
import { snapshotUrl } from '../generator/media'
import * as D from '../generator/dict'

const PASSWORDS: Record<string, string> = { admin: 'admin123', tenant: '123456', ops: '123456', support: '123456', ai: '123456' }
const SESSIONS: Record<string, { userId: string; expire: number }> = {}

function requireAuth(token?: string) {
  const session = token ? SESSIONS[token] : null
  if (!session || session.expire < Date.now()) {
    throwBiz(401, '登录状态已失效，请重新登录')
  }
  return session
}

function loginData(user: any, token: string, role: any) {
  return {
    token,
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    tenantId: user.tenantId,
    tenantName: user.tenantName,
    roleCode: role?.code || 'viewer',
    roleName: role?.name || '只读访客',
    permissions: role?.menuPermissions || [],
    buttons: role?.buttonPermissions || [],
    dataScope: role?.dataScope || 'self'
  }
}

export const systemRoutes = [
  /* ---------- 认证 ---------- */
  {
    method: 'POST' as const,
    path: '/api/v1/auth/login',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const { username, password } = body || {}
      const users = table('users')
      const user = users.find((u: any) => u.username === username)
      if (!user) throwBiz(400, '账号不存在')
      if (user.status === 0) throwBiz(400, '账号已被停用，请联系管理员')
      const expect = PASSWORDS[username] || '123456'
      if (password !== expect && password !== '123456') {
        throwBiz(400, '密码错误，演示账号密码为 admin123（admin）或其他账号 123456')
      }
      const role = table('roles').find((r: any) => r.id === user.roleIds[0])
      const token = 'mock-token-' + username + '-' + Date.now()
      SESSIONS[token] = { userId: user.id, expire: Date.now() + 2 * 3600 * 1000 }
      update('users', user.id, { lastLoginTime: dayjs().format('YYYY-MM-DD HH:mm:ss'), lastLoginIp: '127.0.0.1' })
      return loginData(user, token, role)
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/auth/userinfo',
    latency: 'fast' as const,
    handler: ({ query }: any) => {
      const session = requireAuth(query.token)
      const user = find('users', session.userId)
      if (!user) throwBiz(404, '用户不存在')
      const role = table('roles').find((r: any) => r.id === user.roleIds[0])
      return loginData(user, query.token, role)
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/auth/logout',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (body?.token) delete SESSIONS[body.token]
      return { success: true }
    }
  },

  /* ---------- 数据驾驶舱 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/dashboard/overview',
    latency: 'fast' as const,
    handler: () => {
      const devices = table('devices')
      const alarms = table('alarms')
      const pools = table('storagePools')
      const orders = table('workOrders')
      const online = devices.filter((d: any) => d.onlineStatus === 'online').length
      const today = dayjs().format('YYYY-MM-DD')
      const alarmToday = alarms.filter((a: any) => String(a.occurTime).startsWith(today)).length
      const yesterday = alarms.filter((a: any) => String(a.occurTime).startsWith(dayjs().subtract(1, 'day').format('YYYY-MM-DD'))).length
      const storageUsed = pools.reduce((a: number, p: any) => a + p.usedTB, 0)
      const storageTotal = pools.reduce((a: number, p: any) => a + p.capacityTB, 0)
      const bandwidth = devices.filter((d: any) => d.onlineStatus === 'online').reduce((a: number, d: any) => a + d.bitrateKbps, 0) / 1000
      const pendingOrders = orders.filter((o: any) => ['pending', 'assigned', 'processing'].includes(o.status)).length
      const onlineRate = Number(((online / devices.length) * 100).toFixed(1))
      return {
        deviceTotal: devices.length,
        onlineCount: online,
        offlineCount: devices.length - online,
        onlineRate,
        alarmToday,
        alarmRingRatio: yesterday ? Number((((alarmToday - yesterday) / yesterday) * 100).toFixed(1)) : 0,
        storageUsedTB: Number(storageUsed.toFixed(1)),
        storageTotalTB: Number(storageTotal.toFixed(1)),
        storageRate: Number(((storageUsed / storageTotal) * 100).toFixed(1)),
        bandwidthPeakGbps: Number((bandwidth / 1000).toFixed(2)),
        bandwidthAvgGbps: Number((bandwidth / 1000 / 1.6).toFixed(2)),
        pendingOrders,
        pendingAlarms: alarms.filter((a: any) => a.status === 'pending').length,
        tenantCount: table('tenants').length,
        aiTaskRunning: table('aiTasks').filter((t: any) => t.status === 'running').length,
        microServiceHealthy: table('microServices').filter((s: any) => s.status === 'healthy').length,
        microServiceTotal: table('microServices').length,
        apiCallsToday: table('apiCallLogs').filter((l: any) => String(l.createTime).startsWith(today)).length * 3
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/dashboard/device-trend',
    latency: 'fast' as const,
    handler: ({ query }: any) => {
      const days = Number(query.days || 7)
      const devices = table('devices')
      const dates: string[] = []
      const online: number[] = []
      const offline: number[] = []
      const added: number[] = []
      const baseOnline = devices.filter((d: any) => d.onlineStatus === 'online').length
      for (let i = days - 1; i >= 0; i--) {
        const d = dayjs().subtract(i, 'day')
        dates.push(d.format('MM-DD'))
        const wave = Math.sin(i / 3) * 6 + (Math.random() * 8 - 4)
        const o = Math.max(0, Math.round(baseOnline + wave))
        online.push(o)
        offline.push(devices.length - o)
        added.push(days > 15 ? Math.round(Math.abs(wave) / 2) : Math.round(Math.abs(wave) / 2) + 2)
      }
      return { dates, online, offline, added }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/dashboard/alarm-distribution',
    latency: 'fast' as const,
    handler: () => {
      const alarms = table('alarms').filter((a: any) => dayjs().diff(dayjs(a.occurTime), 'day') <= 30)
      const levelMap: Record<string, string> = { urgent: '紧急', major: '重要', minor: '次要', info: '提示' }
      const levels = ['urgent', 'major', 'minor', 'info'].map((k) => ({
        name: levelMap[k],
        value: alarms.filter((a: any) => a.level === k).length
      }))
      const typeMap = new Map<string, number>()
      alarms.forEach((a: any) => typeMap.set(a.type, (typeMap.get(a.type) || 0) + 1))
      const types = [...typeMap.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
      const statusMap = new Map<string, number>()
      alarms.forEach((a: any) => statusMap.set(a.status, (statusMap.get(a.status) || 0) + 1))
      return {
        levels,
        types,
        status: [...statusMap.entries()].map(([k, v]) => ({ name: k, value: v })),
        total: alarms.length
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/dashboard/region-distribution',
    latency: 'fast' as const,
    handler: () => {
      const devices = table('devices')
      const map = new Map<string, { province: string; city: string; total: number; online: number; alarm: number; lng: number; lat: number }>()
      devices.forEach((d: any) => {
        const key = d.city
        const cur = map.get(key) || { province: d.province, city: d.city, total: 0, online: 0, alarm: 0, lng: d.longitude, lat: d.latitude }
        cur.total++
        if (d.onlineStatus === 'online') cur.online++
        cur.alarm += d.alarmsLast7d
        map.set(key, cur)
      })
      return [...map.values()].sort((a, b) => b.total - a.total)
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/dashboard/storage-trend',
    latency: 'fast' as const,
    handler: () => {
      const pools = table('storagePools')
      const total = pools.reduce((a: number, p: any) => a + p.usedTB, 0)
      const dates: string[] = []
      const used: number[] = []
      const capacity: number[] = []
      const cap = pools.reduce((a: number, p: any) => a + p.capacityTB, 0)
      for (let i = 29; i >= 0; i--) {
        dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
        const factor = 1 - (i / 30) * 0.11
        used.push(Number((total * factor).toFixed(1)))
        capacity.push(Number(cap.toFixed(1)))
      }
      const tenantMap = new Map<string, number>()
      table('devices').forEach((d: any) => {
        const pool = pools.find((p: any) => p.id === d.storagePoolId)
        if (!pool) return
        const perDevice = pool.usedTB / Math.max(1, pool.channelCount) * d.channelCount
        tenantMap.set(d.tenantName, (tenantMap.get(d.tenantName) || 0) + perDevice)
      })
      const topTenants = [...tenantMap.entries()]
        .map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
      return { dates, used, capacity, topTenants }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/dashboard/recent-events',
    latency: 'fast' as const,
    handler: ({ query }: any) => {
      const limit = Number(query.limit || 20)
      return table('alarms')
        .slice()
        .sort((a: any, b: any) => (a.occurTime < b.occurTime ? 1 : -1))
        .slice(0, limit)
        .map((a: any) => ({
          id: a.id,
          alarmNo: a.alarmNo,
          title: a.title,
          type: a.type,
          level: a.level,
          deviceName: a.deviceName,
          tenantName: a.tenantName,
          region: a.region,
          occurTime: a.occurTime,
          status: a.status,
          category: a.category
        }))
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/dashboard/ai-stats',
    latency: 'fast' as const,
    handler: () => {
      const alarms = table('alarms').filter((a: any) => a.category === 'ai')
      const map = new Map<string, { count: number; conf: number; n: number }>()
      alarms.forEach((a: any) => {
        const cur = map.get(a.type) || { count: 0, conf: 0, n: 0 }
        cur.count++
        cur.conf += a.confidence
        cur.n++
        map.set(a.type, cur)
      })
      return [...map.entries()]
        .map(([name, v]) => ({ name, count: v.count, confidence: Number((v.conf / Math.max(1, v.n)).toFixed(3)) }))
        .sort((a, b) => b.count - a.count)
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/dashboard/todos',
    latency: 'fast' as const,
    handler: () => {
      const alarms = table('alarms').filter((a: any) => a.status === 'pending')
      const orders = table('workOrders').filter((o: any) => ['pending', 'assigned'].includes(o.status))
      return {
        pendingAlarms: alarms.slice(0, 8).map((a: any) => ({ id: a.id, title: a.title, level: a.level, time: a.occurTime })),
        pendingOrders: orders.slice(0, 8).map((o: any) => ({ id: o.id, orderNo: o.orderNo, title: o.title, priority: o.priority, time: o.createTime, slaStatus: o.slaStatus })),
        counts: {
          alarm: alarms.length,
          order: orders.length,
          overdueOrder: table('workOrders').filter((o: any) => o.slaStatus === 'overdue' && !['completed', 'closed'].includes(o.status)).length,
          warningOrder: table('workOrders').filter((o: any) => o.slaStatus === 'warning').length
        }
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/dashboard/order-stats',
    latency: 'fast' as const,
    handler: () => {
      const orders = table('workOrders')
      const types = new Map<string, number>()
      orders.forEach((o: any) => types.set(o.type, (types.get(o.type) || 0) + 1))
      const dates: string[] = []
      const created: number[] = []
      const finished: number[] = []
      for (let i = 6; i >= 0; i--) {
        const key = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
        dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
        created.push(orders.filter((o: any) => String(o.createTime).startsWith(key)).length)
        finished.push(orders.filter((o: any) => o.finishTime && String(o.finishTime).startsWith(key)).length)
      }
      const sla = {
        normal: orders.filter((o: any) => o.slaStatus === 'normal').length,
        warning: orders.filter((o: any) => o.slaStatus === 'warning').length,
        overdue: orders.filter((o: any) => o.slaStatus === 'overdue').length
      }
      return { dates, created, finished, sla, types: [...types.entries()].map(([name, value]) => ({ name, value })) }
    }
  },

  /* ---------- 租户 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/tenants',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const all = table('tenants')
      return queryListLazy(all, query, { searchKeys: ['name', 'code', 'contact', 'city'], defaultSort: { by: 'createTime', order: 'desc' } })
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/tenants/:tenantId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const t = find('tenants', params.tenantId)
      if (!t) throwBiz(404, '租户不存在')
      return t
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/tenants',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.name) throwBiz(400, '租户名称不能为空')
      const record = {
        ...body,
        id: nextId('tenants', 'T', 3),
        deviceUsed: 0,
        storageUsedTB: 0,
        aiChannelUsed: 0,
        balance: body.balance ?? 0,
        status: body.status || 'normal',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      insert('tenants', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/tenants/:tenantId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('tenants', params.tenantId, body)
      if (!r) throwBiz(404, '租户不存在')
      return r
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/tenants/:tenantId/quota',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const t = find('tenants', params.tenantId) as any
      if (!t) throwBiz(404, '租户不存在')
      if (body.deviceQuota !== undefined && body.deviceQuota < t.deviceUsed) {
        throwBiz(400, `设备配额不能小于已用数量（当前已用 ${t.deviceUsed} 台）`)
      }
      const r = update('tenants', params.tenantId, body)
      return r
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/tenants/:tenantId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const devices = table('devices').filter((d: any) => d.tenantId === params.tenantId)
      if (devices.length) throwBiz(400, `该租户下仍有 ${devices.length} 台设备，请先解绑设备后再删除租户`)
      remove('tenants', params.tenantId)
      return { success: true }
    }
  },

  /* ---------- 用户 / 角色 / 部门 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/users',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const all = table('users')
      const kw = String(query.keyword || '').toLowerCase()
      let list = all
      if (kw) list = list.filter((u: any) => [u.username, u.nickname, u.phone, u.email].some((v: any) => String(v).toLowerCase().includes(kw)))
      if (query.roleId) list = list.filter((u: any) => u.roleIds.includes(query.roleId))
      if (query.tenantId) list = list.filter((u: any) => u.tenantId === query.tenantId)
      if (query.deptId) list = list.filter((u: any) => u.deptId === query.deptId)
      if (query.status !== undefined && query.status !== '' && query.status !== 'all') list = list.filter((u: any) => String(u.status) === String(query.status))
      return paginateLazy(list, query)
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/users',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.username) throwBiz(400, '登录账号不能为空')
      if (table('users').some((u: any) => u.username === body.username)) throwBiz(400, '登录账号已存在')
      const roleIds = body.roleIds || []
      const roles = table('roles').filter((r: any) => roleIds.includes(r.id))
      const record = {
        ...body,
        id: nextId('users', 'U', 4),
        roleNames: roles.map((r: any) => r.name),
        tenantName: body.tenantId ? (find('tenants', body.tenantId) as any)?.name || '' : '',
        deptName: body.deptId ? (find('depts', body.deptId) as any)?.name || '' : '',
        avatar: body.avatar || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="40" fill="#1677ff"/><text x="40" y="41" font-size="26" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${(body.nickname || '用').slice(-2)}</text></svg>`
        )}`,
        status: body.status ?? 1,
        lastLoginTime: '',
        lastLoginIp: '',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      insert('users', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/users/:userId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const userId = params.userId
      const payload: any = { ...body }
      if (body.roleIds) {
        const roles = table('roles').filter((r: any) => body.roleIds.includes(r.id))
        payload.roleNames = roles.map((r: any) => r.name)
      }
      if (body.tenantId) payload.tenantName = (find('tenants', body.tenantId) as any)?.name || ''
      if (body.deptId) payload.deptName = (find('depts', body.deptId) as any)?.name || ''
      const r = update('users', userId, payload)
      if (!r) throwBiz(404, '用户不存在')
      return r
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/users/:userId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const u = find('users', params.userId) as any
      if (u && u.username === 'admin') throwBiz(400, '内置超级管理员账号不允许删除')
      remove('users', params.userId)
      return { success: true }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/roles',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const roles = table('roles')
      const users = table('users')
      const list = roles.map((r: any) => ({ ...r, userCount: users.filter((u: any) => u.roleIds.includes(r.id)).length }))
      const kw = String(query.keyword || '').toLowerCase()
      const filtered = kw ? list.filter((r: any) => r.name.toLowerCase().includes(kw) || r.code.includes(kw)) : list
      return paginateLazy(filtered, query)
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/roles/:roleId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const role = find('roles', params.roleId) as any
      if (!role) throwBiz(404, '角色不存在')
      if (role.code === 'admin' && body.menuPermissions && body.menuPermissions.length < 12) {
        throwBiz(400, '平台超级管理员必须保留全部菜单权限')
      }
      return update('roles', params.roleId, body)
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/roles/:roleId/permissions',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const role = find('roles', params.roleId) as any
      if (!role) throwBiz(404, '角色不存在')
      return update('roles', params.roleId, { menuPermissions: body.menuPermissions || [], buttonPermissions: body.buttonPermissions || [], dataScope: body.dataScope || role.dataScope })
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/depts/tree',
    latency: 'list' as const,
    handler: () => {
      const list = table('depts') as any[]
      const map = new Map<string, any>()
      list.forEach((d) => map.set(d.id, { ...d, children: [] }))
      const roots: any[] = []
      map.forEach((d) => {
        if (d.parentId && map.has(d.parentId)) map.get(d.parentId).children.push(d)
        else roots.push(d)
      })
      return roots
    }
  },

  /* ---------- 审计日志 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/logs/operation',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      return queryListLazy(table('operationLogs'), query, {
        searchKeys: ['operator', 'action', 'target', 'url'],
        timeField: 'createTime',
        defaultSort: { by: 'createTime', order: 'desc' }
      })
    }
  },

  /* ---------- 计费 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/billing/items',
    latency: 'list' as const,
    handler: () => table('billingItems')
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/billing/items/:itemId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('billingItems', params.itemId, body)
      if (!r) throwBiz(404, '计费项不存在')
      return r
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/billing/bills',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      return queryListLazy(table('bills'), query, {
        searchKeys: ['billNo', 'tenantName', 'period'],
        timeField: 'createTime',
        defaultSort: { by: 'period', order: 'desc' }
      })
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/billing/bills/:billId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const b = find('bills', params.billId)
      if (!b) throwBiz(404, '账单不存在')
      return b
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/billing/bills/:billId/void',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const b = find('bills', params.billId) as any
      if (!b) throwBiz(404, '账单不存在')
      if (b.status === 'paid') throwBiz(400, '已支付的账单不能作废，请先发起退款流程')
      return update('bills', params.billId, { status: 'void' })
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/billing/recharges',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      return queryListLazy(table('recharges'), query, { searchKeys: ['tenantName', 'tradeNo'], defaultSort: { by: 'createTime', order: 'desc' } })
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/billing/recharge',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const { tenantId, amount, method } = body || {}
      const t = find('tenants', tenantId) as any
      if (!t) throwBiz(404, '租户不存在')
      if (!amount || amount <= 0) throwBiz(400, '充值金额必须大于 0')
      const record = {
        id: nextId('recharges', 'RC', 4),
        tenantId,
        tenantName: t.name,
        amount: Number(amount),
        balanceAfter: Number((t.balance + Number(amount)).toFixed(2)),
        method: method || '在线支付',
        tradeNo: 'TR' + dayjs().format('YYYYMMDD') + String(Math.floor(Math.random() * 99999)).padStart(5, '0'),
        status: 'success',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        operator: '客户自助'
      }
      insert('recharges', record)
      update('tenants', tenantId, { balance: record.balanceAfter, status: t.status === 'arrears' && record.balanceAfter > 0 ? 'normal' : t.status })
      return record
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/billing/invoices',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      return queryListLazy(table('invoices'), query, { searchKeys: ['invoiceNo', 'tenantName', 'title'], defaultSort: { by: 'applyTime', order: 'desc' } })
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/billing/invoices',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const t = find('tenants', body.tenantId) as any
      if (!t) throwBiz(404, '租户不存在')
      const record = {
        ...body,
        id: nextId('invoices', 'IV', 4),
        invoiceNo: '',
        tenantName: t.name,
        status: 'pending',
        applyTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        issueTime: null
      }
      insert('invoices', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/billing/invoices/:invoiceId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const inv = find('invoices', params.invoiceId) as any
      if (!inv) throwBiz(404, '发票不存在')
      const payload: any = { ...body }
      if (body.status === 'issued') {
        payload.issueTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
        payload.invoiceNo = 'FP' + dayjs().format('YYYYMMDD') + String(Math.floor(Math.random() * 9999)).padStart(4, '0')
      }
      return update('invoices', params.invoiceId, payload)
    }
  },

  /* ---------- 字典 / 消息 / 系统 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/system/dicts',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const list = table('dictTypes')
      if (query.code) return list.find((d: any) => d.code === query.code) || null
      return list
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/system/dicts/:dictId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('dictTypes', params.dictId, body)
      if (!r) throwBiz(404, '字典不存在')
      return r
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/system/messages',
    latency: 'fast' as const,
    handler: ({ query }: any) => {
      let list = table('messages')
      if (query.type) list = list.filter((m: any) => m.type === query.type)
      if (query.unread === 'true') list = list.filter((m: any) => !m.read)
      return { list: list.slice(0, Number(query.limit || 30)), unread: table('messages').filter((m: any) => !m.read).length }
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/system/messages/read',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const ids: string[] = body?.ids || []
      if (ids.length) {
        ids.forEach((id) => update('messages', id, { read: true }))
      } else {
        table('messages').forEach((m: any) => update('messages', m.id, { read: true }))
      }
      return { success: true }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/system/stats',
    latency: 'fast' as const,
    handler: () => ({
      routeCount: getRouteCount(),
      collections: {
        devices: table('devices').length,
        channels: table('channels').length,
        alarms: table('alarms').length,
        workOrders: table('workOrders').length,
        users: table('users').length,
        tenants: table('tenants').length,
        apiCallLogs: table('apiCallLogs').length,
        operationLogs: table('operationLogs').length
      },
      patches: patchStats()
    })
  },
  {
    method: 'POST' as const,
    path: '/api/v1/system/reset-demo',
    latency: 'fast' as const,
    handler: () => {
      resetAll()
      return { success: true, message: '演示数据已重置为初始状态' }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/system/regions',
    latency: 'fast' as const,
    handler: () => D.REGIONS.map((r) => ({ province: r.province, city: r.city, districts: r.districts }))
  },
  {
    method: 'GET' as const,
    path: '/api/v1/system/snapshot',
    latency: 'fast' as const,
    handler: ({ query }: any) => ({ url: snapshotUrl(String(query.seed || 'demo'), String(query.label || 'CH01'), dayjs().format('YYYY-MM-DD HH:mm:ss')) })
  }
]

/* 局部工具 */
function queryListLazy<T extends Record<string, any>>(source: T[], q: Record<string, any>, opts: any) {
  return queryList(source, q, opts)
}

function paginateLazy<T>(list: T[], q: Record<string, any>) {
  return paginate(list, q.page, q.pageSize)
}
