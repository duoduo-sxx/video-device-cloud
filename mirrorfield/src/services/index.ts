import { getDB, resetDB, saveDB, type DB } from '@/mock'
import type {
  Annotation, Asset, Calibration, CollectTask, Defect, Deliverable, InspectPlan, MrDevice,
  Order, Ticket, TicketStatus, User,
} from '@/types'

export const db = (): DB => getDB()

export function persist(next: DB) {
  saveDB(next)
}

export function resetAll() {
  return resetDB()
}

export interface Paged<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export function paginate<T>(list: T[], page = 1, pageSize = 20): Paged<T> {
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length, page, pageSize }
}

const match = (text: string, kw?: string) => !kw || text.toLowerCase().includes(kw.toLowerCase())

export const api = {
  tasks: {
    list(q: { kw?: string; status?: string; type?: string; page?: number; pageSize?: number }) {
      const all = db().tasks.filter(
        (t) =>
          (match(t.name + t.id + t.area, q.kw)) &&
          (!q.status || t.status === q.status) &&
          (!q.type || t.type === q.type),
      )
      return paginate(all, q.page, q.pageSize)
    },
    all: () => db().tasks,
    get: (id: string) => db().tasks.find((t) => t.id === id),
    create(input: Partial<CollectTask>) {
      const d = db()
      const task: CollectTask = {
        id: `CT-2026-${String(d.tasks.length + 1).padStart(3, '0')}`,
        name: input.name ?? '未命名采集任务',
        type: input.type ?? 'UAV_OBLIQUE',
        area: input.area ?? 'A 区 智能装配 · A-01',
        deviceId: input.deviceId ?? 'DEV-UAV-001',
        pilot: input.pilot ?? '李强',
        plannedStart: input.plannedStart ?? new Date().toISOString(),
        plannedEnd: input.plannedEnd ?? new Date().toISOString(),
        status: 'PENDING',
        params: input.params ?? { altitude: 120, gsd: 1.5, forwardOverlap: 80, sideOverlap: 70, photos: 0 },
        dataSize: '0 GB',
        quality: 'PENDING',
        owner: input.pilot ?? '李强',
        remark: input.remark ?? '',
      }
      d.tasks.unshift(task)
      persist(d)
      return task
    },
    setQuality(id: string, quality: CollectTask['quality']) {
      const d = db()
      const t = d.tasks.find((x) => x.id === id)
      if (t) t.quality = quality
      persist(d)
    },
  },

  assets: {
    list(q: { kw?: string; format?: string; status?: string; page?: number; pageSize?: number }) {
      const all = db().assets.filter(
        (a) =>
          match(a.name + a.buildingCode, q.kw) &&
          (!q.format || a.format === q.format) &&
          (!q.status || a.status === q.status),
      )
      return paginate(all, q.page, q.pageSize)
    },
    all: () => db().assets,
    get: (id: string) => db().assets.find((a) => a.id === id),
    update(id: string, patch: Partial<Asset>) {
      const d = db()
      const a = d.assets.find((x) => x.id === id)
      if (a) Object.assign(a, patch)
      persist(d)
      return a
    },
  },

  devices: {
    all: () => db().mrDevices,
    get: (id: string) => db().mrDevices.find((d) => d.id === id),
    calibrations: (deviceId: string) => db().calibrations.filter((c) => c.deviceId === deviceId),
    update(id: string, patch: Partial<MrDevice>) {
      const d = db()
      const item = d.mrDevices.find((x) => x.id === id)
      if (item) Object.assign(item, patch)
      persist(d)
    },
    addCalibration(input: Partial<Calibration>) {
      const d = db()
      const cal: Calibration = {
        id: `CAL-${String(d.calibrations.length + 1).padStart(3, '0')}`,
        deviceId: input.deviceId ?? 'MR-001',
        sceneId: input.sceneId ?? 'SC-001',
        method: input.method ?? 'POINTCLOUD',
        rms: input.rms ?? 12,
        maxError: input.maxError ?? 21,
        points: input.points ?? 26,
        operator: input.operator ?? '陈晓峰',
        createdAt: new Date().toISOString(),
        pass: (input.rms ?? 12) <= 15,
      }
      d.calibrations.unshift(cal)
      persist(d)
      return cal
    },
  },

  scenes: {
    all: () => db().scenes,
    get: (id: string) => db().scenes.find((s) => s.id === id),
    update(id: string, patch: Partial<{ name: string; status: 'DRAFT' | 'PUBLISHED' | 'OFFLINE'; nodeCount: number; duration: number }>) {
      const d = db()
      const s = d.scenes.find((x) => x.id === id)
      if (s) Object.assign(s, patch, { updatedAt: new Date().toISOString() })
      persist(d)
    },
  },

  sessions: {
    all: () => db().sessions,
    byScene: (sceneId: string) => db().sessions.filter((s) => s.sceneId === sceneId),
  },

  tickets: {
    all: () => db().tickets,
    get: (id: string) => db().tickets.find((t) => t.id === id),
    byStatus: (status: TicketStatus) => db().tickets.filter((t) => t.status === status),
    move(id: string, status: TicketStatus, note: string, actor = '张伟') {
      const d = db()
      const t = d.tickets.find((x) => x.id === id)
      if (t) {
        t.status = status
        t.events.push({ at: new Date().toISOString(), actor, action: `流转至${status}`, note })
        if (status !== 'PENDING' && !t.assignee) t.assignee = '赵敏'
      }
      persist(d)
      return t
    },
    create(input: Partial<Ticket>) {
      const d = db()
      const t: Ticket = {
        id: `WO-2026${String(d.tickets.length + 1).padStart(5, '0')}`,
        title: input.title ?? '新建工单',
        priority: input.priority ?? '中',
        source: input.source ?? '标注',
        status: 'PENDING',
        assignee: '',
        createdAt: new Date().toISOString(),
        sla: new Date(Date.now() + 72 * 3600000).toISOString(),
        location: input.location ?? 'A-03 装配车间三 / 屋面',
        buildingCode: input.buildingCode ?? 'A-03',
        description: input.description ?? '',
        createdBy: '张伟',
        events: [{ at: new Date().toISOString(), actor: '张伟', action: '创建工单', note: '由三维标注转工单' }],
      }
      d.tickets.unshift(t)
      persist(d)
      return t
    },
  },

  defects: {
    all: () => db().defects,
    update(id: string, patch: Partial<Defect>) {
      const d = db()
      const x = d.defects.find((i) => i.id === id)
      if (x) Object.assign(x, patch)
      persist(d)
    },
  },

  plans: {
    all: () => db().plans,
    get: (id: string) => db().plans.find((p) => p.id === id),
    records: (planId: string) => db().records.filter((r) => r.planId === planId),
  },

  records: {
    all: () => db().records,
  },

  orders: {
    all: () => db().orders,
    get: (id: string) => db().orders.find((o) => o.id === id),
    deliverables: (orderId: string) => db().deliverables.filter((d) => d.orderId === orderId),
    acceptDeliverable(id: string, accepted: boolean) {
      const d = db()
      const x = d.deliverables.find((i) => i.id === id)
      if (x) x.accepted = accepted
      persist(d)
    },
    approve(orderId: string, note: string) {
      const d = db()
      const o = d.orders.find((i) => i.id === orderId)
      if (o) {
        o.status = 'DONE'
        o.progress = 100
        o.milestones = o.milestones.map((m) => ({ ...m, done: true }))
        o.payments = o.payments.map((p) => ({ ...p, status: '已回款' as const }))
        const dl = d.deliverables.filter((x) => x.orderId === orderId)
        dl.forEach((x) => (x.accepted = true))
        d.logs.unshift({
          id: `LG-${String(d.logs.length + 1).padStart(5, '0')}`,
          userId: 'U001', userName: '张伟', module: '技术服务', action: '验收通过',
          target: `${orderId}：${note.slice(0, 20)}`, ip: '10.20.1.12', result: '成功',
          createdAt: new Date().toISOString(),
        })
      }
      persist(d)
      return o
    },
  },

  annotations: {
    all: () => db().annotations,
    add(input: Partial<Annotation>) {
      const d = db()
      const a: Annotation = {
        id: `AN-${String(d.annotations.length + 1).padStart(3, '0')}`,
        title: input.title ?? '新标注',
        type: input.type ?? '说明',
        desc: input.desc ?? '',
        pos: input.pos ?? [0, 20, 0],
        buildingCode: input.buildingCode ?? 'A-01',
        color: input.color ?? '#22D3EE',
        createdAt: new Date().toISOString(),
        createdBy: '张伟',
      }
      d.annotations.push(a)
      persist(d)
      return a
    },
    remove(id: string) {
      const d = db()
      d.annotations = d.annotations.filter((a) => a.id !== id)
      persist(d)
    },
  },

  users: {
    all: () => db().users,
    update(id: string, patch: Partial<User>) {
      const d = db()
      const u = d.users.find((x) => x.id === id)
      if (u) Object.assign(u, patch)
      persist(d)
    },
  },

  logs: {
    all: () => db().logs,
  },

  notifications: {
    all: () => db().notifications,
    markRead(id: string) {
      const d = db()
      const n = d.notifications.find((x) => x.id === id)
      if (n) n.read = true
      persist(d)
    },
    markAllRead() {
      const d = db()
      d.notifications.forEach((n) => (n.read = true))
      persist(d)
    },
  },

  stats: {
    kpi() {
      const d = db()
      const online = d.mrDevices.filter((x) => x.status === 'ONLINE').length
      return {
        projects: d.projects.filter((p) => p.stage !== '已交付').length,
        area: d.projects.reduce((s, p) => s + (parseFloat(p.area) || 0), 0).toFixed(1),
        assets: d.assets.length,
        points: '62.4',
        online,
        devices: d.mrDevices.length,
        sessions: d.sessions.filter((s) => Date.now() - new Date(s.startAt).getTime() < 7 * 86400000).length,
        defects: d.defects.filter((x) => x.status !== 'CLOSED').length,
        tickets: d.tickets.filter((x) => x.status !== 'DONE').length,
        overdueOrders: d.orders.filter((o) => (o as Order & { late?: boolean }).late).length,
      }
    },
    storage() {
      return [
        { name: '倾斜摄影', value: 1.82, unit: 'TB' },
        { name: '点云', value: 1.06, unit: 'TB' },
        { name: '全景', value: 0.486, unit: 'TB' },
        { name: 'BIM', value: 0.00121, unit: 'TB' },
        { name: '其他', value: 0.092, unit: 'TB' },
      ]
    },
    sessionTrend() {
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(Date.now() - (29 - i) * 86400000)
        const wd = d.getDay()
        const base = wd === 0 || wd === 6 ? 3 : 12
        return {
          date: `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`,
          count: base + Math.round(Math.sin(i / 3) * 2) + (i % 5),
          duration: 16 + (i % 7),
        }
      })
    },
    defectsByType() {
      const d = db()
      const map: Record<string, number> = {}
      d.defects.forEach((x) => {
        map[x.type] = (map[x.type] ?? 0) + 1
      })
      return Object.entries(map).map(([name, value]) => ({ name, value }))
    },
    ticketsByStatus() {
      const d = db()
      return (['PENDING', 'ASSIGNED', 'PROCESSING', 'VERIFYING', 'DONE'] as TicketStatus[]).map((s) => ({
        status: s,
        count: d.tickets.filter((t) => t.status === s).length,
      }))
    },
  },

  delivery: {
    all: () => db().deliverables,
    pending: () => db().orders.filter((o) => o.status === 'DELIVERING' || o.status === 'DONE'),
  },

  ordersAll: (): Order[] => db().orders,
  projectsAll: () => db().projects,
  datasetsAll: () => db().datasets,  deliverablesAll: (): Deliverable[] => db().deliverables,
  serviceItemsAll: () => db().serviceItems,
  orgsAll: () => db().orgs,
  plansAll: (): InspectPlan[] => db().plans,
  assetsAll: (): Asset[] => db().assets,
}
