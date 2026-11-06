<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowDownUp,
  Check,
  ChevronDown,
  Film,
  Grid2x2,
  List,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
  X
} from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import type { Asset } from '@/types'
import { formatBytes, formatDate, formatDuration, resolutionLabel, scoreColor } from '@/composables/useFormat'

const data = useDataStore()
const app = useAppStore()
const router = useRouter()

const view = ref<'grid' | 'list'>((localStorage.getItem('vidclear.libview') as 'grid' | 'list') || 'grid')
const keyword = ref('')
const collection = ref('all')
const sort = ref<'time' | 'name' | 'size' | 'quality'>('time')
const selected = ref<string[]>([])
const dragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

interface UploadItem {
  id: string
  name: string
  size: number
  progress: number
  status: 'uploading' | 'done' | 'error' | 'paused'
  timer?: number
}
const uploads = ref<UploadItem[]>([])

const sortOptions = [
  { label: '上传时间（新→旧）', value: 'time' },
  { label: '名称 A→Z', value: 'name' },
  { label: '文件大小（大→小）', value: 'size' },
  { label: '质量分（低→高）', value: 'quality' }
]

const filtered = computed(() => {
  let list = data.assets.slice()
  if (collection.value !== 'all') list = list.filter((a) => a.collectionId === collection.value)
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (a) => a.name.toLowerCase().includes(kw) || a.tags.some((t) => t.toLowerCase().includes(kw)) || a.uploadedBy.includes(kw)
    )
  }
  if (sort.value === 'time') list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  if (sort.value === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  if (sort.value === 'size') list.sort((a, b) => b.size - a.size)
  if (sort.value === 'quality') list.sort((a, b) => a.qualityScore - b.qualityScore)
  return list
})

function setView(v: 'grid' | 'list') {
  view.value = v
  localStorage.setItem('vidclear.libview', v)
}

function toggleSelect(id: string) {
  const i = selected.value.indexOf(id)
  if (i >= 0) selected.value.splice(i, 1)
  else selected.value.push(id)
}

const allSelected = computed(() => filtered.value.length > 0 && selected.value.length === filtered.value.length)

function toggleAll() {
  selected.value = allSelected.value ? [] : filtered.value.map((a) => a.id)
}

function pickFiles() {
  fileInput.value?.click()
}

function onFiles(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  files.forEach(startUpload)
  ;(e.target as HTMLInputElement).value = ''
  app.uploadPanelOpen = true
}

function startUpload(file: File) {
  const item: UploadItem = {
    id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: file.name,
    size: file.size,
    progress: 0,
    status: 'uploading'
  }
  uploads.value.unshift(item)
  item.timer = window.setInterval(() => {
    const target = uploads.value.find((u) => u.id === item.id)
    if (!target || target.status !== 'uploading') return
    target.progress = Math.min(100, target.progress + 3 + Math.random() * 5)
    if (target.progress >= 100) {
      target.status = 'done'
      if (target.timer) window.clearInterval(target.timer)
      registerAsset(file, target)
    }
  }, 220)
}

