import dayjs from 'dayjs';
import type {
  Alert,
  AlertRule,
  ApiKey,
  AppUser,
  AuditLog,
  Channel,
  CloudNode,
  Dataset,
  Policy,
  SensitiveHit,
  TaskStatus,
  TransferTask,
  Workspace,
} from '../types';
import { CHANNELS, NODES, POLICIES, APP_USERS } from '../mock/base';
import { TASKS } from '../mock/tasks';
import { WORKSPACES, DATASETS } from '../mock/workspaces';
import { ALERTS, ALERT_RULES, AUDIT_LOGS, SENSITIVE_HITS } from '../mock/ops';
import { API_KEYS } from '../mock/settings';
import { clone, delay } from '../utils/common';

let taskStore: TransferTask[] = clone(TASKS);
const channelStore: Channel[] = clone(CHANNELS);
const policyStore: Policy[] = clone(POLICIES);
const alertStore: Alert[] = clone(ALERTS);
const ruleStore: AlertRule[] = clone(ALERT_RULES);
const nodeStore: CloudNode[] = clone(NODES);

export const taskService = {
  async list(): Promise<TransferTask[]> {
    await delay();
    return clone(taskStore);
  },
  async get(id: string): Promise<TransferTask | undefined> {
    await delay(220);
    return clone(taskStore.find((t) => t.id === id));
  },
  async create(payload: Partial<TransferTask>): Promise<TransferTask> {
    await delay(700);
    const now = dayjs();
    const task: TransferTask = {
      id: `TSK-${now.format('YYYYMMDD')}-${String(2000 + taskStore.length)}`,
      name: payload.name ?? '未命名任务',
      status: 'queued',
      priority: payload.priority ?? 'medium',
      progress: 0,
      totalSize: payload.totalSize ?? 128 * 1024 ** 3,
      transferredSize: 0,
      fileCount: payload.fileCount ?? 2860,
      speedBps: 0,
      source: payload.source!,
      target: payload.target!,
      channelId: payload.channelId ?? 'CH-01',
      channelName: payload.channelName ?? '华东1 ↔ 新加坡 专线',
      policyId: payload.policyId ?? 'PL-02',
      policyName: payload.policyName ?? '均衡模式',
      workspaceId: payload.workspaceId,
      tags: payload.tags ?? ['常规'],
      creator: '陈默',
      createdAt: now.toISOString(),
      retryCount: 0,
      checksum: payload.checksum ?? 'SHA-256',
      schedule: payload.schedule ?? 'immediate',
    };
    taskStore = [task, ...taskStore];
    return clone(task);
  },
  async setStatus(id: string, status: TaskStatus): Promise<TransferTask | undefined> {
    await delay(320);
    const task = taskStore.find((t) => t.id === id);
    if (!task) return undefined;
    task.status = status;
    if (status === 'running') {
      task.speedBps = task.speedBps || 96 * 1024 * 1024;
      if (!task.startedAt) task.startedAt = dayjs().toISOString();
    }
    if (status === 'paused' || status === 'canceled') task.speedBps = 0;
    if (status === 'success') {
      task.progress = 100;
      task.transferredSize = task.totalSize;
      task.finishedAt = dayjs().toISOString();
    }
    if (status === 'failed') task.speedBps = 0;
    return clone(task);
  },
  async batchStatus(ids: string[], status: TaskStatus): Promise<number> {
    await delay(420);
    ids.forEach((id) => {
      const task = taskStore.find((t) => t.id === id);
      if (task) {
        task.status = status;
        if (status === 'paused') task.speedBps = 0;
      }
    });
    return ids.length;
  },
  async remove(ids: string[]): Promise<number> {
    await delay(380);
    taskStore = taskStore.filter((t) => !ids.includes(t.id));
    return ids.length;
  },
};

