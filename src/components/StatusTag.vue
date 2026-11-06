<template>
  <span class="status-tag" :style="style">
    <span class="dot" :style="{ background: style.color }" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ALARM_LEVEL, ALARM_STATUS, CLUSTER_STATUS, DEVICE_STATUS, POOL_STATUS, PRIORITY, TICKET_STATUS, type Tone } from '@/constants'

const props = defineProps<{ kind?: string; value?: string | number | null; label?: string; tone?: Tone }>()

const TONE_STYLE: Record<string, { color: string; bg: string }> = {
  primary: { color: '#1668DC', bg: '#E8F1FF' },
  success: { color: '#16A34A', bg: '#E8F7EE' },
  warning: { color: '#D97706', bg: '#FEF4E6' },
  danger: { color: '#DC2626', bg: '#FDECEC' },
  neutral: { color: '#5B6675', bg: '#F1F3F7' },
  cyan: { color: '#0E9292', bg: '#E6F8F8' },
  purple: { color: '#6D4AE0', bg: '#F0ECFE' }
}

const EXTRA: Record<string, Record<string, { label: string; tone: Tone }>> = {
  contract: {
    gold: { label: '黄金级', tone: 'warning' },
    silver: { label: '白银级', tone: 'neutral' },
    bronze: { label: '青铜级', tone: 'purple' },
    active: { label: '生效中', tone: 'success' },
    expiring: { label: '即将到期', tone: 'warning' },
    expired: { label: '已到期', tone: 'danger' }
  },
  spare: {
    normal: { label: '库存正常', tone: 'success' },
    low: { label: '库存偏低', tone: 'warning' },
    out: { label: '已缺货', tone: 'danger' }
  },
  change: {
    approving: { label: '审批中', tone: 'warning' },
    approved: { label: '已审批', tone: 'primary' },
    implementing: { label: '实施中', tone: 'cyan' },
    verifying: { label: '验证中', tone: 'purple' },
    closed: { label: '已关闭', tone: 'success' }
  },
  inspection: {
    done: { label: '已完成', tone: 'success' },
    running: { label: '执行中', tone: 'primary' },
    pending: { label: '待执行', tone: 'neutral' }
  },
  user: {
    active: { label: '启用', tone: 'success' },
    disabled: { label: '停用', tone: 'neutral' }
  },
  result: {
    success: { label: '成功', tone: 'success' },
    fail: { label: '失败', tone: 'danger' }
  }
}

const MAPS: Record<string, Record<string, { label: string; tone: Tone }>> = {
  ticket: TICKET_STATUS,
  priority: PRIORITY,
  alarmLevel: ALARM_LEVEL,
  alarmStatus: ALARM_STATUS,
  device: DEVICE_STATUS,
  pool: POOL_STATUS,
  cluster: CLUSTER_STATUS,
  ...EXTRA
}

const resolved = computed(() => {
  const key = props.kind ?? ''
  const value = String(props.value ?? '')
  const found = MAPS[key]?.[value]
  return { label: props.label ?? found?.label ?? value ?? '--', tone: (props.tone ?? found?.tone ?? 'neutral') as Tone }
})

const label = computed(() => resolved.value.label)
const style = computed(() => {
  const s = TONE_STYLE[resolved.value.tone] ?? TONE_STYLE.neutral
  return { color: s.color, background: s.bg }
})
</script>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 7px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex: none;
}
</style>
