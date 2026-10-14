/**
 * Mock 接口：告警与事件中心 / 告警规则
 */
import dayjs from 'dayjs'
import { defineRoutes } from '../router'
import { find, insert, nextId, remove, table, update } from '../db'
import { throwBiz } from '../utils'

export const alarmRoutes = [
  {
    method: 'GET' as const,
    path: '/api/v1/alarms',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const list = table('alarms')
      const kw = String(query.keyword || '').trim().toLowerCase()
      let filtered = list
      if (kw) {
        filtered = filtered.filter((a: any) =>
          [a.title, a.alarmNo, a.deviceName, a.tenantName, a.type, a.region].some((v: any) => String(v).toLowerCase().includes(kw))
        )
      }
      const multi = ['level', 'status', 'type', 'category', 'tenantId']
      multi.forEach((f) => {
        const v = query[f]
        if (!v || v === 'all') return
        const arr = String(v).split(',')
        filtered = filtered.filter((a: any) => arr.includes(String(a[f])))
      })
      if (query.startTime) {
        const s = new Date(query.startTime).getTime()
        filtered = filtered.filter((a: any) => new Date(a.occurTime).getTime() >= s)
      }
      if (query.endTime) {
        const e = new Date(query.endTime).getTime()
        filtered = filtered.filter((a: any) => new Date(a.occurTime).getTime() <= e)
      }
      if (query.handler) filtered = filtered.filter((a: any) => String(a.handler).includes(String(query.handler)))
      const sortBy = query.sortBy || 'occurTime'
      const order = query.sortOrder === 'asc' ? 1 : -1
      filtered = [...filtered].sort((a: any, b: any) => (a[sortBy] > b[sortBy] ? order : -order))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      return {
        list: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize
      }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/alarms/batch-handle',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const { ids = [], status, remark, handler } = body || {}
      if (!ids.length) throwBiz(400, '请至少选择一条告警')
      const valid = ['processing', 'resolved', 'closed', 'false_alarm']
      if (!valid.includes(status)) throwBiz(400, `不支持的告警状态：${status}`)
      let count = 0
      ids.forEach((id: string) => {
        const a = find('alarms', id) as any
        if (!a) return
        if (a.status === 'closed' && status !== 'closed') {
          count++ // 已关闭的告警允许被重新处理
        }
        update('alarms', id, { status, handler: handler || a.handler || '当前用户', handleTime: dayjs().format('YYYY-MM-DD HH:mm:ss'), handleRemark: remark || a.handleRemark })
        count++
      })
      const names: Record<string, string> = { processing: '认领', resolved: '标记已解决', closed: '关闭', false_alarm: '标记误报' }
      return { success: true, count, message: `已${names[status]} ${count} 条告警` }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/alarms/batch-transfer',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const { ids = [], engineer, priority = 'major' } = body || {}
      if (!ids.length) throwBiz(400, '请至少选择一条告警')
      const created: string[] = []
      ids.forEach((id: string) => {
        const a = find('alarms', id) as any
        if (!a) return
        if (a.relatedWorkOrderId) {
          created.push(a.relatedWorkOrderId)
          return
        }
        const orderNo = `WO${dayjs().format('YYYYMMDD')}${String(table('workOrders').length + created.length + 1).padStart(4, '0')}`
        const record = {
          id: nextId('workOrders', 'WO', 5),
          orderNo,
          title: `故障报修｜${a.deviceName}`,
          type: '故障报修',
          priority: a.level === 'urgent' ? 'urgent' : priority,
          source: 'alarm',
          customerId: a.tenantId,
          customerName: a.tenantName,
          deviceId: a.deviceId,
          deviceName: a.deviceName,
          alarmId: a.id,
          description: `由告警「${a.title}」转单，告警编号 ${a.alarmNo}，发生时间 ${a.occurTime}，请现场核实处理。`,
          attachments: [],
          status: engineer ? 'assigned' : 'pending',
          creator: '告警中心',
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          assignee: engineer || '',
          assigneePhone: '',
          assignTime: engineer ? dayjs().format('YYYY-MM-DD HH:mm:ss') : null,
          arriveTime: null,
          finishTime: null,
          slaDeadline: dayjs().add(8, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          slaStatus: 'normal',
          handlerLogs: [{ time: dayjs().format('YYYY-MM-DD HH:mm:ss'), operator: '系统自动', action: '告警转单', remark: `来源告警 ${a.alarmNo}` }],
          partsUsed: [],
          cost: 0,
          satisfaction: 0,
          satisfactionRemark: '',
          visitResult: ''
        }
        insert('workOrders', record)
        update('alarms', a.id, { relatedWorkOrderId: record.id, status: 'processing', handler: engineer || a.handler || '告警中心' })
        created.push(record.id)
      })
      return { success: true, count: created.length, orderIds: created, message: `已生成 ${created.length} 张工单` }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/alarms/statistics',
    latency: 'fast' as const,
    handler: ({ query }: any) => {
      const days = Number(query.days || 7)
      const list = table('alarms').filter((a: any) => dayjs().diff(dayjs(a.occurTime), 'day') <= days)
      const dates: string[] = []
      const counts: number[] = []
      const handleCounts: number[] = []
      for (let i = days - 1; i >= 0; i--) {
        const key = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
        dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
        counts.push(list.filter((a: any) => String(a.occurTime).startsWith(key)).length)
        handleCounts.push(list.filter((a: any) => a.handleTime && String(a.handleTime).startsWith(key)).length)
      }
      const handled = list.filter((a: any) => a.handleTime)
      const mtta = handled.length
        ? Math.round(handled.reduce((acc: number, a: any) => acc + Math.max(0, dayjs(a.handleTime).diff(dayjs(a.occurTime), 'minute')), 0) / handled.length)
        : 0
      return {
        dates,
        counts,
        handleCounts,
        mtta,
        mttr: mtta + 84,
        falseRate: Number(((list.filter((a: any) => a.status === 'false_alarm').length / Math.max(1, list.length)) * 100).toFixed(1)),
        total: list.length,
        byTenant: topGroup(list, 'tenantName'),
        byRegion: topGroup(list, 'region'),
        byType: topGroup(list, 'type'),
        byLevel: topGroup(list, 'level')
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/alarms/:alarmId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const a = find('alarms', params.alarmId) as any
      if (!a) throwBiz(404, '告警不存在')
      const dev = find('devices', a.deviceId) as any
      const order = a.relatedWorkOrderId ? find('workOrders', a.relatedWorkOrderId) : null
      return { ...a, device: dev, workOrder: order }
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/alarms/:alarmId/handle',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const a = find('alarms', params.alarmId) as any
      if (!a) throwBiz(404, '告警不存在')
      const status = body?.status
      const valid = ['processing', 'resolved', 'closed', 'false_alarm']
      if (!valid.includes(status)) throwBiz(400, '请选择有效的处理结果')
      if (status === 'false_alarm' && !String(body.remark || '').trim()) {
        throwBiz(400, '标记误报时必须填写误报原因')
      }
      if (a.status === status) throwBiz(400, `该告警已处于「${status}」状态，无需重复处理`)
      return update('alarms', params.alarmId, {
        status,
        handler: body.handler || a.handler || '当前用户',
        handleTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        handleRemark: body.remark || ''
      })
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/alarms/:alarmId/transfer',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const a = find('alarms', params.alarmId) as any
      if (!a) throwBiz(404, '告警不存在')
      if (a.relatedWorkOrderId) throwBiz(400, `该告警已关联工单 ${a.relatedWorkOrderId}，请勿重复转单`)
      const orderNo = `WO${dayjs().format('YYYYMMDD')}${String(table('workOrders').length + 1).padStart(4, '0')}`
      const record = {
        id: nextId('workOrders', 'WO', 5),
        orderNo,
        title: `${body?.type || '故障报修'}｜${a.deviceName}`,
        type: body?.type || '故障报修',
        priority: body?.priority || (a.level === 'urgent' ? 'urgent' : 'major'),
        source: 'alarm',
        customerId: a.tenantId,
        customerName: a.tenantName,
        deviceId: a.deviceId,
        deviceName: a.deviceName,
        alarmId: a.id,
        description: body?.description || `由告警「${a.title}」转单，告警编号 ${a.alarmNo}，设备 ${a.deviceName} 位于 ${a.region}。`,
        attachments: [a.snapshotUrl],
        status: body?.assignee ? 'assigned' : 'pending',
        creator: body?.creator || '当前用户',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        assignee: body?.assignee || '',
        assigneePhone: body?.assigneePhone || '',
        assignTime: body?.assignee ? dayjs().format('YYYY-MM-DD HH:mm:ss') : null,
        arriveTime: null,
        finishTime: null,
        slaDeadline: dayjs().add(a.level === 'urgent' ? 4 : 8, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        slaStatus: 'normal',
        handlerLogs: [{ time: dayjs().format('YYYY-MM-DD HH:mm:ss'), operator: body?.creator || '当前用户', action: '告警转单', remark: `来源告警 ${a.alarmNo}` }],
        partsUsed: [],
        cost: 0,
        satisfaction: 0,
        satisfactionRemark: '',
        visitResult: ''
      }
      insert('workOrders', record)
      update('alarms', a.id, { relatedWorkOrderId: record.id, status: 'processing' })
      return record
    }
  },
  /* ---------- 告警规则 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/alarm-rules',
    latency: 'list' as const,
    handler: () => table('alarmRules')
  },
  {
    method: 'POST' as const,
    path: '/api/v1/alarm-rules',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.name) throwBiz(400, '规则名称不能为空')
      const record = {
        ...body,
        id: nextId('alarmRules', 'AR', 3),
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        status: body.status ?? 1
      }
      insert('alarmRules', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/alarm-rules/:ruleId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('alarmRules', params.ruleId, body)
      if (!r) throwBiz(404, '规则不存在')
      return r
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/alarm-rules/:ruleId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      remove('alarmRules', params.ruleId)
      return { success: true }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/alarm-rules/:ruleId/test',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const r = find('alarmRules', params.ruleId) as any
      if (!r) throwBiz(404, '规则不存在')
      return {
        success: true,
        message: `测试通知已发送至：${r.receivers.join('、')}，渠道：${r.notifyChannels.join('、')}`,
        sendResults: r.notifyChannels.map((c: string) => ({ channel: c, status: 'success', cost: Math.round(Math.random() * 800 + 60) }))
      }
    }
  }
]

function topGroup(list: any[], field: string, limit = 8) {
  const map = new Map<string, number>()
  list.forEach((a) => map.set(a[field], (map.get(a[field]) || 0) + 1))
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}
