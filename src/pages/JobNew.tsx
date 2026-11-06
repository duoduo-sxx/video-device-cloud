import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Film, Info, Sparkles } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Badge, Button, Checkbox, KV, Panel, SearchInput, Select, Slider, Switch } from '../components/ui'
import { AssetThumb } from '../components/media'
import { formatDuration, formatMinutes, money } from '../lib/format'
import { FORMAT_LABEL } from '../lib/constants'
import { estimateSeconds, jobCost } from '../lib/calc'
import type { ConvertParams, OutputFormat, OutputSpec } from '../types'
import { cn } from '../lib/utils'

const STEPS = ['选择素材', '输出规格', '算法参数', '确认提交']

export default function JobNew() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const assets = useDataStore((s) => s.assets)
  const presets = useDataStore((s) => s.presets)
  const nodes = useDataStore((s) => s.nodes)
  const clients = useDataStore((s) => s.clients)
  const createJob = useDataStore((s) => s.createJob)
  const settings = useDataStore((s) => s.settings)
  const toast = useAppStore((s) => s.toast)

  const initialAssets = (params.get('assets') ?? '').split(',').filter(Boolean)
  const [step, setStep] = useState(initialAssets.length ? 1 : 0)
  const [selected, setSelected] = useState<string[]>(initialAssets)
  const [query, setQuery] = useState('')
  const [presetId, setPresetId] = useState(settings.defaults.presetId)
  const [output, setOutput] = useState<OutputSpec>({
    format: settings.defaults.format,
    resolution: settings.defaults.resolution,
    fps: 'source',
    bitrate: 'auto',
    colorSpace: 'Rec.2020',
    hdr: 'HDR10',
    audio: 'spatial',
    container: 'mov',
  })
  const [convert, setConvert] = useState<ConvertParams>(
    presets.find((p) => p.id === settings.defaults.presetId)?.params ?? presets[0].params,
  )
  const [priority, setPriority] = useState<'standard' | 'rush'>('standard')
  const [nodeStrategy, setNodeStrategy] = useState<'auto' | string>('auto')

  const chosen = assets.filter((a) => selected.includes(a.id))
  const totalSeconds = chosen.reduce((s, a) => s + a.durationSec, 0)
  const totalMinutesBilled = chosen.reduce((s, a) => s + Math.max(1, Math.round(a.durationSec / 60)), 0)

  const estimate = useMemo(() => {
    const secs = chosen.reduce((s, a) => s + estimateSeconds(a.durationSec, a.width, output.format, priority === 'rush'), 0)
    const cost = chosen.reduce((s, a) => s + jobCost(Math.max(1, Math.round(a.durationSec / 60)), a.width, priority === 'rush'), 0)
    return { secs, cost }
  }, [chosen, output.format, priority])

  const filtered = assets.filter((a) => {
    if (!query) return true
    const q = query.toLowerCase()
    return a.name.toLowerCase().includes(q) || (clients.find((c) => c.id === a.clientId)?.shortName ?? '').includes(query)
  })

  const warnings = useMemo(() => {
    const list: { level: 'warn' | 'info'; text: string }[] = []
    if (chosen.some((a) => a.fps !== 25 && a.fps !== 30)) {
      list.push({ level: 'warn', text: '源帧率为 23.976 / 24 fps，时间轴将对齐至 25 fps，约 0.1% 帧重复' })
    }
    if (totalSeconds > 3600) {
      list.push({ level: 'warn', text: `总时长 ${formatMinutes(totalSeconds / 60)} 超过 60 分钟，建议拆分为 10 分钟片段以便并行` })
    }
    if (chosen.some((a) => a.width >= 7000)) {
      list.push({ level: 'info', text: '8K 双视图编码建议码率 ≥ 420 Mbps，单任务临时空间约 210 GB' })
    }
    list.push({ level: 'info', text: '源素材为 8bit 4:2:0，输出将上采样至 10bit 4:2:2 并写入 HDR 元数据' })
    return list
  }, [chosen, totalSeconds])

  const applyPreset = (id: string) => {
    setPresetId(id)
    const p = presets.find((x) => x.id === id)
    if (p) setConvert({ ...p.params })
  }

  const submit = () => {
    if (!chosen.length) {
      toast('error', '请至少选择一个素材')
      setStep(0)
      return
    }
    const created = createJob({
      assetIds: chosen.map((a) => a.id),
      output,
      params: convert,
      presetId,
      priority,
      nodeId: nodeStrategy === 'auto' ? undefined : nodeStrategy,
    })
    toast('success', `已创建 ${created.length} 个任务`, '任务已进入队列，可在详情页查看实时进度')
    navigate(`/jobs/${created[0].id}`)
  }

  const stepBody = () => {
    if (step === 0) {
      return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
          <Panel className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <SearchInput value={query} onChange={setQuery} placeholder="搜索素材名称或客户" className="w-[300px]" />
              <span className="text-[11px] text-dim">已选 {selected.length} / 10</span>
            </div>
            <div className="max-h-[540px] space-y-1 overflow-auto pr-1">
              {filtered.map((a) => {
                const checked = selected.includes(a.id)
                return (
                  <button
                    key={a.id}
                    onClick={() =>
                      setSelected((prev) =>
                        checked ? prev.filter((id) => id !== a.id) : prev.length >= 10 ? prev : [...prev, a.id],
                      )
                    }
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md border px-2 py-2 text-left transition-colors',
                      checked ? 'border-primary/50 bg-[rgba(61,125,255,0.06)]' : 'border-transparent hover:bg-[#151a23]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        checked ? 'border-primary bg-primary text-white' : 'border-line',
                      )}
                    >
                      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <AssetThumb asset={a} showMeta={false} className="h-9 w-16 shrink-0" rounded="rounded" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[12px] text-ink">{a.name}</span>
                      <span className="mt-0.5 block truncate text-[10.5px] text-dim">
                        {a.width}×{a.height} · {a.fps}fps · {a.codec}
                      </span>
                    </span>
                    <span className="mono shrink-0 text-[11px] text-muted">{formatDuration(a.durationSec)}</span>
                  </button>
                )
              })}
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel className="p-4">
              <div className="text-[13px] text-ink">已选素材</div>
              <div className="mt-3 space-y-1.5">
                {chosen.length === 0 && <div className="text-[11.5px] text-dim">尚未选择素材</div>}
                {chosen.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-[11.5px]">
                    <Film className="h-3 w-3 shrink-0 text-dim" />
                    <span className="truncate text-muted">{a.name}</span>
                    <button className="ml-auto text-dim hover:text-danger" onClick={() => setSelected((p) => p.filter((id) => id !== a.id))}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t border-line-subtle pt-3">
                <KV label="素材数">{chosen.length} 条</KV>
                <KV label="总时长" mono>
                  {formatDuration(totalSeconds)}
                </KV>
                <KV label="计费分钟" mono>
                  {totalMinutesBilled} 分钟
                </KV>
              </div>
            </Panel>
            <div className="rounded-lg border border-line-subtle bg-[#0e1118] p-3 text-[11px] leading-5 text-dim">
              提示：一条任务最多包含 10 个素材。不同分辨率会按素材原始规格分别计费，预估费用按各自时长汇总。
            </div>
          </div>
        </div>
      )
    }

    if (step === 1) {
      return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <Panel className="p-5">
            <div className="mb-4 text-[13px] text-ink">输出规格</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11.5px] text-muted">输出格式</label>
                <Select value={output.format} onChange={(e) => setOutput({ ...output, format: e.target.value as OutputFormat })}>
                  {Object.entries(FORMAT_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                      {k === 'MV-HEVC' ? '（Vision Pro）' : k === 'OU' || k === 'Anaglyph' ? '（兼容模式）' : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] text-muted">分辨率</label>
                <Select value={output.resolution} onChange={(e) => setOutput({ ...output, resolution: e.target.value as OutputSpec['resolution'] })}>
                  <option value="source">保持原始</option>
                  <option value="3840x2160">3840 × 2160（4K）</option>
                  <option value="7680x4320">7680 × 4320（8K）</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] text-muted">帧率</label>
                <Select
                  value={String(output.fps)}
                  onChange={(e) => setOutput({ ...output, fps: e.target.value === 'source' ? 'source' : (Number(e.target.value) as 24 | 30 | 60) })}
                >
                  <option value="source">保持原始</option>
                  <option value="24">24 fps</option>
                  <option value="30">30 fps</option>
                  <option value="60">60 fps</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] text-muted">码率</label>
                <Select
                  value={output.bitrate === 'auto' ? 'auto' : 'fixed'}
                  onChange={(e) => setOutput({ ...output, bitrate: e.target.value === 'auto' ? 'auto' : 180 })}
                >
                  <option value="auto">智能（推荐）</option>
                  <option value="fixed">固定码率</option>
                </Select>
                {output.bitrate !== 'auto' && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      value={output.bitrate}
                      onChange={(e) => setOutput({ ...output, bitrate: Number(e.target.value) })}
                      className="h-8 w-24 rounded border border-line bg-[#0d1017] px-2 text-[12px] text-ink"
                    />
                    <span className="text-[11px] text-dim">Mbps</span>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] text-muted">色彩空间</label>
                <Select value={output.colorSpace} onChange={(e) => setOutput({ ...output, colorSpace: e.target.value as OutputSpec['colorSpace'] })}>
                  <option value="Rec.709">Rec.709</option>
                  <option value="Rec.2020">Rec.2020</option>
                  <option value="P3">Display P3</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] text-muted">HDR</label>
                <Select value={output.hdr} onChange={(e) => setOutput({ ...output, hdr: e.target.value as OutputSpec['hdr'] })}>
                  <option value="SDR">SDR</option>
                  <option value="HDR10">HDR10</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] text-muted">音频处理</label>
                <Select value={output.audio} onChange={(e) => setOutput({ ...output, audio: e.target.value as OutputSpec['audio'] })}>
                  <option value="spatial">空间音频混音（推荐）</option>
                  <option value="passthrough">直通</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] text-muted">容器</label>
                <Select value={output.container} onChange={(e) => setOutput({ ...output, container: e.target.value as OutputSpec['container'] })}>
                  <option value="mov">.mov</option>
                  <option value="mp4">.mp4</option>
                </Select>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-line-subtle bg-[#0e1118] p-3">
              <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
                <Info className="h-3.5 w-3.5 text-accent" />
                Vision Pro 交付建议
              </div>
              <div className="mt-1.5 text-[11px] leading-5 text-dim">
                MV-HEVC + .mov 容器，Rec.2020 / HDR10，双视图码率 180 Mbps 以上。若客户使用展馆播放器，请改用 SBS 全宽并降码率至 120 Mbps。
              </div>
            </div>
          </Panel>

          <EstimatePanel
            seconds={estimate.secs}
            cost={estimate.cost}
            totalSeconds={totalSeconds}
            count={chosen.length}
            format={output.format}
          />
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <Panel className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[13px] text-ink">算法参数</div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-dim">套用预设</span>
                <Select value={presetId} onChange={(e) => applyPreset(e.target.value)} className="w-[190px]">
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.isDefault ? '（默认）' : ''}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Slider label="视差强度 Disparity" value={convert.disparity} min={0} max={100} onChange={(v) => setConvert({ ...convert, disparity: v })} hint="越高出屏越强，超过 75 易产生窗口违规" />
              <Slider label="收敛面 Convergence" value={convert.convergence} min={-50} max={50} onChange={(v) => setConvert({ ...convert, convergence: v })} hint="负值主体靠后，正值主体前移" />
              <Slider label="时域平滑 Temporal" value={convert.temporalSmooth} min={0} max={100} onChange={(v) => setConvert({ ...convert, temporalSmooth: v })} hint="抑制帧间深度抖动，过高会损失运动细节" />
              <Slider label="边缘保护 Edge" value={convert.edgePreserve} min={0} max={100} onChange={(v) => setConvert({ ...convert, edgePreserve: v })} hint="保护发丝、栅栏等高频边缘" />
              <Slider label="深度细节 Detail" value={convert.depthDetail} min={0} max={100} onChange={(v) => setConvert({ ...convert, depthDetail: v })} hint="提升远景层次，代价是噪点放大" />
              <div>
                <label className="mb-1.5 block text-[11.5px] text-muted">深度模型</label>
                <Select value={convert.depthModel} onChange={(e) => setConvert({ ...convert, depthModel: e.target.value as ConvertParams['depthModel'] })}>
                  <option value="SpaceScape-Depth V3">SpaceScape-Depth V3（推荐）</option>
                  <option value="SpaceScape-Depth V2 Lite">SpaceScape-Depth V2 Lite（快速）</option>
                  <option value="MiDaS-Outdoor">MiDaS-Outdoor（户外）</option>
                  <option value="DepthPro-Studio">DepthPro-Studio（8K 影院）</option>
                </Select>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-6 border-t border-line-subtle pt-4">
              <div className="flex items-center gap-2">
                <Switch checked={convert.faceProtect} onChange={(v) => setConvert({ ...convert, faceProtect: v })} label="人脸保护" />
                <span className="text-[11.5px] text-muted">人脸保护</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={convert.deflicker} onChange={(v) => setConvert({ ...convert, deflicker: v })} label="去闪烁" />
                <span className="text-[11.5px] text-muted">去闪烁</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={() => applyPreset(presetId)}
              >
                恢复预设值
              </Button>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[11px] text-dim">
                <span>视差分布示意（画面宽度百分比）</span>
                <span className="mono">0% — 2.4%</span>
              </div>
              <div className="relative h-8 overflow-hidden rounded-md border border-line-subtle bg-[#0d1017]">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${Math.min(96, 18 + convert.disparity * 0.7)}%`,
                    background: 'linear-gradient(90deg, rgba(34,211,238,0.12), rgba(61,125,255,0.45))',
                  }}
                />
                <div className="absolute inset-y-0" style={{ left: `${Math.min(96, 18 + convert.disparity * 0.7)}%`, width: 1, background: 'var(--warning)' }} />
                <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] text-dim">
                  <span>屏幕平面</span>
                  <span>舒适区上限 1.6%</span>
                </div>
              </div>
            </div>
          </Panel>

          <EstimatePanel seconds={estimate.secs} cost={estimate.cost} totalSeconds={totalSeconds} count={chosen.length} format={output.format} />
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Panel className="p-5">
            <div className="mb-3 text-[13px] text-ink">任务摘要</div>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <KV label="素材数量">{chosen.length} 条</KV>
                <KV label="总时长" mono>
                  {formatDuration(totalSeconds)}
                </KV>
                <KV label="输出格式">{FORMAT_LABEL[output.format]}</KV>
                <KV label="分辨率">{output.resolution === 'source' ? '保持原始' : output.resolution}</KV>
              </div>
              <div>
                <KV label="帧率">{output.fps === 'source' ? '保持原始' : `${output.fps} fps`}</KV>
                <KV label="色彩 / HDR">
                  {output.colorSpace} · {output.hdr}
                </KV>
                <KV label="音频">{output.audio === 'spatial' ? '空间音频混音' : '直通'}</KV>
                <KV label="深度模型">{convert.depthModel}</KV>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3 border-t border-line-subtle pt-3">
              {[
                ['视差', convert.disparity],
                ['收敛', convert.convergence],
                ['时域平滑', convert.temporalSmooth],
                ['边缘保护', convert.edgePreserve],
              ].map(([label, v]) => (
                <div key={String(label)}>
                  <div className="text-[10.5px] text-dim">{label}</div>
                  <div className="mono mt-0.5 text-[14px] text-ink">{v}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[13px] text-ink">提交前预检</div>
              <Badge tone={warnings.some((w) => w.level === 'warn') ? 'warning' : 'success'}>
                {warnings.filter((w) => w.level === 'warn').length} 项提醒
              </Badge>
            </div>
            <div className="space-y-2">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2 rounded-md border px-3 py-2 text-[11.5px] leading-5',
                    w.level === 'warn'
                      ? 'border-[rgba(245,165,36,0.25)] bg-[rgba(245,165,36,0.06)] text-[#f0c07a]'
                      : 'border-line-subtle bg-[#0e1118] text-muted',
                  )}
                >
                  {w.level === 'warn' ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />}
                  {w.text}
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-3 text-[13px] text-ink">调度</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-2 text-[11.5px] text-muted">优先级</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPriority('standard')}
                    className={cn(
                      'flex-1 rounded-md border px-3 py-2 text-left',
                      priority === 'standard' ? 'border-primary/60 bg-[rgba(61,125,255,0.07)]' : 'border-line hover:border-[#333c4c]',
                    )}
                  >
                    <div className="text-[12px] text-ink">标准</div>
                    <div className="mt-0.5 text-[10.5px] text-dim">按队列顺序调度</div>
                  </button>
                  <button
                    onClick={() => setPriority('rush')}
                    className={cn(
                      'flex-1 rounded-md border px-3 py-2 text-left',
                      priority === 'rush' ? 'border-warning/60 bg-[rgba(245,165,36,0.07)]' : 'border-line hover:border-[#333c4c]',
                    )}
                  >
                    <div className="text-[12px] text-ink">加急 ×1.5</div>
                    <div className="mt-0.5 text-[10.5px] text-dim">双节点并行，费用上浮</div>
                  </button>
                </div>
              </div>
              <div>
                <div className="mb-2 text-[11.5px] text-muted">节点策略</div>
                <Select value={nodeStrategy} onChange={(e) => setNodeStrategy(e.target.value)}>
                  <option value="auto">自动分配（推荐）</option>
                  {nodes
                    .filter((n) => n.status !== 'maintenance')
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        指定 {n.hostname} · {n.status === 'idle' ? '空闲' : `${n.utilization}% 负载`}
                      </option>
                    ))}
                </Select>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          <EstimatePanel seconds={estimate.secs} cost={estimate.cost} totalSeconds={totalSeconds} count={chosen.length} format={output.format} />
          <Button variant="primary" className="w-full" icon={<Sparkles className="h-3.5 w-3.5" />} onClick={submit}>
            提交 {chosen.length} 个任务
          </Button>
          <div className="text-center text-[10.5px] leading-5 text-dim">
            提交后将进入队列，可在任务详情查看逐阶段进度与运行日志。
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="新建转换任务"
        desc="选择素材、配置输出与算法参数，提交后进入渲染队列。"
        back={{ to: '/jobs', label: '返回任务列表' }}
        actions={
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button icon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => setStep(step - 1)}>
                上一步
              </Button>
            )}
            {step < 3 ? (
              <Button
                variant="primary"
                icon={<ArrowRight className="h-3.5 w-3.5" />}
                disabled={step === 0 && chosen.length === 0}
                onClick={() => setStep(step + 1)}
              >
                下一步
              </Button>
            ) : (
              <Button variant="primary" icon={<Check className="h-3.5 w-3.5" />} onClick={submit}>
                提交任务
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-5 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => i <= step && setStep(i)}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors',
                i === step ? 'text-ink' : i < step ? 'text-muted hover:text-ink' : 'text-dim',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border text-[10px]',
                  i < step
                    ? 'border-primary bg-primary text-white'
                    : i === step
                      ? 'border-primary text-primary'
                      : 'border-line text-dim',
                )}
              >
                {i < step ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              {label}
            </button>
            {i < STEPS.length - 1 && <div className={cn('h-px flex-1', i < step ? 'bg-primary/50' : 'bg-line')} />}
          </div>
        ))}
      </div>

      {stepBody()}
    </div>
  )
}

function EstimatePanel({
  seconds,
  cost,
  totalSeconds,
  count,
  format,
}: {
  seconds: number
  cost: number
  totalSeconds: number
  count: number
  format: OutputFormat
}) {
  const finish = new Date(Date.now() + seconds * 1000)
  return (
    <div className="space-y-3">
      <Panel className="p-4">
        <div className="mb-3 flex items-center gap-1.5 text-[12px] text-muted">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          实时预估
        </div>
        <div className="space-y-2.5">
          <div className="flex items-end justify-between">
            <span className="text-[11px] text-dim">输出时长</span>
            <span className="mono text-[13px] text-ink">{formatDuration(totalSeconds)}</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[11px] text-dim">预估处理耗时</span>
            <span className="mono text-[13px] text-ink">{formatMinutes(seconds / 60)}</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[11px] text-dim">预计完成</span>
            <span className="text-[11.5px] text-muted">
              {finish.getMonth() + 1}-{String(finish.getDate()).padStart(2, '0')} {String(finish.getHours()).padStart(2, '0')}:
              {String(finish.getMinutes()).padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-end justify-between border-t border-line-subtle pt-2.5">
            <span className="text-[11px] text-dim">预估费用</span>
            <span className="mono text-[18px] text-ink">{money(cost)}</span>
          </div>
        </div>
      </Panel>
      <div className="rounded-lg border border-line-subtle bg-[#0e1118] p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-dim">计费口径</span>
          <span className="text-muted">{count} 条素材</span>
        </div>
        <div className="mt-1.5 text-[10.5px] leading-5 text-dim">
          按输出分钟计费，{format === 'MV-HEVC' ? 'MV-HEVC 双视图' : FORMAT_LABEL[format]} 标准单价 4K ¥120 / 8K ¥360 每分钟，加急需 ×1.5。
        </div>
      </div>
    </div>
  )
}
