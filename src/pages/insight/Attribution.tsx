import { useState } from 'react';
import { GitBranch, Info } from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Overlay';
import DataTable, { type Column } from '@/components/ui/DataTable';
import {
  ATTR_NOTES,
  ATTRIBUTION,
  TOUCH_PATHS,
  attributionDelta,
  firstTouchContribution,
} from '@/mocks/attribution';
import { PLATFORM_MAP, PLATFORMS } from '@/mocks/platforms';
import { metricsOfPlatform, totalMetrics, CURRENT_PERIOD } from '@/mocks/daily';
import { ATTR_MODEL_LABEL, type AttributionModel, type PlatformCode } from '@/types';
import { roi } from '@/lib/metrics';
import { num, pct } from '@/lib/format';

const MODELS: AttributionModel[] = ['last', 'first', 'linear', 'time_decay', 'data_driven'];
const TOTAL_CONV = totalMetrics(CURRENT_PERIOD).conversions;

export default function Attribution() {
  const [model, setModel] = useState<AttributionModel>('data_driven');
  const rows = attributionDelta(model);
  const firstTouch = firstTouchContribution();

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: 'platform',
      title: '平台',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: PLATFORM_MAP[r.platform].color }} />
          <span className="text-xs text-ink-1">{PLATFORM_MAP[r.platform].name}</span>
        </div>
      ),
    },
    {
      key: 'conversions',
      title: '归因转化',
      align: 'right',
      sorter: (a, b) => a.conversions - b.conversions,
      render: (r) => <span className="num text-xs text-ink-1">{num(r.conversions)}</span>,
    },
    {
      key: 'share',
      title: '归因占比',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#F2F4F7]">
            <div className="h-full bg-primary" style={{ width: `${r.share * 100}%` }} />
          </div>
          <span className="num w-12 text-right text-xs text-ink-1">{pct(r.share, 1)}</span>
        </div>
      ),
    },
    {
      key: 'actualShare',
      title: '平台实际占比',
      align: 'right',
      render: (r) => <span className="num text-xs text-ink-3">{pct(r.actualShare, 1)}</span>,
    },
    {
      key: 'delta',
      title: '差异',
      align: 'right',
      render: (r) => (
        <span className={`num text-xs font-medium ${r.delta > 0.005 ? 'text-success' : r.delta < -0.005 ? 'text-danger' : 'text-ink-3'}`}>
          {r.delta > 0 ? '+' : ''}
          {(r.delta * 100).toFixed(1)}pp
        </span>
      ),
    },
    {
      key: 'roi',
      title: '平台 ROI',
      align: 'right',
      render: (r) => (
        <span className="num text-xs text-ink-1">{roi(metricsOfPlatform(r.platform as PlatformCode, CURRENT_PERIOD)).toFixed(2)}</span>
      ),
    },
  ];

  const pathColumns: Column<(typeof TOUCH_PATHS)[number]>[] = [
    { key: 'path', title: '转化路径', render: (r) => <span className="text-xs text-ink-1">{r.path}</span> },
    { key: 'conversions', title: '转化数', align: 'right', render: (r) => <span className="num text-xs text-ink-1">{num(r.conversions)}</span> },
    { key: 'share', title: '占比', align: 'right', render: (r) => <span className="num text-xs text-ink-2">{pct(r.share, 1)}</span> },
    { key: 'avgTouch', title: '平均触点', align: 'right', render: (r) => <span className="num text-xs text-ink-2">{r.avgTouch.toFixed(1)}</span> },
    { key: 'avgDays', title: '转化周期', align: 'right', render: (r) => <span className="num text-xs text-ink-2">{r.avgDays.toFixed(1)} 天</span> },
    { key: 'roi', title: '路径 ROI', align: 'right', render: (r) => <span className="num text-xs font-medium text-success">{r.roi.toFixed(2)}</span> },
  ];

  const biggestUnderstated = [...firstTouch].sort((a, b) => b.gap - a.gap)[0];

  return (
    <>
      <PageHeader
        title="归因分析"
        desc="同一批转化，用 5 种模型分配，总转化永远相同，但平台之间的贡献差异巨大——这正是「预算该给谁」的分歧来源"
        breadcrumb="模型分析 / 归因分析"
        actions={<Badge tone="blue">总转化 {num(TOTAL_CONV)} 单 · 5 模型合计均等于该值</Badge>}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="归因窗口" value="7" unit="天" hint="点击后 7 日内转化计入" />
        <StatCard
          label="被低估平台"
          value={PLATFORM_MAP[biggestUnderstated.platform].short}
          hint={`首触比末触多 ${num(biggestUnderstated.gap)} 单（+${biggestUnderstated.understated.toFixed(0)}%）`}
          tone="warning"
        />
        <StatCard
          label="平均触点"
          value={(TOUCH_PATHS.reduce((s, p) => s + p.avgTouch * p.conversions, 0) / TOUCH_PATHS.reduce((s, p) => s + p.conversions, 0)).toFixed(1)}
          unit="次"
          hint="用户平均接触 3.4 个广告后才下单"
        />
        <StatCard label="Top6 路径覆盖" value={pct(TOUCH_PATHS.reduce((s, p) => s + p.share, 0) / 100, 0)} hint="其余为长尾组合" />
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Tabs
            tabs={MODELS.map((m) => ({ key: m, label: ATTR_MODEL_LABEL[m] }))}
            active={model}
            onChange={(k) => setModel(k as AttributionModel)}
          />
          <div className="flex items-start gap-1.5 rounded-ctl bg-[#F9FAFB] px-3 py-2 text-2xs text-ink-2">
            <Info size={12} className="mt-0.5 shrink-0 text-ink-3" />
            {ATTR_NOTES[model]}
          </div>
        </div>
        <div className="mt-3">
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.platform} pageSize={6} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-line pt-2 text-2xs text-ink-3">
          <span>
            Σ 归因转化 ={' '}
            <span className="num font-medium text-ink-1">{num(ATTRIBUTION.find((a) => a.model === model)!.total)}</span> 单
          </span>
          <span>
            与总转化差异{' '}
            <span className="num text-success">
              {ATTRIBUTION.find((a) => a.model === model)!.total - TOTAL_CONV} 单
            </span>
          </span>
          <span>「差异」列 = 该模型归因占比 − 平台末次口径占比，正数表示该平台被末次归因低估</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="典型转化路径（Top 6）" desc="路径反映真实的跨平台决策链路，而不是单一平台的「末次功劳」" />
          <div className="mt-3">
            <DataTable columns={pathColumns} rows={TOUCH_PATHS} rowKey={(r) => r.path} pageSize={6} dense />
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="首触 vs 末触" desc="内容种草平台被末次归因系统性低估" />
          <div className="mt-3 space-y-2">
            {firstTouch
              .slice()
              .sort((a, b) => b.gap - a.gap)
              .map((f) => (
                <div key={f.platform} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-2xs text-ink-2">{PLATFORM_MAP[f.platform].short}</span>
                  <div className="flex flex-1 items-center gap-1">
                    <div className="h-4 flex-1 overflow-hidden rounded-sm bg-[#F2F4F7]">
                      <div
                        className="h-full bg-primary/80"
                        style={{ width: `${(f.firstTouch / TOTAL_CONV) * 100 * 2.2}%` }}
                      />
                    </div>
                    <div className="h-4 flex-1 overflow-hidden rounded-sm bg-[#F2F4F7]">
                      <div className="h-full bg-[#98A2B3]" style={{ width: `${(f.lastTouch / TOTAL_CONV) * 100 * 2.2}%` }} />
                    </div>
                  </div>
                  <span className={`num w-14 text-right text-2xs ${f.gap > 0 ? 'text-success' : 'text-ink-3'}`}>
                    {f.gap > 0 ? '+' : ''}
                    {num(f.gap)}
                  </span>
                </div>
              ))}
            <div className="flex items-center gap-3 pt-1 text-2xs text-ink-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 rounded-sm bg-primary/80" /> 首触归因
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 rounded-sm bg-[#98A2B3]" /> 末触归因
              </span>
            </div>
          </div>
          <div className="mt-3 rounded-ctl bg-warning-soft px-3 py-2 text-2xs leading-relaxed text-warning">
            <span className="inline-flex items-center gap-1 font-medium">
              <GitBranch size={11} /> 决策含义
            </span>
            <div className="mt-1">
              {PLATFORM_MAP[biggestUnderstated.platform].name} 在首触归因下多贡献 {num(biggestUnderstated.gap)} 单。
              如果只看末次点击，会把它当成「无效渠道」而砍掉，直接损伤拉新能力。
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="五模型对比（平台维度）" desc="同一行是同一个平台，不同列是不同模型的归因结果" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-left text-2xs text-ink-3">
                <th className="pb-2 font-normal">平台</th>
                {MODELS.map((m) => (
                  <th key={m} className="pb-2 text-right font-normal">
                    {ATTR_MODEL_LABEL[m]}
                  </th>
                ))}
                <th className="pb-2 text-right font-normal">最大分歧</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORMS.map((p) => {
                const vals = MODELS.map((m) => ATTRIBUTION.find((a) => a.model === m)!.byPlatform[p.code]);
                const spread = Math.max(...vals) - Math.min(...vals);
                return (
                  <tr key={p.code} className="border-b border-line/60 last:border-0">
                    <td className="py-2 text-ink-1">{p.name}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="num py-2 text-right text-ink-2">
                        {num(v)}
                      </td>
                    ))}
                    <td className={`num py-2 text-right font-medium ${spread > 300 ? 'text-danger' : 'text-ink-3'}`}>
                      {num(spread)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-[#FCFCFD]">
                <td className="py-2 font-medium text-ink-1">合计</td>
                {MODELS.map((m) => (
                  <td key={m} className="num py-2 text-right font-medium text-ink-1">
                    {num(ATTRIBUTION.find((a) => a.model === m)!.total)}
                  </td>
                ))}
                <td className="num py-2 text-right text-success">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
