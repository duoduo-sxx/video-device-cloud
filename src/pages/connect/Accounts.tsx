import { useState } from 'react';
import { ExternalLink, Link2, RefreshCw, Wallet } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { Badge, DeltaBadge, StatusBadge } from '@/components/ui/Badge';
import { Drawer, Tabs } from '@/components/ui/Overlay';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { ACCOUNTS, PLATFORMS, PLATFORM_MAP } from '@/mocks/platforms';
import { accountSummaries, CURRENT_PERIOD, PREV_PERIOD, dailyOf } from '@/mocks/daily';
import { plansOfAccount } from '@/mocks/campaigns';
import { cpa, ctr, cvr, change, roi } from '@/lib/metrics';
import { money, num, pct, wan } from '@/lib/format';
import type { AdAccount } from '@/types';
import { PLAN_STATUS_LABEL } from '@/types';

const SUMMARIES = accountSummaries(CURRENT_PERIOD);

export default function Accounts() {
  const [platform, setPlatform] = useState<string>('all');
  const [detail, setDetail] = useState<AdAccount | null>(null);

  const rows = SUMMARIES.filter((s) => platform === 'all' || s.account.platform === platform);

  const columns: Column<(typeof SUMMARIES)[number]>[] = [
    {
      key: 'name',
      title: '账户',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="h-6 w-1 rounded-full" style={{ background: PLATFORM_MAP[r.account.platform].color }} />
          <div>
            <div className="text-xs font-medium text-ink-1">{r.account.name}</div>
            <div className="num text-2xs text-ink-3">
              {r.account.id} · {r.account.advertiserId}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'platform',
      title: '平台',
      render: (r) => <span className="text-xs text-ink-2">{PLATFORM_MAP[r.account.platform].name}</span>,
    },
    {
      key: 'spend',
      title: '本月消耗',
      align: 'right',
      sorter: (a, b) => a.m.spend - b.m.spend,
      render: (r) => <span className="num text-xs text-ink-1">{wan(r.m.spend)}</span>,
    },
    {
      key: 'conversions',
      title: '下单',
      align: 'right',
      sorter: (a, b) => a.m.conversions - b.m.conversions,
      render: (r) => <span className="num text-xs text-ink-1">{num(r.m.conversions)}</span>,
    },
    {
      key: 'ctr',
      title: 'CTR',
      align: 'right',
      render: (r) => <span className="num text-xs text-ink-2">{pct(ctr(r.m), 2)}</span>,
    },
    {
      key: 'cpa',
      title: 'CPA',
      align: 'right',
      sorter: (a, b) => cpa(a.m) - cpa(b.m),
      render: (r) => <span className="num text-xs text-ink-1">¥{cpa(r.m).toFixed(2)}</span>,
    },
    {
      key: 'roi',
      title: 'ROI',
      align: 'right',
      sorter: (a, b) => roi(a.m) - roi(b.m),
      render: (r) => (
        <span className={`num text-xs font-medium ${roi(r.m) >= 3.2 ? 'text-success' : roi(r.m) >= 2.4 ? 'text-ink-1' : 'text-danger'}`}>
          {roi(r.m).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'pace',
      title: '预算使用率',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#F2F4F7]">
            <div
              className={r.pace > 1.02 ? 'h-full bg-warning' : r.pace > 0.75 ? 'h-full bg-primary' : 'h-full bg-[#98A2B3]'}
              style={{ width: `${Math.min(100, r.pace * 100)}%` }}
            />
          </div>
          <span className="num text-2xs text-ink-2">{pct(r.pace, 0)}</span>
        </div>
      ),
    },
    {
      key: 'balance',
      title: '余额',
      align: 'right',
      render: (r) => (
        <span className={`num text-xs ${r.account.balance < 10000 ? 'text-danger' : 'text-ink-1'}`}>
          {wan(r.account.balance)}
        </span>
      ),
    },
    { key: 'status', title: '状态', render: (r) => <StatusBadge status={r.account.status} /> },
    {
      key: 'sync',
      title: '最近同步',
      render: (r) => <span className="num text-2xs text-ink-3">{r.account.lastSyncAt.slice(5, 16).replace('T', ' ')}</span>,
    },
  ];

  const detailSummary = detail ? SUMMARIES.find((s) => s.account.id === detail.id) : null;
  const detailDaily = detail ? dailyOf(detail.id).slice(-7) : [];

  return (
    <>
      <PageHeader
        title="投放账户"
        desc="6 个投放平台共 12 个账户；账户是数据接入的最小单位，授权状态与余额直接决定能否正常拉数与投放"
        breadcrumb="数据接入 / 投放账户"
        actions={
          <>
            <Badge tone="green">{ACCOUNTS.filter((a) => a.status === 'active').length} 投放中</Badge>
            <Badge tone="red">{ACCOUNTS.filter((a) => a.status === 'auth_expired').length} 授权过期</Badge>
            <Badge tone="amber">{ACCOUNTS.filter((a) => a.status === 'balance_low').length} 余额预警</Badge>
          </>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { key: 'all', label: '全部平台', count: ACCOUNTS.length },
              ...PLATFORMS.map((p) => ({
                key: p.code,
                label: p.name,
                count: ACCOUNTS.filter((a) => a.platform === p.code).length,
              })),
            ]}
            active={platform}
            onChange={setPlatform}
          />
          <div className="flex items-center gap-3 text-2xs text-ink-3">
            <span className="flex items-center gap-1">
              <Link2 size={12} /> 点击行查看计划明细
            </span>
            <span className="flex items-center gap-1">
              <Wallet size={12} /> 余额 &lt; 1 万标红
            </span>
          </div>
        </div>
      </Card>

      <Card pad={false}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.account.id}
          pageSize={12}
          onRowClick={(r) => setDetail(r.account)}
        />
      </Card>

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail ? `${PLATFORM_MAP[detail.platform].name} · ${PLATFORM_MAP[detail.platform].product} · ${detail.advertiserId}` : ''}
        width={640}
      >
        {detail && detailSummary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['本月消耗', wan(detailSummary.m.spend)],
                ['下单', num(detailSummary.m.conversions)],
                ['CPA', `¥${cpa(detailSummary.m).toFixed(2)}`],
                ['ROI', roi(detailSummary.m).toFixed(2)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-ctl border border-line px-3 py-2">
                  <div className="text-2xs text-ink-3">{k}</div>
                  <div className="num mt-0.5 text-sm font-semibold text-ink-1">{v}</div>
                </div>
              ))}
            </div>

            <div className="rounded-ctl border border-line px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-3">环比 9 月（CPA）</span>
                <DeltaBadge value={change(cpa(detailSummary.m), cpa(detailSummary.prev)) * 100} goodWhenDown />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-ink-3">转化率 / 点击率</span>
                <span className="num text-ink-1">
                  {pct(cvr(detailSummary.m), 2)} / {pct(ctr(detailSummary.m), 2)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-ink-3">日预算 / 余额</span>
                <span className="num text-ink-1">
                  {money(detail.dailyBudget).replace('.00', '')} / {money(detail.balance).replace('.00', '')}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-ink-3">账户口径</span>
                <span className="text-ink-2">{PLATFORM_MAP[detail.platform].caliber}</span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-1">在投计划（{plansOfAccount(detail.id).length}）</span>
                <span className="text-2xs text-ink-3">Σ计划 = 账户汇总</span>
              </div>
              <div className="overflow-hidden rounded-ctl border border-line">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#FCFCFD] text-left text-2xs text-ink-3">
                      <th className="px-3 py-2 font-normal">计划</th>
                      <th className="py-2 text-right font-normal">消耗</th>
                      <th className="py-2 text-right font-normal">转化</th>
                      <th className="py-2 text-right font-normal">CPA</th>
                      <th className="px-3 py-2 text-right font-normal">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plansOfAccount(detail.id).map((p) => (
                      <tr key={p.id} className="border-t border-line/60">
                        <td className="px-3 py-2">
                          <div className="font-medium text-ink-1">{p.name}</div>
                          <div className="num text-2xs text-ink-3">
                            {p.id} · {p.bidType} ¥{p.bid}
                          </div>
                        </td>
                        <td className="num py-2 text-right text-ink-1">{wan(p.m.spend)}</td>
                        <td className="num py-2 text-right text-ink-1">{num(p.m.conversions)}</td>
                        <td className="num py-2 text-right text-ink-1">¥{cpa(p.m).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">
                          <Badge tone={p.status === 'delivering' ? 'green' : p.status === 'limited' ? 'amber' : 'gray'}>
                            {PLAN_STATUS_LABEL[p.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold text-ink-1">近 7 日消耗</div>
              <div className="space-y-1">
                {detailDaily.map((d) => (
                  <div key={d.date} className="flex items-center gap-2">
                    <span className="num w-12 text-2xs text-ink-3">{d.date.slice(5)}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F2F4F7]">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, (d.spend / Math.max(...detailDaily.map((x) => x.spend))) * 100)}%` }}
                      />
                    </div>
                    <span className="num w-16 text-right text-2xs text-ink-2">{wan(d.spend)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2 text-2xs leading-relaxed text-ink-2">
              <span className="font-medium text-ink-1">数据说明：</span>
              本账户数据经 ODS 原样落库 → DWD 口径统一（{PLATFORM_MAP[detail.platform].caliber}）→ DWS 汇总三层加工，
              与平台后台的差异见「数据对账」页。
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
