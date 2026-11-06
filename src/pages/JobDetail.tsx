import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Clock, Cpu, Pause, Play, RotateCcw, ScanEye, X, ChevronRight, FileVideo } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Badge, Button, KV, Panel, Progress, Tabs } from '../components/ui'
import { AssetThumb, PlayerMock } from '../components/media'
import { JobStatusBadge, LogStream, OutputSpecText, PriorityBadge, StageTimeline } from '../components/job'
import { formatDateTime, formatDuration, formatMinutes, money, relativeTime } from '../lib/format'
import { FORMAT_LABEL } from '../lib/constants'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const job = useDataStore((s) => s.jobs.find((j) => j.id === id))
  const asset = useDataStore((s) => (job ? s.assets.find((a) => a.id === job.assetId) : undefined))
  const client = useDataStore((s) => (job ? s.clients.find((c) => c.id === job.clientId) : undefined))
  const project = useDataStore((s) => (job?.projectId ? s.projects.find((p) => p.id === job.projectId) : undefined))
  const node = useDataStore((s) => (job?.nodeId ? s.nodes.find((n) => n.id === job.nodeId) : undefined))
  const preset = useDataStore((s) => (job?.presetId ? s.presets.find((p) => p.id === job.presetId) : undefined))
  const setJobStatus = useDataStore((s) => s.setJobStatus)
  const retryJob = useDataStore((s) => s.retryJob)
  const toast = useAppStore((s) => s.toast)
  const [view, setView] = useState<'2d' | 'depth' | 'sbs'>('2d')

  const isRunning = job ? ['analyzing', 'depth', 'disparity', 'temporal', 'rendering', 'encoding'].includes(job.status) : false

  const elapsed = useMemo(() => {
    if (!job?.startedAt) return '—'
    const end = job.finishedAt ? new Date(job.finishedAt).getTime() : Date.now()
    return formatMinutes(Math.max(1, Math.round((end - new Date(job.startedAt).getTime()) / 60000)))
  }, [job])

  if (!job) {
    return (
      <Panel className="p-10 text-center">
        <div className="text-[14px] text-ink">任务不存在</div>
        <div className="mt-1 text-[12px] text-dim">该任务可能已被删除或链接有误。</div>
        <Button className="mt-4" variant="primary" onClick={() => navigate('/jobs')}>
          返回任务列表
        </Button>
      </Panel>
    )
  }

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title={job.name}
        back={{ to: '/jobs', label: '返回任务列表' }}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            <span className="mono text-[11.5px] text-dim">{job.code}</span>
            <span className="text-dim">·</span>
            <span>{client?.shortName}</span>
            <span className="text-dim">·</span>
            <span>创建于 {relativeTime(job.createdAt)}</span>
          </span>
        }
        meta={
          <>
            <JobStatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
            <Badge tone="neutral">v{job.version}</Badge>
            {node && (
              <Badge tone="info">
                <Cpu className="h-3 w-3" /> {node.hostname}
              </Badge>
            )}
          </>
        }
        actions={
          <>
            {isRunning && (
              <Button
                icon={<Pause className="h-3.5 w-3.5" />}
                onClick={() => {
                  setJobStatus(job.id, 'paused')
                  toast('warning', '任务已暂停')
                }}
              >
                暂停
              </Button>
            )}
            {job.status === 'paused' && (
              <Button
                variant="primary"
                icon={<Play className="h-3.5 w-3.5" />}
                onClick={() => {
                  setJobStatus(job.id, 'rendering')
                  toast('success', '任务已继续')
                }}
              >
                继续
              </Button>
            )}
            {['failed', 'canceled'].includes(job.status) && (
              <Button
                icon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={() => {
                  retryJob(job.id)
                  toast('info', '任务已重新入队')
                }}
              >
                重试
              </Button>
            )}
            {job.status === 'qa' && (
              <Button variant="primary" icon={<ScanEye className="h-3.5 w-3.5" />} onClick={() => navigate(`/jobs/${job.id}/review`)}>
                进入质检
              </Button>
            )}
            {!['completed', 'canceled'].includes(job.status) && (
              <Button
                variant="ghost"
                icon={<X className="h-3.5 w-3.5" />}
                onClick={() => {
                  setJobStatus(job.id, 'canceled')
                  toast('warning', '任务已取消')
                }}
              >
                取消
              </Button>
            )}
          </>
        }
      />

      {job.status === 'failed' && job.error && (
        <div className="mb-4 rounded-lg border border-[rgba(244,82,92,0.3)] bg-[rgba(244,82,92,0.07)] p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-[#ff9a9f]">
                任务在「{job.stages.find((s) => s.progress > 0 && s.progress < 100)?.label ?? '渲染'}」阶段失败 · {job.error.code}
              </div>
              <div className="mt-1 text-[12px] leading-5 text-muted">{job.error.message}</div>
              <div className="mt-1.5 text-[11.5px] text-dim">建议动作：{job.error.hint}</div>
            </div>
            <Button size="sm" onClick={() => retryJob(job.id)}>
              立即重试
            </Button>
          </div>
        </div>
      )}

      {job.status === 'paused' && (
        <div className="mb-4 rounded-lg border border-[rgba(245,165,36,0.28)] bg-[rgba(245,165,36,0.06)] px-4 py-3 text-[12px] text-[#f0c07a]">
          任务已暂停，当前阶段进度已保留。继续后将重新申请节点资源。
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-ink">预览</span>
                <span className="text-[11px] text-dim">· {asset?.width}×{asset?.height} · {asset?.fps}fps</span>
              </div>
              <Tabs
                value={view}
                onChange={setView}
                className="border-b-0"
                items={[
                  { key: '2d', label: '原片' },
                  { key: 'depth', label: '深度图' },
                  { key: 'sbs', label: 'SBS' },
                ]}
              />
            </div>
            {asset ? <PlayerMock asset={asset} mode={view} /> : <div className="text-[12px] text-dim">素材不可用</div>}
            <div className="mt-3 flex items-center justify-between text-[11px] text-dim">
              <span className="truncate">{asset?.name}</span>
              <span className="mono">{job.output.format} · {job.output.container}</span>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[13px] text-ink">处理阶段</div>
              <div className="flex items-center gap-2">
                <span className="mono text-[18px] text-ink">{Math.round(job.progress)}%</span>
                {job.etaSec && isRunning && (
                  <span className="text-[11px] text-dim">剩余约 {formatMinutes(job.etaSec / 60)}</span>
                )}
              </div>
            </div>
            <Progress value={job.progress} animated={isRunning} className="mb-4 h-2" />
            <div className="space-y-2.5">
              {job.stages.map((st, i) => {
                const done = st.progress >= 100
                const active = st.progress > 0 && st.progress < 100
                return (
                  <div key={st.key} className="flex items-center gap-3">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]"
                      style={{
                        borderColor: done ? 'var(--primary)' : active ? 'var(--accent)' : 'var(--border)',
                        color: done ? '#8db3ff' : active ? 'var(--accent)' : 'var(--text-dim)',
                        background: done ? 'rgba(61,125,255,0.12)' : 'transparent',
                      }}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    <span className={`w-24 shrink-0 text-[12px] ${done ? 'text-muted' : active ? 'text-ink' : 'text-dim'}`}>{st.label}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#1c2230]">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${st.progress}%`,
                          background: done ? 'rgba(61,125,255,0.65)' : 'var(--accent)',
                        }}
                      />
                    </div>
                    <span className="mono w-10 text-right text-[11px] text-dim">{Math.round(st.progress)}%</span>
                    <span className="w-16 text-right text-[10.5px] text-dim">
                      {st.startedAt ? (done ? '已完成' : '进行中') : '等待'}
                    </span>
                  </div>
                )
              })}
            </div>
          </Panel>

          <LogStream logs={job.logs} height={220} />
        </div>

        <div className="space-y-4">
          <Panel className="p-5">
            <div className="mb-3 text-[13px] text-ink">任务信息</div>
            <div className="divide-y divide-[#1a1f29]">
              <KV label="任务编号" mono>
                {job.code}
              </KV>
              <KV label="客户">
                {project ? (
                  <Link to={`/projects/${project.id}`} className="text-primary hover:underline">
                    {client?.shortName}
                  </Link>
                ) : (
                  client?.shortName ?? '—'
                )}
              </KV>
              <KV label="所属项目">
                {project ? (
                  <Link to={`/projects/${project.id}`} className="text-primary hover:underline">
                    {project.name}
                  </Link>
                ) : (
                  '—'
                )}
              </KV>
              <KV label="输出规格">
                <OutputSpecText output={job.output} />
              </KV>
              <KV label="色彩 / HDR">
                {job.output.colorSpace} · {job.output.hdr}
              </KV>
              <KV label="音频">{job.output.audio === 'spatial' ? '空间音频混音' : '直通'}</KV>
              <KV label="计费分钟" mono>
                {job.billedMinutes} 分钟
              </KV>
              <KV label="创建时间">{formatDateTime(job.createdAt)}</KV>
              <KV label="开始时间">{formatDateTime(job.startedAt)}</KV>
              <KV label="已耗时">{elapsed}</KV>
              <KV label="完成时间">{formatDateTime(job.finishedAt)}</KV>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[13px] text-ink">算法参数</div>
              {preset && (
                <Link to="/presets" className="text-[11px] text-primary hover:underline">
                  {preset.name}
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['视差强度', job.params.disparity],
                ['收敛面', job.params.convergence],
                ['时域平滑', job.params.temporalSmooth],
                ['边缘保护', job.params.edgePreserve],
                ['深度细节', job.params.depthDetail],
                ['版本', `v${job.version}`],
              ].map(([label, v]) => (
                <div key={String(label)}>
                  <div className="text-[10.5px] text-dim">{label}</div>
                  <div className="mono mt-0.5 text-[13px] text-ink">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-line-subtle pt-3 text-[11px] text-dim">
              模型：{job.params.depthModel}
              <br />
              人脸保护 {job.params.faceProtect ? '开启' : '关闭'} · 去闪烁 {job.params.deflicker ? '开启' : '关闭'}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-2 text-[13px] text-ink">费用</div>
            <div className="divide-y divide-[#1a1f29]">
              <KV label="计费分钟" mono>
                {job.billedMinutes}
              </KV>
              <KV label="单价" mono>
                {money(job.costCNY / Math.max(1, job.billedMinutes))} / 分钟
              </KV>
              <KV label="优先级">{job.priority === 'rush' ? '加急 ×1.5' : '标准'}</KV>
            </div>
            <div className="mt-3 flex items-end justify-between border-t border-line-subtle pt-3">
              <span className="text-[11.5px] text-dim">合计</span>
              <span className="mono text-[20px] text-ink">{money(job.costCNY)}</span>
            </div>
          </Panel>

          {job.metrics && (
            <Panel className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] text-ink">质检摘要</span>
                <Button size="sm" variant="ghost" icon={<ChevronRight className="h-3 w-3" />} onClick={() => navigate(`/jobs/${job.id}/review`)}>
                  详情
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10.5px] text-dim">舒适度</div>
                  <div className="mono mt-0.5 text-[18px] text-success">{job.metrics.comfortScore}</div>
                </div>
                <div>
                  <div className="text-[10.5px] text-dim">时域抖动</div>
                  <div className="mono mt-0.5 text-[18px] text-ink">{job.metrics.temporalJitter.toFixed(3)}</div>
                </div>
              </div>
            </Panel>
          )}

          {asset && (
            <Panel className="flex items-center gap-3 p-3">
              <AssetThumb asset={asset} showMeta={false} className="h-10 w-[72px] shrink-0" rounded="rounded" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[11px] text-muted">{asset.name}</div>
                <div className="mt-0.5 text-[10.5px] text-dim">
                  {formatDuration(asset.durationSec)} · {asset.codec}
                </div>
              </div>
              <Link to={`/assets`} className="text-[11px] text-primary">
                <FileVideo className="h-3.5 w-3.5" />
              </Link>
            </Panel>
          )}

          <div className="flex items-center gap-2 text-[10.5px] text-dim">
            <Clock className="h-3 w-3" />
            日志每 900ms 追加，进度按阶段权重 [6,26,14,12,28,8,6] 加权
          </div>
        </div>
      </div>
    </div>
  )
}
