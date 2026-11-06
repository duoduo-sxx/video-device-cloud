import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BellOff, CheckCheck, Clock, ListChecks, Sparkles } from 'lucide-react'
import { db } from '../../mock/db'
import { useUI } from '../../store/ui'
import { Drawer } from '../ui'
import { cn } from '../../lib/cn'
import { fromNow } from '../../lib/format'

const TYPE_META = {
  task: { label: '任务', icon: ListChecks, color: 'var(--primary)' },
  review: { label: '验收', icon: CheckCheck, color: 'var(--success)' },
  sla: { label: 'SLA', icon: Clock, color: 'var(--accent)' },
  system: { label: '系统', icon: Sparkles, color: 'var(--purple)' },
}

export function NotificationDrawer() {
  const { setNotifyOpen } = useUI()
  const navigate = useNavigate()
  const [items, setItems] = useState(db.notifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const shown = filter === 'all' ? items : items.filter((i) => !i.read)
  const unread = items.filter((i) => !i.read).length

  const markAll = () => {
    items.forEach((i) => (i.read = true))
    setItems([...items])
  }

  return (
    <Drawer
      open
      onClose={() => setNotifyOpen(false)}
      title="通知中心"
      desc={`${unread} 条未读 · 共 ${items.length} 条`}
      width={460}
      footer={
        <div className="flex items-center justify-between">
          <button onClick={markAll} className="text-[12px] text-[var(--primary)] hover:underline">
            全部标记为已读
          </button>
          <span className="text-[11px] text-[var(--text-3)]">仅保留最近 30 天</span>
        </div>
      }
    >
      <div className="mb-3 flex items-center gap-1">
        {[
          { key: 'all', label: '全部' },
          { key: 'unread', label: '未读' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key as 'all' | 'unread')}
            className={cn(
              'rounded-md px-2 py-1 text-[12px]',
              filter === t.key ? 'bg-[var(--bg-3)] text-[var(--text-1)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-[var(--text-3)]">
          <BellOff size={24} className="mb-2 opacity-60" />
          <span className="text-[12px]">没有未读通知</span>
        </div>
      ) : (
        <div className="space-y-1">
          {shown.map((n) => {
            const meta = TYPE_META[n.type]
            const Icon = meta.icon
            return (
              <button
                key={n.id}
                onClick={() => {
                  n.read = true
                  setItems([...items])
                  setNotifyOpen(false)
                  navigate(n.link)
                }}
                className={cn(
                  'flex w-full gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  n.read
                    ? 'border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-2)]'
                    : 'border-[var(--border)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)]',
                )}
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{ color: meta.color, background: 'var(--bg-3)' }}
                >
                  <Icon size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] text-[var(--text-1)]">{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-5 text-[var(--text-2)]">{n.body}</span>
                  <span className="mt-1 block text-[11px] text-[var(--text-3)]">{fromNow(n.at)}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </Drawer>
  )
}
