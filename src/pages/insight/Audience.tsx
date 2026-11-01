import { useState } from 'react';
import { AlertTriangle, ArrowRight, Sparkles, Target, Users } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Progress, Tabs } from '@/components/ui/Overlay';
import DataTable, { type Column } from '@/components/ui/DataTable';
import {
  AD_PLANS,
  PLAN_MAP,
} from '@/mocks/campaigns';
import { ACCOUNT_MAP, PLATFORM_MAP } from '@/mocks/platforms';
import {
  AUDIENCE,
  DIMS,
  ageTgiMatrix,
  audienceOf,
  confidenceOf,
  packsOf,
  profileOf,
  settingText,
  targetingHits,
  targetingSummary,
  topByShareOf,
  topByTgiOf,
} from '@/mocks/audience';
import { DIM_LABEL, type AudienceDim, type AudienceSegment, type LookalikePack, type TargetingHit } from '@/types';
import { int, money, pct, qty, wan } from '@/lib/format';

const PLANS = [...AD_PLANS].sort((a, b) => b.m.spend - a.m.spend);
const DEFAULT_PLAN = PLANS[0].id;

/** 配色跟「浓度提升倍数」走，与判定结论保持一致 */
const liftTone = (lift: number) => (lift >= 1.12 ? 'success' : lift >= 1.0 ? 'warning' : 'danger');
const liftText = (lift: number) =>
  lift >= 1.12 ? 'text-success' : lift >= 1.0 ? 'text-warning' : 'text-danger';
const hitBadge = (v: TargetingHit['verdict']) =>
  v === 'ok' ? { tone: 'green' as const, text: '定向精准' } : v === 'spill' ? { tone: 'amber' as const, text: '轻度溢出' } : { tone: 'red' as const, text: '明显跑偏' };

