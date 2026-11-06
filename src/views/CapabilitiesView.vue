<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Clapperboard,
  Eraser,
  Film,
  Focus,
  Info,
  Palette,
  ScanFace,
  ScanText,
  Sparkles,
  Star,
  Video,
  Waves
} from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import BaseDrawer from '@/components/ui/BaseDrawer.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import { capabilities } from '@/mock/capabilities'
import { models } from '@/mock/models'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import type { Capability, ParamSchema } from '@/types'

const data = useDataStore()
const app = useAppStore()

const iconMap: Record<string, unknown> = {
  Sparkles,
  Waves,
  Eraser,
  Focus,
  Film,
  Video,
  Palette,
  ScanFace,
  ScanText,
  Clapperboard
}

const current = ref<Capability | null>(null)
const drawer = ref(false)

function openCap(c: Capability) {
  current.value = c
  drawer.value = true
}

function typeLabel(p: ParamSchema): string {
  return { slider: '滑块', select: '下拉', switch: '开关', segmented: '分段' }[p.type]
}

function rangeText(p: ParamSchema): string {
  if (p.type === 'slider') return `${p.min} – ${p.max}${p.unit ?? ''}`
  if (p.options) return `${p.options.length} 个选项`
  return p.type === 'switch' ? '开 / 关' : '—'
}

function defaultText(p: ParamSchema): string {
  if (typeof p.default === 'boolean') return p.default ? '开启' : '关闭'
  if (p.type === 'select' || p.type === 'segmented') {
    const hit = p.options?.find((o) => o.value === p.default)
    return hit ? hit.label : String(p.default)
  }
  return `${p.default}${p.unit ?? ''}`
}

const modelRows = computed(() =>
  models.map((m) => ({ ...m, enabled: data.modelEnabled[m.id] ?? m.enabled }))
)

function toggleModel(id: string, name: string) {
  data.toggleModel(id)
  app.toast('info', data.modelEnabled[id] ? '模型已启用' : '模型已停用', name)
}

const totalCalls = computed(() => capabilities.reduce((s, c) => s + c.monthlyCalls, 0))
</script>

