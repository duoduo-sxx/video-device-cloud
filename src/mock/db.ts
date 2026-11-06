import { createSeed, DB_VERSION } from './seed'
import type { Database } from '@/types'

const KEY = 'soc.db'

function load(): Database {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (parsed.version === DB_VERSION) return parsed
    }
  } catch {
    /* ignore broken cache */
  }
  const seed = createSeed()
  try {
    localStorage.setItem(KEY, JSON.stringify(seed))
  } catch {
    /* storage may be full */
  }
  return seed
}

export const db: Database = load()

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* ignore */
  }
}

export function resetDb() {
  localStorage.removeItem(KEY)
  location.reload()
}

export { DB_VERSION }
