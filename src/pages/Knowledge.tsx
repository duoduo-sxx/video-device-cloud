import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, FileText, LibraryBig, Search, Sparkles } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Badge, Button, Card, Input, Select, Tabs } from '../components/ui'
import { PageHeader, SeverityTag, Skeleton, Thumb } from '../components/common'
import { DEFECT_CATALOG } from '../lib/defectCatalog'
import { ALGORITHM_MAP } from '../lib/algorithmCatalog'
import { CHANNEL_META, SEVERITY_ORDER } from '../lib/constants'
import { cn } from '../lib/cn'
import type { Channel } from '../types'

const DOCS = [
  { name: '技术质量评分规范 v3.2', type: 'PDF · 28 页', desc: '评分权重、等级判定与致命项一票否决规则', tag: '核心规范' },
  { name: '广电播出技术规范（摘编）', type: 'PDF · 16 页', desc: '响度 -24 LKFS / 真峰值 -1 dBTP 的落地口径', tag: '外部标准' },
  { name: '修复作业指导书 · 视频', type: 'PDF · 42 页', desc: '按缺陷类型的算法选择与参数建议区间', tag: '作业手册' },
  { name: '修复作业指导书 · 音频', type: 'PDF · 34 页', desc: '降噪、去齿音、响度归一化的顺序与副作用', tag: '作业手册' },
  { name: '老片修复颗粒保留指南', type: 'PDF · 12 页', desc: '避免"塑料感"：颗粒层分离与合成的边界', tag: '经验沉淀' },
  { name: '交付格式规范 v2.0', type: 'PDF · 9 页', desc: '各平台封装 / 编码 / 元数据的最小要求', tag: '交付标准' },
]

