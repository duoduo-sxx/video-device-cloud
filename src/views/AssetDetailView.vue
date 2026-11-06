<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Download,
  Film,
  Info,
  Plus,
  Sparkles,
  Trash2,
  Wand2
} from 'lucide-vue-next'
import VideoPlayer from '@/components/player/VideoPlayer.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { capabilityMap } from '@/mock/capabilities'
import {
  aspectLabel,
  formatBitrate,
  formatBytes,
  formatDateTime,
  formatDuration,
  resolutionLabel,
  scoreColor
} from '@/composables/useFormat'

const route = useRoute()
const router = useRouter()
const data = useDataStore()
const app = useAppStore()

const asset = computed(() => data.assetById(String(route.params.assetId)))
const tab = ref<'info' | 'quality' | 'history' | 'tasks'>('info')
const confirmDelete = ref(false)

const relatedTasks = computed(() =>
  asset.value ? data.tasks.filter((t) => t.assetId === asset.value?.id) : []
)

const infoRows = computed(() => {
  const a = asset.value
  if (!a) return []
  return [
    { k: '容器格式', v: a.container },
    { k: '视频编码', v: `${a.codec} ${a.profile}` },
    { k: '分辨率', v: `${a.width} × ${a.height}（${resolutionLabel(a.width, a.height)} · ${aspectLabel(a.width, a.height)}）` },
    { k: '帧率', v: `${a.fps} fps` },
    { k: '码率', v: formatBitrate(a.bitrate) },
    { k: '位深 / 色度', v: `${a.bitDepth} bit · ${a.chroma}` },
    { k: '色彩空间', v: `${a.colorSpace}${a.hdr ? ' · ' + a.hdr : ''}` },
    { k: '音频', v: a.audio ? `${a.audio.codec} · ${a.audio.channels}ch · ${a.audio.sampleRate / 1000}kHz` : '无音轨' },
    { k: '时长', v: formatDuration(a.duration) },
    { k: '文件大小', v: formatBytes(a.size) },
    { k: '上传人', v: a.uploadedBy },
    { k: '上传时间', v: formatDateTime(a.uploadedAt) },
    { k: 'MD5（前 8 位）', v: a.md5 }
  ]
})

const diagRows = computed(() => {
  const d = asset.value?.diagnosis
  if (!d) return []
  return [
    { label: '清晰度', value: d.sharpness, hint: '边缘锐度与高频能量' },
    { label: '噪点', value: d.noise, hint: '时域方差估计' },
    { label: '压缩伪影', value: d.artifact, hint: '8×8 块边界能量' },
    { label: '抖动', value: d.shake, hint: '全局运动高频占比' },
    { label: '曝光', value: d.exposure, hint: '直方图截断比例' }
  ]
})

function sevColor(v: number): string {
  if (v >= 3.8) return 'var(--danger)'
  if (v >= 2.6) return 'var(--warning)'
  return 'var(--success)'
}

const recommendation = computed(() => {
  const d = asset.value?.diagnosis
  if (!d) return []
  const out: string[] = []
  if (d.shake >= 2.4) out.push('stabilization')
  if (d.artifact >= 3) out.push('artifactRemoval')
  if (d.noise >= 3) out.push('denoise')
  if (d.sharpness >= 2.6) out.push('superResolution')
  if (d.exposure >= 3) out.push('colorEnhance')
  if (!out.length) out.push('denoise', 'superResolution')
  return out
})

function createTask() {
  router.push(`/tasks/new?assets=${asset.value?.id}`)
}

function del() {
  if (asset.value) {
    data.removeAssets([asset.value.id])
    app.toast('success', '素材已删除', asset.value.name)
    router.push('/library')
  }
}
</script>

