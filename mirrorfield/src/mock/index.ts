import type {
  Asset, Annotation, Calibration, CollectTask, Dataset, Defect, Deliverable, InspectPlan,
  InspectRecord, LogItem, MrDevice, MrScene, NotificationItem, Order, Org, Project, Role,
  ServiceItem, Session, Ticket, TicketEvent, TicketStatus, User,
} from '@/types'
import { BUILDINGS, PARK, zoneOf } from './scene'
import {
  chance, DATE_END, NAMES, pad, pick, pickMany, randDate, randFloat, randInt, recentDate,
} from './random'

export interface DB {
  users: User[]
  roles: Role[]
  orgs: Org[]
  projects: Project[]
  tasks: CollectTask[]
  datasets: Dataset[]
  assets: Asset[]
  mrDevices: MrDevice[]
  scenes: MrScene[]
  calibrations: Calibration[]
  sessions: Session[]
  plans: InspectPlan[]
  records: InspectRecord[]
  defects: Defect[]
  tickets: Ticket[]
  serviceItems: ServiceItem[]
  orders: Order[]
  deliverables: Deliverable[]
  logs: LogItem[]
  notifications: NotificationItem[]
  annotations: Annotation[]
}

export const MODULES = ['总览', '数据采集', '三维复刻', 'MR 交互', '巡检', '工单', '技术服务', '系统']

export const ROLE_PERMS: Record<string, 'rw' | 'r' | 'none'> = {}

export const ROLES: Role[] = [
  { id: 'R1', name: '平台管理员', desc: '全部权限，含系统设置', perms: { dashboard: 'rw', data: 'rw', recon: 'rw', mr: 'rw', inspect: 'rw', ticket: 'rw', service: 'rw', system: 'rw' } },
  { id: 'R2', name: '项目负责人', desc: '项目全业务数据读写', perms: { dashboard: 'rw', data: 'rw', recon: 'rw', mr: 'rw', inspect: 'rw', ticket: 'rw', service: 'rw', system: 'r' } },
  { id: 'R3', name: '测绘工程师', desc: '采集任务、数据集、质检', perms: { dashboard: 'r', data: 'rw', recon: 'r', mr: 'none', inspect: 'none', ticket: 'r', service: 'r', system: 'none' } },
  { id: 'R4', name: '建模工程师', desc: '模型资产、轻量化、发布', perms: { dashboard: 'r', data: 'r', recon: 'rw', mr: 'r', inspect: 'none', ticket: 'r', service: 'r', system: 'none' } },
  { id: 'R5', name: 'MR 交互设计师', desc: '设备、标定、编排、协同', perms: { dashboard: 'r', data: 'none', recon: 'r', mr: 'rw', inspect: 'none', ticket: 'r', service: 'r', system: 'none' } },
  { id: 'R6', name: '运维工程师', desc: '巡检、缺陷、工单', perms: { dashboard: 'r', data: 'r', recon: 'r', mr: 'r', inspect: 'rw', ticket: 'rw', service: 'r', system: 'none' } },
  { id: 'R7', name: '远程专家', desc: '协同会话与知识库', perms: { dashboard: 'r', data: 'none', recon: 'r', mr: 'r', inspect: 'r', ticket: 'r', service: 'r', system: 'none' } },
  { id: 'R8', name: '访客', desc: '只读，可访问分享链接', perms: { dashboard: 'r', data: 'none', recon: 'r', mr: 'r', inspect: 'none', ticket: 'none', service: 'r', system: 'none' } },
]

const DEPTS = ['总经理办公室', '项目管理部', '测绘工程部', '三维建模部', '数字内容部', '运维服务部', '技术质量部', '市场商务部']

const TASK_NAMES = [
  'A 区屋面倾斜摄影补拍', 'B 区精密加工中心立面扫描', 'C 区研发楼玻璃幕墙精细扫描',
  'D 区储罐区三维激光扫描', 'E 区变电站构架扫描', 'F 区仓库室内扫描',
  'G 码头岸线水下地形测量', 'H 文保建筑测绘建档', '园区地下管网普查',
  '主干道路面点云采集', '管廊内部 SLAM 扫描', '员工食堂改扩建前后对比',
]

const REMARKS = [
  '因风向偏大推迟 40 分钟，补拍东南角 3 个架次',
  '现场协调断电 30 分钟，已完成全部既定测站',
  '雨后地面反光影响点云质量，已重扫 2 站',
  '与厂方生产计划冲突，改至夜间作业',
  '空域审批延迟一天，其余按计划推进',
  '新增 6 个检查点用于精度复核',
  '设备 RTK 失锁一次，已重新初始化并补测',
  '',
]

