import type { DailyRow, Metrics, PlatformCode, Period } from '@/types';
import { ACCOUNTS } from './platforms';
import { hash, rnd } from './seed';
import { addMetrics, allocateInt, r2, sumMetrics } from '@/lib/metrics';

/** 数据区间：9 月用于环比，10 月为演示主账期 */
export const DATA_START = '2026-09-01';
export const DATA_END = '2026-10-31';
export const CURRENT_PERIOD: Period = '2026-10';
export const PREV_PERIOD: Period = '2026-09';
export const TODAY = '2026-10-31';

const pad2 = (n: number) => String(n).padStart(2, '0');
/** 本地时区格式化，避免 toISOString 在 UTC+8 下回退一天 */
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

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

/** 日历节奏：周末冲量 + 国庆高峰 + 双 11 预热爬坡 */
function dateFactor(date: string): number {
  const d = new Date(date + 'T00:00:00');
  const w = d.getDay();
  const md = date.slice(5);
  let f = 1;
  if (w === 5 || w === 6 || w === 0) f *= 1.14;
  else if (w === 1) f *= 0.93;

  if (date.startsWith('2026-09')) {
    f *= 0.9;
    if (md >= '09-20') f *= 1.06; // 9 月末抢先购
  } else if (md <= '10-07') {
    f *= 1.28; // 国庆出行高峰
  } else if (md <= '10-20') {
    f *= 0.88; // 节后蓄水
  } else {
    // 双 11 预热，逐日爬坡 1.05 → 1.42
    const day = Number(md.slice(3));
    f *= 1.05 + ((day - 21) / 10) * 0.37;
  }
  return f;
}

interface Shock {
  /** 从该日起生效 */
  from: string;
  spend?: number;
  ctr?: number;
  cvr?: number;
  /** 该账户从该日起无数据（授权过期 / 停投） */
  blackoutFrom?: string;
}

/** 预置的几处「真实事故」，供异常诊断、数据质量、建议模块使用 */
const SHOCKS: Record<string, Shock[]> = {
  // 抖音效果账户：10/28 起素材疲劳 + 加预算，CPA 明显上涨
  'ACC-102': [{ from: '2026-10-28', spend: 1.18, cvr: 0.62 }],
  // 磁力效果：10/26 起主计划审核不通过，掉量 30%
  'ACC-301': [{ from: '2026-10-26', spend: 0.7, ctr: 0.88 }],
  // 聚光种草：10/29 授权过期，之后无数据（数据质量页会报「及时性」问题）
  'ACC-501': [{ from: '2026-10-29', blackoutFrom: '2026-10-29' }],
  // 朋友圈：10/24 起更换落地页，CVR 提升
  'ACC-201': [{ from: '2026-10-24', cvr: 1.22 }],
};

function shockOf(accountId: string, date: string) {
  const list = SHOCKS[accountId] ?? [];
  const applied: Omit<Shock, 'from'> = {};
  for (const s of list) {
    if (date < s.from) continue;
    if (s.blackoutFrom && date >= s.blackoutFrom) return { blackout: true, shock: applied };
    if (s.spend) applied.spend = (applied.spend ?? 1) * s.spend;
    if (s.ctr) applied.ctr = (applied.ctr ?? 1) * s.ctr;
    if (s.cvr) applied.cvr = (applied.cvr ?? 1) * s.cvr;
  }
  return { blackout: false, shock: applied };
}

function buildRow(accountId: string, date: string): DailyRow | null {
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
  const reach = Math.round(impressions / frequency);

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
    reach,
  };
}

/** 全量日粒度明细（账户 × 日），是页面所有数字的唯一来源 */
export const DAILY: DailyRow[] = (() => {
  const rows: DailyRow[] = [];
  for (const date of ALL_DATES) {
    for (const acc of ACCOUNTS) {
      const row = buildRow(acc.id, date);
      if (row) rows.push(row);
    }
  }
  return rows;
})();

/* ---------------- 聚合 ---------------- */
const inPeriod = (date: string, period: Period) => date.startsWith(period);

export function dailyOf(accountId: string, period: Period = CURRENT_PERIOD): DailyRow[] {
  return DAILY.filter((r) => r.accountId === accountId && inPeriod(r.date, period));
}

export function rowsOfPeriod(period: Period = CURRENT_PERIOD): DailyRow[] {
  return DAILY.filter((r) => inPeriod(r.date, period));
}

