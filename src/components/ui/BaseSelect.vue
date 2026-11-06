<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    options: { label: string; value: string | number }[]
    placeholder?: string
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  { placeholder: '请选择', disabled: false, size: 'md' }
)
const emit = defineEmits<{ 'update:modelValue': [string | number] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const btn = ref<HTMLElement | null>(null)
const pos = reactive({ top: 0, left: 0, width: 0, up: false })

const current = computed(() => props.options.find((o) => o.value === props.modelValue))

function place() {
  if (!btn.value) return
  const r = btn.value.getBoundingClientRect()
  const below = window.innerHeight - r.bottom
  const up = below < 220 && r.top > below
  pos.width = Math.max(r.width, 160)
  pos.left = Math.min(r.left, window.innerWidth - pos.width - 12)
  pos.top = up ? r.top - 6 : r.bottom + 6
  pos.up = up
}

function toggle() {
  if (props.disabled) return
  if (!open.value) place()
  open.value = !open.value
}

function choose(v: string | number) {
  emit('update:modelValue', v)
  open.value = false
}

function onDocDown(e: MouseEvent) {
  if (!open.value) return
  const t = e.target as Node
  if (root.value?.contains(t)) return
  if ((e.target as HTMLElement).closest('.vc-select-pop')) return
  open.value = false
}
function onScroll() {
  if (open.value) open.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', onDocDown)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocDown)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <div ref="root" class="sel" :class="{ disabled, sm: size === 'sm' }">
    <button ref="btn" type="button" class="sel-btn" :disabled="disabled" @click="toggle">
      <span class="txt" :class="{ ph: !current }">{{ current?.label ?? placeholder }}</span>
      <ChevronDown :size="14" class="chev" :class="{ rot: open }" />
    </button>
    <Teleport to="body">
      <Transition name="pop">
        <div
          v-if="open"
          class="vc-select-pop"
          :style="{
            top: pos.top + 'px',
            left: pos.left + 'px',
            width: pos.width + 'px',
            transform: pos.up ? 'translateY(-100%)' : 'none'
          }"
        >
          <div
            v-for="o in options"
            :key="String(o.value)"
            class="opt"
            :class="{ active: o.value === modelValue }"
            @click="choose(o.value)"
          >
            <span class="ellipsis">{{ o.label }}</span>
            <Check v-if="o.value === modelValue" :size="14" class="tick" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.sel {
  width: 100%;
}
.sel-btn {
  width: 100%;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 10px 0 12px;
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: var(--r-input);
  font-size: 13px;
  color: var(--text-1);
  transition: border-color 0.14s;
}
.sel-btn:hover:not(:disabled) {
  border-color: var(--border-strong);
}
.sel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sm .sel-btn {
  height: 28px;
  font-size: 12px;
}
.txt {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.txt.ph {
  color: var(--text-3);
}
.chev {
  color: var(--text-3);
  flex: none;
  transition: transform 0.16s var(--ease);
}
.chev.rot {
  transform: rotate(180deg);
}
.opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-2);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.opt:hover {
  background: var(--bg-card-hover);
  color: var(--text-1);
}
.opt.active {
  color: var(--primary);
  background: var(--primary-soft);
}
.tick {
  flex: none;
}
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.13s var(--ease), margin 0.13s var(--ease);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
}
</style>

<style>
.vc-select-pop {
  position: fixed;
  z-index: 2000;
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  box-shadow: var(--shadow-pop);
  padding: 5px;
  max-height: 260px;
  overflow-y: auto;
}
</style>
