/**
 * Mock 接口：数据服务与开放平台（应用 / API 目录 / 调试台 / 调用统计 / 数据订阅 / 导出任务）
 */
import dayjs from 'dayjs'
import { defineRoutes } from '../router'
import { find, insert, nextId, remove, table, update } from '../db'
import { throwBiz } from '../utils'

function randomToken(len: number): string {
  return Array.from({ length: len }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')
}

export const openapiRoutes = [
  /* ---------- 应用管理 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/open/apps',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('openApps').map((a: any) => ({ ...a, appSecret: mask(a.appSecret) }))
      if (query.status !== undefined && query.status !== '' && query.status !== 'all') list = list.filter((a: any) => String(a.status) === String(query.status))
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((a: any) => [a.appName, a.owner, a.appKey, a.tenantName].some((v: any) => String(v).toLowerCase().includes(kw)))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/open/apps',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.appName) throwBiz(400, '应用名称不能为空')
      if (!body?.tenantId) throwBiz(400, '请选择所属租户')
      const tenant = find('tenants', body.tenantId) as any
      const record = {
        id: nextId('openApps', 'APP', 3),
        appName: body.appName,
        appKey: 'AK' + randomToken(20).toUpperCase(),
        appSecret: randomToken(32),
        owner: body.owner || '当前用户',
        tenantId: body.tenantId,
        tenantName: tenant?.name || '',
        ipWhitelist: body.ipWhitelist || [],
        qpsLimit: body.qpsLimit || 100,
        status: 1,
        callCount7d: 0,
        callCount30d: 0,
        successRate: 100,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      insert('openApps', record)
      return { ...record, appSecretVisibleOnce: true }
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/open/apps/:appId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const payload: any = { ...body }
      delete payload.appSecret
      if (body.tenantId) payload.tenantName = (find('tenants', body.tenantId) as any)?.name || ''
      const r = update('openApps', params.appId, payload)
      if (!r) throwBiz(404, '应用不存在')
      return { ...r, appSecret: mask(r.appSecret) }
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/open/apps/:appId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      remove('openApps', params.appId)
      return { success: true }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/open/apps/:appId/reset-secret',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const a = find('openApps', params.appId) as any
      if (!a) throwBiz(404, '应用不存在')
      const secret = randomToken(32)
      update('openApps', params.appId, { appSecret: secret })
      return { appSecret: secret, message: 'AppSecret 已重置，请立即保存，重置后旧密钥立即失效' }
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/open/apps/:appId/status',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const a = find('openApps', params.appId) as any
      if (!a) throwBiz(404, '应用不存在')
      const r = update('openApps', params.appId, { status: body.status })
      return { ...r, appSecret: mask((r as any).appSecret) }
    }
  },

  /* ---------- API 目录 & 调试台 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/open/endpoints',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const list = table('apiEndpoints')
      if (query.group && query.group !== 'all') return { list: list.filter((e: any) => e.group === query.group), groups: [...new Set(list.map((e: any) => e.group))] }
      return { list, groups: [...new Set(list.map((e: any) => e.group))] }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/open/debug',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const ep = table('apiEndpoints').find((e: any) => e.id === body?.endpointId) as any
      if (!ep) throwBiz(404, '接口不存在')
      // 必填参数校验，让调试台有真实的报错体验
      const missing = (ep.params || []).filter((p: any) => p.required && !body.params?.[p.name])
      const start = Date.now() + Math.floor(Math.random() * 200)
      if (missing.length) {
        return {
          statusCode: 400,
          duration: Math.floor(Math.random() * 60) + 20,
          body: { code: 400, message: `缺少必填参数：${missing.map((m: any) => m.name).join('、')}`, data: null, traceId: 'trace-missing-param' },
          requestId: 'req_' + start
        }
      }
      let payload: any = {}
      try {
        payload = JSON.parse(ep.responseExample)
      } catch {
        payload = { code: 0, message: 'ok', data: null }
      }
      payload.traceId = 'trace-' + randomToken(16)
      payload.timestamp = Date.now()
      return {
        statusCode: 200,
        duration: Math.floor(Math.random() * 480) + 30,
        body: payload,
        requestUrl: `https://open.videocloud.com${ep.path}?appKey=AKXXXX`,
        requestId: 'req_' + start
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/open/call-logs',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('apiCallLogs')
      if (query.appId && query.appId !== 'all') list = list.filter((l: any) => l.appId === query.appId)
      if (query.method && query.method !== 'all') list = list.filter((l: any) => l.method === query.method)
      if (query.statusCode && query.statusCode !== 'all') {
        const code = Number(query.statusCode)
        list = code === 200 ? list.filter((l: any) => l.statusCode === 200) : list.filter((l: any) => l.statusCode !== 200)
      }
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((l: any) => [l.path, l.appName, l.endpoint, l.ip].some((v: any) => String(v).toLowerCase().includes(kw)))
      if (query.startTime) list = list.filter((l: any) => new Date(l.createTime).getTime() >= new Date(query.startTime).getTime())
      if (query.endTime) list = list.filter((l: any) => new Date(l.createTime).getTime() <= new Date(query.endTime).getTime())
      list = list.slice().sort((a: any, b: any) => (a.createTime < b.createTime ? 1 : -1))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/open/stats',
    latency: 'fast' as const,
    handler: ({ query }: any) => {
      const days = Number(query.days || 14)
      const logs = table('apiCallLogs')
      const inRange = logs.filter((l: any) => dayjs().diff(dayjs(l.createTime), 'day') <= days)
      const dates: string[] = []
      const counts: number[] = []
      const errors: number[] = []
      for (let i = days - 1; i >= 0; i--) {
        const key = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
        dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
        const dayLogs = inRange.filter((l: any) => String(l.createTime).startsWith(key))
        counts.push(dayLogs.length)
        errors.push(dayLogs.filter((l: any) => l.statusCode !== 200).length)
      }
      const total = inRange.length
      const errCount = inRange.filter((l: any) => l.statusCode !== 200).length
      const codeMap = new Map<string, number>()
      inRange.filter((l: any) => l.statusCode !== 200).forEach((l: any) => codeMap.set(String(l.statusCode), (codeMap.get(String(l.statusCode)) || 0) + 1))
      const epMap = new Map<string, { count: number; err: number }>()
      inRange.forEach((l: any) => {
        const cur = epMap.get(l.path) || { count: 0, err: 0 }
        cur.count++
        if (l.statusCode !== 200) cur.err++
        epMap.set(l.path, cur)
      })
      const appMap = new Map<string, number>()
      inRange.forEach((l: any) => appMap.set(l.appName, (appMap.get(l.appName) || 0) + 1))
      return {
        dates,
        counts,
        errors,
        total,
        successRate: total ? Number((((total - errCount) / total) * 100).toFixed(2)) : 100,
        avgDuration: total ? Math.round(inRange.reduce((a: number, l: any) => a + l.duration, 0) / total) : 0,
        p95Duration: total ? [...inRange].sort((a: any, b: any) => a.duration - b.duration)[Math.floor(total * 0.95)]?.duration || 0 : 0,
        qps: Number((total / (days * 86400) * 8).toFixed(2)),
        errorCodes: [...codeMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        topEndpoints: [...epMap.entries()]
          .map(([path, v]) => ({ name: path, count: v.count, errorRate: Number(((v.err / v.count) * 100).toFixed(2)) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        topApps: [...appMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)
      }
    }
  },

  /* ---------- 数据订阅 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/open/webhooks',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('webhooks')
      if (query.status !== undefined && query.status !== '' && query.status !== 'all') list = list.filter((w: any) => String(w.status) === String(query.status))
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((w: any) => [w.name, w.url].some((v: any) => String(v).toLowerCase().includes(kw)))
      return { list: list.map((w: any) => ({ ...w, pushRecords: undefined, pushCount: w.pushRecords.length, failCount: w.pushRecords.filter((r: any) => r.result === 'fail').length })), total: list.length }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/open/webhooks/:webhookId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const w = find('webhooks', params.webhookId)
      if (!w) throwBiz(404, '订阅配置不存在')
      return w
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/open/webhooks',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.name) throwBiz(400, '订阅名称不能为空')
      if (!/^https?:\/\/.+/.test(String(body.url || ''))) throwBiz(400, '回调地址必须以 http:// 或 https:// 开头')
      if (!body?.events?.length) throwBiz(400, '请至少订阅一个事件类型')
      const record = {
        ...body,
        id: nextId('webhooks', 'WH', 3),
        secret: randomToken(24),
        retryPolicy: body.retryPolicy || '失败重试 3 次，间隔 5s',
        status: body.status ?? 1,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        pushRecords: []
      }
      insert('webhooks', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/open/webhooks/:webhookId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('webhooks', params.webhookId, body)
      if (!r) throwBiz(404, '订阅配置不存在')
      return r
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/open/webhooks/:webhookId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      remove('webhooks', params.webhookId)
      return { success: true }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/open/webhooks/:webhookId/test',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const w = find('webhooks', params.webhookId) as any
      if (!w) throwBiz(404, '订阅配置不存在')
      const ok = Math.random() > 0.25
      const record = {
        id: 'PSH' + Date.now().toString().slice(-8),
        event: '测试推送',
        time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        httpStatus: ok ? 200 : 500,
        duration: Math.floor(Math.random() * 900) + 40,
        retryCount: 0,
        result: (ok ? 'success' : 'fail') as 'success' | 'fail'
      }
      update('webhooks', params.webhookId, { pushRecords: [record, ...(w.pushRecords || [])] })
      return { success: ok, record, message: ok ? '测试推送成功，目标端已返回 200' : '测试推送失败，目标端返回 500，请检查回调地址' }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/open/webhooks/:webhookId/retry',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const w = find('webhooks', params.webhookId) as any
      if (!w) throwBiz(404, '订阅配置不存在')
      const target = (w.pushRecords || []).find((r: any) => r.id === body?.recordId)
      if (!target) throwBiz(404, '推送记录不存在')
      const idx = w.pushRecords.findIndex((r: any) => r.id === body.recordId)
      const updated = { ...target, retryCount: (target.retryCount || 0) + 1, result: 'success', httpStatus: 200, time: dayjs().format('YYYY-MM-DD HH:mm:ss') }
      const records = [...w.pushRecords]
      records[idx] = updated
      update('webhooks', params.webhookId, { pushRecords: records })
      return { success: true, record: updated, message: '重推成功' }
    }
  },

  /* ---------- 导出任务 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/open/exports',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('exportTasks')
      if (query.status && query.status !== 'all') list = list.filter((t: any) => t.status === query.status)
      return { list, total: list.length }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/open/exports',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.dataType) throwBiz(400, '请选择导出数据类型')
      const record = {
        id: nextId('exportTasks', 'EX', 3),
        name: `${body.dataType}导出-${dayjs().format('YYYYMMDD')}`,
        dataType: body.dataType,
        conditions: body.conditions || '全部数据',
        rowCount: 0,
        fileSize: 0,
        progress: 0,
        status: 'running',
        creator: body.creator || '当前用户',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      insert('exportTasks', record)
      return record
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/open/exports/:taskId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      remove('exportTasks', params.taskId)
      return { success: true }
    }
  }
]

function mask(secret: string): string {
  if (!secret) return ''
  return secret.slice(0, 6) + '••••••••••••' + secret.slice(-4)
}
