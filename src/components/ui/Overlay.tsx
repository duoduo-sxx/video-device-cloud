import clsx from 'clsx';
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/* ---------------- 抽屉 ---------------- */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#101828]/40" onClick={onClose} />
      <div
        className="absolute right-0 top-0 flex h-full flex-col bg-white shadow-pop animate-fade-up"
        style={{ width }}
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div>
            <div className="text-base font-semibold text-ink-1">{title}</div>
            {subtitle && <div className="mt-1 text-xs text-ink-3">{subtitle}</div>}
          </div>
          <button className="rounded-md p-1 text-ink-3 hover:bg-[#F2F4F7]" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-[#FCFCFD] px-6 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- 弹窗 ---------------- */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[#101828]/40" onClick={onClose} />
      <div
        className="relative max-h-[90vh] w-full overflow-hidden rounded-card bg-white shadow-pop animate-fade-up"
        style={{ maxWidth: width }}
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div>
            <div className="text-base font-semibold text-ink-1">{title}</div>
            {subtitle && <div className="mt-1 text-xs text-ink-3">{subtitle}</div>}
          </div>
          <button className="rounded-md p-1 text-ink-3 hover:bg-[#F2F4F7]" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-[#FCFCFD] px-6 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- 标签页 ---------------- */
export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (k: string) => void;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-center gap-1 border-b border-line', className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={clsx(
            'relative -mb-px px-3 py-2.5 text-sm transition-colors',
            active === t.key
              ? 'border-b-2 border-primary font-medium text-primary'
              : 'border-b-2 border-transparent text-ink-2 hover:text-ink-1',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="num ml-1.5 rounded-full bg-[#F2F4F7] px-1.5 py-0.5 text-2xs text-ink-2">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------------- 进度条 ---------------- */
export function Progress({
  value,
  tone = 'primary',
  showLabel,
  height = 6,
}: {
  value: number;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  height?: number;
}) {
  const color = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }[tone];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 overflow-hidden rounded-full bg-[#F2F4F7]" style={{ height }}>
        <div
          className={clsx('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && <span className="num w-9 text-right text-xs text-ink-2">{Math.round(value)}%</span>}
    </div>
  );
}

/* ---------------- 空态 / 骨架 ---------------- */
export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: ReactNode;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F2F4F7] text-ink-3">
          {icon}
        </div>
      )}
      <div className="text-sm font-medium text-ink-1">{title}</div>
      {desc && <div className="mt-1 max-w-sm text-center text-xs text-ink-3">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-8 w-56" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28 rounded-card" />
        ))}
      </div>
      <SkeletonBlock className="h-72 rounded-card" />
    </div>
  );
}
