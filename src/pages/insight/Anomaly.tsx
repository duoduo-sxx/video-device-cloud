import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui/Card';
import { Badge, LevelBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Overlay';
import { ANOMALIES } from '@/mocks/insights';
import { ACCOUNT_MAP } from '@/mocks/platforms';
import { ANOMALY_TYPE_LABEL, type AnomalyType } from '@/types';
import { pct } from '@/lib/format';

const TYPES: Array<{ key: string; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'cost_up', label: '成本上涨' },
  { key: 'volume_drop', label: '掉量' },
  { key: 'material_fatigue', label: '素材疲劳' },
  { key: 'quality', label: '数据异常' },
  { key: 'budget_pace', label: '预算节奏' },
  { key: 'cvr_down', label: '转化下滑' },
];

export default function Anomaly() {
  const [type, setType] = useState('all');
  const [open, setOpen] = useState<string | null>('AN-001');

  const rows = ANOMALIES.filter((a) => type === 'all' || a.type === type);
  const high = ANOMALIES.filter((a) => a.level === 'high').length;

  return (
    <>
      <PageHeader
        title="异常诊断"
        desc="不是简单报「指标变了」，而是逐层下钻给出根因链路：账户 → 计划 → 创意 → 素材，每一层都有数据支撑"
        breadcrumb="模型分析 / 异常诊断"
        actions={
          <>
            <Badge tone="red">{high} 个高优先级</Badge>
            <Badge tone="blue">{ANOMALIES.length} 条诊断结论</Badge>
          </>
        }
      />

      <Card className="mb-4">
        <Tabs
          tabs={TYPES.map((t) => ({
            key: t.key,
            label: t.label,
            count: t.key === 'all' ? ANOMALIES.length : ANOMALIES.filter((a) => a.type === t.key).length,
          }))}
          active={type}
          onChange={setType}
        />
      </Card>

      <div className="space-y-3">
        {rows.map((a) => {
          const expanded = open === a.id;
          return (
            <Card key={a.id} className="!p-0" pad={false}>
              <button
                onClick={() => setOpen(expanded ? null : a.id)}
                className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left hover:bg-[#FCFCFD]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={a.level === 'high' ? 'red' : a.level === 'medium' ? 'amber' : 'gray'}>
                      {ANOMALY_TYPE_LABEL[a.type as AnomalyType]}
                    </Badge>
                    <LevelBadge level={a.level} />
                    <span className="num text-2xs text-ink-3">{a.id}</span>
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-ink-1">{a.target}</div>
                  <div className="mt-1 text-2xs text-ink-3">
                    {ACCOUNT_MAP[a.accountId]?.name ?? '—'} · 检测于 {a.detectedAt.slice(5, 16).replace('T', ' ')}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xs text-ink-3">{a.metric}</div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="num text-xs text-ink-3">{a.baseline}</span>
                      <ArrowRight size={10} className="text-ink-3" />
                      <span className="num text-sm font-semibold text-danger">{a.current}</span>
                    </div>
                    <div className="num mt-0.5 text-2xs text-danger">
                      {a.changePct > 0 ? '+' : ''}
                      {pct(a.changePct / 100, 1)}
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-ink-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expanded && (
                <div className="border-t border-line px-5 py-4">
                  <div className="mb-2 text-2xs font-medium text-ink-3">根因链路（逐层下钻）</div>
                  <div className="space-y-1.5">
                    {a.causeChain.map((c, i) => (
                      <div key={c.label} className="flex items-start gap-2">
                        <div className="flex flex-col items-center pt-1">
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold ${
                              i === a.causeChain.length - 1 ? 'bg-danger text-white' : 'bg-[#F2F4F7] text-ink-2'
                            }`}
                          >
                            {i + 1}
                          </span>
                          {i < a.causeChain.length - 1 && <span className="mt-0.5 h-4 w-px bg-line" />}
                        </div>
                        <div className="min-w-0 flex-1 rounded-ctl border border-line px-3 py-2">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-2xs text-ink-3">{c.label}</span>
                            <span className="text-xs font-medium text-ink-1">{c.value}</span>
                          </div>
                          <div className="mt-0.5 text-2xs text-ink-3">{c.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-ctl bg-danger-soft px-3 py-2 text-2xs leading-relaxed text-danger">
                    <span className="font-medium">结论：</span>
                    {a.conclusion}
                  </div>

                  {a.suggestionId && (
                    <Link
                      to="/optimize/suggestions"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-ctl border border-primary-ring bg-primary-soft px-3 py-1.5 text-2xs text-primary hover:bg-[#E3ECFF]"
                    >
                      <Sparkles size={11} />
                      已生成对应优化建议 {a.suggestionId}
                      <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <div className="text-xs font-semibold text-ink-1">诊断规则是怎么定的</div>
        <div className="mt-2 grid grid-cols-1 gap-3 text-2xs leading-relaxed text-ink-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['成本上涨', '近 3 日 CPA 环比前 3 日上浮 > 15%，且同期大盘涨幅 < 5%（排除市场因素）'],
            ['掉量', '近 3 日消耗环比下滑 > 20%，且预算使用率 < 70%（排除主动降预算）'],
            ['素材疲劳', 'CTR 7 日衰减 > 25%，或疲劳度 > 0.6，或人均频次 > 3.5'],
            ['数据异常', '账户同步失败 / 水位线滞后 > 1 天 / 质检规则未通过'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-ctl border border-line px-3 py-2">
              <div className="mb-1 text-xs font-medium text-ink-1">{t}</div>
              {d}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
