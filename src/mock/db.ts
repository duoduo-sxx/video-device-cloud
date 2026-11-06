import { buildSeedData } from './seed';
import type { Alarm, CalibrationTask, Device, ServiceOrder, WorkTask } from '../types/models';

const seed = buildSeedData();

export const db = {
  ...seed,
};

export function findDevice(id: string): Device | undefined {
  return db.devices.find((d) => d.id === id);
}

export function findTask(id: string): CalibrationTask | undefined {
  return db.calibrationTasks.find((t) => t.id === id);
}

export function addAlarmHandling(alarmId: string, status: Alarm['status'], handling?: string, assignee?: string): Alarm | undefined {
  const alarm = db.alarms.find((a) => a.id === alarmId);
  if (!alarm) return undefined;
  alarm.status = status;
  if (handling) alarm.handling = handling;
  if (assignee) alarm.assignee = assignee;
  if (status === 'CLOSED') {
    alarm.closedAt = '2026-10-19 10:27:26';
  } else if (status === 'ACKED' || status === 'PROCESSING') {
    alarm.ackedAt = alarm.ackedAt ?? '2026-10-19 10:27:26';
  }
  return alarm;
}

export function updateTaskStatus(taskId: string, status: WorkTask['status']): WorkTask | undefined {
  const task = db.workTasks.find((t) => t.id === taskId);
  if (!task) return undefined;
  task.status = status;
  if (status === 'DOING' && !task.actualStart) task.actualStart = '2026-10-19 10:27:26';
  if (status === 'DONE') {
    task.progress = 100;
    task.actualEnd = '2026-10-19 10:27:26';
  }
  task.logs.push({ time: '2026-10-19 10:27:26', user: '当前用户', action: `状态变更为${{ TODO: '待开始', DOING: '进行中', REVIEW: '待审核', DONE: '已完成', PAUSED: '已暂停' }[status]}` });
  return task;
}

export function addTaskComment(taskId: string, content: string): WorkTask | undefined {
  const task = db.workTasks.find((t) => t.id === taskId);
  if (!task) return undefined;
  task.comments.unshift({ user: '张启明', time: '2026-10-19 10:27:26', content });
  return task;
}

export function addDevice(device: Device): Device {
  db.devices.unshift(device);
  return device;
}

export function updateCalibrationProgress(taskId: string, progress: number, positionIndex?: number): CalibrationTask | undefined {
  const task = db.calibrationTasks.find((t) => t.id === taskId);
  if (!task) return undefined;
  task.progress = progress;
  if (positionIndex !== undefined) {
    task.positions.forEach((p, idx) => {
      if (idx < positionIndex) p.status = 'DONE';
      else if (idx === positionIndex) p.status = 'RUNNING';
      else p.status = 'PENDING';
    });
  }
  if (progress >= 100) {
    task.status = 'REVIEWING';
    task.conclusion = 'PENDING';
  }
  return task;
}

export function reviewCalibration(taskId: string, passed: boolean): CalibrationTask | undefined {
  const task = db.calibrationTasks.find((t) => t.id === taskId);
  if (!task) return undefined;
  task.status = 'COMPLETED';
  task.conclusion = passed ? 'PASS' : 'FAIL';
  return task;
}

export function updateServiceOrder(id: string, patch: Partial<ServiceOrder>): ServiceOrder | undefined {
  const order = db.serviceOrders.find((s) => s.id === id);
  if (!order) return undefined;
  Object.assign(order, patch);
  order.records.push({ time: '2026-10-19 10:27:26', user: '张启明', action: '更新工单', note: patch.status });
  return order;
}

export const NOW_TEXT = '2026-10-19 10:27:26';
