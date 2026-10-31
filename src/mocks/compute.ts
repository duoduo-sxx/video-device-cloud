import type { ComputeSpec, ComputeInstance, Quota } from '@/types';
import { round2 } from '@/lib/calc';

export const COMPUTE_SPECS: ComputeSpec[] = [
  {
    id: 'SPEC-A100',
    gpuModel: 'NVIDIA A100 80G',
    memoryGB: 80,
    computeTFLOPS: 312,
    region: '华北 2（北京）',
    zone: 'cn-north-2a',
    unitPrice: 68,
    totalCards: 384,
    allocatedCards: 291,
    status: 'tight',
    image: 'a100',
  },
  {
    id: 'SPEC-H100',
    gpuModel: 'NVIDIA H100 80G',
    memoryGB: 80,
    computeTFLOPS: 989,
    region: '华东 1（苏州）',
    zone: 'cn-east-1b',
    unitPrice: 98,
    totalCards: 192,
    allocatedCards: 168,
    status: 'tight',
    image: 'h100',
  },
  {
    id: 'SPEC-L20',
    gpuModel: 'NVIDIA L20 48G',
    memoryGB: 48,
    computeTFLOPS: 119,
    region: '华北 2（北京）',
    zone: 'cn-north-2b',
    unitPrice: 26,
    totalCards: 240,
    allocatedCards: 97,
    status: 'available',
    image: 'l20',
  },
  {
    id: 'SPEC-4090',
    gpuModel: 'NVIDIA RTX 4090 24G',
    memoryGB: 24,
    computeTFLOPS: 83,
    region: '华南 1（深圳）',
    zone: 'cn-south-1a',
    unitPrice: 12,
    totalCards: 512,
    allocatedCards: 402,
    status: 'tight',
    image: '4090',
  },
  {
    id: 'SPEC-910B',
    gpuModel: '昇腾 910B 64G',
    memoryGB: 64,
    computeTFLOPS: 256,
    region: '华东 1（苏州）',
    zone: 'cn-east-1a',
    unitPrice: 54,
    totalCards: 128,
    allocatedCards: 44,
    status: 'available',
    image: '910b',
  },
];

export const INSTANCES: ComputeInstance[] = [
  {
    id: 'INS-20260914-0087',
    tenantId: 'TEN-0001',
    specId: 'SPEC-A100',
    specName: 'NVIDIA A100 80G',
    image: 'PyTorch 2.4 / CUDA 12.4',
    cardCount: 16,
    billingMode: 'reserved',
    region: '华北 2（北京） / cn-north-2a',
    status: 'running',
    createdAt: '2026-09-14T09:20:00',
    hoursUsed: 1084,
    monthlyCost: 34816,
  },
  {
    id: 'INS-20260928-0112',
    tenantId: 'TEN-0001',
    specId: 'SPEC-4090',
    specName: 'NVIDIA RTX 4090 24G',
    image: 'PyTorch 2.4 / CUDA 12.4',
    cardCount: 8,
    billingMode: 'usage',
    region: '华南 1（深圳） / cn-south-1a',
    status: 'running',
    createdAt: '2026-09-28T14:05:00',
    hoursUsed: 812,
    monthlyCost: 9744,
  },
  {
    id: 'INS-20261009-0131',
    tenantId: 'TEN-0001',
    specId: 'SPEC-L20',
    specName: 'NVIDIA L20 48G',
    image: '基础 CUDA 12.4',
    cardCount: 4,
    billingMode: 'usage',
    region: '华北 2（北京） / cn-north-2b',
    status: 'running',
    createdAt: '2026-10-09T10:45:00',
    hoursUsed: 542,
    monthlyCost: 14092,
  },
  {
    id: 'INS-20260902-0064',
    tenantId: 'TEN-0001',
    specId: 'SPEC-A100',
    specName: 'NVIDIA A100 80G',
    image: 'TensorFlow 2.16 / CUDA 12.4',
    cardCount: 8,
    billingMode: 'reserved',
    region: '华北 2（北京） / cn-north-2a',
    status: 'stopped',
    createdAt: '2026-09-02T16:30:00',
    hoursUsed: 306,
    monthlyCost: 0,
  },
  {
    id: 'INS-20260818-0042',
    tenantId: 'TEN-0001',
    specId: 'SPEC-4090',
    specName: 'NVIDIA RTX 4090 24G',
    image: 'PyTorch 2.4 / CUDA 12.4',
    cardCount: 12,
    billingMode: 'usage',
    region: '华南 1（深圳） / cn-south-1a',
    status: 'released',
    createdAt: '2026-08-18T11:12:00',
    hoursUsed: 1240,
    monthlyCost: 0,
  },
  {
    id: 'INS-20261026-0148',
    tenantId: 'TEN-0001',
    specId: 'SPEC-H100',
    specName: 'NVIDIA H100 80G',
    image: 'PyTorch 2.4 / CUDA 12.4',
    cardCount: 4,
    billingMode: 'reserved',
    region: '华东 1（苏州） / cn-east-1b',
    status: 'running',
    createdAt: '2026-10-26T08:00:00',
    hoursUsed: 148,
    monthlyCost: 14504,
  },
];

export const QUOTAS: Quota[] = [
  { id: 'Q-01', tenantId: 'TEN-0001', specName: 'NVIDIA A100 80G', cards: 24, usedCards: 16, expireAt: '2026-12-31' },
  { id: 'Q-02', tenantId: 'TEN-0001', specName: 'NVIDIA H100 80G', cards: 8, usedCards: 4, expireAt: '2026-12-31' },
  { id: 'Q-03', tenantId: 'TEN-0001', specName: 'NVIDIA RTX 4090 24G', cards: 24, usedCards: 8, expireAt: '2026-12-31' },
  { id: 'Q-04', tenantId: 'TEN-0001', specName: 'NVIDIA L20 48G', cards: 8, usedCards: 4, expireAt: '2027-03-31' },
];

export function instancesOf(tenantId: string): ComputeInstance[] {
  return INSTANCES.filter((i) => i.tenantId === tenantId);
}

export function instancesCost(tenantId: string): number {
  return round2(
    instancesOf(tenantId)
      .filter((i) => i.status === 'running')
      .reduce((a, i) => a + i.monthlyCost, 0),
  );
}

/** 实例监控时序（确定性生成） */
export function instanceMetrics(id: string): { t: string; util: number; mem: number; temp: number; power: number }[] {
  let seed = 0;
  for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  const out = [];
  for (let i = 0; i < 48; i++) {
    const r = Math.abs(Math.sin((seed + i) * 0.37));
    const r2 = Math.abs(Math.sin((seed + i) * 0.21 + 1.7));
    out.push({
      t: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
      util: Math.round(58 + r * 38),
      mem: Math.round(62 + r2 * 30),
      temp: Math.round(52 + r * 18),
      power: Math.round(210 + r * 140),
    });
  }
  return out;
}
