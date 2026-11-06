import { db, persist } from '@/mock/db'
import { paginate, sortRows, includesKeyword, type PageQuery } from '@/utils/query'
import { dayjs } from '@/utils/format'
import type {
  Alarm, Change, Contract, Customer, Device, Inspection, KnowledgeArticle, LogEntry, Message,
  PageResult, ServiceItem, SparePart, SpareRecord, StorageCluster, StoragePool, Ticket, TimelineItem,
  User, Volume
} from '@/types'

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 140))

function nowIso() {
  return dayjs().format('YYYY-MM-DDTHH:mm:ss') + '+08:00'
}

/* ---------------- 资源 ---------------- */

export interface ClusterQuery extends PageQuery {
  keyword?: string
  customerId?: string
  vendor?: string
  status?: string
  datacenter?: string
}

export async function getClusters(q: ClusterQuery = {}): Promise<PageResult<StorageCluster>> {
  await wait()
  let rows = db.clusters.filter((c) =>
    includesKeyword(`${c.name}${c.model}${c.mgmtIp}${c.customerName}`, q.keyword) &&
    (!q.customerId || c.customerId === q.customerId) &&
    (!q.vendor || c.vendor === q.vendor) &&
    (!q.status || c.status === q.status) &&
    (!q.datacenter || c.datacenter === q.datacenter)
  )
  rows = sortRows(rows as unknown as Record<string, unknown>[], q.sortBy, q.sortOrder) as unknown as StorageCluster[]
  return paginate(rows, q)
}

export async function getCluster(id: string): Promise<StorageCluster | undefined> {
  await wait(150)
  return db.clusters.find((c) => c.id === id)
}

export interface PoolQuery extends PageQuery {
  keyword?: string
  customerId?: string
  clusterId?: string
  status?: string
  minUsage?: number
}

export async function getPools(q: PoolQuery = {}): Promise<PageResult<StoragePool>> {
  await wait()
  let rows = db.pools.filter((p) =>
    includesKeyword(`${p.name}${p.clusterName}${p.customerName}`, q.keyword) &&
    (!q.customerId || p.customerId === q.customerId) &&
    (!q.clusterId || p.clusterId === q.clusterId) &&
    (!q.status || p.status === q.status) &&
    (q.minUsage === undefined || p.usageRate >= q.minUsage)
  )
  rows = sortRows(rows as unknown as Record<string, unknown>[], q.sortBy ?? 'usageRate', q.sortOrder ?? 'desc') as unknown as StoragePool[]
  return paginate(rows, q)
}

export async function getAllPools(): Promise<StoragePool[]> {
  await wait(120)
  return db.pools
}

export interface DeviceQuery extends PageQuery {
  keyword?: string
  customerId?: string
  type?: string
  status?: string
  clusterId?: string
}

export async function getDevices(q: DeviceQuery = {}): Promise<PageResult<Device>> {
  await wait()
  let rows = db.devices.filter((d) =>
    includesKeyword(`${d.name}${d.sn}${d.model}${d.mgmtIp}${d.customerName}`, q.keyword) &&
    (!q.customerId || d.customerId === q.customerId) &&
    (!q.type || d.type === q.type) &&
    (!q.status || d.status === q.status) &&
    (!q.clusterId || d.clusterId === q.clusterId)
  )
  rows = sortRows(rows as unknown as Record<string, unknown>[], q.sortBy, q.sortOrder) as unknown as Device[]
  return paginate(rows, q)
}

export async function getDevice(id: string): Promise<Device | undefined> {
  await wait(160)
  return db.devices.find((d) => d.id === id)
}

export interface VolumeQuery extends PageQuery {
  keyword?: string
  poolId?: string
  clusterId?: string
  customerId?: string
  type?: string
}

export async function getVolumes(q: VolumeQuery = {}): Promise<PageResult<Volume>> {
  await wait()
  let rows = db.volumes.filter((v) =>
    includesKeyword(`${v.name}${v.poolName}${v.customerName}`, q.keyword) &&
    (!q.poolId || v.poolId === q.poolId) &&
    (!q.clusterId || v.clusterId === q.clusterId) &&
    (!q.customerId || v.customerId === q.customerId) &&
    (!q.type || v.type === q.type)
  )
  rows = sortRows(rows as unknown as Record<string, unknown>[], q.sortBy ?? 'capacityGB', q.sortOrder ?? 'desc') as unknown as Volume[]
  return paginate(rows, q)
}

