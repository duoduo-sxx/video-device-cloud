/**
 * 金额与税额的唯一计算入口。
 * 页面中禁止出现散落的 `* 0.06`，一律走这里，保证全站算得平。
 */

/** 四舍五入到分，规避浮点误差 */
export function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** 增值税率：信息技术服务 6% */
export const VAT_RATE = 0.06;

export function taxOf(netAmount: number, rate = VAT_RATE): number {
  return round2(netAmount * rate);
}

export function totalOf(netAmount: number, rate = VAT_RATE): number {
  return round2(netAmount + taxOf(netAmount, rate));
}

export interface BillCalcInput {
  subtotal: number;
  discount: number;
  taxRate?: number;
}

export interface BillCalcResult {
  netAmount: number;
  taxAmount: number;
  total: number;
}

export function calcBill({ subtotal, discount, taxRate = VAT_RATE }: BillCalcInput): BillCalcResult {
  const net = round2(subtotal - discount);
  const tax = taxOf(net, taxRate);
  return { netAmount: net, taxAmount: tax, total: round2(net + tax) };
}

export function sum<T>(rows: T[], pick: (r: T) => number): number {
  return round2(rows.reduce((a, r) => a + pick(r), 0));
}

/** 中文大写金额（发票用） */
export function rmbUpper(n: number): string {
  if (n === 0) return '零元整';
  const digits = '零壹贰叁肆伍陆柒捌玖';
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿', '万亿'];
  const intPart = Math.floor(Math.abs(n));
  const decPart = Math.round((Math.abs(n) - intPart) * 100);

  let result = '';
  let group = 0;
  let rest = intPart;
  const groups: string[] = [];

  while (rest > 0) {
    const chunk = rest % 10000;
    let chunkStr = '';
    let zero = false;
    let c = chunk;
    for (let i = 0; i < 4; i++) {
      const d = c % 10;
      if (d === 0) {
        zero = true;
      } else {
        chunkStr = digits[d] + units[i] + (zero ? '零' : '') + chunkStr;
        zero = false;
      }
      c = Math.floor(c / 10);
    }
    groups[group] = chunkStr ? chunkStr + bigUnits[group] : '';
    group++;
    rest = Math.floor(rest / 10000);
  }

  result = groups.reverse().join('');
  if (!result) result = '零';
  result += '元';

  if (decPart === 0) return result + '整';
  const jiao = Math.floor(decPart / 10);
  const fen = decPart % 10;
  if (jiao > 0) result += digits[jiao] + '角';
  else if (fen > 0) result += '零';
  if (fen > 0) result += digits[fen] + '分';
  return result;
}

/** 环比 */
export function mom(current: number, prev: number): number {
  if (prev === 0) return 0;
  return (current - prev) / prev;
}

/** 阶梯价求单价：按累计用量落档 */
export function tieredPrice(quantity: number, tiers: { from: number; to: number | null; price: number }[]): number {
  let price = tiers[0]?.price ?? 0;
  for (const t of tiers) {
    if (quantity >= t.from) price = t.price;
  }
  return price;
}
