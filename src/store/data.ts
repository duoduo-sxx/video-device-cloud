import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  AppNotification,
  AppSettings,
  Asset,
  AuditLog,
  Client,
  ConvertParams,
  Job,
  JobStatus,
  Node,
  Order,
  OrderStatus,
  OutputSpec,
  Preset,
  Project,
  ProjectStatus,
  TeamMember,
  Ticket,
  TicketStatus,
} from '../types'
import * as seedData from '../mock/data'
import { JOB_STATUS_LABEL, STAGE_META } from '../lib/constants'
import { estimateSeconds, jobCost, weightedProgress } from '../lib/calc'
import { addMinutes, NOW } from '../mock/seed'
import { uid } from '../lib/utils'

const storage = createJSONStorage(() => {
  let timer: number | undefined
  return {
    getItem: (name: string) => localStorage.getItem(name),
    setItem: (name: string, value: string) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => localStorage.setItem(name, value), 700)
    },
    removeItem: (name: string) => localStorage.removeItem(name),
  }
})

const defaultSettings: AppSettings = {
  profile: { name: '顾清和', email: 'guqinghe@spacescape.io', timezone: 'GMT+8 北京时间' },
  notifications: { jobDone: true, jobFailed: true, slaBreach: true, deliveryDue: false },
  defaults: { format: 'MV-HEVC', resolution: '3840x2160', bitrate: 'auto', presetId: 'prs_001' },
  storage: { rootPath: '/Volumes/SpaceScape/Projects', cacheGB: 42.6 },
  apiKeys: [
    { id: 'key_001', label: '生产环境（转码调度）', key: 'sk_live_9f2c41ab7d6e4c08b3a5', createdAt: '2026-03-12T09:20:00+08:00', lastUsedAt: '2026-10-19T09:41:00+08:00' },
    { id: 'key_002', label: '客户门户只读', key: 'sk_live_3b7d10ef92a84c51d6f2', createdAt: '2026-06-08T14:05:00+08:00', lastUsedAt: '2026-10-18T16:12:00+08:00' },
    { id: 'key_003', label: '测试环境', key: 'sk_test_5a1e88c3d47b4f209e60', createdAt: '2025-11-21T11:30:00+08:00' },
  ],
}

const latest = (a: string, b: string) => (a > b ? a : b)

interface CreateJobInput {
  assetIds: string[]
  output: OutputSpec
  params: ConvertParams
  presetId?: string
  priority: 'standard' | 'rush'
  nodeId?: string
}

interface DataState {
  clients: Client[]
  projects: Project[]
  assets: Asset[]
  jobs: Job[]
  presets: Preset[]
  orders: Order[]
  tickets: Ticket[]
  nodes: Node[]
  team: TeamMember[]
  notifications: AppNotification[]
  logs: AuditLog[]
  settings: AppSettings

