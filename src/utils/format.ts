import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export const fmtBytes = (bytes: number, digits = 1): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n >= 100 ? n.toFixed(0) : n.toFixed(digits)} ${units[i]}`;
};

export const fmtSpeed = (bps: number): string => {
  if (!bps) return '—';
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`;
  return `${(bps / 1e6).toFixed(1)} MB/s`;
};

export const fmtPct = (n: number, digits = 1): string => `${(n ?? 0).toFixed(digits)}%`;

export const fmtNum = (n: number): string => (n ?? 0).toLocaleString('en-US');

export const fmtMoney = (n: number): string => `¥ ${Math.round(n).toLocaleString('en-US')}`;

export const fmtTime = (t?: string): string => (t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '—');

export const fmtShortTime = (t?: string): string => (t ? dayjs(t).format('MM-DD HH:mm') : '—');

export const relTime = (t?: string): string => (t ? dayjs(t).fromNow() : '—');

export const fmtDuration = (sec: number): string => {
  if (!sec || sec < 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h} 小时 ${m} 分`;
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`;
};

export const fmtCountdown = (sec: number): string => {
  const s = Math.max(0, Math.floor(sec));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

export const exportCsv = (filename: string, rows: Record<string, unknown>[]): void => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
