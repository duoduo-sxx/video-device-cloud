import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Cpu,
  LifeBuoy,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BarChartH, Donut, Legend, MultiLine, TrendArea } from '@/components/charts';
import { Progress } from '@/components/ui/Overlay';
import { TENANTS } from '@/mocks/tenants';
import { BILLS } from '@/mocks/bills';
import { ALERTS, PLATFORM_MONTHLY, TICKETS } from '@/mocks/misc';
import { COMPUTE_SPECS } from '@/mocks/compute';
import { money, num, wan } from '@/lib/format';
import { CATEGORY_LABEL, type ServiceCategory } from '@/types';
import { BILL_ITEMS } from '@/mocks/bills';

export default function AdminOverview() {
  const navigate = useNavigate();

  const cur = PLATFORM_MONTHLY[PLATFORM_MONTHLY.length - 1];
  const prev = PLATFORM_MONTHLY[PLATFORM_MONTHLY.length - 2];

  const revenueTrend = PLATFORM_MONTHLY.map((m) => ({ month: m.month.slice(5), revenue: m.revenue }));
  const customerTrend = PLATFORM_MONTHLY.map((m) => ({
    month: m.month.slice(5),
    customers: m.customers,
    calls: Math.round(m.calls / 1000000),
  }));

  const catMap = new Map<ServiceCategory, number>();
  BILL_ITEMS.filter((i) => i.billId.startsWith('BILL-202609')).forEach((i) => {
    catMap.set(i.category, (catMap.get(i.category) ?? 0) + i.amount);
  });
  const donutData = Array.from(catMap.entries()).map(([k, v]) => ({ name: CATEGORY_LABEL[k], value: v }));

  const topCustomers = TENANTS.map((t) => ({
    name: t.shortName,
    amount: BILLS.filter((b) => b.tenantId === t.id && b.period === '2026-09').reduce((a, b) => a + b.netAmount, 0),
  }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const gpuTotal = COMPUTE_SPECS.reduce((a, s) => a + s.totalCards, 0);
  const gpuUsed = COMPUTE_SPECS.reduce((a, s) => a + s.allocatedCards, 0);

  const overdue = BILLS.filter((b) => b.status === 'pending_confirm' && b.period <= '2026-08');

  return (
    <div>
      <PageHeader
        title="经营看板"
        desc={`平台在营客户 ${TENANTS.length} 家 ｜ 数据截至 2026-10-31 23:40`}
        actions={
          <>
            <Button icon={<Receipt size={14} />} onClick={() => navigate('/finance/reconcile')}>
              去对账
            </Button>
            <Button variant="primary" icon={<Building2 size={14} />} onClick={() => navigate('/admin/customers')}>
              客户管理
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="本月 GMV"
          value={money(cur.revenue)}
          delta={(cur.revenue - prev.revenue) / prev.revenue}
          hint={`上月 ${money(prev.revenue)}`}
          tone="primary"
        />
        <StatCard label="在营客户" value={String(cur.customers)} unit="家" delta={(cur.customers - prev.customers) / prev.customers} hint="本月新增 2 家" />
        <StatCard label="调用总量" value={wan(cur.calls)} unit="次" delta={(cur.calls - prev.calls) / prev.calls} hint="含模型与数据服务" />
        <StatCard label="GPU 整体利用率" value={((gpuUsed / gpuTotal) * 100).toFixed(1)} unit="%" hint={`${gpuUsed} / ${gpuTotal} 卡已分配`} />
        <StatCard label="毛利率" value="62.4" unit="%" hint="算力转售毛利偏低" tone="success" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="收入趋势" desc="近 6 个自然月，单位：元（不含税）" extra={<TrendingUp size={15} className="text-ink-3" />} />
          <div className="mt-3">
            <TrendArea data={revenueTrend} xKey="month" yKey="revenue" height={250} name="收入" />
          </div>
        </Card>
        <Card>
          <CardHeader title="收入构成" desc="按服务类别（2026-09 样本）" />
          <Donut data={donutData} height={200} centerLabel="合计" centerValue={money(donutData.reduce((a, d) => a + d.value, 0))} innerRadius={54} />
          <Legend items={donutData.map((d) => ({ name: d.name, value: money(d.value) }))} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="客户增长" desc="在营客户数 / 月调用量（百万次）" />
          <div className="mt-3">
            <MultiLine
              data={customerTrend}
              xKey="month"
              height={210}
              series={[
                { key: 'customers', name: '客户数' },
                { key: 'calls', name: '调用量（百万）' },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Top 6 客户" desc="按 2026-09 不含税收入" />
          <div className="mt-3">
            <BarChartH data={topCustomers} labelKey="name" valueKey="amount" height={230} />
          </div>
        </Card>

        <Card>
          <CardHeader title="算力资源水位" desc="按规格" extra={<Cpu size={15} className="text-ink-3" />} />
          <div className="mt-4 space-y-3.5">
            {COMPUTE_SPECS.map((s) => (
              <div key={s.id}>
                <div className="mb-1.5 flex items-center justify-between text-2xs">
                  <span className="truncate text-ink-1">{s.gpuModel}</span>
                  <span className="num text-ink-2">
                    {s.allocatedCards}/{s.totalCards}
                  </span>
                </div>
                <Progress value={(s.allocatedCards / s.totalCards) * 100} height={4} tone={s.allocatedCards / s.totalCards > 0.85 ? 'warning' : 'primary'} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="算力与业务告警" extra={<Badge tone="red" dot>{ALERTS.filter((a) => a.status === 'firing').length} 条待处理</Badge>} />
          <div className="mt-3 space-y-2.5">
            {ALERTS.filter((a) => a.status === 'firing').map((a) => (
              <div key={a.id} className="flex gap-2 rounded-ctl border border-line px-3 py-2.5">
                <AlertTriangle
                  size={13}
                  className={`mt-0.5 shrink-0 ${a.level === 'critical' ? 'text-danger' : a.level === 'warning' ? 'text-warning' : 'text-ink-3'}`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-ink-1">{a.type}</div>
                  <div className="mt-0.5 line-clamp-2 text-2xs leading-relaxed text-ink-3">{a.message}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="待办工单" extra={<LifeBuoy size={15} className="text-ink-3" />} />
          <div className="mt-3 space-y-2.5">
            {TICKETS.filter((t) => t.status === 'open' || t.status === 'processing')
              .slice(0, 4)
              .map((t) => (
                <div key={t.id} className="flex gap-2 border-b border-line pb-2.5 last:border-0">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${t.priority === 'high' ? 'bg-danger' : 'bg-warning'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs text-ink-1">{t.title}</div>
                    <div className="mt-0.5 truncate text-2xs text-ink-3">
                      {t.tenantName} · {t.assignee}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          <button
            onClick={() => navigate('/admin/tickets')}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-ctl border border-line py-2 text-2xs text-ink-2 hover:bg-[#F9FAFB]"
          >
            查看全部工单 <ArrowRight size={12} />
          </button>
        </Card>

        <Card>
          <CardHeader title="经营健康度" extra={<Users size={15} className="text-ink-3" />} />
          <div className="mt-4 space-y-3.5">
            {[
              ['客户留存率', 96, 'success'],
              ['账单确认及时率', 88, 'primary'],
              ['回款率', 92, 'success'],
              ['工单 SLA 达成率', 94, 'primary'],
            ].map(([label, v, tone]) => (
              <div key={label as string}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-ink-2">{label as string}</span>
                  <span className="num font-medium text-ink-1">{v as number}%</span>
                </div>
                <Progress value={v as number} height={4} tone={tone as 'success' | 'primary'} />
              </div>
            ))}
          </div>
          {overdue.length > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-ctl bg-warning-soft px-3 py-2 text-2xs text-warning">
              <AlertTriangle size={12} />
              {overdue.length} 笔账单逾期未确认，涉及 {money(overdue.reduce((a, b) => a + b.total, 0))}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between text-2xs text-ink-3">
            <span>累计调用量</span>
            <span className="num">{num(PLATFORM_MONTHLY.reduce((a, m) => a + m.calls, 0))} 次</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
