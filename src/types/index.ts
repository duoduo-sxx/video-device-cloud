/**
 * 全局类型定义
 * 说明：所有实体字段与《功能清单与开发规范》第 3.7 节保持一致
 */

/* ============ 通用 ============ */

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface PageQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  keyword?: string
  [key: string]: any
}

export interface Option<T = string> {
  label: string
  value: T
}

export type StatusColor = 'success' | 'info' | 'warning' | 'danger' | 'primary'

/* ============ 租户 / 权限 ============ */

export type TenantStatus = 'normal' | 'arrears' | 'suspended' | 'expired'

export interface Tenant {
  id: string
  name: string
  code: string
  industry: string
  contact: string
  phone: string
  email: string
  province: string
  city: string
  planName: '基础版' | '专业版' | '旗舰版'
  deviceQuota: number
  deviceUsed: number
  storageQuotaTB: number
  storageUsedTB: number
  aiChannelQuota: number
  aiChannelUsed: number
  balance: number
  status: TenantStatus
  expireDate: string
  createTime: string
}

export interface Role {
  id: string
  name: string
  code: string
  description: string
  menuPermissions: string[]
  buttonPermissions: string[]
  dataScope: 'self' | 'dept' | 'deptAndChild' | 'tenant' | 'all'
  userCount: number
  status: 0 | 1
  createTime: string
}

export interface User {
  id: string
  username: string
  nickname: string
  avatar: string
  phone: string
  email: string
  roleIds: string[]
  roleNames: string[]
  deptId: string
  deptName: string
  tenantId: string
  tenantName: string
  status: 0 | 1
  lastLoginTime: string
  lastLoginIp: string
  createTime: string
}

export interface Dept {
  id: string
  name: string
  parentId: string | null
  leader: string
  phone: string
  sort: number
  tenantId: string
  children?: Dept[]
}

export interface OperationLog {
  id: string
  operator: string
  operatorId: string
  ip: string
  module: string
  action: string
  target: string
  method: string
  url: string
  params: string
  result: 'success' | 'fail'
  duration: number
  createTime: string
}

/* ============ 设备 ============ */

export type OnlineStatus = 'online' | 'offline' | 'unknown' | 'pending'

export interface Device {
  id: string
  sn: string
  name: string
  vendor: string
  model: string
  category: string
  protocol: string
  ip: string
  port: number
  mac: string
  firmware: string
  hardwareVersion: string
  tenantId: string
  tenantName: string
  groupId: string
  groupPath: string
  channelCount: number
  onlineStatus: OnlineStatus
  lastHeartbeat: string
  resolution: string
  codec: string
  bitrateKbps: number
  frameRate: number
  healthScore: number
  installAddress: string
  province: string
  city: string
  district: string
  longitude: number
  latitude: number
  installDate: string
  warrantyEndDate: string
  storagePoolId: string
  storagePoolName: string
  aiTaskCount: number
  alarmsLast7d: number
  tags: string[]
  remark: string
  createTime: string
}

export interface Channel {
  id: string
  deviceId: string
  deviceName: string
  channelNo: number
  name: string
  onlineStatus: OnlineStatus
  resolution: string
  codec: string
  bitrateKbps: number
  streamTypes: string[]
  aiTaskIds: string[]
  createTime: string
}

export interface DeviceGroup {
  id: string
  name: string
  parentId: string | null
  deviceCount: number
  children?: DeviceGroup[]
}

export interface Firmware {
  id: string
  version: string
  vendor: string
  category: string
  fileSize: number
  releaseDate: string
  changelog: string
  md5: string
  downloadCount: number
}

export interface OtaTask {
  id: string
  name: string
  firmwareId: string
  firmwareVersion: string
  deviceCount: number
  successCount: number
  failCount: number
  runningCount: number
  status: 'running' | 'completed' | 'failed' | 'paused' | 'pending'
  mode: 'immediate' | 'scheduled'
  startTime: string
  creator: string
  failReasons: { reason: string; count: number }[]
}

export interface DeviceLog {
  id: string
  deviceId: string
  level: 'INFO' | 'WARN' | 'ERROR'
  content: string
  createTime: string
}

/* ============ 云存储 ============ */

export interface StoragePool {
  id: string
  name: string
  type: 'standard' | 'ia' | 'archive'
  region: string
  nodeId: string
  nodeName: string
  capacityTB: number
  usedTB: number
  usageRate: number
  channelCount: number
  retentionDays: number
  lifecycleRule: { daysToIA: number; daysToArchive: number; daysToDelete: number }
  status: 'normal' | 'warning' | 'full' | 'offline'
  createTime: string
}

export interface RecordPlan {
  id: string
  name: string
  template: 'continuous' | 'workday' | 'night' | 'motion' | 'custom'
  timeSlots: { day: number; start: string; end: string }[]
  streamType: 'main' | 'sub' | 'third'
  channelIds: string[]
  channelCount: number
  storagePoolId: string
  storagePoolName: string
  retentionDays: number
  status: 0 | 1
  creater: string
  createTime: string
}

