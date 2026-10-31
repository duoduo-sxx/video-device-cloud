import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Receipt } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { FilterBar, Select } from '@/components/ui/Form';
import { useCurrentTenant } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useUIStore } from '@/store/uiStore';
import { money } from '@/lib/format';
import type { Bill } from '@/types';
import { BILL_STATUS_LABEL } from '@/types';

export default function Bills() {
  const navigate = useNavigate();
  const tenant = useCurrentTenant();
  const bills = useAppStore((s) => s.bills);
  const toast = useUIStore((s) => s.toast);
  const [status, setStatus] = useState('all');

  const rows = useMemo(
    () =>
      bills
        .filter((b) => b.tenantId === tenant.id)
        .filter((b) => status === 'all' || b.status === status)
        .sort((a, b) => (a.period < b.period ? 1 : -1)),
    [bills, tenant.id, status],
  );

  const totalPending = rows
    .filter((r) => r.status === 'pending_confirm' || r.status === 'disputed')
    .reduce((a, r) => a + r.total, 0);

  const columns: Column<Bill>[] = [
    { key: 'period', title: '账期', width: 100, render: (r) => <span className="num font-medium">{r.period}</span> },
    { key: 'billNo', title: '账单号', width: 150, render: (r) => <span className="num text-ink-2">{r.billNo}</span> },
    { key: 'netAmount', title: '不含税金额', width: 130, align: 'right', sortable: true, sorter: (a, b) => a.netAmount - b.netAmount, render: (r) => <span className="num">{money(r.netAmount)}</span> },
    { key: 'taxAmount', title: '税额（6%）', width: 120, align: 'right', render: (r) => <span className="num text-ink-2">{money(r.taxAmount)}</span> },
    { key: 'total', title: '价税合计', width: 140, align: 'right', sortable: true, sorter: (a, b) => a.total - b.total, render: (r) => <span className="num font-medium">{money(r.total)}</span> },
    { key: 'itemCount', title: '明细项', width: 80, align: 'right', render: (r) => <span className="num text-ink-2">{r.itemCount}</span> },
    { key: 'status', title: '状态', width: 100, render: (r) => <StatusBadge status={r.status} label={BILL_STATUS_LABEL[r.status]} /> },
    {
      key: 'op',
      title: '操作',
      width: 130,
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs text-primary hover:text-primary-hover" onClick={() => navigate(`/console/billing/bills/${r.id}`)}>
            查看
          </button>
          <button
            className="text-xs text-ink-2 hover:text-ink-1"
            onClick={() => toast(`账单 ${r.billNo} 已生成 PDF（演示环境不产生真实文件）`, 'info')}
          >
            下载
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="账单与发票"
        desc={`${tenant.name}｜开票品目「信息技术服务」，增值税税率 6%，按月对账结算`}
        actions={
          <>
            <Button icon={<Download size={14} />} onClick={() => toast('已导出账单列表 CSV（演示）', 'info')}>
              导出
            </Button>
            <Button variant="primary" icon={<Receipt size={14} />} onClick={() => navigate('/console/billing/invoices')}>
              发票管理
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="text-xs text-ink-2">待处理账单</div>
          <div className="num mt-2 text-2xl font-semibold text-warning">{money(totalPending)}</div>
          <div className="mt-1 text-xs text-ink-3">待确认与有异议账单合计</div>
        </Card>
        <Card>
          <div className="text-xs text-ink-2">本年累计结算</div>
          <div className="num mt-2 text-2xl font-semibold text-ink-1">
            {money(rows.filter((r) => r.status === 'settled').reduce((a, r) => a + r.total, 0))}
          </div>
          <div className="mt-1 text-xs text-ink-3">含税金额，已回款</div>
        </Card>
        <Card>
          <div className="text-xs text-ink-2">结算方式</div>
          <div className="mt-2 text-sm font-medium text-ink-1">自然月对账 · 次月 5 日前确认</div>
          <div className="mt-1 text-xs text-ink-3">确认后 3 个工作日内开具 6% 增值税专用发票</div>
        </Card>
      </div>

      <Card pad={false}>
        <div className="px-4 pt-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 个账期</span>}>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
              <option value="all">全部状态</option>
              {Object.entries(BILL_STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </FilterBar>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={12}
          onRowClick={(r) => navigate(`/console/billing/bills/${r.id}`)}
          emptyTitle="暂无账单"
          emptyDesc="当前筛选条件下没有账单记录"
        />
      </Card>

      <div className="mt-4 rounded-card border border-line bg-white px-5 py-4">
        <div className="text-xs font-medium text-ink-1">开票须知</div>
        <ul className="mt-2 space-y-1 text-2xs leading-relaxed text-ink-3">
          <li>· 我司为增值税一般纳税人，可开具税率 6% 的增值税专用发票，开票品目为「信息技术服务」。</li>
          <li>· 账单需在控制台完成确认后方可提交开票申请；如有异议请先提交异议，财务将进行调账处理。</li>
          <li>· 发票将于申请提交后 3 个工作日内开具，电子发票可在此页面直接下载。</li>
          <li>
            · 如需变更发票抬头或税号，请先前往
            <Link to="/console/settings/company" className="link mx-1">
              企业信息
            </Link>
            更新，已开具的发票需办理红冲后重开。
          </li>
        </ul>
      </div>
    </div>
  );
}
