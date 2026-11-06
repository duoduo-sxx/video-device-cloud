import type {
  Asset,
  CapabilityId,
  LogEntry,
  PipelineStep,
  QualityMetrics,
  Task,
  TaskStatus,
  Template,
  Ticket,
  TeamMember,
  ServiceNode,
  AppNotification,
  TimerangePoint
} from '@/types'
import { capabilities, capabilityMap } from './capabilities'
import { createRng } from './random'

const DAY = 86400000
const BASE = new Date('2026-10-19T10:20:00+08:00').getTime()

function iso(daysAgo: number, hour = 9, minute = 12): string {
  const d = new Date(BASE - daysAgo * DAY)
  d.setHours(hour, minute, Math.floor((hour * 7 + minute * 3) % 60), 0)
  return d.toISOString()
}

function stamp(dateIso: string, offsetSec: number): string {
  const d = new Date(new Date(dateIso).getTime() + offsetSec * 1000)
  const p = (n: number, l = 2) => String(n).padStart(l, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`
}

/* ------------------------------------------------------------------ */
/*                             素材数据                                */
/* ------------------------------------------------------------------ */

interface AssetSeed {
  name: string
  duration: number
  sizeGB: number
  w: number
  h: number
  fps: number
  bitrate: number
  codec: string
  profile: string
  container: string
  audio: { codec: string; channels: number; sampleRate: number } | null
  tags: string[]
  collection: string
  quality: number
  diag: [number, number, number, number, number]
  summary: string
  by: string
  daysAgo: number
  colors: [string, string]
  bitDepth?: number
  colorSpace?: string
  hdr?: string | null
  chroma?: string
}

const COLLECTIONS = [
  { id: 'col-monitor', name: '安防监控' },
  { id: 'col-film', name: '影视修复' },
  { id: 'col-broadcast', name: '广电资料' },
  { id: 'col-brand', name: '商业内容' },
  { id: 'col-archive', name: '档案数字化' }
]

const assetSeeds: AssetSeed[] = [
  {
    name: '监控_CAM03_20261012_1830.mp4',
    duration: 738,
    sizeGB: 2.4,
    w: 1920,
    h: 1080,
    fps: 25,
    bitrate: 8400,
    codec: 'H.264',
    profile: 'High@L4.1',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 1, sampleRate: 16000 },
    tags: ['监控', '夜间', '出入口'],
    collection: 'col-monitor',
    quality: 48,
    diag: [3.9, 4.3, 3.4, 1.2, 3.1],
    summary: '夜间增益过高导致色度噪声密集，建议先行时域去噪再超分至 2K。',
    by: '马啸',
    daysAgo: 7,
    colors: ['#1b2a4a', '#0d1526']
  },
  {
    name: '监控_CAM07_东门_夜间_20261014.mp4',
    duration: 522,
    sizeGB: 0.9,
    w: 1280,
    h: 720,
    fps: 25,
    bitrate: 2100,
    codec: 'H.265',
    profile: 'Main@L3.1',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 1, sampleRate: 16000 },
    tags: ['监控', '夜间', '低码率'],
    collection: 'col-monitor',
    quality: 41,
    diag: [4.4, 4.6, 4.1, 1.4, 3.6],
    summary: '码率仅 2.1Mbps，存在明显块效应，建议去伪影 + 去噪 + 2x 超分组合。',
    by: '马啸',
    daysAgo: 5,
    colors: ['#16233d', '#0a101d']
  },
  {
    name: '老电影_小城之春_1948_转录.mkv',
    duration: 5530,
    sizeGB: 5.8,
    w: 720,
    h: 576,
    fps: 25,
    bitrate: 6200,
    codec: 'MPEG-2',
    profile: 'Main@Main',
    container: 'MKV',
    audio: { codec: 'AC3', channels: 2, sampleRate: 48000 },
    tags: ['老电影', '胶片', '4:3', '修复'],
    collection: 'col-film',
    quality: 36,
    diag: [4.1, 3.6, 3.2, 3.8, 2.4],
    summary: '片基划痕与霉斑较多，伴随逐帧亮度闪烁，建议走完整老片修复流水线。',
    by: '陈默',
    daysAgo: 26,
    colors: ['#2e2a22', '#171410']
  },
  {
    name: '春晚_2003_录像带数字化_带1.mov',
    duration: 8070,
    sizeGB: 18.2,
    w: 720,
    h: 480,
    fps: 29.97,
    bitrate: 25000,
    codec: 'DV',
    profile: 'DVCPRO25',
    container: 'MOV',
    audio: { codec: 'PCM', channels: 2, sampleRate: 48000 },
    tags: ['录像带', '广电', '标清', '归档'],
    collection: 'col-broadcast',
    quality: 39,
    diag: [4.6, 3.1, 2.8, 2.2, 3.4],
    summary: 'DV 编码固有色度带宽不足，红色区域有明显渗色，建议色彩增强后再超分。',
    by: '周文彬',
    daysAgo: 22,
    colors: ['#3a2230', '#1c1018']
  },
  {
    name: '城市夜景延时_4K_原片.mp4',
    duration: 48,
    sizeGB: 0.4,
    w: 3840,
    h: 2160,
    fps: 30,
    bitrate: 62000,
    codec: 'H.265',
    profile: 'Main10@L5.1',
    container: 'MP4',
    audio: null,
    tags: ['4K', '延时', '夜景', 'HDR'],
    collection: 'col-brand',
    quality: 92,
    diag: [0.4, 0.5, 0.3, 0.2, 0.6],
    summary: '画质优秀，仅需轻微色彩增强即可交付，无需超分。',
    by: '何雨桐',
    daysAgo: 2,
    colors: ['#122b47', '#3b1d4a'],
    bitDepth: 10,
    colorSpace: 'BT.2020',
    hdr: 'HDR10'
  },
  {
    name: '无人机航拍_海岸线_DLOG.mov',
    duration: 206,
    sizeGB: 22.6,
    w: 4096,
    h: 2160,
    fps: 24,
    bitrate: 880000,
    codec: 'ProRes 422',
    profile: '422 HQ',
    container: 'MOV',
    audio: { codec: 'PCM', channels: 2, sampleRate: 48000 },
    tags: ['航拍', 'Log', 'ProRes', '4K'],
    collection: 'col-brand',
    quality: 88,
    diag: [0.8, 0.6, 0.2, 2.6, 1.1],
    summary: 'D-Log 灰片，需套用还原 LUT；航拍有轻微风抖，可做轻稳像。',
    by: '何雨桐',
    daysAgo: 12,
    colors: ['#1d3a44', '#0e1f27'],
    bitDepth: 10,
    colorSpace: 'BT.2020'
  },
  {
    name: '访谈_张工_室内逆光_收音版.mp4',
    duration: 2762,
    sizeGB: 4.8,
    w: 1920,
    h: 1080,
    fps: 25,
    bitrate: 14000,
    codec: 'H.264',
    profile: 'High@L4.2',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 2, sampleRate: 48000 },
    tags: ['访谈', '室内', '逆光'],
    collection: 'col-brand',
    quality: 71,
    diag: [1.8, 1.6, 1.1, 0.4, 3.8],
    summary: '窗侧逆光导致面部欠曝，暗部噪点明显；建议局部提亮 + 轻度去噪。',
    by: '苏芮',
    daysAgo: 9,
    colors: ['#2b2f3a', '#151820']
  },
  {
    name: '动漫_星际旅人_EP07_720p.mp4',
    duration: 1420,
    sizeGB: 0.32,
    w: 1280,
    h: 720,
    fps: 23.976,
    bitrate: 1800,
    codec: 'H.264',
    profile: 'High@L3.1',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 2, sampleRate: 44100 },
    tags: ['动漫', '720p', '线条'],
    collection: 'col-brand',
    quality: 63,
    diag: [3.2, 1.4, 2.6, 0.3, 1.8],
    summary: '线条边缘有振铃，适合 Anime-SR 专用模型，注意避免细节强度过高。',
    by: '何雨桐',
    daysAgo: 15,
    colors: ['#2a2350', '#141031']
  },
  {
    name: '发布会_多机位_主机位_低照度.mp4',
    duration: 3492,
    sizeGB: 2.8,
    w: 1920,
    h: 1080,
    fps: 50,
    bitrate: 6500,
    codec: 'H.264',
    profile: 'High@L4.2',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 2, sampleRate: 48000 },
    tags: ['发布会', '低照度', '50fps'],
    collection: 'col-brand',
    quality: 54,
    diag: [3.4, 3.7, 2.9, 0.5, 2.2],
    summary: '舞台暗部噪点明显，50fps 下码率不足，建议去噪 + 轻度去伪影。',
    by: '周文彬',
    daysAgo: 11,
    colors: ['#1a1d33', '#0c0e1c']
  },
  {
    name: '产品广告_30s_竖屏_抖音版.mp4',
    duration: 30,
    sizeGB: 0.02,
    w: 1080,
    h: 1920,
    fps: 30,
    bitrate: 4200,
    codec: 'H.264',
    profile: 'High@L4.0',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 2, sampleRate: 48000 },
    tags: ['竖屏', '广告', '短视频'],
    collection: 'col-brand',
    quality: 86,
    diag: [0.9, 0.7, 1.2, 0.1, 0.5],
    summary: '画质良好，压缩痕迹轻微，可直接交付或做轻度锐化。',
    by: '何雨桐',
    daysAgo: 3,
    colors: ['#3d1f2c', '#1e0f16']
  },
  {
    name: '课堂录播_阶梯教室_投影幕.mp4',
    duration: 4325,
    sizeGB: 0.8,
    w: 1280,
    h: 720,
    fps: 30,
    bitrate: 1500,
    codec: 'H.264',
    profile: 'Main@L3.1',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 2, sampleRate: 44100 },
    tags: ['录播', '教育', '文字'],
    collection: 'col-broadcast',
    quality: 57,
    diag: [3.6, 2.1, 3.5, 0.8, 2.9],
    summary: '投影幕上的 PPT 文字边缘发虚，适合文字增强 + 2x 超分。',
    by: '顾清',
    daysAgo: 18,
    colors: ['#1f2a2e', '#0f1518']
  },
  {
    name: '体育赛事_田径_100m决赛_回放.ts',
    duration: 278,
    sizeGB: 0.6,
    w: 1920,
    h: 1080,
    fps: 50,
    bitrate: 18000,
    codec: 'H.264',
    profile: 'High@L4.2',
    container: 'TS',
    audio: { codec: 'AAC', channels: 2, sampleRate: 48000 },
    tags: ['体育', '50i', '回放'],
    collection: 'col-broadcast',
    quality: 74,
    diag: [2.4, 1.2, 1.8, 2.1, 1.3],
    summary: '隔行素材，需先做反交错；快速运动适合 FILM 光流模型插帧。',
    by: '周文彬',
    daysAgo: 4,
    colors: ['#1c3020', '#0d1710']
  },
  {
    name: '纪录片_候鸟迁徙_航拍素材_A001.mov',
    duration: 634,
    sizeGB: 11.2,
    w: 3840,
    h: 2160,
    fps: 25,
    bitrate: 440000,
    codec: 'ProRes 422',
    profile: '422 HQ',
    container: 'MOV',
    audio: { codec: 'PCM', channels: 2, sampleRate: 48000 },
    tags: ['纪录片', '航拍', '母版'],
    collection: 'col-film',
    quality: 90,
    diag: [0.6, 0.4, 0.2, 1.9, 0.8],
    summary: '母版级画质，仅建议做稳像与色彩统一。',
    by: '陈默',
    daysAgo: 20,
    colors: ['#22323a', '#101a1e'],
    bitDepth: 10
  },
  {
    name: '婚礼跟拍_仪式_双机位_主机.mov',
    duration: 2870,
    sizeGB: 8.6,
    w: 1920,
    h: 1080,
    fps: 25,
    bitrate: 24000,
    codec: 'H.264',
    profile: 'High@L4.1',
    container: 'MOV',
    audio: { codec: 'PCM', channels: 2, sampleRate: 48000 },
    tags: ['婚礼', '双机位', '室内'],
    collection: 'col-brand',
    quality: 79,
    diag: [1.6, 1.9, 1.2, 1.1, 2.6],
    summary: '整体尚可，仪式环节烛光偏暖，建议关闭自动白平衡后手动校正。',
    by: '苏芮',
    daysAgo: 13,
    colors: ['#3a2a22', '#1c1410']
  },
  {
    name: '微电影_雨夜_成片_1080p.mp4',
    duration: 1128,
    sizeGB: 1.7,
    w: 1920,
    h: 1080,
    fps: 24,
    bitrate: 12000,
    codec: 'H.264',
    profile: 'High@L4.1',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 2, sampleRate: 48000 },
    tags: ['微电影', '雨夜', '低照度'],
    collection: 'col-film',
    quality: 84,
    diag: [1.1, 2.2, 1.0, 0.6, 1.9],
    summary: '艺术化暗部较多，去噪强度不宜过高，避免损失氛围。',
    by: '陈默',
    daysAgo: 6,
    colors: ['#1a2433', '#0b1119']
  },
  {
    name: '手机拍摄_宠物_慢动作_240fps.mp4',
    duration: 42,
    sizeGB: 0.15,
    w: 1920,
    h: 1080,
    fps: 240,
    bitrate: 28000,
    codec: 'H.264',
    profile: 'High@L4.2',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 2, sampleRate: 48000 },
    tags: ['手机', '慢动作', '高帧率'],
    collection: 'col-brand',
    quality: 61,
    diag: [2.8, 2.4, 2.1, 1.3, 1.5],
    summary: '高帧率低码率，单帧信息量不足；插帧无意义，建议只做超分与去噪。',
    by: '何雨桐',
    daysAgo: 8,
    colors: ['#2f2a1c', '#17140d']
  },
  {
    name: 'VHS转录_家庭录像_1998_婚礼.mp4',
    duration: 4260,
    sizeGB: 2.2,
    w: 720,
    h: 480,
    fps: 29.97,
    bitrate: 4500,
    codec: 'MPEG-2',
    profile: 'Main@Main',
    container: 'MP4',
    audio: { codec: 'AC3', channels: 2, sampleRate: 48000 },
    tags: ['VHS', '家庭影像', '磁带'],
    collection: 'col-archive',
    quality: 33,
    diag: [4.8, 4.2, 3.9, 4.3, 3.2],
    summary: '磁带信号劣化严重，存在行抖动与色度串扰，建议完整修复流水线。',
    by: '顾清',
    daysAgo: 24,
    colors: ['#332b20', '#19150f']
  },
  {
    name: '医用内窥镜_手术记录_20261008.mp4',
    duration: 5400,
    sizeGB: 5.5,
    w: 1920,
    h: 1080,
    fps: 30,
    bitrate: 9000,
    codec: 'H.264',
    profile: 'High@L4.1',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 1, sampleRate: 32000 },
    tags: ['医疗', '内窥镜', '教学'],
    collection: 'col-archive',
    quality: 68,
    diag: [2.2, 2.8, 2.4, 1.6, 3.4],
    summary: '术野高光溢出，暗部细节缺失；建议保守去噪，避免影响组织边界判断。',
    by: '苏芮',
    daysAgo: 10,
    colors: ['#2b1f26', '#150f13']
  },
  {
    name: '老动画_大闹天宫_修复源_16mm.mkv',
    duration: 6840,
    sizeGB: 6.4,
    w: 720,
    h: 576,
    fps: 24,
    bitrate: 7800,
    codec: 'MPEG-2',
    profile: 'Main@Main',
    container: 'MKV',
    audio: { codec: 'AC3', channels: 1, sampleRate: 48000 },
    tags: ['动画', '胶片', '修复', '档案'],
    collection: 'col-archive',
    quality: 35,
    diag: [4.3, 3.2, 3.6, 3.5, 2.8],
    summary: '16mm 转录，颗粒粗、划痕多，适合保留颗粒的老片修复方案。',
    by: '陈默',
    daysAgo: 28,
    colors: ['#3a2c1a', '#1d160d']
  },
  {
    name: '车载记录仪_20261015_0742.mp4',
    duration: 180,
    sizeGB: 0.13,
    w: 1920,
    h: 1080,
    fps: 30,
    bitrate: 6000,
    codec: 'H.264',
    profile: 'High@L4.0',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 1, sampleRate: 32000 },
    tags: ['行车记录', '取证', '车牌'],
    collection: 'col-monitor',
    quality: 52,
    diag: [3.5, 2.6, 3.3, 2.4, 2.1],
    summary: '广角畸变 + 抖动，车牌区域可用，建议稳像 + 车牌增强。',
    by: '马啸',
    daysAgo: 4,
    colors: ['#1e2a35', '#0d1519']
  },
  {
    name: '直播间录屏_带货_20261011.mp4',
    duration: 7200,
    sizeGB: 2.1,
    w: 1280,
    h: 720,
    fps: 30,
    bitrate: 2500,
    codec: 'H.264',
    profile: 'Main@L3.1',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 2, sampleRate: 44100 },
    tags: ['直播', '录屏', '带货'],
    collection: 'col-brand',
    quality: 44,
    diag: [3.8, 3.2, 3.9, 0.2, 2.7],
    summary: '屏幕内容与摄像头画中画混排，文字区域压缩明显，建议去伪影 + 文字增强。',
    by: '何雨桐',
    daysAgo: 8,
    colors: ['#33203a', '#18101c']
  },
  {
    name: '宣传片_企业形象_4K_交付版.mp4',
    duration: 186,
    sizeGB: 1.0,
    w: 3840,
    h: 2160,
    fps: 25,
    bitrate: 45000,
    codec: 'H.265',
    profile: 'Main10@L5.1',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 2, sampleRate: 48000 },
    tags: ['4K', '宣传片', '交付'],
    collection: 'col-brand',
    quality: 93,
    diag: [0.3, 0.2, 0.2, 0.1, 0.4],
    summary: '已达交付标准，无需处理。',
    by: '陈默',
    daysAgo: 1,
    colors: ['#1c2c44', '#0d1522']
  },
  {
    name: '档案_新闻片_1987_城市记忆_16mm.mkv',
    duration: 3720,
    sizeGB: 3.2,
    w: 720,
    h: 576,
    fps: 25,
    bitrate: 6800,
    codec: 'MPEG-2',
    profile: 'Main@Main',
    container: 'MKV',
    audio: { codec: 'AC3', channels: 1, sampleRate: 48000 },
    tags: ['档案', '新闻片', '历史'],
    collection: 'col-archive',
    quality: 38,
    diag: [4.2, 3.4, 3.1, 3.0, 3.7],
    summary: '胶片老化导致整体对比下降，建议先去闪烁再做色彩与超分。',
    by: '顾清',
    daysAgo: 16,
    colors: ['#302a24', '#181410']
  },
  {
    name: '竖屏短剧_EP12_1080x1920_低码.mp4',
    duration: 156,
    sizeGB: 0.03,
    w: 1080,
    h: 1920,
    fps: 30,
    bitrate: 1200,
    codec: 'H.264',
    profile: 'Main@L3.1',
    container: 'MP4',
    audio: { codec: 'AAC', channels: 2, sampleRate: 44100 },
    tags: ['短剧', '竖屏', '低码率'],
    collection: 'col-brand',
    quality: 46,
    diag: [3.7, 2.9, 4.2, 0.4, 2.3],
    summary: '码率 1.2Mbps，大面积块效应；建议去伪影后再超分，注意竖屏宽高比。',
    by: '周文彬',
    daysAgo: 2,
    colors: ['#2a1e33', '#140f1a']
  }
]

function md5Like(id: number, rnd: () => number): string {
  const chars = '0123456789abcdef'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(rnd() * 16)]
  return s
}

function buildAssets(): Asset[] {
  const rnd = createRng(7719)
  return assetSeeds.map((s, i) => {
    const [a, b, c, d, e] = s.diag
    return {
      id: `AST-${String(i + 1).padStart(4, '0')}`,
      name: s.name,
      duration: s.duration,
      size: Math.round(s.sizeGB * 1024 * 1024 * 1024),
      width: s.w,
      height: s.h,
      fps: s.fps,
      bitrate: s.bitrate,
      codec: s.codec,
      profile: s.profile,
      bitDepth: s.bitDepth ?? 8,
      chroma: s.chroma ?? (s.w >= 3840 ? '4:2:2' : '4:2:0'),
      colorSpace: s.colorSpace ?? 'BT.709',
      hdr: s.hdr ?? null,
      container: s.container,
      audio: s.audio,
      tags: s.tags,
      collectionId: s.collection,
      status: 'ready',
      qualityScore: s.quality,
      diagnosis: {
        sharpness: a,
        noise: b,
        artifact: c,
        shake: d,
        exposure: e,
        summary: s.summary
      },
      uploadedBy: s.by,
      uploadedAt: iso(s.daysAgo, 9 + (i % 9), (i * 7) % 60),
      md5: md5Like(i, rnd.next),
      thumbnailColor: s.colors
    }
  })
}

/* ------------------------------------------------------------------ */
/*                              模板                                   */
/* ------------------------------------------------------------------ */

export function step(capId: CapabilityId, overrides: Record<string, number | string | boolean> = {}): PipelineStep {
  const cap = capabilityMap[capId]
  const params: Record<string, number | string | boolean> = {}
  cap.params.forEach((p) => {
    params[p.key] = p.default
  })
  return { capabilityId: capId, enabled: true, params: { ...params, ...overrides } }
}

export const templates: Template[] = [
  {
    id: 'tpl-001',
    name: '老片修复（胶片 · 标清）',
    description: '针对 16mm / 35mm 转录素材，按"去闪烁 → 去划痕 → 去噪 → 超分 → 插帧 → 色彩"的标准顺序处理，保留胶片颗粒。',
    tags: ['胶片', '划痕', '闪烁', '4:3'],
    pipeline: [
      step('filmRestore', { scratch: 65, flicker: 70, mold: 55, grainPreserve: true }),
      step('artifactRemoval', { blockiness: 35, ringing: 30, mosquito: 40 }),
      step('denoise', { strength: 45, texturePreserve: 80, window: '5' }),
      step('superResolution', { scale: '2', model: 'swinir-l', detail: 55 }),
      step('frameInterpolation', { targetFps: '50', model: 'rife-4.6' }),
      step('colorEnhance', { contrast: 14, saturation: 18, autoWB: true })
    ],
    avgGain: 34.6,
    usageCount: 218,
    author: '官方',
    cover: ['#3a2c1a', '#1d160d']
  },
  {
    id: 'tpl-002',
    name: '监控取证增强',
    description: '面向夜间 / 低照度监控，优先压制噪点与块效应，再用保真优先的人脸模型提升可辨识度。不追求观感美化。',
    tags: ['监控', '夜间', '取证', '保真'],
    pipeline: [
      step('denoise', { strength: 68, texturePreserve: 55, window: '7' }),
      step('artifactRemoval', { blockiness: 55, ringing: 45, mosquito: 60 }),
      step('superResolution', { scale: '2', model: 'vid-sr-3.2', detail: 50, preDenoise: false }),
      step('faceRestore', { model: 'codeformer', fidelity: 0.8, onlyFace: true })
    ],
    avgGain: 29.4,
    usageCount: 341,
    author: '官方',
    cover: ['#16233d', '#0a101d']
  },
  {
    id: 'tpl-003',
    name: '动漫超分（线条保护）',
    description: '使用 Anime-SR 专用模型，重点恢复线条锐度并抑制振铃，避免生成式模型在平涂区域臆造纹理。',
    tags: ['动漫', '线条', '平涂'],
    pipeline: [
      step('artifactRemoval', { blockiness: 40, ringing: 65, mosquito: 30 }),
      step('superResolution', { scale: '2', model: 'anime-sr-2', detail: 40, preDenoise: true }),
      step('denoise', { strength: 25, texturePreserve: 90 })
    ],
    avgGain: 22.8,
    usageCount: 176,
    author: '官方',
    cover: ['#2a2350', '#141031']
  },
  {
    id: 'tpl-004',
    name: '手机视频快速提清',
    description: '面向短视频 / 竖屏素材的轻量方案，2 步完成，单分钟素材约 40 秒处理，适合批量过一遍。',
    tags: ['短视频', '竖屏', '快速'],
    pipeline: [
      step('denoise', { strength: 42, texturePreserve: 72 }),
      step('superResolution', { scale: '2', model: 'esrgan-4p', detail: 60 })
    ],
    avgGain: 18.2,
    usageCount: 512,
    author: '官方',
    cover: ['#33203a', '#18101c']
  },
  {
    id: 'tpl-005',
    name: '4K 重制（母版级）',
    description: '高码率母版素材的 4K 重制流程，强调细节保守与色彩一致性，输出 ProRes 便于后期。',
    tags: ['4K', '母版', 'ProRes'],
    pipeline: [
      step('stabilization', { smoothness: 55, cropLimit: 8 }),
      step('superResolution', { scale: '2', model: 'swinir-l', detail: 62 }),
      step('colorEnhance', { contrast: 8, saturation: 5, toneMapping: 'hdr-sdr' })
    ],
    avgGain: 20.5,
    usageCount: 97,
    author: '官方',
    cover: ['#1c2c44', '#0d1522']
  },
  {
    id: 'tpl-006',
    name: '直播回放增强',
    description: '低码率录屏与直播回放专用，重点修复块效应并稳定文字边缘，不做插帧以免打乱原始节奏。',
    tags: ['直播', '录屏', '文字'],
    pipeline: [
      step('artifactRemoval', { blockiness: 70, ringing: 55, mosquito: 65, mode: 'aggressive' }),
      step('denoise', { strength: 35, texturePreserve: 60 }),
      step('superResolution', { scale: '2', model: 'vid-sr-3.2', detail: 58 })
    ],
    avgGain: 24.1,
    usageCount: 288,
    author: '官方',
    cover: ['#22302a', '#111a16']
  },
  {
    id: 'tpl-007',
    name: '我的 · 夜间路口车牌方案',
    description: '在监控方案基础上强化车牌区域，二值化输出便于 OCR 比对，夜间场景参数经 12 个样本调优。',
    tags: ['车牌', '夜间', 'OCR'],
    pipeline: [
      step('denoise', { strength: 72, texturePreserve: 48, window: '7' }),
      step('plateEnhance', { scene: 'night', strength: 82, binarize: true }),
      step('superResolution', { scale: '4', model: 'vid-sr-3.2', detail: 45 })
    ],
    avgGain: 31.2,
    usageCount: 24,
    author: '我的',
    cover: ['#122b47', '#0a1420']
  },
  {
    id: 'tpl-008',
    name: '我的 · 访谈柔化去噪',
    description: '访谈类素材专用：低强度去噪保皮肤质感，配合轻度色彩校正，避免"塑料脸"。',
    tags: ['访谈', '人像', '低强度'],
    pipeline: [
      step('denoise', { strength: 32, texturePreserve: 88, window: '3' }),
      step('colorEnhance', { contrast: 6, saturation: 4, autoWB: false }),
      step('faceRestore', { model: 'codeformer', fidelity: 0.85 })
    ],
    avgGain: 15.6,
    usageCount: 11,
    author: '我的',
    cover: ['#2b2f3a', '#151820']
  },
  {
    id: 'tpl-009',
    name: '我的 · 体育插帧 120fps',
    description: '100 米决赛回放专用，FILM 光流 + 120fps 输出，用于慢动作逐帧分析。',
    tags: ['体育', '插帧', '120fps'],
    pipeline: [
      step('frameInterpolation', { targetFps: '120', model: 'film', occlusion: true }),
      step('denoise', { strength: 30, texturePreserve: 75 })
    ],
    avgGain: 9.4,
    usageCount: 7,
    author: '我的',
    cover: ['#1c3020', '#0d1710']
  }
]

/* ------------------------------------------------------------------ */
/*                              指标                                   */
/* ------------------------------------------------------------------ */

const gainMap: Record<CapabilityId, { vmaf: number; score: number; psnr: number; ssim: number; niqe: number }> = {
  superResolution: { vmaf: 9.2, score: 10.5, psnr: 4.2, ssim: 0.09, niqe: -2.1 },
  denoise: { vmaf: 3.2, score: 4.6, psnr: 2.1, ssim: 0.03, niqe: -1.4 },
  artifactRemoval: { vmaf: 3.8, score: 5.2, psnr: 2.4, ssim: 0.04, niqe: -1.2 },
  deblur: { vmaf: 3.0, score: 4.8, psnr: 1.8, ssim: 0.05, niqe: -1.1 },
  frameInterpolation: { vmaf: 1.2, score: 2.0, psnr: 0.4, ssim: 0.01, niqe: -0.2 },
  stabilization: { vmaf: 1.8, score: 2.6, psnr: 0.6, ssim: 0.02, niqe: -0.3 },
  colorEnhance: { vmaf: 2.2, score: 4.0, psnr: 0.8, ssim: 0.02, niqe: -0.6 },
  faceRestore: { vmaf: 2.0, score: 3.2, psnr: 1.0, ssim: 0.04, niqe: -0.7 },
  plateEnhance: { vmaf: 1.0, score: 1.8, psnr: 0.7, ssim: 0.03, niqe: -0.4 },
  filmRestore: { vmaf: 7.0, score: 8.5, psnr: 3.2, ssim: 0.07, niqe: -1.8 }
}

function deriveBefore(score: number): QualityMetrics {
  return {
    psnr: Math.round((21.4 + score * 0.135) * 10) / 10,
    ssim: Math.round((0.612 + score * 0.0036) * 1000) / 1000,
    vmaf: Math.round((score * 0.62 + 18) * 10) / 10,
    niqe: Math.round((9.4 - score * 0.062) * 10) / 10,
    score
  }
}

function deriveAfter(before: QualityMetrics, pipeline: PipelineStep[], factor: number): QualityMetrics {
  let vmaf = 0
  let score = 0
  let psnr = 0
  let ssim = 0
  let niqe = 0
  pipeline.forEach((p) => {
    const g = gainMap[p.capabilityId]
    const saturation = Math.max(0.15, (100 - before.score) / 62)
    vmaf += g.vmaf * saturation * factor
    score += g.score * saturation * factor
    psnr += g.psnr * saturation * factor
    ssim += g.ssim * saturation * factor
    niqe += g.niqe * saturation * factor
  })
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
  return {
    psnr: Math.round(clamp(before.psnr + psnr, 20, 48) * 10) / 10,
    ssim: Math.round(clamp(before.ssim + ssim, 0.5, 0.992) * 1000) / 1000,
    vmaf: Math.round(clamp(before.vmaf + vmaf, 30, 97) * 10) / 10,
    niqe: Math.round(clamp(before.niqe + niqe, 1.8, 9) * 10) / 10,
    score: Math.round(clamp(before.score + score, 30, 98))
  }
}

/* ------------------------------------------------------------------ */
/*                              任务                                   */
/* ------------------------------------------------------------------ */

const STAGES = [
  { name: '素材解析', end: 8 },
  { name: '质量分析', end: 16 },
  { name: '时域去噪', end: 38 },
  { name: '超分辨率重建', end: 66 },
  { name: '插帧', end: 78 },
  { name: '色彩映射', end: 86 },
  { name: '编码封装', end: 96 },
  { name: '校验入库', end: 100 }
]

export function stageOf(progress: number): { name: string; index: number } {
  for (let i = 0; i < STAGES.length; i++) {
    if (progress < STAGES[i].end) return { name: STAGES[i].name, index: i }
  }
  return { name: STAGES[STAGES.length - 1].name, index: STAGES.length - 1 }
}

const LOG_POOL: Record<string, string[]> = {
  素材解析: ['[解码] 已加载源文件，开始建立帧索引', '[解码] 检测到音轨 2ch / 48kHz，将执行音频直通', '[解码] 色彩空间 BT.709，位深 8bit，范围 Limited'],
  质量分析: ['[分析] 已完成 120 帧采样，正在计算块效应能量', '[分析] 检测到压缩伪影强度 0.72，建议启用 artifactRemoval', '[分析] 全局运动估计完成，抖动指数 2.4'],
  时域去噪: ['[去噪] TDN v2.0 加载完成，时域窗口 5 帧', '[去噪] 光流场计算中，已完成 42%', '[去噪] 静止区域融合完成，平均 PSNR 提升 1.8dB'],
  超分辨率重建: ['[超分] VID-SR v3.2 加载完成，FP16，显存占用 18.2GB', '[超分] 分块推理尺寸 512×512，重叠 32px', '[超分] 已重建 3840 帧，平均单帧 46ms'],
  插帧: ['[插帧] RIFE 4.6 初始化，目标帧率 60fps', '[插帧] 双向光流估计完成，遮挡区域占比 3.2%', '[插帧] 场景切换检测到 2 处，已跳过合成'],
  色彩映射: ['[色彩] 应用 BT.2390 色调映射曲线', '[色彩] 白平衡校正 ΔUV = 0.006', '[色彩] 局部对比度增强，CLAHE 网格 8×8'],
  编码封装: ['[编码] H.265 Main10，CRF 18，preset slow', '[编码] 目标码率 45Mbps 超出 H.264 L5.1 建议上限，自动调整 CRF=19', '[编码] 音轨封装完成，容器 MP4 faststart'],
  校验入库: ['[校验] 逐帧哈希比对通过', '[校验] 生成质量报告，VMAF 计算中', '[校验] 成片已入库，输出路径 /outputs/TSK']
}

function makeLogs(createdAt: string, status: TaskStatus, progress: number, pipeline: PipelineStep[]): LogEntry[] {
  const list: LogEntry[] = []
  const capped = status === 'queued' ? 1 : Math.min(10, Math.max(3, Math.round(progress / 9)))
  for (let i = 0; i < capped; i++) {
    const stage = STAGES[Math.min(i, STAGES.length - 1)].name
    const pool = LOG_POOL[stage] ?? ['[系统] 处理中']
    list.push({
      time: stamp(createdAt, i * 7 + (i % 3)),
      level: 'INFO',
      message: pool[i % pool.length]
    })
  }
  if (pipeline.some((p) => p.capabilityId === 'superResolution') && capped > 4) {
    list.splice(4, 0, {
      time: stamp(createdAt, 31),
      level: 'WARN',
      message: '[超分] 8x 模式需要分块处理，预计增加 12 分钟耗时'
    })
  }
  if (status === 'failed') {
    list.push({
      time: stamp(createdAt, capped * 7 + 3),
      level: 'ERROR',
      message: '[CUDA_OOM] 显存分配失败：尝试分配 6.2GB，当前可用 3.8GB'
    })
  }
  if (status === 'completed') {
    list.push({
      time: stamp(createdAt, capped * 7 + 12),
      level: 'INFO',
      message: '[完成] 成片校验通过，质量报告已生成'
    })
  }
  return list
}

interface TaskPlan {
  status: TaskStatus
  assetIndex: number
  daysAgo: number
  templateId?: string
  error?: { code: string; message: string }
}

const taskPlans: TaskPlan[] = [
  { status: 'running', assetIndex: 22, daysAgo: 0 },
  { status: 'running', assetIndex: 1, daysAgo: 0 },
  { status: 'running', assetIndex: 12, daysAgo: 0 },
  { status: 'queued', assetIndex: 2, daysAgo: 0, templateId: 'tpl-001' },
  { status: 'queued', assetIndex: 18, daysAgo: 0, templateId: 'tpl-001' },
  { status: 'queued', assetIndex: 23, daysAgo: 0, templateId: 'tpl-004' },
  { status: 'queued', assetIndex: 10, daysAgo: 1, templateId: 'tpl-006' },
  { status: 'failed', assetIndex: 5, daysAgo: 1, templateId: 'tpl-005', error: { code: 'CUDA_OOM', message: '显存分配失败：输出 8K 需要 46GB，当前节点可用 22.4GB' } },
  { status: 'failed', assetIndex: 11, daysAgo: 2, templateId: 'tpl-009', error: { code: 'SRC_CORRUPT', message: '源文件第 4218 帧校验失败，TS 包丢失' } },
  { status: 'failed', assetIndex: 16, daysAgo: 3, templateId: 'tpl-004', error: { code: 'CODEC_UNSUPPORTED', message: '编码器不支持 MPEG-2 4:2:2 10bit 输入' } },
  { status: 'failed', assetIndex: 13, daysAgo: 5, templateId: 'tpl-005', error: { code: 'SR_TIMEOUT', message: '单任务超过 6 小时上限，已中断' } },
  { status: 'canceled', assetIndex: 4, daysAgo: 2 },
  { status: 'canceled', assetIndex: 9, daysAgo: 6 },
  { status: 'canceled', assetIndex: 15, daysAgo: 9 }
]

function buildTasks(assets: Asset[]): Task[] {
  const rnd = createRng(31907)
  const plans: TaskPlan[] = [...taskPlans]
  const statuses: TaskStatus[] = []
  for (let i = 0; i < 22; i++) statuses.push('completed')
  statuses.forEach((s, i) => {
    plans.push({ status: s, assetIndex: (i * 5 + 3) % assets.length, daysAgo: 1 + i })
  })

  return plans.map((plan, i) => {
    const asset = assets[plan.assetIndex % assets.length]
    const tpl = plan.templateId ? templates.find((t) => t.id === plan.templateId) : undefined
    let pipeline: PipelineStep[]
    if (tpl) {
      pipeline = tpl.pipeline.map((p) => ({ ...p, params: { ...p.params } }))
    } else {
      const picked = rnd.picks(
        ['denoise', 'artifactRemoval', 'superResolution', 'colorEnhance', 'faceRestore', 'frameInterpolation', 'deblur'] as CapabilityId[],
        rnd.int(2, 4)
      )
      const order: CapabilityId[] = ['denoise', 'artifactRemoval', 'deblur', 'superResolution', 'frameInterpolation', 'colorEnhance', 'faceRestore']
      picked.sort((a, b) => order.indexOf(a) - order.indexOf(b))
      pipeline = picked.map((id) => step(id))
    }

    const createdAt = iso(plan.daysAgo, 8 + (i % 11), (i * 13) % 60)
    const durationSec = asset.duration
    const estimatedSec = Math.round(durationSec * (1.6 + pipeline.length * 1.55))

    let progress = 0
    if (plan.status === 'completed') progress = 100
    else if (plan.status === 'running') {
      progress = [23.4, 47.8, 71.2][i] ?? rnd.float(15, 85, 1)
    } else if (plan.status === 'paused') progress = 34.6
    else if (plan.status === 'failed') progress = rnd.float(24, 78, 1)
    else if (plan.status === 'canceled') progress = rnd.float(8, 52, 1)

    progress = Math.round(progress * 10) / 10
    const stage = stageOf(progress)
    const before = deriveBefore(asset.qualityScore)
    const factor = 0.82 + rnd.next() * 0.36
    const after = plan.status === 'completed' ? deriveAfter(before, pipeline, factor) : null

    const gpuTrace: number[] = []
    const points = plan.status === 'queued' ? 0 : 24
    for (let g = 0; g < points; g++) {
      const base = plan.status === 'completed' ? 62 : 48
      gpuTrace.push(Math.round(base + Math.sin(g / 2.4) * 12 + rnd.float(-5, 9, 1)))
    }

    const task: Task = {
      id: `TSK-${createdAt.slice(0, 10).replace(/-/g, '')}-${String(1000 + i * 37).slice(-4)}`,
      assetId: asset.id,
      assetName: asset.name,
      status: plan.status,
      progress,
      stage: plan.status === 'completed' ? '已完成' : plan.status === 'queued' ? '等待调度' : stage.name,
      stageIndex: plan.status === 'completed' ? 7 : stage.index,
      pipeline,
      output: {
        width: asset.width >= 3840 ? asset.width : asset.width * 2,
        height: asset.height >= 2160 ? asset.height : asset.height * 2,
        codec: asset.codec === 'ProRes 422' ? 'H.265' : rnd.pick(['H.265', 'H.264', 'H.265']),
        bitrateMode: rnd.pick(['CRF', 'VBR', 'CBR']),
        bitrate: Math.round(asset.bitrate * rnd.float(1.6, 3.2, 1)),
        crf: rnd.int(16, 22),
        container: rnd.pick(['MP4', 'MOV']),
        fps: pipeline.some((p) => p.capabilityId === 'frameInterpolation') ? 60 : asset.fps,
        colorSpace: asset.colorSpace,
        audioMode: asset.audio ? 'copy' : 'none',
        namingRule: '{name}_enhanced_{res}'
      },
      qualityBefore: before,
      qualityAfter: after,
      createdAt,
      startedAt: plan.status === 'queued' ? null : createdAt,
      finishedAt: plan.status === 'completed' ? new Date(new Date(createdAt).getTime() + estimatedSec * 400).toISOString() : null,
      durationSec,
      elapsedSec: Math.round((estimatedSec * progress) / 100),
      estimatedSec,
      gpu: rnd.pick(['NVIDIA A10 24GB', 'NVIDIA A10 24GB', 'RTX 4090 24GB', 'A100 80GB']),
      vramUsed: Math.round(rnd.float(9.4, 19.8, 1) * 10) / 10,
      priority: rnd.pick([1, 2, 2, 3, 3]) as 1 | 2 | 3,
      templateId: tpl ? tpl.id : null,
      logs: makeLogs(createdAt, plan.status, progress, pipeline),
      createdBy: rnd.pick(['陈默', '林知远', '周文彬', '何雨桐', '苏芮']),
      gpuTrace
    }
    if (plan.error) {
      task.errorCode = plan.error.code
      task.errorMessage = plan.error.message
    }
    return task
  })
}

/* ------------------------------------------------------------------ */
/*                              工单                                   */
/* ------------------------------------------------------------------ */

const tickets: Ticket[] = [
  {
    id: 'TK-20261018-0042',
    title: '4K 超分任务持续显存溢出',
    type: '任务失败',
    priority: '高',
    status: '处理中',
    createdAt: iso(1, 14, 22),
    updatedAt: iso(0, 9, 15),
    relatedTaskId: 'TSK-20261018-1074',
    messages: [
      {
        id: 'm1',
        from: 'user',
        name: '陈默',
        role: '管理员',
        content:
          '昨晚批量提交的 4 个 4K 重制任务里有 3 个报 CUDA_OOM，节点是 A10 24GB。同样的素材用 2x 是正常的，改成 4x 之后就开始失败。附件是任务日志。',
        time: iso(1, 14, 22),
        attachments: [{ name: 'TSK-20261018-1074.log', size: 184320 }]
      },
      {
        id: 'm2',
        from: 'engineer',
        name: '林知远',
        role: '技术支持工程师',
        content:
          '已收到日志。确认是 4x 输出 8K 时峰值显存超过 24GB。当前调度器只按"单卡显存"做准入判断，没有考虑输出分辨率的峰值开销，这是我们的策略缺口。',
        time: iso(1, 15, 40)
      },
      {
        id: 'm3',
        from: 'user',
        name: '陈默',
        role: '管理员',
        content: '有临时绕过的办法吗？这批素材下周要交付。',
        time: iso(1, 16, 2)
      },
      {
        id: 'm4',
        from: 'engineer',
        name: '林知远',
        role: '技术支持工程师',
        content:
          '两个方案：1）开启"分块推理"，显存降到约 14GB，代价是细节一致性损失约 8%，速度慢 30%；2）把任务调度到 A100 80GB 节点，不损失质量。建议先用方案 2 保交付，我们这边同步修复准入策略。',
        time: iso(1, 16, 18)
      },
      {
        id: 'm5',
        from: 'user',
        name: '陈默',
        role: '管理员',
        content: '已经切到 A100 节点，跑起来了。策略修复大概什么时候能上线？',
        time: iso(0, 9, 2)
      },
      {
        id: 'm6',
        from: 'engineer',
        name: '林知远',
        role: '技术支持工程师',
        content: '已排入本周五的版本，上线后调度器会按"输出像素数 × 倍率"预估峰值显存，超出直接拦截并提示。届时我会在这个工单同步。',
        time: iso(0, 9, 15)
      }
    ]
  },
  {
    id: 'TK-20261016-0038',
    title: '老片修复后画面出现规律性横纹',
    type: '画质异常',
    priority: '高',
    status: '待确认',
    createdAt: iso(3, 11, 5),
    updatedAt: iso(1, 10, 30),
    relatedTaskId: 'TSK-20261016-0962',
    messages: [
      {
        id: 'm1',
        from: 'user',
        name: '周文彬',
        role: '剪辑师',
        content:
          '《小城之春》修复版每隔约 12 帧出现一条横向亮纹，原片没有。用的是老片修复模板 + 2x 超分。',
        time: iso(3, 11, 5)
      },
      {
        id: 'm2',
        from: 'engineer',
        name: '郑一鸣',
        role: '算法工程师',
        content:
          '这个周期性与 MPEG-2 的 GOP 长度一致，怀疑是去闪烁模块在 I 帧与 P 帧之间做了不同的亮度映射。能否提供一段 30 秒的原始片段和输出片段？',
        time: iso(2, 14, 12)
      },
      {
        id: 'm3',
        from: 'user',
        name: '周文彬',
        role: '剪辑师',
        content: '已上传到素材库，文件名带 _debug 后缀。',
        time: iso(2, 16, 48),
        attachments: [{ name: '小城之春_debug_30s.mp4', size: 47185920 }]
      },
      {
        id: 'm4',
        from: 'engineer',
        name: '郑一鸣',
        role: '算法工程师',
        content:
          '复现了。去闪烁的直方图参考窗口默认取前后各 2 帧，遇到 I 帧时参考分布突变。临时办法：把「闪烁处理模式」改成"局部自适应"，或把去闪烁强度降到 50 以下。修复版本会改为按 GOP 归一化。',
        time: iso(1, 10, 30)
      }
    ]
  },
  {
    id: 'TK-20261014-0031',
    title: '希望开放批量导出质量报告的能力',
    type: '其他',
    priority: '中',
    status: '已解决',
    createdAt: iso(5, 9, 40),
    updatedAt: iso(3, 17, 8),
    messages: [
      {
        id: 'm1',
        from: 'user',
        name: '苏芮',
        role: '审片员',
        content: '现在只能一个任务一个任务导出报告，我们有 200 多条要交付，能否支持批量导出？',
        time: iso(5, 9, 40)
      },
      {
        id: 'm2',
        from: 'engineer',
        name: '林知远',
        role: '技术支持工程师',
        content: '质量评估页已支持按筛选结果批量导出 CSV，本周四上线。PDF 报告批量导出在排期中，预计下个版本。',
        time: iso(5, 11, 22)
      },
      {
        id: 'm3',
        from: 'user',
        name: '苏芮',
        role: '审片员',
        content: 'CSV 已经够用了，谢谢。',
        time: iso(3, 17, 8)
      }
    ]
  },
  {
    id: 'TK-20261013-0027',
    title: '团队账号无法查看其他成员的输出目录',
    type: '账号权限',
    priority: '中',
    status: '已关闭',
    createdAt: iso(6, 10, 15),
    updatedAt: iso(4, 14, 20),
    messages: [
      {
        id: 'm1',
        from: 'user',
        name: '顾清',
        role: '访客',
        content: '我用访客账号登录，看不到周文彬的输出目录，是权限问题吗？',
        time: iso(6, 10, 15)
      }
    ]
  },
  {
    id: 'TK-20261012-0021',
    title: '插帧后音画不同步约 200ms',
    type: '画质异常',
    priority: '高',
    status: '已解决',
    createdAt: iso(7, 15, 30),
    updatedAt: iso(6, 9, 45),
    messages: [
      {
        id: 'm1',
        from: 'user',
        name: '何雨桐',
        role: '剪辑师',
        content: '24fps 插到 60fps 之后，声音比画面早了大概 200ms，输出设置里音频选的是"直通"。',
        time: iso(7, 15, 30)
      },
      {
        id: 'm2',
        from: 'engineer',
        name: '郑一鸣',
        role: '算法工程师',
        content:
          '这是预期行为：插帧改变了时间基，音频直通会保持原始时长导致错位。请在输出设置把音频改为"重采样为 AAC"，系统会按新时长对齐。',
        time: iso(6, 9, 45)
      }
    ]
  },
  {
    id: 'TK-20261010-0016',
    title: '私有化部署的模型权重下载很慢',
    type: '性能问题',
    priority: '低',
    status: '已解决',
    createdAt: iso(9, 14, 0),
    updatedAt: iso(8, 11, 30),
    messages: [
      {
        id: 'm1',
        from: 'user',
        name: '马啸',
        role: '运维',
        content: '内网部署时拉取 12GB 模型权重用了三个小时，有没有离线包？',
        time: iso(9, 14, 0)
      },
      {
        id: 'm2',
        from: 'engineer',
        name: '林知远',
        role: '技术支持工程师',
        content: '可以申请离线授权包，包含权重与校验文件，通过工单提交企业信息即可，通常 1 个工作日内提供。',
        time: iso(9, 16, 20)
      }
    ]
  },
  {
    id: 'TK-20261009-0011',
    title: '素材上传到 99% 后卡住',
    type: '性能问题',
    priority: '中',
    status: '已关闭',
    createdAt: iso(10, 9, 20),
    updatedAt: iso(9, 15, 0),
    messages: [
      {
        id: 'm1',
        from: 'user',
        name: '马啸',
        role: '运维',
        content: '一个 18GB 的 MOV 上传到 99% 就停住了，等了半小时没动。',
        time: iso(10, 9, 20)
      },
      {
        id: 'm2',
        from: 'engineer',
        name: '林知远',
        role: '技术支持工程师',
        content: '99% 是在做 MD5 校验，18GB 文件约需 3–5 分钟。如果是半小时，可能是浏览器内存不足导致校验线程被回收。建议用客户端上传或分卷。',
        time: iso(10, 10, 5)
      }
    ]
  },
  {
    id: 'TK-20261008-0007',
    title: '咨询企业版并发任务数上限',
    type: '其他',
    priority: '低',
    status: '已关闭',
    createdAt: iso(11, 13, 40),
    updatedAt: iso(11, 16, 10),
    messages: [
      {
        id: 'm1',
        from: 'user',
        name: '陈默',
        role: '管理员',
        content: '企业版最多支持多少个并发任务？我们峰值大概 40 个。',
        time: iso(11, 13, 40)
      },
      {
        id: 'm2',
        from: 'engineer',
        name: '林知远',
        role: '技术支持工程师',
        content: '企业版默认 50 并发，可通过增加 GPU 节点横向扩展，单集群建议不超过 200 并发。',
        time: iso(11, 16, 10)
      }
    ]
  }
]

/* ------------------------------------------------------------------ */
/*                        成员 / 节点 / 通知                           */
/* ------------------------------------------------------------------ */

const team: TeamMember[] = [
  { id: 'u1', name: '陈默', email: 'chenmo@vidclear.cn', role: '管理员', dept: '影视修复部', status: '在线', lastActive: iso(0, 10, 8) },
  { id: 'u2', name: '林知远', email: 'linzhiyuan@vidclear.cn', role: '算法工程师', dept: '技术支持中心', status: '在线', lastActive: iso(0, 10, 2) },
  { id: 'u3', name: '周文彬', email: 'zhouwenbin@vidclear.cn', role: '剪辑师', dept: '内容制作部', status: '在线', lastActive: iso(0, 9, 46) },
  { id: 'u4', name: '苏芮', email: 'surui@vidclear.cn', role: '审片员', dept: '质量管理部', status: '离线', lastActive: iso(1, 18, 30) },
  { id: 'u5', name: '郑一鸣', email: 'zhengyiming@vidclear.cn', role: '算法工程师', dept: '算法研发部', status: '在线', lastActive: iso(0, 9, 12) },
  { id: 'u6', name: '何雨桐', email: 'heyutong@vidclear.cn', role: '剪辑师', dept: '内容制作部', status: '离线', lastActive: iso(0, 8, 20) },
  { id: 'u7', name: '马啸', email: 'maxiao@vidclear.cn', role: '管理员', dept: '运维保障部', status: '在线', lastActive: iso(0, 10, 15) },
  { id: 'u8', name: '顾清', email: 'guqing@archive.org.cn', role: '访客', dept: '外部顾问', status: '停用', lastActive: iso(4, 14, 20) }
]

const nodes: ServiceNode[] = [
  { name: '转码集群 A', type: 'CPU 转码', region: '华东 · 上海', latencyMs: 8, load: 62, status: '正常', uptime30d: 99.98 },
  { name: '超分集群 A10', type: 'GPU 推理', region: '华东 · 上海', latencyMs: 12, load: 84, status: '正常', uptime30d: 99.95 },
  { name: '模型推理节点', type: 'GPU 推理', region: '华东 · 杭州', latencyMs: 19, load: 91, status: '告警', uptime30d: 99.82 },
  { name: '对象存储', type: '存储', region: '华东 · 上海', latencyMs: 5, load: 47, status: '正常', uptime30d: 100 },
  { name: '调度服务', type: '核心服务', region: '华东 · 上海', latencyMs: 3, load: 28, status: '正常', uptime30d: 99.99 },
  { name: 'API 网关', type: '接入层', region: '多可用区', latencyMs: 11, load: 35, status: '正常', uptime30d: 99.97 }
]

const notifications: AppNotification[] = [
  {
    id: 'n1',
    type: 'task',
    title: '任务已完成',
    content: '宣传片_企业形象_4K_交付版.mp4 增强完成，综合质量分 96，提升 +18。',
    time: iso(0, 9, 52),
    read: false,
    link: '/tasks/list'
  },
  {
    id: 'n2',
    type: 'task',
    title: '任务失败',
    content: '无人机航拍_海岸线_DLOG.mov 报 CUDA_OOM，输出 8K 需要 46GB 显存。',
    time: iso(0, 8, 34),
    read: false,
    link: '/tasks/list'
  },
  {
    id: 'n3',
    type: 'ticket',
    title: '工单有新回复',
    content: '林知远回复了「4K 超分任务持续显存溢出」，策略修复已排期本周五。',
    time: iso(0, 9, 15),
    read: false,
    link: '/service/tickets'
  },
  {
    id: 'n4',
    type: 'system',
    title: '节点告警',
    content: '模型推理节点（杭州）GPU 负载持续高于 90%，已自动限流。',
    time: iso(0, 7, 18),
    read: false,
    link: '/service/nodes'
  },
  {
    id: 'n5',
    type: 'task',
    title: '队列任务开始处理',
    content: '竖屏短剧_EP12_1080x1920_低码.mp4 已从队列出队，预计 26 分钟完成。',
    time: iso(1, 16, 40),
    read: true,
    link: '/tasks/list'
  },
  {
    id: 'n6',
    type: 'system',
    title: '版本更新',
    content: 'v2.8.1 发布：新增分块推理开关，修复老片去闪烁的 GOP 边界问题。',
    time: iso(2, 10, 0),
    read: true,
    link: '/service/overview'
  }
]

/* ------------------------------------------------------------------ */
/*                            趋势数据                                 */
/* ------------------------------------------------------------------ */

function buildTrend(): TimerangePoint[] {
  const rnd = createRng(88231)
  const points: TimerangePoint[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(BASE - i * DAY)
    const dow = d.getDay()
    const weekend = dow === 0 || dow === 6
    const base = weekend ? rnd.float(2.4, 5.6, 1) : rnd.float(6.2, 11.8, 1)
    points.push({
      date: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      hours: base,
      vmaf: Math.round((78 + Math.sin(i / 5) * 4 + rnd.float(-2.4, 3.2, 1)) * 10) / 10,
      tasks: Math.round(base * 1.6)
    })
  }
  return points
}

const trend = buildTrend()

const assets = buildAssets()
const tasks = buildTasks(assets)

export const seedData = {
  schemaVersion: 3,
  assets,
  tasks,
  templates,
  tickets,
  team,
  nodes,
  notifications,
  trend,
  collections: COLLECTIONS,
  currentUser: {
    id: 'u1',
    name: '陈默',
    email: 'chenmo@vidclear.cn',
    role: '管理员',
    dept: '影视修复部',
    avatar: 'CM',
    plan: '专业版',
    planExpire: '2027-06-30',
    remainingHours: 38.5,
    storageUsed: 1.84,
    storageTotal: 2
  },
  capabilities
}

export type SeedData = typeof seedData
export { COLLECTIONS, STAGES, gainMap, deriveBefore, deriveAfter }
