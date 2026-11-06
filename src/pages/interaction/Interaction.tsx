import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AudioLines,
  Clock3,
  Hand,
  MessageSquarePlus,
  Mic,
  Send,
  Sparkles,
  Trash2,
  Volume2,
  ChevronRight,
} from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, EmptyState } from '@/components/common'
import { Button, Segmented, Slider, Switch, Tag } from '@/components/ui/primitives'
import { MessageBubble } from '@/components/biz/MessageBubble'
import { IntentPanel } from '@/components/biz/IntentPanel'
import { useInteractionStore } from '@/stores/interactionStore'
import { useDataStore } from '@/stores/dataStore'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/utils/misc'

type Phase = 'idle' | 'listening' | 'recognizing' | 'streaming'

const SAMPLE_TEXTS = [
  '启动晨间迎宾',
  '把多功能厅温度调到 24 度',
  '关闭所有投影',
  '查看 A 座 1F 设备状态',
  '现在有哪些告警',
  '把展厅亮度调高一点',
  '进入应急指挥模式',
]

const QUICK = ['启动晨间迎宾', '关闭所有投影', '现在有哪些告警', '查看 A 座 1F 设备状态', '帮我建个工单']

const GESTURES = [
  ['挥手', '左右滑动切换场景'],
  ['握拳', '确认执行当前指令'],
  ['双指捏合', '缩放态势图'],
  ['手掌下压', '降低亮度 / 音量'],
  ['食指画圈', '唤醒语音助手'],
  ['双手外扩', '进入焦点模式'],
]