function registerAsset(file: File, item: UploadItem) {
  const nextIndex = data.assets.length + 1
  const isPortrait = Math.random() > 0.82
  const palette: [string, string][] = [
    ['#1b2a4a', '#0d1526'],
    ['#2a2350', '#141031'],
    ['#3a2c1a', '#1d160d'],
    ['#1c3020', '#0d1710']
  ]
  const colors = palette[nextIndex % 4]
  const asset: Asset = {
    id: `AST-${String(nextIndex).padStart(4, '0')}`,
    name: file.name,
    duration: Math.round(80 + Math.random() * 620),
    size: file.size || Math.round(120 * 1024 * 1024),
    width: isPortrait ? 1080 : 1920,
    height: isPortrait ? 1920 : 1080,
    fps: [24, 25, 30, 50][nextIndex % 4],
    bitrate: Math.round(4000 + Math.random() * 12000),
    codec: ['H.264', 'H.265'][nextIndex % 2],
    profile: 'High@L4.1',
    bitDepth: 8,
    chroma: '4:2:0',
    colorSpace: 'BT.709',
    hdr: null,
    container: file.name.split('.').pop()?.toUpperCase() ?? 'MP4',
    audio: { codec: 'AAC', channels: 2, sampleRate: 48000 },
    tags: ['新上传'],
    collectionId: null,
    status: 'ready',
    qualityScore: Math.round(52 + Math.random() * 30),
    diagnosis: {
      sharpness: Math.round((2 + Math.random() * 2.4) * 10) / 10,
      noise: Math.round((1.4 + Math.random() * 2.6) * 10) / 10,
      artifact: Math.round((1.2 + Math.random() * 2.8) * 10) / 10,
      shake: Math.round(Math.random() * 2.4 * 10) / 10,
      exposure: Math.round((1 + Math.random() * 2.6) * 10) / 10,
      summary: '已完成自动质量诊断，建议根据噪声与伪影评分选择增强方案。'
    },
    uploadedBy: data.currentUser.name,
    uploadedAt: new Date().toISOString(),
    md5: Math.random().toString(16).slice(2, 10),
    thumbnailColor: colors
  }
  data.addAsset(asset)
  item.status = 'done'
  app.toast('success', '上传完成', `${asset.name} 已加入素材库并完成初步诊断`)
}

function pauseUpload(u: UploadItem) {
  u.status = u.status === 'paused' ? 'uploading' : 'paused'
  if (u.status === 'uploading' && !u.timer) {
    u.timer = window.setInterval(() => {
      if (u.status !== 'uploading') return
      u.progress = Math.min(100, u.progress + 3 + Math.random() * 5)
      if (u.progress >= 100) u.status = 'done'
    }, 220)
  }
}

function removeUpload(id: string) {
  const item = uploads.value.find((u) => u.id === id)
  if (item?.timer) window.clearInterval(item.timer)
  uploads.value = uploads.value.filter((u) => u.id !== id)
}

const confirmDelete = ref(false)

function askDelete() {
  if (selected.value.length) confirmDelete.value = true
}

function doDelete() {
  data.removeAssets(selected.value)
  app.toast('success', '已删除', `${selected.value.length} 个素材已从素材库移除`)
  selected.value = []
  confirmDelete.value = false
}

function addToTask() {
  router.push({ path: '/tasks/new', query: { assets: selected.value.join(',') } })
}

function onDrop(e: DragEvent) {
  dragging.value = false
  Array.from(e.dataTransfer?.files ?? []).forEach((f) => startUpload(f))
  if (e.dataTransfer?.files?.length) app.uploadPanelOpen = true
}

function clearFilters() {
  keyword.value = ''
  collection.value = 'all'
}

onBeforeUnmount(() => {
  uploads.value.forEach((u) => u.timer && window.clearInterval(u.timer))
})

const activeUploads = computed(() => uploads.value.filter((u) => u.status === 'uploading' || u.status === 'paused'))
const uploadDone = (u: UploadItem) => u.status === 'done'
</script>

