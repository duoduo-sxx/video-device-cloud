<template>
  <div class="page" v-loading="loading">
    <div class="back-row">
      <el-button link :icon="ArrowLeft" @click="router.push('/service/tickets')">返回工单列表</el-button>
    </div>

    <div class="card head-card" v-if="ticket">
      <div class="head-main">
        <div class="id-line">
          <span class="mono ticket-id">{{ ticket.id }}</span>
          <StatusTag kind="ticket" :value="ticket.status" />
          <StatusTag kind="priority" :value="ticket.priority" />
          <span class="tiny muted">来源：{{ ticket.sourceName }}</span>
        </div>
        <h2>{{ ticket.title }}</h2>
        <div class="meta-line">
          <span>{{ ticket.customerName }}</span>
          <span class="dot" />
          <span>{{ ticket.serviceItem }}</span>
          <span class="dot" />
          <span>{{ ticket.assignee ? `处理人 ${ticket.assignee}` : '未分配' }}</span>
          <span class="dot" />
          <span>创建于 {{ formatDateTime(ticket.createdAt) }}</span>
        </div>
      </div>
      <div class="head-actions">
        <el-button v-if="ticket.status === 'pending'" type="primary" :icon="CircleCheck" @click="doAccept">受理</el-button>
        <el-button v-if="ticket.status === 'assigned'" type="primary" :icon="Share" @click="assignVisible = true">派单</el-button>
        <template v-if="ticket.status === 'processing'">
          <el-button type="success" :icon="Select" @click="resolveVisible = true">标记解决</el-button>
          <el-button :icon="VideoPause" @click="suspendVisible = true">挂起</el-button>
        </template>
        <el-button v-if="ticket.status === 'suspended'" type="primary" :icon="VideoPlay" @click="doResume">恢复处理</el-button>
        <el-button v-if="ticket.status === 'resolved'" type="success" :icon="CircleCheck" @click="closeVisible = true">验收并关闭</el-button>
        <el-button v-if="ticket.status === 'processing'" :icon="Clock" @click="workVisible = true">登记工时</el-button>
      </div>
    </div>

    <div class="layout" v-if="ticket">
      <div class="main-col">
        <div class="card">
          <div class="card-head"><div class="card-title">问题描述</div></div>
          <div class="desc-text">{{ ticket.description }}</div>
          <div v-if="ticket.resourceNames.length" class="resource-row">
            <span class="tiny muted">关联资源</span>
            <el-tag v-for="n in ticket.resourceNames" :key="n" size="small" effect="plain" class="res-tag">{{ n }}</el-tag>
          </div>
          <div v-if="ticket.solution" class="solution">
            <div class="solution-title">解决方案</div>
            <div class="desc-text">{{ ticket.solution }}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-title">处理时间线 <span class="sub">{{ ticket.timeline.length }} 条记录</span></div>
            <el-button link type="primary" v-if="['processing', 'assigned'].includes(ticket.status)" @click="addNote">添加处理记录</el-button>
          </div>
          <el-timeline class="timeline">
            <el-timeline-item
              v-for="(item, idx) in [...ticket.timeline].reverse()"
              :key="idx"
              :timestamp="formatDateTime(item.time)"
              :color="idx === 0 ? '#1668DC' : '#C9D3E0'"
              placement="top"
            >
              <div class="tl-head">
                <b>{{ item.actor }}</b>
                <span class="tl-action">{{ item.action }}</span>
                <span v-if="item.cost" class="tl-cost">{{ item.cost }}</span>
              </div>
              <div class="tl-remark">{{ item.remark }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="card" v-if="ticket.attachments.length">
          <div class="card-head"><div class="card-title">附件 <span class="sub">{{ ticket.attachments.length }} 个</span></div></div>
          <div class="attach-list">
            <div v-for="a in ticket.attachments" :key="a.name" class="attach-item">
              <el-icon :size="16" color="#8A94A6"><Document /></el-icon>
              <div class="attach-main">
                <div class="attach-name">{{ a.name }}</div>
                <div class="tiny muted">{{ a.size }} · {{ a.uploader }} · {{ formatDateTime(a.time) }}</div>
              </div>
              <el-button link type="primary" size="small">下载</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="side-col">
        <div class="card sla-card">
          <div class="card-head"><div class="card-title">SLA 计时</div><span class="tiny muted">{{ ticket.contractId || '无合同' }}</span></div>

          <div class="sla-block">
            <div class="sla-head">
              <span>响应时限</span>
              <b :class="slaState('response').tone">{{ slaState('response').text }}</b>
            </div>
            <el-progress :percentage="slaState('response').percent" :stroke-width="6" :show-text="false" :color="slaState('response').color" />
            <div class="tiny muted sla-foot">
              要求 {{ formatDateTime(ticket.responseDue) }} 前响应
              <span v-if="ticket.respondedAt">· 实际 {{ formatDateTime(ticket.respondedAt) }}</span>
            </div>
          </div>

          <div class="sla-block">
            <div class="sla-head">
              <span>解决时限</span>
              <b :class="slaState('resolve').tone">{{ slaState('resolve').text }}</b>
            </div>
            <el-progress :percentage="slaState('resolve').percent" :stroke-width="6" :show-text="false" :color="slaState('resolve').color" />
            <div class="tiny muted sla-foot">
              要求 {{ formatDateTime(ticket.resolveDue) }} 前解决
              <span v-if="ticket.resolvedAt">· 实际 {{ formatDateTime(ticket.resolvedAt) }}</span>
            </div>
          </div>

          <div class="sla-result">
            <div class="sr-item">
              <span>响应达成</span>
              <StatusTag :tone="ticket.slaResponseOk ? 'success' : 'danger'" :label="ticket.slaResponseOk ? '达成' : '超时'" />
            </div>
            <div class="sr-item">
              <span>解决达成</span>
              <StatusTag v-if="ticket.slaResolveOk !== null" :tone="ticket.slaResolveOk ? 'success' : 'danger'" :label="ticket.slaResolveOk ? '达成' : '超时'" />
              <StatusTag v-else tone="neutral" label="计时中" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><div class="card-title">处理信息</div></div>
          <div class="info-row"><span>客户</span><b>{{ ticket.customerName }}</b></div>
          <div class="info-row"><span>联系人</span><b>{{ ticket.contact }}</b></div>
          <div class="info-row"><span>处理人</span><b>{{ ticket.assignee || '待分配' }}</b></div>
          <div class="info-row"><span>处理组</span><b>{{ ticket.assigneeGroup || '--' }}</b></div>
          <div class="info-row"><span>累计工时</span><b>{{ ticket.workHours }} h</b></div>
          <div class="info-row"><span>创建人</span><b>{{ ticket.creator }}</b></div>
        </div>

        <div class="card">
          <div class="card-head"><div class="card-title">满意度</div></div>
          <div v-if="ticket.satisfaction" class="sat-box">
            <el-rate :model-value="ticket.satisfaction" disabled />
            <div class="sat-tags">
              <el-tag v-for="t in ticket.satisfactionTags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
            </div>
            <div v-if="ticket.satisfactionComment" class="sat-comment">{{ ticket.satisfactionComment }}</div>
          </div>
          <div v-else class="tiny muted">客户验收后可评价，当前暂未评价。</div>
        </div>

        <div class="card">
          <div class="card-head"><div class="card-title">推荐知识</div></div>
          <div class="kb-list">
            <div v-for="k in relatedKb" :key="k.id" class="kb-item" @click="router.push(`/service/knowledge/${k.id}`)">
              <div class="kb-title">{{ k.title }}</div>
              <div class="tiny muted">{{ k.categoryName }} · {{ k.views }} 次浏览</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="assignVisible" title="派单" width="420px">
      <el-form label-position="top">
        <el-form-item label="处理人">
          <el-select v-model="assignForm.assignee" filterable style="width: 100%">
            <el-option v-for="e in engineers" :key="e.name" :label="`${e.name} · ${e.department}`" :value="e.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理组">
          <el-select v-model="assignForm.group" style="width: 100%">
            <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="doAssign">确认派单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resolveVisible" title="标记解决" width="520px">
      <el-form label-position="top">
        <el-form-item label="解决方案（将记录到时间线并同步客户）">
          <el-input v-model="resolveText" type="textarea" :rows="5" placeholder="描述根因、处置动作与验证结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveVisible = false">取消</el-button>
        <el-button type="primary" @click="doResolve">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="suspendVisible" title="挂起工单" width="440px">
      <el-input v-model="suspendReason" type="textarea" :rows="3" placeholder="挂起原因，如：等待客户确认变更窗口" />
      <template #footer>
        <el-button @click="suspendVisible = false">取消</el-button>
        <el-button type="primary" @click="doSuspend">确认挂起</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="workVisible" title="登记工时" width="440px">
      <el-form label-position="top">
        <el-form-item label="工时（小时）">
          <el-input-number v-model="workHour" :min="0.5" :max="24" :step="0.5" style="width: 100%" />
        </el-form-item>
        <el-form-item label="工作内容">
          <el-input v-model="workContent" type="textarea" :rows="3" placeholder="本次投入的工作内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="workVisible = false">取消</el-button>
        <el-button type="primary" @click="doWork">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="closeVisible" title="验收并关闭工单" width="480px">
      <div class="close-tip">请确认问题已解决并完成业务验证，关闭后工单不可再次流转。</div>
      <el-form label-position="top">
        <el-form-item label="满意度评价">
          <el-rate v-model="rateForm.score" show-text :texts="['很不满意', '不满意', '一般', '满意', '非常满意']" />
        </el-form-item>
        <el-form-item label="评价标签">
          <el-checkbox-group v-model="rateForm.tags">
            <el-checkbox v-for="t in rateTags" :key="t" :value="t">{{ t }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input v-model="rateForm.comment" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeVisible = false">取消</el-button>
        <el-button type="primary" @click="doClose">确认关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, CircleCheck, Clock, Document, Select, Share, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import {
  acceptTicket, addWorkHour, assignTicket, closeTicket, getKnowledgeList, getTicket, getUsers,
  resolveTicket, resumeTicket, rateTicket, suspendTicket
} from '@/api'
import type { KnowledgeArticle, Ticket, User } from '@/types'
import { dayjs, formatDateTime, remainText } from '@/utils/format'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const loading = ref(true)
const ticket = ref<Ticket>()
const relatedKb = ref<KnowledgeArticle[]>([])
const engineers = ref<User[]>([])
const now = ref(Date.now())

const assignVisible = ref(false)
const resolveVisible = ref(false)
const suspendVisible = ref(false)
const workVisible = ref(false)
const closeVisible = ref(false)

const assignForm = reactive({ assignee: '陈立', group: '存储一线' })
const resolveText = ref('定位为存储池快照占用过高，已清理过期快照并扩充容量，业务指标恢复正常，观察 24 小时无反复。')
const suspendReason = ref('等待客户确认变更实施窗口。')
const workHour = ref(1)
const workContent = ref('远程排查与指标核查')
const rateForm = reactive({ score: 5, tags: ['响应及时', '技术专业'] as string[] })
const rateTags = ['响应及时', '技术专业', '态度好', '解决彻底', '沟通顺畅']

const groups = ['存储一线', '存储二线', '容灾与备份组', '驻场服务组']

function slaState(type: 'response' | 'resolve') {
  const t = ticket.value
  if (!t) return { percent: 0, text: '--', tone: 'ok', color: '#1668DC' }
  const start = dayjs(t.createdAt).valueOf()
  const due = dayjs(type === 'response' ? t.responseDue : t.resolveDue).valueOf()
  const actual = type === 'response' ? t.respondedAt : t.resolvedAt
  const end = actual ? dayjs(actual).valueOf() : now.value
  const total = Math.max(1, due - start)
  const used = Math.min(total, Math.max(0, end - start))
  const percent = Math.round((used / total) * 100)
  const remaining = due - end
  if (actual) {
    const ok = end <= due
    return { percent: 100, text: ok ? '已达成' : '已超时', tone: ok ? 'ok' : 'bad', color: ok ? '#16A34A' : '#E5484D' }
  }
  if (remaining <= 0) return { percent: 100, text: `超时 ${remainText(remaining)}`, tone: 'bad', color: '#E5484D' }
  return {
    percent,
    text: `剩 ${remainText(remaining)}`,
    tone: percent > 80 ? 'warn' : 'ok',
    color: percent > 80 ? '#F59E0B' : '#1668DC'
  }
}

async function load() {
  loading.value = true
  ticket.value = await getTicket(String(route.params.id))
  const kb = await getKnowledgeList({ page: 1, pageSize: 3 })
  relatedKb.value = kb.list
  loading.value = false
}

async function refresh() {
  ticket.value = await getTicket(String(route.params.id))
}

async function doAccept() {
  await acceptTicket(ticket.value!.id, store.user?.name)
  ElMessage.success('工单已受理，等待派单')
  await refresh()
}

async function doAssign() {
  await assignTicket(ticket.value!.id, assignForm.assignee, assignForm.group)
  assignVisible.value = false
  ElMessage.success(`已派单给 ${assignForm.assignee}`)
  await refresh()
}

async function doResolve() {
  if (!resolveText.value.trim()) {
    ElMessage.warning('请填写解决方案')
    return
  }
  await resolveTicket(ticket.value!.id, resolveText.value)
  resolveVisible.value = false
  ElMessage.success('工单已标记解决，等待客户验收')
  await refresh()
}

async function doSuspend() {
  await suspendTicket(ticket.value!.id, suspendReason.value)
  suspendVisible.value = false
  ElMessage.success('工单已挂起')
  await refresh()
}

async function doResume() {
  await resumeTicket(ticket.value!.id)
  ElMessage.success('已恢复处理')
  await refresh()
}

async function doWork() {
  await addWorkHour(ticket.value!.id, workHour.value, workContent.value)
  workVisible.value = false
  ElMessage.success('工时已登记')
  await refresh()
}

async function doClose() {
  await closeTicket(ticket.value!.id, store.user?.name, rateForm.score, rateForm.tags, rateForm.comment)
  closeVisible.value = false
  ElMessage.success('工单已关闭')
  await refresh()
}

async function addNote() {
  const { value } = await ElMessageBox.prompt('请输入处理记录内容', '添加处理记录', {
    inputType: 'textarea',
    confirmButtonText: '提交'
  }).catch(() => ({ value: '' }))
  if (!value) return
  await addWorkHour(ticket.value!.id, 0.5, value)
  await refresh()
  ElMessage.success('已添加处理记录')
}

let timer: number | undefined
onMounted(async () => {
  await load()
  const users = await getUsers({ role: 'engineer', pageSize: 50 })
  engineers.value = users.list
  timer = window.setInterval(() => (now.value = Date.now()), 30_000)
})
onUnmounted(() => window.clearInterval(timer))
</script>

<style scoped>
.back-row {
  margin-bottom: -8px;
}

.head-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.id-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ticket-id {
  font-size: 12.5px;
  color: var(--neutral-400);
}

h2 {
  font-size: 19px;
  font-weight: 600;
  margin: 10px 0 8px;
  line-height: 1.4;
}

.meta-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--neutral-400);
  flex-wrap: wrap;
}

.dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #c9d3e0;
}

.head-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: none;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  align-items: start;
}

.main-col,
.side-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.desc-text {
  font-size: 13px;
  line-height: 1.85;
  color: var(--neutral-700);
  white-space: pre-wrap;
}

.resource-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--divider);
  flex-wrap: wrap;
}

.res-tag {
  font-family: ui-monospace, Menlo, monospace;
  font-size: 11.5px;
}

.solution {
  margin-top: 16px;
  background: #f0f9f4;
  border: 1px solid #d5ecdf;
  border-radius: 8px;
  padding: 12px 14px;
}

.solution-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #15803d;
  margin-bottom: 6px;
}

.timeline {
  padding-left: 4px;
  margin-top: 4px;
}

.tl-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--neutral-900);
}

.tl-head b {
  font-weight: 500;
}

.tl-action {
  color: var(--brand-600);
}

.tl-cost {
  font-size: 11px;
  color: var(--neutral-400);
  background: #f1f3f7;
  border-radius: 3px;
  padding: 1px 5px;
}

.tl-remark {
  font-size: 12.5px;
  color: var(--neutral-600);
  line-height: 1.7;
  margin-top: 3px;
}

.attach-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attach-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 9px 12px;
}

.attach-main {
  flex: 1;
}

.attach-name {
  font-size: 12.5px;
  color: var(--neutral-900);
}

