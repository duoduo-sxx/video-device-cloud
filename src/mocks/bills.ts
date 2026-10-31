import type { Bill, BillItem, BillStatus, ServiceCategory } from '@/types';
import { round2, calcBill, VAT_RATE } from '@/lib/calc';
import { TENANTS } from './tenants';

export const PERIODS = [
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
  '2026-10',
];

export const CURRENT_PERIOD = '2026-10';
export const LAST_CLOSED_PERIOD = '2026-09';

/** 当前租户（恒锐）各账期不含税金额 —— 与规格书一致 */
export const TEN0001_PERIOD_TOTALS: Record<string, number> = {
  '2025-12': 198400,
  '2026-01': 176800,
  '2026-02': 162300,
  '2026-03': 214600,
  '2026-04': 231900,
  '2026-05': 248700,
  '2026-06': 266500,
  '2026-07': 279300,
  '2026-08': 292800,
  '2026-09': 285720,
  '2026-10': 241860,
};

export const TEN0001_PERIOD_STATUS: Record<string, BillStatus> = {
  '2025-12': 'settled',
  '2026-01': 'settled',
  '2026-02': 'settled',
  '2026-03': 'settled',
  '2026-04': 'settled',
  '2026-05': 'settled',
  '2026-06': 'settled',
  '2026-07': 'invoiced',
  '2026-08': 'invoiced',
  '2026-09': 'pending_confirm',
  '2026-10': 'draft',
};

interface TemplateRow {
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  billingMode: string;
  unit: string;
  unitPrice: number;
  ratio: number;
}

/** 通用账单明细模板：ratio 之和为 1.0000 */
const TEMPLATE: TemplateRow[] = [
  { serviceId: 'SRV-C01', serviceName: 'GPU A100 80G 预留实例', category: 'compute', billingMode: '包月预留', unit: '卡·时', unitPrice: 68, ratio: 0.3046 },
  { serviceId: 'SRV-C02', serviceName: 'GPU RTX 4090 按量实例', category: 'compute', billingMode: '按量', unit: '卡·时', unitPrice: 12, ratio: 0.1532 },
  { serviceId: 'SRV-M01', serviceName: '文本生成 Qwen3-72B', category: 'model', billingMode: '阶梯价', unit: '千 token', unitPrice: 0.8, ratio: 0.136 },
  { serviceId: 'SRV-M02', serviceName: '文本向量化 BGE-M3', category: 'model', billingMode: '按量', unit: '千 token', unitPrice: 0.15, ratio: 0.0065 },
  { serviceId: 'SRV-D01', serviceName: 'ETL 多源合并', category: 'data', billingMode: '按条', unit: '条', unitPrice: 0.012, ratio: 0.0403 },
  { serviceId: 'SRV-D02', serviceName: '数据标注', category: 'data', billingMode: '按条', unit: '条', unitPrice: 0.35, ratio: 0.0514 },
  { serviceId: 'SRV-D03', serviceName: '敏感信息脱敏', category: 'data', billingMode: '按条', unit: '条', unitPrice: 0.0012, ratio: 0.0966 },
  { serviceId: 'SRV-X01', serviceName: '企业画像匹配', category: 'match', billingMode: '按对', unit: '对', unitPrice: 0.22, ratio: 0.0293 },
  { serviceId: 'SRV-G01', serviceName: '商品文案生成', category: 'generate', billingMode: '按篇', unit: '篇', unitPrice: 2.6, ratio: 0.0619 },
  { serviceId: 'SRV-G02', serviceName: '营销图生成', category: 'generate', billingMode: '按张', unit: '张', unitPrice: 1.2, ratio: 0.008 },
  { serviceId: 'SRV-S01', serviceName: '数据洞察专业版', category: 'subscription', billingMode: '按月', unit: '期', unitPrice: 32000, ratio: 0.1122 },
];

/** 2026-09 恒锐账单明细：逐项精确，合计 285,720.00 */
const HERO_ROWS: Omit<BillItem, 'id' | 'billId' | 'seq'>[] = [
  { category: 'compute', serviceName: 'GPU A100 80G 预留实例', billingMode: '包月预留', quantity: 1280, unit: '卡·时', unitPrice: 68, amount: 87040 },
  { category: 'compute', serviceName: 'GPU RTX 4090 按量实例', billingMode: '按量', quantity: 3650, unit: '卡·时', unitPrice: 12, amount: 43800 },
  { category: 'model', serviceName: '文本生成 Qwen3-72B', billingMode: '阶梯价', quantity: 48600, unit: '千 token', unitPrice: 0.8, amount: 38880 },
  { category: 'model', serviceName: '文本向量化 BGE-M3', billingMode: '按量', quantity: 12400, unit: '千 token', unitPrice: 0.15, amount: 1860 },
  { category: 'data', serviceName: 'ETL 多源合并', billingMode: '按条', quantity: 960000, unit: '条', unitPrice: 0.012, amount: 11520 },
  { category: 'data', serviceName: '数据标注', billingMode: '按条', quantity: 42000, unit: '条', unitPrice: 0.35, amount: 14700 },
  { category: 'data', serviceName: '敏感信息脱敏', billingMode: '按条', quantity: 23000000, unit: '条', unitPrice: 0.0012, amount: 27600 },
  { category: 'match', serviceName: '企业画像匹配', billingMode: '按对', quantity: 38000, unit: '对', unitPrice: 0.22, amount: 8360 },
  { category: 'generate', serviceName: '商品文案生成', billingMode: '按篇', quantity: 6800, unit: '篇', unitPrice: 2.6, amount: 17680 },
  { category: 'generate', serviceName: '营销图生成', billingMode: '按张', quantity: 1900, unit: '张', unitPrice: 1.2, amount: 2280 },
  { category: 'subscription', serviceName: '数据洞察专业版', billingMode: '按月', quantity: 1, unit: '期', unitPrice: 32000, amount: 32000 },
];

