import type { DailyMetric, PerformanceRow } from '@/types/models';
import type { ChannelId } from '@/types/enums';
import { projects } from './projects';
import { makeRng } from '../seed';

const rng = makeRng(20260909);

/** 各项目 DAU 基准（全渠道合计） */
const DAU_BASE: Record<string, number> = {
  'PRJ-2026-011': 14000,
  'PRJ-2026-009': 12000,
  'PRJ-2026-006': 320000,
  'PRJ-2026-014': 9000,
  'PRJ-2025-032': 150000,
  'PRJ-2026-017': 18000,
  'PRJ-2025-028': 210000,
  'PRJ-2025-041': 96000,
  'PRJ-2026-021': 32000,
  'PRJ-2026-024': 6000,
  'PRJ-2026-002': 2000,
  'PRJ-2025-019': 280000,
  'PRJ-2026-027': 0,
  'PRJ-2024-008': 62000,
};

/** 渠道相对权重 */
const CHANNEL_WEIGHT: Record<ChannelId, number> = {
  wechat: 1.35,
  douyin: 1.2,
  kuaishou: 0.55,
  alipay: 0.45,
  facebook: 0.5,
  telegram: 0.35,
  poki: 0.42,
  crazygames: 0.36,
  h5: 0.28,
  webview: 0.22,
};

const HOLIDAYS: Record<string, number> = {
  '2026-10-01': 1.5,
  '2026-10-02': 1.52,
  '2026-10-03': 1.55,
  '2026-10-04': 1.5,
  '2026-10-05': 1.46,
  '2026-10-06': 1.42,
  '2026-10-07': 1.38,
  '2026-09-25': 1.2,
  '2026-09-26': 1.18,
  '2026-06-10': 1.18,
};

const WEEKDAY_FACTOR = [1.28, 0.94, 0.97, 0.99, 1.02, 1.15, 1.32];

function isoDate(offsetFromStart: number): string {
  const start = new Date(2026, 6, 22);
  const d = new Date(start.getTime() + offsetFromStart * 86400000);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getDay();
}

/** 业务事件：返回该日该项目的额外系数 */
function eventFactor(projectId: string, date: string): number {
  if (projectId === 'PRJ-2026-006' && date >= '2026-08-14' && date <= '2026-08-17') {
    return date === '2026-08-14' ? 1.18 : 1.1;
  }
  if (projectId === 'PRJ-2025-041' && date >= '2026-09-02' && date <= '2026-09-14') {
    return 0.82;
  }
  if (projectId === 'PRJ-2025-019' && date >= '2026-10-01' && date <= '2026-10-08') {
    return 1.12;
  }
  return 1;
}

function trendOf(projectId: string, dayIndex: number): number {
  const seed = projectId.charCodeAt(projectId.length - 1) + projectId.charCodeAt(projectId.length - 3);
  const slope = ((seed % 11) - 5) / 100;
  return 1 + (slope * dayIndex) / 60;
}

const DAYS = 90;

export const dailyMetrics: DailyMetric[] = [];

projects.forEach((project) => {
  const base = DAU_BASE[project.id] ?? 0;
  if (base === 0) return;

  const platforms = project.platforms.length > 0 ? project.platforms : (['h5'] as ChannelId[]);
  const weightSum = platforms.reduce((s, ch) => s + CHANNEL_WEIGHT[ch], 0);

  for (let d = 0; d < DAYS; d += 1) {
    const date = isoDate(d);
    const wd = WEEKDAY_FACTOR[weekdayOf(date)] ?? 1;
    const holiday = HOLIDAYS[date] ?? 1;

    platforms.forEach((channel) => {
      const share = (CHANNEL_WEIGHT[channel] ?? 1) / weightSum;
      const noise = 1 + (rng.next() - 0.5) * 0.12;
      const baseDau = base * share * wd * holiday * noise * trendOf(project.id, d) * eventFactor(project.id, date);
      const dau = Math.max(0, Math.round(baseDau));

      const newUsers = Math.round(dau * rng.float(0.05, 0.11, 3));
      const revenue = Math.round(dau * rng.float(0.17, 0.27, 3));
      const payRate = Number(rng.float(0.028, 0.052, 4));
      const arppu = Number(((revenue * 30) / Math.max(1, dau * payRate)).toFixed(1));

      dailyMetrics.push({
        date,
        projectId: project.id,
        channel,
        dau,
        newUsers,
        revenue,
        retention1: Number(rng.float(0.38, 0.48, 4)),
        retention3: Number(rng.float(0.24, 0.33, 4)),
        retention7: Number(rng.float(0.14, 0.23, 4)),
        retention30: Number(rng.float(0.06, 0.12, 4)),
        payRate,
        arppu,
        avgDuration: Number(rng.float(18, 42, 1)),
      });
    });
  }
});

/** 按日聚合全站 */
export interface DayAgg {
  date: string;
  dau: number;
  revenue: number;
  newUsers: number;
}

