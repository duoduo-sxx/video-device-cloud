import type { Metrics } from '@/types';

/**
 * 指标计算唯一入口。
 * 所有派生指标（CTR / CPC / CVR / CPA / ROI …）必须由基础量算出，禁止硬编码结果，
 * 以保证「账户 → 计划 → 素材」任意层级下钻时数字都能对上。
 */

export function r2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export const EMPTY_METRICS: Metrics = {
  impressions: 0,
  clicks: 0,
  spend: 0,
  conversions: 0,
  paidOrders: 0,
  gmv: 0,
  reach: 0,
};

export function addMetrics(a: Metrics, b: Metrics): Metrics {
  return {
    impressions: a.impressions + b.impressions,
    clicks: a.clicks + b.clicks,
    spend: r2(a.spend + b.spend),
    conversions: a.conversions + b.conversions,
    paidOrders: a.paidOrders + b.paidOrders,
    gmv: r2(a.gmv + b.gmv),
    reach: a.reach + b.reach,
  };
}

export function sumMetrics(rows: Metrics[]): Metrics {
  return rows.reduce(addMetrics, { ...EMPTY_METRICS });
}

/* ---------------- 派生指标 ---------------- */
export const ctr = (m: Metrics) => (m.impressions ? m.clicks / m.impressions : 0);
export const cpc = (m: Metrics) => (m.clicks ? m.spend / m.clicks : 0);
export const cvr = (m: Metrics) => (m.clicks ? m.conversions / m.clicks : 0);
export const cpa = (m: Metrics) => (m.conversions ? m.spend / m.conversions : 0);
export const roi = (m: Metrics) => (m.spend ? m.gmv / m.spend : 0);
export const aov = (m: Metrics) => (m.paidOrders ? m.gmv / m.paidOrders : 0);
export const cpm = (m: Metrics) => (m.impressions ? (m.spend / m.impressions) * 1000 : 0);
export const frequency = (m: Metrics) => (m.reach ? m.impressions / m.reach : 0);
export const payRate = (m: Metrics) => (m.conversions ? m.paidOrders / m.conversions : 0);
export const clickPerConv = (m: Metrics) => (m.conversions ? m.clicks / m.conversions : 0);

/** 环比变化（返回 0-1 之间的小数，正数表示增长） */
export function change(cur: number, prev: number): number {
  if (!prev) return 0;
  return (cur - prev) / prev;
}

/* ---------------- 拆分工具（保证合计严格相等） ---------------- */

/**
 * 把整数总量按权重拆分，采用「最大余数法」，保证 Σ结果 === total 且每项为整数。
 * 用于曝光、点击、转化、人群人数等不可拆分的计数。
 */
export function allocateInt(total: number, weights: number[]): number[] {
  const sumW = weights.reduce((s, w) => s + w, 0);
  if (!sumW || !total) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sumW);
  const base = raw.map((v) => Math.floor(v));
  let rest = total - base.reduce((s, v) => s + v, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < rest; k++) base[order[k % order.length].i] += 1;
  return base;
}

/**
 * 把金额总量按权重拆分到「分」，保证 Σ结果 === total（两位小数，无尾差）。
 */
export function allocateMoney(total: number, weights: number[]): number[] {
  const cents = Math.round(total * 100);
  const ints = allocateInt(cents, weights);
  return ints.map((c) => c / 100);
}

/** 按份额（0-1）拆分金额，份额之和理论上为 1，此处用权重方式避免浮点尾差 */
export function splitByShare(total: number, shares: number[]): number[] {
  return allocateMoney(total, shares);
}

/* ---------------- 展示辅助 ---------------- */
export const fmtPct = (v: number, d = 2) => `${(v * 100).toFixed(d)}%`;
export const fmtX = (v: number, d = 2) => `${v.toFixed(d)}`;
export const fmtCpa = (v: number) => `¥${v.toFixed(2)}`;

/** 预算弹性：预算变化 s，转化变化 ≈ s^elasticity */
export function budgetLift(baseBudget: number, nextBudget: number, elasticity: number): number {
  if (!baseBudget) return 0;
  return Math.pow(nextBudget / baseBudget, elasticity) - 1;
}

/** 健康度评分（0-100），用于总览页账户体检 */
export function healthScore(args: {
  roi: number;
  cpaChange: number;
  paceRate: number;
  quality: number;
}): number {
  const roiScore = Math.min(40, (args.roi / 3.5) * 40);
  const cpaScore = Math.max(0, 25 - Math.max(0, args.cpaChange) * 100);
  const paceScore = Math.max(0, 20 - Math.abs(1 - args.paceRate) * 40);
  const dataScore = args.quality * 15;
  return Math.round(Math.min(100, roiScore + cpaScore + paceScore + dataScore));
}
