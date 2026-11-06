<template>
  <div class="page">
    <PageHeader title="消息中心" desc="告警、工单、审批与系统通知统一收口">
      <template #actions>
        <el-button :icon="CircleCheck" :disabled="unread === 0" @click="readAll">全部标为已读</el-button>
      </template>
    </PageHeader>

    <div class="msg-layout">
      <div class="card side">
        <div
          v-for="t in types"
          :key="t.key"
          class="type-item"
          :class="{ active: type === t.key }"
          @click="selectType(t.key)"
        >
          <el-icon :size="15"><component :is="t.icon" /></el-icon>
          <span class="type-name">{{ t.name }}</span>
          <span class="type-count" :class="{ zero: !countOf(t.key) }">{{ countOf(t.key) }}</span>
        </div>
      </div>

      <div class="card flush list-card" v-loading="loading">
        <div v-for="m in list" :key="m.id" class="msg-item" :class="{ unread: !m.read }" @click="open(m)">
          <div class="msg-dot" :class="{ show: !m.read }" />
          <div class="msg-icon" :class="m.type">
            <el-icon :size="15"><component :is="iconOf(m.type)" /></el-icon>
          </div>
          <div class="msg-main">
            <div class="msg-head">
              <span class="msg-title">{{ m.title }}</span>
              <el-tag size="small" effect="plain" type="info">{{ m.typeName }}</el-tag>
            </div>
            <div class="msg-content">{{ m.content }}</div>
          </div>
          <div class="msg-time">{{ fromNow(m.time) }}</div>
        </div>
        <EmptyState v-if="!loading && !list.length" text="暂无消息" desc="新的告警与工单通知会出现在这里" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getMessages, markAllRead, markMessageRead } from '@/api'
import type { Message } from '@/types'
import { fromNow } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const type = ref('all')
const messages = ref<Message[]>([])
const list = computed(() => messages.value.filter((m) => type.value === 'all' || m.type === type.value))
const unread = computed(() => messages.value.filter((m) => !m.read).length)

const types = [
  { key: 'all', name: '全部消息', icon: 'Bell' },
  { key: 'alarm', name: '告警通知', icon: 'Warning' },
  { key: 'ticket', name: '工单动态', icon: 'Tickets' },
  { key: 'approval', name: '审批提醒', icon: 'Stamp' },
  { key: 'system', name: '系统消息', icon: 'Setting' }
]

function iconOf(t: string) {
  return { alarm: 'Warning', ticket: 'Tickets', approval: 'Stamp', system: 'Setting' }[t] ?? 'Bell'
}

function countOf(key: string) {
  return key === 'all' ? messages.value.length : messages.value.filter((m) => m.type === key).length
}

function selectType(key: string) {
  type.value = key
}

async function load() {
  loading.value = true
  messages.value = await getMessages()
  loading.value = false
}

async function open(m: Message) {
  if (!m.read) {
    await markMessageRead(m.id)
    m.read = true
  }
  if (m.link) router.push(m.link)
  else ElMessage.info('该消息暂无关联页面')
}

async function readAll() {
  await markAllRead()
  messages.value.forEach((m) => (m.read = true))
  ElMessage.success('已全部标为已读')
}

onMounted(load)
</script>

<style scoped>
.msg-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.side {
  padding: 10px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--neutral-600);
  cursor: pointer;
}

.type-item:hover {
  background: #f5f8fd;
}

.type-item.active {
  background: #e8f1ff;
  color: var(--brand-600);
  font-weight: 500;
}

.type-name {
  flex: 1;
}

.type-count {
  font-size: 11px;
  color: var(--neutral-400);
  font-variant-numeric: tabular-nums;
}

.type-count.zero {
  color: #c4ccd8;
}

.list-card {
  min-height: 300px;
}

.msg-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px 20px;
  border-bottom: 1px solid var(--divider);
  cursor: pointer;
  position: relative;
}

.msg-item:hover {
  background: #fafcff;
}

.msg-item.unread {
  background: #fbfdff;
}

.msg-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
  margin-top: 14px;
  flex: none;
}

.msg-dot.show {
  background: #1668dc;
}

.msg-icon {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  background: #f1f3f7;
  color: #5b6675;
}

.msg-icon.alarm {
  background: #fdecec;
  color: #dc2626;
}

.msg-icon.ticket {
  background: #e8f1ff;
  color: #1668dc;
}

.msg-icon.approval {
  background: #fef4e6;
  color: #d97706;
}

.msg-icon.system {
  background: #f1f3f7;
  color: #5b6675;
}

.msg-main {
  flex: 1;
  min-width: 0;
}

.msg-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.msg-title {
  font-size: 13px;
  color: var(--neutral-900);
  font-weight: 500;
}

.msg-item.unread .msg-title {
  font-weight: 600;
}

.msg-content {
  font-size: 12.5px;
  color: var(--neutral-600);
  line-height: 1.7;
  margin-top: 4px;
}

.msg-time {
  font-size: 11.5px;
  color: var(--neutral-400);
  flex: none;
  margin-top: 2px;
}
</style>
