export const DIFFICULTY_OPTIONS = [
  { value: 1, label: '标准素材', desc: '常规拍摄，技术指标正常' },
  { value: 1.3, label: '老旧素材', desc: '年代较久，存在底噪/闪烁' },
  { value: 1.6, label: '严重损坏', desc: '磁带霉变、胶片划痕、大面积失真' },
] as const

export const URGENCY_OPTIONS = [
  { value: 1, label: '标准时效', desc: '按服务包 SLA 交付' },
  { value: 1.5, label: '12h 加急', desc: '加收 50%' },
  { value: 2, label: '6h 特急', desc: '加收 100%' },
] as const

export const EXTRAS = [
  { key: 'subtitle', label: '字幕重制', price: 120, unit: '条' },
  { key: 'multiversion', label: '多版本输出', price: 300, unit: '版' },
  { key: 'rawreturn', label: '原始素材返还', price: 200, unit: '项' },
  { key: 'onsite', label: '驻场技术支持', price: 2000, unit: '人日' },
] as const

export interface QuoteLine {
  label: string
  qty: number
  unit: string
  price: number
}

export interface QuoteResult {
  lines: QuoteLine[]
  subtotal: number
  tax: number
  total: number
  minApplied: boolean
}

export function buildQuote(input: {
  minutes: number
  unitPrice: number
  difficulty: number
  urgency: number
  extras: string[]
  extraQty?: Record<string, number>
}): QuoteResult {
  const minutes = Math.max(0, input.minutes)
  const lines: QuoteLine[] = []
  const base = minutes * input.unitPrice * input.difficulty * input.urgency
  if (base > 0) {
    lines.push({
      label: `基础服务（${input.difficulty !== 1 ? '难度系数 ' + input.difficulty : '标准'} · ${
        input.urgency !== 1 ? '时效系数 ' + input.urgency : '标准时效'
      }）`,
      qty: Math.round(minutes * 10) / 10,
      unit: '分钟',
      price: Math.round(base),
    })
  }
  for (const key of input.extras) {
    const extra = EXTRAS.find((e) => e.key === key)
    if (!extra) continue
    const qty = input.extraQty?.[key] ?? 1
    lines.push({ label: extra.label, qty, unit: extra.unit, price: extra.price * qty })
  }
  let subtotal = lines.reduce((s, l) => s + l.price, 0)
  let minApplied = false
  if (subtotal > 0 && subtotal < 800) {
    lines.push({ label: '最低起价补差', qty: 1, unit: '项', price: 800 - subtotal })
    subtotal = 800
    minApplied = true
  }
  const tax = Math.round(subtotal * 0.06)
  return { lines, subtotal, tax, total: subtotal + tax, minApplied }
}

export function formatCny(n: number): string {
  return `¥${n.toLocaleString('zh-CN')}`
}

/** 超时赔付：合同额 3%/天，上限 20% */
export function overduePenalty(amount: number, overdueDays: number): number {
  if (overdueDays <= 0) return 0
  return Math.min(Math.round(amount * 0.03 * overdueDays), Math.round(amount * 0.2))
}
