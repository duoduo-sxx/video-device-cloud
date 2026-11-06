import type {
  Alarm, Attachment, Change, Contract, Customer, DataCenter, Database, Device, DiskSlot, DutyShift,
  Host, Inspection, InspectionItem, KnowledgeArticle, LogEntry, Message, ServiceItem, SparePart,
  SpareRecord, StorageCluster, StoragePool, Ticket, TimelineItem, User, Volume
} from '@/types'

export const DB_VERSION = 'soc-db-v1.0.0'
const NOW = new Date('2026-10-19T10:00:00+08:00').getTime()
const HOUR = 3600_000
const DAY = 86400_000

function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20261019)
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min
const num = (min: number, max: number, fix = 1) => Number((rnd() * (max - min) + min).toFixed(fix))
const pick = <T>(list: T[]): T => list[Math.floor(rnd() * list.length)]
const chance = (p: number) => rnd() < p
const pad = (n: number, len = 4) => String(n).padStart(len, '0')
const iso = (ms: number) => new Date(ms + 8 * HOUR).toISOString().slice(0, 19) + '+08:00'
const dateOnly = (ms: number) => iso(ms).slice(0, 10)

function weighted<T extends string>(map: Record<T, number>): T {
  const entries = Object.entries(map) as [T, number][]
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [key, w] of entries) {
    r -= w
    if (r <= 0) return key
  }
  return entries[entries.length - 1][0]
}

const ENGINEERS = ['张伟', '陈立', '王海涛', '刘敏', '赵鹏', '周文静', '孙浩', '吴倩']
const GROUPS = ['存储一线', '存储二线', '容灾与备份组', '驻场服务组']

const CUSTOMER_SEED = [
  { id: 'CUS-001', name: '市政务云管理中心', shortName: 'GOV', industry: 'government', level: 'A', region: '华东-杭州', manager: '张伟', contactName: '李建国', contactPhone: '138****6721', address: '杭州市滨江区江南大道 588 号政务云中心' },
  { id: 'CUS-002', name: '省医疗保障局信息中心', shortName: 'MED', industry: 'government', level: 'A', region: '华东-南京', manager: '张伟', contactName: '周晓芸', contactPhone: '139****3318', address: '南京市鼓楼区中山北路 210 号' },
  { id: 'CUS-003', name: '城商行数据中心', shortName: 'BANK', industry: 'finance', level: 'A', region: '华东-宁波', manager: '王海涛', contactName: '徐志强', contactPhone: '137****9082', address: '宁波市鄞州区宁东路 269 号' },
  { id: 'CUS-004', name: '市第一人民医院', shortName: 'HOSP', industry: 'medical', level: 'B', region: '华东-杭州', manager: '刘敏', contactName: '陈慧', contactPhone: '135****4471', address: '杭州市上城区浣纱路 261 号' },
  { id: 'CUS-005', name: '理工大学信息中心', shortName: 'UNIV', industry: 'education', level: 'B', region: '华东-上海', manager: '赵鹏', contactName: '王振宇', contactPhone: '136****5520', address: '上海市杨浦区军工路 516 号' },
  { id: 'CUS-006', name: '省能源集团', shortName: 'ENERGY', industry: 'energy', level: 'A', region: '华北-太原', manager: '周文静', contactName: '刘海峰', contactPhone: '133****7761', address: '太原市小店区长风街 108 号' },
  { id: 'CUS-007', name: '精密制造集团', shortName: 'MFG', industry: 'manufacturing', level: 'B', region: '华东-苏州', manager: '孙浩', contactName: '沈立新', contactPhone: '188****2290', address: '苏州市工业园区星湖街 328 号' },
  { id: 'CUS-008', name: '省通信运营商', shortName: 'TELECOM', industry: 'telecom', level: 'A', region: '华南-广州', manager: '吴倩', contactName: '黄志明', contactPhone: '186****6633', address: '广州市天河区体育东路 128 号' }
] as const

const INDUSTRY_NAME: Record<string, string> = {
  government: '政务', finance: '金融', medical: '医疗', education: '教育',
  energy: '能源', manufacturing: '制造', telecom: '运营商'
}

const DC_SEED = [
  { id: 'A01', name: '政务云-滨江主数据中心', customerId: 'CUS-001', address: '杭州滨江江南大道 588 号', level: 'T4' },
  { id: 'A02', name: '政务云-萧山灾备中心', customerId: 'CUS-001', address: '杭州萧山区市心北路 88 号', level: 'T3' },
  { id: 'A03', name: '医保-主数据中心', customerId: 'CUS-002', address: '南京鼓楼中山北路 210 号', level: 'T4' },
  { id: 'B01', name: '城商行-同城双活中心', customerId: 'CUS-003', address: '宁波鄞州宁东路 269 号', level: 'T4' },
  { id: 'B02', name: '城商行-异地灾备中心', customerId: 'CUS-003', address: '宁波北仑区明州路 66 号', level: 'T4' },
  { id: 'B03', name: '市一医院-主机房', customerId: 'CUS-004', address: '杭州上城浣纱路 261 号', level: 'T3' },
  { id: 'B04', name: '理工大学-信息中心机房', customerId: 'CUS-005', address: '上海杨浦军工路 516 号', level: 'T3' },
  { id: 'B05', name: '能源集团-主数据中心', customerId: 'CUS-006', address: '太原小店长风街 108 号', level: 'T4' },
  { id: 'B06', name: '能源集团-灾备机房', customerId: 'CUS-006', address: '太原晋源区晋祠路 22 号', level: 'T3' },
  { id: 'C01', name: '精密制造-园区机房', customerId: 'CUS-007', address: '苏州工业园区星湖街 328 号', level: 'T3' },
  { id: 'C02', name: '运营商-高新数据中心', customerId: 'CUS-008', address: '广州天河体育东路 128 号', level: 'T4' },
  { id: 'C03', name: '运营商-南沙灾备中心', customerId: 'CUS-008', address: '广州南沙区凤凰大道 9 号', level: 'T4' }
] as const

const DC_IP: Record<string, number> = { A01: 11, A02: 12, A03: 13, B01: 21, B02: 22, B03: 23, B04: 24, B05: 25, B06: 26, C01: 31, C02: 32, C03: 33 }

const VENDOR_MODELS: { vendor: string; model: string; firmware: string }[] = [
  { vendor: '华为', model: 'OceanStor Dorado 6800 V6', firmware: '6.1.6.SPC200' },
  { vendor: '华为', model: 'OceanStor 5510 V6', firmware: '6.1.3.SPC100' },
  { vendor: '华为', model: 'OceanStor Pacific 9550', firmware: '8.1.2.SPC300' },
  { vendor: '浪潮', model: 'AS5500G5', firmware: 'V3.2.1' },
  { vendor: '浪潮', model: 'HF5000', firmware: 'V2.8.6' },
  { vendor: '宏杉', model: 'MS5520', firmware: 'V5.6.2' },
  { vendor: '宏杉', model: 'MS7040', firmware: 'V5.7.1' },
  { vendor: '新华三', model: 'UniStor X10000', firmware: 'V7.1.4' },
  { vendor: '新华三', model: 'UniStor CF22000', firmware: 'V6.3.0' },
  { vendor: '联想凌拓', model: 'NetApp AFF A400', firmware: 'ONTAP 9.12.1' },
  { vendor: '联想凌拓', model: 'NetApp FAS 8300', firmware: 'ONTAP 9.11.1' },
  { vendor: '戴尔', model: 'PowerStore 5000T', firmware: '3.2.0.0' },
  { vendor: '戴尔', model: 'PowerVault ME5024', firmware: 'GT280R010' },
  { vendor: 'Pure Storage', model: 'FlashArray//X70', firmware: '6.5.4' }
]

