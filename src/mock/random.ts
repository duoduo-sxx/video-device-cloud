export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRng(seed = 20261019) {
  const rnd = mulberry32(seed)
  return {
    next: rnd,
    int(min: number, max: number) {
      return Math.floor(rnd() * (max - min + 1)) + min
    },
    float(min: number, max: number, digits = 1) {
      const v = rnd() * (max - min) + min
      const p = Math.pow(10, digits)
      return Math.round(v * p) / p
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(rnd() * arr.length)]
    },
    picks<T>(arr: readonly T[], count: number): T[] {
      const pool = [...arr]
      const out: T[] = []
      for (let i = 0; i < count && pool.length; i++) {
        out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0])
      }
      return out
    },
    chance(p: number) {
      return rnd() < p
    }
  }
}

export type Rng = ReturnType<typeof createRng>
