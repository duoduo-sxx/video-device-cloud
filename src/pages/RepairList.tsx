import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Columns2, Wrench } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Button, Card, Progress, Select } from '../components/ui'
import { EmptyState, PageHeader, StatusPill, TableSkeleton, Thumb } from '../components/common'
import { REPAIR_STATUS_META } from '../lib/constants'
import { dateTime } from '../lib/format'
import { MEMBER_MAP } from '../mock/build'

export default function RepairList() {
  const { data, loading } = useAsync(() => api.listRepairs(), [])
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')

  const repairs = data ?? []
  const filtered = repairs.filter((r) =>
    tab === 'all'
      ? true
      : tab === 'running'
        ? ['running', 'rechecking', 'pending'].includes(r.status)
        : tab === 'review'
          ? r.status === 'review'
          : tab === 'passed'
            ? r.status === 'passed'
            : r.status === 'rejected' || r.status === 'failed',
  )

  const running = repairs.filter((r) => ['running', 'rechecking'].includes(r.status)).length
  const review = repairs.filter((r) => r.status === 'review').length
  const passed = repairs.filter((r) => r.status === 'passed')
  const avgRate = passed.length
    ? passed.reduce((s, r) => s + r.defectFixed / Math.max(1, r.defectTotal), 0) / passed.length
    : 0

  return (
    <div>
      <PageHeader
        title="修复中心"
        desc="按缺陷生成算法链，分片并行执行，完成后自动复检。"
        actions={<Button variant="primary" onClick={() => navigate('/repair/rt1')}><Wrench size={14} /> 新建修复</Button>}
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { label: '执行中', value: running, unit: '个' },
          { label: '待验收', value: review, unit: '个' },
          { label: '平均修复率', value: (avgRate * 100).toFixed(1), unit: '%' },
          { label: '累计修复缺陷', value: repairs.reduce((s, r) => s + r.defectFixed, 0), unit: '条' },
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
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5">
          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: '全部' },
              { key: 'running', label: '进行中' },
              { key: 'review', label: '待验收' },
              { key: 'passed', label: '已通过' },
              { key: 'failed', label: '异常' },
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
          <Select className="ml-auto h-8 w-[150px]" defaultValue="all">
            <option value="all">全部方案模板</option>
            <option value="conservative">保守</option>
            <option value="standard">标准</option>
            <option value="aggressive">激进</option>
          </Select>
        </div>

        {loading ? (
          <TableSkeleton rows={7} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Wrench size={20} />} title="没有符合条件的修复任务" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                <th className="px-4 py-2.5 text-left font-normal">任务 / 素材</th>
                <th className="px-3 py-2.5 text-left font-normal">方案</th>
                <th className="px-3 py-2.5 text-left font-normal">缺陷（原始 / 已修 / 残留）</th>
                <th className="px-3 py-2.5 text-left font-normal">状态</th>
                <th className="px-3 py-2.5 text-left font-normal">评分变化</th>
                <th className="px-3 py-2.5 text-left font-normal">节点 / 执行人</th>
                <th className="px-4 py-2.5 text-right font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const meta = REPAIR_STATUS_META[r.status]
                return (
                  <tr key={r.id} className="row-hover border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-14 shrink-0">
                          <Thumb seed={r.id.length * 29 + r.progress} />
                        </div>
                        <div className="min-w-0">
                          <Link to={`/repair/${r.id}`} className="block truncate text-[13px] text-[var(--text-1)] hover:text-[var(--primary)]">
                            {r.assetName}
                          </Link>
                          <div className="mono truncate text-[11px] text-[var(--text-3)]">{r.code} · {r.version}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-[var(--text-2)]">
                      {r.planId ? dbPlanTemplate(r.planId) : '—'}
                      <div className="text-[11px] text-[var(--text-3)]">{r.status === 'running' ? `${r.progress}%` : r.finishedAt ? dateTime(r.finishedAt) : ''}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="mono text-[12px] text-[var(--text-2)]">{r.defectTotal}</span>
                        <span className="text-[var(--text-3)]">/</span>
                        <span className="mono text-[12px] text-[var(--success)]">{r.defectFixed}</span>
                        <span className="text-[var(--text-3)]">/</span>
                        <span className="mono text-[12px]" style={{ color: r.defectResidual > 0 ? 'var(--danger)' : 'var(--text-3)' }}>{r.defectResidual}</span>
                      </div>
                      <Progress value={(r.defectFixed / Math.max(1, r.defectTotal)) * 100} height={3} className="mt-1.5 w-[120px]" />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill label={meta.label} color={meta.color} bg={meta.bg} />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="mono text-[12px] text-[var(--text-3)]">{r.scoreBefore}</span>
                      <span className="mx-1 text-[var(--text-3)]">→</span>
                      <span className="mono text-[12px] text-[var(--success)]">{r.scoreAfter}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[12px] text-[var(--text-2)]">{MEMBER_MAP[r.operatorId]?.name}</div>
                      <div className="mono text-[11px] text-[var(--text-3)]">{r.nodeId.toUpperCase()}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link to={`/repair/${r.id}`} className="text-[12px] text-[var(--primary)] hover:underline">方案</Link>
                        <Link to={`/review/${r.id}`} className="flex items-center gap-1 text-[12px] text-[var(--text-2)] hover:text-[var(--text-1)]">
                          <Columns2 size={12} /> 对比
                        </Link>
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
  )
}

export function dbPlanTemplate(planId: string): string {
  const templates: Record<string, string> = {
    rp1: '标准', rp2: '保守', rp3: '激进', rp4: '标准', rp5: '保守', rp6: '激进', rp7: '标准',
    rp8: '保守', rp9: '激进', rp10: '标准', rp11: '保守', rp12: '激进', rp13: '标准', rp14: '保守',
  }
  return templates[planId] ?? '标准'
}
