import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export const dt = dayjs;

export function fmtTime(input?: string | number | null): string {
  if (!input) return '—';
  return dayjs(input).format('YYYY-MM-DD HH:mm:ss');
}

export function fmtDate(input?: string | number | null): string {
  if (!input) return '—';
  return dayjs(input).format('YYYY-MM-DD');
}

export function fmtShort(input?: string | number | null): string {
  if (!input) return '—';
  return dayjs(input).format('MM-DD HH:mm');
}

export function fromNow(input?: string | number | null): string {
  if (!input) return '—';
  const d = dayjs(input);
  const diff = dayjs().diff(d, 'second');
  if (diff < 10) return '刚刚';
  if (diff < 60) return `${diff} 秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
  return d.format('YYYY-MM-DD');
}

export function fmtSize(bytes?: number | null): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function fmtNum(n?: number | null): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('zh-CN');
}

export function fmtMoney(n?: number | null): string {
  if (n === null || n === undefined) return '—';
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function shortHash(hash?: string, head = 6, tail = 4): string {
  if (!hash) return '—';
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function maskPhone(phone?: string): string {
  if (!phone) return '—';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export function maskKey(key?: string): string {
  if (!key) return '—';
  return `${key.slice(0, 6)}${'•'.repeat(18)}${key.slice(-4)}`;
}

export function daysLeft(date?: string): number {
  if (!date) return 0;
  return dayjs(date).diff(dayjs(), 'day');
}