export default function Interaction() {
  const { messages, thinking, send, clear, lastIntent } = useInteractionStore()
  const settings = useAppStore((s) => s.settings)
  const db = useDataStore((s) => s.db)
  const [draft, setDraft] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [panelTab, setPanelTab] = useState<'intent' | 'gesture' | 'tts'>('intent')
  const [activeSession, setActiveSession] = useState('current')
  const streamTimer = useRef<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const lastUserText = useMemo(() => {
    const u = [...messages].reverse().find((m) => m.role === 'user')
    return u?.content
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, thinking])

  useEffect(() => () => {
    if (streamTimer.current) window.clearInterval(streamTimer.current)
  }, [])

  const startListen = () => {
    if (phase !== 'idle') return
    setPhase('listening')
  }

  const stopListen = () => {
    if (phase !== 'listening') return
    setPhase('recognizing')
    const text = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)]
    window.setTimeout(() => {
      setPhase('streaming')
      let i = 0
      streamTimer.current = window.setInterval(() => {
        i += 1
        setDraft(text.slice(0, i))
        if (i >= text.length) {
          if (streamTimer.current) window.clearInterval(streamTimer.current)
          setPhase('idle')
          window.setTimeout(() => {
            send(text, 'voice')
            setDraft('')
          }, 300)
        }
      }, 45)
    }, 420)
  }

  const submit = () => {
    if (!draft.trim() || thinking) return
    send(draft, 'text')
    setDraft('')
  }

  return (
    <>
      <PageHeader
        title="多模态交互中心"
        sub="语音、文字与快捷指令统一入口，系统会展示意图解析过程与执行回执"
        actions={
          <>
            <Tag color="var(--success)" dot>
              引擎在线
            </Tag>
            <span className="text-2xs text-ink-mute num">ICE-Engine v2.4</span>
          </>
        }
      />

      <div className="flex gap-3 flex-1 min-h-0" style={{ height: 'calc(100vh - 148px)' }}>
        <aside className="w-[236px] shrink-0 panel flex flex-col overflow-hidden">
          <div className="p-2.5 border-b border-subtle">
            <Button variant="secondary" size="md" className="w-full" icon={<MessageSquarePlus size={14} />} onClick={clear}>
              新建会话
            </Button>
          </div>
          <div className="px-2.5 pt-3 pb-1 text-2xs text-ink-mute">今天</div>
          <div className="px-2 space-y-0.5 flex-1 overflow-auto">
            {[
              { id: 'current', title: '场景与设备控制', time: dayjs().format('HH:mm') },
              { id: 's2', title: '告警查询与转工单', time: '09:41' },
              { id: 's3', title: '会议室模式调试', time: '08:52' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={cn(
                  'w-full text-left px-2.5 py-2 rounded-ctrl transition-colors',
                  activeSession === s.id ? 'bg-brand/[0.1]' : 'hover:bg-panel2',
                )}
              >
                <div className={cn('text-xs truncate', activeSession === s.id ? 'text-brand' : 'text-ink-soft')}>{s.title}</div>
                <div className="text-[10px] text-ink-mute mt-0.5 flex items-center gap-1">
                  <Clock3 size={9} />
                  {s.time} · {activeSession === s.id ? messages.length : 6} 条
                </div>
              </button>
            ))}
          </div>
          <div className="px-2.5 pt-2 pb-1 text-2xs text-ink-mute border-t border-subtle">昨天</div>
          <div className="px-2 pb-2 overflow-auto max-h-[130px]">
            {['夜间巡检复盘', '展厅导览调试'].map((t) => (
              <button key={t} className="w-full text-left px-2.5 py-2 rounded-ctrl hover:bg-panel2 text-xs text-ink-soft truncate">
                {t}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex-1 min-w-0 panel flex flex-col overflow-hidden">
          <div className="h-11 px-4 flex items-center justify-between border-b border-subtle shrink-0">
            <div className="flex items-center gap-2 text-xs text-ink">
              <Sparkles size={13} className="text-brand" />
              场景与设备控制
            </div>
            <div className="flex items-center gap-2">
              <Tag color="var(--info)">多轮上下文</Tag>
              <button onClick={clear} aria-label="清空会话" className="text-ink-mute hover:text-bad transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}
            {thinking && (
              <div className="flex items-center gap-2 text-2xs text-ink-mute pl-9">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand animate-softPulse" style={{ animationDelay: `${i * 0.16}s` }} />
                  ))}
                </span>
                正在解析意图…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-subtle p-3 shrink-0">
            <div className="flex gap-1.5 mb-2 overflow-x-auto pb-0.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q, 'quick')}
                  className="shrink-0 h-6 px-2 rounded-full border border-strong bg-panel2 text-2xs text-ink-soft hover:text-brand hover:border-brand/40 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2">
              <button
                onMouseDown={startListen}
                onMouseUp={stopListen}
                onMouseLeave={() => phase === 'listening' && stopListen()}
                onTouchStart={(e) => {
                  e.preventDefault()
                  startListen()
                }}
                onTouchEnd={stopListen}
                aria-label="按住说话"
                className={cn(
                  'relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
                  phase === 'idle' ? 'bg-panel2 border border-strong text-ink-soft hover:text-brand hover:border-brand/40' : 'bg-brand text-canvas',
                )}
              >
                {phase !== 'idle' && <span className="absolute inset-0 rounded-full border border-brand animate-ring" />}
                <Mic size={15} />
              </button>

              <div className="flex-1 min-w-0 relative">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submit()
                    }
                  }}
                  rows={1}
                  placeholder={phase === 'listening' ? '正在聆听…' : phase === 'recognizing' ? '识别中…' : '输入指令，或按住左侧按钮说话…'}
                  className="w-full resize-none rounded-card bg-panel2 border border-strong px-3 py-2.5 text-sm text-ink placeholder:text-ink-mute focus-ring focus:border-brand/60 max-h-28"
                  style={{ height: 38 }}
                />
                {phase === 'listening' && (
                  <div className="absolute inset-0 rounded-card bg-panel2 border border-brand/50 flex items-center justify-center gap-[3px] px-3">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <span
                        key={i}
                        className="wave-bar w-[3px] bg-brand"
                        style={{ height: `${8 + ((i * 7) % 16)}px`, animationDelay: `${(i % 8) * 0.06}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                size="md"
                className="h-9 w-9 !px-0 shrink-0"
                disabled={!draft.trim() || thinking}
                onClick={submit}
                icon={<Send size={15} />}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 px-0.5">
              <span className="text-[10px] text-ink-mute">Enter 发送 · Shift+Enter 换行 · 按住麦克风模拟语音</span>
              <span className="text-[10px] text-ink-mute num">{draft.length}/200</span>
            </div>
          </div>
        </section>

        <aside className="w-[352px] shrink-0 panel flex flex-col overflow-hidden">
          <div className="px-3 pt-2 shrink-0">
            <Segmented
              className="w-full"
              options={[
                { label: '意图解析', value: 'intent' },
                { label: '手势指令', value: 'gesture' },
                { label: '播报设置', value: 'tts' },
              ]}
              value={panelTab}
              onChange={(v) => setPanelTab(v as typeof panelTab)}
            />
          </div>

          <div className="flex-1 overflow-auto">
            {panelTab === 'intent' && <IntentPanel intent={lastIntent} rawText={lastUserText} empty={!lastIntent} />}

            {panelTab === 'gesture' && (
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-2xs text-ink-mute mb-3">
                  <Hand size={12} />
                  手势识别模组 · LMC2 · 模拟状态
                </div>
                {GESTURES.map(([g, d]) => (
                  <div key={g} className="flex items-center gap-2.5 rounded-ctrl border border-strong bg-panel2/60 px-3 py-2.5">
                    <span className="w-6 h-6 rounded-md bg-accent/12 text-accent flex items-center justify-center shrink-0">
                      <Hand size={12} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-ink">{g}</div>
                      <div className="text-2xs text-ink-mute">{d}</div>
                    </div>
                    <ChevronRight size={12} className="text-ink-mute shrink-0" />
                  </div>
                ))}
                <p className="text-2xs text-ink-mute leading-relaxed pt-2">
                  演示环境下手势识别为模拟态，不会真实采集摄像头画面。实际部署时由边缘节点本地推理，不上传原始视频。
                </p>
              </div>
            )}

            {panelTab === 'tts' && (
              <div className="p-4 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 size={14} className="text-brand" />
                    <div>
                      <div className="text-xs text-ink">语音播报</div>
                      <div className="text-2xs text-ink-mute">执行结果通过 TTS 播报</div>
                    </div>
                  </div>
                  <Switch checked={settings.tts} onChange={() => undefined} label="语音播报" />
                </div>

                <div>
                  <div className="text-xs text-ink-soft mb-2">音色</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['清朗男声', '温和女声', '沉稳播报'].map((v) => (
                      <div
                        key={v}
                        className={cn(
                          'h-8 rounded-ctrl border flex items-center justify-center text-2xs',
                          settings.voice === v ? 'border-brand/50 bg-brand/[0.1] text-brand' : 'border-strong bg-panel2 text-ink-soft',
                        )}
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-ink-soft">语速</span>
                    <span className="num text-2xs text-ink-mute">{settings.speed}%</span>
                  </div>
                  <Slider value={settings.speed} onChange={() => undefined} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-ink-soft">语音灵敏度</span>
                    <span className="num text-2xs text-ink-mute">{settings.sensitivity}</span>
                  </div>
                  <Slider value={settings.sensitivity} onChange={() => undefined} accent="var(--accent)" />
                </div>

                <div className="rounded-card border border-strong bg-panel2/60 p-3">
                  <div className="flex items-center gap-1.5 text-2xs text-ink-soft mb-1.5">
                    <AudioLines size={11} />
                    试听
                  </div>
                  <p className="text-2xs text-ink-mute leading-relaxed">
                    「场景已启动，共影响 14 台设备，耗时 8.4 秒。投影阵列 B 未响应，已记录失败项。」
                  </p>
                  <Button size="sm" variant="ghost" className="mt-2" onClick={() => undefined}>
                    播放示例
                  </Button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
