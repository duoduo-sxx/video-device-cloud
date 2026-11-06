import { useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Zap,
} from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, Panel, ProgressBar } from '@/components/common'
import { Button, Field, Input, Segmented, Select, Switch, Tag, Textarea } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/overlay'
import { Table, type Column } from '@/components/ui/data'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { TASK_STATUS_COLOR, TASK_STATUS_LABEL } from '@/constants/enums'
import { cn } from '@/utils/misc'
import type { Task, TaskStatus } from '@/types'

const COLUMNS: Array<{ key: TaskStatus; label: string }> = [
  { key: 'pending', label: '待执行' },
  { key: 'running', label: '执行中' },
  { key: 'done', label: '已完成' },
  { key: 'failed', label: '异常' },
]

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-card border border-strong bg-panel p-2.5 cursor-grab active:cursor-grabbing hover:border-brand/35 transition-colors',
        isDragging && 'opacity-60 z-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-ink leading-snug line-clamp-2">{task.name}</span>
        <Tag color={TASK_STATUS_COLOR[task.status]}>{task.type === 'scene' ? '场景' : task.type === 'inspection' ? '巡检' : task.type === 'sync' ? '同步' : '维护'}</Tag>
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-ink-mute">
        <span className="num">{task.id.slice(-6)}</span>
        <span>·</span>
        <span>{task.assignee}</span>
      </div>
      {task.status === 'running' && (
        <div className="mt-2">
          <ProgressBar value={task.progress} height={3} />
        </div>
      )}
      {task.status === 'failed' && task.failReason && (
        <div className="mt-1.5 text-[10px] text-bad line-clamp-2">{task.failReason}</div>
      )}
      <div className="flex items-center justify-between mt-2 text-[10px] text-ink-mute">
        <span className="num flex items-center gap-0.5">
          <Clock size={9} />
          {dayjs(task.plannedAt).format('MM-DD HH:mm')}
        </span>
        {task.trigger === 'schedule' && <CalendarClock size={10} />}
        {task.trigger === 'rule' && <Zap size={10} className="text-warn" />}
      </div>
    </div>
  )
}

function Column({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = COLUMNS.find((c) => c.key === status)!
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: TASK_STATUS_COLOR[status] }} />
          <span className="text-xs text-ink">{meta.label}</span>
          <span className="num text-2xs text-ink-mute">{tasks.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-card border border-dashed p-1.5 space-y-1.5 overflow-auto min-h-[120px] transition-colors',
          isOver ? 'border-brand/50 bg-brand/[0.04]' : 'border-[var(--border-strong)] bg-panel2/25',
        )}
      >
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
        {tasks.length === 0 && <div className="py-8 text-center text-2xs text-ink-mute">暂无任务</div>}
      </div>
    </div>
  )
}

