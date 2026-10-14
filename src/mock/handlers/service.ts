/**
 * Mock 接口：技术服务与工单（工单 / 服务目录 / 备件 / 知识库 / 巡检 / SLA 统计）
 */
import dayjs from 'dayjs'
import { defineRoutes } from '../router'
import { find, insert, nextId, remove, table, update } from '../db'
import { throwBiz } from '../utils'

const STATUS_FLOW: Record<string, string[]> = {
  pending: ['assigned', 'processing', 'closed'],
  assigned: ['processing', 'pending', 'closed'],
  processing: ['verifying', 'completed', 'closed'],
  verifying: ['completed', 'processing', 'closed'],
  completed: ['closed', 'verifying'],
  closed: []
}

function slaOf(order: any): string {
  if (order.finishTime) {
    return new Date(order.finishTime).getTime() > new Date(order.slaDeadline).getTime() ? 'overdue' : 'normal'
  }
  const now = Date.now()
  const deadline = new Date(order.slaDeadline).getTime()
  if (now > deadline) return 'overdue'
  if (deadline - now < 2 * 3600 * 1000) return 'warning'
  return 'normal'
}

export const serviceRoutes = [
  /* ---------- 工单 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/workorders',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('workOrders').map((o: any) => ({ ...o, slaStatus: slaOf(o) }))
      const multi = ['status', 'type', 'priority', 'slaStatus', 'source', 'customerId']
      multi.forEach((f) => {
        const v = query[f]
        if (!v || v === 'all') return
        const arr = String(v).split(',')
        list = list.filter((o: any) => arr.includes(String(o[f])))
      })
      if (query.assignee && query.assignee !== 'all') list = list.filter((o: any) => o.assignee === query.assignee)
      if (query.startTime) list = list.filter((o: any) => new Date(o.createTime).getTime() >= new Date(query.startTime).getTime())
      if (query.endTime) list = list.filter((o: any) => new Date(o.createTime).getTime() <= new Date(query.endTime).getTime())
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((o: any) => [o.orderNo, o.title, o.customerName, o.deviceName, o.assignee].some((v: any) => String(v).toLowerCase().includes(kw)))
      list = list.slice().sort((a: any, b: any) => (a.createTime < b.createTime ? 1 : -1))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      const all = table('workOrders').map((o: any) => ({ ...o, slaStatus: slaOf(o) }))
      return {
        list: list.slice((page - 1) * pageSize, page * pageSize),
        total: list.length,
        page,
        pageSize,
        boardStats: {
          pending: all.filter((o: any) => o.status === 'pending').length,
          assigned: all.filter((o: any) => o.status === 'assigned').length,
          processing: all.filter((o: any) => o.status === 'processing').length,
          verifying: all.filter((o: any) => o.status === 'verifying').length,
          completed: all.filter((o: any) => o.status === 'completed').length,
          closed: all.filter((o: any) => o.status === 'closed').length,
          overdue: all.filter((o: any) => o.slaStatus === 'overdue' && !['completed', 'closed'].includes(o.status)).length
        }
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/workorders/kanban',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      const statuses = ['pending', 'assigned', 'processing', 'verifying', 'completed', 'closed']
      const list = table('workOrders').map((o: any) => ({ ...o, slaStatus: slaOf(o) }))
      const kw = String(query.keyword || '').toLowerCase()
      const filtered = kw ? list.filter((o: any) => [o.orderNo, o.title, o.customerName].some((v: any) => String(v).toLowerCase().includes(kw))) : list
      return statuses.map((s) => ({
        status: s,
        items: filtered
          .filter((o: any) => o.status === s)
          .sort((a: any, b: any) => (a.priority === 'urgent' ? -1 : 1))
          .slice(0, 30)
      }))
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/workorders',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.title) throwBiz(400, '工单标题不能为空')
      if (!body?.customerId) throwBiz(400, '请选择客户')
      if (!body?.description || String(body.description).length < 5) throwBiz(400, '问题描述不少于 5 个字')
      const tenant = find('tenants', body.customerId) as any
      const dev = body.deviceId ? (find('devices', body.deviceId) as any) : null
      const priority = body.priority || 'minor'
      const slaHours = priority === 'urgent' ? 4 : priority === 'major' ? 8 : priority === 'minor' ? 24 : 48
      const record = {
        ...body,
        id: nextId('workOrders', 'WO', 5),
        orderNo: `WO${dayjs().format('YYYYMMDD')}${String(table('workOrders').length + 1).padStart(4, '0')}`,
        priority,
        source: body.source || 'customer',
        customerName: tenant?.name || '',
        deviceName: dev?.name || '',
        alarmId: body.alarmId || null,
        attachments: body.attachments || [],
        status: 'pending',
        creator: body.creator || '当前用户',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        assignee: '',
        assigneePhone: '',
        assignTime: null,
        arriveTime: null,
        finishTime: null,
        slaDeadline: dayjs().add(slaHours, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        slaStatus: 'normal',
        handlerLogs: [{ time: dayjs().format('YYYY-MM-DD HH:mm:ss'), operator: body.creator || '当前用户', action: '创建工单', remark: '客户提交服务请求' }],
        partsUsed: [],
        cost: 0,
        satisfaction: 0,
        satisfactionRemark: '',
        visitResult: ''
      }
      insert('workOrders', record)
      return record
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/workorders/:orderId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const o = find('workOrders', params.orderId) as any
      if (!o) throwBiz(404, '工单不存在')
      const dev = o.deviceId ? find('devices', o.deviceId) : null
      const alarm = o.alarmId ? find('alarms', o.alarmId) : null
      return { ...o, slaStatus: slaOf(o), device: dev, alarm }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/workorders/:orderId/assign',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const o = find('workOrders', params.orderId) as any
      if (!o) throwBiz(404, '工单不存在')
      if (['completed', 'closed'].includes(o.status)) throwBiz(400, '已完成的工单不可再次派单')
      if (!body?.assignee) throwBiz(400, '请选择处理工程师')
      const eng = table('engineers').find((e: any) => e.name === body.assignee) as any
      if (eng && eng.status === 'off') throwBiz(400, `${eng.name} 当前处于休息状态，请选择其他工程师`)
      const logs = [...(o.handlerLogs || []), { time: dayjs().format('YYYY-MM-DD HH:mm:ss'), operator: body.operator || '调度员', action: o.assignee ? '转派' : '派单', remark: `指派给 ${body.assignee}${body.remark ? '：' + body.remark : ''}` }]
      return update('workOrders', params.orderId, {
        assignee: body.assignee,
        assigneePhone: eng?.phone || '',
        assignTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        status: 'assigned',
        handlerLogs: logs
      })
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/workorders/:orderId/dispatch-suggest',
    latency: 'list' as const,
    handler: ({ params }: any) => {
      const o = find('workOrders', params.orderId) as any
      if (!o) throwBiz(404, '工单不存在')
      const dev = o.deviceId ? (find('devices', o.deviceId) as any) : null
      const needSkill = o.type === '设备安装调试' ? '摄像机安装调试' : o.type === '故障报修' ? '网络排障' : '平台部署'
      const engineers = table('engineers') as any[]
      const scored = engineers
        .map((e) => {
          const skillMatch = e.skills.includes(needSkill) ? 40 : e.skills.some((s: string) => ['摄像机安装调试', '网络排障', '平台部署'].includes(s)) ? 22 : 8
          const sameRegion = dev && e.region === dev.city ? 30 : dev && e.region.slice(0, 2) === dev.city.slice(0, 2) ? 16 : 4
          const loadScore = Math.max(0, 20 - e.currentLoad * 2.2)
          const qualityScore = (e.satisfaction / 5) * 6 + (e.onTimeRate / 100) * 4
          return {
            id: e.id,
            name: e.name,
            phone: e.phone,
            level: e.level,
            region: e.region,
            skills: e.skills,
            currentLoad: e.currentLoad,
            maxLoad: e.maxLoad,
            satisfaction: e.satisfaction,
            onTimeRate: e.onTimeRate,
            status: e.status,
            score: Number((skillMatch + sameRegion + loadScore + qualityScore).toFixed(1)),
            reasons: [
              e.skills.includes(needSkill) ? `技能匹配：具备「${needSkill}」能力` : '技能部分匹配，可协调支援',
              sameRegion >= 30 ? `就近服务：与设备同城（${e.region}）` : `覆盖区域：${e.region}`,
              e.currentLoad < 5 ? `负载较轻：当前 ${e.currentLoad} 单` : `负载较高：当前 ${e.currentLoad} 单`,
              `历史准时率 ${e.onTimeRate}%，满意度 ${e.satisfaction}`
            ]
          }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
      return { orderId: o.id, needSkill, list: scored }
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/workorders/:orderId/status',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const o = find('workOrders', params.orderId) as any
      if (!o) throwBiz(404, '工单不存在')
      const next = body?.status
      const allowed = STATUS_FLOW[o.status] || []
      if (!allowed.includes(next)) {
        throwBiz(400, `工单当前状态为「${statusName(o.status)}」，不能流转为「${statusName(next)}」`)
      }
      if (next === 'completed' && !o.assignee) throwBiz(400, '工单尚未派单，无法直接完成')
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const payload: any = { status: next }
      const logs = [...(o.handlerLogs || [])]
      const actionName: Record<string, string> = { assigned: '派单', processing: '开始处理', verifying: '提交验收', completed: '处理完成', closed: '关闭工单', pending: '退回待受理' }
      logs.push({ time: now, operator: body.operator || o.assignee || '当前用户', action: actionName[next] || next, remark: body.remark || '' })
      payload.handlerLogs = logs
      if (next === 'processing') payload.arriveTime = o.arriveTime || now
      if (next === 'completed') {
        payload.finishTime = now
        payload.cost = body.cost ?? o.cost
        payload.satisfaction = body.satisfaction ?? 0
        payload.satisfactionRemark = body.satisfactionRemark || ''
      }
      const merged = { ...o, ...payload }
      payload.slaStatus = slaOf(merged)
      return update('workOrders', params.orderId, payload)
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/workorders/:orderId/visit',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const o = find('workOrders', params.orderId) as any
      if (!o) throwBiz(404, '工单不存在')
      if (o.status !== 'completed' && o.status !== 'closed') throwBiz(400, '仅已完成或已关闭的工单可以回访')
      if (!body?.result) throwBiz(400, '请选择回访结果')
      const logs = [...(o.handlerLogs || []), { time: dayjs().format('YYYY-MM-DD HH:mm:ss'), operator: body.operator || '客服专员', action: '客户回访', remark: `回访结果：${body.result === 'satisfied' ? '满意' : body.result === 'normal' ? '一般' : '不满意'}${body.remark ? '，' + body.remark : ''}` }]
      return update('workOrders', params.orderId, {
        visitResult: body.result,
        satisfaction: body.score || o.satisfaction,
        satisfactionRemark: body.remark || o.satisfactionRemark,
        handlerLogs: logs
      })
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/workorders/:orderId/log',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const o = find('workOrders', params.orderId) as any
      if (!o) throwBiz(404, '工单不存在')
      if (!body?.remark) throwBiz(400, '处理记录内容不能为空')
      const logs = [...(o.handlerLogs || []), { time: dayjs().format('YYYY-MM-DD HH:mm:ss'), operator: body.operator || o.assignee || '当前用户', action: body.action || '追加记录', remark: body.remark }]
      return update('workOrders', params.orderId, { handlerLogs: logs })
    }
  },

  /* ---------- 服务目录 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/services/catalog',
    latency: 'list' as const,
    handler: () => table('serviceCatalog')
  },
  {
    method: 'POST' as const,
    path: '/api/v1/services/catalog',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.name) throwBiz(400, '服务名称不能为空')
      const record = { ...body, id: nextId('serviceCatalog', 'SV', 2), status: body.status ?? 1 }
      insert('serviceCatalog', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/services/catalog/:serviceId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('serviceCatalog', params.serviceId, body)
      if (!r) throwBiz(404, '服务不存在')
      return r
    }
  },

  /* ---------- 备件 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/parts',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('spareParts')
      if (query.category && query.category !== 'all') list = list.filter((p: any) => p.category === query.category)
      if (query.status && query.status !== 'all') list = list.filter((p: any) => p.status === query.status)
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((p: any) => [p.name, p.model, p.location].some((v: any) => String(v).toLowerCase().includes(kw)))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      const all = table('spareParts')
      return {
        list: list.slice((page - 1) * pageSize, page * pageSize),
        total: list.length,
        page,
        pageSize,
        summary: {
          total: all.length,
          low: all.filter((p: any) => p.status === 'low').length,
          out: all.filter((p: any) => p.status === 'out').length,
          totalValue: Number(all.reduce((a: number, p: any) => a + p.stock * p.price, 0).toFixed(2))
        },
        categories: [...new Set(all.map((p: any) => p.category))]
      }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/parts/in-out',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      const { partId, type, quantity, workOrderNo, operator } = body || {}
      const p = find('spareParts', partId) as any
      if (!p) throwBiz(404, '备件不存在')
      if (!['in', 'out'].includes(type)) throwBiz(400, '出入库类型不正确')
      const qty = Number(quantity)
      if (!qty || qty <= 0) throwBiz(400, '数量必须大于 0')
      if (type === 'out' && qty > p.stock) throwBiz(400, `库存不足，当前库存 ${p.stock} ${p.unit}`)
      const stock = type === 'in' ? p.stock + qty : p.stock - qty
      const record = { type, quantity: qty, operator: operator || '当前用户', time: dayjs().format('YYYY-MM-DD HH:mm:ss'), workOrderNo: workOrderNo || '' }
      return update('spareParts', partId, {
        stock,
        status: stock === 0 ? 'out' : stock <= p.warningStock ? 'low' : 'normal',
        inOutRecords: [record, ...(p.inOutRecords || [])]
      })
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/parts/:partId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('spareParts', params.partId, body)
      if (!r) throwBiz(404, '备件不存在')
      return r
    }
  },

  /* ---------- 知识库 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/knowledge',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('knowledge')
      if (query.category && query.category !== 'all') list = list.filter((k: any) => k.category === query.category)
      const kw = String(query.keyword || '').toLowerCase()
      if (kw) list = list.filter((k: any) => [k.title, k.author, ...(k.tags || [])].some((v: any) => String(v).toLowerCase().includes(kw)))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      const all = table('knowledge')
      return {
        list: list.slice((page - 1) * pageSize, page * pageSize),
        total: list.length,
        page,
        pageSize,
        categories: [...new Set(all.map((k: any) => k.category))],
        hot: [...all].sort((a: any, b: any) => b.views - a.views).slice(0, 5).map((k: any) => ({ id: k.id, title: k.title, views: k.views }))
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/knowledge/:articleId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      const k = find('knowledge', params.articleId) as any
      if (!k) throwBiz(404, '文章不存在')
      const related = table('knowledge')
        .filter((x: any) => x.id !== k.id && (x.category === k.category || x.tags.some((t: string) => k.tags.includes(t))))
        .slice(0, 5)
        .map((x: any) => ({ id: x.id, title: x.title, category: x.category, views: x.views }))
      update('knowledge', k.id, { views: k.views + 1 })
      return { ...k, views: k.views + 1, related }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/knowledge',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.title) throwBiz(400, '文章标题不能为空')
      const record = {
        ...body,
        id: nextId('knowledge', 'KB', 3),
        author: body.author || '当前用户',
        views: 0,
        likes: 0,
        publishTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        status: 1
      }
      insert('knowledge', record)
      return record
    }
  },
  {
    method: 'PUT' as const,
    path: '/api/v1/knowledge/:articleId',
    latency: 'fast' as const,
    handler: ({ params, body }: any) => {
      const r = update('knowledge', params.articleId, body)
      if (!r) throwBiz(404, '文章不存在')
      return r
    }
  },
  {
    method: 'DELETE' as const,
    path: '/api/v1/knowledge/:articleId',
    latency: 'fast' as const,
    handler: ({ params }: any) => {
      remove('knowledge', params.articleId)
      return { success: true }
    }
  },

  /* ---------- 工程师 / 巡检 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/engineers',
    latency: 'list' as const,
    handler: () => table('engineers')
  },
  {
    method: 'GET' as const,
    path: '/api/v1/patrols',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('patrolTasks')
      if (query.status && query.status !== 'all') list = list.filter((p: any) => p.status === query.status)
      return { list, total: list.length }
    }
  },
  {
    method: 'POST' as const,
    path: '/api/v1/patrols',
    latency: 'fast' as const,
    handler: ({ body }: any) => {
      if (!body?.name) throwBiz(400, '巡检任务名称不能为空')
      if (!body?.items?.length) throwBiz(400, '请至少选择一个巡检项')
      const record = {
        ...body,
        id: nextId('patrolTasks', 'PT', 3),
        scope: body.scope || '全部租户',
        deviceCount: body.deviceCount || table('devices').length,
        normalCount: 0,
        abnormalCount: 0,
        skippedCount: 0,
        progress: 0,
        status: 'running',
        executor: body.executor || '当前用户',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        finishTime: null
      }
      insert('patrolTasks', record)
      return record
    }
  },

  /* ---------- SLA / 服务报表 ---------- */
  {
    method: 'GET' as const,
    path: '/api/v1/service/stats',
    latency: 'fast' as const,
    handler: ({ query }: any) => {
      const days = Number(query.days || 30)
      const all = table('workOrders').map((o: any) => ({ ...o, slaStatus: slaOf(o) }))
      const list = all.filter((o: any) => dayjs().diff(dayjs(o.createTime), 'day') <= days)
      const finished = list.filter((o: any) => o.finishTime)
      const onTime = finished.filter((o: any) => o.slaStatus === 'normal')
      const dates: string[] = []
      const created: number[] = []
      const finishedArr: number[] = []
      for (let i = days - 1; i >= 0; i--) {
        const key = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
        dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
        created.push(list.filter((o: any) => String(o.createTime).startsWith(key)).length)
        finishedArr.push(list.filter((o: any) => o.finishTime && String(o.finishTime).startsWith(key)).length)
      }
      const byEngineer = new Map<string, { total: number; onTime: number; score: number; hours: number }>()
      list.forEach((o: any) => {
        if (!o.assignee) return
        const cur = byEngineer.get(o.assignee) || { total: 0, onTime: 0, score: 0, hours: 0 }
        cur.total++
        if (o.slaStatus === 'normal') cur.onTime++
        cur.score += o.satisfaction || 0
        if (o.finishTime) cur.hours += dayjs(o.finishTime).diff(dayjs(o.createTime), 'minute') / 60
        byEngineer.set(o.assignee, cur)
      })
      const byType = new Map<string, number>()
      list.forEach((o: any) => byType.set(o.type, (byType.get(o.type) || 0) + 1))
      return {
        total: list.length,
        finished: finished.length,
        onTimeRate: finished.length ? Number(((onTime.length / finished.length) * 100).toFixed(1)) : 0,
        avgHandleHours: finished.length ? Number((finished.reduce((a: number, o: any) => a + dayjs(o.finishTime).diff(dayjs(o.createTime), 'minute') / 60, 0) / finished.length).toFixed(1)) : 0,
        satisfaction: Number(((list.filter((o: any) => o.satisfaction > 0).reduce((a: number, o: any) => a + o.satisfaction, 0) / Math.max(1, list.filter((o: any) => o.satisfaction > 0).length))).toFixed(2)),
        overdue: all.filter((o: any) => o.slaStatus === 'overdue' && !['completed', 'closed'].includes(o.status)).length,
        dates,
        created,
        finishedArr,
        byType: [...byType.entries()].map(([name, value]) => ({ name, value })),
        byEngineer: [...byEngineer.entries()]
          .map(([name, v]) => ({
            name,
            total: v.total,
            onTimeRate: Number(((v.onTime / Math.max(1, v.total)) * 100).toFixed(1)),
            avgHours: Number((v.hours / Math.max(1, v.total)).toFixed(1)),
            avgScore: Number((v.score / Math.max(1, v.total)).toFixed(2))
          }))
          .sort((a, b) => b.total - a.total),
        satisfactionDist: [
          { name: '5 分', value: list.filter((o: any) => o.satisfaction >= 4.5).length },
          { name: '4 分', value: list.filter((o: any) => o.satisfaction >= 3.5 && o.satisfaction < 4.5).length },
          { name: '3 分', value: list.filter((o: any) => o.satisfaction >= 2.5 && o.satisfaction < 3.5).length },
          { name: '2 分及以下', value: list.filter((o: any) => o.satisfaction > 0 && o.satisfaction < 2.5).length }
        ],
        overdueList: all
          .filter((o: any) => o.slaStatus === 'overdue' && !['completed', 'closed'].includes(o.status))
          .slice(0, 20)
          .map((o: any) => ({ id: o.id, orderNo: o.orderNo, title: o.title, customerName: o.customerName, assignee: o.assignee, slaDeadline: o.slaDeadline, createTime: o.createTime }))
      }
    }
  },
  {
    method: 'GET' as const,
    path: '/api/v1/service/visits',
    latency: 'list' as const,
    handler: ({ query }: any) => {
      let list = table('workOrders').filter((o: any) => o.status === 'completed' || o.status === 'closed')
      if (query.visitResult && query.visitResult !== 'all') list = list.filter((o: any) => o.visitResult === query.visitResult)
      list = list.slice().sort((a: any, b: any) => (a.finishTime < b.finishTime ? 1 : -1))
      const page = Number(query.page || 1)
      const pageSize = Number(query.pageSize || 20)
      return {
        list: list.slice((page - 1) * pageSize, page * pageSize),
        total: list.length,
        page,
        pageSize,
        stats: {
          satisfied: list.filter((o: any) => o.visitResult === 'satisfied').length,
          normal: list.filter((o: any) => o.visitResult === 'normal').length,
          unsatisfied: list.filter((o: any) => o.visitResult === 'unsatisfied').length,
          pending: list.filter((o: any) => !o.visitResult).length
        }
      }
    }
  }
]

function statusName(s: string): string {
  const map: Record<string, string> = { pending: '待受理', assigned: '已派单', processing: '处理中', verifying: '待验收', completed: '已完成', closed: '已关闭' }
  return map[s] || s
}
