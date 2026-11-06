import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Dropdown, Input, Modal, Tooltip, message } from 'antd';
import {
  AlertOutlined,
  BellOutlined,
  CloseOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DownOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  FundProjectionScreenOutlined,
  HddOutlined,
  HeartOutlined,
  LineChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlayCircleOutlined,
  ProjectOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/app';
import { ROLE_LABEL } from '../constants/dict';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

const MENU: MenuGroup[] = [
  { group: '概览', items: [{ key: '/dashboard', label: '总览驾驶舱', icon: <DashboardOutlined /> }] },
  {
    group: '资产',
    items: [
      { key: '/devices', label: '设备台账', icon: <HddOutlined /> },
      { key: '/stations', label: '台位与工装', icon: <ToolOutlined /> },
    ],
  },
  {
    group: '测试与标定',
    items: [
      { key: '/acquisition', label: '实时采集监控', icon: <ThunderboltOutlined /> },
      { key: '/calibration', label: '标定与辨识', icon: <ExperimentOutlined /> },
      { key: '/modeling', label: '误差建模', icon: <FundProjectionScreenOutlined /> },
    ],
  },
  {
    group: '数据洞察',
    items: [
      { key: '/analysis', label: '数据分析', icon: <LineChartOutlined /> },
      { key: '/replay', label: '数据回放', icon: <PlayCircleOutlined /> },
      { key: '/trajectory', label: '姿态与轨迹', icon: <EnvironmentOutlined /> },
    ],
  },
  {
    group: '运行管理',
    items: [
      { key: '/tasks', label: '任务与工单', icon: <ProjectOutlined /> },
      { key: '/alarms', label: '告警中心', icon: <AlertOutlined /> },
      { key: '/health', label: '健康评估', icon: <HeartOutlined /> },
      { key: '/reports', label: '报告中心', icon: <FileTextOutlined /> },
    ],
  },
  {
    group: '服务与系统',
    items: [
      { key: '/services', label: '技术服务', icon: <CustomerServiceOutlined /> },
      { key: '/system', label: '系统管理', icon: <SettingOutlined /> },
    ],
  },
];

const ALL_ITEMS = MENU.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));

function labelOf(path: string): string {
  const exact = ALL_ITEMS.find((item) => item.key === path);
  if (exact) return exact.label;
  if (path.startsWith('/devices/')) return '设备详情';
  if (path.endsWith('/result')) return '标定结果';
  if (path.startsWith('/calibration/')) return '标定执行';
  return '页面';
}

