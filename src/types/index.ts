export type VideoStatus = 'pending' | 'analyzing' | 'completed' | 'failed' | 'paused'

export type VideoCategory =
  | '新闻资讯'
  | '纪录片'
  | '教学课程'
  | '人物访谈'
  | '企业宣传'
  | 'Vlog'
  | '影视片段'
  | '体育赛事'
  | '监控录像'
  | '直播回放'

export interface VideoItem {
  id: string
  title: string
  description: string
  coverUrl: string
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  fileSize: number
  format: string
  source: '本地上传' | '链接导入' | '直播回放' | '接口同步'
  category: VideoCategory
  tags: string[]
  location: string
  copyright: string
  uploaderId: string
  uploaderName: string
  spaceId: string
  uploadedAt: string
  status: VideoStatus
  progress: number
  analyzedAt?: string
  analysisCost?: number
  playCount: number
}

export interface TranscriptSegment {
  id: string
  start: number
  end: number
  text: string
  speakerId: string
  speakerName: string
  confidence: number
  keywords: string[]
}

export type ShotType = '特写' | '近景' | '中景' | '全景' | '远景' | '空镜'
export type CameraMove = '固定' | '推' | '拉' | '摇' | '移' | '跟' | '升降'

export interface SceneSegment {
  id: string
  index: number
  start: number
  end: number
  thumbnailUrl: string
  shotType: ShotType
  cameraMove: CameraMove
  description: string
  objects: string[]
  environment: string
  aesthetics: { composition: number; lighting: number; color: number; clarity: number }
}

export interface PersonTrack {
  id: string
  name: string
  role: string
  avatarUrl: string
  color: string
  appearances: { start: number; end: number }[]
  faceCount: number
  confidence: number
  description: string
}

export type EventType =
  | '人物出场'
  | '场景转换'
  | '关键动作'
  | '对话高潮'
  | '数据展示'
  | '产品露出'
  | '风险事件'

export interface EventItem {
  id: string
  start: number
  end: number
  type: EventType
  title: string
  description: string
  confidence: number
  thumbnailUrl: string
  entities: string[]
  importance: 1 | 2 | 3 | 4 | 5
}

export type EntityType = '人物' | '地点' | '品牌' | '物品' | '动作' | '情绪' | '风格'

export interface EntityItem {
  id: string
  type: EntityType
  name: string
  count: number
  confidence: number
}

export interface Chapter {
  title: string
  start: number
  end: number
  summary: string
}

export interface AnalysisSummary {
  oneLiner: string
  chapters: Chapter[]
  keyPoints: { text: string; at: number }[]
  keywords: string[]
  quality: { composition: number; lighting: number; color: number; clarity: number; stability: number }
  stats: {
    sceneCount: number
    speakerCount: number
    faceCount: number
    speechRatio: number
    shotTypeDist: Record<string, number>
    cameraMoveDist: Record<string, number>
  }
}

export interface PipelineStage {
  name: string
  status: 'waiting' | 'running' | 'done' | 'failed'
  duration: number
  detail: string
}

export type ViolationCategory =
  | '涉黄'
  | '涉暴'
  | '涉政'
  | '违禁品'
  | '广告导流'
  | '版权风险'
  | '隐私泄露'

export interface ReviewItem {
  id: string
  videoId: string
  videoTitle: string
  coverUrl: string
  start: number
  end: number
  category: ViolationCategory
  level: '高' | '中' | '低'
  confidence: number
  description: string
  thumbnailUrl: string
  status: 'pending' | 'passed' | 'rejected' | 'doubt'
  reviewer?: string
  reviewedAt?: string
  remark?: string
}

export interface SearchHit {
  id: string
  videoId: string
  videoTitle: string
  coverUrl: string
  start: number
  end: number
  score: number
  matchType: '语音' | '画面' | '文字' | '多模态'
  snippet: string
  thumbnailUrl: string
  reasons: { type: string; content: string }[]
}

export interface SearchPreset {
  query: string
  hits: SearchHit[]
}

export type ModelType =
  | 'ASR'
  | 'OCR'
  | '视觉理解'
  | '场景识别'
  | '人脸识别'
  | '语音情感'
  | '内容审核'
  | '多模态大模型'
  | '语义检索'

export interface ModelItem {
  id: string
  name: string
  type: ModelType
  version: string
  provider: string
  accuracy: number
  latency: number
  calls: number
  status: 'online' | 'offline' | 'updating'
  updatedAt: string
  description: string
  scenes: string[]
  trend: number[]
}

export type RoleKey = 'admin' | 'analyst' | 'reviewer' | 'creator' | 'viewer'

export interface UserItem {
  id: string
  name: string
  account: string
  avatarUrl: string
  role: RoleKey
  department: string
  email: string
  phone: string
  status: 'active' | 'disabled'
  lastLoginAt: string
}

export interface AnalysisTask {
  id: string
  videoId: string
  videoTitle: string
  status: VideoStatus
  progress: number
  startedAt: string
  cost: number
  stages: PipelineStage[]
  model: string
}

export interface AuditLog {
  id: string
  time: string
  user: string
  action: string
  target: string
  ip: string
  result: '成功' | '失败'
}

export interface Notification {
  id: string
  type: '任务' | '审核' | '系统'
  title: string
  content: string
  read: boolean
  time: string
}

export interface ProjectItem {
  id: string
  name: string
  videoId: string
  coverUrl: string
  duration: number
  clipCount: number
  status: '草稿' | '已完成' | '导出中'
  updatedAt: string
}

export interface HighlightClip {
  id: string
  start: number
  end: number
  score: number
  reason: string
  thumbnailUrl: string
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
