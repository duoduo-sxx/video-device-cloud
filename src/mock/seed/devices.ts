import dayjs from 'dayjs'
import type { ControlType, Device, DeviceCategory, DeviceMetric, DeviceStatus } from '@/types'
import { ENGINEERS } from './spaces'
import { SPACES } from './spaces'
import { metricTrend } from '../generators'
import { rand, randInt, pick } from '@/utils/misc'

type Row = [string, string, DeviceCategory, string, string, string, ControlType, string, number]

const ROWS: Row[] = [
  ['主投影阵列 A', 'PRJ-A-01', 'display', '激光投影机', 'Barco', 'UDX-4K32', 'switch', 'SP-01', 21],
  ['主投影阵列 B', 'PRJ-A-02', 'display', '激光投影机', 'Barco', 'UDX-4K32', 'switch', 'SP-01', 22],
  ['边缘融合器', 'BLN-A-01', 'display', '画面融合器', 'Barco', 'E2 Gen2', 'readonly', 'SP-01', 23],
  ['LED 拼接屏 P2.5', 'LED-A-01', 'display', '小间距 LED', '利亚德', 'TW1.8', 'range', 'SP-01', 24],
  ['主扩声功放', 'AMP-A-01', 'audio', '数字功放', 'QSC', 'CX-Q 8K4', 'range', 'SP-01', 31],
  ['数字音频处理器', 'DSP-A-01', 'audio', '音频处理器', 'Biamp', 'TesiraFORTÉ AI', 'readonly', 'SP-01', 32],
  ['展厅吸顶扬声器组', 'SPK-A-01', 'audio', '吸顶音箱', 'JBL', 'Control 26C', 'range', 'SP-01', 33],
  ['展厅基础照明回路', 'LT-A-01', 'lighting', '照明回路', '路创', 'HW-QS', 'range', 'SP-01', 41],
  ['灯带控制器', 'LT-A-02', 'lighting', '灯带控制器', '路创', 'Athena', 'range', 'SP-01', 42],
  ['电动投影幕', 'SCR-A-01', 'control', '电动幕布', '大力', 'DLS-200', 'switch', 'SP-01', 51],
  ['人体存在传感器', 'SEN-A-01', 'sensor', '存在感应器', '海康', 'NP-V2', 'readonly', 'SP-01', 61],
  ['手势识别模组', 'GES-A-01', 'sensor', '手势识别', 'Ultraleap', 'LMC2', 'readonly', 'SP-01', 62],

  ['指挥大屏拼接单元', 'LED-C-01', 'display', '小间距 LED', '利亚德', 'TW1.5', 'range', 'SP-02', 25],
  ['席位显示器组 A', 'MON-C-01', 'display', '专业显示器', '戴尔', 'U3223QE', 'readonly', 'SP-02', 26],
  ['会议平板', 'IWB-C-01', 'display', '交互平板', 'MAXHUB', 'V6', 'switch', 'SP-02', 27],
  ['分布式坐席节点', 'KVM-C-01', 'control', '坐席协作', '快捷', 'CR-1000', 'readonly', 'SP-02', 52],
  ['中控主机', 'CTRL-C-01', 'control', '中控主机', 'Crestron', 'CP4', 'readonly', 'SP-02', 53],
  ['天花板麦克风阵列', 'MIC-C-01', 'audio', '麦克风阵列', 'Shure', 'MXA910', 'range', 'SP-02', 34],
  ['数字音频处理器', 'DSP-C-01', 'audio', '音频处理器', 'Biamp', 'TesiraFORTÉ AI', 'readonly', 'SP-02', 35],
  ['云台摄像机 A', 'CAM-C-01', 'display', '云台摄像机', 'Sony', 'SRG-A40', 'mode', 'SP-02', 28],
  ['云台摄像机 B', 'CAM-C-02', 'display', '云台摄像机', 'Sony', 'SRG-A40', 'mode', 'SP-02', 29],
  ['新风机组 AHU-3F-02', 'AHU-C-01', 'hvac', '新风机组', '大金', 'DVN-R10', 'level', 'SP-02', 43],
  ['风机盘管 FCU-3F-04', 'FCU-C-01', 'hvac', '风机盘管', '大金', 'FXDQ', 'level', 'SP-02', 44],
  ['环境监测终端', 'ENV-C-01', 'sensor', '环境传感器', '西门子', 'QPA2000', 'readonly', 'SP-02', 63],

  ['主投影机', 'PRJ-B-01', 'display', '激光投影机', '爱普生', 'EB-PU1008B', 'switch', 'SP-03', 30],
  ['投影幕布', 'SCR-B-01', 'control', '电动幕布', '大力', 'DLS-300', 'switch', 'SP-03', 54],
  ['舞台灯光控制台', 'LT-B-01', 'lighting', '灯光控制台', '路创', 'Athena', 'range', 'SP-03', 45],
  ['舞台染色灯组', 'LT-B-02', 'lighting', 'LED 染色灯', '珠江', 'PR-6000', 'range', 'SP-03', 46],
  ['无线麦克风系统', 'MIC-B-01', 'audio', '无线话筒', 'Sennheiser', 'EW-DX', 'readonly', 'SP-03', 36],
  ['会议音箱', 'SPK-B-01', 'audio', '全频音箱', 'JBL', 'CBT 70J', 'range', 'SP-03', 37],
  ['多功能厅空调', 'AHU-B-01', 'hvac', '组合式空调', '美的', 'MDV-D', 'level', 'SP-03', 47],
  ['电动窗帘', 'CUR-B-01', 'control', '电动窗帘', '杜亚', 'DT82', 'range', 'SP-03', 55],
  ['空气品质传感器', 'ENV-B-01', 'sensor', '环境传感器', '西门子', 'QPA2000', 'readonly', 'SP-03', 64],

  ['迎宾大屏', 'LED-D-01', 'display', '小间距 LED', '洲明', 'Upanel', 'range', 'SP-04', 38],
  ['导览触控一体机', 'KIOSK-D-01', 'display', '触控一体机', '皓丽', 'H86', 'readonly', 'SP-04', 39],
  ['大厅背景音乐', 'AMP-D-01', 'audio', '数字功放', 'QSC', 'CX-Q 4K4', 'range', 'SP-04', 40],
  ['迎宾灯光回路', 'LT-D-01', 'lighting', '照明回路', '路创', 'HW-QS', 'range', 'SP-04', 48],
  ['自动门控制器', 'DOOR-D-01', 'control', '自动门', '多玛', 'ES200', 'switch', 'SP-04', 56],
  ['客流统计摄像头', 'CAM-D-01', 'sensor', '客流分析', '海康', 'DS-2CD', 'readonly', 'SP-04', 65],
  ['闸机控制器', 'GATE-D-01', 'control', '速通门', '中控智慧', 'FBL', 'readonly', 'SP-04', 57],

  ['服务台工位终端', 'PC-E-01', 'control', '工作站', '联想', 'P360', 'readonly', 'SP-05', 58],
  ['备件管理终端', 'PC-E-02', 'control', '工作站', '联想', 'P360', 'readonly', 'SP-05', 59],
  ['服务中心照明', 'LT-E-01', 'lighting', '照明回路', '路创', 'HW-QS', 'range', 'SP-05', 49],
  ['服务中心空调', 'FCU-E-01', 'hvac', '风机盘管', '美的', 'FXDQ', 'level', 'SP-05', 50],
  ['打印一体机', 'PRN-E-01', 'network', '网络打印', '惠普', 'M428', 'readonly', 'SP-05', 71],
  ['无线 AP', 'AP-E-01', 'network', '无线接入点', '华为', 'AirEngine 5760', 'readonly', 'SP-05', 72],

  ['核心交换机', 'SW-F-01', 'network', '核心交换机', 'H3C', 'S5560X', 'readonly', 'SP-06', 73],
  ['接入交换机 A', 'SW-F-02', 'network', '接入交换机', 'H3C', 'S5130', 'readonly', 'SP-06', 74],
  ['UPS 电源', 'UPS-F-01', 'power', '在线式 UPS', '施耐德', 'Galaxy VS', 'readonly', 'SP-06', 81],
  ['精密空调', 'CRAC-F-01', 'hvac', '精密空调', '维谛', 'PEX4', 'level', 'SP-06', 82],
  ['边缘计算节点', 'SRV-F-01', 'control', '边缘服务器', '联想', 'SE350', 'readonly', 'SP-06', 83],
  ['机房环境主机', 'ENV-F-01', 'sensor', '环境监控', '维谛', 'RDU', 'readonly', 'SP-06', 84],
]

