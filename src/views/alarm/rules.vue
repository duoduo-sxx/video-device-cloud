<script setup lang="ts">
/**
 * 告警规则与通知：收敛窗口、静默期、通知渠道与接收人
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { alarmApi } from '@/api'
import PageContainer from '@/components/PageContainer.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ALARM_LEVEL_OPTIONS, NOTIFY_CHANNEL_OPTIONS } from '@/utils/dict'
import { formatDateTime, formatDuration } from '@/utils/format'

const loading = ref(false)
const list = ref<any[]>([])
const keyword = ref('')

const ALARM_TYPES = [
  '视频信号丢失',
  '设备离线',
  '移动侦测',
  '区域入侵',
  '越界检测',
  '人员聚集',
  '未戴安全帽',
  '烟雾明火',
  '车辆违停',
  '存储写入异常',
  '码率异常',
  '录像缺失',
  '网络抖动',
  'AI 任务异常'
]

const RECEIVER_POOL = [
  '值班室-张伟（运维）',
  '李娜（安防主管）',
  '王强（驻场工程师）',
  '赵敏（租户对接人）',
  '陈磊（网络组）',
  '刘洋（AI 平台组）'
]

/* ---------- 表单 ---------- */
const dialogVisible = ref(false)
const editing = ref<any>(null)
const formRef = ref<FormInstance>()
const form = reactive<any>({
  name: '',
  alarmTypes: [] as string[],
  levels: [] as string[],
  convergeWindow: 300,
  silentPeriod: 1800,
  channels: [] as string[],
  notifyChannels: ['站内消息'],
  receivers: [] as string[],
  status: 1
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  alarmTypes: [{ required: true, type: 'array', min: 1, message: '请至少选择一个告警类型', trigger: 'change' }],
  levels: [{ required: true, type: 'array', min: 1, message: '请至少选择一个告警等级', trigger: 'change' }],
  notifyChannels: [{ required: true, type: 'array', min: 1, message: '请至少选择一个通知渠道', trigger: 'change' }],
  receivers: [{ required: true, type: 'array', min: 1, message: '请至少选择一位接收人', trigger: 'change' }]
}

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (r) =>
      r.name.toLowerCase().includes(kw) ||
      (r.receivers || []).some((x: string) => x.toLowerCase().includes(kw)) ||
      (r.alarmTypes || []).some((x: string) => x.toLowerCase().includes(kw))
  )
})

const enabledCount = computed(() => list.value.filter((r) => r.status === 1).length)

