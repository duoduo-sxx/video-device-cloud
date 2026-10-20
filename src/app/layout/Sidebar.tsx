import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { NAV_GROUPS } from '../nav';
import { canAccess, useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { Avatar } from '@/components/ui';
import { tickets } from '@/mock';

export function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const collapsed = useUiStore((s) => s.collapsed);
  const toggleCollapsed = useUiStore((s) => s.toggleCollapsed);
  const user = useAuthStore((s) => s.user);

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter(() => canAccess(user?.role, g.key)),
      })).filter((g) => g.items.length > 0),
    [user?.role],
  );

  const openTicketCount = useMemo(() => tickets.filter((t) => t.status === 'new').length, []);

  const isActive = (path: string) => {
    if (path === '/projects') return pathname === '/projects' || pathname.startsWith('/projects/');
    if (path === '/projects/') return pathname.startsWith('/projects/');
    if (path === '/releases') return pathname === '/releases';
    return pathname === path;
  };

  return (
    <aside className={`np-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="np-logo">
        <div className="np-logo-mark">
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden>
            <path
              d="M6 12.2 12.6 7l6.4 4.6v6.1L12.6 22 6 17.6z"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <circle cx="23" cy="20.5" r="3.2" fill="#9FE1CB" />
          </svg>
        </div>
        {!collapsed && (
          <div className="np-logo-text">
            <span className="np-logo-name">NexusPlay</span>
            <span className="np-logo-sub">研发交付平台</span>
          </div>
        )}
      </div>

      <nav className="np-nav">
        {groups.map((group) => (
          <div className="np-nav-group" key={group.key}>
            {!collapsed && <div className="np-nav-group-title">{group.label}</div>}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <div
                  key={item.key}
                  className={`np-nav-item ${active ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(item.path);
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badgeKey === 'tickets' && openTicketCount > 0 && (
                    <span className="np-nav-badge">{openTicketCount}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="np-sidebar-foot">
        <div className="np-user-chip" onClick={toggleCollapsed} title={collapsed ? '展开侧栏' : '收起侧栏'}>
          {collapsed ? (
            <ChevronsRight size={16} color="var(--np-text-tertiary)" />
          ) : (
            <>
              <Avatar name={user?.name ?? '未登录'} size={26} />
              <div className="np-user-meta" style={{ flex: 1 }}>
                <div className="np-user-name">{user?.name ?? '未登录'}</div>
                <div className="np-user-role">{user?.title ?? ''}</div>
              </div>
              <ChevronsLeft size={15} color="var(--np-text-tertiary)" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
