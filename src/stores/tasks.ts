import { create } from 'zustand';
import type { Task, TaskStatus, Priority, CapabilityId } from '@/types';
import { INITIAL_TASKS, buildStages } from '@/mock/seed/tasks';
import { ERROR_CODES, CAP_NAMES } from '@/mock/seed/capabilities';
import { getAsset } from '@/mock/db';
import { clamp } from '@/utils/format';

interface TaskEvent {
  id: string;
  name: string;
  status: TaskStatus;
  message: string;
}

interface TaskState {
  tasks: Task[];
  lastEvent: TaskEvent | null;
  tick: () => void;
  retry: (id: string) => void;
  cancel: (id: string) => void;
  setPriority: (id: string, p: Priority) => void;
  enqueue: (params: { assetId: string; capability: CapabilityId; params?: Record<string, unknown>; priority?: Priority }) => string;
  clearEvent: () => void;
}

const NODES = ['GPU-01', 'GPU-02', 'GPU-03', 'GPU-04'];
const MAX_RUNNING = 4;

function stageOf(task: Task, progress: number): string {
  const stages = buildStages({ ...task, progress });
  const running = stages.find((s) => s.status === 'running') || stages[stages.length - 1];
  return running.name;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: INITIAL_TASKS,
  lastEvent: null,

  tick: () => {
    const tasks = get().tasks;
    let running = tasks.filter((t) => t.status === 'running').length;
    const next = tasks.map((t) => {
      if (t.status === 'queued' && running < MAX_RUNNING) {
        running += 1;
        return {
          ...t,
          status: 'running' as TaskStatus,
          progress: 2,
          startedAt: new Date().toISOString(),
          node: NODES[running % 4],
          stage: '解析素材',
        };
      }
      if (t.status !== 'running') return t;
      const step = 1 + Math.round(Math.random() * 2.4);
      const progress = clamp(t.progress + step, 0, 100);
      if (progress >= 100) {
        const failed = Math.random() < 0.035;
        const err = ERROR_CODES[Math.floor(Math.random() * ERROR_CODES.length)];
        if (failed) {
          return {
            ...t,
            progress: 92,
            status: 'failed' as TaskStatus,
            finishedAt: new Date().toISOString(),
            durationMs: Date.now() - new Date(t.createdAt).getTime(),
            stage: '结果后处理',
            errorCode: err.code,
            errorMessage: err.message,
          };
        }
        const asset = getAsset(t.assetId);
        return {
          ...t,
          progress: 100,
          status: 'succeeded' as TaskStatus,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - new Date(t.startedAt || t.createdAt).getTime(),
          stage: '已完成',
          outputs: [
            {
              name: `${(asset?.title || '输出').slice(0, 14)}_${CAP_NAMES[t.capability]}.${t.capability === 'cap_asr' || t.capability === 'cap_subtitle' ? 'srt' : 'mp4'}`,
              sizeBytes: Math.round((asset?.sizeBytes || 1e8) * 0.4),
              kind: '结果文件',
            },
          ],
        };
      }
      return { ...t, progress, stage: stageOf(t, progress) };
    });

    const byId = new Map(tasks.map((t) => [t.id, t]));
    let event: TaskEvent | null = get().lastEvent;
    for (const t of next) {
      const prev = byId.get(t.id);
      if (prev && prev.status !== t.status && (t.status === 'succeeded' || t.status === 'failed')) {
        event = {
          id: t.id,
          name: t.name,
          status: t.status,
          message:
            t.status === 'succeeded'
              ? '任务已完成，产物已写入存储。'
              : `任务失败 ${t.errorCode}：${t.errorMessage}`,
        };
      }
    }
    set({ tasks: next, lastEvent: event });
  },

  retry: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'queued', progress: 0, errorCode: undefined, errorMessage: undefined, stage: '等待调度', finishedAt: undefined, outputs: [] }
          : t,
      ),
    })),

  cancel: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: 'canceled', stage: '已取消', finishedAt: new Date().toISOString() } : t)),
    })),

  setPriority: (id, priority) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, priority } : t)) })),

  enqueue: ({ assetId, capability, params = {}, priority = 'medium' }) => {
    const id = `tsk_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.random().toString(16).slice(2, 6)}`;
    const asset = getAsset(assetId);
    const task: Task = {
      id,
      name: `${CAP_NAMES[capability]} - ${(asset?.title || '未命名素材').slice(0, 18)}`,
      capability,
      assetId,
      status: 'queued',
      progress: 0,
      priority,
      createdBy: 'u_02',
      createdAt: new Date().toISOString(),
      stage: '等待调度',
      params,
      outputs: [],
      node: '排队中',
    };
    set((s) => ({ tasks: [task, ...s.tasks] }));
    return id;
  },

  clearEvent: () => set({ lastEvent: null }),
}));

let started = false;
export function startTaskEngine() {
  if (started) return () => undefined;
  started = true;
  const timer = setInterval(() => useTaskStore.getState().tick(), 900);
  return () => {
    clearInterval(timer);
    started = false;
  };
}
