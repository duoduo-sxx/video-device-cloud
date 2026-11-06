import dayjs from 'dayjs'
import type {
  CaseStudy,
  Defect,
  DetectionTask,
  Grade,
  MediaAsset,
  PlanStep,
  QcReport,
  RepairPlan,
  RepairTask,
  ReviewRecord,
  Rule,
  RuleSet,
  ServiceOrder,
  Severity,
} from '../types'
import { ALGORITHM_MAP, ALGORITHMS } from '../lib/algorithmCatalog'
import { DEFECT_CATALOG, DEFECT_MAP, type DefectTemplate } from '../lib/defectCatalog'
import { countBySeverity, computeScore, gradeOf } from '../lib/scoring'
import { buildQuote } from '../lib/pricing'
import { slaDeadline } from '../lib/sla'
import { createRng, SEED, type Rng } from './random'
import { MEMBERS, NODES, PACKAGES, PROJECTS } from './seed'

const NOW = dayjs('2026-10-19T10:25:00+08:00')

interface TechSpec {
  container: string
  videoCodec: string
  width: number
  height: number
  fps: number
  scan: 'p' | 'i'
  audioCodec: string
  sampleRate: number
  channels: number
  bitDepth: number
  bitrate: number
  loud: [number, number]
}

const TECH: Record<string, TechSpec> = {
  p1: { container: 'MOV', videoCodec: 'ProRes 422HQ', width: 3840, height: 2160, fps: 25, scan: 'p', audioCodec: 'PCM', sampleRate: 48000, channels: 6, bitDepth: 24, bitrate: 780, loud: [-22.4, -19.6] },
  p2: { container: 'MP4', videoCodec: 'H.264 High', width: 1920, height: 1080, fps: 23.976, scan: 'p', audioCodec: 'AAC', sampleRate: 48000, channels: 2, bitDepth: 16, bitrate: 11.5, loud: [-15.8, -11.2] },
  p3: { container: 'MXF', videoCodec: 'XDCAM HD422', width: 1920, height: 1080, fps: 50, scan: 'i', audioCodec: 'PCM', sampleRate: 48000, channels: 4, bitDepth: 24, bitrate: 50, loud: [-24.4, -23.4] },
  p4: { container: 'MOV', videoCodec: 'ProRes 4444', width: 2048, height: 1080, fps: 24, scan: 'p', audioCodec: 'PCM', sampleRate: 48000, channels: 6, bitDepth: 24, bitrate: 760, loud: [-26.8, -24.2] },
  p5: { container: 'MOV', videoCodec: 'ProRes 422HQ', width: 3840, height: 2160, fps: 50, scan: 'p', audioCodec: 'PCM', sampleRate: 48000, channels: 4, bitDepth: 24, bitrate: 1100, loud: [-16.4, -13.8] },
  p6: { container: 'MP4', videoCodec: 'H.264 Main', width: 1920, height: 1080, fps: 30, scan: 'p', audioCodec: 'AAC', sampleRate: 48000, channels: 1, bitDepth: 16, bitrate: 7.5, loud: [-19.6, -16.8] },
}

interface AssetSeed {
  name: string
  file: string
  proj: string
  dur: number
  version: string
  tags: string[]
}

