export type AssetType = 'video' | 'audio' | 'image' | 'subtitle' | 'project';

export type AssetStatus = 'ready' | 'processing' | 'pending_review' | 'archived' | 'failed';

export type CapabilityId =
  | 'cap_asr'
  | 'cap_subtitle'
  | 'cap_translate'
  | 'cap_dubbing'
  | 'cap_tts'
  | 'cap_clip'
  | 'cap_enhance'
  | 'cap_audio'
  | 'cap_review'
  | 'cap_insight'
  | 'cap_ocr'
  | 'cap_watermark';

export type TaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

export type Priority = 'high' | 'medium' | 'low';

export type SubtitleLanguage = 'zh' | 'en' | 'bi';

export interface SubtitleLine {
  id: string;
  index: number;
  start: number;
  end: number;
  speaker?: string;
  text: string;
  confidence: number;
  reviewed: boolean;
}

export interface SubtitleTrack {
  id: string;
  language: SubtitleLanguage;
  version: number;
  styleId: string;
  updatedAt: string;
  updatedBy: string;
  lines: SubtitleLine[];
}

export interface MediaAsset {
  id: string;
  title: string;
  type: AssetType;
  status: AssetStatus;
  duration: number;
  width?: number;
  height?: number;
  sizeBytes: number;
  format: string;
  codec: string;
  bitrateKbps: number;
  frameRate?: number;
  cover: number;
  tags: string[];
  project: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  capabilities: CapabilityId[];
  subtitleTracks: SubtitleTrack[];
  reviewScore?: number;
  md5: string;
}

export interface TaskStage {
  name: string;
  ms: number;
  status: 'wait' | 'running' | 'done' | 'failed';
}

export interface Task {
  id: string;
  name: string;
  capability: CapabilityId;
  assetId: string;
  status: TaskStatus;
  progress: number;
  priority: Priority;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  stage: string;
  errorCode?: string;
  errorMessage?: string;
  params: Record<string, unknown>;
  outputs: { name: string; sizeBytes: number; kind: string }[];
  node: string;
}

export interface ReviewFinding {
  id: string;
  assetId: string;
  start: number;
  end: number;
  dimension: 'porn' | 'violence' | 'politics' | 'terror' | 'sensitive_word' | 'logo';
  level: 'high' | 'medium' | 'low';
  confidence: number;
  snippet: string;
  suggestion: string;
  handled: boolean;
  action?: 'pass' | 'delete' | 'mask' | 'whitelist';
}

export type NodeType =
  | 'input'
  | 'transcode'
  | 'asr'
  | 'subtitle'
  | 'translate'
  | 'dubbing'
  | 'clip'
  | 'enhance'
  | 'review'
  | 'output'
  | 'branch'
  | 'manual';

export interface PipelineNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  params: Record<string, string | number | boolean>;
  status?: 'idle' | 'running' | 'done' | 'failed';
}

export interface PipelineEdge {
  id: string;
  from: string;
  to: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  trigger: string;
  enabled: boolean;
  ownerId: string;
  version: number;
  successRate: number;
  avgDurationSec: number;
  runs7d: number;
  updatedAt: string;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  startedAt: string;
  status: 'succeeded' | 'failed' | 'running';
  durationSec: number;
  triggeredBy: string;
  assetTitle: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  group: string;
  avatarColor: string;
  monthlyHours: number;
  status: 'active' | 'disabled';
  lastActive: string;
}

export interface ApiKey {
  id: string;
  name: string;
  masked: string;
  scopes: string[];
  qps: number;
  createdAt: string;
  lastUsed: string;
  status: 'active' | 'expiring' | 'revoked';
  expiresAt: string;
}

export interface ApiCallLog {
  id: string;
  time: string;
  endpoint: string;
  status: number;
  ms: number;
  requestId: string;
  ip: string;
}

export interface UsageRecord {
  id: string;
  date: string;
  capability: CapabilityId;
  amount: number;
  unit: string;
  price: number;
  taskId: string;
}

export interface AuditLog {
  id: string;
  time: string;
  userId: string;
  action: string;
  objectType: string;
  objectName: string;
  ip: string;
  result: 'success' | 'failed';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  tags: string[];
  uses: number;
  author: string;
  rating: number;
  reviews: number;
  cover: number;
  description: string;
  nodeSummary: string[];
}

export interface Notification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'success' | 'error' | 'info';
}

export interface CapabilityMeta {
  id: CapabilityId;
  name: string;
  desc: string;
  formats: string;
  monthlyCalls: number;
  avgDuration: string;
  status: 'up' | 'maintenance' | 'soon';
  color: string;
  icon: string;
}

export interface Paged<T> {
  list: T[];
  total: number;
}