  createJob: (input: CreateJobInput) => Job[]
  setJobStatus: (id: string, status: JobStatus, reason?: string) => void
  retryJob: (id: string) => void
  addAsset: (asset: Asset) => void
  updateAssetTags: (id: string, tags: string[]) => void
  removeAssets: (ids: string[]) => void
  savePreset: (preset: Preset) => void
  deletePreset: (id: string) => void
  setDefaultPreset: (id: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
  addReply: (ticketId: string, content: string) => void
  createTicket: (input: { title: string; type: Ticket['type']; priority: Ticket['priority']; clientId: string; projectId?: string; description: string }) => Ticket
  setTicketStatus: (id: string, status: TicketStatus) => void
  setNodeStatus: (id: string, status: Node['status']) => void
  createProject: (p: Project) => void
  setProjectStatus: (id: string, status: ProjectStatus) => void
  setOrderStatus: (id: string, status: OrderStatus) => void
  updateSettings: (patch: Partial<AppSettings>) => void
  addLog: (action: string, target: string, detail?: Record<string, unknown>) => void
  resetDemo: () => void
}

function stageLabel(key: string) {
  return STAGE_META.find((s) => s.key === key)?.label ?? key
}

function advanceStages(job: Job, deltaOverall: number): { changed: boolean; completedStage?: string } {
  const totalWeight = job.stages.reduce((s, st) => s + st.weight, 0)
  let remaining = (deltaOverall / 100) * totalWeight
  let completedStage: string | undefined
  for (const st of job.stages) {
    const room = ((100 - st.progress) / 100) * st.weight
    if (room <= 0.0001) continue
    const add = Math.min(room, remaining)
    st.progress = Math.min(100, st.progress + (add / st.weight) * 100)
    remaining -= add
    if (st.progress >= 99.99) {
      st.progress = 100
      st.finishedAt = new Date().toISOString()
      completedStage = st.label
    }
    if (remaining <= 0) break
  }
  return { changed: remaining !== (deltaOverall / 100) * totalWeight || completedStage !== undefined, completedStage }
}

function finishJob(job: Job) {
  job.status = 'completed'
  job.progress = 100
  job.finishedAt = new Date().toISOString()
  job.etaSec = undefined
  job.stages.forEach((s) => (s.progress = 100))
  const score = 84 + Math.round(Math.random() * 11)
  job.metrics = {
    comfortScore: score,
    temporalJitter: Math.round((0.06 + Math.random() * 0.06) * 1000) / 1000,
    edgeArtifactRate: Math.round((0.8 + Math.random() * 1.6) * 10) / 10,
    maxPositiveDisparity: Math.round((0.9 + Math.random() * 0.5) * 100) / 100,
    maxNegativeDisparity: Math.round((0.3 + Math.random() * 0.3) * 100) / 100,
    windowViolationFrames: Math.random() > 0.6 ? 1 : 0,
    depthConfidence: Math.round((0.85 + Math.random() * 0.1) * 100) / 100,
  }
  job.logs.push({
    ts: new Date().toISOString(),
    level: 'INFO',
    message: `全部阶段完成，质检舒适度 ${score}，已生成可交付母版`,
  })
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      clients: seedData.clients,
      projects: seedData.projects,
      assets: seedData.assets,
      jobs: seedData.jobs,
      presets: seedData.presets,
      orders: seedData.orders,
      tickets: seedData.tickets,
      nodes: seedData.nodes,
      team: seedData.team,
      notifications: seedData.notifications,
      logs: seedData.auditLogs,
      settings: defaultSettings,

      createJob: (input) => {
        const state = get()
        const created: Job[] = []
        const now = NOW.toISOString()
        input.assetIds.forEach((assetId, index) => {
          const asset = state.assets.find((a) => a.id === assetId)
          if (!asset) return
          const billedMinutes = Math.max(1, Math.round(asset.durationSec / 60))
          const preset = state.presets.find((p) => p.id === input.presetId)
          const eta = estimateSeconds(asset.durationSec, asset.width, input.output.format, input.priority === 'rush')
          const job: Job = {
            id: uid('job'),
            code: `SS-2610-${String(150 + state.jobs.length + index).slice(-4)}`,
            name: `${asset.name.replace(/\.[^.]+$/, '')} 空间化`,
            assetId: asset.id,
            projectId: asset.projectId,
            clientId: asset.clientId ?? 'cli_001',
            presetId: preset?.id,
            output: input.output,
            params: input.params,
            status: 'queued',
            progress: 0,
            stages: STAGE_META.map((m) => ({ ...m, progress: 0 })),
            priority: input.priority,
            nodeId: input.nodeId,
            operatorId: state.team[0].id,
            createdAt: now,
            etaSec: eta,
            costCNY: jobCost(billedMinutes, asset.width, input.priority === 'rush'),
            billedMinutes,
            version: 1,
            logs: [
              { ts: now, level: 'INFO', message: `任务已创建，输出规格 ${input.output.format} / ${input.output.resolution}，进入调度队列` },
              { ts: now, level: 'INFO', message: `参数：${input.params.depthModel}，视差 ${input.params.disparity}，收敛面 ${input.params.convergence}，时域平滑 ${input.params.temporalSmooth}` },
            ],
          }
          created.push(job)
        })
        set((s) => ({
          jobs: [...created, ...s.jobs],
          assets: s.assets.map((a) => (input.assetIds.includes(a.id) ? a : a)),
          logs: [
            {
              id: uid('log'),
              ts: now,
              actorId: state.team[0].id,
              actorName: state.team[0].name,
              action: 'job.create',
              target: created.map((c) => c.code).join(', '),
              ip: '10.24.1.36',
              detail: { count: created.length, format: input.output.format, priority: input.priority },
            },
            ...s.logs,
          ],
        }))
        return created
      },

      setJobStatus: (id, status, reason) =>
        set((s) => ({
          jobs: s.jobs.map((j) => {
            if (j.id !== id) return j
            const next: Job = { ...j, status }
            if (status === 'paused') next.logs = [...j.logs, { ts: new Date().toISOString(), level: 'WARN', message: '任务被手动暂停，当前阶段进度已保留' }]
            if (status === 'canceled') {
              next.logs = [...j.logs, { ts: new Date().toISOString(), level: 'WARN', message: '任务已取消，资源已释放' }]
              next.progress = j.progress
            }
            if (status === 'queued' && reason) {
              next.logs = [...j.logs, { ts: new Date().toISOString(), level: 'WARN', message: `质检退回：${reason}` }]
              next.version = j.version + 1
              next.stages = STAGE_META.map((m) => ({ ...m, progress: 0 }))
              next.progress = 0
              next.metrics = undefined
              next.issueFrames = undefined
            }
            if (status === 'completed') {
              finishJob(next)
            }
            return next
          }),
        })),

      retryJob: (id) =>
        set((s) => ({
          jobs: s.jobs.map((j) => {
            if (j.id !== id) return j
            return {
              ...j,
              status: 'queued',
              progress: 0,
              stages: STAGE_META.map((m) => ({ ...m, progress: 0 })),
              error: undefined,
              startedAt: undefined,
              finishedAt: undefined,
              logs: [
                ...j.logs,
                { ts: new Date().toISOString(), level: 'INFO', message: '任务已重新入队，将重新分配节点' },
              ],
            }
          }),
        })),

      addAsset: (asset) => set((s) => ({ assets: [asset, ...s.assets] })),

      updateAssetTags: (id, tags) =>
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, tags } : a)) })),

      removeAssets: (ids) => set((s) => ({ assets: s.assets.filter((a) => !ids.includes(a.id)) })),

      savePreset: (preset) =>
        set((s) => {
          const exists = s.presets.some((p) => p.id === preset.id)
          const presets = exists ? s.presets.map((p) => (p.id === preset.id ? preset : p)) : [preset, ...s.presets]
          return { presets: preset.isDefault ? presets.map((p) => ({ ...p, isDefault: p.id === preset.id })) : presets }
        }),

      deletePreset: (id) => set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),

      setDefaultPreset: (id) =>
        set((s) => ({ presets: s.presets.map((p) => ({ ...p, isDefault: p.id === id })) })),

      markRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      addReply: (ticketId, content) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: t.status === 'new' ? 'in_progress' : t.status,
                  firstResponseAt: t.firstResponseAt ?? new Date().toISOString(),
                  replies: [
                    ...t.replies,
                    {
                      id: uid('rep'),
                      authorId: s.settings.profile.name === '' ? 'usr_009' : 'usr_009',
                      authorName: '顾清和',
                      isClient: false,
                      content,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : t,
          ),
        })),

      createTicket: (input) => {
        const now = new Date().toISOString()
        const slaHours = { P0: 2, P1: 8, P2: 24, P3: 72 }[input.priority]
        const ticket: Ticket = {
          id: uid('tkt'),
          code: `TK-2610-${String(60 + get().tickets.length).padStart(3, '0')}`,
          title: input.title,
          type: input.type,
          priority: input.priority,
          status: 'new',
          clientId: input.clientId,
          projectId: input.projectId,
          assigneeId: undefined,
          createdAt: now,
          slaDueAt: new Date(Date.now() + slaHours * 3600000).toISOString(),
          slaPaused: false,
          replies: input.description
            ? [
                {
                  id: uid('rep'),
                  authorId: input.clientId,
                  authorName: get().clients.find((c) => c.id === input.clientId)?.contact.name ?? '客户',
                  isClient: true,
                  content: input.description,
                  createdAt: now,
                },
              ]
            : [],
          attachments: [],
        }
        set((s) => ({
          tickets: [ticket, ...s.tickets],
          logs: [
            {
              id: uid('log'),
              ts: now,
              actorId: 'usr_009',
              actorName: '顾清和',
              action: 'ticket.create',
              target: ticket.code,
              ip: '10.24.1.36',
              detail: { priority: ticket.priority, type: ticket.type },
            },
            ...s.logs,
          ],
        }))
        return ticket
      },

      setTicketStatus: (id, status) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id
              ? { ...t, status, resolvedAt: status === 'resolved' || status === 'closed' ? new Date().toISOString() : t.resolvedAt }
              : t,
          ),
        })),
      setNodeStatus: (id, status) =>
        set((s) => ({
          nodes: s.nodes.map((n) => (n.id === id ? { ...n, status, utilization: status === 'busy' ? n.utilization : 0 } : n)),
          logs: [
            {
              id: uid('log'),
              ts: new Date().toISOString(),
              actorId: 'usr_011',
              actorName: '许砚',
              action: 'node.maintenance',
              target: s.nodes.find((n) => n.id === id)?.hostname ?? id,
              ip: '10.24.2.18',
              detail: { status },
            },
            ...s.logs,
          ],
        })),

      createProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),

      setProjectStatus: (id, status) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status,
                  deliveredAt: status === 'delivered' ? new Date().toISOString() : p.deliveredAt,
                  progress: status === 'delivered' ? 100 : p.progress,
                }
              : p,
          ),
        })),

      setOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  paidAt: ['paid', 'in_production', 'delivered', 'completed'].includes(status) ? (o.paidAt ?? new Date().toISOString()) : o.paidAt,
                  deliveredAt: ['delivered', 'completed'].includes(status) ? (o.deliveredAt ?? new Date().toISOString()) : o.deliveredAt,
                }
              : o,
          ),
        })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      addLog: (action, target, detail = {}) =>
        set((s) => ({
          logs: [
            {
              id: uid('log'),
              ts: new Date().toISOString(),
              actorId: 'usr_009',
              actorName: s.settings.profile.name || '顾清和',
              action,
              target,
              ip: '10.24.1.36',
              detail,
            },
            ...s.logs,
          ],
        })),

      resetDemo: () => {
        localStorage.removeItem('spacescape:v1:data')
        localStorage.removeItem('spacescape:v1:app')
        window.location.reload()
      },
    }),
    {
      name: 'spacescape:v1:data',
      storage,
      version: 1,
    },
  ),
)

