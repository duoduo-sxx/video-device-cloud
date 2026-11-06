<template>
  <div class="page">
    <PageHeader title="卷与文件系统" desc="块 / 文件 / 对象存储的卷分配、快照与主机映射关系">
      <template #actions>
        <el-button :icon="Download" @click="onExport">导出</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新建卷</el-button>
      </template>
    </PageHeader>

    <div class="card flush">
      <div class="filters-bar">
        <div class="filters">
          <el-input v-model="query.keyword" placeholder="卷名称 / 存储池" :prefix-icon="Search" clearable @keyup.enter="search" />
          <el-select v-model="query.poolId" placeholder="全部存储池" clearable filterable>
            <el-option v-for="p in pools" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-select v-model="query.type" placeholder="全部类型" clearable>
            <el-option label="块存储" value="block" />
            <el-option label="文件存储" value="file" />
            <el-option label="对象存储" value="object" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>
        <span class="tiny muted">共 {{ total }} 个卷 · 总分配 {{ formatCapacity(totalGB / 1024) }}</span>
      </div>

      <el-table :data="rows" v-loading="loading">
        <el-table-column label="卷名称" min-width="210">
          <template #default="{ row }">
            <div class="mono name">{{ row.name }}</div>
            <div class="tiny muted">{{ row.id }}</div>
          </template>
        </el-table-column>
        <el-table-column label="所属池 / 集群" min-width="200">
          <template #default="{ row }">
            <div class="tiny">{{ row.poolName }}</div>
            <div class="tiny muted">{{ row.customerName }}</div>
          </template>
        </el-table-column>
        <el-table-column label="容量" width="100">
          <template #default="{ row }"><span class="num">{{ formatGB(row.capacityGB) }}</span></template>
        </el-table-column>
        <el-table-column label="类型 / 协议" width="130">
          <template #default="{ row }">
            <span>{{ row.typeName }}</span>
            <span class="tiny muted"> · {{ row.protocol }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="hostCount" label="映射主机" width="96" />
        <el-table-column prop="snapshotCount" label="快照数" width="90" />
        <el-table-column label="保护方式" width="112">
          <template #default="{ row }">
            <span :class="row.protection === '双活' ? 'protect-strong' : ''">{{ row.protection }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <StatusTag :tone="row.status === 'normal' ? 'success' : 'warning'" :label="row.status === 'normal' ? '正常' : '异常'" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="116">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="ElMessage.success('已打开卷详情（演示）')">详情</el-button>
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState text="没有匹配的卷" /></template>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </div>

    <el-dialog v-model="createVisible" title="新建卷" width="520px">
      <el-form :model="form" label-width="92px" label-position="left">
        <el-form-item label="卷名称" required>
          <el-input v-model="form.name" placeholder="如 LUN-GOV-ORA-DATA09" />
        </el-form-item>
        <el-form-item label="所属存储池" required>
          <el-select v-model="form.poolId" filterable style="width: 100%" placeholder="选择存储池">
            <el-option v-for="p in pools" :key="p.id" :label="`${p.name} · 剩余 ${formatCapacity(p.freeTB)}`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio-button value="block">块存储</el-radio-button>
            <el-radio-button value="file">文件存储</el-radio-button>
            <el-radio-button value="object">对象存储</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="容量（GB）">
          <el-input-number v-model="form.capacityGB" :min="64" :max="65536" :step="256" style="width: 100%" />
        </el-form-item>
        <el-form-item label="协议">
          <el-select v-model="form.protocol" style="width: 100%">
            <el-option v-for="p in protocols" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Plus, Refresh, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { createVolume, deleteVolume, getPools, getVolumes } from '@/api'
import type { StoragePool, Volume } from '@/types'
import { formatCapacity, formatDate, formatGB } from '@/utils/format'
import { exportCsv } from '@/utils/export'

const route = useRoute()
const loading = ref(false)
const rows = ref<Volume[]>([])
const total = ref(0)
const totalGB = ref(0)
const pools = ref<StoragePool[]>([])

const query = reactive({ keyword: '', poolId: '', type: '', page: 1, pageSize: 10 })

const createVisible = ref(false)
const submitting = ref(false)
const form = reactive({ name: '', poolId: '', type: 'block' as Volume['type'], capacityGB: 1024, protocol: 'FC' })

const protocols = computed(() => (form.type === 'block' ? ['FC', 'iSCSI'] : form.type === 'file' ? ['NFS', 'CIFS'] : ['S3']))

async function load() {
  loading.value = true
  const res = await getVolumes({ ...query })
  rows.value = res.list
  total.value = res.total
  totalGB.value = res.list.reduce((s, v) => s + v.capacityGB, 0)
  loading.value = false
}

function search() {
  query.page = 1
  load()
}

function reset() {
  query.keyword = ''
  query.poolId = ''
  query.type = ''
  search()
}

function openCreate() {
  form.name = ''
  form.poolId = pools.value[0]?.id ?? ''
  form.type = 'block'
  form.capacityGB = 1024
  form.protocol = 'FC'
  createVisible.value = true
}

async function submit() {
  if (!form.name || !form.poolId) {
    ElMessage.warning('请填写卷名称并选择存储池')
    return
  }
  submitting.value = true
  await createVolume({ ...form })
  submitting.value = false
  createVisible.value = false
  ElMessage.success('卷创建成功')
  await load()
}

async function remove(row: Volume) {
  const ok = await ElMessageBox.confirm(`确认删除卷「${row.name}」？删除后映射主机将失去该卷。`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    confirmButtonClass: 'el-button--danger'
  }).catch(() => null)
  if (!ok) return
  await deleteVolume(row.id)
  ElMessage.success('已删除')
  await load()
}

function onExport() {
  exportCsv(
    '存储卷台账.csv',
    ['卷名称', '所属池', '客户', '容量GB', '类型', '协议', '映射主机', '快照数', '保护', '状态'],
    rows.value.map((v) => [v.name, v.poolName, v.customerName, v.capacityGB, v.typeName, v.protocol, v.hostCount, v.snapshotCount, v.protection, v.status])
  )
  ElMessage.success('已导出当前页数据')
}

onMounted(async () => {
  const res = await getPools({ page: 1, pageSize: 999 })
  pools.value = res.list
  if (route.query.poolId) query.poolId = String(route.query.poolId)
  await load()
})
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

.name {
  font-size: 12.5px;
  color: var(--neutral-900);
}

.protect-strong {
  color: #0e9292;
  font-weight: 500;
}
</style>
