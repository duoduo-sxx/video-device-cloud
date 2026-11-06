import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, Film, Grid2X2, List, Plus, Search, Upload, X } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Badge, Button, Card, Input, Modal, Progress, Select } from '../components/ui'
import { EmptyState, PageHeader, Skeleton, TableSkeleton, Thumb } from '../components/common'
import { db } from '../mock/db'
import { duration, gb, lufs } from '../lib/format'
import { MEMBER_MAP } from '../mock/build'
import { cn } from '../lib/cn'

export default function MediaLibrary() {
  const { data, loading } = useAsync(() => api.listAssets(), [])
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [project, setProject] = useState('all')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [selected, setSelected] = useState<string[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const assets = data ?? []

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const matchQ =
        !q ||
        a.name.toLowerCase().includes(q.toLowerCase()) ||
        a.fileName.toLowerCase().includes(q.toLowerCase()) ||
        a.code.toLowerCase().includes(q.toLowerCase())
      const matchP = project === 'all' || a.projectId === project
      return matchQ && matchP
    })
  }, [assets, q, project])

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const totalSelectedDuration = assets.filter((a) => selected.includes(a.id)).reduce((s, a) => s + a.durationSec, 0)

  const startUpload = () => {
    setUploading(true)
    setProgress(0)
    const timer = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(timer)
          setUploading(false)
          setUploadOpen(false)
          return 100
        }
        return p + 8
      })
    }, 160)
  }

  return (
    <div>
      <PageHeader
        title="媒体资产库"
        desc="所有进入流水线的素材，包含探针信息、响度指标与关联任务。"
        actions={
          <>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload size={14} /> 上传素材
            </Button>
            <Button variant="primary" onClick={() => navigate('/detection/new')}>
              <Plus size={14} /> 发起检测
            </Button>
          </>
        }
      />

      <Card className="mb-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-[280px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索文件名、资产编号、项目" className="pl-8" />
          </div>
          <div className="w-[210px]">
            <Select value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="all">全部项目（6）</option>
              {db.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <Select className="w-[140px]" defaultValue="all">
            <option value="all">全部类型</option>
            <option value="video">视频</option>
            <option value="audio">音频</option>
            <option value="sequence">序列/包装</option>
          </Select>
          <Select className="w-[140px]" defaultValue="all">
            <option value="all">全部状态</option>
            <option value="ready">就绪</option>
            <option value="analyzing">分析中</option>
            <option value="archived">已归档</option>
          </Select>
          {(q || project !== 'all') && (
            <button
              onClick={() => {
                setQ('')
                setProject('all')
              }}
              className="flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-3)] hover:text-[var(--text-1)]"
            >
              <X size={11} /> 清除筛选
            </button>
          )}
          <div className="ml-auto flex items-center gap-1 rounded-lg border border-[var(--border)] p-0.5">
            <button
              onClick={() => setView('list')}
              className={cn('rounded p-1.5', view === 'list' ? 'bg-[var(--bg-3)] text-[var(--text-1)]' : 'text-[var(--text-3)]')}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setView('grid')}
              className={cn('rounded p-1.5', view === 'grid' ? 'bg-[var(--bg-3)] text-[var(--text-1)]' : 'text-[var(--text-3)]')}
            >
              <Grid2X2 size={14} />
            </button>
          </div>
          <span className="text-[12px] text-[var(--text-3)]">
            共 <span className="mono text-[var(--text-2)]">{filtered.length}</span> 个素材
          </span>
        </div>
      </Card>

      {loading ? (
        <Card><TableSkeleton rows={8} cols={6} /></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Film size={20} />}
            title="没有匹配的素材"
            desc="调整筛选条件，或上传新的素材文件"
            action={<Button onClick={() => setUploadOpen(true)}>上传素材</Button>}
          />
        </Card>
      ) : view === 'list' ? (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                <th className="w-9 px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="accent-[var(--primary)]"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? filtered.map((a) => a.id) : [])}
                  />
                </th>
                <th className="px-2 py-2.5 text-left font-normal">素材</th>
                <th className="px-3 py-2.5 text-left font-normal">规格</th>
                <th className="px-3 py-2.5 text-left font-normal">时长</th>
                <th className="px-3 py-2.5 text-left font-normal">大小</th>
                <th className="px-3 py-2.5 text-left font-normal">积分响度</th>
                <th className="px-3 py-2.5 text-left font-normal">状态</th>
                <th className="px-3 py-2.5 text-left font-normal">上传人</th>
                <th className="px-4 py-2.5 text-right font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const offTarget = a.loudnessLufs !== undefined && (a.loudnessLufs > -20 || a.loudnessLufs < -26)
                return (
                  <tr key={a.id} className="row-hover border-b border-[var(--border)] last:border-0">
                    <td className="px-3 py-2">
                      <input type="checkbox" className="accent-[var(--primary)]" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 shrink-0">
                          <Thumb seed={a.thumbSeed} label={duration(a.durationSec).slice(0, 5)} />
                        </div>
                        <div className="min-w-0">
                          <Link to={`/media/${a.id}`} className="block truncate text-[13px] text-[var(--text-1)] hover:text-[var(--primary)]">
                            {a.name}
                          </Link>
                          <div className="truncate text-[11px] text-[var(--text-3)]">
                            {a.projectName} · <span className="mono">{a.code}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[12px] text-[var(--text-2)]">
                      <div className="mono text-[11px]">{a.width}×{a.height} · {a.fps}{a.scan ?? 'p'}</div>
                      <div className="text-[11px] text-[var(--text-3)]">{a.videoCodec}</div>
                    </td>
                    <td className="mono px-3 py-2 text-[12px] text-[var(--text-2)]">{duration(a.durationSec)}</td>
                    <td className="mono px-3 py-2 text-[12px] text-[var(--text-2)]">{gb(a.sizeGB)}</td>
                    <td className="px-3 py-2">
                      <span className={cn('mono text-[12px]', offTarget ? 'text-[var(--accent)]' : 'text-[var(--text-2)]')}>
                        {lufs(a.loudnessLufs)}
                      </span>
                      {offTarget && <div className="text-[10px] text-[var(--text-3)]">偏离 -24±2</div>}
                    </td>
                    <td className="px-3 py-2">
                      <Badge color="var(--success)" bg="rgba(52,211,153,.12)" dot>
                        就绪
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-[12px] text-[var(--text-2)]">{MEMBER_MAP[a.ownerId]?.name}</td>
                    <td className="px-4 py-2 text-right">
                      <Link to={`/detection/new?asset=${a.id}`} className="text-[12px] text-[var(--primary)] hover:underline">
                        发起检测
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {filtered.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <Link to={`/media/${a.id}`}>
                <Thumb seed={a.thumbSeed} label={duration(a.durationSec)} className="rounded-none border-0 border-b" />
              </Link>
              <div className="p-3">
                <Link to={`/media/${a.id}`} className="block truncate text-[13px] text-[var(--text-1)] hover:text-[var(--primary)]">
                  {a.name}
                </Link>
                <div className="mt-0.5 truncate text-[11px] text-[var(--text-3)]">{a.projectName}</div>
                <div className="mono mt-2 flex items-center justify-between text-[11px] text-[var(--text-3)]">
                  <span>{a.width}×{a.height}</span>
                  <span>{gb(a.sizeGB)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-[var(--border-str)] bg-[var(--bg-1)] px-4 py-2.5 shadow-layer">
          <span className="text-[12px] text-[var(--text-2)]">
            已选 <span className="mono text-[var(--text-1)]">{selected.length}</span> 项 · 总时长{' '}
            <span className="mono text-[var(--text-1)]">{duration(totalSelectedDuration)}</span>
          </span>
          <div className="h-4 w-px bg-[var(--border)]" />
          <Button size="sm" variant="primary" onClick={() => navigate('/detection/new')}>
            发起检测
          </Button>
          <Button size="sm">加入修复</Button>
          <Button size="sm">
            <Download size={12} /> 导出
          </Button>
          <button onClick={() => setSelected([])} className="text-[12px] text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X size={14} />
          </button>
        </div>
      )}

      <Modal
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        title="上传素材"
        footer={
          uploading ? (
            <Button disabled>上传中…</Button>
          ) : (
            <>
              <Button onClick={() => setUploadOpen(false)}>取消</Button>
              <Button variant="primary" onClick={startUpload}>
                开始上传
              </Button>
            </>
          )
        }
      >
        <div className="rounded-lg border border-dashed border-[var(--border-str)] bg-[var(--bg-2)] px-6 py-10 text-center">
          <Upload size={22} className="mx-auto mb-2 text-[var(--text-3)]" />
          <div className="text-[13px] text-[var(--text-2)]">拖拽文件到此处，或点击选择</div>
          <div className="mt-1 text-[11px] text-[var(--text-3)]">支持 MOV / MXF / MP4 / WAV，单文件 ≤ 500 GB</div>
        </div>
        {uploading && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[12px] text-[var(--text-2)]">
              <span>XC25_宣传片_Master_HDR_50p_v6.mov</span>
              <span className="mono">{progress}%</span>
            </div>
            <Progress value={progress} />
            <div className="mt-2 text-[11px] text-[var(--text-3)]">
              {progress < 100 ? '上传中，完成后将自动执行探针…' : '上传完成，已生成探针信息'}
            </div>
          </div>
        )}
        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-3 text-[11px] leading-5 text-[var(--text-3)]">
          上传后系统会自动解析容器、编码、帧率、声道与积分响度，并按项目默认规范给出检测建议。
        </div>
      </Modal>
    </div>
  )
}
