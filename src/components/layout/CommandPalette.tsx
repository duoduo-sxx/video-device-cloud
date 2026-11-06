import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, FileText, Film, ScanSearch, Search, Wrench } from 'lucide-react'
import { db } from '../../mock/db'
import { useUI } from '../../store/ui'
import { cn } from '../../lib/cn'

const PAGES = [
  { label: '工作台', to: '/', hint: '总览与待办' },
  { label: '媒体资产库', to: '/media', hint: '素材与探针信息' },
  { label: '检测中心', to: '/detection', hint: '质检任务' },
  { label: '新建检测', to: '/detection/new', hint: '3 步向导' },
  { label: '修复中心', to: '/repair', hint: '方案与执行' },
  { label: '对比与验收', to: '/review/rt4', hint: 'A/B 视听对比' },
  { label: '报告中心', to: '/reports', hint: '质检与交付报告' },
  { label: '技术服务', to: '/service', hint: '服务包与报价' },
  { label: '工单看板', to: '/service/orders', hint: '委托项目进度' },
  { label: '规则与算法', to: '/rules', hint: '阈值与能力矩阵' },
  { label: '知识库', to: '/knowledge', hint: '案例与缺陷百科' },
  { label: '算力调度', to: '/compute', hint: '节点与队列' },
  { label: '设置', to: '/settings', hint: '组织与权限' },
]

export function CommandPalette() {
  const { setCommandOpen } = useUI()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase()
    const match = (s: string) => !kw || s.toLowerCase().includes(kw)
    const pages = PAGES.filter((p) => match(p.label) || match(p.hint)).map((p) => ({
      key: `p-${p.to}`,
      group: '页面',
      title: p.label,
      sub: p.hint,
      to: p.to,
      icon: <ArrowRight size={13} />,
    }))
    const assets = db.assets
      .filter((a) => match(a.name) || match(a.fileName) || match(a.code))
      .slice(0, 5)
      .map((a) => ({
        key: a.id,
        group: '素材',
        title: a.name,
        sub: `${a.code} · ${a.projectName}`,
        to: `/media/${a.id}`,
        icon: <Film size={13} />,
      }))
    const tasks = db.tasks
      .filter((t) => match(t.assetName) || match(t.code))
      .slice(0, 4)
      .map((t) => ({
        key: t.id,
        group: '检测任务',
        title: `${t.code} · ${t.assetName}`,
        sub: `${t.ruleSetName} · 评分 ${t.score}`,
        to: `/detection/${t.id}`,
        icon: <ScanSearch size={13} />,
      }))
    const repairs = db.repairs
      .filter((r) => match(r.assetName) || match(r.code))
      .slice(0, 3)
      .map((r) => ({
        key: r.id,
        group: '修复任务',
        title: `${r.code} · ${r.assetName}`,
        sub: `${r.status} · ${r.progress}%`,
        to: `/repair/${r.id}`,
        icon: <Wrench size={13} />,
      }))
    const reports = db.reports
      .filter((r) => match(r.title) || match(r.no))
      .slice(0, 3)
      .map((r) => ({
        key: r.id,
        group: '报告',
        title: r.title,
        sub: `${r.no} · ${r.grade} 级`,
        to: `/reports/${r.id}`,
        icon: <FileText size={13} />,
      }))
    return [...pages, ...assets, ...tasks, ...repairs, ...reports]
  }, [q])

  useEffect(() => {
    setActive(0)
  }, [q])

  const go = (to: string) => {
    setCommandOpen(false)
    navigate(to)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-6 pt-[12vh]" style={{ background: 'rgba(3,6,10,.72)' }} onClick={() => setCommandOpen(false)}>
      <div
        className="anim-in w-full max-w-[640px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-1)] shadow-layer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4">
          <Search size={15} className="text-[var(--text-3)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(results.length - 1, a + 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(0, a - 1))
              }
              if (e.key === 'Enter' && results[active]) go(results[active].to)
            }}
            placeholder="搜索页面、素材、任务、报告…"
            className="h-12 flex-1 bg-transparent text-[14px] text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)]"
          />
          <span className="mono rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-3)]">ESC</span>
        </div>
        <div className="max-h-[52vh] overflow-y-auto py-1.5">
          {results.length === 0 && <div className="px-4 py-8 text-center text-[12px] text-[var(--text-3)]">没有匹配结果</div>}
          {results.map((r, i) => (
            <button
              key={r.key}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r.to)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2 text-left',
                i === active ? 'bg-[var(--bg-3)]' : 'hover:bg-[var(--bg-2)]',
              )}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded border border-[var(--border)] text-[var(--text-3)]">{r.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-[var(--text-1)]">{r.title}</span>
                <span className="block truncate text-[11px] text-[var(--text-3)]">{r.sub}</span>
              </span>
              <span className="shrink-0 text-[10px] text-[var(--text-3)]">{r.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
