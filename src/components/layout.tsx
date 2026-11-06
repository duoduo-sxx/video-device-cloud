import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Command,
  Film,
  FolderKanban,
  Headphones,
  LayoutDashboard,
  ListVideo,
  Receipt,
  ScanEye,
  ScrollText,
  Search,
  Server,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
  Check,
  AlertTriangle,
  CircleAlert,
  Info,
  ArrowRight,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAppStore } from '../store/app'
import { useDataStore } from '../store/data'
import { Avatar, Badge, IconButton } from './ui'
import { relativeTime } from '../lib/format'

type NavItem = { to: string; label: string; icon: React.ReactNode; badge?: number }

const navGroups = [
  {
    title: '生产',
    items: [
      { to: '/dashboard', label: '工作台', icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: '/assets', label: '素材库', icon: <Film className="h-4 w-4" /> },
      { to: '/jobs', label: '转换任务', icon: <ListVideo className="h-4 w-4" /> },
      { to: '/review', label: '质检中心', icon: <ScanEye className="h-4 w-4" /> },
      { to: '/presets', label: '参数预设', icon: <SlidersHorizontal className="h-4 w-4" /> },
    ],
  },
  {
    title: '交付',
    items: [
      { to: '/projects', label: '项目管理', icon: <FolderKanban className="h-4 w-4" /> },
      { to: '/clients', label: '客户管理', icon: <Users className="h-4 w-4" /> },
      { to: '/orders', label: '订单与账单', icon: <Receipt className="h-4 w-4" /> },
    ],
  },
  {
    title: '服务',
    items: [{ to: '/tickets', label: '技术服务', icon: <Headphones className="h-4 w-4" /> }],
  },
  {
    title: '系统',
    items: [
      { to: '/nodes', label: '渲染节点', icon: <Server className="h-4 w-4" /> },
      { to: '/team', label: '团队与权限', icon: <ShieldCheck className="h-4 w-4" /> },
      { to: '/logs', label: '审计日志', icon: <ScrollText className="h-4 w-4" /> },
      { to: '/settings', label: '设置', icon: <Settings className="h-4 w-4" /> },
    ],
  },
]