export interface Recording {
  id: string
  deviceId: string
  deviceName: string
  channelNo: number
  type: 'schedule' | 'event' | 'ai'
  storageType: 'hot' | 'ia' | 'archive'
  startTime: string
  endTime: string
  duration: number
  fileSize: number
  resolution: string
  streamUrl: string
  snapshotUrl: string
}

export interface ArchiveTask {
  id: string
  name: string
  type: 'archive' | 'restore'
  recordCount: number
  fileSize: number
  progress: number
  status: 'running' | 'completed' | 'failed' | 'pending'
  fromStorage: string
  toStorage: string
  createTime: string
  creator: string
}

/* ============ 视频 / 流媒体 ============ */

export interface TranscodeTemplate {
  id: string
  name: string
  resolution: string
  bitrateKbps: number
  frameRate: number
  codec: string
  gop: number
  audio: string
  isDefault: boolean
  usageCount: number
  createTime: string
}

export interface QualityCheckTask {
  id: string
  name: string
  deviceId: string
  deviceName: string
  channelNo: number
  items: string[]
  score: number
  problems: string[]
  status: 'running' | 'completed' | 'failed' | 'pending'
  snapshotUrl: string
  createTime: string
}

export interface LiveChannel {
  id: string
  name: string
  deviceId: string
  deviceName: string
  channelNo: number
  visibility: 'public' | 'private'
  password: string
  shareToken: string
  expiresAt: string
  viewCount: number
  status: 0 | 1
  createTime: string
}

/* ============ AI ============ */

export interface Algorithm {
  id: string
  name: string
  code: string
  vendor: string
  version: string
  type: string
  accuracy: number
  detectCost: number
  maxResolution: string
  gpuCost: number
  price: number
  hot: boolean
  status: 0 | 1
  description: string
  scenes: string[]
  updateTime: string
}

export interface AiTask {
  id: string
  name: string
  algorithmId: string
  algorithmName: string
  channelIds: string[]
  channelCount: number
  schedule: { startTime: string; endTime: string; days: number[] }
  roi: { x: number; y: number; w: number; h: number }[]
  threshold: number
  alarmLevel: AlarmLevel
  status: 'running' | 'stopped' | 'abnormal'
  gpuUsage: number
  eventsToday: number
  accuracy: number
  createTime: string
}

/* ============ 告警 / 事件 ============ */

export type AlarmLevel = 'urgent' | 'major' | 'minor' | 'info'
export type AlarmStatus = 'pending' | 'processing' | 'resolved' | 'closed' | 'false_alarm'
export type AlarmCategory = 'device' | 'ai' | 'storage' | 'network'

export interface Alarm {
  id: string
  alarmNo: string
  title: string
  type: string
  category: AlarmCategory
  level: AlarmLevel
  deviceId: string
  deviceName: string
  channelNo: number
  tenantId: string
  tenantName: string
  region: string
  description: string
  snapshotUrl: string
  confidence: number
  algorithmName: string
  occurTime: string
  recoverTime: string | null
  duration: number
  status: AlarmStatus
  handler: string
  handleTime: string | null
  handleRemark: string
  relatedWorkOrderId: string | null
}

export interface AlarmRule {
  id: string
  name: string
  alarmTypes: string[]
  levels: AlarmLevel[]
  convergeWindow: number
  silentPeriod: number
  channels: string[]
  notifyChannels: string[]
  receivers: string[]
  status: 0 | 1
  createTime: string
}

/* ============ 工单 / 技术服务 ============ */

export type WorkOrderStatus = 'pending' | 'assigned' | 'processing' | 'verifying' | 'completed' | 'closed'
export type SlaStatus = 'normal' | 'warning' | 'overdue'

export interface WorkOrderLog {
  time: string
  operator: string
  action: string
  remark: string
}

export interface WorkOrder {
  id: string
  orderNo: string
  title: string
  type: string
  priority: AlarmLevel
  source: 'alarm' | 'customer' | 'plan'
  customerId: string
  customerName: string
  deviceId: string
  deviceName: string
  alarmId: string | null
  description: string
  attachments: string[]
  status: WorkOrderStatus
  creator: string
  createTime: string
  assignee: string
  assigneePhone: string
  assignTime: string | null
  arriveTime: string | null
  finishTime: string | null
  slaDeadline: string
  slaStatus: SlaStatus
  handlerLogs: WorkOrderLog[]
  partsUsed: { partId: string; partName: string; quantity: number; price: number }[]
  cost: number
  satisfaction: number
  satisfactionRemark: string
  visitResult: 'satisfied' | 'normal' | 'unsatisfied' | ''
}

export interface ServiceItem {
  id: string
  name: string
  description: string
  workHours: number
  price: number
  slaResponseHours: number
  target: string
  status: 0 | 1
}

