export type ID = string

export type ClientLevel = 'strategic' | 'key' | 'normal'
export type Industry = '纪录片' | '广告' | '展陈' | '文旅' | '教育' | '演出' | '其他'

export interface Contact {
  name: string
  title: string
  phone: string
  email: string
}

export interface Client {
  id: ID
  name: string
  shortName: string
  industry: Industry
  level: ClientLevel
  contact: Contact
  address: string
  taxNo: string
  paymentTermDays: number
  since: string
  stats: { projects: number; deliveredMinutes: number; totalSpendCNY: number; openTickets: number }
  tags: string[]
  note?: string
}

export type Motif = 'mountain' | 'city' | 'portrait' | 'museum' | 'stage' | 'sea'
export type AssetStatus = 'ready' | 'uploading' | 'analyzing' | 'error'

export interface Asset {
  id: ID
  name: string
  projectId?: ID
  clientId?: ID
  thumb: { from: string; to: string; motif: Motif }
  durationSec: number
  width: number
  height: number
  fps: number
  codec: 'ProRes 422 HQ' | 'ProRes 4444' | 'H.264' | 'H.265' | 'DNxHR HQX' | 'Blackmagic RAW'
  bitrateMbps: number
  sizeGB: number
  audio: { channels: number; sampleRate: number; layout: string }
  colorSpace: 'Rec.709' | 'Rec.2020' | 'P3'
  hdr: 'SDR' | 'HDR10' | 'Dolby Vision'
  scenes: number
  hasFace: boolean
  status: AssetStatus
  tags: string[]
  createdAt: string
}

export type OutputFormat = 'MV-HEVC' | 'SBS-Full' | 'SBS-Half' | 'OU' | 'Anaglyph'

export interface OutputSpec {
  format: OutputFormat
  resolution: 'source' | '3840x2160' | '7680x4320'
  fps: 'source' | 24 | 30 | 60
  bitrate: 'auto' | number
  colorSpace: 'Rec.709' | 'Rec.2020' | 'P3'
  hdr: 'SDR' | 'HDR10'
  audio: 'passthrough' | 'spatial'
  container: 'mov' | 'mp4'
}

export interface ConvertParams {
  depthModel: 'SpaceScape-Depth V3' | 'SpaceScape-Depth V2 Lite' | 'MiDaS-Outdoor' | 'DepthPro-Studio'
  disparity: number
  convergence: number
  temporalSmooth: number
  edgePreserve: number
  depthDetail: number
  faceProtect: boolean
  deflicker: boolean
}

