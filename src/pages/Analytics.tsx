import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Download, TrendingUp, Video, Clock, Search, ShieldAlert, Users2, ArrowUpRight } from 'lucide-react'
import type { ModelItem, ReviewItem, VideoItem } from '../types'
import { fetchAllVideos, fetchDashboard, fetchModels, fetchReviews } from '../services'
import { Badge, Button, Card, MetricCard, PageHeader, Progress, SectionTitle, Segmented, Select, Skeleton } from '../components/ui'
import { Chart, PALETTE, axisBase, tooltipBase, useChartTheme } from '../components/Chart'
import { formatDuration, formatNumber, percent, downloadText } from '../lib/utils'

type Dash = Awaited<ReturnType<typeof fetchDashboard>>

export default function Analytics() {
  const [data, setData] = useState<Dash | null>(null)
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [models, setModels] = useState<ModelItem[]>([])
  const [range, setRange] = useState('30')
  const [space, setSpace] = useState('all')
  const t = useChartTheme()

  useEffect(() => {
    fetchDashboard().then(setData)
    fetchAllVideos().then(setVideos)
    fetchReviews().then(setReviews)
    fetchModels().then(setModels)
  }, [])

  const scopedVideos = useMemo(
    () => (space === 'all' ? videos : videos.filter((v) => v.spaceId === space)),
    [videos, space],
  )

  const trend = useMemo(() => {
    if (!data) return []
    const n = Number(range)
    return data.trend.slice(-n)
  }, [data, range])

  const trendOpt = useMemo(
    () => ({
      grid: { left: 44, right: 44, top: 28, bottom: 26 },
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
        data: trend.map((d) => d.date),
        boundaryGap: false,
        ...axisBase(t),
        splitLine: { show: false },
        axisLabel: { color: t.sub, fontSize: 10, interval: Math.max(0, Math.floor(trend.length / 8)) },
      },
      yAxis: [
        { type: 'value', ...axisBase(t), name: '任务', nameTextStyle: { color: t.sub, fontSize: 10 } },
        { type: 'value', ...axisBase(t), splitLine: { show: false }, name: '小时', nameTextStyle: { color: t.sub, fontSize: 10 } },
      ],
      series: [
        {
          name: '解析任务数',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: trend.map((d) => d.tasks),
          lineStyle: { color: '#2563EB', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37,99,235,.2)' },
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
          data: trend.map((d) => d.hours),
          lineStyle: { color: '#7C3AED', width: 1.5, type: 'dashed' },
        },
      ],
    }),
    [trend, t],
  )

  const catOpt = useMemo(() => {
    const map = new Map<string, number>()
    scopedVideos.forEach((v) => map.set(v.category, (map.get(v.category) ?? 0) + 1))
    const items = [...map.entries()].map(([name, value]) => ({ name, value }))
    return {
      tooltip: { trigger: 'item', ...tooltipBase(t) },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 8,
        textStyle: { color: t.text, fontSize: 11 },
      },
      series: [
        {
          type: 'pie',
          radius: ['46%', '70%'],
          center: ['34%', '50%'],
          itemStyle: { borderColor: t.surface, borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          data: items,
          color: PALETTE,
        },
      ],
    }
  }, [scopedVideos, t])

  const durOpt = useMemo(() => {
    if (!data) return {}
    return {
      grid: { left: 38, right: 14, top: 16, bottom: 40 },
      tooltip: { trigger: 'axis', ...tooltipBase(t) },
      xAxis: {
        type: 'category',
        data: data.durationDist.map((d) => d.name),
        ...axisBase(t),
        splitLine: { show: false },
        axisLabel: { color: t.sub, fontSize: 10, interval: 0, rotate: 20 },
      },
      yAxis: { type: 'value', ...axisBase(t) },
      series: [
        {
          type: 'bar',
          barWidth: '46%',
          data: data.durationDist.map((d, i) => ({
            value: d.value,
            itemStyle: { color: PALETTE[i % PALETTE.length], borderRadius: [4, 4, 0, 0] },
          })),
        },
      ],
    }
  }, [data, t])

  const modelOpt = useMemo(() => {
    const items = [...models].sort((a, b) => a.calls - b.calls).slice(-7)
    return {
      grid: { left: 104, right: 44, top: 6, bottom: 6 },
      tooltip: { trigger: 'axis', ...tooltipBase(t) },
      xAxis: { type: 'value', show: false },
      yAxis: {
        type: 'category',
        data: items.map((m) => m.name.split(' ')[0]),
        ...axisBase(t),
        splitLine: { show: false },
        axisLabel: { color: t.text, fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          barWidth: 9,
          data: items.map((m) => m.calls),
          itemStyle: {
            borderRadius: [0, 5, 5, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#C4D9F8' },
                { offset: 1, color: '#2563EB' },
              ],
            },
          },
          label: { show: true, position: 'right', color: t.sub, fontSize: 9, formatter: (p: { value: number }) => formatNumber(p.value) },
        },
      ],
    }
  }, [models, t])

  const violationOpt = useMemo(() => {
    const cats = [...new Set(reviews.map((r) => r.category))]
    const levels: { key: ReviewItem['level']; color: string }[] = [
      { key: '高', color: '#DC2626' },
      { key: '中', color: '#D97706' },
      { key: '低', color: '#0891B2' },
    ]
    return {
      grid: { left: 42, right: 12, top: 24, bottom: 30 },
      tooltip: { trigger: 'axis', ...tooltipBase(t) },
      legend: {
        right: 0,
        top: 0,
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: t.text, fontSize: 11 },
      },
      xAxis: { type: 'category', data: cats, ...axisBase(t), splitLine: { show: false }, axisLabel: { color: t.sub, fontSize: 10 } },
      yAxis: { type: 'value', ...axisBase(t) },
      series: levels.map((lv) => ({
        name: `${lv.key}风险`,
        type: 'bar',
        stack: 'v',
        barWidth: '42%',
        itemStyle: { color: lv.color },
        data: cats.map((c) => reviews.filter((r) => r.category === c && r.level === lv.key).length),
      })),
    }
  }, [reviews, t])

  const topVideos = useMemo(
    () => [...scopedVideos].sort((a, b) => b.playCount - a.playCount).slice(0, 6),
    [scopedVideos],
  )

  const hotTags = useMemo(() => {
    if (!data) return []
    return data.topTags.slice(0, 8)
  }, [data])

  if (!data) {
    return (
      <div className="p-6">
        <PageHeader title="数据分析" desc="平台运行、内容结构与审核质量的综合分析" />
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <Skeleton className="h-[300px] lg:col-span-2" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  const exportReport = () => {
    const rows = [
      ['指标', '数值'],
      ['视频资产总量', String(data.totalVideos)],
      ['累计解析时长(秒)', String(data.totalSeconds)],
      ['本月解析任务', String(data.monthTasks)],
      ['平均解析耗时(秒)', String(data.avgCost)],
      ['违规命中率(%)', data.violationRate.toFixed(2)],
      ['智能检索次数', String(data.searchCount)],
      ['', ''],
      ['题材', '数量'],
      ...data.categories.map((c) => [c.name, String(c.value)]),
      ['', ''],
      ['标签', '次数'],
      ...data.topTags.map((tag) => [tag[0], String(tag[1])]),
    ]
    downloadText('analytics_report.csv', rows.map((r) => r.join(',')).join('\n'), 'text/csv')
  }

  return (
    <div className="p-6">
      <PageHeader
        title="数据分析"
        desc="从资产、解析、检索到审核的全链路指标，支持按空间与时间范围切片"
        extra={
          <>
            <Select value={space} onChange={(e) => setSpace(e.target.value)}>
              <option value="all">全部空间</option>
              <option value="sp_news">新闻中心</option>
              <option value="sp_brand">品牌空间</option>
              <option value="sp_edu">教育培训</option>
            </Select>
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: '7', label: '近 7 天' },
                { value: '30', label: '近 30 天' },
                { value: '0', label: '全部' },
              ]}
            />
            <Button icon={<Download size={13} />} onClick={exportReport}>
              导出报告
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="视频资产"
          value={String(scopedVideos.length)}
          unit="部"
          delta={12.5}
          icon={<Video size={14} />}
          spark={[22, 24, 23, 27, 29, 31, 34, 36]}
        />
        <MetricCard
          label="解析总时长"
          value={`${Math.floor(data.totalSeconds / 3600)}h`}
          delta={8.3}
          icon={<Clock size={14} />}
          spark={[12, 13, 12.5, 15, 16, 17, 18, 18.7]}
        />
        <MetricCard
          label="平均单视频耗时"
          value={formatDuration(data.avgCost)}
          delta={-11.2}
          deltaGood="down"
          icon={<TrendingUp size={14} />}
          spark={[190, 182, 176, 168, 162, 158, 154, 150]}
        />
        <MetricCard
          label="检索次数"
          value={formatNumber(data.searchCount)}
          unit="次"
          delta={31.7}
          icon={<Search size={14} />}
          spark={[620, 710, 780, 890, 960, 1080, 1190, 1284]}
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
          label="人工复核量"
          value={String(reviews.filter((r) => r.status !== 'pending').length)}
          unit="条"
          delta={6.8}
          deltaGood="down"
          icon={<Users2 size={14} />}
          spark={[18, 22, 19, 24, 21, 17, 16, 15]}
        />
      </div>

      <div className="mb-3 grid gap-3 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <SectionTitle
            title="解析任务趋势"
            desc="任务量与总耗时（双轴）"
            extra={<Badge color="var(--text-tertiary)">{range === '0' ? '全部' : `近 ${range} 天`}</Badge>}
          />
          <Chart option={trendOpt} height={260} />
        </Card>
        <Card className="p-4">
          <SectionTitle title="题材结构" desc="按视频分类统计" />
          <Chart option={catOpt} height={260} />
        </Card>
      </div>

      <div className="mb-3 grid gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <SectionTitle title="时长分布" desc="视频时长分档" />
          <Chart option={durOpt} height={220} />
        </Card>
        <Card className="p-4">
          <SectionTitle title="模型调用量" desc="按调用次数排序，含离线模型" />
          <Chart option={modelOpt} height={220} />
        </Card>
        <Card className="p-4">
          <SectionTitle title="违规类型分布" desc="按风险等级堆叠" />
          <Chart option={violationOpt} height={220} />
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <SectionTitle
            title="播放表现 TOP6"
            desc="播放量最高的视频及其解析状态"
            extra={
              <Link to="/videos" className="flex items-center gap-0.5 text-[11px] text-brand hover:underline">
                视频库 <ArrowUpRight size={10} />
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-line text-left text-[10px] text-t3">
                  <th className="py-1.5 pr-2 font-normal">视频</th>
                  <th className="px-2 py-1.5 font-normal">题材</th>
                  <th className="px-2 py-1.5 text-right font-normal">时长</th>
                  <th className="px-2 py-1.5 text-right font-normal">播放</th>
                  <th className="px-2 py-1.5 text-right font-normal">解析</th>
                </tr>
              </thead>
              <tbody>
                {topVideos.map((v) => (
                  <tr key={v.id} className="border-b border-line/60 last:border-0 hover:bg-hover">
                    <td className="max-w-[240px] py-1.5 pr-2">
                      <Link to={`/videos/${v.id}`} className="line-clamp-1 text-t1 hover:text-brand">
                        {v.title}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-t2">{v.category}</td>
                    <td className="num px-2 py-1.5 text-right text-[11px] text-t2">{formatDuration(v.duration)}</td>
                    <td className="num px-2 py-1.5 text-right text-[11px] text-t2">{formatNumber(v.playCount)}</td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="ml-auto w-12">
                        <Progress
                          value={v.progress}
                          height={3}
                          color={v.status === 'completed' ? 'var(--success)' : v.status === 'failed' ? 'var(--danger)' : 'var(--brand)'}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <SectionTitle title="热门内容标签" desc="点击查看关联视频" />
            <div className="space-y-2">
              {hotTags.map((tag, i) => (
                <Link key={tag[0]} to={`/videos?tag=${encodeURIComponent(tag[0])}`} className="block">
                  <div className="flex items-center gap-2">
                    <span className="num w-3 text-[10px] text-t3">{i + 1}</span>
                    <span className="flex-1 truncate text-[11px] text-t1">{tag[0]}</span>
                    <span className="num text-[10px] text-t3">{tag[1]}</span>
                  </div>
                  <Progress value={(tag[1] / Math.max(1, hotTags[0]?.[1] ?? 1)) * 100} height={2} className="mt-1" />
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle title="审核质量" desc="人工复核结论构成" />
            {[
              { label: '模型判对', value: data.reviewStat.passed, color: 'var(--success)' },
              { label: '模型误报', value: data.reviewStat.doubt, color: 'var(--info)' },
              { label: '确认违规', value: data.reviewStat.rejected, color: 'var(--danger)' },
              { label: '待人工', value: data.reviewStat.pending, color: 'var(--warning)' },
            ].map((r) => {
              const total = data.reviewStat.passed + data.reviewStat.doubt + data.reviewStat.rejected + data.reviewStat.pending
              return (
                <div key={r.label} className="mb-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-t2">{r.label}</span>
                    <span className="num text-t2">
                      {r.value} · {percent(r.value / Math.max(1, total), 0)}
                    </span>
                  </div>
                  <Progress value={(r.value / Math.max(1, total)) * 100} color={r.color} height={3} className="mt-1" />
                </div>
              )
            })}
            <div className="mt-2 rounded-ctl bg-subtle px-2 py-1.5 text-[10px] leading-4 text-t3">
              综合误报率约 <span className="num text-t2">{percent(data.reviewStat.doubt / Math.max(1, reviews.length), 1)}</span>，
              建议对「违禁品」类样本做一轮定向微调。
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-t3">
        <BarChart3 size={11} />
        数据每 5 分钟聚合一次，最近更新于 2026-10-19 09:30。
      </div>
    </div>
  )
}
