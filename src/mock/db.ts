import dayjs from 'dayjs'
import type { CommandRecord, NotificationItem, SessionUser, User } from '@/types'
import { SPACES, USERS } from './seed/spaces'
import { DEVICES } from './seed/devices'
import { SCENES } from './seed/scenes'
import { ALERTS, AUDITS, TASKS, TICKETS } from './seed/events'
import { ARTICLES, RULES } from './seed/content'
import { pick, randInt, chance, setSeed } from '@/utils/misc'

export interface DB {
  version: number
  spaces: typeof SPACES
  devices: typeof DEVICES
  scenes: typeof SCENES
  tasks: typeof TASKS
  alerts: typeof ALERTS
  tickets: typeof TICKETS
  users: User[]
  audits: typeof AUDITS
  articles: typeof ARTICLES
  rules: typeof RULES
  commands: CommandRecord[]
  notifications: NotificationItem[]
  lastSync: string
}

export const DB_KEY = 'ice.db.v1'
const DB_VERSION = 1

const COMMAND_POOL: Array<[string, string, string]> = [
  ['启动晨间迎宾', 'scene.start', '场景控制'],
  ['关闭所有投影', 'device.batchOff', '设备调节'],
  ['把 3F 多功能厅温度调到 24 度', 'device.setValue', '设备调节'],
  ['现在有哪些告警', 'alert.query', '查询问答'],
  ['查看 A 座 1F 设备状态', 'device.query', '查询问答'],
  ['进入应急指挥模式', 'emergency.start', '场景控制'],
  ['把展厅亮度调高一点', 'device.adjust', '设备调节'],
  ['帮我建个工单', 'ticket.create', '服务请求'],
  ['昨天用了多少次场景', 'analytics.query', '查询问答'],
  ['静音所有播报', 'system.mute', '设备调节'],
  ['启动会议演示模式', 'scene.start', '场景控制'],
  ['降下投影幕布', 'device.setValue', '设备调节'],
  ['今晚安排夜间巡检', 'task.create', '任务调度'],
  ['重启中控主机', 'device.restart', '设备调节'],
  ['开启节能模式', 'scene.start', '场景控制'],
  ['查一下 UPS 电池健康度', 'device.query', '查询问答'],
  ['把多功能厅音响音量调到 60%', 'device.setValue', '设备调节'],
  ['生成上周交互报表', 'analytics.query', '查询问答'],
  ['申请远程协助', 'ticket.create', '服务请求'],
  ['关闭展厅基础照明', 'device.batchOff', '设备调节'],
]

const HOUR_WEIGHT = [1, 1, 1, 1, 1, 2, 5, 12, 22, 30, 34, 31, 22, 26, 33, 35, 32, 27, 18, 12, 8, 6, 4, 3]

function weightedHour() {
  const total = HOUR_WEIGHT.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let h = 0; h < 24; h++) {
    r -= HOUR_WEIGHT[h]
    if (r <= 0) return h
  }
  return 12
}

function buildCommands(): CommandRecord[] {
  const out: CommandRecord[] = []
  for (let i = 0; i < 200; i++) {
    const [input, intentLabel] = COMMAND_POOL[i % COMMAND_POOL.length]
    const daysAgo = i < 40 ? 0 : randInt(1, 6)
    const t = dayjs()
      .subtract(daysAgo, 'day')
      .hour(daysAgo === 0 ? Math.min(weightedHour(), dayjs().hour()) : weightedHour())
      .minute(randInt(0, 59))
      .second(randInt(0, 59))
    const user = USERS[(i * 3) % 12]
    const status = chance(0.93) ? 'success' : chance(0.6) ? 'partial' : 'failed'
    out.push({
      id: `CMD-${String(10001 + i)}`,
      sessionId: `SES-${String(2000 + (i % 30))}`,
      userId: user.id,
      userName: user.name,
      input,
      inputMode: i % 5 === 0 ? 'voice' : i % 7 === 0 ? 'quick' : 'text',
      intentLabel,
      status,
      affectedDevices: randInt(1, 14),
      cost: randInt(680, 9200),
      createdAt: t.format('YYYY-MM-DDTHH:mm:ssZ'),
    })
  }
  return out.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
}

