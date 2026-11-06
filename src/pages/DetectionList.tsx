import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ScanSearch } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Button, Card, Input, Select } from '../components/ui'
import { EmptyState, PageHeader, ScoreRing, Skeleton, StatusPill, TableSkeleton, Thumb } from '../components/common'
import { TASK_STATUS_META } from '../lib/constants'
import { dateTime, duration } from '../lib/format'
import { MEMBER_MAP } from '../mock/build'

export default function DetectionList() {
  const { data, loading } = useAsync(() => api.listTasks(), [])
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')

  const tasks = data ?? []
  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        const inTab =
          tab === 'all' ||
          (tab === 'running' && ['queued', 'probing', 'detecting', 'aggregating'].includes(t.status)) ||
          (tab === 'done' && t.status === 'done') ||
          (tab === 'failed' && t.status === 'failed')
        const inQ = !q || t.assetName.includes(q) || t.code.includes(q)
        return inTab && inQ
      }),
    [tasks, tab, q],
  )

  const stats = useMemo(() => {
    const running = tasks.filter((t) => ['queued', 'probing', 'detecting', 'aggregating'].includes(t.status)).length
    const done = tasks.filter((t) => t.status === 'done')
    const avg = done.reduce((s, t) => s + t.score, 0) / Math.max(1, done.length)
    const defects = tasks.reduce((s, t) => s + t.counts.fatal + t.counts.severe + t.counts.moderate + t.counts.info, 0)
    return { running, done: done.length, avg, defects }
  }, [tasks])

  return (
    <div>
      <PageHeader
        title="检测中心"
        desc="按规则集执行全片逐帧 / 逐采样检测，输出缺陷明细与质检评分。"
        actions={
          <Button variant="primary" onClick={() => navigate('/detection/new')}>
            <Plus size={14} /> 新建检测
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { label: '进行中任务', value: stats.running, unit: '个' },
          { label: '今日完成', value: stats.done, unit: '个' },
          { label: '平均评分', value: stats.avg.toFixed(1), unit: '分' },
          { label: '累计检出缺陷', value: stats.defects, unit: '条' },
        ].map((s) => (
          <Card key={s.label} className="px-4 py-3">
            <div className="text-[11px] text-[var(--text-3)]">{s.label}</div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="mono text-[22px] font-medium leading-none">{s.value}</span>
              <span className="text-[11px] text-[var(--text-3)]">{s.unit}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-2.5">
          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: '全部' },
              { key: 'running', label: '运行中' },
              { key: 'done', label: '已完成' },
              { key: 'failed', label: '失败' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  tab === t.key
                    ? 'rounded-md bg-[var(--bg-3)] px-2.5 py-1 text-[12px] text-[var(--text-1)]'
                    : 'rounded-md px-2.5 py-1 text-[12px] text-[var(--text-3)] hover:text-[var(--text-2)]'
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索任务号或素材" className="h-8 w-[220px]" />
            <Select className="h-8 w-[150px]" defaultValue="all">
              <option value="all">全部规则集</option>
              <option value="rs1">广电播出标准</option>
              <option value="rs2">流媒体上线</option>
              <option value="rs3">影院 DCP</option>
              <option value="rs4">教育课程</option>
            </Select>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ScanSearch size={20} />} title="没有符合条件的检测任务" desc="调整筛选条件，或新建一次检测" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                <th className="px-4 py-2.5 text-left font-normal">任务 / 素材</th>
                <th className="px-3 py-2.5 text-left font-normal">规则集</th>
                <th className="px-3 py-2.5 text-left font-normal">状态</th>
                <th className="px-3 py-2.5 text-left font-normal">评分</th>
                <th className="px-3 py-2.5 text-left font-normal">缺陷分布</th>
                <th className="px-3 py-2.5 text-left font-normal">操作人</th>
                <th className="px-3 py-2.5 text-left font-normal">耗时</th>
                <th className="px-4 py-2.5 text-right font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const meta = TASK_STATUS_META[t.status]
                const total = t.counts.fatal + t.counts.severe + t.counts.moderate + t.counts.info
                return (
                  <tr key={t.id} className="row-hover border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-14 shrink-0">
                          <Thumb seed={t.id.length * 41 + t.score} label={duration(t.durationSec).slice(0, 5)} />
                        </div>
                        <div className="min-w-0">
                          <Link to={`/detection/${t.id}`} className="block truncate text-[13px] text-[var(--text-1)] hover:text-[var(--primary)]">
                            {t.assetName}
                          </Link>
                          <div className="mono truncate text-[11px] text-[var(--text-3)]">{t.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[12px] text-[var(--text-2)]">{t.ruleSetName}</div>
                      <div className="text-[11px] text-[var(--text-3)]">
                        {t.priority === 'urgent' ? '加急' : t.priority === 'high' ? '高优先' : '普通'}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill label={meta.label} color={meta.color} bg={meta.bg} />
                      {t.status !== 'done' && t.status !== 'failed' && t.status !== 'queued' && (
                        <div className="mono mt-1 text-[10px] text-[var(--text-3)]">{t.progress}%</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {t.status === 'done' ? (
                        <div className="flex items-center gap-2">
                          <ScoreRing score={t.score} grade={t.grade} size={36} stroke={3} />
                          <span className="text-[11px] text-[var(--text-3)]">{t.grade} 级</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[var(--text-3)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {t.counts.fatal > 0 && <span className="mono rounded bg-[rgba(248,113,113,.12)] px-1 text-[11px] text-[#F87171]">{t.counts.fatal}</span>}
                        {t.counts.severe > 0 && <span className="mono rounded bg-[rgba(251,146,60,.12)] px-1 text-[11px] text-[#FB923C]">{t.counts.severe}</span>}
                        {t.counts.moderate > 0 && <span className="mono rounded bg-[rgba(251,191,36,.12)] px-1 text-[11px] text-[#FBBF24]">{t.counts.moderate}</span>}
                        <span className="mono text-[11px] text-[var(--text-3)]">共 {total}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-[var(--text-2)]">{MEMBER_MAP[t.operatorId]?.name}</td>
                    <td className="mono px-3 py-2.5 text-[11px] text-[var(--text-3)]">
                      {t.finishedAt ? `${Math.round((new Date(t.finishedAt).getTime() - new Date(t.startedAt).getTime()) / 60000)} min` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link to={`/detection/${t.id}`} className="text-[12px] text-[var(--primary)] hover:underline">
                        {t.status === 'done' ? '查看结果' : '查看进度'}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
      <div className="mt-2 text-[11px] text-[var(--text-3)]">
        最近一次任务创建于 {dateTime(tasks[0]?.startedAt ?? '2026-10-19T00:00:00+08:00')}
      </div>
    </div>
  )
}