export async function createVolume(payload: { name: string; poolId: string; capacityGB: number; type: Volume['type']; protocol: string }): Promise<Volume> {
  await wait()
  const pool = db.pools.find((p) => p.id === payload.poolId)!
  const vol: Volume = {
    id: `VOL-${String(db.volumes.length + 1).padStart(4, '0')}`,
    name: payload.name,
    poolId: pool.id,
    poolName: pool.name,
    clusterId: pool.clusterId,
    customerId: pool.customerId,
    customerName: pool.customerName,
    capacityGB: payload.capacityGB,
    type: payload.type,
    typeName: payload.type === 'block' ? '块存储' : payload.type === 'file' ? '文件存储' : '对象存储',
    protocol: payload.protocol,
    hostCount: 0,
    snapshotCount: 0,
    protection: '快照',
    status: 'normal',
    createdAt: nowIso()
  }
  db.volumes.unshift(vol)
  pool.volumeCount += 1
  persist()
  return vol
}

export async function deleteVolume(id: string): Promise<void> {
  await wait(160)
  const idx = db.volumes.findIndex((v) => v.id === id)
  if (idx >= 0) {
    const vol = db.volumes[idx]
    const pool = db.pools.find((p) => p.id === vol.poolId)
    if (pool) pool.volumeCount = Math.max(0, pool.volumeCount - 1)
    db.volumes.splice(idx, 1)
    persist()
  }
}

export async function expandPool(poolId: string, addTB: number): Promise<void> {
  await wait(260)
  const pool = db.pools.find((p) => p.id === poolId)
  if (!pool) return
  pool.totalTB = Number((pool.totalTB + addTB).toFixed(1))
  pool.freeTB = Number((pool.totalTB - pool.usedTB).toFixed(1))
  pool.usageRate = Number(((pool.usedTB / pool.totalTB) * 100).toFixed(1))
  pool.status = pool.usageRate >= 92 ? 'critical' : pool.usageRate >= 85 ? 'warning' : 'normal'
  pool.forecastDays = Math.max(30, Math.round((pool.freeTB / pool.growRatePerMonth) * 30))
  const cluster = db.clusters.find((c) => c.id === pool.clusterId)
  if (cluster) {
    cluster.totalTB = Number((cluster.totalTB + addTB).toFixed(1))
    cluster.usageRate = Number(((cluster.usedTB / cluster.totalTB) * 100).toFixed(1))
  }
  persist()
}

/* ---------------- 告警 ---------------- */

export interface AlarmQuery extends PageQuery {
  keyword?: string
  level?: string
  status?: string
  type?: string
  customerId?: string
  days?: number
}

export async function getAlarms(q: AlarmQuery = {}): Promise<PageResult<Alarm>> {
  await wait()
  const since = q.days ? dayjs().subtract(q.days, 'day').valueOf() : 0
  let rows = db.alarms.filter((a) =>
    includesKeyword(`${a.title}${a.objectName}${a.customerName}`, q.keyword) &&
    (!q.level || a.level === q.level) &&
    (!q.status || a.status === q.status) &&
    (!q.type || a.type === q.type) &&
    (!q.customerId || a.customerId === q.customerId) &&
    dayjs(a.occurredAt).valueOf() >= since
  )
  rows = [...rows].sort((a, b) => dayjs(b.occurredAt).valueOf() - dayjs(a.occurredAt).valueOf())
  return paginate(rows, q)
}

export async function ackAlarm(id: string, handler = '陈立'): Promise<void> {
  await wait(160)
  const a = db.alarms.find((x) => x.id === id)
  if (a) {
    a.status = 'acked'
    a.handler = handler
    db.logs.unshift({
      id: `LOG-${db.logs.length + 1}`, time: nowIso(), actor: handler, module: '告警中心',
      action: '确认告警', target: id, ip: '10.20.11.36', result: 'success', detail: '{"status":"acked"}'
    })
    persist()
  }
}

