/**
 * Mock 接口：云存储服务 / 视频与流媒体服务
 */
import dayjs from 'dayjs'
import { defineRoutes } from '../router'
import { find, insert, nextId, remove, table, update } from '../db'
import { throwBiz } from '../utils'
import { snapshotUrl } from '../generator/media'

export const storageRoutes = [
  /* ---------- 存储概览 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/storage/overview',
    latency: 'fast' as const,
    handler: () => {
      const pools = table('storagePools')
      const capacity = pools.reduce((a: number, p: any) => a + p.capacityTB, 0)
      const used = pools.reduce((a: number, p: any) => a + p.usedTB, 0)
      const dates: string[] = []
      const growth: number[] = []
      const records: number[] = []
      for (let i = 29; i >= 0; i--) {
        dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
        growth.push(Number((used * (1 - (i / 30) * 0.09)).toFixed(1)))
        records.push(Math.round(1860000 * (1 - (i / 30) * 0.07)))
      }
      return {
        capacityTB: Number(capacity.toFixed(1)),
        usedTB: Number(used.toFixed(1)),
        freeTB: Number((capacity - used).toFixed(1)),
        usageRate: Number(((used / capacity) * 100).toFixed(1)),
        channelCount: pools.reduce((a: number, p: any) => a + p.channelCount, 0),
        recordCount: 1860000,
        byType: [
          { name: '标准存储', value: Number(pools.filter((p: any) => p.type === 'standard').reduce((a: number, p: any) => a + p.usedTB, 0).toFixed(1)) },
          { name: '低频存储', value: Number(pools.filter((p: any) => p.type === 'ia').reduce((a: number, p: any) => a + p.usedTB, 0).toFixed(1)) },
          { name: '归档存储', value: Number(pools.filter((p: any) => p.type === 'archive').reduce((a: number, p: any) => a + p.usedTB, 0).toFixed(1)) }
        ],
        dates,
        growth,
        records,
        topPools: [...pools].sort((a: any, b: any) => b.usageRate - a.usageRate).slice(0, 6).map((p: any) => ({ name: p.name, usageRate: p.usageRate, usedTB: p.usedTB, capacityTB: p.capacityTB }))
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/storage/pools',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('storagePools')
      if (query.type && query.type !== 'all') list = list.filter((p: any) => p.type === query.type)
      if (query.status && query.status !== 'all') list = list.filter((p: any) => p.status === query.status)
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((p: any) => p.name.toLowerCase().includes(kw) || String(p.region).includes(kw))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/storage/pools',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.name) throwBiz(400, '存储池名称不能为空')
      if (!body?.capacityTB || body.capacityTB <= 0) throwBiz(400, '存储容量必须大于 0')
      const node = find('nodes', body.nodeId) as any
      const record = {
        ...body,
        id: nextId('storagePools', 'SP', 2),
        nodeName: node?.name || '',
        usedTB: 0,
        usageRate: 0,
        channelCount: 0,
        lifecycleRule: body.lifecycleRule || { daysToIA: 7, daysToArchive: 30, daysToDelete: 90 },
        status: 'normal',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      insert('storagePools', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/storage/pools/:poolId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const p = find('storagePools', params.poolId) as any
      if (!p) throwBiz(404, '存储池不存在')
      if (body.capacityTB !== undefined && body.capacityTB < p.usedTB) {
        throwBiz(400, `容量不能小于已用容量（当前已用 ${p.usedTB} TB）`)
      }
      const payload = { ...body }
      if (body.capacityTB) payload.usageRate = Number(((p.usedTB / body.capacityTB) * 100).toFixed(1))
      return update('storagePools', params.poolId, payload)
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/storage/usage',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const dimension = query.dimension || 'tenant'
      const pools = table('storagePools')
      const devices = table('devices')
      const map = new Map<string, { key: string; channelCount: number; usedTB: number; recordDays: number }>()
      devices.forEach((d: any) => {
        const pool = pools.find((p: any) => p.id === d.storagePoolId)
        if (!pool) return
        const perChannel = pool.usedTB / Math.max(1, pool.channelCount)
        const key = dimension === 'tenant' ? d.tenantName : dimension === 'device' ? d.name : `${d.name}-CH01`
        const cur = map.get(key) || { key, channelCount: 0, usedTB: 0, recordDays: pool.retentionDays }
        cur.channelCount += d.channelCount
        cur.usedTB += perChannel * d.channelCount
        map.set(key, cur)
      })
      const list = [...map.values()].map((v) => ({
        ...v,
        usedTB: Number(v.usedTB.toFixed(1)),
        usedGB: Math.round(v.usedTB * 1024),
        cost: Number((v.usedTB * 1024 * 0.28).toFixed(2))
      }))
      const kw = String(query.keyword || '').toLowerCase()
      const filtered = kw ? list.filter((i) => i.key.toLowerCase().includes(kw)) : list
      filtered.sort((a, b) => b.usedTB - a.usedTB)
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      return {
        list: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize,
        summary: {
          totalTB: Number(filtered.reduce((a, b) => a + b.usedTB, 0).toFixed(1)),
          totalGB: filtered.reduce((a, b) => a + b.usedGB, 0),
          totalCost: Number(filtered.reduce((a, b) => a + b.cost, 0).toFixed(2))
        }
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/storage/disks',
    latency: 'list' as const,
    handler: () => {
      const nodes = table('nodes').filter((n: any) => n.type === 'center')
      const list: any[] = []
      nodes.forEach((n: any, ni: number) => {
        for (let i = 0; i < 12; i++) {
          const health = (ni * 12 + i) % 17 === 0 ? 'warning' : (ni * 12 + i) % 41 === 0 ? 'bad' : 'normal'
          list.push({
            id: `DSK${String(ni * 12 + i + 1).padStart(3, '0')}`,
            nodeId: n.id,
            nodeName: n.name,
            slot: i + 1,
            model: i % 3 === 0 ? 'ST8000VX004' : i % 3 === 1 ? 'WD80PURZ' : 'HUS728T8TALE6L4',
            capacityTB: i % 4 === 0 ? 16 : 8,
            usedTB: Number((6 + ((ni * 7 + i) % 9) * 0.6).toFixed(1)),
            health,
            temperature: 30 + ((ni + i) % 14),
            powerOnHours: 3200 + (ni * 137 + i * 311) % 26000,
            raidStatus: health === 'bad' ? '降级' : '正常',
            rebuildProgress: health === 'warning' ? (ni * 13 + i) % 90 : 0
          })
        }
      })
      return { list, total: list.length, warning: list.filter((d) => d.health !== 'normal').length }
    }
  },

  /* ---------- 录像计划 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/storage/plans',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('recordPlans')
      if (query.template && query.template !== 'all') list = list.filter((p: any) => p.template === query.template)
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((p: any) => p.name.toLowerCase().includes(kw))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/storage/plans',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.name) throwBiz(400, '计划名称不能为空')
      if (!body?.channelIds?.length) throwBiz(400, '请至少绑定一个通道')
      if (!body?.timeSlots?.length) throwBiz(400, '请至少配置一个录像时间段')
      const pool = find('storagePools', body.storagePoolId) as any
      const record = {
        ...body,
        id: nextId('recordPlans', 'RP', 3),
        channelCount: body.channelIds.length,
        storagePoolName: pool?.name || '',
        retentionDays: body.retentionDays || pool?.retentionDays || 30,
        status: body.status ?? 1,
        creater: body.creater || '当前用户',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      insert('recordPlans', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/storage/plans/:planId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const payload = { ...body }
      if (body.channelIds) payload.channelCount = body.channelIds.length
      if (body.storagePoolId) payload.storagePoolName = (find('storagePools', body.storagePoolId) as any)?.name || ''
      const r = update('recordPlans', params.planId, payload)
      if (!r) throwBiz(404, '录像计划不存在')
      return r
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/storage/plans/:planId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      remove('recordPlans', params.planId)
      return { success: true }
    }
  },

  /* ---------- 归档任务 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/storage/archive/tasks',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('archiveTasks')
      if (query.status && query.status !== 'all') list = list.filter((t: any) => t.status === query.status)
      if (query.type && query.type !== 'all') list = list.filter((t: any) => t.type === query.type)
      return { list, total: list.length }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/storage/archive',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const from = find('storagePools', body?.fromPoolId) as any
      const to = find('storagePools', body?.toPoolId) as any
      if (!from || !to) throwBiz(404, '存储池不存在')
      if (from.id === to.id) throwBiz(400, '源存储池与目标存储池不能相同')
      if (!body?.beforeDays || body.beforeDays <= 0) throwBiz(400, '请填写有效的归档数据天数')
      const record = {
        id: nextId('archiveTasks', 'AR', 3),
        name: `${from.name} → ${to.name} 归档任务`,
        type: 'archive',
        recordCount: Math.round(from.channelCount * body.beforeDays * 12),
        fileSize: Math.round(from.usedTB * 1024 * 0.32),
        progress: 0,
        status: 'running',
        fromStorage: from.name,
        toStorage: to.name,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        creator: body.creator || '当前用户'
      }
      insert('archiveTasks', record)
      return record
    }
  },

  /* ---------- 转码模板 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/transcode-templates',
    latency: 'list' as const,
    handler: () => table('transcodeTemplates')
  },
  {
    method: 'POST' as const,
    path: '/api/v1/transcode-templates',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.name) throwBiz(400, '模板名称不能为空')
      const record = { ...body, id: nextId('transcodeTemplates', 'TC', 2), usageCount: 0, isDefault: false, createTime: dayjs().format('YYYY-MM-DD HH:mm:ss') }
      insert('transcodeTemplates', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/transcode-templates/:templateId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('transcodeTemplates', params.templateId, body)
      if (!r) throwBiz(404, '模板不存在')
      return r
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/transcode-templates/:templateId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const t = find('transcodeTemplates', params.templateId) as any
      if (t?.isDefault) throwBiz(400, '默认模板不允许删除，请先设置其他模板为默认')
      remove('transcodeTemplates', params.templateId)
      return { success: true }
    }
  },

  /* ---------- 视频质量诊断 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/quality-checks',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('qualityChecks')
      if (query.status && query.status !== 'all') list = list.filter((q: any) => q.status === query.status)
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((q: any) => q.deviceName.toLowerCase().includes(kw))
      list = list.slice().sort((a: any, b: any) => (a.createTime < b.createTime ? 1 : -1))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      const avgScore = list.length ? Number((list.reduce((a: number, q: any) => a + q.score, 0) / list.length).toFixed(1)) : 0
      return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize, avgScore }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/quality-checks',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const deviceIds: string[] = body?.deviceIds || []
      if (!deviceIds.length) throwBiz(400, '请至少选择一台设备')
      const created: any[] = []
      deviceIds.slice(0, 20).forEach((id) => {
        const dev = find('devices', id) as any
        if (!dev) return
        const record = {
          id: nextId('qualityChecks', 'QC', 3),
          name: `${dev.name} 视频质量诊断`,
          deviceId: dev.id,
          deviceName: dev.name,
          channelNo: 1,
          items: body.items || ['丢包检测', '卡顿检测', '花屏检测', '黑屏检测', '亮度异常', '遮挡检测'],
          score: 0,
          problems: [],
          status: 'running',
          snapshotUrl: snapshotUrl(dev.id + Date.now(), dev.name, dayjs().format('YYYY-MM-DD HH:mm:ss')),
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }
        insert('qualityChecks', record)
        created.push(record)
      })
      return { success: true, count: created.length, message: `已创建 ${created.length} 个视频质量诊断任务` }
    }
  },

  /* ---------- 直播频道 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/live-channels',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('liveChannels')
      if (query.visibility && query.visibility !== 'all') list = list.filter((c: any) => c.visibility === query.visibility)
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((c: any) => c.name.toLowerCase().includes(kw))
      return { list, total: list.length, totalViews: list.reduce((a: number, c: any) => a + c.viewCount, 0) }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/live-channels',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.name) throwBiz(400, '频道名称不能为空')
      const dev = find('devices', body.deviceId) as any
      if (!dev) throwBiz(404, '设备不存在')
      const record = {
        ...body,
        id: nextId('liveChannels', 'LC', 3),
        deviceName: dev.name,
        shareToken: Array.from({ length: 24 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join(''),
        expiresAt: dayjs().add(30, 'day').format('YYYY-MM-DD HH:mm:ss'),
        viewCount: 0,
        status: 1,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      insert('liveChannels', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/live-channels/:channelId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('liveChannels', params.channelId, body)
      if (!r) throwBiz(404, '频道不存在')
      return r
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/live-channels/:channelId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      remove('liveChannels', params.channelId)
      return { success: true }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/live-channels/:channelId/refresh-token',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const c = find('liveChannels', params.channelId) as any
      if (!c) throwBiz(404, '频道不存在')
      const token = Array.from({ length: 24 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')
      update('liveChannels', params.channelId, { shareToken: token, expiresAt: dayjs().add(30, 'day').format('YYYY-MM-DD HH:mm:ss') })
      return { shareToken: token, expiresAt: dayjs().add(30, 'day').format('YYYY-MM-DD HH:mm:ss') }
    }
  }
]
