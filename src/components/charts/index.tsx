import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useAppStore } from '@/stores/appStore'

export function cssVar(name: string) {
  if (typeof window === 'undefined') return '#888'
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'
}

function usePalette() {
  const theme = useAppStore((s) => s.theme)
  return useMemo(
    () => ({
      text: cssVar('--text-secondary'),
      muted: cssVar('--text-muted'),
      grid: cssVar('--border-subtle'),
      panel: cssVar('--bg-panel'),
      brand: cssVar('--brand'),
      accent: cssVar('--accent'),
      success: cssVar('--success'),
      warning: cssVar('--warning'),
      danger: cssVar('--danger'),
      info: cssVar('--info'),
      theme,
    }),
    [theme],
  )
}

function Base({
  option,
  height = 260,
  onClick,
}: {
  option: EChartsOption
  height?: number
  onClick?: (params: unknown) => void
}) {
  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
      lazyUpdate
      onEvents={onClick ? { click: onClick } : undefined}
    />
  )
}

const axisCommon = (p: ReturnType<typeof usePalette>) => ({
  axisLine: { lineStyle: { color: p.grid } },
  axisTick: { show: false },
  axisLabel: { color: p.muted, fontSize: 11 },
  splitLine: { lineStyle: { color: p.grid, type: 'dashed' as const } },
})

