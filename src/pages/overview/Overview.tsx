import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CircleCheck,
  CircleDashed,
  CircleX,
  Database,
  Filter,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import { Badge, DeltaBadge, LevelBadge } from '@/components/ui/Badge';
import { Donut, StackedArea } from '@/components/charts';
import { PLATFORMS, PLATFORM_MAP, BRAND } from '@/mocks/platforms';
import {
  CURRENT_PERIOD,
  PREV_PERIOD,
  dailyByPlatform,
  metricsOfPlatform,
  totalMetrics,
} from '@/mocks/daily';
import { ANOMALIES, SUGGESTIONS } from '@/mocks/insights';
import { SYNC_JOBS, QUALITY_CHECKS, DATA_TABLES } from '@/mocks/pipeline';
import { accountSummaries } from '@/mocks/daily';
import { cpa, change, cpa as cpaOf, ctr, cvr, roi, r2 } from '@/lib/metrics';
import { money, num, pct, wan } from '@/lib/format';

const CUR = totalMetrics(CURRENT_PERIOD);
const PREV = totalMetrics(PREV_PERIOD);

const series = (() => {
  const map = new Map<string, Record<string, number>>();
  for (const row of dailyByPlatform(CURRENT_PERIOD)) {
    const rec: Record<string, number> = { date: Number(row.date.slice(8, 10)) };
    for (const p of PLATFORMS) rec[p.short] = Math.round(row.byPlatform[p.code] ?? 0);
    map.set(row.date, rec);
  }
  return [...map.entries()].map(([, v]) => v);
})();

const platformSpend = PLATFORMS.map((p) => ({
  name: p.short,
  value: Math.round(metricsOfPlatform(p.code, CURRENT_PERIOD).spend),
}));

const accounts = accountSummaries()
  .sort((a, b) => b.m.spend - a.m.spend)
  .slice(0, 6);

const pendingSuggestions = SUGGESTIONS.filter((s) => s.status === 'pending');
const highAnomalies = ANOMALIES.filter((a) => a.level === 'high');
const syncOk = SYNC_JOBS.filter((j) => j.status === 'success').length;
const qualityOk = QUALITY_CHECKS.filter((q) => q.status === 'passed').length;

const STEPS = [
  { icon: Database, label: '数据接入', value: `${syncOk}/${SYNC_JOBS.length} 账户`, ok: syncOk === SYNC_JOBS.length, to: '/connect/sync' },
  { icon: Filter, label: '质量校验', value: `${qualityOk}/${QUALITY_CHECKS.length} 通过`, ok: qualityOk === QUALITY_CHECKS.length, to: '/connect/quality' },
  { icon: Layers, label: '数仓加工', value: `${DATA_TABLES.length} 张表`, ok: true, to: '/data/layers' },
  { icon: Users, label: '模型分析', value: '6 维洞察 / 5 模型归因', ok: true, to: '/insight/audience' },
  { icon: Sparkles, label: '优化建议', value: `${pendingSuggestions.length} 条待处理`, ok: pendingSuggestions.length === 0, to: '/optimize/suggestions' },
];

