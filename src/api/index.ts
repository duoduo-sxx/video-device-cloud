/**
 * 接口定义层：与 Mock 路由一一对应
 * 页面只调用这里的方法，不直接使用 axios
 */
import { http } from './request'
import type {
  AiTask,
  Alarm,
  AlarmRule,
  Algorithm,
  ApiEndpoint,
  Bill,
  BillingItem,
  Channel,
  ClusterNode,
  Dept,
  Device,
  DeviceGroup,
  ExportTask,
  Firmware,
  Invoice,
  KnowledgeArticle,
  LiveChannel,
  LogEntry,
  MessageItem,
  MicroService,
  OtaTask,
  OpenApp,
  OperationLog,
  PageResult,
  PatrolTask,
  QualityCheckTask,
  RechargeRecord,
  RecordPlan,
  Role,
  ServiceItem,
  SparePart,
  StoragePool,
  Tenant,
  TranscodeTemplate,
  User,
  WebhookConfig,
  WorkOrder
} from '@/types'

export interface PatchStatsLike {
  created: number
  updated: number
  deleted: number
}

export const authApi = {
  login: (data: { username: string; password: string; remember?: boolean }) => http.post<any>('/v1/auth/login', data),
  userinfo: (token: string) => http.get<any>('/v1/auth/userinfo', { token }),
  logout: (token: string) => http.post('/v1/auth/logout', { token })
}

/* ---------------- 驾驶舱 ---------------- */
export const dashboardApi = {
  overview: () => http.get<any>('/v1/dashboard/overview'),
  deviceTrend: (days = 7) => http.get<any>('/v1/dashboard/device-trend', { days }),
  alarmDistribution: () => http.get<any>('/v1/dashboard/alarm-distribution'),
  regionDistribution: () => http.get<any[]>('/v1/dashboard/region-distribution'),
  storageTrend: () => http.get<any>('/v1/dashboard/storage-trend'),
  recentEvents: (limit = 20) => http.get<any[]>('/v1/dashboard/recent-events', { limit }),
  aiStats: () => http.get<any[]>('/v1/dashboard/ai-stats'),
  todos: () => http.get<any>('/v1/dashboard/todos'),
  orderStats: () => http.get<any>('/v1/dashboard/order-stats')
}

/* ---------------- 设备 ---------------- */
export const deviceApi = {
  list: (params: any) => http.get<PageResult<Device>>('/v1/devices', params),
  detail: (id: string) => http.get<any>(`/v1/devices/${id}`),
  create: (data: any) => http.post<Device>('/v1/devices', data),
  update: (id: string, data: any) => http.put<Device>(`/v1/devices/${id}`, data),
  remove: (id: string) => http.del(`/v1/devices/${id}`),
  batchDelete: (ids: string[]) => http.post<any>('/v1/devices/batch-delete', { ids }),
  batchOperation: (ids: string[], action: string, payload: any = {}) => http.post<any>('/v1/devices/batch-operation', { ids, action, payload }),
  groups: () => http.get<{ list: DeviceGroup[]; total: number }>('/v1/device-groups/tree'),
  stats: () => http.get<any>('/v1/devices/stats/overview'),
  attention: (params: any) => http.get<PageResult<Device>>('/v1/devices/attention', params),
  channels: (id: string) => http.get<Channel[]>(`/v1/devices/${id}/channels`),
  logs: (id: string, limit = 40) => http.get<any[]>(`/v1/devices/${id}/logs`, { limit }),
  diagnostics: (id: string) => http.get<any>(`/v1/devices/${id}/diagnostics`)
}

export const channelApi = {
  list: (params: any) => http.get<PageResult<Channel>>('/v1/channels', params),
  update: (id: string, data: any) => http.put<Channel>(`/v1/channels/${id}`, data),
  ptz: (id: string, data: { command: string; speed?: number }) => http.post<any>(`/v1/channels/${id}/ptz`, data),
  stream: (id: string, params: { protocol?: string; streamType?: string }) => http.get<any>(`/v1/channels/${id}/stream`, params),
  snapshot: (id: string) => http.post<any>(`/v1/channels/${id}/snapshot`),
  recordings: (id: string, params: any) => http.get<any>(`/v1/channels/${id}/recordings`, params)
}

export const firmwareApi = {
  list: (params?: any) => http.get<{ list: Firmware[]; total: number }>('/v1/firmwares', params),
  otaTasks: (params: any) => http.get<PageResult<OtaTask>>('/v1/ota/tasks', params),
  createOta: (data: any) => http.post<OtaTask>('/v1/ota/tasks', data)
}

