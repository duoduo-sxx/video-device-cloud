/**
 * Mock 内存数据库
 * - 基础数据来自 generator（确定性生成，不落盘）
 * - 用户的新增/修改/删除以"增量补丁"形式写入 localStorage，避免持久化数万条基础数据
 * - 刷新页面后数据保持，重置演示数据后回到初始状态
 */
import { getCollection } from './generator'

const PATCH_KEY = 'mock_db_patches_v1'

interface Patches {
  created: Record<string, any[]>
  updated: Record<string, Record<string, any>>
  deleted: Record<string, string[]>
}

const emptyPatches = (): Patches => ({ created: {}, updated: {}, deleted: {} })

let patches: Patches = load()
const materialized = new Map<string, any[]>()
let saveTimer: number | null = null

function load(): Patches {
  try {
    const raw = localStorage.getItem(PATCH_KEY)
    if (!raw) return emptyPatches()
    const p = JSON.parse(raw)
    return {
      created: p.created || {},
      updated: p.updated || {},
      deleted: p.deleted || {}
    }
  } catch {
    return emptyPatches()
  }
}

function persist(): void {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(PATCH_KEY, JSON.stringify(patches))
    } catch (e) {
      console.warn('[mock-db] 持久化失败，可能超出本地存储配额', e)
    }
  }, 300)
}

/** 物化某个集合：基础数据 + 补丁 */
export function table<T = any>(name: string): T[] {
  if (materialized.has(name)) return materialized.get(name) as T[]

  const base = getCollection(name) as any[]
  const deletedIds = new Set(patches.deleted[name] || [])
  const updatedMap = patches.updated[name] || {}

  let list = base.filter((r) => !deletedIds.has(r.id))
  if (Object.keys(updatedMap).length) {
    list = list.map((r) => (updatedMap[r.id] ? { ...r, ...updatedMap[r.id] } : r))
  }
  const created = patches.created[name] || []
  list = [...created, ...list]

  materialized.set(name, list)
  return list as T[]
}

function invalidate(name: string): void {
  materialized.delete(name)
}

export function nextId(name: string, prefix: string, pad = 4): string {
  const list = table(name)
  let max = 0
  list.forEach((r: any) => {
    const m = String(r.id || '').match(/(\d+)$/)
    if (m) max = Math.max(max, Number(m[1]))
  })
  // 同时考虑基础数据中的最大序号，避免与生成数据 ID 冲突
  getCollection(name).forEach((r: any) => {
    const m = String(r.id || '').match(/(\d+)$/)
    if (m) max = Math.max(max, Number(m[1]))
  })
  return prefix + String(max + 1).padStart(pad, '0')
}

export function insert<T extends { id: string }>(name: string, record: T): T {
  const arr = patches.created[name] || []
  arr.unshift(record)
  patches.created[name] = arr
  invalidate(name)
  persist()
  return record
}

export function insertMany<T extends { id: string }>(name: string, records: T[]): T[] {
  const arr = patches.created[name] || []
  patches.created[name] = [...records, ...arr]
  invalidate(name)
  persist()
  return records
}

/**
 * 局部更新一条记录（patch 允许携带任意业务字段）
 * 返回合并后的记录；记录不存在时返回 null
 */
export function update(name: string, id: string, partial: Record<string, any>): any {
  const list = table(name)
  const record = list.find((r) => r.id === id)
  if (!record) return null
  const merged = { ...record, ...partial }
  patches.updated[name] = patches.updated[name] || {}
  patches.updated[name][id] = { ...(patches.updated[name][id] || {}), ...partial }
  // 同步已创建记录，避免重复叠加
  const createdIdx = (patches.created[name] || []).findIndex((r) => r.id === id)
  if (createdIdx >= 0) patches.created[name][createdIdx] = merged
  invalidate(name)
  persist()
  return merged
}

export function remove(name: string, id: string): boolean {
  const list = table(name)
  if (!list.some((r) => r.id === id)) return false
  const createdIdx = (patches.created[name] || []).findIndex((r) => r.id === id)
  if (createdIdx >= 0) {
    patches.created[name].splice(createdIdx, 1)
  } else {
    patches.deleted[name] = patches.deleted[name] || []
    if (!patches.deleted[name].includes(id)) patches.deleted[name].push(id)
  }
  if (patches.updated[name]) delete patches.updated[name][id]
  invalidate(name)
  persist()
  return true
}

export function removeMany(name: string, ids: string[]): number {
  let n = 0
  ids.forEach((id) => {
    if (remove(name, id)) n++
  })
  return n
}

export function find<T = any>(name: string, id: string): T | undefined {
  return table(name).find((r) => r.id === id)
}

/** 重置全部演示数据 */
export function resetAll(): void {
  patches = emptyPatches()
  materialized.clear()
  localStorage.removeItem(PATCH_KEY)
}

/** 当前补丁统计，用于"演示数据管理"页面展示 */
export function patchStats(): { created: number; updated: number; deleted: number } {
  const c = Object.values(patches.created).reduce((a, b) => a + b.length, 0)
  const u = Object.values(patches.updated).reduce((a, b) => a + Object.keys(b).length, 0)
  const d = Object.values(patches.deleted).reduce((a, b) => a + b.length, 0)
  return { created: c, updated: u, deleted: d }
}
