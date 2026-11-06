import React from 'react'
import { cn } from '@/utils/misc'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { Button } from './primitives'

export interface Column<T> {
  key: string
  title: React.ReactNode
  width?: number | string
  align?: 'left' | 'right' | 'center'
  render?: (row: T, index: number) => React.ReactNode
  className?: string
}

export function Table<T extends { id?: string }>({
  columns,
  rows,
  loading,
  emptyText = '暂无数据',
  onRowClick,
  selectedIds,
  onSelect,
  rowKey,
  dense,
}: {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  emptyText?: string
  onRowClick?: (row: T) => void
  selectedIds?: string[]
  onSelect?: (ids: string[]) => void
  rowKey?: (row: T) => string
  dense?: boolean
}) {
  const keyOf = (r: T, i: number) => (rowKey ? rowKey(r) : (r.id ?? String(i)))
  const allSelected = !!selectedIds && rows.length > 0 && rows.every((r, i) => selectedIds.includes(keyOf(r, i)))

  const toggleAll = () => {
    if (!onSelect) return
    onSelect(allSelected ? [] : rows.map((r, i) => keyOf(r, i)))
  }
  const toggleOne = (k: string) => {
    if (!onSelect || !selectedIds) return
    onSelect(selectedIds.includes(k) ? selectedIds.filter((x) => x !== k) : [...selectedIds, k])
  }

  return (
    <div className="w-full overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-panel2">
            {onSelect && (
              <th className="w-10 h-10 px-3 border-b border-subtle">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 accent-[var(--brand)] cursor-pointer"
                  aria-label="全选"
                />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width }}
                className={cn(
                  'h-10 px-3 border-b border-subtle text-xs font-medium text-ink-soft whitespace-nowrap',
                  c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                  c.className,
                )}
              >
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={`sk-${i}`} className="border-b border-subtle">
                {onSelect && <td className="px-3 h-12"><div className="skeleton w-3.5 h-3.5" /></td>}
                {columns.map((c) => (
                  <td key={c.key} className="px-3 h-12">
                    <div className="skeleton h-3.5" style={{ width: `${45 + ((i * 13 + c.key.length * 7) % 45)}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          {!loading &&
            rows.map((row, i) => {
              const k = keyOf(row, i)
              const selected = selectedIds?.includes(k)
              return (
                <tr
                  key={k}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-subtle transition-colors',
                    onRowClick && 'cursor-pointer',
                    selected ? 'bg-brand/[0.07]' : 'hover:bg-brand/[0.04]',
                  )}
                >
                  {onSelect && (
                    <td className="px-3 h-12" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleOne(k)}
                        className="w-3.5 h-3.5 accent-[var(--brand)] cursor-pointer"
                        aria-label="选择行"
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'px-3 text-sm text-ink',
                        dense ? 'h-10' : 'h-12',
                        c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                      )}
                    >
                      {(row as Record<string, unknown>)[c.key] !== undefined && !c.render
                        ? String((row as Record<string, unknown>)[c.key])
                        : c.render?.(row, i)}
                    </td>
                  ))}
                </tr>
              )
            })}
        </tbody>
      </table>
      {!loading && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 gap-2">
          <Inbox size={32} className="text-ink-mute opacity-50" />
          <span className="text-sm text-ink-soft">{emptyText}</span>
        </div>
      )}
    </div>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  onSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (p: number) => void
  onSizeChange?: (s: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between px-3 h-11 border-t border-subtle text-xs text-ink-soft">
      <span className="num">
        共 {total} 条 · 第 {page}/{pages} 页
      </span>
      <div className="flex items-center gap-2">
        {onSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="h-7 rounded bg-panel2 border border-strong px-1.5 text-2xs text-ink cursor-pointer focus-ring"
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s} 条/页
              </option>
            ))}
          </select>
        )}
        <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)} icon={<ChevronLeft size={14} />}>
          上一页
        </Button>
        <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          下一页
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
