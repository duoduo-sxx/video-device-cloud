import {
  Activity,
  BarChart3,
  BookOpen,
  Bug,
  CalendarClock,
  Filter,
  FolderKanban,
  Gauge,
  Hammer,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MonitorSmartphone,
  Package,
  Plug,
  Rocket,
  ScrollText,
  Settings,
  TrendingUp,
  Users,
  FileText,
  Bell,
} from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  badgeKey?: 'tickets' | 'releases' | 'approvals';
}

export interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'dashboard',
    label: '工作台',
    items: [{ key: 'dashboard', label: '总览', path: '/dashboard', icon: LayoutDashboard }],
  },
  {
    key: 'projects',
    label: '项目',
    items: [
      { key: 'project-list', label: '项目列表', path: '/projects', icon: FolderKanban },
      { key: 'work', label: '我的待办', path: '/work', icon: ListChecks },
    ],
  },
  {
    key: 'delivery',
    label: '交付',
    items: [
      { key: 'builds', label: '构建中心', path: '/builds', icon: Hammer },
      { key: 'releases', label: '发布中心', path: '/releases', icon: Rocket, badgeKey: 'releases' },
      { key: 'calendar', label: '版本日历', path: '/releases/calendar', icon: CalendarClock },
    ],
  },
  {
    key: 'quality',
    label: '质量',
    items: [
      { key: 'performance', label: '性能监控', path: '/quality/performance', icon: Gauge },
      { key: 'compat', label: '兼容性矩阵', path: '/quality/compatibility', icon: MonitorSmartphone },
      { key: 'crashes', label: '异常聚合', path: '/quality/crashes', icon: Bug },
    ],
  },
  {
    key: 'analytics',
    label: '运营',
    items: [
      { key: 'realtime', label: '实时数据', path: '/analytics/realtime', icon: Activity },
      { key: 'overview', label: '核心指标', path: '/analytics/overview', icon: TrendingUp },
      { key: 'funnel', label: '留存与漏斗', path: '/analytics/funnel', icon: Filter },
      { key: 'channels', label: '渠道分析', path: '/analytics/channels', icon: BarChart3 },
    ],
  },
  {
    key: 'assets',
    label: '资源',
    items: [
      { key: 'assets', label: '素材库', path: '/assets', icon: ImageIcon },
      { key: 'budget', label: '包体预算', path: '/assets/budget', icon: Package },
    ],
  },
  {
    key: 'support',
    label: '服务',
    items: [
      { key: 'tickets', label: '工单', path: '/support/tickets', icon: LifeBuoy, badgeKey: 'tickets' },
      { key: 'sdk', label: 'SDK 接入', path: '/support/sdk', icon: KeyRound },
      { key: 'knowledge', label: '知识库', path: '/support/knowledge', icon: BookOpen },
    ],
  },
  {
    key: 'org',
    label: '组织',
    items: [
      { key: 'team', label: '成员管理', path: '/team', icon: Users },
      { key: 'workload', label: '负载与工时', path: '/team/workload', icon: Activity },
      { key: 'contracts', label: '合同与结算', path: '/billing/contracts', icon: FileText },
    ],
  },
  {
    key: 'settings',
    label: '设置',
    items: [
      { key: 'settings-general', label: '通用设置', path: '/settings/general', icon: Settings },
      { key: 'settings-notify', label: '通知规则', path: '/settings/notifications', icon: Bell },
      { key: 'settings-integration', label: '集成', path: '/settings/integrations', icon: Plug },
      { key: 'settings-audit', label: '审计日志', path: '/settings/audit', icon: ScrollText },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