const ASSET_SEEDS: AssetSeed[] = [
  { name: '澜沧江 第一集 源流', file: 'LCJ_S01E01_正片_4K_25p_ProRes422HQ_v3.mov', proj: 'p1', dur: 3024, version: 'v3', tags: ['正片', '4K', '送审'] },
  { name: '澜沧江 第二集 峡谷', file: 'LCJ_S01E02_正片_4K_25p_ProRes422HQ_v2.mov', proj: 'p1', dur: 2946, version: 'v2', tags: ['正片', '4K'] },
  { name: '澜沧江 第三集 渡口', file: 'LCJ_S01E03_正片_4K_25p_ProRes422HQ_v3.mov', proj: 'p1', dur: 3082, version: 'v3', tags: ['正片', '4K', '待修复'] },
  { name: '澜沧江 第四集 湖泊', file: 'LCJ_S01E04_正片_4K_25p_ProRes422HQ_v1.mov', proj: 'p1', dur: 2880, version: 'v1', tags: ['正片', '4K'] },
  { name: '澜沧江 第五集 入海', file: 'LCJ_S01E05_正片_4K_25p_ProRes422HQ_v2.mov', proj: 'p1', dur: 3114, version: 'v2', tags: ['正片', '4K', '响度整改'] },
  { name: '澜沧江 片头包装', file: 'LCJ_片头_包装_4K_25p_v4.mov', proj: 'p1', dur: 48, version: 'v4', tags: ['片头', '包装'] },

  { name: '城市之光 EP01', file: 'CSZG_EP01_交付版_H264_1080p_23976_v2.mp4', proj: 'p2', dur: 2712, version: 'v2', tags: ['正片', '流媒体'] },
  { name: '城市之光 EP02', file: 'CSZG_EP02_交付版_H264_1080p_23976_v2.mp4', proj: 'p2', dur: 2688, version: 'v2', tags: ['正片', '流媒体'] },
  { name: '城市之光 EP03', file: 'CSZG_EP03_交付版_H264_1080p_23976_v3.mp4', proj: 'p2', dur: 2745, version: 'v3', tags: ['正片', '流媒体', '响度整改'] },
  { name: '城市之光 EP07', file: 'CSZG_EP07_交付版_H264_1080p_23976_v2.mp4', proj: 'p2', dur: 2620, version: 'v2', tags: ['正片', '流媒体'] },
  { name: '城市之光 EP08', file: 'CSZG_EP08_交付版_H264_1080p_23976_v1.mp4', proj: 'p2', dur: 2596, version: 'v1', tags: ['正片', '流媒体'] },
  { name: '城市之光 预告片', file: 'CSZG_预告片_30s_H264_1080p_v4.mp4', proj: 'p2', dur: 32, version: 'v4', tags: ['预告', '短视频'] },

  { name: '晚间新闻 20260912', file: 'XW_Live_20260912_场次2_1080i50.mxf', proj: 'p3', dur: 1806, version: 'v1', tags: ['日播', 'MXF'] },
  { name: '晚间新闻 20260918', file: 'XW_Live_20260918_场次1_1080i50.mxf', proj: 'p3', dur: 1812, version: 'v1', tags: ['日播', 'MXF'] },
  { name: '晚间新闻 20260925', file: 'XW_Live_20260925_场次2_1080i50.mxf', proj: 'p3', dur: 1788, version: 'v1', tags: ['日播', 'MXF'] },
  { name: '晚间新闻 20261008', file: 'XW_Live_20261008_场次1_1080i50.mxf', proj: 'p3', dur: 1824, version: 'v1', tags: ['日播', 'MXF'] },
  { name: '晚间新闻 片头', file: 'XW_片头_2026版_1080i50.mxf', proj: 'p3', dur: 24, version: 'v2', tags: ['片头'] },

  { name: '深海 Reel01', file: 'SH_Reel01_扫描_2K_24p_ProRes4444.mov', proj: 'p4', dur: 5760, version: 'v1', tags: ['胶片扫描', '老片'] },
  { name: '深海 Reel02', file: 'SH_Reel02_扫描_2K_24p_ProRes4444.mov', proj: 'p4', dur: 5712, version: 'v1', tags: ['胶片扫描', '老片'] },
  { name: '深海 Reel03', file: 'SH_Reel03_扫描_2K_24p_ProRes4444.mov', proj: 'p4', dur: 5688, version: 'v1', tags: ['胶片扫描', '老片'] },
  { name: '深海 修复版预告', file: 'SH_预告_修复版_2K_24p_v2.mov', proj: 'p4', dur: 96, version: 'v2', tags: ['预告'] },

  { name: '25 周年宣传片 Master', file: 'XC25_宣传片_Master_HDR_50p_v5.mov', proj: 'p5', dur: 96, version: 'v5', tags: ['HDR', 'Master'] },
  { name: '25 周年宣传片 v4', file: 'XC25_宣传片_Master_HDR_50p_v4.mov', proj: 'p5', dur: 96, version: 'v4', tags: ['HDR', '历史版本'] },
  { name: '25 周年宣传片 15s', file: 'XC25_宣传片_15s_竖版_50p_v2.mov', proj: 'p5', dur: 15, version: 'v2', tags: ['短视频', '竖版'] },
  { name: '25 周年宣传片 30s', file: 'XC25_宣传片_30s_横版_50p_v2.mov', proj: 'p5', dur: 30, version: 'v2', tags: ['短视频'] },

  { name: '信号与系统 第08讲', file: 'SIGNAL_CH08_第08讲_录播_1080p30.mp4', proj: 'p6', dur: 2412, version: 'v1', tags: ['课程', '录播'] },
  { name: '信号与系统 第09讲', file: 'SIGNAL_CH09_第09讲_录播_1080p30.mp4', proj: 'p6', dur: 2388, version: 'v1', tags: ['课程', '录播'] },
  { name: '信号与系统 第12讲', file: 'SIGNAL_CH12_第12讲_录播_1080p30.mp4', proj: 'p6', dur: 2454, version: 'v2', tags: ['课程', '底噪'] },
  { name: '信号与系统 第13讲', file: 'SIGNAL_CH13_第13讲_录播_1080p30.mp4', proj: 'p6', dur: 2322, version: 'v1', tags: ['课程', '录播'] },
  { name: '信号与系统 第14讲', file: 'SIGNAL_CH14_第14讲_录播_1080p30.mp4', proj: 'p6', dur: 2478, version: 'v1', tags: ['课程', '录播'] },
  { name: '信号与系统 课程片头', file: 'SIGNAL_片头_1080p30_v3.mp4', proj: 'p6', dur: 18, version: 'v3', tags: ['片头'] },
  { name: '信号与系统 习题讲解合集', file: 'SIGNAL_习题讲解_合集_1080p30_v1.mp4', proj: 'p6', dur: 3624, version: 'v1', tags: ['合集', '长视频'] },
]

export function buildAssets(): MediaAsset[] {
  const rng = createRng(SEED + 1)
  return ASSET_SEEDS.map((seed, i) => {
    const tech = TECH[seed.proj]
    const project = PROJECTS.find((p) => p.id === seed.proj)!
    const bitrate = Math.round(tech.bitrate * rng.float(0.96, 1.04, 2) * 10) / 10
    const sizeGB = Math.round(((bitrate * seed.dur) / 8 / 1024) * 100) / 100
    const loud = rng.float(tech.loud[0], tech.loud[1], 1)
    const uploadedAt = dayjs(NOW)
      .subtract(rng.int(2, 96), 'day')
      .subtract(rng.int(0, 23), 'hour')
      .toISOString()
    return {
      id: `a${i + 1}`,
      code: `AV-2026-${String(100 + i)}`,
      name: seed.name,
      fileName: seed.file,
      projectId: seed.proj,
      projectName: project.name,
      kind: seed.dur < 120 && seed.name.includes('片头') ? 'sequence' : 'video',
      container: tech.container,
      videoCodec: tech.videoCodec,
      width: tech.width,
      height: tech.height,
      fps: tech.fps,
      scan: tech.scan,
      sar: '1:1',
      audioCodec: tech.audioCodec,
      sampleRate: tech.sampleRate,
      channels: tech.channels,
      bitDepth: tech.bitDepth,
      bitrateMbps: bitrate,
      durationSec: seed.dur,
      sizeGB,
      loudnessLufs: loud,
      truePeakDb: rng.float(-3.4, -0.2, 1),
      ownerId: rng.pick(['m2', 'm3', 'm4', 'm5', 'm6']),
      uploadedAt,
      status: 'ready',
      tags: seed.tags,
      version: seed.version,
      thumbSeed: 300 + i * 7,
    }
  })
}

