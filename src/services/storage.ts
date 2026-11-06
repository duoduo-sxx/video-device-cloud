import { seedData, type SeedData } from '@/mock/seed'

const DB_KEY = 'vidclear.db.v3'

let memoryFallback: SeedData | null = null

function available(): boolean {
  try {
    const k = '__vc_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

const canPersist = available()

export function cloneSeed(): SeedData {
  return JSON.parse(JSON.stringify(seedData)) as SeedData
}

export function loadDb(): SeedData {
  if (!canPersist) {
    if (!memoryFallback) memoryFallback = cloneSeed()
    return memoryFallback
  }
  try {
    const raw = window.localStorage.getItem(DB_KEY)
    if (!raw) {
      const fresh = cloneSeed()
      window.localStorage.setItem(DB_KEY, JSON.stringify(fresh))
      return fresh
    }
    const parsed = JSON.parse(raw) as SeedData
    if (!parsed || parsed.schemaVersion !== seedData.schemaVersion || !Array.isArray(parsed.assets)) {
      const fresh = cloneSeed()
      window.localStorage.setItem(DB_KEY, JSON.stringify(fresh))
      return fresh
    }
    return parsed
  } catch {
    const fresh = cloneSeed()
    return fresh
  }
}

export function saveDb(db: SeedData): void {
  if (!canPersist) {
    memoryFallback = db
    return
  }
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    window.localStorage.removeItem(DB_KEY)
  }
}

export function resetDb(): SeedData {
  const fresh = cloneSeed()
  saveDb(fresh)
  return fresh
}

export function delay<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms)
  })
}
