<template>
  <div class="page">
    <div class="back-row">
      <el-button link :icon="ArrowLeft" @click="router.back()">返回</el-button>
    </div>

    <PageHeader title="新建工单" desc="填写服务请求信息，系统将按合同 SLA 自动计算响应与解决时限" />

    <div class="layout">
      <div class="form-col">
        <div class="card">
          <div class="section-title" style="margin-top: 0">1. 选择客户与服务项</div>
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <el-form-item label="客户" prop="customerId">
              <el-select v-model="form.customerId" filterable placeholder="选择客户" style="width: 100%" @change="onCustomerChange">
                <el-option v-for="c in customers" :key="c.id" :label="`${c.name}（${c.level} 级 · ${c.region}）`" :value="c.id" />
              </el-select>
            </el-form-item>

            <el-form-item label="服务项" prop="serviceItem">
              <div class="service-grid">
                <div
                  v-for="s in services"
                  :key="s.id"
                  class="service-item"
                  :class="{ active: form.serviceItem === s.name }"
                  @click="form.serviceItem = s.name"
                >
                  <div class="si-name">{{ s.name }}</div>
                  <div class="si-desc">{{ s.desc }}</div>
                  <div class="si-sla">响应 {{ s.responseHours }}h · 解决 {{ s.resolveHours }}h</div>
                </div>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <div class="card">
          <div class="section-title" style="margin-top: 0">2. 关联资源</div>
          <el-form label-position="top">
            <el-form-item label="受影响资源（可多选，非必填）">
              <el-select v-model="form.resourceIds" multiple filterable placeholder="选择存储集群 / 存储池 / 设备" style="width: 100%" @change="onResourceChange">
                <el-option-group label="存储集群">
                  <el-option v-for="c in resources.clusters" :key="c.id" :label="`${c.name}（${c.model}）`" :value="c.id" />
                </el-option-group>
                <el-option-group label="存储池">
                  <el-option v-for="p in resources.pools" :key="p.id" :label="`${p.name} · 使用率 ${p.usageRate}%`" :value="p.id" />
                </el-option-group>
                <el-option-group label="设备">
                  <el-option v-for="d in resources.devices" :key="d.id" :label="`${d.name} · ${d.model}`" :value="d.id" />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <div class="card">
          <div class="section-title" style="margin-top: 0">3. 问题描述</div>
          <el-form ref="detailRef" :model="form" :rules="rules" label-position="top">
            <el-form-item label="工单标题" prop="title">
              <el-input v-model="form.title" maxlength="80" show-word-limit placeholder="一句话描述问题，如：政务云核心存储 IO 时延突增" />
            </el-form-item>
            <el-form-item label="详细描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="6" maxlength="1000" show-word-limit placeholder="请描述现象、发生时间、影响业务范围、已做过的排查动作…" />
            </el-form-item>
            <div class="two">
              <el-form-item label="优先级" prop="priority" class="prio-item">
                <div class="prio-group">
                  <div v-for="p in priorityOptions" :key="p.value" class="prio" :class="[p.value.toLowerCase(), { active: form.priority === p.value }]" @click="form.priority = p.value">
                    <div class="prio-name">{{ p.value }}</div>
                    <div class="prio-desc">{{ p.desc }}</div>
                  </div>
                </div>
              </el-form-item>
            </div>
            <div class="two">
              <el-form-item label="影响范围">
                <el-input v-model="form.impact" placeholder="如：Oracle 核心库写入，影响 3 个业务系统" />
              </el-form-item>
              <el-form-item label="期望完成时间">
                <el-date-picker v-model="form.expectAt" type="datetime" placeholder="选择时间" style="width: 100%" />
              </el-form-item>
            </div>
            <el-form-item label="联系人">
              <el-input v-model="form.contact" placeholder="姓名 手机号" />
            </el-form-item>
            <el-form-item label="附件">
              <el-upload :auto-upload="false" :on-change="onFileChange" :on-remove="onFileRemove" multiple>
                <el-button :icon="Upload">选择文件</el-button>
                <template #tip><span class="tiny muted" style="margin-left: 10px">演示环境不上传真实文件，仅记录文件名</span></template>
              </el-upload>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="summary-col">
        <div class="card summary">
          <div class="sum-title">工单摘要</div>
          <div class="sum-row"><span>客户</span><b>{{ customerName || '未选择' }}</b></div>
          <div class="sum-row"><span>服务项</span><b>{{ form.serviceItem || '未选择' }}</b></div>
          <div class="sum-row"><span>关联资源</span><b>{{ form.resourceIds.length }} 项</b></div>
          <div class="sum-row"><span>优先级</span><b>{{ form.priority }}</b></div>
          <div class="sum-row"><span>创建人</span><b>{{ store.user?.name }}</b></div>

          <div class="sla-box">
            <div class="sla-title">SLA 时限预览</div>
            <div class="sla-row">
              <span>响应时限</span>
              <b>{{ sla.response }} 小时</b>
            </div>
            <div class="sla-row">
              <span>解决时限</span>
              <b>{{ sla.resolve }} 小时</b>
            </div>
            <div class="sla-hint">按客户合同服务级别与优先级自动计算</div>
          </div>

          <el-button type="primary" size="large" class="submit" :loading="submitting" @click="submit">提交工单</el-button>
          <el-button size="large" class="cancel" @click="router.back()">取消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft, Upload } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { createTicket, getAllCustomers, getDevices, getPools, getServiceItems, getClusters } from '@/api'
