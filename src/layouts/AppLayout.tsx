import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Command,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { NAV_GROUPS, TITLES } from '@/router/nav';
import { useAuth } from '@/store/auth';
import { useUI } from '@/store/ui';
import { cn } from '@/utils/cn';
import { ROLE_META } from '@/utils/constants';
import type { RoleCode } from '@/types';
import { db } from '@/mock/api';
import { useData } from '@/store/data';

export default function AppLayout() {
  const { collapsed, toggle } = useUI();
  const { user, switchRole, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [height, setHeight] = useState(db.blocks[0]?.height ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const unread = 7;

  useEffect(() => {
    const t = setInterval(() => setHeight((h) => h + 1), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${TITLES[loc.pathname] ?? '星火链证'} · 星火链证 XH-CHAIN`;
  }, [loc.pathname]);

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => !it.roles || it.roles.includes(user.role)),
  })).filter((g) => g.items.length);

  const activeItem = groups.flatMap((g) => g.items).reduce<{ path: string } | null>((acc, it) => {
    if (loc.pathname === it.path) return it;
    if (loc.pathname.startsWith(`${it.path}/`) && (!acc || it.path.length > acc.path.length)) return it;
    return acc;
  }, null);

  const search = () => {
    const q = query.trim();
    if (!q) return;
    if (/^0x[0-9a-fA-F]{64}$/.test(q)) nav(`/chain/tx/${q}`);
    else if (/^\d{4,8}$/.test(q)) nav(`/chain/blocks/${q}`);
    else if (q.startsWith('EV-')) nav(`/evidence/${q}`);
    else if (q.startsWith('RR-')) nav(`/rights/${q}`);
    else nav(`/evidence?kw=${encodeURIComponent(q)}`);
    setQuery('');
  };

  return (
    <div className="flex min-h-screen">
      {/* ---------------- Sidebar ---------------- */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-screen flex-none flex-col border-r border-[var(--stroke)] bg-[#080D17]/95 transition-[width] duration-200',
          collapsed ? 'w-[68px]' : 'w-[240px]',
        )}
      >
        <div className={cn('flex h-[60px] items-center border-b border-[var(--stroke)]', collapsed ? 'justify-center px-0' : 'px-5')}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-gradient-to-br from-[#3D7DFF] to-[#22D3EE] shadow-[0_0_20px_rgba(61,125,255,.5)]">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.6" />
                <rect x="14" y="3" width="7" height="7" rx="1.6" />
                <rect x="3" y="14" width="7" height="7" rx="1.6" />
                <rect x="14" y="14" width="7" height="7" rx="1.6" />
                <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" />
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold tracking-[0.3px] text-[var(--text-1)]">星火链证</div>
                <div className="font-mono text-[9px] tracking-[1.6px] text-[var(--text-3)]">XH-CHAIN</div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {groups.map((g) => (
            <div key={g.title} className="mb-1">
              {!collapsed && (
                <div className="px-5 pb-1.5 pt-2 text-[10px] font-medium tracking-[1.4px] text-[var(--text-3)]/80">
                  {g.title}
                </div>
              )}
              {collapsed && <div className="mx-auto my-2 h-px w-6 bg-white/8" />}
              {g.items.map((it) => {
                const Icon = it.icon;
                const active = activeItem?.path === it.path;
                return (
                  <NavLink
                    key={it.path}
                    to={it.path}
                    title={collapsed ? it.label : undefined}
                    className={cn('nav-item', active && 'active', collapsed && 'justify-center px-0')}
                  >
                    <Icon size={16} className="flex-none" strokeWidth={1.9} />
                    {!collapsed && <span className="truncate">{it.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--stroke)] p-3">
          {!collapsed ? (
            <div className="rounded-[9px] border border-[rgba(61,125,255,.22)] bg-[rgba(61,125,255,.07)] p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-2)]">本月存证额度</span>
                <span className="num text-[var(--text-1)]">82%</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#3D7DFF] to-[#22D3EE]" />
              </div>
              <div className="mt-2 text-[10.5px] text-[var(--text-3)]">剩余 1,080 条 · 专业版</div>
            </div>
          ) : (
            <div className="mx-auto h-1.5 w-6 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[82%] bg-[#3D7DFF]" />
            </div>
          )}
        </div>
      </aside>

      {/* ---------------- Main ---------------- */}
      <div className={cn('min-w-0 flex-1 transition-[margin] duration-200', collapsed ? 'ml-[68px]' : 'ml-[240px]')}>
        <header className="sticky top-0 z-20 flex h-[60px] items-center gap-4 border-b border-[var(--stroke)] bg-[rgba(10,15,26,.78)] px-6 backdrop-blur-[12px]">
          <button
            onClick={toggle}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-3)] transition-colors hover:bg-white/5 hover:text-[var(--text-1)]"
            title={collapsed ? '展开侧栏' : '收起侧栏'}
          >
            {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>

          <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-3)]">
            <span>{TITLES[loc.pathname] ? '' : ''}</span>
            <span className="text-[var(--text-2)]">{activeItem ? TITLES[activeItem.path] ?? '' : ''}</span>
            {loc.pathname !== activeItem?.path && TITLES[loc.pathname] && (
              <>
                <span className="text-[var(--text-3)]">/</span>
                <span className="text-[var(--text-3)]">{TITLES[loc.pathname]}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="group relative flex h-[32px] w-[340px] items-center gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)]/60 px-3 transition-colors focus-within:border-[rgba(61,125,255,.55)]">
              <Search size={13} className="flex-none text-[var(--text-3)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder="搜索存证编号 / 交易哈希 / 区块高度"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)]"
              />
              <span className="flex items-center gap-0.5 rounded-[4px] border border-[var(--stroke)] px-1 py-0.5 font-mono text-[9.5px] text-[var(--text-3)]">
                <Command size={9} /> K
              </span>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-[rgba(45,212,167,.25)] bg-[rgba(45,212,167,.08)] px-2.5 py-1 xl:flex">
              <span className="h-[5px] w-[5px] animate-[pulseDot_1.8s_ease-in-out_infinite] rounded-full bg-[var(--ok)] shadow-[0_0_6px_var(--ok)]" />
              <span className="text-[11px] text-[#6EE7C7]">星火链 · 运行中</span>
              <span className="num font-mono text-[11px] text-[var(--text-2)]">#{height.toLocaleString()}</span>
            </div>

            <button
              onClick={() => nav('/notifications')}
              className="relative flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-2)] transition-colors hover:bg-white/5 hover:text-[var(--text-1)]"
            >
              <Bell size={15} />
              {unread > 0 && (
                <span className="absolute right-1 top-1 h-[5px] w-[5px] rounded-full bg-[var(--danger)] ring-2 ring-[#0A0F1A]" />
              )}
            </button>
            <button
              onClick={() => nav('/support')}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-2)] transition-colors hover:bg-white/5 hover:text-[var(--text-1)]"
            >
              <CircleHelp size={15} />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-white/5"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10.5px] font-medium text-white"
                  style={{ background: `linear-gradient(135deg, ${user.avatarColor}, ${user.avatarColor}88)` }}
                >
                  {user.name.slice(0, 1)}
                </span>
                <div className="text-left leading-tight">
                  <div className="text-[12px] text-[var(--text-1)]">{user.name}</div>
                  <div className="text-[10px] text-[var(--text-3)]">{ROLE_META[user.role].label}</div>
                </div>
                <ChevronDown size={12} className="text-[var(--text-3)]" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[42px] w-[268px] animate-[slideDown_.18s_ease-out] rounded-[10px] border border-[var(--stroke-strong)] bg-[var(--bg-card)] p-1.5 shadow-[0_24px_48px_-20px_rgba(0,0,0,.9)]">
                  <div className="px-2.5 py-2">
                    <div className="text-[12px] text-[var(--text-1)]">{user.orgName}</div>
                    <div className="mt-0.5 text-[10.5px] text-[var(--text-3)]">企业管理员 · 已实名认证</div>
                  </div>
                  <div className="my-1 h-px bg-[var(--stroke)]" />
                  <div className="px-2.5 pb-1 pt-1 text-[10px] tracking-[1px] text-[var(--text-3)]">切换演示角色</div>
                  {(Object.keys(ROLE_META) as RoleCode[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setMenuOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-white/6',
                        user.role === r ? 'text-[var(--brand-2)]' : 'text-[var(--text-2)]',
                      )}
                    >
                      <ShieldCheck size={12} className="flex-none" />
                      <span className="flex-1">{ROLE_META[r].label}</span>
                      {user.role === r && <span className="text-[10px]">当前</span>}
                    </button>
                  ))}
                  <div className="my-1 h-px bg-[var(--stroke)]" />
                  <button
                    onClick={() => nav('/settings')}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-[var(--text-2)] hover:bg-white/6"
                  >
                    <UserCog size={12} /> 账户设置
                  </button>
                  <button
                    onClick={() => nav('/settings')}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-[var(--text-2)] hover:bg-white/6"
                  >
                    <Settings size={12} /> 偏好设置
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      nav('/login');
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-[var(--danger)] hover:bg-white/6"
                  >
                    <LogOut size={12} /> 退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1560px] px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