export async function closeAlarm(id: string, handler = '陈立'): Promise<void> {
  await wait(160)
  const a = db.alarms.find((x) => x.id === id)
  if (a) {
    a.status = 'closed'
    a.handler = handler
    persist()
  }
}

export async function convertAlarmToTicket(id: string): Promise<Ticket | undefined> {
  await wait(280)
  const alarm = db.alarms.find((a) => a.id === id)
  if (!alarm) return
  const ticket = await createTicket({
    title: alarm.title,
    customerId: alarm.customerId,
    serviceItem: '故障处理',
    priority: alarm.level,
    description: `${alarm.title}\n\n当前值：${alarm.value}，阈值：${alarm.threshold}。\n处理建议：${alarm.suggestion}`,
    resourceIds: [alarm.objectId],
    resourceNames: [alarm.objectName],
    source: 'alarm'
  })
  alarm.ticketId = ticket.id
  alarm.status = 'acked'
  alarm.handler = '陈立'
  persist()
  return ticket
}

/* ---------------- 工单 ---------------- */

export interface TicketQuery extends PageQuery {
  keyword?: string
  status?: string
  priority?: string
  serviceItem?: string
  customerId?: string
  assignee?: string
  tab?: 'all' | 'todo' | 'accept' | 'created' | 'overdue'
}

export async function getTickets(q: TicketQuery = {}): Promise<PageResult<Ticket>> {
  await wait()
  const me = getCurrentUser()
  let rows = db.tickets.filter((t) => {
    if (!includesKeyword(`${t.id}${t.title}${t.customerName}${t.assignee}`, q.keyword)) return false
    if (q.status && t.status !== q.status) return false
    if (q.priority && t.priority !== q.priority) return false
    if (q.serviceItem && t.serviceItem !== q.serviceItem) return false
    if (q.customerId && t.customerId !== q.customerId) return false
    if (q.assignee && t.assignee !== q.assignee) return false
    if (!me) return true
    if (me.role === 'customer_admin' && t.customerId !== me.customerId) return false
    if (me.role === 'engineer' && q.tab !== 'all' && t.assignee && t.assignee !== me.name && t.status !== 'resolved') return false
    return true
  })
  if (q.tab === 'todo') rows = rows.filter((t) => ['pending', 'assigned', 'processing'].includes(t.status))
  if (q.tab === 'accept') rows = rows.filter((t) => t.status === 'resolved')
  if (q.tab === 'created') rows = rows.filter((t) => t.creator === me?.name)
  if (q.tab === 'overdue') rows = rows.filter((t) => t.status !== 'closed' && dayjs(t.resolveDue).valueOf() < Date.now())
  rows = [...rows].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
  return paginate(rows, q)
}

export async function getAllTickets(): Promise<Ticket[]> {
  await wait(100)
  return db.tickets
}

export async function getTicket(id: string): Promise<Ticket | undefined> {
  await wait(160)
  return db.tickets.find((t) => t.id === id)
}

export function getCurrentUser(): User | undefined {
  try {
    const raw = localStorage.getItem('soc.user')
    return raw ? (JSON.parse(raw) as User) : undefined
  } catch {
    return undefined
  }
}

export interface CreateTicketDTO {
  title: string
  customerId: string
  serviceItem: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  description: string
  resourceIds: string[]
  resourceNames: string[]
  source?: Ticket['source']
  contact?: string
  expectAt?: string
  attachments?: { name: string; size: string }[]
}

const SLA_MAP: Record<string, { response: number; resolve: number }> = {
  P1: { response: 0.25, resolve: 4 },
  P2: { response: 0.5, resolve: 8 },
  P3: { response: 2, resolve: 24 },
  P4: { response: 4, resolve: 48 }
}

