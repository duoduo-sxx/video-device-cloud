import React, { useMemo, useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Input, Badge, Space, Switch, App as AntApp, theme as antdTheme } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined, MessageOutlined, ExperimentOutlined, AudioOutlined, BookOutlined,
  RobotOutlined, BarChartOutlined, LineChartOutlined, DesktopOutlined, AuditOutlined,
  SettingOutlined, UserOutlined, BellOutlined, SearchOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  SunOutlined, MoonOutlined, LogoutOutlined, RollbackOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/app';
import { MENUS, ROLE_LABELS, ROLE_MENUS } from '@/constants';
import { resetDB } from '@/mock/db';
import type { MenuItem } from '@/constants';

const ICONS: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />, MessageOutlined: <MessageOutlined />,
  ExperimentOutlined: <ExperimentOutlined />, AudioOutlined: <AudioOutlined />,
  BookOutlined: <BookOutlined />, RobotOutlined: <RobotOutlined />,
  BarChartOutlined: <BarChartOutlined />, LineChartOutlined: <LineChartOutlined />,
  DesktopOutlined: <DesktopOutlined />, AuditOutlined: <AuditOutlined />,
  SettingOutlined: <SettingOutlined />,
};

const BREADCRUMB_LABELS: Record<string, string> = Object.fromEntries(
  MENUS.flatMap((m) => [{ [m.key]: m.label }, ...(m.children ?? []).map((c) => [c.key, c.label])]).flat().map(Object.entries),
);

const PAGE_PATHS: Record<string, string> = {
  dashboard: '/', chat: '/chat', nlp: '/nlp', voice: '/voice', knowledge: '/knowledge',
  bot: '/bot', reports: '/analytics/reports', bigscreen: '/analytics/bigscreen',
  quality: '/quality', system: '/system',
};

export const MainLayout: React.FC = () => {
  const { Header, Sider, Content } = Layout;
  const { user, theme, collapsed, toggleTheme, toggleCollapsed, logout } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntApp.useApp();
  const [searchValue, setSearchValue] = useState('');
  const allowed = user ? ROLE_MENUS[user.role] : [];

  const menuItems = useMemo<MenuProps['items']>(() => {
    const build = (items: MenuItem[]): MenuProps['items'] =>
      items
        .filter((it) => allowed.includes(it.key))
        .map((it) => ({
          key: it.key,
          icon: ICONS[it.icon],
          label: it.label,
          children: it.children ? build(it.children) : undefined,
          onClick: () => it.path && navigate(it.path),
        }));
    return build(MENUS);
  }, [allowed, navigate]);

  const selectedKey = useMemo(() => {
    const p = location.pathname;
    const entry = Object.entries(PAGE_PATHS).find(([, path]) => path === p);
    return entry?.[0] ?? 'dashboard';
  }, [location.pathname]);

  const openKeys = useMemo(() => {
    const m = MENUS.find((x) => x.children?.some((c) => c.key === selectedKey));
    return m ? [m.key] : [];
  }, [selectedKey]);

  const searchOptions = useMemo(() => {
    const kw = searchValue.trim().toLowerCase();
    if (!kw) return [];
    const opts: { value: string; label: string }[] = [];
    const walk = (items: MenuItem[]) =>
      items.forEach((it) => {
        if (it.label.toLowerCase().includes(kw)) opts.push({ value: `menu:${it.key}`, label: `📄 页面：${it.label}` });
        if (it.children) walk(it.children);
      });
    walk(MENUS);
    return opts;
  }, [searchValue]);

  const handleReset = () => {
    resetDB();
    localStorage.removeItem('iiup_nlp_history');
    message.success('演示数据已重置，页面即将刷新');
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} trigger={null} theme={theme === 'dark' ? 'dark' : 'light'} width={220}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, background: '#2563EB' }}>
          {collapsed ? 'II' : 'IIUP 智能交互平台'}
        </div>
        <Menu
          theme={theme === 'dark' ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: theme === 'dark' ? '#1f1f1f' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
          }}
        >
          <Space size={16}>
            <span onClick={toggleCollapsed} style={{ cursor: 'pointer', fontSize: 16 }}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Input
              allowClear prefix={<SearchOutlined />} placeholder="全局搜索：菜单、知识条目…" style={{ width: 300 }}
              value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={() => {
                if (searchOptions.length > 0) {
                  const v = searchOptions[0].value;
                  const key = v.split(':')[1];
                  navigate(PAGE_PATHS[key] ?? '/');
                  setSearchValue('');
                }
              }}
            />
          </Space>
          <Space size={20}>
            <Switch
              checkedChildren={<MoonOutlined />} unCheckedChildren={<SunOutlined />}
              checked={theme === 'dark'} onChange={toggleTheme}
            />
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: 18 }} />
            </Badge>
            <Dropdown
              menu={{
                items: [
                  { key: 'role', label: `角色：${user ? ROLE_LABELS[user.role] : ''}`, disabled: true },
                  { key: 'reset', icon: <RollbackOutlined />, label: '重置演示数据', onClick: handleReset },
                  { type: 'divider' as const },
                  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } },
                ],
              }}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ background: '#2563EB' }} icon={<UserOutlined />} />
                <span>{user?.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 16, minHeight: 280 }}>
          <div style={{ fontSize: 12, color: theme === 'dark' ? '#999' : '#888', marginBottom: 8 }}>
            {BREADCRUMB_LABELS[selectedKey] ?? '工作台'}
          </div>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
