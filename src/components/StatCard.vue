<template>
  <div class="stat-card">
    <div class="top">
      <div class="icon-tile" :style="tileStyle">
        <el-icon :size="17"><component :is="icon" /></el-icon>
      </div>
      <span class="label">{{ label }}</span>
    </div>
    <div class="value-row">
      <span class="value num">{{ value }}</span>
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>
    <div class="foot">
      <span v-if="trend !== undefined" class="trend" :class="trendGood ? 'good' : 'bad'">
        <el-icon :size="11"><component :is="trend >= 0 ? 'Top' : 'Bottom'" /></el-icon>
        {{ Math.abs(trend).toFixed(1) }}%
      </span>
      <span class="hint">{{ hint }}</span>
    </div>
    <div v-if="progress !== undefined" class="progress-line">
      <div class="progress-inner" :style="{ width: `${Math.min(100, progress)}%`, background: progressColor }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  unit?: string
  icon: string
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'cyan' | 'purple' | 'neutral'
  trend?: number
  trendGood?: boolean
  hint?: string
  progress?: number
}>()

const TONES: Record<string, { fg: string; bg: string; bar: string }> = {
  primary: { fg: '#1668DC', bg: '#E8F1FF', bar: '#1668DC' },
  success: { fg: '#16A34A', bg: '#E8F7EE', bar: '#16A34A' },
  warning: { fg: '#D97706', bg: '#FEF4E6', bar: '#F59E0B' },
  danger: { fg: '#DC2626', bg: '#FDECEC', bar: '#E5484D' },
  cyan: { fg: '#0E9292', bg: '#E6F8F8', bar: '#13C2C2' },
  purple: { fg: '#6D4AE0', bg: '#F0ECFE', bar: '#7C5CFC' },
  neutral: { fg: '#5B6675', bg: '#F1F3F7', bar: '#94A3B8' }
}

const tone = computed(() => TONES[props.tone ?? 'primary'])
const tileStyle = computed(() => ({ background: tone.value.bg, color: tone.value.fg }))
const progressColor = computed(() => {
  if (props.progress === undefined) return tone.value.bar
  if (props.progress >= 92) return '#E5484D'
  if (props.progress >= 85) return '#F59E0B'
  return tone.value.bar
})
</script>

<style scoped>
.stat-card {
  position: relative;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 18px 14px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
  overflow: hidden;
}

.top {
  display: flex;
  align-items: center;
  gap: 9px;
}

.icon-tile {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.label {
  font-size: 13px;
  color: var(--neutral-600);
}

.value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 10px 0 8px;
}

.value {
  font-size: 26px;
  font-weight: 600;
  color: var(--neutral-900);
  letter-spacing: -0.3px;
  line-height: 30px;
}

.unit {
  font-size: 12px;
  color: var(--neutral-400);
}

.foot {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  min-height: 16px;
}

.trend {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  font-weight: 500;
}

.trend.good {
  color: #16a34a;
}

.trend.bad {
  color: #e5484d;
}

.hint {
  color: var(--neutral-400);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-line {
  margin-top: 9px;
  height: 4px;
  border-radius: 4px;
  background: #eef1f6;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}
</style>
