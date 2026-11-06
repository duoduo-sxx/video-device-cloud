<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AlertCircle, ArrowUpRight, Paperclip, Plus, Search, Send, User } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { formatDateTime, fromNow } from '@/composables/useFormat'
import type { Ticket } from '@/types'

const data = useDataStore()
const app = useAppStore()
const route = useRoute()

const activeId = ref<string>(data.tickets[0]?.id ?? '')
const filter = ref<'all' | 'open' | 'closed'>('all')
const keyword = ref('')
const reply = ref('')
const thread = ref<HTMLElement | null>(null)
const creating = ref(false)

const newTicket = ref({
  title: '',
  type: '画质异常' as Ticket['type'],
  priority: '中' as Ticket['priority'],
  relatedTaskId: '',
  content: '',
  contact: ''
})

const types = ['画质异常', '任务失败', '性能问题', '账号权限', '其他'].map((v) => ({ label: v, value: v }))
const priorities = ['低', '中', '高', '紧急'].map((v) => ({ label: v, value: v }))
const taskOptions = computed(() => [
  { label: '不关联任务', value: '' },
  ...data.tasks.slice(0, 10).map((t) => ({ label: `${t.id} · ${t.assetName.slice(0, 18)}`, value: t.id }))
])

const list = computed(() =>
  data.tickets.filter((t) => {
    if (filter.value === 'open') return t.status !== '已解决' && t.status !== '已关闭'
    if (filter.value === 'closed') return t.status === '已解决' || t.status === '已关闭'
    return true
  }).filter((t) => {
    const kw = keyword.value.trim()
    return !kw || t.title.includes(kw) || t.id.includes(kw)
  })
)

const active = computed(() => data.tickets.find((t) => t.id === activeId.value) ?? list.value[0])

const priorityTint: Record<string, string> = {
  低: 'var(--text-3)',
  中: 'var(--primary)',
  高: 'var(--warning)',
  紧急: 'var(--danger)'
}

function send() {
  if (!active.value || !reply.value.trim()) return
  data.replyTicket(active.value.id, reply.value)
  reply.value = ''
  app.toast('success', '已发送', '工程师将在 30 分钟内回复')
  nextTick(() => {
    if (thread.value) thread.value.scrollTop = thread.value.scrollHeight
  })
}

function submitTicket() {
  if (!newTicket.value.title.trim() || !newTicket.value.content.trim()) {
    app.toast('warning', '请补全信息', '标题与问题描述为必填项')
    return
  }
  const t = data.createTicket({
    title: newTicket.value.title,
    type: newTicket.value.type,
    priority: newTicket.value.priority,
    content: newTicket.value.content,
    relatedTaskId: newTicket.value.relatedTaskId || undefined,
    contact: newTicket.value.contact
  })
  activeId.value = t.id
  creating.value = false
  newTicket.value = { title: '', type: '画质异常', priority: '中', relatedTaskId: '', content: '', contact: '' }
  app.toast('success', '工单已提交', `${t.id} 已进入受理队列`)
}

watch(active, () => {
  nextTick(() => {
    if (thread.value) thread.value.scrollTop = thread.value.scrollHeight
  })
})

onMounted(() => {
  if (route.query.new === '1') creating.value = true
  nextTick(() => {
    if (thread.value) thread.value.scrollTop = thread.value.scrollHeight
  })
})
</script>

