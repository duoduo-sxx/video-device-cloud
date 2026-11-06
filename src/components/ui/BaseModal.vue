<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    desc?: string
    width?: number
  }>(),
  { desc: '', width: 520 }
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
    <Transition name="modal">
      <div v-if="modelValue" class="overlay" @mousedown.self="close">
        <div class="dialog" :style="{ width: width + 'px' }" role="dialog" aria-modal="true">
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
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 12, 0.62);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 32px;
}
.dialog {
  max-width: 92vw;
  max-height: 88vh;
  background: var(--bg-panel);
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  box-shadow: var(--shadow-pop);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 20px 16px;
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
  padding: 20px;
  overflow-y: auto;
}
.foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-card);
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s var(--ease);
}
.modal-enter-active .dialog,
.modal-leave-active .dialog {
  transition: transform 0.18s var(--ease);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .dialog,
.modal-leave-to .dialog {
  transform: translateY(8px) scale(0.985);
}
</style>
