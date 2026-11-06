<template>
  <div class="capacity">
    <div class="bar" :style="{ height: `${height}px` }">
      <div class="inner" :style="{ width: `${Math.min(100, value)}%`, background: color }" />
    </div>
    <span v-if="showLabel" class="label num" :style="{ color }">{{ value.toFixed(1) }}%</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ value: number; showLabel?: boolean; height?: number }>(), {
  showLabel: true,
  height: 6
})

const color = computed(() => (props.value >= 92 ? '#E5484D' : props.value >= 85 ? '#F59E0B' : '#1668DC'))
</script>

<style scoped>
.capacity {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 110px;
}

.bar {
  flex: 1;
  background: #eef1f6;
  border-radius: 4px;
  overflow: hidden;
  min-width: 56px;
}

.inner {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.label {
  font-size: 12px;
  width: 42px;
  text-align: right;
  flex: none;
}
</style>
