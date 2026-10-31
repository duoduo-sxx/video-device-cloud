import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  Boxes,
  Building2,
  Cpu,
  Database,
  FileSignature,
  FileText,
  FlaskConical,
  Gauge,
  GitCompare,
  History,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Receipt,
  ScrollText,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Tags,
  TrendingUp,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  perm: string;
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const CONSOLE_NAV: NavGroup[] = [
  {
    title: '',
    items: [{ label: '工作台', to: '/console/overview', icon: LayoutDashboard, perm: 'console.overview' }],
  },
  {
    title: '算力资源层',
    items: [
      { label: '算力实例', to: '/console/compute/instances', icon: Server, perm: 'console.compute' },
      { label: '资源规格', to: '/console/compute/resources', icon: Cpu, perm: 'console.compute' },
      { label: '配额与预留', to: '/console/compute/quota', icon: Gauge, perm: 'console.compute' },
    ],
  },
  {
    title: '算法模型层',
    items: [
      { label: '模型市场', to: '/console/models', icon: Boxes, perm: 'console.models' },
      { label: '模型试用台', to: '/console/models/playground', icon: FlaskConical, perm: 'console.models' },
    ],
  },
  {
    title: '场景服务层',
    items: [
      { label: '数据加工任务', to: '/console/data/jobs', icon: Workflow, perm: 'console.data' },
      { label: '数据集管理', to: '/console/data/datasets', icon: Database, perm: 'console.data' },
      { label: '数据源接入', to: '/console/data/sources', icon: Server, perm: 'console.data' },
      { label: '智能匹配', to: '/console/match/tasks', icon: GitCompare, perm: 'console.match' },
      { label: '匹配效果分析', to: '/console/match/analysis', icon: TrendingUp, perm: 'console.match' },
      { label: '内容生成', to: '/console/gen/workbench', icon: Sparkles, perm: 'console.generate' },
      { label: '生成记录', to: '/console/gen/records', icon: History, perm: 'console.generate' },
    ],
  },
  {
    title: '接入与计量',
    items: [
      { label: 'API 密钥', to: '/console/api/keys', icon: KeyRound, perm: 'console.api' },
      { label: '调用日志', to: '/console/api/logs', icon: ScrollText, perm: 'console.api' },
      { label: '接入文档', to: '/console/api/docs', icon: BookOpen, perm: 'console.api' },
      { label: '用量明细', to: '/console/usage', icon: BarChart3, perm: 'console.usage' },
    ],
  },
  {
    title: '结算中心',
    items: [
      { label: '账单与发票', to: '/console/billing/bills', icon: Receipt, perm: 'console.billing' },
      { label: '发票管理', to: '/console/billing/invoices', icon: FileText, perm: 'console.invoice' },
      { label: '合同管理', to: '/console/billing/contracts', icon: FileSignature, perm: 'console.billing' },
    ],
  },
  {
    title: '账户设置',
    items: [
      { label: '企业信息', to: '/console/settings/company', icon: Building2, perm: 'console.settings' },
      { label: '成员与权限', to: '/console/settings/members', icon: Users, perm: 'console.settings' },
      { label: '账户充值', to: '/console/settings/recharge', icon: Wallet, perm: 'console.settings' },
      { label: '消费预警', to: '/console/settings/alerts', icon: BellRing, perm: 'console.settings' },
      { label: '操作日志', to: '/console/settings/logs', icon: Shield, perm: 'console.settings' },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    title: '',
    items: [{ label: '经营看板', to: '/admin/overview', icon: LayoutDashboard, perm: 'admin.overview' }],
  },
  {
    title: '客户经营',
    items: [
      { label: '客户列表', to: '/admin/customers', icon: Building2, perm: 'admin.customer' },
      { label: '合同管理', to: '/admin/contracts', icon: FileSignature, perm: 'admin.customer' },
      { label: '工单支持', to: '/admin/tickets', icon: LifeBuoy, perm: 'admin.ticket' },
    ],
  },
  {
    title: '服务目录与定价',
    items: [
      { label: '服务项管理', to: '/admin/catalog/services', icon: Tags, perm: 'admin.catalog' },
      { label: '模型管理', to: '/admin/catalog/models', icon: Boxes, perm: 'admin.catalog' },
      { label: '价格策略', to: '/admin/pricing/plans', icon: BarChart3, perm: 'admin.pricing' },
      { label: '折扣审批', to: '/admin/pricing/discounts', icon: ListChecks, perm: 'admin.pricing' },
    ],
  },
  {
    title: '算力运维',
    items: [
      { label: '资源池', to: '/admin/compute/pools', icon: Cpu, perm: 'admin.compute' },
      { label: '节点与卡', to: '/admin/compute/nodes', icon: Server, perm: 'admin.compute' },
      { label: '算力告警', to: '/admin/compute/alerts', icon: Activity, perm: 'admin.compute' },
    ],
  },
  {
    title: '合规与系统',
    items: [
      { label: '内容审核', to: '/admin/compliance/reviews', icon: ShieldCheck, perm: 'admin.compliance' },
      { label: '审计日志', to: '/admin/compliance/audit', icon: ScrollText, perm: 'admin.compliance' },
      { label: '平台用户', to: '/admin/system/users', icon: Users, perm: 'admin.system' },
      { label: '角色权限', to: '/admin/system/roles', icon: Shield, perm: 'admin.system' },
    ],
  },
];

export const FINANCE_NAV: NavGroup[] = [
  {
    title: '',
    items: [{ label: '财务看板', to: '/finance/overview', icon: LayoutDashboard, perm: 'finance.overview' }],
  },
  {
    title: '月结与开票',
    items: [
      { label: '账期对账', to: '/finance/reconcile', icon: Receipt, perm: 'finance.reconcile' },
      { label: '开票申请池', to: '/finance/invoices', icon: FileText, perm: 'finance.invoice' },
      { label: '开具发票', to: '/finance/invoices/apply', icon: FileSignature, perm: 'finance.invoice' },
    ],
  },
  {
    title: '回款与报表',
    items: [
      { label: '回款与应收', to: '/finance/receivables', icon: Wallet, perm: 'finance.receivable' },
      { label: '经营报表', to: '/finance/reports', icon: BarChart3, perm: 'finance.report' },
    ],
  },
];

export const SCOPE_META = {
  console: { label: '客户控制台', home: '/console/overview' },
  admin: { label: '运营管理后台', home: '/admin/overview' },
  finance: { label: '财务结算端', home: '/finance/overview' },
} as const;

export type Scope = keyof typeof SCOPE_META;
