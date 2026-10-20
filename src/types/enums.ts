export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'default';

/* ---------------- 渠道 ---------------- */
export const CHANNELS = {
  wechat: { name: '微信小游戏', short: '微信', limitMB: 4, reviewHours: 18, overseas: false },
  douyin: { name: '抖音小游戏', short: '抖音', limitMB: 6, reviewHours: 24, overseas: false },
  kuaishou: { name: '快手小游戏', short: '快手', limitMB: 6, reviewHours: 20, overseas: false },
  alipay: { name: '支付宝小游戏', short: '支付宝', limitMB: 4, reviewHours: 30, overseas: false },
  facebook: { name: 'Facebook Instant Games', short: 'Facebook', limitMB: 20, reviewHours: 12, overseas: true },
  telegram: { name: 'Telegram Mini App', short: 'Telegram', limitMB: 0, reviewHours: 2, overseas: true },
  poki: { name: 'Poki', short: 'Poki', limitMB: 30, reviewHours: 8, overseas: true },
  crazygames: { name: 'CrazyGames', short: 'CrazyGames', limitMB: 50, reviewHours: 10, overseas: true },
  h5: { name: '自有 H5 站点', short: 'H5', limitMB: 0, reviewHours: 0, overseas: false },
  webview: { name: 'App 内嵌 WebView', short: 'WebView', limitMB: 0, reviewHours: 0, overseas: false },
} as const;

export type ChannelId = keyof typeof CHANNELS;
export const CHANNEL_IDS = Object.keys(CHANNELS) as ChannelId[];

/* ---------------- 项目 ---------------- */
export const PROJECT_STATUS = {
  bidding: { label: '投标中', tone: 'default' as Tone },
  discovery: { label: '需求调研', tone: 'info' as Tone },
  in_progress: { label: '研发中', tone: 'info' as Tone },
  acceptance: { label: '验收中', tone: 'purple' as Tone },
  online: { label: '已上线', tone: 'success' as Tone },
  maintenance: { label: '运维中', tone: 'success' as Tone },
  paused: { label: '已暂停', tone: 'warning' as Tone },
  archived: { label: '已归档', tone: 'default' as Tone },
} as const;
export type ProjectStatus = keyof typeof PROJECT_STATUS;

export const HEALTH = {
  healthy: { label: '健康', tone: 'success' as Tone },
  at_risk: { label: '关注', tone: 'warning' as Tone },
  critical: { label: '风险', tone: 'danger' as Tone },
} as const;
export type Health = keyof typeof HEALTH;

export const ENGINES = {
  cocos: { label: 'Cocos Creator', color: '#2FA8E0' },
  laya: { label: 'LayaAir', color: '#4C8DFF' },
  phaser: { label: 'Phaser', color: '#8B5CF6' },
  pixijs: { label: 'PixiJS', color: '#F97316' },
  unity: { label: 'Unity WebGL', color: '#101828' },
  egret: { label: 'Egret', color: '#0BA5EC' },
} as const;
export type EngineType = keyof typeof ENGINES;

/* ---------------- 需求 ---------------- */
export const REQ_STATUS = {
  pending_review: { label: '待评审', tone: 'default' as Tone },
  confirmed: { label: '已确认', tone: 'info' as Tone },
  developing: { label: '开发中', tone: 'purple' as Tone },
  pending_accept: { label: '待验收', tone: 'warning' as Tone },
  done: { label: '已完成', tone: 'success' as Tone },
  rejected: { label: '已拒绝', tone: 'default' as Tone },
} as const;
export type ReqStatus = keyof typeof REQ_STATUS;

export const REQ_TYPE = {
  feature: '功能',
  optimize: '优化',
  tech: '技术',
  art: '美术',
  compliance: '合规',
} as const;
export type ReqType = keyof typeof REQ_TYPE;

/* ---------------- 任务 ---------------- */
export const TASK_STATUS = {
  todo: { label: '待办', tone: 'default' as Tone },
  doing: { label: '进行中', tone: 'info' as Tone },
  review: { label: '待验证', tone: 'warning' as Tone },
  done: { label: '已完成', tone: 'success' as Tone },
} as const;
export type TaskStatus = keyof typeof TASK_STATUS;

export const TASK_TYPE = {
  feature: { label: '功能', icon: 'sparkles' },
  bug: { label: '缺陷', icon: 'bug' },
  tech: { label: '技术', icon: 'wrench' },
  design: { label: '设计', icon: 'palette' },
  test: { label: '测试', icon: 'flask' },
} as const;
export type TaskType = keyof typeof TASK_TYPE;

/* ---------------- 缺陷 ---------------- */
export const BUG_SEVERITY = {
  blocker: { label: '阻断', tone: 'danger' as Tone },
  critical: { label: '致命', tone: 'danger' as Tone },
  major: { label: '严重', tone: 'warning' as Tone },
  minor: { label: '一般', tone: 'info' as Tone },
  trivial: { label: '轻微', tone: 'default' as Tone },
} as const;
export type BugSeverity = keyof typeof BUG_SEVERITY;

