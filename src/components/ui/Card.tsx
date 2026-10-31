import clsx from 'clsx';
import type { ReactNode } from 'react';

/* ---------------- 页面标题 ---------------- */
export function PageHeader({
  title,
  desc,
  actions,
  breadcrumb,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
  breadcrumb?: string;
}) {
  return (
    <div className="mb-5">
      {breadcrumb && <div className="mb-2 text-xs text-ink-3">{breadcrumb}</div>}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-tight text-ink-1">{title}</h1>
          {desc && <p className="mt-1.5 text-sm text-ink-2">{desc}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ---------------- 卡片 ---------------- */
export function Card({
  children,
  className,
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div className={clsx('rounded-card border border-line bg-white shadow-card', pad && 'p-5', className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  desc,
  extra,
  className,
}: {
  title: string;
  desc?: string;
  extra?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-start justify-between gap-3', className)}>
      <div>
        <div className="text-sm font-semibold text-ink-1">{title}</div>
        {desc && <div className="mt-1 text-xs text-ink-3">{desc}</div>}
      </div>
      {extra}
    </div>
  );
}

/* ---------------- 指标卡 ---------------- */
export function StatCard({
  label,
  value,
  unit,
  delta,
  hint,
  spark,
  tone = 'default',
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  hint?: string;
  spark?: number[];
  tone?: 'default' | 'primary' | 'success' | 'warning';
}) {
  const toneColor = {
    default: 'text-ink-1',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
  }[tone];

  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-2">{label}</span>
        {delta !== undefined && delta !== 0 && (
          <span
            className={clsx(
              'num rounded-full px-1.5 py-0.5 text-2xs font-medium',
              delta > 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
            )}
          >
            {delta > 0 ? '↑' : '↓'} {Math.abs(delta * 100).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={clsx('num text-3xl font-semibold tracking-tight', toneColor)}>{value}</span>
        {unit && <span className="text-xs text-ink-3">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-3">{hint}</div>}
      {spark && <Sparkline data={spark} />}
    </div>
  );
}

export function Sparkline({ data, color = '#1D4ED8' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 28;
  const w = 120;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-7 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- 分隔与键值 ---------------- */
export function KV({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-ink-3">{label}</div>
      <div className="mt-1 text-sm text-ink-1">{children}</div>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={clsx('h-px w-full bg-line', className)} />;
}
