<script setup lang="ts">
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const icons = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info }
const colors = {
  success: 'var(--success)',
  error: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--primary)'
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-host">
      <TransitionGroup name="toast">
        <div v-for="t in app.toasts" :key="t.id" class="toast">
          <component :is="icons[t.type]" :size="16" :style="{ color: colors[t.type] }" class="ic" />
          <div class="content">
            <div class="title">{{ t.title }}</div>
            <div v-if="t.desc" class="desc">{{ t.desc }}</div>
          </div>
          <button class="btn btn-subtle btn-icon btn-sm close" aria-label="关闭" @click="app.dismissToast(t.id)">
            <X :size="13" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 68px;
  right: 20px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 340px;
  padding: 12px 12px 12px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  box-shadow: var(--shadow-pop);
}
.ic {
  flex: none;
  margin-top: 2px;
}
.content {
  flex: 1;
  min-width: 0;
}
.title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
  line-height: 1.4;
}
.desc {
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.5;
}
.close {
  margin-top: -2px;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s var(--ease);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
