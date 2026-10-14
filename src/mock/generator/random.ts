/**
 * 确定性随机工具
 * 使用固定种子，保证每次生成的数据完全一致（可复现）
 */

export function createRng(seed: number | string) {
  let s = typeof seed === 'string' ? hashString(seed) : seed >>> 0
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export class Random {
  private rng: () => number

  constructor(seed: number | string = 20261013) {
    this.rng = createRng(seed)
  }

  /** [0,1) */
  next(): number {
    return this.rng()
  }

  /** 整数 [min, max] */
  int(min: number, max: number): number {
    return Math.floor(this.rng() * (max - min + 1)) + min
  }

  /** 浮点，保留 decimals 位 */
  float(min: number, max: number, decimals = 2): number {
    const v = this.rng() * (max - min) + min
    return Number(v.toFixed(decimals))
  }

  /** 概率为 p 时返回 true */
  chance(p: number): boolean {
    return this.rng() < p
  }

  /** 数组随机取一个 */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.rng() * arr.length)]
  }

  /** 加权取一个（weights 与 arr 等长） */
  pickWeighted<T>(arr: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = this.rng() * total
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i]
      if (r <= 0) return arr[i]
    }
    return arr[arr.length - 1]
  }

  /** 取 n 个不重复元素 */
  sample<T>(arr: readonly T[], n: number): T[] {
    const pool = [...arr]
    const out: T[] = []
    const count = Math.min(n, pool.length)
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(this.rng() * pool.length)
      out.push(pool.splice(idx, 1)[0])
    }
    return out
  }

  /** 权重采样后取 n 个（可重复用途：给记录分组） */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  /** 正态分布（Box-Muller），用于生成更自然的时间分布 */
  gaussian(mean: number, std: number): number {
    let u = 0
    let v = 0
    while (u === 0) u = this.rng()
    while (v === 0) v = this.rng()
    return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
}

let seqCache: Record<string, number> = {}
/** 生成递增序号，如 SN20260001 */
export function nextSeq(prefix: string, pad = 6): string {
  seqCache[prefix] = (seqCache[prefix] || 0) + 1
  return prefix + String(seqCache[prefix]).padStart(pad, '0')
}

export function resetSeq(): void {
  seqCache = {}
}
