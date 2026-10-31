import { Fragment, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Landmark,
  Plus,
  Receipt,
  Send,
  Wallet,
} from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Drawer, Modal, Progress, Tabs } from '@/components/ui/Overlay';
import { Field, FilterBar, SearchInput, Select, Textarea } from '@/components/ui/Form';
import { BarChartH, Donut, Legend, TrendArea } from '@/components/charts';
import { useAppStore } from '@/store/appStore';
import { useUIStore } from '@/store/uiStore';
import { PERIODS, CURRENT_PERIOD, itemsOf } from '@/mocks/bills';
import { TENANTS } from '@/mocks/tenants';
import { PAYMENTS, PLATFORM_MONTHLY } from '@/mocks/misc';
import { money, num } from '@/lib/format';
import { calcBill, rmbUpper, round2, VAT_RATE } from '@/lib/calc';
import { BILL_STATUS_LABEL, CATEGORY_LABEL, type Bill, type ServiceCategory } from '@/types';

const TNAME = Object.fromEntries(TENANTS.map((t) => [t.id, t.shortName]));

/* ================= 财务看板 ================= */
export function FinanceOverview() {
  const navigate = useNavigate();
  const bills = useAppStore((s) => s.bills);

  const invoiced = bills.filter((b) => b.status === 'invoiced');
  const settled = bills.filter((b) => b.status === 'settled');
  const pending = bills.filter((b) => b.status === 'pending_confirm' || b.status === 'confirmed');

  const receivable = round2(
    bills
      .filter((b) => b.status === 'invoiced')
      .reduce((a, b) => a + b.total, 0),
  );

  const taxSum = bills.filter((b) => b.status !== 'draft').reduce((a, b) => a + b.taxAmount, 0);

  const revenueTrend = PLATFORM_MONTHLY.map((m) => ({ month: m.month.slice(5), revenue: m.revenue }));

  const aging = [
    { name: '0-30 天', value: 486200 },
    { name: '31-60 天', value: 312800 },
    { name: '61-90 天', value: 142600 },
    { name: '90 天以上', value: 62480 },
  ];

  return (
    <div>
      <PageHeader
        title="财务看板"
        desc={`当前账期 ${CURRENT_PERIOD} ｜ 开票品目「信息技术服务」，增值税税率 6%`}
        actions={
          <>
            <Button icon={<Receipt size={14} />} onClick={() => navigate('/finance/reconcile')}>
              去对账
            </Button>
            <Button variant="primary" icon={<FileText size={14} />} onClick={() => navigate('/finance/invoices')}>
              开票申请池
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="本月应收（含税）" value={money(bills.filter((b) => b.period === '2026-09').reduce((a, b) => a + b.total, 0))} hint="2026-09 账期" tone="primary" />
        <StatCard label="已开票未回款" value={money(receivable)} hint={`${invoiced.length} 张账单待核销`} />
        <StatCard label="待开票" value={money(pending.reduce((a, b) => a + b.total, 0))} hint={`${pending.length} 张账单已确认`} tone="warning" />
        <StatCard label="销项税额（累计）" value={money(taxSum)} hint="税率 6%，可全额抵扣" />
        <StatCard label="回款率" value="92.4" unit="%" hint={`已核销 ${settled.length} 笔`} tone="success" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="收入与应收趋势" desc="近 6 个月确认收入，单位：元（不含税）" />
          <div className="mt-3">
            <TrendArea data={revenueTrend} xKey="month" yKey="revenue" height={250} name="确认收入" />
          </div>
        </Card>
        <Card>
          <CardHeader title="应收账款账龄" desc="按开票日起算" />
          <Donut data={aging} height={200} centerLabel="应收合计" centerValue={money(aging.reduce((a, x) => a + x.value, 0))} innerRadius={54} />
          <Legend items={aging.map((a) => ({ name: a.name, value: money(a.value) }))} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="结算进度" desc="2026-09 账期" />
          <div className="mt-4 space-y-3.5">
            {[
              ['用量封账', 100],
              ['生成账单', 100],
              ['客户确认', 68],
              ['开具发票', 52],
              ['回款核销', 41],
            ].map(([label, v]) => (
              <div key={label as string}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-ink-2">{label as string}</span>
                  <span className="num font-medium text-ink-1">{v as number}%</span>
                </div>
                <Progress value={v as number} height={4} tone={(v as number) === 100 ? 'success' : 'primary'} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="待办" desc="按紧急程度" />
          <div className="mt-3 space-y-2.5">
            {[
              { icon: Receipt, text: '2026-09 账期待出账客户 2 家', tone: 'text-primary' },
              { icon: FileText, text: '1 笔开票申请待开具', tone: 'text-warning' },
              { icon: Landmark, text: '3 笔回款待核销', tone: 'text-primary' },
              { icon: Building2, text: '1 家客户账龄超 90 天', tone: 'text-danger' },
            ].map((t) => (
              <div key={t.text} className="flex items-center gap-2.5 rounded-ctl border border-line px-3 py-2.5">
                <t.icon size={14} className={t.tone} />
                <span className="text-xs text-ink-1">{t.text}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="客户应收 Top" desc="按未核销金额" />
          <div className="mt-3">
            <BarChartH
              data={TENANTS.slice(0, 5).map((t) => ({
                name: t.shortName,
                amount: bills.filter((b) => b.tenantId === t.id && b.status === 'invoiced').reduce((a, b) => a + b.total, 0),
              }))}
              labelKey="name"
              valueKey="amount"
              height={200}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================= 账期对账 ================= */
export function Reconcile() {
  const navigate = useNavigate();
  const bills = useAppStore((s) => s.bills);

  const rows = PERIODS.slice().reverse().map((p) => {
    const list = bills.filter((b) => b.period === p);
    const net = round2(list.reduce((a, b) => a + b.netAmount, 0));
    const tax = round2(list.reduce((a, b) => a + b.taxAmount, 0));
    const total = round2(list.reduce((a, b) => a + b.total, 0));
    const done = list.filter((b) => b.status === 'settled').length;
    return { period: p, customers: list.length, net, tax, total, done, list };
  });

  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'period', title: '账期', width: 110, render: (r) => <span className="num font-medium">{r.period}</span> },
    { key: 'customers', title: '客户数', width: 90, align: 'right', render: (r) => <span className="num text-ink-2">{r.customers}</span> },
    { key: 'net', title: '不含税合计', width: 150, align: 'right', render: (r) => <span className="num">{money(r.net)}</span> },
    { key: 'tax', title: '税额（6%）', width: 140, align: 'right', render: (r) => <span className="num text-ink-2">{money(r.tax)}</span> },
    { key: 'total', title: '价税合计', width: 150, align: 'right', sortable: true, sorter: (a, b) => a.total - b.total, render: (r) => <span className="num font-medium">{money(r.total)}</span> },
    {
      key: 'progress',
      title: '结算进度',
      width: 200,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-28">
            <Progress value={(r.done / r.customers) * 100} height={4} tone={r.done === r.customers ? 'success' : 'primary'} />
          </div>
          <span className="num text-2xs text-ink-2">
            {r.done}/{r.customers}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 110,
      render: (r) => (
        <Badge tone={r.done === r.customers ? 'green' : r.period === CURRENT_PERIOD ? 'gray' : 'amber'}>
          {r.done === r.customers ? '已结清' : r.period === CURRENT_PERIOD ? '进行中' : '待处理'}
        </Badge>
      ),
    },
    {
      key: 'op',
      title: '操作',
      width: 110,
      align: 'right',
      render: (r) => (
        <button className="text-xs text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/finance/reconcile/${r.period}`); }}>
          对账作业
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="账期对账"
        desc="按自然月封账出账，客户确认后进入开票流程；异议在本页完成调账"
        actions={
          <Button variant="primary" icon={<Send size={14} />} onClick={() => navigate(`/finance/reconcile/${CURRENT_PERIOD}`)}>
            生成当前账期账单
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="待出账账期" value="1" unit="个" hint="2026-10 进行中" tone="warning" />
        <StatCard label="待客户确认" value={String(bills.filter((b) => b.status === 'pending_confirm').length)} unit="户" />
        <StatCard label="待开具发票" value={String(bills.filter((b) => b.status === 'confirmed').length)} unit="户" tone="primary" />
        <StatCard label="本年累计结算" value={money(bills.filter((b) => b.status === 'settled').reduce((a, b) => a + b.total, 0))} tone="success" />
      </div>

      <Card pad={false}>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.period} pageSize={11} onRowClick={(r) => navigate(`/finance/reconcile/${r.period}`)} />
      </Card>
    </div>
  );
}

/* ================= 对账作业 ================= */
const STAGES = ['用量封账', '生成账单', '客户确认', '开具发票', '回款核销'];

export function ReconcileDetail() {
  const { period = CURRENT_PERIOD } = useParams<{ period: string }>();
  const navigate = useNavigate();
  const bills = useAppStore((s) => s.bills);
  const toast = useUIStore((s) => s.toast);
  const [sel, setSel] = useState<Bill | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const rows = bills.filter((b) => b.period === period);

  const stageIdx = useMemo(() => {
    const confirmed = rows.filter((b) => b.status !== 'pending_confirm' && b.status !== 'draft').length;
    const invoiced = rows.filter((b) => b.status === 'invoiced' || b.status === 'settled').length;
    const settled = rows.filter((b) => b.status === 'settled').length;
    if (settled === rows.length) return 5;
    if (invoiced > 0) return 3;
    if (confirmed > 0) return 2;
    return period === CURRENT_PERIOD ? 0 : 1;
  }, [rows, period]);

  const columns: Column<Bill>[] = [
    { key: 'tenant', title: '客户', render: (r) => <span className="text-sm font-medium">{TNAME[r.tenantId] ?? r.tenantId}</span> },
    { key: 'billNo', title: '账单号', width: 150, render: (r) => <span className="num text-xs text-ink-2">{r.billNo}</span> },
    { key: 'itemCount', title: '明细项', width: 80, align: 'right', render: (r) => <span className="num text-ink-2">{r.itemCount}</span> },
    { key: 'netAmount', title: '不含税', width: 140, align: 'right', render: (r) => <span className="num">{money(r.netAmount)}</span> },
    { key: 'taxAmount', title: '税额', width: 120, align: 'right', render: (r) => <span className="num text-ink-2">{money(r.taxAmount)}</span> },
    { key: 'total', title: '价税合计', width: 140, align: 'right', render: (r) => <span className="num font-medium">{money(r.total)}</span> },
    { key: 'status', title: '状态', width: 100, render: (r) => <StatusBadge status={r.status} label={BILL_STATUS_LABEL[r.status]} /> },
    {
      key: 'op',
      title: '操作',
      width: 120,
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs text-primary" onClick={() => setSel(r)}>
            核对
          </button>
          <button className="text-xs text-ink-2" onClick={() => toast(`已重新计算 ${r.billNo}`, 'info')}>
            重算
          </button>
        </div>
      ),
    },
  ];

  const total = rows.reduce((a, b) => a + b.total, 0);

  return (
    <div>
      <button
        onClick={() => navigate('/finance/reconcile')}
        className="mb-3 inline-flex items-center gap-1 text-xs text-ink-2 hover:text-ink-1"
      >
        <ArrowLeft size={13} /> 返回账期列表
      </button>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="num text-xl font-semibold text-ink-1">{period} 账期对账</h1>
            <Badge tone={period === CURRENT_PERIOD ? 'gray' : 'amber'}>
              {period === CURRENT_PERIOD ? '进行中' : '待处理'}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-ink-2">
            共 {rows.length} 家客户 ｜ 价税合计 {money(total)} ｜ 税率 6%
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon={<Download size={14} />} onClick={() => toast('对账明细已导出', 'info')}>
            导出明细
          </Button>
          <Button variant="primary" icon={<Send size={14} />} onClick={() => toast(`已向 ${rows.length} 家客户发布 ${period} 账单`)}>
            批量发布账单
          </Button>
        </div>
      </div>

      {/* 阶段指示器 */}
      <Card className="mb-4">
        <div className="flex items-center">
          {STAGES.map((s, i) => {
            const done = i < stageIdx;
            const active = i === stageIdx;
            return (
              <div key={s} className="flex flex-1 items-center">
                <div className="flex items-center gap-2">
                  <span
                    className={`num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-semibold ${
                      done ? 'bg-success text-white' : active ? 'bg-primary text-white' : 'bg-[#F2F4F7] text-ink-3'
                    }`}
                  >
                    {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`whitespace-nowrap text-xs ${done || active ? 'font-medium text-ink-1' : 'text-ink-3'}`}>{s}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`mx-3 h-px flex-1 ${i < stageIdx ? 'bg-success' : 'bg-line'}`} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card pad={false}>
        <div className="p-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">合计 {money(total)}</span>}>
            <Badge tone="gray">账期 {period}</Badge>
          </FilterBar>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={10} onRowClick={setSel} emptyTitle="该账期暂无账单" />
      </Card>

      <Drawer
        open={!!sel}
        onClose={() => setSel(null)}
        title="账单核对"
        subtitle={sel ? `${sel.billNo} ｜ ${TNAME[sel.tenantId]}` : ''}
        width={680}
        footer={
          <>
            <Button onClick={() => setAdjustOpen(true)}>人工调账</Button>
            <Button variant="primary" icon={<CheckCircle2 size={14} />} onClick={() => { toast(`${sel?.billNo} 已发布给客户`); setSel(null); }}>
              发布账单
            </Button>
          </>
        }
      >
        {sel && <BillSummary bill={sel} />}
      </Drawer>

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="人工调账"
        subtitle="调账金额将计入账单，需填写原因并留存审计记录"
        footer={
          <>
            <Button onClick={() => setAdjustOpen(false)}>取消</Button>
            <Button variant="primary" onClick={() => { setAdjustOpen(false); toast('调账已提交，账单金额已重算'); }}>
              确认调账
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="调账类型">
              <Select defaultValue="minus">
                <option value="minus">冲减（减项）</option>
                <option value="plus">补收（加项）</option>
              </Select>
            </Field>
            <Field label="调账金额（元）" required>
              <input placeholder="例如 1240.00" className="num h-9 w-full rounded-ctl border border-line px-3 text-sm" />
            </Field>
          </div>
          <Field label="调账原因" required>
            <Textarea placeholder="例如：9 月 12-14 日 A100 实例停机期间预留费用按合同应减免，冲减 1,240.00 元。" />
          </Field>
          <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2.5 text-2xs text-ink-3">
            调账后账单将重新计算不含税金额、税额与价税合计，并同步推送给客户确认。
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BillSummary({ bill }: { bill: Bill }) {
  const items = itemsOf(bill.id);
  const calc = calcBill({ subtotal: bill.subtotal, discount: bill.discount, taxRate: VAT_RATE });
  const groups = Array.from(new Set(items.map((i) => i.category))) as ServiceCategory[];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2.5">
          <div className="text-2xs text-ink-3">不含税金额</div>
          <div className="num mt-1 text-sm font-semibold text-ink-1">{money(bill.netAmount)}</div>
        </div>
        <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2.5">
          <div className="text-2xs text-ink-3">税额（6%）</div>
          <div className="num mt-1 text-sm font-semibold text-ink-1">{money(bill.taxAmount)}</div>
        </div>
        <div className="rounded-ctl bg-primary-soft px-3 py-2.5">
          <div className="text-2xs text-primary/70">价税合计</div>
          <div className="num mt-1 text-sm font-semibold text-primary">{money(bill.total)}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-ctl border border-line">
        <table className="w-full text-xs">
          <thead className="bg-[#F9FAFB] text-ink-2">
            <tr>
              <th className="px-2.5 py-2 text-left font-medium">服务项</th>
              <th className="px-2.5 py-2 text-right font-medium">用量</th>
              <th className="px-2.5 py-2 text-left font-medium">单位</th>
              <th className="px-2.5 py-2 text-right font-medium">单价</th>
              <th className="px-2.5 py-2 text-right font-medium">金额</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g}>
                {items
                  .filter((i) => i.category === g)
                  .map((i) => (
                    <tr key={i.id} className="border-t border-line">
                      <td className="px-2.5 py-2">{i.serviceName}</td>
                      <td className="num px-2.5 py-2 text-right">{num(i.quantity)}</td>
                      <td className="px-2.5 py-2 text-ink-2">{i.unit}</td>
                      <td className="num px-2.5 py-2 text-right text-ink-2">
                        {i.unitPrice < 0.01 ? i.unitPrice.toFixed(4) : i.unitPrice.toFixed(2)}
                      </td>
                      <td className="num px-2.5 py-2 text-right font-medium">{money(i.amount)}</td>
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1.5 rounded-ctl border border-line px-3.5 py-3 text-xs">
        <div className="flex justify-between">
          <span className="text-ink-3">明细合计</span>
          <span className="num text-ink-1">{money(bill.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-3">折扣</span>
          <span className="num text-ink-1">-{money(bill.discount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-3">增值税 6%</span>
          <span className="num text-ink-1">{money(calc.taxAmount)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-1.5">
          <span className="font-medium text-ink-1">价税合计</span>
          <span className="num font-semibold text-primary">{money(calc.total)}</span>
        </div>
      </div>

      <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2.5 text-2xs leading-relaxed text-ink-3">
        价税合计大写：<span className="text-ink-2">{rmbUpper(calc.total)}</span>
        <br />
        开票品目：信息技术服务*数据服务费 ｜ 税率 6%
      </div>
    </div>
  );
}

/* ================= 开票申请池 ================= */
export function InvoicePool() {
  const navigate = useNavigate();
  const bills = useAppStore((s) => s.bills);
  const invoices = useAppStore((s) => s.invoices);
  const issueInvoice = useAppStore((s) => s.issueInvoice);
  const toast = useUIStore((s) => s.toast);
  const [selected, setSelected] = useState<string[]>([]);
  const [issueOpen, setIssueOpen] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');

  const pending = invoices.filter((i) => i.status === 'pending');

  const columns: Column<(typeof invoices)[number]>[] = [
    { key: 'id', title: '申请编号', width: 110, render: (r) => <span className="num text-xs text-ink-2">{r.id}</span> },
    { key: 'title', title: '购方名称', render: (r) => <span className="text-sm">{r.title}</span> },
    { key: 'taxNo', title: '纳税人识别号', width: 190, render: (r) => <span className="font-mono text-2xs text-ink-2">{r.taxNo}</span> },
    { key: 'period', title: '账期', width: 90, render: (r) => <span className="num text-xs">{r.period}</span> },
    { key: 'itemName', title: '开票品目', width: 190, render: (r) => <span className="text-xs text-ink-2">{r.itemName}</span> },
    { key: 'amount', title: '金额', width: 130, align: 'right', render: (r) => <span className="num">{money(r.amount)}</span> },
    { key: 'taxAmount', title: '税额', width: 110, align: 'right', render: (r) => <span className="num text-ink-2">{money(r.taxAmount)}</span> },
    { key: 'total', title: '价税合计', width: 130, align: 'right', render: (r) => <span className="num font-medium">{money(r.total)}</span> },
    { key: 'status', title: '状态', width: 90, render: (r) => <StatusBadge status={r.status} /> },
  ];

  const selTotal = pending.filter((p) => selected.includes(p.id)).reduce((a, p) => a + p.total, 0);

  return (
    <div>
      <PageHeader
        title="开票申请池"
        desc="客户提交的开票申请，核对购方信息后可批量开具 6% 增值税专用发票"
        actions={
          <Button variant="primary" icon={<FileText size={14} />} onClick={() => navigate('/finance/invoices/apply')}>
            前往开具
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="待开票申请" value={String(pending.length)} unit="笔" tone="warning" />
        <StatCard label="待开票金额" value={money(pending.reduce((a, p) => a + p.total, 0))} hint="含税" />
        <StatCard label="本月已开具" value={money(invoices.filter((i) => i.status !== 'pending').reduce((a, i) => a + i.total, 0))} tone="primary" />
        <StatCard label="平均开票时效" value="1.8" unit="天" hint="SLA 3 个工作日" tone="success" />
      </div>

      <Card pad={false}>
        <div className="p-4">
          <FilterBar
            extra={
              <Button
                variant="primary"
                size="sm"
                disabled={selected.length === 0}
                onClick={() => {
                  setInvoiceNo(String(25032000 + selected.length * 17));
                  setIssueOpen(true);
                }}
              >
                批量开具 {selected.length > 0 && `(${selected.length})`}
              </Button>
            }
          >
            <Badge tone="amber" dot>
              {pending.length} 笔待开具
            </Badge>
          </FilterBar>
        </div>
        <DataTable
          columns={columns}
          rows={pending}
          rowKey={(r) => r.id}
          pageSize={8}
          selectable
          selected={selected}
          onSelect={setSelected}
          emptyTitle="没有待开票申请"
          emptyDesc="客户在控制台确认账单并提交开票申请后，将出现在此处"
          footer={selected.length > 0 ? <span className="num ml-3 text-primary">合计 {money(selTotal)}</span> : undefined}
        />
      </Card>

      <Card className="mt-4">
        <CardHeader title="开票合规校验" desc="开具前系统自动校验以下要素" extra={<BadgeCheck size={15} className="text-ink-3" />} />
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {[
            '购方名称与纳税人识别号匹配',
            '开票品目限定为「信息技术服务」',
            '税率固定 6%，不可手工修改',
            '金额与税额需满足「金额 × 6% = 税额」',
            '关联账单已由客户确认，且未被红冲',
            '开票金额不超过账单价税合计',
          ].map((t) => (
            <div key={t} className="flex items-center gap-2 rounded-ctl bg-[#F9FAFB] px-3 py-2">
              <CheckCircle2 size={12} className="text-success" />
              <span className="text-2xs text-ink-2">{t}</span>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title="开具增值税专用发票"
        subtitle={`共 ${selected.length} 笔，价税合计 ${money(selTotal)}`}
        footer={
          <>
            <Button onClick={() => setIssueOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                selected.forEach((id) => issueInvoice(id, invoiceNo));
                setSelected([]);
                setIssueOpen(false);
                toast(`已开具 ${selected.length} 张发票，发票号 ${invoiceNo}`);
              }}
            >
              确认开具
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="发票号码" required>
              <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="num h-9 w-full rounded-ctl border border-line px-3 text-sm" />
            </Field>
            <Field label="开票日期">
              <input defaultValue="2026-10-31" className="num h-9 w-full rounded-ctl border border-line px-3 text-sm" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="开票品目">
              <input value="信息技术服务*数据服务费" readOnly className="h-9 w-full rounded-ctl border border-line bg-[#F9FAFB] px-3 text-sm text-ink-3" />
            </Field>
            <Field label="税率">
              <input value="6%" readOnly className="num h-9 w-full rounded-ctl border border-line bg-[#F9FAFB] px-3 text-sm text-ink-3" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="开票人"><input defaultValue="闫菲" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" /></Field>
            <Field label="复核人"><input defaultValue="秦朗" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" /></Field>
            <Field label="收款人"><input defaultValue="闫菲" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" /></Field>
          </div>
          <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2.5 text-2xs leading-relaxed text-ink-3">
            价税合计大写：<span className="text-ink-2">{rmbUpper(selTotal)}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= 开具发票 ================= */
export function InvoiceApply() {
  const bills = useAppStore((s) => s.bills);
  const applyInvoice = useAppStore((s) => s.applyInvoice);
  const toast = useUIStore((s) => s.toast);
  const navigate = useNavigate();

  const eligible = bills.filter((b) => b.status === 'confirmed' || b.status === 'pending_confirm');
  const [picked, setPicked] = useState<string[]>([eligible[0]?.id].filter(Boolean) as string[]);
  const [payee, setPayee] = useState('闫菲');
  const [reviewer, setReviewer] = useState('秦朗');
  const [drawer, setDrawer] = useState('闫菲');

  const selectedBills = bills.filter((b) => picked.includes(b.id));
  const subtotal = round2(selectedBills.reduce((a, b) => a + b.netAmount, 0));
  const calc = calcBill({ subtotal, discount: 0, taxRate: VAT_RATE });

  return (
    <div>
      <PageHeader
        title="开具发票"
        desc="开票品目固定为「信息技术服务」，税率固定 6%；税额由不含税金额自动计算"
        actions={
          <Button icon={<FileText size={14} />} onClick={() => navigate('/finance/invoices')}>
            返回申请池
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* 左：可开票账单 */}
        <Card className="xl:col-span-2" pad={false}>
          <div className="border-b border-line px-4 py-3">
            <div className="text-sm font-semibold text-ink-1">可开票账单</div>
            <div className="mt-0.5 text-xs text-ink-3">已确认或待确认账单可提交开票</div>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {eligible.map((b) => {
              const on = picked.includes(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() => setPicked(on ? picked.filter((x) => x !== b.id) : [...picked, b.id])}
                  className={`flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors ${
                    on ? 'bg-primary-soft' : 'hover:bg-[#FCFCFD]'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      on ? 'border-primary bg-primary' : 'border-[#D0D5DD]'
                    }`}
                  >
                    {on && <Check size={11} className="text-white" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-medium text-ink-1">
                        {TNAME[b.tenantId] ?? b.tenantId}
                      </span>
                      <StatusBadge status={b.status} label={BILL_STATUS_LABEL[b.status]} />
                    </div>
                    <div className="num mt-1 text-2xs text-ink-3">
                      {b.period} ｜ {b.billNo}
                    </div>
                    <div className="num mt-1 text-xs text-ink-1">{money(b.total)}</div>
                  </div>
                </button>
              );
            })}
            {eligible.length === 0 && <div className="py-16 text-center text-xs text-ink-3">没有可开票账单</div>}
          </div>
        </Card>

        {/* 右：开票表单 */}
        <Card className="xl:col-span-3">
          <CardHeader title="开票信息" desc="购方信息自动带出，可修改；品目与税率锁定" />

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="购方名称" required className="col-span-2">
                <input
                  defaultValue={selectedBills[0] ? TENANTS.find((t) => t.id === selectedBills[0].tenantId)?.name : ''}
                  className="h-9 w-full rounded-ctl border border-line px-3 text-sm"
                />
              </Field>
              <Field label="纳税人识别号" required>
                <input
                  defaultValue={selectedBills[0] ? TENANTS.find((t) => t.id === selectedBills[0].tenantId)?.taxNo : ''}
                  className="num h-9 w-full rounded-ctl border border-line px-3 text-sm"
                />
              </Field>
              <Field label="发票类型">
                <Select defaultValue="special">
                  <option value="special">增值税专用发票</option>
                  <option value="normal">增值税普通发票</option>
                </Select>
              </Field>
              <Field label="开票品目" required hint="信息技术服务为法定品目，不可修改" className="col-span-2">
                <input
                  value="信息技术服务*数据服务费"
                  readOnly
                  className="h-9 w-full cursor-not-allowed rounded-ctl border border-line bg-[#F9FAFB] px-3 text-sm text-ink-3"
                />
              </Field>
            </div>

            <div className="rounded-ctl border border-line">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-line">
                    <td className="px-3 py-2.5 text-ink-3">不含税金额</td>
                    <td className="num px-3 py-2.5 text-right font-medium text-ink-1">{money(subtotal)}</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="px-3 py-2.5 text-ink-3">
                      税率 <span className="ml-1 rounded bg-[#F2F4F7] px-1 py-0.5 text-2xs">锁定 6%</span>
                    </td>
                    <td className="num px-3 py-2.5 text-right text-ink-1">6%</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="px-3 py-2.5 text-ink-3">税额（自动计算）</td>
                    <td className="num px-3 py-2.5 text-right text-ink-1">{money(calc.taxAmount)}</td>
                  </tr>
                  <tr className="bg-primary-soft">
                    <td className="px-3 py-3 font-medium text-primary">价税合计</td>
                    <td className="num px-3 py-3 text-right text-base font-semibold text-primary">{money(calc.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-ctl bg-[#F9FAFB] px-3.5 py-2.5 text-2xs leading-relaxed text-ink-2">
              价税合计（大写）：<span className="text-ink-1">{rmbUpper(calc.total)}</span>
              <br />
              校验：{money(subtotal)} × 6% = {money(calc.taxAmount)}
              {Math.abs(calc.taxAmount - round2(subtotal * VAT_RATE)) < 0.005 ? (
                <span className="ml-2 text-success">✓ 通过</span>
              ) : (
                <span className="ml-2 text-danger">✗ 税额校验失败</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="开票人"><input value={drawer} onChange={(e) => setDrawer(e.target.value)} className="h-9 w-full rounded-ctl border border-line px-3 text-sm" /></Field>
              <Field label="复核人"><input value={reviewer} onChange={(e) => setReviewer(e.target.value)} className="h-9 w-full rounded-ctl border border-line px-3 text-sm" /></Field>
              <Field label="收款人"><input value={payee} onChange={(e) => setPayee(e.target.value)} className="h-9 w-full rounded-ctl border border-line px-3 text-sm" /></Field>
            </div>

            <div className="flex items-center justify-between border-t border-line pt-4">
              <div className="text-2xs text-ink-3">
                已选 <span className="num text-ink-1">{selectedBills.length}</span> 张账单，价税合计{' '}
                <span className="num font-medium text-ink-1">{money(calc.total)}</span>
              </div>
              <Button
                variant="primary"
                icon={<FileText size={14} />}
                disabled={selectedBills.length === 0}
                onClick={() => {
                  const b = selectedBills[0];
                  const tenant = TENANTS.find((t) => t.id === b.tenantId)!;
                  applyInvoice({
                    id: `INV-${Math.floor(Math.random() * 9000 + 1000)}`,
                    invoiceNo: '-',
                    invoiceCode: '-',
                    tenantId: b.tenantId,
                    billIds: picked,
                    period: b.period,
                    title: tenant.name,
                    taxNo: tenant.taxNo,
                    address: tenant.address,
                    bankName: `${tenant.bankName} ${tenant.bankAccount}`,
                    itemName: '信息技术服务*数据服务费',
                    taxRate: VAT_RATE,
                    amount: subtotal,
                    taxAmount: calc.taxAmount,
                    total: calc.total,
                    type: 'special',
                    status: 'pending',
                    issuedAt: null,
                    issuedBy: drawer,
                    payee,
                    reviewer,
                    drawer,
                  });
                  toast(`开票申请已提交，金额 ${money(calc.total)}，3 个工作日内开具`);
                  navigate('/finance/invoices');
                }}
              >
                确认开具
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================= 回款与应收 ================= */
export function Receivables() {
  const bills = useAppStore((s) => s.bills);
  const markSettled = useAppStore((s) => s.markSettled);
  const toast = useUIStore((s) => s.toast);
  const [kw, setKw] = useState('');

  const receivableBills = bills.filter((b) => b.status === 'invoiced');
  const rows = PAYMENTS.filter((p) => !kw || p.billNo.includes(kw) || (TNAME[p.tenantId] ?? '').includes(kw));

  const columns: Column<(typeof PAYMENTS)[number]>[] = [
    { key: 'paidAt', title: '到账日期', width: 120, render: (r) => <span className="num text-xs">{r.paidAt.slice(0, 10)}</span> },
    { key: 'tenantId', title: '客户', width: 140, render: (r) => <span className="text-xs">{TNAME[r.tenantId] ?? r.tenantId}</span> },
    { key: 'billNo', title: '关联账单', width: 150, render: (r) => <span className="num text-xs text-ink-2">{r.billNo}</span> },
    { key: 'serialNo', title: '银行流水号', width: 190, render: (r) => <span className="font-mono text-2xs text-ink-2">{r.serialNo}</span> },
    { key: 'method', title: '方式', width: 110, render: (r) => <Badge tone="gray">{r.method === 'transfer' ? '银行转账' : r.method === 'acceptance' ? '承兑汇票' : '冲抵'}</Badge> },
    { key: 'amount', title: '金额', width: 140, align: 'right', render: (r) => <span className="num font-medium">{money(r.amount)}</span> },
    { key: 'status', title: '核销', width: 90, render: () => <Badge tone="green">已核销</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="回款与应收"
        desc="登记银行到账并核销对应账单；账龄超过 90 天自动标记催收"
        actions={
          <Button icon={<Download size={14} />} onClick={() => toast('回款明细已导出', 'info')}>
            导出
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="应收余额" value={money(receivableBills.reduce((a, b) => a + b.total, 0))} hint={`${receivableBills.length} 张账单`} tone="warning" />
        <StatCard label="本月回款" value={money(PAYMENTS.filter((p) => p.paidAt >= '2026-10-01').reduce((a, p) => a + p.amount, 0))} tone="success" />
        <StatCard label="逾期金额" value={money(62480)} hint="1 家客户超 90 天" />
        <StatCard label="平均回款周期" value="28" unit="天" hint="合同约定 30 天" tone="primary" />
      </div>

      <Card className="mb-4">
        <CardHeader title="待核销回款" desc="银行已到账但尚未核销的款项" />
        <div className="mt-3 space-y-2">
          {receivableBills.length === 0 && (
            <div className="py-6 text-center text-xs text-ink-3">当前没有待核销账单</div>
          )}
          {receivableBills.slice(0, 5).map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-ctl border border-line px-3.5 py-3">
              <Wallet size={15} className="text-ink-3" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-ink-1">{TNAME[b.tenantId] ?? b.tenantId}</div>
                <div className="num mt-0.5 text-2xs text-ink-3">
                  {b.billNo} ｜ {b.period}
                </div>
              </div>
              <span className="num text-sm font-medium text-ink-1">{money(b.total)}</span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  markSettled(b.id, 'PAY-NEW');
                  toast(`${b.billNo} 已完成回款核销`);
                }}
              >
                核销
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card pad={false}>
        <div className="p-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 笔</span>}>
            <SearchInput value={kw} onChange={setKw} placeholder="搜索账单号或客户" className="w-64" />
          </FilterBar>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={10} emptyTitle="暂无回款记录" />
      </Card>
    </div>
  );
}

/* ================= 报表 ================= */
export function Reports() {
  const [tab, setTab] = useState('revenue');
  const bills = useAppStore((s) => s.bills);

  const byPeriod = PERIODS.map((p) => {
    const list = bills.filter((b) => b.period === p);
    return {
      period: p,
      net: round2(list.reduce((a, b) => a + b.netAmount, 0)),
      tax: round2(list.reduce((a, b) => a + b.taxAmount, 0)),
      total: round2(list.reduce((a, b) => a + b.total, 0)),
      customers: list.length,
    };
  });

  const byCustomer = TENANTS.map((t) => {
    const list = bills.filter((b) => b.tenantId === t.id);
    return {
      name: t.shortName,
      net: round2(list.reduce((a, b) => a + b.netAmount, 0)),
      growth: 0,
    };
  }).sort((a, b) => b.net - a.net);

  const catMap = new Map<ServiceCategory, number>();
  bills.filter((b) => b.status !== 'draft').forEach((b) => {
    itemsOf(b.id).forEach((i) => catMap.set(i.category, (catMap.get(i.category) ?? 0) + i.amount));
  });
  const catData = Array.from(catMap.entries()).map(([k, v]) => ({ name: CATEGORY_LABEL[k], value: round2(v) }));

  return (
    <div>
      <PageHeader
        title="经营报表"
        desc="收入、税负与客户贡献度三类报表，数据来源于已出账账单"
        actions={
          <Button icon={<Download size={14} />} onClick={() => console.log('export')}>
            导出 Excel
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="累计确认收入" value={money(byPeriod.reduce((a, p) => a + p.net, 0))} hint="不含税" tone="primary" />
        <StatCard label="累计销项税额" value={money(byPeriod.reduce((a, p) => a + p.tax, 0))} hint="税率 6%" />
        <StatCard label="价税合计" value={money(byPeriod.reduce((a, p) => a + p.total, 0))} />
        <StatCard label="客户贡献集中度" value="62.4" unit="%" hint="Top3 客户占比" tone="warning" />
      </div>

      <Card pad={false} className="mb-4">
        <div className="px-4 pt-2">
          <Tabs
            tabs={[
              { key: 'revenue', label: '收入报表' },
              { key: 'tax', label: '税负报表' },
              { key: 'customer', label: '客户贡献度' },
              { key: 'category', label: '服务结构' },
            ]}
            active={tab}
            onChange={setTab}
            className="mb-3"
          />
        </div>

        <div className="p-4">
          {tab === 'revenue' && (
            <>
              <TrendArea
                data={byPeriod.map((p) => ({ period: p.period, net: p.net }))}
                xKey="period"
                yKey="net"
                height={250}
                name="不含税收入"
              />
              <div className="mt-4 overflow-hidden rounded-ctl border border-line">
                <table className="w-full text-xs">
                  <thead className="bg-[#F9FAFB] text-ink-2">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">账期</th>
                      <th className="px-3 py-2 text-right font-medium">客户数</th>
                      <th className="px-3 py-2 text-right font-medium">不含税收入</th>
                      <th className="px-3 py-2 text-right font-medium">税额（6%）</th>
                      <th className="px-3 py-2 text-right font-medium">价税合计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byPeriod.map((p) => (
                      <tr key={p.period} className="border-t border-line">
                        <td className="num px-3 py-2">{p.period}</td>
                        <td className="num px-3 py-2 text-right text-ink-2">{p.customers}</td>
                        <td className="num px-3 py-2 text-right">{money(p.net)}</td>
                        <td className="num px-3 py-2 text-right text-ink-2">{money(p.tax)}</td>
                        <td className="num px-3 py-2 text-right font-medium">{money(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-line bg-[#FCFCFD]">
                      <td className="px-3 py-2 font-medium text-ink-1">合计</td>
                      <td className="num px-3 py-2 text-right text-ink-2">—</td>
                      <td className="num px-3 py-2 text-right font-semibold text-primary">{money(byPeriod.reduce((a, p) => a + p.net, 0))}</td>
                      <td className="num px-3 py-2 text-right text-ink-1">{money(byPeriod.reduce((a, p) => a + p.tax, 0))}</td>
                      <td className="num px-3 py-2 text-right font-semibold">{money(byPeriod.reduce((a, p) => a + p.total, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {tab === 'tax' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['不含税销售额', money(byPeriod.reduce((a, p) => a + p.net, 0))],
                  ['销项税额（6%）', money(byPeriod.reduce((a, p) => a + p.tax, 0))],
                  ['价税合计', money(byPeriod.reduce((a, p) => a + p.total, 0))],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-ctl bg-[#F9FAFB] px-3.5 py-3">
                    <div className="text-2xs text-ink-3">{k}</div>
                    <div className="num mt-1 text-base font-semibold text-ink-1">{v}</div>
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-ctl border border-line">
                <table className="w-full text-xs">
                  <thead className="bg-[#F9FAFB] text-ink-2">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">账期</th>
                      <th className="px-3 py-2 text-left font-medium">开票品目</th>
                      <th className="px-3 py-2 text-right font-medium">不含税</th>
                      <th className="px-3 py-2 text-right font-medium">税率</th>
                      <th className="px-3 py-2 text-right font-medium">销项税额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byPeriod.map((p) => (
                      <tr key={p.period} className="border-t border-line">
                        <td className="num px-3 py-2">{p.period}</td>
                        <td className="px-3 py-2 text-ink-2">信息技术服务*数据服务费</td>
                        <td className="num px-3 py-2 text-right">{money(p.net)}</td>
                        <td className="num px-3 py-2 text-right text-ink-2">6%</td>
                        <td className="num px-3 py-2 text-right font-medium">{money(p.tax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-ctl bg-[#F9FAFB] px-3.5 py-2.5 text-2xs leading-relaxed text-ink-3">
                说明：信息技术服务适用 6% 增值税税率。上述销项税额为按账单金额计算的应开票税额，
                实际抵扣情况需以发票开具与客户认证结果为准。
              </div>
            </div>
          )}

          {tab === 'customer' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-medium text-ink-1">客户收入排行（累计不含税）</div>
                <BarChartH data={byCustomer.slice(0, 8)} labelKey="name" valueKey="net" height={300} />
              </div>
              <div className="overflow-hidden rounded-ctl border border-line">
                <table className="w-full text-xs">
                  <thead className="bg-[#F9FAFB] text-ink-2">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">客户</th>
                      <th className="px-3 py-2 text-right font-medium">累计收入</th>
                      <th className="px-3 py-2 text-right font-medium">占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCustomer.slice(0, 10).map((c) => {
                      const totalNet = byCustomer.reduce((a, x) => a + x.net, 0);
                      return (
                        <tr key={c.name} className="border-t border-line">
                          <td className="px-3 py-2">{c.name}</td>
                          <td className="num px-3 py-2 text-right">{money(c.net)}</td>
                          <td className="num px-3 py-2 text-right text-ink-2">{((c.net / totalNet) * 100).toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'category' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <Donut data={catData} height={260} centerLabel="累计" centerValue={money(catData.reduce((a, x) => a + x.value, 0))} />
              </div>
              <div className="space-y-3 pt-4">
                {catData.map((c) => {
                  const total = catData.reduce((a, x) => a + x.value, 0);
                  return (
                    <div key={c.name}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-ink-2">{c.name}</span>
                        <span className="num text-ink-1">
                          {money(c.value)}
                          <span className="ml-2 text-ink-3">{((c.value / total) * 100).toFixed(1)}%</span>
                        </span>
                      </div>
                      <Progress value={(c.value / total) * 100} height={4} />
                    </div>
                  );
                })}
                <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2.5 text-2xs leading-relaxed text-ink-3">
                  算力资源为标准化转售，毛利率约 32%；数据处理与智能匹配为自研能力，毛利率可达 78%，
                  建议在客户结构中提升后两者占比。
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
