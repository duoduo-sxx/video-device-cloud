/**
 * Mock 接口：AI 智能分析（算法市场 / 算法任务 / 识别事件）
 */
import dayjs from 'dayjs'
import { defineRoutes } from '../router'
import { find, insert, nextId, remove, table, update } from '../db'
import { throwBiz } from '../utils'

export const aiRoutes = [
  {
    method: 'GET' as const,
    path: '/api/v1/ai/algorithms',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('algorithms')
      if (query.type && query.type !== 'all') list = list.filter((a: any) => a.type === query.type)
      if (query.vendor && query.vendor !== 'all') list = list.filter((a: any) => a.vendor === query.vendor)
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((a: any) => [a.name, a.code, a.vendor].some((v: any) => String(v).toLowerCase().includes(kw)))
      if (query.sortBy === 'accuracy') list = [...list].sort((a: any, b: any) => b.accuracy - a.accuracy)
      if (query.sortBy === 'price') list = [...list].sort((a: any, b: any) => a.price - b.price)
      return { list, total: list.length, vendors: [...new Set(table('algorithms').map((a: any) => a.vendor))], types: [...new Set(table('algorithms').map((a: any) => a.type))] }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/ai/algorithms/:algorithmId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const a = find('algorithms', params.algorithmId) as any
      if (!a) throwBiz(404, '算法不存在')
      const tasks = table('aiTasks').filter((t: any) => t.algorithmId === a.id)
      const events = table('alarms').filter((x: any) => x.category === 'ai' && x.algorithmName === a.name)
      return {
        ...a,
        taskCount: tasks.length,
        runningTaskCount: tasks.filter((t: any) => t.status === 'running').length,
        eventTotal: events.length,
        avgConfidence: events.length ? Number((events.reduce((s: number, e: any) => s + e.confidence, 0) / events.length).toFixed(3)) : 0,
        accuracyTrend: Array.from({ length: 14 }, (_, i) => ({
          date: dayjs().subtract(13 - i, 'day').format('MM-DD'),
          value: Number((a.accuracy + Math.sin(i / 2) * 1.6 - 0.8).toFixed(1))
        }))
      }
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/ai/algorithms/:algorithmId/status',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const a = find('algorithms', params.algorithmId) as any
      if (!a) throwBiz(404, '算法不存在')
      if (a.status === 1 && body.status === 0) {
        const running = table('aiTasks').filter((t: any) => t.algorithmId === a.id && t.status === 'running')
        if (running.length) throwBiz(400, `该算法仍有 ${running.length} 个任务在运行，请先停止任务再下架`)
      }
      return update('algorithms', params.algorithmId, { status: body.status, updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss') })
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/ai/tasks',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('aiTasks')
      if (query.status && query.status !== 'all') list = list.filter((t: any) => t.status === query.status)
      if (query.algorithmName && query.algorithmName !== 'all') list = list.filter((t: any) => t.algorithmName === query.algorithmName)
      if (query.alarmLevel && query.alarmLevel !== 'all') list = list.filter((t: any) => t.alarmLevel === query.alarmLevel)
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((t: any) => t.name.toLowerCase().includes(kw) || t.algorithmName.toLowerCase().includes(kw))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      list = list.slice().sort((a: any, b: any) => (a.createTime < b.createTime ? 1 : -1))
      return {
        list: list.slice((page - 1) * pageSize, page * pageSize),
        total: list.length,
        page,
        pageSize,
        stats: {
          total: table('aiTasks').length,
          running: table('aiTasks').filter((t: any) => t.status === 'running').length,
          stopped: table('aiTasks').filter((t: any) => t.status === 'stopped').length,
          abnormal: table('aiTasks').filter((t: any) => t.status === 'abnormal').length,
          channelCount: table('aiTasks').reduce((a: number, t: any) => a + t.channelCount, 0),
          gpuUsage: Number(table('aiTasks').filter((t: any) => t.status === 'running').reduce((a: number, t: any) => a + t.gpuUsage, 0).toFixed(1))
        }
      }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/ai/tasks',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.name) throwBiz(400, '任务名称不能为空')
      if (!body?.algorithmId) throwBiz(400, '请选择算法')
      if (!body?.channelIds?.length) throwBiz(400, '请至少选择一个通道')
      const alg = find('algorithms', body.algorithmId) as any
      if (!alg) throwBiz(404, '算法不存在')
      if (alg.status === 0) throwBiz(400, '该算法已下架，无法创建任务')
      if (body.threshold !== undefined && (body.threshold < 0.1 || body.threshold > 1)) throwBiz(400, '置信度阈值需在 0.1 ~ 1 之间')
      const record = {
        ...body,
        id: nextId('aiTasks', 'AIT', 3),
        algorithmName: alg.name,
        channelCount: body.channelIds.length,
        schedule: body.schedule || { startTime: '00:00', endTime: '23:59', days: [1, 2, 3, 4, 5, 6, 7] },
        roi: body.roi || [],
        gpuUsage: 0,
        eventsToday: 0,
        accuracy: alg.accuracy,
        status: 'stopped',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      insert('aiTasks', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/ai/tasks/:taskId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const payload = { ...body }
      if (body.channelIds) payload.channelCount = body.channelIds.length
      if (body.algorithmId) payload.algorithmName = (find('algorithms', body.algorithmId) as any)?.name || ''
      const r = update('aiTasks', params.taskId, payload)
      if (!r) throwBiz(404, '任务不存在')
      return r
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/ai/tasks/:taskId/status',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const t = find('aiTasks', params.taskId) as any
      if (!t) throwBiz(404, '任务不存在')
      const status = body?.status
      if (!['running', 'stopped'].includes(status)) throwBiz(400, '仅支持启动或停止任务')
      if (t.status === status) throwBiz(400, status === 'running' ? '任务已在运行中' : '任务已是停止状态')
      const alg = find('algorithms', t.algorithmId) as any
      if (status === 'running' && alg?.status === 0) throwBiz(400, '关联算法已下架，无法启动任务')
      return update('aiTasks', params.taskId, {
        status,
        gpuUsage: status === 'running' ? Number((alg?.gpuCost ? alg.gpuCost * 12 + Math.random() * 8 : 12 + Math.random() * 8).toFixed(1)) : 0,
        eventsToday: status === 'running' ? Math.floor(Math.random() * 20) : 0
      })
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/ai/tasks/:taskId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const t = find('aiTasks', params.taskId) as any
      if (!t) throwBiz(404, '任务不存在')
      if (t.status === 'running') throwBiz(400, '运行中的任务无法删除，请先停止任务')
      remove('aiTasks', params.taskId)
      return { success: true }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/ai/events',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('alarms').filter((a: any) => a.category === 'ai')
      if (query.algorithmName && query.algorithmName !== 'all') list = list.filter((a: any) => a.algorithmName === query.algorithmName)
      if (query.type && query.type !== 'all') list = list.filter((a: any) => a.type === query.type)
      if (query.minConfidence) list = list.filter((a: any) => a.confidence >= Number(query.minConfidence))
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((a: any) => [a.deviceName, a.type, a.tenantName].some((v: any) => String(v).toLowerCase().includes(kw)))
      if (query.startTime) list = list.filter((a: any) => new Date(a.occurTime).getTime() >= new Date(query.startTime).getTime())
      if (query.endTime) list = list.filter((a: any) => new Date(a.occurTime).getTime() <= new Date(query.endTime).getTime())
      list = list.slice().sort((a: any, b: any) => (a.occurTime < b.occurTime ? 1 : -1))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 24)
      return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/ai/events/stats',
    latency: 'fast' as const,
    handler: ({ query }: any) => {
      const days = Number(query.days || 7)
      const list = table('alarms').filter((a: any) => a.category === 'ai' && dayjs().diff(dayjs(a.occurTime), 'day') <= days)
      const dates: string[] = []
      const counts: number[] = []
      for (let i = days - 1; i >= 0; i--) {
        const key = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
        dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
        counts.push(list.filter((a: any) => String(a.occurTime).startsWith(key)).length)
      }
      const byAlg = new Map<string, { count: number; conf: number }>()
      list.forEach((a: any) => {
        const cur = byAlg.get(a.algorithmName || a.type) || { count: 0, conf: 0 }
        cur.count++
        cur.conf += a.confidence
        byAlg.set(a.algorithmName || a.type, cur)
      })
      const byHour = Array.from({ length: 24 }, (_, h) => ({
        hour: `${String(h).padStart(2, '0')}:00`,
        value: list.filter((a: any) => dayjs(a.occurTime).hour() === h).length
      }))
      return {
        dates,
        counts,
        total: list.length,
        falseRate: Number(((list.filter((a: any) => a.status === 'false_alarm').length / Math.max(1, list.length)) * 100).toFixed(1)),
        avgConfidence: list.length ? Number((list.reduce((s: number, a: any) => s + a.confidence, 0) / list.length).toFixed(3)) : 0,
        algorithms: [...byAlg.entries()].map(([name, v]) => ({ name, count: v.count, confidence: Number((v.conf / Math.max(1, v.count)).toFixed(3)) })).sort((a, b) => b.count - a.count),
        byHour
      }
    }
  }
]