.sla-block {
  margin-bottom: 16px;
}

.sla-head {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--neutral-600);
  margin-bottom: 7px;
}

.sla-head b {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.sla-head b.ok {
  color: #5b6675;
}

.sla-head b.warn {
  color: #d97706;
}

.sla-head b.bad {
  color: #dc2626;
}

.sla-foot {
  margin-top: 5px;
  line-height: 1.6;
}

.sla-result {
  border-top: 1px dashed var(--divider);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sr-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--neutral-600);
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
  padding: 7px 0;
  border-bottom: 1px dashed var(--divider);
}

.info-row span {
  color: var(--neutral-400);
  flex: none;
}

.info-row b {
  font-weight: 500;
  text-align: right;
  color: var(--neutral-900);
}

.sat-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sat-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sat-comment {
  font-size: 12.5px;
  color: var(--neutral-600);
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.6;
}

.kb-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kb-item {
  padding: 8px 6px;
  border-radius: 6px;
  cursor: pointer;
}

.kb-item:hover {
  background: #f5f8fd;
}

.kb-title {
  font-size: 12.5px;
  color: var(--neutral-800);
  line-height: 1.5;
  margin-bottom: 2px;
}

.close-tip {
  background: #f5f8fd;
  border: 1px solid #e3ecf9;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12.5px;
  color: var(--neutral-600);
  margin-bottom: 16px;
}
</style>