function buildNotifications(): NotificationItem[] {
  const items: NotificationItem[] = []
  ALERTS.slice(0, 5).forEach((a, i) => {
    items.push({
      id: `NT-${i + 1}`,
      type: 'alert',
      title: `${a.level} ${a.title}`,
      desc: `${a.deviceName} · 当前 ${a.currentValue}${a.unit}（阈值 ${a.threshold}${a.unit}）`,
      time: a.triggeredAt,
      read: i > 2,
      link: '/alerts',
    })
  })
  TICKETS.slice(0, 4).forEach((t, i) => {
    items.push({
      id: `NT-${i + 6}`,
      type: 'ticket',
      title: `工单 ${t.id}`,
      desc: `${t.title} · ${t.serviceType}`,
      time: t.createdAt,
      read: i > 1,
      link: `/service/tickets/${t.id}`,
    })
  })
  TASKS.slice(0, 3).forEach((t, i) => {
    items.push({
      id: `NT-${i + 10}`,
      type: 'task',
      title: t.name,
      desc: `${t.assignee} · ${t.status === 'done' ? '已完成' : t.status === 'running' ? '执行中' : '待执行'}`,
      time: t.plannedAt,
      read: i > 0,
      link: '/tasks',
    })
  })
  items.push(
    {
      id: 'NT-13',
      type: 'system',
      title: '系统版本已更新',
      desc: 'ice-platform 2.4.1 已生效，含 2 项交互优化',
      time: dayjs().subtract(3, 'hour').format('YYYY-MM-DDTHH:mm:ssZ'),
      read: true,
      link: '/about',
    },
    {
      id: 'NT-14',
      type: 'system',
      title: '定时巡检已完成',
      desc: '夜间巡检任务执行完成，共检查 52 台设备，发现 2 项异常',
      time: dayjs().subtract(11, 'hour').format('YYYY-MM-DDTHH:mm:ssZ'),
      read: true,
      link: '/tasks',
    },
  )
  return items.sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())
}

export function seedDB(): DB {
  setSeed(20261019)
  const spaces = SPACES.map((s) => {
    const devices = DEVICES.filter((d) => d.spaceId === s.id)
    return {
      ...s,
      deviceCount: devices.length,
      onlineCount: devices.filter((d) => d.status !== 'offline').length,
    }
  })
  return {
    version: DB_VERSION,
    spaces,
    devices: DEVICES.map((d) => ({ ...d })),
    scenes: JSON.parse(JSON.stringify(SCENES)),
    tasks: JSON.parse(JSON.stringify(TASKS)),
    alerts: JSON.parse(JSON.stringify(ALERTS)),
    tickets: JSON.parse(JSON.stringify(TICKETS)),
    users: JSON.parse(JSON.stringify(USERS)),
    audits: JSON.parse(JSON.stringify(AUDITS)),
    articles: JSON.parse(JSON.stringify(ARTICLES)),
    rules: JSON.parse(JSON.stringify(RULES)),
    commands: buildCommands(),
    notifications: buildNotifications(),
    lastSync: dayjs().format('YYYY-MM-DDTHH:mm:ssZ'),
  }
}

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DB
      if (parsed.version === DB_VERSION && parsed.devices?.length === 52) {
        return parsed
      }
    }
  } catch {
    // 忽略解析失败，回退到种子数据
  }
  const fresh = seedDB()
  saveDB(fresh)
  return fresh
}

export function saveDB(db: DB) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // localStorage 不可用时降级为内存态
  }
}

export function resetDB() {
  try {
    localStorage.removeItem(DB_KEY)
  } catch {
    // ignore
  }
}

export const DEMO_ACCOUNTS: SessionUser[] = [
  { id: 'U-001', name: '张启明', account: 'operator', role: 'operator', avatarColor: '#22D3EE', department: '运行值守部' },
  { id: 'U-002', name: '李静文', account: 'engineer', role: 'engineer', avatarColor: '#7C5CFF', department: '技术服务部' },
  { id: 'U-003', name: '王振国', account: 'manager', role: 'manager', avatarColor: '#34D399', department: '中心管理部' },
  { id: 'U-004', name: '陈亦然', account: 'guest', role: 'guest', avatarColor: '#FBBF24', department: '对外接待' },
]

export const renderableNames = pick
