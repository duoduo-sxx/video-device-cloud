<template>
  <div class="page">
    <PageHeader title="操作日志" desc="记录关键操作的时间、操作人、对象与结果，用于审计追溯">
      <template #actions>
        <el-button :icon="Download" @click="onExport">导出</el-button>
      </template>
    </PageHeader>

    <div class="card flush">
      <div class="filters-bar">
        <div class="filters">
          <el-input v-model="query.keyword" placeholder="操作人 / 动作 / 对象" :prefix-icon="Search" clearable @keyup.enter="search" />
          <el-select v-model="query.module" placeholder="全部模块" clearable style="width: 160px">
            <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>
        <span class="tiny muted">共 {{ total }} 条记录</span>
      </div>

      <el-table :data="rows" v-loading="loading">
        <el-table-column label="时间" width="160">
          <template #default="{ row }"><span class="num tiny">{{ formatDateTime(row.time) }}</span></template>
        </el-table-column>
        <el-table-column prop="actor" label="操作人" width="110" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="动作" width="150" />
        <el-table-column label="对象" min-width="180">
          <template #default="{ row }"><span class="mono tiny">{{ row.target }}</span></template>
        </el-table-column>
        <el-table-column label="来源 IP" width="130">
          <template #default="{ row }"><span class="mono tiny">{{ row.ip }}</span></template>
        </el-table-column>
        <el-table-column label="结果" width="90">
          <template #default="{ row }"><StatusTag kind="result" :value="row.result" /></template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </div>

    <el-drawer v-model="detailVisible" title="日志详情" size="480px">
      <div v-if="current" class="log-detail">
        <div class="info-row"><span>时间</span><b>{{ formatDateTime(current.time) }}</b></div>
        <div class="info-row"><span>操作人</span><b>{{ current.actor }}</b></div>
        <div class="info-row"><span>模块</span><b>{{ current.module }}</b></div>
        <div class="info-row"><span>动作</span><b>{{ current.action }}</b></div>
        <div class="info-row"><span>对象</span><b class="mono">{{ current.target }}</b></div>
        <div class="info-row"><span>来源 IP</span><b class="mono">{{ current.ip }}</b></div>
        <div class="info-row"><span>结果</span><StatusTag kind="result" :value="current.result" /></div>

        <div class="section-title">请求上下文</div>
        <pre class="json">{{ pretty(current.detail) }}</pre>
        <div class="section-title">变更前后</div>
        <div class="diff">
          <div class="diff-col">
            <div class="diff-title">变更前</div>
            <pre class="json small">{{ before }}</pre>
          </div>
          <div class="diff-col">
            <div class="diff-title">变更后</div>
            <pre class="json small">{{ after }}</pre>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import { getLogs } from '@/api'
import type { LogEntry } from '@/types'
import { formatDateTime } from '@/utils/format'
import { exportCsv } from '@/utils/export'

const loading = ref(false)
const rows = ref<LogEntry[]>([])
const total = ref(0)
const detailVisible = ref(false)
const current = ref<LogEntry>()

const modules = ['工单管理', '告警中心', '资源管理', '备件管理', '知识库', '系统管理', '服务合同', '登录']

const query = reactive({ keyword: '', module: '', page: 1, pageSize: 20 })

const before = computed(() => JSON.stringify({ status: 'processing', assignee: '', slaResolveOk: null }, null, 2))
const after = computed(() => JSON.stringify({ status: 'resolved', assignee: '陈立', slaResolveOk: true }, null, 2))

function pretty(str: string) {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

async function load() {
  loading.value = true
  const res = await getLogs({ ...query })
  rows.value = res.list
  total.value = res.total
  loading.value = false
}

function search() {
  query.page = 1
  load()
}

function reset() {
  query.keyword = ''
  query.module = ''
  search()
}

function openDetail(row: LogEntry) {
  current.value = row
  detailVisible.value = true
}

function onExport() {
  exportCsv(
    '操作日志.csv',
    ['时间', '操作人', '模块', '动作', '对象', 'IP', '结果'],
    rows.value.map((l) => [l.time, l.actor, l.module, l.action, l.target, l.ip, l.result])
  )
  ElMessage.success('已导出当前页数据')
}

onMounted(load)
</script>

<style scoped>
.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--divider);
  flex-wrap: wrap;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  font-size: 12.5px;
  padding: 9px 0;
  border-bottom: 1px dashed var(--divider);
}

.info-row span {
  color: var(--neutral-400);
}

.info-row b {
  font-weight: 500;
  color: var(--neutral-900);
}

.json {
  background: #0f1c2e;
  color: #d7e3f4;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 11.5px;
  line-height: 1.7;
  overflow-x: auto;
  font-family: ui-monospace, Menlo, monospace;
}

.json.small {
  font-size: 10.5px;
  min-height: 120px;
}

.diff {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.diff-title {
  font-size: 11.5px;
  color: var(--neutral-400);
  margin-bottom: 6px;
}
</style>
