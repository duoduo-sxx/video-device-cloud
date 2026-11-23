import type { DailyRow, Metrics, Period, PlatformCode } from '@/types';
import { ACCOUNTS, QIANCHUAN_ACCOUNT_IDS } from './platforms';
import { hash, rnd } from './seed';
import { addMetrics, allocateInt, allocateMoney, r2, sumMetrics } from '@/lib/metrics';
import { QIANCHUAN_RECORDS } from './qianchuan';

/**
 * 唯一数据源。
 * - 千川 595 个账户的「消耗 / 成交订单 / 成交金额」来自真实 xlsx 快照，月汇总严格等于表内数额；
 * - 源表没有日期、曝光、点击字段：日粒度按确定性权重拆分，曝光/点击按固定 CPM/CTR 派生；
 * - 上月（2026-09）数据为演示环比派生，不冒充真实历史。
 */
export const DATA_START = '2026-09-01';
export const DATA_END = '2026-10-31';
export const CURRENT_PERIOD: Period = '2026-10';
export const PREV_PERIOD: Period = '2026-09';
export const TODAY = '2026-10-31';

const pad2 = (n: number) => String(n).padStart(2, '0');
/** 本地时区格式化，避免 toISOString 在 UTC+8 下回退一天 */
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const shiftDate = (base: string, days: number) => {
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateStr(d);
};

