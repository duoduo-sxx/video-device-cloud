import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { cn } from '../lib/utils'
import { Checkbox, EmptyState } from './ui'

export interface Column<T> {
  key: string
  header: string
  width?: number | string
  align?: 'left' | 'right' | 'center'
  sortValue?: (row: T) => string | number
  render: (row: T) => React.ReactNode
  className?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  pageSize = 20,
  selectable,
  selected = [],
  onSelectedChange,
  onRowClick,
  emptyTitle = '没有符合条件的数据',
  emptyDesc = '试试调整筛选条件，或清空后重新查看。',
  rowKeyClass,
}: {
  columns: Column<T>[]
  rows: T[]
  pageSize?: number
  selectable?: boolean
  selected?: string[]
  onSelectedChange?: (ids: string[]) => void
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDesc?: string
  rowKeyClass?: (row: T) => string
}) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!sortKey) return rows
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortValue) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av).localeCompare(String(bv), 'zh') : String(bv).localeCompare(String(av), 'zh')
    })
    return copy
  }, [rows, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, totalPages)
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize)
  const allChecked = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id))

  const toggleSort = (col: Column<T>) => {
    if (!col.sortValue) return
    if (sortKey === col.key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(col.key)
      setSortDir('desc')
    }
  }

  if (!rows.length) return <EmptyState title={emptyTitle} desc={emptyDesc} />

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              {selectable && (
                <th className="w-10 px-3 py-2.5 text-left">
                  <Checkbox
                    checked={allChecked}
                    onChange={(v) => {
                      if (!onSelectedChange) return
                      const ids = pageRows.map((r) => r.id)
                      onSelectedChange(v ? Array.from(new Set([...selected, ...ids])) : selected.filter((id) => !ids.includes(id)))
                    }}
                    label=""
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'whitespace-nowrap px-3 py-2.5 text-[11px] font-normal tracking-[0.04em] text-dim',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.sortValue && 'cursor-pointer select-none hover:text-muted',
                  )}
                  onClick={() => toggleSort(col)}
                >
                  <span className={cn('inline-flex items-center gap-1', col.align === 'right' && 'flex-row-reverse')}>
                    {col.header}
                    {col.sortValue &&
                      (sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const isSelected = selected.includes(row.id)
              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'group border-b border-line-subtle transition-colors row-hover',
                    isSelected && 'row-active',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {selectable && (
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onChange={(v) => {
                          if (!onSelectedChange) return
                          onSelectedChange(v ? [...selected, row.id] : selected.filter((id) => id !== row.id))
                        }}
                        label=""
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 py-3 text-[13px] text-ink',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        col.className,
                        rowKeyClass?.(row),
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-line px-3 py-2.5">
        <div className="text-[12px] text-dim">
          共 <span className="mono text-muted">{sorted.length}</span> 条
          {selectable && selected.length > 0 && <span className="ml-3 text-muted">已选 {selected.length} 条</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(1, current - 1))}
            disabled={current === 1}
            className="flex h-7 w-7 items-center justify-center rounded border border-line text-muted disabled:opacity-40 hover:text-ink"
            aria-label="上一页"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="mono px-2 text-[12px] text-muted">
            {current} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, current + 1))}
            disabled={current === totalPages}
            className="flex h-7 w-7 items-center justify-center rounded border border-line text-muted disabled:opacity-40 hover:text-ink"
            aria-label="下一页"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
