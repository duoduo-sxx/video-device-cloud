import { Fragment, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Download, FileWarning, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Overlay';
import { Field, Select, Textarea } from '@/components/ui/Form';
import { useAppStore } from '@/store/appStore';
import { useCurrentTenant } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { itemsOf } from '@/mocks/bills';
import { calcBill, VAT_RATE } from '@/lib/calc';
import { money, num } from '@/lib/format';
import { BILL_STATUS_LABEL, CATEGORY_LABEL, type ServiceCategory } from '@/types';

const ORDER: ServiceCategory[] = ['compute', 'model', 'data', 'match', 'generate', 'subscription'];

export default function BillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tenant = useCurrentTenant();
  const bills = useAppStore((s) => s.bills);
  const confirmBill = useAppStore((s) => s.confirmBill);
  const disputeBill = useAppStore((s) => s.disputeBill);
  const toast = useUIStore((s) => s.toast);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState('用量与实际调用不符');
  const [note, setNote] = useState('');

  const bill = bills.find((b) => b.id === id);
  const items = useMemo(() => (bill ? itemsOf(bill.id) : []), [bill]);

  if (!bill) {
    return (
      <div className="py-20 text-center text-sm text-ink-2">
        账单不存在，<Link to="/console/billing/bills" className="link">返回列表</Link>
      </div>
    );
  }

  const groups = ORDER.map((cat) => {
    const rows = items.filter((i) => i.category === cat);
    return { cat, rows, subtotal: rows.reduce((a, r) => a + r.amount, 0) };
  }).filter((g) => g.rows.length > 0);

  const detailSum = items.reduce((a, r) => a + r.amount, 0);
  const check = calcBill({ subtotal: bill.subtotal, discount: bill.discount, taxRate: VAT_RATE });
  const balanced = Math.abs(detailSum - bill.netAmount) < 0.005 && Math.abs(check.taxAmount - bill.taxAmount) < 0.005;

  const canConfirm = bill.status === 'pending_confirm' || bill.status === 'disputed';

  return (
    <div className="pb-20">
      <div className="mb-4">
        <button
          onClick={() => navigate('/console/billing/bills')}
          className="mb-3 inline-flex items-center gap-1 text-xs text-ink-2 hover:text-ink-1"
        >
          <ArrowLeft size={13} /> 返回账单列表
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="num text-xl font-semibold text-ink-1">账单 {bill.billNo}</h1>
              <StatusBadge status={bill.status} label={BILL_STATUS_LABEL[bill.status]} />
              {balanced && (
                <Badge tone="green" className="gap-1">
                  <ShieldCheck size={11} /> 明细已勾稽
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-sm text-ink-2">
              账期 {bill.period} ｜ 生成于 {bill.generatedAt.slice(0, 16).replace('T', ' ')}
              {bill.confirmedAt && ` ｜ 确认于 ${bill.confirmedAt.slice(0, 16).replace('T', ' ')}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink-3">价税合计</div>
            <div className="num mt-1 text-3xl font-semibold text-primary">{money(bill.total)}</div>
            <div className="num mt-1 text-xs text-ink-3">
              不含税 {money(bill.netAmount)} + 税额 {money(bill.taxAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* 结算信息 */}
      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
          {[
            ['购方名称', tenant.name],
            ['纳税人识别号', tenant.taxNo],
            ['开票品目', '信息技术服务*数据服务费'],
            ['税率', '6%（信息技术服务法定税率）'],
            ['开户行及账号', `${tenant.bankName}　${tenant.bankAccount}`],
            ['地址及电话', `${tenant.address}　${tenant.phone}`],
            ['结算周期', '自然月对账，次月 5 日前确认'],
            ['付款方式', '银行转账 / 银行承兑汇票'],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs text-ink-3">{k}</div>
              <div className="mt-1 text-sm leading-relaxed text-ink-1">{v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 明细 */}
      <Card pad={false}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <div className="text-sm font-semibold text-ink-1">费用明细</div>
            <div className="mt-0.5 text-xs text-ink-3">
              共 {items.length} 项，按服务类别分组；金额均为不含税价
            </div>
          </div>
          <Badge tone="gray">账期 {bill.period}</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] text-xs text-ink-2">
                <th className="w-12 px-4 py-2.5 text-left font-medium">序号</th>
                <th className="px-3 py-2.5 text-left font-medium">服务项</th>
                <th className="w-24 px-3 py-2.5 text-left font-medium">计费方式</th>
                <th className="w-28 px-3 py-2.5 text-right font-medium">用量</th>
                <th className="w-20 px-3 py-2.5 text-left font-medium">单位</th>
                <th className="w-28 px-3 py-2.5 text-right font-medium">单价（元）</th>
                <th className="w-32 px-3 py-2.5 text-right font-medium">金额（元）</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.cat}>
                  <tr className="bg-[#FCFCFD]">
                    <td colSpan={7} className="border-t border-line px-4 py-2 text-xs font-medium text-ink-2">
                      {CATEGORY_LABEL[g.cat]}
                      <span className="num ml-2 font-normal text-ink-3">小计 {money(g.subtotal)}</span>
                    </td>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.id} className="hover:bg-[#FCFCFD]">
                      <td className="num border-t border-line px-4 py-2.5 text-xs text-ink-3">{r.seq}</td>
                      <td className="border-t border-line px-3 py-2.5 text-ink-1">{r.serviceName}</td>
                      <td className="border-t border-line px-3 py-2.5 text-xs text-ink-2">{r.billingMode}</td>
                      <td className="num border-t border-line px-3 py-2.5 text-right text-ink-1">{num(r.quantity)}</td>
                      <td className="border-t border-line px-3 py-2.5 text-xs text-ink-2">{r.unit}</td>
                      <td className="num border-t border-line px-3 py-2.5 text-right text-ink-2">
                        {r.unitPrice < 0.01 ? r.unitPrice.toFixed(4) : r.unitPrice.toFixed(2)}
                      </td>
                      <td className="num border-t border-line px-3 py-2.5 text-right font-medium text-ink-1">
                        {money(r.amount)}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* 汇总 */}
        <div className="flex justify-end border-t border-line px-5 py-5">
          <div className="w-full max-w-sm space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-2">明细合计</span>
              <span className="num text-ink-1">{money(detailSum)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-2">折扣优惠</span>
              <span className="num text-ink-1">{bill.discount === 0 ? '-¥0.00' : `-${money(bill.discount)}`}</span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2">
              <span className="text-ink-2">不含税金额</span>
              <span className="num text-ink-1">{money(bill.netAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-2">增值税（税率 6%）</span>
              <span className="num text-ink-1">{money(bill.taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2.5">
              <span className="font-medium text-ink-1">价税合计</span>
              <span className="num text-xl font-semibold text-primary">{money(bill.total)}</span>
            </div>
            {!balanced && (
              <div className="flex items-start gap-1.5 rounded-ctl bg-danger-soft px-2.5 py-2 text-2xs text-danger">
                <FileWarning size={13} className="mt-0.5 shrink-0" />
                明细合计与账单金额存在差异，请联系客户成功经理核对。
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 底部操作条 */}
      <div className="sticky bottom-0 z-20 mt-4 flex items-center justify-between rounded-card border border-line bg-white px-5 py-3 shadow-card">
        <div className="flex items-center gap-2 text-xs text-ink-3">
          <ShieldCheck size={14} className="text-success" />
          {bill.status === 'settled'
            ? `已于 ${bill.paidAt?.slice(0, 10)} 完成回款核销`
            : bill.status === 'invoiced'
              ? '发票已开具，等待回款核销'
              : bill.status === 'confirmed'
                ? '账单已确认，可在发票管理中申请开票'
                : '确认后账单金额将进入开票流程，不可再修改'}
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<Download size={14} />} onClick={() => toast('账单 PDF 已生成（演示环境）', 'info')}>
            下载账单
          </Button>
          <Button
            icon={<FileWarning size={14} />}
            onClick={() => setDisputeOpen(true)}
            disabled={!canConfirm}
          >
            提交异议
          </Button>
          <Button
            variant="primary"
            icon={<Check size={14} />}
            disabled={!canConfirm}
            onClick={() => {
              confirmBill(bill.id);
              toast(`账单 ${bill.billNo} 已确认，可前往发票管理申请开票`);
            }}
          >
            {bill.status === 'disputed' ? '重新确认账单' : '确认账单'}
          </Button>
        </div>
      </div>

      <Modal
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        title="提交账单异议"
        subtitle={`账单 ${bill.billNo} ｜ 账期 ${bill.period}`}
        footer={
          <>
            <Button onClick={() => setDisputeOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                disputeBill(bill.id);
                setDisputeOpen(false);
                toast('异议已提交，财务将在 2 个工作日内处理', 'info');
              }}
            >
              确认提交
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="异议类型" required>
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option>用量与实际调用不符</option>
              <option>单价与合同约定不符</option>
              <option>服务未实际交付</option>
              <option>重复计费</option>
              <option>其他</option>
            </Select>
          </Field>
          <Field label="差异金额（元）" hint="留空表示金额待核对">
            <input
              className="h-9 w-full rounded-ctl border border-line px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
              placeholder="例如 1240.00"
            />
          </Field>
          <Field label="问题说明" required hint="请尽量描述具体服务项与时间段，便于财务快速定位">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：9 月 12 日至 14 日期间 A100 实例处于停止状态，但账单中仍计入了 72 卡·时的预留费用。"
            />
          </Field>
          <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2.5 text-2xs leading-relaxed text-ink-3">
            提交后账单状态将变更为「有异议」，财务会在 2 个工作日内完成核查并给出调账方案，确认前不计入开票池。
          </div>
        </div>
      </Modal>
    </div>
  );
}
