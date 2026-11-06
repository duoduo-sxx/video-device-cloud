import dayjs from 'dayjs';

export function fmt(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}

export function fmtInt(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Math.round(value).toLocaleString('zh-CN');
}

export function fmtSigned(value: number, digits = 3): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
}

export function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h} h ${m} min`;
}

export function fmtDate(value: string, template = 'YYYY-MM-DD'): string {
  return dayjs(value).format(template);
}

export function fmtDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

export function fromNow(value: string): string {
  const diff = dayjs('2026-10-19 10:27:26').diff(dayjs(value), 'minute');
  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff} 分钟前`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)} 小时前`;
  if (diff < 60 * 24 * 30) return `${Math.floor(diff / 1440)} 天前`;
  return fmtDate(value);
}

export function daysBetween(a: string, b: string): number {
  return dayjs(b).startOf('day').diff(dayjs(a).startOf('day'), 'day');
}

export function calibRemainDays(validUntil: string): number {
  return dayjs(validUntil).startOf('day').diff(dayjs('2026-10-19').startOf('day'), 'day');
}

export function fileSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}
