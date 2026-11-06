import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Bell, CheckCheck, FileText, ListChecks, Settings2 } from 'lucide-react'
import dayjs from 'dayjs'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { Drawer, Modal, ToastHost } from '@/components/ui/overlay'
import { Button, Tabs } from '@/components/ui/primitives'
import { EmptyState } from '@/components/common'
import { SHORTCUTS } from '@/constants/enums'
import { useAppStore } from '@/stores/appStore'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/misc'

const NOTIF_ICON = {
  alert: AlertTriangle,
  task: ListChecks,
  ticket: FileText,
  system: Settings2,
}
const NOTIF_COLOR = {
  alert: 'var(--danger)',
  task: 'var(--brand)',
  ticket: 'var(--warning)',
  system: 'var(--info)',
}

function NotificationCenter() {
  const open = useUIStore((s) => s.notifOpen)
  const setOpen = useUIStore((s) => s.setNotifOpen)
  const db = useDataStore((s) => s.db)
  const markRead = useDataStore((s) => s.markNotificationRead)
  const markAll = useDataStore((s) => s.markAllNotificationsRead)
  const navigate = useNavigate()
  const [tab, setTab] = useState<string>('all')

  const list = db.notifications.filter((n) => tab === 'all' || n.type === tab)

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title="通知中心"
      subtitle={`${db.notifications.filter((n) => !n.read).length} 条未读`}
      width={420}
      footer={
        <Button size="sm" variant="secondary" icon={<CheckCheck size={13} />} onClick={markAll}>
          全部标为已读
        </Button>
      }
    >
      <div className="px-4">
        <Tabs
          tabs={[
            { key: 'all', label: '全部' },
            { key: 'alert', label: '告警' },
            { key: 'task', label: '任务' },
            { key: 'ticket', label: '工单' },
            { key: 'system', label: '系统' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      <div className="p-2">
        {list.length === 0 && <EmptyState title="暂无通知" desc="新的告警、任务与工单会出现在这里" icon={<Bell size={40} strokeWidth={1.2} />} />}
        {list.map((n) => {
          const Icon = NOTIF_ICON[n.type]
          return (
            <button
              key={n.id}
              onClick={() => {
                markRead(n.id)
                if (n.link) navigate(n.link)
                setOpen(false)
              }}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-card transition-colors flex gap-2.5',
                n.read ? 'hover:bg-panel2' : 'bg-brand/[0.05] hover:bg-brand/[0.09]',
              )}
            >
              <span
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${NOTIF_COLOR[n.type]}18`, color: NOTIF_COLOR[n.type] }}
              >
                <Icon size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className={cn('text-xs leading-snug', n.read ? 'text-ink-soft' : 'text-ink')}>{n.title}</span>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-1" />}
                </span>
                <span className="block text-2xs text-ink-mute mt-0.5 line-clamp-2 leading-relaxed">{n.desc}</span>
                <span className="block text-[10px] text-ink-mute mt-1">{dayjs(n.time).fromNow()}</span>
              </span>
            </button>
          )
        })}
      </div>
    </Drawer>
  )
}

function ShortcutsDialog() {
  const open = useUIStore((s) => s.shortcutsOpen)
  const setOpen = useUIStore((s) => s.setShortcutsOpen)
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="键盘快捷键" desc="按 Esc 关闭" width={520}>
      <div className="space-y-5">
        {SHORTCUTS.map((g) => (
          <div key={g.group}>
            <div className="text-2xs text-ink-mute mb-2 tracking-wide">{g.group}</div>
            <div className="space-y-1.5">
              {g.items.map((it) => (
                <div key={it.desc} className="flex items-center justify-between h-7">
                  <span className="text-xs text-ink-soft">{it.desc}</span>
                  <span className="flex items-center gap-1">
                    {it.keys.map((k) => (
                      <span key={k} className="kbd">
                        {k}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const focusMode = useAppStore((s) => s.focusMode)
  const toggleFocus = useAppStore((s) => s.toggleFocus)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const { setCommandOpen, setShortcutsOpen } = useUIStore()
  const init = useDataStore((s) => s.init)
  const tick = useDataStore((s) => s.tickDevices)
  const pushAlert = useDataStore((s) => s.pushAlert)
  const refreshed = useDataStore((s) => s.db.lastSync)
  const refreshInterval = useAppStore((s) => s.settings.refreshInterval)
  const pendingP1 = useDataStore((s) => s.db.alerts.filter((a) => a.level === 'P1' && a.status !== 'closed' && a.status !== 'recovered').length)

  const seqRef = useRef<{ key: string; at: number }>({ key: '', at: 0 })

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (!refreshInterval) return
    const t = window.setInterval(tick, refreshInterval * 1000)
    return () => window.clearInterval(t)
  }, [tick, refreshInterval])

  useEffect(() => {
    const t = window.setInterval(() => pushAlert(), 32000)
    return () => window.clearInterval(t)
  }, [pushAlert])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(true)
        return
      }
      if (typing) return

      if (e.key === 'Escape') {
        if (useAppStore.getState().focusMode) toggleFocus()
        return
      }
      if (e.key === '?') {
        setShortcutsOpen(true)
        return
      }
      if (e.key.toLowerCase() === 'f') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => undefined)
        else document.exitFullscreen().catch(() => undefined)
        return
      }
      if (e.shiftKey && e.key.toLowerCase() === 'l') {
        toggleTheme()
        return
      }
      if (e.shiftKey && e.key.toLowerCase() === 'c') {
        toggleFocus()
        return
      }
      if (e.key.toLowerCase() === 'g') {
        seqRef.current = { key: 'g', at: Date.now() }
        return
      }
      const map: Record<string, string> = { d: '/', i: '/interaction', a: '/alerts', t: '/service' }
      if (seqRef.current.key === 'g' && Date.now() - seqRef.current.at < 1200 && map[e.key.toLowerCase()]) {
        navigate(map[e.key.toLowerCase()])
        seqRef.current = { key: '', at: 0 }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, setCommandOpen, setShortcutsOpen, toggleFocus, toggleTheme])

  return (
    <div className="h-full flex bg-canvas text-ink overflow-hidden">
      {!focusMode && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {!focusMode && <Topbar />}
        <main className="flex-1 overflow-auto relative app-grid-bg">
          <div className="pointer-events-none absolute inset-0 overflow-hidden ambient" />
          <div className="relative p-5 min-h-full">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="min-h-full flex flex-col"
            >
              <Outlet />
            </motion.div>
          </div>
          {pendingP1 > 0 && (
            <div
              className="pointer-events-none fixed inset-0 z-10 animate-softPulse"
              style={{ boxShadow: 'inset 0 0 0 2px rgba(248,113,113,0.35), inset 0 0 90px rgba(248,113,113,0.10)' }}
            />
          )}
        </main>
        {focusMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 h-8 rounded-full bg-panel border border-strong shadow-float text-xs text-ink-soft">
            已进入焦点模式
            <span className="kbd">Esc</span>
            退出
          </div>
        )}
      </div>
      <CommandPalette />
      <NotificationCenter />
      <ShortcutsDialog />
      <ToastHost />
      <span className="hidden">{refreshed}</span>
    </div>
  )
}