export const BUG_STATUS = {
  new: { label: '新建', tone: 'default' as Tone },
  confirmed: { label: '已确认', tone: 'info' as Tone },
  in_progress: { label: '修复中', tone: 'purple' as Tone },
  fixed: { label: '已修复', tone: 'warning' as Tone },
  verified: { label: '已验证', tone: 'success' as Tone },
  closed: { label: '已关闭', tone: 'success' as Tone },
  reopened: { label: '重新打开', tone: 'danger' as Tone },
  rejected: { label: '已拒绝', tone: 'default' as Tone },
} as const;
export type BugStatus = keyof typeof BUG_STATUS;

export const REPRO_RATE = {
  always: '必现',
  high: '高频',
  sometimes: '偶现',
  once: '仅一次',
} as const;
export type ReproRate = keyof typeof REPRO_RATE;

/* ---------------- 构建 ---------------- */
export const BUILD_STATUS = {
  queued: { label: '排队中', tone: 'default' as Tone },
  running: { label: '运行中', tone: 'info' as Tone },
  success: { label: '成功', tone: 'success' as Tone },
  failed: { label: '失败', tone: 'danger' as Tone },
  canceled: { label: '已取消', tone: 'default' as Tone },
} as const;
export type BuildStatus = keyof typeof BUILD_STATUS;

/* ---------------- 发布 ---------------- */
export const RELEASE_STATUS = {
  draft: { label: '草稿', tone: 'default' as Tone },
  reviewing: { label: '审核中', tone: 'info' as Tone },
  rejected: { label: '已驳回', tone: 'danger' as Tone },
  grayscale: { label: '灰度中', tone: 'warning' as Tone },
  preheating: { label: '预下载', tone: 'purple' as Tone },
  online: { label: '已上线', tone: 'success' as Tone },
  offline: { label: '已下架', tone: 'default' as Tone },
} as const;
export type ReleaseStatus = keyof typeof RELEASE_STATUS;

/* ---------------- 工单 ---------------- */
export const TICKET_LEVEL = {
  P0: { label: 'P0 紧急', tone: 'danger' as Tone, respondMin: 15, resolveMin: 240 },
  P1: { label: 'P1 高', tone: 'warning' as Tone, respondMin: 60, resolveMin: 480 },
  P2: { label: 'P2 中', tone: 'info' as Tone, respondMin: 240, resolveMin: 1440 * 3 },
  P3: { label: 'P3 低', tone: 'default' as Tone, respondMin: 1440, resolveMin: 1440 * 5 },
} as const;
export type TicketLevel = keyof typeof TICKET_LEVEL;

export const TICKET_STATUS = {
  new: { label: '待受理', tone: 'danger' as Tone },
  assigned: { label: '已指派', tone: 'info' as Tone },
  in_progress: { label: '处理中', tone: 'purple' as Tone },
  pending_customer: { label: '待客户', tone: 'warning' as Tone },
  resolved: { label: '已解决', tone: 'success' as Tone },
  closed: { label: '已关闭', tone: 'default' as Tone },
  reopened: { label: '重新打开', tone: 'danger' as Tone },
} as const;
export type TicketStatus = keyof typeof TICKET_STATUS;

export const TICKET_CATEGORY = {
  integration: '接入咨询',
  incident: '线上故障',
  data: '数据异常',
  feature: '功能需求',
  billing: '账单问题',
  account: '账号权限',
} as const;
export type TicketCategory = keyof typeof TICKET_CATEGORY;

/* ---------------- 角色 ---------------- */
export const ROLES = {
  admin: { label: '超级管理员', desc: '系统配置与权限管理' },
  director: { label: '项目总监', desc: '经营看板与审批' },
  pm: { label: '项目经理', desc: '进度、里程碑与客户沟通' },
  client_dev: { label: '客户端开发', desc: '任务、缺陷与构建' },
  dev: { label: '工具与服务端', desc: '流水线、SDK 与性能' },
  artist: { label: '美术设计', desc: '需求、素材与包体' },
  qa: { label: '测试工程师', desc: '缺陷、测试与兼容性' },
  ops: { label: '发布运维', desc: '构建、发布与灰度' },
  finance: { label: '财务', desc: '合同、回款与结算' },
  client: { label: '客户（只读）', desc: '查看进度与提交工单' },
} as const;
export type RoleId = keyof typeof ROLES;

/* ---------------- 通用 ---------------- */
export const PRIORITY = {
  P0: { label: 'P0', tone: 'danger' as Tone, full: '最高' },
  P1: { label: 'P1', tone: 'warning' as Tone, full: '高' },
  P2: { label: 'P2', tone: 'info' as Tone, full: '中' },
  P3: { label: 'P3', tone: 'default' as Tone, full: '低' },
} as const;
export type Priority = keyof typeof PRIORITY;

export const ASSET_TYPE = {
  texture: { label: '纹理', tone: 'info' as Tone },
  atlas: { label: '图集', tone: 'purple' as Tone },
  audio: { label: '音频', tone: 'success' as Tone },
  font: { label: '字体', tone: 'warning' as Tone },
  shader: { label: '着色器', tone: 'danger' as Tone },
  video: { label: '视频', tone: 'default' as Tone },
  config: { label: '配置', tone: 'default' as Tone },
} as const;
export type AssetType = keyof typeof ASSET_TYPE;
