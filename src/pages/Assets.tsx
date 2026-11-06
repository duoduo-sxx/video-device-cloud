import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileVideo, Grid2x2, List, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Badge, Button, Drawer, EmptyState, IconButton, Input, KV, Panel, SearchInput, Segmented, Select } from '../components/ui'
import { AssetThumb, PlayerMock } from '../components/media'
import { DataTable, type Column } from '../components/table'
import { formatDateTime, formatFileSize, formatDuration, relativeTime } from '../lib/format'
import type { Asset } from '../types'
import { cn } from '../lib/utils'

type Uploading = { id: string; name: string; pct: number; size: number }

export default function Assets() {
  const navigate = useNavigate()
  const assets = useDataStore((s) => s.assets)
  const projects = useDataStore((s) => s.projects)
  const clients = useDataStore((s) => s.clients)
  const jobs = useDataStore((s) => s.jobs)
  const addAsset = useDataStore((s) => s.addAsset)
  const removeAssets = useDataStore((s) => s.removeAssets)
  const toast = useAppStore((s) => s.toast)

  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')
  const [clientId, setClientId] = useState('all')
  const [projectId, setProjectId] = useState('all')
  const [res, setRes] = useState('all')
  const [hdr, setHdr] = useState('all')
  const [sort, setSort] = useState<'new' | 'duration' | 'size' | 'name'>('new')
  const [selected, setSelected] = useState<string[]>([])
  const [detail, setDetail] = useState<Asset | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploads, setUploads] = useState<Uploading[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const clientName = (id?: string) => clients.find((c) => c.id === id)?.shortName ?? '未关联'
  const projectName = (id?: string) => projects.find((p) => p.id === id)?.name ?? '未关联项目'

  const filtered = useMemo(() => {
    let list = assets.filter((a) => {
      if (query) {
        const q = query.toLowerCase()
        if (!a.name.toLowerCase().includes(q) && !a.tags.join(' ').toLowerCase().includes(q) && !clientName(a.clientId).includes(query)) return false
      }
      if (clientId !== 'all' && a.clientId !== clientId) return false
      if (projectId !== 'all' && a.projectId !== projectId) return false
      if (res === '8K' && a.width < 7000) return false
      if (res === '4K' && (a.width < 3000 || a.width >= 7000)) return false
      if (res === '1080p' && a.width >= 3000) return false
      if (hdr !== 'all' && a.hdr !== hdr) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'duration') return b.durationSec - a.durationSec
      if (sort === 'size') return b.sizeGB - a.sizeGB
      if (sort === 'name') return a.name.localeCompare(b.name)
      return b.createdAt.localeCompare(a.createdAt)
    })
    return list
  }, [assets, query, clientId, projectId, res, hdr, sort])

  const usedGB = assets.reduce((s, a) => s + a.sizeGB, 0)
  const totalGB = 8192

  const addedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!uploads.length) return
    const timer = window.setInterval(() => {
      setUploads((list) => list.map((u) => ({ ...u, pct: Math.min(100, u.pct + 8 + Math.random() * 9) })))
    }, 260)
    return () => window.clearInterval(timer)
  }, [uploads.length])

  useEffect(() => {
    const done = uploads.filter((u) => u.pct >= 100 && !addedRef.current.has(u.id))
    if (!done.length) return
    done.forEach((u) => {
      addedRef.current.add(u.id)
      const width = /8K/i.test(u.name) ? 7680 : /4K/i.test(u.name) ? 3840 : 1920
      addAsset({
        id: `ast_new_${u.id}`,
        name: u.name,
        thumb: { from: '#1d3b4d', to: '#0b1620', motif: 'mountain' },
        durationSec: 120 + Math.round(Math.random() * 900),
        width,
        height: width === 7680 ? 4320 : width === 3840 ? 2160 : 1080,
        fps: 25,
        codec: u.name.endsWith('.mov') ? 'ProRes 422 HQ' : 'H.265',
        bitrateMbps: width === 7680 ? 720 : width === 3840 ? 260 : 48,
        sizeGB: Math.max(0.4, Math.round((u.size / 1024) * 10) / 10),
        audio: { channels: 2, sampleRate: 48000, layout: '立体声 2.0' },
        colorSpace: 'Rec.709',
        hdr: 'SDR',
        scenes: 12,
        hasFace: false,
        status: 'ready',
        tags: ['新导入', width === 7680 ? '8K' : width === 3840 ? '4K' : '1080p'],
        createdAt: new Date().toISOString(),
      })
    })
    setUploads((list) => list.filter((u) => u.pct < 100))
    toast('success', `已导入 ${done.length} 个素材`, '元数据已解析，可直接创建转换任务')
  }, [uploads, addAsset, toast])

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return
    const list = Array.from(files).slice(0, 5)
    setUploads((prev) => [
      ...prev,
      ...list.map((f, i) => ({
        id: `up_${Date.now()}_${i}`,
        name: f.name,
        pct: 4,
        size: Math.round(f.size / 1024 / 1024) || 1200,
      })),
    ])
    toast('info', `正在导入 ${list.length} 个素材`, '本地解析元数据，不会上传至服务器')
  }

  const columns: Column<Asset>[] = [
    {
      key: 'name',
      header: '素材',
      sortValue: (a) => a.name,
      render: (a) => (
        <div className="flex items-center gap-2.5">
          <AssetThumb asset={a} showMeta={false} className="h-8 w-[56px] shrink-0" rounded="rounded" />
          <div className="min-w-0">
            <div className="truncate font-mono text-[12px] text-ink">{a.name}</div>
            <div className="mt-0.5 truncate text-[10.5px] text-dim">{a.tags.slice(0, 3).join(' · ')}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'client',
      header: '客户 / 项目',
      render: (a) => (
        <div>
          <div className="text-[12px] text-ink">{clientName(a.clientId)}</div>
          <div className="mt-0.5 truncate text-[10.5px] text-dim">{projectName(a.projectId)}</div>
        </div>
      ),
    },
    {
      key: 'spec',
      header: '规格',
      sortValue: (a) => a.width,
      render: (a) => (
        <span className="mono text-[11.5px] text-muted">
          {a.width}×{a.height} · {a.fps}fps
        </span>
      ),
    },
    { key: 'codec', header: '编码', render: (a) => <span className="text-[12px] text-muted">{a.codec}</span> },
    {
      key: 'duration',
      header: '时长',
      align: 'right',
      sortValue: (a) => a.durationSec,
      render: (a) => <span className="mono text-[12px] text-muted">{formatDuration(a.durationSec)}</span>,
    },
    {
      key: 'size',
      header: '大小',
      align: 'right',
      sortValue: (a) => a.sizeGB,
      render: (a) => <span className="mono text-[12px] text-muted">{formatFileSize(a.sizeGB)}</span>,
    },
    { key: 'hdr', header: 'HDR', render: (a) => <span className="text-[12px] text-muted">{a.hdr}</span> },
    {
      key: 'created',
      header: '导入时间',
      align: 'right',
      sortValue: (a) => a.createdAt,
      render: (a) => <span className="text-[11.5px] text-dim">{relativeTime(a.createdAt)}</span>,
    },
  ]

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="素材库"
        desc="原始 2D 素材的技审信息与关联关系。导入仅在本机解析，不上传文件。"
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { key: 'grid', icon: <Grid2x2 className="h-3.5 w-3.5" />, label: '网格' },
                { key: 'list', icon: <List className="h-3.5 w-3.5" />, label: '列表' },
              ]}
            />
            <Button variant="primary" icon={<Upload className="h-3.5 w-3.5" />} onClick={() => inputRef.current?.click()}>
              导入素材
            </Button>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </>
        }
      />

      <Panel className="mb-4 flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex min-w-[240px] flex-1 items-center gap-3">
          <span className="text-[11px] text-dim">存储</span>
          <div className="h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-[#1c2230]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(usedGB / totalGB) * 100}%` }} />
          </div>
          <span className="mono text-[11px] text-muted">
            {formatFileSize(usedGB)} / 8 TB
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-dim">
          <span>60 条素材</span>
          <span className="text-[#2a3140]">|</span>
          <span>4K 及以上 {assets.filter((a) => a.width >= 3000).length} 条</span>
          <span className="text-[#2a3140]">|</span>
          <span>HDR {assets.filter((a) => a.hdr !== 'SDR').length} 条</span>
        </div>
      </Panel>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="搜索素材名称、标签或客户" className="w-[280px]" />
        <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-[150px]">
          <option value="all">全部客户</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shortName}
            </option>
          ))}
        </Select>
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-[210px]">
          <option value="all">全部项目</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select value={res} onChange={(e) => setRes(e.target.value)} className="w-[120px]">
          <option value="all">全部分辨率</option>
          <option value="8K">8K</option>
          <option value="4K">4K</option>
          <option value="1080p">1080p</option>
        </Select>
        <Select value={hdr} onChange={(e) => setHdr(e.target.value)} className="w-[120px]">
          <option value="all">全部 HDR</option>
          <option value="SDR">SDR</option>
          <option value="HDR10">HDR10</option>
          <option value="Dolby Vision">Dolby Vision</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-[130px]">
          <option value="new">最新导入</option>
          <option value="duration">时长最长</option>
          <option value="size">文件最大</option>
          <option value="name">名称 A-Z</option>
        </Select>
        <Button
          variant="ghost"
          onClick={() => {
            setQuery('')
            setClientId('all')
            setProjectId('all')
            setRes('all')
            setHdr('all')
          }}
        >
          清空筛选
        </Button>
        <span className="ml-auto text-[11px] text-dim">
          命中 <span className="mono text-muted">{filtered.length}</span> 条
        </span>
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-[#141a26] px-3 py-2">
          <span className="text-[12px] text-ink">已选 {selected.length} 个素材</span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={() => navigate(`/jobs/new?assets=${selected.join(',')}`)}>
              加入转换任务
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => {
                removeAssets(selected)
                toast('success', `已移除 ${selected.length} 个素材`)
                setSelected([])
              }}
            >
              移除
            </Button>
            <IconButton onClick={() => setSelected([])} aria-label="取消选择">
              <X className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn('rounded-xl transition-colors', dragging && 'bg-[rgba(61,125,255,0.06)] ring-1 ring-primary/40')}
      >
        {dragging && (
          <div className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary py-6 text-[13px] text-primary">
            <Upload className="h-4 w-4" /> 松手导入视频文件（支持 mov / mp4 / mxf）
          </div>
        )}

        {uploads.length > 0 && (
          <Panel className="mb-3 p-3">
            <div className="mb-2 flex items-center gap-2 text-[12px] text-ink">
              <Upload className="h-3.5 w-3.5 text-primary" />
              正在导入 {uploads.length} 个文件
            </div>
            <div className="space-y-2">
              {uploads.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <span className="w-[280px] truncate font-mono text-[11px] text-muted">{u.name}</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#1c2230]">
                    <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${u.pct}%` }} />
                  </div>
                  <span className="mono w-10 text-right text-[11px] text-dim">{Math.round(u.pct)}%</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {filtered.length === 0 ? (
          <Panel>
            <EmptyState
              title="没有匹配的素材"
              desc="试试调整筛选条件，或直接拖拽视频文件到这里导入。"
              icon={<FileVideo className="h-5 w-5" />}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setQuery('')
                    setClientId('all')
                    setProjectId('all')
                    setRes('all')
                    setHdr('all')
                  }}
                >
                  清空筛选
                </Button>
              }
            />
          </Panel>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((a) => {
              const isSel = selected.includes(a.id)
              return (
                <div
                  key={a.id}
                  onClick={() => setDetail(a)}
                  className={cn(
                    'group cursor-pointer overflow-hidden rounded-xl border bg-surface transition-colors',
                    isSel ? 'border-primary/60' : 'border-line hover:border-[#333c4c]',
                  )}
                >
                  <div className="relative">
                    <AssetThumb asset={a} rounded="rounded-none" className="w-full" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelected((prev) => (isSel ? prev.filter((id) => id !== a.id) : [...prev, a.id]))
                      }}
                      className={cn(
                        'absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded border transition-opacity',
                        isSel ? 'border-primary bg-primary text-white opacity-100' : 'border-white/40 bg-black/40 text-transparent opacity-0 group-hover:opacity-100',
                      )}
                      aria-label="选择素材"
                    >
                      <span className="text-[10px]">✓</span>
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="truncate font-mono text-[12px] text-ink">{a.name}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="truncate text-[11px] text-dim">
                        {clientName(a.clientId)} · {a.hdr}
                      </span>
                      <span className="mono shrink-0 text-[10.5px] text-dim">{formatFileSize(a.sizeGB)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {a.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded bg-[#1b212c] px-1.5 py-0.5 text-[10px] text-dim">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <Panel className="overflow-hidden">
            <DataTable
              columns={columns}
              rows={filtered}
              pageSize={12}
              selectable
              selected={selected}
              onSelectedChange={setSelected}
              onRowClick={(a) => setDetail(a)}
            />
          </Panel>
        )}
      </div>

      <Drawer open={!!detail} onClose={() => setDetail(null)} title="素材详情" width={520}>
        {detail && (
          <div className="space-y-4">
            <PlayerMock asset={detail} />
            <div>
              <div className="font-mono text-[12.5px] text-ink">{detail.name}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {detail.tags.map((t) => (
                  <Badge key={t} tone="neutral">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-line-subtle px-3 py-1">
              <KV label="客户">{clientName(detail.clientId)}</KV>
              <KV label="所属项目">{projectName(detail.projectId)}</KV>
              <KV label="分辨率">
                {detail.width} × {detail.height}
              </KV>
              <KV label="帧率">{detail.fps} fps</KV>
              <KV label="编码">{detail.codec}</KV>
              <KV label="码率">{detail.bitrateMbps} Mbps</KV>
              <KV label="文件大小">{formatFileSize(detail.sizeGB)}</KV>
              <KV label="色彩空间">
                {detail.colorSpace} · {detail.hdr}
              </KV>
              <KV label="音频">
                {detail.audio.channels}ch · {detail.audio.sampleRate / 1000}kHz · {detail.audio.layout}
              </KV>
              <KV label="镜头数">{detail.scenes}</KV>
              <KV label="含人脸">{detail.hasFace ? '是（启用人物保护）' : '否'}</KV>
              <KV label="导入时间">{formatDateTime(detail.createdAt)}</KV>
            </div>

            <div>
              <div className="mb-2 text-[12px] text-muted">关联任务</div>
              <div className="space-y-1">
                {jobs.filter((j) => j.assetId === detail.id).length === 0 && (
                  <div className="text-[11px] text-dim">尚未用于任何转换任务</div>
                )}
                {jobs
                  .filter((j) => j.assetId === detail.id)
                  .slice(0, 4)
                  .map((j) => (
                    <button
                      key={j.id}
                      onClick={() => navigate(`/jobs/${j.id}`)}
                      className="flex w-full items-center gap-2 rounded-md border border-line-subtle px-2.5 py-2 text-left hover:bg-[#151a23]"
                    >
                      <span className="mono text-[10.5px] text-dim">{j.code}</span>
                      <span className="flex-1 truncate text-[11.5px] text-muted">{j.name}</span>
                      <Badge tone={j.status === 'completed' ? 'success' : 'primary'}>{j.progress}%</Badge>
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => navigate(`/jobs/new?assets=${detail.id}`)}
              >
                创建转换任务
              </Button>
              <Button onClick={() => setDetail(null)}>关闭</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
