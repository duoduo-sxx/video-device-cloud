import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CornerDownLeft,
  Cpu,
  LayoutDashboard,
  Search,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { NAV_GROUPS, PAGE_TITLES } from '@/constants/nav'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/utils/misc'
import { DEVICE_STATUS_LABEL } from '@/constants/enums'
import { useInteractionStore } from '@/stores/interactionStore'

interface Item {
  id: string
  group: string
  title: string
  sub?: string
  icon: React.ReactNode
  run: () => void
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen)
  const setOpen = useUIStore((s) => s.setCommandOpen)
  const db = useDataStore((s) => s.db)
  const navigate = useNavigate()
  const send = useInteractionStore((s) => s.send)
  const user = useAppStore((s) => s.user)
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setCursor(0)
      window.setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = []
    NAV_GROUPS.forEach((g) =>
      g.items
        .filter((i) => !i.roles || (user && i.roles.includes(user.role)))
        .forEach((i) => {
          const meta = PAGE_TITLES[i.path.split('?')[0]]
          pages.push({
            id: `page-${i.key}`,
            group: '页面',
            title: i.label,
            sub: meta?.sub,
            icon: <LayoutDashboard size={14} />,
            run: () => navigate(i.path),
          })
        }),
    )

    const devices: Item[] = db.devices.map((d) => {
      const space = db.spaces.find((s) => s.id === d.spaceId)
      return {
        id: `dev-${d.id}`,
        group: '设备',
        title: d.name,
        sub: `${space?.building}${space?.floor}F ${space?.name} · ${DEVICE_STATUS_LABEL[d.status]} · ${d.code}`,
        icon: <Cpu size={14} />,
        run: () => navigate(`/devices?focus=${d.id}`),
      }
    })

    const scenes: Item[] = db.scenes.map((s) => ({
      id: `scene-${s.id}`,
      group: '场景',
      title: s.name,
      sub: `${s.deviceCount} 台设备 · 已执行 ${s.usedCount} 次`,
      icon: <Sparkles size={14} />,
      run: () => navigate(`/scenes/${s.id}`),
    }))

    const cmds: Item[] = [
      '启动晨间迎宾模式',
      '关闭所有投影',
      '把多功能厅温度调到 24 度',
      '查看当前有哪些告警',
      '帮我建个工单',
      '进入应急指挥模式',
    ].map((t, i) => ({
      id: `cmd-${i}`,
      group: '指令',
      title: t,
      sub: '发送到多模态交互中心',
      icon: <Terminal size={14} />,
      run: () => {
        navigate('/interaction')
        window.setTimeout(() => send(t, 'quick'), 260)
      },
    }))

    const key = q.trim().toLowerCase()
    const all = [...pages, ...scenes, ...devices, ...cmds]
    if (!key) return [...cmds.slice(0, 4), ...pages.slice(0, 6), ...scenes.slice(0, 3)]
    return all
      .filter((i) => i.title.toLowerCase().includes(key) || (i.sub ?? '').toLowerCase().includes(key))
      .slice(0, 14)
  }, [q, db, navigate, send, user])

  useEffect(() => setCursor(0), [q])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => Math.min(c + 1, items.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => Math.max(c - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = items[cursor]
        if (item) {
          item.run()
          setOpen(false)
        }
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, items, cursor, setOpen])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  let lastGroup = ''

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70]"
            style={{ background: 'rgba(4,8,14,0.7)', backdropFilter: 'blur(6px)' }}
          />
          <div className="fixed inset-0 z-[71] flex items-start justify-center pt-[12vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.985 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="w-full max-w-[640px] bg-panel border border-strong rounded-float shadow-float overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center gap-2.5 px-4 h-12 border-b border-subtle">
                <Search size={15} className="text-ink-mute shrink-0" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="搜索页面、设备、场景，或直接输入指令…"
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-ink placeholder:text-ink-mute"
                />
                <span className="kbd">Esc</span>
              </div>

              <div ref={listRef} className="max-h-[52vh] overflow-auto py-1.5">
                {items.length === 0 && (
                  <div className="py-10 text-center text-xs text-ink-mute">没有匹配结果，换个关键词试试</div>
                )}
                {items.map((item, idx) => {
                  const showGroup = item.group !== lastGroup
                  lastGroup = item.group
                  return (
                    <div key={item.id}>
                      {showGroup && (
                        <div className="px-4 pt-2 pb-1 text-2xs text-ink-mute tracking-wide">{item.group}</div>
                      )}
                      <button
                        data-idx={idx}
                        onMouseEnter={() => setCursor(idx)}
                        onClick={() => {
                          item.run()
                          setOpen(false)
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 h-11 text-left transition-colors',
                          idx === cursor ? 'bg-brand/[0.1]' : 'hover:bg-panel2',
                        )}
                      >
                        <span className={cn('shrink-0', idx === cursor ? 'text-brand' : 'text-ink-mute')}>{item.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block text-sm truncate', idx === cursor ? 'text-brand' : 'text-ink')}>
                            {item.title}
                          </span>
                          {item.sub && <span className="block text-2xs text-ink-mute truncate">{item.sub}</span>}
                        </span>
                        {idx === cursor && <CornerDownLeft size={13} className="text-brand shrink-0" />}
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between px-4 h-9 border-t border-subtle text-2xs text-ink-mute">
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="kbd">↑</span><span className="kbd">↓</span> 选择</span>
                  <span className="flex items-center gap-1"><span className="kbd">↵</span> 执行</span>
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft size={11} />
                  共 {items.length} 项
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