export default function Knowledge() {
  const navigate = useNavigate()
  const { data, loading } = useAsync(() => api.listCases(), [])
  const [tab, setTab] = useState('defects')
  const [keyword, setKeyword] = useState('')
  const [channel, setChannel] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [expanded, setExpanded] = useState<string | null>('V-FRZ')

  const cases = data ?? []

  const defects = useMemo(
    () =>
      DEFECT_CATALOG.filter((d) => {
        if (channel !== 'all' && d.channel !== channel) return false
        if (severity !== 'all' && d.severity !== severity) return false
        if (keyword) return d.name.includes(keyword) || d.code.toLowerCase().includes(keyword.toLowerCase()) || d.cause.includes(keyword)
        return true
      }),
    [channel, severity, keyword],
  )

  return (
    <div>
      <PageHeader
        title="知识库"
        desc="缺陷目录、交付案例与作业规范。缺陷定义是规则库的上游：一个缺陷讲清成因、判定与修法，规则才有依据。"
        actions={
          <Button variant="primary">
            <FileText size={14} /> 新建文档
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { label: '缺陷类型', value: DEFECT_CATALOG.length, hint: '跨视频/音频/容器/字幕' },
          { label: '交付案例', value: cases.length, hint: '含前后指标对比' },
          { label: '规范文档', value: DOCS.length, hint: '内部 + 外部标准' },
          { label: '关联算法', value: Object.keys(ALGORITHM_MAP).length, hint: '可被方案直接引用' },
        ].map((k) => (
          <Card key={k.label} className="px-4 py-3">
            <div className="text-[11px] text-[var(--text-3)]">{k.label}</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="mono text-[20px] font-medium text-[var(--text-1)]">{k.value}</span>
              <span className="text-[10.5px] text-[var(--text-3)]">{k.hint}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="px-5 pt-3">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: 'defects', label: '缺陷目录', count: DEFECT_CATALOG.length },
              { key: 'cases', label: '交付案例', count: cases.length },
              { key: 'docs', label: '规范文档', count: DOCS.length },
            ]}
          />
        </div>

        {tab === 'defects' ? (
          <>
            <div className="flex items-center gap-2 px-5 py-3">
              <div className="relative w-[280px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索缺陷名称、编码或成因" className="pl-8" />
              </div>
              <div className="w-[130px]">
                <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                  <option value="all">全部通道</option>
                  {(Object.keys(CHANNEL_META) as Channel[]).map((c) => (
                    <option key={c} value={c}>
                      {CHANNEL_META[c].label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-[130px]">
                <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="all">全部等级</option>
                  {SEVERITY_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {s === 'fatal' ? '致命' : s === 'severe' ? '严重' : s === 'moderate' ? '一般' : '提示'}
                    </option>
                  ))}
                </Select>
              </div>
              <span className="ml-auto text-[11px] text-[var(--text-3)]">{defects.length} 类缺陷</span>
            </div>

            <div className="space-y-1.5 px-4 pb-4">
              {defects.map((d) => {
                const open = expanded === d.code
                return (
                  <div key={d.code} className={cn('rounded-lg border transition-colors', open ? 'border-[var(--border-str)] bg-[var(--bg-2)]' : 'border-[var(--border)]')}>
                    <button onClick={() => setExpanded(open ? null : d.code)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                      <span className="mono w-[62px] shrink-0 rounded bg-[var(--bg-3)] px-1 py-0.5 text-center text-[10.5px] text-[var(--text-2)]">
                        {d.code}
                      </span>
                      <span className="w-[110px] shrink-0 text-[12.5px] text-[var(--text-1)]">{d.name}</span>
                      <span className="w-[52px] shrink-0 text-[11px]" style={{ color: CHANNEL_META[d.channel].color }}>
                        {CHANNEL_META[d.channel].label}
                      </span>
                      <SeverityTag severity={d.severity} />
                      <span className="mono ml-2 shrink-0 text-[11px] text-[var(--text-3)]">
                        {d.metricLabel} {d.violation === 'above' ? '>' : '<'} {d.threshold} {d.unit}
                      </span>
                      <span className="ml-auto max-w-[380px] truncate text-[11px] text-[var(--text-3)]">{d.suggestion}</span>
                      <ArrowRight size={12} className={cn('shrink-0 text-[var(--text-3)] transition-transform', open && 'rotate-90')} />
                    </button>
                    {open && (
                      <div className="grid grid-cols-3 gap-3 border-t border-[var(--border)] px-3 py-3">
                        <div>
                          <div className="mb-1 text-[10.5px] text-[var(--text-3)]">成因</div>
                          <p className="text-[11.5px] leading-5 text-[var(--text-2)]">{d.cause}</p>
                        </div>
                        <div>
                          <div className="mb-1 text-[10.5px] text-[var(--text-3)]">主观感受</div>
                          <p className="text-[11.5px] leading-5 text-[var(--text-2)]">{d.perception}</p>
                        </div>
                        <div>
                          <div className="mb-1 text-[10.5px] text-[var(--text-3)]">推荐算法</div>
                          <div className="flex flex-wrap gap-1">
                            {d.algorithmIds.map((aid) => (
                              <span key={aid} className="rounded border border-[var(--border)] bg-[var(--bg-1)] px-1.5 py-0.5 text-[10.5px] text-[var(--text-2)]">
                                {ALGORITHM_MAP[aid]?.name ?? aid}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 text-[10.5px] text-[var(--text-3)]">
                            典型持续 {d.dur[0]}–{d.dur[1]}s · 平均 100 分钟出现 {d.freq} 次
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : tab === 'cases' ? (
          loading ? (
            <div className="grid grid-cols-2 gap-3 p-4">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4">
              {cases.map((c) => (
                <Link
                  key={c.id}
                  to={`/knowledge/${c.id}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-3 transition-colors hover:border-[var(--border-str)]"
                >
                  <div className="flex gap-3">
                    <div className="w-[112px] shrink-0">
                      <Thumb seed={c.coverSeed} aspect="16/10" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-[12.5px] leading-5 text-[var(--text-1)] group-hover:text-[var(--primary)]">{c.title}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded bg-[var(--bg-3)] px-1.5 py-0.5 text-[10px] text-[var(--text-2)]">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mono mt-1.5 text-[10.5px] text-[var(--text-3)]">
                        {c.client} · {c.hours} 工时
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-1.5 border-t border-[var(--border)] pt-2">
                    {[
                      { k: 'VMAF', b: c.before.vmaf, a: c.after.vmaf },
                      { k: 'PSNR', b: c.before.psnr, a: c.after.psnr },
                      { k: '缺陷', b: c.before.scratches ?? c.before.flicker ?? 0, a: c.after.scratches ?? c.after.flicker ?? 0 },
                    ].map((m) => (
                      <div key={m.k}>
                        <div className="text-[10px] text-[var(--text-3)]">{m.k}</div>
                        <div className="mono text-[11px]">
                          <span className="text-[var(--text-3)]">{m.b}</span>
                          <span className="mx-1 text-[var(--text-3)]">→</span>
                          <span className="text-[var(--success)]">{m.a}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {DOCS.map((d) => (
              <div key={d.name} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-2)]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-2)] text-[var(--text-3)]">
                  <BookOpen size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] text-[var(--text-1)]">{d.name}</div>
                  <div className="text-[11px] text-[var(--text-3)]">{d.desc}</div>
                </div>
                <Badge>{d.tag}</Badge>
                <span className="mono w-[80px] text-right text-[10.5px] text-[var(--text-3)]">{d.type}</span>
                <Button size="sm" variant="ghost" onClick={() => navigate('/reports')}>
                  预览
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-1)] px-4 py-3 text-[11px] leading-5 text-[var(--text-3)]">
        <Sparkles size={13} className="mt-0.5 shrink-0 text-[var(--purple)]" />
        知识库与规则库联动：新增一类缺陷需同时给出「判定阈值 + 推荐算法 + 复检口径」，否则无法进入规则集。这条约束保证了检测结果永远可解释、可修复。
        <LibraryBig size={13} className="ml-auto shrink-0" />
      </div>
    </div>
  )
}
