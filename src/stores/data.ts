import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type {
  AppNotification,
  Asset,
  LogEntry,
  PipelineStep,
  Task,
  TaskOutput,
  Ticket
} from '@/types'
import { loadDb, resetDb, saveDb } from '@/services/storage'
import { models } from '@/mock/models'
import { deriveAfter, deriveBefore, stageOf, type SeedData } from '@/mock/seed'

const STAGE_LOG: Record<string, string[]> = {
  素材解析: ['[解码] 帧索引建立完成，开始解复用', '[解码] 音轨已分离，采样率 48kHz'],
  质量分析: ['[分析] 采样 120 帧，块效应能量 0.68', '[分析] 运动估计完成，抖动指数 2.1'],
  时域去噪: ['[去噪] 光流场计算完成，时域窗口 5 帧', '[去噪] 静止区域融合完毕，PSNR +1.6dB'],
  超分辨率重建: ['[超分] 模型权重加载完成，FP16 推理', '[超分] 已完成 2048 帧，平均 46ms/帧'],
  插帧: ['[插帧] 双向光流估计完成，遮挡占比 2.8%', '[插帧] 检测到场景切换 1 处，已跳过'],
  色彩映射: ['[色彩] 白平衡校正 ΔUV = 0.004', '[色彩] 局部对比度增强已应用'],
  编码封装: ['[编码] 编码器初始化，preset slow', '[编码] 码率控制 CRF 18，双 pass 关闭'],
  校验入库: ['[校验] 逐帧哈希比对通过', '[校验] 质量报告生成中']
}