export function buildRules(): Rule[] {
  return DEFECT_CATALOG.map((d, i) => ({
    id: `R-${String(i + 1).padStart(3, '0')}`,
    code: d.code,
    name: d.name,
    channel: d.channel,
    severity: d.severity,
    threshold: {
      value: d.threshold,
      unit: d.unit,
      op: d.violation === 'above' ? '>' : '<',
    },
    enabled: !['V-EXP', 'A-DC'].includes(d.code),
    hitCount: 40 + ((i * 37) % 320),
    description: d.cause,
    updatedAt: dayjs(NOW).subtract(i % 30, 'day').toISOString(),
    version: i % 4 === 0 ? 'v2.1' : 'v1.8',
  }))
}

export function buildRuleSets(rules: Rule[]): RuleSet[] {
  const byCode = (codes: string[]) => codes.map((c) => rules.find((r) => r.code === c)!.id)
  const all = rules.map((r) => r.code)
  return [
    { id: 'rs1', name: '广电播出标准', scene: '广电播出', ruleIds: byCode(all), usedCount: 168, desc: '覆盖视频、音频、容器、字幕全通道，按 GY/T 282-2014 执行' },
    {
      id: 'rs2',
      name: '流媒体上线',
      scene: '流媒体上线',
      ruleIds: byCode(all.filter((c) => !['V-INT', 'C-FPS', 'C-ASP', 'A-PHS'].includes(c))),
      usedCount: 214,
      desc: '面向长视频平台，响度 -14 LUFS，弱化影院相关项',
    },
    {
      id: 'rs3',
      name: '影院 DCP',
      scene: '影院 DCP',
      ruleIds: byCode(all.filter((c) => !['C-SUB', 'A-PHS', 'C-FPS'].includes(c))),
      usedCount: 57,
      desc: '按 SMPTE RP 200，对白参考 -27 LKFS，强调 HDR/SDR 与像素比',
    },
    {
      id: 'rs4',
      name: '教育课程',
      scene: '教育课程',
      ruleIds: byCode(all.filter((c) => ['audio', 'container', 'subtitle'].includes(DEFECT_MAP[c].channel) || ['V-FRZ', 'V-MOS'].includes(c))),
      usedCount: 92,
      desc: '以语音清晰度与字幕对轴为重点，关闭影院级画质项',
    },
  ]
}

interface TaskSeed {
  assetId: string
  status: DetectionTask['status']
  profile: 'excellent' | 'good' | 'normal' | 'bad'
  progress: number
  priority: 'normal' | 'high' | 'urgent'
  ruleset: string
  startedAt: string
  operator: string
  node: string
}

