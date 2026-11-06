<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowUpRight, Download, Gauge, TrendingUp, Trophy, Layers } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import BaseChart from '@/components/ui/BaseChart.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { capabilityMap } from '@/mock/capabilities'
import { formatDate, resolutionLabel } from '@/composables/useFormat'

const data = useDataStore()
const app = useAppStore()
const router = useRouter()

const range = ref(30)
const grade = ref<'all' | 'excellent' | 'good' | 'pass' | 'poor'>('all')

const rangeOptions = [
  { label: '近 7 天', value: 7 },
  { label: '近 30 天', value: 30 },
  { label: '近 90 天', value: 90 }
]
const gradeOptions = [
  { label: '全部评级', value: 'all' },
  { label: '优秀（+30 以上）', value: 'excellent' },
  { label: '良好（+20 ~ 30）', value: 'good' },
  { label: '合格（+10 ~ 20）', value: 'pass' },
  { label: '待优化（+10 以下）', value: 'poor' }
]

interface Row {
  id: string
  assetName: string
  resolution: string
  pipeline: string
  psnrBefore: number
  psnrAfter: number
  ssimBefore: number
  ssimAfter: number
  vmafBefore: number
  vmafAfter: number
  gain: number
  durationMin: number
  date: string
}

const allRows = computed<Row[]>(() => {
  const cutoff = Date.now() - range.value * 86400000
  return data.tasks
    .filter((t) => t.status === 'completed' && t.qualityAfter && new Date(t.createdAt).getTime() >= cutoff)
    .map((t) => {
      const a = t.qualityAfter!
      return {
        id: t.id,
        assetName: t.assetName,
        resolution: resolutionLabel(t.output.width, t.output.height),
        pipeline: t.pipeline.map((p) => capabilityMap[p.capabilityId].shortName).join(' / '),
        psnrBefore: t.qualityBefore.psnr,
        psnrAfter: a.psnr,
        ssimBefore: t.qualityBefore.ssim,
        ssimAfter: a.ssim,
        vmafBefore: t.qualityBefore.vmaf,
        vmafAfter: a.vmaf,
        gain: Math.round((a.score - t.qualityBefore.score) * 10) / 10,
        durationMin: Math.round(t.elapsedSec / 60),
        date: formatDate(t.createdAt)
      }
    })
    .sort((x, y) => y.gain - x.gain)
})

const rows = computed(() =>
  allRows.value.filter((r) => {
    if (grade.value === 'all') return true
    if (grade.value === 'excellent') return r.gain >= 30
    if (grade.value === 'good') return r.gain >= 20 && r.gain < 30
    if (grade.value === 'pass') return r.gain >= 10 && r.gain < 20
    return r.gain < 10
  })
)

const gradeOf = (g: number) =>
  g >= 30
    ? { label: '优秀', cls: 'tag-success' }
    : g >= 20
      ? { label: '良好', cls: 'tag-primary' }
      : g >= 10
        ? { label: '合格', cls: 'tag-warning' }
        : { label: '待优化', cls: 'tag-danger' }

const summary = computed(() => {
  const list = allRows.value
  if (!list.length) return { avgVmaf: 0, avgGain: 0, excellentRate: 0, count: 0 }
  const avgVmaf = list.reduce((s, r) => s + r.vmafAfter, 0) / list.length
  const avgGain = list.reduce((s, r) => s + r.gain, 0) / list.length
  const excellent = list.filter((r) => r.gain >= 30).length
  return {
    avgVmaf: Math.round(avgVmaf * 10) / 10,
    avgGain: Math.round(avgGain * 10) / 10,
    excellentRate: Math.round((excellent / list.length) * 100),
    count: list.length
  }
})

const scatterOption = computed(() => ({
  grid: { left: 4, right: 12, top: 16, bottom: 4, containLabel: true },
  tooltip: {
    trigger: 'item',
    formatter: (p: { data: number[] }) => `处理 ${p.data[0]} 分钟<br/>提升 +${p.data[1]} 分`
  },
  xAxis: { type: 'value', name: '处理耗时（分钟）', nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10 } },
  yAxis: { type: 'value', name: '提升分', nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10 } },
  series: [
    {
      type: 'scatter',
      symbolSize: (d: number[]) => Math.min(26, 8 + d[0] / 12),
      itemStyle: { color: 'rgba(79,124,255,0.72)', borderColor: '#6A90FF', borderWidth: 1 },
      data: allRows.value.map((r) => [r.durationMin, r.gain])
    }
  ]
}))