export default function Overview() {
  return (
    <>
      <PageHeader
        title="投放总览"
        desc={`${BRAND.owner} · 6 个投放平台 12 个账户 · 数据截至 2026-10-31 08:12 · 与平台后台消耗差异 ≤ 0.31%`}
        breadcrumb="2026-10 账期（对比 2026-09）"
        actions={
          <>
            <Link
              to="/reports/daily"
              className="rounded-ctl border border-line px-3 py-1.5 text-xs text-ink-2 hover:bg-[#F9FAFB]"
            >
              数据对账
            </Link>
            <Link
              to="/optimize/suggestions"
              className="rounded-ctl bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
            >
              处理建议（{pendingSuggestions.length}）
            </Link>
          </>
        }
      />

      {/* 数据链路演示条 */}
      <Card className="mb-4 !p-0" pad={false}>
        <div className="flex flex-wrap items-stretch divide-x divide-line">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                to={s.to}
                className="group flex min-w-[200px] flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-[#F9FAFB]"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-ctl ${
                    s.ok ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'
                  }`}
                >
                  <Icon size={15} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-2xs text-ink-3">
                    步骤 {i + 1}
                    {i < STEPS.length - 1 && <ArrowRight size={10} />}
                  </span>
                  <span className="block text-xs font-medium text-ink-1">{s.label}</span>
                  <span className="block text-2xs text-ink-3">{s.value}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* 指标卡 */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="本月消耗"
          value={wan(CUR.spend)}
          unit="元"
          delta={change(CUR.spend, PREV.spend)}
          hint={`日均 ${wan(CUR.spend / 31)} 元`}
          tone="primary"
        />
        <StatCard
          label="下单数"
          value={num(CUR.conversions)}
          unit="单"
          delta={change(CUR.conversions, PREV.conversions)}
          hint={`支付成功 ${num(CUR.paidOrders)} 单`}
        />
        <StatCard
          label="成交金额"
          value={wan(CUR.gmv)}
          unit="元"
          delta={change(CUR.gmv, PREV.gmv)}
          hint={`客单价 ¥${(CUR.gmv / CUR.paidOrders).toFixed(0)}`}
        />
        <StatCard
          label="投产比 ROI"
          value={roi(CUR).toFixed(2)}
          unit="倍"
          delta={change(roi(CUR), roi(PREV))}
          hint={`行业均值 2.80 倍`}
          tone="success"
        />
        <StatCard
          label="转化成本 CPA"
          value={`¥${cpaOf(CUR).toFixed(2)}`}
          delta={change(cpaOf(CUR), cpaOf(PREV))}
          hint={`点击率 ${pct(ctr(CUR), 2)} · 转化率 ${pct(cvr(CUR), 2)}`}
          tone="warning"
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="近 31 日消耗趋势（按平台堆叠）"
            desc="10/01-10/07 国庆出行高峰、10/08-10/20 节后蓄水、10/21 起双 11 预热逐日爬坡"
            extra={<Badge tone="blue">合计 {wan(CUR.spend)} 元</Badge>}
          />
          <StackedArea
            data={series}
            xKey="date"
            series={PLATFORMS.map((p) => ({ key: p.short, name: p.name }))}
            height={264}
          />
        </Card>

        <Card>
          <CardHeader title="平台消耗占比" desc="本月消耗结构" />
          <Donut
            data={platformSpend}
            height={228}
            centerLabel="总消耗"
            centerValue={`${wan(CUR.spend)}`}
          />
          <div className="mt-2 space-y-1.5">
            {platformSpend.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <span className="text-ink-2">{p.name}</span>
                <span className="num text-ink-1">{pct(p.value / CUR.spend, 1)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="账户表现（消耗 Top 6）"
            desc="点账户进入计划与素材明细"
            extra={
              <Link to="/connect/accounts" className="text-xs text-primary hover:underline">
                全部 12 个账户
              </Link>
            }
          />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line text-left text-2xs text-ink-3">
                  <th className="pb-2 font-normal">账户</th>
                  <th className="pb-2 text-right font-normal">消耗</th>
                  <th className="pb-2 text-right font-normal">下单</th>
                  <th className="pb-2 text-right font-normal">CPA</th>
                  <th className="pb-2 text-right font-normal">ROI</th>
                  <th className="pb-2 text-right font-normal">CPA 环比</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(({ account, m, prev }) => (
                  <tr key={account.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: PLATFORM_MAP[account.platform].color }}
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-ink-1">{account.name}</div>
                          <div className="text-2xs text-ink-3">
                            {PLATFORM_MAP[account.platform].name} · {account.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="num py-2.5 text-right text-ink-1">{wan(m.spend)}</td>
                    <td className="num py-2.5 text-right text-ink-1">{num(m.conversions)}</td>
                    <td className="num py-2.5 text-right text-ink-1">¥{cpaOf(m).toFixed(2)}</td>
                    <td className="num py-2.5 text-right font-medium text-ink-1">{roi(m).toFixed(2)}</td>
                    <td className="py-2.5 text-right">
                      <DeltaBadge value={change(cpaOf(m), cpaOf(prev)) * 100} goodWhenDown />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="待处理"
              desc="高优先级异常与待采纳建议"
              extra={<Badge tone="red">{highAnomalies.length + pendingSuggestions.length}</Badge>}
            />
            <div className="mt-3 space-y-2">
              {highAnomalies.slice(0, 3).map((a) => (
                <Link
                  key={a.id}
                  to="/insight/anomaly"
                  className="block rounded-ctl border border-line px-3 py-2 hover:border-primary-ring hover:bg-primary-soft/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-ink-1">{a.metric}</span>
                    <LevelBadge level={a.level} />
                  </div>
                  <div className="mt-1 truncate text-2xs text-ink-3">{a.target}</div>
                  <div className="mt-1 flex items-center gap-2 text-2xs">
                    <span className="num text-ink-2">{a.baseline}</span>
                    <ArrowRight size={10} className="text-ink-3" />
                    <span className="num text-danger">{a.current}</span>
                  </div>
                </Link>
              ))}
              {pendingSuggestions.slice(0, 2).map((s) => (
                <Link
                  key={s.id}
                  to="/optimize/suggestions"
                  className="block rounded-ctl border border-line px-3 py-2 hover:border-primary-ring hover:bg-primary-soft/40"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-primary" />
                    <span className="truncate text-xs font-medium text-ink-1">{s.title}</span>
                  </div>
                  <div className="mt-1 text-2xs text-ink-3">
                    置信度 {pct(s.confidence, 0)} · 预估转化 {s.impact.conversions > 0 ? `+${s.impact.conversions}` : s.impact.conversions} 单
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="数据链路健康" desc="今日调度 09:15 完成" />
            <div className="mt-3 space-y-2 text-xs">
              <Row
                ok={syncOk === SYNC_JOBS.length}
                label="账户同步"
                value={`${syncOk}/${SYNC_JOBS.length} 成功`}
              />
              <Row
                ok={qualityOk === QUALITY_CHECKS.length}
                label="质量校验"
                value={`${qualityOk}/${QUALITY_CHECKS.length} 通过`}
              />
              <Row ok label="明细勾稽" value="Σ计划 = Σ账户 ✓" />
              <Row ok label="归因一致性" value="5 模型总转化一致 ✓" />
              <Row ok={false} label="缺失数据" value="ACC-501 缺 3 天" />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  const Icon = ok ? CircleCheck : CircleX;
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-ink-2">
        <Icon size={13} className={ok ? 'text-success' : 'text-danger'} />
        {label}
      </span>
      <span className={ok ? 'num text-ink-1' : 'num text-danger'}>{value}</span>
    </div>
  );
}