export const channelService = {
  async list(): Promise<Channel[]> {
    await delay();
    return clone(channelStore);
  },
  async get(id: string): Promise<Channel | undefined> {
    await delay(200);
    return clone(channelStore.find((c) => c.id === id));
  },
  async create(payload: Partial<Channel>): Promise<Channel> {
    await delay(500);
    const channel: Channel = {
      id: `CH-${String(channelStore.length + 1).padStart(2, '0')}`,
      name: payload.name ?? '新建通道',
      protocol: payload.protocol ?? 'S3',
      sourceNodeId: payload.sourceNodeId ?? 'ND-hz-01',
      targetNodeId: payload.targetNodeId ?? 'ND-bj-03',
      bandwidthMbps: payload.bandwidthMbps ?? 800,
      usedMbps: 0,
      latencyMs: payload.latencyMs ?? 24,
      packetLoss: 0,
      status: 'healthy',
      qos: payload.qos ?? 'normal',
      encryption: payload.encryption ?? 'TLS 1.3',
      taskCount: 0,
      createdAt: dayjs().toISOString(),
    };
    channelStore.unshift(channel);
    return clone(channel);
  },
  async toggle(id: string): Promise<void> {
    await delay(300);
    const channel = channelStore.find((c) => c.id === id);
    if (channel) channel.status = channel.status === 'disabled' ? 'healthy' : 'disabled';
  },
  async probe(id: string): Promise<{ latencyMs: number; packetLoss: number }> {
    await delay(1200);
    const channel = channelStore.find((c) => c.id === id);
    const latencyMs = Math.max(3, Math.round((channel?.latencyMs ?? 40) * (0.85 + Math.random() * 0.3)));
    return { latencyMs, packetLoss: Number((Math.random() * 0.4).toFixed(2)) };
  },
};

export const nodeService = {
  async list(): Promise<CloudNode[]> {
    await delay();
    return clone(nodeStore);
  },
  async toggle(id: string): Promise<void> {
    await delay(360);
    const node = nodeStore.find((n) => n.id === id);
    if (node) node.online = !node.online;
  },
};

export const policyService = {
  async list(): Promise<Policy[]> {
    await delay();
    return clone(policyStore);
  },
  async get(id: string): Promise<Policy | undefined> {
    await delay(180);
    return clone(policyStore.find((p) => p.id === id));
  },
  async save(payload: Policy): Promise<void> {
    await delay(560);
    const idx = policyStore.findIndex((p) => p.id === payload.id);
    if (idx >= 0) policyStore[idx] = clone(payload);
    else policyStore.unshift({ ...clone(payload), id: `PL-${String(policyStore.length + 1).padStart(2, '0')}` });
  },
  async remove(id: string): Promise<void> {
    await delay(320);
    const idx = policyStore.findIndex((p) => p.id === id);
    if (idx >= 0) policyStore.splice(idx, 1);
  },
  async toggle(id: string): Promise<void> {
    await delay(200);
    const policy = policyStore.find((p) => p.id === id);
    if (policy) policy.enabled = !policy.enabled;
  },
};

export const workspaceService = {
  async list(): Promise<Workspace[]> {
    await delay();
    return clone(WORKSPACES);
  },
  async get(id: string): Promise<Workspace | undefined> {
    await delay(200);
    return clone(WORKSPACES.find((w) => w.id === id));
  },
  async datasets(id: string): Promise<Dataset[]> {
    await delay(240);
    return clone(DATASETS.filter((d) => d.workspaceId === id));
  },
  async members(id: string): Promise<Workspace['members']> {
    await delay(200);
    return clone(WORKSPACES.find((w) => w.id === id)?.members ?? []);
  },
};

export const alertService = {
  async list(): Promise<Alert[]> {
    await delay();
    return clone(alertStore);
  },
  async rules(): Promise<AlertRule[]> {
    await delay(260);
    return clone(ruleStore);
  },
  async claim(id: string, user: string): Promise<void> {
    await delay(300);
    const alert = alertStore.find((a) => a.id === id);
    if (alert) {
      alert.status = 'processing';
      alert.assignee = user;
    }
  },
  async silence(id: string, hours: number): Promise<void> {
    await delay(260);
    const alert = alertStore.find((a) => a.id === id);
    if (alert) alert.silenced = true;
    void hours;
  },
  async resolve(id: string): Promise<void> {
    await delay(280);
    const alert = alertStore.find((a) => a.id === id);
    if (alert) alert.status = 'resolved';
  },
  async toggleRule(id: string): Promise<void> {
    await delay(200);
    const rule = ruleStore.find((r) => r.id === id);
    if (rule) rule.enabled = !rule.enabled;
  },
};

export const auditService = {
  async list(): Promise<AuditLog[]> {
    await delay();
    return clone(AUDIT_LOGS);
  },
};

export const sensitiveService = {
  async list(): Promise<SensitiveHit[]> {
    await delay();
    return clone(SENSITIVE_HITS);
  },
};

export const keyService = {
  async list(): Promise<ApiKey[]> {
    await delay(260);
    return clone(API_KEYS);
  },
};

export const userService = {
  async list(): Promise<AppUser[]> {
    await delay(280);
    return clone(APP_USERS);
  },
};
