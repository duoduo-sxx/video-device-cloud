import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Empty } from './overlay';

/* -------------------------------- DataTable -------------------------------- */

export interface Column<T> {
  key: string;
  title: ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T, index: number) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  rowKey,
  onRowClick,
  empty,
  skeletonRows = 8,
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  skeletonRows?: number;
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[var(--stroke)]">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width, textAlign: c.align ?? 'left' }}
                  className={c.className}
                >
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key}>
                        <div className="skel h-3" style={{ width: `${40 + ((i * 13 + c.key.length * 7) % 50)}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, i) => (
                  <tr
                    key={rowKey(row, i)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={onRowClick ? 'cursor-pointer' : undefined}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        style={{ textAlign: c.align ?? 'left' }}
                        className={c.className}
                      >
                        {c.render ? c.render(row, i) : ((row as Record<string, unknown>)[c.key] as ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && (empty ?? <Empty title="暂无数据" desc="调整筛选条件后重试" compact />)}
      {footer}
    </div>
  );
}

/* -------------------------------- Pagination ------------------------------- */

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (p: number) => void;
  onPageSize?: (s: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const nums: (number | '...')[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '...') nums.push('...');
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 text-[12px] text-[var(--text-3)]">
      <div className="flex items-center gap-3">
        <span>
          共 <span className="text-[var(--text-1)]">{total.toLocaleString()}</span> 条
        </span>
        {onPageSize && (
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-[26px] rounded-md border border-[var(--stroke)] bg-[var(--bg-card-2)] px-1.5 text-[11.5px] text-[var(--text-2)] outline-none"
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s} 条/页
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-[var(--stroke)] transition-colors hover:bg-white/5 disabled:opacity-30"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={13} />
        </button>
        {nums.map((n, i) =>
          n === '...' ? (
            <span key={`e${i}`} className="px-1">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={cn(
                'h-[26px] min-w-[26px] rounded-md border px-1.5 transition-colors',
                n === page
                  ? 'border-[rgba(61,125,255,.5)] bg-[rgba(61,125,255,.16)] text-[var(--text-1)]'
                  : 'border-[var(--stroke)] hover:bg-white/5',
              )}
            >
              {n}
            </button>
          ),
        )}
        <button
          className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-[var(--stroke)] transition-colors hover:bg-white/5 disabled:opacity-30"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- Tabs ----------------------------------- */

export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (k: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-6 border-b border-[var(--stroke)]', className)}>
      {items.map((it) => {
        const on = it.key === active;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={cn(
              'relative -mb-px flex items-center gap-1.5 pb-2.5 pt-1 text-[13px] transition-colors',
              on ? 'text-[var(--text-1)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span
                className={cn(
                  'rounded-[4px] px-1.5 py-0.5 text-[10.5px]',
                  on ? 'bg-[rgba(61,125,255,.18)] text-[#9CC2FF]' : 'bg-white/5 text-[var(--text-3)]',
                )}
              >
                {it.count}
              </span>
            )}
            {on && (
              <span className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-[#3D7DFF] to-[#22D3EE]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string }[];
  value: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] p-0.5">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={cn(
            'rounded-[6px] px-2.5 py-1 text-[11.5px] transition-all',
            value === it.key
              ? 'bg-[rgba(61,125,255,.18)] text-[var(--text-1)] shadow-[inset_0_0_0_1px_rgba(61,125,255,.32)]'
              : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- Steps ---------------------------------- */

export function Steps({ items, current }: { items: string[]; current: number }) {
  return (
    <div className="flex items-center">
      {items.map((label, i) => {
        const done = i < current;
        const on = i === current;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex h-6 w-6 flex-none items-center justify-center rounded-full border text-[11px] font-medium transition-all',
                  done && 'border-transparent bg-[var(--brand-2)] text-[#04121a]',
                  on && 'border-[var(--brand)] bg-[rgba(61,125,255,.16)] text-[#9CC2FF] shadow-[0_0_0_3px_rgba(61,125,255,.14)]',
                  !done && !on && 'border-[var(--stroke-strong)] text-[var(--text-3)]',
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className={cn('whitespace-nowrap text-[12.5px]', on || done ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]')}>
                {label}
              </span>
            </div>
            {i < items.length - 1 && (
              <div className="mx-4 h-px flex-1 bg-gradient-to-r from-[rgba(61,125,255,.5)] to-[var(--stroke)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------- Timeline --------------------------------- */

export function Timeline({
  items,
  compact,
}: {
  items: { title: string; time?: string; desc?: string; done?: boolean; extra?: ReactNode }[];
  compact?: boolean;
}) {
  return (
    <div className="relative">
      {items.map((it, i) => (
        <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && (
            <span className="absolute left-[5px] top-[14px] h-[calc(100%-10px)] w-px bg-[var(--stroke)]" />
          )}
          <span
            className={cn(
              'mt-[5px] h-[11px] w-[11px] flex-none rounded-full border-2',
              it.done === false
                ? 'border-[var(--stroke-strong)] bg-[var(--bg-card)]'
                : 'border-[var(--brand-2)] bg-[rgba(34,211,238,.25)] shadow-[0_0_8px_rgba(34,211,238,.5)]',
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className={cn('text-[12.5px]', it.done === false ? 'text-[var(--text-3)]' : 'text-[var(--text-1)]')}>
                {it.title}
              </span>
              {it.time && <span className="flex-none font-mono text-[11px] text-[var(--text-3)]">{it.time}</span>}
            </div>
            {!compact && it.desc && <div className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--text-3)]">{it.desc}</div>}
            {it.extra && <div className="mt-1">{it.extra}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- Descriptions ------------------------------ */

export function Descriptions({
  items,
  cols = 2,
}: {
  items: { label: string; value: ReactNode; span?: number }[];
  cols?: number;
}) {
  return (
    <div className="grid gap-x-8 gap-y-0" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {items.map((it, i) => (
        <div
          key={i}
          className="flex items-baseline gap-3 border-b border-dashed border-white/[0.055] py-2.5 last:border-b-0"
          style={{ gridColumn: it.span ? `span ${it.span}` : undefined }}
        >
          <span className="w-[92px] flex-none text-[12px] text-[var(--text-3)]">{it.label}</span>
          <span className="min-w-0 flex-1 text-[12.5px] text-[var(--text-1)]">{it.value}</span>
        </div>
      ))}
    </div>
  );
}
