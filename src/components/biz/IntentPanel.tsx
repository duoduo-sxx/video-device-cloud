import { motion } from 'framer-motion'
import { Braces, ChevronRight, Radar, Target } from 'lucide-react'
import type { ParsedIntent } from '@/types'
import { GaugeRing } from '@/components/common'
import { cn } from '@/utils/misc'

export function IntentPanel({ intent, rawText, empty }: { intent: ParsedIntent | null; rawText?: string; empty?: boolean }) {
  if (!intent || empty) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center gap-3">
        <div className="w-12 h-12 rounded-full border border-strong flex items-center justify-center text-ink-mute">
          <Radar size={20} strokeWidth={1.4} />
        </div>
        <div>
          <div className="text-xs text-ink-soft">等待指令输入</div>
          <div className="text-2xs text-ink-mute mt-1 leading-relaxed">
            发送一条指令后，这里会展示
            <br />
            意图识别结果、槽位与置信度
          </div>
        </div>
      </div>
    )
  }

  const confColor = intent.confidence >= 0.85 ? 'var(--success)' : intent.confidence >= 0.7 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div className="p-4 space-y-5">
      <div>
        <div className="text-2xs text-ink-mute mb-1.5">识别原文</div>
        <div className="rounded-ctrl bg-panel2 border border-strong px-2.5 py-2 text-xs text-ink leading-relaxed">
          {rawText ?? '—'}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-card border border-strong bg-panel2/60 p-3">
        <GaugeRing value={intent.confidence * 100} size={62} stroke={5} color={confColor} />
        <div className="min-w-0">
          <div className="text-2xs text-ink-mute">置信度</div>
          <div className="num text-md text-ink mt-0.5">{(intent.confidence * 100).toFixed(1)}%</div>
          <div className="text-2xs text-ink-mute mt-1 truncate">
            {intent.confidence >= 0.85 ? '可直接执行' : intent.confidence >= 0.7 ? '建议人工确认' : '需补充信息'}
          </div>
        </div>
      </div>

      <div>
        <div className="text-2xs text-ink-mute mb-1.5">命中意图</div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded bg-brand/[0.1] border border-brand/25 text-brand text-xs">
            <Target size={11} />
            <span className="font-mono text-[11px]">{intent.intent}</span>
          </span>
          <span className="text-xs text-ink-soft">{intent.intentLabel}</span>
        </div>
      </div>

      <div>
        <div className="text-2xs text-ink-mute mb-1.5">槽位抽取</div>
        <div className="rounded-card border border-strong overflow-hidden">
          {intent.slots.length === 0 && <div className="px-3 py-3 text-2xs text-ink-mute">无槽位</div>}
          {intent.slots.map((s, i) => (
            <div
              key={s.key}
              className={cn('flex items-center gap-2 px-3 py-2 text-xs', i !== 0 && 'border-t border-subtle')}
            >
              <span className="text-ink-mute w-14 shrink-0">{s.label}</span>
              <span className="text-ink flex-1 truncate">{s.value}</span>
              <span className="text-[10px] text-ink-mute shrink-0 px-1 rounded bg-panel2">{s.source}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-2xs text-ink-mute mb-1.5">命中规则</div>
        <div className="flex items-start gap-1.5 text-2xs text-ink-soft leading-relaxed">
          <Braces size={11} className="mt-0.5 shrink-0 text-ink-mute" />
          {intent.rule}
        </div>
      </div>

      <div>
        <div className="text-2xs text-ink-mute mb-1.5">候选意图</div>
        <div className="space-y-1.5">
          {intent.candidates.map((c, i) => (
            <motion.div
              key={c.intent}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <ChevronRight size={11} className="text-ink-mute shrink-0" />
              <span className="text-2xs text-ink-soft w-[92px] shrink-0 truncate">{c.label}</span>
              <div className="flex-1 h-1 rounded-full bg-panel2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand/60"
                  style={{ width: `${Math.min(100, c.score * 100)}%` }}
                />
              </div>
              <span className="num text-[10px] text-ink-mute w-8 text-right">{(c.score * 100).toFixed(0)}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
