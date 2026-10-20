import dayjs from 'dayjs';

export function formatNumber(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 100000000) return `${(v / 100000000).toFixed(2)} 亿`;
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)} 万`;
  return v.toLocaleString('zh-CN');
}

export function formatInt(v: number): string {
  if (!Number.isFinite(v)) return '—';
  return Math.round(v).toLocaleString('zh-CN');
}

export function formatMoney(v: number, withSymbol = true): string {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  let body: string;
  if (abs >= 100000000) body = `${(v / 100000000).toFixed(2)} 亿`;
  else if (abs >= 10000) body = `${(v / 10000).toFixed(1)} 万`;
  else body = v.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  return withSymbol ? `¥ ${body}` : body;
}

export function formatPercent(v: number, decimals = 1): string {
  if (!Number.isFinite(v)) return '—';
  return `${(v * 100).toFixed(decimals)}%`;
}

export function formatDate(v?: string | null, fmt = 'YYYY-MM-DD'): string {
  if (!v) return '—';
  return dayjs(v).format(fmt);
}

export function formatDateTime(v?: string | null): string {
  if (!v) return '—';
  return dayjs(v).format('MM-DD HH:mm');
}

export function formatFullDateTime(v?: string | null): string {
  if (!v) return '—';
  return dayjs(v).format('YYYY-MM-DD HH:mm:ss');
}

export function fromNow(v?: string | null): string {
  if (!v) return '—';
  const diff = dayjs('2026-10-19 10:32:00').diff(dayjs(v), 'minute');
  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff} 分钟前`;
  if (diff < 1440) return `${Math.floor(diff / 60)} 小时前`;
  if (diff < 10080) return `${Math.floor(diff / 1440)} 天前`;
  return dayjs(v).format('MM-DD');
}

export function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '—';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export function formatMinutes(min: number): string {
  const abs = Math.abs(Math.round(min));
  const d = Math.floor(abs / 1440);
  const h = Math.floor((abs % 1440) / 60);
  const m = abs % 60;
  if (d > 0) return `${d} 天 ${h} 小时`;
  if (h > 0) return `${h} 小时 ${m} 分`;
  return `${m} 分钟`;
}

export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function formatDelta(v: number, decimals = 1): string {
  const sign = v > 0 ? '+' : '';
  return `${sign}${(v * 100).toFixed(decimals)}%`;
}

export function daysUntil(date: string): number {
  return dayjs(date).diff(dayjs('2026-10-19'), 'day');
}

export function initials(name: string): string {
  if (!name) return '?';
  return name.slice(-2);
}
