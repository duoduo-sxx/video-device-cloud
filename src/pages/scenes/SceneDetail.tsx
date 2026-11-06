import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, GripVertical, Plus, Play, Save, Trash2, Sparkles } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, Panel, EmptyState } from '@/components/common'
import { Button, Field, Input, Segmented, Select, Tag } from '@/components/ui/primitives'
import { SceneRunner } from '@/components/biz/SceneRunner'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/misc'
import type { Operation, SceneAction, SceneStep } from '@/types'

const OP_LABEL: Record<Operation, string> = {
  powerOn: '开启',
  powerOff: '关闭',
  setValue: '设值',
  setMode: '设模式',
}

function SortableStep({
  step,
  index,
  active,
  onSelect,
  onDelete,
}: {
  step: SceneStep
  index: number
  active: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-start gap-2 p-2.5 rounded-ctrl border transition-colors',
        active ? 'border-brand/45 bg-brand/[0.07]' : 'border-strong bg-panel2/50 hover:border-brand/25',
        isDragging && 'opacity-60 z-50',
      )}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="拖拽排序"
        className="mt-1 text-ink-mute hover:text-ink cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={13} />
      </button>
      <span className="num text-[10px] mt-1 w-4 h-4 rounded bg-panel2 border border-strong flex items-center justify-center shrink-0">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn('text-xs truncate', active ? 'text-brand' : 'text-ink')}>{step.name}</div>
        <div className="text-[10px] text-ink-mute mt-0.5 num">{step.actions.length} 个动作 · 延时 {step.delay}s</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        aria-label="删除步骤"
        className="text-ink-mute hover:text-bad opacity-0 group-hover:opacity-100 transition-opacity mt-1"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

