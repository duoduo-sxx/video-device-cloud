import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, CircleAlert, Clock, Play, Plus, Upload } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Button, Card, CardHeader, Progress } from '../components/ui'
import {
  EmptyState,
  KpiCard,
  PageHeader,
  ScoreRing,
  Skeleton,
  SlaBar,
  StackedBars,
  StatusPill,
  TrendChart,
  Thumb,
} from '../components/common'
import { CHANNEL_META, TASK_STATUS_META } from '../lib/constants'
import { durationCn, fromNow, timecode } from '../lib/format'
import { MEMBER_MAP } from '../mock/build'

export default function Dashboard() {
  const { data, loading } = useAsync(() => api.getDashboard(), [])
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="工作台"
        desc="今日质检与修复进展总览，数据每 30 秒刷新。"
        actions={
          <>
            <Button onClick={() => navigate('/detection/new')}>
              <Upload size={14} /> 上传素材
            </Button>
            <Button variant="primary" onClick={() => navigate('/detection/new')}>
              <Plus size={14} /> 新建检测
            </Button>
          </>
        }
      />

      {loading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[116px]" />
            ))}
          </div>
          <Skeleton className="h-[260px]" />
          <Skeleton className="h-[220px]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              label="今日检测时长"
              value={durationCn(data.kpi.todayDuration).replace(' 小时 ', 'h ').replace(' 分', 'm')}
              delta={18.2}
              hint="较昨日"
              values={[12, 18, 9, 24, 20, 31, data.kpi.todayDuration / 900]}
            />
            <KpiCard
              label="今日检出缺陷"
              value={String(data.kpi.todayDefects)}
              unit="条"
              delta={6.4}
              hint="其中致命 3 条"
              color="var(--accent)"
              values={[8, 14, 11, 21, 18, 26, data.kpi.todayDefects]}
            />
            <KpiCard
              label="修复通过率"
              value={`${(data.kpi.successRate * 100).toFixed(1)}`}
              unit="%"
              delta={3.1}
              hint="近 30 天复检口径"
              color="var(--success)"
              values={[72, 76, 74, 81, 79, 85, data.kpi.successRate * 100]}
            />
            <KpiCard
              label="待验收任务"
              value={String(data.kpi.pendingReview)}
              unit="个"
              delta={-2}
              hint="平均修复 42.6 分钟"
              color="var(--purple)"
              values={[6, 5, 7, 4, 6, 5, data.kpi.pendingReview]}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader
                title="任务趋势"
                desc="近 30 天检测与修复任务量"
                right={
                  <div className="flex items-center gap-1 text-[11px] text-[var(--text-3)]">
                    <span className="rounded bg-[var(--bg-3)] px-1.5 py-0.5 text-[var(--text-2)]">30 天</span>
                    <span className="px-1.5 py-0.5">7 天</span>
                    <span className="px-1.5 py-0.5">90 天</span>
                  </div>
                }
              />
              <div className="px-3 pb-4">
                <TrendChart data={data.trend} />
              </div>
            </Card>

            <Card>
              <CardHeader title="缺陷通道分布" desc="按严重度堆叠，累计 28 类缺陷" />
              <div className="px-5 pb-5">
                <StackedBars
                  data={data.channelDist.map((c) => ({
                    channel: CHANNEL_META[c.channel].label,
                    fatal: c.fatal,
                    severe: c.severe,
                    moderate: c.moderate,
                    info: c.info,
                  }))}
                />
              </div>
            </Card>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader
                title="运行中的任务"
                desc={`${data.running.length} 个任务占用 4 个节点`}
                right={
                  <Link to="/detection" className="flex items-center gap-1 text-[12px] text-[var(--primary)] hover:underline">
                    全部任务 <ChevronRight size={12} />
                  </Link>
                }
              />
              <div className="divide-y divide-[var(--border)]">
                {data.running.length === 0 && <EmptyState title="当前无运行任务" desc="所有队列已清空" />}
                {data.running.map((t) => {
                  const meta = TASK_STATUS_META[t.status]
                  return (
                    <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="h-9 w-14 shrink-0">
                        <Thumb seed={t.id.length * 37} label={timecode(t.durationSec).slice(0, 5)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link to={`/detection/${t.id}`} className="truncate text-[13px] text-[var(--text-1)] hover:text-[var(--primary)]">
                            {t.assetName}
                          </Link>
                          <StatusPill label={meta.label} color={meta.color} bg={meta.bg} />
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--text-3)]">
                          <span className="mono">{t.code}</span>
                          <span>·</span>
                          <span>{t.ruleSetName}</span>
                          <span>·</span>
                          <span>{MEMBER_MAP[t.operatorId]?.name}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Progress value={t.progress} height={4} />
                          <span className="mono w-9 shrink-0 text-right text-[11px] text-[var(--text-2)]">{t.progress}%</span>
                        </div>
                      </div>
                      <div className="w-[120px] shrink-0 text-right text-[11px] text-[var(--text-3)]">
                        <div className="mono">{t.nodeId.toUpperCase()}</div>
                        <div className="mt-0.5">{t.etaSec ? `ETA ${Math.round(t.etaSec / 60)} min` : '计算中'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader title="我的待办" desc="按角色过滤" />
                <div className="px-3 pb-3">
                  {data.todos.map((t) => (
                    <Link
                      key={t.key}
                      to={t.link}
                      className="row-hover flex items-center justify-between rounded-lg px-2 py-2"
                    >
                      <span className="flex items-center gap-2 text-[13px] text-[var(--text-2)]">
                        {t.count > 0 && t.key === 'recheck' ? (
                          <CircleAlert size={13} className="text-[var(--danger)]" />
                        ) : (
                          <Clock size={13} className="text-[var(--text-3)]" />
                        )}
                        {t.label}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="mono text-[13px]" style={{ color: t.count > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>
                          {t.count}
                        </span>
                        <ChevronRight size={12} className="text-[var(--text-3)]" />
                      </span>
                    </Link>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader title="算力水位" desc="GPU / CPU 综合利用率" right={<Link to="/compute" className="text-[12px] text-[var(--primary)]">查看</Link>} />
                <div className="space-y-2.5 px-5 pb-5">
                  {data.nodes.slice(0, 4).map((n) => (
                    <div key={n.id} className="flex items-center gap-3">
                      <span className="mono w-[92px] shrink-0 truncate text-[11px] text-[var(--text-3)]">{n.name.split(' · ')[0]}</span>
                      <Progress value={n.gpuUtil} height={4} color={n.gpuUtil > 85 ? 'var(--accent)' : 'var(--primary)'} />
                      <span className="mono w-8 text-right text-[11px] text-[var(--text-2)]">{n.gpuUtil}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <Card className="mt-4">
            <CardHeader
              title="最近检测任务"
              desc="按开始时间排序"
              right={
                <Link to="/detection" className="flex items-center gap-1 text-[12px] text-[var(--primary)] hover:underline">
                  查看全部 <ArrowUpRight size={12} />
                </Link>
              }
            />
            <table className="w-full">
              <thead>
                <tr className="border-y border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                  <th className="px-5 py-2 text-left font-normal">素材</th>
                  <th className="px-3 py-2 text-left font-normal">规则集</th>
                  <th className="px-3 py-2 text-left font-normal">状态</th>
                  <th className="px-3 py-2 text-left font-normal">评分</th>
                  <th className="px-3 py-2 text-left font-normal">缺陷</th>
                  <th className="px-3 py-2 text-left font-normal">操作人</th>
                  <th className="px-5 py-2 text-right font-normal">开始时间</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTasks.map((t) => {
                  const meta = TASK_STATUS_META[t.status]
                  const total = t.counts.fatal + t.counts.severe + t.counts.moderate + t.counts.info
                  return (
                    <tr
                      key={t.id}
                      className="row-hover cursor-pointer border-b border-[var(--border)] last:border-0"
                      onClick={() => navigate(`/detection/${t.id}`)}
                    >
                      <td className="px-5 py-2.5">
                        <div className="text-[13px] text-[var(--text-1)]">{t.assetName}</div>
                        <div className="mono text-[11px] text-[var(--text-3)]">{t.code}</div>
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-[var(--text-2)]">{t.ruleSetName}</td>
                      <td className="px-3 py-2.5">
                        <StatusPill label={meta.label} color={meta.color} bg={meta.bg} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <ScoreRing score={t.score} grade={t.grade} size={34} stroke={3} />
                          <span className="text-[11px] text-[var(--text-3)]">{t.grade} 级</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="mono text-[12px] text-[var(--text-2)]">{total}</span>
                        <span className="ml-1.5 text-[11px] text-[var(--danger)]">{t.counts.fatal > 0 ? `致命 ${t.counts.fatal}` : ''}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-[var(--text-2)]">{MEMBER_MAP[t.operatorId]?.name}</td>
                      <td className="px-5 py-2.5 text-right text-[11px] text-[var(--text-3)]">{fromNow(t.startedAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader title="交付 SLA 概览" desc="进行中工单的剩余时间" right={<Link to="/service/orders" className="text-[12px] text-[var(--primary)]">工单看板</Link>} />
              <div className="space-y-3 px-5 pb-5">
                {[
                  { name: 'SO-2026-0086 · 25 周年宣传片 HDR 与画面修复', created: '2026-10-16T12:00:00+08:00', sla: 48 },
                  { name: 'SO-2026-0087 · 专题片历史素材批量转码', created: '2026-10-19T09:05:00+08:00', sla: 48 },
                  { name: 'SO-2026-0083 · 晚间新闻 0925 期 响度整改', created: '2026-10-18T09:00:00+08:00', sla: 24 },
                ].map((o) => (
                  <div key={o.name}>
                    <div className="mb-1 flex items-center justify-between text-[12px] text-[var(--text-2)]">
                      <span className="truncate">{o.name}</span>
                    </div>
                    <SlaBar createdAt={o.created} slaHours={o.sla} />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="快捷入口" />
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                {[
                  { label: '新建检测', to: '/detection/new' },
                  { label: '提交工单', to: '/service' },
                  { label: '规则库', to: '/rules' },
                  { label: '缺陷百科', to: '/knowledge' },
                ].map((q) => (
                  <Link
                    key={q.to}
                    to={q.to}
                    className="flex h-[54px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-2)] text-[12px] text-[var(--text-2)] hover:border-[var(--border-str)] hover:text-[var(--text-1)]"
                  >
                    {q.label}
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