export async function createTicket(dto: CreateTicketDTO): Promise<Ticket> {
  await wait(320)
  const customer = db.customers.find((c) => c.id === dto.customerId)
  const me = getCurrentUser()
  const created = dayjs()
  const sla = SLA_MAP[dto.priority]
  const id = `WO-${created.format('YYYYMM')}-${String(db.tickets.length + 1).padStart(4, '0')}`
  const contract = db.contracts.find((c) => c.customerId === dto.customerId)
  const ticket: Ticket = {
    id,
    title: dto.title,
    customerId: dto.customerId,
    customerName: customer?.name ?? '',
    contact: dto.contact || `${customer?.contactName ?? ''} ${customer?.contactPhone ?? ''}`,
    serviceItem: dto.serviceItem,
    priority: dto.priority,
    status: 'pending',
    source: dto.source ?? 'portal',
    sourceName: { alarm: '告警转单', phone: '电话', email: '邮件', portal: '服务门户', onsite: '现场' }[dto.source ?? 'portal'],
    resourceIds: dto.resourceIds,
    resourceNames: dto.resourceNames,
    description: dto.description,
    assignee: '',
    assigneeGroup: '',
    creator: me?.name ?? '服务门户',
    createdAt: created.format('YYYY-MM-DDTHH:mm:ss') + '+08:00',
    responseDue: created.add(sla.response, 'hour').format('YYYY-MM-DDTHH:mm:ss') + '+08:00',
    resolveDue: created.add(sla.resolve, 'hour').format('YYYY-MM-DDTHH:mm:ss') + '+08:00',
    slaResponseOk: true,
    slaResolveOk: null,
    workHours: 0,
    satisfaction: null,
    satisfactionTags: [],
    contractId: contract?.id ?? '',
    attachments: (dto.attachments ?? []).map((a) => ({
      name: a.name, size: a.size, uploader: me?.name ?? '客户', time: nowIso()
    })),
    timeline: [{ time: nowIso(), actor: me?.name ?? '客户', action: '创建工单', remark: `来源：${dto.source === 'alarm' ? '告警转单' : '服务门户'}` }]
  }
  db.tickets.unshift(ticket)
  persist()
  return ticket
}

function pushTimeline(t: Ticket, item: TimelineItem) {
  t.timeline.push(item)
}

export async function acceptTicket(id: string, actor = '林悦'): Promise<void> {
  await wait(160)
  const t = db.tickets.find((x) => x.id === id)
  if (!t) return
  t.status = 'assigned'
  pushTimeline(t, { time: nowIso(), actor, action: '受理', remark: '工单已受理，等待派单' })
  persist()
}

export async function assignTicket(id: string, assignee: string, group = '存储一线'): Promise<void> {
  await wait(180)
  const t = db.tickets.find((x) => x.id === id)
  if (!t) return
  t.assignee = assignee
  t.assigneeGroup = group
  t.status = 'processing'
  t.respondedAt = t.respondedAt ?? nowIso()
  t.slaResponseOk = dayjs(t.respondedAt).valueOf() <= dayjs(t.responseDue).valueOf()
  pushTimeline(t, { time: nowIso(), actor: '张伟', action: '派单', remark: `派至${group} · ${assignee}` })
  persist()
}

export async function resolveTicket(id: string, solution: string): Promise<void> {
  await wait(200)
  const t = db.tickets.find((x) => x.id === id)
  if (!t) return
  t.status = 'resolved'
  t.solution = solution
  t.resolvedAt = nowIso()
  t.slaResolveOk = dayjs(t.resolvedAt).valueOf() <= dayjs(t.resolveDue).valueOf()
  pushTimeline(t, { time: nowIso(), actor: t.assignee || '陈立', action: '已解决', remark: solution })
  persist()
}

export async function closeTicket(id: string, actor = '李建国', score?: number, tags: string[] = [], comment = ''): Promise<void> {
  await wait(200)
  const t = db.tickets.find((x) => x.id === id)
  if (!t) return
  t.status = 'closed'
  t.closedAt = nowIso()
  if (score) {
    t.satisfaction = score
    t.satisfactionTags = tags
    t.satisfactionComment = comment
  }
  pushTimeline(t, { time: nowIso(), actor, action: '验收通过并关闭', remark: score ? `满意度 ${score} 星` : '客户确认关闭' })
  persist()
}

export async function suspendTicket(id: string, reason: string): Promise<void> {
  await wait(160)
  const t = db.tickets.find((x) => x.id === id)
  if (!t) return
  t.status = 'suspended'
  pushTimeline(t, { time: nowIso(), actor: t.assignee || '陈立', action: '挂起', remark: reason })
  persist()
}

export async function resumeTicket(id: string): Promise<void> {
  await wait(160)
  const t = db.tickets.find((x) => x.id === id)
  if (!t) return
  t.status = 'processing'
  pushTimeline(t, { time: nowIso(), actor: t.assignee || '陈立', action: '恢复处理', remark: '阻塞已解除，恢复处理' })
  persist()
}