import type { Customer, Device, ServiceItem, StorageCluster, StoragePool } from '@/types'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const store = useUserStore()

const customers = ref<Customer[]>([])
const services = ref<ServiceItem[]>([])
const resources = reactive<{ clusters: StorageCluster[]; pools: StoragePool[]; devices: Device[] }>({ clusters: [], pools: [], devices: [] })

const formRef = ref<FormInstance>()
const detailRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive({
  customerId: '',
  serviceItem: '故障处理',
  resourceIds: [] as string[],
  resourceNames: [] as string[],
  title: '',
  description: '',
  priority: 'P3' as 'P1' | 'P2' | 'P3' | 'P4',
  impact: '',
  expectAt: '',
  contact: '',
  attachments: [] as { name: string; size: string }[]
})

const priorityOptions = [
  { value: 'P1' as const, desc: '业务中断' },
  { value: 'P2' as const, desc: '严重降级' },
  { value: 'P3' as const, desc: '一般问题' },
  { value: 'P4' as const, desc: '咨询建议' }
]

const SLA: Record<string, { response: number; resolve: number }> = {
  P1: { response: 0.25, resolve: 4 },
  P2: { response: 0.5, resolve: 8 },
  P3: { response: 2, resolve: 24 },
  P4: { response: 4, resolve: 48 }
}
const sla = computed(() => SLA[form.priority])
const customerName = computed(() => customers.value.find((c) => c.id === form.customerId)?.name ?? '')

