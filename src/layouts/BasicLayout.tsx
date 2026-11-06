import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Breadcrumb,
  Drawer,
  Dropdown,
  Input,
  Layout,
  Menu,
  Modal,
  Tag,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  DownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { GROUP_ORDER, breadcrumbOf, menuForRole, selectedKey } from '../router/menu';
import { CHANNELS, regionShort } from '../mock/base';
import { TASKS } from '../mock/tasks';
import { WORKSPACES } from '../mock/workspaces';

const { Sider, Header, Content } = Layout;

interface SearchItem {
  key: string;
  title: string;
  desc: string;
  group: string;
  path: string;
}

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggleCollapsed, notifications, markAllRead } = useAppStore();
  const { role, name, logout, switchRole } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [notifyOpen, setNotifyOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const menuItems: MenuProps['items'] = useMemo(() => {
    const nodes = menuForRole(role);
    return GROUP_ORDER.map((group) => {
      const children = nodes.filter((n) => n.group === group);
      if (!children.length) return null;
      return {
        key: `group-${group}`,
        type: 'group' as const,
        label: group,
        children: children.map((n) => ({ key: n.key, icon: n.icon, label: n.label })),
      };
    }).filter(Boolean) as MenuProps['items'];
  }, [role]);

  const searchItems: SearchItem[] = useMemo(() => {
    const tasks = TASKS.slice(0, 20).map((t) => ({
      key: t.id,
      title: t.name,
      desc: `${t.id} · ${regionShort(t.source.region)} → ${regionShort(t.target.region)}`,
      group: '传输任务',
      path: `/tasks/${t.id}`,
    }));
    const channels = CHANNELS.map((c) => ({
      key: c.id,
      title: c.name,
      desc: `${c.id} · ${c.protocol} · ${c.bandwidthMbps} Mbps`,
      group: '数据通道',
      path: '/channels',
    }));
    const spaces = WORKSPACES.map((w) => ({
      key: w.id,
      title: w.name,
      desc: `${w.id} · ${w.datasetCount} 个数据集`,
      group: '协同空间',
      path: `/workspaces/${w.id}`,
    }));
    return [...tasks, ...channels, ...spaces];
  }, []);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return searchItems.slice(0, 8);
    const kw = keyword.trim().toLowerCase();
    return searchItems
      .filter((i) => i.title.toLowerCase().includes(kw) || i.desc.toLowerCase().includes(kw))
      .slice(0, 10);
  }, [keyword, searchItems]);

  const crumbs = breadcrumbOf(location.pathname);

  const roleMenu: MenuProps['items'] = [
    { key: 'admin', label: '平台管理员' },
    { key: 'ops', label: '运维工程师' },
    { key: 'member', label: '业务成员' },
  ];

  const userMenu: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { key: 'prefs', icon: <SettingOutlined />, label: '偏好设置' },
    { type: 'divider' },
    { key: 'role', label: `切换角色（当前：${role === 'admin' ? '管理员' : role === 'ops' ? '运维' : '成员'}）`, children: roleMenu },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const onUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
      return;
    }
    if (key === 'admin' || key === 'ops' || key === 'member') {
      switchRole(key);
      message.success('已切换角色，菜单与权限同步更新');
      navigate('/dashboard');
      return;
    }
    if (key === 'profile') message.info('个人信息面板在演示环境中为占位功能');
    if (key === 'prefs') navigate('/settings/notifications');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        className="sider-shell"
        width={232}
        collapsedWidth={64}
        collapsed={collapsed}
        trigger={null}
      >
        <div className="app-logo">
          <span className="app-logo-mark">D</span>
          {!collapsed ? (
            <span className="app-logo-text">
              云枢 DataRelay
              <small>数据协同传输平台</small>
            </span>
          ) : null}
        </div>
        <Menu
          className="app-menu"
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey(location.pathname)]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
        <div className="app-sider-footer">
          {collapsed ? (
            <span>v1.0</span>
          ) : (
            <>
              <div>
                <span className="pulse" />
                节点在线 14 / 16
              </div>
              <div style={{ marginTop: 4 }}>v1.0.0 · 演示环境</div>
            </>
          )}
        </div>
      </Sider>

      <Layout>
        <Header className="app-header">
          <div className="app-header-left">
            <span className="header-action" onClick={toggleCollapsed} title={collapsed ? '展开菜单' : '收起菜单'}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Breadcrumb
              items={crumbs.map((c) => ({
                title: c.path ? (
                  <span className="link" onClick={() => navigate(c.path!)}>
                    {c.title}
                  </span>
                ) : (
                  c.title
                ),
              }))}
              style={{ fontSize: 12.5 }}
            />
          </div>
          <div className="app-header-right">
            <div className="header-search" onClick={() => setSearchOpen(true)}>
              <SearchOutlined />
              <span>搜索任务、通道、空间</span>
              <kbd>⌘K</kbd>
            </div>
            <Badge count={unread} size="small" offset={[-2, 2]}>
              <span className="header-action" onClick={() => setNotifyOpen(true)} title="通知">
                <BellOutlined />
              </span>
            </Badge>
            <span
              className="header-action"
              title="帮助中心"
              onClick={() => message.info('帮助文档：docs.xinglan.tech/datarelay')}
            >
              <QuestionCircleOutlined />
            </span>
            <Dropdown menu={{ items: userMenu, onClick: onUserMenuClick }} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingLeft: 8 }}>
                <Avatar size={28} style={{ background: '#1668FF', fontSize: 12 }}>
                  {name.slice(0, 1)}
                </Avatar>
                <span style={{ fontSize: 13, color: '#0F172A' }}>{name}</span>
                <DownOutlined style={{ fontSize: 9, color: '#8A99B0' }} />
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content>
          <Outlet />
        </Content>
      </Layout>

      <Modal
        open={searchOpen}
        onCancel={() => setSearchOpen(false)}
        footer={null}
        width={580}
        styles={{ body: { padding: 0 }, header: { display: 'none' } }}
        closable={false}
        destroyOnClose
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEF2F8' }}>
          <Input
            autoFocus
            size="large"
            variant="borderless"
            prefix={<SearchOutlined style={{ color: '#8A99B0' }} />}
            placeholder="搜索任务名称、任务 ID、通道、协同空间…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => {
              if (filtered[0]) {
                navigate(filtered[0].path);
                setSearchOpen(false);
                setKeyword('');
              }
            }}
          />
        </div>
        <div style={{ maxHeight: 380, overflow: 'auto', padding: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#8A99B0', fontSize: 13 }}>没有匹配的结果</div>
          ) : (
            filtered.map((item) => (
              <div
                key={`${item.group}-${item.key}`}
                onClick={() => {
                  navigate(item.path);
                  setSearchOpen(false);
                  setKeyword('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F5F8FE';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: '#EAF1FF',
                    color: '#1668FF',
                    display: 'grid',
                    placeItems: 'center',
                    flex: '0 0 auto',
                  }}
                >
                  {item.group === '传输任务' ? <SwapOutlined /> : item.group === '数据通道' ? <ThunderboltOutlined /> : <UserOutlined />}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 2 }}>{item.desc}</div>
                </div>
                <Tag style={{ marginInlineEnd: 0, fontSize: 10.5 }}>{item.group}</Tag>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid #EEF2F8', fontSize: 11, color: '#8A99B0' }}>
          回车跳转 · Esc 关闭 · 共 {searchItems.length} 条可检索记录
        </div>
      </Modal>

      <Drawer
        title={
          <div className="flex-between">
            <span>通知中心</span>
            <span className="link" style={{ fontSize: 12, fontWeight: 400 }} onClick={markAllRead}>
              全部标为已读
            </span>
          </div>
        }
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        width={400}
      >
        {notifications.map((n) => (
          <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: '1px dashed #EEF2F8' }}>
            <span
              className="dot"
              style={{ marginTop: 7, background: n.type === 'alert' ? '#EF4444' : n.type === 'task' ? '#00B894' : '#1668FF' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 500 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: '#8A99B0', marginTop: 3, lineHeight: 1.6 }}>{n.desc}</div>
              <div style={{ fontSize: 11, color: '#B0BCCD', marginTop: 5 }}>{n.time}</div>
            </div>
            {!n.read ? <span className="dot" style={{ background: '#1668FF', marginTop: 7 }} /> : null}
          </div>
        ))}
      </Drawer>
    </Layout>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
