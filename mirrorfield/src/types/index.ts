export type RoleId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8'

export interface Role {
  id: RoleId
  name: string
  desc: string
  perms: Record<string, 'rw' | 'r' | 'none'>
}

export interface User {
  id: string
  name: string
  account: string
  phone: string
  dept: string
  roleId: RoleId
  title: string
  status: 'ACTIVE' | 'DISABLED'
  lastLogin: string
}

export interface Org {
  id: string
  name: string
  parentId: string | null
  leader: string
  memberCount: number
}

export type ProjectStage = '采集' | '建模' | '轻量化' | '发布' | '交付' | '已交付'

export interface Project {
  id: string
  name: string
  client: string
  area: string
  stage: ProjectStage
  progress: number
  startDate: string
  endDate: string
  manager: string
  overdue: boolean
}

export type TaskType = 'UAV_OBLIQUE' | 'GROUND_SCAN' | 'SLAM' | 'PANORAMA'
export type TaskStatus = 'PENDING' | 'RUNNING' | 'RETURNING' | 'PROCESSING' | 'DONE' | 'CANCELLED'
export type QualityResult = 'PASS' | 'PENDING' | 'FAIL'

export interface CollectTask {
  id: string
  name: string
  type: TaskType
  area: string
  deviceId: string
  pilot: string
  plannedStart: string
  plannedEnd: string
  actualEnd?: string
  status: TaskStatus
  params: {
    altitude?: number
    gsd?: number
    forwardOverlap?: number
    sideOverlap?: number
    photos?: number
    pointSpacing?: number
  }
  dataSize: string
  quality: QualityResult
  owner: string
  remark: string
}

export interface Dataset {
  id: string
  name: string
  type: '实景模型' | '点云' | 'BIM' | '全景' | '矢量'
  format: string
  size: string
  count: string
  crs: string
  updatedAt: string
  projectId: string
  scope: '项目内' | '部门' | '公开'
}

export type AssetStatus = 'PUBLISHED' | 'OPTIMIZING' | 'DRAFT' | 'ARCHIVED'

export interface Asset {
  id: string
  name: string
  buildingCode: string
  zone: string
  format: 'OSGB' | '3D Tiles' | 'LAS' | 'IFC' | 'glTF'
  lods: number
  triangles: number
  size: string
  status: AssetStatus
  version: string
  precision: string
  updatedAt: string
  optimizeRate: string
}

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'MAINTAIN'

export interface MrDevice {
  id: string
  name: string
  model: 'HoloLens 2' | 'Pico 4 Enterprise' | 'Magic Leap 2' | 'iPad Pro LiDAR'
  sn: string
  firmware: string
  battery: number
  status: DeviceStatus
  sceneId: string
  anchors: number
  lastSync: string
}

export type CalibMethod = 'MARKER' | 'POINTCLOUD' | 'MANUAL'

export interface Calibration {
  id: string
  deviceId: string
  sceneId: string
  method: CalibMethod
  rms: number
  maxError: number
  points: number
  operator: string
  createdAt: string
  pass: boolean
}

export interface MrScene {
  id: string
  name: string
  projectId: string
  nodeCount: number
  duration: number
  version: string
  status: 'DRAFT' | 'PUBLISHED' | 'OFFLINE'
  updatedAt: string
  cover: string
}

export interface Session {
  id: string
  sceneId: string
  host: string
  guests: string[]
  startAt: string
  duration: number
  annotations: number
  recorded: boolean
}

export interface InspectPlan {
  id: string
  name: string
  cycle: '每日' | '每周' | '每月' | '单次'
  pointCount: number
  owner: string
  nextRun: string
  completion: number
  status: 'ACTIVE' | 'PAUSED' | 'FINISHED'
  sceneId: string
  points: { seq: number; name: string; device: string; item: string; standard: string }[]
}

export interface InspectRecord {
  id: string
  planId: string
  executor: string
  startAt: string
  endAt: string
  pointDone: number
  pointTotal: number
  exceptions: number
  photos: number
}

export type DefectStatus = 'NEW' | 'CONFIRMED' | 'PROCESSING' | 'CLOSED'

export interface Defect {
  id: string
  type: '渗漏' | '锈蚀' | '裂缝' | '变形' | '设备异常' | '异物'
  level: 'I' | 'II' | 'III'
  location: string
  source: 'AI_RECOGNITION' | 'MANUAL'
  confidence: number
  status: DefectStatus
  foundAt: string
  foundBy: string
  description: string
}

export type TicketStatus = 'PENDING' | 'ASSIGNED' | 'PROCESSING' | 'VERIFYING' | 'DONE'

export interface TicketEvent {
  at: string
  actor: string
  action: string
  note: string
}

export interface Ticket {
  id: string
  title: string
  priority: '高' | '中' | '低'
  source: '巡检' | '标注' | '客诉' | '服务'
  status: TicketStatus
  assignee: string
  createdAt: string
  sla: string
  location: string
  buildingCode: string
  description: string
  createdBy: string
  events: TicketEvent[]
}

export interface ServiceItem {
  code: string
  name: string
  price: number
  unit: string
  duration: string
  standard: string
  desc: string
  deliverables: string[]
}

export interface OrderMilestone {
  name: string
  date: string
  done: boolean
}

export interface Order {
  id: string
  client: string
  contact: string
  items: { code: string; qty: number; price: number }[]
  amount: number
  signDate: string
  deliveryDate: string
  progress: number
  status: 'SIGNED' | 'RUNNING' | 'DELIVERING' | 'DONE'
  manager: string
  milestones: OrderMilestone[]
  payments: { date: string; amount: number; status: '已回款' | '待回款' }[]
}

export interface Deliverable {
  id: string
  orderId: string
  name: string
  type: string
  format: string
  size: string
  version: string
  accepted: boolean
  uploadedAt: string
}

export interface LogItem {
  id: string
  userId: string
  userName: string
  module: string
  action: string
  target: string
  ip: string
  result: '成功' | '失败'
  createdAt: string
}

export interface NotificationItem {
  id: string
  type: '告警' | '待办' | '系统'
  title: string
  read: boolean
  link: string
  createdAt: string
}

export interface Annotation {
  id: string
  title: string
  type: '问题' | '说明' | '巡检点' | '设备信息'
  desc: string
  pos: [number, number, number]
  buildingCode: string
  color: string
  createdAt: string
  createdBy: string
}

export interface KpiPoint {
  label: string
  value: number
}

export interface SceneNode {
  id: string
  name: string
  type: 'zone' | 'building' | 'component' | 'tank' | 'pipe' | 'crane' | 'road' | 'water'
  parentId: string | null
  bbox: { min: [number, number, number]; max: [number, number, number] }
  meta: Record<string, string | number>
}
