import type { RoleKey, VideoStatus, ViolationCategory } from '../types'

export interface NavItem {
  key: string
  label: string
  path: string
  icon: string
  roles?: RoleKey[]
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    title: '概览',
    items: [{ key: 'dashboard', label: '工作台', path: '/dashboard', icon: 'LayoutDashboard' }],
  },
  {
    title: '内容资产',
    items: [
      { key: 'videos', label: '视频资产库', path: '/videos', icon: 'Film' },
      { key: 'search', label: '智能检索', path: '/search', icon: 'Search' },
      { key: 'editing', label: '智能剪辑', path: '/editing', icon: 'Scissors' },
    ],
  },
  {
    title: '质量与安全',
    items: [{ key: 'review', label: '内容审核', path: '/review', icon: 'ShieldCheck' }],
  },
  {
    title: '运营分析',
    items: [{ key: 'analytics', label: '数据分析', path: '/analytics', icon: 'BarChart3' }],
  },
  {
    title: '平台配置',
    items: [
      { key: 'models', label: '模型与能力', path: '/models', icon: 'Cpu' },
      { key: 'settings', label: '系统设置', path: '/settings/users', icon: 'Settings' },
    ],
  },
]

export const STATUS_LABEL: Record<VideoStatus, string> = {
  pending: '待解析',
  analyzing: '解析中',
  completed: '已完成',
  failed: '失败',
  paused: '已暂停',
}

export const STATUS_STYLE: Record<VideoStatus, { bg: string; fg: string; dot: string }> = {
  pending: { bg: 'var(--bg-subtle)', fg: 'var(--text-secondary)', dot: 'var(--text-tertiary)' },
  analyzing: { bg: 'var(--brand-soft)', fg: 'var(--brand)', dot: 'var(--brand)' },
  completed: { bg: 'rgba(22,163,74,.1)', fg: 'var(--success)', dot: 'var(--success)' },
  failed: { bg: 'rgba(220,38,38,.1)', fg: 'var(--danger)', dot: 'var(--danger)' },
  paused: { bg: 'rgba(217,119,6,.1)', fg: 'var(--warning)', dot: 'var(--warning)' },
}

export const ROLE_LABEL: Record<RoleKey, string> = {
  admin: '平台管理员',
  analyst: '内容分析师',
  reviewer: '内容审核员',
  creator: '创作者',
  viewer: '只读访客',
}

export const ROLE_PERMISSIONS: Record<RoleKey, string[]> = {
  admin: ['dashboard', 'videos', 'search', 'editing', 'review', 'analytics', 'models', 'settings'],
  analyst: ['dashboard', 'videos', 'search', 'analytics', 'models'],
  reviewer: ['dashboard', 'videos', 'review'],
  creator: ['dashboard', 'videos', 'search', 'editing'],
  viewer: ['dashboard', 'analytics'],
}

export const VIOLATION_LEVEL_COLOR: Record<'高' | '中' | '低', string> = {
  高: 'var(--danger)',
  中: 'var(--warning)',
  低: 'var(--info)',
}

export const CATEGORY_LIST = [
  '新闻资讯',
  '纪录片',
  '教学课程',
  '人物访谈',
  '企业宣传',
  'Vlog',
  '影视片段',
  '体育赛事',
  '监控录像',
  '直播回放',
] as const

export const VIOLATION_LIST: ViolationCategory[] = [
  '涉黄',
  '涉暴',
  '涉政',
  '违禁品',
  '广告导流',
  '版权风险',
  '隐私泄露',
]

export const DURATION_RANGES = [
  { label: '1 分钟以内', min: 0, max: 60 },
  { label: '1 - 5 分钟', min: 60, max: 300 },
  { label: '5 - 15 分钟', min: 300, max: 900 },
  { label: '15 - 30 分钟', min: 900, max: 1800 },
  { label: '30 - 60 分钟', min: 1800, max: 3600 },
  { label: '60 分钟以上', min: 3600, max: 999999 },
]

export const SPEAKER_COLORS = ['#2563EB', '#7C3AED', '#0F766E', '#B45309', '#BE123C']
