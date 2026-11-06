import dayjs from 'dayjs'
import type {
  AppNotification,
  Channel,
  Defect,
  DetectionTask,
  MediaAsset,
  QcReport,
  RepairTask,
  ReviewRecord,
  Rule,
  ServiceOrder,
  Severity,
} from '../types'
import { db } from './db'
import { MEMBER_MAP } from './build'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function respond<T>(value: T, ms = 320): Promise<T> {
  await wait(ms)
  return value
}

export function assetById(id: string): MediaAsset | undefined {
  return db.assets.find((a) => a.id === id)
}

export const api = {
  async getDashboard() {
    const today = '2026-10-19'
    const todayTasks = db.tasks.filter((t) => t.startedAt.startsWith(today))
    const todayDuration = todayTasks.reduce((s, t) => s + t.durationSec, 0)
    const todayDefects = db.defects.filter((d) => todayTasks.some((t) => t.id === d.taskId)).length

    const reviewed = db.repairs.filter((r) => ['passed', 'rejected'].includes(r.status))
    const passed = reviewed.filter((r) => r.status === 'passed').length
    const successRate = reviewed.length ? passed / reviewed.length : 0
    const avgRepairMinutes =
      db.repairs.filter((r) => r.status === 'passed').reduce((s, r) => s + (r.planId ? 0 : 0), 0) + 42.6

    const trend = Array.from({ length: 30 }).map((_, i) => {
      const day = dayjs('2026-10-19').subtract(29 - i, 'day')
      const key = day.format('YYYY-MM-DD')
      return {
        date: key,
        detect: db.tasks.filter((t) => t.startedAt.startsWith(key)).length + (i % 4 === 0 ? 2 : i % 3 === 0 ? 1 : 0),
        repair: db.repairs.filter((r) => r.startedAt.startsWith(key)).length + (i % 5 === 0 ? 1 : 0),
      }
    })

    const channelOrder: Channel[] = ['video', 'audio', 'container', 'subtitle']
    const channelDist = channelOrder.map((ch) => {
      const items = db.defects.filter((d) => d.channel === ch)
      return {
        channel: ch,
        fatal: items.filter((d) => d.severity === 'fatal').length,
        severe: items.filter((d) => d.severity === 'severe').length,
        moderate: items.filter((d) => d.severity === 'moderate').length,
        info: items.filter((d) => d.severity === 'info').length,
        total: items.length,
      }
    })

    const running = db.tasks.filter((t) => ['queued', 'probing', 'detecting', 'aggregating'].includes(t.status))
    const pendingReview = db.repairs.filter((r) => r.status === 'review').length
    const failedRecheck = db.repairs.filter((r) => r.status === 'rejected' || r.status === 'failed').length
    const overdueOrders = db.orders.filter((o) => {
      if (['settled', 'canceled', 'accepted'].includes(o.status)) return false
      return dayjs(o.slaDeadline).isBefore(dayjs('2026-10-19T10:25:00'))
    }).length

    return respond({
      kpi: {
        todayDuration,
        todayDefects,
        successRate,
        pendingReview,
        avgRepairMinutes,
      },
      trend,
      channelDist,
      running,
      todos: [
        { key: 'plan', label: '待确认方案', count: db.repairs.filter((r) => r.status === 'pending').length, link: '/repair' },
        { key: 'review', label: '待验收', count: pendingReview, link: '/review/rt4' },
        { key: 'recheck', label: '复检未通过', count: failedRecheck, link: '/repair' },
        { key: 'sla', label: '超时 / 预警工单', count: overdueOrders, link: '/service/orders' },
      ],
      recentTasks: db.tasks.slice(0, 8),
      nodes: db.nodes,
    })
  },

  listAssets: () => respond(db.assets),
  getAsset: (id: string) => respond(db.assets.find((a) => a.id === id)),
  assetsByIds: (ids: string[]) => respond(db.assets.filter((a) => ids.includes(a.id))),

  listTasks: () => respond(db.tasks),
  getTask: (id: string) => respond(db.tasks.find((t) => t.id === id)),
  taskDefects: (id: string): Promise<Defect[]> => respond(db.defects.filter((d) => d.taskId === id)),
  updateDefectStatus: async (defectId: string, status: Defect['status']) => {
    const d = db.defects.find((x) => x.id === defectId)
    if (d) d.status = status
    return respond(d)
  },

  listRepairs: () => respond(db.repairs),
  getRepair: (id: string) => respond(db.repairs.find((r) => r.id === id)),
  getPlan: (id: string) => respond(db.plans.find((p) => p.id === id)),
  getPlanByRepair: (repairId: string) => {
    const repair = db.repairs.find((r) => r.id === repairId)
    return respond(db.plans.find((p) => p.id === repair?.planId))
  },
  getReviewByRepair: (repairId: string) => respond(db.reviews.find((r) => r.repairTaskId === repairId)),
  signReview: async (repairId: string, verdict: 'pass' | 'reject', comment: string, signedBy: string) => {
    const review = db.reviews.find((r) => r.repairTaskId === repairId)
    const repair = db.repairs.find((r) => r.id === repairId)
    if (review) {
      review.verdict = verdict
      review.comment = comment
      review.signedBy = signedBy
      review.signedAt = dayjs().toISOString()
    }
    if (repair) repair.status = verdict === 'pass' ? 'passed' : 'rejected'
    return respond({ review, repair })
  },
  saveReviewChecklist: async (repairId: string, checklist: ReviewRecord['checklist']) => {
    const review = db.reviews.find((r) => r.repairTaskId === repairId)
    if (review) review.checklist = checklist
    return respond(review)
  },

  listReports: () => respond(db.reports),
  getReport: (id: string) => respond(db.reports.find((r) => r.id === id)),
  getReportByTask: (taskId: string) => respond(db.reports.find((r) => r.taskId === taskId)),

  listOrders: () => respond(db.orders),
  getOrder: (id: string) => respond(db.orders.find((o) => o.id === id)),
  createOrder: async (input: {
    customerName: string
    contact: string
    packageId: string
    title: string
    amount: number
    slaHours: number
    quoteLines: { label: string; qty: number; unit: string; price: number }[]
    engineerId: string
  }) => {
    const pkg = db.packages.find((p) => p.id === input.packageId)
    const now = dayjs()
    const idx = db.orders.length
    const order: ServiceOrder = {
      id: `so${idx + 1}`,
      code: `SO-2026-${String(80 + idx).padStart(4, '0')}`,
      customerId: 'c-new',
      customerName: input.customerName,
      contact: input.contact,
      packageId: input.packageId,
      packageName: pkg?.name ?? '定制服务',
      title: input.title,
      status: 'quoted',
      amount: input.amount,
      slaHours: input.slaHours,
      slaDeadline: dayjs(now).add(input.slaHours || 240, 'hour').toISOString(),
      engineerId: input.engineerId,
      createdAt: now.toISOString(),
      milestones: [
        { key: 'submit', label: '需求提交', at: now.toISOString(), done: true },
        { key: 'quote', label: '评估报价', at: now.toISOString(), done: true },
        { key: 'sign', label: '签约确认', done: false },
        { key: 'receive', label: '素材接收', done: false },
        { key: 'schedule', label: '排期', done: false },
        { key: 'process', label: '处理中', done: false },
        { key: 'qc', label: '内审质检', done: false },
        { key: 'deliver', label: '交付', done: false },
        { key: 'accept', label: '客户验收', done: false },
        { key: 'settle', label: '结算完成', done: false },
      ],
      assetIds: [],
      deliverables: [],
      messages: [
        { id: `m-${Date.now()}`, from: 'client', text: `${input.title}，麻烦评估一下周期与报价。`, at: now.toISOString() },
      ],
      quote: {
        lines: input.quoteLines,
        total: input.amount,
        validUntil: dayjs(now).add(7, 'day').toISOString(),
        status: 'pending',
      },
      invoice: { no: `INV-2026-${2200 + idx}`, status: 'none', amount: input.amount },
    }
    db.orders.unshift(order)
    return respond(order, 480)
  },
  updateOrderStatus: async (id: string, status: ServiceOrder['status']) => {
    const order = db.orders.find((o) => o.id === id)
    if (order) order.status = status
    return respond(order)
  },
  appendOrderMessage: async (id: string, text: string, from: 'client' | 'engineer' = 'engineer') => {
    const order = db.orders.find((o) => o.id === id)
    if (order) {
      order.messages.push({ id: `msg-${Date.now()}`, from, text, at: dayjs().toISOString() })
    }
    return respond(order)
  },
  acceptQuote: async (id: string) => {
    const order = db.orders.find((o) => o.id === id)
    if (order) {
      order.quote.status = 'accepted'
      order.status = 'signed'
    }
    return respond(order)
  },

  listRules: () => respond(db.rules),
  toggleRule: async (id: string, enabled: boolean) => {
    const rule = db.rules.find((r) => r.id === id)
    if (rule) {
      rule.enabled = enabled
      rule.updatedAt = dayjs().toISOString()
    }
    return respond(rule)
  },
  updateRuleThreshold: async (id: string, value: number) => {
    const rule = db.rules.find((r) => r.id === id)
    if (rule) {
      rule.threshold.value = value
      rule.updatedAt = dayjs().toISOString()
    }
    return respond(rule)
  },
  listRuleSets: () => respond(db.ruleSets),

  listNodes: () => respond(db.nodes),
  listMembers: () => respond(db.members),
  memberById: (id: string) => MEMBER_MAP[id],
  listNotifications: () => respond(db.notifications),
  markNotificationRead: async (id: string) => {
    const n = db.notifications.find((x) => x.id === id)
    if (n) n.read = true
    return respond(true, 80)
  },
  markAllNotificationsRead: async () => {
    db.notifications.forEach((n) => (n.read = true))
    return respond(true, 120)
  },

  listCases: () => respond(db.cases),
  getCase: (id: string) => respond(db.cases.find((c) => c.id === id)),
  listAuditLogs: () => respond(db.auditLogs),
}

export type DashboardData = Awaited<ReturnType<typeof api.getDashboard>>
export type { AppNotification, DetectionTask, RepairTask, QcReport, Rule, Severity }
