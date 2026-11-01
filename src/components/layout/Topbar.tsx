import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Bell, ChevronDown, CircleCheck, Database, Search, ShieldCheck } from 'lucide-react';
import { useAuthStore, ROLE_MAP, USERS } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { BRAND } from './nav';
import { findNav, type NavGroup } from './nav';
import { SYNC_JOBS } from '@/mocks/pipeline';

export default function Topbar({ groups }: { groups: NavGroup[] }) {
  const path = useLocation().pathname;
  const user = useAuthStore((s) => s.user);
  const switchUser = useAuthStore((s) => s.switchUser);
  const toast = useUIStore((s) => s.toast);
  const [open, setOpen] = useState(false);

  const current = findNav(path);
  const okJobs = SYNC_JOBS.filter((j) => j.status === 'success').length;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-line bg-white/95 px-5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-1.5 text-xs">
        <span className="text-ink-3">{BRAND.name}</span>
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
        {/* 数据周期 */}
        <div className="hidden items-center gap-1.5 rounded-ctl border border-line bg-[#F9FAFB] px-2.5 py-1 lg:flex">
          <Database size={12} className="text-ink-3" />
          <span className="num text-2xs text-ink-2">2026-10-01 ~ 10-31</span>
          <span className="text-2xs text-ink-3">·</span>
          <span className="text-2xs text-ink-3">对比 9 月</span>
        </div>

        {/* 同步状态 */}
        <div className="hidden items-center gap-1.5 rounded-ctl border border-[#ABEFC6] bg-success-soft px-2.5 py-1 md:flex">
          <CircleCheck size={12} className="text-success" />
          <span className="text-2xs text-success">
            同步 {okJobs}/{SYNC_JOBS.length} 成功
          </span>
        </div>

        <div className="relative hidden xl:block">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            placeholder="搜索账户、计划、素材…"
            className="h-8 w-52 rounded-ctl border border-line bg-[#F9FAFB] pl-8 pr-3 text-xs text-ink-1 placeholder:text-ink-3 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-ring"
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
              {user.name.slice(0, 1)}
            </span>
            <span className="text-xs font-medium text-primary">{ROLE_MAP[user.role].name}</span>
            <ChevronDown size={13} className="text-primary" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-10 z-20 w-80 overflow-hidden rounded-card border border-line bg-white shadow-pop">
                <div className="border-b border-line bg-[#FCFCFD] px-4 py-3">
                  <div className="text-xs font-medium text-ink-1">{user.name}</div>
                  <div className="mt-0.5 text-2xs text-ink-3">
                    {user.title} · {BRAND.owner}
                  </div>
                </div>
                <div className="py-1">
                  <div className="px-4 py-1.5 text-2xs text-ink-3">切换演示身份（影响可执行操作）</div>
                  {USERS.map((u) => {
                    const isActive = user.id === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setOpen(false);
                          toast(`已切换为「${ROLE_MAP[u.role].name} · ${u.name}」`, 'info');
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
                            {u.name} · {ROLE_MAP[u.role].desc}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
