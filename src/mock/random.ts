/** 确定性伪随机，保证刷新后数据一致 */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRng(seed: number) {
  const r = mulberry32(seed)
  return {
    next: r,
    int(min: number, max: number) {
      return Math.floor(r() * (max - min + 1)) + min
    },
    float(min: number, max: number, digits = 2) {
      const v = r() * (max - min) + min
      return Math.round(v * 10 ** digits) / 10 ** digits
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(r() * arr.length)]
    },
    weighted<T>(items: readonly { item: T; weight: number }[]): T {
      const total = items.reduce((s, i) => s + i.weight, 0)
      let x = r() * total
      for (const i of items) {
        x -= i.weight
        if (x <= 0) return i.item
      }
      return items[items.length - 1].item
    },
    bool(p = 0.5) {
      return r() < p
    },
    shuffle<T>(arr: T[]): T[] {
      const copy = [...arr]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    },
    sample<T>(arr: T[], n: number): T[] {
      return this.shuffle(arr).slice(0, n)
    },
  }
}

export type Rng = ReturnType<typeof createRng>

export const SEED = 20261019
