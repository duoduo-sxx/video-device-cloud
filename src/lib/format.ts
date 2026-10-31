/** 金额、数字、日期统一格式化 */

export const moneyFmt = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1234567.8 -> "1,234,567.80" */
export function num(v: number): string {
  return moneyFmt.format(v);
}

/** 1234567.8 -> "¥1,234,567.80" */
export function money(v: number): string {
  return `¥${moneyFmt.format(v)}`;
}

/** 大额压缩：1,234,567 -> "123.5万" */
export function wan(v: number): string {
  if (Math.abs(v) >= 100000000) return `${(v / 100000000).toFixed(2)}亿`;
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}万`;
  return num(v);
}

/** 数量压缩（用量列用） */
export function qty(v: number): string {
  if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(2)}M`;
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(2)}万`;
  return num(v);
}

export function pct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export function dateTime(iso: string): string {
  return iso.replace('T', ' ').slice(0, 19);
}

export function timeOnly(iso: string): string {
  return iso.replace('T', ' ').slice(11, 19);
}

/** 毫秒 -> "2.4s" / "3m 12s" */
export function duration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

export function relative(iso: string, base = '2026-10-31T23:42:00'): string {
  const diff = new Date(base).getTime() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return dateOnly(iso);
}

export function maskKey(k: string): string {
  return `sk-${'*'.repeat(8)}${k.slice(-4)}`;
}
