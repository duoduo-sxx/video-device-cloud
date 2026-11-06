import type { DB } from './db'
import type { Device, ParsedIntent, Scene } from '@/types'
import { clamp } from '@/utils/misc'

export type Action =
  | { kind: 'scene'; sceneId: string; sceneName: string; devices: number; highRisk: boolean }
  | { kind: 'batchPower'; ids: string[]; power: boolean; label: string }
  | { kind: 'setValue'; deviceId: string; value: number; label: string }
  | { kind: 'adjust'; deviceId: string; delta: number; label: string }
  | { kind: 'query'; card: 'alertSummary' | 'deviceList' | 'stat'; label: string }
  | { kind: 'ticket' }
  | { kind: 'mute' }
  | { kind: 'unknown' }

export interface Resolution {
  intent: ParsedIntent
  action: Action
  needConfirm: boolean
}

const CANDIDATE_POOL = [
  { intent: 'scene.start', label: '启动场景' },
  { intent: 'device.setValue', label: '设置设备参数' },
  { intent: 'device.query', label: '查询设备状态' },
  { intent: 'alert.query', label: '查询告警' },
  { intent: 'device.batchOff', label: '批量关闭设备' },
  { intent: 'ticket.create', label: '创建工单' },
]

function lcs(a: string, b: string): number {
  let best = 0
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      let k = 0
      while (a[i + k] && b[j + k] && a[i + k] === b[j + k]) k++
      if (k > best) best = k
    }
  }
  return best
}

function matchScene(input: string, scenes: Scene[]): { scene: Scene; score: number } | null {
  let best: { scene: Scene; score: number } | null = null
  scenes.forEach((s) => {
    const base = s.name.replace(/模式|场景/g, '')
    const score = lcs(input, base) / base.length
    if (score >= 0.4 && (!best || score > best.score)) best = { scene: s, score }
  })
  return best
}

function spaceOf(input: string, db: DB) {
  return db.spaces.find((s) => input.includes(s.name) || input.includes(`${s.building}${s.floor}F`) || input.includes(`${s.building} ${s.floor}F`))
}

function candidatesFor(primary: string) {
  const rest = CANDIDATE_POOL.filter((c) => c.intent !== primary).slice(0, 3)
  const scores = [0.42, 0.21, 0.11]
  return rest.map((c, i) => ({ ...c, score: scores[i] }))
}

function base(intent: string, intentLabel: string, confidence: number, slots: ParsedIntent['slots'], rule: string): ParsedIntent {
  return { intent, intentLabel, confidence, slots, rule, candidates: candidatesFor(intent) }
}

const CATEGORY_WORDS: Array<[RegExp, Device['category']]> = [
  [/投影|幕布/, 'display'],
  [/屏|大屏|显示/, 'display'],
  [/灯|照明/, 'lighting'],
  [/音响|音量|音/ , 'audio'],
  [/空调|新风|温度/, 'hvac'],
  [/摄像机|摄像/, 'display'],
]

