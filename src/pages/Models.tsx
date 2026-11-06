import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Cpu,
  Activity,
  Gauge,
  Target,
  Play,
  Settings2,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  Loader2,
  Check,
  Zap,
  Layers,
  ChevronRight,
} from 'lucide-react'
import type { ModelItem, ModelType } from '../types'
import { fetchModels } from '../services'
import {
  Badge,
  Button,
  Card,
  Dialog,
  Drawer,
  Field,
  PageHeader,
  Progress,
  SearchInput,
  SectionTitle,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Textarea,
  Tooltip,
  toast,
} from '../components/ui'
import { cn, formatNumber, percent } from '../lib/utils'

const TYPES: (ModelType | '全部')[] = [
  '全部',
  'ASR',
  'OCR',
  '视觉理解',
  '场景识别',
  '人脸识别',
  '语音情感',
  '内容审核',
  '多模态大模型',
  '语义检索',
]

const STATUS_MAP = {
  online: { label: '在线', color: 'var(--success)' },
  updating: { label: '更新中', color: 'var(--warning)' },
  offline: { label: '已下线', color: 'var(--text-tertiary)' },
}

export default function Models() {
  const loc = useLocation()
  const navigate = useNavigate()
  const tab = loc.pathname.endsWith('/pipeline') ? 'pipeline' : 'models'

  return (
    <div className="p-6">
      <PageHeader
        title="模型与能力"
        desc="解析流水线用到的全部模型、版本与运行指标，可按业务需要编排链路"
        extra={
          <Button icon={<Zap size={13} />} onClick={() => toast('已触发一次全链路连通性探测', 'info')}>
            连通性探测
          </Button>
        }
      />

      <Tabs
        className="mb-4"
        value={tab}
        onChange={(k) => navigate(k === 'pipeline' ? '/models/pipeline' : '/models')}
        tabs={[
          { key: 'models', label: '模型列表' },
          { key: 'pipeline', label: '流水线编排' },
        ]}
      />

      {tab === 'models' ? <ModelList /> : <Pipeline />}
    </div>
  )
}