export interface SparePart {
  id: string
  name: string
  model: string
  category: string
  stock: number
  warningStock: number
  unit: string
  price: number
  location: string
  supplier: string
  status: 'normal' | 'low' | 'out'
  inOutRecords: { type: 'in' | 'out'; quantity: number; operator: string; time: string; workOrderNo: string }[]
}

export interface KnowledgeArticle {
  id: string
  title: string
  category: string
  tags: string[]
  author: string
  views: number
  likes: number
  content: string
  publishTime: string
  status: 0 | 1
}

export interface Engineer {
  id: string
  name: string
  phone: string
  skills: string[]
  region: string
  level: '初级' | '中级' | '高级' | '专家'
  currentLoad: number
  maxLoad: number
  satisfaction: number
  finishedOrders: number
  onTimeRate: number
  status: 'idle' | 'busy' | 'off'
}

/* ============ 开放平台 ============ */

export interface OpenApp {
  id: string
  appName: string
  appKey: string
  appSecret: string
  owner: string
  tenantId: string
  tenantName: string
  ipWhitelist: string[]
  qpsLimit: number
  status: 0 | 1
  callCount7d: number
  callCount30d: number
  successRate: number
  createTime: string
}

export interface ApiEndpoint {
  id: string
  group: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  auth: boolean
  params: { name: string; type: string; required: boolean; description: string }[]
  responseExample: string
}

export interface ApiCallLog {
  id: string
  appId: string
  appName: string
  endpoint: string
  method: string
  path: string
  statusCode: number
  duration: number
  ip: string
  createTime: string
}

export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  secret: string
  retryPolicy: string
  status: 0 | 1
  createTime: string
  pushRecords: { id: string; event: string; time: string; httpStatus: number; duration: number; retryCount: number; result: 'success' | 'fail' }[]
}

export interface ExportTask {
  id: string
  name: string
  dataType: string
  conditions: string
  rowCount: number
  fileSize: number
  progress: number
  status: 'running' | 'completed' | 'failed' | 'pending'
  creator: string
  createTime: string
}

/* ============ 运维监控 ============ */

export interface ClusterNode {
  id: string
  name: string
  type: 'center' | 'edge'
  region: string
  ip: string
  cpuUsage: number
  memUsage: number
  diskUsage: number
  gpuUsage: number
  bandwidthMbps: number
  runningTasks: number
  deviceCount: number
  status: 'online' | 'warning' | 'offline'
  uptime: number
  version: string
  lastReportTime: string
}

export interface MicroService {
  id: string
  name: string
  code: string
  replicas: number
  healthyReplicas: number
  qps: number
  avgLatency: number
  errorRate: number
  status: 'healthy' | 'degraded' | 'fused' | 'down'
  dependsOn: string[]
  version: string
}

export interface LogEntry {
  id: string
  traceId: string
  service: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  content: string
  ip: string
  duration: number
  createTime: string
}

export interface PatrolTask {
  id: string
  name: string
  scope: string
  items: string[]
  deviceCount: number
  normalCount: number
  abnormalCount: number
  skippedCount: number
  progress: number
  status: 'running' | 'completed' | 'failed' | 'pending'
  executor: string
  createTime: string
  finishTime: string | null
}

/* ============ 计费 ============ */

export interface BillingItem {
  id: string
  code: string
  name: string
  unit: string
  unitPrice: number
  billingCycle: string
  description: string
  status: 0 | 1
  effectiveDate: string
}

export interface BillItemDetail {
  billingCode: string
  billingName: string
  unit: string
  unitPrice: number
  quantity: number
  amount: number
}

export interface Bill {
  id: string
  billNo: string
  tenantId: string
  tenantName: string
  period: string
  items: BillItemDetail[]
  totalAmount: number
  status: 'pending' | 'paid' | 'overdue' | 'void'
  dueDate: string
  payTime: string | null
  payMethod: string
  createTime: string
}

export interface RechargeRecord {
  id: string
  tenantId: string
  tenantName: string
  amount: number
  balanceAfter: number
  method: string
  tradeNo: string
  status: 'success' | 'pending' | 'fail'
  createTime: string
  operator: string
}

export interface Invoice {
  id: string
  invoiceNo: string
  tenantId: string
  tenantName: string
  titleType: 'company' | 'personal'
  title: string
  taxNo: string
  amount: number
  type: 'normal' | 'special'
  status: 'pending' | 'issued' | 'rejected'
  applyTime: string
  issueTime: string | null
}

/* ============ 系统 ============ */

export interface DictItem {
  label: string
  value: string
  color?: string
  sort: number
  status: 0 | 1
}

export interface DictType {
  id: string
  name: string
  code: string
  remark: string
  items: DictItem[]
}

export interface MessageItem {
  id: string
  type: 'alarm' | 'workorder' | 'system'
  title: string
  content: string
  read: boolean
  level: AlarmLevel | 'info'
  link: string
  createTime: string
}

export interface AppUserInfo {
  id: string
  username: string
  nickname: string
  avatar: string
  tenantId: string
  tenantName: string
  roleCode: string
  roleName: string
  permissions: string[]
  token: string
}
