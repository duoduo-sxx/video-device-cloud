import type { Task, TaskStatus, CapabilityId } from '@/types';
import { ASSETS } from './assets';
import { CAPABILITIES, ERROR_CODES } from './capabilities';
import { mulberry32, hashString, clamp } from '@/utils/format';

const CAP_IDS: CapabilityId[] = CAPABILITIES.filter((c) => c.id !== 'cap_dubbing').map((c) => c.id);

const NODES = ['GPU-01', 'GPU-02', 'GPU-03', 'GPU-04'];

const STAGES: Record<string, string[]> = {
  default: ['解析素材', '任务调度', '模型推理', '结果后处理', '写入存储'],
  cap_asr: ['解析音轨', '声学模型', '语言模型', '标点恢复', '结果写入'],
  cap_subtitle: ['解析音轨', '语音识别', '智能断句', '时间轴对齐', '样式渲染'],
  cap_enhance: ['解析画面', '去噪预处理', '增强推理', '插帧合成', '编码输出'],
  cap_review: ['抽帧', '画面审核', '语音审核', '文本审核', '结果聚合'],
};

function stageName(cap: CapabilityId, progress: number): string {
  const list = STAGES[cap] || STAGES.default;
  const idx = Math.min(list.length - 1, Math.floor((progress / 100) * list.length));
  return list[idx];
}

export function buildTasks(): Task[] {
  const tasks: Task[] = [];
  const now = Date.now();
  for (let i = 0; i < 214; i++) {
    const seed = hashString(`task-${i}`);
    const rnd = mulberry32(seed);
    const asset = ASSETS[i % ASSETS.length];
    const cap = CAP_IDS[i % CAP_IDS.length];
    const capMeta = CAPABILITIES.find((c) => c.id === cap)!;
    let status: TaskStatus;
    if (i % 17 === 0) status = 'running';
    else if (i % 19 === 0) status = 'queued';
    else if (i % 9 === 0) status = 'failed';
    else if (i % 41 === 0) status = 'canceled';
    else status = 'succeeded';
    const progress = status === 'running' ? 18 + Math.round(rnd() * 66) : status === 'succeeded' ? 100 : status === 'failed' ? 30 + Math.round(rnd() * 55) : 0;
    const createdAt = new Date(now - i * 3.4 * 3600_000 - Math.round(rnd() * 40) * 60_000).toISOString();
    const durationMs = Math.round((asset.duration * (cap === 'cap_enhance' ? 4.2 : cap === 'cap_asr' ? 0.35 : 0.6) + 8) * 1000);
    const err = ERROR_CODES[Math.floor(rnd() * ERROR_CODES.length)];
    const task: Task = {
      id: `tsk_${new Date(createdAt).toISOString().slice(0, 10).replace(/-/g, '')}_${seed.toString(16).slice(0, 4)}`,
      name: `${capMeta.name} - ${asset.title.replace(/ - .*$/, '').slice(0, 18)}`,
      capability: cap,
      assetId: asset.id,
      status,
      progress,
      priority: rnd() > 0.78 ? 'high' : rnd() > 0.4 ? 'medium' : 'low',
      createdBy: ['u_02', 'u_03', 'u_06', 'u_07', 'u_11', 'u_05'][i % 6],
      createdAt,
      startedAt: status === 'queued' ? undefined : new Date(new Date(createdAt).getTime() + 12000).toISOString(),
      finishedAt: status === 'succeeded' || status === 'failed' || status === 'canceled'
        ? new Date(new Date(createdAt).getTime() + durationMs).toISOString()
        : undefined,
      durationMs: status === 'queued' ? undefined : durationMs,
      stage: stageName(cap, progress),
      errorCode: status === 'failed' ? err.code : undefined,
      errorMessage: status === 'failed' ? err.message : undefined,
      params:
        cap === 'cap_asr'
          ? { language: 'zh', speakerDiarization: true, speakerCount: 2, punctuation: true }
          : cap === 'cap_enhance'
            ? { scale: 2, denoise: 35, interpolate: true }
            : cap === 'cap_subtitle'
              ? { language: 'zh', maxCharsPerLine: 18, burnIn: false }
              : { preset: 'standard' },
      outputs:
        status === 'succeeded'
          ? [{ name: `${asset.title.slice(0, 14)}_${capMeta.name}.${cap === 'cap_asr' || cap === 'cap_subtitle' ? 'srt' : 'mp4'}`, sizeBytes: Math.round(asset.sizeBytes * 0.42), kind: cap === 'cap_asr' ? 'subtitle' : 'video' }]
          : [],
      node: status === 'queued' ? '排队中' : NODES[i % 4],
    };
    tasks.push(task);
  }
  return tasks.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export const INITIAL_TASKS = buildTasks();

export const TASK_STAGE_DETAIL: Record<string, { name: string; ms: number; status: 'wait' | 'running' | 'done' | 'failed' }[]> = {};

export function buildStages(task: Task): { name: string; ms: number; status: 'wait' | 'running' | 'done' | 'failed' }[] {
  const list = STAGES[task.capability] || STAGES.default;
  const total = task.durationMs || 60000;
  const idx = Math.min(list.length - 1, Math.floor((task.progress / 100) * list.length));
  return list.map((name, i) => ({
    name,
    ms: Math.round((total / list.length) * (0.8 + ((i * 37) % 40) / 100)),
    status: task.status === 'failed' && i === idx ? 'failed' : i < idx || task.status === 'succeeded' ? 'done' : i === idx ? 'running' : 'wait',
  }));
}

export function buildLogs(task: Task): { ts: string; level: 'INFO' | 'WARN' | 'ERROR'; text: string }[] {
  const base = new Date(task.createdAt).getTime();
  const logs: { ts: string; level: 'INFO' | 'WARN' | 'ERROR'; text: string }[] = [];
  const stages = buildStages(task);
  let cursor = 0;
  stages.forEach((s) => {
    const t = new Date(base + cursor).toISOString().slice(11, 23);
    logs.push({ ts: t, level: 'INFO', text: `[${task.node}] 阶段开始：${s.name}` });
    cursor += s.ms;
    if (s.status === 'done') {
      logs.push({ ts: new Date(base + cursor).toISOString().slice(11, 23), level: 'INFO', text: `阶段完成：${s.name}，耗时 ${(s.ms / 1000).toFixed(1)}s` });
    }
    if (s.status === 'failed') {
      logs.push({ ts: new Date(base + cursor).toISOString().slice(11, 23), level: 'ERROR', text: `${task.errorCode}: ${task.errorMessage}` });
      logs.push({ ts: new Date(base + cursor + 200).toISOString().slice(11, 23), level: 'WARN', text: '任务已终止，等待重试或人工介入' });
    }
  });
  if (task.status === 'succeeded') {
    logs.push({ ts: new Date(base + (task.durationMs || 0)).toISOString().slice(11, 23), level: 'INFO', text: `任务成功，产物 ${task.outputs.length} 个，已写入对象存储` });
  }
  return logs;
}
