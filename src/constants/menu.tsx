import type { ReactNode } from 'react';
import {
  AlertOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  DatabaseOutlined,
  NodeIndexOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SwapOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

export interface MenuNode {
  key: string;
  label: string;
  icon?: ReactNode;
  children?: MenuNode[];
}

export const MENU: MenuNode[] = [
  { key: '/dashboard', label: '总览', icon: <DashboardOutlined /> },
  {
    key: 'transfer',
    label: '传输任务',
    icon: <SwapOutlined />,
    children: [
      { key: '/jobs', label: '任务列表' },
      { key: '/jobs/new', label: '新建任务' },
    ],
  },
  {
    key: 'network',
    label: '链路与节点',
    icon: <ApartmentOutlined />,
    children: [
      { key: '/nodes', label: '节点管理' },
      { key: '/links', label: '链路监控' },
      { key: '/topology', label: '网络拓扑' },
    ],
  },
  {
    key: 'optimization',
    label: '优化引擎',
    icon: <ThunderboltOutlined />,
    children: [
      { key: '/optimization/policies', label: '优化策略' },
      { key: '/optimization/models', label: '模型与实验' },
      { key: '/optimization/benefit', label: '收益分析' },
    ],
  },
  {
    key: 'collab',
    label: '协同空间',
    icon: <TeamOutlined />,
    children: [
      { key: '/collab/spaces', label: '空间与成员' },
      { key: '/collab/approvals', label: '审批中心' },
    ],
  },
  { key: '/catalog', label: '数据资产', icon: <DatabaseOutlined /> },
  {
    key: 'monitor',
    label: '监控告警',
    icon: <AlertOutlined />,
    children: [
      { key: '/alerts', label: '告警中心' },
      { key: '/alerts/rules', label: '告警规则' },
    ],
  },
  { key: '/reports', label: '报表分析', icon: <BarChartOutlined /> },
  {
    key: 'admin',
    label: '系统管理',
    icon: <SettingOutlined />,
    children: [
      { key: '/admin/users', label: '用户与角色' },
      { key: '/admin/connectors', label: '连接器管理' },
      { key: '/admin/audit', label: '审计日志' },
      { key: '/admin/settings', label: '系统设置' },
    ],
  },
];

export const FLAT_MENU: { key: string; label: string; group?: string }[] = MENU.flatMap((m) =>
  m.children
    ? m.children.map((c) => ({ key: c.key, label: c.label, group: m.label }))
    : [{ key: m.key, label: m.label }],
);

export const PAGE_ICONS: Record<string, ReactNode> = {
  '/dashboard': <DashboardOutlined />,
  '/jobs': <SwapOutlined />,
  '/nodes': <CloudServerOutlined />,
  '/links': <NodeIndexOutlined />,
  '/topology': <DeploymentUnitOutlined />,
  '/optimization/policies': <ThunderboltOutlined />,
  '/optimization/models': <AppstoreOutlined />,
  '/collab/spaces': <TeamOutlined />,
  '/collab/approvals': <SafetyCertificateOutlined />,
  '/catalog': <DatabaseOutlined />,
  '/alerts': <AlertOutlined />,
  '/reports': <BarChartOutlined />,
};
