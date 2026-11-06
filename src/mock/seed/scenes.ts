import dayjs from 'dayjs'
import type { Operation, Scene, SceneAction, SceneStep } from '@/types'
import { DEVICES } from './devices'

let seq = 0

function act(deviceId: string, operation: Operation, target?: string | number): SceneAction {
  const d = DEVICES.find((x) => x.id === deviceId)
  seq += 1
  return {
    id: `ac-${seq}`,
    deviceId,
    deviceName: d?.name ?? deviceId,
    operation,
    target,
  }
}

const step = (name: string, delay: number, actions: SceneAction[]): SceneStep => ({
  id: `st-${++seq}`,
  name,
  delay,
  actions,
})

function countDevices(steps: SceneStep[]) {
  return new Set(steps.flatMap((s) => s.actions.map((a) => a.deviceId))).size
}

const raw: Array<Omit<Scene, 'deviceCount'>> = [
  {
    id: 'SC-001',
    name: '晨间迎宾模式',
    description: '每日开场前 10 分钟执行，依次点亮展厅灯光、启动投影与音频、播放迎宾片源，使展厅进入可接待状态。',
    tags: ['展厅', '日常'],
    spaceId: 'SP-01',
    enabled: true,
    usedCount: 126,
    lastRunAt: dayjs().hour(8).minute(50).second(12).format('YYYY-MM-DDTHH:mm:ssZ'),
    avgDuration: 32,
    riskLevel: 'low',
    icon: 'Sunrise',
    steps: [
      step('开启基础照明', 0, [act('DEV-0108', 'setValue', 70), act('DEV-0109', 'setValue', 60)]),
      step('降下投影幕布', 3, [act('DEV-0110', 'powerOn')]),
      step('启动投影阵列', 5, [
        act('DEV-0101', 'powerOn'),
        act('DEV-0102', 'powerOn'),
        act('DEV-0103', 'powerOn'),
      ]),
      step('接入音频系统', 4, [act('DEV-0105', 'setValue', 55), act('DEV-0107', 'setValue', 50)]),
      step('播放迎宾片源', 6, [act('DEV-0104', 'setValue', 80)]),
    ],
  },
  {
    id: 'SC-002',
    name: '会议演示模式',
    description: '指挥中心例会与远程汇报标准配置，降下遮光帘、启动大屏与会议平板、切换麦克风阵列至全向拾音。',
    tags: ['会议', '指挥中心'],
    spaceId: 'SP-02',
    enabled: true,
    usedCount: 214,
    lastRunAt: dayjs().hour(9).minute(15).second(4).format('YYYY-MM-DDTHH:mm:ssZ'),
    avgDuration: 26,
    riskLevel: 'low',
    icon: 'Presentation',
    steps: [
      step('启动指挥大屏', 0, [act('DEV-0113', 'setValue', 88)]),
      step('开启会议平板与坐席', 3, [act('DEV-0115', 'powerOn'), act('DEV-0116', 'powerOn')]),
      step('切换拾音模式', 4, [act('DEV-0118', 'setValue', 72)]),
      step('调整空调至会议档', 2, [act('DEV-0122', 'setValue', 3)]),
    ],
  },
  {
    id: 'SC-003',
    name: '沉浸观影模式',
    description: '多功能厅观影场景，关闭主照明、启动投影与环绕声、合拢窗帘，营造全暗环境。',
    tags: ['多功能厅', '演示'],
    spaceId: 'SP-03',
    enabled: true,
    usedCount: 87,
    lastRunAt: dayjs().subtract(1, 'day').hour(19).minute(30).second(0).format('YYYY-MM-DDTHH:mm:ssZ'),
    avgDuration: 41,
    riskLevel: 'low',
    icon: 'Film',
    steps: [
      step('关闭主照明', 0, [act('DEV-0127', 'setValue', 5)]),
      step('合拢电动窗帘', 2, [act('DEV-0132', 'setValue', 0)]),
      step('启动投影与幕布', 4, [act('DEV-0126', 'powerOn'), act('DEV-0125', 'powerOn')]),
      step('切换环绕声场', 6, [act('DEV-0130', 'setValue', 78)]),
    ],
  },
  {
    id: 'SC-004',
    name: '夜间巡检模式',
    description: '每日 22:30 自动执行，逐区检查设备在线状态、关闭非必要负载、记录环境基线并生成巡检摘要。',
    tags: ['运维', '周期'],
    spaceId: 'SP-06',
    enabled: true,
    usedCount: 342,
    lastRunAt: dayjs().subtract(1, 'day').hour(22).minute(30).second(0).format('YYYY-MM-DDTHH:mm:ssZ'),
    avgDuration: 96,
    riskLevel: 'medium',
    icon: 'MoonStar',
    steps: [
      step('关闭展厅非必要负载', 0, [
        act('DEV-0101', 'powerOff'),
        act('DEV-0102', 'powerOff'),
        act('DEV-0104', 'powerOff'),
        act('DEV-0110', 'powerOff'),
      ]),
      step('检查机房环境基线', 8, [act('DEV-0152', 'powerOn'), act('DEV-0151', 'powerOn')]),
      step('记录设备健康快照', 6, [act('DEV-0147', 'powerOn'), act('DEV-0149', 'powerOn')]),
    ],
  },
  {
    id: 'SC-005',
    name: '应急指挥模式',
    description: '突发事件下的最高优先级场景，全量点亮指挥中心、切换应急广播、联动门禁与录像，需双人确认后执行。',
    tags: ['应急', '指挥中心'],
    spaceId: 'SP-02',
    enabled: true,
    usedCount: 19,
    lastRunAt: dayjs().subtract(4, 'day').hour(2).minute(14).second(0).format('YYYY-MM-DDTHH:mm:ssZ'),
    avgDuration: 18,
    riskLevel: 'high',
    icon: 'ShieldAlert',
    steps: [
      step('全亮指挥中心照明', 0, [act('DEV-0113', 'setValue', 100)]),
      step('启动全部显示与坐席', 2, [
        act('DEV-0114', 'powerOn'),
        act('DEV-0115', 'powerOn'),
        act('DEV-0116', 'powerOn'),
        act('DEV-0117', 'powerOn'),
      ]),
      step('切换应急广播', 2, [act('DEV-0118', 'setValue', 95), act('DEV-0119', 'powerOn')]),
      step('摄像机转入追踪', 3, [act('DEV-0120', 'setMode', '自动追踪'), act('DEV-0121', 'setMode', '自动追踪')]),
      step('解除门禁限制', 4, [act('DEV-0138', 'powerOn'), act('DEV-0140', 'powerOn')]),
    ],
  },
  {
    id: 'SC-006',
    name: '节能模式',
    description: '非工作时段自动降载：关闭闲置显示设备、空调升至节能档、照明降至 20%，预计每小时节电 14.6 kWh。',
    tags: ['节能', '周期'],
    spaceId: 'SP-01',
    enabled: true,
    usedCount: 268,
    lastRunAt: dayjs().subtract(1, 'day').hour(20).minute(0).second(0).format('YYYY-MM-DDTHH:mm:ssZ'),
    avgDuration: 24,
    riskLevel: 'low',
    icon: 'Leaf',
    steps: [
      step('降低照明亮度', 0, [act('DEV-0108', 'setValue', 20), act('DEV-0137', 'setValue', 20)]),
      step('关闭闲置显示', 3, [
        act('DEV-0104', 'setValue', 0),
        act('DEV-0134', 'setValue', 25),
        act('DEV-0125', 'powerOff'),
      ]),
      step('空调切换节能档', 2, [act('DEV-0122', 'setValue', 1), act('DEV-0131', 'setValue', 1)]),
    ],
  },
  {
    id: 'SC-007',
    name: '展厅导览模式',
    description: '面向参观接待的自动导览流程，按序点亮展项、播放讲解音轨、开启手势交互模组。',
    tags: ['展厅', '接待'],
    spaceId: 'SP-01',
    enabled: true,
    usedCount: 73,
    lastRunAt: dayjs().subtract(2, 'day').hour(10).minute(20).second(0).format('YYYY-MM-DDTHH:mm:ssZ'),
    avgDuration: 58,
    riskLevel: 'low',
    icon: 'Compass',
    steps: [
      step('点亮展项一', 0, [act('DEV-0108', 'setValue', 85), act('DEV-0109', 'setValue', 70)]),
      step('启动讲解音轨', 4, [act('DEV-0105', 'setValue', 62), act('DEV-0107', 'setValue', 58)]),
      step('开动手势交互', 5, [act('DEV-0112', 'powerOn'), act('DEV-0110', 'powerOn')]),
      step('播放主展项', 6, [act('DEV-0101', 'powerOn'), act('DEV-0104', 'setValue', 92)]),
    ],
  },
  {
    id: 'SC-008',
    name: '离场清场模式',
    description: '当日活动结束后执行，关闭全部音视频设备、恢复照明至安防亮度、锁闭门禁并启动布防。',
    tags: ['日常', '安防'],
    spaceId: 'SP-04',
    enabled: false,
    usedCount: 155,
    lastRunAt: dayjs().subtract(1, 'day').hour(21).minute(40).second(0).format('YYYY-MM-DDTHH:mm:ssZ'),
    avgDuration: 36,
    riskLevel: 'medium',
    icon: 'LogOut',
    steps: [
      step('关闭音视频设备', 0, [
        act('DEV-0101', 'powerOff'),
        act('DEV-0102', 'powerOff'),
        act('DEV-0105', 'powerOff'),
        act('DEV-0136', 'setValue', 0),
      ]),
      step('照明降至安防亮度', 4, [act('DEV-0137', 'setValue', 15), act('DEV-0108', 'setValue', 15)]),
      step('锁闭门禁并布防', 3, [act('DEV-0138', 'powerOff'), act('DEV-0140', 'powerOff')]),
    ],
  },
]

export const SCENES: Scene[] = raw.map((s) => ({ ...s, deviceCount: countDevices(s.steps) }))

export const sceneById = (id: string) => SCENES.find((s) => s.id === id)
