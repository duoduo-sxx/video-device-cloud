/** 固定种子伪随机：保证每次刷新数据完全一致 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next: () => number;
  int: (min: number, max: number) => number;
  float: (min: number, max: number, decimals?: number) => number;
  pick: <T>(arr: readonly T[]) => T;
  picks: <T>(arr: readonly T[], n: number) => T[];
  chance: (p: number) => boolean;
  weighted: <T>(items: readonly { value: T; weight: number }[]) => T;
  gaussian: (mean: number, std: number) => number;
  shuffle: <T>(arr: T[]) => T[];
}

export function makeRng(seed: number): Rng {
  const rand = mulberry32(seed);

  const next = () => rand();

  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;

  const float = (min: number, max: number, decimals = 1) => {
    const v = next() * (max - min) + min;
    return Number(v.toFixed(decimals));
  };

  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)] as T;

  const picks = <T,>(arr: readonly T[], n: number): T[] => {
    const copy = [...arr];
    const out: T[] = [];
    const count = Math.min(n, copy.length);
    for (let i = 0; i < count; i += 1) {
      const idx = Math.floor(next() * copy.length);
      out.push(copy.splice(idx, 1)[0] as T);
    }
    return out;
  };

  const chance = (p: number) => next() < p;

  const weighted = <T,>(items: readonly { value: T; weight: number }[]): T => {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = next() * total;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item.value;
    }
    return items[items.length - 1]!.value;
  };

  const gaussian = (mean: number, std: number) => {
    const u = 1 - next();
    const v = next();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + z * std;
  };

  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
    }
    return copy;
  };

  return { next, int, float, pick, picks, chance, weighted, gaussian, shuffle };
}

/** 数据基准日：2026-10-19 */
export const NOW = new Date(2026, 9, 19, 10, 32, 0);
export const TODAY = '2026-10-19';

export function daysAgo(n: number, hour = 10, minute = 0): string {
  const d = new Date(NOW.getTime() - n * 86400000);
  d.setHours(hour, minute, 0, 0);
  return toLocalISO(d);
}

export function daysLater(n: number, hour = 18, minute = 0): string {
  const d = new Date(NOW.getTime() + n * 86400000);
  d.setHours(hour, minute, 0, 0);
  return toLocalISO(d);
}

export function toLocalISO(d: Date): string {
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}:${pad(d.getSeconds())}+08:00`;
}

export function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

/** 汉字姓名首字母色板，保证同一姓名颜色稳定 */
const AVATAR_COLORS = [
  '#4B5BF5',
  '#0BA5EC',
  '#17B26A',
  '#F79009',
  '#F04438',
  '#7A5AF8',
  '#E4780C',
  '#0E9384',
];

export function colorOf(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] as string;
}