const FIXED_STATUS: Record<string, DeviceStatus> = {
  'DEV-0120': 'offline',
  'DEV-0135': 'offline',
  'DEV-0146': 'offline',
  'DEV-0122': 'warning',
  'DEV-0112': 'warning',
  'DEV-0149': 'warning',
  'DEV-0128': 'warning',
  'DEV-0150': 'maintenance',
}

const NET_SEGMENT: Record<DeviceCategory, number> = {
  display: 30,
  audio: 31,
  lighting: 32,
  hvac: 32,
  sensor: 33,
  control: 30,
  network: 34,
  power: 34,
}

function buildMetrics(cat: DeviceCategory, idx: number): DeviceMetric[] {
  switch (cat) {
    case 'display':
      return [
        { key: 'brightness', label: '亮度', value: randInt(62, 94), unit: '%', trend: metricTrend(78, 6) },
        { key: 'temperature', label: '机身温度', value: randInt(36, 56), unit: '℃', threshold: { max: 65 } },
        { key: 'runtime', label: '累计运行', value: randInt(420, 3600), unit: 'h' },
      ]
    case 'audio':
      return [
        { key: 'volume', label: '输出电平', value: randInt(40, 82), unit: '%', trend: metricTrend(60, 8) },
        { key: 'snr', label: '信噪比', value: randInt(78, 104), unit: 'dB' },
        { key: 'temperature', label: '机内温度', value: randInt(32, 48), unit: '℃', threshold: { max: 60 } },
      ]
    case 'lighting':
      return [
        { key: 'level', label: '亮度', value: randInt(30, 96), unit: '%', trend: metricTrend(66, 10) },
        { key: 'power', label: '实时功率', value: randInt(60, 860), unit: 'W' },
        { key: 'temperature', label: '驱动器温度', value: randInt(30, 52), unit: '℃', threshold: { max: 70 } },
      ]
    case 'hvac':
      return [
        { key: 'returnTemp', label: '回风温度', value: Number((23 + rand() * 8).toFixed(1)), unit: '℃', threshold: { max: 28 } },
        { key: 'filterPa', label: '滤网压差', value: randInt(60, 210), unit: 'Pa', threshold: { max: 180 } },
        { key: 'frequency', label: '运行频率', value: randInt(28, 58), unit: 'Hz' },
      ]
    case 'sensor':
      return [
        { key: 'temperature', label: '环境温度', value: Number((21 + rand() * 5).toFixed(1)), unit: '℃' },
        { key: 'humidity', label: '相对湿度', value: randInt(38, 66), unit: '%' },
        { key: 'co2', label: 'CO₂ 浓度', value: randInt(420, 1180), unit: 'ppm', threshold: { max: 1000 } },
      ]
    case 'control':
      return [
        { key: 'cpu', label: 'CPU 占用', value: randInt(12, 68), unit: '%', trend: metricTrend(38, 9) },
        { key: 'memory', label: '内存占用', value: randInt(28, 76), unit: '%' },
        { key: 'temperature', label: '核心温度', value: randInt(38, 62), unit: '℃', threshold: { max: 80 } },
      ]
    case 'network':
      return [
        { key: 'traffic', label: '实时流量', value: randInt(80, 920), unit: 'Mbps', trend: metricTrend(420, 120) },
        { key: 'ports', label: '端口占用', value: randInt(24, 88), unit: '%' },
        { key: 'temperature', label: '设备温度', value: randInt(32, 54), unit: '℃', threshold: { max: 70 } },
      ]
    case 'power':
      return [
        { key: 'load', label: '输出负载', value: randInt(32, 78), unit: '%', trend: metricTrend(52, 8) },
        { key: 'battery', label: '电池健康', value: randInt(76, 98), unit: '%', threshold: { min: 80 } },
        { key: 'voltage', label: '输入电压', value: randInt(216, 232), unit: 'V' },
      ]
    default:
      return [{ key: 'value', label: '读数', value: idx, unit: '' }]
  }
}

