import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Filter,
  GitBranch,
  Layers,
  LayoutDashboard,
  Link2,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** 需要动态角标的位置 */
  badgeKey?: 'pending' | 'anomaly' | 'quality';
  desc?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const BRAND = {
  name: '投见',
  en: 'AdLens',
  tagline: '跨平台广告数据智能平台',
  owner: '栖野户外 OUTLAND',
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: '',
    items: [{ label: '投放总览', to: '/overview', icon: LayoutDashboard, desc: '今日消耗、转化、ROI 与待办' }],
  },
  {
    title: '数据接入',
    items: [
      { label: '投放账户', to: '/connect/accounts', icon: Link2, desc: '6 个平台 12 个账户的授权与余额' },
      { label: '同步任务', to: '/connect/sync', icon: RefreshCw, desc: '每日增量拉取与失败重试' },
      { label: '数据质量', to: '/connect/quality', icon: ShieldCheck, badgeKey: 'quality', desc: '完整性/及时性/一致性校验' },
    ],
  },
  {
    title: '数据资产',
    items: [
      { label: '数仓分层', to: '/data/layers', icon: Layers, desc: 'ODS → DWD → DWS → ADS 四层与血缘' },
      { label: '指标字典', to: '/data/metrics', icon: BookOpen, desc: '指标口径、计算式与平台差异' },
    ],
  },
  {
    title: '模型分析',
    items: [
      { label: '人群洞察', to: '/insight/audience', icon: Users, desc: '谁是目标用户：六维画像与 TGI' },
      { label: '归因分析', to: '/insight/attribution', icon: GitBranch, desc: '五模型归因与触点路径' },
      { label: '转化漏斗', to: '/insight/funnel', icon: Filter, desc: '曝光到支付的七级漏斗' },
      { label: '计划与素材', to: '/insight/campaigns', icon: BarChart3, desc: '计划效率与素材疲劳' },
      { label: '异常诊断', to: '/insight/anomaly', icon: AlertTriangle, badgeKey: 'anomaly', desc: '成本上涨/掉量/素材疲劳根因' },
    ],
  },
  {
    title: '优化执行',
    items: [
      { label: '优化建议', to: '/optimize/suggestions', icon: Sparkles, badgeKey: 'pending', desc: '可执行建议与预估影响' },
      { label: '预算分配', to: '/optimize/budget', icon: Wallet, desc: '边际 ROI 与预算模拟' },
      { label: '变更单', to: '/optimize/changes', icon: Send, desc: '下发记录与效果回收' },
    ],
  },
  {
    title: '报表与设置',
    items: [
      { label: '数据对账', to: '/reports/daily', icon: ArrowLeftRight, desc: '平台后台 vs 我方采集' },
      { label: '系统设置', to: '/settings', icon: Settings, desc: '成员、阈值、同步配置' },
    ],
  },
];

export const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));

export function findNav(path: string) {
  return (
    ALL_NAV.find((i) => i.to === path) ??
    ALL_NAV.filter((i) => path.startsWith(i.to) && i.to !== '/').sort((a, b) => b.to.length - a.to.length)[0]
  );
}
