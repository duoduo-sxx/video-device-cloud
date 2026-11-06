import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Check, Crosshair, RotateCcw, X } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Badge, Button, Modal, Panel, Select, Slider, Tabs, Textarea } from '../components/ui'
import { CompareSlider, PlayerMock } from '../components/media'
import { comfortLevel } from '../lib/calc'
import { formatDuration, formatDateTime } from '../lib/format'
import { cn } from '../lib/utils'
import type { QaMetrics } from '../types'

function MetricCard({
  label,
  value,
  unit,
  threshold,
  level,
  ratio,
}: {
  label: string
  value: string
  unit?: string
  threshold: string
  level: 'success' | 'warning' | 'danger'
  ratio: number
}) {
  const color = level === 'success' ? 'var(--success)' : level === 'warning' ? 'var(--warning)' : 'var(--danger)'
  return (
    <div className="rounded-lg border border-line-subtle bg-[#0e1118] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-dim">{label}</span>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      </div>
      <div className="mt-1.5 flex items-end gap-1">
        <span className="mono text-[20px] leading-none" style={{ color }}>
          {value}
        </span>
        {unit && <span className="text-[10px] text-dim">{unit}</span>}
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#1c2230]">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio)}%`, background: color }} />
      </div>
      <div className="mt-1 text-[10px] text-dim">{threshold}</div>
    </div>
  )
}

const reasons = ['窗口违规超限', '时域抖动明显', '边缘伪影明显', '视差过强易眩晕', '深度错误（主体误判）', '其他']

