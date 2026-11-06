import {
  Activity,
  BarChart3,
  Blocks,
  BookOpen,
  Boxes,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  FileSignature,
  FileStack,
  Fingerprint,
  Gavel,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  Link2,
  Lock,
  Network,
  Radio,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UploadCloud,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RoleCode } from '@/types';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles?: RoleCode[];
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const ALL: RoleCode[] = ['platform_admin', 'org_admin', 'creator', 'legal', 'auditor', 'viewer'];
const ADMIN: RoleCode[] = ['platform_admin', 'org_admin'];
const BIZ: RoleCode[] = ['platform_admin', 'org_admin', 'creator', 'legal'];
const LEGAL: RoleCode[] = ['platform_admin', 'org_admin', 'legal'];
const TECH: RoleCode[] = ['platform_admin', 'org_admin'];

export const NAV_GROUPS: NavGroup[] = [
  {
    title: '概览',
    items: [{ path: '/dashboard', label: '工作台', icon: LayoutDashboard, roles: ALL }],
  },
  {
    title: '存证服务',
    items: [
      { path: '/evidence/create', label: '快速存证', icon: UploadCloud, roles: BIZ },
      { path: '/evidence/batch', label: '批量存证', icon: FileStack, roles: BIZ },
      { path: '/evidence', label: '存证记录', icon: Fingerprint, roles: ALL },
      { path: '/evidence/verify', label: '哈希核验', icon: Search, roles: ALL },
    ],
  },
  {
    title: '确权服务',
    items: [
      { path: '/rights/register', label: '权属登记', icon: ShieldCheck, roles: BIZ },
      { path: '/rights', label: '权属管理', icon: FileCheck2, roles: ALL },
      { path: '/rights/graph', label: '权属图谱', icon: Network, roles: ALL },
      { path: '/rights/disputes', label: '异议处理', icon: Gavel, roles: ALL },
    ],
  },
  {
    title: '合同与维权',
    items: [
      { path: '/contracts', label: '电子合同', icon: FileSignature, roles: ALL },
      { path: '/contracts/templates', label: '合同模板', icon: BookOpen, roles: BIZ },
      { path: '/forensics/tasks', label: '取证任务', icon: Radio, roles: ALL },
      { path: '/forensics/web', label: '网页取证', icon: Link2, roles: LEGAL },
      { path: '/forensics/monitor', label: '侵权监测', icon: Activity, roles: ALL },
      { path: '/forensics/packages', label: '证据包', icon: Boxes, roles: ALL },
      { path: '/forensics/judicial', label: '司法出证', icon: Gavel, roles: ALL },
    ],
  },
  {
    title: '数据资产',
    items: [
      { path: '/data-assets/register', label: '资产登记', icon: Sparkles, roles: BIZ },
      { path: '/data-assets', label: '资产台账', icon: Layers, roles: ALL },
      { path: '/data-assets/licenses', label: '授权管理', icon: Lock, roles: ALL },
    ],
  },
  {
    title: '区块链',
    items: [
      { path: '/chain', label: '链上总览', icon: Blocks, roles: ALL },
      { path: '/chain/blocks', label: '区块', icon: Layers, roles: ALL },
      { path: '/chain/txs', label: '交易', icon: ClipboardCheck, roles: ALL },
      { path: '/chain/nodes', label: '节点监控', icon: Server, roles: ALL },
      { path: '/chain/contracts', label: '智能合约', icon: FileCheck2, roles: ALL },
    ],
  },
  {
    title: '技术服务',
    items: [
      { path: '/service/api', label: 'API 接入', icon: KeyRound, roles: TECH },
      { path: '/service/keys', label: '密钥管理', icon: Lock, roles: TECH },
      { path: '/service/usage', label: '调用统计', icon: BarChart3, roles: TECH },
      { path: '/service/docs', label: '开发文档', icon: BookOpen, roles: TECH },
    ],
  },
  {
    title: '组织',
    items: [
      { path: '/org/members', label: '成员管理', icon: Users, roles: [...ADMIN, 'auditor'] },
      { path: '/org/roles', label: '角色权限', icon: ShieldCheck, roles: ADMIN },
      { path: '/org/audit', label: '审计日志', icon: ClipboardCheck, roles: [...ADMIN, 'auditor'] },
    ],
  },
  {
    title: '账单与设置',
    items: [
      { path: '/billing', label: '套餐账单', icon: CreditCard, roles: ADMIN },
      { path: '/settings', label: '账户设置', icon: Settings, roles: ALL },
      { path: '/notifications', label: '消息中心', icon: TicketCheck, roles: ALL },
      { path: '/support', label: '帮助工单', icon: HelpCircle, roles: ALL },
    ],
  },
];

export const TITLES: Record<string, string> = {
  '/dashboard': '工作台',
  '/evidence/create': '快速存证',
  '/evidence/batch': '批量存证',
  '/evidence': '存证记录',
  '/evidence/verify': '哈希核验',
  '/rights/register': '权属登记',
  '/rights': '权属管理',
  '/rights/graph': '权属图谱',
  '/rights/disputes': '异议处理',
  '/rights/transfer': '转让与许可',
  '/contracts': '电子合同',
  '/contracts/templates': '合同模板库',
  '/forensics/tasks': '取证任务',
  '/forensics/web': '网页取证',
  '/forensics/monitor': '侵权监测',
  '/forensics/packages': '证据包',
  '/forensics/judicial': '司法出证',
  '/data-assets/register': '数据资产登记',
  '/data-assets': '数据资产台账',
  '/data-assets/licenses': '授权管理',
  '/chain': '链上总览',
  '/chain/blocks': '区块浏览',
  '/chain/txs': '交易浏览',
  '/chain/nodes': '节点监控',
  '/chain/contracts': '智能合约',
  '/service/api': 'API 接入',
  '/service/keys': '密钥管理',
  '/service/usage': '调用统计',
  '/service/docs': '开发文档',
  '/org/members': '成员管理',
  '/org/roles': '角色权限',
  '/org/audit': '审计日志',
  '/billing': '套餐与账单',
  '/settings': '账户设置',
  '/notifications': '消息中心',
  '/support': '帮助与工单',
  '/login': '登录',
  '/register': '注册',
  '/onboarding/verify': '实名认证',
  '/help': '帮助中心',
};

export const HELP_ICON = LifeBuoy;
