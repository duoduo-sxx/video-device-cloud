import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

export const PALETTE = ['#22D3EE', '#6366F1', '#34D399', '#FBBF24', '#F472B6', '#A78BFA', '#FB923C', '#38BDF8']

echarts.registerTheme('mirror', {
  color: PALETTE,
  backgroundColor: 'transparent',
  textStyle: { color: '#93A4BE', fontSize: 11 },
  title: { textStyle: { color: '#E6EDF7', fontSize: 13, fontWeight: 500 } },
  legend: { textStyle: { color: '#93A4BE', fontSize: 11 }, icon: 'roundRect', itemWidth: 8, itemHeight: 8 },
  tooltip: {
    backgroundColor: 'rgba(14,21,38,0.94)',
    borderColor: 'rgba(148,163,184,0.2)',
    borderWidth: 1,
    textStyle: { color: '#E6EDF7', fontSize: 12 },
    extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.4);',
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } },
    axisTick: { show: false },
    axisLabel: { color: '#5D6E8A', fontSize: 11 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#5D6E8A', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(148,163,184,0.10)', type: 'dashed' } },
  },
})

export default function EChart({
  option,
  height = 220,
  style,
}: {
  option: echarts.EChartsOption
  height?: number | string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inst = useRef<echarts.ECharts>()

  useEffect(() => {
    if (!ref.current) return
    inst.current = echarts.init(ref.current, 'mirror', { renderer: 'canvas' })
    inst.current.setOption(option)
    const ro = new ResizeObserver(() => inst.current?.resize())
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      inst.current?.dispose()
      inst.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    inst.current?.setOption(option, true)
  }, [option])

  return <div ref={ref} style={{ width: '100%', height, ...style }} />
}
