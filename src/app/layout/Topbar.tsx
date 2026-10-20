import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Drawer, Dropdown, Empty, List, Tag, Tooltip } from 'antd';
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  Check,
} from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { demoAccounts, useAuthStore } from '@/stores/authStore';
import { ROLES } from '@/types/enums';
import { Avatar } from '@/components/ui';
import { projects, notifications as allNotifications, tickets, projectName } from '@/mock';
import { fromNow } from '@/utils/format';
import { ALL_NAV_ITEMS } from '../nav';

const PATH_LABEL: Record<string, string> = {
  '/dashboard': '总览',
  '/projects': '项目列表',
  '/work': '我的待办',
  '/builds': '构建中心',
  '/releases': '发布中心',
  '/releases/calendar': '版本日历',
  '/quality/performance': '性能监控',
  '/quality/compatibility': '兼容性矩阵',
  '/quality/crashes': '异常聚合',
  '/analytics/realtime': '实时数据',
  '/analytics/overview': '核心指标',
  '/analytics/funnel': '留存与漏斗',
  '/analytics/channels': '渠道分析',
  '/assets': '素材库',
  '/assets/budget': '包体预算',
  '/support/tickets': '工单',
  '/support/sdk': 'SDK 接入',
  '/support/knowledge': '知识库',
  '/team': '成员管理',
  '/team/workload': '负载与工时',
  '/billing/contracts': '合同与结算',
  '/settings/general': '通用设置',
  '/settings/notifications': '通知规则',
  '/settings/integrations': '集成',
  '/settings/audit': '审计日志',
};

const TAB_LABEL: Record<string, string> = {
  milestones: '里程碑',
  requirements: '需求池',
  board: '任务看板',
  bugs: '缺陷',
  builds: '构建',
  releases: '发布',
  members: '成员',
  docs: '文档',
};

export function Topbar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const toggleCollapsed = useUiStore((s) => s.toggleCollapsed);
  const user = useAuthStore((s) => s.user);
  const switchRole = useAuthStore((s) => s.switchRole);
  const logout = useAuthStore((s) => s.logout);

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  const crumbs = useMemo(() => {
    const segs = pathname.split('/').filter(Boolean);
    if (segs.length === 0) return ['总览'];
    const first = `/${segs[0]}`;
    const out: string[] = [];
    if (segs[0] === 'projects' && segs[1]) {
      out.push('项目列表');
      out.push(projectName(segs[1]));
      if (segs[2]) out.push(TAB_LABEL[segs[2]] ?? segs[2]);
      return out;
    }
    if (segs[0] === 'builds' && segs[1]) {
      return ['构建中心', `#${segs[1].replace('BLD-2026-', '')}`];
    }
    const label = PATH_LABEL[pathname] ?? PATH_LABEL[first] ?? ALL_NAV_ITEMS.find((i) => i.path === first)?.label ?? segs[0];
    out.push(label);
    return out;
  }, [pathname]);

  const unread = allNotifications.filter((n) => !n.read && !readIds.includes(n.id));
  const newTickets = tickets.filter((t) => t.status === 'new').length;

  const currentProject = pathname.startsWith('/projects/') ? projects.find((p) => pathname.includes(p.id)) : undefined;

  return (
    <header className="np-topbar">
      <button className="np-icon-btn" onClick={toggleCollapsed} aria-label="切换侧栏">
        <Menu size={17} />
      </button>

      <div className="np-crumb">
        {crumbs.map((c, i) => (
          <span key={`${c}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: 'var(--np-text-disabled)' }}>/</span>}
            <span className={i === crumbs.length - 1 ? 'np-crumb-current' : ''}>{c}</span>
          </span>
        ))}
        {currentProject && (
          <Tag
            bordered={false}
            style={{
              marginLeft: 4,
              fontSize: 11,
              height: 20,
              lineHeight: '20px',
              background: 'var(--np-bg-subtle)',
              color: 'var(--np-text-tertiary)',
            }}
          >
            {currentProject.code}
          </Tag>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <button className="np-search-trigger" onClick={onOpenCommand} aria-label="打开命令面板">
        <Search size={14} />
        <span>搜索项目、工单、页面</span>
        <span className="np-kbd">⌘K</span>
      </button>

      <Tooltip title={theme === 'dark' ? '切换浅色' : '切换深色'}>
        <button className="np-icon-btn" onClick={toggleTheme} aria-label="切换主题">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </Tooltip>

      <button className="np-icon-btn" onClick={() => setNotifyOpen(true)} aria-label="通知">
        <Bell size={17} />
        {unread.length > 0 && <span className="np-icon-badge">{unread.length}</span>}
      </button>

      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            {
              key: 'role-header',
              label: <span style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>切换演示身份</span>,
              disabled: true,
            },
            ...demoAccounts.map((a) => ({
              key: a.role,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
                  <Avatar name={a.name} size={20} />
                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontSize: 12.5 }}>
                      {a.name} · {ROLES[a.role].label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{a.title}</div>
                  </div>
                  {user?.role === a.role && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--np-primary-500)' }} />}
                </div>
              ),
              onClick: () => switchRole(a.role),
            })),
            { type: 'divider' as const, key: 'd1' },
            {
              key: 'logout',
              icon: <LogOut size={14} />,
              label: '退出登录',
              onClick: () => {
                logout();
                navigate('/login');
              },
            },
          ],
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingLeft: 4 }}>
          <Avatar name={user?.name ?? '未登录'} size={28} />
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>
              {user ? ROLES[user.role].label : ''}
            </div>
          </div>
        </div>
      </Dropdown>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>通知</span>
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--np-text-tertiary)' }}>
              {newTickets} 个待受理工单
            </span>
          </div>
        }
        placement="right"
        width={400}
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {unread.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有未读通知" style={{ marginTop: 60 }} />
        ) : (
          <List
            dataSource={unread}
            renderItem={(n) => (
              <List.Item
                style={{ padding: '14px 20px', cursor: 'pointer', alignItems: 'flex-start' }}
                onClick={() => {
                  setReadIds((prev) => [...prev, n.id]);
                  navigate(n.link || '/dashboard');
                  setNotifyOpen(false);
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Badge
                      color={
                        n.type === 'alert' ? 'var(--np-danger)' : n.type === 'approval' ? 'var(--np-warning)' : n.type === 'mention' ? 'var(--np-primary-500)' : 'var(--np-text-tertiary)'
                      }
                    />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{n.title}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--np-text-tertiary)' }}>
                      {fromNow(n.createdAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--np-text-secondary)', lineHeight: 1.6 }}>{n.content}</div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </header>
  );
}
