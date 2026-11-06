<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ values: number[]; color?: string; width?: number; height?: number; filled?: boolean }>(),
  { color: 'var(--primary)', width: 96, height: 34, filled: true }
)

const uid = `sp${Math.random().toString(36).slice(2, 8)}`

const normalized = computed(() => {
  const vals = props.values.length ? props.values : [0, 0]
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const pad = 3
  return vals.map((v, i) => {
    const x = (i / Math.max(1, vals.length - 1)) * (props.width - pad * 2) + pad
    const y = props.height - pad - ((v - min) / span) * (props.height - pad * 2)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })
})

const points = computed(() => normalized.value.join(' '))
const areaPoints = computed(() => {
  const w = props.width
  return `3,${props.height - 2} ${points.value} ${w - 3},${props.height - 2}`
})
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" fill="none" aria-hidden="true">
    <defs>
      <linearGradient :id="uid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.28" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <polygon v-if="filled" :points="areaPoints" :fill="`url(#${uid})`" />
    <polyline :points="points" :stroke="color" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