export function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, collapsed, toggleCollapsed, logout, tabKeys, pushTab, removeTab } = useAppStore();
  const [helpOpen, setHelpOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const current = ALL_ITEMS.find((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`));

  useEffect(() => {
    pushTab(location.pathname);
  }, [location.pathname, pushTab]);

  const crumbs = useMemo(() => {
    if (location.pathname.startsWith('/devices/')) return ['资产', '设备台账', '设备详情'];
    if (location.pathname.startsWith('/calibration/') && location.pathname.endsWith('/result'))
      return ['测试与标定', '标定与辨识', '标定结果'];
    if (location.pathname.startsWith('/calibration/')) return ['测试与标定', '标定与辨识', '标定执行'];
    return [current?.group ?? '概览', current?.label ?? '总览驾驶舱'];
  }, [current, location.pathname]);

  const closeTab = (key: string) => {
    if (tabKeys.length <= 1) return;
    removeTab(key);
    if (key === location.pathname) {
      const rest = tabKeys.filter((k) => k !== key);
      navigate(rest[rest.length - 1] ?? '/dashboard');
    }
  };

  const onSearch = () => {
    if (!keyword.trim()) return;
    navigate(`/devices?kw=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <div className="app-shell">
      <aside className={collapsed ? 'app-sider collapsed' : 'app-sider'}>
        <div className="app-logo">
          <div className="app-logo-mark">IS</div>
          {!collapsed ? (
            <div className="app-logo-text">
              <div className="app-logo-title">惯性参数感知系统</div>
              <div className="app-logo-sub">InertialSense</div>
            </div>
          ) : null}
        </div>
        <nav className="app-menu">
          {MENU.map((group) => (
            <div key={group.group}>
              {!collapsed ? <div className="app-menu-group">{group.group}</div> : null}
              {group.items.map((item) => {
                const active = location.pathname === item.key || location.pathname.startsWith(`${item.key}/`);
                return (
                  <Tooltip key={item.key} title={collapsed ? item.label : ''} placement="right">
                    <div
                      className={active ? 'app-menu-item active' : 'app-menu-item'}
                      onClick={() => navigate(item.key)}
                      role="button"
                      tabIndex={0}
                    >
                      {item.icon}
                      {!collapsed ? <span>{item.label}</span> : null}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </nav>
        {!collapsed ? (
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#5d7189' }}>
            v1.0.0 · 2026-10
          </div>
        ) : null}
      </aside>

      <main className="app-main">
        <header className="app-header">
          <Button
            type="text"
            size="small"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
          />
          <div className="app-crumb">
            {crumbs.map((crumb, index) => (
              <span key={crumb}>
                {index > 0 ? <span style={{ margin: '0 6px', color: '#c3ccda' }}>/</span> : null}
                {index === crumbs.length - 1 ? <strong>{crumb}</strong> : crumb}
              </span>
            ))}
          </div>
          <div className="app-header-spacer" />
          <Input.Search
            className="app-search"
            placeholder="搜索设备编号 / 型号"
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={onSearch}
          />
          <Tooltip title="帮助与术语表">
            <Button type="text" icon={<QuestionCircleOutlined />} onClick={() => setHelpOpen(true)} />
          </Tooltip>
          <Tooltip title="消息中心">
            <Badge count={3} size="small">
              <Button type="text" icon={<BellOutlined />} onClick={() => navigate('/alarms')} />
            </Badge>
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                { key: 'name', label: `${user?.name ?? '用户'} · ${ROLE_LABEL[user?.role ?? 'GUEST']}`, disabled: true },
                { type: 'divider' },
                { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: () => { logout(); navigate('/login'); } },
              ],
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size={28} style={{ background: user?.avatarColor ?? '#1668dc', fontSize: 12 }}>
                {user?.name?.slice(0, 1) ?? <UserOutlined />}
              </Avatar>
              <span style={{ fontSize: 13 }}>{user?.name}</span>
              <DownOutlined style={{ fontSize: 10, color: '#8a94a6' }} />
            </div>
          </Dropdown>
        </header>

        <div className="app-tabs">
          {tabKeys.map((key) => (
            <span
              key={key}
              className={key === location.pathname ? 'app-tab active' : 'app-tab'}
              onClick={() => navigate(key)}
            >
              {labelOf(key)}
              {tabKeys.length > 1 ? (
                <CloseOutlined
                  className="close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(key);
                  }}
                />
              ) : null}
            </span>
          ))}
        </div>

        <div className="app-content">
          <Outlet />
        </div>
      </main>

      <Modal open={helpOpen} title="帮助与术语速查" footer={null} onCancel={() => setHelpOpen(false)} width={620}>
        <div style={{ fontSize: 13, lineHeight: 2 }}>
          <p><strong>零偏</strong>：输入为零时的输出，单位 °/h。设备静止时三轴输出的均值。</p>
          <p><strong>零偏稳定性</strong>：规定时间内零偏输出的标准差（1σ），衡量长期稳定度。</p>
          <p><strong>标度因数</strong>：输出增量与输入增量之比，理想值 1；非线性度用 ppm 表示。</p>
          <p><strong>安装误差</strong>：敏感轴与载体轴的失准角，页面以角秒（″）展示。</p>
          <p><strong>ARW</strong>：角度随机游走，Allan 方差 −1/2 斜率段对应值，单位 °/√h。</p>
          <p style={{ color: '#8a94a6' }}>快捷键：⌘K 聚焦搜索；Esc 关闭弹窗。</p>
        </div>
        <Button
          style={{ marginTop: 12 }}
          onClick={() => {
            setHelpOpen(false);
            message.success('已打开快捷键说明');
          }}
        >
          知道了
        </Button>
      </Modal>
    </div>
  );
}
