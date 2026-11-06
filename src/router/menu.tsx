import type { ReactNode } from 'react';
import {
  AlertOutlined,
  ApartmentOutlined,
  BarChartOutlined,
  BellOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  KeyOutlined,
  MonitorOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SlidersOutlined,
  SwapOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { Role } from '../types';

export interface MenuNode {
  key: string;
  label: string;
  icon?: ReactNode;
  group: string;
  roles: Role[];
}

const ALL: Role[] = ['admin', 'ops', 'member'];
const ADMIN: Role[] = ['admin'];
const ADMIN_OPS: Role[] = ['admin', 'ops'];

export const MENU_NODES: MenuNode[] = [
  { key: '/dashboard', label: '总览驾驶舱', icon: <DashboardOutlined />, group: '工作台', roles: ALL },
  { key: '/tasks', label: '传输任务', icon: <SwapOutlined />, group: '传输管理', roles: ALL },
  { key: '/channels', label: '数据通道', icon: <ThunderboltOutlined />, group: '传输管理', roles: ALL },
  { key: '/policies', label: '优化策略', icon: <SlidersOutlined />, group: '传输管理', roles: ALL },
  { key: '/nodes', label: '云端节点', icon: <CloudServerOutlined />, group: '资源管理', roles: ALL },
  { key: '/workspaces', label: '协同空间', icon: <TeamOutlined />, group: '资源管理', roles: ALL },
  { key: '/monitor', label: '实时监控', icon: <MonitorOutlined />, group: '运维监控', roles: ALL },
  { key: '/alerts', label: '告警中心', icon: <AlertOutlined />, group: '运维监控', roles: ALL },
  { key: '/reports', label: '报表与成本', icon: <BarChartOutlined />, group: '运维监控', roles: ALL },
  { key: '/security/audit', label: '审计日志', icon: <FileSearchOutlined />, group: '安全合规', roles: ADMIN_OPS },
  { key: '/security/sensitive', label: '敏感数据', icon: <DatabaseOutlined />, group: '安全合规', roles: ADMIN_OPS },
  { key: '/security/access', label: '加密与访问', icon: <SafetyCertificateOutlined />, group: '安全合规', roles: ADMIN_OPS },
  { key: '/settings/users', label: '用户与角色', icon: <UserOutlined />, group: '系统设置', roles: ADMIN },
  { key: '/settings/notifications', label: '通知设置', icon: <BellOutlined />, group: '系统设置', roles: ADMIN },
  { key: '/settings/params', label: '系统参数', icon: <SettingOutlined />, group: '系统设置', roles: ADMIN },
  { key: '/settings/api-keys', label: 'API 密钥', icon: <KeyOutlined />, group: '系统设置', roles: ADMIN },
];

export const GROUP_ORDER = ['工作台', '传输管理', '资源管理', '运维监控', '安全合规', '系统设置'];

export function menuForRole(role: Role): MenuNode[] {
  return MENU_NODES.filter((m) => m.roles.includes(role));
}

export function selectedKey(pathname: string): string {
  const matched = MENU_NODES.filter((m) => pathname === m.key || pathname.startsWith(`${m.key}/`)).sort(
    (a, b) => b.key.length - a.key.length,
  );
  return matched[0]?.key ?? '/dashboard';
}

const TITLES: Record<string, string> = {
  '/dashboard': '总览驾驶舱',
  '/tasks': '传输任务',
  '/tasks/new': '新建传输任务',
  '/channels': '数据通道',
  '/policies': '优化策略',
  '/policies/new': '新建优化策略',
  '/nodes': '云端节点',
  '/workspaces': '协同空间',
  '/monitor': '实时监控',
  '/alerts': '告警中心',
  '/reports': '报表与成本',
  '/security/audit': '审计日志',
  '/security/sensitive': '敏感数据',
  '/security/access': '加密与访问控制',
  '/settings/users': '用户与角色',
  '/settings/notifications': '通知设置',
  '/settings/params': '系统参数',
  '/settings/api-keys': 'API 密钥',
};

export function breadcrumbOf(pathname: string): { title: string; path?: string }[] {
  const items: { title: string; path?: string }[] = [{ title: '首页', path: '/dashboard' }];
  if (pathname === '/dashboard') return [{ title: '总览驾驶舱' }];
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'tasks' && parts[1] && parts[1] !== 'new') {
    items.push({ title: '传输任务', path: '/tasks' }, { title: '任务详情' });
    return items;
  }
  if (parts[0] === 'workspaces' && parts[1]) {
    items.push({ title: '协同空间', path: '/workspaces' }, { title: '空间详情' });
    return items;
  }
  if (parts[0] === 'policies' && parts[1] === 'new') {
    items.push({ title: '优化策略', path: '/policies' }, { title: '新建策略' });
    return items;
  }
  if (parts[0] === 'policies' && parts[1]) {
    items.push({ title: '优化策略', path: '/policies' }, { title: '编辑策略' });
    return items;
  }
  const title = TITLES[pathname];
  if (title) items.push({ title });
  return items;
}