/* ---------------- 告警 ---------------- */
export const alarmApi = {
  list: (params: any) => http.get<PageResult<Alarm>>('/v1/alarms', params),
  detail: (id: string) => http.get<any>(`/v1/alarms/${id}`),
  handle: (id: string, data: { status: string; remark: string; handler?: string }) => http.put<Alarm>(`/v1/alarms/${id}/handle`, data),
  batchHandle: (ids: string[], status: string, remark = '') => http.post<any>('/v1/alarms/batch-handle', { ids, status, remark }),
  batchTransfer: (ids: string[], engineer?: string, priority?: string) => http.post<any>('/v1/alarms/batch-transfer', { ids, engineer, priority }),
  transfer: (id: string, data: any) => http.post<WorkOrder>(`/v1/alarms/${id}/transfer`, data),
  statistics: (days = 7) => http.get<any>('/v1/alarms/statistics', { days }),
  rules: () => http.get<AlarmRule[]>('/v1/alarm-rules'),
  createRule: (data: any) => http.post<AlarmRule>('/v1/alarm-rules', data),
  updateRule: (id: string, data: any) => http.put<AlarmRule>(`/v1/alarm-rules/${id}`, data),
  removeRule: (id: string) => http.del(`/v1/alarm-rules/${id}`),
  testRule: (id: string) => http.post<any>(`/v1/alarm-rules/${id}/test`)
}

/* ---------------- 云存储 / 视频 ---------------- */
export const storageApi = {
  overview: () => http.get<any>('/v1/storage/overview'),
  pools: (params: any) => http.get<PageResult<StoragePool>>('/v1/storage/pools', params),
  createPool: (data: any) => http.post<StoragePool>('/v1/storage/pools', data),
  updatePool: (id: string, data: any) => http.put<StoragePool>(`/v1/storage/pools/${id}`, data),
  usage: (params: any) => http.get<any>('/v1/storage/usage', params),
  disks: () => http.get<any>('/v1/storage/disks'),
  plans: (params: any) => http.get<PageResult<RecordPlan>>('/v1/storage/plans', params),
  createPlan: (data: any) => http.post<RecordPlan>('/v1/storage/plans', data),
  updatePlan: (id: string, data: any) => http.put<RecordPlan>(`/v1/storage/plans/${id}`, data),
  removePlan: (id: string) => http.del(`/v1/storage/plans/${id}`),
  archiveTasks: (params: any) => http.get<{ list: any[]; total: number }>('/v1/storage/archive/tasks', params),
  createArchive: (data: any) => http.post<any>('/v1/storage/archive', data)
}

export const videoApi = {
  templates: () => http.get<TranscodeTemplate[]>('/v1/transcode-templates'),
  createTemplate: (data: any) => http.post<TranscodeTemplate>('/v1/transcode-templates', data),
  updateTemplate: (id: string, data: any) => http.put<TranscodeTemplate>(`/v1/transcode-templates/${id}`, data),
  removeTemplate: (id: string) => http.del(`/v1/transcode-templates/${id}`),
  qualityChecks: (params: any) => http.get<any>('/v1/quality-checks', params),
  createQualityCheck: (data: any) => http.post<any>('/v1/quality-checks', data),
  liveChannels: (params: any) => http.get<any>('/v1/live-channels', params),
  createLiveChannel: (data: any) => http.post<LiveChannel>('/v1/live-channels', data),
  updateLiveChannel: (id: string, data: any) => http.put<LiveChannel>(`/v1/live-channels/${id}`, data),
  removeLiveChannel: (id: string) => http.del(`/v1/live-channels/${id}`),
  refreshToken: (id: string) => http.post<any>(`/v1/live-channels/${id}/refresh-token`)
}

/* ---------------- AI ---------------- */
export const aiApi = {
  algorithms: (params?: any) => http.get<{ list: Algorithm[]; total: number; vendors: string[]; types: string[] }>('/v1/ai/algorithms', params),
  algorithmDetail: (id: string) => http.get<any>(`/v1/ai/algorithms/${id}`),
  toggleAlgorithm: (id: string, status: 0 | 1) => http.put<any>(`/v1/ai/algorithms/${id}/status`, { status }),
  tasks: (params: any) => http.get<any>('/v1/ai/tasks', params),
  createTask: (data: any) => http.post<AiTask>('/v1/ai/tasks', data),
  updateTask: (id: string, data: any) => http.put<AiTask>(`/v1/ai/tasks/${id}`, data),
  toggleTask: (id: string, status: 'running' | 'stopped') => http.put<AiTask>(`/v1/ai/tasks/${id}/status`, { status }),
  removeTask: (id: string) => http.del(`/v1/ai/tasks/${id}`),
  events: (params: any) => http.get<PageResult<Alarm>>('/v1/ai/events', params),
  eventStats: (days = 7) => http.get<any>('/v1/ai/events/stats', { days })
}

