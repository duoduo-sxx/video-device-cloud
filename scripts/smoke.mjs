/**
 * 冒烟测试：在 Node 里跑一遍 mock 数据层与 API 层，验证数据规模、关联完整性与核心业务流。
 * 用法：npm run smoke
 */
import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()
// 产物放到 node_modules 缓存目录，避免污染工程根目录
const outFile = path.join(root, 'node_modules/.cache/smoke/smoke.build.mjs')

const entry = `
// ---- 浏览器 API 垫片 ----
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
}

import { createSeed } from './src/mock/seed'
import * as api from './src/api'
import { formatCapacity, formatMoney, fromNow, durationText } from './src/utils/format'
import { renderMarkdown } from './src/utils/markdown'

const fails = []
const ok = (cond, msg) => { if (!cond) fails.push(msg) }
const eq = (actual, expected, msg) => { if (actual !== expected) fails.push(msg + ' 期望 ' + expected + ' 实际 ' + actual) }

// ---------- 1. 数据规模 ----------
const db = createSeed()
const expected = {
  customers: 8, datacenters: 12, clusters: 18, pools: 46, devices: 126, volumes: 320,
  hosts: 86, tickets: 268, alarms: 186, spares: 52, spareRecords: 68, knowledge: 64,
  contracts: 8, changes: 22, inspections: 14, users: 26, logs: 300, messages: 14, duties: 7
}
for (const [k, v] of Object.entries(expected)) {
  eq(db[k].length, v, '数据量 ' + k)
}

// ---------- 2. 关联完整性 ----------
const ids = (arr) => new Set(arr.map((x) => x.id))
const customerIds = ids(db.customers)
const dcNames = new Set(db.datacenters.map((d) => d.name))
const dcIds = new Set(db.datacenters.map((d) => d.id))
const clusterIds = ids(db.clusters)
const poolIds = ids(db.pools)
const deviceIds = ids(db.devices)
const ticketIds = ids(db.tickets)

for (const c of db.clusters) {
  ok(customerIds.has(c.customerId), '集群 ' + c.id + ' 客户不存在')
  ok(dcNames.has(c.datacenter), '集群 ' + c.id + ' 机房名不存在: ' + c.datacenter)
  ok(dcIds.has(c.datacenterId), '集群 ' + c.id + ' 机房编码不存在: ' + c.datacenterId)
  ok(c.rack.startsWith(c.datacenterId), '集群 ' + c.id + ' 机柜号与机房编码不一致')
}
for (const p of db.pools) ok(clusterIds.has(p.clusterId), '存储池 ' + p.id + ' 集群不存在')
for (const d of db.devices) {
  ok(clusterIds.has(d.clusterId), '设备 ' + d.id + ' 集群不存在')
  ok(dcNames.has(d.datacenter), '设备 ' + d.id + ' 机房名不存在: ' + d.datacenter)
  ok(dcIds.has(d.datacenterId), '设备 ' + d.id + ' 机房编码不存在: ' + d.datacenterId)
  if (d.type === 'switch') ok(d.disks.length === 0, '交换机 ' + d.id + ' 不应有磁盘')
  else ok(Array.isArray(d.disks) && d.disks.length > 0, '设备 ' + d.id + ' 无磁盘槽位')
}
for (const v of db.volumes) ok(poolIds.has(v.poolId), '卷 ' + v.id + ' 存储池不存在')
for (const a of db.alarms) {
  const target = a.objectType === 'device' ? deviceIds : a.objectType === 'pool' ? poolIds : clusterIds
  ok(target.has(a.objectId), '告警 ' + a.id + ' 关联对象不存在: ' + a.objectType + ' ' + a.objectId)
  ok(customerIds.has(a.customerId), '告警 ' + a.id + ' 客户不存在')
}
for (const t of db.tickets) {
  ok(customerIds.has(t.customerId), '工单 ' + t.id + ' 客户不存在')
  ok(Array.isArray(t.timeline) && t.timeline.length > 0, '工单 ' + t.id + ' 无时间线')
}
for (const s of db.spareRecords) {
  ok(db.spares.some((x) => x.id === s.spareId), '备件记录 ' + s.id + ' 备件不存在')
  if (s.ticketId) ok(ticketIds.has(s.ticketId), '备件记录 ' + s.id + ' 工单不存在')
}

// 容量口径自洽：已用 <= 总容量
for (const p of db.pools) ok(p.usedTB <= p.totalTB, '存储池 ' + p.id + ' 已用超过总容量')

// ---------- 3. API 层（全部通过接口读取，避免与本地 seed 实例混淆） ----------
const dash = await api.getDashboard()
ok(typeof dash.totalCapacityTB === 'number' && dash.totalCapacityTB > 0, '看板总容量异常')
ok(dash.deviceTotal > 0 && dash.deviceOnline <= dash.deviceTotal, '看板设备数异常')
ok(Array.isArray(dash.capacityTrend) && dash.capacityTrend.length > 0, '容量趋势为空')
ok(Array.isArray(dash.recentTickets), '最近工单为空')

const all = await api.getAllTickets()
const allCount = all.length // getAllTickets 返回的是内部数组引用，先快照长度
const page = await api.getTickets({ page: 1, pageSize: 10 })
eq(page.total, allCount, '工单分页总数')
eq(page.list.length, 10, '工单分页长度')

const customer = (await api.getAllCustomers())[0]
const serviceItems = await api.getServiceItems()
const created = await api.createTicket({
  title: '冒烟测试工单',
  description: '自动化测试创建的工单',
  customerId: customer.id,
  priority: 'P2',
  serviceItem: serviceItems[0].name,
  resourceIds: [],
  resourceNames: [],
  contact: '测试联系人'
})
ok(!!created.id, '创建工单失败')
eq(created.resolveDue.length, 25, 'SLA 应还时间格式')
const afterCreate = await api.getTickets({ page: 1, pageSize: 1 })
eq(afterCreate.total, allCount + 1, '创建后工单总数')

await api.acceptTicket(created.id)
let t = await api.getTicket(created.id)
eq(t.status, 'assigned', '受理后状态')
await api.assignTicket(created.id, '张伟')
t = await api.getTicket(created.id)
eq(t.status, 'processing', '派单后状态')
ok(!!t.assignee, '派单后缺少处理人')
await api.resolveTicket(created.id, '冒烟测试解决')
t = await api.getTicket(created.id)
eq(t.status, 'resolved', '解决后状态')
await api.closeTicket(created.id, customer.contactName, 5, ['响应及时'], '自动化测试')
t = await api.getTicket(created.id)
eq(t.status, 'closed', '关闭后状态')
eq(t.satisfaction, 5, '满意度回写')

const alarms = (await api.getAlarms({ page: 1, pageSize: 300 })).list
const alarm = alarms.find((a) => a.status === 'active')
if (alarm) {
  await api.ackAlarm(alarm.id)
  const after = (await api.getAlarms({ page: 1, pageSize: 300 })).list.find((a) => a.id === alarm.id)
  eq(after.status, 'acked', '告警确认后状态')
}

const spares = (await api.getSpares({ page: 1, pageSize: 200 })).list
const spare = spares.find((s) => s.stock > 0)
if (spare) {
  const before = spare.stock
  await api.outSpare(spare.id, 1, all[0].id, '测试', '冒烟测试领用')
  const after = (await api.getSpares({ page: 1, pageSize: 200 })).list.find((s) => s.id === spare.id)
  eq(after.stock, before - 1, '备件库存扣减')
}

const pool = (await api.getAllPools())[0]
const beforeTB = pool.totalTB
await api.expandPool(pool.id, 10)
const afterPool = (await api.getAllPools()).find((p) => p.id === pool.id)
eq(afterPool.totalTB, beforeTB + 10, '扩容后总容量')
ok(afterPool.freeTB <= afterPool.totalTB, '扩容后剩余容量异常')

const search = await api.globalSearch('华为')
ok(Array.isArray(search) && search.length > 0, '全局搜索无结果')

// ---------- 4. 工具函数 ----------
eq(formatCapacity(1024), '1.00 PB', '容量格式化 PB')
eq(formatCapacity(512), '512 TB', '容量格式化 TB')
ok(formatMoney(12580).includes('12,580'), '金额千分位')
ok(fromNow(new Date(Date.now() - 3600 * 1000)).includes('小时') || fromNow(new Date(Date.now() - 3600 * 1000)).includes('前'), '相对时间')
ok(durationText(90).length > 0, '时长格式化')

// 知识库正文中的 # 标题会降级为 h3 渲染（页面已用 PageHeader 承载 h1）
const html = renderMarkdown('# 标题\\n\\n**加粗** 文本\\n\\n| A | B |\\n| --- | --- |\\n| 1 | 2 |')
ok(html.includes('<h3'), 'Markdown 标题渲染')
ok(html.includes('<strong>'), 'Markdown 粗体渲染')
ok(html.includes('<table>'), 'Markdown 表格渲染')

// ---------- 汇总 ----------
if (fails.length) {
  console.log('FAILED (' + fails.length + ')')
  for (const f of fails.slice(0, 40)) console.log(' - ' + f)
  process.exit(1)
}
console.log('PASS 全部冒烟用例通过（' + (db.tickets.length) + ' 工单 / ' + db.devices.length + ' 设备 / ' + db.alarms.length + ' 告警）')
`

const result = await build({
  stdin: { contents: entry, resolveDir: root, loader: 'ts', sourcefile: 'smoke.ts' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: outFile,
  logLevel: 'warning'
})

if (result.errors.length) {
  console.error('打包失败', result.errors)
  process.exit(1)
}

const run = spawnSync(process.execPath, [outFile], {
  stdio: 'inherit',
  cwd: root
})
process.exit(run.status ?? 1)
