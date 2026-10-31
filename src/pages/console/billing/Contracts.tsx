import { useState } from 'react';
import { Download, FileSignature, FileText, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Overlay';
import { useCurrentTenant } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { CONTRACTS } from '@/mocks/misc';
import { money } from '@/lib/format';
import type { Contract } from '@/types';

export default function Contracts() {
  const tenant = useCurrentTenant();
  const toast = useUIStore((s) => s.toast);
  const [detail, setDetail] = useState<Contract | null>(null);
  const rows = CONTRACTS.filter((c) => c.tenantId === tenant.id);

  const columns: Column<Contract>[] = [
    { key: 'contractNo', title: '合同编号', width: 160, render: (r) => <span className="num text-xs">{r.contractNo}</span> },
    { key: 'name', title: '合同名称', render: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: 'period',
      title: '服务期限',
      width: 200,
      render: (r) => (
        <span className="num text-xs text-ink-2">
          {r.startDate} ~ {r.endDate}
        </span>
      ),
    },
    { key: 'settlementCycle', title: '结算周期', width: 200, render: (r) => <span className="text-xs text-ink-2">{r.settlementCycle}</span> },
    { key: 'amount', title: '合同金额', width: 140, align: 'right', render: (r) => <span className="num font-medium">{money(r.amount)}</span> },
    { key: 'status', title: '状态', width: 100, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'op',
      title: '操作',
      width: 100,
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs text-primary" onClick={() => setDetail(r)}>
            查看
          </button>
          <button className="text-xs text-ink-2" onClick={() => toast('合同已下载', 'info')}>
            下载
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="合同管理"
        desc="合同约定服务范围、结算方式与 SLA，是账单与开票的依据"
        actions={
          <Button icon={<Download size={14} />} onClick={() => toast('合同清单已导出', 'info')}>
            导出
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="有效合同" value={String(rows.filter((r) => r.status === 'active').length)} unit="份" hint="1 份即将到期" />
        <StatCard label="合同总额" value={money(rows.reduce((a, r) => a + r.amount, 0))} hint="含框架协议与补充协议" tone="primary" />
        <StatCard label="SLA 等级" value="99.9%" hint="P1 故障 2 小时响应" tone="success" />
      </div>

      <Card pad={false}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={8}
          onRowClick={setDetail}
          emptyTitle="暂无合同"
          emptyDesc="合同由客户成功经理录入，如有疑问请联系对接人"
        />
      </Card>

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title="合同详情"
        subtitle={detail?.contractNo}
        footer={
          <>
            <Button icon={<Download size={14} />} onClick={() => toast('合同 PDF 已下载', 'info')}>
              下载合同
            </Button>
            <Button variant="primary" onClick={() => toast('续约申请已提交客户成功经理', 'info')}>
              申请续约
            </Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-5">
            <div>
              <div className="text-base font-semibold text-ink-1">{detail.name}</div>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={detail.status} />
                <Badge tone="blue">{detail.slaLevel}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-4 text-xs">
              {[
                ['合同编号', detail.contractNo],
                ['合同金额', money(detail.amount)],
                ['开始日期', detail.startDate],
                ['结束日期', detail.endDate],
                ['结算周期', detail.settlementCycle],
                ['签约主体', tenant.name],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-ink-3">{k}</div>
                  <div className="mt-1 text-ink-1">{v}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-2 text-xs font-medium text-ink-2">合同附件</div>
              <div className="space-y-2">
                {detail.attachments.map((a) => (
                  <div key={a} className="flex items-center gap-2 rounded-ctl border border-line px-3 py-2.5">
                    <FileText size={14} className="text-ink-3" />
                    <span className="flex-1 text-xs text-ink-1">{a}</span>
                    <button className="text-xs text-primary" onClick={() => toast(`${a} 已下载`, 'info')}>
                      下载
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-ctl bg-[#F9FAFB] px-3.5 py-3 text-2xs leading-relaxed text-ink-2">
              <ShieldCheck size={12} className="mr-1 inline text-success" />
              本合同项下服务按自然月对账结算，结算金额以平台计量数据为准；
              双方确认后 5 个工作日内，乙方向甲方开具税率 6% 的增值税专用发票，品目为「信息技术服务」。
            </div>
          </div>
        )}
      </Drawer>

      <Card className="mt-4">
        <CardHeader title="结算条款摘要" desc="来自框架协议第 4 条" extra={<FileSignature size={15} className="text-ink-3" />} />
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-ink-2">
          <p>· 计费周期：自然月（每月 1 日 00:00 至月末 23:59:59），以平台计量系统记录为准。</p>
          <p>· 对账流程：次月 1 日出账，甲方于 5 个工作日内完成确认；有异议应在确认前提出。</p>
          <p>· 开票要求：甲方确认后 5 个工作日内开具增值税专用发票，税率 6%，品目「信息技术服务」。</p>
          <p>· 付款期限：收到发票后 30 个自然日内以银行转账方式支付。</p>
          <p>· 价格调整：协议期内单价不变；如遇资源成本大幅波动，双方可协商签订补充协议。</p>
        </div>
      </Card>
    </div>
  );
}
