/**
 * Mock 通用工具：统一响应结构、分页、筛选、排序、延时与错误注入
 */
import type { PageResult } from '@/types'

export interface MockSettings {
  delay: boolean
  errorInject: boolean
  onlineRate: number
}

const SETTINGS_KEY = 'mock_settings_v1'

export const defaultSettings: MockSettings = { delay: true, errorInject: false, onlineRate: 0.87 }

export function getSettings(): MockSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...defaultSettings }
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(s: Partial<MockSettings>): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getSettings(), ...s }))
}

export function uuid(): string {
  const hex = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < 32; i++) {
    out += hex[Math.floor(Math.random() * 16)]
    if (i === 7 || i === 11 || i === 15 || i === 19) out += '-'
  }
  return out
}

/** 统一响应结构 */
export function ok<T>(data: T, message = 'ok') {
  return { code: 0, message, data, traceId: uuid(), timestamp: Date.now() }
}

export function fail(code: number, message: string) {
  return { code, message, data: null as any, traceId: uuid(), timestamp: Date.now() }
}

export interface MockError extends Error {
  code?: number
}

export function throwBiz(code: number, message: string): never {
  const e = new Error(message) as MockError
  e.code = code
  throw e
}

export function paginate<T>(list: T[], page = 1, pageSize = 20): PageResult<T> {
  const p = Math.max(1, Number(page) || 1)
  const ps = Math.max(1, Number(pageSize) || 20)
  return { list: list.slice((p - 1) * ps, p * ps), total: list.length, page: p, pageSize: ps }
}

const RESERVED = ['page', 'pageSize', 'sortBy', 'sortOrder', 'keyword', 'startTime', 'endTime', 'timeField', '_t']

function normalize(v: any): string {
  return v === null || v === undefined ? '' : String(v)
}

function matchValue(record: any, field: string, expected: any): boolean {
  const actual = normalize(record[field])
  const list = Array.isArray(expected) ? expected : String(expected).split(',')
  return list.some((e) => normalize(e) === actual)
}

export interface QueryOptions {
  /** 关键字模糊搜索的字段 */
  searchKeys?: string[]
  /** 时间范围过滤字段，配合 startTime / endTime 使用 */
  timeField?: string
  /** 需要模糊匹配的字段名（对应 query 参数同名） */
  likeFields?: string[]
  /** 默认排序 */
  defaultSort?: { by: string; order: 'asc' | 'desc' }
  /** 数值区间参数写法：minXxx / maxXxx */
  numericFields?: string[]
}

/**
 * 通用列表查询：关键字模糊 + 多字段精确/多选 + 时间范围 + 数值区间 + 排序 + 分页
 */
export function queryList<T extends Record<string, any>>(source: T[], q: Record<string, any> = {}, opts: QueryOptions = {}): PageResult<T> {
  let list = [...source]

  // 关键字
  const keyword = normalize(q.keyword).trim()
  if (keyword && opts.searchKeys?.length) {
    const kw = keyword.toLowerCase()
    list = list.filter((r) => opts.searchKeys!.some((k) => normalize(r[k]).toLowerCase().includes(kw)))
  }

  // 模糊字段
  opts.likeFields?.forEach((f) => {
    const v = normalize(q[f]).trim()
    if (v) {
      const lv = v.toLowerCase()
      list = list.filter((r) => normalize(r[f]).toLowerCase().includes(lv))
    }
  })

  // 精确 / 多选筛选
  Object.keys(q).forEach((key) => {
    if (RESERVED.includes(key) || !key) return
    if (opts.likeFields?.includes(key)) return
    const raw = q[key]
    if (raw === undefined || raw === null || raw === '' || raw === 'all' || raw === '*') return
    if (key.startsWith('min') || key.startsWith('max')) return
    const field = key
    const anyRecord = list[0]
    if (!anyRecord || !(field in anyRecord)) return
    list = list.filter((r) => matchValue(r, field, raw))
  })

  // 时间范围
  if (opts.timeField && (q.startTime || q.endTime)) {
    const s = q.startTime ? new Date(String(q.startTime)).getTime() : -Infinity
    const e = q.endTime ? new Date(String(q.endTime)).getTime() : Infinity
    list = list.filter((r) => {
      const t = new Date(normalize(r[opts.timeField!])).getTime()
      return !Number.isNaN(t) && t >= s && t <= e
    })
  }

  // 数值区间
  opts.numericFields?.forEach((f) => {
    const min = Number(q['min' + f[0].toUpperCase() + f.slice(1)])
    const max = Number(q['max' + f[0].toUpperCase() + f.slice(1)])
    if (!Number.isNaN(min)) list = list.filter((r) => Number(r[f]) >= min)
    if (!Number.isNaN(max)) list = list.filter((r) => Number(r[f]) <= max)
  })

  // 排序
  const sortBy = q.sortBy || opts.defaultSort?.by
  const sortOrder = (q.sortOrder as 'asc' | 'desc') || opts.defaultSort?.order || 'desc'
  if (sortBy) {
    list.sort((a, b) => {
      const av = a[sortBy]
      const bv = b[sortBy]
      let r = 0
      if (typeof av === 'number' && typeof bv === 'number') r = av - bv
      else r = normalize(av).localeCompare(normalize(bv), 'zh-CN')
      return sortOrder === 'asc' ? r : -r
    })
  }

  return paginate(list, q.page, q.pageSize)
}

/** 模拟网络延时 */
export function delay(ms?: number): Promise<void> {
  const s = getSettings()
  if (!s.delay) return Promise.resolve()
  const t = ms ?? (200 + Math.round(Math.random() * 400))
  return new Promise((res) => setTimeout(res, t))
}

/** 列表类接口的较长延时，让骨架屏可见 */
export function listDelay(): Promise<void> {
  const s = getSettings()
  if (!s.delay) return Promise.resolve()
  return new Promise((res) => setTimeout(res, 600 + Math.round(Math.random() * 600)))
}

/** 求和助手 */
export function sum<T>(list: T[], fn: (item: T) => number): number {
  return list.reduce((a, b) => a + fn(b), 0)
}

export function groupCount<T>(list: T[], fn: (item: T) => string): { key: string; count: number }[] {
  const map = new Map<string, number>()
  list.forEach((i) => {
    const k = fn(i)
    map.set(k, (map.get(k) || 0) + 1)
  })
  return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count)
}

/** 生成近 n 天的日期序列 YYYY-MM-DD */
export function lastDays(n: number, format = 'MM-DD'): string[] {
  const out: string[] = []
  const base = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 86400000)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    out.push(format === 'MM-DD' ? `${m}-${day}` : `${y}-${m}-${day}`)
  }
  return out
}

export function dayKey(time: string): string {
  return String(time).slice(5, 10)
}
