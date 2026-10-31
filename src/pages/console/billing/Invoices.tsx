import { Download, FileText, Plus, Printer } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { FilterBar, Select } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';
import { useAppStore } from '@/store/appStore';
import { useCurrentTenant } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { money, num } from '@/lib/format';
import { rmbUpper } from '@/lib/calc';
import { INVOICE_STATUS_LABEL, type Invoice } from '@/types';
import { useState } from 'react';

/* ---------------- 增值税专用发票版式 ---------------- */
export function InvoicePreview({ inv }: { inv: Invoice }) {
  const isSpecial = inv.type === 'special';
  return (
    <div className="mx-auto w-full max-w-[760px] bg-white">
      <div className="invoice-strip h-2 w-full rounded-t-sm" />
      <div className="border-x border-b border-[#C9D3E4] px-6 pb-6 pt-4">
        {/* 抬头 */}
        <div className="mb-1 flex items-center justify-between text-2xs text-[#5B6B85]">
          <span>发票代码：{inv.invoiceCode}</span>
          <span className="num">发票号码：{inv.invoiceNo}</span>
        </div>
        <div className="flex items-center justify-between border-b border-dashed border-[#C9D3E4] pb-2">
          <span className="text-2xs text-[#5B6B85]">开票日期：{inv.issuedAt?.slice(0, 10) ?? '—'}</span>
          <span className="text-2xs text-[#5B6B85]">校验码：0938 2716 4402 8817</span>
        </div>

        <h2 className="my-4 text-center text-[19px] font-semibold tracking-[0.35em] text-[#1B3A6B]">
          {isSpecial ? '增值税专用发票' : '增值税普通发票'}
        </h2>
        <div className="mb-3 text-center text-2xs tracking-wide text-[#7B8AA3]">
          {isSpecial ? '（发票联）' : '（电子普通发票）'}
        </div>

        {/* 购方 / 密码区 */}
        <div className="grid grid-cols-[1.35fr_1fr] border border-[#C9D3E4] text-[11px]">
          <div className="border-r border-[#C9D3E4]">
            <div className="border-b border-[#C9D3E4] bg-[#F7F9FC] px-2 py-1 text-[#5B6B85]">购买方</div>
            <RowKV k="名　　称" v={inv.title} />
            <RowKV k="纳税人识别号" v={inv.taxNo} />
            <RowKV k="地址、电话" v={inv.address} small />
            <RowKV k="开户行及账号" v={inv.bankName} small />
          </div>
          <div className="flex flex-col">
            <div className="border-b border-[#C9D3E4] bg-[#F7F9FC] px-2 py-1 text-[#5B6B85]">密码区</div>
            <div className="flex-1 px-2 py-2 font-mono text-[10px] leading-[1.7] tracking-tight text-[#7B8AA3]">
              01&lt;8&gt;93+2/-&lt;*4&gt;19
              <br />
              04-6+&lt;7&gt;*1/2&gt;8&lt;3
              <br />
              5&lt;0&gt;2+9-*&lt;4&gt;6/7
              <br />
              8&gt;*1&lt;3+5-2&gt;&lt;9&gt;
            </div>
          </div>
        </div>

        {/* 明细 */}
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#F7F9FC] text-[#5B6B85]">
              <th className="border border-[#C9D3E4] px-1.5 py-1.5 text-left font-normal">货物或应税劳务、服务名称</th>
              <th className="border border-[#C9D3E4] px-1.5 py-1.5 font-normal" style={{ width: 60 }}>
                规格型号
              </th>
              <th className="border border-[#C9D3E4] px-1.5 py-1.5 font-normal" style={{ width: 44 }}>
                单位
              </th>
              <th className="border border-[#C9D3E4] px-1.5 py-1.5 font-normal" style={{ width: 52 }}>
                数量
              </th>
              <th className="border border-[#C9D3E4] px-1.5 py-1.5 font-normal" style={{ width: 76 }}>
                单价
              </th>
              <th className="border border-[#C9D3E4] px-1.5 py-1.5 text-right font-normal" style={{ width: 88 }}>
                金额
              </th>
              <th className="border border-[#C9D3E4] px-1.5 py-1.5 font-normal" style={{ width: 54 }}>
                税率
              </th>
              <th className="border border-[#C9D3E4] px-1.5 py-1.5 text-right font-normal" style={{ width: 82 }}>
                税额
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[#C9D3E4] px-1.5 py-2.5 text-[#1B3A6B]">{inv.itemName}</td>
              <td className="border border-[#C9D3E4] px-1.5 py-2.5 text-center text-[#7B8AA3]">—</td>
              <td className="border border-[#C9D3E4] px-1.5 py-2.5 text-center">项</td>
              <td className="num border border-[#C9D3E4] px-1.5 py-2.5 text-center">1</td>
              <td className="num border border-[#C9D3E4] px-1.5 py-2.5 text-right">{num(inv.amount)}</td>
              <td className="num border border-[#C9D3E4] px-1.5 py-2.5 text-right">{num(inv.amount)}</td>
              <td className="num border border-[#C9D3E4] px-1.5 py-2.5 text-center">6%</td>
              <td className="num border border-[#C9D3E4] px-1.5 py-2.5 text-right">{num(inv.taxAmount)}</td>
            </tr>
            <tr className="text-[#5B6B85]">
              <td className="border border-[#C9D3E4] px-1.5 py-1.5" colSpan={5}>
                合计
              </td>
              <td className="num border border-[#C9D3E4] px-1.5 py-1.5 text-right">{num(inv.amount)}</td>
              <td className="border border-[#C9D3E4] px-1.5 py-1.5" />
              <td className="num border border-[#C9D3E4] px-1.5 py-1.5 text-right">{num(inv.taxAmount)}</td>
            </tr>
            <tr>
              <td className="border border-[#C9D3E4] px-1.5 py-2 text-[#5B6B85]" colSpan={2}>
                价税合计（大写）
              </td>
              <td className="border border-[#C9D3E4] px-1.5 py-2 text-[#1B3A6B]" colSpan={4}>
                {rmbUpper(inv.total)}
              </td>
              <td className="border border-[#C9D3E4] px-1.5 py-1 text-center text-[#5B6B85]" colSpan={2}>
                （小写）<span className="num ml-1 font-medium text-[#1B3A6B]">¥{num(inv.total)}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 销方 */}
        <div className="border border-t-0 border-[#C9D3E4] text-[11px]">
          <div className="grid grid-cols-[1.35fr_1fr]">
            <div className="border-r border-[#C9D3E4]">
              <div className="border-b border-[#C9D3E4] bg-[#F7F9FC] px-2 py-1 text-[#5B6B85]">销售方</div>
              <RowKV k="名　　称" v="云枢智能科技有限公司" />
              <RowKV k="纳税人识别号" v="91110105MA01D8XK7P" />
              <RowKV k="地址、电话" v="北京市朝阳区望京东路 6 号 5 层　010-8472 6688" small />
              <RowKV k="开户行及账号" v="中国建设银行北京望京支行 1100 1042 4000 5301" small />
            </div>
            <div className="flex flex-col">
              <div className="border-b border-[#C9D3E4] bg-[#F7F9FC] px-2 py-1 text-[#5B6B85]">备注</div>
              <div className="flex-1 px-2 py-2 text-[10px] leading-relaxed text-[#5B6B85]">
                账期 {inv.period}
                <br />
                技术服务期间：{inv.period}-01 至 {inv.period}-末
                <br />
                合同编号：YS-HT-2026-0012
              </div>
            </div>
          </div>
        </div>

        {/* 签章 */}
        <div className="mt-3 flex items-end justify-between text-[11px] text-[#5B6B85]">
          <div className="space-y-1.5">
            <div>收款人：{inv.payee}</div>
            <div>复核：{inv.reviewer}</div>
          </div>
          <div className="space-y-1.5">
            <div>开票人：{inv.drawer}</div>
            <div>销售方：（章）</div>
          </div>
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#C0392B]/40 text-center text-[8px] leading-tight text-[#C0392B]/60">
            发票专用章
            <br />
            演示样张
          </div>
        </div>
      </div>
      <div className="mt-2 text-center text-2xs text-ink-3">
        本样张仅用于产品演示，不具备任何法律效力
      </div>
    </div>
  );
}

