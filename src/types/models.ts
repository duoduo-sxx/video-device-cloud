import type {
  AssetType,
  BugSeverity,
  BugStatus,
  BuildStatus,
  ChannelId,
  EngineType,
  Health,
  Priority,
  ProjectStatus,
  ReleaseStatus,
  ReqStatus,
  ReqType,
  ReproRate,
  RoleId,
  TaskStatus,
  TaskType,
  TicketCategory,
  TicketLevel,
  TicketStatus,
} from './enums';

export interface User {
  id: string;
  name: string;
  enName: string;
  email: string;
  role: RoleId;
  level: string;
  skills: string[];
  status: 'active' | 'leave' | 'resigned';
  joinDate: string;
  monthlyHours: number;
  workload: number;
}

export interface Client {
  id: string;
  name: string;
  shortName: string;
  region: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  cooperateSince: string;
  totalContractAmount: number;
  satisfaction: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  plannedDate: string;
  actualDate: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  ownerId: string;
  deliverable: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  clientId: string;
  status: ProjectStatus;
  health: Health;
  healthScore: number;
  engine: EngineType;
  engineVersion: string;
  platforms: ChannelId[];
  managerId: string;
  memberIds: string[];
  startDate: string;
  plannedEndDate: string;
  actualEndDate: string | null;
  contractAmount: number;
  progress: number;
  currentVersion: string;
  currentSprint: string;
  tags: string[];
  description: string;
  riskNote: string | null;
  milestones: Milestone[];
  daysLeft: number;
}

export interface Requirement {
  id: string;
  projectId: string;
  title: string;
  type: ReqType;
  priority: Priority;
  status: ReqStatus;
  proposerId: string;
  ownerId: string;
  storyPoints: number;
  sprint: string | null;
  description: string;
  acceptanceCriteria: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string;
  reporterId: string;
  storyPoints: number;
  estimateHours: number;
  spentHours: number;
  sprint: string;
  requirementId: string | null;
  labels: string[];
  dueDate: string;
  subtasks: { id: string; title: string; done: boolean }[];
  commentCount: number;
  attachmentCount: number;
  order: number;
  createdAt: string;
}

export interface Bug {
  id: string;
  projectId: string;
  title: string;
  severity: BugSeverity;
  priority: Priority;
  status: BugStatus;
  module: string;
  reproduceRate: ReproRate;
  environment: {
    channel: ChannelId;
    version: string;
    device: string;
    os: string;
    browser: string;
  };
  steps: string[];
  expected: string;
  actual: string;
  assigneeId: string;
  reporterId: string;
  buildId: string | null;
  attachmentCount: number;
  createdAt: string;
  closedAt: string | null;
}

export interface BuildStage {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  durationSec: number;
  log: string[];
}

export interface Build {
  id: string;
  buildNumber: number;
  projectId: string;
  branch: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  trigger: 'push' | 'manual' | 'schedule' | 'tag';
  status: BuildStatus;
  progress: number;
  stages: BuildStage[];
  durationSec: number;
  artifactSize: number;
  sizeDelta: number;
  env: { node: string; engine: string; builder: string };
  qualityGates: { name: string; value: string; passed: boolean; hint?: string }[];
  composition: { name: string; size: number; color: string }[];
  topAssets: { name: string; type: string; rawSize: number; gzipSize: number; ratio: number }[];
  createdAt: string;
  finishedAt: string | null;
}

export interface Release {
  id: string;
  projectId: string;
  version: string;
  channel: ChannelId;
  status: ReleaseStatus;
  grayscalePercent: number;
  submitAt: string | null;
  reviewDurationHours: number | null;
  reviewNote: string | null;
  publishAt: string | null;
  packageSize: number;
  releaseNote: string;
  operatorId: string;
  buildId: string;
  rollbackFrom: string | null;
}

export interface DailyMetric {
  date: string;
  projectId: string;
  channel: ChannelId;
  dau: number;
  newUsers: number;
  revenue: number;
  retention1: number;
  retention3: number;
  retention7: number;
  retention30: number;
  payRate: number;
  arppu: number;
  avgDuration: number;
}

export interface RealtimeEvent {
  id: string;
  time: string;
  type: 'pay' | 'register' | 'level' | 'share' | 'error';
  channel: ChannelId;
  projectId: string;
  detail: string;
  amount?: number;
  region: string;
}

export interface PerformanceRow {
  date: string;
  projectId: string;
  channel: ChannelId;
  version: string;
  deviceTier: 'high' | 'mid' | 'low';
  samples: number;
  fp50: number;
  fp95: number;
  fps: number;
  lowFpsRate: number;
  memoryPeak: number;
  crashRate: number;
  jankRate: number;
}

export interface Asset {
  id: string;
  name: string;
  path: string;
  projectId: string;
  type: AssetType;
  format: string;
  width: number | null;
  height: number | null;
  size: number;
  rawSize: number;
  compression: 'none' | 'pngquant' | 'webp' | 'basis' | 'astc';
  refCount: number;
  refs: { scene: string; node: string }[];
  group: 'code' | 'image' | 'audio' | 'font' | 'anim' | 'config';
  license: { type: string; expireAt: string | null } | null;
  status: 'in_use' | 'unused' | 'pending_opt';
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  authorId: string;
  authorType: 'internal' | 'client';
  authorName: string;
  content: string;
  internal: boolean;
  attachments: { name: string; size: number; type: string }[];
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  clientId: string;
  projectId: string;
  level: TicketLevel;
  category: TicketCategory;
  status: TicketStatus;
  assigneeId: string | null;
  creatorId: string;
  creatorName: string;
  sla: {
    respondDeadline: string;
    resolveDeadline: string;
    firstRespondedAt: string | null;
    resolvedAt: string | null;
    breached: boolean;
  };
  environment: string | null;
  relatedVersion: string | null;
  satisfaction: number | null;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  clientId: string;
  projectIds: string[];
  type: 'fixed' | 'man_day' | 'revenue_share';
  amount: number;
  received: number;
  signDate: string;
  expireDate: string;
  status: 'draft' | 'active' | 'renewing' | 'closed';
  milestones: {
    name: string;
    ratio: number;
    amount: number;
    plannedDate: string;
    receivedDate: string | null;
    status: 'pending' | 'invoiced' | 'received' | 'overdue';
  }[];
}

export interface Notification {
  id: string;
  type: 'mention' | 'approval' | 'alert' | 'system';
  title: string;
  content: string;
  read: boolean;
  link: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetName: string;
  ip: string;
  result: 'success' | 'failed';
  createdAt: string;
}
