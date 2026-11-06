<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    unit?: string
    disabled?: boolean
  }>(),
  { min: 0, max: 100, step: 1, unit: '', disabled: false }
)
const emit = defineEmits<{ 'update:modelValue': [number] }>()

const pct = computed(() => ((props.modelValue - props.min) / (props.max - props.min)) * 100)

function onInput(e: Event) {
  emit('update:modelValue', Number((e.target as HTMLInputElement).value))
}
function onNumber(e: Event) {
  const raw = Number((e.target as HTMLInputElement).value)
  if (Number.isNaN(raw)) return
  const clamped = Math.min(props.max, Math.max(props.min, raw))
  emit('update:modelValue', Math.round(clamped / props.step) * props.step)
}
</script>

<template>
  <div class="slider" :class="{ disabled }">
    <input
      class="range"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :disabled="disabled"
      :style="{ '--pct': pct + '%' }"
      @input="onInput"
    />
    <div class="num-wrap">
      <input class="num-input num" type="number" :min="min" :max="max" :step="step" :value="modelValue" :disabled="disabled" @change="onNumber" />
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>
  </div>
</template>

<style scoped>
.slider {
  display: flex;
  align-items: center;
  gap: 14px;
}
.disabled {
  opacity: 0.45;
}
.range {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 99px;
  background: linear-gradient(to right, var(--primary) 0%, var(--primary) var(--pct), var(--border) var(--pct), var(--border) 100%);
  outline: none;
  cursor: pointer;
}
.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--primary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  cursor: grab;
  transition: transform 0.12s;
}
.range::-webkit-slider-thumb:active {
  transform: scale(1.15);
  cursor: grabbing;
}
.range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--primary);
  cursor: grab;
}
.num-wrap {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: none;
}
.num-input {
  width: 56px;
  height: 28px;
  padding: 0 6px;
  text-align: right;
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12.5px;
  color: var(--text-1);
  outline: none;
}
.num-input:focus {
  border-color: var(--primary);
}
.num-input::-webkit-outer-spin-button,
.num-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.unit {
  font-size: 11.5px;
  color: var(--text-3);
  width: 14px;
}
</style>
