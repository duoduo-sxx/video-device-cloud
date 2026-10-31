import { useMemo, useState } from 'react';
import { BarChart3, Download, Info } from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar, Select } from '@/components/ui/Form';
import { Donut, Legend, TrendArea } from '@/components/charts';
import { useCurrentTenant } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { PERIODS } from '@/mocks/bills';
import { CURRENT_PERIOD, LAST_CLOSED_PERIOD } from '@/mocks/bills';
import { byCategory, byService, dailySeries, usageOfPeriod } from '@/mocks/usage';
import { money, num, qty } from '@/lib/format';
import { round2 } from '@/lib/calc';
import { CATEGORY_LABEL, type ServiceCategory } from '@/types';

interface Row {
  key: string;
  name: string;
  category?: ServiceCategory;
  quantity: number;
  unit: string;
  amount: number;
  share: number;
}

export default function Usage() {
  const tenant = useCurrentTenant();
  const toast = useUIStore((s) => s.toast);
  const [period, setPeriod] = useState(CURRENT_PERIOD);
  const [dim, setDim] = useState<'service' | 'category' | 'day'>('service');

  const records = useMemo(() => usageOfPeriod(tenant.id, period), [tenant.id, period]);

  const totals = useMemo(() => {
    const amount = round2(records.reduce((a, r) => a + r.amount, 0));
    const daily = dailySeries(tenant.id, period);
    return {
      amount,
      days: daily.length,
      avgDay: daily.length ? round2(amount / daily.length) : 0,
      peak: daily.length ? Math.max(...daily.map((d) => d.amount)) : 0,
      count: records.length,
    };
  }, [records, tenant.id, period]);

  const rows: Row[] = useMemo(() => {
    if (dim === 'service') {
      const list = byService(tenant.id, period, 99);
      return list.map((s) => ({
        key: s.name,
        name: s.name,
        quantity: s.quantity,
        unit: s.unit,
        amount: s.amount,
        share: totals.amount ? s.amount / totals.amount : 0,
      }));
    }
    if (dim === 'category') {
      const cat = byCategory(tenant.id, period);
      return (Object.keys(cat) as ServiceCategory[]).map((k) => ({
        key: k,
        name: CATEGORY_LABEL[k],
        category: k,
        quantity: 0,
        unit: '—',
        amount: cat[k],
        share: totals.amount ? cat[k] / totals.amount : 0,
      }));
    }
    const daily = dailySeries(tenant.id, period);
    return daily.map((d) => ({
      key: d.date,
      name: d.date,
      quantity: 0,
      unit: '—',
      amount: d.amount,
      share: totals.amount ? d.amount / totals.amount : 0,
    }));
  }, [dim, tenant.id, period, totals.amount]);

  const columns: Column<Row>[] = [
    {
      key: 'name',
      title: dim === 'day' ? '日期' : dim === 'category' ? '服务类别' : '服务项',
      render: (r) => <span className={dim === 'day' ? 'num' : 'font-medium'}>{r.name}</span>,
    },
    ...(dim === 'service'
      ? ([
          { key: 'quantity', title: '用量', width: 130, align: 'right' as const, render: (r: Row) => <span className="num text-ink-2">{qty(r.quantity)}</span> },
          { key: 'unit', title: '单位', width: 100, render: (r: Row) => <span className="text-xs text-ink-2">{r.unit}</span> },
        ] as Column<Row>[])
      : []),
    {
      key: 'amount',
      title: '金额（不含税）',
      width: 160,
      align: 'right',
      sortable: true,
      sorter: (a, b) => a.amount - b.amount,
      render: (r) => <span className="num font-medium">{money(r.amount)}</span>,
    },
    {
      key: 'share',
      title: '占比',
      width: 190,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F2F4F7]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${r.share * 100}%` }} />
          </div>
          <span className="num w-11 text-right text-2xs text-ink-2">{(r.share * 100).toFixed(1)}%</span>
        </div>
      ),
    },
  ];

  const cat = byCategory(tenant.id, period);
  const donut = (Object.keys(cat) as ServiceCategory[])
    .map((k) => ({ name: CATEGORY_LABEL[k], value: cat[k] }))
    .sort((a, b) => b.value - a.value);

  const trend = dailySeries(tenant.id, period).map((d) => ({ date: d.date, amount: d.amount }));

  const prevPeriod = PERIODS[Math.max(0, PERIODS.indexOf(period) - 1)];
  const prevTotal = round2(
    Object.values(byCategory(tenant.id, prevPeriod)).reduce((a, b) => a + b, 0),
  );

  return (
    <div>
      <PageHeader
        title="用量明细"
        desc="用量数据按小时采集、按日汇总，是账单金额的唯一计量依据"
        actions={
          <>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-32">
              {[...PERIODS].reverse().map((p) => (
                <option key={p} value={p}>
                  {p}
                  {p === CURRENT_PERIOD ? '（进行中）' : ''}
                </option>
              ))}
            </Select>
            <Button icon={<Download size={14} />} onClick={() => toast('用量明细已导出 CSV', 'info')}>
              导出
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="账期消费（不含税）" value={money(totals.amount)} hint={`${period} ｜ 计量记录 ${totals.count} 条`} tone="primary" />
        <StatCard label="日均消费" value={money(totals.avgDay)} hint={`${totals.days} 天`} />
        <StatCard label="单日峰值" value={money(totals.peak)} hint="含批量任务集中跑批" />
        <StatCard
          label="环比上一账期"
          value={`${prevTotal ? (((totals.amount - prevTotal) / prevTotal) * 100).toFixed(1) : '0.0'}%`}
          hint={`上期 ${money(prevTotal)}${period === CURRENT_PERIOD ? '（本月未结束）' : ''}`}
          tone={totals.amount >= prevTotal ? 'success' : 'default'}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="日消费趋势" desc={`${period} 按日汇总，单位：元（不含税）`} />
          <div className="mt-3">
            <TrendArea data={trend} xKey="date" yKey="amount" height={240} name="消费金额" />
          </div>
        </Card>
        <Card>
          <CardHeader title="类别构成" />
          <Donut data={donut} height={200} centerLabel="合计" centerValue={money(totals.amount)} innerRadius={54} />
          <Legend items={donut.map((d) => ({ name: d.name, value: money(d.value) }))} />
        </Card>
      </div>

      <Card pad={false}>
        <div className="p-4">
          <FilterBar
            extra={
              <div className="flex items-center gap-1">
                {(
                  [
                    ['service', '按服务项'],
                    ['category', '按服务类别'],
                    ['day', '按日期'],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setDim(k)}
                    className={`rounded-ctl border px-2.5 py-1.5 text-xs transition-colors ${
                      dim === k ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2 hover:bg-[#F9FAFB]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          >
            <Badge tone="gray">
              <BarChart3 size={11} className="mr-1" /> 账期 {period}
            </Badge>
          </FilterBar>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.key}
          pageSize={12}
          emptyTitle="该账期暂无用量"
          emptyDesc="账期结束后将自动封账，进行中的账期每小时更新一次"
          footer={
            <span className="num ml-3 text-ink-2">
              合计 {money(totals.amount)}
            </span>
          }
        />
      </Card>

      <div className="mt-4 flex items-start gap-2 rounded-card border border-line bg-white px-5 py-4">
        <Info size={15} className="mt-0.5 shrink-0 text-ink-3" />
        <div className="text-2xs leading-relaxed text-ink-3">
          计量规则：算力按卡·时计（按秒采集、按小时结算），模型按千 token 计（不足 1 千按 1 千计），
          数据处理按成功处理条数计，智能匹配按匹配对数计，内容生成按篇/张计。
          账单金额 = Σ（用量 × 适用单价），并在此基础上计算 6% 增值税。
          若对某条计量记录有疑问，可凭请求 ID 在「调用日志」中追溯原始请求。
        </div>
      </div>
    </div>
  );
}
