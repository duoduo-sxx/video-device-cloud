import { useState } from 'react';
import { ArrowRight, Sparkles, Target, Users } from 'lucide-react';
import { Card, CardHeader, KV, PageHeader, StatCard } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Overlay';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { AUDIENCE, LOOKALIKE_PACKS, TARGET_PROFILE, segmentsOf, topByTgi } from '@/mocks/audience';
import { DIM_LABEL, type AudienceDim, type AudienceSegment, type LookalikePack } from '@/types';
import { qty, num, pct, wan } from '@/lib/format';
import { totalMetrics, CURRENT_PERIOD } from '@/mocks/daily';

const TOTAL = totalMetrics(CURRENT_PERIOD);
const DIMS: AudienceDim[] = ['age', 'interest', 'city', 'gender', 'device', 'hour'];

export default function Audience() {
  const [dim, setDim] = useState<AudienceDim>('age');
  const rows = segmentsOf(dim);
  const maxShare = Math.max(...rows.map((r) => Math.max(r.convShare, r.benchmarkShare)));

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
      title: '转化占比',
      align: 'right',
      sorter: (a, b) => a.convShare - b.convShare,
      render: (r) => <span className="num text-xs text-ink-1">{pct(r.convShare, 1)}</span>,
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
      render: (r) => <span className="num text-xs text-ink-1">{num(r.conversions)}</span>,
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
        <span className={`num text-xs font-medium ${r.roi >= 3.2 ? 'text-success' : r.roi >= 2.4 ? 'text-ink-1' : 'text-danger'}`}>
          {r.roi.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'verdict',
      title: '结论',
      render: (r) => (
        <span className="text-2xs text-ink-2">
          {r.tgi >= 140 ? '核心人群，建议加大定向' : r.tgi >= 100 ? '正常人群' : '低效人群，建议排除'}
        </span>
      ),
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
      render: (r) => (r.similarity ? <span className="num text-xs text-ink-1">{r.similarity.toFixed(2)}</span> : <span className="text-xs text-ink-3">—</span>),
    },
    { key: 'planCount', title: '在投计划', align: 'right', render: (r) => <span className="num text-xs text-ink-1">{r.planCount}</span> },
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
        desc="模型基于近 30 天全部转化做人群特征提取，回答「谁才是这个广告的真实目标用户」"
        breadcrumb="模型分析 / 人群洞察"
        actions={<Badge tone="blue">样本：{num(TOTAL.conversions)} 次下单 · 6 个维度 28 个分组</Badge>}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl bg-primary-soft text-primary">
              <Target size={17} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-ink-1">目标用户结论</span>
                <Badge tone="purple">模型置信度 87%</Badge>
              </div>
              <div className="mt-1 text-sm font-medium text-ink-1">{TARGET_PROFILE.title}</div>
              <p className="mt-2 text-xs leading-relaxed text-ink-2">{TARGET_PROFILE.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {TARGET_PROFILE.coreTags.map((t) => (
                  <span key={t} className="rounded-full bg-[#F2F4F7] px-2 py-1 text-2xs text-ink-2">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
            <MiniStat label="可拓展规模" value={qty(TARGET_PROFILE.sizeEstimate)} unit="人" />
            <MiniStat label="该人群 ROI" value={TARGET_PROFILE.roi.toFixed(2)} unit="倍" tone="success" />
            <MiniStat label="该人群 CPA" value={`¥${TARGET_PROFILE.cpa}`} unit="" />
            <MiniStat label="转化率提升" value={`${TARGET_PROFILE.cvrLift}×`} unit="相对大盘" tone="primary" />
          </div>
        </Card>

        <Card>
          <CardHeader title="高 TGI 人群（各维度 Top1）" desc="TGI = 转化占比 / 大盘占比 × 100，越高越值得定向" />
          <div className="mt-3 space-y-2.5">
            {DIMS.map((d) => {
              const top = topByTgi(d, 1)[0];
              return (
                <div key={d} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-2xs text-ink-3">{DIM_LABEL[d]}</div>
                    <div className="truncate text-xs font-medium text-ink-1">{top.label}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="num text-xs text-ink-2">{pct(top.convShare, 1)}</span>
                    <Badge tone={top.tgi >= 140 ? 'red' : 'amber'}>TGI {top.tgi}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-ctl bg-[#F9FAFB] p-3 text-2xs leading-relaxed text-ink-2">
            <span className="font-medium text-ink-1">一句话结论：</span>
            真正带来成交的不是「泛户外」，而是「城市中产 + 周末轻户外」；「服饰穿搭」「亲子家庭」两类标签 TGI 均低于 60，属于应当排除的低效人群。
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader
          title="维度下钻"
          desc="切换维度查看该维度内各人群的转化占比、大盘占比与效率差异；同维度占比合计 100%"
          extra={
            <span className="text-2xs text-ink-3">
              Σ转化 = {num(rows.reduce((s, r) => s + r.conversions, 0))} 单（与总转化一致）
            </span>
          }
        />
        <Tabs
          className="mt-2"
          tabs={DIMS.map((d) => ({ key: d, label: DIM_LABEL[d], count: AUDIENCE[d].length }))}
          active={dim}
          onChange={(k) => setDim(k as AudienceDim)}
        />
        <div className="mt-3">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.label}
            pageSize={10}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="人群包（Lookalike）"
            desc="由高价值种子人群扩展而来，可直接推送到投放平台做定向"
            extra={<Badge tone="blue">6 个人群包</Badge>}
          />
          <div className="mt-3">
            <DataTable columns={packColumns} rows={LOOKALIKE_PACKS} rowKey={(r) => r.id} pageSize={6} dense />
          </div>
        </Card>

        <Card>
          <CardHeader title="怎么用这份洞察" desc="从结论到投放动作" />
          <ol className="mt-3 space-y-3">
            {[
              { t: '收窄定向', d: '把「户外露营 / 徒步登山 / 运动户外」设为核心兴趣，排除「服饰穿搭」泛兴趣' },
              { t: '扩量人群包', d: '用 LK-01（相似度 0.82）在抖音侧扩量，已带来 ROI 4.21' },
              { t: '分人群出价', d: 'iOS + 一线城市人群客单更高，可上浮出价 8%-12%' },
              { t: '时段加权', d: '20:00-23:00 转化占比 30%，建议该时段预算加权 1.3 倍' },
            ].map((s, i) => (
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
            已生成 2 条定向类建议，可在「优化建议」中一键下发
            <ArrowRight size={12} />
          </div>
        </Card>
      </div>
    </>
  );
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
  tone?: 'default' | 'primary' | 'success';
}) {
  const color = { default: 'text-ink-1', primary: 'text-primary', success: 'text-success' }[tone];
  return (
    <div>
      <div className="text-2xs text-ink-3">{label}</div>
      <div className={`num mt-0.5 text-lg font-semibold ${color}`}>
        {value}
        {unit && <span className="ml-1 text-2xs font-normal text-ink-3">{unit}</span>}
      </div>
    </div>
  );
}