const DEVICE_TYPES = [
  { type: 'allFlash', name: '全闪存储', short: '全闪' },
  { type: 'hybrid', name: '混闪存储', short: '混闪' },
  { type: 'distributed', name: '分布式存储', short: '分布式' },
  { type: 'backupAppliance', name: '备份一体机', short: '备份' },
  { type: 'tapeLibrary', name: '磁带库', short: '磁带库' },
  { type: 'switch', name: '光纤交换机', short: '交换机' }
] as const

const USES = ['CORE', 'PRD', 'DEV', 'BACKUP', 'ARCHIVE', 'DR']
const FAULT_TITLES = [
  '存储池使用率超过阈值',
  'Oracle 数据库 IO 时延突增',
  '主机多路径链路抖动',
  '控制器缓存电池告警',
  '磁盘预测故障预警',
  '远程复制链路延迟升高',
  'NAS 共享目录访问超时',
  '备份任务连续失败'
]

export function createSeed(): Database {
  const customers: Customer[] = CUSTOMER_SEED.map((c) => ({
    ...c,
    industryName: INDUSTRY_NAME[c.industry],
    contractCount: 1,
    deviceCount: 0,
    totalCapacityTB: 0,
    usedCapacityTB: 0,
    poolCount: 0,
    slaRate: 98,
    ticketCount: 0,
    status: 'active'
  }))

  const datacenters: DataCenter[] = DC_SEED.map((d, i) => {
    const totalU = int(38, 46) * 42
    return {
      ...d,
      customerName: customers.find((c) => c.id === d.customerId)!.name,
      rackCount: int(34, 62),
      totalU,
      usedU: Math.round(totalU * num(0.52, 0.86, 2)),
      powerLoad: num(42, 83),
      temperature: num(21, 25),
      humidity: num(38, 55)
    } as DataCenter
  })

  const clusters: StorageCluster[] = []
  for (let i = 0; i < 18; i++) {
    const customer = customers[i % customers.length]
    const dcs = datacenters.filter((d) => d.customerId === customer.id)
    const dc = pick(dcs.length ? dcs : datacenters)
    const vm = pick(VENDOR_MODELS)
    const total = pick([128, 192, 256, 384, 512, 640, 768, 1024])
    const usage = chance(0.08) ? num(0.9, 0.96) : num(0.36, 0.83)
    const used = Number((total * usage).toFixed(1))
    const health = chance(0.12) ? int(62, 79) : int(88, 99)
    clusters.push({
      id: `CLU-${pad(i + 1)}`,
      name: `${customer.shortName}-${USES[i % USES.length]}-${pad(Math.floor(i / 6) + 1, 2)}`,
      vendor: vm.vendor,
      model: vm.model,
      customerId: customer.id,
      customerName: customer.name,
      datacenter: dc.name,
      datacenterId: dc.id,
      rack: `${dc.id}-R${pad(int(4, 24), 2)}`,
      unit: `U${int(6, 30)}-U${int(32, 42)}`,
      mgmtIp: `10.20.${DC_IP[dc.id]}.${int(10, 240)}`,
      totalTB: total,
      usedTB: used,
      usageRate: Number(((used / total) * 100).toFixed(1)),
      healthScore: health,
      status: health < 70 ? 'warning' : health > 96 ? 'online' : chance(0.05) ? 'maintenance' : 'online',
      firmware: vm.firmware,
      warrantyEnd: dateOnly(NOW + int(-40, 720) * DAY),
      owner: pick(ENGINEERS),
      poolCount: 0,
      volumeCount: 0,
      iops: int(12000, 86000),
      latencyMs: num(0.38, 2.8, 2),
      bandwidthGBps: num(6, 32),
      createdAt: iso(NOW - int(240, 1500) * DAY)
    })
  }

  const pools: StoragePool[] = []
  const volumes: Volume[] = []
  let poolSeq = 0
  let volSeq = 0
  const poolBizes = ['ORA', 'PACS', 'HIS', 'ERP', 'OA', 'CRM', 'VM', 'BKP', 'ARC', 'MES']
  clusters.forEach((cluster, ci) => {
    // 18 个集群共 46 个存储池：前 10 个集群各 3 个，其余各 2 个
    const count = ci < 10 ? 3 : 2
    const shareTotal = cluster.totalTB * 0.94 / count
    for (let p = 0; p < count; p++) {
      poolSeq++
      const total = Math.round(shareTotal * num(0.85, 1.15, 2))
      let usage = num(0.31, 0.86, 3)
      if (chance(0.07)) usage = num(0.91, 0.97, 3)
      const used = Number((total * usage).toFixed(1))
      const grow = num(1.2, 9.6)
      const free = Number((total - used).toFixed(1))
      const pool: StoragePool = {
        id: `POOL-${pad(poolSeq)}`,
        name: `POOL-${cluster.name.split('-')[0]}-${USES[(poolSeq + p) % USES.length]}-${pad(p + 1, 2)}`,
        clusterId: cluster.id,
        clusterName: cluster.name,
        customerId: cluster.customerId,
        customerName: cluster.customerName,
        raidLevel: pick(['RAID6', 'RAID-TP', '三副本', 'RAID10']),
        diskType: pick(['NVMe SSD', 'SAS SSD', '10K SAS', '7.2K NL-SAS']),
        totalTB: total,
        usedTB: used,
        freeTB: free,
        usageRate: Number(((used / total) * 100).toFixed(1)),
        threshold: 85,
        status: usage >= 0.92 ? 'critical' : usage >= 0.85 ? 'warning' : 'normal',
        forecastDays: Math.max(12, Math.round((free / grow) * 30)),
        growRatePerMonth: grow,
        allocatedTB: Number((used * num(0.78, 0.9, 3)).toFixed(1)),
        snapshotTB: Number((used * num(0.03, 0.1, 3)).toFixed(1)),
        metadataTB: 0,
        volumeCount: 0,
        createdAt: iso(NOW - int(180, 1200) * DAY)
      }
      pool.metadataTB = Number((used - pool.allocatedTB - pool.snapshotTB).toFixed(1))
      pools.push(pool)

      // 46 个存储池共 320 个卷：前 44 个池各 7 个，其余各 6 个
      const vCount = poolSeq <= 44 ? 7 : 6
      for (let v = 0; v < vCount; v++) {
        volSeq++
        const cap = pick([256, 512, 1024, 2048, 4096])
        const type = pick(['block', 'block', 'block', 'file', 'object']) as Volume['type']
        volumes.push({
          id: `VOL-${pad(volSeq)}`,
          name: `LUN-${cluster.name.split('-')[0]}-${pick(poolBizes)}-${pick(['DATA', 'LOG', 'IMG', 'TMP'])}${pad(v + 1, 2)}`,
          poolId: pool.id,
          poolName: pool.name,
          clusterId: cluster.id,
          customerId: cluster.customerId,
          customerName: cluster.customerName,
          capacityGB: cap,
          type,
          typeName: type === 'block' ? '块存储' : type === 'file' ? '文件存储' : '对象存储',
          protocol: type === 'block' ? pick(['FC', 'iSCSI']) : type === 'file' ? 'NFS' : 'S3',
          hostCount: int(0, 4),
          snapshotCount: int(0, 12),
          protection: chance(0.3) ? '双活' : chance(0.5) ? '异步复制' : chance(0.6) ? '快照' : '无',
          status: chance(0.06) ? 'warning' : 'normal',
          createdAt: iso(NOW - int(30, 900) * DAY)
        })
      }
      pool.volumeCount = vCount
      cluster.volumeCount += vCount
    }
    cluster.poolCount = count
  })

  const devices: Device[] = []
  for (let i = 0; i < 126; i++) {
    const cluster = clusters[i % clusters.length]
    const typeKey = i % 20 === 0
      ? 'switch'
      : weighted<'allFlash' | 'hybrid' | 'distributed' | 'backupAppliance' | 'tapeLibrary'>(
        { allFlash: 42, hybrid: 28, distributed: 14, backupAppliance: 10, tapeLibrary: 6 }
      )
    const t = DEVICE_TYPES.find((x) => x.type === typeKey) ?? DEVICE_TYPES[0]
    const vm = pick(VENDOR_MODELS.filter((v) => (t.type === 'allFlash' ? v.model.includes('Dorado') || v.model.includes('AFF') || v.model.includes('FlashArray') || v.model.includes('CF22000') : true)))
    const diskCount = t.type === 'switch' ? 0 : pick([24, 25, 24, 36, 48])
    const disks: DiskSlot[] = []
    for (let s = 1; s <= Math.min(diskCount, 24); s++) {
      const bad = chance(0.03)
      disks.push({
        slot: s,
        model: pick(['1.92TB SAS SSD', '3.84TB NVMe SSD', '2.4TB SAS 10K', '8TB SATA 7.2K', '16TB SAS 7.2K']),
        capacityGB: pick([1920, 3840, 2400, 8000, 16000]),
        type: pick(['SSD', 'SSD', 'HDD', 'HDD']),
        health: bad ? int(18, 46) : chance(0.08) ? int(70, 88) : int(92, 100),
        predictFail: bad,
        status: bad ? 'failed' : 'online'
      })
    }
    const badDisks = disks.filter((d) => d.status === 'failed').length
    devices.push({
      id: `DEV-${pad(i + 1)}`,
      name: `${cluster.datacenterId}-${t.short}-${pad(i + 1, 2)}`,
      type: t.type as Device['type'],
      typeName: t.name,
      vendor: vm.vendor,
      model: vm.model,
      sn: `21${String(int(100000, 999999))}${pick(['BTK', 'MBK', 'CNK', 'SZN'])}${String(int(10000, 99999))}${pick(['A', 'B', 'C'])}${String(int(1000, 9999))}`,
      clusterId: cluster.id,
      clusterName: cluster.name,
      customerId: cluster.customerId,
      customerName: cluster.customerName,
      datacenter: cluster.datacenter,
      datacenterId: cluster.datacenterId,
      rack: cluster.rack,
      unit: cluster.unit,
      mgmtIp: `10.20.${DC_IP[cluster.datacenterId]}.${int(10, 240)}`,
      diskCount,
      diskHealth: diskCount === 0 ? 100 : Math.round(((diskCount - badDisks) / diskCount) * 100),
      firmware: vm.firmware,
      warrantyEnd: dateOnly(NOW + int(-60, 640) * DAY),
      status: badDisks > 0 ? 'warning' : chance(0.05) ? 'offline' : chance(0.05) ? 'maintenance' : 'online',
      owner: cluster.owner,
      disks,
      createdAt: iso(NOW - int(120, 1300) * DAY)
    })
  }

  const hosts: Host[] = []
  for (let i = 0; i < 86; i++) {
    const c = customers[i % customers.length]
    hosts.push({
      id: `HOST-${pad(i + 1)}`,
      name: `${c.shortName}-APP-${pad(i + 1, 2)}`,
      customerId: c.id,
      customerName: c.name,
      os: pick(['CentOS 7.9', 'RedHat 8.6', 'Windows Server 2019', 'Ubuntu 22.04', 'AIX 7.2', 'openEuler 22.03']),
      ip: `172.16.${10 + (i % 8)}.${int(20, 240)}`,
      wwpn: `20:${String(int(10, 99))}:00:25:B5:${String(int(10, 99))}:${String(int(10, 99))}:${String(int(10, 99))}`,
      iqn: `iqn.2024-06.com.example:${c.shortName.toLowerCase()}-app-${pad(i + 1, 3)}`,
      volumeCount: int(1, 6),
      status: chance(0.05) ? 'offline' : 'online'
    })
  }

  const serviceItems: ServiceItem[] = [
    { id: 'SRV-01', name: '故障处理', icon: 'Warning', desc: '存储设备硬件故障、链路异常、性能劣化等问题的诊断与修复', responseHours: 0.5, resolveHours: 8, pricing: '按合同含', delivery: '故障报告、修复记录', scope: '全部纳管设备', orderCount: 0 },
    { id: 'SRV-02', name: '巡检服务', icon: 'Search', desc: '周期性健康检查，覆盖容量、性能、硬件、复制与备份状态', responseHours: 4, resolveHours: 24, pricing: '人天', delivery: '巡检报告、风险清单', scope: '全部纳管设备', orderCount: 0 },
    { id: 'SRV-03', name: '扩容实施', icon: 'FolderAdd', desc: '存储池扩容、磁盘扩容、控制器升级的现场实施与验证', responseHours: 8, resolveHours: 72, pricing: '人天', delivery: '实施方案、验收单', scope: '签约客户', orderCount: 0 },
    { id: 'SRV-04', name: '数据迁移', icon: 'Switch', desc: '跨阵列、跨机房的数据迁移与业务割接，含迁移演练', responseHours: 8, resolveHours: 120, pricing: '人天', delivery: '迁移方案、割接记录', scope: '签约客户', orderCount: 0 },
    { id: 'SRV-05', name: '性能调优', icon: 'TrendCharts', desc: '缓存策略、队列深度、多路径、文件系统参数的系统性调优', responseHours: 4, resolveHours: 48, pricing: '人天', delivery: '调优报告、基线对比', scope: '签约客户', orderCount: 0 },
    { id: 'SRV-06', name: '驻场服务', icon: 'User', desc: '工程师按周期驻场，承担日常运维、变更配合与应急响应', responseHours: 0.25, resolveHours: 4, pricing: '人月', delivery: '驻场日志、周报', scope: '签约客户', orderCount: 0 },
    { id: 'SRV-07', name: '备件更换', icon: 'Box', desc: '硬盘、电源、电池、光模块等部件更换与旧件返修', responseHours: 2, resolveHours: 12, pricing: '按件计费', delivery: '更换记录、返修单', scope: '在保设备', orderCount: 0 },
    { id: 'SRV-08', name: '容灾演练', icon: 'Connection', desc: '双活切换、异步复制倒换、备份恢复演练与 RPO/RTO 验证', responseHours: 8, resolveHours: 96, pricing: '人天', delivery: '演练方案、演练报告', scope: '签约客户', orderCount: 0 }
  ]

  const serviceNameMap: Record<string, string> = {
    fault: '故障处理', inspection: '巡检服务', expand: '扩容实施', migrate: '数据迁移',
    tune: '性能调优', spare: '备件更换', drill: '容灾演练', onsite: '驻场服务'
  }
  const tickets: Ticket[] = []
  for (let i = 0; i < 268; i++) {
    const customer = customers[i % customers.length]
    const svcKey = weighted<'fault' | 'inspection' | 'expand' | 'migrate' | 'tune' | 'spare' | 'drill' | 'onsite'>(
      { fault: 44, inspection: 13, expand: 10, migrate: 6, tune: 8, spare: 9, drill: 4, onsite: 6 }
    )
    const serviceItem = serviceNameMap[svcKey]
    const custPools = pools.filter((p) => p.customerId === customer.id)
    const custClusters = clusters.filter((c) => c.customerId === customer.id)
    const custDevices = devices.filter((d) => d.customerId === customer.id)
    const pool = pick(custPools.length ? custPools : pools)
    const cluster = pick(custClusters.length ? custClusters : clusters)
    const device = pick(custDevices.length ? custDevices : devices)
    const prio = weighted<'P1' | 'P2' | 'P3' | 'P4'>({ P1: 6, P2: 18, P3: 52, P4: 24 })
    const status = weighted<'pending' | 'assigned' | 'processing' | 'suspended' | 'resolved' | 'closed'>(
      { pending: 5, assigned: 8, processing: 18, suspended: 3, resolved: 8, closed: 58 }
    )
    const isOpen = ['pending', 'assigned', 'processing', 'suspended'].includes(status)
    const createdOffset = isOpen ? int(0, 9) * DAY + int(0, 20) * HOUR : int(15, 358) * DAY + int(0, 20) * HOUR
    const createdAt = NOW - createdOffset
    const responseMin = prio === 'P1' ? int(4, 20) : prio === 'P2' ? int(10, 55) : prio === 'P3' ? int(25, 200) : int(45, 460)
    const breach = chance(0.05)
    const respondedAt = createdAt + (breach ? responseMin + int(20, 120) : responseMin) * 60_000
    const resolveHours = prio === 'P1' ? num(1, 6) : prio === 'P2' ? num(2, 12) : prio === 'P3' ? num(4, 36) : num(8, 70)
    const resolvedAt = respondedAt + resolveHours * HOUR
    const responseDue = createdAt + (prio === 'P1' ? 0.25 : prio === 'P2' ? 0.5 : prio === 'P3' ? 2 : 4) * HOUR
    const resolveDue = createdAt + (prio === 'P1' ? 4 : prio === 'P2' ? 8 : prio === 'P3' ? 24 : 48) * HOUR
    const slaResponseOk = respondedAt <= responseDue
    const finished = status === 'closed' || status === 'resolved'
    const slaResolveOk = finished ? resolvedAt <= resolveDue : null

    let title = ''
    let description = ''
    let resourceIds: string[] = []
    let resourceNames: string[] = []
    if (svcKey === 'fault') {
      title = `${pool.name} ${pick(['IO 时延突增', '使用率告警', '链路抖动', '缓存命中率下降'])}`
      resourceIds = [cluster.id, pool.id]
      resourceNames = [cluster.name, pool.name]
      description = `今日 ${String(int(8, 10)).padStart(2, '0')}:${String(int(10, 59))} 监控告警提示该资源指标异常。业务侧反馈 ${pick(['Oracle 数据库写入出现间歇性卡顿', 'PACS 影像调阅加载缓慢', '虚拟化集群出现存储超时告警', 'HIS 系统批量结算变慢'])}。初步排查：${pick(['池内快照保留周期过长，占用约 12.4TB', '阵列前端端口队列深度打满，平均时延升至 18ms', '一台控制器缓存电池失效导致写缓存降级', '多路径软件单链路异常，未自动切换'])}。已临时${pick(['清理过期快照 4 个，释放 3.2TB', '调整队列深度并重启主机多路径服务', '将写策略切换为直写模式', '手工切换至备用链路'])}，指标回落，待观察 24 小时。`
    } else if (svcKey === 'inspection') {
      title = `${customer.shortName} 存储季度巡检服务`
      resourceIds = custClusters.slice(0, 2).map((c) => c.id)
      resourceNames = custClusters.slice(0, 2).map((c) => c.name)
      description = `按合同约定开展季度巡检，检查范围覆盖 ${custClusters.length} 套存储集群、${custPools.length} 个存储池、${custDevices.length} 台设备。检查项包括容量水位、性能基线、硬件健康、复制状态、备份成功率与固件版本合规性，输出巡检报告与风险整改建议。`
    } else if (svcKey === 'expand') {
      title = `${pool.name} 扩容 40TB 实施`
      resourceIds = [pool.id]
      resourceNames = [pool.name]
      description = `该池近 6 个月月均增长 ${pool.growRatePerMonth}TB，预计可用天数 ${pool.forecastDays} 天，已低于 90 天安全线。申请扩容 40TB（新增 8 块 7.68TB SAS SSD），实施窗口为周六 22:00-次日 02:00，扩容期间业务为降级运行，需客户确认变更窗口。`
    } else if (svcKey === 'migrate') {
      title = `${customer.shortName} PACS 影像数据迁移至归档池`
      resourceIds = [cluster.id, pool.id]
      resourceNames = [cluster.name, pool.name]
      description = `将 2019-2021 年历史影像数据（约 86TB）迁移至归档池，采用主机侧 rsync + 存储侧远程复制双通道。迁移前完成 10% 数据抽样校验，割接窗口 4 小时，需客户信息科与影像科同时在场确认。`
    } else if (svcKey === 'tune') {
      title = `${cluster.name} 缓存策略与队列深度调优`
      resourceIds = [cluster.id]
      resourceNames = [cluster.name]
      description = `业务高峰期 IOPS 波动较大，随机写占比较高。计划调整读写缓存配比至 3:7、前端端口队列深度由 256 提升至 512，并复核多路径策略与文件系统挂载参数，调优后对比 72 小时性能基线。`
    } else if (svcKey === 'spare') {
      title = `${device.name} 硬盘故障更换`
      resourceIds = [device.id]
      resourceNames = [device.name]
      description = `设备上报槽位 ${int(3, 20)} 磁盘预测故障，介质错误计数持续增长。备件库有同型号 1.92TB SAS SSD 现货，计划现场更换并观察重构进度，旧件按返修流程寄回厂商。`
    } else if (svcKey === 'drill') {
      title = `${customer.shortName} 容灾切换演练`
      resourceIds = custClusters.slice(0, 2).map((c) => c.id)
      resourceNames = custClusters.slice(0, 2).map((c) => c.name)
      description = `开展年度容灾演练，验证双活站点切换与异步复制倒换流程，目标 RPO ≤ 15 分钟、RTO ≤ 30 分钟。演练分为方案宣贯、预演、正式切换、回切四个阶段，全程记录时间点与异常。`
    } else {
      title = `${customer.shortName} 月度驻场技术支持`
      resourceIds = []
      resourceNames = []
      description = `工程师按合同约定每周驻场 3 天，承担日常巡检、变更配合、容量规划与应急响应，输出驻场日志与周报，月末汇总服务工时。`
    }

    const assignee = pick(ENGINEERS)
    const timeline: TimelineItem[] = [
      { time: iso(createdAt), actor: pick(['系统', customer.contactName, '服务台-林悦']), action: '创建工单', remark: `来源：${pick(['告警自动转单', '客户电话报障', '门户自助提交', '邮件报障', '现场提出'])}` }
    ]
    if (status !== 'pending') {
      timeline.push({ time: iso(createdAt + int(3, 18) * 60_000), actor: '服务台-林悦', action: '受理并派单', remark: `派至${pick(GROUPS)} · ${assignee}`, cost: `${int(3, 18)} 分钟` })
    }
    if (['processing', 'resolved', 'closed', 'suspended'].includes(status)) {
      timeline.push({ time: iso(respondedAt), actor: assignee, action: '开始处理', remark: pick(['已远程登录设备核查指标', '已到达现场，开始硬件排查', '已联系厂商二线支持', '已获取客户授权，准备变更']) })
      timeline.push({ time: iso(respondedAt + 40 * 60_000), actor: assignee, action: '处理中', remark: pick(['定位为快照占用过高，开始清理', '确认单链路故障，切换备用链路', '更换故障硬盘，重构进度 32%', '调整缓存策略并观察']) })
    }
    if (status === 'suspended') {
      timeline.push({ time: iso(respondedAt + 2 * HOUR), actor: assignee, action: '挂起', remark: '等待客户确认变更窗口，暂挂起' })
    }
    if (finished) {
      timeline.push({ time: iso(resolvedAt), actor: assignee, action: '已解决', remark: pick(['指标恢复正常，观察 24 小时无反复', '故障部件已更换，重构完成', '扩容实施完成，容量水位降至 61%', '调优完成，时延下降 46%']), cost: `${resolveHours.toFixed(1)} 小时` })
    }
    if (status === 'closed') {
      timeline.push({ time: iso(resolvedAt + int(2, 40) * HOUR), actor: customer.contactName, action: '验收通过并关闭', remark: pick(['业务验证正常，同意关闭', '已确认修复效果，服务满意', '验收通过']) })
    }

    const attachments: Attachment[] = chance(0.55)
      ? [{ name: pick(['性能监控截图.png', '巡检报告.pdf', '变更方案.docx', '故障日志.txt']), size: `${num(0.3, 6.8).toFixed(1)} MB`, uploader: assignee, time: iso(respondedAt) }]
      : []

    const closedAt = status === 'closed' ? resolvedAt + int(2, 40) * HOUR : undefined
    tickets.push({
      id: `WO-${iso(createdAt).slice(0, 7).replace('-', '')}-${pad(i + 1)}`,
      title,
      customerId: customer.id,
      customerName: customer.name,
      contact: `${customer.contactName} ${customer.contactPhone}`,
      serviceItem,
      priority: prio,
      status,
      source: pick(['alarm', 'phone', 'email', 'portal', 'onsite']),
      sourceName: '',
      resourceIds,
      resourceNames,
      description,
      solution: finished ? pick(['清理过期快照并调整快照保留策略至 7 天，扩容 40TB 后水位降至 61%。', '更换故障硬盘并完成数据重构，重构期间业务无感知。', '调整缓存配比与队列深度，时延由 18ms 降至 6.2ms。', '切换备用链路并修复原链路光模块，双链路恢复。']) : undefined,
      assignee: status === 'pending' ? '' : assignee,
      assigneeGroup: status === 'pending' ? '' : pick(GROUPS),
      creator: pick(['系统', '服务台-林悦', customer.contactName]),
      createdAt: iso(createdAt),
      respondedAt: status === 'pending' ? undefined : iso(respondedAt),
      resolvedAt: finished ? iso(resolvedAt) : undefined,
      closedAt: closedAt ? iso(closedAt) : undefined,
      responseDue: iso(responseDue),
      resolveDue: iso(resolveDue),
      slaResponseOk,
      slaResolveOk,
      workHours: finished ? num(0.5, 9.5) : status === 'processing' ? num(0.3, 4) : 0,
      satisfaction: status === 'closed'
        ? (chance(0.1) ? null : Number(pick(['5', '5', '5', '5', '5', '5', '4', '4', '4', '3', '5', '5', '5', '5', '4', '4', '3', '2', '5', '5'])))
        : null,
      satisfactionTags: [],
      satisfactionComment: undefined,
      contractId: '',
      attachments,
      timeline
    })
  }
  tickets.forEach((t) => {
    t.sourceName = { alarm: '告警转单', phone: '电话', email: '邮件', portal: '服务门户', onsite: '现场' }[t.source]
    if (t.satisfaction && t.satisfaction >= 4) {
      t.satisfactionTags = ['响应及时', '技术专业', '态度好'].slice(0, int(1, 3))
      if (chance(0.5)) t.satisfactionComment = pick(['处理很快，业务恢复及时。', '工程师排查思路清晰，给出了长期优化建议。', '服务态度好，沟通顺畅。'])
    } else if (t.satisfaction) {
      t.satisfactionTags = ['解决不彻底']
    }
  })

  const contracts: Contract[] = customers.map((c, i) => {
    const level = c.level === 'A' ? 'gold' : c.level === 'B' ? 'silver' : 'bronze'
    const quota = level === 'gold' ? 240 : level === 'silver' ? 120 : 60
    const endOffset = i === 2 ? int(30, 80) : int(120, 620)
    return {
      id: `CON-2026-${pad(i + 1, 3)}`,
      customerId: c.id,
      customerName: c.name,
      level,
      levelName: level === 'gold' ? '黄金级' : level === 'silver' ? '白银级' : '青铜级',
      startDate: dateOnly(NOW - 300 * DAY),
      endDate: dateOnly(NOW + endOffset * DAY),
      quotaDays: quota,
      usedDays: int(20, Math.round(quota * 0.86)),
      deviceCount: devices.filter((d) => d.customerId === c.id).length,
      amount: int(460, 1580) * 1000,
      status: endOffset < 90 ? 'expiring' : 'active',
      manager: c.manager,
      slaItems: serviceItems.map((s) => ({
        serviceItem: s.name,
        responseHours: s.responseHours,
        resolveHours: s.resolveHours,
        penalty: s.responseHours <= 0.5 ? '每超时 1 小时减免当月服务费 2%，上限 20%' : '每超时 4 小时减免当月服务费 1%，上限 10%'
      })),
      coveredDeviceIds: devices.filter((d) => d.customerId === c.id).map((d) => d.id)
    }
  })
  tickets.forEach((t) => {
    const c = contracts.find((x) => x.customerId === t.customerId)
    t.contractId = c ? c.id : ''
  })

  const ALARM_TEMPLATES = [
    { type: 'capacity', typeName: '容量', title: (o: string) => `存储池 ${o} 使用率超过 85%`, level: 'P2' as const, value: '86.8%', threshold: '85%', suggestion: '建议对该池扩容 40TB，或将冷数据迁移至归档池后清理过期快照。', objectType: 'pool' as const },
    { type: 'capacity', typeName: '容量', title: (o: string) => `存储池 ${o} 使用率超过 92%，剩余容量不足 30 天`, level: 'P1' as const, value: '93.4%', threshold: '92%', suggestion: '立即发起扩容变更，同时清理过期快照与回收未使用卷。', objectType: 'pool' as const },
    { type: 'performance', typeName: '性能', title: (o: string) => `${o} 平均时延超过 15ms`, level: 'P2' as const, value: '18.6ms', threshold: '15ms', suggestion: '检查前端端口队列深度与主机多路径状态，必要时调整缓存配比。', objectType: 'cluster' as const },
    { type: 'hardware', typeName: '硬件', title: (o: string) => `${o} 槽位 7 磁盘预测故障`, level: 'P3' as const, value: '介质错误 142 次', threshold: '50 次', suggestion: '安排备件更换，更换前确认池内热备盘可用。', objectType: 'device' as const },
    { type: 'link', typeName: '链路', title: (o: string) => `${o} 主机多路径单链路中断`, level: 'P2' as const, value: '1/4 链路在线', threshold: '≥3 条', suggestion: '检查光模块与交换机端口，确认多路径软件是否自动切换。', objectType: 'cluster' as const },
    { type: 'replication', typeName: '复制', title: (o: string) => `${o} 远程复制延迟超过 30 分钟`, level: 'P2' as const, value: '42 分钟', threshold: '30 分钟', suggestion: '检查复制链路带宽与增量数据量，必要时临时提升链路带宽。', objectType: 'cluster' as const },
    { type: 'performance', typeName: '性能', title: (o: string) => `${o} IOPS 跌至基线 40% 以下`, level: 'P3' as const, value: '8,420', threshold: '20,000', suggestion: '排查是否存在大流量顺序读、备份任务抢占或控制器单点运行。', objectType: 'cluster' as const }
  ]
  const alarms: Alarm[] = []
  for (let i = 0; i < 186; i++) {
    const tpl = pick(ALARM_TEMPLATES)
    let objId = ''
    let objName = ''
    let custId = ''
    let custName = ''
    if (tpl.objectType === 'pool') {
      const p = pick(pools)
      objId = p.id; objName = p.name; custId = p.customerId; custName = p.customerName
    } else if (tpl.objectType === 'cluster') {
      const c = pick(clusters)
      objId = c.id; objName = c.name; custId = c.customerId; custName = c.customerName
    } else {
      const d = pick(devices)
      objId = d.id; objName = d.name; custId = d.customerId; custName = d.customerName
    }
    const occurredAt = NOW - int(10, 7 * 24 * 60) * 60_000
    const status = weighted<'active' | 'acked' | 'recovered' | 'closed'>({ active: 24, acked: 15, recovered: 39, closed: 22 })
    alarms.push({
      id: `ALM-${pad(i + 1)}`,
      level: tpl.level,
      type: tpl.type as Alarm['type'],
      typeName: tpl.typeName,
      title: tpl.title(objName),
      objectType: tpl.objectType,
      objectId: objId,
      objectName: objName,
      customerId: custId,
      customerName: custName,
      value: tpl.value,
      threshold: tpl.threshold,
      occurredAt: iso(occurredAt),
      status,
      handler: ['active'].includes(status) ? '' : pick(ENGINEERS),
      durationMinutes: Math.round((NOW - occurredAt) / 60_000),
      suggestion: tpl.suggestion
    })
  }
  alarms.filter((a) => a.status === 'active').slice(0, 5).forEach((a, idx) => {
    a.ticketId = tickets[idx]?.id
  })

  const SPARE_BASE = [
    { name: '1.92TB SAS SSD', model: 'HSSD-1920-SAS', applicable: 'OceanStor Dorado / AS5500G5', price: 8600 },
    { name: '3.84TB NVMe SSD', model: 'HSSD-3840-NVMe', applicable: 'OceanStor Dorado 6800 V6', price: 16800 },
    { name: '2.4TB SAS 10K 硬盘', model: 'HDD-2400-SAS', applicable: 'AS5500G5 / MS5520', price: 3200 },
    { name: '8TB SATA 7.2K 近线盘', model: 'HDD-8000-SATA', applicable: 'OceanStor Pacific 9550', price: 4100 },
    { name: '16TB SAS 7.2K 近线盘', model: 'HDD-16000-SAS', applicable: 'UniStor X10000', price: 6800 },
    { name: '16Gb FC 光模块', model: 'SFP-16G-SW', applicable: '通用 FC 交换机', price: 1200 },
    { name: '32Gb FC 光模块', model: 'SFP-32G-SW', applicable: '通用 FC 交换机', price: 2600 },
    { name: '控制器缓存电池', model: 'BAT-CTRL-01', applicable: 'MS5520 / MS7040', price: 2400 },
    { name: 'BBU 电池组', model: 'BBU-6000', applicable: 'PowerStore 5000T', price: 3600 },
    { name: '800W 电源模块', model: 'PSU-800W', applicable: '通用机架存储', price: 1800 },
    { name: '1200W 电源模块', model: 'PSU-1200W', applicable: 'OceanStor 5510 V6', price: 2300 },
    { name: '风扇模块', model: 'FAN-MOD-02', applicable: '通用机架存储', price: 900 },
    { name: 'SAS 扩展卡', model: 'HBA-SAS-12G', applicable: '通用机架存储', price: 1500 },
    { name: '10GE 电口模块', model: 'SFP-10G-T', applicable: '通用交换机', price: 980 },
    { name: '25GE 光模块', model: 'SFP-25G-SR', applicable: '分布式存储节点', price: 1600 },
    { name: '磁带 LTO-8', model: 'LTO-8-CART', applicable: '磁带库', price: 620 }
  ]
  const spares: SparePart[] = []
  for (let i = 0; i < 52; i++) {
    const base = SPARE_BASE[i % SPARE_BASE.length]
    const stock = chance(0.14) ? int(0, 2) : int(3, 24)
    spares.push({
      id: `SP-${pad(i + 1)}`,
      code: `SP${String(1000 + i)}`,
      name: base.name,
      model: base.model,
      applicable: base.applicable,
      warehouse: pick(['A 库-滨江', 'B 库-萧山', '现场库-驻场车']),
      stock,
      safetyStock: int(3, 6),
      unitPrice: base.price,
      status: stock === 0 ? 'out' : stock <= 3 ? 'low' : 'normal'
    })
  }
  const spareRecords: SpareRecord[] = []
  for (let i = 0; i < 68; i++) {
    const sp = pick(spares)
    const type = weighted<'in' | 'out' | 'repair' | 'scrap'>({ in: 34, out: 46, repair: 14, scrap: 6 })
    spareRecords.push({
      id: `SR-${pad(i + 1)}`,
      spareId: sp.id,
      spareName: sp.name,
      type,
      typeName: { in: '入库', out: '出库领用', repair: '返修', scrap: '报废' }[type],
      quantity: int(1, 4),
      ticketId: type === 'out' ? pick(tickets).id : undefined,
      operator: pick(ENGINEERS),
      warehouse: sp.warehouse,
      time: iso(NOW - int(1, 200) * DAY),
      remark: type === 'out' ? '工单领用更换故障件' : type === 'in' ? '厂商补货入库' : type === 'repair' ? '旧件寄回厂商返修' : '确认损坏，走报废流程'
    })
  }

  const KB_TITLES: Record<string, string[]> = {
    fault: [
      'OceanStor Dorado 控制器缓存电池失效导致写性能下降的处置',
      '存储池使用率突增的快速定位与临时缓解',
      '主机多路径链路频繁切换的排查路径',
      '远程复制延迟告警的六种常见原因',
      'PACS 影像调阅缓慢的存储侧排查清单',
      '硬盘预测故障与热备盘重构注意事项',
      'NAS 共享目录访问超时的定位方法',
      '备份任务连续失败的排错顺序'
    ],
    manual: [
      '存储池扩容标准作业指导书（SOP）',
      'LUN 创建、映射与多路径配置手册',
      '存储双活站点切换操作手册',
      '快照策略配置与过期快照清理规范',
      '设备固件升级前的检查清单',
      '备件更换与旧件返修流程说明'
    ],
    best: [
      '政务云存储资源池规划建议（按业务分级）',
      '医院 PACS 归档存储的分层设计实践',
      '金融核心系统存储双活架构落地经验',
      '如何为虚拟化集群设计合理的队列深度',
      '存储容量水位线与扩容触发机制设计',
      '存储性能基线的建立与持续校准'
    ],
    faq: [
      '为什么存储池使用率与文件系统使用率不一致？',
      '扩容后主机侧为什么看不到新增容量？',
      '快照会占用多少额外空间？',
      '双活与异步复制应该如何选择？',
      '设备保修到期后还能继续使用吗？',
      '备件领用需要哪些审批？'
    ],
    doc: [
      'OceanStor Dorado 6800 V6 产品规格',
      '浪潮 AS5500G5 硬件安装指南',
      'NetApp AFF A400 ONTAP 命令速查',
      'PowerStore 5000T 日常维护手册',
      'UniStor X10000 分布式存储架构说明',
      'OceanProtect X8000 备份配置指南'
    ]
  }
  const CATEGORY_NAME: Record<string, string> = { fault: '故障案例', manual: '操作手册', best: '最佳实践', faq: 'FAQ', doc: '产品文档' }
  const knowledge: KnowledgeArticle[] = []
  for (let i = 0; i < 64; i++) {
    const cat = pick(['fault', 'manual', 'best', 'faq', 'doc']) as KnowledgeArticle['category']
    const list = KB_TITLES[cat]
    const baseTitle = list[i % list.length]
    const title = i < list.length ? baseTitle : `${baseTitle}（案例 ${Math.floor(i / list.length) + 1}）`
    knowledge.push({
      id: `KB-${pad(i + 1)}`,
      title,
      category: cat,
      categoryName: CATEGORY_NAME[cat],
      tags: [pick(['容量', '性能', '硬件', '复制', '备份', '多路径']), pick(['华为', '浪潮', '宏杉', '新华三', 'NetApp', 'Dell'])].slice(0, int(1, 2)),
      summary: `本文围绕「${baseTitle}」展开，包含现象描述、影响评估、排查步骤、处置方案与后续预防措施，适用于一线运维与驻场工程师参考。`,
      content: `## 现象描述\n\n业务侧反馈存储访问出现异常，监控平台产生对应告警。典型表现为响应时间升高、吞吐下降或容量水位快速上涨。\n\n## 影响评估\n\n- 影响范围：单个存储池 / 单套集群\n- 业务影响：读写时延升高，批处理窗口延长\n- 紧急程度：P2，建议 2 小时内响应\n\n## 排查步骤\n\n1. 登录设备确认告警详情与发生时间\n2. 检查存储池容量构成（已分配 / 快照 / 元数据 / 未分配）\n3. 检查前端端口队列深度与主机多路径状态\n4. 对比近 7 天性能基线，确认是否为突发流量\n\n## 处置方案\n\n| 场景 | 处置动作 | 预期效果 |\n| --- | --- | --- |\n| 快照占用过高 | 清理过期快照，调整保留周期至 7 天 | 释放 5%-15% 容量 |\n| 队列打满 | 调整端口队列深度，均衡前端压力 | 时延下降 30%-50% |\n| 单链路故障 | 更换光模块，恢复双链路 | 消除单点风险 |\n\n\`\`\`bash\n# 查看池容量构成\nshow pool capacity detail\n\n# 查看前端端口性能\nshow port performance --interval 5s\n\`\`\`\n\n## 后续预防\n\n- 将容量阈值纳入日常巡检项，85% 预警、92% 强制扩容\n- 每季度复核快照策略与归档策略\n- 建立性能基线，异常波动超过 30% 即触发巡检`,
      author: pick(ENGINEERS),
      views: int(60, 1860),
      helpful: int(12, 320),
      updatedAt: iso(NOW - int(1, 300) * DAY)
    })
  }

  const changes: Change[] = []
  for (let i = 0; i < 22; i++) {
    const t = pick(tickets.filter((x) => x.serviceItem === '扩容实施' || x.serviceItem === '性能调优'))
    const c = customers.find((x) => x.id === t.customerId)!
    const status = weighted<'approving' | 'approved' | 'implementing' | 'verifying' | 'closed'>({ approving: 18, approved: 14, implementing: 18, verifying: 10, closed: 40 })
    const start = NOW + int(-40, 14) * DAY
    changes.push({
      id: `CHG-202610-${pad(i + 1)}`,
      title: t ? t.title.replace('实施', '变更') : `${c.shortName} 存储扩容变更`,
      type: pick(['standard', 'normal', 'emergency']),
      typeName: '',
      risk: pick(['high', 'medium', 'low']),
      customerId: c.id,
      customerName: c.name,
      resourceIds: t?.resourceIds ?? [],
      resourceNames: t?.resourceNames ?? [],
      windowStart: iso(start + 14 * HOUR),
      windowEnd: iso(start + 18 * HOUR),
      owner: pick(ENGINEERS),
      approver: c.manager,
      status,
      rollbackPlan: '若扩容后主机侧无法识别新容量，回退 LUN 映射并恢复原多路径配置；若性能未达预期，回滚缓存参数至变更前快照。',
      reason: '容量水位或性能指标已接近阈值，需在业务低峰期实施调整。',
      createdAt: iso(start - int(2, 10) * DAY)
    })
  }
  changes.forEach((c) => {
    c.typeName = { standard: '标准变更', normal: '常规变更', emergency: '紧急变更' }[c.type]
  })

  const inspections: Inspection[] = []
  const INSPECT_ITEMS = ['容量水位', '控制器状态', '磁盘健康', '前端端口', '复制状态', '备份成功率', '固件版本', '告警收敛', '日志错误', '性能基线']
  for (let i = 0; i < 14; i++) {
    const c = customers[i % customers.length]
    const items: InspectionItem[] = INSPECT_ITEMS.map((name) => {
      const result = chance(0.1) ? 'warn' : chance(0.04) ? 'fail' : 'pass'
      return {
        name,
        result: result as InspectionItem['result'],
        detail: result === 'pass' ? '指标正常，处于基线范围' : result === 'warn' ? '接近阈值，建议关注' : '超出阈值，需整改'
      }
    })
    const pass = items.filter((x) => x.result === 'pass').length
    inspections.push({
      id: `INS-${pad(i + 1)}`,
      name: `${c.shortName} 存储${i % 3 === 0 ? '月度' : '周度'}巡检`,
      customerId: c.id,
      customerName: c.name,
      cycle: i % 3 === 0 ? 'monthly' : 'weekly',
      cycleName: i % 3 === 0 ? '每月' : '每周',
      executor: pick(ENGINEERS),
      executedAt: iso(NOW - int(1, 90) * DAY),
      status: i < 2 ? 'running' : 'done',
      passRate: Math.round((pass / items.length) * 100),
      items
    })
  }

  const users: User[] = [
    { id: 'U-001', name: '系统管理员', account: 'admin', role: 'admin', roleName: '平台管理员', department: '信息管理部', phone: '138****0001', email: 'admin@storageops.cn', status: 'active', lastLoginAt: iso(NOW - 2 * HOUR), avatarColor: '#1668DC' },
    { id: 'U-002', name: '张伟', account: 'manager', role: 'service_manager', roleName: '服务经理', department: '服务交付部', phone: '138****0002', email: 'zhangwei@storageops.cn', status: 'active', lastLoginAt: iso(NOW - 5 * HOUR), avatarColor: '#13C2C2' },
    { id: 'U-003', name: '陈立', account: 'engineer', role: 'engineer', roleName: '存储运维工程师', department: '技术服务部', phone: '138****0003', email: 'chenli@storageops.cn', status: 'active', lastLoginAt: iso(NOW - 1 * HOUR), avatarColor: '#7C5CFC' },
    { id: 'U-004', name: '李建国', account: 'customer', role: 'customer_admin', roleName: '客户管理员', department: '市政务云管理中心', phone: '138****6721', email: 'ligj@gov-cloud.cn', status: 'active', lastLoginAt: iso(NOW - 26 * HOUR), avatarColor: '#F5A524', customerId: 'CUS-001' },
    { id: 'U-005', name: '林悦', account: 'desk', role: 'service_desk', roleName: '服务台坐席', department: '服务台', phone: '138****0005', email: 'linyue@storageops.cn', status: 'active', lastLoginAt: iso(NOW - 3 * HOUR), avatarColor: '#22C55E' },
    { id: 'U-006', name: '周敏', account: 'viewer', role: 'viewer', roleName: '领导 / 审计', department: '运营管理部', phone: '138****0006', email: 'zhoumin@storageops.cn', status: 'active', lastLoginAt: iso(NOW - 48 * HOUR), avatarColor: '#94A3B8' }
  ]
  const departments = ['技术服务部', '服务交付部', '驻场服务组', '容灾与备份组', '服务台']
  for (let i = 0; i < 20; i++) {
    const name = i < ENGINEERS.length ? ENGINEERS[i] : `工程师${pad(i + 1, 2)}`
    users.push({
      id: `U-${pad(users.length + 1, 3)}`,
      name,
      account: `eng${pad(i + 1, 2)}`,
      role: i % 7 === 0 ? 'service_desk' : 'engineer',
      roleName: i % 7 === 0 ? '服务台坐席' : '存储运维工程师',
      department: pick(departments),
      phone: `13${int(1, 9)}****${int(1000, 9999)}`,
      email: `eng${pad(i + 1, 2)}@storageops.cn`,
      status: chance(0.1) ? 'disabled' : 'active',
      lastLoginAt: iso(NOW - int(1, 240) * HOUR),
      avatarColor: pick(['#1668DC', '#13C2C2', '#7C5CFC', '#F5A524', '#22C55E'])
    })
  }

  const logs: LogEntry[] = []
  const LOG_ACTIONS = [
    { module: '工单管理', action: '派单', target: () => pick(tickets).id },
    { module: '工单管理', action: '关闭工单', target: () => pick(tickets).id },
    { module: '告警中心', action: '确认告警', target: () => pick(alarms).id },
    { module: '资源管理', action: '发起扩容变更', target: () => pick(pools).id },
    { module: '备件管理', action: '备件出库', target: () => pick(spares).id },
    { module: '知识库', action: '发布文章', target: () => pick(knowledge).id },
    { module: '系统管理', action: '修改角色权限', target: () => 'role:engineer' },
    { module: '服务合同', action: '查看合同', target: () => pick(contracts).id },
    { module: '登录', action: '登录系统', target: () => 'session' }
  ]
  for (let i = 0; i < 300; i++) {
    const a = pick(LOG_ACTIONS)
    logs.push({
      id: `LOG-${pad(i + 1)}`,
      time: iso(NOW - int(1, 30 * 24 * 60) * 60_000),
      actor: pick([...ENGINEERS, '系统管理员', '林悦']),
      module: a.module,
      action: a.action,
      target: a.target(),
      ip: `10.20.1.${int(10, 240)}`,
      result: chance(0.04) ? 'fail' : 'success',
      detail: '{"result":"ok"}'
    })
  }

  const messages: Message[] = []
  const MSG_SEED = [
    { type: 'alarm', title: 'P1 告警：存储池使用率超过 92%', content: 'POOL-GOV-PRD-01 使用率 93.4%，剩余容量不足 30 天，请立即处理。', link: '/monitor/alarms' },
    { type: 'ticket', title: '工单待派单：政务云核心存储 IO 时延突增', content: '工单 WO-202610-0042 已受理，等待派单。', link: '/service/tickets' },
    { type: 'approval', title: '变更审批：POOL-MED-PRD-01 扩容 40TB', content: '变更单 CHG-202610-0007 等待您的审批。', link: '/service/changes' },
    { type: 'system', title: '合同到期提醒：城商行数据中心', content: '合同 CON-2026-003 将于 90 天内到期，请提前续签。', link: '/service/contracts' },
    { type: 'ticket', title: '工单待验收：市一医院 PACS 数据迁移', content: '工单已解决，等待客户验收。', link: '/service/tickets' },
    { type: 'alarm', title: 'P2 告警：主机多路径单链路中断', content: 'BANK-CORE-01 检测到 1/4 链路在线，请检查光模块。', link: '/monitor/alarms' },
    { type: 'system', title: '巡检报告已生成', content: '省能源集团 10 月存储巡检报告已生成，共 2 项风险。', link: '/monitor/inspections' },
    { type: 'ticket', title: '工单超时预警：备件更换', content: '工单 WO-202609-0118 距离解决时限剩余 45 分钟。', link: '/service/tickets' }
  ]
  MSG_SEED.forEach((m, i) => {
    messages.push({
      id: `MSG-${pad(i + 1)}`,
      type: m.type as Message['type'],
      typeName: { alarm: '告警', ticket: '工单', approval: '审批', system: '系统' }[m.type],
      title: m.title,
      content: m.content,
      time: iso(NOW - int(1, 96) * 60 * 60_000),
      read: i > 5,
      link: m.link
    })
  })
  for (let i = 0; i < 6; i++) {
    messages.push({
      id: `MSG-${pad(messages.length + 1)}`,
      type: 'system',
      typeName: '系统',
      title: pick(['平台月度服务报告已生成', '存储容量月报已更新', '新增 3 台设备纳管', '角色权限变更已生效']),
      content: '详情请前往对应模块查看。',
      time: iso(NOW - int(100, 400) * 60 * 60_000),
      read: true
    })
  }

  const duties: DutyShift[] = []
  const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  for (let i = 0; i < 7; i++) {
    duties.push({
      id: `DUTY-${pad(i + 1)}`,
      date: dateOnly(NOW + i * DAY),
      weekday: WEEKDAYS[i],
      primary: ENGINEERS[i % ENGINEERS.length],
      backup: ENGINEERS[(i + 3) % ENGINEERS.length],
      secondary: ENGINEERS[(i + 5) % ENGINEERS.length],
      phone: `138****${6700 + i}`
    })
  }

  customers.forEach((c) => {
    const cd = devices.filter((d) => d.customerId === c.id)
    const cp = pools.filter((p) => p.customerId === c.id)
    const cc = clusters.filter((x) => x.customerId === c.id)
    const ct = tickets.filter((t) => t.customerId === c.id)
    const closed = ct.filter((t) => t.status === 'closed')
    const ok = closed.filter((t) => t.slaResolveOk)
    c.deviceCount = cd.length
    c.poolCount = cp.length
    c.ticketCount = ct.length
    c.totalCapacityTB = Number(cc.reduce((s, x) => s + x.totalTB, 0).toFixed(1))
    c.usedCapacityTB = Number(cc.reduce((s, x) => s + x.usedTB, 0).toFixed(1))
    c.contractCount = contracts.filter((x) => x.customerId === c.id).length
    c.slaRate = closed.length ? Number(((ok.length / closed.length) * 100).toFixed(1)) : 100
  })
  serviceItems.forEach((s) => {
    s.orderCount = tickets.filter((t) => t.serviceItem === s.name).length
  })

  return {
    version: DB_VERSION,
    customers, datacenters, clusters, pools, devices, volumes, hosts,
    alarms, tickets, serviceItems, spares, spareRecords, knowledge,
    contracts, changes, inspections, users, logs, messages, duties
  }
}
