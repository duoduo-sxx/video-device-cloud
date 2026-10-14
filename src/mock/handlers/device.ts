/**
 * Mock 接口：设备中心 / 通道 / 录像 / 固件与 OTA
 */
import dayjs from 'dayjs'
import { defineRoutes } from '../router'
import { find, insert, nextId, remove, removeMany, table, update } from '../db'
import { paginate, queryList, throwBiz } from '../utils'
import { deviceThumbUrl, snapshotUrl } from '../generator/media'
import * as D from '../generator/dict'

const FW_KEEP: Record<string, string> = {}

export const deviceRoutes = [
  /* ---------- 设备列表 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/devices',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const list = table('devices')
      const result = queryList(list, query, {
        searchKeys: ['name', 'sn', 'ip', 'model', 'installAddress'],
        likeFields: ['tags'],
        defaultSort: { by: 'createTime', order: 'desc' }
      })
      return {
        ...result,
        list: result.list.map((d: any) => ({ ...d, thumb: deviceThumbUrl(d.id, d.category) }))
      }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/devices',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.sn) throwBiz(400, '设备序列号（SN）不能为空')
      if (!/^[A-Za-z0-9-]{6,32}$/.test(body.sn)) throwBiz(400, '设备序列号格式不正确，仅允许字母、数字与短横线')
      if (table('devices').some((d: any) => d.sn === body.sn)) throwBiz(400, `设备序列号 ${body.sn} 已存在，请核对后重新录入`)
      if (body.ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(body.ip)) throwBiz(400, '设备 IP 地址格式不正确')
      if (!body.name) throwBiz(400, '设备名称不能为空')
      const pool = table('storagePools').find((p: any) => p.id === body.storagePoolId) || table('storagePools')[0]
      const tenant = find('tenants', body.tenantId) as any
      const groupPath = body.groupId ? ((table('deviceGroups') as any[]).find((g) => g.id === body.groupId)?.path || '') : '全部设备'
      const record = {
        ...body,
        id: nextId('devices', 'DEV', 4),
        tenantName: tenant?.name || '',
        groupPath,
        onlineStatus: body.onlineStatus || 'pending',
        lastHeartbeat: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        healthScore: body.healthScore ?? 80,
        channelCount: Number(body.channelCount || 1),
        storagePoolId: pool?.id || '',
        storagePoolName: pool?.name || '',
        aiTaskCount: 0,
        alarmsLast7d: 0,
        tags: body.tags || [],
        longitude: body.longitude || 120.155,
        latitude: body.latitude || 30.274,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      insert('devices', record)
      // 同步创建通道
      for (let i = 1; i <= record.channelCount; i++) {
        insert('channels', {
          id: nextId('channels', 'CH', 6),
          deviceId: record.id,
          deviceName: record.name,
          channelNo: i,
          name: record.channelCount === 1 ? `${record.name}-主码流` : `${record.name}-CH${String(i).padStart(2, '0')}`,
          onlineStatus: record.onlineStatus,
          resolution: record.resolution || '1920×1080',
          codec: record.codec || 'H.265',
          bitrateKbps: record.bitrateKbps || 4096,
          streamTypes: ['主码流', '子码流'],
          aiTaskIds: [],
          createTime: record.createTime
        })
      }
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/devices/:deviceId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const dev = find('devices', params.deviceId)
      if (!dev) throwBiz(404, '设备不存在')
      if (body.sn && table('devices').some((d: any) => d.sn === body.sn && d.id !== params.deviceId)) {
        throwBiz(400, '设备序列号已被其他设备占用')
      }
      if (body.ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(body.ip)) throwBiz(400, '设备 IP 地址格式不正确')
      const payload: any = { ...body }
      if (body.tenantId) payload.tenantName = (find('tenants', body.tenantId) as any)?.name || ''
      if (body.storagePoolId) payload.storagePoolName = (find('storagePools', body.storagePoolId) as any)?.name || ''
      if (body.groupId) payload.groupPath = (table('deviceGroups') as any[]).find((g) => g.id === body.groupId)?.path || ''
      return update('devices', params.deviceId, payload)
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/devices/:deviceId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const dev = find('devices', params.deviceId)
      if (!dev) throwBiz(404, '设备不存在')
      table('channels')
        .filter((c: any) => c.deviceId === params.deviceId)
        .forEach((c: any) => remove('channels', c.id))
      remove('devices', params.deviceId)
      return { success: true }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/device-groups/tree',
    latency: 'list' as const,
    handler: () => {
      const groups = table('deviceGroups') as any[]
      const devices = table('devices')
      const pathMap = new Map<string, number>()
      groups.forEach((g) => pathMap.set(g.id, 0))
      devices.forEach((d: any) => {
        pathMap.set(d.groupId, (pathMap.get(d.groupId) || 0) + 1)
      })
      const map = new Map<string, any>()
      groups.forEach((g) => map.set(g.id, { ...g, deviceCount: pathMap.get(g.id) || 0, children: [] }))
      const roots: any[] = []
      map.forEach((g) => {
        if (g.parentId && map.has(g.parentId)) map.get(g.parentId).children.push(g)
        else roots.push(g)
      })
      // 统计大区设备数（含子级）
      const calc = (g: any): number => {
        if (!g.children.length) return g.deviceCount
        const c = g.children.reduce((a: number, x: any) => a + calc(x), 0)
        g.deviceCount = c
        return c
      }
      roots.forEach(calc)
      return { list: roots, total: devices.length }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/devices/stats/overview',
    latency: 'fast' as const,
    handler: () => {
      const devices = table('devices')
      const online = devices.filter((d: any) => d.onlineStatus === 'online')
      const byVendor = new Map<string, number>()
      const byCategory = new Map<string, number>()
      devices.forEach((d: any) => {
        byVendor.set(d.vendor, (byVendor.get(d.vendor) || 0) + 1)
        byCategory.set(d.category, (byCategory.get(d.category) || 0) + 1)
      })
      const healthBuckets = [
        { name: '优秀（90-100）', value: devices.filter((d: any) => d.healthScore >= 90).length },
        { name: '良好（75-89）', value: devices.filter((d: any) => d.healthScore >= 75 && d.healthScore < 90).length },
        { name: '一般（60-74）', value: devices.filter((d: any) => d.healthScore >= 60 && d.healthScore < 75).length },
        { name: '需关注（<60）', value: devices.filter((d: any) => d.healthScore < 60).length }
      ]
      return {
        total: devices.length,
        online: online.length,
        offline: devices.filter((d: any) => d.onlineStatus === 'offline').length,
        unknown: devices.filter((d: any) => d.onlineStatus === 'unknown' || d.onlineStatus === 'pending').length,
        onlineRate: Number(((online.length / devices.length) * 100).toFixed(1)),
        totalBitrateGbps: Number((online.reduce((a: number, d: any) => a + d.bitrateKbps, 0) / 1000 / 1000).toFixed(2)),
        byVendor: [...byVendor.entries()].map(([name, value]) => ({ name, value })),
        byCategory: [...byCategory.entries()].map(([name, value]) => ({ name, value })),
        healthBuckets,
        attention: devices.filter((d: any) => d.healthScore < 70).length
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/devices/attention',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const threshold = Number(query.threshold || 70)
      const list = table('devices')
        .filter((d: any) => d.healthScore < threshold)
        .sort((a: any, b: any) => a.healthScore - b.healthScore)
      return paginate(list, query.page, query.pageSize || 10)
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/devices/batch-delete',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const ids: string[] = body?.ids || []
      if (!ids.length) throwBiz(400, '请至少选择一台设备')
      ids.forEach((id) => {
        table('channels')
          .filter((c: any) => c.deviceId === id)
          .forEach((c: any) => remove('channels', c.id))
      })
      const n = removeMany('devices', ids)
      return { success: true, count: n, message: `已删除 ${n} 台设备及其通道数据` }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/devices/batch-operation',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const { ids = [], action, payload = {} } = body || {}
      if (!ids.length) throwBiz(400, '请至少选择一台设备')
      let affected = 0
      ids.forEach((id: string) => {
        const dev = find('devices', id) as any
        if (!dev) return
        affected++
        if (action === 'reboot' && dev.onlineStatus === 'offline') return
        if (action === 'group') update('devices', id, { groupId: payload.groupId, groupPath: payload.groupPath || dev.groupPath })
        if (action === 'tags') update('devices', id, { tags: payload.tags || [] })
        if (action === 'upgrade') update('devices', id, { firmware: payload.firmware || dev.firmware })
        if (action === 'config') update('devices', id, { remark: (dev.remark ? dev.remark + '；' : '') + '批量下发配置：' + (payload.configName || '标准配置模板') })
        if (action === 'reboot') update('devices', id, { lastHeartbeat: dayjs().format('YYYY-MM-DD HH:mm:ss') })
      })
      const actionName: Record<string, string> = { reboot: '重启', upgrade: '固件升级', group: '移入分组', tags: '打标签', config: '下发配置' }
      return { success: true, count: affected, message: `已对 ${affected} 台设备下发「${actionName[action] || action}」指令` }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/devices/:deviceId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const dev = find('devices', params.deviceId) as any
      if (!dev) throwBiz(404, '设备不存在')
      const channels = table('channels').filter((c: any) => c.deviceId === dev.id)
      const alarms = table('alarms')
        .filter((a: any) => a.deviceId === dev.id)
        .sort((a: any, b: any) => (a.occurTime < b.occurTime ? 1 : -1))
        .slice(0, 20)
      const orders = table('workOrders').filter((o: any) => o.deviceId === dev.id).slice(0, 10)
      const aiTasks = table('aiTasks').filter((t: any) => t.channelIds.some((cid: string) => channels.some((c: any) => c.id === cid)))
      // 近 7 天告警趋势
      const trendDates: string[] = []
      const trendValues: number[] = []
      for (let i = 6; i >= 0; i--) {
        const key = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
        trendDates.push(dayjs().subtract(i, 'day').format('MM-DD'))
        trendValues.push(alarms.filter((a: any) => String(a.occurTime).startsWith(key)).length)
      }
      return {
        ...dev,
        thumb: deviceThumbUrl(dev.id, dev.category),
        snapshot: snapshotUrl(dev.id, dev.name, dayjs().format('YYYY-MM-DD HH:mm:ss')),
        channels,
        alarms,
        workOrders: orders,
        aiTasks,
        alarmTrend: { dates: trendDates, values: trendValues },
        healthRadar: [
          { name: '在线稳定性', value: Math.min(100, dev.healthScore + 6) },
          { name: '视频质量', value: Math.min(100, dev.healthScore - 4 + 8) },
          { name: '存储状态', value: Math.min(100, dev.healthScore + 2) },
          { name: '网络质量', value: Math.max(30, dev.healthScore - 8) },
          { name: '固件版本', value: dev.firmware.includes('V6') ? 96 : 72 },
          { name: '告警健康度', value: Math.max(30, 100 - dev.alarmsLast7d * 6) }
        ]
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/devices/:deviceId/channels',
    latency: 'fast' as const,
    handler: ({ params }: any) => table('channels').filter((c: any) => c.deviceId === params.deviceId)
  },
  {
    method: 'GET' as const,
    path: '/api/v1/devices/:deviceId/logs',
    latency: 'fast' as const,
    handler: ({ params, query }: any) => {
      const dev = find('devices', params.deviceId) as any
      if (!dev) throwBiz(404, '设备不存在')
      const templates: { level: string; content: string }[] = [
        { level: 'INFO', content: 'GB28181 注册成功，心跳周期 60s' },
        { level: 'INFO', content: '媒体流建立成功，编码 H.265，分辨率 1920×1080' },
        { level: 'INFO', content: '录像计划已同步，保存周期 30 天' },
        { level: 'INFO', content: '时间同步完成，与平台偏差 12ms' },
        { level: 'WARN', content: '网络抖动，丢包率 1.8%，已自动降低码率' },
        { level: 'WARN', content: '存储池写入延迟 320ms，超过阈值 200ms' },
        { level: 'ERROR', content: '视频信号丢失，持续 42 秒后恢复' },
        { level: 'ERROR', content: '与平台连接中断，重连第 3 次成功' },
        { level: 'INFO', content: 'AI 分析任务下发成功，任务编号 AIT016' },
        { level: 'INFO', content: '固件校验通过，当前版本已是最新' }
      ]
      const count = Number(query.limit || 40)
      const base = dayjs()
      const seedIdx = Number(String(dev.id).replace(/\D/g, '')) || 1
      const list = Array.from({ length: count }, (_, i) => {
        const t = templates[(seedIdx + i * 3) % templates.length]
        return {
          id: `${dev.id}-LOG${i}`,
          deviceId: dev.id,
          level: t.level,
          content: t.content,
          createTime: base.subtract(i * 37 + (seedIdx % 20), 'minute').format('YYYY-MM-DD HH:mm:ss')
        }
      })
      return list
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/devices/:deviceId/diagnostics',
    latency: 'list' as const,
    handler: ({ params }: any) => {
      const dev = find('devices', params.deviceId) as any
      if (!dev) throwBiz(404, '设备不存在')
      const seed = Number(String(dev.id).replace(/\D/g, '')) || 1
      const offline = dev.onlineStatus !== 'online'
      return {
        deviceId: dev.id,
        deviceName: dev.name,
        overall: offline ? '异常' : seed % 7 === 0 ? '存在风险' : '正常',
        checkedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        items: [
          { name: '网络时延', value: offline ? '---' : `${28 + (seed % 60)} ms`, status: offline ? 'fail' : 'ok', threshold: '< 200 ms' },
          { name: '丢包率', value: offline ? '100%' : `${(seed % 3) * 0.4}%`, status: offline || seed % 11 === 0 ? 'fail' : 'ok', threshold: '< 2%' },
          { name: '上行带宽', value: offline ? '0 Mbps' : `${((dev.bitrateKbps / 1000) * 1.06).toFixed(2)} Mbps`, status: 'ok', threshold: `> ${(dev.bitrateKbps / 1000).toFixed(2)} Mbps` },
          { name: '网关连通性', value: offline ? '不可达' : '可达', status: offline ? 'fail' : 'ok', threshold: '可达' },
          { name: 'DNS 解析', value: offline ? '失败' : `${12 + (seed % 30)} ms`, status: offline ? 'fail' : 'ok', threshold: '< 100 ms' },
          { name: '端口连通性', value: `TCP ${dev.port} ${offline ? '关闭' : '开放'}`, status: offline ? 'fail' : 'ok', threshold: '开放' },
          { name: '码率稳定性', value: offline ? '无数据' : `波动 ${(seed % 12) + 2}%`, status: seed % 9 === 0 ? 'warn' : 'ok', threshold: '< 15%' },
          { name: '时钟同步', value: offline ? '未同步' : `偏差 ${seed % 400} ms`, status: seed % 13 === 0 ? 'warn' : 'ok', threshold: '< 500 ms' }
        ]
      }
    }
  },

  /* ---------- 通道 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/channels',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const list = table('channels')
      return queryList(list, query, {
        searchKeys: ['name', 'deviceName'],
        defaultSort: { by: 'id', order: 'asc' }
      })
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/channels/:channelId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('channels', params.channelId, body)
      if (!r) throwBiz(404, '通道不存在')
      return r
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/channels/:channelId/ptz',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const ch = find('channels', params.channelId)
      if (!ch) throwBiz(404, '通道不存在')
      const cmd = body?.command
      const valid = ['up', 'down', 'left', 'right', 'upLeft', 'upRight', 'downLeft', 'downRight', 'zoomIn', 'zoomOut', 'focusNear', 'focusFar', 'irisOpen', 'irisClose', 'stop', 'gotoPreset', 'setPreset', 'delPreset', 'startCruise', 'stopCruise']
      if (!valid.includes(cmd)) throwBiz(400, `不支持的云台指令：${cmd}`)
      return { success: true, command: cmd, speed: body?.speed || 4, message: '云台指令已下发' }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/channels/:channelId/stream',
    latency: 'fast' as const,
    handler: ({ params, query }: any) => {
      const ch = find('channels', params.channelId) as any
      if (!ch) throwBiz(404, '通道不存在')
      if (ch.onlineStatus !== 'online') throwBiz(400, '通道当前离线，无法生成播放地址')
      const token = Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')
      const protocol = query.protocol || 'rtsp'
      const streamType = query.streamType || 'main'
      const host = 'media.videocloud.com'
      const map: Record<string, string> = {
        rtsp: `rtsp://${host}:554/live/${params.channelId}_${streamType}?token=${token}`,
        rtmp: `rtmp://${host}:1935/live/${params.channelId}_${streamType}?token=${token}`,
        hls: `https://${host}/hls/${params.channelId}_${streamType}/index.m3u8?token=${token}`,
        webrtc: `webrtc://${host}/live/${params.channelId}_${streamType}?token=${token}`,
        flv: `https://${host}/live/${params.channelId}_${streamType}.flv?token=${token}`
      }
      return {
        channelId: params.channelId,
        protocol,
        streamType,
        url: map[protocol] || map.rtsp,
        expiresIn: 7200,
        expiresAt: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        allProtocols: Object.keys(map).map((k) => ({ protocol: k, url: map[k] }))
      }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/channels/:channelId/snapshot',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const ch = find('channels', params.channelId) as any
      if (!ch) throwBiz(404, '通道不存在')
      if (ch.onlineStatus !== 'online') throwBiz(400, '通道离线，抓图失败')
      return {
        url: snapshotUrl(params.channelId + Date.now(), ch.name, dayjs().format('YYYY-MM-DD HH:mm:ss')),
        size: 42000 + Math.floor(Math.random() * 40000),
        channelName: ch.name
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/channels/:channelId/recordings',
    latency: 'list' as const,
    handler: ({ params, query }: any) => {
      const ch = find('channels', params.channelId) as any
      if (!ch) throwBiz(404, '通道不存在')
      const date = query.date || dayjs().subtract(1, 'day').format('YYYY-MM-DD')
      const segments: any[] = []
      let cursor = dayjs(date + ' 00:00:00')
      const end = dayjs(date + ' 23:59:59')
      while (cursor.isBefore(end)) {
        const gap = Math.random() < 0.18
        if (gap) {
          cursor = cursor.add(30 + Math.floor(Math.random() * 90), 'minute')
          continue
        }
        const dur = 15 + Math.floor(Math.random() * 45)
        const type = Math.random() < 0.12 ? 'event' : Math.random() < 0.2 ? 'ai' : 'schedule'
        segments.push({
          id: `${params.channelId}-${cursor.format('HHmmss')}`,
          deviceId: ch.deviceId,
          deviceName: ch.deviceName,
          channelNo: ch.channelNo,
          type,
          storageType: Math.random() < 0.2 ? 'ia' : Math.random() < 0.05 ? 'archive' : 'hot',
          startTime: cursor.format('YYYY-MM-DD HH:mm:ss'),
          endTime: cursor.add(dur, 'minute').format('YYYY-MM-DD HH:mm:ss'),
          duration: dur * 60,
          fileSize: Math.round((dur * 60 * ch.bitrateKbps) / 8 / 1024),
          resolution: ch.resolution,
          streamUrl: `/mock/play/${params.channelId}/${cursor.format('HHmmss')}`,
          snapshotUrl: snapshotUrl(params.channelId + cursor.format('HHmmss'), ch.name, cursor.format('YYYY-MM-DD HH:mm:ss'))
        })
        cursor = cursor.add(dur + 1, 'minute')
      }
      return { date, list: segments, total: segments.length, totalDuration: segments.reduce((a, s) => a + s.duration, 0) }
    }
  },

  /* ---------- 固件 / OTA ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/firmwares',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const list = table('firmwares')
      const keyword = String(query.keyword || '').toLowerCase()
      const filtered = keyword ? list.filter((f: any) => [f.version, f.vendor, f.category].some((v: any) => String(v).toLowerCase().includes(keyword))) : list
      return { list: filtered, total: filtered.length }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/ota/tasks',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const list = table('otaTasks')
      return queryList(list, query, { searchKeys: ['name', 'firmwareVersion', 'creator'], defaultSort: { by: 'startTime', order: 'desc' } })
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/ota/tasks',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.firmwareId) throwBiz(400, '请选择要升级的固件版本')
      if (!body?.deviceIds?.length) throwBiz(400, '请至少选择一台待升级设备')
      const fw = find('firmwares', body.firmwareId) as any
      if (!fw) throwBiz(404, '固件不存在')
      const record = {
        id: nextId('otaTasks', 'OTA', 3),
        name: body.name || `${fw.vendor}${fw.category}固件升级任务`,
        firmwareId: fw.id,
        firmwareVersion: fw.version,
        deviceCount: body.deviceIds.length,
        successCount: 0,
        failCount: 0,
        runningCount: body.deviceIds.length,
        status: 'running',
        mode: body.mode || 'immediate',
        startTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        creator: body.creator || '当前用户',
        failReasons: []
      }
      insert('otaTasks', record)
      return record
    }
  }
]

void FW_KEEP