const TASK_SEEDS: TaskSeed[] = [
  { assetId: 'a3', status: 'done', profile: 'normal', progress: 100, priority: 'high', ruleset: 'rs1', startedAt: '2026-10-18T09:12:00+08:00', operator: 'm7', node: 'n1' },
  { assetId: 'a4', status: 'done', profile: 'good', progress: 100, priority: 'normal', ruleset: 'rs1', startedAt: '2026-10-17T14:30:00+08:00', operator: 'm7', node: 'n2' },
  { assetId: 'a7', status: 'done', profile: 'good', progress: 100, priority: 'normal', ruleset: 'rs2', startedAt: '2026-10-16T10:05:00+08:00', operator: 'm8', node: 'n1' },
  { assetId: 'a9', status: 'detecting', profile: 'normal', progress: 34, priority: 'high', ruleset: 'rs2', startedAt: '2026-10-19T10:02:00+08:00', operator: 'm6', node: 'n4' },
  { assetId: 'a13', status: 'done', profile: 'excellent', progress: 100, priority: 'normal', ruleset: 'rs1', startedAt: '2026-10-15T08:40:00+08:00', operator: 'm8', node: 'n7' },
  { assetId: 'a18', status: 'done', profile: 'bad', progress: 100, priority: 'urgent', ruleset: 'rs3', startedAt: '2026-10-14T16:00:00+08:00', operator: 'm6', node: 'n1' },
  { assetId: 'a19', status: 'done', profile: 'normal', progress: 100, priority: 'high', ruleset: 'rs3', startedAt: '2026-10-13T11:20:00+08:00', operator: 'm6', node: 'n2' },
  { assetId: 'a22', status: 'done', profile: 'good', progress: 100, priority: 'urgent', ruleset: 'rs2', startedAt: '2026-10-12T15:45:00+08:00', operator: 'm7', node: 'n4' },
  { assetId: 'a26', status: 'done', profile: 'excellent', progress: 100, priority: 'normal', ruleset: 'rs4', startedAt: '2026-10-11T09:30:00+08:00', operator: 'm8', node: 'n7' },
  { assetId: 'a27', status: 'done', profile: 'excellent', progress: 100, priority: 'normal', ruleset: 'rs4', startedAt: '2026-10-10T13:15:00+08:00', operator: 'm8', node: 'n7' },
  { assetId: 'a5', status: 'detecting', profile: 'normal', progress: 62, priority: 'high', ruleset: 'rs1', startedAt: '2026-10-19T09:20:00+08:00', operator: 'm2', node: 'n1' },
  { assetId: 'a6', status: 'done', profile: 'good', progress: 100, priority: 'normal', ruleset: 'rs1', startedAt: '2026-10-09T10:00:00+08:00', operator: 'm3', node: 'n2' },
  { assetId: 'a10', status: 'failed', profile: 'normal', progress: 41, priority: 'normal', ruleset: 'rs2', startedAt: '2026-10-15T19:10:00+08:00', operator: 'm3', node: 'n8' },
  { assetId: 'a14', status: 'detecting', profile: 'good', progress: 78, priority: 'urgent', ruleset: 'rs1', startedAt: '2026-10-19T08:50:00+08:00', operator: 'm7', node: 'n2' },
  { assetId: 'a20', status: 'queued', profile: 'normal', progress: 0, priority: 'normal', ruleset: 'rs3', startedAt: '2026-10-19T10:20:00+08:00', operator: 'm6', node: 'n5' },
  { assetId: 'a28', status: 'queued', profile: 'normal', progress: 0, priority: 'normal', ruleset: 'rs4', startedAt: '2026-10-19T10:22:00+08:00', operator: 'm8', node: 'n7' },
  { assetId: 'a1', status: 'done', profile: 'bad', progress: 100, priority: 'urgent', ruleset: 'rs1', startedAt: '2026-10-08T09:05:00+08:00', operator: 'm6', node: 'n1' },
  { assetId: 'a29', status: 'done', profile: 'good', progress: 100, priority: 'normal', ruleset: 'rs4', startedAt: '2026-10-07T15:40:00+08:00', operator: 'm8', node: 'n7' },
]

function metricDelta(unit: string, rng: Rng): number {
  switch (unit) {
    case 'LKFS':
      return rng.float(0.8, 6.2, 1)
    case 'dBFS':
      return rng.float(2, 18, 1)
    case 'dB':
      return rng.float(0.6, 12, 1)
    case 'dBTP':
      return rng.float(0.4, 3, 1)
    case 'ms':
      return rng.int(20, 900)
    case '帧':
      return rng.int(1, 30)
    case '%':
      return rng.float(0.2, 3.4, 2)
    case '%FS':
      return rng.float(0.1, 1.6, 2)
    case 'IRE':
      return rng.int(2, 12)
    case 'score':
      return rng.float(0.02, 0.42, 2)
    case 'px':
      return rng.int(1, 18)
    case 'ΔE':
      return rng.float(0.5, 8, 1)
    case 's':
      return rng.float(0.05, 0.8, 2)
    case 'corr':
      return rng.float(0.05, 0.5, 2)
    case 'fps':
      return rng.float(0.1, 1.5, 2)
    case 'ch':
      return rng.int(1, 2)
    case '项':
      return rng.int(1, 3)
    case '处':
      return rng.int(1, 2)
    case '场':
      return rng.int(1, 2)
    case 'flags':
      return 1
    default:
      return rng.float(0.5, 5, 1)
  }
}

function roundMetric(unit: string, v: number): number {
  if (['项', '处', '帧', 'px', 'ch', '场', 'flags', 'ms'].includes(unit)) return Math.round(v)
  if (unit === 's' || unit === 'LKFS' || unit === 'dB' || unit === 'dBFS' || unit === 'dBTP' || unit === 'ΔE' || unit === 'fps') return Math.round(v * 10) / 10
  return Math.round(v * 100) / 100
}

const PROFILE_COUNT: Record<TaskSeed['profile'], number> = {
  excellent: 6,
  good: 10,
  normal: 16,
  bad: 24,
}

export function buildDefects(task: DetectionTask, asset: MediaAsset, profile: TaskSeed['profile'], rng: Rng): Defect[] {
  const count = Math.max(4, PROFILE_COUNT[profile] + rng.int(-2, 2))
  const weighted = DEFECT_CATALOG.map((t) => ({ item: t, weight: t.freq }))
  const picked: DefectTemplate[] = []
  for (let i = 0; i < count; i++) picked.push(rng.weighted(weighted))

  const positions = picked.map(() => rng.float(1, Math.max(2, asset.durationSec - 2), 1)).sort((a, b) => a - b)

  return picked.map((t, i) => {
    let start = positions[i]
    let end = start + rng.float(t.dur[0], t.dur[1], 1)
    if (t.code === 'A-LVL' || t.code === 'C-FMT' || t.code === 'C-MET' || t.code === 'V-BND') {
      start = 0
      end = asset.durationSec
    }
    if (end > asset.durationSec) {
      end = asset.durationSec
      start = Math.max(0, end - Math.min(4, t.dur[1]))
    }
    const delta = metricDelta(t.unit, rng)
    const raw = t.violation === 'above' ? t.threshold + delta : t.threshold - delta
    const isIgnored = rng.bool(0.06) && t.severity !== 'fatal'
    return {
      id: `${task.id}-d${i + 1}`,
      taskId: task.id,
      assetId: asset.id,
      code: t.code,
      name: t.name,
      channel: t.channel,
      severity: t.severity,
      startSec: Math.round(start * 10) / 10,
      endSec: Math.round(end * 10) / 10,
      confidence: rng.float(t.severity === 'fatal' ? 0.92 : 0.74, 0.995, 3),
      metricLabel: t.metricLabel,
      metricValue: roundMetric(t.unit, raw),
      threshold: t.threshold,
      unit: t.unit,
      status: isIgnored ? 'ignored' : 'open',
      suggestion: t.suggestion,
      algorithmIds: t.algorithmIds,
    }
  })
}