export function AreaChart({
  data,
  height = 240,
  color,
  color2,
  unit = '',
}: {
  data: Array<{ label: string; value: number; value2?: number }>
  height?: number
  color?: string
  color2?: string
  unit?: string
}) {
  const p = usePalette()
  const c1 = color ?? p.brand
  const c2 = color2 ?? p.accent
  const hasSecond = data.some((d) => typeof d.value2 === 'number')
  const option: EChartsOption = {
    grid: { left: 8, right: 12, top: 20, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: cssVar('--bg-elevated'),
      borderColor: cssVar('--border-strong'),
      textStyle: { color: cssVar('--text-primary'), fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: c1, opacity: 0.3 } },
    },
    legend: hasSecond
      ? { right: 0, top: 0, icon: 'roundRect', itemWidth: 8, itemHeight: 8, textStyle: { color: p.muted, fontSize: 11 } }
      : undefined,
    xAxis: { type: 'category', boundaryGap: false, data: data.map((d) => d.label), ...axisCommon(p), splitLine: { show: false } },
    yAxis: { type: 'value', ...axisCommon(p), axisLine: { show: false } },
    series: [
      {
        name: '指令量',
        type: 'line',
        smooth: 0.35,
        symbol: 'none',
        data: data.map((d) => d.value),
        lineStyle: { width: 2, color: c1 },
        itemStyle: { color: c1 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${c1}44` },
              { offset: 1, color: `${c1}00` },
            ],
          },
        },
      },
      ...(hasSecond
        ? [
            {
              name: '成功量',
              type: 'line' as const,
              smooth: 0.35,
              symbol: 'none',
              data: data.map((d) => d.value2 ?? 0),
              lineStyle: { width: 1.5, color: c2, type: 'dashed' as const },
              itemStyle: { color: c2 },
            },
          ]
        : []),
    ],
  }
  return <Base option={option} height={height} />
}

export function DonutChart({
  data,
  height = 240,
  centerLabel,
  centerValue,
}: {
  data: Array<{ name: string; value: number }>
  height?: number
  centerLabel?: string
  centerValue?: string
}) {
  const p = usePalette()
  const colors = [p.brand, p.accent, p.success, p.warning, p.info]
  const option: EChartsOption = {
    color: colors,
    tooltip: {
      trigger: 'item',
      backgroundColor: cssVar('--bg-elevated'),
      borderColor: cssVar('--border-strong'),
      textStyle: { color: cssVar('--text-primary'), fontSize: 12 },
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      icon: 'circle',
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 10,
      textStyle: { color: p.muted, fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '82%'],
        center: ['32%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: cssVar('--bg-panel'), borderWidth: 2, borderRadius: 3 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 4 },
        data,
      },
    ],
    graphic: centerValue
      ? [
          {
            type: 'text',
            left: '30%',
            top: '46%',
            style: { text: centerValue, fill: cssVar('--text-primary'), fontSize: 20, fontWeight: 600, align: 'center' },
          },
          {
            type: 'text',
            left: '30%',
            top: '58%',
            style: { text: centerLabel ?? '', fill: p.muted, fontSize: 11, align: 'center' },
          },
        ]
      : undefined,
  }
  return <Base option={option} height={height} />
}

export function BarChart({
  data,
  height = 240,
  horizontal,
  color,
}: {
  data: Array<{ label: string; value: number; color?: string }>
  height?: number
  horizontal?: boolean
  color?: string
}) {
  const p = usePalette()
  const c = color ?? p.brand
  const cat = { type: 'category' as const, data: data.map((d) => d.label), ...axisCommon(p), splitLine: { show: false } }
  const val = { type: 'value' as const, ...axisCommon(p), axisLine: { show: false } }
  const option: EChartsOption = {
    grid: horizontal
      ? { left: 8, right: 24, top: 8, bottom: 4, containLabel: true }
      : { left: 8, right: 8, top: 16, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: cssVar('--bg-elevated'),
      borderColor: cssVar('--border-strong'),
      textStyle: { color: cssVar('--text-primary'), fontSize: 12 },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(34,211,238,0.06)' } },
    },
    xAxis: horizontal ? val : cat,
    yAxis: horizontal ? { ...cat, inverse: true } : val,
    series: [
      {
        type: 'bar',
        data: data.map((d) => ({ value: d.value, itemStyle: { color: d.color ?? c, borderRadius: horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0] } })),
        barMaxWidth: 14,
      },
    ],
  }
  return <Base option={option} height={height} />
}

export function HeatmapChart({ data, height = 240 }: { data: number[][]; height?: number }) {
  const p = usePalette()
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const cells: Array<[number, number, number]> = []
  data.forEach((row, y) => row.forEach((v, x) => cells.push([x, y, v])))
  const option: EChartsOption = {
    grid: { left: 8, right: 8, top: 8, bottom: 40, containLabel: true },
    tooltip: {
      backgroundColor: cssVar('--bg-elevated'),
      borderColor: cssVar('--border-strong'),
      textStyle: { color: cssVar('--text-primary'), fontSize: 12 },
      formatter: (params: unknown) => {
        const q = params as { value: [number, number, number] }
        return `${days[q.value[1]]} ${String(q.value[0]).padStart(2, '0')}:00<br/>指令量 ${q.value[2]}`
      },
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}`),
      ...axisCommon(p),
      splitLine: { show: false },
      axisLabel: { color: p.muted, fontSize: 10, interval: 2 },
    },
    yAxis: { type: 'category', data: days, ...axisCommon(p), splitLine: { show: false } },
    visualMap: {
      min: 0,
      max: 100,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 10,
      itemHeight: 80,
      textStyle: { color: p.muted, fontSize: 10 },
      inRange: { color: ['#0b1a26', '#0e4a5a', '#128fa6', '#22d3ee'] },
      text: ['高', '低'],
    },
    series: [
      {
        type: 'heatmap',
        data: cells,
        itemStyle: { borderRadius: 2, borderColor: cssVar('--bg-panel'), borderWidth: 1.5 },
        emphasis: { itemStyle: { borderColor: cssVar('--brand'), borderWidth: 1 } },
      },
    ],
  }
  return <Base option={option} height={height} />
}

export function RadarChart({
  indicators,
  values,
  height = 240,
}: {
  indicators: Array<{ name: string; max: number }>
  values: number[]
  height?: number
}) {
  const p = usePalette()
  const option: EChartsOption = {
    tooltip: {
      backgroundColor: cssVar('--bg-elevated'),
      borderColor: cssVar('--border-strong'),
      textStyle: { color: cssVar('--text-primary'), fontSize: 12 },
    },
    radar: {
      indicator: indicators,
      radius: '66%',
      splitNumber: 4,
      axisName: { color: p.muted, fontSize: 10 },
      splitLine: { lineStyle: { color: p.grid } },
      splitArea: { areaStyle: { color: ['transparent', 'rgba(34,211,238,0.02)'] } },
      axisLine: { lineStyle: { color: p.grid } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            areaStyle: { color: 'rgba(34,211,238,0.16)' },
            lineStyle: { color: p.brand, width: 1.5 },
            itemStyle: { color: p.brand },
          },
        ],
      },
    ],
  }
  return <Base option={option} height={height} />
}
