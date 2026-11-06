import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronDown,
  FileText,
  Mic,
  RotateCcw,
  Sparkles,
  Terminal,
  XCircle,
} from 'lucide-react'
import dayjs from 'dayjs'
import type { ChatMessage, Device, Alert } from '@/types'
import { Button, Tag } from '@/components/ui/primitives'
import { Countdown, StatusDot } from '@/components/common'
import { useInteractionStore } from '@/stores/interactionStore'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/misc'

const EXEC_STYLE = {
  success: { color: 'var(--success)', icon: CheckCircle2, label: '执行成功' },
  partial: { color: 'var(--warning)', icon: AlertCircle, label: '部分完成' },
  failed: { color: 'var(--danger)', icon: XCircle, label: '执行失败' },
}

function ConfirmCard({ msg }: { msg: ChatMessage }) {
  const confirm = useInteractionStore((s) => s.confirm)
  const cancel = useInteractionStore((s) => s.cancelConfirm)
  const fired = useRef(false)
  if (!msg.needConfirm) return null

  return (
    <div className="mt-2 rounded-card border border-warn/35 bg-warn/[0.07] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-xs text-warn">
          <AlertCircle size={13} />
          待确认执行 · 影响 {msg.needConfirm.devices} 台设备
        </span>
        <span className="text-2xs text-ink-mute flex items-center gap-1">
          <Countdown
            to={msg.needConfirm.expireAt}
            onEnd={() => {
              if (fired.current) return
              fired.current = true
              cancel(msg.id)
            }}
          />
          后自动取消
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            fired.current = true
            confirm(msg.id)
          }}
        >
          确认执行
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            fired.current = true
            cancel(msg.id)
          }}
        >
          取消
        </Button>
      </div>
    </div>
  )
}

