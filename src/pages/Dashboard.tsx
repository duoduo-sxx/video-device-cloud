import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Film,
  Clock,
  ListChecks,
  Timer,
  ShieldAlert,
  Search,
  Upload,
  Sparkles,
  ArrowRight,
  Scissors,
  Megaphone,
} from 'lucide-react'
import { fetchDashboard, fetchTasks } from '../services'
import type { AnalysisTask } from '../types'
import {
  Badge,
  Button,
  Card,
  MetricCard,
  PageHeader,
  Progress,
  SectionTitle,
  Skeleton,
  StatusBadge,
} from '../components/ui'
import { Chart, PALETTE, axisBase, tooltipBase, useChartTheme } from '../components/Chart'
import { formatDuration, formatNumber, relativeTime } from '../lib/utils'

type Dash = Awaited<ReturnType<typeof fetchDashboard>>

export default function Dashboard() {
  const [data, setData] = useState<Dash | null>(null)
  const [tasks, setTasks] = useState<AnalysisTask[]>([])
  const t = useChartTheme()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboard().then(setData)
    fetchTasks().then((list) => setTasks(list.slice(0, 5)))
  }, [])

  const trendOpt = useMemo(() => {
    if (!data) return {}
    return {
      grid: { left: 42, right: 42, top: 24, bottom: 28 },
      tooltip: { trigger: 'axis', ...tooltipBase(t) },
      legend: {
        right: 0,
        top: 0,
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: t.text, fontSize: 11 },
        data: ['解析任务数', '解析时长(小时)'],
      },
      xAxis: {
        type: 'category',
        data: data.trend.map((d) => d.date),
        boundaryGap: false,
        ...axisBase(t),
        splitLine: { show: false },
        axisLabel: { color: t.sub, fontSize: 10, interval: 4 },
      },
      yAxis: [
        { type: 'value', ...axisBase(t) },
        { type: 'value', ...axisBase(t), splitLine: { show: false } },
      ],
      series: [
        {
          name: '解析任务数',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: data.trend.map((d) => d.tasks),
          lineStyle: { color: '#2563EB', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37,99,235,.22)' },
                { offset: 1, color: 'rgba(37,99,235,0)' },
              ],
            },
          },
        },
        {
          name: '解析时长(小时)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'none',
          data: data.trend.map((d) => d.hours),
          lineStyle: { color: '#7C3AED', width: 1.5, type: 'dashed' },
        },
      ],
    }
  }, [data, t])

  const pieOpt = useMemo(() => {
    if (!data) return {}
    return {
      tooltip: { trigger: 'item', ...tooltipBase(t) },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 9,
        textStyle: { color: t.text, fontSize: 11 },
        formatter: (name: string) => name,
      },
      series: [
        {
          type: 'pie',
          radius: ['52%', '74%'],
          center: ['36%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: t.surface, borderWidth: 2 },
          label: {
            show: true,
            position: 'center',
            formatter: `{c|${data.totalVideos}}\n{d|视频总数}`,
            rich: {
              c: { fontSize: 24, fontWeight: 500, color: t.strong, lineHeight: 30 },
              d: { fontSize: 10, color: t.sub, lineHeight: 16 },
            },
          },
          labelLine: { show: false },
          data: data.categories,
          color: PALETTE,
        },
      ],
    }
  }, [data, t])

  const tagOpt = useMemo(() => {
    if (!data) return {}
    const tags = [...data.topTags].reverse()
    return {
      grid: { left: 76, right: 30, top: 6, bottom: 6 },
      tooltip: { trigger: 'axis', ...tooltipBase(t) },
      xAxis: { type: 'value', ...axisBase(t), show: false },
      yAxis: {
        type: 'category',
        data: tags.map((x) => x[0]),
        ...axisBase(t),
        splitLine: { show: false },
        axisLabel: { color: t.text, fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: tags.map((x) => x[1]),
          barWidth: 10,
          itemStyle: {
            borderRadius: [0, 5, 5, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#B5D4F4' },
                { offset: 1, color: '#2563EB' },
              ],
            },
          },
          label: { show: true, position: 'right', color: t.sub, fontSize: 10 },
        },
      ],
    }
  }, [data, t])

  const durOpt = useMemo(() => {
    if (!data) return {}
    return {
      grid: { left: 38, right: 12, top: 14, bottom: 34 },
      tooltip: { trigger: 'axis', ...tooltipBase(t) },
      xAxis: {
        type: 'category',
        data: data.durationDist.map((d) => d.name),
        ...axisBase(t),
        splitLine: { show: false },
        axisLabel: { color: t.sub, fontSize: 10, interval: 0, rotate: 16 },
      },
      yAxis: { type: 'value', ...axisBase(t) },
      series: [
        {
          type: 'bar',
          data: data.durationDist.map((d, i) => ({
            value: d.value,
            itemStyle: { color: PALETTE[i % PALETTE.length], borderRadius: [4, 4, 0, 0] },
          })),
          barWidth: '46%',
        },
      ],
    }
  }, [data, t])

  const reviewOpt = useMemo(() => {
    if (!data) return {}
    const items = [
      { name: '已通过', value: data.reviewStat.passed, color: '#16A34A' },
      { name: '待审核', value: data.reviewStat.pending, color: '#D97706' },
      { name: '已驳回', value: data.reviewStat.rejected, color: '#DC2626' },
      { name: '存疑', value: data.reviewStat.doubt, color: '#0891B2' },
    ]
    return {
      grid: { left: 8, right: 8, top: 8, bottom: 8 },
      tooltip: { trigger: 'item', ...tooltipBase(t) },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', show: false, data: [''] },
      series: items.map((it, i) => ({
        type: 'bar',
        stack: 'a',
        barWidth: 22,
        data: [it.value],
        itemStyle: { color: it.color, borderRadius: i === 0 ? [4, 0, 0, 4] : i === 3 ? [0, 4, 4, 0] : 0 },
        label: {
          show: it.value > 2,
          color: '#fff',
          fontSize: 10,
          formatter: `${it.value}`,
        },
      })),
    }
  }, [data, t])

  if (!data) {
    return (
      <div className="p-6">
        <PageHeader title="工作台" desc="平台运行概览与近期动态" />
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-3 h-7 w-20" />
              <Skeleton className="mt-3 h-3 w-24" />
            </Card>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <Skeleton className="h-[260px] w-full" />
          </Card>
          <Card className="p-4">
            <Skeleton className="h-[260px] w-full" />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title="工作台"
        desc={`今天是 2026 年 10 月 19 日 · 平台运行正常，队列无积压`}
        extra={
          <>
            <Button icon={<Sparkles size={13} />} onClick={() => navigate('/search')}>
              智能检索
            </Button>
            <Button variant="primary" icon={<Upload size={13} />} onClick={() => navigate('/videos?upload=1')}>
              上传视频
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="视频资产总量"
          value={String(data.totalVideos)}
          unit="部"
          delta={12.5}
          icon={<Film size={14} />}
          spark={[22, 24, 23, 27, 29, 31, 34, 36]}
        />
        <MetricCard
          label="累计解析时长"
          value={`${Math.floor(data.totalSeconds / 3600)}h ${Math.round((data.totalSeconds % 3600) / 60)}m`}
          delta={8.3}
          icon={<Clock size={14} />}
          spark={[12, 13, 12.5, 15, 16, 17, 18, 18.7]}
        />
        <MetricCard
          label="本月解析任务"
          value={String(data.monthTasks)}
          unit="个"
          delta={23.1}
          icon={<ListChecks size={14} />}
          spark={[78, 82, 90, 88, 102, 112, 120, 128]}
        />
        <MetricCard
          label="平均解析耗时"
          value={`${Math.floor(data.avgCost / 60)}m ${data.avgCost % 60}s`}
          delta={-11.2}
          deltaGood="down"
          icon={<Timer size={14} />}
          spark={[190, 182, 176, 168, 162, 158, 154, 150]}
        />
        <MetricCard
          label="违规命中率"
          value={data.violationRate.toFixed(1)}
          unit="%"
          delta={0.4}
          deltaGood="down"
          icon={<ShieldAlert size={14} />}
          spark={[5.2, 5.6, 5.9, 6.1, 6.4, 6.5, 6.7, 6.8]}
        />
        <MetricCard
          label="智能检索次数"
          value={formatNumber(data.searchCount)}
          unit="次"
          delta={31.7}
          icon={<Search size={14} />}
          spark={[620, 710, 780, 890, 960, 1080, 1190, 1284]}
        />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <SectionTitle
            title="解析趋势"
            desc="近 30 天任务量与解析时长"
            extra={<Badge color="var(--text-tertiary)">近 30 天</Badge>}
          />
          <Chart option={trendOpt} height={238} />
        </Card>
        <Card className="p-4">
          <SectionTitle title="内容题材分布" desc="按视频分类统计" />
          <Chart option={pieOpt} height={238} />
        </Card>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <SectionTitle
            title="内容标签 TOP10"
            desc="点击标签查看对应视频"
            extra={
              <Link to="/videos" className="text-[11px] text-brand hover:underline">
                全部
              </Link>
            }
          />
          <Chart
            option={tagOpt}
            height={250}
            onClick={(p) => {
              const name = (p as { name?: string }).name
              if (name) navigate(`/videos?tag=${encodeURIComponent(name)}`)
            }}
          />
        </Card>
        <Card className="p-4">
          <SectionTitle title="视频时长分布" desc="按分档统计数量" />
          <Chart option={durOpt} height={250} />
        </Card>
        <Card className="p-4">
          <SectionTitle title="审核结果构成" desc="全部送审记录" />
          <div className="mt-2">
            <Chart option={reviewOpt} height={44} />
          </div>
          <div className="mt-5 space-y-2.5">
            {[
              { name: '已通过', value: data.reviewStat.passed, color: '#16A34A' },
              { name: '待审核', value: data.reviewStat.pending, color: '#D97706' },
              { name: '已驳回', value: data.reviewStat.rejected, color: '#DC2626' },
              { name: '存疑', value: data.reviewStat.doubt, color: '#0891B2' },
            ].map((r) => {
              const total = data.reviewStat.passed + data.reviewStat.pending + data.reviewStat.rejected + data.reviewStat.doubt
              return (
                <div key={r.name} className="flex items-center gap-2 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.color }} />
                  <span className="w-14 text-t2">{r.name}</span>
                  <Progress value={(r.value / Math.max(1, total)) * 100} color={r.color} height={4} className="flex-1" />
                  <span className="num w-6 text-right text-t2">{r.value}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 rounded-ctl bg-subtle px-2.5 py-2">
            <div className="flex items-start gap-1.5">
              <ShieldAlert size={12} className="mt-0.5 shrink-0 text-warning" />
              <p className="text-[10px] leading-4 text-t2">
                今日新增 <span className="font-medium text-warning">5</span> 条高风险记录，
                其中 3 条来自直播回放类视频。
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <SectionTitle
            title="最近解析任务"
            desc="实时任务状态"
            extra={
              <Link to="/videos" className="flex items-center gap-0.5 text-[11px] text-brand hover:underline">
                查看全部 <ArrowRight size={10} />
              </Link>
            }
          />
          <div className="divide-y divide-line">
            {tasks.map((task) => (
              <Link
                key={task.id}
                to={`/videos/${task.videoId}/analysis`}
                className="flex items-center gap-3 py-2.5 transition-colors hover:bg-hover"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-t1">{task.videoTitle}</div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-t3">
                    <span>{relativeTime(task.startedAt)}</span>
                    <span>·</span>
                    <span>{task.model}</span>
                    {task.cost > 0 && (
                      <>
                        <span>·</span>
                        <span className="num">耗时 {formatDuration(task.cost)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-24 shrink-0">
                  <Progress
                    value={task.progress}
                    color={task.status === 'failed' ? 'var(--danger)' : task.status === 'completed' ? 'var(--success)' : 'var(--brand)'}
                    height={3}
                  />
                </div>
                <StatusBadge status={task.status} />
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <SectionTitle title="快捷入口" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Upload, label: '上传视频', to: '/videos?upload=1', color: '#2563EB' },
                { icon: Search, label: '智能检索', to: '/search', color: '#7C3AED' },
                { icon: Scissors, label: '新建集锦', to: '/editing', color: '#0891B2' },
                { icon: ShieldAlert, label: '进入审核', to: '/review', color: '#D97706' },
              ].map((q) => {
                const Icon = q.icon
                return (
                  <Link
                    key={q.label}
                    to={q.to}
                    className="flex flex-col gap-1.5 rounded-ctl border border-line p-2.5 transition-colors hover:border-brand hover:bg-brand-soft"
                  >
                    <Icon size={15} style={{ color: q.color }} />
                    <span className="text-[11px] text-t1">{q.label}</span>
                  </Link>
                )
              })}
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle title="系统公告" />
            <div className="space-y-2.5">
              {[
                { icon: Megaphone, title: '平台 v2.4 已发布', desc: '新增以图搜视频、优化时间轴缩放', time: '2 小时前' },
                { icon: ShieldAlert, title: '审核规则更新', desc: '广告导流阈值调整为 0.80', time: '昨天' },
              ].map((n) => {
                const Icon = n.icon
                return (
                  <div key={n.title} className="flex gap-2">
                    <Icon size={12} className="mt-0.5 shrink-0 text-t3" />
                    <div>
                      <div className="text-[11px] text-t1">{n.title}</div>
                      <div className="text-[10px] text-t3">
                        {n.desc} · {n.time}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