const rules: FormRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  serviceItem: [{ required: true, message: '请选择服务项', trigger: 'change' }],
  title: [{ required: true, message: '请填写工单标题', trigger: 'blur' }],
  description: [{ required: true, message: '请填写详细描述', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
}

async function loadResources() {
  if (!form.customerId) return
  const [cs, ps, ds] = await Promise.all([
    getClusters({ customerId: form.customerId, pageSize: 100 }),
    getPools({ customerId: form.customerId, pageSize: 100 }),
    getDevices({ customerId: form.customerId, pageSize: 100 })
  ])
  resources.clusters = cs.list
  resources.pools = ps.list
  resources.devices = ds.list
}

function onCustomerChange() {
  form.resourceIds = []
  form.resourceNames = []
  const c = customers.value.find((x) => x.id === form.customerId)
  if (c) form.contact = `${c.contactName} ${c.contactPhone}`
  loadResources()
  if (route.query.deviceId) {
    form.resourceIds = [String(route.query.deviceId)]
    onResourceChange()
  }
}

function onResourceChange() {
  const map = new Map<string, string>()
  resources.clusters.forEach((c) => map.set(c.id, c.name))
  resources.pools.forEach((p) => map.set(p.id, p.name))
  resources.devices.forEach((d) => map.set(d.id, d.name))
  form.resourceNames = form.resourceIds.map((id) => map.get(id) ?? id)
}

function onFileChange(file: { name: string; size?: number }) {
  form.attachments.push({ name: file.name, size: `${(((file.size ?? 0) / 1024) / 1024).toFixed(1)} MB` })
}

function onFileRemove(file: { name: string }) {
  form.attachments = form.attachments.filter((f) => f.name !== file.name)
}

async function submit() {
  const v1 = await formRef.value?.validate().catch(() => false)
  const v2 = await detailRef.value?.validate().catch(() => false)
  if (!v1 || !v2) {
    ElMessage.warning('请补全必填信息')
    return
  }
  submitting.value = true
  const ticket = await createTicket({
    title: form.title,
    customerId: form.customerId,
    serviceItem: form.serviceItem,
    priority: form.priority,
    description: `${form.description}${form.impact ? `\n\n影响范围：${form.impact}` : ''}`,
    resourceIds: form.resourceIds,
    resourceNames: form.resourceNames,
    source: 'portal',
    contact: form.contact,
    expectAt: form.expectAt,
    attachments: form.attachments
  })
  submitting.value = false
  ElMessage.success(`工单 ${ticket.id} 已创建，等待服务台受理`)
  router.push(`/service/tickets/${ticket.id}`)
}

onMounted(async () => {
  const [cs, ss] = await Promise.all([getAllCustomers(), getServiceItems()])
  customers.value = cs
  services.value = ss
  if (store.user?.role === 'customer_admin' && store.user.customerId) {
    form.customerId = store.user.customerId
  } else if (route.query.customerId) {
    form.customerId = String(route.query.customerId)
  } else {
    form.customerId = customers.value[0]?.id ?? ''
  }
  if (route.query.serviceItem) form.serviceItem = String(route.query.serviceItem)
  onCustomerChange()
})
</script>

<style scoped>
.back-row {
  margin-bottom: -8px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 16px;
  align-items: start;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.service-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 11px 12px;
  cursor: pointer;
  transition: all 0.14s ease;
  background: #fbfcfe;
}

.service-item:hover {
  border-color: #a9c8f2;
}

.service-item.active {
  border-color: var(--brand-600);
  background: #f2f8ff;
  box-shadow: inset 0 0 0 1px var(--brand-600);
}

.si-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--neutral-900);
}

.si-desc {
  font-size: 11px;
  color: var(--neutral-400);
  line-height: 1.5;
  margin: 4px 0 6px;
  height: 32px;
  overflow: hidden;
}

.si-sla {
  font-size: 10.5px;
  color: #1668dc;
}

.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.prio-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
}

.prio {
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 8px 10px;
  cursor: pointer;
  background: #fbfcfe;
}

.prio.active {
  border-color: var(--brand-600);
  background: #f2f8ff;
}

.prio-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-900);
}

.prio.active .prio-name {
  color: var(--brand-600);
}

.prio.p1 .prio-name {
  color: #e5484d;
}

.prio.p2 .prio-name {
  color: #d97706;
}

.prio-desc {
  font-size: 10.5px;
  color: var(--neutral-400);
  margin-top: 2px;
}

.summary-col {
  position: sticky;
  top: 76px;
}

.sum-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
}

.sum-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
  padding: 7px 0;
  border-bottom: 1px dashed var(--divider);
}

.sum-row span {
  color: var(--neutral-400);
  flex: none;
}

.sum-row b {
  font-weight: 500;
  text-align: right;
  color: var(--neutral-900);
  word-break: break-all;
}

.sla-box {
  margin: 16px 0;
  background: #f5f9ff;
  border: 1px solid #dfeafa;
  border-radius: 8px;
  padding: 12px 14px;
}

.sla-title {
  font-size: 12px;
  color: #1668dc;
  font-weight: 500;
  margin-bottom: 8px;
}

.sla-row {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--neutral-600);
  padding: 3px 0;
}

.sla-row b {
  color: var(--neutral-900);
  font-weight: 600;
}

.sla-hint {
  margin-top: 8px;
  font-size: 10.5px;
  color: #8aa3c2;
  line-height: 1.5;
}

.submit {
  width: 100%;
  margin-bottom: 8px;
}

.cancel {
  width: 100%;
  margin-left: 0;
}

:deep(.el-form-item__label) {
  font-size: 12.5px;
  color: var(--neutral-600);
  padding-bottom: 4px;
}

@media (max-width: 1440px) {
  .service-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
