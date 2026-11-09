import type { RoleKey } from '@/types';

export interface MenuItem {
  key: string;
  label: string;
  icon: string; // antd icon name mapping in layout
  path?: string;
  children?: MenuItem[];
}

export const MENUS: MenuItem[] = [
  { key: 'dashboard', label: '工作台', icon: 'DashboardOutlined', path: '/' },
  { key: 'chat', label: '对话中心', icon: 'MessageOutlined', path: '/chat' },
  { key: 'nlp', label: '语义理解', icon: 'ExperimentOutlined', path: '/nlp' },
  { key: 'voice', label: '语音演示', icon: 'AudioOutlined', path: '/voice' },
  { key: 'knowledge', label: '知识库', icon: 'BookOutlined', path: '/knowledge' },
  { key: 'bot', label: '场景配置', icon: 'RobotOutlined', path: '/bot' },
  {
    key: 'analytics',
    label: '数据分析',
    icon: 'BarChartOutlined',
    children: [
      { key: 'reports', label: '报表分析', icon: 'LineChartOutlined', path: '/analytics/reports' },
      { key: 'bigscreen', label: '运营大屏', icon: 'DesktopOutlined', path: '/analytics/bigscreen' },
    ],
  },
  { key: 'quality', label: '质量评测', icon: 'AuditOutlined', path: '/quality' },
  { key: 'system', label: '系统管理', icon: 'SettingOutlined', path: '/system' },
];

export const ROLE_MENUS: Record<RoleKey, string[]> = {
  admin: ['dashboard', 'chat', 'nlp', 'voice', 'knowledge', 'bot', 'analytics', 'reports', 'bigscreen', 'quality', 'system'],
  agent: ['dashboard', 'chat', 'nlp', 'voice', 'knowledge'],
  knowledge: ['dashboard', 'chat', 'nlp', 'knowledge', 'bot'],
  analyst: ['dashboard', 'nlp', 'analytics', 'reports', 'bigscreen', 'quality'],
};

export const ROLE_LABELS: Record<RoleKey, string> = {
  admin: '系统管理员',
  agent: '普通坐席/运营',
  knowledge: '知识管理员',
  analyst: '数据分析员',
};

export const SENSITIVE_WORDS = ['诈骗', '博彩', '违禁品', '洗钱', '暴力催收'];

export const KNOWLEDGE_CATEGORIES = ['产品咨询', '售后退款', '账务发票', '会员活动', '技术支持', '服务流程', '商务合作'];

export const CHANNELS = ['Web', 'App', '小程序', '电话'] as const;

export const PRIMARY_COLOR = '#2563EB';