<template>
  <div class="page">
    <PageHeader title="能力与模型" desc="10 类画质增强能力与 12 个推理模型，可自由组合为处理流水线">
      <span class="tag">本月调用 {{ totalCalls.toLocaleString() }} 次</span>
    </PageHeader>

    <div class="cap-grid">
      <button v-for="c in capabilities" :key="c.id" class="cap card card-hover" @click="openCap(c)">
        <div class="cap-top">
          <div class="icon"><component :is="iconMap[c.icon]" :size="16" /></div>
          <span class="cat">{{ c.category }}</span>
          <span class="calls num">{{ c.monthlyCalls }} 次</span>
        </div>
        <div class="name">{{ c.name }}</div>
        <div class="desc clamp-2">{{ c.description }}</div>
        <div class="foot">
          <span>{{ c.modelCount }} 个模型</span>
          <i class="sep" />
          <span>{{ c.params.length }} 项参数</span>
        </div>
      </button>
    </div>

    <SectionCard title="模型库" :desc="`共 ${models.length} 个模型，停用后不可在任务向导中选择`" no-pad class="models-card">
      <table class="tbl">
        <thead>
          <tr>
            <th>模型</th>
            <th>类型</th>
            <th>适用场景</th>
            <th>显存</th>
            <th>单帧耗时</th>
            <th>评分</th>
            <th>精度</th>
            <th style="width: 80px">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in modelRows" :key="m.id" :class="{ off: !m.enabled }">
            <td>
              <div class="m-name">{{ m.name }}</div>
              <div class="m-ver mono">{{ m.version }}</div>
            </td>
            <td><span class="tag">{{ m.type }}</span></td>
            <td>
              <div class="scenes">
                <span v-for="s in m.scenes" :key="s" class="scene">{{ s }}</span>
              </div>
            </td>
            <td class="num">{{ m.vram }} GB</td>
            <td class="num">{{ m.latencyMs }} ms</td>
            <td>
              <span class="rating"><Star :size="11" fill="var(--warning)" color="var(--warning)" />{{ m.rating }}</span>
            </td>
            <td class="mono f12 t2">{{ m.precision }}</td>
            <td>
              <BaseSwitch :model-value="m.enabled" :label="m.name" @update:model-value="toggleModel(m.id, m.name)" />
            </td>
          </tr>
        </tbody>
      </table>
    </SectionCard>

    <BaseDrawer
      v-model="drawer"
      :title="current?.name ?? ''"
      :desc="current?.description"
      :width="660"
    >
      <div v-if="current" class="detail">
        <div class="d-section">
          <div class="d-title"><Info :size="13" /> 工作原理</div>
          <p class="d-text">{{ current.principle }}</p>
        </div>

        <div class="d-section">
          <div class="d-title">适用场景</div>
          <div class="sc-list">
            <span v-for="s in current.scenarios" :key="s" class="tag tag-primary">{{ s }}</span>
          </div>
        </div>

        <div class="d-section">
          <div class="d-title">效果示意</div>
          <div class="preview">
            <div class="pv-item">
              <div class="pv-img before"><span>处理前</span></div>
              <div class="pv-cap">边缘模糊 · 噪点明显</div>
            </div>
            <div class="pv-arrow">→</div>
            <div class="pv-item">
              <div class="pv-img after"><span>处理后</span></div>
              <div class="pv-cap">细节重建 · 边缘锐利</div>
            </div>
          </div>
        </div>

        <div class="d-section">
          <div class="d-title">参数说明</div>
          <table class="param-tbl">
            <thead>
              <tr>
                <th>参数</th>
                <th>控件</th>
                <th>范围</th>
                <th>默认</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in current.params" :key="p.key">
                <td class="pk">{{ p.label }}</td>
                <td class="t2">{{ typeLabel(p) }}</td>
                <td class="num t2">{{ rangeText(p) }}</td>
                <td class="num">{{ defaultText(p) }}</td>
                <td class="tip">{{ p.tip }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-section">
          <div class="d-title">注意事项</div>
          <ul class="notice">
            <li v-for="(n, i) in current.notice" :key="i">{{ n }}</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="drawer = false">关闭</button>
        <button class="btn btn-primary" @click="$router.push('/tasks/new')">用它创建任务</button>
      </template>
    </BaseDrawer>
  </div>
</template>

<style scoped>
.cap-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.cap {
  text-align: left;
  padding: 16px;
  cursor: pointer;
}
.cap-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--primary-soft);
  color: var(--primary);
  display: grid;
  place-items: center;
  flex: none;
}
.cat {
  font-size: 10px;
  color: var(--text-3);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0 5px;
  line-height: 16px;
}
.calls {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-3);
}
.name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-1);
  margin-top: 12px;
}
.desc {
  font-size: 11.5px;
  color: var(--text-3);
  line-height: 1.6;
  margin-top: 6px;
  min-height: 36px;
}
.foot {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  color: var(--text-3);
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}
.sep {
  width: 1px;
  height: 8px;
  background: var(--border-strong);
}
.models-card {
  margin-bottom: 8px;
}
.m-name {
  font-size: 12.5px;
  color: var(--text-1);
}
.m-ver {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 1px;
}
.scenes {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.scene {
  font-size: 10px;
  color: var(--text-3);
  background: var(--bg-inset);
  border-radius: 4px;
  padding: 1px 5px;
}
.rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}
tr.off {
  opacity: 0.45;
}
.detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.d-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 9px;
}
.d-text {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.8;
}
.sc-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.preview {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pv-item {
  flex: 1;
  min-width: 0;
}
.pv-img {
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
}
.pv-img.before {
  background: linear-gradient(140deg, #1b2a4a 0%, #0d1526 55%, #241a3a 100%);
  filter: blur(1.2px) saturate(0.8) contrast(0.92);
}
.pv-img.after {
  background: linear-gradient(140deg, #1f3560 0%, #10203a 50%, #2b2050 100%);
}
.pv-img.after::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 3px);
  opacity: 0.5;
}
.pv-img span {
  position: absolute;
  left: 8px;
  top: 8px;
  font-size: 9.5px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.4);
  border-radius: 3px;
  padding: 1px 5px;
}
.pv-cap {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 6px;
  text-align: center;
}
.pv-arrow {
  color: var(--text-3);
  font-size: 14px;
  padding-top: 20px;
}
.param-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.param-tbl th {
  text-align: left;
  font-weight: 500;
  color: var(--text-3);
  font-size: 10px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
}
.param-tbl td {
  padding: 7px 8px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: top;
  color: var(--text-2);
  line-height: 1.55;
}
.pk {
  color: var(--text-1) !important;
  white-space: nowrap;
}
.tip {
  font-size: 10px;
  color: var(--text-3) !important;
}
.notice {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.notice li {
  position: relative;
  padding-left: 13px;
  font-size: 11.5px;
  color: var(--text-2);
  line-height: 1.65;
}
.notice li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--warning);
}
@media (max-width: 1280px) {
  .cap-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