export interface BuiltData {
  assets: MediaAsset[]
  rules: Rule[]
  ruleSets: RuleSet[]
  tasks: DetectionTask[]
  defects: Defect[]
  repairs: RepairTask[]
  plans: RepairPlan[]
  reviews: ReviewRecord[]
  reports: QcReport[]
  orders: ServiceOrder[]
}

export function buildAll(): BuiltData {
  const rng = createRng(SEED)
  const assets = buildAssets()
  const rules = buildRules()
  const ruleSets = buildRuleSets(rules)
  const tasks: DetectionTask[] = []
  const defects: Defect[] = []
  const plans: RepairPlan[] = []
  const repairs: RepairTask[] = []
  const reviews: ReviewRecord[] = []
  const reports: QcReport[] = []

  TASK_SEEDS.forEach((seed, idx) => {
    const asset = assets.find((a) => a.id === seed.assetId)!
    const ruleSet = ruleSets.find((r) => r.id === seed.ruleset)!
    const day = dayjs(seed.startedAt)
    const finished = seed.status === 'done' ? day.add(rng.int(9, 38), 'minute') : undefined
    const task: DetectionTask = {
      id: `dt${idx + 1}`,
      code: `DT-${day.format('YYYYMMDD')}-${String(idx + 1).padStart(3, '0')}`,
      assetId: asset.id,
      assetName: asset.name,
      ruleSetId: ruleSet.id,
      ruleSetName: ruleSet.name,
      status: seed.status,
      progress: seed.progress,
      score: 0,
      grade: 'B',
      counts: { fatal: 0, severe: 0, moderate: 0, info: 0 },
      startedAt: seed.startedAt,
      finishedAt: finished?.toISOString(),
      etaSec: seed.status === 'done' ? undefined : Math.round((asset.durationSec / 60) * 22 * (1 - seed.progress / 100)),
      durationSec: asset.durationSec,
      operatorId: seed.operator,
      priority: seed.priority,
      nodeId: seed.node,
      logs: [],
    }

    const taskDefects = buildDefects(task, asset, seed.profile, rng)
    if (seed.status !== 'done') {
      taskDefects.forEach((d) => {
        d.status = 'open'
      })
    }
    defects.push(...taskDefects)

    const counts = countBySeverity(taskDefects)
    const allCounts = taskDefects.reduce(
      (acc, d) => {
        acc[d.severity] += 1
        return acc
      },
      { fatal: 0, severe: 0, moderate: 0, info: 0 } as Record<Severity, number>,
    )
    task.counts = allCounts
    task.score = computeScore(taskDefects)
    task.grade = gradeOf(task.score, taskDefects) as Grade
    task.logs = [
      { t: day.format('HH:mm:ss'), level: 'info', msg: `任务创建，规则集「${ruleSet.name}」共 ${ruleSet.ruleIds.length} 条规则` },
      { t: day.add(3, 'second').format('HH:mm:ss'), level: 'info', msg: `ffprobe: ${asset.container} / ${asset.videoCodec} / ${asset.width}x${asset.height} / ${asset.fps}fps` },
      { t: day.add(18, 'second').format('HH:mm:ss'), level: 'info', msg: `分轨完成，视频 1 轨、音频 ${asset.channels ?? 2} 声道、字幕 1 轨` },
      {
        t: day.add(46, 'second').format('HH:mm:ss'),
        level: 'info',
        msg: `检测引擎启动：${ruleSet.ruleIds.length} 条规则并行执行，节点 ${seed.node}`,
      },
      ...(counts.fatal > 0
        ? [{ t: day.add(4, 'minute').format('HH:mm:ss'), level: 'warn' as const, msg: `命中致命级缺陷 ${counts.fatal} 条，已标记优先复核` }]
        : []),
      ...(seed.status === 'done'
        ? [{ t: finished!.format('HH:mm:ss'), level: 'info' as const, msg: `检测完成，评分 ${task.score}（${task.grade} 级），共 ${taskDefects.length} 条缺陷` }]
        : []),
      ...(seed.status === 'failed'
        ? [{ t: day.add(6, 'minute').format('HH:mm:ss'), level: 'error' as const, msg: '文件尾部损坏，解码在第 41% 处中断，任务终止' }]
        : []),
    ]
    tasks.push(task)
  })

  const doneTasks = tasks.filter((t) => t.status === 'done')
  const repairStatuses: RepairTask['status'][] = [
    'passed', 'passed', 'passed', 'review', 'review', 'review', 'running', 'running',
    'rejected', 'failed', 'passed', 'passed', 'passed', 'pending',
  ]

  repairStatuses.forEach((status, idx) => {
    const task = doneTasks[idx % doneTasks.length]
    const asset = assets.find((a) => a.id === task.assetId)!
    const taskDefects = defects.filter((d) => d.taskId === task.id && d.status !== 'ignored')
    const codes = Array.from(new Set(taskDefects.map((d) => d.code)))

    const steps: PlanStep[] = codes.slice(0, 6).map((code, i) => {
      const alg = ALGORITHMS.find((a) => a.targets.includes(code)) ?? ALGORITHMS[0]
      const params = Object.fromEntries(alg.params.map((p) => [p.key, p.default]))
      return {
        id: `ps${idx + 1}-${i + 1}`,
        algorithmId: alg.id,
        algorithmName: alg.name,
        targetDefectIds: taskDefects.filter((d) => d.code === code).map((d) => d.id),
        order: i + 1,
        enabled: true,
        params,
        estMinutes: Math.max(2, Math.round((asset.durationSec / 60 / alg.speed) * 10) / 10),
        risk: alg.risk,
      }
    })
    const estMinutes = Math.round(steps.reduce((s, st) => s + st.estMinutes, 0))
    const plan: RepairPlan = {
      id: `rp${idx + 1}`,
      taskId: task.id,
      template: idx % 3 === 0 ? '标准' : idx % 3 === 1 ? '保守' : '激进',
      steps,
      estTotalMinutes: estMinutes,
      estCost: Math.round(estMinutes * 1.6),
      conflicts: idx === 4 ? ['响度归一化与限幅顺序存在冲突，建议先归一化再限幅'] : [],
    }
    plans.push(plan)

    const progressByStatus: Record<string, number> = {
      passed: 100, review: 100, rejected: 100, running: 46, failed: 63, pending: 0,
    }
    const progress = progressByStatus[status]
    const total = taskDefects.length
    const residual = status === 'rejected' ? 3 : status === 'review' ? 1 : status === 'passed' ? 0 : status === 'running' ? 2 : status === 'failed' ? total : 0
    const fixed = Math.max(0, Math.min(total, Math.round((total * progress) / 100) - (status === 'rejected' ? 1 : 0)))
    const repair: RepairTask = {
      id: `rt${idx + 1}`,
      code: `RT-${dayjs(task.startedAt).add(idx, 'day').format('YYYYMMDD')}-${String(idx + 1).padStart(3, '0')}`,
      planId: plan.id,
      detectionTaskId: task.id,
      assetId: asset.id,
      assetName: asset.name,
      status,
      progress,
      version: `v${(idx % 2) + 1}`,
      defectTotal: total,
      defectFixed: status === 'passed' ? total : fixed,
      defectResidual: status === 'passed' ? 0 : Math.min(residual, total),
      segments: Array.from({ length: 8 }).map((_, s) => {
        const segProgress = Math.max(0, Math.min(100, progress * 8 - s * 100))
        return {
          index: s,
          status: segProgress >= 100 ? 'done' : segProgress > 0 ? 'running' : status === 'failed' && s === 5 ? 'failed' : 'waiting',
          progress: segProgress,
        }
      }),
      outputs:
        status === 'passed' || status === 'review'
          ? [
              { format: `${asset.container} · 原格式`, sizeGB: Math.round(asset.sizeGB * 1.02 * 10) / 10, bitrateMbps: asset.bitrateMbps },
              { format: 'MP4 · H.264 流媒体', sizeGB: Math.round((asset.durationSec * 12) / 8 / 1024 * 10) / 10, bitrateMbps: 12 },
            ]
          : [],
      nodeId: NODES[idx % NODES.length].id,
      startedAt: dayjs(task.startedAt).add(1, 'day').toISOString(),
      finishedAt: status === 'passed' || status === 'review' ? dayjs(task.startedAt).add(2, 'day').toISOString() : undefined,
      operatorId: ['m3', 'm4', 'm5', 'm9'][idx % 4],
      scoreBefore: task.score,
      scoreAfter: Math.min(97.2, Math.round((task.score + 12 + (idx % 5) * 2.4) * 10) / 10),
    }
    repairs.push(repair)

    if (['passed', 'review', 'rejected'].includes(status)) {
      const checklist = taskDefects.slice(0, 8).map((d, i) => ({
        defectId: d.id,
        verdict: (status === 'rejected' && i < 3 ? 'fail' : status === 'review' && i === 0 ? 'recheck' : 'pass') as 'pass' | 'fail' | 'recheck',
        note: status === 'rejected' && i === 0 ? '修复后仍有明显齿音失真，需要调整降噪强度' : undefined,
      }))
      reviews.push({
        id: `rv${idx + 1}`,
        repairTaskId: repair.id,
        checklist,
        metricsBefore: { vmaf: 74.2, psnr: 34.8, ssim: 0.921, lufs: -18.4, truePeak: -0.6 },
        metricsAfter: { vmaf: 93.6, psnr: 43.2, ssim: 0.987, lufs: -24.1, truePeak: -1.3 },
        verdict: status === 'passed' ? 'pass' : status === 'rejected' ? 'reject' : 'pending',
        comment: status === 'rejected' ? '第 3 段降噪过度，人声发闷，请调整参数后重新提交' : status === 'passed' ? '整体达标，同意交付' : undefined,
        signedBy: status === 'passed' ? '沈见山' : undefined,
        signedAt: status === 'passed' ? dayjs(task.startedAt).add(3, 'day').toISOString() : undefined,
      })
    }
  })

  const reportTypePlan: QcReport['type'][] = ['qc', 'qc', 'qc', 'repair', 'qc', 'acceptance', 'qc', 'repair', 'qc', 'service', 'repair', 'qc']
  reportTypePlan.forEach((type, i) => {
    const task = doneTasks[i % doneTasks.length]
    const asset = assets.find((a) => a.id === task.assetId)!
    const repair = repairs[i % repairs.length]
    const issuedAt = dayjs(task.startedAt).add(1 + (i % 3), 'day')
    reports.push({
      id: `rp${i + 1}`,
      no: `QC-${issuedAt.format('YYYY-MMDD')}-${String(41 + i).padStart(4, '0')}`,
      type,
      taskId: task.id,
      repairTaskId: type === 'repair' || type === 'acceptance' ? repair.id : undefined,
      title:
        type === 'qc'
          ? `${asset.name} 技术质量检测报告`
          : type === 'repair'
            ? `${asset.name} 修复验收报告`
            : type === 'acceptance'
              ? `${asset.name} 交付验收单`
              : `${asset.name} 技术服务交付报告`,
      assetName: asset.name,
      projectName: asset.projectName,
      status: i % 5 === 0 ? 'signed' : 'issued',
      score: type === 'repair' || type === 'acceptance' ? repair.scoreAfter : task.score,
      grade: i % 4 === 0 ? 'A' : task.grade,
      summary:
        task.score >= 75
          ? `整体技术质量${task.grade === 'A' ? '优良' : '合格'}，检出缺陷 ${task.counts.fatal + task.counts.severe + task.counts.moderate + task.counts.info} 条，${task.counts.fatal > 0 ? '存在致命级问题，须修复后方可交付。' : '建议按清单修复后交付。'}`
          : '检出多条致命与严重缺陷，判定为不合格，禁止直接交付，须完成修复并复检。',
      issuedBy: ['沈见山', '郑砚秋', '程牧'][i % 3],
      issuedAt: issuedAt.toISOString(),
      pages: 4 + (i % 4),
    })
  })

  const orders = buildOrders(assets)
  return { assets, rules, ruleSets, tasks, defects, repairs, plans, reviews, reports, orders }
}