export async function addWorkHour(id: string, hours: number, content: string): Promise<void> {
  await wait(160)
  const t = db.tickets.find((x) => x.id === id)
  if (!t) return
  t.workHours = Number((t.workHours + hours).toFixed(1))
  pushTimeline(t, { time: nowIso(), actor: t.assignee || '陈立', action: '登记工时', remark: `${content}（${hours}h）`, cost: `${hours}h` })
  persist()
}

export async function rateTicket(id: string, score: number, tags: string[], comment: string): Promise<void> {
  await wait(160)
  const t = db.tickets.find((x) => x.id === id)
  if (!t) return
  t.satisfaction = score
  t.satisfactionTags = tags
  t.satisfactionComment = comment
  if (t.status === 'closed') {
    pushTimeline(t, { time: nowIso(), actor: '李建国', action: '满意度评价', remark: `${score} 星 ${tags.join('、')}` })
  }
  persist()
}

/* ---------------- 服务保障 ---------------- */

export async function getServiceItems(): Promise<ServiceItem[]> {
  await wait(120)
  return db.serviceItems
}

export interface SpareQuery extends PageQuery {
  keyword?: string
  status?: string
  warehouse?: string
}

export async function getSpares(q: SpareQuery = {}): Promise<PageResult<SparePart>> {
  await wait()
  let rows = db.spares.filter((s) =>
    includesKeyword(`${s.code}${s.name}${s.model}${s.applicable}`, q.keyword) &&
    (!q.status || s.status === q.status) &&
    (!q.warehouse || s.warehouse === q.warehouse)
  )
  rows = sortRows(rows as unknown as Record<string, unknown>[], q.sortBy, q.sortOrder) as unknown as SparePart[]
  return paginate(rows, q)
}

export async function getSpareRecords(): Promise<SpareRecord[]> {
  await wait(120)
  return [...db.spareRecords].sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())
}

export async function outSpare(spareId: string, quantity: number, ticketId: string, operator: string, remark: string): Promise<void> {
  await wait(220)
  const sp = db.spares.find((s) => s.id === spareId)
  if (!sp) return
  sp.stock = Math.max(0, sp.stock - quantity)
  sp.status = sp.stock === 0 ? 'out' : sp.stock <= sp.safetyStock ? 'low' : 'normal'
  db.spareRecords.unshift({
    id: `SR-${db.spareRecords.length + 1}`,
    spareId: sp.id,
    spareName: sp.name,
    type: 'out',
    typeName: '出库领用',
    quantity,
    ticketId,
    operator,
    warehouse: sp.warehouse,
    time: nowIso(),
    remark: remark || '工单领用更换故障件'
  })
  persist()
}

export interface KnowledgeQuery extends PageQuery {
  keyword?: string
  category?: string
  tag?: string
}

export async function getKnowledgeList(q: KnowledgeQuery = {}): Promise<PageResult<KnowledgeArticle>> {
  await wait()
  let rows = db.knowledge.filter((k) =>
    includesKeyword(`${k.title}${k.summary}${k.tags.join('')}`, q.keyword) &&
    (!q.category || q.category === 'all' || k.category === q.category) &&
    (!q.tag || k.tags.includes(q.tag))
  )
  rows = [...rows].sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
  return paginate(rows, q)
}

export async function getKnowledge(id: string): Promise<KnowledgeArticle | undefined> {
  await wait(120)
  return db.knowledge.find((k) => k.id === id)
}

export interface ContractQuery extends PageQuery {
  keyword?: string
  status?: string
  level?: string
}

export async function getContracts(q: ContractQuery = {}): Promise<PageResult<Contract>> {
  await wait()
  let rows = db.contracts.filter((c) =>
    includesKeyword(`${c.id}${c.customerName}${c.manager}`, q.keyword) &&
    (!q.status || c.status === q.status) &&
    (!q.level || c.level === q.level)
  )
  return paginate(rows, q)
}

export async function getContract(id: string): Promise<Contract | undefined> {
  await wait(140)
  return db.contracts.find((c) => c.id === id)
}

