export type TaskStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'canceled'

export type CapabilityId =
  | 'superResolution'
  | 'denoise'
  | 'artifactRemoval'
  | 'deblur'
  | 'frameInterpolation'
  | 'stabilization'
  | 'colorEnhance'
  | 'faceRestore'
  | 'plateEnhance'
  | 'filmRestore'

export interface QualityMetrics {
  psnr: number
  ssim: number
  vmaf: number
  niqe: number
  score: number
}

export interface Asset {
  id: string
  name: string
  duration: number
  size: number
  width: number
  height: number
  fps: number
  bitrate: number
  codec: string
  profile: string
  bitDepth: number
  chroma: string
  colorSpace: string
  hdr: string | null
  container: string
  audio: { codec: string; channels: number; sampleRate: number } | null
  tags: string[]
  collectionId: string | null
  status: 'ready' | 'uploading' | 'analyzing' | 'error'
  qualityScore: number
  diagnosis: {
    sharpness: number
    noise: number
    artifact: number
    shake: number
    exposure: number
    summary: string
  }
  uploadedBy: string
  uploadedAt: string
  md5: string
  thumbnailColor: [string, string]
}

export interface PipelineStep {
  capabilityId: CapabilityId
  enabled: boolean
  params: Record<string, number | string | boolean>
}

export interface TaskOutput {
  width: number
  height: number
  codec: string
  bitrateMode: 'CBR' | 'VBR' | 'CRF'
  bitrate: number
  crf: number
  container: string
  fps: number
  colorSpace: string
  audioMode: 'copy' | 'aac192' | 'none'
  namingRule: string
}

export interface LogEntry {
  time: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  message: string
}

export interface Task {
  id: string
  assetId: string
  assetName: string
  status: TaskStatus
  progress: number
  stage: string
  stageIndex: number
  pipeline: PipelineStep[]
  output: TaskOutput
  qualityBefore: QualityMetrics
  qualityAfter: QualityMetrics | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  durationSec: number
  elapsedSec: number
  estimatedSec: number
  gpu: string
  vramUsed: number
  priority: 1 | 2 | 3
  templateId: string | null
  errorCode?: string
  errorMessage?: string
  logs: LogEntry[]
  createdBy: string
  gpuTrace: number[]
}

export interface ParamSchema {
  key: string
  label: string
  type: 'slider' | 'select' | 'switch' | 'segmented'
  min?: number
  max?: number
  step?: number
  unit?: string
  options?: { label: string; value: string | number }[]
  default: number | string | boolean
  tip: string
}

export interface Capability {
  id: CapabilityId
  name: string
  shortName: string
  icon: string
  category: '画质修复' | '分辨率提升' | '时间维度' | '专项增强'
  description: string
  principle: string
  scenarios: string[]
  modelCount: number
  monthlyCalls: number
  params: ParamSchema[]
  notice: string[]
}

export interface ModelItem {
  id: string
  name: string
  version: string
  type: string
  scenes: string[]
  vram: number
  latencyMs: number
  rating: number
  enabled: boolean
  precision: 'FP16' | 'INT8'
}

export interface Template {
  id: string
  name: string
  description: string
  tags: string[]
  pipeline: PipelineStep[]
  avgGain: number
  usageCount: number
  author: '官方' | '我的'
  cover: [string, string]
}

export interface TicketMessage {
  id: string
  from: 'user' | 'engineer'
  name: string
  role: string
  content: string
  time: string
  attachments?: { name: string; size: number }[]
}

export interface Ticket {
  id: string
  title: string
  type: '画质异常' | '任务失败' | '性能问题' | '账号权限' | '其他'
  priority: '低' | '中' | '高' | '紧急'
  status: '待受理' | '处理中' | '待确认' | '已解决' | '已关闭'
  createdAt: string
  updatedAt: string
  relatedTaskId?: string
  messages: TicketMessage[]
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  dept: string
  status: '在线' | '离线' | '停用'
  lastActive: string
}

export interface KbArticle {
  id: string
  category: string
  title: string
  summary: string
  content: string
  views: number
  updatedAt: string
  categoryOrder?: number
}

export interface ServiceNode {
  name: string
  type: string
  region: string
  latencyMs: number
  load: number
  status: '正常' | '告警' | '维护'
  uptime30d: number
}

export interface AppNotification {
  id: string
  type: 'task' | 'ticket' | 'system'
  title: string
  content: string
  time: string
  read: boolean
  link?: string
}

export interface TimerangePoint {
  date: string
  hours: number
  vmaf: number
  tasks: number
}