<template>
  <div
    class="page"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <PageHeader title="素材库" desc="上传、诊断并管理所有待处理与已处理的影像素材">
      <button class="btn btn-ghost" @click="app.uploadPanelOpen = true">
        <Upload :size="14" />
        上传记录
        <span v-if="activeUploads.length" class="tag tag-primary q-badge">{{ activeUploads.length }}</span>
      </button>
      <button class="btn btn-primary" @click="pickFiles">
        <Plus :size="14" />
        上传素材
      </button>
      <input ref="fileInput" type="file" accept="video/*" multiple hidden @change="onFiles" />
    </PageHeader>

    <div class="toolbar">
      <div class="search-wrap">
        <Search :size="14" class="s-ic" />
        <input v-model="keyword" class="search-input" placeholder="搜索文件名、标签或上传人" />
        <button v-if="keyword" class="clear" aria-label="清空" @click="keyword = ''"><X :size="12" /></button>
      </div>

      <div class="chips">
        <button class="chip" :class="{ on: collection === 'all' }" @click="collection = 'all'">
          全部 <span class="cnt">{{ data.assets.length }}</span>
        </button>
        <button
          v-for="c in data.collections"
          :key="c.id"
          class="chip"
          :class="{ on: collection === c.id }"
          @click="collection = c.id"
        >
          {{ c.name }}
          <span class="cnt">{{ data.assets.filter((a) => a.collectionId === c.id).length }}</span>
        </button>
      </div>

      <div class="tool-right">
        <div class="sort">
          <ArrowDownUp :size="13" class="t3" />
          <BaseSelect v-model="sort" :options="sortOptions" size="sm" />
        </div>
        <div class="view-toggle">
          <button :class="{ on: view === 'grid' }" aria-label="网格视图" @click="setView('grid')">
            <Grid2x2 :size="14" />
          </button>
          <button :class="{ on: view === 'list' }" aria-label="列表视图" @click="setView('list')">
            <List :size="14" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="keyword || collection !== 'all'" class="filter-note">
      筛选结果 <b>{{ filtered.length }}</b> 条
      <button class="link" @click="clearFilters">清除筛选</button>
    </div>

    <div v-if="!filtered.length" class="card">
      <EmptyState
        title="没有找到匹配的素材"
        desc="换个关键词，或清除筛选条件重新查看全部素材"
      >
        <button class="btn btn-ghost" @click="clearFilters">清除筛选</button>
        <button class="btn btn-primary" @click="pickFiles">上传素材</button>
      </EmptyState>
    </div>

    <div v-else-if="view === 'grid'" class="grid">
      <article
        v-for="a in filtered"
        :key="a.id"
        class="asset-card card card-hover"
        :class="{ picked: selected.includes(a.id) }"
        @click="router.push(`/library/${a.id}`)"
      >
        <div
          class="thumb"
          :style="{ background: `linear-gradient(140deg, ${a.thumbnailColor[0]}, ${a.thumbnailColor[1]})` }"
        >
          <div class="scan" />
          <div class="play-ico">
            <svg viewBox="0 0 24 24" width="13" height="13"><path d="M8 5.5v13l10-6.5-10-6.5z" fill="currentColor" /></svg>
          </div>
          <span class="badge res">{{ resolutionLabel(a.width, a.height) }}</span>
          <span class="badge dur mono">{{ formatDuration(a.duration) }}</span>
          <button
            class="pick"
            :class="{ on: selected.includes(a.id) }"
            aria-label="选择"
            @click.stop="toggleSelect(a.id)"
          >
            <Check v-if="selected.includes(a.id)" :size="11" :stroke-width="3" />
          </button>
        </div>
        <div class="card-body">
          <div class="name ellipsis" :title="a.name">{{ a.name }}</div>
          <div class="meta">
            <span>{{ formatBytes(a.size) }}</span>
            <i class="sep" />
            <span>{{ a.codec }}</span>
            <i class="sep" />
            <span>{{ a.fps }}fps</span>
          </div>
          <div class="foot">
            <span class="who">{{ a.uploadedBy }} · {{ formatDate(a.uploadedAt) }}</span>
            <span class="score num" :style="{ color: scoreColor(a.qualityScore) }">{{ a.qualityScore }}</span>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="card table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th class="cb-col">
              <button class="cb" :class="{ on: allSelected }" aria-label="全选" @click="toggleAll">
                <Check v-if="allSelected" :size="10" :stroke-width="3" />
              </button>
            </th>
            <th>素材</th>
            <th>分辨率</th>
            <th>帧率</th>
            <th>时长</th>
            <th>大小</th>
            <th>质量分</th>
            <th>状态</th>
            <th>上传时间</th>
            <th class="op-col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in filtered" :key="a.id" @click="router.push(`/library/${a.id}`)">
            <td class="cb-col" @click.stop>
              <button class="cb" :class="{ on: selected.includes(a.id) }" aria-label="选择" @click="toggleSelect(a.id)">
                <Check v-if="selected.includes(a.id)" :size="10" :stroke-width="3" />
              </button>
            </td>
            <td>
              <div class="cell-media">
                <div
                  class="mini-thumb"
                  :style="{ background: `linear-gradient(140deg, ${a.thumbnailColor[0]}, ${a.thumbnailColor[1]})` }"
                >
                  <Film :size="11" />
                </div>
                <div class="cell-text">
                  <div class="cell-name ellipsis">{{ a.name }}</div>
                  <div class="cell-sub">{{ a.codec }} · {{ a.container }} · {{ a.uploadedBy }}</div>
                </div>
              </div>
            </td>
            <td class="num">{{ a.width }}×{{ a.height }}</td>
            <td class="num">{{ a.fps }}</td>
            <td class="num">{{ formatDuration(a.duration) }}</td>
            <td class="num">{{ formatBytes(a.size) }}</td>
            <td>
              <div class="score-cell">
                <span class="num" :style="{ color: scoreColor(a.qualityScore) }">{{ a.qualityScore }}</span>
                <div class="mini-bar">
                  <div :style="{ width: a.qualityScore + '%', background: scoreColor(a.qualityScore) }" />
                </div>
              </div>
            </td>
            <td><StatusBadge :status="a.status" kind="asset" /></td>
            <td class="num t2">{{ formatDate(a.uploadedAt) }}</td>
            <td class="op-col" @click.stop>
              <button class="btn btn-subtle btn-sm" @click="router.push(`/tasks/new?assets=${a.id}`)">建任务</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Transition name="float">
      <div v-if="selected.length" class="bulk-bar">
        <span class="bulk-count">已选 <b>{{ selected.length }}</b> 项</span>
        <i class="sep" />
        <button class="bulk-btn" @click="addToTask"><Plus :size="13" /> 加入任务</button>
        <button class="bulk-btn" @click="app.toast('info', '标签面板', '批量打标签功能已就绪')"><Tag :size="13" /> 打标签</button>
        <button class="bulk-btn danger" @click="askDelete"><Trash2 :size="13" /> 删除</button>
        <button class="bulk-close" aria-label="取消选择" @click="selected = []"><X :size="14" /></button>
      </div>
    </Transition>

    <Transition name="drop">
      <div v-if="dragging" class="drop-mask">
        <div class="drop-box">
          <Upload :size="28" />
          <div class="drop-title">松开以上传素材</div>
          <div class="drop-sub">支持 MP4 / MOV / MKV / TS，单文件不超过 50GB</div>
        </div>
      </div>
    </Transition>

    <Transition name="drop">
      <div v-if="app.uploadPanelOpen" class="upload-panel">
        <header class="up-head">
          <div class="row gap-8">
            <span class="up-title">上传队列</span>
            <span class="tag">{{ uploads.length }} 个文件</span>
          </div>
          <button class="btn btn-subtle btn-icon btn-sm" aria-label="关闭" @click="app.uploadPanelOpen = false">
            <X :size="14" />
          </button>
        </header>
        <div class="up-list">
          <div v-if="!uploads.length" class="up-empty">还没有上传记录，拖入文件或点击「上传素材」</div>
          <div v-for="u in uploads" :key="u.id" class="up-item">
            <div class="up-ic">{{ uploadDone(u) ? '✓' : '↑' }}</div>
            <div class="up-main">
              <div class="up-name ellipsis">{{ u.name }}</div>
              <div class="up-bar"><div :style="{ width: u.progress + '%' }" :class="{ done: uploadDone(u) }" /></div>
              <div class="up-meta">
                <span>{{ formatBytes(u.size) }}</span>
                <i class="sep" />
                <span>{{ uploadDone(u) ? '已完成 · 诊断中' : u.status === 'paused' ? '已暂停' : Math.round(u.progress) + '%' }}</span>
              </div>
            </div>
            <button class="btn btn-subtle btn-icon btn-sm" aria-label="移除" @click="removeUpload(u.id)">
              <X :size="12" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <BaseModal v-model="confirmDelete" title="确认删除素材" :width="420">
      <p class="confirm-text">
        即将删除 <b>{{ selected.length }}</b> 个素材。删除后该素材的关联任务与质量报告将无法回溯，此操作不可撤销。
      </p>
      <div class="confirm-list">
        <div v-for="id in selected.slice(0, 4)" :key="id" class="confirm-item ellipsis">
          {{ data.assetById(id)?.name }}
        </div>
        <div v-if="selected.length > 4" class="confirm-more">…等 {{ selected.length }} 个文件</div>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="confirmDelete = false">取消</button>
        <button class="btn btn-danger" @click="doDelete"><Trash2 :size="13" /> 确认删除</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-wrap {
  position: relative;
  width: 260px;
  flex: none;
}
.s-ic {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
}
.search-input {
  width: 100%;
  height: 34px;
  padding: 0 30px 0 32px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--text-1);
  outline: none;
}
.search-input:focus {
  border-color: var(--primary);
}
.clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
}
.clear:hover {
  background: var(--bg-card-hover);
}
.chips {
  display: flex;
  gap: 6px;
  flex: 1;
  flex-wrap: wrap;
  min-width: 0;
}
.chip {
  height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 12px;
  color: var(--text-2);
  border: 1px solid var(--border);
  background: var(--bg-card);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.14s;
}
.chip:hover {
  border-color: var(--border-strong);
  color: var(--text-1);
}
.chip.on {
  background: var(--primary-soft);
  border-color: var(--primary-soft-2);
  color: var(--primary);
}
.cnt {
  font-size: 10.5px;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
.tool-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}
.sort {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 168px;
}
.view-toggle {
  display: flex;
  padding: 2px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 7px;
}
.view-toggle button {
  width: 28px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 5px;
  color: var(--text-3);
}
.view-toggle button.on {
  background: var(--bg-card-hover);
  color: var(--text-1);
}
.filter-note {
  font-size: 11.5px;
  color: var(--text-3);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-note b {
  color: var(--text-1);
  font-weight: 500;
}
.link {
  color: var(--primary);
  font-size: 11.5px;
}
.link:hover {
  text-decoration: underline;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(238px, 1fr));
  gap: 14px;
}
.asset-card {
  overflow: hidden;
  cursor: pointer;
  position: relative;
}
.asset-card.picked {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}
.thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.scan {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    0deg,
    rgba(255, 255, 255, 0.035) 0px,
    rgba(255, 255, 255, 0.035) 1px,
    transparent 1px,
    transparent 3px
  );
  opacity: 0.5;
}
.play-ico {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(8, 12, 20, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.16);
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.9);
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.18s var(--ease);
}
.asset-card:hover .play-ico {
  opacity: 1;
  transform: scale(1);
}
.badge {
  position: absolute;
  font-size: 9.5px;
  padding: 1px 5px;
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(6, 9, 15, 0.55);
  backdrop-filter: blur(4px);
  font-weight: 500;
}
.res {
  top: 8px;
  left: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.dur {
  bottom: 8px;
  right: 8px;
}
.pick {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 17px;
  height: 17px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(6, 9, 15, 0.45);
  display: grid;
  place-items: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.14s;
}
.asset-card:hover .pick,
.pick.on {
  opacity: 1;
}
.pick.on {
  background: var(--primary);
  border-color: var(--primary);
}
.card-body {
  padding: 11px 12px 12px;
}
.name {
  font-size: 12.5px;
  color: var(--text-1);
  font-weight: 500;
}
.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: var(--text-3);
  margin-top: 5px;
}
.sep {
  width: 1px;
  height: 9px;
  background: var(--border-strong);
  display: inline-block;
  flex: none;
}
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 9px;
  padding-top: 9px;
  border-top: 1px solid var(--border-subtle);
}
.who {
  font-size: 10px;
  color: var(--text-3);
}
.score {
  font-size: 12px;
  font-weight: 500;
}

