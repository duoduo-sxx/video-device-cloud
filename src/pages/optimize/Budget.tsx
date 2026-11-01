import { useMemo, useState } from 'react';
import { RotateCcw, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { BarChartH } from '@/components/charts';
import { BUDGET_PLANS } from '@/mocks/insights';
import { PLAN_MAP } from '@/mocks/campaigns';
import { budgetLift, r2 } from '@/lib/metrics';
import { money, num, pct, wan } from '@/lib/format';

type Draft = Record<string, number>;

const BASELINE = BUDGET_PLANS.map((p) => ({
  ...p,
  conv: PLAN_MAP[p.planId].m.conversions,
  spend: PLAN_MAP[p.planId].m.spend,
}));

export default function Budget() {
  const [drafts, setDrafts] = useState<Draft>(() =>
    Object.fromEntries(BUDGET_PLANS.map((p) => [p.planId, p.suggestedBudget])),
  );

  const rows = useMemo(
    () =>
      BASELINE.map((p) => {
        const next = drafts[p.planId] ?? p.currentBudget;
        const ratio = p.currentBudget ? next / p.currentBudget : 1;
        const spend = r2(p.spend * ratio);
        const conv = Math.round(p.conv * (1 + budgetLift(p.currentBudget, next, p.elasticity)));
        return {
          ...p,
          next,
          delta: next - p.currentBudget,
          deltaPct: p.currentBudget ? (next - p.currentBudget) / p.currentBudget : 0,
          projSpend: spend,
          projConv: conv,
          projCpa: conv ? spend / conv : 0,
        };
      }),
    [drafts],
  );

  const cur = {
    budget: rows.reduce((s, r) => s + r.currentBudget, 0),
    spend: rows.reduce((s, r) => s + r.spend, 0),
    conv: rows.reduce((s, r) => s + r.conv, 0),
  };
  const next = {
    budget: rows.reduce((s, r) => s + r.next, 0),
    spend: rows.reduce((s, r) => s + r.projSpend, 0),
    conv: rows.reduce((s, r) => s + r.projConv, 0),
  };
  const curCpa = cur.conv ? cur.spend / cur.conv : 0;
  const nextCpa = next.conv ? next.spend / next.conv : 0;

  const marginalTop = [...BUDGET_PLANS]
    .sort((a, b) => b.marginalRoi - a.marginalRoi)
    .slice(0, 10)
    .map((p) => ({ name: `${p.planId} ${p.name.slice(0, 8)}`, 边际ROI: p.marginalRoi }));

  return (
    <>
      <PageHeader
        title="预算分配"
        desc="按「边际 ROI」而非「平均 ROI」分配预算：边际 ROI 高的计划加预算仍有增量，低的计划加预算只会摊薄整体效率"
        breadcrumb="优化执行 / 预算分配"
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={<RotateCcw size={13} />}
              onClick={() => setDrafts(Object.fromEntries(BUDGET_PLANS.map((p) => [p.planId, p.currentBudget])))}
            >
              恢复当前
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Wallet size={13} />}
              onClick={() => setDrafts(Object.fromEntries(BUDGET_PLANS.map((p) => [p.planId, p.suggestedBudget])))}
            >
              套用模型建议
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="日预算合计"
          value={wan(next.budget)}
          unit="元"
          delta={cur.budget ? (next.budget - cur.budget) / cur.budget : 0}
          hint={`当前 ${wan(cur.budget)} 元 / 天`}
        />
        <StatCard
          label="预估月消耗"
          value={wan(next.spend)}
          unit="元"
          delta={cur.spend ? (next.spend - cur.spend) / cur.spend : 0}
          hint={`当前 ${wan(cur.spend)} 元`}
        />
        <StatCard
          label="预估月转化"
          value={num(next.conv)}
          unit="单"
          delta={cur.conv ? (next.conv - cur.conv) / cur.conv : 0}
          hint={`当前 ${num(cur.conv)} 单`}
          tone="success"
        />
        <StatCard
          label="预估 CPA"
          value={`¥${nextCpa.toFixed(2)}`}
          delta={curCpa ? (nextCpa - curCpa) / curCpa : 0}
          hint={`当前 ¥${curCpa.toFixed(2)}`}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" pad={false}>
          <div className="px-5 pt-5">
            <CardHeader
              title="计划级预算调整"
              desc="直接修改「建议日预算」，右侧会实时测算转化与 CPA 变化；弹性系数来自历史预算实验"
              extra={<Badge tone="blue">{rows.length} 个在投计划</Badge>}
            />
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-y border-line bg-[#FCFCFD] text-left text-2xs text-ink-3">
                  <th className="px-5 py-2 font-normal">计划</th>
                  <th className="py-2 text-right font-normal">当前预算</th>
                  <th className="py-2 text-right font-normal">建议预算</th>
                  <th className="py-2 text-right font-normal">调整</th>
                  <th className="py-2 text-right font-normal">边际 ROI</th>
                  <th className="py-2 text-right font-normal">预估转化</th>
                  <th className="px-5 py-2 text-right font-normal">预估 CPA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.planId} className="border-b border-line/60 last:border-0">
                    <td className="px-5 py-2.5">
                      <div className="max-w-[190px] truncate font-medium text-ink-1">{r.name}</div>
                      <div className="num text-2xs text-ink-3">
                        {r.planId} · {r.accountName}
                      </div>
                    </td>
                    <td className="num py-2.5 text-right text-ink-2">{money(r.currentBudget).replace('.00', '')}</td>
                    <td className="py-2.5 text-right">
                      <input
                        type="number"
                        value={r.next}
                        step={100}
                        min={0}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [r.planId]: Math.max(0, Number(e.target.value) || 0) }))
                        }
                        className="num h-7 w-24 rounded-ctl border border-line px-2 text-right text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
                      />
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`num text-xs font-medium ${
                          r.deltaPct > 0.02 ? 'text-success' : r.deltaPct < -0.02 ? 'text-danger' : 'text-ink-3'
                        }`}
                      >
                        {r.deltaPct > 0 ? '+' : ''}
                        {pct(r.deltaPct, 0)}
                      </span>
                    </td>
                    <td className="num py-2.5 text-right">
                      <span className={r.marginalRoi >= 3.5 ? 'text-success' : r.marginalRoi >= 2.8 ? 'text-ink-1' : 'text-danger'}>
                        {r.marginalRoi.toFixed(2)}
                      </span>
                    </td>
                    <td className="num py-2.5 text-right text-ink-1">{num(r.projConv)}</td>
                    <td className="num px-5 py-2.5 text-right text-ink-1">¥{r.projCpa.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="模拟结果" desc="相对当前预算的变化" />
            <div className="mt-3 space-y-2.5 text-xs">
              <SimRow
                label="预算"
                from={`${wan(cur.budget)} 元/天`}
                to={`${wan(next.budget)} 元/天`}
                delta={(next.budget - cur.budget) / (cur.budget || 1)}
              />
              <SimRow
                label="月消耗"
                from={`${wan(cur.spend)} 元`}
                to={`${wan(next.spend)} 元`}
                delta={(next.spend - cur.spend) / (cur.spend || 1)}
              />
              <SimRow
                label="月转化"
                from={`${num(cur.conv)} 单`}
                to={`${num(next.conv)} 单`}
                delta={(next.conv - cur.conv) / (cur.conv || 1)}
                good
              />
              <SimRow
                label="CPA"
                from={`¥${curCpa.toFixed(2)}`}
                to={`¥${nextCpa.toFixed(2)}`}
                delta={(nextCpa - curCpa) / (curCpa || 1)}
                goodWhenDown
              />
            </div>
            <div className="mt-4 rounded-ctl bg-[#F9FAFB] p-3 text-2xs leading-relaxed text-ink-2">
              <div className="mb-1 font-medium text-ink-1">模型怎么算的</div>
              每次预算变化都按弹性系数折算：<span className="num">转化变化 ≈ (新预算/原预算)^弹性 − 1</span>。
              弹性系数由历史 12 次预算实验回归得到（0.58-0.72），因此加预算的边际收益会递减，不存在「无限加量不涨价」。
            </div>
          </Card>

          <Card>
            <CardHeader title="边际 ROI Top 10" desc="优先给这些计划加预算" />
            <div className="mt-2">
              <BarChartH data={marginalTop} labelKey="name" valueKey="边际ROI" height={260} money={false} />
            </div>
            <div className="mt-2 flex items-center gap-3 text-2xs">
              <span className="flex items-center gap-1 text-success">
                <TrendingUp size={11} /> ≥3.5 建议加预算
              </span>
              <span className="flex items-center gap-1 text-danger">
                <TrendingDown size={11} /> &lt;2.8 建议减预算
              </span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function SimRow({
  label,
  from,
  to,
  delta,
  good,
  goodWhenDown,
}: {
  label: string;
  from: string;
  to: string;
  delta: number;
  good?: boolean;
  goodWhenDown?: boolean;
}) {
  const positive = delta >= 0;
  const isGood = goodWhenDown ? !positive : good ? positive : true;
  return (
    <div className="flex items-center justify-between border-b border-line/60 pb-2 last:border-0">
      <span className="text-ink-2">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="num text-ink-3">{from}</span>
        <span className="text-ink-3">→</span>
        <span className="num font-medium text-ink-1">{to}</span>
        <span className={`num text-2xs ${isGood ? 'text-success' : 'text-danger'}`}>
          {positive ? '+' : ''}
          {pct(delta, 1)}
        </span>
      </span>
    </div>
  );
}
