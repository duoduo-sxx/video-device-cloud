import { create } from 'zustand'
import dayjs from 'dayjs'
import type { DB } from '@/mock/db'
import { loadDB, resetDB, saveDB, seedDB } from '@/mock/db'
import { validateDB } from '@/mock/validate'
import type {
  AuditLog,
  Device,
  ExecResult,
  Operation,
  Scene,
  TaskStatus,
  Ticket,
  TicketPriority,
} from '@/types'
import { randInt, chance } from '@/utils/misc'

const stamp = () => dayjs().format('YYYY-MM-DDTHH:mm:ssZ')

interface DataState {
  db: DB
  ready: boolean
  init: () => void
  persist: () => void
  addAudit: (action: string, target: string, targetType: AuditLog['targetType'], detail?: Record<string, unknown>) => void
  toggleDevicePower: (id: string) => void
  setDeviceValue: (id: string, value: number) => void
  setDeviceMode: (id: string, mode: string) => void
  batchPower: (ids: string[], power: boolean) => void
  runScene: (sceneId: string) => ExecResult
  toggleSceneEnabled: (id: string) => void
  saveSceneSteps: (sceneId: string, steps: Scene['steps']) => void
  ackAlert: (id: string, operator: string) => void
  processAlert: (id: string, operator: string, note?: string) => void
  closeAlert: (id: string, operator: string, note?: string) => void
  assignAlert: (id: string, operator: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  retryTask: (id: string) => void
  addTask: (payload: Partial<import('@/types').Task> & { name: string }) => string
  createTicket: (payload: {
    title: string
    serviceType: string
    priority: TicketPriority
    deviceId?: string
    deviceName?: string
    description: string
    creator: string
    slaMinutes: number
  }) => string
  advanceTicket: (id: string, operator: string, note?: string) => void
  addTicketComment: (id: string, author: string, content: string) => void
  rateTicket: (id: string, rating: NonNullable<Ticket['rating']>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  toggleRule: (id: string) => void
  tickDevices: () => void
  pushAlert: () => void
  reset: () => void
}

export const useDataStore = create<DataState>((set, get) => ({
  db: loadDB(),
  ready: false,

  init: () => {
    const db = get().db
    if (import.meta.env.DEV) {
      const issues = validateDB(db)
      if (issues.length) console.warn('[mock] 关联一致性校验发现问题：\n' + issues.join('\n'))
    }
    set({ ready: true })
  },

  persist: () => {
    saveDB(get().db)
  },

  addAudit: (action, target, targetType, detail = {}) => {
    const operator = get().db.users[0]?.name ?? '系统'
    const entry: AuditLog = {
      id: `AUD-${Date.now()}`,
      time: stamp(),
      operator,
      action,
      target,
      targetType,
      result: 'success',
      ip: '192.168.10.36',
      detail,
    }
    const db = { ...get().db, audits: [entry, ...get().db.audits].slice(0, 400) }
    set({ db })
    saveDB(db)
  },

  toggleDevicePower: (id) => {
    const db = {
      ...get().db,
      devices: get().db.devices.map((d) =>
        d.id === id
          ? {
              ...d,
              power: !d.power,
              status: d.status === 'offline' ? d.status : ('online' as Device['status']),
              lastReportAt: stamp(),
            }
          : d,
      ),
    }
    set({ db })
    saveDB(db)
    const dev = db.devices.find((d) => d.id === id)
    if (dev) get().addAudit(dev.power ? '开启设备' : '关闭设备', `${dev.name}（${dev.code}）`, 'device', { deviceId: id, to: dev.power })
  },

  setDeviceValue: (id, value) => {
    const db = {
      ...get().db,
      devices: get().db.devices.map((d) => {
        if (d.id !== id) return d
        const metrics = d.metrics.map((m, i) =>
          i === 0 ? { ...m, value, trend: [...(m.trend ?? []).slice(1), value] } : m,
        )
        return { ...d, value, power: value > 0 ? true : d.power, metrics, lastReportAt: stamp() }
      }),
    }
    set({ db })
    saveDB(db)
    const dev = db.devices.find((d) => d.id === id)
    if (dev) get().addAudit('调整设备参数', `${dev.name}（${dev.code}）`, 'device', { deviceId: id, value })
  },

  setDeviceMode: (id, mode) => {
    const db = {
      ...get().db,
      devices: get().db.devices.map((d) => (d.id === id ? { ...d, mode, lastReportAt: stamp() } : d)),
    }
    set({ db })
    saveDB(db)
    const dev = db.devices.find((d) => d.id === id)
    if (dev) get().addAudit('切换设备模式', `${dev.name}（${dev.code}）`, 'device', { deviceId: id, mode })
  },

  batchPower: (ids, power) => {
    const db = {
      ...get().db,
      devices: get().db.devices.map((d) =>
        ids.includes(d.id) && d.status !== 'offline' ? { ...d, power, lastReportAt: stamp() } : d,
      ),
    }
    set({ db })
    saveDB(db)
    get().addAudit(power ? '批量开启设备' : '批量关闭设备', `${ids.length} 台设备`, 'device', { ids, power })
  },

  runScene: (sceneId) => {
    const db = get().db
    const scene = db.scenes.find((s) => s.id === sceneId)
    if (!scene) {
      return { status: 'failed', title: '场景不存在', devices: 0, cost: 0, undoable: false }
    }
    const failed: string[] = []
    const affected = new Set<string>()
    scene.steps.forEach((st) => st.actions.forEach((a) => affected.add(a.deviceId)))

    const devices = db.devices.map((d) => {
      const actions = scene.steps.flatMap((st) => st.actions).filter((a) => a.deviceId === d.id)
      if (!actions.length) return d
      if (d.status === 'offline' || chance(0.05)) {
        failed.push(`${d.name}（${d.code}）`)
        return d
      }
      let next = { ...d, lastReportAt: stamp() }
      actions.forEach((a) => {
        next = applyAction(next, a.operation, a.target)
      })
      return next
    })

    const cost = Math.round(scene.avgDuration * 1000 * (0.82 + Math.random() * 0.36))
    const status: ExecResult['status'] = failed.length === 0 ? 'success' : failed.length < 3 ? 'partial' : 'failed'
    const nextDb: DB = {
      ...db,
      devices,
      scenes: db.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, usedCount: s.usedCount + 1, lastRunAt: stamp() }
          : s,
      ),
      commands: [
        {
          id: `CMD-${Date.now()}`,
          sessionId: 'SES-LIVE',
          userId: 'U-001',
          userName: db.users[0]?.name ?? '张启明',
          input: `执行场景「${scene.name}」`,
          inputMode: 'text',
          intentLabel: 'scene.start',
          status,
          affectedDevices: affected.size,
          cost,
          createdAt: stamp(),
        },
        ...db.commands,
      ],
    }
    set({ db: nextDb })
    saveDB(nextDb)
    get().addAudit('执行场景', scene.name, 'scene', { sceneId, failed: failed.length })
    return {
      status,
      title: status === 'success' ? '场景已启动' : status === 'partial' ? '场景部分完成' : '场景执行失败',
      devices: affected.size,
      cost,
      failed: failed.length ? failed : undefined,
      undoable: status !== 'failed',
      sceneId,
    }
  },

  toggleSceneEnabled: (id) => {
    const db = {
      ...get().db,
      scenes: get().db.scenes.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }
    set({ db })
    saveDB(db)
  },

  saveSceneSteps: (sceneId, steps) => {
    const deviceCount = new Set(steps.flatMap((s) => s.actions.map((a) => a.deviceId))).size
    const db = {
      ...get().db,
      scenes: get().db.scenes.map((s) => (s.id === sceneId ? { ...s, steps, deviceCount } : s)),
    }
    set({ db })
    saveDB(db)
    get().addAudit('保存场景编排', sceneId, 'scene', { steps: steps.length })
  },

  ackAlert: (id, operator) => {
    const db = {
      ...get().db,
      alerts: get().db.alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'acknowledged' as const,
              assignee: operator,
              records: [...a.records, { time: stamp(), action: '认领', operator }],
            }
          : a,
      ),
    }
    set({ db })
    saveDB(db)
    get().addAudit('认领告警', id, 'alert', { operator })
  },