<template>
  <div v-if="asset" class="page">
    <div class="head">
      <button class="btn btn-subtle btn-icon" aria-label="返回" @click="router.push('/library')">
        <ArrowLeft :size="16" />
      </button>
      <div class="head-main">
        <div class="row gap-8">
          <h1 class="title ellipsis">{{ asset.name }}</h1>
          <StatusBadge :status="asset.status" kind="asset" />
        </div>
        <div class="sub">
          <span>{{ asset.width }}×{{ asset.height }}</span>
          <i class="sep" />
          <span>{{ formatDuration(asset.duration) }}</span>
          <i class="sep" />
          <span>{{ formatBytes(asset.size) }}</span>
          <i class="sep" />
          <span>{{ asset.codec }}</span>
          <i class="sep" />
          <span class="mono">{{ asset.id }}</span>
        </div>
      </div>
      <div class="head-ops">
        <button class="btn btn-ghost btn-sm" @click="app.toast('info', '正在准备下载', '原始素材将打包为 ZIP，预计 30 秒')">
          <Download :size="13" /> 下载原片
        </button>
        <button class="btn btn-ghost btn-sm btn-danger" @click="confirmDelete = true">
          <Trash2 :size="13" /> 删除
        </button>
        <button class="btn btn-primary" @click="createTask"><Plus :size="14" /> 创建增强任务</button>
      </div>
    </div>

    <div class="layout">
      <div class="left">
        <VideoPlayer :name="asset.name" :duration="asset.duration" :seed="Number(asset.id.slice(-3))" />
        <div class="quick-stats">
          <div class="qs">
            <span class="qs-l">当前质量分</span>
            <span class="qs-v num" :style="{ color: scoreColor(asset.qualityScore) }">{{ asset.qualityScore }}</span>
          </div>
          <div class="qs">
            <span class="qs-l">建议方案</span>
            <span class="qs-v small">{{ recommendation.map((r) => capabilityMap[r as keyof typeof capabilityMap].shortName).join(' → ') }}</span>
          </div>
          <div class="qs">
            <span class="qs-l">历史处理</span>
            <span class="qs-v small">{{ relatedTasks.length }} 次</span>
          </div>
          <div class="qs">
            <span class="qs-l">素材来源</span>
            <span class="qs-v small">{{ data.collections.find((c) => c.id === asset?.collectionId)?.name ?? '未归类' }}</span>
          </div>
        </div>
        <div class="tags-row">
          <span v-for="t in asset.tags" :key="t" class="tag">{{ t }}</span>
        </div>
      </div>

      <div class="right">
        <div class="tabs">
          <button :class="{ on: tab === 'info' }" @click="tab = 'info'">媒体信息</button>
          <button :class="{ on: tab === 'quality' }" @click="tab = 'quality'">质量诊断</button>
          <button :class="{ on: tab === 'history' }" @click="tab = 'history'">处理历史</button>
          <button :class="{ on: tab === 'tasks' }" @click="tab = 'tasks'">关联任务</button>
        </div>

        <div v-if="tab === 'info'" class="panel">
          <div v-for="r in infoRows" :key="r.k" class="info-row">
            <span class="k">{{ r.k }}</span>
            <span class="v num">{{ r.v }}</span>
          </div>
        </div>

        <div v-else-if="tab === 'quality'" class="panel">
          <div class="diag-head">
            <div>
              <div class="diag-title">自动质量诊断</div>
              <div class="diag-sub">分数为 0–5 的「问题严重度」，越高代表问题越明显</div>
            </div>
            <span class="tag tag-primary"><Sparkles :size="11" /> AI 分析</span>
          </div>
          <div v-for="d in diagRows" :key="d.label" class="diag-row">
            <div class="diag-top">
              <span class="diag-label">{{ d.label }}</span>
              <span class="diag-val num" :style="{ color: sevColor(d.value) }">{{ d.value.toFixed(1) }}</span>
            </div>
            <div class="track">
              <div
                class="track-fill"
                :style="{ width: (d.value / 5) * 100 + '%', background: sevColor(d.value) }"
              />
            </div>
            <div class="diag-hint">{{ d.hint }}</div>
          </div>
          <div class="summary">
            <Info :size="14" class="sum-ic" />
            <p>{{ asset.diagnosis.summary }}</p>
          </div>
          <button class="btn btn-primary rec-btn" @click="createTask">
            <Wand2 :size="14" />
            应用推荐方案（{{ recommendation.length }} 项能力）
          </button>
        </div>

        <div v-else-if="tab === 'history'" class="panel">
          <div v-if="!relatedTasks.length" class="mini-empty">该素材还没有处理记录</div>
          <div v-for="t in relatedTasks" :key="t.id" class="hist-item" @click="router.push(`/tasks/${t.id}`)">
            <div class="hist-dot" :style="{ background: t.status === 'completed' ? 'var(--success)' : 'var(--text-3)' }" />
            <div class="hist-main">
              <div class="hist-title ellipsis">{{ t.pipeline.map((p) => capabilityMap[p.capabilityId].shortName).join(' → ') }}</div>
              <div class="hist-meta">
                <span class="mono">{{ t.id }}</span>
                <i class="sep" />
                <span>{{ formatDateTime(t.createdAt) }}</span>
                <i class="sep" />
                <span>{{ t.status === 'completed' ? '已完成' : t.status }}</span>
              </div>
            </div>
            <span v-if="t.qualityAfter" class="hist-gain num">
              +{{ (t.qualityAfter.score - t.qualityBefore.score).toFixed(0) }}
            </span>
          </div>
        </div>

        <div v-else class="panel">
          <div v-if="!relatedTasks.length" class="mini-empty">暂无关联任务，点击下方按钮创建</div>
          <div v-for="t in relatedTasks" :key="t.id" class="task-row" @click="router.push(`/tasks/${t.id}`)">
            <div class="tr-icon"><Film :size="13" /></div>
            <div class="tr-main">
              <div class="tr-name ellipsis">{{ t.output.width }}×{{ t.output.height }} · {{ t.output.codec }}</div>
              <div class="tr-sub mono">{{ t.id }}</div>
            </div>
            <StatusBadge :status="t.status === 'running' ? '处理中' : t.status === 'completed' ? '已完成' : t.status === 'queued' ? '排队中' : t.status === 'failed' ? '失败' : t.status === 'paused' ? '已暂停' : '已取消'" />
          </div>
        </div>
      </div>
    </div>

    <BaseModal v-model="confirmDelete" title="确认删除素材" :width="420">
      <p class="del-text">删除后该素材及其 {{ relatedTasks.length }} 条关联任务记录将一并移除，操作不可撤销。</p>
      <template #footer>
        <button class="btn btn-ghost" @click="confirmDelete = false">取消</button>
        <button class="btn btn-danger" @click="del">确认删除</button>
      </template>
    </BaseModal>
  </div>

  <div v-else class="page">
    <EmptyState title="素材不存在" desc="该素材可能已被删除，返回素材库查看其他内容">
      <button class="btn btn-primary" @click="router.push('/library')">返回素材库</button>
    </EmptyState>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}