function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (d <= last) {
    out.push(toDateStr(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const ALL_DATES = datesBetween(DATA_START, DATA_END);
const CURRENT_DATES = ALL_DATES.filter((d) => d.startsWith(CURRENT_PERIOD));
const PREV_DATES = ALL_DATES.filter((d) => d.startsWith(PREV_PERIOD));
const datesOf = (period: Period) => (period === CURRENT_PERIOD ? CURRENT_DATES : PREV_DATES);

/** 日历节奏：周末冲量 + 国庆高峰 + 双 11 预热爬坡（只影响派生日分布） */
function dateFactor(date: string): number {
  const d = new Date(date + 'T00:00:00');
  const w = d.getDay();
  const md = date.slice(5);
  let f = 1;
  if (w === 5 || w === 6 || w === 0) f *= 1.14;
  else if (w === 1) f *= 0.93;

  if (date.startsWith(PREV_PERIOD)) {
    f *= 0.9;
    if (md >= '09-20') f *= 1.06;
  } else if (md <= '10-07') {
    f *= 1.28;
  } else if (md <= '10-20') {
    f *= 0.88;
  } else {
    const day = Number(md.slice(3));
    f *= 1.05 + ((day - 21) / 10) * 0.37;
  }
  return f;
}

interface Shock {
  from: string;
  spend?: number;
  ctr?: number;
  cvr?: number;
  blackoutFrom?: string;
}

/** 对照平台的预置事故，用于异常诊断演示；真实千川账户不注入事故 */
const SHOCKS: Record<string, Shock[]> = {
  'ACC-102': [{ from: '2026-10-28', spend: 1.18, cvr: 0.62 }],
  'ACC-301': [{ from: '2026-10-26', spend: 0.7, ctr: 0.88 }],
  'ACC-501': [{ from: '2026-10-29', blackoutFrom: '2026-10-29' }],
  'ACC-201': [{ from: '2026-10-24', cvr: 1.22 }],
};

function shockOf(accountId: string, date: string) {
  const applied: Omit<Shock, 'from'> = {};
  for (const s of SHOCKS[accountId] ?? []) {
    if (date < s.from) continue;
    if (s.blackoutFrom && date >= s.blackoutFrom) return { blackout: true, shock: applied };
    if (s.spend) applied.spend = (applied.spend ?? 1) * s.spend;
    if (s.ctr) applied.ctr = (applied.ctr ?? 1) * s.ctr;
    if (s.cvr) applied.cvr = (applied.cvr ?? 1) * s.cvr;
  }
  return { blackout: false, shock: applied };
}

/* ------------------------------------------------------------------ *
 * 真实千川账户：月汇总锁死表内数值，日分布 = 日历权重 × 确定性抖动
 * ------------------------------------------------------------------ */
interface RealTarget {
  spend: number;
  orders: number;
  gmv: number;
  prevSpend: number;
  prevOrders: number;
  prevGmv: number;
  cpm: number;
  ctr: number;
}

const REAL_TARGETS: Record<string, RealTarget> = (() => {
  const out: Record<string, RealTarget> = {};
  for (const r of QIANCHUAN_RECORDS) {
    const seed = hash(r.id);
    // 上月为演示派生：按账户给一个温和的环比系数，使趋势与环比分析有真实可用形状
    const growth = 0.86 + rnd(seed + 11) * 0.34;
    out[r.id] = {
      spend: r.spend,
      orders: r.orders,
      gmv: r.gmv,
      prevSpend: r2(r.spend * growth),
      prevOrders: Math.round(r.orders * growth * (0.97 + rnd(seed + 12) * 0.05)),
      prevGmv: r2(r.gmv * growth * (0.96 + rnd(seed + 13) * 0.08)),
      cpm: 28 + rnd(seed) * 22,
      ctr: 0.018 + rnd(seed + 1) * 0.03,
    };
  }
  return out;
})();

/** 日拆分权重：同一账户同一账期内归一化，保证 Σ日 = 月总额 */
function realWeights(accountId: string, period: Period): number[] {
  return datesOf(period).map((date) => {
    const seed = hash(`${accountId}|${period}|${date}`);
    return dateFactor(date) * (1 + (rnd(seed) - 0.5) * 0.2);
  });
}

/** 按日把真实月汇总拆开（金额按分、订单按整数，最大余数法保证无尾差） */
function realRowsOf(accountId: string, period: Period): DailyRow[] {
  const target = REAL_TARGETS[accountId];
  const isCur = period === CURRENT_PERIOD;
  const spend = isCur ? target.spend : target.prevSpend;
  const orders = isCur ? target.orders : target.prevOrders;
  const gmv = isCur ? target.gmv : target.prevGmv;
  if (!spend || !orders) return [];

  const dates = datesOf(period);
  const weights = realWeights(accountId, period);
  const spendParts = allocateMoney(spend, weights);
  const orderParts = allocateInt(orders, weights);
  // GMV 跟着订单走：订单为 0 的日期不应凭空出现成交金额
  const gmvParts = allocateMoney(gmv, orderParts);

  return dates.map((date, i) => {
    const seed = hash(`${accountId}|${date}|derived`);
    const imp = Math.max(1, Math.round((spendParts[i] / target.cpm) * 1000));
    const clk = Math.max(orderParts[i], Math.round(imp * target.ctr));
    return {
      date,
      accountId,
      platform: 'oceanengine',
      impressions: imp,
      clicks: clk,
      spend: spendParts[i],
      conversions: orderParts[i],
      paidOrders: orderParts[i],
      gmv: gmvParts[i],
      reach: Math.round(imp / (2.1 + rnd(seed) * 0.7)),
    };
  });
}

/* ------------------------------------------------------------------ *
 * 对照平台账户：沿用原有确定性生成器
 * ------------------------------------------------------------------ */
function buildMockRow(accountId: string, date: string): DailyRow | null {
  const acc = ACCOUNTS.find((a) => a.id === accountId)!;
  const { blackout, shock } = shockOf(accountId, date);
  if (blackout) return null;

  const seed = hash(`${accountId}-${date}`);
  const noise = 1 + (rnd(seed) - 0.5) * 0.16;
  const spend = r2(acc.base.daily * dateFactor(date) * noise * (shock.spend ?? 1));
  const cpm = acc.base.cpm * (1 + (rnd(seed + 1) - 0.5) * 0.08);
  const ctr = acc.base.ctr * (1 + (rnd(seed + 2) - 0.5) * 0.12) * (shock.ctr ?? 1);
  const cvr = acc.base.cvr * (1 + (rnd(seed + 3) - 0.5) * 0.14) * (shock.cvr ?? 1);
  const aov = acc.base.aov * (1 + (rnd(seed + 4) - 0.5) * 0.05);

  const impressions = Math.max(1000, Math.round((spend / cpm) * 1000));
  const clicks = Math.max(10, Math.round(impressions * ctr));
  const conversions = Math.max(1, Math.round(clicks * cvr));
  const paidOrders = Math.max(1, Math.round(conversions * 0.9645));
  const gmv = r2(paidOrders * aov);
  const frequency = 2.1 + rnd(seed + 5) * 0.7;
  return {
    date,
    accountId,
    platform: acc.platform,
    impressions,
    clicks,
    spend,
    conversions,
    paidOrders,
    gmv,
    reach: Math.round(impressions / frequency),
  };
}

/** 全量日粒度明细（账户 × 日），页面所有数字的唯一来源 */
export const DAILY: DailyRow[] = (() => {
  const rows: DailyRow[] = [];
  for (const acc of ACCOUNTS) {
    if (QIANCHUAN_ACCOUNT_IDS.has(acc.id)) {
      rows.push(...realRowsOf(acc.id, PREV_PERIOD), ...realRowsOf(acc.id, CURRENT_PERIOD));
      continue;
    }
    for (const date of ALL_DATES) {
      const row = buildMockRow(acc.id, date);
      if (row) rows.push(row);
    }
  }
  return rows;
})();

/* ---------------- 索引：避免 607 个账户逐行 filter 全表 ---------------- */
const BY_ACCOUNT = new Map<string, DailyRow[]>();
const BY_ACCOUNT_PLATFORM = new Map<string, DailyRow[]>();
const BY_PERIOD = new Map<Period, DailyRow[]>();
for (const r of DAILY) {
  const a = BY_ACCOUNT.get(r.accountId) ?? [];
  a.push(r);
  BY_ACCOUNT.set(r.accountId, a);
  const key = `${r.platform}|${r.date.slice(0, 7)}`;
  const ap = BY_ACCOUNT_PLATFORM.get(key) ?? [];
  ap.push(r);
  BY_ACCOUNT_PLATFORM.set(key, ap);
  const p = r.date.slice(0, 7);
  const pr = BY_PERIOD.get(p) ?? [];
  pr.push(r);
  BY_PERIOD.set(p, pr);
}

const inPeriod = (date: string, period: Period) => date.startsWith(period);

export function dailyOf(accountId: string, period: Period = CURRENT_PERIOD): DailyRow[] {
  return (BY_ACCOUNT.get(accountId) ?? []).filter((r) => inPeriod(r.date, period));
}

export function rowsOfPeriod(period: Period = CURRENT_PERIOD): DailyRow[] {
  return BY_PERIOD.get(period) ?? [];
}

export function metricsOfAccount(accountId: string, period: Period = CURRENT_PERIOD): Metrics {
  return sumMetrics(dailyOf(accountId, period));
}

export function metricsOfPlatform(platform: PlatformCode, period: Period = CURRENT_PERIOD): Metrics {
  return sumMetrics(
    rowsOfPeriod(period).filter((r) => r.platform === platform),
  );
}

export function totalMetrics(period: Period = CURRENT_PERIOD): Metrics {
  return sumMetrics(rowsOfPeriod(period));
}

/** 按日汇总，用于趋势图 */
export function dailyTotals(period: Period = CURRENT_PERIOD): { date: string; m: Metrics }[] {
  const map = new Map<string, Metrics>();
  for (const r of rowsOfPeriod(period)) {
    const cur = map.get(r.date) ?? { impressions: 0, clicks: 0, spend: 0, conversions: 0, paidOrders: 0, gmv: 0, reach: 0 };
    map.set(r.date, addMetrics(cur, r));
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, m]) => ({ date, m }));
}

/** 平台 × 日汇总，用于堆叠图 */
export function dailyByPlatform(period: Period = CURRENT_PERIOD) {
  const dates = datesOf(period);
  const byDate = new Map<string, { byPlatform: Record<string, number>; total: number }>();
  for (const r of rowsOfPeriod(period)) {
    const row = byDate.get(r.date) ?? { byPlatform: {}, total: 0 };
    row.byPlatform[r.platform] = r2((row.byPlatform[r.platform] ?? 0) + r.spend);
    row.total = r2(row.total + r.spend);
    byDate.set(r.date, row);
  }
  return dates.map((date) => {
    const row = byDate.get(date) ?? { byPlatform: {}, total: 0 };
    return { date, byPlatform: row.byPlatform as Record<PlatformCode, number>, total: row.total };
  });
}

/** 账户月汇总（含派生指标由调用方用 lib/metrics 计算） */
export function accountSummaries(period: Period = CURRENT_PERIOD) {
  const cur = new Map<string, Metrics>();
  const prev = new Map<string, Metrics>();
  for (const r of rowsOfPeriod(period)) cur.set(r.accountId, addMetrics(cur.get(r.accountId) ?? sumMetrics([]), r));
  for (const r of rowsOfPeriod(PREV_PERIOD)) prev.set(r.accountId, addMetrics(prev.get(r.accountId) ?? sumMetrics([]), r));
  const empty = sumMetrics([]);
  return ACCOUNTS.map((a) => {
    const m = cur.get(a.id) ?? empty;
    const days = (BY_ACCOUNT.get(a.id) ?? []).filter((r) => inPeriod(r.date, period)).length;
    return {
      account: a,
      m,
      prev: prev.get(a.id) ?? empty,
      /** 预算消耗节奏 = 已消耗 / (日预算 × 天数) */
      pace: days && a.dailyBudget ? m.spend / (a.dailyBudget * days) : 0,
    };
  });
}

/** 近 N 日数据（用于总览卡片与异常检测） */
export function recentMetrics(days: number, endDate: string = TODAY): Metrics {
  const start = shiftDate(endDate, -(days - 1));
  return sumMetrics(DAILY.filter((r) => r.date >= start && r.date <= endDate));
}

/** 某账户近 N 日 vs 前 N 日 */
export function compareRecent(accountId: string, days = 3) {
  const end = TODAY;
  const curStart = shiftDate(end, -(days - 1));
  const prevEnd = shiftDate(curStart, -1);
  const prevStart = shiftDate(prevEnd, -(days - 1));
  const pick = (from: string, to: string) =>
    sumMetrics((BY_ACCOUNT.get(accountId) ?? []).filter((r) => r.date >= from && r.date <= to));
  return { cur: pick(curStart, end), prev: pick(prevStart, prevEnd), curStart, end, prevStart, prevEnd };
}

/** 按权重把账户月汇总拆到计划（保证 Σ计划 === 账户） */
export function splitAccountMetrics(accountId: string, weights: number[], period: Period = CURRENT_PERIOD): Metrics[] {
  const m = metricsOfAccount(accountId, period);
  const spendParts = allocateMoney(m.spend, weights);
  const imparts = allocateInt(m.impressions, weights);
  const clickParts = allocateInt(m.clicks, weights);
  const convParts = allocateInt(m.conversions, weights);
  const paidParts = allocateInt(m.paidOrders, weights);
  const gmvParts = allocateMoney(m.gmv, weights);
  const reachParts = allocateInt(m.reach, weights);
  return weights.map((_, i) => ({
    impressions: imparts[i],
    clicks: clickParts[i],
    spend: spendParts[i],
    conversions: convParts[i],
    paidOrders: paidParts[i],
    gmv: gmvParts[i],
    reach: reachParts[i],
  }));
}
