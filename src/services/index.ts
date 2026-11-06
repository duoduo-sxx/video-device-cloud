import type { MediaAsset, Task, ReviewFinding, Pipeline, UsageRecord, CapabilityId, Paged, ApiCallLog, AuditLog, Template } from '@/types';
import { getAssets, getAsset, getFindings, summary } from '@/mock/db';
import { PIPELINES, PIPELINE_RUNS } from '@/mock/seed/pipelines';
import { USAGE_RECORDS, API_CALL_LOGS, AUDIT_LOGS } from '@/mock/seed/misc';
import { TEMPLATES } from '@/mock/seed/people';
import { sleep } from '@/utils/format';

export interface AssetQuery {
  keyword?: string;
  type?: string;
  status?: string;
  project?: string;
  capability?: string;
  duration?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

const DURATION_RANGE: Record<string, [number, number]> = {
  '<1m': [0, 60],
  '1-5m': [60, 300],
  '5-30m': [300, 1800],
  '>30m': [1800, Number.MAX_SAFE_INTEGER],
};

export async function listAssets(q: AssetQuery = {}): Promise<Paged<MediaAsset>> {
  await sleep(220);
  let list = getAssets().slice();
  if (q.keyword) {
    const k = q.keyword.toLowerCase();
    list = list.filter(
      (a) => a.title.toLowerCase().includes(k) || a.tags.some((t) => t.toLowerCase().includes(k)) || a.project.toLowerCase().includes(k),
    );
  }
  if (q.type && q.type !== 'all') list = list.filter((a) => a.type === q.type);
  if (q.status && q.status !== 'all') list = list.filter((a) => a.status === q.status);
  if (q.project && q.project !== 'all') list = list.filter((a) => a.project === q.project);
  if (q.capability && q.capability !== 'all') list = list.filter((a) => a.capabilities.includes(q.capability as CapabilityId));
  if (q.duration && DURATION_RANGE[q.duration]) {
    const [lo, hi] = DURATION_RANGE[q.duration];
    list = list.filter((a) => a.duration >= lo && a.duration < hi);
  }
  switch (q.sort) {
    case 'duration':
      list.sort((a, b) => b.duration - a.duration);
      break;
    case 'size':
      list.sort((a, b) => b.sizeBytes - a.sizeBytes);
      break;
    case 'name':
      list.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
      break;
    default:
      list.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }
  const page = q.page || 1;
  const pageSize = q.pageSize || 24;
  return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length };
}

export async function getAssetById(id: string): Promise<MediaAsset | undefined> {
  await sleep(160);
  return getAsset(id);
}

export async function listFindings(assetId?: string): Promise<ReviewFinding[]> {
  await sleep(180);
  const list = getFindings();
  return assetId ? list.filter((f) => f.assetId === assetId) : list;
}

export async function listPipelines(): Promise<Pipeline[]> {
  await sleep(200);
  return PIPELINES;
}

export async function getPipeline(id: string): Promise<Pipeline | undefined> {
  await sleep(140);
  return PIPELINES.find((p) => p.id === id);
}

export function getPipelineRuns(id: string) {
  return PIPELINE_RUNS.filter((r) => r.pipelineId === id);
}

export async function listTasksApi(): Promise<Task[]> {
  await sleep(160);
  return [];
}

export interface UsageDay {
  date: string;
  total: number;
  byCap: Record<string, number>;
}

export function usageByDay(days = 30): UsageDay[] {
  const map = new Map<string, UsageDay>();
  const since = Date.now() - days * 86400_000;
  USAGE_RECORDS.forEach((r) => {
    if (new Date(r.date).getTime() < since) return;
    const key = r.date;
    if (!map.has(key)) map.set(key, { date: key, total: 0, byCap: {} });
    const item = map.get(key)!;
    item.total += r.amount;
    item.byCap[r.capability] = (item.byCap[r.capability] || 0) + r.amount;
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function usageTotals(days = 30) {
  const since = Date.now() - days * 86400_000;
  const rows = USAGE_RECORDS.filter((r) => new Date(r.date).getTime() >= since);
  const minutes = rows.reduce((s, r) => s + r.amount, 0);
  const cost = rows.reduce((s, r) => s + r.amount * r.price, 0);
  return { minutes, cost, rows };
}

export function usageRows(limit = 80): UsageRecord[] {
  return USAGE_RECORDS.slice(0, limit);
}

export function apiLogs(): ApiCallLog[] {
  return API_CALL_LOGS;
}

export function auditLogs(): AuditLog[] {
  return AUDIT_LOGS;
}

export function templates(): Template[] {
  return TEMPLATES;
}

export const assetSummary = summary;