export async function getChanges(q: PageQuery & { status?: string } = {}): Promise<PageResult<Change>> {
  await wait()
  const rows = db.changes
    .filter((c) => !q.status || c.status === q.status)
    .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
  return paginate(rows, q)
}

export async function approveChange(id: string): Promise<void> {
  await wait(180)
  const c = db.changes.find((x) => x.id === id)
  if (c) {
    c.status = 'approved'
    persist()
  }
}

export async function getInspections(): Promise<Inspection[]> {
  await wait(140)
  return [...db.inspections].sort((a, b) => dayjs(b.executedAt).valueOf() - dayjs(a.executedAt).valueOf())
}

export async function getDuties(): Promise<import('@/types').DutyShift[]> {
  await wait(100)
  return db.duties
}

/* ---------------- 客户 / 系统 ---------------- */

export interface CustomerQuery extends PageQuery {
  keyword?: string
  industry?: string
  level?: string
}

export async function getCustomers(q: CustomerQuery = {}): Promise<PageResult<Customer>> {
  await wait()
  let rows = db.customers.filter((c) =>
    includesKeyword(`${c.name}${c.region}${c.manager}`, q.keyword) &&
    (!q.industry || c.industry === q.industry) &&
    (!q.level || c.level === q.level)
  )
  rows = sortRows(rows as unknown as Record<string, unknown>[], q.sortBy, q.sortOrder) as unknown as Customer[]
  return paginate(rows, q)
}

export async function getAllCustomers(): Promise<Customer[]> {
  await wait(100)
  return db.customers
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  await wait(120)
  return db.customers.find((c) => c.id === id)
}

export async function getDatacenters(): Promise<import('@/types').DataCenter[]> {
  await wait(140)
  return db.datacenters
}

export async function getUsers(q: PageQuery & { keyword?: string; status?: string; role?: string } = {}): Promise<PageResult<User>> {
  await wait()
  const rows = db.users.filter((u) =>
    includesKeyword(`${u.name}${u.account}${u.department}`, q.keyword) &&
    (!q.status || u.status === q.status) &&
    (!q.role || u.role === q.role)
  )
  return paginate(rows, q)
}

export async function saveUser(payload: Partial<User> & { id?: string }): Promise<void> {
  await wait(200)
  if (payload.id) {
    const u = db.users.find((x) => x.id === payload.id)
    if (u) Object.assign(u, payload)
  } else {
    db.users.unshift({
      id: `U-${String(db.users.length + 1).padStart(3, '0')}`,
      name: payload.name ?? '新用户',
      account: payload.account ?? `user${db.users.length + 1}`,
      role: payload.role ?? 'engineer',
      roleName: payload.roleName ?? '存储运维工程师',
      department: payload.department ?? '技术服务部',
      phone: payload.phone ?? '',
      email: payload.email ?? '',
      status: payload.status ?? 'active',
      lastLoginAt: nowIso(),
      avatarColor: '#1668DC'
    })
  }
  persist()
}

export async function toggleUserStatus(id: string): Promise<void> {
  await wait(140)
  const u = db.users.find((x) => x.id === id)
  if (u) {
    u.status = u.status === 'active' ? 'disabled' : 'active'
    persist()
  }
}

export async function getLogs(q: PageQuery & { keyword?: string; module?: string } = {}): Promise<PageResult<LogEntry>> {
  await wait()
  const rows = db.logs
    .filter((l) => includesKeyword(`${l.actor}${l.action}${l.target}${l.module}`, q.keyword) && (!q.module || l.module === q.module))
    .sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())
  return paginate(rows, q)
}

export async function getMessages(q: { type?: string; onlyUnread?: boolean } = {}): Promise<Message[]> {
  await wait(120)
  return db.messages
    .filter((m) => (!q.type || q.type === 'all' || m.type === q.type) && (!q.onlyUnread || !m.read))
    .sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())
}

export async function markMessageRead(id: string): Promise<void> {
  await wait(100)
  const m = db.messages.find((x) => x.id === id)
  if (m) {
    m.read = true
    persist()
  }
}

export async function markAllRead(): Promise<void> {
  await wait(120)
  db.messages.forEach((m) => (m.read = true))
  persist()
}

export async function getUnreadCount(): Promise<number> {
  await wait(60)
  return db.messages.filter((m) => !m.read).length
}

