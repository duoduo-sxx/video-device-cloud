<template>
  <div class="page">
    <PageHeader title="参数配置" desc="容量阈值、SLA 预警、工单规则与界面偏好，保存后立即生效">
      <template #actions>
        <el-button :icon="RefreshLeft" @click="reset">恢复默认</el-button>
        <el-button type="primary" :icon="Select" @click="save">保存配置</el-button>
      </template>
    </PageHeader>

    <div class="settings">
      <div class="card">
        <div class="card-title">容量管理</div>
        <el-form label-width="150px" label-position="left" class="setting-form">
          <el-form-item label="容量提醒阈值">
            <el-input-number v-model="form.capacityWarn" :min="50" :max="95" :step="1" />
            <span class="unit">%</span>
            <span class="hint">超过该值在列表与工作台标记为警告</span>
          </el-form-item>
          <el-form-item label="容量严重阈值">
            <el-input-number v-model="form.capacityCritical" :min="60" :max="99" :step="1" />
            <span class="unit">%</span>
            <span class="hint">超过该值视为严重风险，建议 7 天内扩容</span>
          </el-form-item>
          <el-form-item label="扩容建议提前天数">
            <el-input-number v-model="form.expandDays" :min="30" :max="365" :step="15" />
            <span class="unit">天</span>
            <span class="hint">预计可用天数低于该值时提示扩容</span>
          </el-form-item>
        </el-form>
      </div>

      <div class="card">
        <div class="card-title">SLA 与工单</div>
        <el-form label-width="150px" label-position="left" class="setting-form">
          <el-form-item label="SLA 预警比例">
            <el-input-number v-model="form.slaWarn" :min="50" :max="95" :step="5" />
            <span class="unit">%</span>
            <span class="hint">已用时限达到该比例时标黄预警</span>
          </el-form-item>
          <el-form-item label="P1 响应时限">
            <el-input-number v-model="form.p1Response" :min="5" :max="60" :step="5" />
            <span class="unit">分钟</span>
          </el-form-item>
          <el-form-item label="自动关闭天数">
            <el-input-number v-model="form.autoClose" :min="3" :max="30" :step="1" />
            <span class="unit">天</span>
            <span class="hint">待验收超过该天数且无异议时自动关闭</span>
          </el-form-item>
          <el-form-item label="默认分页条数">
            <el-select v-model="form.pageSize" style="width: 140px">
              <el-option :value="10" label="10 条/页" />
              <el-option :value="20" label="20 条/页" />
              <el-option :value="50" label="50 条/页" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div class="card">
        <div class="card-title">服务台信息</div>
        <el-form label-width="150px" label-position="left" class="setting-form">
          <el-form-item label="服务台名称">
            <el-input v-model="form.deskName" style="width: 280px" />
          </el-form-item>
          <el-form-item label="服务台电话">
            <el-input v-model="form.deskPhone" style="width: 220px" />
          </el-form-item>
          <el-form-item label="服务时间">
            <el-input v-model="form.serviceTime" style="width: 320px" />
          </el-form-item>
          <el-form-item label="消息通知">
            <el-checkbox-group v-model="form.channels">
              <el-checkbox value="station">站内信</el-checkbox>
              <el-checkbox value="email">邮件</el-checkbox>
              <el-checkbox value="sms">短信</el-checkbox>
              <el-checkbox value="webhook">Webhook</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>

      <div class="card danger-zone">
        <div>
          <div class="card-title">演示数据</div>
          <div class="tiny muted" style="margin-top: 6px">
            当前数据存储于浏览器 localStorage（键名前缀 soc.）。重置后将恢复初始种子数据，所有新增与修改将丢失。
          </div>
        </div>
        <el-button type="danger" plain @click="resetData">重置演示数据</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RefreshLeft, Select } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { resetDb } from '@/mock/db'

const DEFAULT = {
  capacityWarn: 85,
  capacityCritical: 92,
  expandDays: 90,
  slaWarn: 80,
  p1Response: 15,
  autoClose: 7,
  pageSize: 10,
  deskName: '存储服务台',
  deskPhone: '400-820-6688',
  serviceTime: '7×24 小时，法定节假日不休',
  channels: ['station', 'email', 'sms']
}

const form = reactive({ ...DEFAULT, channels: [...DEFAULT.channels] })

function loadConfig() {
  try {
    const raw = localStorage.getItem('soc.settings')
    if (raw) Object.assign(form, JSON.parse(raw))
  } catch {
    /* ignore */
  }
}

function save() {
  localStorage.setItem('soc.settings', JSON.stringify(form))
  ElMessage.success('配置已保存并生效')
}

async function reset() {
  Object.assign(form, DEFAULT, { channels: [...DEFAULT.channels] })
  localStorage.removeItem('soc.settings')
  ElMessage.success('已恢复默认配置')
}

async function resetData() {
  const ok = await ElMessageBox.confirm('确认重置全部演示数据？该操作不可撤销。', '重置演示数据', {
    type: 'warning',
    confirmButtonText: '确认重置',
    confirmButtonClass: 'el-button--danger'
  }).catch(() => null)
  if (!ok) return
  resetDb()
}

onMounted(loadConfig)
</script>

<style scoped>
.settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

.settings .card:first-child,
.settings .card:nth-child(2) {
  min-height: 300px;
}

.setting-form {
  margin-top: 16px;
}

.unit {
  margin-left: 8px;
  font-size: 12.5px;
  color: var(--neutral-400);
}

.hint {
  margin-left: 12px;
  font-size: 11.5px;
  color: var(--neutral-400);
}

.danger-zone {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-color: #f4d7d7;
  background: #fffbfb;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}
</style>
