<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  GraphicComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'
import { useAppStore } from '@/stores/app'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  GraphicComponent,
  CanvasRenderer
])

const props = withDefaults(
  defineProps<{ option: EChartsCoreOption; height?: number | string; loading?: boolean }>(),
  { height: 260, loading: false }
)

const app = useAppStore()
const el = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let ro: ResizeObserver | null = null

function css(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

type AxisLike = Record<string, unknown>

function decorateAxis(axis: AxisLike | AxisLike[] | undefined): AxisLike | AxisLike[] | undefined {
  if (!axis) return axis
  const apply = (a: AxisLike): AxisLike => ({
    axisLine: { lineStyle: { color: css('--border'), width: 1 } },
    axisTick: { show: false },
    axisLabel: { color: css('--text-3'), fontSize: 11 },
    splitLine: { lineStyle: { color: css('--border-subtle'), width: 1, type: 'solid' } },
    ...a
  })
  return Array.isArray(axis) ? axis.map(apply) : apply(axis)
}

const merged = computed<EChartsCoreOption>(() => {
  const raw = props.option as Record<string, unknown>
  return {
    textStyle: { fontFamily: 'Inter, "PingFang SC", system-ui, sans-serif', fontSize: 12 },
    animationDuration: 420,
    animationEasing: 'cubicOut',
    grid: { left: 4, right: 12, top: 28, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: css('--bg-elevated'),
      borderColor: css('--border-strong'),
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: css('--text-1'), fontSize: 12 },
      extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.35);',
      axisPointer: { type: 'line', lineStyle: { color: css('--border-strong'), type: 'dashed' } }
    },
    legend: {
      icon: 'roundRect',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 16,
      top: 0,
      right: 0,
      textStyle: { color: css('--text-2'), fontSize: 11.5 }
    },
    ...raw,
    xAxis: decorateAxis(raw.xAxis as AxisLike | AxisLike[] | undefined),
    yAxis: decorateAxis(raw.yAxis as AxisLike | AxisLike[] | undefined)
  } as EChartsCoreOption
})

function render() {
  if (!chart) return
  chart.setOption(merged.value, true)
}

onMounted(() => {
  if (!el.value) return
  chart = echarts.init(el.value, undefined, { renderer: 'canvas' })
  render()
  ro = new ResizeObserver(() => chart?.resize())
  ro.observe(el.value)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  chart?.dispose()
  chart = null
})

watch(merged, render, { deep: true })
watch(
  () => app.theme,
  () => window.setTimeout(render, 30)
)
</script>

<template>
  <div ref="el" class="chart" :style="{ height: typeof height === 'number' ? height + 'px' : height }" />
</template>

<style scoped>
.chart {
  width: 100%;
}
</style>
