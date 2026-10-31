import type { Invoice } from '@/types';
import { BILLS, BILL_STATE } from './bills';
import { TENANTS } from './tenants';

const TENANT_MAP = Object.fromEntries(TENANTS.map((t) => [t.id, t]));

function sequential(n: number): string {
  return String(25000000 + n * 137 + 1826).padStart(8, '0');
}

const invoices: Invoice[] = [];
let seq = 1;

BILLS.filter((b) => b.status === 'invoiced' || b.status === 'settled')
  .sort((a, b) => (a.period < b.period ? -1 : 1))
  .forEach((bill) => {
    const tenant = TENANT_MAP[bill.tenantId];
    if (!tenant) return;
    const id = `INV-${String(seq).padStart(4, '0')}`;
    const issuedMonth = bill.status === 'settled' ? bill.generatedAt.slice(0, 7) : bill.generatedAt.slice(0, 7);
    const inv: Invoice = {
      id,
      invoiceNo: sequential(seq),
      invoiceCode: '011002400111',
      tenantId: bill.tenantId,
      billIds: [bill.id],
      period: bill.period,
      title: tenant.name,
      taxNo: tenant.taxNo,
      address: tenant.address,
      bankName: `${tenant.bankName} ${tenant.bankAccount}`,
      itemName: '信息技术服务*数据服务费',
      taxRate: 0.06,
      amount: bill.netAmount,
      taxAmount: bill.taxAmount,
      total: bill.total,
      type: 'special',
      status: bill.status === 'settled' ? 'sent' : 'issued',
      issuedAt: `${issuedMonth}-08T16:20:00`,
      issuedBy: '闫菲',
      payee: '闫菲',
      reviewer: '秦朗',
      drawer: '闫菲',
    };
    invoices.push(inv);
    const target = BILL_STATE[bill.id];
    if (target) target.invoiceId = id;
    seq += 1;
  });

/** 两条待开票申请（2026-09 账期） */
invoices.push({
  id: 'INV-9001',
  invoiceNo: '-',
  invoiceCode: '-',
  tenantId: 'TEN-0001',
  billIds: ['BILL-202609-0001'],
  period: '2026-09',
  title: '恒锐新能源汽车零部件有限公司',
  taxNo: '91110108MA01K7Q23N',
  address: '北京市海淀区永丰产业基地 3 号楼 8 层',
  bankName: '中国工商银行北京中关村支行 0200 0012 0920 0456 789',
  itemName: '信息技术服务*数据服务费',
  taxRate: 0.06,
  amount: 285720,
  taxAmount: 17143.2,
  total: 302863.2,
  type: 'special',
  status: 'pending',
  issuedAt: null,
  issuedBy: '-',
  payee: '-',
  reviewer: '-',
  drawer: '-',
});

export const INVOICES = invoices;
export const INVOICE_MAP = Object.fromEntries(INVOICES.map((i) => [i.id, i])) as Record<string, Invoice>;

export function invoicesOf(tenantId: string): Invoice[] {
  return INVOICES.filter((i) => i.tenantId === tenantId);
}

export const INVOICE_STATE: Record<string, Invoice> = Object.fromEntries(
  INVOICES.map((i) => [i.id, { ...i }]),
);
