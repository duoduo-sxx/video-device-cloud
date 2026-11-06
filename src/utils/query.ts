import type { PageResult } from '@/types'

export interface PageQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function paginate<T>(rows: T[], query: PageQuery = {}): PageResult<T> {
  const page = query.page && query.page > 0 ? query.page : 1
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10
  const total = rows.length
  const start = (page - 1) * pageSize
  return { list: rows.slice(start, start + pageSize), total }
}

export function sortRows<T extends Record<string, unknown>>(rows: T[], sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): T[] {
  if (!sortBy) return rows
  return [...rows].sort((a, b) => {
    const va = a[sortBy]
    const vb = b[sortBy]
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortOrder === 'asc' ? va - vb : vb - va
    }
    const sa = String(va ?? '')
    const sb = String(vb ?? '')
    return sortOrder === 'asc' ? sa.localeCompare(sb, 'zh-CN') : sb.localeCompare(sa, 'zh-CN')
  })
}

export function includesKeyword(text: string, keyword?: string): boolean {
  if (!keyword) return true
  return text.toLowerCase().includes(keyword.trim().toLowerCase())
}
