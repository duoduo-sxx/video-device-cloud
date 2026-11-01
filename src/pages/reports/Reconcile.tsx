import { ArrowLeftRight, CircleCheck, TriangleAlert } from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { RECONCILE } from '@/mocks/insights';
import { PLATFORM_MAP } from '@/mocks/platforms';
import { totalMetrics, CURRENT_PERIOD, metricsOfPlatform } from '@/mocks/daily';
import type { ReconcileRow } from '@/types';
import { num, pct, wan } from '@/lib/format';

const TOTAL = totalMetrics(CURRENT_PERIOD);

export default function Reconcile() {
  const platformSpend = RECONCILE.reduce((s, r) => s + r.platformSpend, 0);
  const ourSpend = RECONCILE.reduce((s, r) => s + r.ourSpend, 0);
  const platformConv = RECONCILE.reduce((s, r) => s + r.platformConv, 0);
  const ourConv = RECONCILE.reduce((s, r) => s + r.ourConv, 0);
  const spendDiff = platformSpend - ourSpend;

  const columns: Column<ReconcileRow>[] = [
    {
      key: 'platform',
      title: '平台',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: PLATFORM_MAP[r.platform].color }} />
          <div>
            <div className="text-xs font-medium text-ink-1">{PLATFORM_MAP[r.platform].name}</div>
            <div className="text-2xs text-ink-3">{r.accountCount} 个账户</div>
          </div>
        </div>
      ),
    },
    {
      key: 'platformSpend',
      title: '平台后台消耗',
      align: 'right',
      render: (r) => <span className="num text-xs text-ink-2">{wan(r.platformSpend)}</span>,
    },
    {
      key: 'ourSpend',
      title: '我方采集消耗',
      align: 'right',
      render: (r) => <span className="num text-xs text-ink-1">{wan(r.ourSpend)}</span>,
    },
    {
      key: 'diff',
      title: '差异率',
      align: 'right',
      render: (r) => (
        <span className={`num text-xs font-medium ${Math.abs(r.diffRate) > 0.2 ? 'text-warning' : 'text-success'}`}>
          {r.diffRate > 0 ? '+' : ''}
          {r.diffRate.toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'conv',
      title: '转化（平台 / 我方）',
      align: 'right',
      render: (r) => (
        <span className="num text-xs text-ink-1">
          {num(r.platformConv)} / {num(r.ourConv)}
        </span>
      ),
    },
    { key: 'status', title: '对账结果', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'note',
      title: '差异说明',
      render: (r) => <span className="text-2xs leading-relaxed text-ink-2">{r.note}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="数据对账"
        desc="把「平台后台看到的数」和「我们自己算出来的数」摆在一起比，差异必须能被解释，否则不能用来做决策"
        breadcrumb="报表与设置 / 数据对账"
        actions={
          <>
            <Badge tone="green">{RECONCILE.filter((r) => r.status === 'matched').length} 个平台一致</Badge>
            <Badge tone="amber">{RECONCILE.filter((r) => r.status === 'diff').length} 个需说明</Badge>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="平台后台消耗合计"
          value={wan(platformSpend)}
          unit="元"
          hint="各平台报表直接汇总"
        />
        <StatCard
          label="我方采集消耗合计"
          value={wan(ourSpend)}
          unit="元"
          hint="ODS → DWD → DWS 加工后"
          tone="primary"
        />
        <StatCard
          label="消耗差异"
          value={`${wan(Math.abs(spendDiff))}`}
          unit="元"
          hint={`差异率 ${pct(Math.abs(spendDiff) / ourSpend, 3)}`}
          tone="warning"
        />
        <StatCard
          label="转化差异"
          value={num(Math.abs(platformConv - ourConv))}
          unit="单"
          hint="主要来自腾讯支付/下单口径折算"
          tone="warning"
        />
      </div>

      <Card className="mb-4" pad={false}>
        <DataTable columns={columns} rows={RECONCILE} rowKey={(r) => r.platform} pageSize={6} />
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="对账公式与结论" desc="差异不是错误，但必须有归因" />
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-ink-2">
            <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2 font-mono text-2xs">
              我方消耗 = Σ(平台日报消耗) × (1 + 返点调整) − 跨月冲正
              <br />
              差异率 = (平台后台消耗 − 我方采集消耗) / 我方采集消耗
            </div>
            <p>
              本次对账中，{RECONCILE.filter((r) => r.status === 'matched').length} 个平台差异在 0.2% 以内，属于正常波动；
              腾讯广告差异 0.31% 是因为其「转化」默认回传支付口径，我们在 DWD 层按 1.035 系数折算为下单，
              因此我方转化数比平台后台高 3.5%，属于<b className="text-ink-1">已知且已解释</b>的差异。
            </p>
            <p className="text-2xs text-ink-3">
              快手消耗差异 -0.12% 来自跨小时扣费归属；B站因第三方回传延迟 6 小时，T+1 上午的对账会持续小幅变动，属正常现象。
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="对账自检" desc="上线前必过的三道检查" />
          <div className="mt-3 space-y-2.5 text-xs">
            {[
              { label: 'Σ账户 = Σ计划', ok: true, note: '账户汇总与计划明细完全一致' },
              { label: 'Σ平台 = 总览合计', ok: true, note: `合计 ${wan(TOTAL.spend)} 元` },
              { label: '差异率 < 0.5%', ok: Math.abs(spendDiff) / ourSpend < 0.005, note: `实际 ${pct(Math.abs(spendDiff) / ourSpend, 3)}` },
              { label: '归因总量 = 转化总量', ok: true, note: '5 个模型均等于总转化' },
            ].map((c) => (
              <div key={c.label} className="flex items-start justify-between gap-2 rounded-ctl border border-line px-3 py-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink-1">
                    {c.ok ? (
                      <CircleCheck size={13} className="text-success" />
                    ) : (
                      <TriangleAlert size={13} className="text-warning" />
                    )}
                    {c.label}
                  </div>
                  <div className="mt-0.5 text-2xs text-ink-3">{c.note}</div>
                </div>
                <Badge tone={c.ok ? 'green' : 'amber'}>{c.ok ? '通过' : '关注'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="分账户差异明细" desc="定位到账户级别，便于直接找平台客服核对" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-left text-2xs text-ink-3">
                <th className="pb-2 font-normal">平台</th>
                <th className="pb-2 text-right font-normal">我方消耗</th>
                <th className="pb-2 text-right font-normal">我方转化</th>
                <th className="pb-2 text-right font-normal">CPA</th>
                <th className="pb-2 text-right font-normal">ROI</th>
                <th className="pb-2 text-right font-normal">对账动作</th>
              </tr>
            </thead>
            <tbody>
              {RECONCILE.map((r) => {
                const m = metricsOfPlatform(r.platform, CURRENT_PERIOD);
                return (
                  <tr key={r.platform} className="border-b border-line/60 last:border-0">
                    <td className="py-2 text-ink-1">{PLATFORM_MAP[r.platform].name}</td>
                    <td className="num py-2 text-right text-ink-2">{wan(r.ourSpend)}</td>
                    <td className="num py-2 text-right text-ink-2">{num(r.ourConv)}</td>
                    <td className="num py-2 text-right text-ink-2">
                      ¥{(m.spend / Math.max(1, m.conversions)).toFixed(2)}
                    </td>
                    <td className="num py-2 text-right text-ink-2">{(m.gmv / m.spend).toFixed(2)}</td>
                    <td className="py-2 text-right text-2xs text-ink-3">
                      {r.status === 'matched' ? '无需处理' : '已在 DWD 层折算并记录'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-2xs text-ink-3">
          <ArrowLeftRight size={11} />
          对账结果每日 09:30 自动生成，差异超过 0.5% 会触发告警并阻断当日模型训练。
        </div>
      </Card>
    </>
  );
}
