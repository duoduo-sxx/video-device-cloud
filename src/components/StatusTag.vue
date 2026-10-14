<script setup lang="ts">
import { computed } from 'vue'
import {
  alarmLevelMeta,
  alarmStatusMeta,
  BILL_STATUS,
  INVOICE_STATUS,
  LOG_LEVEL,
  NODE_STATUS,
  onlineStatusMeta,
  PART_STATUS,
  SERVICE_STATUS,
  slaMeta,
  STORAGE_STATUS,
  STORAGE_TYPE,
  taskStatusMeta,
  tenantStatusMeta,
  workOrderStatusMeta,
  type StatusMeta
} from '@/utils/dict'

type Kind =
  | 'online'
  | 'alarmLevel'
  | 'alarmStatus'
  | 'workOrder'
  | 'sla'
  | 'tenant'
  | 'task'
  | 'storageType'
  | 'storageStatus'
  | 'service'
  | 'node'
  | 'log'
  | 'bill'
  | 'invoice'
  | 'part'
  | 'custom'

interface Props {
  status: string | number | boolean
  kind?: Kind
  size?: 'large' | 'default' | 'small'
  effect?: 'dark' | 'light' | 'plain'
  /** kind=custom 时直接指定文案 */
  label?: string
  /** 是否显示状态圆点 */
  dot?: boolean
}

const props = withDefaults(defineProps<Props>(), { kind: 'custom', size: 'small', effect: 'light', dot: false })

const MAPPERS: Record<string, (s: string) => StatusMeta> = {
  online: onlineStatusMeta,
  alarmLevel: alarmLevelMeta,
  alarmStatus: alarmStatusMeta,
  workOrder: workOrderStatusMeta,
  sla: slaMeta,
  tenant: tenantStatusMeta,
  task: taskStatusMeta,
  service: (s) => SERVICE_STATUS[s] || { label: s, type: 'info' },
  node: (s) => NODE_STATUS[s] || { label: s, type: 'info' },
  log: (s) => LOG_LEVEL[s] || { label: s, type: 'info' },
  bill: (s) => BILL_STATUS[s] || { label: s, type: 'info' },
  invoice: (s) => INVOICE_STATUS[s] || { label: s, type: 'info' },
  part: (s) => PART_STATUS[s] || { label: s, type: 'info' }
}

const meta = computed<StatusMeta>(() => {
  const raw = String(props.status)
  if (props.kind === 'storageType') return STORAGE_TYPE[raw] || { label: raw, type: 'info' }
  if (props.kind === 'storageStatus') return STORAGE_STATUS[raw] || { label: raw, type: 'info' }
  if (props.kind === 'custom') {
    return { label: props.label || raw || '-', type: (props.status as any) === true ? 'success' : 'info' }
  }
  const mapper = MAPPERS[props.kind]
  if (mapper) return mapper(raw)
  return { label: props.label || raw || '-', type: 'info' }
})
</script>

<template>
  <el-tag :type="meta.type" :size="size" :effect="effect" round>
    <span v-if="dot" class="dot" :style="{ background: meta.color || 'currentColor' }" />
    {{ meta.label }}
  </el-tag>
</template>

<style scoped>
.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: 1px;
}
</style>
