import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  Expand,
  Minimize2,
  Moon,
  Search,
  Sun,
  UserCog,
  LogOut,
  Settings as SettingsIcon,
  Info,
  Focus,
} from 'lucide-react'
import dayjs from 'dayjs'
import { useAppStore } from '@/stores/appStore'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { ROLE_LABEL } from '@/constants/enums'
import { Avatar, StatusDot } from '@/components/common'
import { IconButton } from '@/components/ui/primitives'
import { cn } from '@/utils/misc'
import type { Role } from '@/types'

const ROLES: Role[] = ['operator', 'engineer', 'manager', 'guest']

export function Topbar() {
  const [clock, setClock] = useState(dayjs())
  const [menuOpen, setMenuOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { theme, toggleTheme, user, login, logout, focusMode, toggleFocus } = useAppStore()
  const db = useDataStore((s) => s.db)
  const { setCommandOpen, setNotifOpen } = useUIStore()

  const unread = db.notifications.filter((n) => !n.read).length
  const online = db.devices.filter((d) => d.status === 'online').length
  const envDevice = db.devices.find((d) => d.id === 'DEV-0124') ?? db.devices.find((d) => d.category === 'sensor')

  useEffect(() => {
    const t = window.setInterval(() => setClock(dayjs()), 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const onFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined)
      setFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => undefined)
      setFullscreen(false)
    }
  }

  const temp = envDevice?.metrics.find((m) => m.key === 'temperature')?.value ?? 23.4
  const co2 = envDevice?.metrics.find((m) => m.key === 'co2')?.value ?? 680

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-subtle bg-panel/60 backdrop-blur-sm relative z-20">
      <div className="flex items-center gap-5 min-w-0">
        <div className="num text-md text-ink tracking-wider tabular-nums">{clock.format('HH:mm:ss')}</div>
        <div className="h-4 w-px bg-[var(--border-strong)]" />
        <div className="flex items-center gap-1.5 text-xs text-ink-soft">
          <StatusDot color="var(--success)" pulse />
          <span className="num">
            {online}/{db.devices.length}
          </span>
          <span className="text-ink-mute">在线设备</span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="num">{temp}℃</span>
          <span className="text-ink-mute">·</span>
          <span className={cn('num', co2 > 1000 && 'text-warn')}>CO₂ {Math.round(co2)}ppm</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden md:flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-ctrl border border-strong bg-panel2 text-xs text-ink-mute hover:border-brand/40 hover:text-ink-soft transition-colors focus-ring"
        >
          <Search size={13} />
          <span className="w-24 text-left">搜索设备 / 场景</span>
          <span className="kbd">⌘K</span>
        </button>

        <div className="relative">
          <IconButton label="通知" onClick={() => setNotifOpen(true)}>
            <Bell size={16} />
          </IconButton>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-bad text-white text-[10px] num flex items-center justify-center pointer-events-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>

        <IconButton label="切换主题" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </IconButton>
        <IconButton label={focusMode ? '退出焦点模式' : '进入焦点模式'} active={focusMode} onClick={toggleFocus}>
          <Focus size={16} />
        </IconButton>
        <IconButton label="全屏" onClick={onFullscreen}>
          {fullscreen ? <Minimize2 size={16} /> : <Expand size={16} />}
        </IconButton>

        <div className="h-4 w-px bg-[var(--border-strong)] mx-1" />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 h-8 pl-1 pr-1.5 rounded-ctrl hover:bg-panel2 transition-colors focus-ring"
          >
            {user && <Avatar name={user.name} color={user.avatarColor} size={26} />}
            <div className="text-left hidden sm:block">
              <div className="text-xs text-ink leading-tight">{user?.name ?? '未登录'}</div>
              <div className="text-[10px] text-ink-mute leading-tight">{user ? ROLE_LABEL[user.role] : '—'}</div>
            </div>
            <ChevronDown size={13} className={cn('text-ink-mute transition-transform', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-56 bg-panel border border-strong rounded-card shadow-float py-1.5 z-50">
              <div className="px-3 py-1.5 text-2xs text-ink-mute">切换演示角色</div>
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    login(r)
                    setMenuOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 h-8 text-xs transition-colors',
                    user?.role === r ? 'text-brand bg-brand/[0.08]' : 'text-ink-soft hover:bg-panel2 hover:text-ink',
                  )}
                >
                  <span>{ROLE_LABEL[r]}</span>
                  <UserCog size={13} />
                </button>
              ))}
              <div className="h-px bg-[var(--border-subtle)] my-1.5" />
              <button
                onClick={() => {
                  navigate('/settings')
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 h-8 text-xs text-ink-soft hover:bg-panel2 hover:text-ink transition-colors"
              >
                <SettingsIcon size={13} /> 系统设置
              </button>
              <button
                onClick={() => {
                  navigate('/about')
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 h-8 text-xs text-ink-soft hover:bg-panel2 hover:text-ink transition-colors"
              >
                <Info size={13} /> 关于系统
              </button>
              <div className="h-px bg-[var(--border-subtle)] my-1.5" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 h-8 text-xs text-bad hover:bg-bad/[0.08] transition-colors"
              >
                <LogOut size={13} /> 退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
