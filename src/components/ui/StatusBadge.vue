<script setup lang="ts">
import { computed } from 'vue'

type Kind = 'task' | 'ticket' | 'node' | 'asset'
const props = withDefaults(defineProps<{ status: string; kind?: Kind; pulse?: boolean }>(), {
  kind: 'task',
  pulse: false
})

const map: Record<string, { color: string; bg: string }> = {
  排队中: { color: 'var(--text-2)', bg: 'rgba(152,162,184,0.12)' },
  等待调度: { color: 'var(--text-2)', bg: 'rgba(152,162,184,0.12)' },
  处理中: { color: 'var(--primary)', bg: 'var(--primary-soft)' },
  运行中: { color: 'var(--primary)', bg: 'var(--primary-soft)' },
  已暂停: { color: 'var(--warning)', bg: 'var(--warning-soft)' },
  已完成: { color: 'var(--success)', bg: 'var(--success-soft)' },
  失败: { color: 'var(--danger)', bg: 'var(--danger-soft)' },
  已取消: { color: 'var(--text-3)', bg: 'rgba(94,104,124,0.1)' },
  待受理: { color: 'var(--warning)', bg: 'var(--warning-soft)' },
  待确认: { color: 'var(--purple)', bg: 'var(--purple-soft)' },
  已解决: { color: 'var(--success)', bg: 'var(--success-soft)' },
  已关闭: { color: 'var(--text-3)', bg: 'rgba(94,104,124,0.1)' },
  正常: { color: 'var(--success)', bg: 'var(--success-soft)' },
  告警: { color: 'var(--warning)', bg: 'var(--warning-soft)' },
  维护: { color: 'var(--text-2)', bg: 'rgba(152,162,184,0.12)' },
  ready: { color: 'var(--success)', bg: 'var(--success-soft)' },
  uploading: { color: 'var(--primary)', bg: 'var(--primary-soft)' },
  analyzing: { color: 'var(--purple)', bg: 'var(--purple-soft)' },
  error: { color: 'var(--danger)', bg: 'var(--danger-soft)' }
}

const style = computed(() => map[props.status] ?? { color: 'var(--text-2)', bg: 'rgba(152,162,184,0.12)' })
const animated = computed(() => props.pulse || props.status === '处理中' || props.status === '运行中' || props.status === 'uploading')
</script>

<template>
  <span
    class="status"
    :style="{ color: style.color, background: style.bg }"
  >
    <i class="dot" :class="{ breathe: animated }" :style="{ background: style.color }" />
    {{ status }}
  </span>
</template>

<style scoped>
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 9px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
}
.breathe {
  animation: breathe 1.8s var(--ease) infinite;
}
@keyframes breathe {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.82);
  }
}
</style>
