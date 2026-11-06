export type Role = 'operator' | 'engineer' | 'manager' | 'guest'

export interface Space {
  id: string
  name: string
  building: string
  floor: number
  area: number
  capacity: number
  map: { x: number; y: number; w: number; h: number }
  deviceCount: number
  onlineCount: number
}

export type DeviceStatus = 'online' | 'offline' | 'warning' | 'maintenance'
export type DeviceCategory =
  | 'display'
  | 'audio'
  | 'lighting'
  | 'hvac'
  | 'sensor'
  | 'control'
  | 'network'
  | 'power'
export type ControlType = 'switch' | 'range' | 'level' | 'mode' | 'readonly'

export interface DeviceMetric {
  key: string
  label: string
  value: number
  unit: string
  threshold?: { min?: number; max?: number }
  trend?: number[]
}

export interface Device {
  id: string
  name: string
  code: string
  category: DeviceCategory
  type: string
  vendor: string
  model: string
  firmware: string
  spaceId: string
  ip: string
  status: DeviceStatus
  health: number
  controlType: ControlType
  power: boolean
  value?: number
  unit?: string
  mode?: string
  modes?: string[]
  metrics: DeviceMetric[]
  lastReportAt: string
  installedAt: string
  owner: string
  position: { x: number; y: number }
}

export type Operation = 'powerOn' | 'powerOff' | 'setValue' | 'setMode'

export interface SceneAction {
  id: string
  deviceId: string
  deviceName: string
  operation: Operation
  target?: string | number
}

export interface SceneStep {
  id: string
  name: string
  delay: number
  actions: SceneAction[]
}

export interface Scene {
  id: string
  name: string
  description: string
  tags: string[]
  spaceId: string
  enabled: boolean
  steps: SceneStep[]
  deviceCount: number
  usedCount: number
  lastRunAt: string | null
  avgDuration: number
  riskLevel: 'low' | 'medium' | 'high'
  icon: string
}

export type TaskStatus = 'pending' | 'running' | 'done' | 'failed'

export interface TaskLog {
  id: string
  time: string
  action: string
  result: 'ok' | 'fail'
  cost: number
}

export interface Task {
  id: string
  name: string
  description: string
  type: 'scene' | 'inspection' | 'sync' | 'maintenance'
  trigger: 'manual' | 'schedule' | 'rule'
  schedule?: string
  status: TaskStatus
  progress: number
  sceneId?: string
  deviceIds: string[]
  assignee: string
  plannedAt: string
  startedAt?: string
  finishedAt?: string
  duration?: number
  failReason?: string
  logs: TaskLog[]
}

export interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  metric: string
  operator: '>' | '<' | '=' | '>='
  threshold: number
  unit: string
  duration: number
  action: 'startScene' | 'createAlert' | 'createTicket'
  targetId?: string
  targetName?: string
  scope: string
  triggeredCount: number
}

export type AlertLevel = 'P1' | 'P2' | 'P3'
export type AlertStatus = 'open' | 'acknowledged' | 'processing' | 'recovered' | 'closed'

export interface AlertRecord {
  time: string
  action: string
  operator: string
  note?: string
}

export interface Alert {
  id: string
  title: string
  level: AlertLevel
  status: AlertStatus
  deviceId: string
  deviceName: string
  spaceId: string
  metric: string
  currentValue: number
  threshold: number
  unit: string
  triggeredAt: string
  recoveredAt?: string
  duration: number
  assignee?: string
  description: string
  suggestions: string[]
  series: { time: string; value: number }[]
  records: AlertRecord[]
  silenced?: boolean
}

export type TicketStatus = 'pending' | 'assigned' | 'processing' | 'verifying' | 'done' | 'closed'
export type TicketPriority = 'urgent' | 'high' | 'normal' | 'low'

export interface TicketComment {
  id: string
  author: string
  avatarColor: string
  time: string
  content: string
  statusChange?: string
}

export interface Ticket {
  id: string
  title: string
  serviceType: string
  status: TicketStatus
  priority: TicketPriority
  spaceId?: string
  deviceId?: string
  deviceName?: string
  creator: string
  assignee?: string
  createdAt: string
  expectedAt: string
  closedAt?: string
  slaMinutes: number
  slaRemainMinutes: number
  description: string
  comments: TicketComment[]
  rating?: { speed: number; professional: number; effect: number; tags: string[]; comment: string }
}

export interface User {
  id: string
  name: string
  account: string
  role: Role
  email: string
  phone: string
  status: 'active' | 'disabled'
  avatarColor: string
  department: string
  lastLoginAt: string
  createdAt: string
}

export interface ParsedIntent {
  intent: string
  intentLabel: string
  confidence: number
  slots: { key: string; label: string; value: string; source: string }[]
  rule: string
  candidates: { intent: string; label: string; score: number }[]
}

export interface CommandRecord {
  id: string
  sessionId: string
  userId: string
  userName: string
  input: string
  inputMode: 'text' | 'voice' | 'gesture' | 'quick'
  intentLabel: string
  status: 'success' | 'partial' | 'failed'
  affectedDevices: number
  cost: number
  createdAt: string
}

export interface ExecResult {
  status: 'success' | 'partial' | 'failed'
  title: string
  devices: number
  cost: number
  failed?: string[]
  undoable: boolean
  sceneId?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  inputMode?: 'text' | 'voice' | 'quick'
  intent?: ParsedIntent
  exec?: ExecResult
  needConfirm?: { sceneId: string; sceneName: string; devices: number; expireAt: number }
  card?: { type: 'alertSummary' | 'deviceList' | 'stat' | 'ticket'; payload: unknown }
}

export interface AuditLog {
  id: string
  time: string
  operator: string
  action: string
  target: string
  targetType: 'device' | 'scene' | 'task' | 'alert' | 'ticket' | 'user' | 'system'
  result: 'success' | 'fail'
  ip: string
  detail: Record<string, unknown>
}

export interface Article {
  id: string
  title: string
  category: '设备故障' | '操作指引' | '应急预案' | '常见问答'
  tags: string[]
  summary: string
  content: string
  author: string
  updatedAt: string
  views: number
  helpful: number
}

export interface SessionUser {
  id: string
  name: string
  account: string
  role: Role
  avatarColor: string
  department: string
}

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  desc?: string
}

export interface NotificationItem {
  id: string
  type: 'alert' | 'task' | 'ticket' | 'system'
  title: string
  desc: string
  time: string
  read: boolean
  link?: string
}