function makeUsers(): User[] {
  const roleMap: { roleId: User['roleId']; accounts: string[]; titles: string[] }[] = [
    { roleId: 'R1', accounts: ['admin', 'sys.op'], titles: ['系统管理员', '运维主管'] },
    { roleId: 'R2', accounts: ['pm.zhang', 'pm.sun'], titles: ['项目经理', '项目总监'] },
    { roleId: 'R3', accounts: ['survey.li', 'survey.wu', 'survey.xie'], titles: ['航测工程师', '扫描作业员', '测绘组长'] },
    { roleId: 'R4', accounts: ['model.wang', 'model.lin', 'model.xu'], titles: ['高级建模工程师', 'BIM 工程师', '点云处理工程师'] },
    { roleId: 'R5', accounts: ['mr.chen', 'mr.gao', 'mr.luo'], titles: ['MR 交互设计师', 'XR 开发工程师', '三维美术'] },
    { roleId: 'R6', accounts: ['ops.zhao', 'ops.han', 'ops.cao', 'ops.deng'], titles: ['运维工程师', '设备管理员', '巡检员', '安全员'] },
    { roleId: 'R7', accounts: ['expert.zhou', 'expert.huang'], titles: ['结构专家', '电气专家'] },
    { roleId: 'R8', accounts: ['guest', 'guest.client'], titles: ['访客', '客户代表'] },
  ]
  const users: User[] = []
  let i = 0
  roleMap.forEach((group) => {
    group.accounts.forEach((account, idx) => {
      const name = NAMES[i % NAMES.length]
      users.push({
        id: `U${pad(i + 1)}`,
        name,
        account,
        phone: `1${randInt(3, 9)}${randInt(1, 9)}****${randInt(1000, 9999)}`,
        dept: DEPTS[(i + 1) % DEPTS.length],
        roleId: group.roleId,
        title: group.titles[idx] ?? group.titles[0],
        status: i === 22 ? 'DISABLED' : 'ACTIVE',
        lastLogin: recentDate(9),
      })
      i++
    })
  })
  while (users.length < 24) {
    const n = users.length
    users.push({
      id: `U${pad(n + 1)}`, name: NAMES[n % NAMES.length], account: `staff.${n}`,
      phone: `13${randInt(0, 9)}****${randInt(1000, 9999)}`, dept: DEPTS[n % DEPTS.length],
      roleId: 'R6', title: '运维工程师', status: 'ACTIVE', lastLogin: recentDate(20),
    })
  }
  return users
}

function makeOrgs(): Org[] {
  return [
    { id: 'D00', name: '云图空间信息技术有限公司', parentId: null, leader: '周建国', memberCount: 68 },
    { id: 'D01', name: '项目管理部', parentId: 'D00', leader: '张伟', memberCount: 9 },
    { id: 'D02', name: '测绘工程部', parentId: 'D00', leader: '李强', memberCount: 16 },
    { id: 'D03', name: '三维建模部', parentId: 'D00', leader: '王芳', memberCount: 22 },
    { id: 'D04', name: '数字内容部', parentId: 'D00', leader: '陈晓峰', memberCount: 11 },
    { id: 'D05', name: '运维服务部', parentId: 'D00', leader: '赵敏', memberCount: 7 },
    { id: 'D06', name: '技术质量部', parentId: 'D00', leader: '刘洋', memberCount: 3 },
    { id: 'D0201', name: '航测一组', parentId: 'D02', leader: '吴磊', memberCount: 6 },
    { id: 'D0202', name: '扫描二组', parentId: 'D02', leader: '谢涛', memberCount: 5 },
    { id: 'D0301', name: '实景建模组', parentId: 'D03', leader: '徐斌', memberCount: 12 },
    { id: 'D0302', name: 'BIM 翻模组', parentId: 'D03', leader: '林嘉怡', memberCount: 6 },
    { id: 'D0401', name: 'XR 内容组', parentId: 'D04', leader: '高远', memberCount: 7 },
  ]
}

const PROJECT_DEFS = [
  { name: '滨江智能制造园区实景三维复刻（一期）', client: '滨江智造产业园发展有限公司', area: '2.6 km²', stage: '交付' as const, progress: 92, end: '2026-09-30', manager: '张伟', overdue: true },
  { name: '滨江纺织厂旧址文保建筑数字化建档', client: '滨江区文化和广电旅游体育局', area: '0.18 km²', stage: '建模' as const, progress: 78, end: '2026-11-20', manager: '孙悦', overdue: false },
  { name: '城东污水处理厂数字孪生平台', client: '城东水务集团', area: '0.9 km²', stage: '轻量化' as const, progress: 64, end: '2026-12-15', manager: '张伟', overdue: false },
  { name: '江北物流园实景三维建模', client: '江北物流发展有限公司', area: '1.4 km²', stage: '已交付' as const, progress: 100, end: '2026-05-28', manager: '黄丽华', overdue: false },
  { name: '滨江码头结构监测三维复刻', client: '滨江港务有限公司', area: '0.6 km²', stage: '采集' as const, progress: 41, end: '2027-01-30', manager: '郑楠', overdue: false },
  { name: '园区地下管网普查与三维建库', client: '滨江智造产业园发展有限公司', area: '26 km 管线', stage: '发布' as const, progress: 88, end: '2026-10-31', manager: '马晓东', overdue: false },
]

function makeProjects(): Project[] {
  return PROJECT_DEFS.map((p, i) => ({
    id: `PRJ-2026-0${i + 1}`,
    name: p.name,
    client: p.client,
    area: p.area,
    stage: p.stage,
    progress: p.progress,
    startDate: ['2025-03-10', '2025-11-06', '2026-01-18', '2025-08-22', '2026-04-09', '2025-09-15'][i],
    endDate: p.end,
    manager: p.manager,
    overdue: p.overdue,
  }))
}