export default function ReviewDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const job = useDataStore((s) => s.jobs.find((j) => j.id === id))
  const asset = useDataStore((s) => (job ? s.assets.find((a) => a.id === job.assetId) : undefined))
  const client = useDataStore((s) => (job ? s.clients.find((c) => c.id === job.clientId) : undefined))
  const setJobStatus = useDataStore((s) => s.setJobStatus)
  const toast = useAppStore((s) => s.toast)

  const [view, setView] = useState<'compare' | 'sbs' | 'depth'>('compare')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState(reasons[0])
  const [note, setNote] = useState('')
  const [compensation, setCompensation] = useState(0)
  const [fixed, setFixed] = useState<string[]>([])

  if (!job || !job.metrics) {
    return (
      <Panel className="p-10 text-center">
        <div className="text-[14px] text-ink">该任务暂无可用的质检数据</div>
        <div className="mt-1 text-[12px] text-dim">只有完成渲染并进入质检阶段的任务才能查看报告。</div>
        <Button className="mt-4" variant="primary" onClick={() => navigate('/review')}>
          返回质检中心
        </Button>
      </Panel>
    )
  }

  const m: QaMetrics = job.metrics
  const lv = comfortLevel(m.comfortScore)

  const pass = () => {
    setJobStatus(job.id, 'completed')
    toast('success', '质检通过', `${job.code} 已标记为可交付，交付物已生成`)
    navigate(`/jobs/${job.id}`)
  }

  const reject = () => {
    setJobStatus(job.id, 'queued', `${reason}${note ? `：${note}` : ''}`)
    toast('warning', '已退回重制', `版本号已升至 v${job.version + 1}，并生成 P2 工单`)
    setRejectOpen(false)
    navigate('/review')
  }

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="质检报告"
        back={{ to: '/review', label: '返回质检中心' }}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            <span className="mono text-[11.5px] text-dim">{job.code}</span>
            <span className="text-dim">·</span>
            <span>{job.name}</span>
            <span className="text-dim">·</span>
            <span>{client?.shortName}</span>
            <span className="text-dim">·</span>
            <span>渲染完成 {formatDateTime(job.finishedAt)}</span>
          </span>
        }
        meta={
          <>
            <Badge tone={lv.tone}>{lv.label}</Badge>
            <Badge tone="neutral">v{job.version}</Badge>
            <Badge tone="info">{formatDuration(asset?.durationSec ?? 0)}</Badge>
            <Badge tone={m.windowViolationFrames === 0 ? 'success' : 'warning'}>
              窗口违规 {m.windowViolationFrames} 帧
            </Badge>
          </>
        }
        actions={
          <>
            <Button variant="danger" icon={<X className="h-3.5 w-3.5" />} onClick={() => setRejectOpen(true)}>
              退回重制
            </Button>
            <Button variant="primary" icon={<Check className="h-3.5 w-3.5" />} onClick={pass}>
              通过并放行
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-ink">画面检查</span>
                <span className="text-[11px] text-dim">拖动中线对比原片与视差效果</span>
              </div>
              <Tabs
                value={view}
                onChange={setView}
                className="border-b-0"
                items={[
                  { key: 'compare', label: '对比' },
                  { key: 'sbs', label: 'SBS' },
                  { key: 'depth', label: '深度图' },
                ]}
              />
            </div>
            {asset ? (
              view === 'compare' ? (
                <CompareSlider asset={asset} />
              ) : (
                <PlayerMock asset={asset} mode={view === 'sbs' ? 'sbs' : 'depth'} />
              )
            ) : (
              <div className="text-[12px] text-dim">素材不可用</div>
            )}
            <div className="mt-3 flex items-center gap-4 text-[10.5px] text-dim">
              <span>时间码定位：</span>
              {(job.issueFrames ?? []).slice(0, 4).map((f) => (
                <button key={f.timecode} className="mono rounded border border-line px-1.5 py-0.5 hover:border-primary hover:text-primary">
                  {f.timecode}
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[13px] text-ink">问题帧</div>
              <span className="text-[11px] text-dim">共 {job.issueFrames?.length ?? 0} 处，按严重度排序</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-line-subtle">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line-subtle bg-[#0e1118] text-[10.5px] text-dim">
                    <th className="px-3 py-2 text-left font-normal">时间码</th>
                    <th className="px-3 py-2 text-left font-normal">问题类型</th>
                    <th className="px-3 py-2 text-left font-normal">严重度</th>
                    <th className="px-3 py-2 text-right font-normal">置信度</th>
                    <th className="px-3 py-2 text-right font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(job.issueFrames ?? []).map((f, i) => (
                    <tr key={i} className="border-b border-line-subtle last:border-0">
                      <td className="mono px-3 py-2 text-[11.5px] text-muted">{f.timecode}</td>
                      <td className="px-3 py-2 text-[11.5px] text-ink">{f.type}</td>
                      <td className="px-3 py-2">
                        <Badge tone={f.severity === 'high' ? 'danger' : f.severity === 'medium' ? 'warning' : 'neutral'}>
                          {f.severity === 'high' ? '严重' : f.severity === 'medium' ? '中等' : '轻微'}
                        </Badge>
                      </td>
                      <td className="mono px-3 py-2 text-right text-[11.5px] text-dim">{f.confidence.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => {
                            setFixed((prev) => (prev.includes(f.timecode) ? prev.filter((t) => t !== f.timecode) : [...prev, f.timecode]))
                          }}
                          className={cn(
                            'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px]',
                            fixed.includes(f.timecode)
                              ? 'border-success/40 bg-[rgba(46,212,122,0.1)] text-success'
                              : 'border-line text-dim hover:text-ink',
                          )}
                        >
                          <Crosshair className="h-3 w-3" />
                          {fixed.includes(f.timecode) ? '已修正' : '标记修正'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[13px] text-ink">人工修正</div>
              <span className="text-[11px] text-dim">已修正 {fixed.length} 处</span>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Slider
                label="全局视差补偿"
                value={compensation}
                min={-10}
                max={10}
                onChange={setCompensation}
                hint="正值整体前移，负值后移。放行后将写入交付参数。"
              />
              <div>
                <div className="mb-2 text-[11.5px] text-muted">区间平滑</div>
                <div className="flex items-center gap-2">
                  <input placeholder="00:12:18 - 00:12:44" className="h-8 flex-1 rounded border border-line bg-[#0d1017] px-2 font-mono text-[11px] text-ink placeholder:text-dim" />
                  <Button size="sm" icon={<RotateCcw className="h-3 w-3" />} onClick={() => toast('info', '已应用区间平滑', '该区间时域抖动预计下降 0.03')}>
                    应用
                  </Button>
                </div>
                <div className="mt-2 text-[10.5px] text-dim">仅对选定区间重算深度，不触发全片重渲染。</div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] text-ink">质量指标</span>
              <span className="text-[10.5px] text-dim">阈值内为绿</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <MetricCard
                label="舒适度评分"
                value={String(m.comfortScore)}
                threshold="达标 ≥85"
                level={lv.tone}
                ratio={m.comfortScore}
              />
              <MetricCard
                label="时域抖动"
                value={m.temporalJitter.toFixed(3)}
                threshold="达标 ≤0.12"
                level={m.temporalJitter <= 0.12 ? 'success' : m.temporalJitter <= 0.18 ? 'warning' : 'danger'}
                ratio={(m.temporalJitter / 0.3) * 100}
              />
              <MetricCard
                label="边缘伪影率"
                value={m.edgeArtifactRate.toFixed(1)}
                unit="%"
                threshold="达标 ≤2.0%"
                level={m.edgeArtifactRate <= 2 ? 'success' : m.edgeArtifactRate <= 3.5 ? 'warning' : 'danger'}
                ratio={(m.edgeArtifactRate / 6) * 100}
              />
              <MetricCard
                label="最大正视差"
                value={m.maxPositiveDisparity.toFixed(2)}
                unit="%"
                threshold="建议 0.8-1.6%"
                level={m.maxPositiveDisparity <= 1.6 ? 'success' : m.maxPositiveDisparity <= 2 ? 'warning' : 'danger'}
                ratio={(m.maxPositiveDisparity / 3) * 100}
              />
              <MetricCard
                label="最大负视差"
                value={m.maxNegativeDisparity.toFixed(2)}
                unit="%"
                threshold="达标 ≤0.60%"
                level={m.maxNegativeDisparity <= 0.6 ? 'success' : m.maxNegativeDisparity <= 0.9 ? 'warning' : 'danger'}
                ratio={(m.maxNegativeDisparity / 1.5) * 100}
              />
              <MetricCard
                label="深度置信度"
                value={m.depthConfidence.toFixed(2)}
                threshold="达标 ≥0.80"
                level={m.depthConfidence >= 0.8 ? 'success' : 'warning'}
                ratio={m.depthConfidence * 100}
              />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-md border border-line-subtle bg-[#0e1118] px-3 py-2">
              <span className="text-[11px] text-dim">立体窗口违规</span>
              <span className={cn('mono text-[12px]', m.windowViolationFrames === 0 ? 'text-success' : 'text-danger')}>
                {m.windowViolationFrames} 帧
              </span>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="mb-2 text-[13px] text-ink">质检结论</div>
            <div className="space-y-1.5 text-[11.5px] leading-5 text-muted">
              <div className="flex justify-between">
                <span className="text-dim">输出规格</span>
                <span className="mono">{job.output.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">帧数</span>
                <span className="mono">{(asset?.durationSec ?? 0) * (asset?.fps ?? 25)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">抽检帧</span>
                <span className="mono">1,240</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">问题帧</span>
                <span className="mono">{job.issueFrames?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">人工修正</span>
                <span className="mono">{fixed.length}</span>
              </div>
            </div>
            <div
              className={cn(
                'mt-3 rounded-md border px-3 py-2 text-[11.5px] leading-5',
                lv.tone === 'success'
                  ? 'border-[rgba(46,212,122,0.25)] bg-[rgba(46,212,122,0.06)] text-[#7ee0a8]'
                  : lv.tone === 'warning'
                    ? 'border-[rgba(245,165,36,0.25)] bg-[rgba(245,165,36,0.06)] text-[#f0c07a]'
                    : 'border-[rgba(244,82,92,0.28)] bg-[rgba(244,82,92,0.07)] text-[#ff9a9f]',
              )}
            >
              {lv.tone === 'success'
                ? '各项指标均在阈值内，可放行交付。建议保留本报告作为验收附件。'
                : lv.tone === 'warning'
                  ? '部分指标接近临界值，建议核对问题帧后再决定放行或退回。'
                  : '指标明显超标，直接交付可能引起眩晕，建议退回重制。'}
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="danger" className="flex-1" onClick={() => setRejectOpen(true)}>
                退回
              </Button>
              <Button variant="primary" className="flex-1" onClick={pass}>
                通过
              </Button>
            </div>
          </Panel>

          <div className="flex items-start gap-2 rounded-lg border border-line-subtle bg-[#0e1118] p-3 text-[10.5px] leading-5 text-dim">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            放行后将生成交付物并锁定参数。退回会自动创建 P2 工单，客户与制片都会收到通知。
          </div>
        </div>
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="退回重制"
        desc="退回后任务版本号 +1 并重新进入队列，同时创建 P2 技术服务工单。"
        footer={
          <>
            <Button onClick={() => setRejectOpen(false)}>取消</Button>
            <Button variant="danger" onClick={reject}>
              确认退回
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11.5px] text-muted">退回原因</label>
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11.5px] text-muted">补充说明（将写入任务日志与工单）</label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：00:12:18 处人物发丝边缘深度跳变，建议提高边缘保护至 80 后重算该镜头。" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