export function metricsOfAccount(accountId: string, period: Period = CURRENT_PERIOD): Metrics {
  return sumMetrics(dailyOf(accountId, period));
}

export function metricsOfPlatform(platform: PlatformCode, period: Period = CURRENT_PERIOD): Metrics {
  return sumMetrics(rowsOfPeriod(period).filter((r) => r.platform === platform));
}

export function totalMetrics(period: Period = CURRENT_PERIOD): Metrics {
  return sumMetrics(rowsOfPeriod(period));
}

/** 按日汇总，用于趋势图 */
export function dailyTotals(period: Period = CURRENT_PERIOD): { date: string; m: Metrics }[] {
  const map = new Map<string, Metrics>();
  for (const r of rowsOfPeriod(period)) {
    const cur = map.get(r.date) ?? {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      paidOrders: 0,
      gmv: 0,
      reach: 0,
    };
    map.set(r.date, addMetrics(cur, r));
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, m]) => ({ date, m }));
}

/** 平台 × 日 汇总，用于堆叠图 */
export function dailyByPlatform(period: Period = CURRENT_PERIOD) {
  const dates = [...new Set(rowsOfPeriod(period).map((r) => r.date))].sort();
  return dates.map((date) => {
    const rows = rowsOfPeriod(period).filter((r) => r.date === date);
    const byPlatform = {} as Record<PlatformCode, number>;
    for (const r of rows) byPlatform[r.platform] = r2((byPlatform[r.platform] ?? 0) + r.spend);
    return { date, byPlatform, total: r2(rows.reduce((s, r) => s + r.spend, 0)) };
  });
}

/** 账户月汇总（含派生指标由调用方用 lib/metrics 计算） */
export function accountSummaries(period: Period = CURRENT_PERIOD) {
  return ACCOUNTS.map((a) => ({
    account: a,
    m: metricsOfAccount(a.id, period),
    prev: metricsOfAccount(a.id, PREV_PERIOD),
    /** 预算消耗节奏 = 已消耗 / (日预算 × 天数) */
    pace: (() => {
      const days = rowsOfPeriod(period).filter((r) => r.accountId === a.id).length;
      return days ? metricsOfAccount(a.id, period).spend / (a.dailyBudget * days) : 0;
    })(),
  }));
}

/** 近 N 日数据（用于总览卡片与异常检测） */
export function recentMetrics(days: number, endDate: string = TODAY): Metrics {
  const start = (() => {
    const d = new Date(endDate + 'T00:00:00');
    d.setDate(d.getDate() - days + 1);
    return d.toISOString().slice(0, 10);
  })();
  return sumMetrics(DAILY.filter((r) => r.date >= start && r.date <= endDate));
}

/** 某账户近 N 日 vs 前 N 日 */
export function compareRecent(accountId: string, days = 3) {
  const end = TODAY;
  const shift = (base: string, n: number) => {
    const d = new Date(base + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const curStart = shift(end, -(days - 1));
  const prevEnd = shift(curStart, -1);
  const prevStart = shift(prevEnd, -(days - 1));
  const pick = (from: string, to: string) =>
    sumMetrics(DAILY.filter((r) => r.accountId === accountId && r.date >= from && r.date <= to));
  return { cur: pick(curStart, end), prev: pick(prevStart, prevEnd), curStart, end, prevStart, prevEnd };
}

/** 按权重把账户月汇总拆到计划（保证 Σ计划 === 账户） */
export function splitAccountMetrics(accountId: string, weights: number[], period: Period = CURRENT_PERIOD): Metrics[] {
  const m = metricsOfAccount(accountId, period);
  const spendParts = (() => {
    const cents = Math.round(m.spend * 100);
    const ints = allocateInt(cents, weights);
    return ints.map((c) => c / 100);
  })();
  const imparts = allocateInt(m.impressions, weights);
  const clickParts = allocateInt(m.clicks, weights);
  const convParts = allocateInt(m.conversions, weights);
  const paidParts = allocateInt(m.paidOrders, weights);
  const gmvCents = allocateInt(Math.round(m.gmv * 100), weights);
  const reachParts = allocateInt(m.reach, weights);
  return weights.map((_, i) => ({
    impressions: imparts[i],
    clicks: clickParts[i],
    spend: spendParts[i],
    conversions: convParts[i],
    paidOrders: paidParts[i],
    gmv: gmvCents[i] / 100,
    reach: reachParts[i],
  }));
}
