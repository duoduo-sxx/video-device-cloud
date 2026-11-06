import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useUi } from '../stores'
import { cn } from '../lib/utils'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  RadarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  CanvasRenderer,
])

export const PALETTE = ['#2563EB', '#7C3AED', '#0891B2', '#D97706', '#16A34A', '#DB2777', '#0F766E', '#64748B']

export function useChartTheme() {
  const theme = useUi((s) => s.theme)
  return {
    theme,
    text: theme === 'dark' ? '#9BA3AF' : '#4B5563',
    sub: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    line: theme === 'dark' ? '#262D3A' : '#E5E7EB',
    surface: theme === 'dark' ? '#12161F' : '#FFFFFF',
    strong: theme === 'dark' ? '#E8EAED' : '#111827',
  }
}

export function Chart({
  option,
  height = 260,
  className,
  onClick,
}: {
  option: echarts.EChartsCoreOption
  height?: number
  className?: string
  onClick?: (params: unknown) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inst = useRef<echarts.ECharts | null>(null)
  const theme = useUi((s) => s.theme)

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' })
    inst.current = chart
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      chart.dispose()
      inst.current = null
    }
  }, [])

  useEffect(() => {
    if (!inst.current) return
    inst.current.setOption(option, true)
    if (onClick) {
      inst.current.off('click')
      inst.current.on('click', onClick)
    }
  }, [option, onClick, theme])

  return <div ref={ref} className={cn('w-full', className)} style={{ height }} />
}

export function axisBase(t: ReturnType<typeof useChartTheme>) {
  return {
    axisLine: { lineStyle: { color: t.line } },
    axisTick: { show: false },
    axisLabel: { color: t.sub, fontSize: 11 },
    splitLine: { lineStyle: { color: t.line, type: 'dashed' as const } },
  }
}

export function tooltipBase(t: ReturnType<typeof useChartTheme>) {
  return {
    backgroundColor: t.surface,
    borderColor: t.line,
    borderWidth: 1,
    textStyle: { color: t.strong, fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,.08); border-radius: 8px;',
  }
}