<template>
  <div class="page tickets-page">
    <PageHeader title="服务工单" desc="提交问题、跟踪处理进度，与技术支持工程师直接沟通">
      <button class="btn btn-primary" @click="creating = true"><Plus :size="14" /> 提交工单</button>
    </PageHeader>

    <div class="layout">
      <aside class="list-col">
        <div class="list-head">
          <div class="search">
            <Search :size="13" />
            <input v-model="keyword" placeholder="搜索工单标题或编号" />
          </div>
          <div class="filters">
            <button :class="{ on: filter === 'all' }" @click="filter = 'all'">全部 {{ data.tickets.length }}</button>
            <button :class="{ on: filter === 'open' }" @click="filter = 'open'">
              处理中 {{ data.tickets.filter((t) => t.status !== '已解决' && t.status !== '已关闭').length }}
            </button>
            <button :class="{ on: filter === 'closed' }" @click="filter = 'closed'">已关闭</button>
          </div>
        </div>

        <div class="list">
          <button
            v-for="t in list"
            :key="t.id"
            class="ticket"
            :class="{ on: active?.id === t.id }"
            @click="activeId = t.id"
          >
            <div class="t-top">
              <span class="t-id mono">{{ t.id }}</span>
              <span class="t-pri" :style="{ color: priorityTint[t.priority] }">{{ t.priority }}</span>
            </div>
            <div class="t-title ellipsis">{{ t.title }}</div>
            <div class="t-meta">
              <span class="tag" :class="t.status === '处理中' ? 'tag-primary' : t.status === '已解决' ? 'tag-success' : t.status === '待受理' ? 'tag-warning' : ''">
                {{ t.status }}
              </span>
              <span class="t-type">{{ t.type }}</span>
              <span class="spacer" />
              <span class="t-time">{{ fromNow(t.updatedAt) }}</span>
            </div>
          </button>
          <div v-if="!list.length" class="no-ticket">没有匹配的工单</div>
        </div>
      </aside>

      <section v-if="active" class="thread-col card">
        <header class="th-head">
          <div class="th-main">
            <div class="th-title">{{ active.title }}</div>
            <div class="th-meta">
              <span class="mono">{{ active.id }}</span>
              <i class="sep" />
              <span>{{ active.type }}</span>
              <i class="sep" />
              <span>创建于 {{ formatDateTime(active.createdAt) }}</span>
              <i class="sep" />
              <span class="pri" :style="{ color: priorityTint[active.priority] }">{{ active.priority }}优先级</span>
            </div>
          </div>
          <span class="status-pill" :class="active.status === '处理中' ? 'go' : active.status === '已解决' ? 'ok' : ''">
            {{ active.status }}
          </span>
        </header>

        <div ref="thread" class="th-body">
          <div v-for="m in active.messages" :key="m.id" class="msg" :class="m.from">
            <div class="avatar" :class="m.from">{{ m.from === 'user' ? m.name.slice(-1) : '工程师' }}</div>
            <div class="bubble-wrap">
              <div class="m-head">
                <span class="m-name">{{ m.name }}</span>
                <span class="m-role">{{ m.role }}</span>
                <span class="m-time">{{ formatDateTime(m.time) }}</span>
              </div>
              <div class="bubble">{{ m.content }}</div>
              <div v-if="m.attachments" class="atts">
                <div v-for="a in m.attachments" :key="a.name" class="att">
                  <Paperclip :size="11" />
                  <span class="ellipsis">{{ a.name }}</span>
                  <span class="t3">{{ (a.size / 1024).toFixed(0) }} KB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="th-foot">
          <textarea
            v-model="reply"
            class="input reply-input"
            rows="2"
            placeholder="补充说明或提供更多信息，Enter 发送，Shift + Enter 换行"
            @keydown.enter.exact.prevent="send"
          />
          <div class="foot-bar">
            <button class="btn btn-subtle btn-sm" @click="app.toast('info', '附件上传', '支持日志、截图，单个不超过 20MB')">
              <Paperclip :size="13" /> 附件
            </button>
            <span class="spacer" />
            <button class="btn btn-primary btn-sm" :disabled="!reply.trim()" @click="send">
              <Send :size="13" /> 发送
            </button>
          </div>
        </footer>
      </section>

      <EmptyState v-else class="card" title="选择一个工单" desc="从左侧列表选择工单查看沟通记录" />
    </div>

    <BaseModal v-model="creating" title="提交服务工单" desc="描述越具体，定位越快。建议附上任务 ID 与日志。" :width="560">
      <div class="form">
        <div class="field">
          <label class="label">问题标题</label>
          <input v-model="newTicket.title" class="input" placeholder="例如：4K 超分任务持续显存溢出" />
        </div>
        <div class="form-row">
          <div class="field">
            <label class="label">问题类型</label>
            <BaseSelect v-model="newTicket.type" :options="types" />
          </div>
          <div class="field">
            <label class="label">优先级</label>
            <BaseSelect v-model="newTicket.priority" :options="priorities" />
          </div>
        </div>
        <div class="field">
          <label class="label">关联任务（可选）</label>
          <BaseSelect v-model="newTicket.relatedTaskId" :options="taskOptions" />
        </div>
        <div class="field">
          <label class="label">问题描述</label>
          <textarea
            v-model="newTicket.content"
            class="input"
            rows="4"
            placeholder="请描述现象、复现步骤、期望结果。例如：720p 夜间监控素材用 4x 超分后出现横纹，源文件已上传至素材库 AST-0002。"
          />
        </div>
        <div class="field">
          <label class="label">联系电话（可选）</label>
          <input v-model="newTicket.contact" class="input" placeholder="紧急问题我们会电话联系" />
        </div>
        <div class="tip">
          <AlertCircle :size="13" />
          紧急工单响应时间约 15 分钟，普通工单约 30 分钟（工作日 9:00–21:00）。
        </div>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="creating = false">取消</button>
        <button class="btn btn-primary" @click="submitTicket">提交工单</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.tickets-page {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.layout {
  flex: 1;
  display: grid;
  grid-template-columns: 356px minmax(0, 1fr);
  gap: 14px;
  min-height: 0;
}
.list-col {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  background: var(--bg-card);
  overflow: hidden;
  min-height: 0;
}
.list-head {
  padding: 12px;
  border-bottom: 1px solid var(--border-subtle);
  flex: none;
}
.search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 10px;
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text-3);
}
.search input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 12px;
  color: var(--text-1);
}
.search input::placeholder {
  color: var(--text-3);
}
.filters {
  display: flex;
  gap: 4px;
  margin-top: 9px;
}
.filters button {
  font-size: 10.5px;
  color: var(--text-3);
  padding: 3px 8px;
  border-radius: 5px;
}
.filters button:hover {
  background: var(--bg-card-hover);
}
.filters button.on {
  background: var(--bg-inset);
  color: var(--text-1);
}
.list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}
.ticket {
  width: 100%;
  text-align: left;
  padding: 10px 11px;
  border-radius: 8px;
  margin-bottom: 2px;
  border: 1px solid transparent;
}
.ticket:hover {
  background: var(--bg-card-hover);
}
.ticket.on {
  background: var(--primary-soft);
  border-color: var(--primary-soft-2);
}
.t-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.t-id {
  font-size: 10px;
  color: var(--text-3);
}
.t-pri {
  font-size: 10px;
  font-weight: 500;
}
.t-title {
  font-size: 12.5px;
  color: var(--text-1);
  margin-top: 4px;
}
.t-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 7px;
}
.t-type {
  font-size: 10px;
  color: var(--text-3);
}
.spacer {
  flex: 1;
}
.t-time {
  font-size: 10px;
  color: var(--text-3);
}
.no-ticket {
  padding: 30px;
  text-align: center;
  font-size: 11.5px;
  color: var(--text-3);
}
.thread-col {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.th-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-subtle);
  flex: none;
}
.th-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-1);
}
.th-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 6px;
  font-size: 10.5px;
  color: var(--text-3);
  flex-wrap: wrap;
}
.sep {
  width: 1px;
  height: 9px;
  background: var(--border-strong);
}
.pri {
  font-weight: 500;
}
.status-pill {
  font-size: 10.5px;
  color: var(--text-2);
  background: var(--bg-inset);
  border-radius: 4px;
  padding: 2px 8px;
  flex: none;
}
.status-pill.go {
  color: var(--primary);
  background: var(--primary-soft);
}
.status-pill.ok {
  color: var(--success);
  background: var(--success-soft);
}
.th-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
}
.msg {
  display: flex;
  gap: 10px;
  max-width: 88%;
}
.msg.user {
  flex-direction: row-reverse;
  align-self: flex-end;
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 9.5px;
  font-weight: 500;
  flex: none;
}
.avatar.engineer {
  background: var(--primary-soft);
  color: var(--primary);
}
.avatar.user {
  background: linear-gradient(135deg, #2c3a5e, #1c2438);
  color: #e8ecf4;
}
.bubble-wrap {
  min-width: 0;
}
.m-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 5px;
}
.msg.user .m-head {
  flex-direction: row-reverse;
}
.m-name {
  font-size: 11.5px;
  color: var(--text-1);
  font-weight: 500;
}
.m-role {
  font-size: 9.5px;
  color: var(--text-3);
  background: var(--bg-inset);
  border-radius: 3px;
  padding: 1px 5px;
}
.m-time {
  font-size: 9.5px;
  color: var(--text-3);
}
.bubble {
  padding: 10px 13px;
  border-radius: 10px;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--text-1);
  background: var(--bg-card-hover);
  border: 1px solid var(--border-subtle);
  white-space: pre-wrap;
}
.msg.user .bubble {
  background: var(--primary-soft);
  border-color: var(--primary-soft-2);
  border-top-right-radius: 3px;
}
.msg.engineer .bubble {
  border-top-left-radius: 3px;
}
.atts {
  display: flex;
  gap: 6px;
  margin-top: 7px;
  flex-wrap: wrap;
}
.att {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--text-2);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 3px 7px;
  max-width: 260px;
}
.att .t3 {
  font-size: 9px;
}
.th-foot {
  flex: none;
  padding: 12px 16px 14px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-panel);
}
.reply-input {
  height: 62px;
  font-size: 12.5px;
}
.foot-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.tip {
  display: flex;
  gap: 7px;
  padding: 10px 12px;
  background: var(--warning-soft);
  border-radius: 7px;
  font-size: 11px;
  color: var(--text-2);
  line-height: 1.6;
}
.tip svg {
  color: var(--warning);
  flex: none;
  margin-top: 1px;
}
@media (max-width: 1200px) {
  .layout {
    grid-template-columns: 300px minmax(0, 1fr);
  }
}
</style>