const ORDER_STATUS_ORDER: ServiceOrder['status'][] = [
  'submitted', 'quoted', 'signed', 'receiving', 'scheduled', 'processing',
  'internal_qc', 'delivered', 'accepted', 'settled',
]

interface OrderSeed {
  customerId: string
  customerName: string
  contact: string
  packageId: string
  title: string
  status: ServiceOrder['status']
  createdAt: string
  minutes: number
  difficulty: number
  urgency: number
  extras: string[]
  engineerId: string
  assets: string[]
  messages: [('client' | 'engineer'), string][]
  rating?: { stars: number; tags: string[]; comment: string }
}

const ORDER_SEEDS: OrderSeed[] = [
  {
    customerId: 'c1', customerName: '云溪广播电视台', contact: '唐棠', packageId: 'pk1',
    title: '《澜沧江》第五集 上线前技术质检', status: 'submitted',
    createdAt: '2026-10-19T08:10:00+08:00', minutes: 52, difficulty: 1, urgency: 1, extras: [],
    engineerId: 'm7', assets: ['a5'],
    messages: [['client', '第五集明天上午要送播，麻烦优先安排质检。'], ['engineer', '收到，我们 2 小时内出检测结果。']],
  },
  {
    customerId: 'c2', customerName: '蓝鲸影业', contact: '白桦', packageId: 'pk4',
    title: '《深海》Reel02 胶片扫描深度修复', status: 'quoted',
    createdAt: '2026-10-18T15:20:00+08:00', minutes: 95, difficulty: 1.3, urgency: 1, extras: ['rawreturn'],
    engineerId: 'm4', assets: ['a19'],
    messages: [['client', '这卷划痕比第一卷更严重，希望保留颗粒感。'], ['engineer', '已评估，会单独做颗粒层分离，报价见明细。']],
  },
  {
    customerId: 'c1', customerName: '星辰传媒', contact: '唐棠', packageId: 'pk3',
    title: '《晚间新闻》0925 期 响度合规整改', status: 'processing',
    createdAt: '2026-10-18T09:00:00+08:00', minutes: 30, difficulty: 1, urgency: 1.5, extras: [],
    engineerId: 'm5', assets: ['a15'],
    messages: [['client', '播控反馈这期整体偏响，需要出合规证明。'], ['engineer', '正在做归一化，预计 3 小时内完成二次校验。']],
  },
  {
    customerId: 'c2', customerName: '蓝鲸影业', contact: '白桦', packageId: 'pk2',
    title: '《城市之光》EP01-EP02 综合修复', status: 'internal_qc',
    createdAt: '2026-10-17T10:00:00+08:00', minutes: 90, difficulty: 1, urgency: 1, extras: ['multiversion'],
    engineerId: 'm3', assets: ['a7', 'a8'],
    messages: [['client', '两集都要出 1080p 和 4K 两个版本。'], ['engineer', '已按双版本输出，正在内审。']],
  },
  {
    customerId: 'c1', customerName: '云溪广播电视台', contact: '唐棠', packageId: 'pk2',
    title: '25 周年宣传片 HDR 与画面修复', status: 'delivered',
    createdAt: '2026-10-16T12:00:00+08:00', minutes: 2, difficulty: 1, urgency: 2, extras: ['multiversion', 'subtitle'],
    engineerId: 'm4', assets: ['a22'],
    messages: [['client', '领导要求今晚就要看到成片。'], ['engineer', '已加急处理完成，交付物已上传，请查收。']],
  },
  {
    customerId: 'c2', customerName: '蓝鲸影业', contact: '白桦', packageId: 'pk5',
    title: '《城市之光》EP07-EP08 封装合规转码', status: 'accepted',
    createdAt: '2026-10-10T09:40:00+08:00', minutes: 88, difficulty: 1, urgency: 1, extras: [],
    engineerId: 'm9', assets: ['a10', 'a11'],
    messages: [['client', '平台要求全部转成 H.264 高码率。'], ['engineer', '已完成，附批量校验报告。']],
    rating: { stars: 5, tags: ['时效达标', '沟通顺畅', '交付规范'], comment: '两集一次通过，报告很清楚。' },
  },
  {
    customerId: 'c1', customerName: '知行教育', contact: '唐棠', packageId: 'pk3',
    title: '《信号与系统》第12讲 底噪与响度整改', status: 'settled',
    createdAt: '2026-09-28T14:10:00+08:00', minutes: 41, difficulty: 1, urgency: 1, extras: ['subtitle'],
    engineerId: 'm5', assets: ['a28'],
    messages: [['client', '课程上线后学生反馈听着累。'], ['engineer', '底噪 -36dBFS，已做降噪与响度归一化，附前后对比。']],
    rating: { stars: 5, tags: ['专业度高', '效果明显'], comment: '降噪后清晰很多，字幕也重新对过轴。' },
  },
  {
    customerId: 'c1', customerName: '云溪广播电视台', contact: '唐棠', packageId: 'pk5',
    title: '专题片历史素材批量转码（32 条）', status: 'signed',
    createdAt: '2026-10-19T09:05:00+08:00', minutes: 480, difficulty: 1.3, urgency: 1, extras: [],
    engineerId: 'm9', assets: ['a2', 'a4', 'a6'],
    messages: [['client', '素材在网盘里，清单已发邮件。'], ['engineer', '合同已确认，今天开始接收素材。']],
  },
  {
    customerId: 'c2', customerName: '蓝鲸影业', contact: '白桦', packageId: 'pk1',
    title: '《深海》Reel03 扫描质量评估', status: 'processing',
    createdAt: '2026-10-18T10:00:00+08:00', minutes: 95, difficulty: 1.3, urgency: 1, extras: [],
    engineerId: 'm6', assets: ['a20'],
    messages: [['client', '先评估第三卷的损伤程度，再决定修复方案。'], ['engineer', '正在跑全片检测，预计 40 分钟出报告。']],
  },
]

