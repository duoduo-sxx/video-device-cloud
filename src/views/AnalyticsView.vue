<script setup lang="ts">
import { computed, ref } from 'vue'
import { Activity, AlertTriangle, Cpu, Download, Gauge, Timer } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import BaseChart from '@/components/ui/BaseChart.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { capabilities, capabilityMap } from '@/mock/capabilities'
import { formatDuration, resolutionLabel } from '@/composables/useFormat'

const data = useDataStore()
const app = useAppStore()

const range = ref<7 | 30 | 90>(30)

const points = computed(() => {
  const raw = data.trend.slice(-Math.min(range.value, 30))
  if (range.value <= 30) return raw
  const out = [...raw]
  for (let k = 1; k < 3; k++) {
    raw.forEach((p) => {
      out.push({
        date: p.date,
        hours: Math.round(p.hours * (0.82 + k * 0.06) * 10) / 10,
        vmaf: Math.round((p.vmaf - k * 0.6) * 10) / 10,
        tasks: Math.round(p.tasks * 0.9)
      })
    })
  }
  return out
})

const volumeOption = computed(() => ({
  grid: { left: 4, right: 12, top: 26, bottom: 0, containLabel: true },
  legend: { data: ['处理耗时（小时）', '素材时长（小时）'], top: 0, right: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11 } },
  xAxis: { type: 'category', data: points.value.map((p) => p.date), axisLabel: { fontSize: 10, interval: 4 } },
  yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
  series: [
    {
      name: '处理耗时（小时）',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: points.value.map((p) => p.hours),
      lineStyle: { width: 2, color: '#4F7CFF' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(79,124,255,0.28)' },
            { offset: 1, color: 'rgba(79,124,255,0)' }
          ]
        }
      }
    },
    {
      name: '素材时长（小时）',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: points.value.map((p) => Math.round(p.hours * 0.42 * 10) / 10),
      lineStyle: { width: 1.6, color: '#22D3A6', type: 'dashed' }
    }
  ]
}))

const capabilityRank = computed(() => {
  const counts: Record<string, number> = {}
  data.tasks.forEach((t) => t.pipeline.forEach((p) => (counts[p.capabilityId] = (counts[p.capabilityId] || 0) + 1)))
  return Object.entries(counts)
    .map(([id, v]) => ({ id, name: capabilityMap[id as keyof typeof capabilityMap].shortName, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
})

const rankOption = computed(() => ({
  grid: { left: 4, right: 24, top: 8, bottom: 0, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: { type: 'value', axisLabel: { fontSize: 10 }, splitLine: { show: true } },
  yAxis: {
    type: 'category',
    data: capabilityRank.value.map((c) => c.name).reverse(),
    axisLabel: { fontSize: 10 },
    axisLine: { show: false }
  },
  series: [
    {
      type: 'bar',
      data: capabilityRank.value.map((c) => c.value).reverse(),
      barWidth: 12,
      itemStyle: {
        borderRadius: [0, 3, 3, 0],
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: 'rgba(79,124,255,0.35)' },
            { offset: 1, color: '#4F7CFF' }
          ]
        }
      },
      label: { show: true, position: 'right', fontSize: 10, color: 'var(--text-3)' }
    }
  ]
}))

const effectByCap = computed(() => {
  const buckets: Record<string, { sum: number; n: number }> = {}
  data.completedTasks.forEach((t) => {
    if (!t.qualityAfter) return
    const g = t.qualityAfter.score - t.qualityBefore.score
    t.pipeline.forEach((p) => {
      const k = p.capabilityId
      if (!buckets[k]) buckets[k] = { sum: 0, n: 0 }
      buckets[k].sum += g / t.pipeline.length
      buckets[k].n += 1
    })
  })
  return capabilities
    .map((c) => ({ name: c.shortName, value: Math.round((buckets[c.id]?.sum ?? 0) / Math.max(1, buckets[c.id]?.n ?? 1) * 10) / 10 }))
    .filter((x) => x.value > 0)
})

const effectOption = computed(() => ({
  grid: { left: 4, right: 8, top: 20, bottom: 0, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: { type: 'category', data: effectByCap.value.map((x) => x.name), axisLabel: { fontSize: 10, interval: 0 } },
  yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
  series: [
    {
      type: 'bar',
      data: effectByCap.value.map((x) => x.value),
      barWidth: 20,
      itemStyle: { borderRadius: [4, 4, 0, 0], color: '#22D3A6' }
    }
  ]
}))

const successRate = computed(() => {
  const ok = data.completedTasks.length
  const fail = data.failedTasks.length
  const cancel = data.tasks.filter((t) => t.status === 'canceled').length
  const total = ok + fail + cancel || 1
  return {
    ok: Math.round((ok / total) * 100),
    fail: Math.round((fail / total) * 100),
    cancel: Math.round((cancel / total) * 100),
    total
  }
})

const successOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}：{c}%（{d}%）' },
  series: [
    {
      type: 'pie',
      radius: ['62%', '86%'],
      center: ['50%', '50%'],
      label: { show: false },
      labelLine: { show: false },
      itemStyle: { borderColor: 'var(--bg-card)', borderWidth: 2 },
      data: [
        { value: successRate.value.ok, name: '成功', itemStyle: { color: '#22D3A6' } },
        { value: successRate.value.fail, name: '失败', itemStyle: { color: '#F4526B' } },
        { value: successRate.value.cancel, name: '已取消', itemStyle: { color: '#5E687C' } }
      ]
    }
  ]
}))

