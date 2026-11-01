import { useState } from 'react';
import { ChevronRight, Flame, Layers3 } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Overlay';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { AD_PLANS, CREATIVES, MATERIALS, MATERIAL_MAP, PLAN_MAP, creativesOfPlan } from '@/mocks/campaigns';
import { ACCOUNT_MAP, PLATFORM_MAP } from '@/mocks/platforms';
import { cpa, ctr, cvr, roi } from '@/lib/metrics';
import { num, pct, wan } from '@/lib/format';
import { PLAN_STATUS_LABEL, type AdPlan, type Creative, type Material } from '@/types';

export default function Campaigns() {
  const [plan, setPlan] = useState<AdPlan | null>(null);

  const planColumns: Column<AdPlan>[] = [
    {
      key: 'name',
      title: '计划',
      render: (r) => (
        <div>
          <div className="text-xs font-medium text-ink-1">{r.name}</div>
          <div className="num text-2xs text-ink-3">
            {r.id} · {ACCOUNT_MAP[r.accountId]?.name}
          </div>
        </div>
      ),
    },
    {
      key: 'bid',
      title: '出价',
      render: (r) => (
        <span className="num text-2xs text-ink-2">
          {r.bidType} ¥{r.bid}
        </span>
      ),
    },
    {
      key: 'spend',
      title: '消耗',
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
      key: 'cvr',
      title: 'CVR',
      align: 'right',
      render: (r) => <span className="num text-xs text-ink-2">{pct(cvr(r.m), 2)}</span>,
    },
    {
      key: 'cpa',
      title: 'CPA',
      align: 'right',
      sorter: (a, b) => cpa(a.m) - cpa(b.m),
      render: (r) => (
        <span className={`num text-xs ${cpa(r.m) > 240 ? 'text-danger' : 'text-ink-1'}`}>¥{cpa(r.m).toFixed(2)}</span>
      ),
    },
    {
      key: 'roi',
      title: 'ROI',
      align: 'right',
      sorter: (a, b) => roi(a.m) - roi(b.m),
      render: (r) => (
        <span className={`num text-xs font-medium ${roi(r.m) >= 3.5 ? 'text-success' : roi(r.m) >= 2.6 ? 'text-ink-1' : 'text-danger'}`}>
          {roi(r.m).toFixed(2)}
        </span>
      ),
    },
    { key: 'status', title: '状态', render: (r) => <StatusBadge status={r.status} label={PLAN_STATUS_LABEL[r.status]} /> },
    {
      key: 'go',
      title: '',
      align: 'right',
      render: () => <ChevronRight size={14} className="text-ink-3" />,
    },
  ];

  const materialColumns: Column<Material>[] = [
    {
      key: 'name',
      title: '素材',
      render: (r) => (
        <div>
          <div className="text-xs font-medium text-ink-1">{r.name}</div>
          <div className="text-2xs text-ink-3">
            {r.id} · {r.type}
            {r.duration ? ` · ${r.duration}s` : ''} · {r.angle}
          </div>
        </div>
      ),
    },
    {
      key: 'planCount',
      title: '使用计划',
      align: 'right',
      render: (r) => <span className="num text-xs text-ink-2">{r.planCount}</span>,
    },
    {
      key: 'spend',
      title: '消耗',
      align: 'right',
      sorter: (a, b) => a.m.spend - b.m.spend,
      render: (r) => <span className="num text-xs text-ink-1">{wan(r.m.spend)}</span>,
    },
    {
      key: 'ctr',
      title: 'CTR',
      align: 'right',
      render: (r) => <span className="num text-xs text-ink-2">{pct(ctr(r.m), 2)}</span>,
    },
    {
      key: 'roi',
      title: 'ROI',
      align: 'right',
      sorter: (a, b) => roi(a.m) - roi(b.m),
      render: (r) => <span className="num text-xs text-ink-1">{roi(r.m).toFixed(2)}</span>,
    },
    {
      key: 'fatigue',
      title: '疲劳度',
      align: 'right',
      sorter: (a, b) => a.fatigue - b.fatigue,
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#F2F4F7]">
            <div
              className={r.fatigue > 0.6 ? 'h-full bg-danger' : r.fatigue > 0.4 ? 'h-full bg-warning' : 'h-full bg-success'}
              style={{ width: `${r.fatigue * 100}%` }}
            />
          </div>
          <span className={`num text-2xs ${r.fatigue > 0.6 ? 'text-danger' : 'text-ink-2'}`}>{r.fatigue.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'verdict',
      title: '结论',
      render: (r) => (
        <span className={`text-2xs ${r.fatigue > 0.6 ? 'text-danger' : r.fatigue > 0.45 ? 'text-warning' : 'text-ink-3'}`}>
          {r.fatigue > 0.6 ? '素材疲劳，建议替换' : r.fatigue > 0.45 ? '衰减中，准备备用素材' : '健康'}
        </span>
      ),
    },
  ];

  const planCreatives = plan ? creativesOfPlan(plan.id) : [];

  return (
    <>
      <PageHeader
        title="计划与素材"
        desc="计划是预算的承载单位，素材是效果的第一变量；素材疲劳（CTR 衰减 + 频次过高）是成本上涨最常见的原因"
        breadcrumb="模型分析 / 计划与素材"
        actions={<Badge tone="blue">{AD_PLANS.length} 个计划 · {CREATIVES.length} 条创意 · {MATERIALS.length} 个素材</Badge>}
      />

      <Card className="mb-4" pad={false}>
        <div className="px-5 pt-5">
          <CardHeader
            title="计划效率排行"
            desc="点击行查看该计划下的创意与素材衰减曲线；Σ计划消耗 = Σ账户消耗（勾稽已验证）"
          />
        </div>
        <div className="mt-3">
          <DataTable columns={planColumns} rows={AD_PLANS} rowKey={(r) => r.id} pageSize={10} onRowClick={setPlan} />
        </div>
      </Card>

      <Card pad={false}>
        <div className="px-5 pt-5">
          <CardHeader
            title="素材效果与疲劳度"
            desc="疲劳度 = f(CTR 衰减率, 投放天数, 人均频次)；> 0.6 视为应当替换"
            extra={
              <span className="flex items-center gap-1 text-2xs text-danger">
                <Flame size={12} /> {MATERIALS.filter((m) => m.fatigue > 0.6).length} 个素材已疲劳
              </span>
            }
          />
        </div>
        <div className="mt-3">
          <DataTable columns={materialColumns} rows={MATERIALS} rowKey={(r) => r.id} pageSize={14} />
        </div>
      </Card>

      <Drawer
        open={!!plan}
        onClose={() => setPlan(null)}
        title={plan?.name ?? ''}
        subtitle={plan ? `${plan.id} · ${ACCOUNT_MAP[plan.accountId]?.name} · ${PLATFORM_MAP[ACCOUNT_MAP[plan.accountId].platform].name}` : ''}
        width={720}
      >
        {plan && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['消耗', wan(plan.m.spend)],
                ['下单', num(plan.m.conversions)],
                ['CPA', `¥${cpa(plan.m).toFixed(2)}`],
                ['ROI', roi(plan.m).toFixed(2)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-ctl border border-line px-3 py-2">
                  <div className="text-2xs text-ink-3">{k}</div>
                  <div className="num mt-0.5 text-sm font-semibold text-ink-1">{v}</div>
                </div>
              ))}
            </div>

            <div className="rounded-ctl border border-line px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-3">出价方式 / 出价</span>
                <span className="num text-ink-1">
                  {plan.bidType} · ¥{plan.bid}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-ink-3">日预算 / 消耗占比</span>
                <span className="num text-ink-1">
                  ¥{num(plan.dailyBudget)} · {pct(plan.weight, 0)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-ink-3">上线时间</span>
                <span className="num text-ink-1">{plan.startDate}</span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-1">创意（{planCreatives.length}）</span>
                <span className="text-2xs text-ink-3">Σ创意 = 计划汇总</span>
              </div>
              <div className="space-y-2">
                {planCreatives.map((c) => (
                  <CreativeRow key={c.id} creative={c} />
                ))}
              </div>
            </div>

            <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2 text-2xs leading-relaxed text-ink-2">
              <span className="inline-flex items-center gap-1 font-medium text-ink-1">
                <Layers3 size={11} /> 素材复用
              </span>
              <div className="mt-1">
                该计划使用的素材：
                {planCreatives.map((c) => ` ${MATERIAL_MAP[c.materialId].name}`).join('、')}。
                同一素材被多个计划复用时，素材层指标为跨计划汇总，因此素材消耗 ≥ 单计划消耗。
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

function CreativeRow({ creative }: { creative: Creative }) {
  const mat = MATERIAL_MAP[creative.materialId];
  const max = Math.max(...creative.decay);
  return (
    <div className="rounded-ctl border border-line px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-ink-1">{creative.name}</div>
          <div className="num text-2xs text-ink-3">
            {creative.id} · {creative.materialType} · 素材 {mat.id}
          </div>
        </div>
        <Badge tone={creative.status === 'active' ? 'green' : 'gray'}>
          {creative.status === 'active' ? '投放中' : '已暂停'}
        </Badge>
      </div>

      <div className="mt-2 flex items-end gap-4">
        <div className="flex flex-1 items-end gap-1">
          {creative.decay.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-sm ${v < 0.8 ? 'bg-danger/70' : 'bg-primary/70'}`}
                style={{ height: `${Math.max(4, (v / max) * 34)}px` }}
                title={`第 ${i + 1} 日 CTR 指数 ${v.toFixed(2)}`}
              />
              <span className="num text-[9px] text-ink-3">D{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 gap-3 text-2xs">
          <div className="text-right">
            <div className="text-ink-3">CTR</div>
            <div className="num text-ink-1">{pct(ctr(creative.m), 2)}</div>
          </div>
          <div className="text-right">
            <div className="text-ink-3">消耗</div>
            <div className="num text-ink-1">{wan(creative.m.spend)}</div>
          </div>
          <div className="text-right">
            <div className="text-ink-3">疲劳度</div>
            <div className={`num ${mat.fatigue > 0.6 ? 'text-danger' : 'text-ink-1'}`}>{mat.fatigue.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