function buildOrders(assets: MediaAsset[]): ServiceOrder[] {
  return ORDER_SEEDS.map((seed, idx) => {
    const pkg = PACKAGES.find((p) => p.id === seed.packageId)!
    const quote = buildQuote({
      minutes: seed.minutes,
      unitPrice: pkg.unitPrice,
      difficulty: seed.difficulty,
      urgency: seed.urgency,
      extras: seed.extras,
    })
    const statusIdx = ORDER_STATUS_ORDER.indexOf(seed.status)
    const milestoneDefs = [
      { key: 'submit', label: '需求提交' },
      { key: 'quote', label: '评估报价' },
      { key: 'sign', label: '签约确认' },
      { key: 'receive', label: '素材接收' },
      { key: 'schedule', label: '排期' },
      { key: 'process', label: '处理中' },
      { key: 'qc', label: '内审质检' },
      { key: 'deliver', label: '交付' },
      { key: 'accept', label: '客户验收' },
      { key: 'settle', label: '结算完成' },
    ]
    const milestones = milestoneDefs.map((m, i) => ({
      key: m.key,
      label: m.label,
      done: i <= statusIdx,
      at: i <= statusIdx ? dayjs(seed.createdAt).add(i * 6, 'hour').toISOString() : undefined,
    }))
    const delivered = statusIdx >= 7
    return {
      id: `so${idx + 1}`,
      code: `SO-2026-${String(80 + idx).padStart(4, '0')}`,
      customerId: seed.customerId,
      customerName: seed.customerName,
      contact: seed.contact,
      packageId: pkg.id,
      packageName: pkg.name,
      title: seed.title,
      status: seed.status,
      amount: quote.total,
      slaHours: pkg.slaHours,
      slaDeadline: slaDeadline(seed.createdAt, pkg.slaHours || 240),
      engineerId: seed.engineerId,
      createdAt: seed.createdAt,
      milestones,
      assetIds: seed.assets,
      deliverables: delivered
        ? [
            { name: `${seed.title.split(' ')[0]}_修复版_v1.mov`, version: 'v1', sizeGB: 42.6, format: 'MOV · ProRes 422HQ', at: dayjs(seed.createdAt).add(40, 'hour').toISOString() },
            { name: `${seed.title.split(' ')[0]}_交付版_v1.mp4`, version: 'v1', sizeGB: 3.8, format: 'MP4 · H.264', at: dayjs(seed.createdAt).add(41, 'hour').toISOString() },
          ]
        : [],
      messages: seed.messages.map((m, i) => ({
        id: `${idx}-msg${i + 1}`,
        from: m[0],
        text: m[1],
        at: dayjs(seed.createdAt).add(i * 47, 'minute').toISOString(),
      })),
      quote: {
        lines: quote.lines,
        total: quote.total,
        validUntil: dayjs(seed.createdAt).add(7, 'day').toISOString(),
        status: statusIdx >= 2 ? 'accepted' : statusIdx === 1 ? 'pending' : 'pending',
      },
      invoice: {
        no: `INV-2026-${String(2100 + idx)}`,
        status: statusIdx >= 9 ? 'paid' : statusIdx >= 8 ? 'issued' : statusIdx >= 7 ? 'pending' : 'none',
        amount: quote.total,
      },
      rating: seed.rating,
    }
  })
}

export const MEMBER_MAP = Object.fromEntries(MEMBERS.map((m) => [m.id, m]))
export { NOW }
