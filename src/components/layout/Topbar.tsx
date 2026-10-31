import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Bell, ChevronDown, LogOut, Search, Settings2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ROLE_MAP } from '@/mocks/roles';
import { DEMO_IDENTITIES, USERS, TENANTS } from '@/mocks/tenants';
import { SCOPE_META, type NavGroup, type Scope } from './nav';
import type { RoleCode } from '@/types';

function scopeOfRole(role: RoleCode): Scope {
  if (role === 'finance') return 'finance';
  if (role === 'ops' || role === 'ops_compute' || role === 'super_admin') return 'admin';
  return 'console';
}

export default function Topbar({ groups, scope }: { groups: NavGroup[]; scope: Scope }) {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const loginAs = useAuthStore((s) => s.loginAs);
  const logout = useAuthStore((s) => s.logout);
  const toast = useUIStore((s) => s.toast);
  const [open, setOpen] = useState(false);

  const flat = groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));
  const current =
    flat.find((i) => i.to === path) ??
    flat
      .filter((i) => path.startsWith(i.to) && i.to !== '/')
      .sort((a, b) => b.to.length - a.to.length)[0];

  const tenant = TENANTS.find((t) => t.id === user?.tenantId);
  const roleName = user ? ROLE_MAP[user.role]?.name : '';

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-line bg-white/95 px-5 backdrop-blur">
      {/* 面包屑 */}
      <div className="flex min-w-0 items-center gap-1.5 text-xs">
        <span className="text-ink-3">{SCOPE_META[scope].label}</span>
        {current?.group && (
          <>
            <span className="text-ink-3">/</span>
            <span className="text-ink-3">{current.group}</span>
          </>
        )}
        {current && (
          <>
            <span className="text-ink-3">/</span>
            <span className="truncate font-medium text-ink-1">{current.label}</span>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* 搜索 */}
        <div className="relative hidden md:block">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            placeholder="搜索服务、任务、账单号…"
            className="h-8 w-60 rounded-ctl border border-line bg-[#F9FAFB] pl-8 pr-3 text-xs text-ink-1 placeholder:text-ink-3 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-ring"
          />
        </div>

        <button className="relative flex h-8 w-8 items-center justify-center rounded-ctl text-ink-2 hover:bg-[#F2F4F7]">
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger ring-2 ring-white" />
        </button>

        {/* 身份切换 */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 items-center gap-2 rounded-full border border-primary-ring bg-primary-soft pl-1 pr-2.5 transition-colors hover:bg-[#E3ECFF]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-2xs font-semibold text-white">
              {user?.name.slice(0, 1) ?? '—'}
            </span>
            <span className="text-xs font-medium text-primary">{roleName}</span>
            <ChevronDown size={13} className="text-primary" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-10 z-20 w-80 overflow-hidden rounded-card border border-line bg-white shadow-pop">
                <div className="border-b border-line bg-[#FCFCFD] px-4 py-3">
                  <div className="text-xs font-medium text-ink-1">{user?.name}</div>
                  <div className="mt-0.5 text-2xs text-ink-3">
                    {tenant ? tenant.name : '云枢智能科技（平台方）'}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  <div className="px-4 py-1.5 text-2xs text-ink-3">切换演示身份</div>
                  {DEMO_IDENTITIES.map((d) => {
                    const u = USERS.find((x) => x.id === d.userId);
                    if (!u) return null;
                    const isActive = user?.id === u.id;
                    return (
                      <button
                        key={d.userId}
                        onClick={() => {
                          loginAs(u.id);
                          setOpen(false);
                          toast(`已切换为「${ROLE_MAP[u.role].name} · ${u.name}」`, 'info');
                          navigate(SCOPE_META[scopeOfRole(u.role)].home);
                        }}
                        className={clsx(
                          'flex w-full items-center gap-2.5 px-4 py-2 text-left hover:bg-[#F9FAFB]',
                          isActive && 'bg-primary-soft',
                        )}
                      >
                        <span
                          className={clsx(
                            'flex h-7 w-7 items-center justify-center rounded-full text-2xs font-semibold',
                            isActive ? 'bg-primary text-white' : 'bg-[#F2F4F7] text-ink-2',
                          )}
                        >
                          {u.name.slice(0, 1)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-ink-1">{ROLE_MAP[u.role].name}</span>
                            {isActive && <ShieldCheck size={12} className="text-primary" />}
                          </span>
                          <span className="mt-0.5 block truncate text-2xs text-ink-3">
                            {u.name} · {d.account}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-line">
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                      navigate('/auth/login');
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-ink-2 hover:bg-[#F9FAFB]"
                  >
                    <LogOut size={14} /> 退出登录
                  </button>
                  <button className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-ink-2 hover:bg-[#F9FAFB]">
                    <Settings2 size={14} /> 账号设置
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