export const dailyTotals: DayAgg[] = (() => {
  const map = new Map<string, DayAgg>();
  dailyMetrics.forEach((m) => {
    const cur = map.get(m.date) ?? { date: m.date, dau: 0, revenue: 0, newUsers: 0 };
    cur.dau += m.dau;
    cur.revenue += m.revenue;
    cur.newUsers += m.newUsers;
    map.set(m.date, cur);
  });
  return [...map.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
})();

export function lastNDays(n: number): DayAgg[] {
  return dailyTotals.slice(-n);
}

export function sumRange(days: number): { dau: number; revenue: number; newUsers: number } {
  const slice = dailyTotals.slice(-days);
  return slice.reduce(
    (acc, d) => ({ dau: acc.dau + d.dau, revenue: acc.revenue + d.revenue, newUsers: acc.newUsers + d.newUsers }),
    { dau: 0, revenue: 0, newUsers: 0 },
  );
}

export function todayMetrics() {
  const today = dailyTotals[dailyTotals.length - 1];
  const yesterday = dailyTotals[dailyTotals.length - 2];
  return {
    dau: today?.dau ?? 0,
    revenue: today?.revenue ?? 0,
    newUsers: today?.newUsers ?? 0,
    dauDelta: today && yesterday ? (today.dau - yesterday.dau) / Math.max(1, yesterday.dau) : 0,
    revenueDelta: today && yesterday ? (today.revenue - yesterday.revenue) / Math.max(1, yesterday.revenue) : 0,
  };
}

/** 按渠道聚合（近 N 天） */
export function byChannel(days: number): { channel: ChannelId; dau: number; revenue: number }[] {
  const map = new Map<ChannelId, { channel: ChannelId; dau: number; revenue: number }>();
  dailyMetrics.slice(-days * 10).forEach((m) => {
    const cur = map.get(m.channel) ?? { channel: m.channel, dau: 0, revenue: 0 };
    cur.dau += m.dau;
    cur.revenue += m.revenue;
    map.set(m.channel, cur);
  });
  return [...map.values()].sort((a, b) => b.dau - a.dau);
}

export function projectMetric(projectId: string, days: number): { dau: number; revenue: number } {
  const slice = dailyMetrics.filter((m) => m.projectId === projectId).slice(-days * 4);
  return slice.reduce((acc, m) => ({ dau: acc.dau + m.dau, revenue: acc.revenue + m.revenue }), { dau: 0, revenue: 0 });
}

/** 性能快照 */
export const performanceRows: PerformanceRow[] = (() => {
  const rows: PerformanceRow[] = [];
  const tiers: { tier: PerformanceRow['deviceTier']; samples: number; factor: number }[] = [
    { tier: 'high', samples: 12000, factor: 0.72 },
    { tier: 'mid', samples: 26000, factor: 1 },
    { tier: 'low', samples: 18000, factor: 1.65 },
  ];

  projects.forEach((project) => {
    if (project.status === 'bidding' || project.status === 'discovery') return;
    project.platforms.forEach((channel) => {
      tiers.forEach((t) => {
        const fp50 = Math.round(rng.float(900, 2100, 0) * t.factor);
        rows.push({
          date: '2026-10-19',
          projectId: project.id,
          channel,
          version: project.currentVersion,
          deviceTier: t.tier,
          samples: t.samples + rng.int(-3000, 3000),
          fp50,
          fp95: Math.round(fp50 * rng.float(1.9, 2.9, 2)),
          fps: Number(rng.float(48, 60, 1) / (t.tier === 'low' ? 1.18 : 1)),
          lowFpsRate: Number(rng.float(0.008, 0.06, 4) * (t.tier === 'low' ? 1.9 : 1)),
          memoryPeak: Math.round(rng.float(180, 520, 0) * (t.tier === 'low' ? 0.82 : 1)),
          crashRate: Number(rng.float(0.0008, 0.006, 5) * (t.tier === 'low' ? 1.6 : 1)),
          jankRate: Number(rng.float(0.008, 0.05, 4) * (t.tier === 'low' ? 1.7 : 1)),
        });
      });
    });
  });

  return rows;
})();

/** 30 天性能趋势（确定性） */
export function perfTrend(channel: ChannelId, metric: 'fp50' | 'fps' | 'crash'): { date: string; value: number }[] {
  const r = makeRng(channel.length * 7919 + metric.length * 131);
  const out: { date: string; value: number }[] = [];
  let base = metric === 'fp50' ? 1700 : metric === 'fps' ? 55 : 0.0032;
  for (let i = 29; i >= 0; i -= 1) {
    base = base * (1 + (r.next() - 0.48) * 0.03);
    const date = isoDate(60 + (29 - i));
    out.push({
      date,
      value:
        metric === 'fp50'
          ? Math.round(base)
          : metric === 'fps'
            ? Number(base.toFixed(1))
            : Number(base.toFixed(5)),
    });
  }
  return out;
}

/** 实时在线基准 */
export const realtimeBase = (() => {
  const total = dailyTotals[dailyTotals.length - 1]?.dau ?? 1280000;
  return Math.round(total * 0.011);
})();
