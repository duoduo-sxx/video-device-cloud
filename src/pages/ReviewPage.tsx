import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, Columns2, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { usePlayer } from '../hooks/usePlayer'
import { Button, Card, CardHeader, Modal, Progress, Segmented, Textarea } from '../components/ui'
import { EmptyState, MetricDelta, PageHeader, SeverityTag, Skeleton, StatusPill } from '../components/common'
import { MockVideoCanvas, Waveform } from '../components/media'
import { timecode } from '../lib/format'
import { REPAIR_STATUS_META } from '../lib/constants'
import { cn } from '../lib/cn'

export default function ReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useAsync(async () => {
    const repair = await api.getRepair(id!)
    const review = await api.getReviewByRepair(id!)
    const defects = await api.taskDefects(repair!.detectionTaskId)
    return { repair, review, defects }
  }, [id])

  const repair = data?.repair
  const review = data?.review
  const defects = data?.defects ?? []
  const player = usePlayer(repair?.defectTotal ? 2712 : 100)
  const [mode, setMode] = useState('side')
  const [wipe, setWipe] = useState(52)
  const [checklist, setChecklist] = useState<Record<string, 'pass' | 'recheck' | 'fail'>>({})
  const [signOpen, setSignOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [done, setDone] = useState(false)

  const status = done ? 'passed' : repair?.status ?? 'review'
  const meta = REPAIR_STATUS_META[status]

  const items = useMemo(() => defects.slice(0, 8), [defects])

  if (loading || !repair) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-[420px]" />
      </div>
    )
  }

  if (!review) {
    return (
      <div>
        <PageHeader title="对比与验收" crumbs={[{ label: '修复中心', to: '/repair' }, { label: repair.code }]} />
        <Card>
          <EmptyState
            title="该任务还没有可验收的修复版本"
            desc="修复执行完成并通过复检后，才能进入对比验收"
            action={<Button onClick={() => navigate(`/repair/${repair.id}`)}>返回修复任务</Button>}
          />
        </Card>
      </div>
    )
  }

  const before = review.metricsBefore
  const after = review.metricsAfter

  return (
    <div>
      <PageHeader
        crumbs={[{ label: '修复中心', to: '/repair' }, { label: repair.code }, { label: '对比与验收' }]}
        title={`${repair.assetName} · ${repair.version}`}
        meta={<StatusPill label={meta.label} color={meta.color} bg={meta.bg} />}
        desc="左侧为原始素材，右侧为修复产物。拖动中间分隔线可做擦除对比。"
        actions={
          <>
            <Button onClick={() => navigate(`/repair/${repair.id}`)}>返回方案</Button>
            <Button
              variant="danger"
              onClick={() => {
                setSignOpen(true)
              }}
            >
              <X size={14} /> 驳回返工
            </Button>
            <Button variant="success" onClick={() => setSignOpen(true)}>
              <Check size={14} /> 全部通过并签署
            </Button>
          </>
        }
      />

      <div className="mb-3 grid grid-cols-6 gap-2.5">
        <MetricDelta label="VMAF" before={before.vmaf} after={after.vmaf} />
        <MetricDelta label="PSNR" before={before.psnr} after={after.psnr} unit="dB" />
        <MetricDelta label="SSIM" before={before.ssim} after={after.ssim} digits={3} />
        <MetricDelta label="积分响度" before={before.lufs} after={after.lufs} unit="LKFS" better="down" />
        <MetricDelta label="真峰值" before={before.truePeak} after={after.truePeak} unit="dBTP" better="down" />
        <MetricDelta label="缺陷残留" before={defects.length} after={Math.max(0, defects.length - 6)} unit="条" better="down" digits={0} />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-9 space-y-3">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
              <div className="flex items-center gap-2">
                <Columns2 size={13} className="text-[var(--text-3)]" />
                <span className="text-[12px] text-[var(--text-2)]">A/B 对比</span>
                <span className="text-[11px] text-[var(--text-3)]">修复前 / 修复后</span>
              </div>
              <Segmented
                size="sm"
                value={mode}
                onChange={setMode}
                items={[
                  { key: 'side', label: '左右' },
                  { key: 'wipe', label: '擦除' },
                  { key: 'diff', label: '差值' },
                ]}
              />
            </div>

            <div className="relative bg-black">
              {mode === 'side' && (
                <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
                  <div className="relative">
                    <div className="aspect-video">
                      <MockVideoCanvas seed={repair.assetName.length * 17} time={player.time} duration={2712} mode="before" showSafeArea={false} />
                    </div>
                    <span className="mono absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-[#F87171]">BEFORE · 原始</span>
                  </div>
                  <div className="relative">
                    <div className="aspect-video">
                      <MockVideoCanvas seed={repair.assetName.length * 17} time={player.time} duration={2712} mode="after" showSafeArea={false} />
                    </div>
                    <span className="mono absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-[#34D399]">AFTER · {repair.version}</span>
                  </div>
                </div>
              )}

              {mode === 'wipe' && (
                <div className="relative">
                  <div className="aspect-video w-full">
                    <MockVideoCanvas seed={repair.assetName.length * 17} time={player.time} duration={2712} mode="after" showSafeArea={false} />
                  </div>
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${wipe}%` }}>
                    <div className="h-full w-full" style={{ width: `${(100 / wipe) * 100}%` }}>
                      <MockVideoCanvas seed={repair.assetName.length * 17} time={player.time} duration={2712} mode="before" showSafeArea={false} />
                    </div>
                  </div>
                  <div className="absolute inset-y-0 z-10 w-px bg-white/80" style={{ left: `${wipe}%` }}>
                    <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-black/60 px-1.5 py-1 text-[10px] text-white">↔</div>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={96}
                    value={wipe}
                    onChange={(e) => setWipe(Number(e.target.value))}
                    className="absolute inset-x-0 bottom-2 z-20 w-full opacity-0"
                    style={{ height: 24 }}
                  />
                  <span className="mono absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-[#F87171]">BEFORE</span>
                  <span className="mono absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-[#34D399]">AFTER</span>
                </div>
              )}

              {mode === 'diff' && (
                <div className="relative">
                  <div className="aspect-video w-full">
                    <MockVideoCanvas seed={repair.assetName.length * 17} time={player.time} duration={2712} mode="before" showSafeArea={false} />
                  </div>
                  <div className="absolute inset-0 border-[3px]" style={{ borderColor: 'rgba(34,211,238,.5)' }} />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] text-[var(--text-2)]">
                    高亮描边为差异区域（模拟），亮区表示修复前后的像素差异
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--text-3)]">
                    <span>修复前</span>
                    <span className="mono">{before.lufs} LKFS</span>
                  </div>
                  <Waveform seed={repair.assetName.length * 11} duration={2712} currentTime={player.time} height={44} progressColor="#F87171" dim />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--text-3)]">
                    <span>修复后</span>
                    <span className="mono text-[var(--success)]">{after.lufs} LKFS</span>
                  </div>
                  <Waveform seed={repair.assetName.length * 11} duration={2712} currentTime={player.time} height={44} progressColor="#34D399" />
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <button onClick={player.toggle} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-[#04161c]">
                  {player.playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                <button onClick={() => player.step(-25)} className="text-[var(--text-2)]"><SkipBack size={14} /></button>
                <button onClick={() => player.step(25)} className="text-[var(--text-2)]"><SkipForward size={14} /></button>
                <span className="mono text-[12px] text-[var(--text-2)]">
                  {timecode(player.time)} <span className="text-[var(--text-3)]">/ {timecode(2712)}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={2712}
                  value={player.time}
                  onChange={(e) => player.seek(Number(e.target.value))}
                  className="ml-2 flex-1 accent-[var(--primary)]"
                />
                <Segmented
                  size="sm"
                  value={String(player.rate)}
                  onChange={(v) => player.setRate(Number(v))}
                  items={[
                    { key: '1', label: '1x' },
                    { key: '2', label: '2x' },
                  ]}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="逐缺陷验收" desc={`共 ${items.length} 条待确认，全部通过后可签署`} />
            <div className="px-5 pb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-y border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                    <th className="px-2 py-2 text-left font-normal">时间码</th>
                    <th className="px-2 py-2 text-left font-normal">缺陷</th>
                    <th className="px-2 py-2 text-left font-normal">修复前</th>
                    <th className="px-2 py-2 text-left font-normal">修复后</th>
                    <th className="px-2 py-2 text-left font-normal">判定</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="mono px-2 py-2 text-[11px] text-[var(--text-2)]">{timecode(d.startSec)}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] text-[var(--text-1)]">{d.name}</span>
                          <SeverityTag severity={d.severity} />
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="w-16">
                          <div className="aspect-video overflow-hidden rounded border border-[var(--border)] opacity-70">
                            <MockVideoCanvas seed={d.id.length * 7} time={d.startSec} duration={2712} mode="before" showSafeArea={false} />
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="w-16">
                          <div className="aspect-video overflow-hidden rounded border border-[var(--border)]">
                            <MockVideoCanvas seed={d.id.length * 7} time={d.startSec} duration={2712} mode="after" showSafeArea={false} />
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <Segmented
                          size="sm"
                          value={checklist[d.id] ?? 'pass'}
                          onChange={(v) => setChecklist((c) => ({ ...c, [d.id]: v as 'pass' | 'recheck' | 'fail' }))}
                          items={[
                            { key: 'pass', label: '通过' },
                            { key: 'recheck', label: '需复检' },
                            { key: 'fail', label: '不通过' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="col-span-3 space-y-3">
          <Card>
            <CardHeader title="响度对比" desc="积分 / 短期 / 真峰值" />
            <div className="px-4 pb-4">
              {[
                { label: '修复前', lufs: before.lufs, peak: before.truePeak, color: '#F87171' },
                { label: '修复后', lufs: after.lufs, peak: after.truePeak, color: '#34D399' },
                { label: '目标', lufs: -24, peak: -1, color: '#22D3EE' },
              ].map((row) => (
                <div key={row.label} className="mb-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-2)]">{row.label}</span>
                    <span className="mono" style={{ color: row.color }}>
                      {row.lufs.toFixed(1)} LKFS / {row.peak.toFixed(1)} dBTP
                    </span>
                  </div>
                  <div className="relative mt-1 h-2 rounded-full bg-[var(--bg-3)]">
                    <div
                      className="absolute inset-y-0 rounded-full"
                      style={{ left: `${((row.lufs + 30) / 20) * 100}%`, width: 3, background: row.color }}
                    />
                    <div className="absolute inset-y-0 border-l border-dashed border-[var(--text-3)]" style={{ left: '30%' }} />
                  </div>
                </div>
              ))}
              <div className="mt-1 flex justify-between text-[10px] text-[var(--text-3)]">
                <span>-30</span>
                <span>-24 目标</span>
                <span>-10</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="复检结果" desc="同规则集重跑" />
            <div className="px-4 pb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-2)]">通过率</span>
                <span className="mono text-[13px] text-[var(--success)]">100%</span>
              </div>
              <Progress value={100} color="var(--success)" />
              <div className="mt-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-3)]">致命 / 严重残留</span>
                  <span className="mono text-[var(--success)]">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-3)]">一般残留</span>
                  <span className="mono text-[var(--text-2)]">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-3)]">评分</span>
                  <span className="mono text-[var(--text-1)]">{repair.scoreBefore} → {repair.scoreAfter}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="验收意见" desc={review.signedBy ? `${review.signedBy} 已签署` : '签署后生成验收单'} />
            <div className="px-4 pb-4">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="填写整体验收意见（通过时可选，驳回时必填）"
                rows={3}
              />
              {review.comment && (
                <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-2 text-[11px] leading-5 text-[var(--text-3)]">
                  历史意见：{review.comment}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        title="签署验收"
        footer={
          <>
            <Button onClick={() => setSignOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={async () => {
                const verdict = comment.includes('驳回') ? 'reject' : 'pass'
                await api.signReview(repair.id, verdict, comment || '整体达标，同意交付', '沈见山')
                setDone(true)
                setSignOpen(false)
              }}
            >
              确认签署
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-3 text-[12px] leading-6 text-[var(--text-2)]">
            <div className="flex justify-between"><span className="text-[var(--text-3)]">任务</span><span className="mono">{repair.code}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-3)]">素材</span><span>{repair.assetName}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-3)]">缺陷</span><span className="mono">{repair.defectFixed} / {repair.defectTotal} 已修复</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-3)]">评分</span><span className="mono">{repair.scoreBefore} → {repair.scoreAfter}</span></div>
          </div>
          <div>
            <div className="mb-1 text-[12px] text-[var(--text-2)]">验收意见</div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="例如：整体达标，同意交付" />
          </div>
          <div className="text-[11px] text-[var(--text-3)]">
            签署人：沈见山（质检主管） · 签署时间：{new Date().toLocaleString('zh-CN')}
          </div>
        </div>
      </Modal>
    </div>
  )
}
