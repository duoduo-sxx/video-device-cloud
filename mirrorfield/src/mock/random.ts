let seed = 20261019

export function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = mulberry32(seed)

export function resetSeed(s = 20261019) {
  seed = s
}

export const rand = () => rnd()
export const randInt = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min
export const randFloat = (min: number, max: number, digits = 2) =>
  Number((rnd() * (max - min) + min).toFixed(digits))
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]
export const pickMany = <T,>(arr: readonly T[], n: number): T[] => {
  const pool = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0])
  return out
}
export const chance = (p: number) => rnd() < p
export const pad = (n: number, len = 3) => String(n).padStart(len, '0')

const DAY = 86400000
export const DATE_START = new Date('2025-03-10T08:00:00+08:00').getTime()
export const DATE_END = new Date('2026-10-19T10:00:00+08:00').getTime()

/** 生成落在区间内、且符合工作日规律的时间（周末概率降低） */
export function randDate(from = DATE_START, to = DATE_END, workdayBias = true): string {
  for (let i = 0; i < 20; i++) {
    const t = from + rnd() * (to - from)
    const d = new Date(t)
    const wd = d.getDay()
    if (!workdayBias) return d.toISOString()
    if (wd === 0 || wd === 6) {
      if (rnd() < 0.25) return d.toISOString()
    } else return d.toISOString()
  }
  return new Date(to - rnd() * DAY * 10).toISOString()
}

export function recentDate(maxDaysAgo: number, minDaysAgo = 0): string {
  const t = DATE_END - randInt(minDaysAgo, maxDaysAgo) * DAY - randInt(0, 8) * 3600000
  return new Date(t).toISOString()
}

export const NAMES = [
  '张伟', '李强', '王芳', '陈晓峰', '刘洋', '赵敏', '周建国', '孙悦', '吴磊', '郑楠',
  '马晓东', '黄丽华', '徐斌', '何静', '罗宇', '高远', '林嘉怡', '谢涛', '韩雪', '曹磊',
  '邓超', '冯佳', '蒋涛', '沈梦',
] as const

export const SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡']
export const GIVEN = ['建国', '志强', '海涛', '晓明', '丽娟', '文博', '嘉豪', '思远', '雅琴', '振宇', '宇航', '若彤']
