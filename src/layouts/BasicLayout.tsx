import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Drawer,
  Dropdown,
  Input,
  List,
  Menu,
  Modal,
  Tag,
  Tooltip,
  type MenuProps,
} from 'antd';
import {
  BellOutlined,
  DownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
  SwapOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { MENU } from '../constants/menu';
import { useUiStore, ROLE_USER, type Role } from '../store/uiStore';
import { useDataStore } from '../store/dataStore';
import { NODES, DATASETS, JOBS } from '../mock/seed';
import { relTime } from '../utils/format';
import { StatusTag, UserAvatar } from '../components/base';
import { ALERT_LEVEL } from '../constants/dict';

const ROLE_LABEL: Record<Role, string> = { admin: '管理员', operator: '操作员', viewer: '访客' };

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggleCollapsed, theme, toggleTheme, notifications, markAllRead, role, setRole } =
    useUiStore();
  const tick = useDataStore((s) => s.tick);
  const jobs = useDataStore((s) => s.jobs);
  const [openKeys, setOpenKeys] = useState<string[]>(['transfer']);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const selectedKey = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/jobs/') && p !== '/jobs/new') return '/jobs';
    if (p.startsWith('/nodes/')) return '/nodes';
    return p;
  }, [location.pathname]);

  const groupKey = useMemo(
    () => MENU.find((m) => m.children?.some((c) => c.key === selectedKey))?.key,
    [selectedKey],
  );

  const crumb = useMemo(() => {
    for (const m of MENU) {
      if (m.key === selectedKey) return [m.label];
      const c = m.children?.find((x) => x.key === selectedKey);
      if (c) return [m.label, c.label];
    }
    if (selectedKey.startsWith('/jobs/')) return ['传输任务', '任务详情'];
    if (selectedKey.startsWith('/nodes/')) return ['链路与节点', '节点详情'];
    if (selectedKey.startsWith('/profile')) return ['个人中心'];
    return ['总览'];
  }, [selectedKey]);

  useEffect(() => {
    if (groupKey) setOpenKeys((prev) => (prev.includes(groupKey) ? prev : [...prev, groupKey]));
  }, [groupKey]);

  useEffect(() => {
    const timer = setInterval(() => tick(), 5000);
    return () => clearInterval(timer);
  }, [tick]);

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

  const unread = notifications.filter((n) => !n.read).length;
  const user = ROLE_USER[role];

  const searchResult = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return { jobs: [], nodes: [], datasets: [] };
    return {
      jobs: jobs.filter((j) => j.name.toLowerCase().includes(k) || j.id.toLowerCase().includes(k)).slice(0, 5),
      nodes: NODES.filter((n) => n.name.toLowerCase().includes(k) || n.id.toLowerCase().includes(k)).slice(0, 3),
      datasets: DATASETS.filter((d) => d.name.toLowerCase().includes(k)).slice(0, 3),
    };
  }, [keyword, jobs]);

  const go = (path: string) => {
    setSearchOpen(false);
    setKeyword('');
    navigate(path);
  };

  return (
    <div className="app-shell">
      <aside className="app-sider" style={{ width: collapsed ? 64 : 224 }}>
        <div className="sider-logo" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <span className="sider-logo-mark">CF</span>
          {!collapsed && (
            <div>
              <div className="sider-logo-text">CloudFlow</div>
              <div className="sider-logo-sub">数据云端协同优化传输平台</div>
            </div>
          )}
        </div>
        <div className="sider-menu">
          <Menu
            theme="dark"
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[selectedKey]}
            openKeys={collapsed ? undefined : openKeys}
            onOpenChange={(keys) => setOpenKeys(keys as string[])}
            onClick={({ key }) => navigate(key)}
            items={MENU as unknown as MenuProps['items']}
            style={{ background: 'transparent', borderInlineEnd: 'none' }}
          />
        </div>
        {!collapsed && <div className="sider-footer">v2.4.1 · 构建 20261019</div>}
      </aside>

      <div className="main-area">
        <header className="app-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
            />
            <Breadcrumb
              items={[
                { title: <Link to="/dashboard">首页</Link> },
                ...crumb.map((c) => ({ title: c })),
              ]}
            />
          </div>
          <div className="header-right">
            <Button
              type="text"
              icon={<SearchOutlined />}
              onClick={() => setSearchOpen(true)}
              style={{ color: 'var(--text-2)' }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>⌘K</span>
            </Button>
            <span className="env-tag">生产</span>
            <Tooltip title={theme === 'light' ? '切换暗色主题' : '切换亮色主题'}>
              <Button
                type="text"
                icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
                onClick={toggleTheme}
              />
            </Tooltip>
            <Badge count={unread} size="small" offset={[-4, 4]}>
              <Button type="text" icon={<BellOutlined />} onClick={() => setBellOpen(true)} />
            </Badge>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
                  { type: 'divider' },
                  {
                    key: 'role',
                    label: '切换角色（演示）',
                    children: [
                      { key: 'admin', label: '管理员 · 全部权限' },
                      { key: 'operator', label: '操作员 · 无系统管理' },
                      { key: 'viewer', label: '访客 · 只读' },
                    ],
                  },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
                ],
                onClick: ({ key }) => {
                  if (key === 'profile') navigate('/profile');
                  if (key === 'admin' || key === 'operator' || key === 'viewer') setRole(key);
                },
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '0 4px' }}>
                <UserAvatar name={user.name} color={user.color} size={28} />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-1)' }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{ROLE_LABEL[role]}</div>
                </div>
                <DownOutlined style={{ fontSize: 10, color: 'var(--text-3)' }} />
              </div>
            </Dropdown>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>

      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>通知中心</span>
            <Button type="link" size="small" onClick={markAllRead}>
              全部已读
            </Button>
          </div>
        }
        open={bellOpen}
        onClose={() => setBellOpen(false)}
        width={380}
      >
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item style={{ alignItems: 'flex-start', padding: '12px 0' }}>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: item.read ? 400 : 600 }}>{item.title}</span>
                  <StatusTag
                    label={ALERT_LEVEL[item.level].label}
                    color={ALERT_LEVEL[item.level].color}
                    dot={false}
                  />
                </div>
                <div className="muted" style={{ marginTop: 4 }}>
                  {item.desc}
                </div>
                <div className="muted" style={{ marginTop: 6 }}>
                  {relTime(item.time)}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Drawer>

      <Modal
        open={searchOpen}
        onCancel={() => setSearchOpen(false)}
        footer={null}
        closable={false}
        width={620}
        styles={{ body: { paddingTop: 8 } }}
      >
        <Input
          autoFocus
          size="large"
          variant="borderless"
          placeholder="搜索任务、节点、数据集…"
          prefix={<SearchOutlined style={{ color: 'var(--text-3)' }} />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <div style={{ maxHeight: 420, overflowY: 'auto', marginTop: 8 }}>
          {!keyword && <div className="muted" style={{ padding: '24px 8px' }}>输入关键词开始搜索，支持任务名 / 节点名 / 数据集名</div>}
          {keyword && (
            <>
              {searchResult.jobs.length > 0 && (
                <>
                  <div className="muted" style={{ padding: '8px 8px 4px' }}>传输任务</div>
                  {searchResult.jobs.map((j) => (
                    <div key={j.id} className="list-row" style={{ cursor: 'pointer', padding: '8px' }} onClick={() => go(`/jobs/${j.id}`)}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <SwapOutlined style={{ color: 'var(--primary)' }} />
                        <div>
                          <div style={{ fontSize: 13 }}>{j.name}</div>
                          <div className="muted">{j.id} · {j.source.region} → {j.target.region}</div>
                        </div>
                      </div>
                      <span className="chip">{j.status}</span>
                    </div>
                  ))}
                </>
              )}
              {searchResult.nodes.length > 0 && (
                <>
                  <div className="muted" style={{ padding: '8px 8px 4px' }}>节点</div>
                  {searchResult.nodes.map((n) => (
                    <div key={n.id} className="list-row" style={{ cursor: 'pointer', padding: '8px' }} onClick={() => go(`/nodes/${n.id}`)}>
                      <div>
                        <div style={{ fontSize: 13 }}>{n.name}</div>
                        <div className="muted">{n.id} · {n.region}</div>
                      </div>
                      <Tag bordered={false}>{n.provider}</Tag>
                    </div>
                  ))}
                </>
              )}
              {searchResult.datasets.length > 0 && (
                <>
                  <div className="muted" style={{ padding: '8px 8px 4px' }}>数据集</div>
                  {searchResult.datasets.map((d) => (
                    <div key={d.id} className="list-row" style={{ cursor: 'pointer', padding: '8px' }} onClick={() => go('/catalog')}>
                      <div>
                        <div style={{ fontSize: 13 }}>{d.name}</div>
                        <div className="muted">{d.id} · {d.domain}</div>
                      </div>
                      <Tag bordered={false}>{d.classification}</Tag>
                    </div>
                  ))}
                </>
              )}
              {searchResult.jobs.length + searchResult.nodes.length + searchResult.datasets.length === 0 && (
                <div className="muted" style={{ padding: '24px 8px' }}>没有匹配结果</div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
