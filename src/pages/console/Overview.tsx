import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Cpu,
  FileText,
  Receipt,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { PageHeader, StatCard, Card, CardHeader } from '@/components/ui/Card';
import { Donut, Legend, StackedArea } from '@/components/charts';
import { Progress } from '@/components/ui/Overlay';
import { useAuthStore, useCurrentTenant } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { CURRENT_PERIOD, LAST_CLOSED_PERIOD } from '@/mocks/bills';
import { dailyByCategory, byCategory, byService, qtyByCategory } from '@/mocks/usage';
import { instancesOf } from '@/mocks/compute';
import { GEN_RECORDS } from '@/mocks/generations';
import { DATA_JOBS } from '@/mocks/data';
import { money, num, qty, wan } from '@/lib/format';
import { mom } from '@/lib/calc';
import { CATEGORY_LABEL, type ServiceCategory } from '@/types';

export default function ConsoleOverview() {
  const navigate = useNavigate();
  const tenant = useCurrentTenant();
  const user = useAuthStore((s) => s.user);
  const bills = useAppStore((s) => s.bills);
  const instances = useAppStore((s) => s.instances);
  const balance = useAppStore((s) => s.balance);

  const curBill = bills.find((b) => b.tenantId === tenant.id && b.period === CURRENT_PERIOD);
  const lastBill = bills.find((b) => b.tenantId === tenant.id && b.period === LAST_CLOSED_PERIOD);
  const pendingBill = bills.find((b) => b.tenantId === tenant.id && b.status === 'pending_confirm');

  const daily = useMemo(() => dailyByCategory(tenant.id, CURRENT_PERIOD), [tenant.id]);
  const cat = useMemo(() => byCategory(tenant.id, CURRENT_PERIOD), [tenant.id]);
  const topServices = useMemo(() => byService(tenant.id, CURRENT_PERIOD, 5), [tenant.id]);

  const runningInstances = instances.filter((i) => i.tenantId === tenant.id && i.status === 'running');
  const computeHours = qtyByCategory(tenant.id, CURRENT_PERIOD, 'compute');
  const modelTokens = qtyByCategory(tenant.id, CURRENT_PERIOD, 'model');
  const runningJobs = DATA_JOBS.filter((j) => j.tenantId === tenant.id && j.status === 'running');
  const genCount = GEN_RECORDS.filter((g) => g.tenantId === tenant.id).length;

  const donutData = (Object.keys(cat) as ServiceCategory[])
    .map((k) => ({ name: CATEGORY_LABEL[k], value: cat[k] }))
    .sort((a, b) => b.value - a.value);

  const trendData = daily.map((d) => ({
    date: d.date,
    算力资源: d.算力资源,
    模型调用: d.模型调用,
    数据处理: d.数据处理,
    智能匹配: d.智能匹配,
    内容生成: d.内容生成,
  }));

  const spark = daily.slice(-14).map((d) => d.total);

  const todos = [
    pendingBill && {
      icon: Receipt,
      tone: 'amber',
      title: `账期 ${pendingBill.period} 账单待确认`,
      desc: `价税合计 ${money(pendingBill.total)}，确认后方可开票`,
      action: '去确认',
      to: `/console/billing/bills/${pendingBill.id}`,
    },
    {
      icon: FileText,
      tone: 'blue',
      title: '1 张增值税专用发票待开具',
      desc: '开票品目「信息技术服务」，税率 6%，请核对抬头与税号',
      action: '去开票',
      to: '/console/billing/invoices',
    },
    balance < 150000 && {
      icon: BellRing,
      tone: 'red',
      title: '账户余额低于预警线',
      desc: `当前余额 ${money(balance)}，低于预警阈值 ¥150,000.00`,
      action: '去充值',
      to: '/console/settings/recharge',
    },
    {
      icon: Sparkles,
      tone: 'gray',
      title: `${genCount} 条内容生成记录待归档`,
      desc: '本月生成记录中 3 条被内容安全策略拦截，需复核',
      action: '查看',
      to: '/console/gen/records',
    },
  ].filter(Boolean) as {
    icon: typeof Receipt;
    tone: string;
    title: string;
    desc: string;
    action: string;
    to: string;
  }[];

  const toneClass: Record<string, string> = {
    amber: 'bg-warning-soft text-warning',
    blue: 'bg-primary-soft text-primary',
    red: 'bg-danger-soft text-danger',
    gray: 'bg-[#F2F4F7] text-ink-2',
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-1">你好，{user?.name ?? '陈立'}</h1>
          <p className="mt-1.5 text-sm text-ink-2">
            {tenant.shortName} 当前账期 {CURRENT_PERIOD} 已产生 {money(curBill?.netAmount ?? 0)} 不含税消费；
            {pendingBill ? ` 上期账单待确认，请及时处理。` : ' 所有账单均已处理完毕。'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/console/gen/workbench"
            className="inline-flex h-9 items-center gap-1.5 rounded-ctl bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            <Sparkles size={14} /> 新建生成任务
          </Link>
          <Link
            to="/console/data/jobs"
            className="inline-flex h-9 items-center gap-1.5 rounded-ctl border border-line bg-white px-4 text-sm text-ink-1 hover:bg-[#F9FAFB]"
          >
            数据加工任务 <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* 指标卡 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="本月消费（不含税）"
          value={money(curBill?.netAmount ?? 0)}
          delta={mom(curBill?.netAmount ?? 0, lastBill?.netAmount ?? 0)}
          hint={`截至 10-30，上期 ${money(lastBill?.netAmount ?? 0)}`}
          spark={spark}
          tone="primary"
        />
        <StatCard label="本月算力用量" value={num(computeHours)} unit="卡·时" hint="A100 / H100 / L20 / 4090 合计" />
        <StatCard label="本月模型调用" value={wan(modelTokens * 1000)} unit="token" hint="含输入与输出 token" />
        <StatCard label="账户余额" value={money(balance)} hint="预付费余额，可抵扣后续消费" tone="success" />
        <StatCard
          label="运行中实例"
          value={String(runningInstances.length)}
          unit={`/ ${instances.filter((i) => i.tenantId === tenant.id).length} 台`}
          hint={`占用 ${runningInstances.reduce((a, i) => a + i.cardCount, 0)} 张 GPU`}
        />
      </div>

      {/* 主图区 */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="近 30 天消费趋势"
            desc="按服务类别堆叠，单位：元（不含税）"
            extra={
              <div className="flex items-center gap-3 text-2xs text-ink-3">
                {['算力资源', '模型调用', '数据处理', '智能匹配', '内容生成'].map((k, i) => (
                  <span key={k} className="flex items-center gap-1">
                    <span
                      className="h-1.5 w-1.5 rounded-sm"
                      style={{ background: ['#1D4ED8', '#0891B2', '#7C3AED', '#DB2777', '#EA580C'][i] }}
                    />
                    {k}
                  </span>
                ))}
              </div>
            }
          />
          <div className="mt-4">
            <StackedArea
              data={trendData}
              xKey="date"
              height={286}
              series={[
                { key: '算力资源', name: '算力资源' },
                { key: '模型调用', name: '模型调用' },
                { key: '数据处理', name: '数据处理' },
                { key: '智能匹配', name: '智能匹配' },
                { key: '内容生成', name: '内容生成' },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="消费构成" desc={`账期 ${CURRENT_PERIOD}`} />
          <Donut
            data={donutData}
            height={210}
            centerLabel="不含税合计"
            centerValue={money(curBill?.netAmount ?? 0)}
          />
          <Legend items={donutData.map((d) => ({ name: d.name, value: money(d.value) }))} />
        </Card>
      </div>

      {/* 待办 + Top 服务 */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="待办事项" desc="按紧急程度排序" extra={<span className="text-2xs text-ink-3">{todos.length} 项</span>} />
          <div className="mt-3 space-y-2">
            {todos.map((t) => (
              <div
                key={t.title}
                className="flex items-center gap-3 rounded-ctl border border-line px-3.5 py-3 transition-colors hover:bg-[#FCFCFD]"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClass[t.tone]}`}>
                  <t.icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-1">{t.title}</div>
                  <div className="mt-0.5 truncate text-xs text-ink-3">{t.desc}</div>
                </div>
                <button
                  onClick={() => navigate(t.to)}
                  className="shrink-0 rounded-ctl border border-line px-3 py-1.5 text-xs text-ink-1 hover:border-primary-ring hover:text-primary"
                >
                  {t.action}
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="消耗 Top 5 服务" desc="按本月消费金额" />
          <div className="mt-4 space-y-3.5">
            {topServices.map((s, i) => {
              const max = topServices[0].amount;
              return (
                <div key={s.name}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="num w-4 shrink-0 text-ink-3">{i + 1}</span>
                      <span className="truncate text-ink-1">{s.name}</span>
                    </span>
                    <span className="num ml-2 shrink-0 font-medium text-ink-1">{money(s.amount)}</span>
                  </div>
                  <Progress value={(s.amount / max) * 100} height={4} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 底部动态 */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="最近任务动态" extra={<Link to="/console/data/jobs" className="text-xs text-primary">全部任务</Link>} />
          <div className="mt-3 divide-y divide-line">
            {DATA_JOBS.filter((j) => j.tenantId === tenant.id)
              .slice(0, 4)
              .map((j) => (
                <div key={j.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      j.status === 'success'
                        ? 'bg-success'
                        : j.status === 'running'
                          ? 'bg-primary'
                          : j.status === 'failed'
                            ? 'bg-danger'
                            : 'bg-ink-3'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-ink-1">{j.name}</div>
                    <div className="mt-0.5 truncate text-2xs text-ink-3">
                      {j.datasetName} · {num(j.inputRows)} 行
                    </div>
                  </div>
                  <span className="num shrink-0 text-2xs text-ink-2">{money(j.cost)}</span>
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="算力使用概览" desc="运行中实例的配额占用" extra={<Cpu size={15} className="text-ink-3" />} />
          <div className="mt-4 space-y-3.5">
            {runningInstances.map((i) => (
              <div key={i.id}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="truncate text-ink-1">
                    {i.specName} <span className="text-ink-3">· {i.cardCount} 卡</span>
                  </span>
                  <span className="num ml-2 shrink-0 text-ink-2">{num(i.monthlyCost)} 元/月</span>
                </div>
                <Progress value={Math.min(100, (i.hoursUsed / 744) * 100)} height={4} tone="primary" />
              </div>
            ))}
            <div className="flex items-center gap-1.5 pt-1 text-2xs text-ink-3">
              <CheckCircle2 size={12} className="text-success" />
              本月算力服务可用率 99.97%，未触发 SLA 赔付
              <TrendingUp size={12} className="ml-auto" />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-card border border-line bg-white px-4 py-3 text-2xs text-ink-3">
        <Sparkles size={13} className="text-primary" />
        当前有 {runningJobs.length} 个数据加工任务正在运行，预计消耗 {money(1286.4)}，每分钟刷新一次。
      </div>
    </div>
  );
}