function Spark({ data, color = 'var(--brand)' }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 22 - ((v - min) / Math.max(1, max - min)) * 18
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg viewBox="0 0 100 24" className="h-6 w-20">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ModelList() {
  const [models, setModels] = useState<ModelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<string>('全部')
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<ModelItem | null>(null)
  const [testOpen, setTestOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [output, setOutput] = useState('')

  useEffect(() => {
    fetchModels().then((m) => {
      setModels(m)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(
    () =>
      models.filter(
        (m) => (type === '全部' || m.type === type) && (!q.trim() || m.name.includes(q.trim()) || m.provider.includes(q.trim())),
      ),
    [models, type, q],
  )

  const stats = useMemo(
    () => ({
      online: models.filter((m) => m.status === 'online').length,
      calls: models.reduce((s, m) => s + m.calls, 0),
      latency: models.length ? Math.round(models.reduce((s, m) => s + m.latency, 0) / models.length) : 0,
      accuracy: models.length ? models.reduce((s, m) => s + m.accuracy, 0) / models.length : 0,
    }),
    [models],
  )

  const runTest = () => {
    setTesting(true)
    setOutput('')
    setTimeout(() => {
      setTesting(false)
      setOutput(
        JSON.stringify(
          {
            model: detail?.name,
            version: detail?.version,
            latency_ms: detail?.latency,
            tokens: 1284,
            request_id: 'req_20261019_093012_a7f3',
            result: {
              type: detail?.type,
              confidence: 0.936,
              items: [
                { label: '场景描述', value: '室内工坊，手部特写，自然光', score: 0.94 },
                { label: '关键实体', value: ['铜胎', '镊子', '釉料'], score: 0.91 },
                { label: '质量评分', value: { composition: 86, clarity: 94 }, score: 0.9 },
              ],
            },
          },
          null,
          2,
        ),
      )
    }, 1200)
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: '在线模型', value: `${stats.online}/${models.length}`, icon: Cpu, hint: '1 个更新中，1 个已下线' },
          { label: '累计调用', value: formatNumber(stats.calls), icon: Activity, hint: '近 30 天' },
          { label: '平均延迟', value: `${stats.latency} ms`, icon: Gauge, hint: '单帧单次推理' },
          { label: '平均准确率', value: percent(stats.accuracy, 1), icon: Target, hint: '内部评测集' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-t2">{s.label}</span>
                <Icon size={13} className="text-t3" />
              </div>
              <div className="num mt-1.5 text-xl font-medium text-t1">{s.value}</div>
              <div className="mt-0.5 text-[10px] text-t3">{s.hint}</div>
            </Card>
          )
        })}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] transition-colors',
                type === t ? 'bg-brand-soft font-medium text-brand' : 'text-t2 hover:bg-hover hover:text-t1',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="搜索模型名称或提供方…" className="ml-auto w-[220px]" />
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[176px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const st = STATUS_MAP[m.status]
            return (
              <Card key={m.id} hover className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-medium text-t1">{m.name}</span>
                      <Badge color={st.color} bg="var(--bg-subtle)" dot>
                        {st.label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-t3">
                      <span className="rounded bg-subtle px-1.5 py-0.5 text-t2">{m.type}</span>
                      <span className="num">{m.version}</span>
                      <span>·</span>
                      <span className="truncate">{m.provider}</span>
                    </div>
                  </div>
                  <Switch
                    checked={m.status === 'online'}
                    onChange={(v) => {
                      setModels((l) => l.map((x) => (x.id === m.id ? { ...x, status: v ? 'online' : 'offline' } : x)))
                      toast(v ? `${m.name} 已上线` : `${m.name} 已下线`, 'info')
                    }}
                    size="sm"
                  />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: '准确率', value: percent(m.accuracy, 1) },
                    { label: '延迟', value: `${m.latency}ms` },
                    { label: '调用', value: formatNumber(m.calls) },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-[9px] text-t3">{s.label}</div>
                      <div className="num text-[11px] text-t1">{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-end justify-between">
                  <div className="flex flex-wrap gap-1">
                    {m.scenes.slice(0, 2).map((s) => (
                      <span key={s} className="rounded bg-subtle px-1.5 py-0.5 text-[9px] text-t2">
                        {s}
                      </span>
                    ))}
                  </div>
                  <Spark data={m.trend} color={m.status === 'offline' ? 'var(--text-tertiary)' : 'var(--brand)'} />
                </div>

                <div className="mt-2.5 flex items-center gap-1 border-t border-line pt-2">
                  <Button size="sm" variant="ghost" onClick={() => setDetail(m)}>
                    详情
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDetail(m)
                      setTestOpen(true)
                    }}
                  >
                    在线测试
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={() => toast('已打开配置面板（演示）', 'info')}>
                    <Settings2 size={11} />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Drawer
        open={!!detail}
        onClose={() => {
          setDetail(null)
          setTestOpen(false)
        }}
        title={detail?.name}
        width={520}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setTestOpen(true)} icon={<Play size={12} />}>
              在线测试
            </Button>
            <Button variant="primary" onClick={() => toast('版本已锁定为当前默认', 'info')}>
              设为默认
            </Button>
          </div>
        }
      >
        {detail && (
          <div className="space-y-3 p-4">
            <div className="rounded-card border border-line p-3">
              <div className="flex items-center gap-2">
                <Badge>{detail.type}</Badge>
                <span className="num text-[11px] text-t2">{detail.version}</span>
                <Badge color={STATUS_MAP[detail.status].color} dot>
                  {STATUS_MAP[detail.status].label}
                </Badge>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-t2">{detail.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '提供方', value: detail.provider },
                { label: '更新时间', value: detail.updatedAt.slice(0, 10) },
                { label: '准确率', value: percent(detail.accuracy, 2) },
                { label: '平均延迟', value: `${detail.latency} ms` },
                { label: '累计调用', value: formatNumber(detail.calls) },
                { label: '部署方式', value: '本地推理 · GPU' },
              ].map((r) => (
                <div key={r.label} className="rounded-ctl border border-line px-2.5 py-2">
                  <div className="text-[10px] text-t3">{r.label}</div>
                  <div className="mt-0.5 truncate text-[11px] text-t1">{r.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-1.5 text-[11px] font-medium text-t2">适用场景</div>
              <div className="flex flex-wrap gap-1.5">
                {detail.scenes.map((s) => (
                  <span key={s} className="rounded-full bg-subtle px-2 py-0.5 text-[10px] text-t2">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-[11px] font-medium text-t2">指标趋势</div>
              <div className="flex items-center justify-between rounded-ctl border border-line px-2.5 py-2">
                <Spark data={detail.trend} />
                <span className="num text-[10px] text-t3">近 7 次评测</span>
              </div>
            </div>

            {testOpen && (
              <div className="rounded-card border border-brand/30 bg-brand-soft/30 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-brand">
                  <Play size={11} /> 在线测试
                </div>
                <Textarea rows={2} defaultValue="请对输入的视频帧做一次语义理解，输出场景描述与关键实体。" />
                <div className="mt-2 flex items-center gap-2">
                  <Button size="sm" variant="primary" loading={testing} onClick={runTest}>
                    发送请求
                  </Button>
                  <span className="text-[10px] text-t3">计费按实际 token 数结算</span>
                </div>
                {(testing || output) && (
                  <pre className="mt-2 max-h-[220px] overflow-auto rounded-ctl bg-[#0B0E14] p-2.5 font-mono text-[10px] leading-4 text-[#C9D1D9]">
                    {testing ? '正在推理…' : output}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  )
}

interface StageConfig {
  id: string
  name: string
  model: string
  concurrency: number
  enabled: boolean
  duration: number
}

const DEFAULT_STAGES: StageConfig[] = [
  { id: 's1', name: '视频接入', model: '内置 · 文件接入', concurrency: 4, enabled: true, duration: 1.2 },
  { id: 's2', name: '抽帧采样', model: '内置 · FFmpeg', concurrency: 8, enabled: true, duration: 8.4 },
  { id: 's3', name: '语音转写', model: 'Whisper-Pro ASR v3.2.1', concurrency: 4, enabled: true, duration: 38.6 },
  { id: 's4', name: '文字识别', model: 'OCR-Plus v2.8.0', concurrency: 6, enabled: true, duration: 12.9 },
  { id: 's5', name: '视觉理解', model: 'Insight-VL v2.1.4', concurrency: 4, enabled: true, duration: 96.2 },
  { id: 's6', name: '语义索引', model: 'VectorSearch v3.0.1', concurrency: 2, enabled: true, duration: 14.8 },
]

function Pipeline() {
  const [stages, setStages] = useState<StageConfig[]>(DEFAULT_STAGES)
  const [running, setRunning] = useState(false)
  const [active, setActive] = useState(-1)
  const [doneCount, setDoneCount] = useState(0)
  const [preset, setPreset] = useState('standard')

  const total = stages.filter((s) => s.enabled).reduce((s, x) => s + x.duration, 0)

  const run = () => {
    const list = stages.filter((s) => s.enabled)
    setRunning(true)
    setDoneCount(0)
    setActive(0)
    let i = 0
    const tick = () => {
      i += 1
      if (i >= list.length) {
        setActive(-1)
        setRunning(false)
        setDoneCount(list.length)
        toast('流水线执行完成，全部阶段通过')
        return
      }
      setActive(i)
      setDoneCount(i)
      window.setTimeout(tick, 700)
    }
    window.setTimeout(tick, 700)
  }

  const presetLoad = (p: string) => {
    setPreset(p)
    if (p === 'fast') {
      setStages(
        DEFAULT_STAGES.map((s) =>
          s.name === '视觉理解'
            ? { ...s, model: 'Insight-VL Lite v1.2', concurrency: 8, duration: 42 }
            : s.name === '语音转写'
              ? { ...s, concurrency: 8, duration: 22 }
              : s,
        ),
      )
      toast('已切换到「快速解析」模板', 'info')
    } else if (p === 'safety') {
      setStages([
        ...DEFAULT_STAGES,
        { id: 's7', name: '内容审核', model: 'GuardNet v5.1.0', concurrency: 6, enabled: true, duration: 18.4 },
      ])
      toast('已切换到「审核优先」模板', 'info')
    } else {
      setStages(DEFAULT_STAGES)
      toast('已切换回「标准解析」模板', 'info')
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-3">
        <Card className="p-4">
          <SectionTitle
            title="解析流水线"
            desc="阶段按顺序执行，前一阶段的产物会作为下一阶段的输入"
            extra={
              <div className="flex items-center gap-1.5">
                <Button size="sm" icon={<Plus size={11} />} onClick={() => toast('可从可用能力中添加阶段', 'info')}>
                  添加阶段
                </Button>
                <Button size="sm" icon={<Save size={11} />} onClick={() => toast('流水线配置已保存')}>
                  保存
                </Button>
                <Button size="sm" variant="primary" loading={running} icon={<Play size={11} />} onClick={run}>
                  试运行
                </Button>
              </div>
            }
          />

          <div className="space-y-1.5">
            {stages.map((s, i) => {
              const enabledIdx = stages.filter((x) => x.enabled).indexOf(s)
              const state = !s.enabled
                ? 'off'
                : active === -1 && doneCount === 0
                  ? 'idle'
                  : enabledIdx < doneCount
                    ? 'done'
                    : enabledIdx === active
                      ? 'running'
                      : 'idle'
              return (
                <div key={s.id}>
                  <div
                    className={cn(
                      'rounded-card border p-2.5 transition-colors',
                      state === 'running'
                        ? 'border-brand bg-brand-soft/50'
                        : state === 'done'
                          ? 'border-success/30 bg-success/[0.03]'
                          : 'border-line',
                      !s.enabled && 'opacity-55',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'num flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]',
                          state === 'done'
                            ? 'bg-success/10 text-success'
                            : state === 'running'
                              ? 'bg-brand text-white'
                              : 'bg-subtle text-t3',
                        )}
                      >
                        {state === 'done' ? <Check size={11} /> : state === 'running' ? <Loader2 size={10} className="animate-spin" /> : i + 1}
                      </span>
                      <input
                        value={s.name}
                        onChange={(e) => setStages((l) => l.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))}
                        className="w-24 shrink-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs font-medium text-t1 hover:border-line focus:border-brand focus:outline-none"
                      />
                      <Select
                        value={s.model}
                        onChange={(e) => setStages((l) => l.map((x) => (x.id === s.id ? { ...x, model: e.target.value } : x)))}
                        className="h-7 min-w-0 flex-1 text-[11px]"
                      >
                        <option>{s.model}</option>
                        <option>Whisper-Pro ASR v3.2.1</option>
                        <option>OCR-Plus v2.8.0</option>
                        <option>Insight-VL v2.1.4</option>
                        <option>SceneSplit v1.9.2</option>
                        <option>GuardNet v5.1.0</option>
                        <option>VectorSearch v3.0.1</option>
                      </Select>
                      <div className="flex shrink-0 items-center gap-1">
                        <Tooltip content="并发数">
                          <Select
                            value={String(s.concurrency)}
                            onChange={(e) =>
                              setStages((l) => l.map((x) => (x.id === s.id ? { ...x, concurrency: Number(e.target.value) } : x)))
                            }
                            className="h-7 w-[62px] text-[10px]"
                          >
                            {[1, 2, 4, 6, 8, 16].map((n) => (
                              <option key={n} value={n}>
                                ×{n}
                              </option>
                            ))}
                          </Select>
                        </Tooltip>
                        <span className="num w-11 text-right text-[10px] text-t3">{s.duration}s</span>
                        <Switch
                          checked={s.enabled}
                          onChange={(v) => setStages((l) => l.map((x) => (x.id === s.id ? { ...x, enabled: v } : x)))}
                          size="sm"
                        />
                        <button
                          onClick={() => setStages((l) => l.filter((x) => x.id !== s.id))}
                          className="rounded p-1 text-t3 hover:text-danger"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {i < stages.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <ChevronRight size={12} className="rotate-90 text-t3" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-ctl bg-subtle px-3 py-2">
            <span className="text-[10px] text-t3">
              串联耗时 <span className="num text-t2">{total.toFixed(1)}s</span>
            </span>
            <span className="text-[10px] text-t3">
              启用阶段 <span className="num text-t2">{stages.filter((s) => s.enabled).length}</span>
            </span>
            <span className="text-[10px] text-t3">
              最大并发 <span className="num text-t2">×{Math.max(...stages.map((s) => s.concurrency))}</span>
            </span>
            {running && (
              <div className="ml-auto flex w-40 items-center gap-2">
                <Progress value={(doneCount / Math.max(1, stages.filter((s) => s.enabled).length)) * 100} height={3} />
                <Loader2 size={11} className="animate-spin text-brand" />
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle title="阶段说明" desc="每个阶段产出的结构化结果会被下游复用" />
          <div className="space-y-2">
            {[
              { name: '抽帧采样', detail: '按 1 fps 抽取画面帧，同时用镜头边界检测保留关键帧，避免重复推理。' },
              { name: '语音转写', detail: '输出带时间戳与说话人标签的句子序列，句级置信度低于 0.7 的会被标记待复核。' },
              { name: '视觉理解', detail: '对关键帧做场景描述、物体检测与动作识别，并给出构图、光照、清晰度评分。' },
              { name: '语义索引', detail: '把转写文本、场景描述与画面特征编码为统一向量，写入检索索引供片段级召回。' },
            ].map((s) => (
              <div key={s.name} className="rounded-ctl border border-line px-2.5 py-2">
                <div className="text-[11px] font-medium text-t1">{s.name}</div>
                <p className="mt-0.5 text-[10px] leading-4 text-t3">{s.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <Card className="p-3">
          <SectionTitle title="预设模板" />
          <div className="space-y-1.5">
            {[
              { key: 'standard', name: '标准解析', desc: '6 阶段 · 平衡精度与耗时', icon: Layers },
              { key: 'fast', name: '快速解析', desc: '轻量视觉模型 · 适合预览', icon: Zap },
              { key: 'safety', name: '审核优先', desc: '追加内容审核 · 适合送审', icon: Settings2 },
            ].map((p) => {
              const Icon = p.icon
              return (
                <button
                  key={p.key}
                  onClick={() => presetLoad(p.key)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-ctl border px-2.5 py-2 text-left transition-colors',
                    preset === p.key ? 'border-brand bg-brand-soft/50' : 'border-line hover:bg-hover',
                  )}
                >
                  <Icon size={13} className={preset === p.key ? 'text-brand' : 'text-t3'} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-t1">{p.name}</div>
                    <div className="text-[10px] text-t3">{p.desc}</div>
                  </div>
                  {preset === p.key && <Check size={11} className="text-brand" />}
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="p-3">
          <SectionTitle title="资源估算" />
          <div className="space-y-2">
            {[
              { label: 'GPU 占用', value: 68, unit: '%', color: 'var(--brand)' },
              { label: '显存占用', value: 74, unit: '%', color: 'var(--ai-purple)' },
              { label: '队列积压', value: 12, unit: '%', color: 'var(--success)' },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-t2">{r.label}</span>
                  <span className="num text-t2">
                    {r.value}
                    {r.unit}
                  </span>
                </div>
                <Progress value={r.value} color={r.color} height={3} className="mt-1" />
              </div>
            ))}
          </div>
          <div className="mt-2.5 rounded-ctl bg-subtle px-2 py-1.5 text-[10px] leading-4 text-t3">
            按当前并发配置，单台 8 卡节点每小时可处理约 <span className="num text-t2">14</span> 小时素材。
          </div>
        </Card>

        <Card className="p-3">
          <div className="mb-1.5 text-[11px] font-medium text-t2">上线前检查</div>
          <div className="space-y-1.5 text-[10px]">
            {[
              '所有阶段均已绑定可用模型',
              '审核阶段阈值已与安全策略对齐',
              '索引版本与检索服务一致',
              '失败重试次数 ≤ 3 次',
            ].map((c) => (
              <div key={c} className="flex items-start gap-1.5 text-t2">
                <Check size={10} className="mt-0.5 shrink-0 text-success" />
                {c}
              </div>
            ))}
          </div>
          <Button size="sm" variant="primary" className="mt-2.5 w-full justify-center" onClick={() => toast('已提交上线申请，等待管理员审批', 'info')}>
            提交上线
          </Button>
        </Card>
      </div>
    </div>
  )
}