async function load() {
  loading.value = true
  try {
    list.value = (await alarmApi.rules()) || []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', alarmTypes: [], levels: [], convergeWindow: 300, silentPeriod: 1800, channels: [], notifyChannels: ['站内消息'], receivers: [], status: 1 })
  dialogVisible.value = true
}

function openEdit(row: any) {
  editing.value = row
  Object.assign(form, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  if (editing.value) {
    await alarmApi.updateRule(editing.value.id, { ...form })
    ElMessage.success('规则已更新')
  } else {
    await alarmApi.createRule({ ...form })
    ElMessage.success('规则已创建')
  }
  dialogVisible.value = false
  load()
}

async function toggleStatus(row: any) {
  await alarmApi.updateRule(row.id, { status: row.status === 1 ? 0 : 1 })
  row.status = row.status === 1 ? 0 : 1
  ElMessage.success(row.status === 1 ? `规则「${row.name}」已启用` : `规则「${row.name}」已停用`)
}

async function removeRule(row: any) {
  await ElMessageBox.confirm(`删除后该规则不再生效，历史告警记录不受影响。确认删除「${row.name}」？`, '删除告警规则', { type: 'warning' })
  await alarmApi.removeRule(row.id)
  ElMessage.success('规则已删除')
  load()
}

async function testRule(row: any) {
  const res: any = await alarmApi.testRule(row.id)
  ElMessageBox.alert(
    `${res.message}\n\n各渠道发送结果：\n${(res.sendResults || []).map((s: any) => `· ${s.channel}：${s.status === 'success' ? '成功' : '失败'}（${s.cost}ms）`).join('\n')}`,
    '通知测试结果',
    { confirmButtonText: '知道了' }
  )
}
</script>

<template>
  <PageContainer title="告警规则与通知" subtitle="配置告警收敛、静默与多通道通知策略，避免告警风暴">
    <template #header>
      <el-button :icon="'Refresh'" :loading="loading" @click="load">刷新</el-button>
      <el-button type="primary" :icon="'Plus'" @click="openCreate">新建规则</el-button>
    </template>

    <div class="vc-card rs__filter">
      <el-form inline @submit.prevent>
        <el-form-item label="关键字">
          <el-input v-model="keyword" placeholder="规则名称 / 接收人 / 告警类型" clearable style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <span class="vc-text-secondary" style="font-size: 12px">
            共 <b>{{ list.length }}</b> 条规则，启用 <b class="is-ok">{{ enabledCount }}</b> 条，停用 {{ list.length - enabledCount }} 条
          </span>
        </el-form-item>
      </el-form>
    </div>

    <div class="vc-card rs__table">
      <el-table v-loading="loading" :data="filtered" stripe>
        <el-table-column label="规则名称" min-width="200">
          <template #default="{ row }">
            <div style="font-size: 13px; font-weight: 500">{{ row.name }}</div>
            <div class="vc-text-tertiary vc-mono" style="font-size: 11px">{{ row.id }} · {{ formatDateTime(row.createTime) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="监控告警类型" min-width="230">
          <template #default="{ row }">
            <el-tag v-for="t in row.alarmTypes" :key="t" size="small" effect="plain" style="margin: 1px 3px 1px 0">{{ t }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="生效等级" width="180">
          <template #default="{ row }">
            <StatusTag v-for="l in row.levels" :key="l" :status="l" kind="alarmLevel" style="margin-right: 4px" />
          </template>
        </el-table-column>
        <el-table-column label="收敛 / 静默" width="180">
          <template #default="{ row }">
            <div>收敛窗口 {{ formatDuration(row.convergeWindow / 60) }}</div>
            <div class="vc-text-tertiary" style="font-size: 11px">静默期 {{ formatDuration(row.silentPeriod / 60) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="通知渠道" width="170">
          <template #default="{ row }">
            <el-tag v-for="c in row.notifyChannels" :key="c" size="small" effect="plain" style="margin: 1px 3px 1px 0">{{ c }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="接收人" min-width="200">
          <template #default="{ row }">
            <div v-for="r in row.receivers" :key="r" style="font-size: 12px">{{ r }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 1" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="testRule(row)">测试通知</el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="removeRule(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState description="暂无告警规则" tips="新建规则后可自动收敛与通知" action-text="新建规则" @action="openCreate" /></template>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑告警规则' : '新建告警规则'" width="720px" top="8vh">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" placeholder="如：重点区域入侵告警-即时通知" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="告警类型" prop="alarmTypes">
          <el-select v-model="form.alarmTypes" multiple filterable collapse-tags collapse-tags-tooltip placeholder="选择需要监控的告警类型" style="width: 100%">
            <el-option v-for="t in ALARM_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="生效等级" prop="levels">
          <el-select v-model="form.levels" multiple placeholder="选择告警等级" style="width: 100%">
            <el-option v-for="l in ALARM_LEVEL_OPTIONS" :key="l.value" :label="l.label" :value="l.value" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="收敛窗口">
              <el-input-number v-model="form.convergeWindow" :min="0" :max="86400" :step="60" controls-position="right" style="width: 100%" />
              <div class="vc-text-tertiary" style="font-size: 11px">秒，同一设备同类型告警在此窗口内合并为一条</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="静默期">
              <el-input-number v-model="form.silentPeriod" :min="0" :max="604800" :step="300" controls-position="right" style="width: 100%" />
              <div class="vc-text-tertiary" style="font-size: 11px">秒，静默期内相同告警不再重复通知</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="作用通道">
          <el-select v-model="form.channels" multiple filterable allow-create default-first-option placeholder="留空表示全部通道生效" style="width: 100%">
            <el-option label="全部通道" value="all" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知渠道" prop="notifyChannels">
          <el-checkbox-group v-model="form.notifyChannels">
            <el-checkbox v-for="c in NOTIFY_CHANNEL_OPTIONS" :key="c.value" :value="c.value">{{ c.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="接收人" prop="receivers">
          <el-select v-model="form.receivers" multiple filterable allow-create default-first-option placeholder="选择或输入接收人" style="width: 100%">
            <el-option v-for="r in RECEIVER_POOL" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">{{ editing ? '保存修改' : '确认创建' }}</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<style scoped>
.rs__filter {
  padding: 14px 16px 4px;
  margin-bottom: 12px;
}

.rs__filter :deep(.el-form-item) {
  margin-bottom: 10px;
}

.rs__table {
  padding: 0;
  overflow: hidden;
}

.is-ok {
  color: var(--vc-success);
}
</style>