  processAlert: (id, operator, note) => {
    const db = {
      ...get().db,
      alerts: get().db.alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'processing' as const,
              assignee: a.assignee ?? operator,
              records: [...a.records, { time: stamp(), action: '转处理中', operator, note }],
            }
          : a,
      ),
    }
    set({ db })
    saveDB(db)
  },

  closeAlert: (id, operator, note) => {
    const db = {
      ...get().db,
      alerts: get().db.alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'closed' as const,
              assignee: a.assignee ?? operator,
              records: [...a.records, { time: stamp(), action: '关闭', operator, note: note ?? '已确认处置完成' }],
            }
          : a,
      ),
    }
    set({ db })
    saveDB(db)
    get().addAudit('关闭告警', id, 'alert', { note })
  },

  assignAlert: (id, operator) => {
    const db = {
      ...get().db,
      alerts: get().db.alerts.map((a) =>
        a.id === id ? { ...a, assignee: operator, records: [...a.records, { time: stamp(), action: '指派', operator }] } : a,
      ),
    }
    set({ db })
    saveDB(db)
  },

  moveTask: (id, status) => {
    const db = {
      ...get().db,
      tasks: get().db.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              progress: status === 'done' ? 100 : status === 'running' ? Math.max(t.progress, 20) : status === 'pending' ? 0 : t.progress,
              finishedAt: status === 'done' ? stamp() : t.finishedAt,
            }
          : t,
      ),
    }
    set({ db })
    saveDB(db)
    get().addAudit('调整任务状态', id, 'task', { status })
  },

  retryTask: (id) => {
    const db = {
      ...get().db,
      tasks: get().db.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'running' as const,
              progress: 10,
              failReason: undefined,
              startedAt: stamp(),
              logs: [...t.logs, { id: `lg-${Date.now()}`, time: stamp(), action: '手动重试', result: 'ok' as const, cost: 320 }],
            }
          : t,
      ),
    }
    set({ db })
    saveDB(db)
    get().addAudit('重试任务', id, 'task')
  },

  addTask: (payload) => {
    const id = `TK-${dayjs().format('YYYYMMDD')}-${String(randInt(100, 999))}`
    const db = {
      ...get().db,
      tasks: [
        {
          id,
          name: payload.name,
          description: payload.description ?? '',
          type: payload.type ?? 'scene',
          trigger: payload.trigger ?? 'manual',
          schedule: payload.schedule,
          status: 'pending' as const,
          progress: 0,
          sceneId: payload.sceneId,
          deviceIds: payload.deviceIds ?? [],
          assignee: payload.assignee ?? '张启明',
          plannedAt: payload.plannedAt ?? stamp(),
          logs: [],
        },
        ...get().db.tasks,
      ],
    }
    set({ db })
    saveDB(db)
    get().addAudit('新建任务', payload.name, 'task', { id })
    return id
  },

  createTicket: ({ title, serviceType, priority, deviceId, deviceName, description, creator, slaMinutes }) => {
    const now = dayjs()
    const id = `TS-${now.format('YYYYMMDD')}-${String(randInt(43, 99)).padStart(4, '0')}`
    const ticket: Ticket = {
      id,
      title,
      serviceType,
      status: 'pending',
      priority,
      deviceId,
      deviceName,
      creator,
      createdAt: now.format('YYYY-MM-DDTHH:mm:ssZ'),
      expectedAt: now.add(slaMinutes, 'minute').format('YYYY-MM-DDTHH:mm:ssZ'),
      slaMinutes,
      slaRemainMinutes: slaMinutes,
      description,
      comments: [
        {
          id: `c-${Date.now()}`,
          author: creator,
          avatarColor: '#22D3EE',
          time: now.format('YYYY-MM-DDTHH:mm:ssZ'),
          content: description,
        },
      ],
    }
    const db = { ...get().db, tickets: [ticket, ...get().db.tickets] }
    set({ db })
    saveDB(db)
    get().addAudit('创建工单', id, 'ticket', { serviceType, priority })
    return id
  },

  advanceTicket: (id, operator, note) => {
    const flow: Record<string, { next: Ticket['status']; label: string }> = {
      pending: { next: 'processing', label: '待受理 → 处理中' },
      assigned: { next: 'processing', label: '已指派 → 处理中' },
      processing: { next: 'verifying', label: '处理中 → 待验证' },
      verifying: { next: 'done', label: '待验证 → 已完成' },
      done: { next: 'closed', label: '已完成 → 已关闭' },
    }
    const db = {
      ...get().db,
      tickets: get().db.tickets.map((t) => {
        if (t.id !== id) return t
        const step = flow[t.status]
        if (!step) return t
        return {
          ...t,
          status: step.next,
          assignee: t.assignee ?? operator,
          closedAt: step.next === 'done' || step.next === 'closed' ? stamp() : t.closedAt,
          comments: [
            ...t.comments,
            {
              id: `c-${Date.now()}`,
              author: operator,
              avatarColor: '#7C5CFF',
              time: stamp(),
              content: note || '已推进工单状态，等待下一步处理。',
              statusChange: step.label,
            },
          ],
        }
      }),
    }
    set({ db })
    saveDB(db)
    get().addAudit('推进工单', id, 'ticket')
  },

  addTicketComment: (id, author, content) => {
    const db = {
      ...get().db,
      tickets: get().db.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              comments: [...t.comments, { id: `c-${Date.now()}`, author, avatarColor: '#60A5FA', time: stamp(), content }],
            }
          : t,
      ),
    }
    set({ db })
    saveDB(db)
  },

  rateTicket: (id, rating) => {
    const db = {
      ...get().db,
      tickets: get().db.tickets.map((t) => (t.id === id ? { ...t, rating } : t)),
    }
    set({ db })
    saveDB(db)
  },

  markNotificationRead: (id) => {
    const db = {
      ...get().db,
      notifications: get().db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }
    set({ db })
    saveDB(db)
  },

  markAllNotificationsRead: () => {
    const db = { ...get().db, notifications: get().db.notifications.map((n) => ({ ...n, read: true })) }
    set({ db })
    saveDB(db)
  },

  toggleRule: (id) => {
    const db = {
      ...get().db,
      rules: get().db.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    }
    set({ db })
    saveDB(db)
  },

  tickDevices: () => {
    const db = {
      ...get().db,
      devices: get().db.devices.map((d) => {
        if (d.status !== 'online') return d
        const metrics = d.metrics.map((m) => {
          const drift = (Math.random() - 0.5) * (m.value > 100 ? m.value * 0.01 : 1.2)
          const next = Number((m.value + drift).toFixed(1))
          return { ...m, value: next, trend: [...(m.trend ?? []).slice(1), next] }
        })
        return { ...d, metrics, lastReportAt: stamp() }
      }),
      lastSync: stamp(),
    }
    set({ db })
  },

  pushAlert: () => {
    const db = get().db
    const target = db.devices[randInt(0, db.devices.length - 1)]
    const alert = {
      id: `ALT-${dayjs().format('YYYYMMDD')}-${String(randInt(200, 999)).padStart(4, '0')}`,
      title: `${target.name}${target.category === 'hvac' ? '回风温度偏高' : target.category === 'network' ? '端口丢包率上升' : '运行指标异常'}`,
      level: 'P2' as const,
      status: 'open' as const,
      deviceId: target.id,
      deviceName: target.name,
      spaceId: target.spaceId,
      metric: target.metrics[0]?.label ?? '指标',
      currentValue: Number(((target.metrics[0]?.value ?? 50) * 1.18).toFixed(1)),
      threshold: target.metrics[0]?.value ?? 50,
      unit: target.metrics[0]?.unit ?? '',
      triggeredAt: stamp(),
      duration: 1,
      description: `${target.name}（${target.code}）实时指标越过告警阈值，系统已自动生成事件并推送至值班台。`,
      suggestions: ['查看设备最近 1 小时指标曲线', '远程下发一次状态查询', '若持续异常，转入工单处理'],
      series: Array.from({ length: 20 }, (_, i) => ({
        time: dayjs().subtract(19 - i, 'minute').format('HH:mm'),
        value: Number(((target.metrics[0]?.value ?? 50) * (0.9 + i * 0.014)).toFixed(1)),
      })),
      records: [{ time: stamp(), action: '触发告警', operator: '系统' }],
    }
    const nextDb = {
      ...db,
      alerts: [alert, ...db.alerts],
      notifications: [
        {
          id: `NT-${Date.now()}`,
          type: 'alert' as const,
          title: `${alert.level} ${alert.title}`,
          desc: `${alert.deviceName} · 当前 ${alert.currentValue}${alert.unit}`,
          time: stamp(),
          read: false,
          link: '/alerts',
        },
        ...db.notifications,
      ],
    }
    set({ db: nextDb })
    saveDB(nextDb)
  },

  reset: () => {
    resetDB()
    const fresh = seedDB()
    saveDB(fresh)
    set({ db: fresh })
  },
}))

function applyAction(device: Device, op: Operation, target?: string | number): Device {
  switch (op) {
    case 'powerOn':
      return { ...device, power: true, status: device.status === 'offline' ? device.status : 'online' }
    case 'powerOff':
      return { ...device, power: false }
    case 'setValue': {
      const value = typeof target === 'number' ? target : Number(target) || 0
      return {
        ...device,
        value,
        power: value > 0 ? true : device.power,
        metrics: device.metrics.map((m, i) =>
          i === 0 ? { ...m, value, trend: [...(m.trend ?? []).slice(1), value] } : m,
        ),
      }
    }
    case 'setMode':
      return { ...device, mode: String(target ?? device.mode) }
    default:
      return device
  }
}