/* ---------------- 技术服务 ---------------- */
export const workOrderApi = {
  list: (params: any) => http.get<any>('/v1/workorders', params),
  kanban: (params: any) => http.get<any[]>('/v1/workorders/kanban', params),
  detail: (id: string) => http.get<any>(`/v1/workorders/${id}`),
  create: (data: any) => http.post<WorkOrder>('/v1/workorders', data),
  assign: (id: string, assignee: string, remark?: string) => http.post<WorkOrder>(`/v1/workorders/${id}/assign`, { assignee, remark }),
  dispatchSuggest: (id: string) => http.get<any>(`/v1/workorders/${id}/dispatch-suggest`),
  changeStatus: (id: string, data: any) => http.put<WorkOrder>(`/v1/workorders/${id}/status`, data),
  addLog: (id: string, remark: string, action?: string) => http.post<WorkOrder>(`/v1/workorders/${id}/log`, { remark, action }),
  visit: (id: string, data: any) => http.post<WorkOrder>(`/v1/workorders/${id}/visit`, data),
  stats: (days = 30) => http.get<any>('/v1/service/stats', { days }),
  visits: (params: any) => http.get<any>('/v1/service/visits', params),
  engineers: () => http.get<any[]>('/v1/engineers'),
  catalog: () => http.get<ServiceItem[]>('/v1/services/catalog'),
  createCatalog: (data: any) => http.post<ServiceItem>('/v1/services/catalog', data),
  updateCatalog: (id: string, data: any) => http.put<ServiceItem>(`/v1/services/catalog/${id}`, data)
}

export const partApi = {
  list: (params: any) => http.get<any>('/v1/parts', params),
  inOut: (data: any) => http.post<any>('/v1/parts/in-out', data),
  update: (id: string, data: any) => http.put<SparePart>(`/v1/parts/${id}`, data)
}

export const knowledgeApi = {
  list: (params: any) => http.get<any>('/v1/knowledge', params),
  detail: (id: string) => http.get<any>(`/v1/knowledge/${id}`),
  create: (data: any) => http.post<KnowledgeArticle>('/v1/knowledge', data),
  update: (id: string, data: any) => http.put<KnowledgeArticle>(`/v1/knowledge/${id}`, data),
  remove: (id: string) => http.del(`/v1/knowledge/${id}`)
}

export const patrolApi = {
  list: (params: any) => http.get<{ list: PatrolTask[]; total: number }>('/v1/patrols', params),
  create: (data: any) => http.post<PatrolTask>('/v1/patrols', data)
}

/* ---------------- 开放平台 ---------------- */
export const openApi = {
  apps: (params: any) => http.get<PageResult<OpenApp>>('/v1/open/apps', params),
  createApp: (data: any) => http.post<any>('/v1/open/apps', data),
  updateApp: (id: string, data: any) => http.put<OpenApp>(`/v1/open/apps/${id}`, data),
  removeApp: (id: string) => http.del(`/v1/open/apps/${id}`),
  resetSecret: (id: string) => http.post<{ appSecret: string; message: string }>(`/v1/open/apps/${id}/reset-secret`),
  toggleApp: (id: string, status: 0 | 1) => http.put<OpenApp>(`/v1/open/apps/${id}/status`, { status }),
  endpoints: (params?: any) => http.get<{ list: ApiEndpoint[]; groups: string[] }>('/v1/open/endpoints', params),
  debug: (data: { endpointId: string; params: Record<string, any> }) => http.post<any>('/v1/open/debug', data),
  callLogs: (params: any) => http.get<PageResult<any>>('/v1/open/call-logs', params),
  stats: (days = 14) => http.get<any>('/v1/open/stats', { days }),
  webhooks: (params: any) => http.get<{ list: any[]; total: number }>('/v1/open/webhooks', params),
  webhookDetail: (id: string) => http.get<WebhookConfig>(`/v1/open/webhooks/${id}`),
  createWebhook: (data: any) => http.post<WebhookConfig>('/v1/open/webhooks', data),
  updateWebhook: (id: string, data: any) => http.put<WebhookConfig>(`/v1/open/webhooks/${id}`, data),
  removeWebhook: (id: string) => http.del(`/v1/open/webhooks/${id}`),
  testWebhook: (id: string) => http.post<any>(`/v1/open/webhooks/${id}/test`),
  retryPush: (id: string, recordId: string) => http.post<any>(`/v1/open/webhooks/${id}/retry`, { recordId }),
  exports: (params: any) => http.get<{ list: ExportTask[]; total: number }>('/v1/open/exports', params),
  createExport: (data: any) => http.post<ExportTask>('/v1/open/exports', data),
  removeExport: (id: string) => http.del(`/v1/open/exports/${id}`)
}