export default function SceneDetail() {
  const { id } = useParams()
  const db = useDataStore((s) => s.db)
  const saveSteps = useDataStore((s) => s.saveSceneSteps)
  const toggleScene = useDataStore((s) => s.toggleSceneEnabled)
  const toast = useUIStore((s) => s.toast)
  const navigate = useNavigate()
  const scene = db.scenes.find((s) => s.id === id)

  const [steps, setSteps] = useState<SceneStep[]>(() => (scene ? JSON.parse(JSON.stringify(scene.steps)) : []))
  const [activeId, setActiveId] = useState<string | null>(steps[0]?.id ?? null)
  const [running, setRunning] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<{ deviceId: string; operation: Operation; target: string }>({
    deviceId: '',
    operation: 'powerOn',
    target: '',
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const active = steps.find((s) => s.id === activeId) ?? null
  const dirty = useMemo(() => JSON.stringify(steps) !== JSON.stringify(scene?.steps), [steps, scene])

  if (!scene) {
    return (
      <Panel className="flex-1">
        <EmptyState title="场景不存在" action={<Button size="sm" onClick={() => navigate('/scenes')}>返回列表</Button>} />
      </Panel>
    )
  }

  const space = db.spaces.find((s) => s.id === scene.spaceId)

  const onDragEnd = (e: DragEndEvent) => {
    const { active: a, over } = e
    if (!over || a.id === over.id) return
    const from = steps.findIndex((s) => s.id === a.id)
    const to = steps.findIndex((s) => s.id === over.id)
    const next = [...steps]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setSteps(next)
  }

  const updateStep = (patch: Partial<SceneStep>) => {
    if (!active) return
    setSteps(steps.map((s) => (s.id === active.id ? { ...s, ...patch } : s)))
  }

  const updateAction = (aid: string, patch: Partial<SceneAction>) => {
    if (!active) return
    setSteps(
      steps.map((s) =>
        s.id === active.id ? { ...s, actions: s.actions.map((x) => (x.id === aid ? { ...x, ...patch } : x)) } : s,
      ),
    )
  }

  const removeAction = (aid: string) => {
    if (!active) return
    setSteps(steps.map((s) => (s.id === active.id ? { ...s, actions: s.actions.filter((x) => x.id !== aid) } : s)))
  }

  const addAction = () => {
    if (!active || !form.deviceId) return
    const dev = db.devices.find((d) => d.id === form.deviceId)!
    const action: SceneAction = {
      id: `ac-${Date.now()}`,
      deviceId: dev.id,
      deviceName: dev.name,
      operation: form.operation,
      target: form.operation === 'setValue' || form.operation === 'setMode' ? form.target || (form.operation === 'setValue' ? 50 : dev.modes?.[0]) : undefined,
    }
    setSteps(steps.map((s) => (s.id === active.id ? { ...s, actions: [...s.actions, action] } : s)))
    setAdding(false)
    setForm({ deviceId: '', operation: 'powerOn', target: '' })
  }

  return (
    <>
      <PageHeader
        title={scene.name}
        sub={`${scene.id} · ${space?.building} ${space && space.floor > 0 ? `${space.floor}F` : 'B1'} ${space?.name} · 最后保存 ${dayjs().format('HH:mm')}`}
        actions={
          <>
            <Button variant="ghost" icon={<ArrowLeft size={14} />} onClick={() => navigate('/scenes')}>
              返回
            </Button>
            <Button
              variant="secondary"
              icon={<Save size={14} />}
              disabled={!dirty}
              onClick={() => {
                saveSteps(scene.id, steps)
                toast('success', '编排已保存', `${steps.length} 个步骤已生效`)
              }}
            >
              保存{dirty ? ' *' : ''}
            </Button>
            <Button variant="primary" icon={<Play size={14} />} onClick={() => setRunning(true)}>
              立即执行
            </Button>
          </>
        }
      />

      <div className="flex gap-3 flex-1 min-h-0">
        <Panel className="w-[360px] shrink-0" bodyClass="p-2.5 flex flex-col" title="执行步骤" extra={<span className="text-2xs text-ink-mute num">{steps.length} 步</span>}>
          <div className="flex-1 overflow-auto space-y-1.5">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {steps.map((s, i) => (
                  <SortableStep
                    key={s.id}
                    step={s}
                    index={i}
                    active={activeId === s.id}
                    onSelect={() => setActiveId(s.id)}
                    onDelete={() => {
                      setSteps(steps.filter((x) => x.id !== s.id))
                      if (activeId === s.id) setActiveId(null)
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          <Button
            variant="secondary"
            className="w-full mt-2 shrink-0"
            icon={<Plus size={13} />}
            onClick={() => {
              const next: SceneStep = { id: `st-${Date.now()}`, name: `新增步骤 ${steps.length + 1}`, delay: 0, actions: [] }
              setSteps([...steps, next])
              setActiveId(next.id)
            }}
          >
            添加步骤
          </Button>
        </Panel>

        <Panel className="flex-1 min-w-0" bodyClass="p-4 overflow-auto" title={active ? `编辑 · ${active.name}` : '动作编辑'}>
          {!active ? (
            <EmptyState title="选择左侧步骤开始编辑" desc="可拖拽调整步骤顺序" icon={<Sparkles size={44} strokeWidth={1.2} />} />
          ) : (
            <div className="space-y-4 max-w-[720px]">
              <div className="grid grid-cols-2 gap-3">
                <Field label="步骤名称">
                  <Input value={active.name} onChange={(e) => updateStep({ name: e.target.value })} />
                </Field>
                <Field label="延时时长（秒）" hint="上一步完成后等待多久执行本步骤">
                  <Input
                    type="number"
                    value={active.delay}
                    onChange={(e) => updateStep({ delay: Number(e.target.value) })}
                  />
                </Field>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink-soft">动作列表 · {active.actions.length}</span>
                  <Button size="sm" variant="ghost" icon={<Plus size={12} />} onClick={() => setAdding(true)}>
                    添加动作
                  </Button>
                </div>

                <div className="rounded-card border border-strong overflow-hidden">
                  <div className="grid grid-cols-[1fr_100px_120px_40px] gap-2 px-3 h-9 items-center bg-panel2 border-b border-subtle text-2xs text-ink-soft">
                    <span>设备</span>
                    <span>操作</span>
                    <span>目标值</span>
                    <span />
                  </div>
                  {active.actions.map((a) => (
                    <div key={a.id} className="grid grid-cols-[1fr_100px_120px_40px] gap-2 px-3 h-11 items-center border-b border-subtle last:border-0">
                      <span className="text-xs text-ink truncate">{a.deviceName}</span>
                      <Select
                        value={a.operation}
                        onChange={(e) => updateAction(a.id, { operation: e.target.value as Operation })}
                        className="!h-7 text-2xs"
                      >
                        {(Object.keys(OP_LABEL) as Operation[]).map((o) => (
                          <option key={o} value={o}>
                            {OP_LABEL[o]}
                          </option>
                        ))}
                      </Select>
                      <span className="text-2xs text-ink-mute num truncate">
                        {a.operation === 'setValue' || a.operation === 'setMode' ? String(a.target ?? '—') : '—'}
                      </span>
                      <button onClick={() => removeAction(a.id)} aria-label="删除动作" className="text-ink-mute hover:text-bad justify-self-end">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {active.actions.length === 0 && (
                    <div className="py-8 text-center text-2xs text-ink-mute">该步骤还没有动作</div>
                  )}
                </div>
              </div>

              {adding && (
                <div className="rounded-card border border-brand/35 bg-brand/[0.04] p-3 space-y-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })}>
                      <option value="">选择设备</option>
                      {db.devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </Select>
                    <Segmented
                      className="w-full"
                      size="sm"
                      options={[
                        { label: '开启', value: 'powerOn' },
                        { label: '关闭', value: 'powerOff' },
                        { label: '设值', value: 'setValue' },
                      ]}
                      value={form.operation}
                      onChange={(v) => setForm({ ...form, operation: v as Operation })}
                    />
                    <Input
                      placeholder={form.operation === 'setValue' ? '目标值 0-100' : '目标值'}
                      value={form.target}
                      disabled={form.operation !== 'setValue' && form.operation !== 'setMode'}
                      onChange={(e) => setForm({ ...form, target: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                      取消
                    </Button>
                    <Button size="sm" variant="primary" onClick={addAction} disabled={!form.deviceId}>
                      添加
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-card border border-strong bg-panel2/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink-soft">场景属性</span>
                  <Tag color={scene.riskLevel === 'high' ? 'var(--danger)' : scene.riskLevel === 'medium' ? 'var(--warning)' : 'var(--success)'}>
                    {scene.riskLevel === 'high' ? '高风险' : scene.riskLevel === 'medium' ? '中风险' : '低风险'}
                  </Tag>
                </div>
                <div className="grid grid-cols-3 gap-3 text-2xs">
                  <div>
                    <div className="text-ink-mute">影响设备</div>
                    <div className="num text-sm text-ink mt-0.5">{new Set(steps.flatMap((s) => s.actions.map((a) => a.deviceId))).size} 台</div>
                  </div>
                  <div>
                    <div className="text-ink-mute">平均耗时</div>
                    <div className="num text-sm text-ink mt-0.5">{scene.avgDuration}s</div>
                  </div>
                  <div>
                    <div className="text-ink-mute">启用状态</div>
                    <button onClick={() => toggleScene(scene.id)} className={cn('text-sm mt-0.5', scene.enabled ? 'text-ok' : 'text-ink-mute')}>
                      {scene.enabled ? '已启用' : '已停用'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <SceneRunner scene={running ? { ...scene, steps } : null} onClose={() => setRunning(false)} />
    </>
  )
}
