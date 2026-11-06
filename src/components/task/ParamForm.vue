<script setup lang="ts">
import { computed } from 'vue'
import { HelpCircle } from 'lucide-vue-next'
import type { Capability, ParamSchema } from '@/types'
import BaseSlider from '@/components/ui/BaseSlider.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'

const props = defineProps<{ capability: Capability; modelValue: Record<string, number | string | boolean> }>()
const emit = defineEmits<{ 'update:modelValue': [Record<string, number | string | boolean>] }>()

function set(key: string, val: number | string | boolean) {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}

function optionsOf(p: ParamSchema) {
  return p.options ?? []
}

const params = computed(() => props.capability.params)
</script>

<template>
  <div class="pf">
    <div v-for="p in params" :key="p.key" class="field">
      <div class="field-head">
        <label class="label" style="margin-bottom: 0">{{ p.label }}</label>
        <span class="tip" :title="p.tip"><HelpCircle :size="11" /></span>
      </div>
      <div class="control">
        <BaseSlider
          v-if="p.type === 'slider'"
          :model-value="Number(modelValue[p.key])"
          :min="p.min ?? 0"
          :max="p.max ?? 100"
          :step="p.step ?? 1"
          :unit="p.unit"
          @update:model-value="(v) => set(p.key, v)"
        />
        <BaseSelect
          v-else-if="p.type === 'select'"
          :model-value="String(modelValue[p.key])"
          :options="optionsOf(p)"
          @update:model-value="(v) => set(p.key, v)"
        />
        <div v-else-if="p.type === 'segmented'" class="seg">
          <button
            v-for="o in optionsOf(p)"
            :key="String(o.value)"
            :class="{ on: modelValue[p.key] === o.value }"
            @click="set(p.key, o.value)"
          >
            {{ o.label }}
          </button>
        </div>
        <div v-else class="switch-row">
          <BaseSwitch
            :model-value="Boolean(modelValue[p.key])"
            :label="p.label"
            @update:model-value="(v) => set(p.key, v)"
          />
          <span class="switch-hint">{{ modelValue[p.key] ? '已启用' : '未启用' }}</span>
        </div>
      </div>
      <div class="tip-text">{{ p.tip }}</div>
    </div>
  </div>
</template>

<style scoped>
.pf {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 28px;
}
.field {
  min-width: 0;
}
.field-head {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
}
.tip {
  color: var(--text-3);
  display: grid;
  place-items: center;
  cursor: help;
}
.tip:hover {
  color: var(--text-2);
}
.control {
  min-height: 34px;
  display: flex;
  align-items: center;
}
.seg {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.seg button {
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-2);
  transition: all 0.14s;
}
.seg button:hover {
  color: var(--text-1);
}
.seg button.on {
  background: var(--bg-card);
  color: var(--text-1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.switch-hint {
  font-size: 11.5px;
  color: var(--text-3);
}
.tip-text {
  margin-top: 7px;
  font-size: 10.5px;
  color: var(--text-3);
  line-height: 1.55;
  opacity: 0.85;
}
@media (max-width: 900px) {
  .pf {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
