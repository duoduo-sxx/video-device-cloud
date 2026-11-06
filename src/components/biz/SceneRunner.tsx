import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Check, Loader2, X } from 'lucide-react'
import type { Scene } from '@/types'
import { Button } from '@/components/ui/primitives'
import { ProgressBar } from '@/components/common'
import { cn } from '@/utils/misc'

export function SceneRunner({ scene, onClose, onFinish }: { scene: Scene | null; onClose: () => void; onFinish?: () => void }) {
  const [step, setStep] = useState(0)
  const [failed, setFailed] = useState<string[]>([])

  useEffect(() => {
    if (!scene) return
    setStep(0)
    setFailed(Math.random() > 0.68 ? [scene.steps[scene.steps.length - 1].id] : [])
    let i = 0
    const timer = window.setInterval(() => {
      i += 1
      if (i >= scene.steps.length) {
        window.clearInterval(timer)
        setStep(scene.steps.length)
        onFinish?.()
        return
      }
      setStep(i)
    }, 780)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id])

  if (!scene) return null

  const done = step >= scene.steps.length
  const progress = (Math.min(step, scene.steps.length) / scene.steps.length) * 100

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-6" style={{ background: 'rgba(4,8,14,0.78)', backdropFilter: 'blur(10px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        className="w-[560px] bg-panel border border-strong rounded-float shadow-float overflow-hidden"
      >
        <div className="px-5 pt-4 pb-3 border-b border-subtle">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-md font-medium text-ink">{scene.name}</div>
              <div className="text-2xs text-ink-mute mt-1">
                {done ? '执行完成' : '正在执行'} · {scene.steps.length} 个步骤 · {scene.deviceCount} 台设备
              </div>
            </div>
            {done && (
              <button onClick={onClose} aria-label="关闭" className="text-ink-mute hover:text-ink">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs text-ink-mute">总进度</span>
            <span className="num text-2xs text-ink">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} height={5} />

          <div className="mt-4 space-y-1.5 max-h-[280px] overflow-auto">
            {scene.steps.map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'running' : 'wait'
              const isFailed = state === 'done' && failed.includes(s.id)
              return (
                <div
                  key={s.id}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-ctrl border transition-colors',
                    state === 'running' ? 'border-brand/40 bg-brand/[0.06]' : 'border-subtle bg-panel2/40',
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                      state === 'done' ? 'bg-ok/15 text-ok' : state === 'running' ? 'bg-brand/15 text-brand' : 'bg-panel2 text-ink-mute',
                    )}
                  >
                    {state === 'done' ? <Check size={11} /> : state === 'running' ? <Loader2 size={11} className="animate-spin" /> : <span className="num text-[10px]">{i + 1}</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-xs truncate', state === 'wait' ? 'text-ink-mute' : 'text-ink')}>{s.name}</div>
                    <div className="text-[10px] text-ink-mute num">{s.actions.length} 个动作 · 延时 {s.delay}s</div>
                  </div>
                  {state === 'done' && <span className="text-[10px] text-ok">已完成</span>}
                  {isFailed && <span className="text-[10px] text-bad">失败</span>}
                </div>
              )
            })}
          </div>

          {failed.length > 0 && (
            <div className="mt-3 rounded-ctrl border border-bad/30 bg-bad/[0.06] px-3 py-2 flex items-start gap-2">
              <AlertTriangle size={12} className="text-bad mt-0.5 shrink-0" />
              <div className="text-2xs text-ink-soft leading-relaxed">
                {failed.length} 个步骤未成功执行，可在任务详情中查看失败原因，或转为工单处理。
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-subtle flex items-center justify-between">
          <span className="text-2xs text-ink-mute num">
            {done ? `共影响 ${scene.deviceCount} 台设备` : `执行中 · 第 ${Math.min(step + 1, scene.steps.length)} / ${scene.steps.length} 步`}
          </span>
          <div className="flex gap-2">
            {done ? (
              <Button variant="primary" size="sm" onClick={onClose}>
                完成
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onClose}>
                后台执行
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
