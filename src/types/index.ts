export type RoleCode = 'admin' | 'service_manager' | 'engineer' | 'service_desk' | 'customer_admin' | 'viewer'

export interface Role {
  code: RoleCode
  name: string
  desc: string
  scope: 'all' | 'customer' | 'self'
  permissions: string[]
}

export interface User {
  id: string
  name: string
  account: string
  role: RoleCode
  roleName: string
  department: string
  phone: string
  email: string
  status: 'active' | 'disabled'
  lastLoginAt: string
  avatarColor: string
  customerId?: string
}

export interface Customer {
  id: string
  name: string
  shortName: string
  industry: 'government' | 'finance' | 'medical' | 'education' | 'energy' | 'manufacturing' | 'telecom'
  industryName: string
  level: 'A' | 'B' | 'C'
  region: string
  manager: string
  contactName: string
  contactPhone: string
  address: string
  contractCount: number
  deviceCount: number
  totalCapacityTB: number
  usedCapacityTB: number
  poolCount: number
  slaRate: number
  ticketCount: number
  status: 'active' | 'inactive'
}

export interface DataCenter {
  id: string
  name: string
  customerId: string
  customerName: string
  address: string
  level: 'T3' | 'T4'
  rackCount: number
  usedU: number
  totalU: number
  powerLoad: number
  temperature: number
  humidity: number
}

export interface StorageCluster {
  id: string
  name: string
  vendor: string
  model: string
  customerId: string
  customerName: string
  datacenter: string
  datacenterId: string
  rack: string
  unit: string
  mgmtIp: string
  totalTB: number
  usedTB: number
  usageRate: number
  healthScore: number
  status: 'online' | 'warning' | 'offline' | 'maintenance'
  firmware: string
  warrantyEnd: string
  owner: string
  poolCount: number
  volumeCount: number
  iops: number
  latencyMs: number
  bandwidthGBps: number
  createdAt: string
}

export interface StoragePool {
  id: string
  name: string
  clusterId: string
  clusterName: string
  customerId: string
  customerName: string
  raidLevel: string
  diskType: string
  totalTB: number
  usedTB: number
  freeTB: number
  usageRate: number
  threshold: number
  status: 'normal' | 'warning' | 'critical'
  forecastDays: number
  growRatePerMonth: number
  allocatedTB: number
  snapshotTB: number
  metadataTB: number
  volumeCount: number
  createdAt: string
}

export interface DiskSlot {
  slot: number
  model: string
  capacityGB: number
  type: string
  health: number
  predictFail: boolean
  status: 'online' | 'failed' | 'rebuild'
}

export interface Device {
  id: string
  name: string
  type: 'allFlash' | 'hybrid' | 'distributed' | 'backupAppliance' | 'tapeLibrary' | 'switch'
  typeName: string
  vendor: string
  model: string
  sn: string
  clusterId: string
  clusterName: string
  customerId: string
  customerName: string
  datacenter: string
  datacenterId: string
  rack: string
  unit: string
  mgmtIp: string
  diskCount: number
  diskHealth: number
  firmware: string
  warrantyEnd: string
  status: 'online' | 'warning' | 'offline' | 'maintenance'
  owner: string
  disks: DiskSlot[]
  createdAt: string
}

export interface Volume {
  id: string
  name: string
  poolId: string
  poolName: string
  clusterId: string
  customerId: string
  customerName: string
  capacityGB: number
  type: 'block' | 'file' | 'object'
  typeName: string
  protocol: string
  hostCount: number
  snapshotCount: number
  protection: '双活' | '异步复制' | '快照' | '无'
  status: 'normal' | 'warning'
  createdAt: string
}

export interface Host {
  id: string
  name: string
  customerId: string
  customerName: string
  os: string
  ip: string
  wwpn: string
  iqn: string
  volumeCount: number
  status: 'online' | 'offline'
}

export interface Alarm {
  id: string
  level: 'P1' | 'P2' | 'P3' | 'P4'
  type: 'capacity' | 'performance' | 'hardware' | 'link' | 'replication' | 'other'
  typeName: string
  title: string
  objectType: 'pool' | 'cluster' | 'device'
  objectId: string
  objectName: string
  customerId: string
  customerName: string
  value: string
  threshold: string
  occurredAt: string
  status: 'active' | 'acked' | 'recovered' | 'closed'
  handler: string
  ticketId?: string
  durationMinutes: number
  suggestion: string
}

export interface Attachment {
  name: string
  size: string
  uploader: string
  time: string
}

