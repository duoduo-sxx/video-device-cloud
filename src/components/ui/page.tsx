import type { ReactNode } from 'react';
import { ArrowLeft, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Input } from './core';

export function PageHeader({
  title,
  desc,
  actions,
  back,
  tag,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
  back?: boolean;
  tag?: ReactNode;
}) {
  const nav = useNavigate();
  return (
    <div className="mb-5 flex items-start justify-between gap-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {back && (
            <button
              onClick={() => nav(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--stroke)] text-[var(--text-2)] transition-colors hover:bg-white/5 hover:text-[var(--text-1)]"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          <h1 className="truncate text-[20px] font-semibold leading-7 tracking-[0.2px] text-[var(--text-1)]">{title}</h1>
          {tag}
        </div>
        {desc && <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-3)]">{desc}</p>}
      </div>
      {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  desc,
  extra,
  children,
  className,
  noPad,
  bodyClass,
}: {
  title?: string;
  desc?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
  noPad?: boolean;
  bodyClass?: string;
}) {
  return (
    <section className={cn('card', className)}>
      {(title || extra) && (
        <div className="flex items-center justify-between gap-4 border-b border-[var(--stroke)] px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="card-title truncate">{title}</h2>}
            {desc && <p className="mt-0.5 text-[11.5px] text-[var(--text-3)]">{desc}</p>}
          </div>
          {extra && <div className="flex flex-none items-center gap-2">{extra}</div>}
        </div>
      )}
      <div className={cn(noPad ? '' : 'p-5', bodyClass)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  up,
  icon,
  hint,
  spark,
  tone = 'brand',
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: string;
  up?: boolean;
  icon?: ReactNode;
  hint?: string;
  spark?: number[];
  tone?: 'brand' | 'cyan' | 'green' | 'amber' | 'violet';
}) {
  const colorMap = {
    brand: '#3D7DFF',
    cyan: '#22D3EE',
    green: '#2DD4A7',
    amber: '#F5B544',
    violet: '#8B5CF6',
  };
  const color = colorMap[tone];
  return (
    <div className="card card-pad relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full opacity-[0.14] blur-2xl"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between">
        <div className="text-[12px] text-[var(--text-3)]">{label}</div>
        {icon && (
          <span
            className="flex h-7 w-7 items-center justify-center rounded-[7px]"
            style={{ background: `${color}18`, color, boxShadow: `inset 0 0 0 1px ${color}30` }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="num text-[28px] font-semibold leading-none tracking-[-.02em] text-[var(--text-1)]">{value}</span>
        {unit && <span className="text-[12px] text-[var(--text-3)]">{unit}</span>}
      </div>
      <div className="mt-2.5 flex items-end justify-between">
        <div className="flex items-center gap-1.5">
          {delta && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[11.5px]',
                up ? 'text-[var(--danger)]' : 'text-[var(--ok)]',
              )}
            >
              {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {delta}
            </span>
          )}
          {hint && <span className="text-[11px] text-[var(--text-3)]">{hint}</span>}
        </div>
        {spark && <Sparkline data={spark} color={color} />}
      </div>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 62;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = '搜索',
  className,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onEnter?: () => void;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      placeholder={placeholder}
      className={className}
      prefix={<Search size={13} />}
    />
  );
}

export function FilterBar({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      {children}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}