const routeTitles: Record<string, string> = {
  dashboard: '工作台',
  assets: '素材库',
  jobs: '转换任务',
  new: '新建任务',
  review: '质检',
  presets: '参数预设',
  projects: '项目管理',
  clients: '客户管理',
  orders: '订单与账单',
  tickets: '技术服务',
  nodes: '渲染节点',
  team: '团队与权限',
  logs: '审计日志',
  settings: '设置',
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar, commandOpen, setCommandOpen, notificationsOpen, setNotificationsOpen } = useAppStore()
  const notifications = useDataStore((s) => s.notifications)
  const markRead = useDataStore((s) => s.markRead)
  const markAll = useDataStore((s) => s.markAllRead)
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(!commandOpen)
      }
      if (e.key === 'Escape') {
        setCommandOpen(false)
        setNotificationsOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [commandOpen, setCommandOpen, setNotificationsOpen])

  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = [
    { label: 'SpaceScape', to: '/dashboard' },
    ...segments.map((s, i) => ({
      label: routeTitles[s] ?? (s.startsWith('job') || s.startsWith('ast') || s.startsWith('prj') || s.startsWith('cli') || s.startsWith('ord') || s.startsWith('tkt') ? '详情' : s),
      to: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ]

  return (
    <div className="flex min-h-screen bg-bg">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-line bg-[#0c0f15] transition-[width] duration-200',
          sidebarCollapsed ? 'w-[72px]' : 'w-[248px]',
        )}
      >
        <div className={cn('flex h-14 items-center border-b border-line-subtle', sidebarCollapsed ? 'justify-center' : 'px-4')}>
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: 'linear-gradient(135deg,#3d7dff,#22d3ee)' }}>
              <span className="text-[13px] font-semibold text-[#04121f]">S</span>
            </span>
            {!sidebarCollapsed && (
              <span className="flex flex-col leading-none">
                <span className="text-[13px] font-medium tracking-wide text-ink">SpaceScape</span>
                <span className="mt-1 text-[10px] text-dim">空间视频转换系统</span>
              </span>
            )}
          </Link>
        </div>

        <nav className={cn('flex-1 overflow-y-auto py-3', sidebarCollapsed ? 'px-3' : 'px-2.5')}>
          {navGroups.map((group) => (
            <div key={group.title} className="mb-4">
              {!sidebarCollapsed && (
                <div className="mb-1.5 px-2 text-[10px] tracking-[0.12em] text-dim">{group.title}</div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] transition-colors',
                        isActive ? 'bg-[#151c2a] text-ink' : 'text-muted hover:bg-[#12161f] hover:text-ink',
                        sidebarCollapsed && 'justify-center px-0',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary" />}
                        <span className={isActive ? 'text-primary' : 'text-dim group-hover:text-muted'}>{item.icon}</span>
                        {!sidebarCollapsed && item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={cn('border-t border-line-subtle p-3', sidebarCollapsed && 'flex justify-center')}>
          <button
            onClick={toggleSidebar}
            className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md text-[11px] text-dim hover:bg-[#12161f] hover:text-muted"
          >
            {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            {!sidebarCollapsed && '收起侧栏'}
          </button>
        </div>
      </aside>

      <div className={cn('flex min-h-screen flex-1 flex-col transition-[margin] duration-200', sidebarCollapsed ? 'ml-[72px]' : 'ml-[248px]')}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-line bg-[rgba(10,12,16,0.92)] px-6 backdrop-blur">
          <div className="flex min-w-0 items-center gap-1.5 text-[12px]">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3 text-dim" />}
                <Link to={c.to} className={cn('truncate', i === crumbs.length - 1 ? 'text-ink' : 'text-dim hover:text-muted')}>
                  {c.label}
                </Link>
              </span>
            ))}
          </div>

          <button
            onClick={() => setCommandOpen(true)}
            className="ml-auto flex h-8 w-[280px] items-center gap-2 rounded-md border border-line bg-[#0d1017] px-3 text-[12px] text-dim hover:border-[#333c4c]"
          >
            <Search className="h-3.5 w-3.5" />
            搜索任务、项目、客户
            <span className="ml-auto flex items-center gap-0.5 rounded border border-line px-1 py-0.5 text-[10px]">
              <Command className="h-2.5 w-2.5" />K
            </span>
          </button>

          <div className="relative">
            <IconButton active={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="通知">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-danger px-1 text-[9px] text-white">
                  {unread}
                </span>
              )}
            </IconButton>
            {notificationsOpen && (
              <div className="absolute right-0 top-11 w-[360px] overflow-hidden rounded-xl border border-line bg-surface" style={{ boxShadow: '0 12px 32px rgba(0,0,0,.45)' }}>
                <div className="flex items-center justify-between border-b border-line-subtle px-4 py-3">
                  <span className="text-[13px] text-ink">通知</span>
                  <button
                    className="text-[11px] text-primary hover:underline"
                    onClick={() => markAll()}
                  >
                    全部标记已读
                  </button>
                </div>
                <div className="max-h-[380px] overflow-auto">
                  {notifications.slice(0, 8).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markRead(n.id)
                        setNotificationsOpen(false)
                        if (n.link) navigate(n.link)
                      }}
                      className="flex w-full gap-3 border-b border-line-subtle px-4 py-3 text-left hover:bg-[#151a23]"
                    >
                      <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', n.read ? 'bg-[#2a3140]' : 'bg-primary')} />
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] text-ink">{n.title}</span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-dim">{n.body}</span>
                        <span className="mt-1 block text-[10px] text-dim">{relativeTime(n.createdAt)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-l border-line pl-3">
            <Avatar name="顾清和" hue={206} size={26} />
            <div className="leading-tight">
              <div className="text-[12px] text-ink">顾清和</div>
              <div className="text-[10px] text-dim">管理员</div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-6">
          <div className="mx-auto w-full max-w-[1680px]">
            <Outlet />
          </div>
        </main>
      </div>

      {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} />}
      <div className="fixed bottom-4 right-4 z-20 rounded-full border border-line bg-[#12161f]/90 px-2.5 py-1 text-[10px] text-dim backdrop-blur">
        演示数据 · Mock
      </div>
      <Toaster />
    </div>
  )
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const jobs = useDataStore((s) => s.jobs)
  const projects = useDataStore((s) => s.projects)
  const clients = useDataStore((s) => s.clients)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pages = navGroups.flatMap((g) => g.items).map((i) => ({ id: i.to, label: i.label, sub: '页面', to: i.to }))
    const all = [
      ...pages,
      ...jobs.map((j) => ({ id: j.id, label: j.name, sub: `任务 · ${j.code}`, to: `/jobs/${j.id}` })),
      ...projects.map((p) => ({ id: p.id, label: p.name, sub: `项目 · ${p.code}`, to: `/projects/${p.id}` })),
      ...clients.map((c) => ({ id: c.id, label: c.shortName, sub: `客户 · ${c.industry}`, to: `/clients/${c.id}` })),
    ]
    if (!q) return all.filter((r) => r.sub === '页面').concat(all.filter((r) => r.sub !== '页面').slice(0, 6))
    return all.filter((r) => r.label.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)).slice(0, 12)
  }, [query, jobs, projects, clients])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[14vh]" onClick={onClose}>
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-xl border border-line bg-surface"
        style={{ boxShadow: '0 16px 48px rgba(0,0,0,.55)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search className="h-4 w-4 text-dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setIndex((i) => Math.min(results.length - 1, i + 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setIndex((i) => Math.max(0, i - 1))
              }
              if (e.key === 'Enter' && results[index]) {
                navigate(results[index].to)
                onClose()
              }
            }}
            placeholder="搜索页面、任务、项目、客户…"
            className="h-12 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-dim"
          />
          <button onClick={onClose} className="rounded p-1 text-dim hover:text-ink" aria-label="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[340px] overflow-auto py-1.5">
          {results.length === 0 && <div className="px-4 py-8 text-center text-[12px] text-dim">没有匹配结果</div>}
          {results.map((r, i) => (
            <button
              key={r.id + r.to}
              onMouseEnter={() => setIndex(i)}
              onClick={() => {
                navigate(r.to)
                onClose()
              }}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2 text-left',
                i === index ? 'bg-[#182031]' : 'hover:bg-[#151a23]',
              )}
            >
              <span className="w-4 text-[11px] text-dim">{i === index ? <ArrowRight className="h-3 w-3 text-primary" /> : ''}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-ink">{r.label}</span>
                <span className="block text-[11px] text-dim">{r.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-line-subtle px-4 py-2 text-[10px] text-dim">
          <span>↑↓ 选择</span>
          <span>↵ 打开</span>
          <span>esc 关闭</span>
        </div>
      </div>
    </div>
  )
}

