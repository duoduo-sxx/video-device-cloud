import dayjs from 'dayjs'
import type {
  Alert,
  AlertLevel,
  AlertStatus,
  AuditLog,
  Task,
  TaskStatus,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '@/types'
import { DEVICES } from './devices'
import { SPACES, USERS, ENGINEERS, NAMES } from './spaces'
import { SCENES } from './scenes'
import { alertSeries } from '../generators'
import { pick, randInt, chance } from '@/utils/misc'

const colorOf = (name: string) => USERS.find((u) => u.name === name)?.avatarColor ?? '#60A5FA'
const ts = (minsAgo: number) => dayjs().subtract(minsAgo, 'minute')

interface Tpl {
  title: string
  metric: string
  unit: string
  threshold: number
  desc: string
  suggestions: string[]
}

const TEMPLATES: Record<string, Tpl[]> = {
  hvac: [
    {
      title: '回风温度持续偏高',
      metric: '回风温度',
      unit: '℃',
      threshold: 28,
      desc: '回风温度连续 12 分钟高于阈值，滤网压差同步升高，疑似初效滤网堵塞或冷媒不足。',
      suggestions: [
        '远程确认机组是否处于制冷模式',
        '读取滤网压差传感器数值，超过 180Pa 判定为堵塞',
        '安排现场更换初效滤网并复测',
        '处理后观察 15 分钟回风温度是否降至 26℃ 以下',
      ],
    },
    {
      title: '滤网压差超限',
      metric: '滤网压差',
      unit: 'Pa',
      threshold: 180,
      desc: '滤网前后压差持续高于 180Pa，风量下降约 18%，机组能耗上升。',
      suggestions: ['安排更换初效滤网', '检查过滤段密封条是否脱落', '更换后记录初始压差作为基线'],
    },
    {
      title: '机组通信中断',
      metric: '心跳间隔',
      unit: 's',
      threshold: 30,
      desc: '控制器连续 3 个轮询周期未收到机组响应，可能为网关掉电或总线接触不良。',
      suggestions: ['检查网关供电与指示灯状态', '复位 Modbus 总线终端电阻', '必要时重启网关并观察 5 分钟'],
    },
  ],
  display: [
    {
      title: '投影光源亮度衰减',
      metric: '亮度',
      unit: '%',
      threshold: 60,
      desc: '光源亮度较初始值下降超过 30%，画面均匀度变差，接近厂商建议更换周期。',
      suggestions: ['记录当前亮度并对比初始标定值', '检查散热风道是否积尘', '评估更换光源模组的时间窗口'],
    },
    {
      title: '机身温度过高',
      metric: '机身温度',
      unit: '℃',
      threshold: 65,
      desc: '进风口温度偏高，设备已触发降亮度保护，长时间运行可能缩短光源寿命。',
      suggestions: ['清理进风过滤网', '确认机房空调送风是否正常', '临时降低亮度至 70% 运行'],
    },
    {
      title: '拼接单元离线',
      metric: '在线状态',
      unit: '',
      threshold: 1,
      desc: '拼接控制器失去与单元的心跳，画面出现局部黑屏，影响指挥大屏完整性。',
      suggestions: ['检查单元电源与网线水晶头', '重启对应发送卡', '若仍离线，安排备件替换'],
    },
  ],
  audio: [
    {
      title: '功放输出失真',
      metric: '总谐波失真',
      unit: '%',
      threshold: 1,
      desc: '输出失真度超过 1%，伴随保护指示灯闪烁，疑似负载阻抗不匹配。',
      suggestions: ['核查扬声器线路阻抗', '降低输出电平 3dB 观察', '检查功放散热与风扇转速'],
    },
    {
      title: '麦克风阵列拾音异常',
      metric: '拾音信噪比',
      unit: 'dB',
      threshold: 60,
      desc: '拾音信噪比低于 60dB，远端反馈存在持续底噪，可能为 PoE 供电不稳。',
      suggestions: ['检查 PoE 交换机端口功率余量', '重新执行波束成形自校准', '更换网线测试'],
    },
  ],
  lighting: [
    {
      title: '灯光回路负载异常',
      metric: '回路电流',
      unit: 'A',
      threshold: 10,
      desc: '回路电流超出额定值 12%，驱动器温升明显，存在过载风险。',
      suggestions: ['核对该回路实际接入灯具数量', '分段断开排查短路点', '必要时调整回路分配'],
    },
    {
      title: '驱动器温度过高',
      metric: '驱动器温度',
      unit: '℃',
      threshold: 70,
      desc: '驱动器外壳温度持续高于 70℃，已进入降功率保护状态。',
      suggestions: ['检查配电箱通风是否受阻', '降低该回路亮度至 60% 观察温升', '安排更换大功率驱动'],
    },
  ],
  sensor: [
    {
      title: 'CO₂ 浓度超阈值',
      metric: 'CO₂ 浓度',
      unit: 'ppm',
      threshold: 1000,
      desc: '空间 CO₂ 浓度持续高于 1000ppm，人员密集且新风量不足，影响舒适度与专注度。',
      suggestions: ['将新风机组提升至高档运行', '确认回风阀开度是否正常', '人员离场后复测浓度'],
    },
    {
      title: '温湿度传感器数据漂移',
      metric: '温度偏差',
      unit: '℃',
      threshold: 1.5,
      desc: '该测点与同区域其他测点偏差超过 1.5℃，疑似传感器老化或安装位置受热源影响。',
      suggestions: ['与相邻测点交叉比对', '检查探头是否被遮挡或靠近热源', '安排送检校准'],
    },
  ],
  network: [
    {
      title: '交换机端口丢包',
      metric: '丢包率',
      unit: '%',
      threshold: 0.5,
      desc: '上联端口丢包率持续高于 0.5%，影响坐席与大屏信号传输稳定性。',
      suggestions: ['检查光模块收发光功率', '确认端口是否存在 CRC 错误累积', '更换跳线测试'],
    },
    {
      title: '无线 AP 接入数超限',
      metric: '关联终端数',
      unit: '个',
      threshold: 64,
      desc: '单 AP 关联终端数超过设计容量，接入速率下降，用户反馈卡顿。',
      suggestions: ['开启负载均衡', '评估增加 AP 点位', '限制访客网络接入数'],
    },
  ],
  power: [
    {
      title: 'UPS 电池健康度下降',
      metric: '电池健康度',
      unit: '%',
      threshold: 80,
      desc: '电池组健康度低于 80%，后备时间由 32 分钟下降至约 18 分钟，需评估更换。',
      suggestions: ['执行一次电池自检并记录后备时间', '检查电池组环境温度是否高于 25℃', '申报电池组更换计划'],
    },
    {
      title: '市电输入电压波动',
      metric: '输入电压',
      unit: 'V',
      threshold: 210,
      desc: '输入电压低于 210V 且波动幅度增大，UPS 频繁切入电池供电。',
      suggestions: ['联系物业核查配电柜进线', '记录波动时段与幅度', '确认 UPS 旁路工作正常'],
    },
  ],
  control: [
    {
      title: '中控主机心跳丢失',
      metric: '心跳间隔',
      unit: 's',
      threshold: 60,
      desc: '中控主机超过 60 秒未上报心跳，场景指令无法下发，疑似程序挂起。',
      suggestions: ['远程尝试重启中控服务', '检查主机 CPU 与内存占用', '必要时现场硬重启并恢复配置'],
    },
    {
      title: '坐席节点离线',
      metric: '在线状态',
      unit: '',
      threshold: 1,
      desc: '坐席协作节点离线，对应席位无法推送上屏，影响会议演示。',
      suggestions: ['检查节点供电与 PoE 端口', '重新插拔网线', '替换备用节点验证'],
    },
  ],
}

const LEVELS: AlertLevel[] = ['P1', 'P2', 'P3']
const OWNERS = [...ENGINEERS, '张启明', '孙梦祺', '吴天文']

export const ALERTS: Alert[] = (() => {
  const out: Alert[] = []
  let n = 117
  for (let i = 0; i < 64; i++) {
    const isRecovered = i >= 52
    const level: AlertLevel = isRecovered ? (i % 3 === 0 ? 'P1' : i % 3 === 1 ? 'P2' : 'P3') : LEVELS[Math.floor(i / 18)]
    const device = DEVICES[(i * 7 + 3) % DEVICES.length]
    const tpls = TEMPLATES[device.category] ?? TEMPLATES.control
    const tpl = tpls[i % tpls.length]
    const triggered = ts(isRecovered ? randInt(300, 2600) : randInt(3, 900))
    const over = level === 'P1' ? 1.28 : level === 'P2' ? 1.14 : 1.05
    const current = tpl.unit === 'ppm' || tpl.unit === 'Pa' ? Math.round(tpl.threshold * over) : Number((tpl.threshold * over).toFixed(1))
    let status: AlertStatus
    if (isRecovered) status = chance(0.5) ? 'recovered' : 'closed'
    else status = i % 5 === 0 ? 'processing' : i % 7 === 0 ? 'acknowledged' : 'open'
    const assignee = status === 'open' ? undefined : pick(OWNERS)
    const records: Alert['records'] = [{ time: triggered.format('YYYY-MM-DDTHH:mm:ssZ'), action: '触发告警', operator: '系统' }]
    if (assignee) {
      records.push({
        time: triggered.add(randInt(2, 9), 'minute').format('YYYY-MM-DDTHH:mm:ssZ'),
        action: '认领',
        operator: assignee,
      })
    }
    if (status === 'processing') {
      records.push({
        time: triggered.add(randInt(10, 20), 'minute').format('YYYY-MM-DDTHH:mm:ssZ'),
        action: '转处理中',
        operator: assignee!,
        note: '已远程核实告警有效性，正在按处置建议排查',
      })
    }
    if (isRecovered) {
      records.push({
        time: triggered.add(randInt(30, 90), 'minute').format('YYYY-MM-DDTHH:mm:ssZ'),
        action: status === 'closed' ? '关闭' : '恢复',
        operator: assignee ?? '系统',
        note: status === 'closed' ? '故障已排除，指标恢复正常并观察 30 分钟' : '指标回落至阈值以下，自动恢复',
      })
    }
    out.push({
      id: `ALT-${triggered.format('YYYYMMDD')}-${String(n++).padStart(4, '0')}`,
      title: `${tpl.title}`,
      level,
      status,
      deviceId: device.id,
      deviceName: device.name,
      spaceId: device.spaceId,
      metric: tpl.metric,
      currentValue: current,
      threshold: tpl.threshold,
      unit: tpl.unit,
      triggeredAt: triggered.format('YYYY-MM-DDTHH:mm:ssZ'),
      recoveredAt: isRecovered
        ? triggered.add(randInt(30, 90), 'minute').format('YYYY-MM-DDTHH:mm:ssZ')
        : undefined,
      duration: Math.max(1, Math.round(dayjs().diff(triggered, 'minute', true))),
      assignee,
      description: `${device.name}（${device.code}）${tpl.desc}`,
      suggestions: tpl.suggestions,
      series: alertSeries(current),
      records,
    })
  }
  return out.sort((a, b) => dayjs(b.triggeredAt).valueOf() - dayjs(a.triggeredAt).valueOf())
})()

const TASK_NAMES = [
  ['晨间迎宾场景执行', 'scene', '按日程自动执行展厅开场流程，确保 9:00 前完成设备预热。'],
  ['展厅设备例行巡检', 'inspection', '逐台检查投影、音频、灯光与传感器状态，记录异常项。'],
  ['指挥中心会议保障', 'scene', '会前 30 分钟执行会议演示模式并复核拾音与大屏状态。'],
  ['机房温湿度数据同步', 'sync', '将机房环境监控数据同步至运维平台，保留 90 天。'],
  ['UPS 电池健康检测', 'maintenance', '执行电池自检，记录后备时间与内阻数据。'],
  ['多功能厅投影维护', 'maintenance', '清理进风滤网、检查光源运行时长、校准画面几何。'],
  ['全量设备台账同步', 'sync', '与资产系统核对设备清单、位置与责任人信息。'],
  ['夜间巡检任务', 'inspection', '22:30 自动执行，关闭非必要负载并生成巡检摘要。'],
  ['接待大厅大屏校色', 'maintenance', '按季度执行色度计校准，确保多屏色差小于 3。'],
  ['门禁联动策略更新', 'sync', '同步最新门禁分组与时段策略至速通门控制器。'],
  ['演播室声场复测', 'inspection', '使用测试信号复测各频段声压级，输出频响曲线。'],
  ['边缘节点固件升级', 'maintenance', '分批升级边缘计算节点固件，升级前做快照备份。'],
]

export const TASKS: Task[] = (() => {
  const out: Task[] = []
  for (let i = 0; i < 36; i++) {
    const [name, type, description] = TASK_NAMES[i % TASK_NAMES.length]
    let status: TaskStatus = (['pending', 'running', 'done', 'failed'] as TaskStatus[])[i % 4]
    if (i > 8 && i < 20) status = 'done'
    if (i >= 30) status = 'pending'
    const planned = ts(-randInt(30, 1400))
    const scene = SCENES[i % SCENES.length]
    const started = status === 'pending' ? undefined : planned.add(randInt(1, 6), 'minute')
    const duration = status === 'pending' ? undefined : randInt(18, 96)
    const finished = started && duration ? started.add(duration, 'minute') : undefined
    const logs: Task['logs'] = []
    if (started) {
      const steps = ['任务开始', '加载场景配置', '下发设备指令', '校验执行结果']
      steps.forEach((s, k) => {
        const failed = status === 'failed' && k === steps.length - 1
        logs.push({
          id: `lg-${i}-${k}`,
          time: started.add(k * randInt(2, 8), 'minute').format('YYYY-MM-DDTHH:mm:ssZ'),
          action: s,
          result: failed ? 'fail' : 'ok',
          cost: randInt(300, 4200),
        })
      })
    }
    out.push({
      id: `TK-${planned.format('YYYYMMDD')}-${String(101 + i).slice(1)}`,
      name,
      description,
      type: type as Task['type'],
      trigger: i % 5 === 0 ? 'manual' : i % 3 === 0 ? 'rule' : 'schedule',
      schedule: i % 3 === 0 ? undefined : i % 2 === 0 ? '每日 08:50' : '每日 22:30',
      status,
      progress: status === 'running' ? randInt(24, 82) : status === 'done' ? 100 : status === 'failed' ? 100 : 0,
      sceneId: type === 'scene' ? scene.id : undefined,
      deviceIds: scene.steps.flatMap((s) => s.actions.map((a) => a.deviceId)).slice(0, 6),
      assignee: i % 4 === 0 ? pick(ENGINEERS) : pick(NAMES),
      plannedAt: planned.format('YYYY-MM-DDTHH:mm:ssZ'),
      startedAt: started?.format('YYYY-MM-DDTHH:mm:ssZ'),
      finishedAt: finished?.format('YYYY-MM-DDTHH:mm:ssZ'),
      duration,
      failReason: status === 'failed' ? pick(['投影阵列 B 无响应，指令超时', '中控主机连接中断', '设备校验未通过：亮度未达目标值']) : undefined,
      logs,
    })
  }
  return out.sort((a, b) => dayjs(b.plannedAt).valueOf() - dayjs(a.plannedAt).valueOf())
})()

const TICKET_TOPICS = [
  { title: '新风机组回风温度超标', type: '现场支持', priority: 'urgent' as TicketPriority, sla: 240 },
  { title: '指挥大屏拼接单元离线', type: '远程协助', priority: 'urgent' as TicketPriority, sla: 240 },
  { title: '多功能厅投影画面偏色', type: '现场支持', priority: 'high' as TicketPriority, sla: 480 },
  { title: '中控主机频繁重启排查', type: '远程协助', priority: 'high' as TicketPriority, sla: 480 },
  { title: '展厅灯光回路过载处理', type: '现场支持', priority: 'high' as TicketPriority, sla: 480 },
  { title: '季度设备巡检申请', type: '系统巡检', priority: 'normal' as TicketPriority, sla: 1440 },
  { title: '值班人员场景操作培训', type: '操作培训', priority: 'normal' as TicketPriority, sla: 1440 },
  { title: '新增访客导览场景需求', type: '定制开发', priority: 'normal' as TicketPriority, sla: 1440 },
  { title: '重要接待活动驻场保障', type: '应急保障', priority: 'urgent' as TicketPriority, sla: 240 },
  { title: 'UPS 电池组健康度下降', type: '现场支持', priority: 'high' as TicketPriority, sla: 480 },
  { title: '无线 AP 接入数超限优化', type: '远程协助', priority: 'normal' as TicketPriority, sla: 1440 },
  { title: '会议室音频回声消除调试', type: '远程协助', priority: 'normal' as TicketPriority, sla: 1440 },
]

const TICKET_STATUS: TicketStatus[] = ['pending', 'assigned', 'processing', 'verifying', 'done', 'closed']

export const TICKETS: Ticket[] = (() => {
  const out: Ticket[] = []
  for (let i = 0; i < 24; i++) {
    const topic = TICKET_TOPICS[i % TICKET_TOPICS.length]
    const created = ts(-randInt(60, 4200))
    const status = i < 3 ? 'pending' : i < 6 ? 'assigned' : i < 12 ? 'processing' : TICKET_STATUS[i % 6]
    const device = DEVICES[(i * 11 + 5) % DEVICES.length]
    const space = SPACES.find((s) => s.id === device.spaceId)!
    const creator = i % 3 === 0 ? '张启明' : pick(OWNERS)
    const assignee = status === 'pending' ? undefined : pick(ENGINEERS)
    const elapsed = Math.round(dayjs().diff(created, 'minute', true))
    const slaMinutes = topic.sla
    const comments: Ticket['comments'] = [
      {
        id: `c-${i}-1`,
        author: creator,
        avatarColor: colorOf(creator),
        time: created.format('YYYY-MM-DDTHH:mm:ssZ'),
        content: `${device.name}出现${topic.title.replace(/申请|需求|处理|排查|优化|调试/g, '')}，影响${space.building}${space.floor}层${space.name}正常使用，请尽快处理。`,
      },
    ]
    if (assignee) {
      comments.push({
        id: `c-${i}-2`,
        author: assignee,
        avatarColor: colorOf(assignee),
        time: created.add(randInt(8, 40), 'minute').format('YYYY-MM-DDTHH:mm:ssZ'),
        content: pick([
          '已接单，正在远程核查设备日志，稍后同步进展。',
          '已到达现场，初步判断为线路接触不良，正在更换跳线。',
          '已定位问题点，备件已从 C 座库房调出，预计 30 分钟到场。',
          '已完成初步处置，设备恢复运行，正在观察稳定性。',
        ]),
        statusChange: status === 'pending' ? undefined : '待受理 → 处理中',
      })
    }
    if (status === 'done' || status === 'closed') {
      comments.push({
        id: `c-${i}-3`,
        author: assignee ?? '李静文',
        avatarColor: colorOf(assignee ?? '李静文'),
        time: created.add(randInt(80, 300), 'minute').format('YYYY-MM-DDTHH:mm:ssZ'),
        content: '故障已排除，设备连续运行 2 小时无异常，指标恢复正常。请使用方确认后关闭工单。',
        statusChange: '处理中 → 已完成',
      })
    }
    out.push({
      id: `TS-${created.format('YYYYMMDD')}-${String(42 + i).padStart(4, '0')}`,
      title: topic.title,
      serviceType: topic.type,
      status,
      priority: topic.priority,
      spaceId: device.spaceId,
      deviceId: device.id,
      deviceName: device.name,
      creator,
      assignee,
      createdAt: created.format('YYYY-MM-DDTHH:mm:ssZ'),
      expectedAt: created.add(slaMinutes, 'minute').format('YYYY-MM-DDTHH:mm:ssZ'),
      closedAt:
        status === 'done' || status === 'closed'
          ? created.add(randInt(90, 400), 'minute').format('YYYY-MM-DDTHH:mm:ssZ')
          : undefined,
      slaMinutes,
      slaRemainMinutes: Math.max(0, slaMinutes - elapsed),
      description: `${space.building} ${space.floor} 层${space.name}内 ${device.name}（${device.code}）异常，需${topic.type}。设备型号 ${device.vendor} ${device.model}，IP ${device.ip}，责任人 ${device.owner}。`,
      comments,
      rating:
        status === 'closed'
          ? {
              speed: randInt(4, 5),
              professional: randInt(4, 5),
              effect: randInt(3, 5),
              tags: ['响应及时', '处理专业'].slice(0, randInt(1, 2)),
              comment: '工程师到场及时，处置过程清晰，问题已彻底解决。',
            }
          : undefined,
    })
  }
  return out.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
})()

const ACTIONS = [
  ['执行场景', 'scene'],
  ['更新设备', 'device'],
  ['关闭告警', 'alert'],
  ['创建工单', 'ticket'],
  ['修改配置', 'system'],
  ['导出报表', 'system'],
  ['新增用户', 'user'],
  ['重试任务', 'task'],
] as const

export const AUDITS: AuditLog[] = Array.from({ length: 120 }, (_, i) => {
  const t = dayjs().subtract(randInt(1, 10080), 'minute')
  const [action, targetType] = ACTIONS[i % ACTIONS.length]
  const device = DEVICES[(i * 13) % DEVICES.length]
  const scene = SCENES[i % SCENES.length]
  const target =
    targetType === 'device'
      ? `${device.name}（${device.code}）`
      : targetType === 'scene'
        ? scene.name
        : targetType === 'alert'
          ? ALERTS[i % ALERTS.length].id
          : targetType === 'ticket'
            ? TICKETS[i % TICKETS.length].id
            : targetType === 'user'
              ? USERS[i % USERS.length].name
              : '系统参数'
  return {
    id: `AUD-${String(1001 + i)}`,
    time: t.format('YYYY-MM-DDTHH:mm:ssZ'),
    operator: pick(NAMES),
    action,
    target,
    targetType,
    result: chance(0.94) ? 'success' : 'fail',
    ip: `192.168.10.${randInt(20, 240)}`,
    detail:
      targetType === 'device'
        ? { deviceId: device.id, field: 'power', from: true, to: false, channel: 'web' }
        : { channel: 'web', duration: randInt(200, 3200) },
  } satisfies AuditLog
}).sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())
