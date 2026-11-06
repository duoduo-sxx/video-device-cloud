import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Pause, Play, ScanSearch, SkipBack, SkipForward, Volume2, Wand2 } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { usePlayer } from '../hooks/usePlayer'
import { Badge, Button, Card, CardHeader, Segmented, Tabs } from '../components/ui'
import { EmptyState, KV, PageHeader, ScoreRing, Skeleton, StatusPill, Thumb, SeverityTag } from '../components/common'
import { MockVideoCanvas, Waveform } from '../components/media'
import { db } from '../mock/db'
import { dateTime, duration, gb, lufs, timecode } from '../lib/format'
import { REPAIR_STATUS_META, SEVERITY_ORDER, TASK_STATUS_META } from '../lib/constants'
import { MEMBER_MAP } from '../mock/build'

export default function MediaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: asset, loading } = useAsync(() => api.getAsset(id!), [id])
  const player = usePlayer(asset?.durationSec ?? 100)
  const [tab, setTab] = useState('file')
  const [mode, setMode] = useState('after')

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-[420px]" />
          <Skeleton className="h-[420px]" />
        </div>
      </div>
    )
  }

  if (!asset) {
    return <EmptyState title="素材不存在" desc="该素材可能已被归档或删除" action={<Button onClick={() => navigate('/media')}>返回资产库</Button>} />
  }

  const tasks = db.tasks.filter((t) => t.assetId === asset.id)
  const repairs = db.repairs.filter((r) => r.assetId === asset.id)
  const defects = db.defects.filter((d) => d.assetId === asset.id)
  const reports = db.reports.filter((r) => r.assetName === asset.name)

  return (
    <div>
      <PageHeader
        crumbs={[{ label: '媒体资产库', to: '/media' }, { label: asset.name }]}
        title={asset.name}
        meta={<Badge color="var(--text-2)" bg="var(--bg-2)">{asset.container} · {asset.videoCodec}</Badge>}
        desc={
          <span className="mono">
            {asset.fileName} · {gb(asset.sizeGB)} · {asset.code}
          </span>
        }
        actions={
          <>
            <Button onClick={() => navigate('/media')}>
              <ChevronLeft size={14} /> 返回
            </Button>
            <Button onClick={() => navigate('/repair/rt4')}>
              <Wand2 size={14} /> 加入修复
            </Button>
            <Button variant="primary" onClick={() => navigate('/detection/new')}>
              <ScanSearch size={14} /> 发起检测
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <div className="relative bg-black">
              <div className="aspect-[16/9] w-full">
                <MockVideoCanvas seed={asset.thumbSeed} time={player.time} duration={asset.durationSec} mode={mode === 'before' ? 'before' : 'after'} />
              </div>
              <div className="absolute right-3 top-3">
                <Segmented
                  size="sm"
                  value={mode}
                  onChange={setMode}
                  items={[
                    { key: 'after', label: '修复后' },
                    { key: 'before', label: '修复前' },
                  ]}
                />
              </div>
            </div>
            <div className="px-4 py-2.5">
              <Waveform seed={asset.thumbSeed} duration={asset.durationSec} currentTime={player.time} height={56} />
              <div className="mt-2 flex items-center gap-3">
                <button onClick={player.toggle} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-[#04161c]">
                  {player.playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                <button onClick={() => player.step(-1)} className="text-[var(--text-2)] hover:text-[var(--text-1)]">
                  <SkipBack size={14} />
                </button>
                <button onClick={() => player.step(1)} className="text-[var(--text-2)] hover:text-[var(--text-1)]">
                  <SkipForward size={14} />
                </button>
                <span className="mono text-[12px] text-[var(--text-2)]">
                  {timecode(player.time)} <span className="text-[var(--text-3)]">/ {timecode(asset.durationSec)}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={asset.durationSec}
                  value={player.time}
                  onChange={(e) => player.seek(Number(e.target.value))}
                  className="ml-2 flex-1 accent-[var(--primary)]"
                />
                <div className="flex items-center gap-1 text-[11px] text-[var(--text-3)]">
                  <Volume2 size={13} />
                  <span className="mono">{asset.channels}ch</span>
                </div>
                <Segmented
                  size="sm"
                  value={String(player.rate)}
                  onChange={(v) => player.setRate(Number(v))}
                  items={[
                    { key: '0.5', label: '0.5x' },
                    { key: '1', label: '1x' },
                    { key: '2', label: '2x' },
                  ]}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="关联任务" desc={`${tasks.length} 次检测 · ${repairs.length} 次修复 · ${reports.length} 份报告`} />
            <div className="px-5 pb-5">
              {tasks.length === 0 && repairs.length === 0 ? (
                <EmptyState title="该素材还没有检测记录" desc="发起一次检测以生成缺陷与评分" action={<Button onClick={() => navigate('/detection/new')}>发起检测</Button>} />
              ) : (
                <div className="relative border-l border-[var(--border)] pl-4">
                  {tasks.map((t) => {
                    const meta = TASK_STATUS_META[t.status]
                    return (
                      <div key={t.id} className="relative mb-4 last:mb-0">
                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[var(--primary)] ring-4 ring-[var(--bg-1)]" />
                        <div className="flex items-center gap-2">
                          <Link to={`/detection/${t.id}`} className="text-[13px] text-[var(--text-1)] hover:text-[var(--primary)]">
                            检测 {t.code}
                          </Link>
                          <StatusPill label={meta.label} color={meta.color} bg={meta.bg} />
                          <span className="mono text-[11px] text-[var(--text-3)]">{t.ruleSetName}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-[var(--text-3)]">
                          <span>{dateTime(t.startedAt)}</span>
                          <span>·</span>
                          <span>{MEMBER_MAP[t.operatorId]?.name}</span>
                          <span>·</span>
                          <span>
                            评分 <span className="mono text-[var(--text-2)]">{t.score}</span>（{t.grade} 级）
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {repairs.map((r) => {
                    const meta = REPAIR_STATUS_META[r.status]
                    return (
                      <div key={r.id} className="relative mb-4 last:mb-0">
                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[var(--purple)] ring-4 ring-[var(--bg-1)]" />
                        <div className="flex items-center gap-2">
                          <Link to={`/repair/${r.id}`} className="text-[13px] text-[var(--text-1)] hover:text-[var(--primary)]">
                            修复 {r.code} · {r.version}
                          </Link>
                          <StatusPill label={meta.label} color={meta.color} bg={meta.bg} />
                        </div>
                        <div className="mt-1 text-[11px] text-[var(--text-3)]">
                          修复 {r.defectFixed}/{r.defectTotal} 条 · 评分 {r.scoreBefore} → {r.scoreAfter}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="探针信息" desc="ffprobe 解析结果" />
            <div className="px-5 pb-4">
              <Tabs
                items={[
                  { key: 'file', label: '文件' },
                  { key: 'video', label: '视频' },
                  { key: 'audio', label: '音频' },
                  { key: 'loud', label: '响度' },
                ]}
                value={tab}
                onChange={setTab}
                className="mb-2"
              />
              {tab === 'file' && (
                <div>
                  <KV k="容器" v={asset.container} />
                  <KV k="文件大小" v={gb(asset.sizeGB)} mono />
                  <KV k="时长" v={duration(asset.durationSec)} mono />
                  <KV k="总码率" v={`${asset.bitrateMbps} Mbps`} mono />
                  <KV k="版本" v={asset.version} />
                  <KV k="上传时间" v={dateTime(asset.uploadedAt)} mono />
                  <KV k="上传人" v={MEMBER_MAP[asset.ownerId]?.name} />
                </div>
              )}
              {tab === 'video' && (
                <div>
                  <KV k="编码" v={asset.videoCodec} />
                  <KV k="分辨率" v={`${asset.width} × ${asset.height}`} mono />
                  <KV k="帧率" v={`${asset.fps}${asset.scan === 'i' ? 'i' : 'p'}`} mono />
                  <KV k="像素比 SAR" v={asset.sar} mono />
                  <KV k="色彩空间" v={asset.projectId === 'p5' ? 'BT.2020 / HLG' : 'BT.709 / SDR'} />
                  <KV k="位深" v={`${asset.bitDepth} bit`} mono />
                </div>
              )}
              {tab === 'audio' && (
                <div>
                  <KV k="编码" v={asset.audioCodec} />
                  <KV k="采样率" v={`${asset.sampleRate} Hz`} mono />
                  <KV k="声道" v={`${asset.channels} ch`} mono />
                  <KV k="位深" v={`${asset.bitDepth} bit`} mono />
                  <KV k="音频轨" v="1 轨主混音" />
                </div>
              )}
              {tab === 'loud' && (
                <div>
                  <KV k="积分响度" v={lufs(asset.loudnessLufs)} mono />
                  <KV k="真峰值" v={`${asset.truePeakDb?.toFixed(1)} dBTP`} mono />
                  <KV k="目标（广电）" v="-24 ±2 LKFS" mono />
                  <KV k="达标情况" v={
                    asset.loudnessLufs && asset.loudnessLufs <= -22 && asset.loudnessLufs >= -26 ? (
                      <span className="text-[var(--success)]">达标</span>
                    ) : (
                      <span className="text-[var(--accent)]">偏离目标</span>
                    )
                  } />
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="素材概览" />
            <div className="px-5 pb-5">
              <div className="mb-3 overflow-hidden rounded-lg border border-[var(--border)]">
                <Thumb seed={asset.thumbSeed} label={duration(asset.durationSec)} />
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {asset.tags.map((t) => (
                  <Badge key={t} color="var(--text-2)" bg="var(--bg-2)">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-3)]">累计检出缺陷</span>
                  <span className="mono text-[var(--text-1)]">{defects.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SEVERITY_ORDER.map((s) => {
                    const c = defects.filter((d) => d.severity === s).length
                    return c > 0 ? <SeverityTag key={s} severity={s} count={c} /> : null
                  })}
                </div>
              </div>
            </div>
          </Card>

          {tasks[0] && (
            <Card>
              <CardHeader title="最近一次检测" right={<Link to={`/detection/${tasks[0].id}`} className="text-[12px] text-[var(--primary)]">查看</Link>} />
              <div className="flex items-center gap-4 px-5 pb-5">
                <ScoreRing score={tasks[0].score} grade={tasks[0].grade} size={64} />
                <div className="text-[12px] text-[var(--text-2)]">
                  <div>{tasks[0].ruleSetName}</div>
                  <div className="mt-1 text-[var(--text-3)]">共 {defects.length} 条缺陷，致命 {tasks[0].counts.fatal} 条</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