/* ---------------- 工作台 ---------------- */

export interface DashboardData {
  totalCapacityTB: number
  usedCapacityTB: number
  usageRate: number
  deviceTotal: number
  deviceOnline: number
  activeAlarms: number
  p1Alarms: number
  openTickets: number
  slaRate: number
  monthWorkHours: number
  capacityTrend: { month: string; used: number; total: number; forecast?: boolean }[]
  alarmTrend: { date: string; P1: number; P2: number; P3: number; P4: number }[]
  alarmDist: { name: string; value: number; level: string }[]
  ticketTrend: { date: string; created: number; closed: number }[]
  serviceTop: { name: string; value: number }[]
  riskPools: StoragePool[]
  todos: { key: string; label: string; count: number; path: string }[]
  duty?: { primary: string; backup: string; secondary: string; phone: string }
  activity: LogEntry[]
  recentTickets: Ticket[]
}

export async function getDashboard(): Promise<DashboardData> {
  await wait(300)
  const totalCapacityTB = Number(db.clusters.reduce((s, c) => s + c.totalTB, 0).toFixed(1))
  const usedCapacityTB = Number(db.clusters.reduce((s, c) => s + c.usedTB, 0).toFixed(1))
  const deviceTotal = db.devices.length
  const deviceOnline = db.devices.filter((d) => d.status === 'online').length
  const activeAlarms = db.alarms.filter((a) => a.status === 'active').length
  const p1Alarms = db.alarms.filter((a) => a.status === 'active' && a.level === 'P1').length
  const openTickets = db.tickets.filter((t) => t.status !== 'closed').length
  const closedTickets = db.tickets.filter((t) => t.status === 'closed')
  const slaOk = closedTickets.filter((t) => t.slaResolveOk)
  const slaRate = closedTickets.length ? Number(((slaOk.length / closedTickets.length) * 100).toFixed(1)) : 100
  const monthKey = dayjs().format('YYYY-MM')
  const monthWorkHours = Number(
    db.tickets.filter((t) => dayjs(t.createdAt).format('YYYY-MM') === monthKey).reduce((s, t) => s + t.workHours, 0).toFixed(1)
  )

  const capacityTrend: DashboardData['capacityTrend'] = []
  for (let i = 11; i >= 0; i--) {
    const m = dayjs().subtract(i, 'month')
    capacityTrend.push({
      month: m.format('YYYY-MM'),
      used: Number((usedCapacityTB * Math.pow(0.973, i)).toFixed(1)),
      total: totalCapacityTB
    })
  }
  for (let i = 1; i <= 6; i++) {
    const m = dayjs().add(i, 'month')
    capacityTrend.push({
      month: m.format('YYYY-MM'),
      used: Number((usedCapacityTB * Math.pow(1.028, i)).toFixed(1)),
      total: totalCapacityTB,
      forecast: true
    })
  }

  const alarmTrend: DashboardData['alarmTrend'] = []
  for (let i = 13; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day')
    const key = d.format('YYYY-MM-DD')
    const dayAlarms = db.alarms.filter((a) => dayjs(a.occurredAt).format('YYYY-MM-DD') === key)
    alarmTrend.push({
      date: d.format('MM-DD'),
      P1: dayAlarms.filter((a) => a.level === 'P1').length,
      P2: dayAlarms.filter((a) => a.level === 'P2').length,
      P3: dayAlarms.filter((a) => a.level === 'P3').length,
      P4: dayAlarms.filter((a) => a.level === 'P4').length
    })
  }

  const levelCount: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0 }
  db.alarms.filter((a) => a.status === 'active').forEach((a) => (levelCount[a.level] += 1))
  const alarmDist = (['P1', 'P2', 'P3', 'P4'] as const).map((lv) => ({ name: `${lv} 告警`, value: levelCount[lv], level: lv }))

  const ticketTrend: DashboardData['ticketTrend'] = []
  for (let i = 13; i >= 0; i--) {
    const key = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    ticketTrend.push({
      date: dayjs(key).format('MM-DD'),
      created: db.tickets.filter((t) => dayjs(t.createdAt).format('YYYY-MM-DD') === key).length,
      closed: db.tickets.filter((t) => t.closedAt && dayjs(t.closedAt).format('YYYY-MM-DD') === key).length
    })
  }

  const serviceTop = db.serviceItems
    .map((s) => ({ name: s.name, value: db.tickets.filter((t) => t.serviceItem === s.name).length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const riskPools = [...db.pools].sort((a, b) => b.usageRate - a.usageRate).slice(0, 5)

  const me = getCurrentUser()
  const todos = [
    { key: 'pending', label: '待受理', count: db.tickets.filter((t) => t.status === 'pending').length, path: '/service/tickets?tab=todo' },
    { key: 'processing', label: '处理中', count: db.tickets.filter((t) => t.status === 'processing' && (!me || me.role !== 'engineer' || t.assignee === me.name)).length, path: '/service/tickets?tab=todo' },
    { key: 'accept', label: '待验收', count: db.tickets.filter((t) => t.status === 'resolved').length, path: '/service/tickets?tab=accept' },
    { key: 'change', label: '待审批变更', count: db.changes.filter((c) => c.status === 'approving').length, path: '/service/changes' }
  ]

  const duty = db.duties[0]

  return {
    totalCapacityTB,
    usedCapacityTB,
    usageRate: Number(((usedCapacityTB / totalCapacityTB) * 100).toFixed(1)),
    deviceTotal,
    deviceOnline,
    activeAlarms,
    p1Alarms,
    openTickets,
    slaRate,
    monthWorkHours,
    capacityTrend,
    alarmTrend,
    alarmDist,
    ticketTrend,
    serviceTop,
    riskPools,
    todos,
    duty: duty ? { primary: duty.primary, backup: duty.backup, secondary: duty.secondary, phone: duty.phone } : undefined,
    activity: [...db.logs].sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf()).slice(0, 8),
    recentTickets: [...db.tickets].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()).slice(0, 6)
  }
}

