import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  Columns2,
  Cpu,
  FileText,
  Film,
  KanbanSquare,
  LayoutDashboard,
  LibraryBig,
  ScanSearch,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { ROLE_META, type Role } from '../../lib/permissions'
import { useUI } from '../../store/ui'
import { db } from '../../mock/db'
import { Avatar, Badge } from '../ui'
import { CommandPalette } from './CommandPalette'
import { NotificationDrawer } from './NotificationDrawer'
import { AssistantDrawer } from './AssistantDrawer'

const NAV = [
  { group: '', items: [{ to: '/', label: '工作台', icon: LayoutDashboard }] },
  { group: '资产', items: [{ to: '/media', label: '媒体资产库', icon: Film }] },
  {
    group: '流水线',
    items: [
      { to: '/detection', label: '检测中心', icon: ScanSearch },
      { to: '/repair', label: '修复中心', icon: Wrench },
      { to: '/review/rt4', label: '对比与验收', icon: Columns2, activePrefix: '/review' },
      { to: '/reports', label: '报告中心', icon: FileText },
    ],
  },
  {
    group: '业务',
    items: [
      { to: '/service', label: '技术服务', icon: Briefcase },
      { to: '/service/orders', label: '工单看板', icon: KanbanSquare, activePrefix: '/service/orders' },
    ],
  },
  {
    group: '能力',
    items: [
      { to: '/rules', label: '规则与算法', icon: SlidersHorizontal },
      { to: '/knowledge', label: '知识库', icon: LibraryBig },
      { to: '/compute', label: '算力调度', icon: Cpu },
    ],
  },
]

export function AppShell() {
  const { collapsed, toggleCollapsed, setCommandOpen, setNotifyOpen, setAssistantOpen, role, setRole, notifyOpen, commandOpen, assistantOpen } = useUI()
  const location = useLocation()
  const navigate = useNavigate()
  const unread = db.notifications.filter((n) => !n.read).length
  const [roleOpen, setRoleOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
      if (e.key === 'Escape') {
        setCommandOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandOpen])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const currentRole = ROLE_META[role]

  return (
    <div className="flex h-full min-h-screen bg-[var(--bg-0)]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[var(--border)] bg-[var(--bg-1)] transition-all duration-200',
          collapsed ? 'w-16' : 'w-56',
        )}
      >
        <div className={cn('flex h-14 items-center gap-2.5 border-b border-[var(--border)] px-4', collapsed && 'justify-center px-0')}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--primary)] text-[13px] font-semibold text-[#04161c]">
            AV
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium">AV Repair Studio</div>
              <div className="truncate text-[10px] text-[var(--text-3)]">音视频自动化修补平台</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV.map((section) => (
            <div key={section.group || 'home'} className="mb-4">
              {section.group && !collapsed && (
                <div className="mb-1 px-2 text-[10px] uppercase tracking-wider text-[var(--text-3)]">{section.group}</div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.activePrefix
                    ? location.pathname.startsWith(item.activePrefix)
                    : item.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.to)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'mb-0.5 flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] transition-colors',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-[var(--primary-10)] text-[var(--primary)]'
                        : 'text-[var(--text-2)] hover:bg-[var(--bg-2)] hover:text-[var(--text-1)]',
                    )}
                  >
                    <Icon size={16} strokeWidth={1.8} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] p-2">
          <NavLink
            to="/settings"
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-[var(--text-2)] hover:bg-[var(--bg-2)] hover:text-[var(--text-1)]',
              collapsed && 'justify-center px-0',
            )}
          >
            <Settings size={16} strokeWidth={1.8} />
            {!collapsed && '设置'}
          </NavLink>
          <button
            onClick={toggleCollapsed}
            className={cn(
              'mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-[var(--text-3)] hover:bg-[var(--bg-2)] hover:text-[var(--text-1)]',
              collapsed && 'justify-center px-0',
            )}
          >
            <ChevronLeft size={16} className={cn('transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && '收起导航'}
          </button>
        </div>
      </aside>

      <div className={cn('flex min-w-0 flex-1 flex-col transition-all duration-200', collapsed ? 'ml-16' : 'ml-56')}>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[rgba(7,10,15,.86)] px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="text-[13px] text-[var(--text-2)]">云溪广电 · 内容技术中心</div>
            <Badge color="var(--primary)" bg="var(--primary-10)">企业版</Badge>
          </div>

          <div className="flex flex-1 justify-center">
            <button
              onClick={() => setCommandOpen(true)}
              className="flex h-8 w-[320px] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-1)] px-3 text-[12px] text-[var(--text-3)] hover:border-[var(--border-str)]"
            >
              <Search size={13} />
              搜索素材、任务、工单…
              <span className="mono ml-auto rounded border border-[var(--border)] px-1 text-[10px]">⌘K</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAssistantOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 text-[12px] text-[var(--text-2)] hover:bg-[var(--bg-2)] hover:text-[var(--text-1)]"
            >
              <Sparkles size={13} className="text-[var(--purple)]" />
              智能助手
            </button>
            <button
              onClick={() => setNotifyOpen(true)}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--bg-2)] hover:text-[var(--text-1)]"
            >
              <Bell size={15} />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--danger)] px-0.5 text-[9px] text-white">
                  {unread}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setRoleOpen((v) => !v)}
                className="flex h-8 items-center gap-2 rounded-lg border border-[var(--border)] px-2 text-[12px] text-[var(--text-2)] hover:bg-[var(--bg-2)]"
              >
                <Avatar name={currentRole.label} seed={role === 'admin' ? 11 : role === 'client' ? 13 : 33} size={20} />
                <span className="hidden xl:inline">{currentRole.label}</span>
                <ChevronDown size={12} />
              </button>
              {roleOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setRoleOpen(false)} />
                  <div className="absolute right-0 top-9 z-50 w-[248px] rounded-xl border border-[var(--border)] bg-[var(--bg-1)] p-1.5 shadow-layer">
                    <div className="px-2 py-1.5 text-[11px] text-[var(--text-3)]">切换演示角色（影响权限与导航）</div>
                    {(Object.keys(ROLE_META) as Role[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setRole(r)
                          setRoleOpen(false)
                          if (r === 'client') navigate('/service/orders')
                        }}
                        className={cn(
                          'flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--bg-2)]',
                          r === role && 'bg-[var(--primary-10)]',
                        )}
                      >
                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: r === role ? 'var(--primary)' : 'var(--text-3)' }} />
                        <div>
                          <div className="text-[12px] text-[var(--text-1)]">{ROLE_META[r].label}</div>
                          <div className="text-[11px] leading-4 text-[var(--text-3)]">{ROLE_META[r].desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-6 py-5">
          <Outlet />
        </main>
      </div>

      {commandOpen && <CommandPalette />}
      {notifyOpen && <NotificationDrawer />}
      {assistantOpen && <AssistantDrawer />}
    </div>
  )
}

export function useAssetsLite() {
  return useMemo(() => db.assets, [])
}