function nowStamp(): string {
  const d = new Date()
  const p = (n: number, l = 2) => String(n).padStart(l, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`
}

function ymd(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

let seq = 0
function taskId(): string {
  seq = (seq + 1) % 9000
  return `TSK-${ymd()}-${String(Math.floor(1000 + Math.random() * 8999))}`
}

export interface CreateTaskPayload {
  assetIds: string[]
  pipeline: PipelineStep[]
  output: TaskOutput
  templateId: string | null
  priority: 1 | 2 | 3
}

export const useDataStore = defineStore('data', () => {
  const db = ref<SeedData>(loadDb())

  watch(
    db,
    (val) => {
      saveDb(val)
    },
    { deep: true }
  )

  /* ------------------------------ getters ------------------------------ */

  const assets = computed(() => db.value.assets)
  const tasks = computed(() => db.value.tasks)
  const templates = computed(() => db.value.templates)
  const tickets = computed(() => db.value.tickets)
  const team = computed(() => db.value.team)
  const nodes = computed(() => db.value.nodes)
  const notifications = computed(() => db.value.notifications)
  const trend = computed(() => db.value.trend)
  const currentUser = computed(() => db.value.currentUser)
  const collections = computed(() => db.value.collections)

  const runningTasks = computed(() => tasks.value.filter((t) => t.status === 'running'))
  const queuedTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'queued').sort((a, b) => a.priority - b.priority)
  )
  const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'completed'))
  const failedTasks = computed(() => tasks.value.filter((t) => t.status === 'failed'))

  const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

  const stats = computed(() => {
    const monthAgo = Date.now() - 30 * 86400000
    const recent = completedTasks.value.filter((t) => new Date(t.createdAt).getTime() > monthAgo)
    const hours = recent.reduce((s, t) => s + t.elapsedSec / 3600, 0)
    const gains = recent
      .filter((t) => t.qualityAfter)
      .map((t) => (t.qualityAfter as NonNullable<Task['qualityAfter']>).score - t.qualityBefore.score)
    const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : 0
    const storage = assets.value.reduce((s, a) => s + a.size, 0) / 1024 / 1024 / 1024
    const avgVmaf = recent.filter((t) => t.qualityAfter).length
      ? recent.reduce((s, t) => s + (t.qualityAfter?.vmaf ?? 0), 0) /
        recent.filter((t) => t.qualityAfter).length
      : 0
    return {
      hours: Math.round(hours * 10) / 10,
      completed: recent.length,
      avgGain: Math.round(avgGain * 10) / 10,
      storage: Math.round(storage * 100) / 100,
      avgVmaf: Math.round(avgVmaf * 10) / 10,
      totalAssets: assets.value.length
    }
  })

  /* ------------------------------ assets ------------------------------ */

  function assetById(id: string): Asset | undefined {
    return assets.value.find((a) => a.id === id)
  }

  function addAsset(asset: Asset) {
    db.value.assets.unshift(asset)
  }

  function removeAssets(ids: string[]) {
    db.value.assets = db.value.assets.filter((a) => !ids.includes(a.id))
  }

  function updateAsset(id: string, patch: Partial<Asset>) {
    const target = db.value.assets.find((a) => a.id === id)
    if (target) Object.assign(target, patch)
  }

  function toggleTag(id: string, tag: string) {
    const target = db.value.assets.find((a) => a.id === id)
    if (!target) return
    if (target.tags.includes(tag)) target.tags = target.tags.filter((t) => t !== tag)
    else target.tags.push(tag)
  }

  /* ------------------------------- tasks ------------------------------ */

  function taskById(id: string): Task | undefined {
    return tasks.value.find((t) => t.id === id)
  }

  function createTask(payload: CreateTaskPayload): Task[] {
    const created: Task[] = []
    payload.assetIds.forEach((assetId) => {
      const asset = assetById(assetId)
      if (!asset) return
      const estimatedSec = Math.round(asset.duration) * (1.6 + payload.pipeline.length * 1.55)
      const task: Task = {
        id: taskId(),
        assetId: asset.id,
        assetName: asset.name,
        status: 'queued',
        progress: 0,
        stage: '等待调度',
        stageIndex: 0,
        pipeline: payload.pipeline.map((p) => ({ ...p, params: { ...p.params } })),
        output: { ...payload.output },
        qualityBefore: deriveBefore(asset.qualityScore),
        qualityAfter: null,
        createdAt: new Date().toISOString(),
        startedAt: null,
        finishedAt: null,
        durationSec: asset.duration,
        elapsedSec: 0,
        estimatedSec,
        gpu: 'NVIDIA A10 24GB',
        vramUsed: Math.round((8 + payload.pipeline.length * 2.4) * 10) / 10,
        priority: payload.priority,
        templateId: payload.templateId,
        logs: [
          { time: nowStamp(), level: 'INFO', message: `[队列] 任务已创建，进入调度队列，优先级 P${payload.priority}` }
        ],
        createdBy: db.value.currentUser.name,
        gpuTrace: []
      }
      db.value.tasks.unshift(task)
      created.push(task)
    })

    // 有新任务时，若运行中不足 3 个，立即调度
    promoteQueued()
    return created
  }

  function promoteQueued() {
    const running = db.value.tasks.filter((t) => t.status === 'running').length
    if (running >= 3) return
    const queued = db.value.tasks
      .filter((t) => t.status === 'queued')
      .sort((a, b) => a.priority - b.priority || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    queued.slice(0, 3 - running).forEach((t) => {
      t.status = 'running'
      t.startedAt = new Date().toISOString()
      t.stage = '素材解析'
      t.stageIndex = 0
      t.logs.push({ time: nowStamp(), level: 'INFO', message: '[调度] 已分配到 NVIDIA A10 24GB 节点，开始处理' })
    })
  }

  function pauseTask(id: string) {
    const t = taskById(id)
    if (t && t.status === 'running') {
      t.status = 'paused'
      t.logs.push({ time: nowStamp(), level: 'WARN', message: '[用户] 任务已手动暂停，显存占用保留' })
    }
  }

  function resumeTask(id: string) {
    const t = taskById(id)
    if (t && t.status === 'paused') {
      t.status = 'running'
      t.logs.push({ time: nowStamp(), level: 'INFO', message: '[用户] 任务已恢复，从断点继续' })
    }
  }

  function cancelTask(id: string) {
    const t = taskById(id)
    if (t && (t.status === 'running' || t.status === 'paused' || t.status === 'queued')) {
      t.status = 'canceled'
      t.finishedAt = new Date().toISOString()
      t.logs.push({ time: nowStamp(), level: 'WARN', message: '[用户] 任务已取消，中间产物将被清理' })
      promoteQueued()
    }
  }

  function retryTask(id: string) {
    const t = taskById(id)
    if (!t) return
    t.status = 'queued'
    t.progress = 0
    t.stage = '等待调度'
    t.stageIndex = 0
    t.elapsedSec = 0
    t.errorCode = undefined
    t.errorMessage = undefined
    t.qualityAfter = null
    t.logs = [{ time: nowStamp(), level: 'INFO', message: '[重试] 任务已重新入队，参数保持不变' }]
    promoteQueued()
  }

  function deleteTask(id: string) {
    db.value.tasks = db.value.tasks.filter((t) => t.id !== id)
  }

  function setPriority(id: string, p: 1 | 2 | 3) {
    const t = taskById(id)
    if (t) t.priority = p
  }

  function tick() {
    let changed = false
    db.value.tasks.forEach((t) => {
      if (t.status !== 'running') return
      changed = true
      const inc = 0.8 + Math.random() * 1.4
      t.progress = Math.min(100, Math.round((t.progress + inc) * 10) / 10)
      t.elapsedSec = Math.round((t.estimatedSec * t.progress) / 100)

      const next = stageOf(t.progress)
      if (next.index !== t.stageIndex) {
        t.stageIndex = next.index
        t.stage = next.name
        const pool = STAGE_LOG[next.name] ?? []
        if (pool.length) {
          t.logs.push({
            time: nowStamp(),
            level: 'INFO',
            message: pool[Math.floor(Math.random() * pool.length)]
          })
        }
      }

      t.gpuTrace.push(Math.round(58 + Math.sin(t.progress / 6) * 14 + Math.random() * 8))
      if (t.gpuTrace.length > 48) t.gpuTrace.shift()

      if (t.progress >= 100) {
        t.progress = 100
        t.status = 'completed'
        t.stage = '已完成'
        t.stageIndex = 7
        t.finishedAt = new Date().toISOString()
        t.qualityAfter = deriveAfter(t.qualityBefore, t.pipeline, 0.86 + Math.random() * 0.28)
        t.logs.push({ time: nowStamp(), level: 'INFO', message: '[完成] 成片校验通过，质量报告已生成' })
        db.value.notifications.unshift({
          id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'task',
          title: '任务已完成',
          content: `${t.assetName} 增强完成，综合质量分 ${t.qualityAfter.score}。`,
          time: new Date().toISOString(),
          read: false,
          link: '/tasks/list'
        })
        promoteQueued()
      }
    })
    if (changed) db.value.tasks = [...db.value.tasks]
  }

  function addTemplate(payload: {
    name: string
    description: string
    pipeline: PipelineStep[]
    avgGain: number
  }) {
    db.value.templates.unshift({
      id: `tpl-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      tags: ['自定义'],
      pipeline: payload.pipeline.map((p) => ({ ...p, params: { ...p.params } })),
      avgGain: payload.avgGain,
      usageCount: 0,
      author: '我的',
      cover: ['#1e2436', '#0e1219']
    })
  }

  /* ------------------------------ tickets ----------------------------- */
  function createTicket(payload: {
    title: string
    type: Ticket['type']
    priority: Ticket['priority']
    content: string
    relatedTaskId?: string
    contact?: string
  }): Ticket {
    const id = `TK-${ymd()}-${String(Math.floor(1000 + Math.random() * 8999))}`
    const ticket: Ticket = {
      id,
      title: payload.title,
      type: payload.type,
      priority: payload.priority,
      status: '待受理',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedTaskId: payload.relatedTaskId,
      messages: [
        {
          id: `m-${Date.now()}`,
          from: 'user',
          name: db.value.currentUser.name,
          role: db.value.currentUser.role,
          content: payload.content,
          time: new Date().toISOString()
        }
      ]
    }
    db.value.tickets.unshift(ticket)
    db.value.notifications.unshift({
      id: `n-${Date.now()}`,
      type: 'ticket',
      title: '工单已提交',
      content: `${id} 已受理，工程师将在 30 分钟内响应。`,
      time: new Date().toISOString(),
      read: false,
      link: '/service/tickets'
    })
    return ticket
  }

  function replyTicket(id: string, content: string) {
    const t = tickets.value.find((x) => x.id === id)
    if (!t || !content.trim()) return
    t.messages.push({
      id: `m-${Date.now()}`,
      from: 'user',
      name: db.value.currentUser.name,
      role: db.value.currentUser.role,
      content: content.trim(),
      time: new Date().toISOString()
    })
    t.updatedAt = new Date().toISOString()
    if (t.status === '待受理') t.status = '处理中'
  }

  /* --------------------------- notifications -------------------------- */

  function markRead(id: string) {
    const n = notifications.value.find((x) => x.id === id)
    if (n) n.read = true
  }

  function markAllRead() {
    db.value.notifications.forEach((n) => (n.read = true))
  }

  function pushNotification(n: Omit<AppNotification, 'id' | 'time' | 'read'>) {
    db.value.notifications.unshift({
      ...n,
      id: `n-${Date.now()}`,
      time: new Date().toISOString(),
      read: false
    })
  }

  /* ------------------------------- misc ------------------------------- */

  const MODEL_KEY = 'vidclear.models'

  function initialModelState(): Record<string, boolean> {
    const out: Record<string, boolean> = {}
    models.forEach((m) => {
      out[m.id] = m.enabled
    })
    try {
      const raw = localStorage.getItem(MODEL_KEY)
      if (raw) Object.assign(out, JSON.parse(raw) as Record<string, boolean>)
    } catch {
      /* ignore */
    }
    return out
  }

  const modelEnabled = ref<Record<string, boolean>>(initialModelState())

  function toggleModel(modelId: string) {
    modelEnabled.value[modelId] = !modelEnabled.value[modelId]
    localStorage.setItem(MODEL_KEY, JSON.stringify(modelEnabled.value))
  }

  function resetDemo(): void {
    db.value = resetDb()
    Object.keys(modelEnabled.value).forEach((k) => delete modelEnabled.value[k])
    Object.assign(modelEnabled.value, initialModelState())
  }

  return {
    db,
    models,
    modelEnabled,
    assets,
    tasks,
    templates,
    tickets,
    team,
    nodes,
    notifications,
    trend,
    currentUser,
    collections,
    runningTasks,
    queuedTasks,
    completedTasks,
    failedTasks,
    unreadCount,
    stats,
    assetById,
    addAsset,
    removeAssets,
    updateAsset,
    toggleTag,
    taskById,
    createTask,
    addTemplate,
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    deleteTask,
    setPriority,
    tick,
    promoteQueued,
    createTicket,
    replyTicket,
    markRead,
    markAllRead,
    pushNotification,
    toggleModel,
    resetDemo
  }
})
