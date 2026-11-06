import type { SceneNode } from '@/types'

export const PARK = {
  width: 1400,
  depth: 1400,
  originX: 3453210.456,
  originY: 40512880.132,
  baseElevation: 8.5,
  maxElevation: 12.3,
  area: 2.6,
  crs: 'CGCS2000 / 3-degree GK CM 120E',
  zone: 40,
}

export type RoofType = 'flat' | 'sawtooth' | 'gable'

export interface BuildingSpec {
  code: string
  name: string
  zone: string
  x: number
  z: number
  w: number
  d: number
  h: number
  floors: number
  roofType: RoofType
  wall: string
  roof: string
  structure: string
  builtYear: number
  windowsPerFloor: number
  hasDock?: boolean
  hasChimney?: boolean
  landmark?: boolean
}

export const ZONES = [
  { code: 'A', name: 'A 区 智能装配', x: -520, z: -260, w: 220, d: 400 },
  { code: 'B', name: 'B 区 精密加工', x: -300, z: -350, w: 160, d: 240 },
  { code: 'C', name: 'C 区 研发办公', x: -620, z: 60, w: 130, d: 130 },
  { code: 'D', name: 'D 区 综合动力', x: -370, z: 160, w: 280, d: 220 },
  { code: 'E', name: 'E 区 220kV 变电站', x: -80, z: -470, w: 150, d: 140 },
  { code: 'F', name: 'F 区 物流仓储', x: -580, z: 430, w: 240, d: 280 },
  { code: 'G', name: 'G 滨江码头', x: 600, z: 380, w: 220, d: 380 },
  { code: 'H', name: 'H 文保建筑 · 纺织厂旧址', x: -40, z: 230, w: 130, d: 120 },
]

export const BUILDINGS: BuildingSpec[] = [
  { code: 'A-01', name: '装配车间一', zone: 'A 区 智能装配', x: -520, z: -380, w: 120, d: 60, h: 18, floors: 2, roofType: 'sawtooth', wall: '#DCE3EC', roof: '#5B7089', structure: '钢结构', builtYear: 2016, windowsPerFloor: 10 },
  { code: 'A-02', name: '装配车间二', zone: 'A 区 智能装配', x: -520, z: -240, w: 120, d: 60, h: 18, floors: 2, roofType: 'sawtooth', wall: '#DCE3EC', roof: '#5B7089', structure: '钢结构', builtYear: 2017, windowsPerFloor: 10 },
  { code: 'A-03', name: '装配车间三', zone: 'A 区 智能装配', x: -520, z: -100, w: 120, d: 60, h: 18, floors: 2, roofType: 'sawtooth', wall: '#E3E9F0', roof: '#5B7089', structure: '钢结构', builtYear: 2019, windowsPerFloor: 10 },
  { code: 'B-01', name: '精密加工中心一', zone: 'B 区 精密加工', x: -300, z: -420, w: 90, d: 54, h: 15, floors: 2, roofType: 'flat', wall: '#F1F4F8', roof: '#7C8DA3', structure: '框架', builtYear: 2015, windowsPerFloor: 8 },
  { code: 'B-02', name: '精密加工中心二', zone: 'B 区 精密加工', x: -300, z: -280, w: 90, d: 54, h: 15, floors: 2, roofType: 'flat', wall: '#F1F4F8', roof: '#7C8DA3', structure: '框架', builtYear: 2018, windowsPerFloor: 8 },
  { code: 'C-01', name: '研发办公楼', zone: 'C 区 研发办公', x: -600, z: 70, w: 54, d: 36, h: 48, floors: 12, roofType: 'flat', wall: '#8FA6BF', roof: '#42536B', structure: '框架核心筒', builtYear: 2020, windowsPerFloor: 12, landmark: true },
  { code: 'D-01', name: '综合动力站', zone: 'D 区 综合动力', x: -400, z: 150, w: 72, d: 48, h: 12, floors: 2, roofType: 'flat', wall: '#CBD5E1', roof: '#64748B', structure: '框架', builtYear: 2016, windowsPerFloor: 6 },
  { code: 'E-01', name: '220kV 变电站', zone: 'E 区 220kV 变电站', x: -80, z: -470, w: 90, d: 70, h: 9, floors: 1, roofType: 'flat', wall: '#D7DEE7', roof: '#6B7C93', structure: '钢结构', builtYear: 2014, windowsPerFloor: 3 },
  { code: 'F-01', name: '物流仓储一', zone: 'F 区 物流仓储', x: -600, z: 380, w: 150, d: 72, h: 14, floors: 1, roofType: 'flat', wall: '#E7ECF2', roof: '#6E8098', structure: '门式刚架', builtYear: 2015, windowsPerFloor: 4, hasDock: true },
  { code: 'F-02', name: '物流仓储二', zone: 'F 区 物流仓储', x: -600, z: 540, w: 150, d: 72, h: 14, floors: 1, roofType: 'flat', wall: '#E7ECF2', roof: '#6E8098', structure: '门式刚架', builtYear: 2021, windowsPerFloor: 4, hasDock: true },
  { code: 'G-01', name: '码头综合楼', zone: 'G 滨江码头', x: 630, z: 250, w: 36, d: 24, h: 12, floors: 3, roofType: 'flat', wall: '#D5DDE8', roof: '#5F7288', structure: '框架', builtYear: 2012, windowsPerFloor: 6 },
  { code: 'H-01', name: '滨江纺织厂旧址', zone: 'H 文保建筑 · 纺织厂旧址', x: -40, z: 230, w: 42, d: 18, h: 9, floors: 2, roofType: 'gable', wall: '#A85A48', roof: '#4B5563', structure: '砖木', builtYear: 1937, windowsPerFloor: 6, hasChimney: true, landmark: true },
  { code: 'H-02', name: '员工食堂', zone: 'H 文保建筑 · 纺织厂旧址', x: 120, z: 430, w: 48, d: 36, h: 12, floors: 2, roofType: 'flat', wall: '#E9EEF4', roof: '#6B7C93', structure: '框架', builtYear: 2018, windowsPerFloor: 8 },
  { code: 'H-03', name: '中试车间', zone: 'B 区 精密加工', x: -180, z: 30, w: 72, d: 48, h: 15, floors: 2, roofType: 'flat', wall: '#E3E9F0', roof: '#6B7C93', structure: '钢结构', builtYear: 2019, windowsPerFloor: 7 },
  { code: 'H-04', name: '门卫房', zone: 'A 区 智能装配', x: -20, z: -640, w: 18, d: 12, h: 5, floors: 1, roofType: 'flat', wall: '#EDF1F6', roof: '#7C8DA3', structure: '砌体', builtYear: 2016, windowsPerFloor: 3 },
  { code: 'H-05', name: '10kV 配电房', zone: 'D 区 综合动力', x: 60, z: -380, w: 24, d: 18, h: 6, floors: 1, roofType: 'flat', wall: '#DDE4EC', roof: '#7C8DA3', structure: '砌体', builtYear: 2016, windowsPerFloor: 2 },
  { code: 'H-06', name: '水泵房', zone: 'D 区 综合动力', x: 200, z: -160, w: 18, d: 12, h: 5, floors: 1, roofType: 'flat', wall: '#DDE4EC', roof: '#7C8DA3', structure: '砌体', builtYear: 2016, windowsPerFloor: 2 },
  { code: 'H-07', name: '危化品库', zone: 'F 区 物流仓储', x: -380, z: 540, w: 30, d: 18, h: 7, floors: 1, roofType: 'flat', wall: '#E5E9EF', roof: '#8896A8', structure: '框架', builtYear: 2020, windowsPerFloor: 2 },
]

