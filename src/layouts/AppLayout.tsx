import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { App, Avatar, Badge, Dropdown, Input, Popover, Tooltip } from 'antd';
import {
  ApiOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  CloudUploadOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PartitionOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useAppStore, useCurrentUser } from '@/stores/app';
import { useTaskStore, startTaskEngine } from '@/stores/tasks';
import { USERS } from '@/mock/seed/people';
import { resetDemoData } from '@/mock/db';
import { fmtRelative } from '@/utils/format';

const NAV = [
  {
    group: '工作台',
    items: [{ key: '/', label: '概览', icon: <DashboardOutlined /> }],
  },
  {
    group: '内容生产',
    items: [
      { key: '/assets', label: '媒体资产', icon: <VideoCameraOutlined /> },
      { key: '/upload', label: '上传中心', icon: <CloudUploadOutlined /> },
      { key: '/tools', label: '智能工具集', icon: <AppstoreOutlined /> },
    ],
  },
  {
    group: '流程自动化',
    items: [
      { key: '/pipelines', label: '流水线', icon: <PartitionOutlined /> },
      { key: '/templates', label: '模板市场', icon: <ShopOutlined /> },
    ],
  },
  {
    group: '运行监控',
    items: [
      { key: '/tasks', label: '任务中心', icon: <ClockCircleOutlined />, badgeKey: 'running' },
    ],
  },
  {
    group: '服务与治理',
    items: [
      { key: '/usage', label: '用量与计费', icon: <BarChartOutlined /> },
      { key: '/developer', label: 'API 与技术服务', icon: <ApiOutlined /> },
      { key: '/team', label: '团队与权限', icon: <TeamOutlined /> },
      { key: '/settings', label: '系统设置', icon: <SettingOutlined /> },
      { key: '/audit', label: '审计日志', icon: <FileSearchOutlined /> },
    ],
  },
];

const TITLES: [RegExp, string][] = [
  [/^\/$/, '概览'],
  [/^\/assets\/.+/, '资产详情'],
  [/^\/assets/, '媒体资产'],
  [/^\/upload/, '上传中心'],
  [/^\/tools\/subtitle/, '字幕工坊'],
  [/^\/tools\/asr/, '语音转写'],
  [/^\/tools\/enhance/, '画质增强'],
  [/^\/tools\/audio/, '音频处理'],
  [/^\/tools\/tts/, '语音合成'],
  [/^\/tools\/translate/, '多语译配'],
  [/^\/tools\/review/, '内容审核'],
  [/^\/tools\/insight/, '智能理解'],
  [/^\/tools/, '智能工具集'],
  [/^\/pipelines\/.+/, '流水线编排'],
  [/^\/pipelines/, '流水线'],
  [/^\/tasks\/.+/, '任务详情'],
  [/^\/tasks/, '任务中心'],
  [/^\/templates/, '模板市场'],
  [/^\/usage/, '用量与计费'],
  [/^\/developer/, 'API 与技术服务'],
  [/^\/team/, '团队与权限'],
  [/^\/settings/, '系统设置'],
  [/^\/audit/, '审计日志'],
];

