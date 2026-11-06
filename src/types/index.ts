export type Severity = 'fatal' | 'severe' | 'moderate' | 'info'
export type Channel = 'video' | 'audio' | 'container' | 'subtitle'
export type Grade = 'A' | 'B' | 'C' | 'D'

export interface Project {
  id: string
  name: string
  client: string
  ownerId: string
  assetCount: number
  createdAt: string
}

export interface MediaAsset {
  id: string
  code: string
  name: string
  fileName: string
  projectId: string
  projectName: string
  kind: 'video' | 'audio' | 'sequence'
  container: string
  videoCodec?: string
  width?: number
  height?: number
  fps?: number
  scan?: 'p' | 'i'
  sar?: string
  audioCodec?: string
  sampleRate?: number
  channels?: number
  bitDepth?: number
  bitrateMbps: number
  durationSec: number
  sizeGB: number
  loudnessLufs?: number
  truePeakDb?: number
  ownerId: string
  uploadedAt: string
  status: 'ready' | 'uploading' | 'analyzing' | 'archived'
  tags: string[]
  version: string
  thumbSeed: number
}

export interface Defect {
  id: string
  taskId: string
  assetId: string
  code: string
  name: string
  channel: Channel
  severity: Severity
  startSec: number
  endSec: number
  confidence: number
  metricLabel: string
  metricValue: number
  threshold: number
  unit: string
  status: 'open' | 'ignored' | 'repaired' | 'residual'
  suggestion: string
  algorithmIds: string[]
  note?: string
}

export type TaskStatus =
  | 'queued'
  | 'probing'
  | 'detecting'
  | 'aggregating'
  | 'done'
  | 'failed'
  | 'canceled'

export interface LogLine {
  t: string
  level: 'info' | 'warn' | 'error'
  msg: string
}

export interface DetectionTask {
  id: string
  code: string
  assetId: string
  assetName: string
  ruleSetId: string
  ruleSetName: string
  status: TaskStatus
  progress: number
  score: number
  grade: Grade
  counts: Record<Severity, number>
  startedAt: string
  finishedAt?: string
  etaSec?: number
  durationSec: number
  operatorId: string
  priority: 'normal' | 'high' | 'urgent'
  nodeId: string
  logs: LogLine[]
}

export interface PlanStep {
  id: string
  algorithmId: string
  algorithmName: string
  targetDefectIds: string[]
  order: number
  enabled: boolean
  params: Record<string, number | string | boolean>
  estMinutes: number
  risk: 'low' | 'mid' | 'high'
}

export interface RepairPlan {
  id: string
  taskId: string
  template: string
  steps: PlanStep[]
  estTotalMinutes: number
  estCost: number
  conflicts: string[]
}

export interface RepairTask {
  id: string
  code: string
  planId: string
  detectionTaskId: string
  assetId: string
  assetName: string
  status: 'draft' | 'pending' | 'running' | 'rechecking' | 'review' | 'passed' | 'rejected' | 'failed'
  progress: number
  version: string
  defectTotal: number
  defectFixed: number
  defectResidual: number
  segments: { index: number; status: 'waiting' | 'running' | 'done' | 'failed'; progress: number }[]
  outputs: { format: string; sizeGB: number; bitrateMbps: number }[]
  nodeId: string
  startedAt: string
  finishedAt?: string
  operatorId: string
  scoreBefore: number
  scoreAfter: number
}

export interface ReviewRecord {
  id: string
  repairTaskId: string
  checklist: { defectId: string; verdict: 'pass' | 'recheck' | 'fail'; note?: string }[]
  metricsBefore: Record<string, number>
  metricsAfter: Record<string, number>
  verdict: 'pending' | 'pass' | 'reject'
  comment?: string
  signedBy?: string
  signedAt?: string
}

export interface QcReport {
  id: string
  no: string
  type: 'qc' | 'repair' | 'acceptance' | 'service'
  taskId: string
  repairTaskId?: string
  title: string
  assetName: string
  projectName: string
  status: 'draft' | 'issued' | 'signed'
  score: number
  grade: Grade
  summary: string
  issuedBy: string
  issuedAt: string
  pages: number
}

export interface ServicePackage {
  id: string
  name: string
  unit: string
  unitPrice: number
  slaHours: number
  scenes: string
  includes: string[]
  excludes: string[]
}

export type OrderStatus =
  | 'submitted'
  | 'quoted'
  | 'signed'
  | 'receiving'
  | 'scheduled'
  | 'processing'
  | 'internal_qc'
  | 'delivered'
  | 'accepted'
  | 'settled'
  | 'canceled'
  | 'rework'

export interface ServiceOrder {
  id: string
  code: string
  customerId: string
  customerName: string
  contact: string
  packageId: string
  packageName: string
  title: string
  status: OrderStatus
  amount: number
  slaHours: number
  slaDeadline: string
  engineerId: string
  createdAt: string
  milestones: { key: string; label: string; at?: string; done: boolean }[]
  assetIds: string[]
  deliverables: { name: string; version: string; sizeGB: number; format: string; at: string }[]
  messages: { id: string; from: 'client' | 'engineer'; text: string; at: string }[]
  quote: {
    lines: { label: string; qty: number; unit: string; price: number }[]
    total: number
    validUntil: string
    status: 'pending' | 'accepted' | 'rejected'
  }
  invoice: { no: string; status: 'none' | 'pending' | 'issued' | 'paid'; amount: number }
  rating?: { stars: number; tags: string[]; comment: string }
}

export interface Rule {
  id: string
  code: string
  name: string
  channel: Channel
  severity: Severity
  threshold: { value: number; unit: string; op: '>' | '<' | '>=' | '<=' | '==' }
  enabled: boolean
  hitCount: number
  description: string
  updatedAt: string
  version: string
}

export interface RuleSet {
  id: string
  name: string
  scene: string
  ruleIds: string[]
  usedCount: number
  desc: string
}

export interface Algorithm {
  id: string
  name: string
  vendor: string
  targets: string[]
  speed: number
  gpu: boolean
  risk: 'low' | 'mid' | 'high'
  version: string
  category: string
  params: {
    key: string
    label: string
    type: 'range' | 'select' | 'switch'
    min?: number
    max?: number
    step?: number
    options?: string[]
    default: number | string | boolean
    unit?: string
  }[]
  description: string
}

export interface ComputeNode {
  id: string
  name: string
  type: 'GPU' | 'CPU'
  status: 'idle' | 'busy' | 'maintenance' | 'offline'
  gpuUtil: number
  memUtil: number
  tempC: number
  currentTaskId?: string
  doneToday: number
  vram: string
}

export interface Member {
  id: string
  name: string
  email: string
  role: 'admin' | 'lead' | 'engineer' | 'qc' | 'client'
  avatarSeed: number
  status: 'active' | 'invited' | 'disabled'
  title: string
}

export interface AppNotification {
  id: string
  type: 'task' | 'review' | 'sla' | 'system'
  title: string
  body: string
  at: string
  read: boolean
  link: string
}

export interface CaseStudy {
  id: string
  title: string
  tags: string[]
  coverSeed: number
  before: Record<string, number>
  after: Record<string, number>
  hours: number
  summary: string
  client: string
  content: { heading: string; body: string }[]
}

export interface AuditLog {
  id: string
  actor: string
  action: string
  target: string
  at: string
  ip: string
}