function ExecCard({ msg }: { msg: ChatMessage }) {
  const [open, setOpen] = useState(false)
  const [undoLeft, setUndoLeft] = useState(msg.exec?.undoable ? 5 : 0)
  const undo = useInteractionStore((s) => s.undo)
  const toast = useUIStore((s) => s.toast)

  useEffect(() => {
    if (!undoLeft) return
    const t = window.setInterval(() => setUndoLeft((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(t)
  }, [undoLeft])

  if (!msg.exec) return null
  const style = EXEC_STYLE[msg.exec.status]
  const Icon = style.icon

  return (
    <div className="mt-2 rounded-card border border-strong bg-panel2/70 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={14} style={{ color: style.color }} className="shrink-0" />
          <span className="text-xs text-ink truncate">{msg.exec.title}</span>
          <Tag color={style.color}>{style.label}</Tag>
        </div>
        {msg.exec.undoable && undoLeft > 0 && (
          <button
            onClick={() => {
              undo(msg.id)
              toast('info', '已撤销本次操作', '设备状态正在回滚')
            }}
            className="flex items-center gap-1 text-2xs text-brand hover:text-brand-deep shrink-0"
          >
            <RotateCcw size={11} />
            撤销 {undoLeft}s
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 text-2xs text-ink-mute mt-1.5">
        <span className="num">{msg.exec.devices} 台设备</span>
        <span>·</span>
        <span className="num">耗时 {(msg.exec.cost / 1000).toFixed(1)}s</span>
        {msg.exec.failed && msg.exec.failed.length > 0 && (
          <>
            <span>·</span>
            <button onClick={() => setOpen((v) => !v)} className="text-warn flex items-center gap-0.5">
              {msg.exec.failed.length} 项失败
              <ChevronDown size={10} className={cn('transition-transform', open && 'rotate-180')} />
            </button>
          </>
        )}
      </div>
      {open && msg.exec.failed && (
        <div className="mt-2 pt-2 border-t border-subtle space-y-1">
          {msg.exec.failed.map((f) => (
            <div key={f} className="flex items-center gap-1.5 text-2xs text-ink-soft">
              <Ban size={10} className="text-bad" />
              {f}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CardBody({ msg }: { msg: ChatMessage }) {
  const navigate = useNavigate()
  if (!msg.card) return null

  if (msg.card.type === 'alertSummary') {
    const list = msg.card.payload as Alert[]
    return (
      <div className="mt-2 rounded-card border border-strong overflow-hidden">
        {list.map((a, i) => (
          <button
            key={a.id}
            onClick={() => navigate('/alerts')}
            className={cn('w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-panel2 transition-colors', i !== 0 && 'border-t border-subtle')}
          >
            <StatusDot color={a.level === 'P1' ? 'var(--danger)' : a.level === 'P2' ? 'var(--warning)' : 'var(--info)'} size={6} />
            <span className="text-2xs text-ink flex-1 truncate">{a.title}</span>
            <span className="text-[10px] text-ink-mute shrink-0">{a.deviceName}</span>
          </button>
        ))}
      </div>
    )
  }

  if (msg.card.type === 'deviceList') {
    const list = msg.card.payload as Device[]
    return (
      <div className="mt-2 rounded-card border border-strong overflow-hidden">
        {list.map((d, i) => (
          <button
            key={d.id}
            onClick={() => navigate(`/devices?focus=${d.id}`)}
            className={cn('w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-panel2 transition-colors', i !== 0 && 'border-t border-subtle')}
          >
            <StatusDot color={d.status === 'online' ? 'var(--success)' : d.status === 'warning' ? 'var(--danger)' : '#64748B'} size={6} />
            <span className="text-2xs text-ink flex-1 truncate">{d.name}</span>
            <span className="num text-[10px] text-ink-mute shrink-0">{d.health}%</span>
          </button>
        ))}
      </div>
    )
  }

  if (msg.card.type === 'stat') {
    const s = msg.card.payload as { total: number; scenes: number; done: number; rate: string }
    return (
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[
          ['交互指令', s.total],
          ['场景执行', s.scenes],
          ['完成率', s.rate],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-ctrl border border-strong bg-panel2 px-2.5 py-2">
            <div className="text-[10px] text-ink-mute">{k}</div>
            <div className="num text-sm text-ink mt-0.5">{v}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-2">
      <Button size="sm" variant="secondary" icon={<FileText size={12} />} onClick={() => navigate('/service')}>
        前往创建工单
      </Button>
    </div>
  )
}

export function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26 }}
      className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div
        className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-2xs',
          isUser ? 'bg-brand/15 text-brand border border-brand/25' : 'bg-accent/15 text-accent border border-accent/25',
        )}
      >
        {isUser ? (msg.inputMode === 'voice' ? <Mic size={13} /> : <Terminal size={13} />) : <Sparkles size={13} />}
      </div>

      <div className={cn('max-w-[78%] min-w-0', isUser && 'flex flex-col items-end')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xs text-ink-mute">{isUser ? '我' : 'ICE 引擎'}</span>
          <span className="text-[10px] text-ink-mute num">{dayjs(msg.createdAt).format('HH:mm:ss')}</span>
        </div>

        {msg.content && (
          <div
            className={cn(
              'rounded-card px-3 py-2.5 text-sm leading-relaxed',
              isUser
                ? 'bg-brand/[0.1] border border-brand/25 text-ink'
                : 'bg-panel border border-strong text-ink',
            )}
          >
            {msg.content}
          </div>
        )}

        {!isUser && msg.intent && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-ink-mute">
            <span className="font-mono">{msg.intent.intent}</span>
            <span>·</span>
            <span className="num">置信度 {(msg.intent.confidence * 100).toFixed(0)}%</span>
          </div>
        )}

        {!isUser && <ConfirmCard msg={msg} />}
        {!isUser && <ExecCard msg={msg} />}
        {!isUser && <CardBody msg={msg} />}
      </div>
    </motion.div>
  )
}