export interface TimelineItem {
  time: string
  actor: string
  action: string
  remark: string
  cost?: string
}

export interface Ticket {
  id: string
  title: string
  customerId: string
  customerName: string
  contact: string
  serviceItem: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  status: 'pending' | 'assigned' | 'processing' | 'suspended' | 'resolved' | 'closed'
  source: 'alarm' | 'phone' | 'email' | 'portal' | 'onsite'
  sourceName: string
  resourceIds: string[]
  resourceNames: string[]
  description: string
  solution?: string
  assignee: string
  assigneeGroup: string
  creator: string
  createdAt: string
  respondedAt?: string
  resolvedAt?: string
  closedAt?: string
  responseDue: string
  resolveDue: string
  slaResponseOk: boolean
  slaResolveOk: boolean | null
  workHours: number
  satisfaction: number | null
  satisfactionTags: string[]
  satisfactionComment?: string
  contractId: string
  attachments: Attachment[]
  timeline: TimelineItem[]
}

export interface ServiceItem {
  id: string
  name: string
  icon: string
  desc: string
  responseHours: number
  resolveHours: number
  pricing: string
  delivery: string
  scope: string
  orderCount: number
}

export interface SparePart {
  id: string
  code: string
  name: string
  model: string
  applicable: string
  warehouse: string
  stock: number
  safetyStock: number
  unitPrice: number
  status: 'normal' | 'low' | 'out'
}

export interface SpareRecord {
  id: string
  spareId: string
  spareName: string
  type: 'in' | 'out' | 'repair' | 'scrap'
  typeName: string
  quantity: number
  ticketId?: string
  operator: string
  warehouse: string
  time: string
  remark: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  category: 'fault' | 'manual' | 'best' | 'faq' | 'doc'
  categoryName: string
  tags: string[]
  summary: string
  content: string
  author: string
  views: number
  helpful: number
  updatedAt: string
}

export interface SlaItem {
  serviceItem: string
  responseHours: number
  resolveHours: number
  penalty: string
}

export interface Contract {
  id: string
  customerId: string
  customerName: string
  level: 'gold' | 'silver' | 'bronze'
  levelName: string
  startDate: string
  endDate: string
  quotaDays: number
  usedDays: number
  deviceCount: number
  amount: number
  status: 'active' | 'expiring' | 'expired'
  manager: string
  slaItems: SlaItem[]
  coveredDeviceIds: string[]
}

export interface Change {
  id: string
  title: string
  type: 'standard' | 'normal' | 'emergency'
  typeName: string
  risk: 'high' | 'medium' | 'low'
  customerId: string
  customerName: string
  resourceIds: string[]
  resourceNames: string[]
  windowStart: string
  windowEnd: string
  owner: string
  approver: string
  status: 'approving' | 'approved' | 'implementing' | 'verifying' | 'closed'
  rollbackPlan: string
  reason: string
  createdAt: string
}

export interface InspectionItem {
  name: string
  result: 'pass' | 'warn' | 'fail'
  detail: string
}

export interface Inspection {
  id: string
  name: string
  customerId: string
  customerName: string
  cycle: 'daily' | 'weekly' | 'monthly'
  cycleName: string
  executor: string
  executedAt: string
  status: 'done' | 'running' | 'pending'
  passRate: number
  items: InspectionItem[]
}

export interface LogEntry {
  id: string
  time: string
  actor: string
  module: string
  action: string
  target: string
  ip: string
  result: 'success' | 'fail'
  detail: string
}

export interface Message {
  id: string
  type: 'alarm' | 'ticket' | 'approval' | 'system'
  typeName: string
  title: string
  content: string
  time: string
  read: boolean
  link?: string
}

export interface DutyShift {
  id: string
  date: string
  weekday: string
  primary: string
  backup: string
  secondary: string
  phone: string
}

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface Database {
  version: string
  customers: Customer[]
  datacenters: DataCenter[]
  clusters: StorageCluster[]
  pools: StoragePool[]
  devices: Device[]
  volumes: Volume[]
  hosts: Host[]
  alarms: Alarm[]
  tickets: Ticket[]
  serviceItems: ServiceItem[]
  spares: SparePart[]
  spareRecords: SpareRecord[]
  knowledge: KnowledgeArticle[]
  contracts: Contract[]
  changes: Change[]
  inspections: Inspection[]
  users: User[]
  logs: LogEntry[]
  messages: Message[]
  duties: DutyShift[]
}