/* ---------------- 运维监控 ---------------- */
export const monitorApi = {
  cluster: () => http.get<any>('/v1/monitor/cluster'),
  nodes: (params: any) => http.get<PageResult<ClusterNode>>('/v1/monitor/nodes', params),
  nodeDetail: (id: string) => http.get<any>(`/v1/monitor/nodes/${id}`),
  services: () => http.get<{ list: MicroService[]; summary: any }>('/v1/monitor/services'),
  topology: () => http.get<{ nodes: any[]; links: any[] }>('/v1/monitor/topology'),
  logs: (params: any) => http.get<any>('/v1/monitor/logs', params),
  capacity: () => http.get<any>('/v1/monitor/capacity'),
  maintenance: () => http.get<{ list: any[] }>('/v1/monitor/maintenance'),
  createMaintenance: (data: any) => http.post<any>('/v1/monitor/maintenance', data),
  removeMaintenance: (id: string) => http.del(`/v1/monitor/maintenance/${id}`),
  healthReport: () => http.get<any>('/v1/monitor/health-report')
}

/* ---------------- 租户 / 用户 / 权限 ---------------- */
export const tenantApi = {
  list: (params: any) => http.get<PageResult<Tenant>>('/v1/tenants', params),
  detail: (id: string) => http.get<Tenant>(`/v1/tenants/${id}`),
  create: (data: any) => http.post<Tenant>('/v1/tenants', data),
  update: (id: string, data: any) => http.put<Tenant>(`/v1/tenants/${id}`, data),
  remove: (id: string) => http.del(`/v1/tenants/${id}`),
  updateQuota: (id: string, data: any) => http.put<Tenant>(`/v1/tenants/${id}/quota`, data)
}

export const userApi = {
  list: (params: any) => http.get<PageResult<User>>('/v1/users', params),
  create: (data: any) => http.post<User>('/v1/users', data),
  update: (id: string, data: any) => http.put<User>(`/v1/users/${id}`, data),
  remove: (id: string) => http.del(`/v1/users/${id}`),
  roles: (params: any) => http.get<PageResult<Role>>('/v1/roles', params),
  updateRole: (id: string, data: any) => http.put<Role>(`/v1/roles/${id}`, data),
  updateRolePermissions: (id: string, data: any) => http.put<Role>(`/v1/roles/${id}/permissions`, data),
  deptTree: () => http.get<Dept[]>('/v1/depts/tree'),
  operationLogs: (params: any) => http.get<PageResult<OperationLog>>('/v1/logs/operation', params)
}

/* ---------------- 计费 ---------------- */
export const billingApi = {
  items: () => http.get<BillingItem[]>('/v1/billing/items'),
  updateItem: (id: string, data: any) => http.put<BillingItem>(`/v1/billing/items/${id}`, data),
  bills: (params: any) => http.get<PageResult<Bill>>('/v1/billing/bills', params),
  billDetail: (id: string) => http.get<Bill>(`/v1/billing/bills/${id}`),
  voidBill: (id: string) => http.put<Bill>(`/v1/billing/bills/${id}/void`),
  recharges: (params: any) => http.get<PageResult<RechargeRecord>>('/v1/billing/recharges', params),
  recharge: (data: any) => http.post<RechargeRecord>('/v1/billing/recharge', data),
  invoices: (params: any) => http.get<PageResult<Invoice>>('/v1/billing/invoices', params),
  createInvoice: (data: any) => http.post<Invoice>('/v1/billing/invoices', data),
  updateInvoice: (id: string, data: any) => http.put<Invoice>(`/v1/billing/invoices/${id}`, data)
}

/* ---------------- 系统 ---------------- */
export const systemApi = {
  dicts: (params?: any) => http.get<any>('/v1/system/dicts', params),
  updateDict: (id: string, data: any) => http.put<any>(`/v1/system/dicts/${id}`, data),
  messages: (params?: any) => http.get<{ list: MessageItem[]; unread: number }>('/v1/system/messages', params),
  readMessages: (ids: string[] = []) => http.put<any>('/v1/system/messages/read', { ids }),
  stats: () => http.get<any>('/v1/system/stats'),
  resetDemo: () => http.post<any>('/v1/system/reset-demo'),
  regions: () => http.get<any[]>('/v1/system/regions'),
  snapshot: (seed: string, label: string) => http.get<{ url: string }>('/v1/system/snapshot', { seed, label })
}