function exportCsv() {
  const header = ['任务ID', '素材', '输出规格', '流水线', 'PSNR前', 'PSNR后', 'SSIM前', 'SSIM后', 'VMAF前', 'VMAF后', '提升分', '评级', '日期']
  const lines = rows.value.map((r) =>
    [r.id, r.assetName, r.resolution, r.pipeline, r.psnrBefore, r.psnrAfter, r.ssimBefore, r.ssimAfter, r.vmafBefore, r.vmafAfter, r.gain, gradeOf(r.gain).label, r.date]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  )
  const csv = '\uFEFF' + [header.join(','), ...lines].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `质量评估报告_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  app.toast('success', '报告已导出', `${rows.value.length} 条记录已生成 CSV`)
}
</script>

<template>
  <div class="page">
    <PageHeader title="质量评估" desc="汇总所有已完成任务的客观指标与主观评级">
      <div class="range">
        <BaseSelect v-model="range" :options="rangeOptions" size="sm" />
      </div>
      <button class="btn btn-ghost" @click="exportCsv"><Download :size="14" /> 导出 CSV</button>
    </PageHeader>

    <div class="cards">
      <div class="qc card">
        <div class="qc-icon" style="color: var(--primary)"><Gauge :size="15" /></div>
        <div class="qc-body">
          <div class="qc-l">平均 VMAF（成片）</div>
          <div class="qc-v num">{{ summary.avgVmaf }}</div>
        </div>
        <span class="qc-tag tag tag-success"><ArrowUpRight :size="10" /> 感知质量</span>
      </div>
      <div class="qc card">
        <div class="qc-icon" style="color: var(--success)"><TrendingUp :size="15" /></div>
        <div class="qc-body">
          <div class="qc-l">平均质量提升</div>
          <div class="qc-v num">+{{ summary.avgGain }}</div>
        </div>
        <span class="qc-tag tag">综合分</span>
      </div>
      <div class="qc card">
        <div class="qc-icon" style="color: var(--warning)"><Trophy :size="15" /></div>
        <div class="qc-body">
          <div class="qc-l">优秀率</div>
          <div class="qc-v num">{{ summary.excellentRate }}<i>%</i></div>
        </div>
        <span class="qc-tag tag tag-warning">+30 分以上</span>
      </div>
      <div class="qc card">
        <div class="qc-icon" style="color: var(--purple)"><Layers :size="15" /></div>
        <div class="qc-body">
          <div class="qc-l">样本数</div>
          <div class="qc-v num">{{ summary.count }}</div>
        </div>
        <span class="qc-tag tag">已完成任务</span>
      </div>
    </div>

    <div class="mid">
      <SectionCard title="提升分分布" desc="X 轴为处理耗时，Y 轴为质量提升分，气泡大小代表耗时">
        <BaseChart v-if="allRows.length" :option="scatterOption" :height="220" />
        <div v-else class="no-chart">暂无数据</div>
      </SectionCard>
    </div>

    <SectionCard title="指标明细" :desc="`共 ${rows.length} 条`" no-pad>
      <template #actions>
        <div class="grade-filter">
          <BaseSelect v-model="grade" :options="gradeOptions" size="sm" />
        </div>
      </template>
      <div v-if="!rows.length" class="empty-wrap">
        <EmptyState title="暂无评估记录" desc="完成增强任务后，这里会自动汇总客观指标" />
      </div>
      <table v-else class="tbl">
        <thead>
          <tr>
            <th style="width: 160px">任务</th>
            <th>素材</th>
            <th style="width: 96px">输出</th>
            <th style="width: 150px">流水线</th>
            <th style="width: 96px">PSNR</th>
            <th style="width: 96px">SSIM</th>
            <th style="width: 96px">VMAF</th>
            <th style="width: 70px">提升</th>
            <th style="width: 80px">评级</th>
            <th style="width: 96px">日期</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" @click="router.push(`/tasks/${r.id}/compare`)">
            <td class="mono tid">{{ r.id }}</td>
            <td class="ellipsis name-cell">{{ r.assetName }}</td>
            <td><span class="tag">{{ r.resolution }}</span></td>
            <td class="t2 f12 ellipsis">{{ r.pipeline }}</td>
            <td class="num f12">
              <span class="bf">{{ r.psnrBefore }}</span>
              <span class="ar">→ {{ r.psnrAfter }}</span>
            </td>
            <td class="num f12">
              <span class="bf">{{ r.ssimBefore }}</span>
              <span class="ar">→ {{ r.ssimAfter }}</span>
            </td>
            <td class="num f12">
              <span class="bf">{{ r.vmafBefore }}</span>
              <span class="ar">→ {{ r.vmafAfter }}</span>
            </td>
            <td class="num gain">+{{ r.gain }}</td>
            <td><span class="tag" :class="gradeOf(r.gain).cls">{{ gradeOf(r.gain).label }}</span></td>
            <td class="num t3 f12">{{ r.date }}</td>
          </tr>
        </tbody>
      </table>
    </SectionCard>
  </div>
</template>

<style scoped>
.range {
  width: 128px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.qc {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  position: relative;
}
.qc-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-inset);
  display: grid;
  place-items: center;
  flex: none;
}
.qc-body {
  flex: 1;
  min-width: 0;
}
.qc-l {
  font-size: 11px;
  color: var(--text-3);
}
.qc-v {
  font-size: 22px;
  font-weight: 500;
  color: var(--text-1);
  letter-spacing: -0.03em;
  margin-top: 2px;
  line-height: 1.2;
}
.qc-v i {
  font-style: normal;
  font-size: 12px;
  color: var(--text-3);
  margin-left: 1px;
}
.qc-tag {
  position: absolute;
  right: 14px;
  top: 14px;
  font-size: 9.5px;
  height: 19px;
}
.mid {
  margin-bottom: 16px;
}
.no-chart {
  padding: 50px;
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
}
.empty-wrap {
  padding: 20px 0;
}
.tid {
  font-size: 11px;
  color: var(--text-2);
}
.name-cell {
  max-width: 260px;
  font-size: 12.5px;
}
.bf {
  color: var(--text-3);
}
.ar {
  color: var(--success);
  margin-left: 4px;
}
.gain {
  color: var(--success);
  font-weight: 500;
}
.grade-filter {
  width: 168px;
}
tbody tr {
  cursor: pointer;
}
@media (max-width: 1200px) {
  .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
