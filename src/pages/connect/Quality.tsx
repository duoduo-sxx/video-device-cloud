import { useState } from 'react';
import { ShieldCheck, TriangleAlert } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { Badge, LevelBadge, StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Overlay';
import { Progress } from '@/components/ui/Overlay';
import { QUALITY_CHECKS, TABLE_MAP } from '@/mocks/pipeline';
import { num, pct } from '@/lib/format';

const CATEGORIES = ['全部', '完整性', '及时性', '一致性', '唯一性', '有效性'];

export default function Quality() {
  const [cat, setCat] = useState('全部');
  const rows = QUALITY_CHECKS.filter((q) => cat === '全部' || q.category === cat);

  const failed = QUALITY_CHECKS.filter((q) => q.status === 'failed');
  const warn = QUALITY_CHECKS.filter((q) => q.status === 'warning');
  const totalAffected = QUALITY_CHECKS.reduce((s, q) => s + q.affectedRows, 0);

  return (
    <>
      <PageHeader
        title="数据质量"
        desc="10 条校验规则覆盖完整性、及时性、一致性、唯一性、有效性；每条规则都会给出「命中行数 / 总行数」与处理结论，避免脏数据污染模型"
        breadcrumb="数据接入 / 数据质量"
        actions={
          <>
            <Badge tone="red">{failed.length} 条未通过</Badge>
            <Badge tone="amber">{warn.length} 条警告</Badge>
            <Badge tone="green">{QUALITY_CHECKS.filter((q) => q.status === 'passed').length} 条通过</Badge>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="text-xs text-ink-2">规则通过率</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="num text-3xl font-semibold text-ink-1">
              {((QUALITY_CHECKS.filter((q) => q.status === 'passed').length / QUALITY_CHECKS.length) * 100).toFixed(0)}
            </span>
            <span className="text-xs text-ink-3">%</span>
          </div>
          <div className="mt-2">
            <Progress
              value={(QUALITY_CHECKS.filter((q) => q.status === 'passed').length / QUALITY_CHECKS.length) * 100}
              tone="warning"
            />
          </div>
          <div className="mt-2 text-2xs text-ink-3">8/10 通过，2 条需人工确认</div>
        </Card>
        <Card>
          <div className="text-xs text-ink-2">受影响行数</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="num text-3xl font-semibold text-warning">{num(totalAffected)}</span>
            <span className="text-xs text-ink-3">行</span>
          </div>
          <div className="mt-2 text-2xs leading-relaxed text-ink-3">
            主要集中在人群标签覆盖不足（1,289,400 行）与小红书断流（12,480 行）
          </div>
        </Card>
        <Card>
          <div className="text-xs text-ink-2">对下游的影响</div>
          <ul className="mt-2 space-y-1.5 text-2xs leading-relaxed text-ink-2">
            <li className="flex gap-1.5">
              <TriangleAlert size={11} className="mt-0.5 shrink-0 text-danger" />
              ACC-501 数据断流 → DWS 日汇总已剔除，人群洞察中该账户权重为 0
            </li>
            <li className="flex gap-1.5">
              <TriangleAlert size={11} className="mt-0.5 shrink-0 text-warning" />
              腾讯口径折算 3.5% → 归因结果与平台后台存在系统性差异
            </li>
            <li className="flex gap-1.5">
              <ShieldCheck size={11} className="mt-0.5 shrink-0 text-success" />
              主键去重与逻辑校验全部通过，无重复计数与转化倒挂
            </li>
          </ul>
        </Card>
      </div>

      <Card className="mb-4">
        <Tabs
          tabs={CATEGORIES.map((c) => ({
            key: c,
            label: c,
            count: c === '全部' ? QUALITY_CHECKS.length : QUALITY_CHECKS.filter((q) => q.category === c).length,
          }))}
          active={cat}
          onChange={setCat}
        />
      </Card>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {rows.map((q) => (
          <Card key={q.id} className="!p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="num text-2xs text-ink-3">{q.id}</span>
                  <Badge tone="gray">{q.category}</Badge>
                  <StatusBadge status={q.status} />
                </div>
                <div className="mt-1.5 text-xs font-medium leading-snug text-ink-1">{q.rule}</div>
                <div className="num mt-1 text-2xs text-ink-3">
                  {q.table} · {TABLE_MAP[q.table]?.cnName ?? '—'}
                </div>
              </div>
              <LevelBadge level={q.severity} />
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between text-2xs">
                  <span className="text-ink-3">命中行数</span>
                  <span className="num text-ink-2">
                    {num(q.affectedRows)} / {num(q.totalRows)}
                  </span>
                </div>
                <Progress
                  value={(q.affectedRows / q.totalRows) * 100}
                  tone={q.severity === 'high' ? 'danger' : q.severity === 'medium' ? 'warning' : 'primary'}
                />
              </div>
              <div className="w-16 text-right">
                <div className="num text-xs font-medium text-ink-1">
                  {pct(q.affectedRows / q.totalRows, 2)}
                </div>
                <div className="text-2xs text-ink-3">影响占比</div>
              </div>
            </div>

            <div className="mt-3 rounded-ctl bg-[#F9FAFB] px-2.5 py-2 text-2xs leading-relaxed text-ink-2">
              {q.detail}
            </div>
            <div className="mt-2 flex items-center justify-between text-2xs text-ink-3">
              <span>校验时间 {q.checkedAt.slice(5, 16).replace('T', ' ')}</span>
              <span>规则来自 dbt tests / 自定义 SQL</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader title="脏数据处理策略" desc="不同问题对应不同的下游处理方式，保证指标口径不被污染" />
        <div className="mt-3 overflow-hidden rounded-ctl border border-line">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#FCFCFD] text-left text-2xs text-ink-3">
                <th className="px-3 py-2 font-normal">问题类型</th>
                <th className="px-3 py-2 font-normal">处理方式</th>
                <th className="px-3 py-2 font-normal">对指标的影响</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['字段缺失（creative_id）', '按 material_id 反查补齐，补不齐标记 unknown', '素材效果分析中 unknown 素材不参与排名'],
                ['主键重复', '按 updated_at 取最新一条', '消耗与转化不会重复计数'],
                ['口径不一致（腾讯支付 vs 巨量下单）', '在 DWD 层按 1.035 系数折算为下单', '平台间可比，但与腾讯后台展示值有 3.5% 差异'],
                ['数据断流（授权过期）', '从 DWS 汇总中剔除该账户，并标记缺失', '总览消耗自动下降，不虚高、不补 0'],
                ['人群标签覆盖不足', '按已覆盖样本比例重分配，未覆盖归入「未知」', '人群占比合计仍为 100%，但置信度下降'],
              ].map((r) => (
                <tr key={r[0]} className="border-t border-line/60">
                  <td className="px-3 py-2 text-ink-1">{r[0]}</td>
                  <td className="px-3 py-2 text-ink-2">{r[1]}</td>
                  <td className="px-3 py-2 text-ink-3">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