const failReasons = computed(() => {
  const map: Record<string, { code: string; count: number; desc: string }> = {
    CUDA_OOM: { code: 'CUDA_OOM', count: 0, desc: '输出分辨率超出节点显存' },
    SRC_CORRUPT: { code: 'SRC_CORRUPT', count: 0, desc: '源文件坏帧或上传不完整' },
    CODEC_UNSUPPORTED: { code: 'CODEC_UNSUPPORTED', count: 0, desc: '编码格式或位深不受支持' },
    SR_TIMEOUT: { code: 'SR_TIMEOUT', count: 0, desc: '单任务超过 6 小时上限' },
    PARAM_CONFLICT: { code: 'PARAM_CONFLICT', count: 0, desc: '互斥参数同时启用' }
  }
  data.failedTasks.forEach((t) => {
    const key = t.errorCode ?? 'PARAM_CONFLICT'
    if (!map[key]) map[key] = { code: key, count: 0, desc: '其他异常' }
    map[key].count += 1
  })
  return Object.values(map).sort((a, b) => b.count - a.count)
})

const resources = computed(() => {
  const done = data.completedTasks.length || 1
  const gpuAvg = Math.round((data.tasks.reduce((s, t) => s + (t.gpuTrace.length ? t.gpuTrace[t.gpuTrace.length - 1] : 0), 0) / (data.tasks.filter((t) => t.gpuTrace.length).length || 1)))
  return {
    gpuAvg,
    vramPeak: Math.max(...data.tasks.map((t) => t.vramUsed), 0),
    avgMinutes: Math.round(data.tasks.reduce((s, t) => s + t.elapsedSec, 0) / 60 / done),
    cost: Math.round((data.tasks.reduce((s, t) => s + t.elapsedSec, 0) / 3600) * 2.4 * 100) / 100
  }
})

const detailRows = computed(() =>
  data.completedTasks.slice(0, 12).map((t) => ({
    id: t.id,
    name: t.assetName,
    res: resolutionLabel(t.output.width, t.output.height),
    caps: t.pipeline.length,
    time: formatDuration(t.elapsedSec),
    vmaf: t.qualityAfter?.vmaf ?? 0,
    score: t.qualityAfter?.score ?? 0
  }))
)