function makeTasks(users: User[]): CollectTask[] {
  const types: CollectTask['type'][] = ['UAV_OBLIQUE', 'GROUND_SCAN', 'SLAM', 'PANORAMA']
  const pilots = users.filter((u) => u.roleId === 'R3').map((u) => u.name)
  const statuses: CollectTask['status'][] = ['DONE', 'DONE', 'DONE', 'DONE', 'PROCESSING', 'RUNNING', 'RETURNING', 'PENDING', 'CANCELLED']
  return Array.from({ length: 42 }, (_, i) => {
    const type = types[i % 4]
    const b = BUILDINGS[i % BUILDINGS.length]
    const status = i === 3 ? 'PROCESSING' : i === 11 ? 'PENDING' : statuses[i % statuses.length]
    const done = status === 'DONE'
    // 已完成任务中挑出 1 项质检不合格（i=19），其余通过；未完成任务一律待质检
    const q: CollectTask['quality'] = done ? (i === 19 ? 'FAIL' : 'PASS') : 'PENDING'
    return {
      id: `CT-2026-${pad(i + 1)}`,
      name: `${TASK_NAMES[i % TASK_NAMES.length]}${i > 11 ? `（${Math.floor(i / 12) + 1} 期）` : ''}`,
      type,
      area: `${b.zone} · ${b.code}`,
      deviceId: `DEV-${type === 'UAV_OBLIQUE' ? 'UAV' : type === 'GROUND_SCAN' ? 'SCN' : type === 'SLAM' ? 'SLM' : 'PANO'}-${pad((i % 5) + 1)}`,
      pilot: pilots[i % pilots.length],
      plannedStart: randDate(new Date('2025-03-20').getTime(), new Date('2026-10-10').getTime()),
      plannedEnd: randDate(new Date('2025-03-25').getTime(), new Date('2026-10-16').getTime()),
      actualEnd: done ? recentDate(60, 3) : undefined,
      status,
      params: type === 'UAV_OBLIQUE'
        ? { altitude: pick([100, 110, 120, 130]), gsd: pick([1.2, 1.5, 2.0]), forwardOverlap: 80, sideOverlap: pick([65, 70, 75]), photos: randInt(680, 1860) }
        : type === 'PANORAMA'
          ? { photos: randInt(120, 420) }
          : { pointSpacing: pick([6, 8, 10]), photos: 0 },
      dataSize: `${randInt(12, 186)}.${randInt(0, 9)} GB`,
      quality: q,
      owner: pilots[i % pilots.length],
      remark: REMARKS[i % REMARKS.length],
    }
  })
}

function makeDatasets(projects: Project[]): Dataset[] {
  const kinds: Dataset['type'][] = ['实景模型', '点云', 'BIM', '全景', '矢量']
  const formats = ['OSGB', 'LAS', 'IFC', 'JPG', 'SHP']
  return Array.from({ length: 68 }, (_, i) => {
    const k = i % 5
    const b = BUILDINGS[i % BUILDINGS.length]
    return {
      id: `DS-${pad(i + 1)}`,
      name: `${b.code} ${b.name}${kinds[k]}${i > 20 ? '（复测）' : ''}`,
      type: kinds[k],
      format: formats[k],
      size: k === 1 ? `${randInt(18, 320)} GB` : k === 0 ? `${randInt(180, 2400)} MB` : `${randInt(8, 460)} MB`,
      count: k === 1 ? `${(randFloat(1.2, 18.6, 1) * 1e8).toFixed(0)} 点` : `${(randFloat(0.2, 8.6, 1) * 1e6).toFixed(0)} 面`,
      crs: 'CGCS2000 / 3-degree GK CM 120E',
      updatedAt: randDate(new Date('2025-04-01').getTime(), DATE_END),
      projectId: projects[i % projects.length].id,
      scope: pick(['项目内', '部门', '公开'] as const),
    }
  })
}