function Toaster() {
  const toasts = useAppStore((s) => s.toasts)
  const dismiss = useAppStore((s) => s.dismissToast)
  const icon = {
    success: <Check className="h-3.5 w-3.5 text-success" />,
    error: <CircleAlert className="h-3.5 w-3.5 text-danger" />,
    warning: <AlertTriangle className="h-3.5 w-3.5 text-warning" />,
    info: <Info className="h-3.5 w-3.5 text-accent" />,
  }
  const bar = { success: 'var(--success)', error: 'var(--danger)', warning: 'var(--warning)', info: 'var(--accent)' }
  return (
    <div className="fixed bottom-14 right-4 z-[60] flex w-[320px] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-fadeUp flex items-start gap-2.5 overflow-hidden rounded-lg border border-line bg-surface p-3 pl-3.5"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,.45)', borderLeft: `3px solid ${bar[t.kind]}` }}
        >
          <span className="mt-0.5">{icon[t.kind]}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-ink">{t.title}</div>
            {t.desc && <div className="mt-0.5 text-[11px] leading-4 text-dim">{t.desc}</div>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-dim hover:text-ink" aria-label="关闭提示">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

export function PageHeader({
  title,
  desc,
  actions,
  back,
  meta,
}: {
  title: React.ReactNode
  desc?: React.ReactNode
  actions?: React.ReactNode
  back?: { to: string; label: string }
  meta?: React.ReactNode
}) {
  return (
    <div className="mb-5">
      {back && (
        <Link to={back.to} className="mb-2 inline-flex items-center gap-1 text-[12px] text-dim hover:text-muted">
          <ChevronLeft className="h-3.5 w-3.5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-medium tracking-tight text-ink">{title}</h1>
          {desc && <div className="mt-1 max-w-[720px] text-[12px] leading-5 text-dim">{desc}</div>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  spark,
  tone = 'primary',
}: {
  label: string
  value: string
  unit?: string
  delta?: string
  deltaLabel?: string
  spark?: number[]
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'accent'
}) {
  const positive = delta?.startsWith('+')
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between">
        <span className="text-[12px] text-dim">{label}</span>
        {delta && (
          <span className={cn('text-[11px]', positive ? 'text-success' : 'text-danger')}>
            {delta}
            {deltaLabel && <span className="ml-1 text-dim">{deltaLabel}</span>}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-end gap-1.5">
        <span className="mono text-[26px] leading-none text-ink">{value}</span>
        {unit && <span className="text-[11px] text-dim">{unit}</span>}
      </div>
      {spark && (
        <div className="mt-3 h-[26px]">
          <SparklineMini values={spark} color={tone === 'success' ? 'var(--success)' : tone === 'danger' ? 'var(--danger)' : tone === 'accent' ? 'var(--accent)' : 'var(--primary)'} />
        </div>
      )}
    </div>
  )
}

function SparklineMini({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = Math.max(1, max - min)
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 218 + 1},${24 - ((v - min) / span) * 20}`).join(' ')
  const id = `sp-${color.replace(/\W/g, '')}`
  return (
    <svg viewBox="0 0 220 26" preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,26 ${points} 220,26`} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function InfoBadge({ children }: { children: React.ReactNode }) {
  return <Badge tone="neutral">{children}</Badge>
}

export type { NavItem }