function exportCsv() {
  const header = ['任务ID', '素材', '输出规格', '能力数', '耗时', 'VMAF', '综合分']
  const lines = detailRows.value.map((r) =>
    [r.id, r.name, r.res, r.caps, r.time, r.vmaf, r.score].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
  )
  const csv = '\uFEFF' + [header.join(','), ...lines].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `用量报表_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  app.toast('success', '报表已导出', `${lines.length} 条记录`)
}
</script>

<template>
  <div class="page">
    <PageHeader title="数据报表" desc="处理量、能力分布、模型效果与资源消耗">
      <div class="seg">
        <button v-for="r in [7, 30, 90]" :key="r" :class="{ on: range === r }" @click="range = r as 7 | 30 | 90">
          {{ r }} 天
        </button>
      </div>
      <button class="btn btn-ghost" @click="exportCsv"><Download :size="14" /> 导出报表</button>
    </PageHeader>

    <div class="kpis">
      <div class="kpi card">
        <div class="k-top"><Activity :size="14" style="color: var(--primary)" /><span>任务总量</span></div>
        <div class="k-v num">{{ successRate.total }}</div>
        <div class="k-s">成功 {{ data.completedTasks.length }} · 失败 {{ data.failedTasks.length }}</div>
      </div>
      <div class="kpi card">
        <div class="k-top"><Gauge :size="14" style="color: var(--success)" /><span>平均 VMAF</span></div>
        <div class="k-v num">{{ data.stats.avgVmaf }}</div>
        <div class="k-s">成片平均感知质量</div>
      </div>
      <div class="kpi card">
        <div class="k-top"><Cpu :size="14" style="color: var(--purple)" /><span>GPU 平均利用率</span></div>
        <div class="k-v num">{{ resources.gpuAvg }}<i>%</i></div>
        <div class="k-s">显存峰值 {{ resources.vramPeak }} GB</div>
      </div>
      <div class="kpi card">
        <div class="k-top"><Timer :size="14" style="color: var(--warning)" /><span>平均单任务耗时</span></div>
        <div class="k-v num">{{ resources.avgMinutes }}<i>min</i></div>
        <div class="k-s">按小时计费 ¥{{ resources.cost }}</div>
      </div>
    </div>

    <div class="grid2">
      <SectionCard title="处理量趋势" desc="处理耗时与素材时长">
        <BaseChart :option="volumeOption" :height="240" />
      </SectionCard>
      <SectionCard title="能力使用 TOP5" desc="按调用次数排序">
        <BaseChart :option="rankOption" :height="240" />
      </SectionCard>
      <SectionCard title="各能力平均质量贡献" desc="按能力拆分计算的平均提升分">
        <BaseChart :option="effectOption" :height="230" />
      </SectionCard>
      <SectionCard title="成功率与失败原因">
        <div class="succ-wrap">
          <div class="donut">
            <BaseChart :option="successOption" :height="170" />
            <div class="donut-c">
              <div class="dc-v num">{{ successRate.ok }}<i>%</i></div>
              <div class="dc-l">成功率</div>
            </div>
          </div>
          <div class="reasons">
            <div v-for="r in failReasons" :key="r.code" class="reason">
              <div class="r-top">
                <span class="r-code mono">{{ r.code }}</span>
                <span class="r-cnt num">{{ r.count }}</span>
              </div>
              <div class="r-desc">{{ r.desc }}</div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>

    <SectionCard title="任务明细" desc="最近 12 条已完成任务" no-pad>
      <table class="tbl">
        <thead>
          <tr>
            <th style="width: 168px">任务 ID</th>
            <th>素材</th>
            <th style="width: 90px">输出</th>
            <th style="width: 76px">能力数</th>
            <th style="width: 96px">耗时</th>
            <th style="width: 76px">VMAF</th>
            <th style="width: 76px">综合分</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in detailRows" :key="r.id">
            <td class="mono tid">{{ r.id }}</td>
            <td class="ellipsis" style="max-width: 380px">{{ r.name }}</td>
            <td><span class="tag">{{ r.res }}</span></td>
            <td class="num">{{ r.caps }}</td>
            <td class="num">{{ r.time }}</td>
            <td class="num">{{ r.vmaf }}</td>
            <td class="num score">{{ r.score }}</td>
          </tr>
        </tbody>
      </table>
    </SectionCard>

    <div class="note">
      <AlertTriangle :size="12" />
      报表数据基于已完成任务统计；失败任务不计入质量指标，单独计入成功率分母。
    </div>
  </div>
</template>

<style scoped>
.seg {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 7px;
}
.seg button {
  padding: 3px 10px;
  font-size: 11.5px;
  color: var(--text-3);
  border-radius: 5px;
}
.seg button.on {
  background: var(--bg-inset);
  color: var(--text-1);
}
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.kpi {
  padding: 14px 16px;
}
.k-top {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-3);
}
.k-v {
  font-size: 25px;
  font-weight: 500;
  color: var(--text-1);
  letter-spacing: -0.03em;
  margin-top: 8px;
  line-height: 1.1;
}
.k-v i {
  font-style: normal;
  font-size: 12px;
  color: var(--text-3);
  margin-left: 1px;
}
.k-s {
  font-size: 10.5px;
  color: var(--text-3);
  margin-top: 6px;
}
.grid2 {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.succ-wrap {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.donut {
  position: relative;
  width: 170px;
  flex: none;
}
.donut-c {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.dc-v {
  font-size: 22px;
  font-weight: 500;
  color: var(--text-1);
}
.dc-v i {
  font-style: normal;
  font-size: 11px;
  color: var(--text-3);
}
.dc-l {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 2px;
}
.reasons {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.reason {
  padding-bottom: 7px;
  border-bottom: 1px dashed var(--border-subtle);
}
.reason:last-child {
  border-bottom: none;
}
.r-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.r-code {
  font-size: 10px;
  color: var(--danger);
}
.r-cnt {
  font-size: 11px;
  color: var(--text-2);
}
.r-desc {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 2px;
}
.tid {
  font-size: 11px;
  color: var(--text-2);
}
.score {
  color: var(--success);
  font-weight: 500;
}
.note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 10.5px;
  color: var(--text-3);
}
@media (max-width: 1200px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .grid2 {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
