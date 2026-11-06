import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, FileCheck2, FileText, Filter, Plus, Printer, Search } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Button, Card, CardHeader, Input, Select, Tabs } from '../components/ui'
import { EmptyState, KpiCard, PageHeader, ScoreRing, TableSkeleton } from '../components/common'
import { GRADE_META } from '../lib/constants'
import { dateOnly } from '../lib/format'
import type { QcReport } from '../types'

const TYPE_META: Record<QcReport['type'], { label: string; color: string; bg: string }> = {
  qc: { label: '检测报告', color: '#22D3EE', bg: 'rgba(34,211,238,.12)' },
  repair: { label: '修复报告', color: '#A78BFA', bg: 'rgba(167,139,250,.12)' },
  acceptance: { label: '验收单', color: '#34D399', bg: 'rgba(52,211,153,.12)' },
  service: { label: '服务报告', color: '#FBBF24', bg: 'rgba(251,191,36,.12)' },
}

const STATUS_META: Record<QcReport['status'], { label: string; color: string }> = {
  draft: { label: '草稿', color: '#A7B4C4' },
  issued: { label: '已出具', color: '#22D3EE' },
  signed: { label: '已签署', color: '#34D399' },
}

export default function Reports() {
  const navigate = useNavigate()
  const { data, loading } = useAsync(() => api.listReports(), [])
  const [tab, setTab] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('all')

  const reports = data ?? []

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (tab === 'issued' && r.status === 'draft') return false
      if (tab === 'signed' && r.status !== 'signed') return false
      if (tab === 'draft' && r.status !== 'draft') return false
      if (type !== 'all' && r.type !== type) return false
      if (keyword) {
        const k = keyword.toLowerCase()
        return (
          r.no.toLowerCase().includes(k) ||
          r.assetName.toLowerCase().includes(k) ||
          r.projectName.toLowerCase().includes(k) ||
          r.issuedBy.includes(keyword)
        )
      }
      return true
    })
  }, [reports, tab, type, keyword])

  const stats = useMemo(() => {
    const signed = reports.filter((r) => r.status === 'signed').length
    const pending = reports.filter((r) => r.status !== 'signed').length
    const gradeA = reports.filter((r) => r.grade === 'A').length
    const avgPages = reports.length ? reports.reduce((s, r) => s + r.pages, 0) / reports.length : 0
    return { signed, pending, gradeA, avgPages }
  }, [reports])

  return (
    <div>
      <PageHeader
        title="报告中心"
        desc="检测、修复、验收与服务报告统一归档。报告字段与任务数据同源，评分不可手工修改。"
        actions={
          <>
            <Button>
              <Printer size={14} /> 批量打印
            </Button>
            <Button variant="primary" onClick={() => navigate('/detection/new')}>
              <Plus size={14} /> 新建检测并出报告
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        <KpiCard label="报告总数" value={String(reports.length)} unit="份" hint="近 90 天" values={[4, 6, 5, 8, 9, 7, 12]} />
        <KpiCard label="已签署" value={String(stats.signed)} unit="份" hint={`待签发 ${stats.pending} 份`} values={[1, 2, 3, 4, 4, 6, 8]} color="#34D399" />
        <KpiCard label="A 级占比" value={`${((stats.gradeA / Math.max(1, reports.length)) * 100).toFixed(0)}%`} hint="评分 ≥ 90" values={[20, 25, 30, 28, 33, 35, 41]} color="#A78BFA" />
        <KpiCard label="平均页数" value={stats.avgPages.toFixed(1)} unit="页" hint="含缺陷明细附表" values={[4, 5, 5, 6, 6, 5, 6]} color="#FBBF24" />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-9">
          <Card>
            <div className="flex items-center justify-between gap-3 px-5 pt-4">
              <Tabs
                value={tab}
                onChange={setTab}
                items={[
                  { key: 'all', label: '全部', count: reports.length },
                  { key: 'issued', label: '已出具', count: reports.filter((r) => r.status !== 'draft').length },
                  { key: 'signed', label: '已签署', count: stats.signed },
                  { key: 'draft', label: '草稿', count: reports.filter((r) => r.status === 'draft').length },
                ]}
                className="flex-1"
              />
            </div>

            <div className="flex items-center gap-2 px-5 py-3">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索报告编号、素材、项目或出具人"
                  className="pl-8"
                />
              </div>
              <div className="w-[150px]">
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="all">全部类型</option>
                  <option value="qc">检测报告</option>
                  <option value="repair">修复报告</option>
                  <option value="acceptance">验收单</option>
                  <option value="service">服务报告</option>
                </Select>
              </div>
              <Button variant="ghost" size="md">
                <Filter size={13} /> 高级筛选
              </Button>
            </div>

            {loading ? (
              <TableSkeleton rows={7} cols={6} />
            ) : filtered.length === 0 ? (
              <EmptyState icon={<FileText size={18} />} title="没有符合条件的报告" desc="调整筛选条件，或从检测任务生成新报告" />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-y border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                    <th className="px-5 py-2 text-left font-normal">报告编号</th>
                    <th className="px-2 py-2 text-left font-normal">类型</th>
                    <th className="px-2 py-2 text-left font-normal">标题 / 素材</th>
                    <th className="px-2 py-2 text-left font-normal">评分</th>
                    <th className="px-2 py-2 text-left font-normal">状态</th>
                    <th className="px-2 py-2 text-left font-normal">出具</th>
                    <th className="px-5 py-2 text-right font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const t = TYPE_META[r.type]
                    const s = STATUS_META[r.status]
                    return (
                      <tr key={r.id} className="group border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-2)]">
                        <td className="px-5 py-2.5">
                          <Link to={`/reports/${r.id}`} className="mono text-[12px] text-[var(--text-1)] hover:text-[var(--primary)]">
                            {r.no}
                          </Link>
                          <div className="mono text-[10px] text-[var(--text-3)]">{r.pages} 页</div>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="rounded px-1.5 py-0.5 text-[11px]" style={{ color: t.color, background: t.bg }}>
                            {t.label}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="max-w-[240px] truncate text-[12px] text-[var(--text-1)]">{r.title}</div>
                          <div className="max-w-[240px] truncate text-[11px] text-[var(--text-3)]">
                            {r.projectName} · {r.assetName}
                          </div>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            <ScoreRing score={r.score} grade={r.grade} size={34} stroke={3} showGrade={false} />
                            <span className="text-[11px]" style={{ color: GRADE_META[r.grade].color }}>
                              {r.grade} · {GRADE_META[r.grade].label}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: s.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="text-[12px] text-[var(--text-2)]">{r.issuedBy}</div>
                          <div className="mono text-[10px] text-[var(--text-3)]">{dateOnly(r.issuedAt)}</div>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/reports/${r.id}`)}>
                              查看
                            </Button>
                            <Button size="sm" variant="ghost" title="导出 PDF（打印）">
                              <Download size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="col-span-3 space-y-3">
          <Card>
            <CardHeader title="报告模板" desc="统一排版，可直接打印归档" />
            <div className="space-y-2 px-4 pb-4">
              {[
                { name: '技术质量检测报告', pages: '5–7 页', desc: '指标总览 + 缺陷明细 + 结论' },
                { name: '修复验收报告', pages: '6–8 页', desc: '修复前后指标对比 + 残留说明' },
                { name: '交付验收单', pages: '2 页', desc: '签署页 + 交付物清单' },
                { name: '技术服务交付报告', pages: '4 页', desc: '服务过程 + SLA 达成情况' },
              ].map((t) => (
                <div key={t.name} className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--text-1)]">{t.name}</span>
                    <span className="mono text-[10px] text-[var(--text-3)]">{t.pages}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--text-3)]">{t.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="签署链路" desc="谁签的、什么时候签的都可追溯" />
            <div className="px-4 pb-4">
              <ol className="relative ml-1 space-y-3 border-l border-[var(--border)] pl-4">
                {[
                  { label: '质检员出具', desc: '系统按模板生成初稿', done: true },
                  { label: '质检主管复核', desc: '确认缺陷定级与结论', done: true },
                  { label: '技术负责人签发', desc: '加盖电子签章后生效', done: false },
                  { label: '归档 / 交付客户', desc: '同步至客户工单附件', done: false },
                ].map((s, i) => (
                  <li key={s.label} className="relative">
                    <span
                      className="absolute -left-[21px] top-1 h-2 w-2 rounded-full"
                      style={{ background: s.done ? 'var(--primary)' : 'var(--bg-3)', border: '1px solid var(--border-str)' }}
                    />
                    <div className={`text-[12px] ${s.done ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]'}`}>{s.label}</div>
                    <div className="text-[11px] text-[var(--text-3)]">{s.desc}</div>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-2.5 py-2 text-[11px] text-[var(--text-3)]">
                <FileCheck2 size={13} className="text-[var(--success)]" />
                电子签章：AVRS-CA · 有效期至 2027-06-30
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