export async function globalSearch(keyword: string) {
  await wait(180)
  const kw = keyword.trim()
  if (!kw) return []
  const groups: { group: string; items: { id: string; title: string; desc: string; path: string }[] }[] = []
  const clusters = db.clusters.filter((c) => includesKeyword(`${c.name}${c.model}${c.vendor}${c.customerName}`, kw)).slice(0, 4)
  if (clusters.length) groups.push({ group: '存储集群', items: clusters.map((c) => ({ id: c.id, title: c.name, desc: `${c.customerName} · ${c.vendor} ${c.model}`, path: `/resources/clusters/${c.id}` })) })
  const devices = db.devices.filter((d) => includesKeyword(`${d.name}${d.model}${d.vendor}${d.sn}${d.clusterName}`, kw)).slice(0, 4)
  if (devices.length) groups.push({ group: '存储设备', items: devices.map((d) => ({ id: d.id, title: d.name, desc: `${d.vendor} ${d.model} · ${d.clusterName}`, path: `/resources/devices/${d.id}` })) })
  const customers = db.customers.filter((c) => includesKeyword(`${c.name}${c.shortName}`, kw)).slice(0, 3)
  if (customers.length) groups.push({ group: '客户', items: customers.map((c) => ({ id: c.id, title: c.name, desc: `${c.region} · ${c.industryName}`, path: `/customers/${c.id}` })) })
  const pools = db.pools.filter((p) => includesKeyword(`${p.name}${p.clusterName}`, kw)).slice(0, 4)
  if (pools.length) groups.push({ group: '存储池', items: pools.map((p) => ({ id: p.id, title: p.name, desc: `${p.customerName} · 使用率 ${p.usageRate}%`, path: `/resources/pools` })) })
  const tickets = db.tickets.filter((t) => includesKeyword(`${t.id}${t.title}`, kw)).slice(0, 5)
  if (tickets.length) groups.push({ group: '工单', items: tickets.map((t) => ({ id: t.id, title: t.title, desc: `${t.id} · ${t.customerName}`, path: `/service/tickets/${t.id}` })) })
  const kb = db.knowledge.filter((k) => includesKeyword(`${k.title}${k.summary}`, kw)).slice(0, 4)
  if (kb.length) groups.push({ group: '知识库', items: kb.map((k) => ({ id: k.id, title: k.title, desc: k.categoryName, path: `/service/knowledge/${k.id}` })) })
  return groups
}