export default function Tasks() {
  const db = useDataStore((s) => s.db)
  const { moveTask, retryTask, addTask, toggleRule } = useDataStore()
  const toast = useUIStore((s) => s.toast)
  const [view, setView] = useState<'board' | 'list' | 'rules'>('board')
  const [kw, setKw] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', type: 'scene', trigger: 'manual', sceneId: '', assignee: '张启明' })
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const tasks = db.tasks.filter((t) => !kw || t.name.includes(kw) || t.assignee.includes(kw))

  const grouped = useMemo(() => {
    const m: Record<TaskStatus, Task[]> = { pending: [], running: [], done: [], failed: [] }
    tasks.forEach((t) => m[t.status].push(t))
    return m
  }, [tasks])

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over) return
    const target = COLUMNS.find((c) => c.key === over.id)?.key
    if (!target) return
    moveTask(String(active.id), target)
    toast('success', '任务状态已更新', `已移动到「${TASK_STATUS_LABEL[target]}」`)
  }

  const columns: Column<Task>[] = [
    { key: 'name', title: '任务名称', render: (t) => <div><div className="text-sm text-ink truncate">{t.name}</div><div className="text-2xs text-ink-mute num">{t.id}</div></div> },
    { key: 'type', title: '类型', width: 90, render: (t) => <span className="text-xs text-ink-soft">{t.type === 'scene' ? '场景执行' : t.type === 'inspection' ? '设备巡检' : t.type === 'sync' ? '数据同步' : '维护'}</span> },
    { key: 'status', title: '状态', width: 90, render: (t) => <Tag color={TASK_STATUS_COLOR[t.status]}>{TASK_STATUS_LABEL[t.status]}</Tag> },
    { key: 'assignee', title: '负责人', width: 80 },
    { key: 'plannedAt', title: '计划时间', width: 130, render: (t) => <span className="num text-2xs text-ink-mute">{dayjs(t.plannedAt).format('MM-DD HH:mm')}</span> },
    { key: 'duration', title: '耗时', width: 80, render: (t) => <span className="num text-2xs text-ink-soft">{t.duration ? `${t.duration} 分` : '—'}</span> },
    {
      key: 'op',
      title: '',
      width: 60,
      align: 'right',
      render: (t) =>
        t.status === 'failed' ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              retryTask(t.id)
              toast('success', '已重新下发任务')
            }}
            className="text-2xs text-brand hover:text-brand-deep"
          >
            重试
          </button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="任务与自动化"
        sub="任务调度、执行追踪与规则触发"
        actions={
          <>
            <Segmented
              options={[
                { label: '看板', value: 'board' },
                { label: '列表', value: 'list' },
                { label: '自动化规则', value: 'rules' },
              ]}
              value={view}
              onChange={(v) => setView(v as typeof view)}
            />
            <div className="w-[180px]">
              <Input icon={<Search size={13} />} placeholder="搜索任务" value={kw} onChange={(e) => setKw(e.target.value)} />
            </div>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setCreating(true)}>
              新建任务
            </Button>
          </>
        }
      />

      {view === 'board' && (
        <div className="flex gap-3 flex-1 min-h-0">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
            {COLUMNS.map((c) => (
              <Column key={c.key} status={c.key} tasks={grouped[c.key]} />
            ))}
          </DndContext>
        </div>
      )}

      {view === 'list' && (
        <Panel className="flex-1 min-h-0" bodyClass="p-0" title={undefined}>
          <Table columns={columns} rows={tasks} emptyText="没有符合条件的任务" />
        </Panel>
      )}

      {view === 'rules' && (
        <div className="grid grid-cols-2 gap-3">
          {db.rules.map((r) => (
            <div key={r.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-md bg-warn/12 text-warn flex items-center justify-center shrink-0">
                    <Zap size={13} />
                  </span>
                  <div>
                    <div className="text-sm text-ink">{r.name}</div>
                    <div className="text-2xs text-ink-mute num mt-0.5">已触发 {r.triggeredCount} 次 · {r.scope}</div>
                  </div>
                </div>
                <Switch checked={r.enabled} onChange={() => toggleRule(r.id)} label="启用规则" />
              </div>

              <div className="mt-3 rounded-card border border-strong bg-panel2/50 p-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-2xs">
                  <span className="px-1.5 py-0.5 rounded bg-info/15 text-info">IF</span>
                  <span className="text-ink-soft">
                    {r.metric} {r.operator} {r.threshold}{r.unit}
                  </span>
                  <span className="text-ink-mute">持续 {r.duration} 分钟</span>
                </div>
                <div className="flex items-center gap-1.5 text-2xs">
                  <span className="px-1.5 py-0.5 rounded bg-brand/15 text-brand">THEN</span>
                  <span className="text-ink-soft">
                    {r.action === 'startScene' ? `执行场景「${r.targetName}」` : r.action === 'createAlert' ? `创建告警「${r.targetName}」` : `创建工单「${r.targetName}」`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2.5">
                <span className={cn('text-2xs', r.enabled ? 'text-ok' : 'text-ink-mute')}>{r.enabled ? '运行中' : '已停用'}</span>
                <Button size="sm" variant="ghost" icon={<Settings2 size={12} />} onClick={() => toast('info', '规则编辑器', '演示环境暂不支持修改规则参数')}>
                  编辑
                </Button>
              </div>
            </div>
          ))}
          <div className="panel p-4 flex items-center justify-center">
            <Button
              variant="secondary"
              icon={<Plus size={14} />}
              onClick={() => toast('info', '规则构建器', '演示环境使用预置规则，可参考现有规则结构')}
            >
              新建规则
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="新建任务"
        desc="任务将被加入待执行队列，按设定时间触发"
        width={560}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!form.name.trim()) return
                addTask({
                  name: form.name,
                  description: form.description,
                  type: form.type as Task['type'],
                  trigger: form.trigger as Task['trigger'],
                  sceneId: form.sceneId || undefined,
                  assignee: form.assignee,
                  plannedAt: dayjs().add(30, 'minute').format('YYYY-MM-DDTHH:mm:ssZ'),
                })
                toast('success', '任务已创建', `${form.name} 已加入待执行队列`)
                setCreating(false)
                setForm({ name: '', description: '', type: 'scene', trigger: 'manual', sceneId: '', assignee: '张启明' })
              }}
              icon={<CheckCircle2 size={14} />}
            >
              创建任务
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Field label="任务名称" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如：指挥中心会前保障" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="任务类型">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full">
                <option value="scene">场景执行</option>
                <option value="inspection">设备巡检</option>
                <option value="sync">数据同步</option>
                <option value="maintenance">维护作业</option>
              </Select>
            </Field>
            <Field label="触发方式">
              <Select value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} className="w-full">
                <option value="manual">立即执行</option>
                <option value="schedule">定时触发</option>
                <option value="rule">规则触发</option>
              </Select>
            </Field>
          </div>
          <Field label="关联场景">
            <Select value={form.sceneId} onChange={(e) => setForm({ ...form, sceneId: e.target.value })} className="w-full">
              <option value="">不关联</option>
              {db.scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="负责人">
            <Select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} className="w-full">
              {db.users.filter((u) => u.status === 'active').map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} · {u.department}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="任务说明">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="描述任务目标与验收标准" />
          </Field>
        </div>
      </Modal>
    </>
  )
}