.table-wrap {
  overflow: hidden;
}
.cb-col {
  width: 40px;
  padding-left: 16px !important;
}
.op-col {
  width: 78px;
  text-align: right;
  padding-right: 16px !important;
}
.cb {
  width: 15px;
  height: 15px;
  border-radius: 4px;
  border: 1px solid var(--border-strong);
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--bg-inset);
}
.cb.on {
  background: var(--primary);
  border-color: var(--primary);
}
.cell-media {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.mini-thumb {
  width: 46px;
  height: 28px;
  border-radius: 4px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.6);
  flex: none;
}
.cell-text {
  min-width: 0;
}
.cell-name {
  font-size: 12.5px;
  color: var(--text-1);
  max-width: 320px;
}
.cell-sub {
  font-size: 10.5px;
  color: var(--text-3);
  margin-top: 2px;
}
.score-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mini-bar {
  width: 36px;
  height: 3px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
}
.mini-bar div {
  height: 100%;
  border-radius: 99px;
}

.bulk-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 8px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  box-shadow: var(--shadow-pop);
  z-index: 60;
}
.bulk-count {
  font-size: 12.5px;
  color: var(--text-2);
  margin-right: 4px;
}
.bulk-count b {
  color: var(--text-1);
  font-weight: 500;
}
.bulk-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-1);
}
.bulk-btn:hover {
  background: var(--bg-card-hover);
}
.bulk-btn.danger {
  color: var(--danger);
}
.bulk-close {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: var(--text-3);
  margin-left: 2px;
}
.bulk-close:hover {
  background: var(--bg-card-hover);
}
.float-enter-active,
.float-leave-active {
  transition: all 0.22s var(--ease);
}
.float-enter-from,
.float-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}

