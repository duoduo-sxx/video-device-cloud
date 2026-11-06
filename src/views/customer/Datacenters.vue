<template>
  <div class="page">
    <PageHeader title="机房管理" desc="机房位置、机柜与 U 位使用、供电与温湿度环境">
      <template #actions>
        <el-button :icon="Refresh" @click="load">刷新</el-button>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <StatCard label="机房总数" :value="rows.length" unit="个" icon="MapLocation" tone="primary" hint="覆盖 8 家客户、5 个城市" />
      <StatCard label="机柜总数" :value="totalRacks" unit="架" icon="Grid" tone="cyan" hint="T3 / T4 等级机房" />
      <StatCard label="U 位使用率" :value="uRate.toFixed(1)" unit="%" icon="PieChart" tone="purple" :progress="uRate" hint="全机房平均" />
      <StatCard label="环境异常" :value="abnormal" unit="个" icon="Warning" tone="danger" hint="温度 >25℃ 或湿度 >55%" />
    </div>

    <div class="card flush">
      <el-table :data="rows" v-loading="loading">
        <el-table-column label="机房" min-width="230">
          <template #default="{ row }">
            <div class="dc-name">{{ row.name }}</div>
            <div class="tiny muted">{{ row.id }} · {{ row.address }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="所属客户" min-width="180" show-overflow-tooltip />
        <el-table-column label="等级" width="80">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" :type="row.level === 'T4' ? 'success' : 'info'">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rackCount" label="机柜数" width="90" />
        <el-table-column label="U 位使用" width="180">
          <template #default="{ row }">
            <div class="u-cell">
              <CapacityBar :value="(row.usedU / row.totalU) * 100" :height="5" />
              <span class="tiny muted">{{ row.usedU }} / {{ row.totalU }}U</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="电力负载" width="120">
          <template #default="{ row }">
            <span :class="row.powerLoad > 80 ? 'warn' : ''">{{ row.powerLoad }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="温度" width="90">
          <template #default="{ row }">
            <span :class="row.temperature > 25 ? 'warn' : 'ok'">{{ row.temperature }} ℃</span>
          </template>
        </el-table-column>
        <el-table-column label="湿度" width="90">
          <template #default="{ row }">
            <span :class="row.humidity > 55 ? 'warn' : 'ok'">{{ row.humidity }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="环境状态" width="110">
          <template #default="{ row }">
            <StatusTag :tone="row.temperature > 25 || row.humidity > 55 ? 'warning' : 'success'" :label="row.temperature > 25 || row.humidity > 55 ? '需关注' : '正常'" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import CapacityBar from '@/components/CapacityBar.vue'
import { getDatacenters } from '@/api'
import type { DataCenter } from '@/types'

const loading = ref(false)
const rows = ref<DataCenter[]>([])

const totalRacks = computed(() => rows.value.reduce((s, r) => s + r.rackCount, 0))
const uRate = computed(() => {
  const used = rows.value.reduce((s, r) => s + r.usedU, 0)
  const total = rows.value.reduce((s, r) => s + r.totalU, 0)
  return total ? (used / total) * 100 : 0
})
const abnormal = computed(() => rows.value.filter((r) => r.temperature > 25 || r.humidity > 55).length)

async function load() {
  loading.value = true
  rows.value = await getDatacenters()
  loading.value = false
}

onMounted(load)
</script>

<style scoped>
.dc-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--neutral-900);
}

.u-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.warn {
  color: #d97706;
  font-weight: 500;
}

.ok {
  color: var(--neutral-700);
}
</style>