/** 其它账期：按比例拆分，第 1 项吸收尾差，保证 Σ明细 === 不含税 */
function buildGenericRows(total: number, withSubscription: boolean): Omit<BillItem, 'id' | 'billId' | 'seq'>[] {
  const rows = withSubscription ? TEMPLATE : TEMPLATE.filter((t) => t.serviceId !== 'SRV-S01');
  const norm = withSubscription
    ? 1
    : rows.reduce((a, r) => a + r.ratio, 0);

  const detailRows: Omit<BillItem, 'id' | 'billId' | 'seq'>[] = rows.slice(1).map((t) => {
    const amount = withSubscription
      ? t.serviceId === 'SRV-S01'
        ? 32000
        : round2(total * t.ratio)
      : round2((total * t.ratio) / norm);
    const quantity = t.unitPrice === 0 ? 0 : round2(amount / t.unitPrice);
    return {
      category: t.category,
      serviceName: t.serviceName,
      billingMode: t.billingMode,
      quantity,
      unit: t.unit,
      unitPrice: t.unitPrice,
      amount,
    };
  });

  const rest = round2(detailRows.reduce((a, r) => a + r.amount, 0));
  const head = TEMPLATE[0];
  const headAmount = round2(total - rest);
  const headQty = round2(headAmount / head.unitPrice);

  return [
    {
      category: head.category,
      serviceName: head.serviceName,
      billingMode: head.billingMode,
      quantity: headQty,
      unit: head.unit,
      unitPrice: head.unitPrice,
      amount: headAmount,
    },
    ...detailRows,
  ];
}

/** 确定性伪随机，保证每次刷新数据一致 */
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function tenantPeriodTotal(tenantId: string, period: string, monthlyAvg: number): number {
  const idx = PERIODS.indexOf(period);
  const growth = 0.76 + idx * 0.032; // 逐月爬坡
  const seasonal = period === '2026-02' ? 0.72 : 1; // 春节回落
  const jitter = 0.9 + seeded(Number(tenantId.slice(-2)) * 17 + idx) * 0.2;
  return round2(monthlyAvg * growth * seasonal * jitter);
}

function statusForPeriod(period: string): BillStatus {
  if (period <= '2026-06') return 'settled';
  if (period === '2026-07' || period === '2026-08') return 'invoiced';
  if (period === '2026-09') return 'pending_confirm';
  return 'draft';
}

function mkBillNo(period: string, idx: number): string {
  return `YS${period.replace('-', '')}${String(idx).padStart(4, '0')}`;
}

const bills: Bill[] = [];
const billItems: BillItem[] = [];

TENANTS.forEach((tenant, tIdx) => {
  PERIODS.forEach((period) => {
    const isHero = tenant.id === 'TEN-0001';
    const net =
      isHero && TEN0001_PERIOD_TOTALS[period] !== undefined
        ? TEN0001_PERIOD_TOTALS[period]
        : tenantPeriodTotal(tenant.id, period, tenant.monthlyAvg);
    const status = isHero ? TEN0001_PERIOD_STATUS[period] : statusForPeriod(period);
    const rows = isHero && period === '2026-09' ? HERO_ROWS : buildGenericRows(net, isHero);
    const subtotal = round2(rows.reduce((a, r) => a + r.amount, 0));
    const calc = calcBill({ subtotal, discount: 0, taxRate: VAT_RATE });
    const billId = `BILL-${period.replace('-', '')}-${String(tIdx + 1).padStart(4, '0')}`;

    bills.push({
      id: billId,
      billNo: mkBillNo(period, tIdx + 1),
      tenantId: tenant.id,
      period,
      status,
      subtotal,
      discount: 0,
      netAmount: calc.netAmount,
      taxRate: VAT_RATE,
      taxAmount: calc.taxAmount,
      total: calc.total,
      itemCount: rows.length,
      generatedAt:
        period === CURRENT_PERIOD
          ? '2026-10-31T23:00:00'
          : `${nextMonthStart(period)}T10:12:00`,
      confirmedAt:
        status === 'pending_confirm' || status === 'draft'
          ? null
          : `${nextMonthStart(period).slice(0, 8)}03T14:26:00`,
      invoiceId: null,
      paidAt:
        status === 'settled'
          ? `${nextMonthStart(period).slice(0, 8)}18T09:30:00`
          : null,
      overdueDays: 0,
    });

    rows.forEach((r, i) => {
      billItems.push({
        id: `${billId}-${String(i + 1).padStart(2, '0')}`,
        billId,
        seq: i + 1,
        ...r,
      });
    });
  });
});

function nextMonthStart(period: string): string {
  const [y, m] = period.split('-').map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, '0')}-01`;
}

export const BILLS = bills;
export const BILL_ITEMS = billItems;

export const BILL_MAP = Object.fromEntries(BILLS.map((b) => [b.id, b])) as Record<string, Bill>;

export function itemsOf(billId: string): BillItem[] {
  return BILL_ITEMS.filter((i) => i.billId === billId);
}

export function billsOf(tenantId: string): Bill[] {
  return BILLS.filter((b) => b.tenantId === tenantId).sort((a, b) => (a.period < b.period ? 1 : -1));
}

export function billOfPeriod(tenantId: string, period: string): Bill | undefined {
  return BILLS.find((b) => b.tenantId === tenantId && b.period === period);
}

/** 运行期可变的账单状态（伪持久化） */
export const BILL_STATE: Record<string, Bill> = Object.fromEntries(
  BILLS.map((b) => [b.id, { ...b }]),
);