export default function AppLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const { message, notification } = App.useApp();
  const { collapsed, toggleSider, theme, toggleTheme, notifications, markAllRead, currentUserId, setCurrentUser } = useAppStore();
  const user = useCurrentUser();
  const runningCount = useTaskStore((s) => s.tasks.filter((t) => t.status === 'running').length);
  const lastEvent = useTaskStore((s) => s.lastEvent);
  const clearEvent = useTaskStore((s) => s.clearEvent);

  useEffect(() => startTaskEngine(), []);

  useEffect(() => {
    if (!lastEvent) return;
    notification[lastEvent.status === 'failed' ? 'error' : 'success']({
      message: lastEvent.status === 'failed' ? '任务失败' : '任务完成',
      description: `${lastEvent.name} · ${lastEvent.message}`,
      placement: 'bottomRight',
      duration: 3.5,
    });
    clearEvent();
  }, [lastEvent, notification, clearEvent]);

  const title = useMemo(() => TITLES.find(([re]) => re.test(loc.pathname))?.[1] || '概览', [loc.pathname]);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="app-shell">
      <aside className={`sider ${collapsed ? 'collapsed' : ''}`}>
        <div className="logo">
          <div className="logo-mark">MF</div>
          {!collapsed && (
            <div className="logo-text">
              <strong>MediaForge</strong>
              <span>智媒工场 · 企业版</span>
            </div>
          )}
        </div>
        <nav className="nav">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="nav-group-title">{g.group}</div>
              {g.items.map((item) => {
                const active = item.key === '/' ? loc.pathname === '/' : loc.pathname.startsWith(item.key);
                return (
                  <div
                    key={item.key}
                    className={`nav-item ${active ? 'active' : ''}`}
                    onClick={() => nav(item.key)}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    <span className="label">{item.label}</span>
                    {item.badgeKey === 'running' && runningCount > 0 && <span className="nav-badge">{runningCount}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <Tooltip title={collapsed ? '展开导航' : '收起导航'}>
            <div className="topbar-icon" onClick={toggleSider}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          </Tooltip>
          <div className="crumb">
            MediaForge / <b>{title}</b>
          </div>
          <div className="spacer" />
          <Input
            size="small"
            allowClear
            prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
            placeholder="搜索素材、任务、流水线"
            style={{ width: 260, background: 'var(--bg-input)' }}
            onPressEnter={(e) => {
              const v = (e.target as HTMLInputElement).value.trim();
              if (v) nav(`/assets?kw=${encodeURIComponent(v)}`);
            }}
          />
          <Tooltip title={theme === 'dark' ? '切换浅色' : '切换深色'}>
            <div className="topbar-icon" onClick={toggleTheme}>
              <BulbOutlined />
            </div>
          </Tooltip>
          <Popover
            trigger="click"
            placement="bottomRight"
            arrow={false}
            content={
              <div style={{ width: 340 }}>
                <div className="row between" style={{ padding: '4px 4px 10px' }}>
                  <b style={{ fontSize: 13 }}>通知</b>
                  <a style={{ fontSize: 12 }} onClick={markAllRead}>
                    全部标为已读
                  </a>
                </div>
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '9px 10px',
                        borderRadius: 8,
                        marginBottom: 4,
                        background: n.read ? 'transparent' : 'var(--brand-soft)',
                      }}
                    >
                      <div className="row" style={{ gap: 6 }}>
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            background: n.type === 'error' ? 'var(--danger)' : n.type === 'success' ? 'var(--success)' : 'var(--brand)',
                          }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{n.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 2px 12px' }}>{n.desc}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 12 }}>{fmtRelative(n.time)}</div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <div className="topbar-icon">
              <Badge count={unread} size="small" offset={[2, -2]}>
                <BellOutlined />
              </Badge>
            </div>
          </Popover>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'who', label: <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{user.email}</span>, disabled: true },
                { type: 'divider' },
                ...USERS.slice(0, 6).map((u) => ({
                  key: u.id,
                  label: (
                    <span>
                      {u.name} · {u.role}
                      {u.id === currentUserId ? '（当前）' : ''}
                    </span>
                  ),
                })),
                { type: 'divider' },
                { key: 'reset', icon: <ReloadOutlined />, label: '重置演示数据' },
              ],
              onClick: ({ key }) => {
                if (key === 'reset') {
                  resetDemoData();
                  message.success('演示数据已重置，正在刷新…');
                  setTimeout(() => window.location.reload(), 600);
                  return;
                }
                if (key !== 'who') {
                  setCurrentUser(key);
                  const u = USERS.find((x) => x.id === key);
                  message.success(`已切换为 ${u?.name}（${u?.role}）`);
                }
              },
            }}
          >
            <div className="row clickable" style={{ gap: 8, padding: '0 2px' }}>
              <Avatar size={28} style={{ background: user.avatarColor, fontSize: 12 }}>
                {user.name.slice(0, 1)}
              </Avatar>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 12.5 }}>{user.name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{user.role}</div>
              </div>
            </div>
          </Dropdown>
        </header>
        <main className="content">
          <div className="content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