export default function Audience() {
  const [planId, setPlanId] = useState(DEFAULT_PLAN);
  const [dim, setDim] = useState<AudienceDim>('age');

  const plan = PLAN_MAP[planId];
  const account = ACCOUNT_MAP[plan.accountId];
  const platform = PLATFORM_MAP[account.platform];
  const segs = audienceOf(planId);
  const rows = segs[dim];
  const profile = profileOf(planId);
  const hits = targetingHits(planId);
  const { driftDims, spillDims, worst } = targetingSummary(planId);
  const packs = packsOf(planId);
  const maxShare = Math.max(...rows.map((r) => Math.max(r.convShare, r.benchmarkShare)));
  /** 收窄维度的平均浓度：圈内占比 / 自然基准，>1.12 视为定向有效 */
  const narrowedHits = hits.filter((h) => !h.open);
  const avgLift = narrowedHits.length
    ? narrowedHits.reduce((s, h) => s + h.lift, 0) / narrowedHits.length
    : 1;

  const matrix = ageTgiMatrix(8);
  const highTgi = topByTgiOf(planId, 'age', 2);
  const interestTop = topByShareOf(planId, 'interest', 1)[0];
  const hourTop = topByShareOf(planId, 'hour', 1)[0];
  const cityTop = topByShareOf(planId, 'city', 1)[0];

  /** 由当前广告的真实数据决定动作清单：先处理跑偏，再谈扩量 */
  const actions: { t: string; d: string }[] = [
    ...(worst
      ? [
          {
            t: `排除「${worst.spillLabel}」`,
            d: `${DIM_LABEL[worst.dim]}维度圈外占比 ${pct(worst.spillShareOfLabel, 1)}、TGI ${worst.spillTgi}，排除后定向命中率可到 92% 以上`,
          },
          {
            t: `收窄${DIM_LABEL[worst.dim]}范围`,
            d: `当前设定「${worst.settingText}」，建议只保留「${worst.actualTop}」为主的圈选`,
          },
        ]
      : [
          {
            t: '保持定向，小步扩量',
            d: `各维度定向均有效（平均浓度 ${avgLift.toFixed(2)}×），可按 15%/日 的幅度提预算观察 CPA`,
          },
          {
            t: `加投「${highTgi[0].label}」`,
            d: `该人群 TGI ${highTgi[0].tgi}，是这条广告效率最高的人群`,
          },
        ]),
    {
      t: '时段加权',
      d: `${hourTop.label} 贡献 ${pct(hourTop.convShare, 1)} 的转化，该时段预算系数可上浮 1.3 倍`,
    },
    {
      t: '地域加价',
      d: `${cityTop.label}是主力（${pct(cityTop.convShare, 1)}），可上浮出价 8%-12%`,
    },
  ];

  const columns: Column<AudienceSegment>[] = [
    {
      key: 'label',
      title: '人群',
      render: (r) => (
        <div>
          <div className="text-xs font-medium text-ink-1">{r.label}</div>
          <div className="mt-1 flex h-1.5 w-40 overflow-hidden rounded-full bg-[#F2F4F7]">
            <span className="bg-primary" style={{ width: `${(r.convShare / maxShare) * 100}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'convShare',
      title: '本广告转化占比',
      align: 'right',
      sorter: (a, b) => a.convShare - b.convShare,
      render: (r) => <span className="num text-xs font-medium text-ink-1">{pct(r.convShare, 1)}</span>,
    },
    {
      key: 'benchmarkShare',
      title: '大盘占比',
      align: 'right',
      render: (r) => <span className="num text-xs text-ink-3">{pct(r.benchmarkShare, 1)}</span>,
    },
    {
      key: 'tgi',
      title: 'TGI',
      align: 'right',
      sorter: (a, b) => a.tgi - b.tgi,
      render: (r) => (
        <Badge tone={r.tgi >= 140 ? 'red' : r.tgi >= 100 ? 'amber' : 'gray'}>
          {r.tgi}
          {r.tgi >= 140 ? ' 强' : ''}
        </Badge>
      ),
    },
    {
      key: 'conversions',
      title: '转化数',
      align: 'right',
      render: (r) => <span className="num text-xs text-ink-1">{int(r.conversions)}</span>,
    },
    {
      key: 'cpa',
      title: 'CPA',
      align: 'right',
      sorter: (a, b) => a.cpa - b.cpa,
      render: (r) => <span className="num text-xs text-ink-1">¥{r.cpa.toFixed(2)}</span>,
    },
    {
      key: 'roi',
      title: 'ROI',
      align: 'right',
      render: (r) => (
        <span
          className={`num text-xs font-medium ${
            r.roi >= 3.2 ? 'text-success' : r.roi >= 2.4 ? 'text-ink-1' : 'text-danger'
          }`}
        >
          {r.roi.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'verdict',
      title: '结论',
      render: (r) => (
        <span className="text-2xs text-ink-2">
          {r.tgi >= 140 ? '核心人群，加大定向' : r.tgi >= 100 ? '正常人群' : '低效人群，建议排除'}
        </span>
      ),
    },
  ];

  const hitColumns: Column<TargetingHit>[] = [
    {
      key: 'dim',
      title: '人群维度',
      width: 96,
      render: (r) => <span className="text-xs font-medium text-ink-1">{DIM_LABEL[r.dim]}</span>,
    },
    {
      key: 'settingText',
      title: '后台定向设定',
      render: (r) => <span className="text-xs text-ink-2">{r.settingText}</span>,
    },
    {
      key: 'actual',
      title: '实际 Top1',
      render: (r) => (
        <div>
          <div className="text-xs text-ink-1">{r.actualTop}</div>
          <div className="num text-2xs text-ink-3">占 {pct(r.actualTopShare, 1)}</div>
        </div>
      ),
    },
    {
      key: 'hitRate',
      title: '定向内转化占比',
      width: 190,
      sorter: (a, b) => a.hitRate - b.hitRate,
      render: (r) =>
        r.open ? (
          <span className="text-2xs text-ink-3">全量投放，未收窄</span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-24">
              <Progress value={r.hitRate * 100} tone={liftTone(r.lift)} height={5} />
            </div>
            <span className={`num text-xs font-medium ${liftText(r.lift)}`}>{pct(r.hitRate, 1)}</span>
            <span className={`num text-2xs ${liftText(r.lift)}`}>{r.lift.toFixed(2)}×</span>
          </div>
        ),
    },
    {
      key: 'spill',
      title: '圈外最大标签',
      render: (r) =>
        r.spillLabel === '—' ? (
          <span className="text-xs text-ink-3">—</span>
        ) : (
          <div>
            <div className="text-xs text-ink-2">{r.spillLabel}</div>
            <div className="num text-2xs text-ink-3">
              {pct(r.spillShareOfLabel, 1)} · TGI {r.spillTgi}
            </div>
          </div>
        ),
    },
    {
      key: 'verdict',
      title: '判定',
      render: (r) => {
        if (r.open) return <Badge tone="gray">未收窄</Badge>;
        const b = hitBadge(r.verdict);
        return <Badge tone={b.tone}>{b.text}</Badge>;
      },
    },
    {
      key: 'note',
      title: '说明',
      render: (r) => <span className="text-2xs leading-relaxed text-ink-2">{r.note}</span>,
    },
  ];

  const packColumns: Column<LookalikePack>[] = [
    { key: 'name', title: '人群包', render: (r) => <span className="text-xs font-medium text-ink-1">{r.name}</span> },
    { key: 'seed', title: '种子人群', render: (r) => <span className="text-2xs text-ink-2">{r.seed}</span> },
    {
      key: 'coverage',
      title: '覆盖人数',
      align: 'right',
      render: (r) => <span className="num text-xs text-ink-1">{qty(r.coverage)}</span>,
    },
    {
      key: 'similarity',
      title: '相似度',
      align: 'right',
      render: (r) =>
        r.similarity ? <span className="num text-xs text-ink-1">{r.similarity.toFixed(2)}</span> : <span className="text-xs text-ink-3">—</span>,
    },
    {
      key: 'roi',
      title: 'ROI',
      align: 'right',
      render: (r) => (r.roi ? <span className="num text-xs font-medium text-success">{r.roi.toFixed(2)}</span> : <span className="text-xs text-ink-3">—</span>),
    },
    { key: 'status', title: '状态', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="人群洞察"
        desc="逐个广告看：这条广告实际投给了谁、和后台定向差多少、下一步是收窄还是扩量"
        breadcrumb="模型分析 / 人群洞察"
        actions={
          <Badge tone="blue">
            {AD_PLANS.length} 个广告 · 6 个维度 {DIMS.reduce((s, d) => s + AUDIENCE[d].length, 0)} 个分组
          </Badge>
        }
      />

      {/* ---------- 广告选择条 ---------- */}
      <Card className="mb-4" pad={false}>
        <div className="flex items-center justify-between px-4 pt-3.5">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-ink-3" />
            <span className="text-sm font-semibold text-ink-1">选择广告</span>
            <span className="text-2xs text-ink-3">按本月消耗排序，点击切换</span>
          </div>
          <div className="flex items-center gap-2 text-2xs text-ink-3">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" /> 定向跑偏
            </span>
            <span>共 {PLANS.length} 条</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3.5 pt-3">
          {PLANS.map((p) => {
            const active = p.id === planId;
            const drift = targetingSummary(p.id).worst;
            const acct = ACCOUNT_MAP[p.accountId];
            return (
              <button
                key={p.id}
                onClick={() => setPlanId(p.id)}
                className={`w-[196px] shrink-0 rounded-ctl border px-3 py-2.5 text-left transition ${
                  active
                    ? 'border-primary bg-primary-soft ring-1 ring-primary-ring'
                    : 'border-line bg-white hover:border-primary-ring hover:bg-[#FAFAFB]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`truncate text-xs font-medium ${active ? 'text-primary' : 'text-ink-1'}`}>{p.name}</span>
                  {drift && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />}
                </div>
                <div className="mt-1 truncate text-2xs text-ink-3">
                  {PLATFORM_MAP[acct.platform].name} · {p.id}
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="num text-xs text-ink-1">{wan(p.m.spend)}</span>
                  <span className="num text-2xs text-ink-3">CPA ¥{Math.round(p.m.spend / Math.max(1, p.m.conversions))}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ---------- 当前广告概览 ---------- */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-ink-1">{plan.name}</span>
              <StatusBadge status={plan.status} />
              <Badge tone="gray">{plan.objective}</Badge>
              <Badge tone="gray">
                {plan.bidType} ¥{plan.bid}
              </Badge>
            </div>
            <div className="mt-1.5 text-2xs text-ink-3">
              {platform.name} · {account.name}（{account.id}）· 起投 {plan.startDate} · 日预算 ¥{int(plan.dailyBudget)}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <MiniStat label="消耗" value={money(plan.m.spend)} />
            <MiniStat label="转化" value={int(plan.m.conversions)} unit="单" />
            <MiniStat label="CPA" value={`¥${(plan.m.spend / Math.max(1, plan.m.conversions)).toFixed(2)}`} />
            <MiniStat label="ROI" value={(plan.m.gmv / Math.max(1, plan.m.spend)).toFixed(2)} tone="success" />
            <MiniStat
              label="定向浓度"
              value={`${avgLift.toFixed(2)}×`}
              tone={avgLift >= 1.12 ? 'success' : avgLift >= 1.0 ? 'warning' : 'danger'}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {DIMS.map((d) => (
            <div key={d}>
              <div className="text-2xs text-ink-3">{DIM_LABEL[d]}定向</div>
              <div className="mt-0.5 truncate text-xs text-ink-1" title={settingText(planId, d)}>
                {settingText(planId, d)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ---------- 结论 + 六维 Top1 ---------- */}
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl bg-primary-soft text-primary">
              <Target size={17} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-ink-1">这条广告的目标用户</span>
                <Badge tone="purple">模型置信度 {confidenceOf(planId)}%</Badge>
                <Badge tone="gray">样本 {int(plan.m.conversions)} 次转化</Badge>
                {driftDims.length > 0 && <Badge tone="red">{driftDims.length} 个维度明显跑偏</Badge>}
                {driftDims.length === 0 && spillDims.length > 0 && (
                  <Badge tone="amber">{spillDims.length} 个维度轻度溢出</Badge>
                )}
              </div>
              <div className="mt-1 text-sm font-medium text-ink-1">{profile.title}</div>
              <p className="mt-2 text-xs leading-relaxed text-ink-2">{profile.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.coreTags.map((t) => (
                  <span key={t} className="rounded-full bg-[#F2F4F7] px-2 py-1 text-2xs text-ink-2">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
            <MiniStat label="该画像可拓展规模" value={qty(profile.sizeEstimate)} unit="人" />
            <MiniStat label="该广告 ROI" value={profile.roi.toFixed(2)} unit="倍" tone="success" />
            <MiniStat label="该广告 CPA" value={`¥${profile.cpa.toFixed(2)}`} unit="" />
            <MiniStat label="核心人群转化强度" value={`${profile.cvrLift.toFixed(2)}×`} unit="相对大盘" tone="primary" />
          </div>
        </Card>

        <Card>
          <CardHeader title="高 TGI 人群（本广告各维度 Top1）" desc="TGI = 本广告转化占比 / 大盘占比 × 100" />
          <div className="mt-3 space-y-2.5">
            {DIMS.map((d) => {
              const top = topByTgiOf(planId, d, 1)[0];
              return (
                <div key={d} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-2xs text-ink-3">{DIM_LABEL[d]}</div>
                    <div className="truncate text-xs font-medium text-ink-1">{top.label}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="num text-xs text-ink-2">{pct(top.convShare, 1)}</span>
                    <Badge tone={top.tgi >= 140 ? 'red' : top.tgi >= 100 ? 'amber' : 'gray'}>TGI {top.tgi}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-ctl bg-[#F9FAFB] p-3 text-2xs leading-relaxed text-ink-2">
            <span className="font-medium text-ink-1">一句话结论：</span>
            这条广告真正成交的是「{highTgi[0].label} + {interestTop.label}」人群，
            {worst ? `但${DIM_LABEL[worst.dim]}上定向设成了「${worst.settingText}」，实际「${worst.spillLabel}」占了 ${pct(worst.spillShareOfLabel, 1)}，钱有一部分花在了圈外。` : '六个维度都与定向一致，可以放心扩量。'}
          </div>
        </Card>
      </div>

      {/* ---------- 定向 vs 实际 ---------- */}
      <Card className="mb-4">
        <CardHeader
          title="定向设定 vs 实际触达"
          desc="后台圈的人 ≠ 实际成交的人。判定看「圈内浓度是自然分布的几倍」：≥1.12 倍为定向有效，<1 倍说明定向等于没起作用"
          extra={
            <div className="flex items-center gap-2">
              {driftDims.length > 0 ? (
                <Badge tone="red" dot>
                  {driftDims.length} 个维度明显跑偏
                </Badge>
              ) : spillDims.length > 0 ? (
                <Badge tone="amber" dot>
                  {spillDims.length} 个维度轻度溢出
                </Badge>
              ) : (
                <Badge tone="green" dot>
                  收窄维度全部命中
                </Badge>
              )}
            </div>
          }
        />
        <div className="mt-3">
          <DataTable columns={hitColumns} rows={hits} rowKey={(r) => r.dim} pageSize={6} dense />
        </div>
        {worst && (
          <div className="mt-3 flex items-start gap-2 rounded-ctl border border-warning-ring bg-warning-soft px-3 py-2.5">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warning" />
            <div className="text-2xs leading-relaxed text-[#93370D]">
              <span className="font-medium">最需要处理的是{DIM_LABEL[worst.dim]}：</span>
              {worst.note}。收窄后该维度命中率可从 {pct(worst.hitRate, 1)} 拉到 90% 以上，
              对应约 ¥{int(Math.round(plan.m.spend * worst.spillShare))} 的消耗会从圈外人群转回核心人群。
            </div>
          </div>
        )}
      </Card>

      {/* ---------- 维度下钻 ---------- */}
      <Card className="mb-4">
        <CardHeader
          title="人群结构下钻"
          desc="只统计这条广告的转化；同一维度下各人群占比合计 100%"
          extra={
            <span className="text-2xs text-ink-3">
              Σ转化 = {int(rows.reduce((s, r) => s + r.conversions, 0))} 单（= 该广告总转化）
            </span>
          }
        />
        <Tabs
          className="mt-2"
          tabs={DIMS.map((d) => ({ key: d, label: DIM_LABEL[d], count: segs[d].length }))}
          active={dim}
          onChange={(k) => setDim(k as AudienceDim)}
        />
        <div className="mt-3">
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.label} pageSize={10} />
        </div>
      </Card>

      {/* ---------- 人群包 + 动作 ---------- */}
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="self-start xl:col-span-2">
          <CardHeader
            title="这条广告在用的人群包"
            desc="定向包直接作用在计划上，换成高相似度包通常能带来 10%-20% 的 CPA 改善"
            extra={<Badge tone="blue">{packs.length} 个</Badge>}
          />
          <div className="mt-3">
            {packs.length ? (
              <DataTable columns={packColumns} rows={packs} rowKey={(r) => r.id} pageSize={5} dense />
            ) : (
              <div className="rounded-ctl border border-dashed border-line py-8 text-center text-xs text-ink-3">
                这条广告目前用的是系统自动定向，没有绑定人群包
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="基于这份洞察的动作" desc="按优先级排序，可直接下发" />
          <ol className="mt-3 space-y-3">
            {actions.map((s, i) => (
              <li key={s.t} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-2xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <div className="text-xs font-medium text-ink-1">{s.t}</div>
                  <div className="mt-0.5 text-2xs leading-relaxed text-ink-3">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex items-center gap-1.5 rounded-ctl border border-primary-ring bg-primary-soft px-3 py-2 text-2xs text-primary">
            <Sparkles size={12} />
            已生成定向类建议，可在「优化建议」一键下发
            <ArrowRight size={12} />
          </div>
        </Card>
      </div>

      {/* ---------- 跨广告对比 ---------- */}
      <Card>
        <CardHeader
          title="同账户跨广告人群对比"
          desc="同样投户外，不同广告吸引的人并不一样 —— 这张表用年龄 TGI 横向对比消耗 Top 8 的广告，找「谁在抢同一批人」"
          extra={<Badge tone="gray">TGI ≥ 140 为强偏向</Badge>}
        />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 pr-3 text-left text-2xs font-medium text-ink-3">广告</th>
                {matrix.ageLabels.map((l) => (
                  <th key={l} className="px-2 py-2 text-center text-2xs font-medium text-ink-3">
                    {l}
                  </th>
                ))}
                <th className="px-2 py-2 text-right text-2xs font-medium text-ink-3">消耗</th>
              </tr>
            </thead>
            <tbody>
              {matrix.plans.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-line/60 ${p.id === planId ? 'bg-primary-soft/40' : ''}`}
                >
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => setPlanId(p.id)}
                      className={`text-left text-xs ${p.id === planId ? 'font-medium text-primary' : 'text-ink-1 hover:text-primary'}`}
                    >
                      {p.name}
                    </button>
                    <div className="text-2xs text-ink-3">{p.id}</div>
                  </td>
                  {p.cells.map((c) => (
                    <td key={c.label} className="px-1 py-2 text-center">
                      <span className={`num inline-flex h-6 min-w-[44px] items-center justify-center rounded text-2xs font-medium ${tgiCell(c.tgi)}`}>
                        {c.tgi}
                      </span>
                    </td>
                  ))}
                  <td className="num px-2 py-2 text-right text-2xs text-ink-2">{wan(p.spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-2xs leading-relaxed text-ink-3">
          读法：同一列里颜色越深，说明这条广告在该年龄段的人群浓度越高。若两条广告的核心列重合，
          说明它们在抢同一批流量，可以考虑错峰投放或合并预算，避免自己抬自己的价。
        </div>
      </Card>
    </>
  );
}

function tgiCell(tgi: number) {
  if (tgi >= 160) return 'bg-[#FEE4E2] text-[#B42318]';
  if (tgi >= 125) return 'bg-[#FEF3C7] text-[#B54708]';
  if (tgi >= 100) return 'bg-[#F2F4F7] text-ink-2';
  return 'bg-white text-ink-3 border border-line';
}

function MiniStat({
  label,
  value,
  unit,
  tone = 'default',
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}) {
  const color = {
    default: 'text-ink-1',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  }[tone];
  return (
    <div>
      <div className="text-2xs text-ink-3">{label}</div>
      <div className={`num mt-0.5 text-base font-semibold ${color}`}>
        {value}
        {unit && <span className="ml-1 text-2xs font-normal text-ink-3">{unit}</span>}
      </div>
    </div>
  );
}
