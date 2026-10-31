import clsx from 'clsx';
import { NavLink } from 'react-router-dom';
import { Hexagon, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { ROLE_MAP, hasPerm } from '@/mocks/roles';
import type { NavGroup } from './nav';

export default function Sidebar({ groups, scopeLabel }: { groups: NavGroup[]; scopeLabel: string }) {
  const collapsed = useUIStore((s) => s.collapsed);
  const toggle = useUIStore((s) => s.toggleCollapsed);
  const user = useAuthStore((s) => s.user);
  const perms = user ? ROLE_MAP[user.role]?.permissions ?? [] : [];

  return (
    <aside
      className={clsx(
        'sidebar-scroll flex shrink-0 flex-col overflow-y-auto border-r border-[#111C33] bg-sidebar transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={clsx('flex h-14 items-center border-b border-[#141F38]', collapsed ? 'justify-center' : 'px-4')}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Hexagon size={16} className="text-white" strokeWidth={2.4} />
          </span>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-[13px] font-semibold text-white">云枢 · 数据价值链</div>
              <div className="mt-0.5 text-2xs text-sidebar-text">{scopeLabel}</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-2">
        {groups.map((g, gi) => {
          const visible = g.items.filter((it) => hasPerm(perms, it.perm));
          if (!visible.length) return null;
          return (
            <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
              {g.title && !collapsed && (
                <div className="px-4 pb-1.5 pt-2 text-2xs font-medium tracking-wide text-[#5B6780]">
                  {g.title}
                </div>
              )}
              {g.title && collapsed && <div className="mx-3 my-1.5 h-px bg-[#141F38]" />}
              {visible.map((it) => {
                const Icon = it.icon;
                return (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    title={collapsed ? it.label : undefined}
                    className={({ isActive }) =>
                      clsx(
                        'relative mx-2 flex items-center gap-2.5 rounded-md py-2 text-[13px] transition-colors',
                        collapsed ? 'justify-center px-0' : 'px-2.5',
                        isActive
                          ? 'bg-primary/15 font-medium text-white'
                          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 h-[calc(100%-12px)] w-[3px] rounded-r bg-primary" />
                        )}
                        <Icon size={16} strokeWidth={1.9} className="shrink-0" />
                        {!collapsed && <span className="truncate">{it.label}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        className="flex h-11 items-center justify-center gap-2 border-t border-[#141F38] text-2xs text-sidebar-text hover:text-white"
      >
        {collapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={15} />}
        {!collapsed && <span>收起侧栏</span>}
      </button>
    </aside>
  );
}
