<template>
  <div class="chart-card">
    <div class="chart-head">
      <div class="chart-title">
        {{ title }}
        <span v-if="subtitle" class="sub">{{ subtitle }}</span>
      </div>
      <slot name="extra" />
    </div>
    <div ref="el" class="chart-body" :style="{ height: `${height}px` }" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const props = withDefaults(defineProps<{ title: string; subtitle?: string; option: EChartsOption; height?: number }>(), {
  height: 280
})

const el = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!el.value) return
  chart = echarts.init(el.value)
  chart.setOption(props.option)
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(el.value)
})

watch(
  () => props.option,
  (val) => chart?.setOption(val, true),
  { deep: true }
)

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.chart-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 18px 8px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
}

.chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-900);
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sub {
  font-size: 11.5px;
  font-weight: 400;
  color: var(--neutral-400);
}

.chart-body {
  width: 100%;
}
</style>
