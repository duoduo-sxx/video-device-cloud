import type { UsageRecord } from '@/types';
import { round2 } from '@/lib/calc';
import { BILLS, BILL_ITEMS } from './bills';

/** 确定性伪随机 */
function rnd(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function daysInMonth(period: string): number {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/** 生成某账期某明细项的逐日用量，最后一天吸收尾差，保证 Σ === amount */
function splitDaily(
  billId: string,
  tenantId: string,
  period: string,
  item: (typeof BILL_ITEMS)[number],
  daily: boolean,
): UsageRecord[] {
  const total = daysInMonth(period);
  const isCurrent = period === '2026-10';
  const used = isCurrent ? 30 : total;
  const days = daily ? used : 1;

  if (days === 1) {
    return [
      {
        id: `U-${billId}-${item.seq}`,
        tenantId,
        period,
        serviceItemId: 'N/A',
        serviceName: item.serviceName,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        amount: item.amount,
        occurredAt: `${period}-01T00:00:00`,
      },
    ];
  }

  const weights: number[] = [];
  for (let d = 1; d <= days; d++) {
    const weekday = new Date(`${period}-${String(d).padStart(2, '0')}`).getDay();
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.62 : 1;
    weights.push(weekendFactor * (0.78 + rnd(d * 13 + item.seq * 7) * 0.44));
  }
  const sumW = weights.reduce((a, b) => a + b, 0);

  const out: UsageRecord[] = [];
  let accQty = 0;
  let accAmount = 0;

  for (let d = 1; d <= days; d++) {
    const isLast = d === days;
    const qty = isLast
      ? round2(item.quantity - accQty)
      : round2((item.quantity * weights[d - 1]) / sumW);
    const amount = isLast ? round2(item.amount - accAmount) : round2(qty * item.unitPrice);
    accQty = round2(accQty + qty);
    accAmount = round2(accAmount + amount);
    out.push({
      id: `U-${billId}-${item.seq}-${String(d).padStart(2, '0')}`,
      tenantId,
      period,
      serviceItemId: 'N/A',
      serviceName: item.serviceName,
      category: item.category,
      quantity: qty,
      unit: item.unit,
      unitPrice: item.unitPrice,
      amount,
      occurredAt: `${period}-${String(d).padStart(2, '0')}T${String(8 + (d % 11)).padStart(2, '0')}:${String((d * 7) % 60).padStart(2, '0')}:00`,
    });
  }
  return out;
}

const records: UsageRecord[] = [];

BILLS.forEach((bill) => {
  const items = BILL_ITEMS.filter((i) => i.billId === bill.id);
  const daily = bill.tenantId === 'TEN-0001' && (bill.period === '2026-09' || bill.period === '2026-10');
  items.forEach((item) => {
    records.push(...splitDaily(bill.id, bill.tenantId, bill.period, item, daily));
  });
});

export const USAGE_RECORDS = records;

export function usageOfPeriod(tenantId: string, period: string): UsageRecord[] {
  return USAGE_RECORDS.filter((r) => r.tenantId === tenantId && r.period === period);
}

/** 按日聚合（用于趋势图） */
export function dailySeries(tenantId: string, period: string): { date: string; amount: number }[] {
  const rows = usageOfPeriod(tenantId, period);
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const d = r.occurredAt.slice(0, 10);
    map.set(d, round2((map.get(d) ?? 0) + r.amount));
  });
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, amount]) => ({ date, amount }));
}

/** 按日 × 服务类别聚合（堆叠趋势图） */
export function dailyByCategory(tenantId: string, period: string) {
  const rows = usageOfPeriod(tenantId, period);
  const map = new Map<string, Record<string, number>>();
  rows.forEach((r) => {
    const d = r.occurredAt.slice(0, 10);
    const cur = map.get(d) ?? { compute: 0, model: 0, data: 0, match: 0, generate: 0, subscription: 0 };
    cur[r.category] = round2(cur[r.category] + r.amount);
    map.set(d, cur);
  });
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, v]) => ({
      date,
      算力资源: v.compute,
      模型调用: v.model,
      数据处理: v.data,
      智能匹配: v.match,
      内容生成: v.generate,
      订阅服务: v.subscription,
      total: round2(v.compute + v.model + v.data + v.match + v.generate + v.subscription),
    }));
}

/** 某账期某类别的用量合计 */
export function qtyByCategory(tenantId: string, period: string, category: string): number {
  return round2(
    usageOfPeriod(tenantId, period)
      .filter((r) => r.category === category)
      .reduce((a, r) => a + r.quantity, 0),
  );
}

/** 按服务类别聚合 */
export function byCategory(tenantId: string, period: string): Record<string, number> {
  const rows = usageOfPeriod(tenantId, period);
  const out: Record<string, number> = {};
  rows.forEach((r) => {
    out[r.category] = round2((out[r.category] ?? 0) + r.amount);
  });
  return out;
}

/** 按服务项聚合 TopN */
export function byService(tenantId: string, period: string, top = 5) {
  const rows = usageOfPeriod(tenantId, period);
  const map = new Map<string, { name: string; amount: number; quantity: number; unit: string }>();
  rows.forEach((r) => {
    const cur = map.get(r.serviceName) ?? { name: r.serviceName, amount: 0, quantity: 0, unit: r.unit };
    cur.amount = round2(cur.amount + r.amount);
    cur.quantity = round2(cur.quantity + r.quantity);
    map.set(r.serviceName, cur);
  });
  return Array.from(map.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, top);
}