function makeAssets(): Asset[] {
  const formats: Asset['format'][] = ['OSGB', '3D Tiles', 'LAS', 'IFC', 'glTF']
  const statuses: Asset['status'][] = ['PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'OPTIMIZING', 'DRAFT', 'ARCHIVED']
  return Array.from({ length: 386 }, (_, i) => {
    const b = BUILDINGS[i % BUILDINGS.length]
    const f = formats[i % 5]
    return {
      id: `MA-${pad(i + 1)}`,
      name: `${b.code} ${b.name} ${f === 'LAS' ? '点云成果' : f === 'IFC' ? 'BIM 模型' : '实景模型'}`,
      buildingCode: b.code,
      zone: zoneOf(b.code),
      format: f,
      lods: f === 'OSGB' || f === '3D Tiles' ? randInt(2, 4) : 1,
      triangles: randInt(180000, 8420000),
      size: `${randInt(26, 1200)} MB`,
      status: statuses[i % statuses.length],
      version: `v${randInt(1, 2)}.${randInt(0, 9)}.${randInt(0, 9)}`,
      precision: `±${randFloat(1.8, 4.6, 1)} cm`,
      updatedAt: randDate(new Date('2025-06-01').getTime(), DATE_END),
      optimizeRate: `${randFloat(78.4, 96.2, 1)}%`,
    }
  })
}

function makeScenes(projects: Project[]): MrScene[] {
  const defs = [
    { name: '装配车间设备巡检引导', node: 18, dur: 222, status: 'PUBLISHED' as const },
    { name: '纺织厂旧址历史场景复原', node: 24, dur: 310, status: 'PUBLISHED' as const },
    { name: '变电站安全作业交底', node: 12, dur: 138, status: 'DRAFT' as const },
    { name: '码头门机拆解演示', node: 16, dur: 245, status: 'PUBLISHED' as const },
    { name: '综合动力站管路走向说明', node: 14, dur: 196, status: 'PUBLISHED' as const },
    { name: '物流仓储消防疏散引导', node: 11, dur: 164, status: 'OFFLINE' as const },
  ]
  return Array.from({ length: 24 }, (_, i) => {
    const d = defs[i % defs.length]
    return {
      id: `SC-${pad(i + 1)}`,
      name: i < 6 ? d.name : `${d.name} · ${BUILDINGS[i % BUILDINGS.length].code} 版`,
      projectId: projects[i % projects.length].id,
      nodeCount: d.node + randInt(-2, 4),
      duration: d.dur + randInt(-20, 40),
      version: `v${randInt(1, 2)}.${randInt(0, 9)}`,
      status: d.status,
      updatedAt: randDate(new Date('2026-01-10').getTime(), DATE_END),
      cover: ['#0E7490', '#4338CA', '#047857', '#B45309', '#BE185D', '#1D4ED8'][i % 6],
    }
  })
}

function makeDevices(scenes: MrScene[]): MrDevice[] {
  const models: MrDevice['model'][] = ['HoloLens 2', 'Pico 4 Enterprise', 'HoloLens 2', 'Pico 4 Enterprise', 'Magic Leap 2', 'iPad Pro LiDAR']
  return Array.from({ length: 18 }, (_, i) => {
    const status: MrDevice['status'] = i === 4 || i === 11 || i === 15 ? 'OFFLINE' : i === 9 ? 'MAINTAIN' : 'ONLINE'
    return {
      id: `MR-${pad(i + 1)}`,
      name: `${['装配车间', '精密加工', '研发楼', '动力站', '变电站', '物流仓', '码头', '文保房'][i % 8]}-${pad((i % 3) + 1, 2)}`,
      model: models[i % models.length],
      sn: `${['HL2', 'PICO', 'HL2', 'PICO', 'ML2', 'IPD'][i % 6]}-CN-2024-${pad(i + 1)}${randInt(10, 99)}`,
      firmware: `${randInt(22000, 22621)}.${randInt(1000, 1999)}`,
      battery: status === 'OFFLINE' ? randInt(0, 12) : randInt(28, 100),
      status,
      sceneId: scenes[i % scenes.length].id,
      anchors: randInt(3, 18),
      lastSync: recentDate(status === 'OFFLINE' ? 5 : 1),
    }
  })
}

function makeCalibrations(devices: MrDevice[], users: User[], scenes: MrScene[]): Calibration[] {
  const methods: Calibration['method'][] = ['MARKER', 'POINTCLOUD', 'MANUAL']
  const ops = users.filter((u) => u.roleId === 'R5').map((u) => u.name)
  return Array.from({ length: 96 }, (_, i) => {
    const rms = randFloat(4.2, 26.8, 1)
    return {
      id: `CAL-${pad(i + 1)}`,
      deviceId: devices[i % devices.length].id,
      sceneId: scenes[i % scenes.length].id,
      method: methods[i % 3],
      rms,
      maxError: Number((rms * randFloat(1.3, 2.1, 2)).toFixed(1)),
      points: randInt(8, 36),
      operator: ops[i % ops.length],
      createdAt: randDate(new Date('2025-09-01').getTime(), DATE_END),
      pass: rms <= 15,
    }
  })
}

function makeSessions(scenes: MrScene[], users: User[]): Session[] {
  return Array.from({ length: 327 }, (_, i) => {
    const dur = randInt(280, 2680)
    return {
      id: `SC-2026${pad(i + 1, 5)}`,
      sceneId: scenes[i % scenes.length].id,
      host: users[i % users.length].name,
      guests: pickMany(users, randInt(1, 3)).map((u) => u.name),
      startAt: randDate(new Date('2025-10-01').getTime(), DATE_END),
      duration: dur,
      annotations: randInt(0, 18),
      recorded: chance(0.42),
    }
  })
}

function makePlans(scenes: MrScene[], users: User[]): InspectPlan[] {
  const owners = users.filter((u) => u.roleId === 'R6').map((u) => u.name)
  const names = [
    '装配车间日常巡检', '精密加工中心设备巡检', '研发楼消防设施月检', '动力站储罐区周检',
    '变电站安全巡查', '物流仓储消防通道检查', '码头门机结构检查', '文保建筑本体监测',
    '地下管廊综合巡检', '园区道路与照明巡检', '污水提升泵站巡检', '配电房温度巡检',
    '屋面防水专项检查', '管廊气体监测', '食堂燃气安全检查', '园区周界安防巡检',
  ]
  const items = [
    { item: '屋面渗漏', standard: '无渗漏、无积水' },
    { item: '设备温度', standard: '≤ 65℃' },
    { item: '灭火器压力', standard: '指针在绿区' },
    { item: '结构裂缝', standard: '宽度 ≤ 0.2 mm' },
    { item: '仪表读数', standard: '在量程 30%~80%' },
    { item: '疏散通道', standard: '无占用、宽度 ≥ 1.4 m' },
  ]
  return Array.from({ length: 16 }, (_, i) => {
    const pc = randInt(8, 14)
    return {
      id: `IP-${pad(i + 1)}`,
      name: `${names[i]}${i > 11 ? '（专项）' : ''}`,
      cycle: pick(['每日', '每周', '每月'] as const),
      pointCount: pc,
      owner: owners[i % owners.length],
      nextRun: recentDate(-3),
      completion: randFloat(62, 100, 0),
      status: i === 11 ? 'PAUSED' : i === 15 ? 'FINISHED' : 'ACTIVE',
      sceneId: scenes[i % scenes.length].id,
      points: Array.from({ length: pc }, (_, j) => {
        const b = BUILDINGS[(i * 3 + j) % BUILDINGS.length]
        const it = items[(i + j) % items.length]
        return { seq: j + 1, name: `${b.code} ${b.name} · ${['东侧', '西侧', '屋面', '一层', '二层', '管廊'][j % 6]}`, device: `EQ-${pad(randInt(1, 240))}`, item: it.item, standard: it.standard }
      }),
    }
  })
}

function makeRecords(plans: InspectPlan[], users: User[]): InspectRecord[] {
  const ex = users.filter((u) => u.roleId === 'R6').map((u) => u.name)
  return Array.from({ length: 186 }, (_, i) => {
    const plan = plans[i % plans.length]
    const start = randDate(new Date('2025-11-01').getTime(), DATE_END)
    const dur = randInt(28, 116)
    return {
      id: `IR-${pad(i + 1)}`,
      planId: plan.id,
      executor: ex[i % ex.length],
      startAt: start,
      endAt: new Date(new Date(start).getTime() + dur * 60000).toISOString(),
      pointDone: randInt(Math.max(1, plan.pointCount - 3), plan.pointCount),
      pointTotal: plan.pointCount,
      exceptions: chance(0.28) ? randInt(1, 3) : 0,
      photos: randInt(2, 18),
    }
  })
}

function makeDefects(users: User[]): Defect[] {
  const types: Defect['type'][] = ['渗漏', '锈蚀', '裂缝', '变形', '设备异常', '异物']
  const descs = [
    '屋面东南角防水卷材收口开裂，长度约 1.2 m，雨后渗水痕迹明显，下方为低压配电柜区域，建议 24 小时内处理。',
    '管廊支架锈蚀严重，涂层剥落面积约 0.6 m²，未见明显截面损失，建议除锈后重做防腐。',
    '外墙装饰面出现斜向裂缝，宽度 0.35 mm，长度 2.1 m，位于窗下角，疑似温度应力所致。',
    '储罐基础周边地面沉降约 18 mm，罐体垂直度暂未见异常，建议布设沉降观测点持续监测。',
    '3 号空压机运行噪声异常，振动值 7.2 mm/s，超出正常范围，建议停机检查联轴器。',
    '屋面天沟内淤积落叶与泥沙，排水口局部堵塞，深度约 120 mm。',
    '码头门机轨道压板松动 3 处，行走时有异响，建议紧固并复测轨距。',
    '文保建筑西侧山墙砖体风化，局部灰缝脱落，面积约 2.4 m²。',
  ]
  const sources: Defect['source'][] = ['AI_RECOGNITION', 'AI_RECOGNITION', 'MANUAL']
  const statuses: Defect['status'][] = ['CLOSED', 'CLOSED', 'CLOSED', 'PROCESSING', 'CONFIRMED', 'NEW']
  return Array.from({ length: 148 }, (_, i) => {
    const b = BUILDINGS[i % BUILDINGS.length]
    return {
      id: `DF-${pad(i + 1, 4)}`,
      type: types[i % types.length],
      level: i % 9 === 0 ? 'I' : i % 3 === 0 ? 'II' : 'III',
      location: `${b.code} ${b.name} / ${['屋面', '东立面', '西立面', '一层', '二层', '管廊'][i % 6]} / ${['东南角', '北侧', '中部', '入口处'][i % 4]}`,
      source: sources[i % sources.length],
      confidence: sourceConfidence(i),
      status: statuses[i % statuses.length],
      foundAt: randDate(new Date('2025-11-01').getTime(), DATE_END),
      foundBy: users.filter((u) => u.roleId === 'R6')[i % 4].name,
      description: descs[i % descs.length],
    }
  })
}

function sourceConfidence(i: number) {
  const base = [0.93, 0.88, 0.96, 0.74, 0.62, 0.91][i % 6]
  return base
}

function makeTickets(users: User[], defects: Defect[]): Ticket[] {
  const statuses: TicketStatus[] = ['PENDING', 'ASSIGNED', 'PROCESSING', 'VERIFYING', 'DONE']
  const titles = [
    '屋面渗漏点处理', '管廊支架除锈防腐', '外墙裂缝观测与修补', '储罐基础沉降监测',
    '空压机异响检修', '天沟清淤', '门机轨道紧固', '山墙风化修补',
    '配电柜温度异常排查', '消防通道占用清理', '照明回路跳闸处理', '监控摄像头离线恢复',
  ]
  const ops = users.filter((u) => u.roleId === 'R6')
  return Array.from({ length: 212 }, (_, i) => {
    const b = BUILDINGS[i % BUILDINGS.length]
    const st = statuses[i % statuses.length === 0 && i < 12 ? i % 3 : i % 5]
    const created = randDate(new Date('2026-01-05').getTime(), DATE_END)
    const ev: TicketEvent[] = [
      { at: created, actor: '系统', action: '创建工单', note: i % 4 === 0 ? '由 AI 缺陷识别自动创建' : '巡检发现后创建' },
    ]
    if (st !== 'PENDING') ev.push({ at: new Date(new Date(created).getTime() + 3600000).toISOString(), actor: '赵敏', action: '派单', note: '已指派至运维一组' })
    if (st === 'PROCESSING' || st === 'VERIFYING' || st === 'DONE') ev.push({ at: new Date(new Date(created).getTime() + 7200000).toISOString(), actor: ops[i % ops.length].name, action: '接单', note: '已到达现场，开始处理' })
    if (st === 'DONE') ev.push({ at: new Date(new Date(created).getTime() + 172800000).toISOString(), actor: '刘洋', action: '验收通过', note: '现场复核符合要求，同意关闭' })
    return {
      id: `WO-2026${pad(i + 1, 5)}`,
      title: `${b.code} ${titles[i % titles.length]}`,
      priority: i % 11 === 0 ? '高' : i % 3 === 0 ? '中' : '低',
      source: pick(['巡检', '标注', '客诉', '服务'] as const),
      status: st,
      assignee: st === 'PENDING' ? '' : ops[i % ops.length].name,
      createdAt: created,
      sla: new Date(new Date(created).getTime() + (i % 11 === 0 ? 24 : 72) * 3600000).toISOString(),
      location: `${b.code} ${b.name} / ${['屋面', '东立面', '管廊', '一层', '二层'][i % 5]}`,
      buildingCode: b.code,
      description: defects[i % defects.length].description,
      createdBy: i % 4 === 0 ? 'AI 识别' : ops[i % ops.length].name,
      events: ev,
    }
  })
}

const SERVICE_ITEMS: ServiceItem[] = [
  { code: 'SVC-MESH', name: '园区实景三维建模', price: 68000, unit: 'km²', duration: '15 工作日', standard: '平面 ±3 cm，GSD 1.5 cm，OSGB + 3D Tiles', desc: '无人机倾斜摄影采集、空三加密、密集匹配、纹理映射、模型修饰与切片发布。', deliverables: ['实景三维模型（OSGB）', '3D Tiles 切片', '空三报告', '精度检验报告'] },
  { code: 'SVC-SCAN', name: '地面站式点云扫描', price: 24000, unit: '万 m²', duration: '7 工作日', standard: '点间距 6 mm，配准 RMS ≤ 3 mm', desc: '站式激光扫描、标靶布设、点云配准、去噪与分类，输出彩色点云与成果报告。', deliverables: ['彩色点云（LAS）', '配准报告', '检查点残差表'] },
  { code: 'SVC-BIM', name: 'BIM 翻模', price: 42000, unit: '万 m²', duration: '20 工作日', standard: 'LOD350，符合 GB/T 51301-2018', desc: '依据点云与图纸建立建筑、结构、机电模型，构件命名与编码符合交付标准。', deliverables: ['BIM 模型（IFC/RVT）', '构件编码表', '模型自检报告'] },
  { code: 'SVC-MR', name: 'MR 交互内容开发', price: 86000, unit: '场景', duration: '25 工作日', standard: '支持 HoloLens 2 / Pico 4，≥15 交互节点', desc: '空间标定、交互编排、语音讲解、远程协同适配，交付可安装应用包。', deliverables: ['MR 应用包', '交互脚本', '标定记录', '操作手册'] },
  { code: 'SVC-OPT', name: '模型轻量化与发布', price: 12000, unit: '模型', duration: '5 工作日', standard: '压缩率 ≥ 85%，首屏加载 ≤ 2 s', desc: '冗余面剔除、纹理压缩（KTX2）、LOD 生成、实例化合并与发布校验。', deliverables: ['轻量化模型', 'LOD 配置', '性能测试报告'] },
  { code: 'SVC-OPS', name: '驻场运维服务', price: 28000, unit: '人月', duration: '按需', standard: '响应 ≤ 2 h，到场 ≤ 4 h', desc: '设备巡检、平台运维、数据更新、月度报告与培训。', deliverables: ['月度运维报告', '故障处理记录', '培训记录'] },
]

function makeOrders(): Order[] {
  const clients = [
    { name: '滨江智造产业园发展有限公司', contact: '孙悦 138****3092' },
    { name: '滨江区文化和广电旅游体育局', contact: '何静 139****7712' },
    { name: '城东水务集团有限公司', contact: '罗宇 137****2288' },
    { name: '江北物流发展有限公司', contact: '高远 136****9031' },
    { name: '滨江港务有限公司', contact: '曹磊 135****4477' },
    { name: '市城建档案馆', contact: '沈梦 138****6650' },
  ]
  return Array.from({ length: 36 }, (_, i) => {
    const c = clients[i % clients.length]
    const n = randInt(1, 2)
    const items = pickMany(SERVICE_ITEMS, n).map((s) => ({ code: s.code, qty: s.code === 'SVC-MESH' ? randFloat(0.4, 2.6, 1) : randInt(1, 4), price: s.price }))
    const amount = items.reduce((sum, it) => sum + it.qty * it.price, 0)
    const sign = randDate(new Date('2025-06-01').getTime(), new Date('2026-08-20').getTime())
    const delivery = new Date(new Date(sign).getTime() + randInt(60, 150) * 86400000)
    const late = i === 3 || i === 17
    const status: Order['status'] = i < 18 ? 'DONE' : i < 30 ? 'RUNNING' : i < 34 ? 'DELIVERING' : 'SIGNED'
    const mNames = ['需求确认', '数据采集', '三维建模', '质量检验', '成果交付', '验收结算']
    const doneCount = status === 'DONE' ? 6 : status === 'DELIVERING' ? 5 : status === 'RUNNING' ? 3 : 1
    return {
      id: `SO-2026-${pad(i + 1)}`,
      client: c.name,
      contact: c.contact,
      items,
      amount: Math.round(amount),
      signDate: sign.slice(0, 10),
      deliveryDate: delivery.toISOString().slice(0, 10),
      progress: status === 'DONE' ? 100 : status === 'DELIVERING' ? 88 : status === 'RUNNING' ? randInt(35, 78) : 8,
      status,
      manager: ['张伟', '孙悦', '黄丽华'][i % 3],
      milestones: mNames.map((name, idx) => ({
        name,
        date: new Date(new Date(sign).getTime() + idx * randInt(18, 28) * 86400000).toISOString().slice(0, 10),
        done: idx < doneCount,
      })),
      payments: [
        { date: new Date(new Date(sign).getTime() + 7 * 86400000).toISOString().slice(0, 10), amount: Math.round(amount * 0.3), status: '已回款' },
        { date: new Date(new Date(sign).getTime() + 60 * 86400000).toISOString().slice(0, 10), amount: Math.round(amount * 0.4), status: status === 'SIGNED' ? '待回款' : '已回款' },
        { date: delivery.toISOString().slice(0, 10), amount: Math.round(amount * 0.3), status: status === 'DONE' ? '已回款' : '待回款' },
      ],
      late,
    } as Order & { late: boolean }
  })
}

function makeDeliverables(orders: Order[]): Deliverable[] {
  const list: Deliverable[] = []
  let idx = 0
  orders.forEach((o) => {
    const count = o.status === 'DONE' ? randInt(4, 6) : o.status === 'DELIVERING' ? randInt(2, 4) : randInt(0, 2)
    for (let i = 0; i < count; i++) {
      idx++
      const namePool = ['实景三维模型', '3D Tiles 切片', '彩色点云', 'BIM 模型', '精度检验报告', 'MR 应用包', '操作手册', '培训视频']
      const name = namePool[(idx + i) % namePool.length]
      const fmt = name.includes('点云') ? 'LAS' : name.includes('BIM') ? 'IFC' : name.includes('报告') || name.includes('手册') ? 'PDF' : name.includes('视频') ? 'MP4' : name.includes('应用包') ? 'APK' : 'OSGB'
      list.push({
        id: `DL-${pad(idx, 4)}`,
        orderId: o.id,
        name: `${o.client.slice(0, 6)}·${name}`,
        type: name.includes('报告') ? '文档' : name.includes('视频') ? '视频' : '数据成果',
        format: fmt,
        size: `${randInt(8, 980)} MB`,
        version: `v${randInt(1, 2)}.${randInt(0, 6)}`,
        accepted: o.status === 'DONE' ? chance(0.92) : false,
        uploadedAt: randDate(new Date(o.signDate).getTime(), DATE_END),
      })
    }
  })
  return list
}

function makeLogs(users: User[]): LogItem[] {
  const actions = [
    ['三维复刻', '创建标注', 'A-03 东立面裂缝'],
    ['三维复刻', '导出偏差报告', 'B-02 精密加工中心'],
    ['数据采集', '新建采集任务', 'CT-2026-043'],
    ['MR 交互', '发布场景', 'SC-003 v1.4'],
    ['工单', '派单', 'WO-20260188'],
    ['巡检', '提交巡检记录', 'IR-00186'],
    ['技术服务', '上传交付物', 'DL-0128'],
    ['系统', '修改角色权限', 'R6 运维工程师'],
    ['数据采集', '质检通过', 'CT-2026-041'],
    ['MR 交互', '发起远程协同', 'SC-20261019-004'],
  ]
  return Array.from({ length: 2000 }, (_, i): LogItem => {
    const a = actions[i % actions.length]
    const u = users[i % users.length]
    return {
      id: `LG-${pad(i + 1, 5)}`,
      userId: u.id,
      userName: u.name,
      module: a[0],
      action: a[1],
      target: a[2],
      ip: `10.20.${randInt(1, 30)}.${randInt(2, 240)}`,
      result: i % 97 === 0 ? '失败' : '成功',
      createdAt: randDate(new Date('2026-04-01').getTime(), DATE_END),
    }
  }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

function makeNotifications(): NotificationItem[] {
  const defs = [
    ['告警', 'B-02 精密加工中心点云配准 RMS 4.7 mm，超出阈值 3 mm', '/data/quality', false],
    ['告警', '服务订单 SO-2026-004 交付节点逾期 5 天', '/service/orders', false],
    ['告警', '码头门机 02 号 MR 终端离线 3 小时 12 分', '/mr/devices', false],
    ['待办', 'A-03 车间轻量化成果待审核（LOD3）', '/recon/assets', false],
    ['待办', '巡检计划 IP-012 连续 2 期未执行', '/inspect/plans', true],
    ['系统', '平台已升级至 v2.4.1，新增偏差色谱对比', '/recon/compare', true],
    ['告警', '存储水位 78%，预计 26 天后达到告警线', '/system/settings', true],
    ['待办', '本周复刻进度周报待提交', '/', true],
  ]
  return Array.from({ length: 18 }, (_, i) => {
    const d = defs[i % defs.length]
    return {
      id: `NT-${pad(i + 1)}`,
      type: d[0] as NotificationItem['type'],
      title: d[1] as string,
      read: i < 8 ? Boolean(d[3]) : chance(0.6),
      link: d[2] as string,
      createdAt: recentDate(6),
    }
  })
}

function makeAnnotations(): Annotation[] {
  const defs: { code: string; title: string; type: Annotation['type']; desc: string; color: string }[] = [
    { code: 'A-03', title: '屋面东南角渗漏点', type: '问题', desc: '防水卷材收口开裂，长度约 1.2 m，已转工单 WO-20260188。', color: '#F87171' },
    { code: 'B-01', title: '2 号空压机', type: '设备信息', desc: '型号 GA90VSD，额定压力 0.8 MPa，上次保养 2026-08-12。', color: '#22D3EE' },
    { code: 'C-01', title: '消防通道', type: '巡检点', desc: '每日 09:00 前完成占用检查。', color: '#FBBF24' },
    { code: 'H-01', title: '1937 年砖砌山墙', type: '说明', desc: '文保本体，禁止钻孔与湿作业，修补需报文物部门备案。', color: '#A78BFA' },
    { code: 'D-01', title: '4 号储罐', type: '设备信息', desc: '容积 5000 m³，介质：消防水，液位 68%。', color: '#22D3EE' },
    { code: 'G-01', title: '门机轨道压板', type: '问题', desc: '3 处压板松动，行走异响，已安排紧固。', color: '#F87171' },
    { code: 'F-01', title: '装卸月台', type: '巡检点', desc: '防撞胶块缺失 2 处，需补装。', color: '#FBBF24' },
    { code: 'E-01', title: '主变 1 号', type: '设备信息', desc: '容量 50 MVA，油温 52℃，负载率 61%。', color: '#22D3EE' },
    { code: 'A-01', title: '管廊接口', type: '说明', desc: '蒸汽管道补偿器，年度检修已于 2026-09 完成。', color: '#A78BFA' },
    { code: 'B-02', title: '东侧外墙', type: '问题', desc: '斜向裂缝 0.35 mm，布设 3 个观测点，每周复测。', color: '#F87171' },
    { code: 'H-02', title: '食堂燃气阀', type: '巡检点', desc: '每日闭餐后关闭总阀并记录。', color: '#FBBF24' },
    { code: 'C-01', title: '12 层屋面', type: '说明', desc: '已布设 4 个沉降观测点，2026 年二季度数据正常。', color: '#A78BFA' },
  ]
  return defs.map((d, i) => {
    const b = BUILDINGS.find((x) => x.code === d.code)!
    return {
      id: `AN-${pad(i + 1)}`,
      title: d.title,
      type: d.type,
      desc: d.desc,
      pos: [b.x + randFloat(-b.w / 3, b.w / 3, 1), b.h + 2, b.z + randFloat(-b.d / 3, b.d / 3, 1)],
      buildingCode: d.code,
      color: d.color,
      createdAt: recentDate(40),
      createdBy: NAMES[i % NAMES.length],
    }
  })
}

export function generateDB(): DB {
  const users = makeUsers()
  const orgs = makeOrgs()
  const projects = makeProjects()
  const tasks = makeTasks(users)
  const datasets = makeDatasets(projects)
  const assets = makeAssets()
  const scenes = makeScenes(projects)
  const mrDevices = makeDevices(scenes)
  const calibrations = makeCalibrations(mrDevices, users, scenes)
  const sessions = makeSessions(scenes, users)
  const plans = makePlans(scenes, users)
  const records = makeRecords(plans, users)
  const defects = makeDefects(users)
  const tickets = makeTickets(users, defects)
  const orders = makeOrders()
  const deliverables = makeDeliverables(orders)
  const logs = makeLogs(users)
  const notifications = makeNotifications()
  const annotations = makeAnnotations()
  return {
    users, roles: ROLES, orgs, projects, tasks, datasets, assets, mrDevices, scenes,
    calibrations, sessions, plans, records, defects, tickets, serviceItems: SERVICE_ITEMS,
    orders, deliverables, logs, notifications, annotations,
  }
}

const KEY = 'mirrorfield.db'

let cache: DB | null = null

export function getDB(): DB {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      cache = JSON.parse(raw) as DB
      return cache
    }
  } catch {
    /* ignore */
  }
  cache = generateDB()
  saveDB(cache)
  return cache
}

export function saveDB(db: DB) {
  cache = db
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* 超出配额时降级为内存态 */
  }
}

export function resetDB(): DB {
  const db = generateDB()
  saveDB(db)
  return db
}

export { SERVICE_ITEMS, PARK }