.head-main {
  flex: 1;
  min-width: 0;
}
.title {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-1);
  max-width: 640px;
}
.sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--text-3);
  flex-wrap: wrap;
}
.sep {
  width: 1px;
  height: 9px;
  background: var(--border-strong);
}
.head-ops {
  display: flex;
  gap: 8px;
  flex: none;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 16px;
  align-items: start;
}
.left {
  min-width: 0;
}
.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin-top: 14px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
.qs {
  background: var(--bg-card);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.qs-l {
  font-size: 10.5px;
  color: var(--text-3);
}
.qs-v {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-1);
  letter-spacing: -0.02em;
}
.qs-v.small {
  font-size: 12.5px;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.5;
}
.tags-row {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.right {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  overflow: hidden;
}
.tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  padding: 0 6px;
}
.tabs button {
  flex: 1;
  height: 42px;
  font-size: 12px;
  color: var(--text-3);
  position: relative;
  white-space: nowrap;
}
.tabs button:hover {
  color: var(--text-2);
}
.tabs button.on {
  color: var(--text-1);
}
.tabs button.on::after {
  content: '';
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: -1px;
  height: 2px;
  background: var(--primary);
  border-radius: 2px 2px 0 0;
}
.panel {
  padding: 6px 18px 18px;
  max-height: 560px;
  overflow-y: auto;
}
.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.info-row:last-child {
  border-bottom: none;
}
.k {
  font-size: 11.5px;
  color: var(--text-3);
  flex: none;
}
.v {
  font-size: 11.5px;
  color: var(--text-1);
  text-align: right;
  line-height: 1.5;
  word-break: break-all;
}
.diag-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0 14px;
}
.diag-title {
  font-size: 13px;
  color: var(--text-1);
  font-weight: 500;
}
.diag-sub {
  font-size: 10.5px;
  color: var(--text-3);
  margin-top: 3px;
  line-height: 1.5;
}
.diag-row {
  margin-bottom: 14px;
}
.diag-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}
.diag-label {
  font-size: 12px;
  color: var(--text-2);
}
.diag-val {
  font-size: 12.5px;
  font-weight: 500;
}
.track {
  height: 4px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
}
.track-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.5s var(--ease);
}
.diag-hint {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 4px;
  opacity: 0.8;
}
.summary {
  display: flex;
  gap: 9px;
  padding: 11px 12px;
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-top: 4px;
}
.sum-ic {
  color: var(--primary);
  flex: none;
  margin-top: 1px;
}
.summary p {
  font-size: 11.5px;
  color: var(--text-2);
  line-height: 1.65;
}
.rec-btn {
  width: 100%;
  margin-top: 12px;
}
.mini-empty {
  padding: 28px 0;
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
}
.hist-item,
.task-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 8px;
  border-radius: 7px;
  cursor: pointer;
}
.hist-item:hover,
.task-row:hover {
  background: var(--bg-card-hover);
}
.hist-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex: none;
}
.hist-main {
  flex: 1;
  min-width: 0;
}
.hist-title {
  font-size: 12px;
  color: var(--text-1);
}
.hist-meta {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: var(--text-3);
  margin-top: 2px;
}
.hist-gain {
  font-size: 11.5px;
  color: var(--success);
  flex: none;
}
.tr-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--bg-inset);
  display: grid;
  place-items: center;
  color: var(--text-3);
  flex: none;
}
.tr-main {
  flex: 1;
  min-width: 0;
}
.tr-name {
  font-size: 12px;
  color: var(--text-1);
}
.tr-sub {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 1px;
}
.del-text {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.7;
}
@media (max-width: 1280px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .quick-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