export interface Preset {
  id: ID
  name: string
  scene: string
  desc: string
  params: ConvertParams
  isDefault: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

export type JobStatus =
  | 'draft'
  | 'queued'
  | 'analyzing'
  | 'depth'
  | 'disparity'
  | 'temporal'
  | 'rendering'
  | 'encoding'
  | 'qa'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'canceled'

export type StageKey = 'analyze' | 'depth' | 'disparity' | 'temporal' | 'render' | 'encode' | 'qa'

export interface JobStage {
  key: StageKey
  label: string
  weight: number
  progress: number
  startedAt?: string
  finishedAt?: string
}

export interface QaMetrics {
  comfortScore: number
  temporalJitter: number
  edgeArtifactRate: number
  maxPositiveDisparity: number
  maxNegativeDisparity: number
  windowViolationFrames: number
  depthConfidence: number
}

export interface JobLog {
  ts: string
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
}

export interface IssueFrame {
  timecode: string
  type: string
  severity: 'low' | 'medium' | 'high'
  confidence: number
}

export interface Job {
  id: ID
  code: string
  name: string
  assetId: ID
  projectId?: ID
  clientId: ID
  presetId?: ID
  output: OutputSpec
  params: ConvertParams
  status: JobStatus
  progress: number
  stages: JobStage[]
  priority: 'standard' | 'rush'
  nodeId?: ID
  operatorId: ID
  createdAt: string
  startedAt?: string
  finishedAt?: string
  etaSec?: number
  costCNY: number
  billedMinutes: number
  version: number
  metrics?: QaMetrics
  issueFrames?: IssueFrame[]
  error?: { code: string; message: string; hint: string }
  logs: JobLog[]
  note?: string
}

export type ProjectStatus = 'draft' | 'active' | 'pending_acceptance' | 'delivered' | 'archived' | 'on_hold'

export interface Milestone {
  name: string
  date: string
  done: boolean
}

export interface Deliverable {
  id: ID
  name: string
  format: OutputFormat
  minutes: number
  version: string
  accepted: boolean
  createdAt: string
}

export interface Project {
  id: ID
  code: string
  name: string
  clientId: ID
  type: '纪录片' | '广告' | '展陈' | '文旅' | '教育' | '演出'
  status: ProjectStatus
  ownerId: ID
  startDate: string
  dueDate: string
  deliveredAt?: string
  assetCount: number
  totalMinutes: number
  progress: number
  budgetCNY: number
  spentCNY: number
  description: string
  milestones: Milestone[]
  deliverables: Deliverable[]
}

export type OrderStatus = 'pending_confirm' | 'paid' | 'in_production' | 'delivered' | 'completed' | 'canceled'

export interface OrderItem {
  service: string
  minutes: number
  unitPriceCNY: number
  amountCNY: number
}

export interface Order {
  id: ID
  code: string
  projectId: ID
  clientId: ID
  items: OrderItem[]
  rush: boolean
  rushRate: number
  discountCNY: number
  taxRate: number
  subtotalCNY: number
  totalCNY: number
  status: OrderStatus
  createdAt: string
  paidAt?: string
  deliveredAt?: string
  invoice: { status: 'none' | 'requested' | 'issued'; no?: string; title?: string; taxNo?: string; issuedAt?: string }
  ownerId: ID
}

export type TicketPriority = 'P0' | 'P1' | 'P2' | 'P3'
export type TicketStatus = 'new' | 'accepted' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed' | 'reopened'
export type TicketType = '技术咨询' | '转换故障' | '精修需求' | '交付支持' | '账号与权限'

export interface TicketReply {
  id: ID
  authorId: ID
  authorName: string
  isClient: boolean
  content: string
  createdAt: string
  attachments?: string[]
}

export interface Ticket {
  id: ID
  code: string
  title: string
  type: TicketType
  priority: TicketPriority
  status: TicketStatus
  clientId: ID
  projectId?: ID
  jobId?: ID
  assigneeId?: ID
  createdAt: string
  slaDueAt: string
  firstResponseAt?: string
  resolvedAt?: string
  slaPaused: boolean
  replies: TicketReply[]
  satisfaction?: { score: number; tags: string[]; comment?: string }
  attachments: string[]
}

export interface Node {
  id: ID
  hostname: string
  gpu: string
  gpuCount: number
  vramGB: number
  status: 'idle' | 'busy' | 'offline' | 'maintenance'
  utilization: number
  temperatureC: number
  vramUsedPct: number
  currentJobId?: ID
  throughputFps: number
  todayFrames: number
  uptimeDays: number
  location: string
  sparkline: number[]
}

export interface TeamMember {
  id: ID
  name: string
  role: '管理员' | '制片' | '操作员' | '只读'
  email: string
  phone: string
  online: boolean
  jobsToday: number
  avatarHue: number
}

export interface AppNotification {
  id: ID
  type: 'job' | 'ticket' | 'project' | 'billing'
  title: string
  body: string
  read: boolean
  createdAt: string
  link?: string
}

export interface AuditLog {
  id: ID
  ts: string
  actorId: ID
  actorName: string
  action: string
  target: string
  ip: string
  detail: Record<string, unknown>
}

export interface ApiKey {
  id: ID
  label: string
  key: string
  createdAt: string
  lastUsedAt?: string
}

export interface AppSettings {
  profile: { name: string; email: string; timezone: string }
  notifications: { jobDone: boolean; jobFailed: boolean; slaBreach: boolean; deliveryDue: boolean }
  defaults: { format: OutputFormat; resolution: OutputSpec['resolution']; bitrate: 'auto' | number; presetId: ID }
  storage: { rootPath: string; cacheGB: number }
  apiKeys: ApiKey[]
}