const RUNNING_SET = ['analyzing', 'depth', 'disparity', 'temporal', 'rendering', 'encoding']

let ticker: number | undefined

export function startJobTicker() {
  if (ticker) return () => undefined
  ticker = window.setInterval(() => {
    const state = useDataStore.getState()
    if (!state.jobs.some((j) => RUNNING_SET.includes(j.status))) return
    const releasedNodes: string[] = []
    const nextJobs = state.jobs.map((job) => {
      if (!RUNNING_SET.includes(job.status)) return job
      const next: Job = { ...job, stages: job.stages.map((st) => ({ ...st })), logs: [...job.logs] }
      const prevProgress = next.progress
      const delta = 0.35 + Math.random() * 0.45
      const { completedStage } = advanceStages(next, delta)
      next.progress = weightedProgress(next.stages)
      if (completedStage) {
        next.logs.push({
          ts: new Date().toISOString(),
          level: 'INFO',
          message: `${completedStage}完成，进入下一阶段`,
        })
      }
      const active = next.stages.find((st) => st.progress < 100)
      if (active) {
        const map: Record<string, JobStatus> = {
          analyze: 'analyzing',
          depth: 'depth',
          disparity: 'disparity',
          temporal: 'temporal',
          render: 'rendering',
          encode: 'encoding',
          qa: 'qa',
        }
        const nextStatus = map[active.key]
        if (nextStatus) next.status = nextStatus
      }
      if (next.stages.every((st) => st.progress >= 100)) {
        finishJob(next)
        if (next.nodeId) releasedNodes.push(next.nodeId)
      } else {
        next.etaSec = Math.max(
          60,
          Math.round(((next.etaSec ?? 3600) * (100 - next.progress)) / Math.max(1, 100 - prevProgress)),
        )
      }
      return next
    })
    useDataStore.setState((s) => ({
      jobs: nextJobs,
      nodes: releasedNodes.length
        ? s.nodes.map((n) =>
            releasedNodes.includes(n.id)
              ? { ...n, status: 'idle' as const, utilization: 6, currentJobId: undefined, throughputFps: 0 }
              : n,
          )
        : s.nodes,
    }))
  }, 900)
  return () => {
    window.clearInterval(ticker)
    ticker = undefined
  }
}
