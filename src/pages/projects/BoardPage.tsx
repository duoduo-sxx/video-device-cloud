import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Drawer, Input, Segmented, Select, Tooltip, message } from 'antd';
import { CalendarDays, MessageSquare, Paperclip, Plus, Sparkles } from 'lucide-react';
import type { Project, Task } from '@/types/models';
import { PRIORITY, TASK_STATUS, TASK_TYPE } from '@/types/enums';
import type { TaskStatus } from '@/types/enums';
import { Avatar, StatusTag } from '@/components/ui';
import { tasks as allTasks, userName } from '@/mock';
import { formatDate } from '@/utils/format';

const COLUMNS: { key: TaskStatus; wip?: number }[] = [
  { key: 'todo' },
  { key: 'doing', wip: 6 },
  { key: 'review', wip: 4 },
  { key: 'done' },
];

const STORAGE_KEY = 'np.board';

type BoardState = Record<string, TaskStatus>;

function loadBoard(): BoardState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as BoardState;
  } catch {
    return {};
  }
}

export default function BoardPage() {
  const { project } = useOutletContext<{ project: Project }>();
  const [overrides, setOverrides] = useState<BoardState>(loadBoard);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [active, setActive] = useState<Task | null>(null);
  const [assignee, setAssignee] = useState<string | undefined>();
  const [priority, setPriority] = useState<string | undefined>();
  const [swimlane, setSwimlane] = useState<'none' | 'assignee'>('none');
  const [quickAdd, setQuickAdd] = useState<Record<string, string>>({});

  const projectTasks = useMemo(
    () => allTasks.filter((t) => t.projectId === project.id),
    [project.id],
  );

  const items = useMemo(
    () =>
      projectTasks.map((t) => ({
        ...t,
        status: (overrides[t.id] ?? t.status) as TaskStatus,
      })),
    [projectTasks, overrides],
  );

  const filtered = useMemo(
    () =>
      items.filter((t) => {
        if (assignee && t.assigneeId !== assignee) return false;
        if (priority && t.priority !== priority) return false;
        return true;
      }),
    [items, assignee, priority],
  );

  const persist = (next: BoardState) => {
    setOverrides(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const onDrop = (status: TaskStatus) => {
    if (!dragId) return;
    const task = items.find((t) => t.id === dragId);
    if (!task || task.status === status) {
      setDragId(null);
      setDragOver(null);
      return;
    }
    persist({ ...overrides, [dragId]: status });
    message.success(`已移动到「${TASK_STATUS[status].label}」`);
    setDragId(null);
    setDragOver(null);
  };

  const laneGroups = useMemo(() => {
    if (swimlane === 'none') return [{ key: 'all', label: '', tasks: filtered }];
    const map = new Map<string, Task[]>();
    filtered.forEach((t) => {
      const arr = map.get(t.assigneeId) ?? [];
      arr.push(t);
      map.set(t.assigneeId, arr);
    });
    return [...map.entries()].map(([k, v]) => ({ key: k, label: userName(k), tasks: v }));
  }, [filtered, swimlane]);

  return (
    <div className="np-page" style={{ paddingTop: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500 }}>{project.currentSprint}</span>
        <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>
          {filtered.filter((t) => t.status === 'done').length}/{filtered.length} 已完成 ·{' '}
          {filtered.reduce((s, t) => s + t.storyPoints, 0)} 故事点
        </span>
        <div style={{ flex: 1 }} />
        <Select
          allowClear
          placeholder="指派给"
          value={assignee}
          onChange={setAssignee}
          style={{ width: 130 }}
          options={project.memberIds.map((u) => ({ value: u, label: userName(u) }))}
        />
        <Select
          allowClear
          placeholder="优先级"
          value={priority}
          onChange={setPriority}
          style={{ width: 110 }}
          options={['P0', 'P1', 'P2', 'P3'].map((p) => ({ value: p, label: p }))}
        />
        <Segmented
          value={swimlane}
          onChange={(v) => setSwimlane(v as 'none' | 'assignee')}
          options={[
            { label: '无泳道', value: 'none' },
            { label: '按负责人', value: 'assignee' },
          ]}
        />
        <Button type="primary" icon={<Plus size={14} />}>新建任务</Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {laneGroups.map((lane) => (
          <div key={lane.key}>
            {lane.label && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Avatar name={lane.label} size={20} />
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{lane.label}</span>
                <span style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{lane.tasks.length} 个任务</span>
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(240px, 1fr))`,
                gap: 12,
                alignItems: 'start',
              }}
            >
              {COLUMNS.map((col) => {
                const colTasks = lane.tasks.filter((t) => t.status === col.key);
                const overWip = col.wip ? colTasks.length > col.wip : false;
                return (
                  <div
                    key={col.key}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(col.key);
                    }}
                    onDragLeave={() => setDragOver((v) => (v === col.key ? null : v))}
                    onDrop={() => onDrop(col.key)}
                    style={{
                      background: dragOver === col.key ? 'var(--np-primary-50)' : 'var(--np-bg-sunken)',
                      border: `1px solid ${dragOver === col.key ? 'var(--np-primary-200)' : 'transparent'}`,
                      borderRadius: 10,
                      padding: 8,
                      minHeight: 180,
                      transition: 'background .12s, border-color .12s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 6px 10px',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background:
                            col.key === 'done'
                              ? 'var(--np-success)'
                              : col.key === 'doing'
                                ? 'var(--np-info)'
                                : col.key === 'review'
                                  ? 'var(--np-warning)'
                                  : 'var(--np-text-disabled)',
                        }}
                      />
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>{TASK_STATUS[col.key].label}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: overWip ? 'var(--np-danger)' : 'var(--np-text-tertiary)',
                          background: 'var(--np-bg-surface)',
                          borderRadius: 8,
                          padding: '0 6px',
                          height: 17,
                          lineHeight: '17px',
                        }}
                      >
                        {colTasks.length}
                        {col.wip ? `/${col.wip}` : ''}
                      </span>
                      {overWip && (
                        <Tooltip title={`超出 WIP 限制 ${col.wip}`}>
                          <span style={{ fontSize: 10, color: 'var(--np-danger)' }}>超限</span>
                        </Tooltip>
                      )}
                      <span style={{ flex: 1 }} />
                      <Plus size={13} style={{ color: 'var(--np-text-tertiary)', cursor: 'pointer' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {colTasks.map((t) => (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={() => setDragId(t.id)}
                          onDragEnd={() => {
                            setDragId(null);
                            setDragOver(null);
                          }}
                          onClick={() => setActive(t)}
                          style={{
                            background: 'var(--np-bg-surface)',
                            border: '1px solid var(--np-border)',
                            borderRadius: 8,
                            padding: '10px 11px',
                            cursor: 'grab',
                            opacity: dragId === t.id ? 0.4 : 1,
                            boxShadow: 'var(--np-shadow-sm)',
                            display: 'flex',
                            gap: 8,
                          }}
                        >
                          <span
                            className="np-accent-bar"
                            style={{
                              background:
                                t.priority === 'P0'
                                  ? 'var(--np-danger)'
                                  : t.priority === 'P1'
                                    ? 'var(--np-warning)'
                                    : t.priority === 'P2'
                                      ? 'var(--np-info)'
                                      : 'var(--np-border-strong)',
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12.5,
                                lineHeight: 1.55,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {t.title}
                            </div>

                            {t.labels.length > 0 && (
                              <div style={{ display: 'flex', gap: 4, marginTop: 7, flexWrap: 'wrap' }}>
                                {t.labels.slice(0, 2).map((l) => (
                                  <span
                                    key={l}
                                    style={{
                                      fontSize: 10,
                                      padding: '0 5px',
                                      height: 16,
                                      lineHeight: '16px',
                                      borderRadius: 3,
                                      background: 'var(--np-bg-subtle)',
                                      color: 'var(--np-text-secondary)',
                                    }}
                                  >
                                    {l}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginTop: 9,
                                fontSize: 10.5,
                                color: 'var(--np-text-tertiary)',
                              }}
                            >
                              <span className="np-mono-sm" style={{ fontSize: 10 }}>
                                {t.id.replace('TSK-2026-', '#')}
                              </span>
                              {t.dueDate && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <CalendarDays size={10} />
                                  {formatDate(t.dueDate, 'MM-DD')}
                                </span>
                              )}
                              {t.commentCount > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <MessageSquare size={10} />
                                  {t.commentCount}
                                </span>
                              )}
                              {t.attachmentCount > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Paperclip size={10} />
                                  {t.attachmentCount}
                                </span>
                              )}
                              <span style={{ marginLeft: 'auto' }}>
                                <Avatar name={userName(t.assigneeId)} size={18} />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 6px',
                          borderRadius: 6,
                          color: 'var(--np-text-tertiary)',
                          fontSize: 12,
                          cursor: 'text',
                        }}
                      >
                        <Plus size={13} />
                        <Input
                          variant="borderless"
                          size="small"
                          placeholder="添加任务"
                          value={quickAdd[col.key] ?? ''}
                          onChange={(e) => setQuickAdd((p) => ({ ...p, [col.key]: e.target.value }))}
                          onPressEnter={() => {
                            if (quickAdd[col.key]?.trim()) {
                              message.success('任务已创建（演示环境不落库）');
                              setQuickAdd((p) => ({ ...p, [col.key]: '' }));
                            }
                          }}
                          style={{ padding: 0, fontSize: 12 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Drawer
        width={640}
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={
          active ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--np-text-tertiary)' }}>{active.id}</span>
              <StatusTag label={TASK_STATUS[active.status].label} tone={TASK_STATUS[active.status].tone} />
            </div>
          ) : null
        }
      >
        {active && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, margin: 0 }}>{active.title}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
              <Field label="类型" value={TASK_TYPE[active.type].label} />
              <Field label="优先级" value={<span style={{ color: `var(--np-${PRIORITY[active.priority].tone === 'default' ? 'text-tertiary' : PRIORITY[active.priority].tone})` }}>{PRIORITY[active.priority].label} {PRIORITY[active.priority].full}</span>} />
              <Field label="指派给" value={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar name={userName(active.assigneeId)} size={18} />{userName(active.assigneeId)}</span>} />
              <Field label="报告人" value={userName(active.reporterId)} />
              <Field label="迭代" value={active.sprint} />
              <Field label="截止日期" value={active.dueDate} />
              <Field label="预估工时" value={`${active.estimateHours} 小时`} />
              <Field label="已用工时" value={`${active.spentHours} 小时`} />
              <Field label="故事点" value={String(active.storyPoints)} />
              <Field label="关联需求" value={active.requirementId ?? '—'} />
            </div>

            {active.subtasks.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--np-text-tertiary)', marginBottom: 8 }}>
                  子任务 {active.subtasks.filter((s) => s.done).length}/{active.subtasks.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {active.subtasks.map((s) => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                      <input type="checkbox" checked={s.done} readOnly />
                      <span style={{ textDecoration: s.done ? 'line-through' : 'none', color: s.done ? 'var(--np-text-tertiary)' : undefined }}>
                        {s.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 12, color: 'var(--np-text-tertiary)', marginBottom: 8 }}>活动日志</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { who: userName(active.reporterId), text: '创建了任务', time: active.createdAt },
                  { who: userName(active.assigneeId), text: '开始处理，预估 8 小时', time: active.createdAt },
                  { who: userName(active.assigneeId), text: '提交代码并触发构建', time: active.createdAt },
                ].map((log, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5 }}>
                    <Avatar name={log.who} size={20} />
                    <div>
                      <span style={{ fontWeight: 500 }}>{log.who}</span>{' '}
                      <span style={{ color: 'var(--np-text-secondary)' }}>{log.text}</span>
                      <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{formatDate(log.time, 'MM-DD HH:mm')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid var(--np-border)', paddingTop: 16 }}>
              <Sparkles size={14} color="var(--np-text-tertiary)" />
              <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>
                拖动卡片可跨列变更状态，结果会保存在本地
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12.5 }}>{value}</div>
    </div>
  );
}
