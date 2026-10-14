<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  label: string
  value: number | string
  unit?: string
  decimals?: number
  icon?: string
  color?: string
  /** 环比数值，正数向上 */
  trend?: number
  trendLabel?: string
  footer?: string
  /** 数字滚动动画 */
  animate?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  decimals: 0,
  color: '#1677ff',
  animate: true,
  loading: false
})

const display = ref(0)

function animateTo(target: number) {
  const start = display.value
  const diff = target - start
  const duration = 600
  const t0 = performance.now()
  function step(t: number) {
    const p = Math.min(1, (t - t0) / duration)
    const eased = 1 - Math.pow(1 - p, 3)
    display.value = Number((start + diff * eased).toFixed(2))
    if (p < 1) requestAnimationFrame(step)
    else display.value = target
  }
  requestAnimationFrame(step)
}

const isNumber = computed(() => typeof props.value === 'number')

watch(
  () => props.value,
  (v) => {
    if (!isNumber.value) return
    if (props.animate) animateTo(Number(v))
    else display.value = Number(v)
  },
  { immediate: true }
)

const shown = computed(() => {
  if (!isNumber.value) return props.value
  const n = display.value
  if (props.decimals) return n.toFixed(props.decimals)
  return Math.round(n).toLocaleString('zh-CN')
})

const trendUp = computed(() => (props.trend || 0) >= 0)
</script>

<template>
  <div class="stat-card" v-loading="loading">
    <div class="stat-card__head">
      <span class="stat-card__label">{{ label }}</span>
      <span class="stat-card__icon" :style="{ background: color + '1a', color }">
        <el-icon :size="16"><component :is="icon || 'DataLine'" /></el-icon>
      </span>
    </div>
    <div class="stat-card__value" :style="{ color }">
      <span class="num">{{ shown }}</span>
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>
    <div class="stat-card__foot">
      <template v-if="trend !== undefined">
        <span :class="['trend', trendUp ? 'up' : 'down']">
          <el-icon><component :is="trendUp ? 'CaretTop' : 'CaretBottom'" /></el-icon>
          {{ Math.abs(trend) }}%
        </span>
        <span class="trend-label">{{ trendLabel || '较昨日' }}</span>
      </template>
      <span v-else-if="footer" class="trend-label">{{ footer }}</span>
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: box-shadow 0.2s, transform 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.stat-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-card__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.stat-card__icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.stat-card__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-weight: 500;
}

.stat-card__value .num {
  font-size: 26px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat-card__value .unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-card__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-height: 18px;
}

.trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 500;
}

.trend.up {
  color: var(--vc-danger);
}

.trend.down {
  color: var(--vc-success);
}
</style>
