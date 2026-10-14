/**
 * Mock 接口：运维监控（集群 / 节点 / 微服务 / 拓扑 / 日志 / 容量预测 / 维护窗口）
 */
import dayjs from 'dayjs'
import { defineRoutes } from '../router'
import { find, table, update } from '../db'
import { throwBiz } from '../utils'

const MAINTENANCE: any[] = []

export const monitorRoutes = [
  {
    method: 'GET' as const,
    path: '/api/v1/monitor/cluster',
    latency: 'fast' as const,
    handler: () => {
      const nodes = table('nodes')
      const devices = table('devices')
      const services = table('microServices')
      const jitter = (base: number, amp = 3) => Number(Math.max(1, Math.min(99, base + (Math.random() * amp * 2 - amp))).toFixed(1))
      return {
        cpuUsage: jitter(nodes.reduce((a: number, n: any) => a + n.cpuUsage, 0) / nodes.length),
        memUsage: jitter(nodes.reduce((a: number, n: any) => a + n.memUsage, 0) / nodes.length),
        diskUsage: jitter(nodes.reduce((a: number, n: any) => a + n.diskUsage, 0) / nodes.length),
        gpuUsage: jitter(nodes.reduce((a: number, n: any) => a + n.gpuUsage, 0) / nodes.length),
        bandwidthGbps: Number((nodes.reduce((a: number, n: any) => a + n.bandwidthMbps, 0) / 1000).toFixed(1)),
        totalNodes: nodes.length,
        onlineNodes: nodes.filter((n: any) => n.status === 'online').length,
        warningNodes: nodes.filter((n: any) => n.status === 'warning').length,
        offlineNodes: nodes.filter((n: any) => n.status === 'offline').length,
        centerNodes: nodes.filter((n: any) => n.type === 'center').length,
        edgeNodes: nodes.filter((n: any) => n.type === 'edge').length,
        runningTasks: nodes.reduce((a: number, n: any) => a + n.runningTasks, 0),
        deviceCount: devices.length,
        serviceHealthy: services.filter((s: any) => s.status === 'healthy').length,
        serviceTotal: services.length,
        uptimeDays: 186,
        // 实时曲线：近 30 个采样点
        realtime: {
          time: Array.from({ length: 30 }, (_, i) => dayjs().subtract(29 - i, 'minute').format('HH:mm')),
          cpu: Array.from({ length: 30 }, () => jitter(nodes.reduce((a: number, n: any) => a + n.cpuUsage, 0) / nodes.length, 6)),
          mem: Array.from({ length: 30 }, () => jitter(nodes.reduce((a: number, n: any) => a + n.memUsage, 0) / nodes.length, 4)),
          gpu: Array.from({ length: 30 }, () => jitter(nodes.reduce((a: number, n: any) => a + n.gpuUsage, 0) / nodes.length, 8)),
          bandwidth: Array.from({ length: 30 }, () => Number((nodes.reduce((a: number, n: any) => a + n.bandwidthMbps, 0) / 1000 / 1.5 + Math.random() * 0.6 - 0.3).toFixed(2)))
        }
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/monitor/nodes',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('nodes')
      if (query.type && query.type !== 'all') list = list.filter((n: any) => n.type === query.type)
      if (query.status && query.status !== 'all') list = list.filter((n: any) => n.status === query.status)
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((n: any) => [n.name, n.ip, n.region].some((v: any) => String(v).toLowerCase().includes(kw)))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/monitor/nodes/:nodeId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const n = find('nodes', params.nodeId) as any
      if (!n) throwBiz(404, '节点不存在')
      return {
        ...n,
        diskPartitions: [
          { mount: '/data', capacityTB: 180, usedTB: Number((n.diskUsage * 1.8).toFixed(1)) },
          { mount: '/', capacityTB: 1, usedTB: Number((n.diskUsage / 100).toFixed(2)) },
          { mount: '/log', capacityTB: 2, usedTB: Number(((n.diskUsage / 100) * 1.4).toFixed(2)) }
        ],
        services: table('microServices')
          .slice(0, 4)
          .map((s: any) => ({ name: s.name, replicas: Math.max(1, Math.round(s.replicas / 2)), status: s.status }))
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/monitor/services',
    latency: 'list' as const,
    handler: () => {
      const services = table('microServices')
      return {
        list: services,
        summary: {
          total: services.length,
          healthy: services.filter((s: any) => s.status === 'healthy').length,
          degraded: services.filter((s: any) => s.status === 'degraded').length,
          fused: services.filter((s: any) => s.status === 'fused').length,
          totalQps: services.reduce((a: number, s: any) => a + s.qps, 0),
          avgLatency: Math.round(services.reduce((a: number, s: any) => a + s.avgLatency, 0) / services.length)
        }
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/monitor/topology',
    latency: 'fast' as const,
    handler: () => {
      const services = table('microServices')
      const nodes = services.map((s: any) => ({
        id: s.code,
        name: s.name,
        status: s.status,
        qps: s.qps,
        latency: s.avgLatency,
        errorRate: s.errorRate,
        replicas: s.replicas,
        healthyReplicas: s.healthyReplicas
      }))
      const links: { source: string; target: string }[] = []
      services.forEach((s: any) => {
        ;(s.dependsOn || []).forEach((d: string) => links.push({ source: d, target: s.code }))
      })
      return { nodes, links }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/monitor/logs',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('logEntries')
      if (query.level && query.level !== 'all') list = list.filter((l: any) => l.level === query.level)
      if (query.service && query.service !== 'all') list = list.filter((l: any) => l.service === query.service)
      if (query.traceId) list = list.filter((l: any) => l.traceId === query.traceId)
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((l: any) => [l.content, l.traceId, l.ip].some((v: any) => String(v).toLowerCase().includes(kw)))
      if (query.startTime) list = list.filter((l: any) => new Date(l.createTime).getTime() >= new Date(query.startTime).getTime())
      if (query.endTime) list = list.filter((l: any) => new Date(l.createTime).getTime() <= new Date(query.endTime).getTime())
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 50)
      const all = table('logEntries')
      return {
        list: list.slice((page - 1) * pageSize, page * pageSize),
        total: list.length,
        page,
        pageSize,
        levels: ['INFO', 'WARN', 'ERROR', 'DEBUG'].map((lv) => ({ name: lv, value: all.filter((l: any) => l.level === lv).length })),
        services: [...new Set(all.map((l: any) => l.service))]
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/monitor/capacity',
    latency: 'fast' as const,
    handler: () => {
      const pools = table('storagePools')
      const used = pools.reduce((a: number, p: any) => a + p.usedTB, 0)
      const capacity = pools.reduce((a: number, p: any) => a + p.capacityTB, 0)
      const dailyGrowth = Number((used / 180 / 1.0).toFixed(2))
      const dates: string[] = []
      const history: number[] = []
      const forecast: (number | null)[] = []
      for (let i = 29; i >= 0; i--) {
        dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
        history.push(Number((used - dailyGrowth * i).toFixed(1)))
        forecast.push(null)
      }
      for (let i = 1; i <= 30; i++) {
        dates.push(dayjs().add(i, 'day').format('MM-DD'))
        history.push(null as any)
        forecast.push(Number((used + dailyGrowth * i).toFixed(1)))
      }
      const daysToFull = Math.max(0, Math.round((capacity - used) / Math.max(0.01, dailyGrowth)))
      return {
        usedTB: Number(used.toFixed(1)),
        capacityTB: Number(capacity.toFixed(1)),
        dailyGrowthTB: dailyGrowth,
        daysToFull,
        suggestExpandTB: Math.max(20, Math.round(dailyGrowth * 180)),
        dates,
        history,
        forecast,
        deviceGrowth: { last30: 42, forecast30: 38 },
        aiTaskGrowth: { last30: 6, forecast30: 9 },
        suggestions: [
          daysToFull < 60 ? `按当前增速，存储池将在 ${daysToFull} 天后写满，建议立即扩容 ${Math.round(dailyGrowth * 180)} TB` : `存储容量充足，预计 ${daysToFull} 天后达到上限，可提前规划扩容`,
          `近 30 天日均增长 ${dailyGrowth} TB，其中低频/归档存储占比可通过生命周期策略进一步优化`,
          `边缘节点带宽峰值已达设计值 78%，建议对高码率通道启用子码流回传`
        ]
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/monitor/maintenance',
    latency: 'fast' as const,
    handler: () => ({ list: MAINTENANCE })
  },
  {
    method: 'POST' as const,
    path: '/api/v1/monitor/maintenance',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.name) throwBiz(400, '维护窗口名称不能为空')
      if (!body?.startTime || !body?.endTime) throwBiz(400, '请选择维护时间范围')
      if (new Date(body.startTime).getTime() >= new Date(body.endTime).getTime()) throwBiz(400, '结束时间必须晚于开始时间')
      const record = {
        id: 'MW' + String(MAINTENANCE.length + 1).padStart(3, '0'),
        name: body.name,
        scope: body.scope || '全部设备',
        alarmTypes: body.alarmTypes || [],
        startTime: body.startTime,
        endTime: body.endTime,
        reason: body.reason || '',
        creator: body.creator || '当前用户',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      MAINTENANCE.unshift(record)
      return record
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/monitor/maintenance/:id',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const idx = MAINTENANCE.findIndex((m) => m.id === params.id)
      if (idx >= 0) MAINTENANCE.splice(idx, 1)
      return { success: true }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/monitor/health-report',
    latency: 'fast' as const,
    handler: () => {
      const nodes = table('nodes')
      const services = table('microServices')
      const devices = table('devices')
      const alarms = table('alarms')
      const score = Math.round(
        (devices.filter((d: any) => d.onlineStatus === 'online').length / devices.length) * 40 +
          (nodes.filter((n: any) => n.status === 'online').length / nodes.length) * 30 +
          (services.filter((s: any) => s.status === 'healthy').length / services.length) * 30
      )
      const recentAlarms = alarms.filter((a: any) => dayjs().diff(dayjs(a.occurTime), 'hour') <= 24)
      return {
        score,
        grade: score >= 95 ? '优秀' : score >= 88 ? '良好' : score >= 75 ? '一般' : '需关注',
        items: [
          { name: '设备在线率', value: Number(((devices.filter((d: any) => d.onlineStatus === 'online').length / devices.length) * 100).toFixed(1)), target: 95, status: 'ok' },
          { name: '节点可用率', value: Number(((nodes.filter((n: any) => n.status !== 'offline').length / nodes.length) * 100).toFixed(1)), target: 99, status: 'warn' },
          { name: '服务健康率', value: Number(((services.filter((s: any) => s.status === 'healthy').length / services.length) * 100).toFixed(1)), target: 100, status: 'warn' },
          { name: '存储水位', value: Number(((table('storagePools').reduce((a: number, p: any) => a + p.usedTB, 0) / table('storagePools').reduce((a: number, p: any) => a + p.capacityTB, 0)) * 100).toFixed(1)), target: 85, status: 'ok' },
          { name: '24h 告警量', value: recentAlarms.length, target: 200, status: recentAlarms.length > 200 ? 'warn' : 'ok' }
        ],
        generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/monitor/nodes/:nodeId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('nodes', params.nodeId, body)
      if (!r) throwBiz(404, '节点不存在')
      return r
    }
  }
]