function RowKV({ k, v, small }: { k: string; v: string; small?: boolean }) {
  return (
    <div className="flex border-b border-[#C9D3E4] last:border-b-0">
      <div className="shrink-0 px-1.5 py-1.5 text-[#5B6B85]" style={{ width: 78 }}>
        {k}
      </div>
      <div className={`flex-1 px-1.5 py-1.5 text-[#1B3A6B] ${small ? 'text-[10px] leading-snug' : ''}`}>{v}</div>
    </div>
  );
}

/* ---------------- 列表页 ---------------- */
export default function Invoices() {
  const tenant = useCurrentTenant();
  const invoices = useAppStore((s) => s.invoices);
  const toast = useUIStore((s) => s.toast);
  const [tab, setTab] = useState('all');
  const [preview, setPreview] = useState<Invoice | null>(null);

  const rows = invoices
    .filter((i) => i.tenantId === tenant.id)
    .filter((i) => tab === 'all' || i.status === tab);

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNo', title: '发票号码', width: 120, render: (r) => <span className="num">{r.invoiceNo === '-' ? '—' : r.invoiceNo}</span> },
    { key: 'period', title: '关联账期', width: 100, render: (r) => <span className="num text-ink-2">{r.period}</span> },
    { key: 'title', title: '发票抬头', render: (r) => <span className="truncate">{r.title}</span> },
    { key: 'itemName', title: '开票品目', width: 190, render: (r) => <span className="text-xs text-ink-2">{r.itemName}</span> },
    { key: 'amount', title: '金额', width: 120, align: 'right', render: (r) => <span className="num">{money(r.amount)}</span> },
    { key: 'taxRate', title: '税率', width: 70, align: 'right', render: () => <span className="num">6%</span> },
    { key: 'taxAmount', title: '税额', width: 110, align: 'right', render: (r) => <span className="num text-ink-2">{money(r.taxAmount)}</span> },
    { key: 'total', title: '价税合计', width: 130, align: 'right', render: (r) => <span className="num font-medium">{money(r.total)}</span> },
    { key: 'status', title: '状态', width: 90, render: (r) => <StatusBadge status={r.status} label={INVOICE_STATUS_LABEL[r.status]} /> },
    {
      key: 'op',
      title: '操作',
      width: 120,
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs text-primary hover:text-primary-hover" onClick={() => setPreview(r)}>
            查看
          </button>
          {r.status !== 'pending' && (
            <button
              className="text-xs text-ink-2 hover:text-ink-1"
              onClick={() => toast(`发票 ${r.invoiceNo} PDF 已下载（演示环境）`, 'info')}
            >
              下载
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="发票管理"
        desc="开票品目固定为「信息技术服务」，税率 6%；账单确认后方可申请开票"
        actions={
          <>
            <Button icon={<Download size={14} />} onClick={() => toast('已导出发票台账（演示）', 'info')}>
              导出台账
            </Button>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => toast('请在「账单与发票」中先确认待确认账单，再提交开票申请', 'info')}>
              申请开票
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="text-xs text-ink-2">已开具发票</div>
          <div className="num mt-2 text-2xl font-semibold text-ink-1">
            {invoices.filter((i) => i.tenantId === tenant.id && i.status !== 'pending').length} 张
          </div>
          <div className="mt-1 text-xs text-ink-3">
            价税合计 {money(invoices.filter((i) => i.tenantId === tenant.id && i.status !== 'pending').reduce((a, i) => a + i.total, 0))}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-ink-2">本年销项税额</div>
          <div className="num mt-2 text-2xl font-semibold text-primary">
            {money(invoices.filter((i) => i.tenantId === tenant.id).reduce((a, i) => a + i.taxAmount, 0))}
          </div>
          <div className="mt-1 text-xs text-ink-3">按 6% 计算，可全额抵扣</div>
        </Card>
        <Card>
          <div className="text-xs text-ink-2">待开票申请</div>
          <div className="num mt-2 text-2xl font-semibold text-warning">
            {invoices.filter((i) => i.tenantId === tenant.id && i.status === 'pending').length} 笔
          </div>
          <div className="mt-1 text-xs text-ink-3">平均开票时效 1.8 个工作日</div>
        </Card>
      </div>

      <Card pad={false}>
        <div className="flex items-center gap-1 border-b border-line px-4">
          {[
            ['all', '全部'],
            ['pending', '待开票'],
            ['issued', '已开票'],
            ['sent', '已寄出'],
            ['void', '已作废'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`-mb-px border-b-2 px-3 py-3 text-sm transition-colors ${
                tab === k ? 'border-primary font-medium text-primary' : 'border-transparent text-ink-2 hover:text-ink-1'
              }`}
            >
              {label}
              {k === 'pending' && (
                <span className="num ml-1.5 rounded-full bg-warning-soft px-1.5 py-0.5 text-2xs text-warning">
                  {invoices.filter((i) => i.tenantId === tenant.id && i.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={10}
          onRowClick={(r) => setPreview(r)}
          emptyTitle="暂无发票记录"
          emptyDesc="账单确认后即可在此提交开票申请"
        />
      </Card>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="发票预览"
        subtitle={preview ? `${INVOICE_STATUS_LABEL[preview.status]}｜账期 ${preview.period}` : ''}
        width={820}
        footer={
          <>
            <Button icon={<Printer size={14} />} onClick={() => toast('已调用打印预览（演示）', 'info')}>
              打印
            </Button>
            <Button variant="primary" icon={<Download size={14} />} onClick={() => toast('发票已下载', 'info')}>
              下载 PDF
            </Button>
          </>
        }
      >
        {preview && <InvoicePreview inv={preview} />}
      </Modal>

      <div className="mt-4 flex items-start gap-2 rounded-card border border-line bg-white px-5 py-4">
        <FileText size={15} className="mt-0.5 shrink-0 text-ink-3" />
        <div className="text-2xs leading-relaxed text-ink-3">
          根据《营业税改征增值税试点实施办法》，信息技术服务属于现代服务，适用 6% 增值税税率。
          我司作为一般纳税人可开具增值税专用发票，购方可凭票面税额进行进项抵扣。
          发票开具后如需变更，须先申请红字发票冲销，再重新开具，请务必核对抬头、税号与开户行信息。
          <span className="ml-1">
            <Badge tone="blue">当前 3 张发票可下载</Badge>
          </span>
        </div>
      </div>
    </div>
  );
}
