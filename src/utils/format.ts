import dayjs from 'dayjs';

export function formatBytes(bytes: number, digits = 2): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / Math.pow(1024, i);
  return `${v.toFixed(i === 0 ? 0 : digits)} ${units[i]}`;
}

export function formatSpeed(bps: number): string {
  if (!bps || bps <= 0) return '—';
  const mb = bps / 1024 / 1024;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB/s`;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB/s`;
}

export function formatDuration(sec?: number): string {
  if (!sec || sec <= 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatRelative(iso?: string): string {
  if (!iso) return '—';
  const target = dayjs(iso);
  const diffMin = dayjs().diff(target, 'minute');
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = dayjs().diff(target, 'hour');
  if (diffHour < 24) return `${diffHour} 小时前`;
  const diffDay = dayjs().diff(target, 'day');
  if (diffDay === 1) return '昨天';
  if (diffDay < 30) return `${diffDay} 天前`;
  return target.format('YYYY-MM-DD');
}

export function formatDateTime(iso?: string): string {
  return iso ? dayjs(iso).format('YYYY-MM-DD HH:mm:ss') : '—';
}

export function formatShortTime(iso?: string): string {
  return iso ? dayjs(iso).format('MM-DD HH:mm') : '—';
}

export function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN')}`;
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const content = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
    }
  } catch {
    /* ignore */
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return Promise.resolve(true);
  } catch {
    return Promise.resolve(false);
  }
}
