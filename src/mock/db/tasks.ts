import type { Task } from '@/types/models';
import type { Priority, TaskStatus, TaskType } from '@/types/enums';
import { projects } from './projects';
import { requirements } from './requirements';
import { daysAgo, daysLater, makeRng } from '../seed';

const rng = makeRng(20260505);

const SUFFIXES: { label: string; type: TaskType; weight: number }[] = [
  { label: '前端实现', type: 'feature', weight: 30 },
  { label: 'UI 设计与切图', type: 'design', weight: 12 },
  { label: '接口联调', type: 'tech', weight: 12 },
  { label: '数据埋点', type: 'tech', weight: 6 },
  { label: '兼容性验证', type: 'test', weight: 8 },
  { label: '性能优化', type: 'tech', weight: 8 },
  { label: '测试用例编写', type: 'test', weight: 8 },
  { label: '资源制作', type: 'design', weight: 6 },
  { label: '配置与灰度', type: 'tech', weight: 5 },
  { label: '文档补充', type: 'tech', weight: 5 },
];

const LABELS = [
  '前端',
  '后端',
  '美术',
  '测试',
  '性能',
  '紧急',
  '技术债',
  '渠道适配',
  '数值',
  '交互',
  '合规',
  '可优化',
];

const SUBTASK_TITLES = [
  '梳理交互流程与边界场景',
  '补充 UI 稿并确认标注',
  '完成主流程开发',
  '处理异常与空态',
  '补充埋点并验证上报',
  '编写自测用例并跑通',
  '提交代码评审',
  '合并至 release 分支',
];

const PRIORITIES: Priority[] = ['P0', 'P1', 'P1', 'P2', 'P2', 'P2', 'P3'];

function statusOf(projectProgress: number): TaskStatus {
  const r = rng.next();
  if (projectProgress >= 100) {
    if (r < 0.76) return 'done';
    if (r < 0.84) return 'review';
    if (r < 0.92) return 'doing';
    return 'todo';
  }
  if (r < 0.42) return 'done';
  if (r < 0.62) return 'doing';
  if (r < 0.76) return 'review';
  return 'todo';
}

let seq = 0;

export const tasks: Task[] = [];

const projectMap = new Map(projects.map((p) => [p.id, p]));

requirements.forEach((req) => {
  const project = projectMap.get(req.projectId);
  if (!project) return;

  const taskCount = req.status === 'rejected' ? 0 : rng.pick([2, 2, 2, 3, 3, 1]);

  for (let i = 0; i < taskCount; i += 1) {
    seq += 1;
    const suffix = rng.pick(SUFFIXES);
    const status = req.status === 'done' ? (rng.chance(0.88) ? 'done' : 'review') : statusOf(project.progress);
    const estimate = rng.pick([4, 6, 8, 8, 12, 16, 20, 24, 32]);
    const spent =
      status === 'done'
        ? Math.round(estimate * rng.float(0.85, 1.35, 2))
        : status === 'doing'
          ? Math.round(estimate * rng.float(0.25, 0.8, 2))
          : status === 'review'
            ? Math.round(estimate * rng.float(0.8, 1.1, 2))
            : 0;

    const createdOffset = rng.int(2, 120);
    const dueOffset = createdOffset - rng.int(-6, 18);

    tasks.push({
      id: `TSK-2026-${String(2000 + seq)}`,
      projectId: req.projectId,
      title: `${req.title} - ${suffix.label}`,
      type: suffix.type,
      status,
      priority: rng.chance(0.25) ? req.priority : rng.pick(PRIORITIES),
      assigneeId: rng.pick(project.memberIds),
      reporterId: project.managerId,
      storyPoints: rng.pick([1, 2, 3, 3, 5, 5, 8]),
      estimateHours: estimate,
      spentHours: spent,
      sprint: req.sprint ?? project.currentSprint,
      requirementId: req.id,
      labels: rng.picks(LABELS, rng.int(1, 3)),
      dueDate: (dueOffset > 0 ? daysLater(dueOffset) : daysAgo(-dueOffset)).slice(0, 10),
      subtasks:
        status === 'done' || status === 'review'
          ? rng.picks(SUBTASK_TITLES, rng.int(2, 5)).map((t, idx) => ({
              id: `ST-${seq}-${idx}`,
              title: t,
              done: status === 'done' ? true : rng.chance(0.6),
            }))
          : [],
      commentCount: rng.int(0, 9),
      attachmentCount: rng.chance(0.3) ? rng.int(1, 3) : 0,
      order: i,
      createdAt: daysAgo(createdOffset, rng.int(9, 19), rng.int(0, 59)),
    });
  }
});

export const tasksById = new Map(tasks.map((t) => [t.id, t]));

export function tasksOfProject(projectId: string): Task[] {
  return tasks.filter((t) => t.projectId === projectId);
}

export function tasksOfStatus(projectId: string, status: TaskStatus): Task[] {
  return tasks
    .filter((t) => t.projectId === projectId && t.status === status)
    .sort((a, b) => a.order - b.order);
}
