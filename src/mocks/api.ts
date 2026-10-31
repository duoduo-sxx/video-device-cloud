import type { ApiKey, ApiCallLog } from '@/types';

export const API_KEYS: ApiKey[] = [
  {
    id: 'KEY-001',
    tenantId: 'TEN-0001',
    name: '生产环境-主密钥',
    prefix: 'sk-live-hr',
    maskedKey: 'sk-live-hr-••••••••••••7f2a',
    quotaDaily: 5000000,
    usedToday: 3182640,
    ipWhitelist: ['120.244.18.0/24', '39.156.66.21'],
    status: 'active',
    createdAt: '2026-08-02T10:12:00',
    lastUsedAt: '2026-10-31T23:38:12',
  },
  {
    id: 'KEY-002',
    tenantId: 'TEN-0001',
    name: '生产环境-推理专用',
    prefix: 'sk-live-hr-inf',
    maskedKey: 'sk-live-hr-inf-••••••••c19d',
    quotaDaily: 2000000,
    usedToday: 1428760,
    ipWhitelist: ['120.244.18.0/24'],
    status: 'active',
    createdAt: '2026-08-14T15:30:00',
    lastUsedAt: '2026-10-31T23:41:03',
  },
  {
    id: 'KEY-003',
    tenantId: 'TEN-0001',
    name: '联调测试',
    prefix: 'sk-test-hr',
    maskedKey: 'sk-test-hr-••••••••••04be',
    quotaDaily: 200000,
    usedToday: 18420,
    ipWhitelist: [],
    status: 'active',
    createdAt: '2026-09-21T09:00:00',
    lastUsedAt: '2026-10-30T16:22:41',
  },
  {
    id: 'KEY-004',
    tenantId: 'TEN-0001',
    name: '临时数据导出（已停用）',
    prefix: 'sk-live-hr-exp',
    maskedKey: 'sk-live-hr-exp-••••••aa71',
    quotaDaily: 100000,
    usedToday: 0,
    ipWhitelist: [],
    status: 'revoked',
    createdAt: '2026-07-05T11:40:00',
    lastUsedAt: '2026-09-02T08:14:20',
  },
];

const SERVICE_POOL = [
  { name: '文本生成 Qwen3-72B', tokens: 3200, cost: 2.56 },
  { name: '文本向量化 BGE-M3', tokens: 1200, cost: 0.18 },
  { name: '多模态理解 Vision-Pro', tokens: 2100, cost: 2.52 },
  { name: '语音识别 Paraformer', tokens: 0, cost: 0.36 },
  { name: '企业画像匹配 EntityMatch-Pro', tokens: 0, cost: 0.22 },
  { name: '商品文案生成 CopyGen-CN', tokens: 1800, cost: 2.6 },
];

const KEY_NAMES = ['生产环境-主密钥', '生产环境-推理专用', '联调测试'];

function seeded(seed: number): number {
  const x = Math.sin(seed * 41.7 + 7.13) * 19753.31;
  return x - Math.floor(x);
}

const logs: ApiCallLog[] = [];
for (let i = 0; i < 420; i++) {
  const s = SERVICE_POOL[i % SERVICE_POOL.length];
  const r = seeded(i + 3);
  const day = 31 - (i % 14);
  const err = i % 53 === 0 ? 429 : i % 89 === 0 ? 500 : 200;
  logs.push({
    id: `LOG-${String(10000 + i)}`,
    tenantId: 'TEN-0001',
    requestId: `req_${(0x9f2a1b + i * 7919).toString(16)}${String(i).padStart(4, '0')}`,
    serviceName: s.name,
    apiKeyName: KEY_NAMES[i % KEY_NAMES.length],
    latencyMs: Math.round(120 + r * 1800),
    tokens: s.tokens === 0 ? 0 : Math.round(s.tokens * (0.6 + r)),
    statusCode: err,
    cost: err === 200 ? Number((s.cost * (0.7 + r * 0.6)).toFixed(2)) : 0,
    occurredAt: `2026-10-${String(day).padStart(2, '0')}T${String(6 + (i % 17)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
    ip: i % 5 === 0 ? '120.244.18.77' : '39.156.66.21',
  });
}

export const API_LOGS = logs.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));

export function keysOf(tenantId: string): ApiKey[] {
  return API_KEYS.filter((k) => k.tenantId === tenantId);
}

export function logsOf(tenantId: string): ApiCallLog[] {
  return API_LOGS.filter((l) => l.tenantId === tenantId);
}