export function resolve(input: string, db: DB): Resolution {
  const text = input.trim()

  if (/应急|紧急/.test(text)) {
    const scene = db.scenes.find((s) => s.id === 'SC-005') ?? db.scenes[0]
    return {
      intent: base('emergency.start', '启动应急指挥', 0.96, [
        { key: 'scene', label: '场景', value: scene.name, source: '文本' },
        { key: 'risk', label: '风险等级', value: '高（涉及门禁与广播）', source: '规则' },
      ], 'emergency.* 高优先级匹配'),
      action: { kind: 'scene', sceneId: scene.id, sceneName: scene.name, devices: scene.deviceCount, highRisk: true },
      needConfirm: true,
    }
  }

  if (/静音|关闭播报|别说话了/.test(text)) {
    return {
      intent: base('system.mute', '静音播报', 0.91, [{ key: 'scope', label: '范围', value: '全局 TTS', source: '默认' }], 'system.mute 关键词命中'),
      action: { kind: 'mute' },
      needConfirm: false,
    }
  }

  if (/(工单|报修|申请服务|派单)/.test(text)) {
    return {
      intent: base('ticket.create', '创建服务工单', 0.89, [
        { key: 'service', label: '服务类型', value: '待选择', source: '上下文' },
      ], 'ticket.create 关键词命中'),
      action: { kind: 'ticket' },
      needConfirm: false,
    }
  }

  if (/(告警|报警|异常|故障)/.test(text) && /(哪些|多少|查看|现在|有没有)/.test(text)) {
    const open = db.alerts.filter((a) => a.status !== 'closed' && a.status !== 'recovered').length
    return {
      intent: base('alert.query', '查询告警', 0.94, [
        { key: 'status', label: '状态', value: '未闭环', source: '规则' },
        { key: 'count', label: '结果数', value: String(open), source: '数据集' },
      ], 'alert.query 意图模板'),
      action: { kind: 'query', card: 'alertSummary', label: '当前未闭环告警' },
      needConfirm: false,
    }
  }

  if (/(统计|报表|多少次|用了多少|趋势)/.test(text)) {
    return {
      intent: base('analytics.query', '查询统计', 0.87, [
        { key: 'range', label: '时间范围', value: '近 7 天', source: '默认' },
      ], 'analytics.query 意图模板'),
      action: { kind: 'query', card: 'stat', label: '近 7 天运行统计' },
      needConfirm: false,
    }
  }

  const tempMatch = text.match(/(\d{2})\s*(?:度|℃)/)
  if (tempMatch && /(温度|空调|新风|调到|设到|调至)/.test(text)) {
    const temp = Number(tempMatch[1])
    const space = spaceOf(text, db)
    const device =
      db.devices.find((d) => d.category === 'hvac' && (!space || d.spaceId === space.id)) ??
      db.devices.find((d) => d.category === 'hvac')!
    const level = clamp(Math.round((30 - temp) / 2), 1, 5)
    return {
      intent: base('device.setValue', '设置设备参数', 0.92, [
        { key: 'space', label: '空间', value: space?.name ?? '全域', source: '实体抽取' },
        { key: 'device', label: '设备', value: device.name, source: '实体匹配' },
        { key: 'target', label: '目标温度', value: `${temp}℃`, source: '数值抽取' },
      ], 'device.setValue + 数值槽位'),
      action: { kind: 'setValue', deviceId: device.id, value: level, label: `设定温度 ${temp}℃` },
      needConfirm: false,
    }
  }

  if (/(亮度|音量|调高|调低|调大|调小|高一点|低一点)/.test(text)) {
    const space = spaceOf(text, db)
    const catEntry = CATEGORY_WORDS.find(([re]) => re.test(text))
    const up = /(高|大|提高|调高|调大)/.test(text)
    const device =
      db.devices.find(
        (d) => d.controlType === 'range' && (!catEntry || d.category === catEntry[1]) && (!space || d.spaceId === space.id),
      ) ?? db.devices.find((d) => d.controlType === 'range')!
    return {
      intent: base('device.adjust', '相对调节设备参数', 0.86, [
        { key: 'device', label: '设备', value: device.name, source: '实体匹配' },
        { key: 'direction', label: '方向', value: up ? '上调' : '下调', source: '语义方向' },
        { key: 'delta', label: '幅度', value: up ? '+10%' : '-10%', source: '默认步长' },
      ], 'device.adjust 相对量词'),
      action: { kind: 'adjust', deviceId: device.id, delta: up ? 10 : -10, label: `${up ? '上调' : '下调'} 10%` },
      needConfirm: false,
    }
  }

  if (/(关闭|关掉|断开|停止)/.test(text) && /(所有|全部|都|投影|显示|灯|音响|空调)/.test(text)) {
    const catEntry = CATEGORY_WORDS.find(([re]) => re.test(text))
    const space = spaceOf(text, db)
    const targets = db.devices.filter(
      (d) =>
        d.controlType !== 'readonly' &&
        (!catEntry || d.category === catEntry[1]) &&
        (!space || d.spaceId === space.id),
    )
    return {
      intent: base('device.batchOff', '批量关闭设备', 0.93, [
        { key: 'scope', label: '范围', value: space?.name ?? '全域', source: space ? '实体抽取' : '默认' },
        { key: 'category', label: '品类', value: catEntry ? catEntry[1] : '全部可控设备', source: '实体匹配' },
        { key: 'count', label: '设备数', value: String(targets.length), source: '数据集' },
      ], 'device.batchOff + 品类实体'),
      action: {
        kind: 'batchPower',
        ids: targets.map((d) => d.id),
        power: false,
        label: `关闭 ${targets.length} 台设备`,
      },
      needConfirm: targets.length >= 5,
    }
  }

  if (/(查看|查询|看看|状态|在线)/.test(text)) {
    const space = spaceOf(text, db)
    const list = db.devices.filter((d) => !space || d.spaceId === space.id)
    return {
      intent: base('device.query', '查询设备状态', 0.9, [
        { key: 'space', label: '空间', value: space?.name ?? '全域', source: '实体抽取' },
        { key: 'count', label: '设备数', value: String(list.length), source: '数据集' },
        { key: 'online', label: '在线数', value: String(list.filter((d) => d.status === 'online').length), source: '数据集' },
      ], 'device.query 意图模板'),
      action: { kind: 'query', card: 'deviceList', label: space ? `${space.name}设备状态` : '全域设备状态' },
      needConfirm: false,
    }
  }

  if (/(启动|打开|开启|执行|进入|切到|切换|调成|调到)/.test(text)) {
    const found = matchScene(text, db.scenes)
    if (found) {
      return {
        intent: base('scene.start', '启动场景', 0.88 + found.score * 0.1, [
          { key: 'scene', label: '场景', value: found.scene.name, source: '模糊匹配' },
          { key: 'space', label: '空间', value: db.spaces.find((s) => s.id === found.scene.spaceId)?.name ?? '—', source: '场景归属' },
          { key: 'devices', label: '影响设备', value: `${found.scene.deviceCount} 台`, source: '场景定义' },
        ], `场景名相似度 ${(found.score * 100).toFixed(0)}%`),
        action: {
          kind: 'scene',
          sceneId: found.scene.id,
          sceneName: found.scene.name,
          devices: found.scene.deviceCount,
          highRisk: found.scene.riskLevel === 'high',
        },
        needConfirm: found.scene.deviceCount >= 5 || found.scene.riskLevel === 'high',
      }
    }
  }

  return {
    intent: {
      intent: 'unknown',
      intentLabel: '未识别',
      confidence: 0.32,
      slots: [{ key: 'raw', label: '原始输入', value: text, source: '文本' }],
      rule: '未命中任何意图模板，返回兜底响应',
      candidates: CANDIDATE_POOL.slice(0, 3).map((c, i) => ({ ...c, score: [0.34, 0.19, 0.09][i] })),
    },
    action: { kind: 'unknown' },
    needConfirm: false,
  }
}
