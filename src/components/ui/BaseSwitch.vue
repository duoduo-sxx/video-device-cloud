<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue: boolean; disabled?: boolean; label?: string }>(), {
  disabled: false,
  label: ''
})
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    class="sw"
    :class="{ on: modelValue, disabled }"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    @click="toggle"
  >
    <span class="knob" />
  </button>
</template>

<style scoped>
.sw {
  width: 36px;
  height: 20px;
  border-radius: 99px;
  background: var(--border-strong);
  position: relative;
  transition: background 0.18s var(--ease);
  flex: none;
}
.sw.on {
  background: var(--primary);
}
.sw.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.18s var(--ease);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
}
.sw.on .knob {
  transform: translateX(16px);
}
</style>