function layout(spaceId: string, idx: number, total: number) {
  const space = SPACES.find((s) => s.id === spaceId)!
  const cols = Math.ceil(Math.sqrt(total * 1.7))
  const rows = Math.ceil(total / cols)
  const cw = (space.map.w - 56) / cols
  const ch = (space.map.h - 72) / rows
  const c = idx % cols
  const r = Math.floor(idx / cols)
  return {
    x: Math.round(space.map.x + 28 + cw * (c + 0.5) + (rand() - 0.5) * 12),
    y: Math.round(space.map.y + 56 + ch * (r + 0.5) + (rand() - 0.5) * 10),
  }
}

export const DEVICES: Device[] = (() => {
  const perSpace: Record<string, number> = {}
  return ROWS.map((row, i) => {
    const [name, code, category, type, vendor, model, control, spaceId, ipSuffix] = row
    const id = `DEV-${String(101 + i).padStart(4, '0')}`
    perSpace[spaceId] = (perSpace[spaceId] ?? 0) + 1
    const total = ROWS.filter((r) => r[7] === spaceId).length
    const status = FIXED_STATUS[id] ?? 'online'
    const health =
      status === 'offline' ? randInt(18, 42) : status === 'warning' ? randInt(52, 68) : status === 'maintenance' ? 74 : randInt(76, 99)
    const metrics = buildMetrics(category, i)
    const isLevel = control === 'level'
    const isRange = control === 'range'
    const baseValue = isRange ? randInt(40, 88) : isLevel ? randInt(1, 4) : undefined
    if (isRange && metrics[0]) metrics[0].value = baseValue ?? metrics[0].value
    return {
      id,
      name,
      code,
      category,
      type,
      vendor,
      model,
      firmware: `${randInt(1, 3)}.${randInt(0, 9)}.${randInt(0, 12)}`,
      spaceId,
      ip: `192.168.${NET_SEGMENT[category]}.${ipSuffix}`,
      status,
      health,
      controlType: control,
      power: status === 'offline' ? false : rand() > 0.12,
      value: baseValue,
      unit: isRange ? '%' : isLevel ? '档' : undefined,
      mode: control === 'mode' ? pick(['自动追踪', '预设位 1', '预设位 2', '广角']) : undefined,
      modes: control === 'mode' ? ['自动追踪', '预设位 1', '预设位 2', '广角'] : undefined,
      metrics,
      lastReportAt:
        status === 'offline'
          ? dayjs().subtract(randInt(3, 40), 'hour').format('YYYY-MM-DDTHH:mm:ssZ')
          : dayjs().subtract(randInt(2, 55), 'second').format('YYYY-MM-DDTHH:mm:ssZ'),
      installedAt: dayjs()
        .subtract(randInt(180, 1080), 'day')
        .format('YYYY-MM-DD'),
      owner: pick(ENGINEERS),
      position: layout(spaceId, perSpace[spaceId] - 1, total),
    } satisfies Device
  })
})()

export const deviceById = (id: string) => DEVICES.find((d) => d.id === id)
export const devicesOfSpace = (spaceId: string) => DEVICES.filter((d) => d.spaceId === spaceId)
