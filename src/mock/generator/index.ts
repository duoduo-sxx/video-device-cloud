/**
 * 业务数据生成器
 * 设计要点：
 * 1. 每个集合使用独立的固定随机种子 -> 生成结果稳定可复现，且与访问顺序无关
 * 2. 集合之间保持外键一致性（设备->通道->告警->工单->租户）
 * 3. 关键指标互相推导（存储用量由通道码率推导、租户用量由真实设备统计）
 * 4. 按需懒加载，避免首屏生成全部数据
 */
import dayjs from 'dayjs'
import { Random } from './random'
import * as D from './dict'
import { avatarUrl, snapshotUrl } from './media'
import type * as T from '@/types'

/* ================= 基础工具 ================= */

const pad = (n: number | string, len: number) => String(n).padStart(len, '0')
const fmt = (v: dayjs.Dayjs | number | string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss')
const dayFmt = (v: dayjs.Dayjs | number | string) => dayjs(v).format('YYYY-MM-DD')

function personName(r: Random) {
  return r.pick(D.SURNAMES.split('')) + r.pick(D.GIVEN_NAMES)
}

function companyName(r: Random, city: string) {
  return city.replace(/市$/, '') + r.pick(D.COMPANY_PREFIX) + r.pick(D.COMPANY_MID) + r.pick(D.COMPANY_SUFFIX)
}

function phone(r: Random) {
  const prefix = r.pick(['138', '139', '137', '136', '135', '159', '158', '188', '186', '177', '199', '152'])
  return prefix + pad(r.int(0, 99999999), 8)
}

/** 生成"业务化"的告警/事件时间：工作时段占多数，夜间以设备类为主 */
function businessTime(r: Random, minDaysAgo: number, maxDaysAgo: number): dayjs.Dayjs {
  const dayOffset = r.int(minDaysAgo, maxDaysAgo)
  let hour: number
  if (r.chance(0.7)) {
    hour = Math.min(19, Math.max(8, Math.round(r.gaussian(13, 2.5))))
  } else {
    hour = r.chance(0.5) ? r.int(0, 7) : r.int(20, 23)
  }
  return dayjs()
    .subtract(dayOffset, 'day')
    .hour(hour)
    .minute(r.int(0, 59))
    .second(r.int(0, 59))
}

/* ================= 组织架构 / 角色 / 用户 ================= */

function buildDepts(): T.Dept[] {
  const r = new Random('depts')
  const list: T.Dept[] = [
    { id: 'D000', name: '云视科技集团', parentId: null, leader: '周明远', phone: phone(r), sort: 0, tenantId: 'T001' }
  ]
  D.DEPARTMENTS.forEach((d, di) => {
    const pid = `D${pad(di + 1, 3)}`
    list.push({ id: pid, name: d.name, parentId: 'D000', leader: personName(r), phone: phone(r), sort: di + 1, tenantId: 'T001' })
    d.children.forEach((c, ci) => {
      list.push({ id: `D${pad(100 + di * 10 + ci, 3)}`, name: c, parentId: pid, leader: personName(r), phone: phone(r), sort: ci + 1, tenantId: 'T001' })
    })
  })
  return list
}

const ALL_MENUS = ['dashboard', 'device', 'storage', 'video', 'ai', 'alarm', 'openapi', 'monitor', 'service', 'tenant', 'billing', 'system']

function buildRoles(): T.Role[] {
  const r = new Random('roles')
  const defs: { name: string; code: string; desc: string; scope: T.Role['dataScope']; menus: string[]; btns: string[] }[] = [
    { name: '平台超级管理员', code: 'admin', desc: '拥有平台全部功能与数据权限', scope: 'all', menus: ALL_MENUS, btns: ['*'] },
    { name: '租户管理员', code: 'tenant_admin', desc: '管理本租户设备、成员、账单与工单', scope: 'tenant', menus: ALL_MENUS.filter((m) => m !== 'tenant'), btns: ['device:add', 'device:edit', 'device:delete', 'user:add', 'user:edit', 'bill:view', 'order:create', 'order:assign'] },
    { name: '运维工程师', code: 'ops_engineer', desc: '负责设备巡检、告警处置与故障排查', scope: 'deptAndChild', menus: ['dashboard', 'device', 'storage', 'video', 'alarm', 'monitor', 'service'], btns: ['device:edit', 'device:reboot', 'alarm:handle', 'order:handle'] },
    { name: '技术支持工程师', code: 'tech_support', desc: '负责工单受理、派单与现场服务', scope: 'dept', menus: ['dashboard', 'service', 'device', 'alarm'], btns: ['order:assign', 'order:handle', 'part:use', 'alarm:handle'] },
    { name: '算法运营', code: 'ai_operator', desc: '负责算法上下架、任务编排与效果分析', scope: 'tenant', menus: ['dashboard', 'ai', 'alarm', 'video', 'device'], btns: ['ai:task:add', 'ai:task:edit', 'ai:task:toggle', 'alarm:handle'] },
    { name: '开发者', code: 'developer', desc: '负责第三方系统对接与接口调用', scope: 'tenant', menus: ['dashboard', 'openapi', 'device', 'alarm'], btns: ['app:add', 'app:reset', 'webhook:edit'] },
    { name: '巡检员', code: 'inspector', desc: '执行定期巡检任务并提交巡检报告', scope: 'self', menus: ['dashboard', 'service', 'device'], btns: ['patrol:execute'] },
    { name: '财务专员', code: 'finance', desc: '负责账单核对、充值确认与发票开具', scope: 'tenant', menus: ['dashboard', 'billing', 'tenant'], btns: ['bill:issue', 'bill:void', 'invoice:issue', 'recharge:audit'] },
    { name: '客户服务专员', code: 'service_agent', desc: '负责客户提单受理与回访', scope: 'dept', menus: ['dashboard', 'service', 'alarm'], btns: ['order:create', 'order:accept', 'visit:execute'] },
    { name: '数据分析师', code: 'analyst', desc: '查看平台运营数据与用量报表', scope: 'tenant', menus: ['dashboard', 'device', 'alarm', 'billing', 'ai'], btns: ['report:export'] },
    { name: '备件管理员', code: 'parts_keeper', desc: '管理备件库存与出入库', scope: 'dept', menus: ['dashboard', 'service'], btns: ['part:in', 'part:out', 'part:edit'] },
    { name: '只读访客', code: 'viewer', desc: '仅可查看，不能进行任何写操作', scope: 'self', menus: ['dashboard', 'device', 'alarm'], btns: [] }
  ]
  return defs.map((d, i) => ({
    id: `R${pad(i + 1, 3)}`,
    name: d.name,
    code: d.code,
    description: d.desc,
    menuPermissions: d.menus,
    buttonPermissions: d.btns,
    dataScope: d.scope,
    userCount: 0,
    status: 1,
    createTime: fmt(dayjs().subtract(r.int(400, 900), 'day'))
  }))
}

const DEMO_ACCOUNTS = [
  { username: 'admin', nickname: '周明远', roleCode: 'admin', deptId: 'D000', desc: '平台超级管理员' },
  { username: 'tenant', nickname: '林晓芸', roleCode: 'tenant_admin', deptId: 'D000', desc: '租户管理员' },
  { username: 'ops', nickname: '赵振华', roleCode: 'ops_engineer', deptId: 'D101', desc: '运维工程师' },
  { username: 'support', nickname: '孙文博', roleCode: 'tech_support', deptId: 'D111', desc: '技术支持工程师' },
  { username: 'ai', nickname: '陈嘉怡', roleCode: 'ai_operator', deptId: 'D121', desc: '算法运营' }
]

function buildUsers(): T.User[] {
  const r = new Random('users')
  const tenants = cached('tenants', buildTenants)
  const roles = cached('roles', buildRoles)
  const depts = cached('depts', buildDepts)
  const list: T.User[] = []

  DEMO_ACCOUNTS.forEach((d, i) => {
    const role = roles.find((x) => x.code === d.roleCode) ?? roles[0]
    const dept = depts.find((x) => x.id === d.deptId) ?? depts[0]
    const tenant = i === 0 ? tenants[0] : tenants[r.int(0, 6)]
    list.push({
      id: `U${pad(i + 1, 4)}`,
      username: d.username,
      nickname: d.nickname,
      avatar: avatarUrl(d.nickname),
      phone: phone(r),
      email: `${d.username}@videocloud.com`,
      roleIds: [role.id],
      roleNames: [role.name],
      deptId: dept.id,
      deptName: dept.name,
      tenantId: tenant.id,
      tenantName: tenant.name,
      status: 1,
      lastLoginTime: fmt(dayjs().subtract(r.int(1, 300), 'minute')),
      lastLoginIp: `10.${r.int(10, 60)}.${r.int(1, 250)}.${r.int(2, 250)}`,
      createTime: fmt(dayjs().subtract(r.int(80, 900), 'day'))
    })
  })

  for (let i = DEMO_ACCOUNTS.length; i < 180; i++) {
    const role = r.pickWeighted(roles, [3, 10, 22, 18, 8, 6, 8, 5, 8, 5, 5, 6])
    const dept = r.pick(depts.filter((d) => d.id !== 'D000'))
    const tenant = r.pick(tenants)
    const nickname = personName(r)
    list.push({
      id: `U${pad(i + 1, 4)}`,
      username: role.code.slice(0, 3) + pad(i + 1, 4),
      nickname,
      avatar: avatarUrl(nickname),
      phone: phone(r),
      email: `user${pad(i + 1, 4)}@videocloud.com`,
      roleIds: [role.id],
      roleNames: [role.name],
      deptId: dept.id,
      deptName: dept.name,
      tenantId: tenant.id,
      tenantName: tenant.name,
      status: r.chance(0.93) ? 1 : 0,
      lastLoginTime: fmt(dayjs().subtract(r.int(1, 60), 'day').hour(r.int(8, 20))),
      lastLoginIp: `10.${r.int(10, 60)}.${r.int(1, 250)}.${r.int(2, 250)}`,
      createTime: fmt(dayjs().subtract(r.int(30, 900), 'day'))
    })
  }
  return list
}

/* ================= 租户 ================= */

function buildTenants(): T.Tenant[] {
  const r = new Random('tenants')
  const list: T.Tenant[] = []
  const usedRegion = new Set<string>()
  for (let i = 0; i < 32; i++) {
    let region = r.pick(D.REGIONS)
    let guard = 0
    while (usedRegion.has(region.city) && guard < 40) {
      region = r.pick(D.REGIONS)
      guard++
    }
    usedRegion.add(region.city)
    const industry = r.pick(D.INDUSTRIES)
    const plan = r.pickWeighted(D.PLAN_NAMES as unknown as string[], [40, 40, 20]) as T.Tenant['planName']
    const status: T.Tenant['status'] = i < 26 ? 'normal' : r.pickWeighted(['arrears', 'suspended', 'expired'] as T.Tenant['status'][], [40, 25, 35])
    list.push({
      id: `T${pad(i + 1, 3)}`,
      name: companyName(r, region.city),
      code: `VC${2019 + (i % 6)}${pad(i + 1, 4)}`,
      industry,
      contact: personName(r),
      phone: phone(r),
      email: `contact${pad(i + 1, 3)}@${['qq.com', '163.com', '126.com', 'outlook.com'][i % 4]}`,
      province: region.province,
      city: region.city,
      planName: plan,
      deviceQuota: plan === '旗舰版' ? r.int(60, 96) : plan === '专业版' ? r.int(36, 60) : r.int(20, 36),
      deviceUsed: 0,
      storageQuotaTB: 0,
      storageUsedTB: 0,
      aiChannelQuota: plan === '旗舰版' ? 120 : plan === '专业版' ? 60 : 20,
      aiChannelUsed: 0,
      balance: status === 'arrears' ? r.float(-3200, -80, 2) : r.float(2000, 68000, 2),
      status,
      expireDate: dayFmt(dayjs().add(r.int(-120, 420), 'day')),
      createTime: fmt(dayjs().subtract(r.int(200, 1500), 'day'))
    })
  }
  return list
}

/* ================= 设备分组 / 存储池 / 设备 / 通道 ================= */

const GROUP_DEFS = [
  { id: 'G01', name: '华东片区', parentId: null },
  { id: 'G02', name: '华南片区', parentId: null },
  { id: 'G03', name: '西部及北部片区', parentId: null },
  { id: 'G0101', name: '园区类', parentId: 'G01' },
  { id: 'G0102', name: '交通类', parentId: 'G01' },
  { id: 'G0103', name: '校园类', parentId: 'G01' },
  { id: 'G0104', name: '工业类', parentId: 'G01' },
  { id: 'G0201', name: '园区类', parentId: 'G02' },
  { id: 'G0202', name: '交通类', parentId: 'G02' },
  { id: 'G0203', name: '校园类', parentId: 'G02' },
  { id: 'G0204', name: '工业类', parentId: 'G02' },
  { id: 'G0301', name: '园区类', parentId: 'G03' },
  { id: 'G0302', name: '交通类', parentId: 'G03' },
  { id: 'G0303', name: '校园类', parentId: 'G03' },
  { id: 'G0304', name: '工业类', parentId: 'G03' }
]

function groupPath(id: string): string {
  const g = GROUP_DEFS.find((x) => x.id === id)!
  const parent = g.parentId ? GROUP_DEFS.find((x) => x.id === g.parentId)! : null
  return parent ? `全部设备/${parent.name}/${g.name}` : `全部设备/${g.name}`
}

function buildDeviceGroups(): T.DeviceGroup[] {
  const leafIds = GROUP_DEFS.filter((g) => g.parentId && g.parentId !== null && g.id.length === 5).map((g) => g.id)
  const map = new Map<string, T.DeviceGroup>()
  leafIds.forEach((id) => {
    const g = GROUP_DEFS.find((x) => x.id === id)!
    map.set(id, { id, name: g.name, parentId: g.parentId, deviceCount: 0 })
  })
  GROUP_DEFS.filter((g) => !g.parentId).forEach((g) => {
    map.set(g.id, { id: g.id, name: g.name, parentId: null, deviceCount: 0 })
  })
  return [...map.values()]
}

function buildStoragePools(): T.StoragePool[] {
  const r = new Random('pools')
  const nodes = cached('nodes', buildNodes)
  const list: T.StoragePool[] = []
  for (let i = 0; i < 24; i++) {
    const region = D.REGIONS[i % D.REGIONS.length]
    const type = r.pickWeighted(['standard', 'ia', 'archive'] as T.StoragePool['type'][], [55, 28, 17])
    const typeName = { standard: '标准存储池', ia: '低频存储池', archive: '归档存储池' }[type]
    const node = r.pick(nodes)
    list.push({
      id: `SP${pad(i + 1, 2)}`,
      name: `${region.abbr}${region.city.replace(/市$/, '')}-${typeName}-${pad(i + 1, 2)}`,
      type,
      region: `${region.province}${region.city}`,
      nodeId: node.id,
      nodeName: node.name,
      capacityTB: 0,
      usedTB: 0,
      usageRate: 0,
      channelCount: 0,
      retentionDays: type === 'archive' ? 180 : type === 'ia' ? 90 : r.pick([30, 45, 60]),
      lifecycleRule: { daysToIA: 7, daysToArchive: type === 'archive' ? 0 : 30, daysToDelete: type === 'archive' ? 365 : 90 },
      status: 'normal',
      createTime: fmt(dayjs().subtract(r.int(200, 1200), 'day'))
    })
  }
  return list
}

function buildDevices(): T.Device[] {
  const r = new Random('devices')
  const tenants = cached('tenants', buildTenants)
  const pools = cached('storagePools', buildStoragePools)
  const list: T.Device[] = []
  const total = 860
  const weights = tenants.map((t) => t.deviceQuota)

  for (let i = 0; i < total; i++) {
    // 按租户配额加权分配设备
    let w = r.next() * weights.reduce((a, b) => a + b, 0)
    let tenant = tenants[0]
    for (let k = 0; k < tenants.length; k++) {
      w -= weights[k]
      if (w <= 0) {
        tenant = tenants[k]
        break
      }
    }
    const region = D.REGIONS.find((x) => x.city === tenant.city) || r.pick(D.REGIONS)
    const cat = r.pickWeighted(D.DEVICE_CATEGORIES, D.DEVICE_CATEGORIES.map((c) => c.ratio * 100))
    const vendor = r.pick(D.VENDORS)
    const model = r.pick(vendor.models)
    const scene = r.pick(D.SCENES)
    const group = r.pick(GROUP_DEFS.filter((g) => g.id.length === 5))
    const pool = pools[i % pools.length]
    const isRecorder = ['NVR', 'DVR'].includes(cat.code)
    const isEdge = cat.code === 'EDGE'
    const online = r.chance(0.87)
    const lastHeartbeat = online ? dayjs().subtract(r.int(2, 55), 'second') : dayjs().subtract(r.int(1, 720), 'hour')
    const resolution = isRecorder ? '1920×1080' : r.pickWeighted(D.RESOLUTIONS, [46, 28, 12, 14])
    const codec = r.pickWeighted(D.CODECS, [58, 38, 4])
    const bitrate = resolution.startsWith('3840') ? r.int(6000, 9000) : resolution.startsWith('2560') ? r.int(3500, 5500) : r.int(1800, 4096)
    const installDate = dayjs().subtract(r.int(30, 1100), 'day')
    const health = online
      ? Math.min(100, r.int(76, 99))
      : r.int(28, 62)

    const tags: string[] = []
    if (r.chance(0.28)) tags.push('重点监控')
    if (resolution.startsWith('3840') || resolution.startsWith('2560')) tags.push('高清')
    if (r.chance(0.35)) tags.push('室外')
    if (r.chance(0.12)) tags.push('防爆')
    if (r.chance(0.1)) tags.push('待验收')
    if (dayjs().diff(installDate, 'day') > 800 && r.chance(0.4)) tags.push('临期维保')

    list.push({
      id: `DEV${pad(i + 1, 4)}`,
      sn: `${vendor.prefix}${dayFmt(installDate).replace(/-/g, '').slice(2, 6)}${pad(r.int(0, 999999), 6)}`,
      name: `${region.abbr}-${scene}-${pad(r.int(1, 60), 2)}`,
      vendor: vendor.name,
      model,
      category: cat.name,
      protocol: r.pickWeighted(D.PROTOCOLS, [42, 24, 18, 12, 4]),
      ip: `10.${10 + tenants.indexOf(tenant)}.${r.int(1, 40)}.${r.int(2, 250)}`,
      port: r.pick([8000, 554, 80, 37777, 34567]),
      mac: Array.from({ length: 6 }, () => pad(r.int(0, 255).toString(16).toUpperCase(), 2)).join(':'),
      firmware: r.pick(D.FIRMWARE_VERSIONS),
      hardwareVersion: `V${r.int(1, 3)}.${r.int(0, 9)}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      groupId: group.id,
      groupPath: groupPath(group.id),
      channelCount: isRecorder ? r.pick([4, 8, 16, 32]) : isEdge ? r.pick([4, 8, 16]) : 1,
      onlineStatus: online ? 'online' : r.chance(0.9) ? 'offline' : 'unknown',
      lastHeartbeat: fmt(lastHeartbeat),
      resolution,
      codec,
      bitrateKbps: bitrate,
      frameRate: r.pick([25, 25, 30, 20, 15]),
      healthScore: health,
      installAddress: `${region.province}${region.city}${r.pick(region.districts)}${scene}`,
      province: region.province,
      city: region.city,
      district: r.pick(region.districts),
      longitude: Number((region.lng + r.float(-0.05, 0.05, 5)).toFixed(5)),
      latitude: Number((region.lat + r.float(-0.05, 0.05, 5)).toFixed(5)),
      installDate: dayFmt(installDate),
      warrantyEndDate: dayFmt(installDate.add(r.pick([2, 3, 5]), 'year')),
      storagePoolId: pool.id,
      storagePoolName: pool.name,
      aiTaskCount: 0,
      alarmsLast7d: 0,
      tags,
      remark: r.chance(0.35) ? r.pick(['点位已调整至新位置，需同步台账', '与相邻点位视角重叠，待优化', '电源取自弱电井，注意防潮', '由施工方代为安装，资料已补录', '关联周界报警主机，联动已开启']) : '',
      createTime: fmt(installDate.hour(r.int(8, 19)))
    })
  }

  // 回填租户设备用量
  tenants.forEach((t) => {
    t.deviceUsed = list.filter((d) => d.tenantId === t.id).length
  })
  return list
}

function buildChannels(): T.Channel[] {
  const r = new Random('channels')
  const devices = cached('devices', buildDevices)
  const list: T.Channel[] = []
  let idx = 0
  devices.forEach((dev) => {
    for (let c = 1; c <= dev.channelCount; c++) {
      idx++
      const online = dev.onlineStatus === 'online' ? r.chance(0.96) : r.chance(0.12)
      list.push({
        id: `CH${pad(idx, 6)}`,
        deviceId: dev.id,
        deviceName: dev.name,
        channelNo: c,
        name: dev.channelCount === 1 ? `${dev.name}-主码流` : `${dev.name}-CH${pad(c, 2)}`,
        onlineStatus: online ? 'online' : 'offline',
        resolution: dev.resolution,
        codec: dev.codec,
        bitrateKbps: dev.bitrateKbps + r.int(-400, 400),
        streamTypes: ['主码流', '子码流', ...(r.chance(0.5) ? ['第三码流'] : [])],
        aiTaskIds: [],
        createTime: dev.createTime
      })
    }
  })

  // 回填存储池用量（由真实通道码率与保存周期推导，保证"用量 = 码率 × 时长 × 天数"）
  const pools = cached('storagePools', buildStoragePools)
  const poolMap = new Map(devices.map((d) => [d.id, d.storagePoolId]))
  const usedMap = new Map<string, { tb: number; ch: number }>()
  list.forEach((ch) => {
    const pid = poolMap.get(ch.deviceId)!
    const pool = pools.find((p) => p.id === pid)!
    const gbPerDay = (ch.bitrateKbps * 86400) / 8 / 1024 / 1024
    const cur = usedMap.get(pid) || { tb: 0, ch: 0 }
    cur.tb += (gbPerDay * pool.retentionDays) / 1024
    cur.ch += 1
    usedMap.set(pid, cur)
  })
  pools.forEach((p) => {
    const u = usedMap.get(p.id) || { tb: 0, ch: 0 }
    p.usedTB = Number(u.tb.toFixed(1))
    p.channelCount = u.ch
    p.capacityTB = Math.max(Math.ceil(u.tb * 1.3), 10)
    p.usageRate = Number(((p.usedTB / p.capacityTB) * 100).toFixed(1))
    p.status = p.usageRate >= 92 ? 'full' : p.usageRate >= 82 ? 'warning' : 'normal'
  })

  return list
}

/* ================= 录像计划 / 转码模板 / 通道业务 ================= */

function buildRecordPlans(): T.RecordPlan[] {
  const r = new Random('plans')
  const pools = cached('storagePools', buildStoragePools)
  const channels = cached('channels', buildChannels)
  const templates: { key: T.RecordPlan['template']; name: string; slots: { start: string; end: string }[]; days: number[] }[] = [
    { key: 'continuous', name: '7×24 全时段录像', slots: [{ start: '00:00', end: '23:59' }], days: [1, 2, 3, 4, 5, 6, 7] },
    { key: 'workday', name: '工作日录像', slots: [{ start: '08:00', end: '18:00' }], days: [1, 2, 3, 4, 5] },
    { key: 'night', name: '夜间重点录像', slots: [{ start: '18:00', end: '23:59' }, { start: '00:00', end: '06:00' }], days: [1, 2, 3, 4, 5, 6, 7] },
    { key: 'motion', name: '事件触发录像', slots: [{ start: '00:00', end: '23:59' }], days: [1, 2, 3, 4, 5, 6, 7] },
    { key: 'custom', name: '自定义时段录像', slots: [{ start: '07:00', end: '12:00' }, { start: '14:00', end: '19:00' }], days: [1, 2, 3, 4, 5, 6] }
  ]
  const names = ['园区主出入口', '教学楼走廊', '生产车间', '仓库周界', '地下车库', '营业厅', '工地塔吊', '变电周界', '机房通道', '道路卡口', '门店收银', '食堂门口']
  const list: T.RecordPlan[] = []
  for (let i = 0; i < 96; i++) {
    const tpl = r.pickWeighted(templates, [40, 18, 14, 18, 10])
    const pick = r.sample(channels, r.int(8, 42))
    const pool = r.pick(pools)
    const timeSlots = tpl.days.flatMap((day) => tpl.slots.map((s) => ({ day, start: s.start, end: s.end })))
    list.push({
      id: `RP${pad(i + 1, 3)}`,
      name: `${r.pick(names)}${tpl.name}`,
      template: tpl.key,
      timeSlots,
      streamType: r.pickWeighted(['main', 'sub', 'third'] as T.RecordPlan['streamType'][], [55, 38, 7]),
      channelIds: pick.map((c) => c.id),
      channelCount: pick.length,
      storagePoolId: pool.id,
      storagePoolName: pool.name,
      retentionDays: pool.retentionDays,
      status: r.chance(0.9) ? 1 : 0,
      creater: personName(r),
      createTime: fmt(dayjs().subtract(r.int(20, 600), 'day'))
    })
  }
  return list
}

function buildTranscodeTemplates(): T.TranscodeTemplate[] {
  const r = new Random('transcode')
  const defs = [
    { name: '1080P 主码流（H.265）', resolution: '1920×1080', bitrateKbps: 4096, frameRate: 25, codec: 'H.265' },
    { name: '1080P 主码流（H.264）', resolution: '1920×1080', bitrateKbps: 4096, frameRate: 25, codec: 'H.264' },
    { name: '720P 子码流（移动端）', resolution: '1280×720', bitrateKbps: 1024, frameRate: 25, codec: 'H.264' },
    { name: 'D1 第三码流（低带宽）', resolution: '704×576', bitrateKbps: 512, frameRate: 15, codec: 'H.264' },
    { name: '4K 超高清（H.265）', resolution: '3840×2160', bitrateKbps: 8192, frameRate: 30, codec: 'H.265' },
    { name: '2K 高清（H.265）', resolution: '2560×1440', bitrateKbps: 6144, frameRate: 30, codec: 'H.265' },
    { name: '国标 SVAC2.0 码流', resolution: '1920×1080', bitrateKbps: 3072, frameRate: 25, codec: 'SVAC2.0' },
    { name: '移动端极速流', resolution: '640×360', bitrateKbps: 384, frameRate: 15, codec: 'H.264' }
  ]
  return defs.map((d, i) => ({
    id: `TC${pad(i + 1, 2)}`,
    name: d.name,
    resolution: d.resolution,
    bitrateKbps: d.bitrateKbps,
    frameRate: d.frameRate,
    codec: d.codec,
    gop: r.pick([25, 50, 75, 100]),
    audio: r.pick(['G.711A', 'AAC', 'G.726', '无音频']),
    isDefault: i === 0,
    usageCount: r.int(3, 260),
    createTime: fmt(dayjs().subtract(r.int(60, 700), 'day'))
  }))
}

/* ================= 算法 / AI 任务 ================= */

function buildAlgorithms(): T.Algorithm[] {
  const r = new Random('algorithms')
  return D.ALGORITHMS.map((a, i) => ({
    id: `ALG${pad(i + 1, 3)}`,
    name: a.name,
    code: a.code,
    vendor: a.vendor,
    version: `v${r.int(1, 4)}.${r.int(0, 9)}.${r.int(0, 9)}`,
    type: a.type,
    accuracy: a.accuracy,
    detectCost: r.int(28, 180),
    maxResolution: r.pick(['1920×1080', '2560×1440', '3840×2160']),
    gpuCost: a.gpuCost,
    price: a.price,
    hot: i < 5,
    status: 1,
    description: `${a.name}算法基于深度卷积网络，可对视频流进行实时分析，识别结果以结构化数据与抓图形式输出，支持与告警中心联动。适用于${a.scenes.join('、')}等场景，支持 ROI 区域配置与置信度阈值调节。`,
    scenes: a.scenes,
    updateTime: fmt(dayjs().subtract(r.int(5, 200), 'day'))
  }))
}

function buildAiTasks(): T.AiTask[] {
  const r = new Random('aitasks')
  const algs = cached('algorithms', buildAlgorithms)
  const channels = cached('channels', buildChannels)
  const list: T.AiTask[] = []
  const namePrefix = ['周界防护', '出入口管控', '生产安全', '消防预警', '人员管理', '车辆管理', '环境监测', '行为规范']
  const alarmLevels: T.AlarmLevel[] = ['urgent', 'major', 'minor', 'info']

  for (let i = 0; i < 68; i++) {
    const alg = r.pick(algs)
    const pick = r.sample(channels, r.int(2, 12))
    const status = r.pickWeighted(['running', 'stopped', 'abnormal'] as T.AiTask['status'][], [78, 16, 6])
    const roiCount = r.int(1, 3)
    list.push({
      id: `AIT${pad(i + 1, 3)}`,
      name: `${r.pick(namePrefix)}-${alg.name}-${pad(i + 1, 2)}`,
      algorithmId: alg.id,
      algorithmName: alg.name,
      channelIds: pick.map((c) => c.id),
      channelCount: pick.length,
      schedule: { startTime: '00:00', endTime: '23:59', days: [1, 2, 3, 4, 5, 6, 7] },
      roi: Array.from({ length: roiCount }, () => ({
        x: r.int(20, 200),
        y: r.int(20, 120),
        w: r.int(60, 180),
        h: r.int(40, 120)
      })),
      threshold: r.float(0.6, 0.92, 2),
      alarmLevel: r.pick(alarmLevels),
      status,
      gpuUsage: status === 'running' ? r.float(6, 42, 1) : 0,
      eventsToday: status === 'running' ? r.int(0, 46) : 0,
      accuracy: Number((alg.accuracy + r.float(-3.5, 1.2, 1)).toFixed(1)),
      createTime: fmt(dayjs().subtract(r.int(10, 400), 'day'))
    })
  }
  return list
}

/* ================= 告警 / 事件 ================= */

const ALARM_TITLES: Record<string, string[]> = {
  设备离线: ['设备离线，请及时检查链路与供电', '设备心跳超时，已连续 3 次未上报'],
  视频遮挡: ['镜头疑似被遮挡，画面大面积异常', '检测到画面持续遮挡，请核实点位'],
  移动侦测: ['监测区域内出现移动目标', '警戒时段检测到画面变化'],
  区域入侵: ['检测到人员进入警戒区域', '有目标闯入受保护区域'],
  越界侦测: ['检测到目标穿越警戒线', '越界行为告警，请注意核实'],
  视频信号丢失: ['视频信号中断，无可解码数据', '通道无信号输入，请检查接线'],
  硬盘异常: ['存储硬盘状态异常，可能存在坏道', '硬盘健康度下降，建议尽快更换'],
  存储空间将满: ['存储池使用率超过告警阈值', '录像存储空间即将写满'],
  设备温度过高: ['设备主板温度超过安全阈值', '设备温度异常，请检查散热环境'],
  网络抖动: ['网络时延抖动明显，存在丢包', '上行带宽波动，视频可能出现卡顿'],
  人形检测: ['检测到人员活动', '识别到人员进入监控范围'],
  车辆检测: ['检测到车辆进入/驶离', '识别到车辆停靠'],
  车牌识别: ['识别到车牌，已记录通行信息', '车辆通行记录已生成'],
  未戴安全帽: ['检测到人员未佩戴安全帽', '存在未佩戴劳保用品行为'],
  烟火检测: ['检测到疑似烟火，请立即核实', '识别到明火/烟雾特征'],
  人员离岗: ['值守人员离开岗位超过设定时长', '检测到岗位无人值守'],
  客流统计: ['客流统计数据已更新', '区域人数超过设定阈值'],
  电动车进电梯: ['检测到电动车进入电梯轿厢', '识别到电瓶车进入电梯'],
  垃圾满溢: ['垃圾容器已满溢，请安排清运', '检测到垃圾堆积'],
  人员聚集: ['检测到人员异常聚集', '区域人群密度超过阈值']
}

function buildAlarms(): T.Alarm[] {
  const r = new Random('alarms')
  const devices = cached('devices', buildDevices)
  const channels = cached('channels', buildChannels)
  const users = cached('users', buildUsers)
  const handlers = users.filter((u) => ['运维工程师', '技术支持工程师', '客户服务专员'].includes(u.roleNames[0])).map((u) => u.nickname)
  const list: T.Alarm[] = []
  const statusWeight: T.AlarmStatus[] = ['pending', 'processing', 'resolved', 'closed', 'false_alarm']
  const statusW = [16, 12, 40, 24, 8]
  const chByDevice = new Map<string, T.Channel[]>()
  channels.forEach((c) => {
    const arr = chByDevice.get(c.deviceId) || []
    arr.push(c)
    chByDevice.set(c.deviceId, arr)
  })
  const perDeviceCount = new Map<string, number>()

  for (let i = 0; i < 6000; i++) {
    const dev = r.pick(devices)
    const type = r.pickWeighted(D.ALARM_TYPES, D.ALARM_TYPES.map((t) => t.weight))
    const chList = chByDevice.get(dev.id) || []
    const ch = chList.length ? r.pick(chList) : null
    const occur = businessTime(r, 0, 180)
    const dur = type.durationRange ? r.int(type.durationRange[0], type.durationRange[1]) : r.int(1, 45)
    const status = r.pickWeighted(statusWeight, statusW)
    const level: T.AlarmLevel =
      type.name === '烟火检测' || type.name === '区域入侵'
        ? r.pickWeighted(['urgent', 'major', 'minor'] as T.AlarmLevel[], [45, 40, 15])
        : type.name === '设备离线'
          ? r.pickWeighted(['major', 'minor', 'urgent'] as T.AlarmLevel[], [40, 45, 15])
          : (r.pickWeighted(D.ALARM_LEVELS, D.ALARM_LEVELS.map((l) => l.weight)).value as T.AlarmLevel)
    const handled = !['pending', 'processing'].includes(status)
    const handler = handled || status === 'processing' ? r.pick(handlers) : ''
    const handleTime = handled ? fmt(occur.add(r.int(4, 480), 'minute')) : status === 'processing' ? null : null
    const recover = status === 'resolved' || status === 'closed' ? occur.add(dur, 'minute') : null
    const chLabel = ch ? `${dev.name}-CH${pad(ch.channelNo, 2)}` : dev.name

    perDeviceCount.set(dev.id, (perDeviceCount.get(dev.id) || 0) + 1)
    if (dayjs().diff(occur, 'day') <= 7) {
      // 近 7 天计数稍后统一回填
    }

    list.push({
      id: `AL${pad(i + 1, 6)}`,
      alarmNo: `AL${occur.format('YYYYMMDD')}${pad(i + 1, 5)}`,
      title: `${type.name}：${r.pick(ALARM_TITLES[type.name] || ['发生异常事件'])}`,
      type: type.name,
      category: type.category as T.AlarmCategory,
      level,
      deviceId: dev.id,
      deviceName: dev.name,
      channelNo: ch ? ch.channelNo : 1,
      tenantId: dev.tenantId,
      tenantName: dev.tenantName,
      region: `${dev.province}${dev.city}`,
      description: `${dev.name}（${dev.category} ${dev.model}，IP ${dev.ip}）${chLabel ? `通道 ${chLabel}` : ''}于 ${fmt(occur)} 触发「${type.name}」告警，持续 ${dur} 分钟。设备所属租户：${dev.tenantName}，安装位置：${dev.installAddress}。`,
      snapshotUrl: snapshotUrl(dev.id + type.name + i, chLabel, occur.format('YYYY-MM-DD HH:mm:ss')),
      confidence: type.category === 'ai' ? r.float(0.72, 0.99, 2) : 0,
      algorithmName: type.category === 'ai' ? r.pick(D.ALGORITHMS.map((a) => a.name)) : '',
      occurTime: fmt(occur),
      recoverTime: recover ? fmt(recover) : null,
      duration: dur,
      status,
      handler,
      handleTime,
      handleRemark: handled ? r.pick(['已远程重启设备，心跳恢复正常', '现场核实为树木遮挡，已修剪', '属误报，已调整侦测灵敏度', '已更换故障电源适配器', '已联系客户确认，为计划停电', '已清理镜头灰尘并复核画面']) : '',
      relatedWorkOrderId: null
    })
  }

  // 回填设备侧统计
  const sevenDaysAgo = dayjs().subtract(7, 'day').valueOf()
  const statMap = new Map<string, { all: number; last7: number }>()
  list.forEach((a) => {
    const s = statMap.get(a.deviceId) || { all: 0, last7: 0 }
    s.all += 1
    if (dayjs(a.occurTime).valueOf() >= sevenDaysAgo) s.last7 += 1
    statMap.set(a.deviceId, s)
  })
  devices.forEach((d) => {
    d.alarmsLast7d = (statMap.get(d.id) || { last7: 0 }).last7
    d.healthScore = Math.max(20, Math.min(99, d.healthScore - Math.min(18, d.alarmsLast7d * 2)))
  })
  return list
}

/* ================= 工程师 / 备件 / 知识库 / 服务目录 ================= */

function buildEngineers(): T.Engineer[] {
  const r = new Random('engineers')
  const names = ['赵振华', '孙文博', '李海涛', '王俊杰', '吴晓明', '郑雪莲', '冯雅琴', '陈嘉怡', '褚宇航', '卫浩然', '蒋立诚', '沈德明', '韩丽娜', '杨天威']
  const skillPool = ['摄像机安装调试', 'NVR 配置', '网络排障', '光缆熔接', '平台部署', 'AI 算法调优', '存储扩容', '弱电施工', '客户培训', '高空作业']
  const regions = [...new Set(D.REGIONS.map((x) => x.city))].slice(0, 14)
  return names.map((name, i) => {
    const load = r.int(0, 9)
    return {
      id: `EN${pad(i + 1, 3)}`,
      name,
      phone: phone(r),
      skills: r.sample(skillPool, r.int(3, 5)),
      region: regions[i % regions.length],
      level: r.pickWeighted(['初级', '中级', '高级', '专家'] as T.Engineer['level'][], [18, 42, 28, 12]),
      currentLoad: load,
      maxLoad: r.int(8, 12),
      satisfaction: r.float(4.2, 5.0, 1),
      finishedOrders: r.int(40, 620),
      onTimeRate: r.float(88, 99.6, 1),
      status: load >= 8 ? 'busy' : load === 0 ? 'idle' : r.chance(0.85) ? 'busy' : 'off'
    }
  })
}

function buildSpareParts(): T.SparePart[] {
  const r = new Random('parts')
  const list: T.SparePart[] = []
  const locations = ['杭州中心仓', '深圳分仓', '成都分仓', '武汉分仓', '西安分仓', '现场服务车-A', '现场服务车-B']
  for (let i = 0; i < 120; i++) {
    const base = D.SPARE_PART_CATALOG[i % D.SPARE_PART_CATALOG.length]
    const warning = r.int(4, 16)
    const stock = r.chance(0.14) ? r.int(0, warning) : r.int(warning + 2, warning * 8)
    const inOut = Array.from({ length: r.int(3, 10) }, () => {
      const type: 'in' | 'out' = r.chance(0.42) ? 'in' : 'out'
      return {
        type,
        quantity: r.int(1, 12),
        operator: personName(r),
        time: fmt(dayjs().subtract(r.int(1, 240), 'day').hour(r.int(9, 18))),
        workOrderNo: type === 'out' ? `WO${dayjs().subtract(r.int(1, 200), 'day').format('YYYYMMDD')}${pad(r.int(1, 400), 4)}` : ''
      }
    })
    list.push({
      id: `PT${pad(i + 1, 3)}`,
      name: base.name + (i >= 20 ? `（批次 ${String.fromCharCode(65 + (i % 6))}）` : ''),
      model: base.model,
      category: base.category,
      stock,
      warningStock: warning,
      unit: r.pick(['台', '个', '块', '套', '米', '卷']),
      price: Number((base.price * r.float(0.92, 1.08, 2)).toFixed(2)),
      location: r.pick(locations),
      supplier: r.pick(['海康威视授权经销', '大华股份授权经销', '宇视科技授权经销', '华为企业业务伙伴', '普联技术授权经销', '科华数据服务商']),
      status: stock === 0 ? 'out' : stock <= warning ? 'low' : 'normal',
      inOutRecords: inOut
    })
  }
  return list
}

function buildKnowledge(): T.KnowledgeArticle[] {
  const r = new Random('knowledge')
  const list: T.KnowledgeArticle[] = []
  const sceneList = ['园区', '校园', '施工工地', '数据中心', '加油站', '连锁门店', '变电站', '地下车库']
  const topicList = ['区域入侵检测', '设备批量升级', '录像丢失排查', '告警阈值调优', '存储容量规划', '网络抖动定位', 'AI 任务编排', '设备台账核对', '镜头清洁维护', '接口对接', '巡检模板配置', '断电恢复策略']
  const verbs = ['配置要点', '实施步骤', '常见问题汇总', '最佳实践', '风险提示', '验收标准']

  D.KNOWLEDGE_TITLES.forEach((title, i) => {
    list.push(makeArticle(r, title, i))
  })
  for (let i = D.KNOWLEDGE_TITLES.length; i < 80; i++) {
    const title = `${r.pick(sceneList)}场景下${r.pick(topicList)}的${r.pick(verbs)}`
    list.push(makeArticle(r, title, i))
  }
  return list

  function makeArticle(rr: Random, title: string, i: number): T.KnowledgeArticle {
    const author = personName(rr)
    return {
      id: `KB${pad(i + 1, 3)}`,
      title,
      category: rr.pick(D.KNOWLEDGE_CATEGORIES),
      tags: rr.sample(['GB28181', 'ONVIF', '存储', '告警', 'AI', '网络', '巡检', '固件', '云平台', '安全'], rr.int(2, 4)),
      author,
      views: rr.int(120, 8600),
      likes: rr.int(3, 420),
      content: `## 问题现象\n\n客户反馈在${rr.pick(sceneList)}场景中，${rr.pick(['设备频繁掉线', '画面出现花屏', '录像存在缺失', '告警重复推送', 'AI 识别准确率下降', '存储写入速率偏低'])}，影响正常使用，需给出可执行的排查与优化方案。\n\n## 排查步骤\n\n1. **确认影响范围**：统计受影响设备数量、点位分布与时间段，判断是个体问题还是批量问题。\n2. **检查网络链路**：使用 ping / mtr 检测丢包与时延，重点检查交换机端口错包、环路与供电情况。\n3. **核对平台侧数据**：查看设备心跳记录、最近一次告警与录像完整性抽检结果。\n4. **现场核实**：检查镜头状态、供电电压、接线端子与防护措施。\n\n## 处理方案\n\n- 若为网络问题，优先排查 PoE 交换机端口与光模块，必要时更换为独立链路。\n- 若为平台配置问题，调整心跳周期与超时阈值，避免误判离线。\n- 若为设备硬件问题，按备件更换流程申请同型号设备并登记台账。\n\n## 注意事项\n\n- 现场作业需遵守高空作业与用电安全规范，作业前完成风险确认。\n- 涉及平台配置变更需在维护窗口内执行，并提前通知客户。\n- 处理完成后需在工单中补充现场照片与处理结论，便于后续回访。`,
      publishTime: fmt(dayjs().subtract(rr.int(10, 700), 'day')),
      status: rr.chance(0.94) ? 1 : 0
    }
  }
}

function buildServiceCatalog(): T.ServiceItem[] {
  const r = new Random('servicecatalog')
  const defs = [
    { name: '设备安装调试', desc: '含现场勘察、支架安装、线路敷设、参数调试与上线验收', hours: 4, price: 320, sla: 48, target: '新装点位' },
    { name: '故障报修处理', desc: '针对设备离线、画面异常、录像缺失等故障提供远程或上门处理', hours: 2, price: 260, sla: 4, target: '在用设备' },
    { name: '定期巡检服务', desc: '按季度对设备状态、录像完整性、存储水位进行全面巡检并出具报告', hours: 8, price: 1800, sla: 72, target: '全量设备' },
    { name: '系统升级服务', desc: '平台版本升级、固件批量升级与回归验证', hours: 6, price: 2400, sla: 120, target: '平台与设备' },
    { name: '使用培训服务', desc: '面向客户运维人员的平台操作、告警处置与日常维护培训', hours: 6, price: 2000, sla: 168, target: '客户团队' },
    { name: '驻场运维服务', desc: '工程师驻场提供日常值守、故障响应与运行报告（按人天计）', hours: 8, price: 1600, sla: 2, target: '大型项目' },
    { name: '定制开发服务', desc: '针对客户业务需求进行接口对接、看板定制或流程改造（按人天计）', hours: 8, price: 3600, sla: 240, target: '有定制需求客户' }
  ]
  return defs.map((d, i) => ({
    id: `SV${pad(i + 1, 2)}`,
    name: d.name,
    description: d.desc,
    workHours: d.hours,
    price: d.price,
    slaResponseHours: d.sla,
    target: d.target,
    status: 1
  }))
}

/* ================= 工单 ================= */

function buildWorkOrders(): T.WorkOrder[] {
  const r = new Random('workorders')
  const alarms = cached('alarms', buildAlarms)
  const devices = cached('devices', buildDevices)
  const engineers = cached('engineers', buildEngineers)
  const parts = cached('spareParts', buildSpareParts)
  const services = cached('serviceCatalog', buildServiceCatalog)
  const list: T.WorkOrder[] = []
  const statusWeight: T.WorkOrderStatus[] = ['pending', 'assigned', 'processing', 'verifying', 'completed', 'closed']
  const statusW = [12, 14, 17, 9, 38, 10]

  for (let i = 0; i < 1500; i++) {
    const source = r.pickWeighted(['alarm', 'customer', 'plan'] as T.WorkOrder['source'][], [58, 32, 10])
    const dev = r.pick(devices)
    const svc = r.pick(services)
    const status = r.pickWeighted(statusWeight, statusW)
    const createTime = businessTime(r, status === 'pending' ? 0 : 3, 175)
    const priority: T.AlarmLevel = r.pickWeighted(['urgent', 'major', 'minor', 'info'] as T.AlarmLevel[], [10, 26, 42, 22])
    const eng = r.pick(engineers)
    const slaHours = priority === 'urgent' ? 4 : priority === 'major' ? 8 : priority === 'minor' ? 24 : 48
    const slaDeadline = createTime.add(slaHours, 'hour')
    const assigned = status !== 'pending'
    const arrived = ['processing', 'verifying', 'completed', 'closed'].includes(status)
    const finished = ['completed', 'closed'].includes(status)
    const arriveTime = arrived ? createTime.add(r.int(30, 300), 'minute') : null
    const finishTime = finished ? (arriveTime || createTime).add(r.int(40, 900), 'minute') : null
    const finishTs = finishTime ? dayjs(finishTime) : dayjs()
    const slaStatus: T.SlaStatus = finished
      ? finishTs.isAfter(slaDeadline)
        ? 'overdue'
        : 'normal'
      : dayjs().isAfter(slaDeadline)
        ? 'overdue'
        : dayjs().add(slaDeadline.diff(dayjs(), 'hour') * 0.25, 'hour').isAfter(slaDeadline)
          ? 'warning'
          : 'normal'
    const usedParts = r.chance(0.42) ? r.sample(parts, r.int(1, 3)) : []
    const cost = Number((svc.price + usedParts.reduce((a, p) => a + p.price, 0)).toFixed(2))

    // 关联一条真实告警（告警 -> 工单 双向关联）
    let alarm: T.Alarm | null = null
    if (source === 'alarm') {
      const cand = alarms.filter((a) => a.deviceId === dev.id && !a.relatedWorkOrderId)
      alarm = cand.length ? r.pick(cand) : null
    }

    const logs: T.WorkOrderLog[] = [{ time: fmt(createTime), operator: source === 'alarm' ? '系统自动' : personName(r), action: '创建工单', remark: source === 'alarm' ? '由告警中心自动转单' : '客户提交服务请求' }]
    if (assigned) logs.push({ time: fmt(createTime.add(r.int(5, 60), 'minute')), operator: '调度员', action: '派单', remark: `派单给 ${eng.name}（${eng.level}工程师，${eng.region}）` })
    if (arrived) logs.push({ time: fmt(arriveTime!), operator: eng.name, action: '到达现场', remark: '已完成现场签到，开始处理' })
    if (finished)
      logs.push({
        time: fmt(finishTime!),
        operator: eng.name,
        action: '处理完成',
        remark: r.pick(['已更换故障部件并测试正常', '已重新配置参数并观察 30 分钟无异常', '已完成清洁与紧固，画面恢复正常', '已调整算法阈值，误报消除'])
      })
    if (status === 'verifying') logs.push({ time: fmt(dayjs().subtract(r.int(1, 48), 'hour')), operator: eng.name, action: '提交验收', remark: '已提交处理结果，等待客户确认' })
    if (status === 'closed') logs.push({ time: fmt(finishTime!.add(r.int(1, 72), 'hour')), operator: '客服专员', action: '客户确认关闭', remark: '客户确认问题已解决' })

    const order: T.WorkOrder = {
      id: `WO${pad(i + 1, 5)}`,
      orderNo: `WO${createTime.format('YYYYMMDD')}${pad(i + 1, 4)}`,
      title: `${svc.name}｜${dev.name}`,
      type: svc.name === '故障报修处理' ? '故障报修' : svc.name,
      priority,
      source,
      customerId: dev.tenantId,
      customerName: dev.tenantName,
      deviceId: dev.id,
      deviceName: dev.name,
      alarmId: alarm ? alarm.id : null,
      description:
        source === 'alarm'
          ? `由告警「${alarm ? alarm.title : '设备异常'}」自动转单。设备 ${dev.name}（${dev.model}）位于 ${dev.installAddress}，需现场核实并排除故障。`
          : r.pick([
              `客户反馈 ${dev.name} 点位画面异常，影响日常查看，请安排工程师上门处理。`,
              `客户申请新增 ${dev.name} 点位的录像保存周期至 90 天，请评估存储容量后处理。`,
              `按季度巡检计划，对 ${dev.name} 及周边点位进行例行巡检并提交报告。`,
              `客户要求对 ${dev.name} 的告警灵敏度进行调整，减少误报。`
            ]),
      attachments: Array.from({ length: r.int(0, 3) }, (_, k) => snapshotUrl(dev.id + 'attach' + k + i, dev.name, '现场照片')),
      status,
      creator: personName(r),
      createTime: fmt(createTime),
      assignee: assigned ? eng.name : '',
      assigneePhone: assigned ? eng.phone : '',
      assignTime: assigned ? fmt(createTime.add(r.int(5, 60), 'minute')) : null,
      arriveTime: arriveTime ? fmt(arriveTime) : null,
      finishTime: finishTime ? fmt(finishTime) : null,
      slaDeadline: fmt(slaDeadline),
      slaStatus,
      handlerLogs: logs,
      partsUsed: usedParts.map((p) => ({ partId: p.id, partName: p.name, quantity: r.int(1, 3), price: p.price })),
      cost,
      satisfaction: finished ? r.float(3.6, 5, 1) : 0,
      satisfactionRemark: finished && r.chance(0.5) ? r.pick(['响应迅速，处理专业', '希望下次能提前告知上门时间', '工程师讲解清晰，服务态度好', '问题已解决，但等待时间略长']) : '',
      visitResult: finished ? r.pickWeighted(['satisfied', 'normal', 'unsatisfied'] as T.WorkOrder['visitResult'][], [72, 22, 6]) : ''
    }
    if (alarm) alarm.relatedWorkOrderId = order.id
    list.push(order)
  }
  return list
}

/* ================= 运维监控 ================= */

function buildNodes(): T.ClusterNode[] {
  const r = new Random('nodes')
  const list: T.ClusterNode[] = []
  for (let i = 0; i < 46; i++) {
    const region = D.REGIONS[i % D.REGIONS.length]
    const isCenter = i < 6
    const cpu = r.float(14, 86, 1)
    const mem = r.float(22, 88, 1)
    const disk = r.float(30, 94, 1)
    const status: T.ClusterNode['status'] = cpu > 85 || disk > 92 || mem > 88 ? 'warning' : r.chance(0.03) ? 'offline' : 'online'
    list.push({
      id: `ND${pad(i + 1, 2)}`,
      name: `${isCenter ? '中心' : '边缘'}-${region.abbr}${region.city.replace(/市$/, '')}-${pad(i + 1, 2)}`,
      type: isCenter ? 'center' : 'edge',
      region: `${region.province}${region.city}`,
      ip: isCenter ? `172.16.${r.int(0, 8)}.${r.int(10, 200)}` : `10.${60 + (i % 12)}.${r.int(1, 60)}.${r.int(2, 250)}`,
      cpuUsage: cpu,
      memUsage: mem,
      diskUsage: disk,
      gpuUsage: isCenter ? r.float(10, 92, 1) : r.float(0, 46, 1),
      bandwidthMbps: isCenter ? r.int(600, 4200) : r.int(80, 900),
      runningTasks: r.int(2, 68),
      deviceCount: r.int(4, 96),
      status,
      uptime: r.int(3600, 86400 * 180),
      version: r.pick(['v3.6.2', 'v3.7.0', 'v3.7.4', 'v4.0.1', 'v4.1.0']),
      lastReportTime: fmt(dayjs().subtract(r.int(3, 200), 'second'))
    })
  }
  return list
}

function buildMicroServices(): T.MicroService[] {
  const r = new Random('services')
  return D.MICRO_SERVICES.map((s, i) => {
    const replicas = r.int(2, 8)
    const healthy = r.chance(0.82) ? replicas : replicas - r.int(1, 2)
    const errorRate = r.float(0.01, 3.4, 2)
    const status: T.MicroService['status'] = healthy < replicas ? 'degraded' : errorRate > 3 ? 'fused' : errorRate > 1.5 ? 'degraded' : 'healthy'
    return {
      id: `MS${pad(i + 1, 2)}`,
      name: s.name,
      code: s.code,
      replicas,
      healthyReplicas: healthy,
      qps: r.int(80, 4200),
      avgLatency: r.int(8, 320),
      errorRate,
      status,
      dependsOn: s.depends,
      version: r.pick(['v3.7.4', 'v4.0.1', 'v4.1.0'])
    }
  })
}

function buildLogEntries(): T.LogEntry[] {
  const r = new Random('logs')
  const svc = D.MICRO_SERVICES.map((s) => s.name)
  const templates: { level: T.LogEntry['level']; msg: string }[] = [
    { level: 'INFO', msg: '设备心跳上报正常 deviceId=DEV{id} rtt={n}ms' },
    { level: 'INFO', msg: '开始拉取实时流 channelId=CH{id} protocol=GB28181' },
    { level: 'INFO', msg: '录像分片写入成功 channelId=CH{id} size={n}MB' },
    { level: 'WARN', msg: '设备心跳超时，进入重连队列 deviceId=DEV{id} retry={n}' },
    { level: 'WARN', msg: '存储节点写入延迟偏高 nodeId=ND{n} latency={n}ms' },
    { level: 'WARN', msg: 'AI 任务队列积压，已触发扩容 taskId=AIT{n}' },
    { level: 'ERROR', msg: '拉流失败，无可用媒体节点 channelId=CH{id} code=50314' },
    { level: 'ERROR', msg: '数据库连接池耗尽，已触发熔断 code=DB_POOL_EXHAUSTED' },
    { level: 'INFO', msg: '告警消息推送成功 alarmId=AL{id} channel=webhook' },
    { level: 'DEBUG', msg: '开放平台接口调用 /api/v1/devices appId=APP{n} cost={n}ms' }
  ]
  const list: T.LogEntry[] = []
  for (let i = 0; i < 800; i++) {
    const t = r.pickWeighted(templates, templates.map((x) => (x.level === 'INFO' ? 50 : x.level === 'WARN' ? 22 : x.level === 'ERROR' ? 10 : 18)))
    list.push({
      id: `LG${pad(i + 1, 5)}`,
      traceId: Array.from({ length: 32 }, () => '0123456789abcdef'[r.int(0, 15)]).join(''),
      service: r.pick(svc),
      level: t.level,
      content: t.msg.replace(/\{id\}/g, () => pad(r.int(1, 860), 4)).replace(/\{n\}/g, () => String(r.int(2, 980))),
      ip: `10.${r.int(10, 70)}.${r.int(1, 250)}.${r.int(2, 250)}`,
      duration: r.int(1, 1800),
      createTime: fmt(dayjs().subtract(r.int(0, 7), 'day').hour(r.int(0, 23)).minute(r.int(0, 59)))
    })
  }
  return list.sort((a, b) => (a.createTime < b.createTime ? 1 : -1))
}

function buildPatrolTasks(): T.PatrolTask[] {
  const r = new Random('patrol')
  const list: T.PatrolTask[] = []
  const scopes = ['华东片区全部点位', '华南片区园区类点位', '校园类点位专项', '工业类点位专项', '存储容量专项巡检', '固件一致性专项', 'AI 任务运行状态专项', '雨季防护专项', '高温季设备散热专项', '节前安全大检查', '机房环境专项', '告警处置及时性专项']
  for (let i = 0; i < 12; i++) {
    const status = r.pickWeighted(['running', 'completed', 'completed', 'completed', 'failed', 'pending'] as T.PatrolTask['status'][], [12, 50, 20, 10, 4, 4])
    const deviceCount = r.int(20, 420)
    const abnormal = status === 'completed' ? r.int(0, 24) : 0
    const skipped = status === 'completed' ? r.int(0, 12) : 0
    list.push({
      id: `PT${pad(i + 1, 3)}`,
      name: scopes[i],
      scope: r.pick(['全部租户', '指定租户', '指定分组', '指定设备']),
      items: r.sample(D.PATROL_ITEMS, r.int(4, 8)),
      deviceCount,
      normalCount: status === 'completed' ? deviceCount - abnormal - skipped : 0,
      abnormalCount: abnormal,
      skippedCount: skipped,
      progress: status === 'completed' ? 100 : status === 'running' ? r.int(8, 92) : 0,
      status,
      executor: personName(r),
      createTime: fmt(dayjs().subtract(r.int(1, 90), 'day')),
      finishTime: status === 'completed' || status === 'failed' ? fmt(dayjs().subtract(r.int(1, 80), 'day')) : null
    })
  }
  return list
}

function buildQualityChecks(): T.QualityCheckTask[] {
  const r = new Random('quality')
  const devices = cached('devices', buildDevices)
  const items = ['丢包检测', '卡顿检测', '花屏检测', '黑屏检测', '亮度异常', '偏色检测', '遮挡检测', '雪花噪声']
  const list: T.QualityCheckTask[] = []
  for (let i = 0; i < 60; i++) {
    const dev = r.pick(devices)
    const status = r.pickWeighted(['completed', 'completed', 'running', 'failed', 'pending'] as T.QualityCheckTask['status'][], [68, 12, 8, 6, 6])
    const score = status === 'completed' ? r.int(46, 99) : 0
    const problemPool = ['视频卡顿', '画面轻微花屏', '亮度偏低', '存在遮挡', '轻微偏色', '丢包率偏高', '间歇性黑屏']
    const problems = status === 'completed' ? r.sample(problemPool, score >= 90 ? r.int(0, 1) : score >= 75 ? r.int(1, 2) : r.int(2, 4)) : []
    list.push({
      id: `QC${pad(i + 1, 3)}`,
      name: `${dev.name} 视频质量诊断`,
      deviceId: dev.id,
      deviceName: dev.name,
      channelNo: r.int(1, Math.max(1, dev.channelCount)),
      items: r.sample(items, r.int(4, 8)),
      score,
      problems,
      status,
      snapshotUrl: snapshotUrl(dev.id + 'qc' + i, dev.name, fmt(dayjs().subtract(r.int(1, 30), 'day'))),
      createTime: fmt(dayjs().subtract(r.int(1, 60), 'day'))
    })
  }
  return list
}

function buildLiveChannels(): T.LiveChannel[] {
  const r = new Random('live')
  const devices = cached('devices', buildDevices)
  const names = ['园区大门实时直播', '施工现场公开直播', '景区入口直播', '厂区全景直播', '停车场实时画面', '河道水位直播', '校园操场直播', '商圈广场直播', '工地塔吊直播', '物流月台直播', '高速匝道直播', '加油站实时画面', '仓库通道直播', '变电周界直播', '门店实时画面', '食堂人流直播', '宿舍楼门厅直播', '实验楼走廊直播']
  return names.map((name, i) => {
    const dev = r.pick(devices)
    const visibility: T.LiveChannel['visibility'] = r.chance(0.6) ? 'public' : 'private'
    return {
      id: `LC${pad(i + 1, 3)}`,
      name,
      deviceId: dev.id,
      deviceName: dev.name,
      channelNo: r.int(1, Math.max(1, dev.channelCount)),
      visibility,
      password: visibility === 'private' ? String(r.int(100000, 999999)) : '',
      shareToken: Array.from({ length: 24 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[r.int(0, 35)]).join(''),
      expiresAt: fmt(dayjs().add(r.int(1, 90), 'day')),
      viewCount: r.int(120, 86000),
      status: r.chance(0.9) ? 1 : 0,
      createTime: fmt(dayjs().subtract(r.int(5, 400), 'day'))
    }
  })
}

function buildArchiveTasks(): T.ArchiveTask[] {
  const r = new Random('archive')
  const pools = cached('storagePools', buildStoragePools)
  const list: T.ArchiveTask[] = []
  for (let i = 0; i < 16; i++) {
    const from = r.pick(pools)
    const to = r.pick(pools.filter((p) => p.id !== from.id))
    const status = r.pickWeighted(['completed', 'completed', 'running', 'failed', 'pending'] as T.ArchiveTask['status'][], [50, 15, 15, 10, 10])
    const list2: T.ArchiveTask['type'] = r.chance(0.72) ? 'archive' : 'restore'
    list.push({
      id: `AR${pad(i + 1, 3)}`,
      name: `${list2 === 'archive' ? '归档' : '恢复'}-${from.name}-${pad(i + 1, 2)}`,
      type: list2,
      recordCount: r.int(1200, 96000),
      fileSize: r.int(200, 18000),
      progress: status === 'completed' ? 100 : status === 'running' ? r.int(6, 94) : 0,
      status,
      fromStorage: from.name,
      toStorage: to.name,
      createTime: fmt(dayjs().subtract(r.int(1, 120), 'day')),
      creator: personName(r)
    })
  }
  return list
}

/* ================= 开放平台 ================= */

function buildApiEndpoints(): T.ApiEndpoint[] {
  const E = (
    group: string,
    name: string,
    method: T.ApiEndpoint['method'],
    path: string,
    description: string,
    params: T.ApiEndpoint['params'],
    responseExample: string
  ): T.ApiEndpoint => ({
    id: `API${group}${name}`,
    group,
    name,
    method,
    path,
    description,
    auth: true,
    params,
    responseExample
  })
  const P = (name: string, type: string, required: boolean, description: string) => ({ name, type, required, description })

  return [
    E('设备管理', '查询设备列表', 'GET', '/api/v1/devices', '分页查询设备，支持按状态/厂商/租户/关键字过滤', [P('page', 'integer', false, '页码，默认 1'), P('pageSize', 'integer', false, '每页条数，默认 20'), P('keyword', 'string', false, '按设备名称或 SN 模糊搜索'), P('onlineStatus', 'string', false, 'online/offline/unknown'), P('vendor', 'string', false, '厂商名称'), P('tenantId', 'string', false, '租户 ID')], '{"code":0,"data":{"list":[{"id":"DEV0001","sn":"HK260318400291","name":"杭西-园区南门-03","onlineStatus":"online","vendor":"海康威视"}],"total":860,"page":1,"pageSize":20}}'),
    E('设备管理', '查询设备详情', 'GET', '/api/v1/devices/{deviceId}', '获取单台设备的完整档案与实时指标', [P('deviceId', 'string', true, '设备 ID')], '{"code":0,"data":{"id":"DEV0001","name":"杭西-园区南门-03","bitrateKbps":4096,"healthScore":92}}'),
    E('设备管理', '新增设备', 'POST', '/api/v1/devices', '创建设备档案并下发接入配置', [P('sn', 'string', true, '设备序列号，全局唯一'), P('name', 'string', true, '设备名称'), P('protocol', 'string', true, '接入协议'), P('ip', 'string', true, '设备 IP')], '{"code":0,"data":{"id":"DEV0861"},"message":"设备创建成功"}'),
    E('设备管理', '修改设备', 'PUT', '/api/v1/devices/{deviceId}', '更新设备基础信息与网络参数', [P('deviceId', 'string', true, '设备 ID'), P('name', 'string', false, '设备名称')], '{"code":0,"message":"更新成功"}'),
    E('设备管理', '删除设备', 'DELETE', '/api/v1/devices/{deviceId}', '删除设备及其通道数据，不可恢复', [P('deviceId', 'string', true, '设备 ID')], '{"code":0,"message":"删除成功"}'),
    E('设备管理', '批量重启设备', 'POST', '/api/v1/devices/reboot', '批量下发重启指令，返回任务 ID', [P('deviceIds', 'array', true, '设备 ID 数组，最多 200 个')], '{"code":0,"data":{"taskId":"TASK20261013001","accepted":48}}'),

    E('通道管理', '查询通道列表', 'GET', '/api/v1/channels', '按设备分页查询通道', [P('deviceId', 'string', false, '设备 ID'), P('page', 'integer', false, '页码')], '{"code":0,"data":{"list":[{"id":"CH000001","channelNo":1,"onlineStatus":"online"}],"total":2418}}'),
    E('通道管理', '云台控制', 'POST', '/api/v1/channels/{channelId}/ptz', '下发云台方向、变倍、预置位控制指令', [P('channelId', 'string', true, '通道 ID'), P('command', 'string', true, 'up/down/left/right/zoomIn/zoomOut'), P('speed', 'integer', false, '速度 1-8')], '{"code":0,"message":"指令已下发"}'),
    E('通道管理', '获取流地址', 'GET', '/api/v1/channels/{channelId}/stream', '获取带 Token 的临时播放地址', [P('channelId', 'string', true, '通道 ID'), P('protocol', 'string', false, 'rtsp/rtmp/hls/webrtc/flv'), P('streamType', 'string', false, 'main/sub')], '{"code":0,"data":{"url":"rtsp://media.videocloud.com/live/CH000001?token=abc","expiresIn":7200}}'),
    E('通道管理', '通道抓图', 'POST', '/api/v1/channels/{channelId}/snapshot', '抓取当前画面并返回图片地址', [P('channelId', 'string', true, '通道 ID')], '{"code":0,"data":{"url":"/snap/CH000001_20261013.jpg","size":48213}}'),
    E('通道管理', '查询通道录像', 'GET', '/api/v1/channels/{channelId}/recordings', '按时间范围检索录像片段', [P('channelId', 'string', true, '通道 ID'), P('startTime', 'string', true, '开始时间'), P('endTime', 'string', true, '结束时间')], '{"code":0,"data":{"list":[{"startTime":"2026-10-12 08:00:00","duration":3600,"fileSize":1843}]}}'),

    E('告警中心', '查询告警列表', 'GET', '/api/v1/alarms', '按等级/类型/状态/时间分页查询告警', [P('level', 'string', false, 'urgent/major/minor/info'), P('status', 'string', false, 'pending/processing/resolved/closed/false_alarm'), P('startTime', 'string', false, '开始时间')], '{"code":0,"data":{"list":[{"alarmNo":"AL2026101300001","level":"urgent","type":"区域入侵"}],"total":6012}}'),
    E('告警中心', '告警详情', 'GET', '/api/v1/alarms/{alarmId}', '获取告警完整信息与抓图', [P('alarmId', 'string', true, '告警 ID')], '{"code":0,"data":{"alarmNo":"AL2026101300001","snapshotUrl":"/snap/alarm_1.jpg","status":"pending"}}'),
    E('告警中心', '处理告警', 'PUT', '/api/v1/alarms/{alarmId}/handle', '提交处理意见并更新告警状态', [P('alarmId', 'string', true, '告警 ID'), P('status', 'string', true, 'resolved/closed/false_alarm'), P('remark', 'string', true, '处理说明')], '{"code":0,"message":"告警已处理"}'),
    E('告警中心', '告警转工单', 'POST', '/api/v1/alarms/{alarmId}/transfer', '将告警转为服务工单', [P('alarmId', 'string', true, '告警 ID'), P('assignee', 'string', false, '指定处理工程师')], '{"code":0,"data":{"orderNo":"WO2026101300128"}}'),
    E('告警中心', '订阅告警', 'POST', '/api/v1/alarms/subscribe', '配置 Webhook 订阅规则', [P('url', 'string', true, '回调地址'), P('alarmTypes', 'array', true, '订阅的告警类型')], '{"code":0,"data":{"subscribeId":"SUB001"}}'),
    E('告警中心', '告警统计', 'GET', '/api/v1/alarms/statistics', '按维度统计告警数量与处理时长', [P('dimension', 'string', true, 'level/type/tenant/device'), P('days', 'integer', false, '统计天数，默认 7')], '{"code":0,"data":{"items":[{"key":"设备离线","count":1560}],"mtta":42,"mttr":186}}'),

    E('AI 分析', '查询算法列表', 'GET', '/api/v1/ai/algorithms', '获取算法市场可用的算法', [P('type', 'string', false, '算法类型')], '{"code":0,"data":{"list":[{"code":"ALG_PERSON_DET","name":"人形检测","accuracy":96.8}]}}'),
    E('AI 分析', '查询 AI 任务', 'GET', '/api/v1/ai/tasks', '分页查询算法任务及运行状态', [P('status', 'string', false, 'running/stopped/abnormal')], '{"code":0,"data":{"list":[{"id":"AIT001","name":"周界防护-人形检测-01","status":"running"}],"total":68}}'),
    E('AI 分析', '创建 AI 任务', 'POST', '/api/v1/ai/tasks', '在指定通道上创建算法分析任务', [P('name', 'string', true, '任务名称'), P('algorithmId', 'string', true, '算法 ID'), P('channelIds', 'array', true, '通道 ID 数组'), P('roi', 'array', true, 'ROI 区域坐标'), P('threshold', 'number', false, '置信度阈值')], '{"code":0,"data":{"id":"AIT069"}}'),
    E('AI 分析', '启停 AI 任务', 'PUT', '/api/v1/ai/tasks/{taskId}/status', '启动或停止算法任务', [P('taskId', 'string', true, '任务 ID'), P('status', 'string', true, 'running/stopped')], '{"code":0,"message":"任务已启动"}'),
    E('AI 分析', '查询识别事件', 'GET', '/api/v1/ai/events', '查询 AI 识别产生的结构化事件', [P('algorithmName', 'string', false, '算法名称'), P('minConfidence', 'number', false, '最小置信度')], '{"code":0,"data":{"list":[{"type":"人形检测","confidence":0.94,"snapshotUrl":"/snap/evt_1.jpg"}]}}'),
    E('AI 分析', '任务性能指标', 'GET', '/api/v1/ai/tasks/{taskId}/metrics', '查询任务吞吐、耗时与资源占用', [P('taskId', 'string', true, '任务 ID')], '{"code":0,"data":{"fps":24.8,"avgCost":46,"gpuUsage":18.4}}'),

    E('云存储', '查询存储池', 'GET', '/api/v1/storage/pools', '获取存储池容量与使用情况', [P('type', 'string', false, 'standard/ia/archive')], '{"code":0,"data":{"list":[{"id":"SP01","capacityTB":186,"usedTB":143.6,"usageRate":77.2}]}}'),
    E('云存储', '查询录像计划', 'GET', '/api/v1/storage/plans', '查询录像计划与绑定的通道', [P('keyword', 'string', false, '计划名称关键字')], '{"code":0,"data":{"list":[{"id":"RP001","name":"园区主出入口7×24 全时段录像","channelCount":36}]}}'),
    E('云存储', '创建录像计划', 'POST', '/api/v1/storage/plans', '新建录像计划并绑定通道', [P('name', 'string', true, '计划名称'), P('timeSlots', 'array', true, '时间段配置'), P('channelIds', 'array', true, '通道 ID 数组')], '{"code":0,"data":{"id":"RP097"}}'),
    E('云存储', '查询存储用量', 'GET', '/api/v1/storage/usage', '按租户/设备维度统计存储用量', [P('dimension', 'string', true, 'tenant/device/channel'), P('period', 'string', false, '统计周期')], '{"code":0,"data":{"totalTB":3268.4,"items":[{"key":"T001","value":186.2}]}}'),
    E('云存储', '创建归档任务', 'POST', '/api/v1/storage/archive', '将冷数据归档至低频/归档存储池', [P('fromPoolId', 'string', true, '源存储池'), P('toPoolId', 'string', true, '目标存储池'), P('beforeDays', 'integer', true, '归档多少天前的数据')], '{"code":0,"data":{"taskId":"AR017"}}'),
    E('云存储', '查询归档任务', 'GET', '/api/v1/storage/archive/tasks', '查询归档与恢复任务进度', [P('status', 'string', false, '任务状态')], '{"code":0,"data":{"list":[{"id":"AR001","progress":100,"status":"completed"}]}}'),

    E('技术服务', '查询工单列表', 'GET', '/api/v1/workorders', '分页查询服务工单', [P('status', 'string', false, '工单状态'), P('priority', 'string', false, '优先级'), P('assignee', 'string', false, '处理工程师')], '{"code":0,"data":{"list":[{"orderNo":"WO2026101300001","status":"processing","slaStatus":"normal"}],"total":1500}}'),
    E('技术服务', '创建工单', 'POST', '/api/v1/workorders', '提交服务请求生成工单', [P('title', 'string', true, '工单标题'), P('type', 'string', true, '工单类型'), P('deviceId', 'string', false, '关联设备'), P('description', 'string', true, '问题描述')], '{"code":0,"data":{"orderNo":"WO2026101301501"}}'),
    E('技术服务', '工单派单', 'POST', '/api/v1/workorders/{orderId}/assign', '将工单指派给指定工程师', [P('orderId', 'string', true, '工单 ID'), P('assignee', 'string', true, '工程师姓名')], '{"code":0,"message":"派单成功"}'),
    E('技术服务', '查询服务目录', 'GET', '/api/v1/services/catalog', '获取可售服务项与 SLA', [], '{"code":0,"data":{"list":[{"name":"故障报修处理","price":260,"slaResponseHours":4}]}}'),
    E('技术服务', '查询备件库存', 'GET', '/api/v1/services/parts', '查询备件库存与预警状态', [P('category', 'string', false, '备件分类')], '{"code":0,"data":{"list":[{"name":"企业级硬盘 8TB","stock":42,"status":"normal"}]}}'),
    E('技术服务', '查询知识库', 'GET', '/api/v1/services/knowledge', '检索知识库文章', [P('keyword', 'string', false, '搜索关键字'), P('category', 'string', false, '文章分类')], '{"code":0,"data":{"list":[{"title":"IPC 频繁掉线排查指引","views":4210}]}}'),

    E('组织与权限', '查询租户列表', 'GET', '/api/v1/tenants', '查询平台租户及其配额使用情况', [P('status', 'string', false, '租户状态')], '{"code":0,"data":{"list":[{"id":"T001","name":"杭州华天科技有限公司","deviceUsed":32,"deviceQuota":48}]}}'),
    E('组织与权限', '查询用户列表', 'GET', '/api/v1/users', '查询用户及其角色部门', [P('tenantId', 'string', false, '租户 ID'), P('roleId', 'string', false, '角色 ID')], '{"code":0,"data":{"list":[{"username":"admin","nickname":"周明远","roleNames":["平台超级管理员"]}]}}'),
    E('组织与权限', '创建用户', 'POST', '/api/v1/users', '新增用户并分配角色与部门', [P('username', 'string', true, '登录账号'), P('nickname', 'string', true, '姓名'), P('roleIds', 'array', true, '角色 ID 数组')], '{"code":0,"data":{"id":"U0181"}}'),
    E('组织与权限', '查询角色列表', 'GET', '/api/v1/roles', '查询角色及其权限范围', [], '{"code":0,"data":{"list":[{"code":"ops_engineer","name":"运维工程师","dataScope":"deptAndChild"}]}}'),
    E('组织与权限', '查询部门树', 'GET', '/api/v1/depts/tree', '获取组织架构树', [], '{"code":0,"data":{"list":[{"id":"D000","name":"云视科技集团","children":[]}]}}'),
    E('组织与权限', '查询操作日志', 'GET', '/api/v1/logs/operation', '查询平台操作审计日志', [P('operator', 'string', false, '操作人'), P('module', 'string', false, '操作模块')], '{"code":0,"data":{"list":[{"operator":"周明远","module":"设备管理","action":"删除设备"}]}}'),
    E('组织与权限', '校验访问令牌', 'POST', '/api/v1/auth/token/verify', '校验 Token 有效性并返回权限集合', [P('token', 'string', true, '访问令牌')], '{"code":0,"data":{"valid":true,"expiresIn":7200}}')
  ]
}

const APP_NAMES = [
  '智慧园区综合管理平台', '城市大脑视频中台', '校园安全防控平台', '智慧工地监管系统', '连锁门店远程巡店',
  '能源周界安防平台', '交通事件检测平台', '农业物联网监控', '第三方 BI 数据看板', '客户移动端 App',
  '运维值班大屏', '集团数据中台', '应急指挥调度系统', 'AI 算法训练数据平台'
]

function buildOpenApps(): T.OpenApp[] {
  const r = new Random('apps')
  const tenants = cached('tenants', buildTenants)
  return APP_NAMES.map((name, i) => {
    const tenant = tenants[i % tenants.length]
    const calls = r.int(1200, 860000)
    return {
      id: `APP${pad(i + 1, 3)}`,
      appName: name,
      appKey: `AK${Array.from({ length: 20 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[r.int(0, 31)]).join('')}`,
      appSecret: Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[r.int(0, 35)]).join(''),
      owner: personName(r),
      tenantId: tenant.id,
      tenantName: tenant.name,
      ipWhitelist: r.chance(0.55) ? [`${r.int(100, 220)}.${r.int(1, 250)}.${r.int(1, 250)}.0/24`] : [],
      qpsLimit: r.pick([50, 100, 200, 500, 1000]),
      status: r.chance(0.88) ? 1 : 0,
      callCount7d: Math.round(calls / 4.3),
      callCount30d: calls,
      successRate: r.float(96.2, 99.98, 2),
      createTime: fmt(dayjs().subtract(r.int(30, 700), 'day'))
    }
  })
}

function buildApiCallLogs(): T.ApiCallLog[] {
  const r = new Random('apilogs')
  const apps = cached('openApps', buildOpenApps)
  const endpoints = cached('apiEndpoints', buildApiEndpoints)
  const list: T.ApiCallLog[] = []
  for (let i = 0; i < 8000; i++) {
    const app = r.pick(apps)
    const ep = r.pick(endpoints)
    const isErr = r.chance(0.045)
    list.push({
      id: `LOG${pad(i + 1, 6)}`,
      appId: app.id,
      appName: app.appName,
      endpoint: ep.name,
      method: ep.method,
      path: ep.path.replace('{deviceId}', 'DEV0001').replace('{alarmId}', 'AL000001').replace('{channelId}', 'CH000001').replace('{taskId}', 'AIT001').replace('{orderId}', 'WO00001'),
      statusCode: isErr ? r.pickWeighted([400, 401, 403, 404, 429, 500], [30, 16, 10, 14, 18, 12]) : 200,
      duration: isErr ? r.int(180, 3200) : r.int(18, 860),
      ip: `${r.int(100, 220)}.${r.int(1, 250)}.${r.int(1, 250)}.${r.int(2, 250)}`,
      createTime: fmt(dayjs().subtract(r.int(0, 30), 'day').hour(r.int(0, 23)).minute(r.int(0, 59)).second(r.int(0, 59)))
    })
  }
  return list
}

function buildWebhooks(): T.WebhookConfig[] {
  const r = new Random('webhook')
  const tenants = cached('tenants', buildTenants)
  const events = ['告警创建', '告警恢复', 'AI 事件', '设备上线', '设备离线', '工单创建', '工单完成', '存储将满']
  const names = ['应急指挥中心回调', '客户 BI 系统推送', '值班大屏消息推送', '短信网关回调', '企业微信机器人', '运维工单系统对接', '数据中台实时同步', '移动端消息推送', '第三方安防平台对接', '集团告警汇聚', 'AI 事件实时订阅', '设备状态变更通知']
  return names.map((name, i) => {
    const tenant = tenants[i % tenants.length]
    const pushes = Array.from({ length: r.int(6, 24) }, (_, k) => {
      const ok = r.chance(0.88)
      return {
        id: `PSH${pad(i * 100 + k + 1, 5)}`,
        event: r.pick(events),
        time: fmt(dayjs().subtract(r.int(1, 30), 'day').hour(r.int(0, 23))),
        httpStatus: ok ? 200 : r.pick([400, 404, 500, 502, 504]),
        duration: r.int(30, 4200),
        retryCount: ok ? 0 : r.int(1, 3),
        result: (ok ? 'success' : 'fail') as 'success' | 'fail'
      }
    })
    return {
      id: `WH${pad(i + 1, 3)}`,
      name,
      url: `https://${r.pick(['api', 'open', 'data', 'gw'])}.${r.pick(['customer', 'partner', 'group', 'client'])}-${r.int(10, 99)}.com/hook/video-cloud`,
      events: r.sample(events, r.int(2, 5)),
      secret: Array.from({ length: 24 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[r.int(0, 35)]).join(''),
      retryPolicy: r.pick(['失败重试 3 次，间隔 5s', '失败重试 5 次，指数退避', '失败重试 2 次，间隔 30s']),
      status: r.chance(0.85) ? 1 : 0,
      createTime: fmt(dayjs().subtract(r.int(10, 400), 'day')),
      pushRecords: pushes
    }
  })
}

function buildExportTasks(): T.ExportTask[] {
  const r = new Random('export')
  const types = ['设备台账', '告警明细', '工单明细', '存储用量', '调用日志', '账单明细', '巡检报告', '备件台账', 'AI 事件', '操作日志']
  return types.map((t, i) => {
    const status = r.pickWeighted(['completed', 'completed', 'running', 'failed', 'pending'] as T.ExportTask['status'][], [60, 14, 10, 8, 8])
    return {
      id: `EX${pad(i + 1, 3)}`,
      name: `${t}导出-${dayjs().subtract(r.int(1, 60), 'day').format('YYYYMMDD')}`,
      dataType: t,
      conditions: r.pick(['全部数据', '近 7 天', '近 30 天', '按租户筛选', '按片区筛选', '按告警等级筛选']),
      rowCount: r.int(120, 86000),
      fileSize: r.int(20, 42000),
      progress: status === 'completed' ? 100 : status === 'running' ? r.int(5, 95) : 0,
      status,
      creator: personName(r),
      createTime: fmt(dayjs().subtract(r.int(0, 40), 'day'))
    }
  })
}

/* ================= 固件 / OTA ================= */

function buildFirmwares(): T.Firmware[] {
  const r = new Random('firmware')
  const list: T.Firmware[] = []
  let i = 0
  D.VENDORS.forEach((v) => {
    ;['摄像机', '录像机', '网关'].forEach((cat, ci) => {
      if (list.length >= 18) return
      i++
      const ver = `V${r.int(5, 7)}.${r.int(0, 9)}.${r.int(0, 9)} build ${r.int(240101, 251012)}`
      list.push({
        id: `FW${pad(i, 3)}`,
        version: ver,
        vendor: v.name,
        category: cat,
        fileSize: r.int(16, 320),
        releaseDate: dayFmt(dayjs().subtract(r.int(10, 600), 'day')),
        changelog: r.pick([
          '修复 GB28181 注册偶发失败问题；优化夜间画面噪点抑制；提升 AI 事件上报稳定性。',
          '修复低照度环境下自动曝光震荡问题；优化 H.265 码率控制；修复部分场景下时间同步偏差。',
          '新增 SVAC2.0 编码支持；优化断电恢复后自动重连逻辑；修复 ONVIF 发现异常。',
          '修复长时间运行内存泄漏问题；优化带宽自适应策略；提升视频流首帧速度。'
        ]),
        md5: Array.from({ length: 32 }, () => '0123456789abcdef'[r.int(0, 15)]).join(''),
        downloadCount: r.int(20, 4600)
      })
    })
  })
  return list
}

function buildOtaTasks(): T.OtaTask[] {
  const r = new Random('ota')
  const fws = cached('firmwares', buildFirmwares)
  const list: T.OtaTask[] = []
  for (let i = 0; i < 24; i++) {
    const fw = r.pick(fws)
    const status = r.pickWeighted(['completed', 'completed', 'running', 'failed', 'paused', 'pending'] as T.OtaTask['status'][], [42, 14, 12, 14, 8, 10])
    const total = r.int(20, 320)
    const success = status === 'completed' ? total : status === 'running' ? Math.round(total * r.float(0.1, 0.9, 2)) : r.int(0, Math.round(total * 0.6))
    const fail = status === 'failed' ? r.int(4, 40) : status === 'running' ? r.int(0, 6) : 0
    list.push({
      id: `OTA${pad(i + 1, 3)}`,
      name: `${fw.vendor}${fw.category}固件升级-${pad(i + 1, 2)}`,
      firmwareId: fw.id,
      firmwareVersion: fw.version,
      deviceCount: total,
      successCount: success,
      failCount: fail,
      runningCount: Math.max(0, total - success - fail),
      status,
      mode: r.chance(0.7) ? 'immediate' : 'scheduled',
      startTime: fmt(dayjs().subtract(r.int(0, 40), 'day').hour(r.int(1, 5))),
      creator: personName(r),
      failReasons: [
        { reason: '设备离线未响应', count: r.int(1, 18) },
        { reason: '固件校验失败（MD5 不匹配）', count: r.int(0, 8) },
        { reason: '升级过程中断网', count: r.int(0, 12) },
        { reason: '设备存储空间不足', count: r.int(0, 5) }
      ].filter((x) => x.count > 0)
    })
  }
  return list
}

/* ================= 计费 ================= */

function buildBillingItems(): T.BillingItem[] {
  return [
    { id: 'BI01', code: 'DEVICE_ACCESS', name: '设备接入服务费', unit: '元/台/月', unitPrice: 15, billingCycle: '月', description: '按纳管设备数量计费，含平台接入与基础运维', status: 1, effectiveDate: '2025-01-01' },
    { id: 'BI02', code: 'CLOUD_STORAGE', name: '云存储容量费', unit: '元/GB/月', unitPrice: 0.28, billingCycle: '月', description: '按实际录像存储占用量计费', status: 1, effectiveDate: '2025-01-01' },
    { id: 'BI03', code: 'DOWNLINK_TRAFFIC', name: '下行流量费', unit: '元/GB', unitPrice: 0.35, billingCycle: '月', description: '按视频分发下行流量计费', status: 1, effectiveDate: '2025-01-01' },
    { id: 'BI04', code: 'AI_CHANNEL', name: 'AI 分析路数费', unit: '元/路/月', unitPrice: 120, billingCycle: '月', description: '按启用智能分析的通道数计费', status: 1, effectiveDate: '2025-03-01' },
    { id: 'BI05', code: 'API_CALL', name: '开放接口调用费', unit: '元/万次', unitPrice: 8, billingCycle: '月', description: '按开放平台接口调用次数计费', status: 1, effectiveDate: '2025-06-01' }
  ]
}

function buildBills(): T.Bill[] {
  const r = new Random('bills')
  const tenants = cached('tenants', buildTenants)
  const list: T.Bill[] = []
  let idx = 0
  for (let m = 11; m >= 0; m--) {
    const period = dayjs().subtract(m, 'month').format('YYYY-MM')
    tenants.slice(0, 30).forEach((t) => {
      idx++
      const storageGB = Math.round(t.storageUsedTB * 1024)
      const ai = t.aiChannelUsed
      const calls = r.int(20, 1200)
      const traffic = r.int(200, 9000)
      const items: T.BillItemDetail[] = [
        { billingCode: 'DEVICE_ACCESS', billingName: '设备接入服务费', unit: '元/台/月', unitPrice: 15, quantity: t.deviceUsed, amount: Number((15 * t.deviceUsed).toFixed(2)) },
        { billingCode: 'CLOUD_STORAGE', billingName: '云存储容量费', unit: '元/GB/月', unitPrice: 0.28, quantity: storageGB, amount: Number((0.28 * storageGB).toFixed(2)) },
        { billingCode: 'DOWNLINK_TRAFFIC', billingName: '下行流量费', unit: '元/GB', unitPrice: 0.35, quantity: traffic, amount: Number((0.35 * traffic).toFixed(2)) },
        { billingCode: 'AI_CHANNEL', billingName: 'AI 分析路数费', unit: '元/路/月', unitPrice: 120, quantity: ai, amount: Number((120 * ai).toFixed(2)) },
        { billingCode: 'API_CALL', billingName: '开放接口调用费', unit: '元/万次', unitPrice: 8, quantity: calls, amount: Number((8 * calls).toFixed(2)) }
      ]
      const total = Number(items.reduce((a, b) => a + b.amount, 0).toFixed(2))
      const isCurrent = m === 0
      const status: T.Bill['status'] = isCurrent ? (r.chance(0.4) ? 'pending' : 'paid') : r.chance(0.09) ? 'overdue' : 'paid'
      const billDate = dayjs(period + '-01').add(1, 'month')
      list.push({
        id: `BL${pad(idx, 4)}`,
        billNo: `BL${period.replace('-', '')}${pad(idx, 5)}`,
        tenantId: t.id,
        tenantName: t.name,
        period,
        items,
        totalAmount: total,
        status,
        dueDate: dayFmt(billDate.add(20, 'day')),
        payTime: status === 'paid' ? fmt(billDate.add(r.int(1, 18), 'day').hour(r.int(9, 20))) : null,
        payMethod: status === 'paid' ? r.pick(['余额扣减', '对公转账', '在线支付']) : '',
        createTime: fmt(billDate)
      })
    })
  }
  return list
}

function buildRecharges(): T.RechargeRecord[] {
  const r = new Random('recharge')
  const tenants = cached('tenants', buildTenants)
  const list: T.RechargeRecord[] = []
  for (let i = 0; i < 60; i++) {
    const t = r.pick(tenants)
    const amount = r.pick([5000, 10000, 20000, 50000, 100000, 200000])
    list.push({
      id: `RC${pad(i + 1, 4)}`,
      tenantId: t.id,
      tenantName: t.name,
      amount,
      balanceAfter: Number((t.balance + amount).toFixed(2)),
      method: r.pick(['对公转账', '在线支付', '支付宝', '微信支付']),
      tradeNo: `TR${dayjs().subtract(r.int(1, 365), 'day').format('YYYYMMDD')}${pad(r.int(1, 99999), 5)}`,
      status: r.pickWeighted(['success', 'success', 'success', 'pending', 'fail'] as T.RechargeRecord['status'][], [70, 15, 8, 4, 3]),
      createTime: fmt(dayjs().subtract(r.int(1, 365), 'day').hour(r.int(9, 20))),
      operator: r.pick(['系统自动', '财务专员', '客户自助'])
    })
  }
  return list
}

function buildInvoices(): T.Invoice[] {
  const r = new Random('invoice')
  const tenants = cached('tenants', buildTenants)
  const list: T.Invoice[] = []
  for (let i = 0; i < 40; i++) {
    const t = r.pick(tenants)
    const status = r.pickWeighted(['issued', 'issued', 'pending', 'rejected'] as T.Invoice['status'][], [55, 20, 18, 7])
    const amount = r.float(2000, 180000, 2)
    list.push({
      id: `IV${pad(i + 1, 4)}`,
      invoiceNo: `FP${dayjs().subtract(r.int(1, 300), 'day').format('YYYYMMDD')}${pad(r.int(1, 9999), 4)}`,
      tenantId: t.id,
      tenantName: t.name,
      titleType: r.chance(0.85) ? 'company' : 'personal',
      title: t.name,
      taxNo: String.fromCharCode(65 + r.int(0, 25)) + Array.from({ length: 17 }, () => '0123456789ABCDEFGHJKLMNPQRTUWXY'[r.int(0, 29)]).join(''),
      amount,
      type: r.chance(0.72) ? 'normal' : 'special',
      status,
      applyTime: fmt(dayjs().subtract(r.int(1, 300), 'day')),
      issueTime: status === 'issued' ? fmt(dayjs().subtract(r.int(0, 200), 'day')) : null
    })
  }
  return list
}

/* ================= 系统 ================= */

function buildOperationLogs(): T.OperationLog[] {
  const r = new Random('oplogs')
  const users = cached('users', buildUsers)
  const acts = [
    { module: '设备管理', action: '新增设备', method: 'POST', url: '/api/v1/devices' },
    { module: '设备管理', action: '删除设备', method: 'DELETE', url: '/api/v1/devices/{id}' },
    { module: '设备管理', action: '批量升级固件', method: 'POST', url: '/api/v1/devices/ota' },
    { module: '告警中心', action: '处理告警', method: 'PUT', url: '/api/v1/alarms/{id}/handle' },
    { module: '告警中心', action: '批量关闭告警', method: 'PUT', url: '/api/v1/alarms/batch-close' },
    { module: '技术服务', action: '派单', method: 'POST', url: '/api/v1/workorders/{id}/assign' },
    { module: '技术服务', action: '关闭工单', method: 'PUT', url: '/api/v1/workorders/{id}/close' },
    { module: '云存储', action: '创建录像计划', method: 'POST', url: '/api/v1/storage/plans' },
    { module: '云存储', action: '调整生命周期策略', method: 'PUT', url: '/api/v1/storage/lifecycle' },
    { module: 'AI 分析', action: '创建算法任务', method: 'POST', url: '/api/v1/ai/tasks' },
    { module: '租户管理', action: '调整租户配额', method: 'PUT', url: '/api/v1/tenants/{id}/quota' },
    { module: '用户权限', action: '修改角色权限', method: 'PUT', url: '/api/v1/roles/{id}' },
    { module: '计费管理', action: '确认充值', method: 'POST', url: '/api/v1/billing/recharge/confirm' },
    { module: '系统设置', action: '修改平台参数', method: 'PUT', url: '/api/v1/system/config' },
    { module: '登录认证', action: '用户登录', method: 'POST', url: '/api/v1/auth/login' },
    { module: '开放平台', action: '重置 AppSecret', method: 'POST', url: '/api/v1/apps/{id}/reset-secret' }
  ]
  const list: T.OperationLog[] = []
  for (let i = 0; i < 2000; i++) {
    const u = r.pick(users)
    const a = r.pick(acts)
    list.push({
      id: `OP${pad(i + 1, 5)}`,
      operator: u.nickname,
      operatorId: u.id,
      ip: u.lastLoginIp,
      module: a.module,
      action: a.action,
      target: r.pick(['DEV' + pad(r.int(1, 860), 4), 'WO' + pad(r.int(1, 1500), 5), 'AL' + pad(r.int(1, 6000), 6), 'AIT' + pad(r.int(1, 68), 3), 'T' + pad(r.int(1, 32), 3)]),
      method: a.method,
      url: a.url,
      params: `{"id":"${r.int(1, 5000)}"}`,
      result: r.chance(0.94) ? 'success' : 'fail',
      duration: r.int(8, 1600),
      createTime: fmt(dayjs().subtract(r.int(0, 90), 'day').hour(r.int(8, 20)).minute(r.int(0, 59)))
    })
  }
  return list.sort((a, b) => (a.createTime < b.createTime ? 1 : -1))
}

function buildMessages(): T.MessageItem[] {
  const r = new Random('messages')
  const list: T.MessageItem[] = []
  const templates = [
    { type: 'alarm', level: 'urgent', title: '紧急告警：烟火检测', content: '杭西-园区南门-03 检测到疑似烟火，请立即核实处置。', link: '/alarm' },
    { type: 'alarm', level: 'major', title: '重要告警：设备离线', content: '深南-地铁B口-12 设备离线超过 30 分钟，请检查链路。', link: '/alarm' },
    { type: 'workorder', level: 'info', title: '新工单待受理', content: '工单 WO2026101300128 已提交，请在 4 小时内响应。', link: '/workorder' },
    { type: 'workorder', level: 'warning', title: '工单超时预警', content: '工单 WO2026101300088 将在 1 小时后超时，请尽快处理。', link: '/workorder' },
    { type: 'system', level: 'info', title: '平台版本更新', content: '平台已升级至 v4.1.0，新增 AI 事件订阅能力。', link: '/system' },
    { type: 'system', level: 'warning', title: '存储容量预警', content: 'SP05 存储池使用率已达 88%，建议尽快扩容。', link: '/storage' }
  ]
  for (let i = 0; i < 30; i++) {
    const t = r.pick(templates)
    list.push({
      id: `MSG${pad(i + 1, 4)}`,
      type: t.type as T.MessageItem['type'],
      title: t.title,
      content: t.content,
      read: r.chance(0.45),
      level: t.level as T.MessageItem['level'],
      link: t.link,
      createTime: fmt(dayjs().subtract(r.int(0, 60), 'hour'))
    })
  }
  return list.sort((a, b) => (a.createTime < b.createTime ? 1 : -1))
}

function buildDictTypes(): T.DictType[] {
  const mk = (id: string, name: string, code: string, remark: string, items: [string, string][]): T.DictType => ({
    id,
    name,
    code,
    remark,
    items: items.map(([label, value], i) => ({ label, value, sort: i + 1, status: 1 }))
  })
  return [
    mk('DT01', '设备类型', 'device_category', '设备大类，用于设备档案与筛选', D.DEVICE_CATEGORIES.map((c) => [c.name, c.code] as [string, string])),
    mk('DT02', '设备状态', 'online_status', '设备在线状态', [['在线', 'online'], ['离线', 'offline'], ['未知', 'unknown'], ['待接入', 'pending']]),
    mk('DT03', '告警等级', 'alarm_level', '告警严重程度分级', [['紧急', 'urgent'], ['重要', 'major'], ['次要', 'minor'], ['提示', 'info']]),
    mk('DT04', '告警状态', 'alarm_status', '告警处置状态', [['待处理', 'pending'], ['处理中', 'processing'], ['已解决', 'resolved'], ['已关闭', 'closed'], ['误报', 'false_alarm']]),
    mk('DT05', '告警类型', 'alarm_type', '平台支持的告警类型', D.ALARM_TYPES.map((t) => [t.name, t.name] as [string, string])),
    mk('DT06', '工单类型', 'workorder_type', '技术服务工单分类', D.WORK_ORDER_TYPES.map((t) => [t, t] as [string, string])),
    mk('DT07', '工单状态', 'workorder_status', '工单流转状态', D.WORK_ORDER_STATUS.map((s) => [s.label, s.value] as [string, string])),
    mk('DT08', '存储池类型', 'storage_type', '云存储分层类型', [['标准存储', 'standard'], ['低频存储', 'ia'], ['归档存储', 'archive']]),
    mk('DT09', '租户状态', 'tenant_status', '租户账号状态', [['正常', 'normal'], ['欠费', 'arrears'], ['停用', 'suspended'], ['已到期', 'expired']]),
    mk('DT10', '接入协议', 'device_protocol', '设备接入协议', D.PROTOCOLS.map((p) => [p, p] as [string, string])),
    mk('DT11', '行业分类', 'industry', '租户所属行业', D.INDUSTRIES.map((i) => [i, i] as [string, string])),
    mk('DT12', '服务类型', 'service_type', '技术服务目录分类', D.WORK_ORDER_TYPES.map((t) => [t, t] as [string, string]))
  ]
}

function buildAlarmRules(): T.AlarmRule[] {
  const r = new Random('rules')
  const names = [
    '周界入侵告警规则', '生产区安全帽规则', '消防通道占用规则', '夜间人员活动规则', '设备离线告警规则',
    '存储容量告警规则', '网络质量告警规则', '车牌通行记录规则', '客流超限规则', '电梯电动车规则',
    '离岗超时规则', '垃圾满溢规则'
  ]
  const types = D.ALARM_TYPES.map((t) => t.name)
  return names.map((name, i) => ({
    id: `AR${pad(i + 1, 3)}`,
    name,
    alarmTypes: r.sample(types, r.int(2, 5)),
    levels: r.sample(['urgent', 'major', 'minor', 'info'], r.int(2, 4)) as T.AlarmLevel[],
    convergeWindow: r.pick([60, 120, 180, 300, 600]),
    silentPeriod: r.pick([0, 60, 180, 300]),
    channels: [],
    notifyChannels: r.sample(['站内消息', '邮件', '短信', 'Webhook'], r.int(1, 4)),
    receivers: r.sample(['运维值班组', '客户负责人', '技术支持组', '平台管理员'], r.int(1, 3)),
    status: r.chance(0.85) ? 1 : 0,
    createTime: fmt(dayjs().subtract(r.int(10, 400), 'day'))
  }))
}

/* ================= 注册表 ================= */

const builders: Record<string, () => any[]> = {
  depts: buildDepts,
  roles: buildRoles,
  tenants: buildTenants,
  users: buildUsers,
  deviceGroups: buildDeviceGroups,
  nodes: buildNodes,
  storagePools: buildStoragePools,
  devices: buildDevices,
  channels: buildChannels,
  recordPlans: buildRecordPlans,
  transcodeTemplates: buildTranscodeTemplates,
  algorithms: buildAlgorithms,
  aiTasks: buildAiTasks,
  alarms: buildAlarms,
  engineers: buildEngineers,
  spareParts: buildSpareParts,
  knowledge: buildKnowledge,
  serviceCatalog: buildServiceCatalog,
  workOrders: buildWorkOrders,
  microServices: buildMicroServices,
  logEntries: buildLogEntries,
  patrolTasks: buildPatrolTasks,
  qualityChecks: buildQualityChecks,
  liveChannels: buildLiveChannels,
  archiveTasks: buildArchiveTasks,
  apiEndpoints: buildApiEndpoints,
  openApps: buildOpenApps,
  apiCallLogs: buildApiCallLogs,
  webhooks: buildWebhooks,
  exportTasks: buildExportTasks,
  firmwares: buildFirmwares,
  otaTasks: buildOtaTasks,
  billingItems: buildBillingItems,
  bills: buildBills,
  recharges: buildRecharges,
  invoices: buildInvoices,
  operationLogs: buildOperationLogs,
  messages: buildMessages,
  dictTypes: buildDictTypes,
  alarmRules: buildAlarmRules
}

const memo = new Map<string, any>()

function cached<T>(key: string, fn: () => T): T {
  if (!memo.has(key)) memo.set(key, fn())
  return memo.get(key) as T
}

/** 获取集合基础数据（带懒加载与缓存） */
export function getCollection(name: string): any[] {
  const fn = builders[name]
  if (!fn) return []
  return cached(name, fn)
}

/** 清空缓存（重置演示数据时调用） */
export function clearCollections(): void {
  memo.clear()
}

export const collectionNames = Object.keys(builders)

export { DEMO_ACCOUNTS }
