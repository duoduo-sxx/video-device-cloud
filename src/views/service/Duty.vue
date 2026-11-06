<template>
  <div class="page">
    <PageHeader title="值班排班" desc="7×24 值班安排与交接班记录，保障告警与工单及时响应">
      <template #actions>
        <el-button :icon="Phone" @click="ElMessage.info('已复制值班电话：' + (duties[0]?.phone ?? ''))">值班电话</el-button>
      </template>
    </PageHeader>

    <div class="week" v-loading="loading">
      <div v-for="d in duties" :key="d.id" class="day-card" :class="{ today: isToday(d.date) }">
        <div class="day-head">
          <span class="weekday">{{ d.weekday }}</span>
          <span class="date">{{ d.date.slice(5) }}</span>
          <el-tag v-if="isToday(d.date)" size="small" type="primary" effect="dark">今日</el-tag>
        </div>
        <div class="person">
          <span class="role-dot primary" />
          <div>
            <div class="p-role">主班</div>
            <div class="p-name">{{ d.primary }}</div>
          </div>
        </div>
        <div class="person">
          <span class="role-dot info" />
          <div>
            <div class="p-role">备班</div>
            <div class="p-name">{{ d.backup }}</div>
          </div>
        </div>
        <div class="person">
          <span class="role-dot neutral" />
          <div>
            <div class="p-role">二线</div>
            <div class="p-name">{{ d.secondary }}</div>
          </div>
        </div>
        <div class="phone">
          <el-icon :size="12"><Phone /></el-icon>
          {{ d.phone }}
        </div>
      </div>
    </div>

    <div class="cols-2-even">
      <div class="card">
        <div class="card-head">
          <div class="card-title">交接班记录</div>
          <el-button size="small" @click="ElMessage.success('已创建今日交接班记录（演示）')">填写交接</el-button>
        </div>
        <el-timeline>
          <el-timeline-item v-for="(h, i) in handovers" :key="i" :timestamp="h.time" :color="i === 0 ? '#1668DC' : '#C9D3E0'">
            <div class="h-title">{{ h.from }} → {{ h.to }}</div>
            <div class="h-content">{{ h.content }}</div>
            <div class="h-tags">
              <el-tag v-for="t in h.tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div class="card">
        <div class="card-title">值班要求</div>
        <div class="rules">
          <div class="rule"><span class="idx">01</span><div><b>响应时限</b>P1 告警 15 分钟内响应，30 分钟内到场或远程接入。</div></div>
          <div class="rule"><span class="idx">02</span><div><b>交接内容</b>未闭环工单、在途变更、备件领用与遗留风险必须逐项交接。</div></div>
          <div class="rule"><span class="idx">03</span><div><b>升级路径</b>主班无法处置时 10 分钟内升级备班，30 分钟内升级二线与服务经理。</div></div>
          <div class="rule"><span class="idx">04</span><div><b>记录留痕</b>所有处置动作在工单时间线登记，禁止事后补录。</div></div>
        </div>
        <div class="duty-note">
          <div class="tiny muted">本周值班负责人</div>
          <div class="note-name">张伟 · 服务经理</div>
          <div class="tiny muted">138****0002 · zhangwei@storageops.cn</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Phone } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { getDuties } from '@/api'
import type { DutyShift } from '@/types'
import { dayjs } from '@/utils/format'

const loading = ref(true)
const duties = ref<DutyShift[]>([])

const handovers = [
  { time: '2026-10-19 09:00', from: '吴倩', to: '陈立', content: '夜间 2 条 P2 告警已确认：BANK-CORE-01 复制延迟已恢复，HOSP-PRD-02 容量告警待扩容审批。', tags: ['2 条待跟进', '1 个变更'] },
  { time: '2026-10-18 21:00', from: '孙浩', to: '吴倩', content: '完成医保主数据中心季度巡检，发现 2 项风险：快照保留周期过长、1 块磁盘预测故障。', tags: ['巡检报告', '备件待领'] },
  { time: '2026-10-18 09:00', from: '周文静', to: '孙浩', content: '能源集团扩容实施完成，池水位由 91% 降至 62%，观察期 24 小时。', tags: ['变更完成'] }
]

function isToday(date: string) {
  return dayjs(date).isSame(dayjs(), 'day')
}

onMounted(async () => {
  duties.value = await getDuties()
  loading.value = false
})
</script>

<style scoped>
.week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
}

.day-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.day-card.today {
  border-color: #1668dc;
  box-shadow: 0 0 0 2px rgba(22, 104, 220, 0.08);
}

.day-head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-bottom: 9px;
  border-bottom: 1px dashed var(--divider);
}

.weekday {
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-900);
}

.date {
  font-size: 11.5px;
  color: var(--neutral-400);
}

.day-head .el-tag {
  margin-left: auto;
}

.person {
  display: flex;
  align-items: center;
  gap: 7px;
}

.role-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
}

.role-dot.primary {
  background: #1668dc;
}

.role-dot.info {
  background: #13c2c2;
}

.role-dot.neutral {
  background: #94a3b8;
}

.p-role {
  font-size: 10.5px;
  color: var(--neutral-400);
}

.p-name {
  font-size: 12.5px;
  color: var(--neutral-900);
}

.phone {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed var(--divider);
  font-size: 11px;
  color: var(--neutral-600);
  display: flex;
  align-items: center;
  gap: 5px;
}

.h-title {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--neutral-900);
}

.h-content {
  font-size: 12.5px;
  color: var(--neutral-600);
  line-height: 1.7;
  margin: 4px 0 6px;
}

.h-tags {
  display: flex;
  gap: 6px;
}

.rules {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 14px;
}

.rule {
  display: flex;
  gap: 10px;
  font-size: 12.5px;
  color: var(--neutral-600);
  line-height: 1.7;
}

.rule b {
  display: block;
  color: var(--neutral-900);
  font-weight: 500;
  font-size: 13px;
}

.idx {
  font-size: 11px;
  color: #1668dc;
  border: 1px solid #cfe0fa;
  border-radius: 4px;
  padding: 1px 5px;
  height: 20px;
  flex: none;
  font-variant-numeric: tabular-nums;
}

.duty-note {
  margin-top: 18px;
  padding: 14px;
  background: #f5f9ff;
  border: 1px solid #dfeafa;
  border-radius: 8px;
}

.note-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-900);
  margin: 3px 0;
}
</style>