export const LAKE = { x: 300, z: 480, r: 90 }
export const TANKS = [
  { x: -300, z: 200, r: 9, h: 22 },
  { x: -250, z: 262, r: 9, h: 22 },
  { x: -196, z: 200, r: 9, h: 22 },
  { x: -250, z: 142, r: 9, h: 22 },
]
export const CRANES = [
  { x: 655, z: 300, h: 34 },
  { x: 655, z: 470, h: 34 },
]
export const PIPE_RACK: [number, number][] = [
  [-400, 180], [-400, 20], [-480, -60], [-520, -70],
]

export const zoneOf = (code: string) => BUILDINGS.find((b) => b.code === code)?.zone ?? '园区'

export function buildSceneNodes(): SceneNode[] {
  const nodes: SceneNode[] = [
    {
      id: 'root',
      name: '滨江智能制造园区',
      type: 'zone',
      parentId: null,
      bbox: { min: [-700, 0, -700], max: [700, 60, 700] },
      meta: { 面积: '2.6 km²', 建筑: BUILDINGS.length, 坐标系: PARK.crs },
    },
  ]
  ZONES.forEach((z) => {
    nodes.push({
      id: `zone-${z.code}`,
      name: z.name,
      type: 'zone',
      parentId: 'root',
      bbox: {
        min: [z.x - z.w / 2, 0, z.z - z.d / 2],
        max: [z.x + z.w / 2, 60, z.z + z.d / 2],
      },
      meta: { 分区: z.code },
    })
  })
  BUILDINGS.forEach((b) => {
    const zoneCode = b.zone.slice(0, 1)
    nodes.push({
      id: `bld-${b.code}`,
      name: `${b.code} ${b.name}`,
      type: 'building',
      parentId: `zone-${zoneCode}`,
      bbox: {
        min: [b.x - b.w / 2, 0, b.z - b.d / 2],
        max: [b.x + b.w / 2, b.h, b.z + b.d / 2],
      },
      meta: {
        建筑面积: `${(b.w * b.d * b.floors * 0.82).toFixed(0)} m²`,
        层数: b.floors,
        檐高: `${b.h} m`,
        结构: b.structure,
        建成年份: b.builtYear,
        复刻精度: '±3.1 cm',
        构件数: Math.round((b.w * b.d) / 6),
      },
    })
  })
  return nodes
}
