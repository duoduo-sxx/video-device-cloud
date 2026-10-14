<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  BarChart,
  CustomChart,
  GaugeChart,
  GraphChart,
  HeatmapChart,
  LineChart,
  PictorialBarChart,
  PieChart,
  RadarChart,
  ScatterChart
} from 'echarts/charts'
import {
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  PolarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components'
import { useAppStore } from '@/stores/app'
import { CHART_COLORS } from '@/utils/dict'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  RadarChart,
  GaugeChart,
  ScatterChart,
  HeatmapChart,
  GraphChart,
  PictorialBarChart,
  CustomChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  MarkLineComponent,
  PolarComponent,
  VisualMapComponent,
  GraphicComponent
])

interface Props {
  option: Record<string, any>
  height?: string | number
  loading?: boolean
  /** 无数据时展示空状态 */
  empty?: boolean
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  loading: false,
  empty: false,
  emptyText: '暂无数据'
})

const app = useAppStore()
const chartRef = ref()

const themeName = computed(() => (app.theme === 'dark' ? 'dark' : undefined))

const finalOption = computed(() => {
  const base: Record<string, any> = {
    color: CHART_COLORS,
    textStyle: {
      fontFamily: '-apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif',
      fontSize: 12
    },
    tooltip: {
      confine: true,
      textStyle: { fontSize: 12 }
    },
    grid: { left: 12, right: 16, top: 32, bottom: 8, containLabel: true },
    ...props.option
  }
  return base
})

watch(
  () => app.theme,
  () => {
    // 主题切换时重绘
    if (chartRef.value?.setOption) {
      setTimeout(() => chartRef.value?.setOption(finalOption.value, true), 60)
    }
  }
)

const styleHeight = computed(() => (typeof props.height === 'number' ? `${props.height}px` : props.height))

defineExpose({ chart: chartRef })

onBeforeUnmount(() => {
  chartRef.value?.dispose?.()
})
</script>

<template>
  <div class="base-chart" :style="{ height: styleHeight }">
    <el-empty v-if="empty" :description="emptyText" :image-size="72" />
    <v-chart v-else ref="chartRef" class="chart" :option="finalOption" :theme="themeName" autoresize />
  </div>
</template>

<style scoped>
.base-chart {
  width: 100%;
}

.chart {
  width: 100%;
  height: 100%;
}

.base-chart :deep(.el-empty) {
  padding: 24px 0;
}
</style>
