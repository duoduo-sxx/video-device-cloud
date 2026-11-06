import { useEffect, useState } from 'react'
import { MonitorSmartphone, MousePointer2, PhoneOff, ShieldCheck, Wifi } from 'lucide-react'
import { Button, Input } from '@/components/ui/primitives'
import { StatusDot } from '@/components/common'
import { cn } from '@/utils/misc'

const CHAT = [
  { from: '李静文', text: '已接入你的控制台，先看一下指挥中心大屏的信号链路。', self: false },
  { from: '我', text: '好的，第 4 行第 3 个单元从今早开始黑屏。', self: true },
  { from: '李静文', text: '看到了，发送卡端口没信号，我重启一下该端口，请稍等 20 秒。', self: false },
]

export function RemoteSession() {
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [granted, setGranted] = useState(false)
  const [left, setLeft] = useState(300)
  const [msgs, setMsgs] = useState(CHAT)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (phase !== 'connecting') return
    const t = window.setTimeout(() => setPhase('connected'), 2200)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (!granted) return
    const t = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(t)
  }, [granted])

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 rounded-full border border-strong flex items-center justify-center text-ink-mute">
          <MonitorSmartphone size={24} strokeWidth={1.3} />
        </div>
        <div className="text-center">
          <div className="text-sm text-ink">远程协助</div>
          <div className="text-xs text-ink-mute mt-1 max-w-[360px] leading-relaxed">
            由技术服务工程师远程接入控制台，协助排查设备与系统异常。接入过程需你授权，可随时中断。
          </div>
        </div>
        <Button variant="primary" onClick={() => setPhase('connecting')} icon={<Wifi size={14} />}>
          发起协助请求
        </Button>
      </div>
    )
  }

  if (phase === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative w-14 h-14">
          <span className="absolute inset-0 rounded-full border border-brand/50 animate-ring" />
          <span className="absolute inset-0 rounded-full border border-brand/30 animate-ring" style={{ animationDelay: '0.6s' }} />
          <div className="absolute inset-0 rounded-full bg-brand/10 flex items-center justify-center text-brand">
            <MonitorSmartphone size={22} />
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-ink">正在建立加密通道…</div>
          <div className="text-2xs text-ink-mute mt-1">正在联系值班工程师 李静文</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setPhase('idle')}>
          取消
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-3 h-[calc(100vh-300px)] min-h-[420px]">
      <div className="col-span-8 rounded-card border border-strong bg-panel2/50 overflow-hidden flex flex-col">
        <div className="h-9 px-3 flex items-center justify-between border-b border-subtle shrink-0">
          <span className="flex items-center gap-1.5 text-2xs text-ink-soft">
            <StatusDot color="var(--success)" pulse />
            已连接 · 李静文（技术服务部）
          </span>
          <span className="num text-2xs text-ink-mute">延迟 38ms · 1080p</span>
        </div>
        <div className="flex-1 relative app-grid-bg flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xs text-ink-mute">屏幕共享画面</div>
            <div className="text-[10px] text-ink-mute mt-1">演示环境不采集真实屏幕内容</div>
          </div>
          {granted && (
            <>
              <span className="absolute top-1/3 left-1/2 -translate-x-1/2 text-brand/70">
                <MousePointer2 size={22} />
              </span>
              <div className="absolute bottom-2 left-3 right-3 h-8 rounded bg-panel/90 border border-strong flex items-center px-2.5 text-2xs text-ink-mute">
                工程师正在操作：设备列表 → 指挥大屏拼接单元 → 重启发送卡端口
              </div>
            </>
          )}
        </div>
        <div className="h-11 px-3 flex items-center justify-between border-t border-subtle shrink-0">
          <span className="flex items-center gap-1.5 text-2xs text-ink-mute">
            <ShieldCheck size={11} />
            {granted ? `控制权已授权，${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} 后自动释放` : '当前为只读观察模式'}
          </span>
          <div className="flex items-center gap-2">
            {!granted && (
              <Button size="sm" variant="secondary" onClick={() => setGranted(true)}>
                请求控制权
              </Button>
            )}
            <Button size="sm" variant="danger" icon={<PhoneOff size={12} />} onClick={() => { setPhase('idle'); setGranted(false); setLeft(300) }}>
              结束会话
            </Button>
          </div>
        </div>
      </div>

      <div className="col-span-4 rounded-card border border-strong flex flex-col overflow-hidden">
        <div className="h-9 px-3 flex items-center border-b border-subtle text-2xs text-ink-soft shrink-0">会话消息</div>
        <div className="flex-1 overflow-auto p-3 space-y-2.5">
          {msgs.map((m, i) => (
            <div key={i} className={cn('flex', m.self ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%] rounded-card px-2.5 py-2 text-2xs leading-relaxed', m.self ? 'bg-brand/[0.12] text-ink' : 'bg-panel2 text-ink-soft')}>
                {!m.self && <div className="text-[10px] text-ink-mute mb-0.5">{m.from}</div>}
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-subtle flex gap-1.5 shrink-0">
          <Input
            className="flex-1"
            placeholder="输入消息…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) {
                setMsgs([...msgs, { from: '我', text: draft, self: true }])
                setDraft('')
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
