<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{ modelValue: boolean; title: string; desc?: string; width?: number }>(),
  { desc: '', width: 640 }
)
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

function close() {
  emit('update:modelValue', false)
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
watch(
  () => props.modelValue,
  (v) => {
    if (v) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  }
)
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="modelValue" class="overlay" @mousedown.self="close">
        <aside class="panel" :style="{ width: width + 'px' }">
          <header class="head">
            <div>
              <h3>{{ title }}</h3>
              <p v-if="desc" class="desc">{{ desc }}</p>
            </div>
            <button class="btn btn-subtle btn-icon btn-sm" aria-label="关闭" @click="close">
              <X :size="16" />
            </button>
          </header>
          <div class="body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="foot">
            <slot name="footer" />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 12, 0.55);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}
.panel {
  max-width: 94vw;
  height: 100%;
  background: var(--bg-panel);
  border-left: 1px solid var(--border-strong);
  box-shadow: var(--shadow-pop);
  display: flex;
  flex-direction: column;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid var(--border-subtle);
}
.head h3 {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-1);
}
.desc {
  margin-top: 5px;
  font-size: 12.5px;
  color: var(--text-3);
  line-height: 1.6;
}
.body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-card);
}
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s var(--ease);
}
.drawer-enter-active .panel,
.drawer-leave-active .panel {
  transition: transform 0.24s var(--ease);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .panel,
.drawer-leave-to .panel {
  transform: translateX(24px);
}
</style>
