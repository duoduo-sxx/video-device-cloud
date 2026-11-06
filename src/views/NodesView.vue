<script setup lang="ts">
import { computed } from 'vue'
import { Activity, AlertTriangle, CheckCircle2, Globe, RefreshCw, Server } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import Sparkline from '@/components/ui/Sparkline.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'

const data = useDataStore()
const app = useAppStore()

const avgLatency = computed(() =>
  Math.round(data.nodes.reduce((s, n) => s + n.latencyMs, 0) / data.nodes.length)
)
const normal = computed(() => data.nodes.filter((n) => n.status === '正常').length)
const warned = computed(() => data.nodes.filter((n) => n.status === '告警').length)
const avgUptime = computed(() =>
  Math.round((data.nodes.reduce((s, n) => s + n.uptime30d, 0) / data.nodes.length) * 100) / 100
)

function series(seed: number): number[] {
  return Array.from({ length: 16 }, (_, i) => 40 + Math.abs(Math.sin((i + seed) / 2.6)) * 50)
}

function loadColor(v: number): string {
  if (v >= 85) return 'var(--danger)'
  if (v >= 70) return 'var(--warning)'
  return 'var(--success)'
}

function refresh() {
  app.toast('success', '状态已刷新', '所有节点指标已更新至最新')
}
</script>

<template>
  <div class="page">
    <PageHeader title="节点状态" desc="计算节点、存储与调度服务的实时健康度">
      <button class="btn btn-ghost" @click="refresh"><RefreshCw :size="14" /> 刷新</button>
    </PageHeader>

    <div class="overview">
      <div class="ov card">
        <div class="ov-icon" style="color: var(--success)"><CheckCircle2 :size="15" /></div>
        <div>
          <div class="ov-l">运行正常</div>
          <div class="ov-v num">{{ normal }}<i>/ {{ data.nodes.length }}</i></div>
        </div>
      </div>
      <div class="ov card">
        <div class="ov-icon" style="color: var(--warning)"><AlertTriangle :size="15" /></div>
        <div>
          <div class="ov-l">告警节点</div>
          <div class="ov-v num">{{ warned }}</div>
        </div>
      </div>
      <div class="ov card">
        <div class="ov-icon" style="color: var(--primary)"><Activity :size="15" /></div>
        <div>
          <div class="ov-l">平均延迟</div>
          <div class="ov-v num">{{ avgLatency }}<i>ms</i></div>
        </div>
      </div>
      <div class="ov card">
        <div class="ov-icon" style="color: var(--purple)"><Globe :size="15" /></div>
        <div>
          <div class="ov-l">30 天平均可用率</div>
          <div class="ov-v num">{{ avgUptime }}<i>%</i></div>
        </div>
      </div>
    </div>

    <div class="nodes">
      <article v-for="(n, i) in data.nodes" :key="n.name" class="node card">
        <div class="n-head">
          <div class="n-title-wrap">
            <div class="n-icon"><Server :size="14" /></div>
            <div>
              <div class="n-name">{{ n.name }}</div>
              <div class="n-sub">{{ n.type }} · {{ n.region }}</div>
            </div>
          </div>
          <StatusBadge :status="n.status" kind="node" />
        </div>

        <div class="n-stats">
          <div class="ns">
            <span class="ns-l">延迟</span>
            <span class="ns-v num">{{ n.latencyMs }}<i>ms</i></span>
          </div>
          <div class="ns">
            <span class="ns-l">负载</span>
            <span class="ns-v num" :style="{ color: loadColor(n.load) }">{{ n.load }}<i>%</i></span>
          </div>
          <div class="ns">
            <span class="ns-l">可用率</span>
            <span class="ns-v num">{{ n.uptime30d }}<i>%</i></span>
          </div>
        </div>

        <div class="load-bar">
          <div :style="{ width: n.load + '%', background: loadColor(n.load) }" />
        </div>

        <div class="n-chart">
          <Sparkline
            :values="series(i)"
            :color="n.status === '告警' ? 'var(--warning)' : 'var(--primary)'"
            :width="280"
            :height="42"
          />
        </div>

        <div class="n-foot">
          <span class="n-tag">近 15 分钟负载趋势</span>
          <button
            class="btn btn-subtle btn-sm"
            @click="app.toast('info', '节点详情', `${n.name} 的完整监控指标可在运维控制台查看`)"
          >
            详情
          </button>
        </div>
      </article>
    </div>

    <div class="banner">
      <AlertTriangle :size="14" />
      <div>
        <div class="b-title">模型推理节点（杭州）当前负载 91%，已触发自动限流</div>
        <div class="b-desc">新提交的任务将被优先调度至华东 · 上海节点，预计 22:00 后恢复。如需紧急处理，可提交高优先级工单。</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.ov {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}
.ov-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-inset);
  display: grid;
  place-items: center;
  flex: none;
}
.ov-l {
  font-size: 11px;
  color: var(--text-3);
}
.ov-v {
  font-size: 21px;
  font-weight: 500;
  color: var(--text-1);
  letter-spacing: -0.02em;
  margin-top: 2px;
}
.ov-v i {
  font-style: normal;
  font-size: 11px;
  color: var(--text-3);
  margin-left: 2px;
  letter-spacing: 0;
}
.nodes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.node {
  padding: 16px;
}
.n-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.n-title-wrap {
  display: flex;
  gap: 10px;
  min-width: 0;
}
.n-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--bg-inset);
  color: var(--text-2);
  display: grid;
  place-items: center;
  flex: none;
}
.n-name {
  font-size: 13px;
  color: var(--text-1);
  font-weight: 500;
}
.n-sub {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 2px;
}
.n-stats {
  display: flex;
  gap: 26px;
  margin-top: 14px;
}
.ns {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ns-l {
  font-size: 10px;
  color: var(--text-3);
}
.ns-v {
  font-size: 15px;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}
.ns-v i {
  font-style: normal;
  font-size: 9.5px;
  color: var(--text-3);
  margin-left: 1px;
}
.load-bar {
  height: 3px;
  background: var(--border);
  border-radius: 99px;
  margin-top: 12px;
  overflow: hidden;
}
.load-bar div {
  height: 100%;
  border-radius: 99px;
  transition: width 0.5s var(--ease);
}
.n-chart {
  margin-top: 8px;
  opacity: 0.8;
}
.n-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}
.n-tag {
  font-size: 9.5px;
  color: var(--text-3);
}
.banner {
  display: flex;
  gap: 10px;
  padding: 13px 16px;
  border: 1px solid rgba(245, 165, 36, 0.28);
  background: var(--warning-soft);
  border-radius: 10px;
  color: var(--warning);
}
.banner svg {
  flex: none;
  margin-top: 1px;
}
.b-title {
  font-size: 12px;
  color: var(--text-1);
  font-weight: 500;
}
.b-desc {
  font-size: 11px;
  color: var(--text-2);
  line-height: 1.65;
  margin-top: 4px;
}
@media (max-width: 1200px) {
  .overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .nodes {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
