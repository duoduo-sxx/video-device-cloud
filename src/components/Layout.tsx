import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Film,
  Search,
  Scissors,
  ShieldCheck,
  BarChart3,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Command,
  CheckCircle2,
  Sparkles,
  Menu,
  type LucideIcon,
} from 'lucide-react'
import { NAV, ROLE_LABEL, ROLE_PERMISSIONS } from '../constants'
import { useAuth, usePlayer, useUi } from '../stores'
import { cn, relativeTime } from '../lib/utils'
import { Badge, Button, Drawer, useClickOutside } from './ui'
import { fetchNotifications, markNotificationsRead } from '../services'
import type { Notification, RoleKey } from '../types'

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Film,
  Search,
  Scissors,
  ShieldCheck,
  BarChart3,
  Cpu,
  Settings,
}

const CRUMB_MAP: Record<string, string> = {
  dashboard: '工作台',
  videos: '视频资产库',
  analysis: '智能解析',
  search: '智能检索',
  editing: '智能剪辑',
  review: '内容审核',
  analytics: '数据分析',
  models: '模型与能力',
  pipeline: '流水线编排',
  settings: '系统设置',
  users: '用户管理',
  roles: '角色权限',
  spaces: '空间管理',
  'api-keys': 'API 密钥',
  audit: '操作审计',
  profile: '个人中心',
}

