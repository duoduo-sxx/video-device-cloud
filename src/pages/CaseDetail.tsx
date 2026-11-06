import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, Quote, Users } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Button, Card, CardHeader, Divider } from '../components/ui'
import { MetricDelta, PageHeader, Skeleton, Thumb } from '../components/common'
import { db } from '../mock/db'

export default function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useAsync(() => api.getCase(id!), [id])
  const related = (db.cases ?? []).filter((c) => c.id !== id).slice(0, 3)

  if (loading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-[520px]" />
      </div>
    )
  }

  const c = data
  const metrics: { label: string; before: number; after: number; unit?: string; better?: 'up' | 'down'; digits?: number }[] = [
    { label: 'VMAF', before: c.before.vmaf, after: c.after.vmaf },
    { label: 'PSNR', before: c.before.psnr, after: c.after.psnr, unit: 'dB' },
    { label: '闪烁幅度', before: c.before.flicker, after: c.after.flicker, unit: 'IRE', better: 'down' },
    { label: '划痕 / 缺陷', before: c.before.scratches, after: c.after.scratches, unit: '处', better: 'down', digits: 0 },
  ]

  return (
    <div>
      <PageHeader
        crumbs={[{ label: '知识库', to: '/knowledge' }, { label: '交付案例' }]}
        title={c.title}
        desc={c.summary}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/knowledge')}>
              <ArrowLeft size={14} /> 返回
            </Button>
            <Button variant="primary" onClick={() => navigate('/service')}>
              提交同类需求 <ArrowRight size={13} />
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8 space-y-3">
          <Card className="overflow-hidden">
            <div className="aspect-[21/9] w-full">
              <Thumb seed={c.coverSeed} aspect="21/9" className="rounded-none border-0" />
            </div>
            <div className="flex items-center gap-4 px-5 py-3 text-[11.5px] text-[var(--text-3)]">
              <span className="flex items-center gap-1.5">
                <Users size={12} /> {c.client}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} /> 投入 {c.hours} 工时
              </span>
              <div className="ml-auto flex gap-1">
                {c.tags.map((t) => (
                  <span key={t} className="rounded bg-[var(--bg-3)] px-1.5 py-0.5 text-[10.5px] text-[var(--text-2)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="修复前后指标" desc="指标由同一测量脚本在相同规则集下产出" />
            <div className="grid grid-cols-4 gap-2.5 px-5 pb-4">
              {metrics.map((m) => (
                <MetricDelta
                  key={m.label}
                  label={m.label}
                  before={m.before}
                  after={m.after}
                  unit={m.unit}
                  better={m.better ?? 'up'}
                  digits={m.digits ?? 1}
                />
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="项目复盘" desc="背景 → 问题 → 方案 → 结果" />
            <div className="space-y-4 px-5 pb-5">
              {c.content.map((s, i) => (
                <div key={s.heading} className="relative pl-6">
                  <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--bg-3)] text-[9px] text-[var(--text-2)]">
                    {i + 1}
                  </span>
                  <div className="text-[12.5px] font-medium text-[var(--text-1)]">{s.heading}</div>
                  <p className="mt-1 text-[12px] leading-6 text-[var(--text-2)]">{s.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-4 space-y-3">
          <Card>
            <CardHeader title="关键结论" right={<Quote size={14} className="text-[var(--text-3)]" />} />
            <div className="px-4 pb-4">
              <p className="rounded-lg border-l-2 border-[var(--primary)] bg-[var(--bg-2)] px-3 py-2 text-[12px] leading-6 text-[var(--text-2)]">
                {c.summary}
              </p>
              <Divider className="my-3" />
              <div className="space-y-2 text-[11.5px]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-3)]">缺陷残留</span>
                  <span className="mono text-[var(--success)]">{c.after.scratches ?? c.after.flicker ?? 0} 处（已标注）</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-3)]">交付版本</span>
                  <span className="text-[var(--text-2)]">院线 DCP + 流媒体</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-3)]">客户验收</span>
                  <span className="text-[var(--text-2)]">一次通过</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="关联案例" desc="同类问题可复用方案" />
            <div className="space-y-2 px-4 pb-4">
              {related.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/knowledge/${r.id}`)}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-2 text-left hover:border-[var(--border-str)]"
                >
                  <div className="w-[64px] shrink-0">
                    <Thumb seed={r.coverSeed} aspect="16/9" />
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-[11.5px] leading-4 text-[var(--text-1)]">{r.title}</div>
                    <div className="mono mt-0.5 text-[10px] text-[var(--text-3)]">
                      VMAF {r.before.vmaf} → {r.after.vmaf}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
