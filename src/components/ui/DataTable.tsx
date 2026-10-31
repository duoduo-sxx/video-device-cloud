import clsx from 'clsx';
import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  title: ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  sorter?: (a: T, b: T) => number;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  pageSize?: number;
  selectable?: boolean;
  selected?: string[];
  onSelect?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDesc?: string;
  emptyAction?: ReactNode;
  dense?: boolean;
  footer?: ReactNode;
  loading?: boolean;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  pageSize = 10,
  selectable,
  selected = [],
  onSelect,
  onRowClick,
  emptyTitle = '暂无数据',
  emptyDesc,
  emptyAction,
  dense,
  footer,
  loading,
}: Props<T>) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sorter) return rows;
    const out = [...rows].sort(col.sorter);
    return sortDir === 'asc' ? out : out.reverse();
  }, [rows, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize);

  const allChecked = pageRows.length > 0 && pageRows.every((r) => selected.includes(rowKey(r)));

  function toggleAll() {
    if (!onSelect) return;
    const ids = pageRows.map(rowKey);
    onSelect(allChecked ? selected.filter((s) => !ids.includes(s)) : Array.from(new Set([...selected, ...ids])));
  }

  function toggleOne(id: string) {
    if (!onSelect) return;
    onSelect(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  function sort(k: string) {
    if (sortKey === k) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDir('asc');
    }
  }

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#F9FAFB]">
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={clsx(
                    'whitespace-nowrap px-3 py-2.5 text-xs font-medium text-ink-2',
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                    c.sortable && 'cursor-pointer select-none hover:text-ink-1',
                  )}
                  onClick={() => c.sortable && sort(c.key)}
                >
                  <span className={clsx('inline-flex items-center gap-1', c.align === 'right' && 'flex-row-reverse')}>
                    {c.title}
                    {c.sortable && (
                      <span className="inline-flex flex-col leading-none text-ink-3">
                        <ChevronUp
                          size={10}
                          className={sortKey === c.key && sortDir === 'asc' ? 'text-primary' : ''}
                        />
                        <ChevronDown
                          size={10}
                          className={sortKey === c.key && sortDir === 'desc' ? 'text-primary' : ''}
                        />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, idx) => {
              const id = rowKey(row);
              const isSel = selected.includes(id);
              return (
                <tr
                  key={id}
                  className={clsx(
                    'group transition-colors',
                    isSel ? 'bg-primary-soft' : 'hover:bg-[#FCFCFD]',
                    onRowClick && 'cursor-pointer',
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleOne(id)}
                        className="h-3.5 w-3.5 cursor-pointer accent-primary"
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={clsx(
                        'border-t border-line px-3 text-[13px] text-ink-1',
                        dense ? 'py-2' : 'py-3',
                        c.align === 'right' && 'text-right',
                        c.align === 'center' && 'text-center',
                        c.className,
                      )}
                    >
                      {c.render ? c.render(row, idx) : String((row as Record<string, unknown>)[c.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {pageRows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F2F4F7]">
              <Inbox size={22} className="text-ink-3" />
            </div>
            <div className="text-sm font-medium text-ink-1">{emptyTitle}</div>
            {emptyDesc && <div className="mt-1 max-w-sm text-center text-xs text-ink-3">{emptyDesc}</div>}
            {emptyAction && <div className="mt-4">{emptyAction}</div>}
          </div>
        )}
      </div>

      {(sorted.length > pageSize || footer) && (
        <div className="flex items-center justify-between border-t border-line px-3 py-3">
          <div className="text-xs text-ink-3">
            共 <span className="num text-ink-2">{sorted.length}</span> 条
            {selected.length > 0 && (
              <span className="ml-2 text-primary">已选 {selected.length} 条</span>
            )}
            {footer}
          </div>
          {sorted.length > pageSize && (
            <div className="flex items-center gap-1">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-2 hover:bg-[#F2F4F7] disabled:opacity-30"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={clsx(
                      'num h-7 min-w-7 rounded-md px-2 text-xs',
                      p === current ? 'bg-primary text-white' : 'text-ink-2 hover:bg-[#F2F4F7]',
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 7 && <span className="px-1 text-xs text-ink-3">…</span>}
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-2 hover:bg-[#F2F4F7] disabled:opacity-30"
                disabled={current === totalPages}
                onClick={() => setPage(current + 1)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