function Sidebar() {
  const { collapsed, toggleCollapsed } = useUi()
  const role = useAuth((s) => s.role)
  const allowed = ROLE_PERMISSIONS[role]

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-[232px]',
      )}
    >
      <div className={cn('flex h-14 items-center gap-2.5 border-b border-line px-4', collapsed && 'justify-center px-0')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand">
          <Film size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium leading-tight text-t1">视频内容理解</div>
            <div className="truncate text-[10px] leading-tight text-t3">Video Insight Platform</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((group) => {
          const items = group.items.filter((i) => allowed.includes(i.key))
          if (!items.length) return null
          return (
            <div key={group.title} className="mb-4">
              {!collapsed && (
                <div className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-t3">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = ICONS[item.icon] ?? Film
                  return (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-2.5 rounded-ctl px-2 py-1.5 text-[13px] transition-colors',
                          isActive
                            ? 'bg-brand-soft font-medium text-brand'
                            : 'text-t2 hover:bg-hover hover:text-t1',
                          collapsed && 'justify-center px-0',
                        )
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={16} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-line p-2">
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex w-full items-center gap-2 rounded-ctl px-2 py-1.5 text-xs text-t3 transition-colors hover:bg-hover hover:text-t2',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          {!collapsed && <span>收起侧栏</span>}
        </button>
      </div>
    </aside>
  )
}

function UserMenu() {
  const { user, role, logout, switchRole } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-ctl py-1 pl-1 pr-2 transition-colors hover:bg-hover"
      >
        <img
          src={user?.avatarUrl}
          alt=""
          className="h-7 w-7 rounded-full bg-subtle object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
          }}
        />
        <div className="hidden text-left sm:block">
          <div className="text-xs leading-tight text-t1">{user?.name ?? '未登录'}</div>
          <div className="text-[10px] leading-tight text-t3">{ROLE_LABEL[role]}</div>
        </div>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-card border border-line bg-elevated p-1.5 shadow-xl animate-scale-in">
          <div className="border-b border-line px-2 py-2">
            <div className="text-xs text-t1">{user?.name}</div>
            <div className="mt-0.5 text-[11px] text-t3">{user?.email}</div>
          </div>
          <div className="py-1">
            <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-t3">切换演示身份</div>
            {(Object.keys(ROLE_LABEL) as RoleKey[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  switchRole(r)
                  setOpen(false)
                  navigate('/dashboard')
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-hover',
                  r === role ? 'text-brand' : 'text-t2',
                )}
              >
                {ROLE_LABEL[r]}
                {r === role && <CheckCircle2 size={12} />}
              </button>
            ))}
          </div>
          <div className="border-t border-line pt-1">
            <button
              onClick={() => {
                setOpen(false)
                navigate('/settings/profile')
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-t2 hover:bg-hover"
            >
              <User size={13} /> 个人中心
            </button>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-danger hover:bg-hover"
            >
              <LogOut size={13} /> 退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [list, setList] = useState<Notification[]>([])
  const [tab, setTab] = useState<'all' | '任务' | '审核' | '系统'>('all')

  useEffect(() => {
    if (!open) return
    fetchNotifications().then(setList)
  }, [open])

  const filtered = tab === 'all' ? list : list.filter((n) => n.type === tab)
  const unread = list.filter((n) => !n.read).length

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`通知中心${unread ? ` · ${unread} 条未读` : ''}`}
      width={420}
      footer={
        <button
          className="w-full text-center text-xs text-brand hover:underline"
          onClick={async () => {
            await markNotificationsRead(list.map((n) => n.id))
            setList((l) => l.map((n) => ({ ...n, read: true })))
          }}
        >
          全部标记为已读
        </button>
      }
    >
      <div className="flex gap-1 border-b border-line px-3 py-2">
        {(['all', '任务', '审核', '系统'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs transition-colors',
              tab === t ? 'bg-brand-soft font-medium text-brand' : 'text-t2 hover:bg-hover',
            )}
          >
            {t === 'all' ? '全部' : t}
          </button>
        ))}
      </div>
      <div className="divide-y divide-line">
        {filtered.map((n) => (
          <div key={n.id} className={cn('px-4 py-3 transition-colors hover:bg-hover', !n.read && 'bg-brand-soft/40')}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                <span className="text-xs font-medium text-t1">{n.title}</span>
              </div>
              <span className="shrink-0 text-[10px] text-t3">{relativeTime(n.time)}</span>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-t2">{n.content}</p>
            <Badge className="mt-1.5" color="var(--text-tertiary)">
              {n.type}
            </Badge>
          </div>
        ))}
      </div>
    </Drawer>
  )
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const role = useAuth((s) => s.role)
  const allowed = ROLE_PERMISSIONS[role]

  const items = useMemo(() => {
    const pages = NAV.flatMap((g) => g.items)
      .filter((i) => allowed.includes(i.key))
      .map((i) => ({ key: i.key, label: i.label, path: i.path, group: '页面' }))
    const extra = [
      { key: 'upload', label: '上传视频', path: '/videos?upload=1', group: '操作' },
      { key: 'newproj', label: '新建剪辑项目', path: '/editing', group: '操作' },
      { key: 'pipeline', label: '解析流水线编排', path: '/models/pipeline', group: '操作' },
    ]
    const all = [...pages, ...extra]
    if (!q.trim()) return all
    return all.filter((i) => i.label.includes(q.trim()))
  }, [q, allowed])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => Math.min(items.length - 1, a + 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => Math.max(0, a - 1))
      }
      if (e.key === 'Enter' && items[active]) {
        navigate(items[active].path)
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, items, active, navigate, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[14vh]">
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-[560px] overflow-hidden rounded-card border border-line bg-elevated shadow-2xl animate-scale-in">
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search size={15} className="text-t3" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            placeholder="搜索页面、视频、功能…"
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-t3"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-t3">ESC</kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto py-1.5">
          {items.length === 0 && <div className="px-4 py-6 text-center text-xs text-t3">没有匹配的结果</div>}
          {items.map((item, i) => (
            <button
              key={item.key}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                navigate(item.path)
                onClose()
              }}
              className={cn(
                'flex w-full items-center justify-between px-4 py-2 text-sm transition-colors',
                i === active ? 'bg-brand-soft text-brand' : 'text-t1 hover:bg-hover',
              )}
            >
              <span className="flex items-center gap-2">
                <Command size={13} className="text-t3" />
                {item.label}
              </span>
              <span className="text-[10px] text-t3">{item.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Topbar({ onOpenNotify, onOpenCommand }: { onOpenNotify: () => void; onOpenCommand: () => void }) {
  const loc = useLocation()
  const { theme, toggleTheme } = useUi()
  const [unread, setUnread] = useState(3)
  const [mobileNav, setMobileNav] = useState(false)

  const crumbs = loc.pathname.split('/').filter(Boolean)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button className="rounded p-1 text-t2 hover:bg-hover lg:hidden" onClick={() => setMobileNav(true)}>
          <Menu size={17} />
        </button>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-t3">
          <span>首页</span>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="text-t3">/</span>
              <span className={i === crumbs.length - 1 ? 'text-t1' : ''}>
                {CRUMB_MAP[c] ?? (c.startsWith('vid_') || c.startsWith('rv_') || c.startsWith('prj_') ? c : c)}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onOpenCommand}
          className="mr-1 hidden items-center gap-2 rounded-ctl border border-line bg-base px-2.5 py-1.5 text-[11px] text-t3 transition-colors hover:border-line-strong hover:text-t2 md:flex"
        >
          <Search size={12} />
          <span>搜索…</span>
          <kbd className="rounded border border-line bg-surface px-1 text-[10px]">⌘K</kbd>
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-ctl p-2 text-t2 transition-colors hover:bg-hover"
          title="切换主题"
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        <button
          onClick={() => {
            onOpenNotify()
            setUnread(0)
          }}
          className="relative rounded-ctl p-2 text-t2 transition-colors hover:bg-hover"
        >
          <Bell size={15} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger ring-2 ring-surface" />
          )}
        </button>
        <div className="mx-1 h-5 w-px bg-line" />
        <UserMenu />
      </div>

      {mobileNav && (
        <div className="fixed inset-0 z-[85] lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileNav(false)} />
          <div className="absolute left-0 top-0 h-full w-[232px] animate-fade-in">
            <div onClick={() => setMobileNav(false)}>
              <Sidebar />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default function AppLayout() {
  const [notify, setNotify] = useState(false)
  const [cmd, setCmd] = useState(false)
  const pause = usePlayer((s) => s.pause)
  const loc = useLocation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmd((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    pause()
    window.scrollTo(0, 0)
  }, [loc.pathname, pause])

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNotify={() => setNotify(true)} onOpenCommand={() => setCmd(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <NotificationDrawer open={notify} onClose={() => setNotify(false)} />
      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
    </div>
  )
}

export { Sparkles }