.drop-mask {
  position: fixed;
  inset: 0;
  background: rgba(6, 10, 18, 0.72);
  backdrop-filter: blur(3px);
  z-index: 800;
  display: grid;
  place-items: center;
}
.drop-box {
  width: 420px;
  padding: 44px;
  border: 2px dashed var(--primary);
  border-radius: 16px;
  text-align: center;
  color: var(--primary);
  background: rgba(79, 124, 255, 0.06);
}
.drop-title {
  margin-top: 12px;
  font-size: 15px;
  color: var(--text-1);
}
.drop-sub {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-3);
}
.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.16s;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
}

.upload-panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 360px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  box-shadow: var(--shadow-pop);
  z-index: 700;
  overflow: hidden;
}
.up-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
}
.up-title {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-1);
}
.up-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
}
.up-empty {
  padding: 24px 12px;
  text-align: center;
  font-size: 11.5px;
  color: var(--text-3);
}
.up-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 8px;
  border-radius: 6px;
}
.up-item:hover {
  background: var(--bg-card-hover);
}
.up-ic {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: var(--primary-soft);
  color: var(--primary);
  display: grid;
  place-items: center;
  font-size: 11px;
  flex: none;
}
.up-main {
  flex: 1;
  min-width: 0;
}
.up-name {
  font-size: 11.5px;
  color: var(--text-1);
}
.up-bar {
  height: 3px;
  background: var(--border);
  border-radius: 99px;
  margin: 5px 0 4px;
  overflow: hidden;
}
.up-bar div {
  height: 100%;
  background: var(--primary);
  border-radius: 99px;
  transition: width 0.22s linear;
}
.up-bar div.done {
  background: var(--success);
}
.up-meta {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: var(--text-3);
}
.q-badge {
  margin-left: 2px;
}
.confirm-text {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.7;
}
.confirm-text b {
  color: var(--danger);
  font-weight: 500;
}
.confirm-list {
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--bg-inset);
  border-radius: 8px;
  border: 1px solid var(--border);
}
.confirm-item {
  font-size: 11.5px;
  color: var(--text-2);
  line-height: 1.9;
}
.confirm-more {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 2px;
}
</style>
