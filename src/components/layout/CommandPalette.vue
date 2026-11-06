<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, CornerDownLeft, FileVideo, ListVideo, Search } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'

const app = useAppStore()
const data = useDataStore()
const router = useRouter()

const q = ref('')
const active = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const pages = [
  { label: '工作台', path: '/dashboard', group: '页面' },
  { label: '素材库', path: '/library', group: '页面' },
  { label: '增强任务', path: '/tasks/list', group: '页面' },
  { label: '新建增强任务', path: '/tasks/new', group: '页面' },
  { label: '能力与模型', path: '/capabilities', group: '页面' },
  { label: '质量评估', path: '/quality', group: '页面' },
  { label: '模板中心', path: '/templates', group: '页面' },
  { label: '数据报表', path: '/analytics', group: '页面' },
  { label: '技术服务 · 工单', path: '/service/tickets', group: '页面' },
  { label: '技术服务 · 知识库', path: '/service/kb', group: '页面' },
  { label: '服务节点状态', path: '/service/nodes', group: '页面' },
  { label: '系统设置', path: '/settings/profile', group: '页面' }
]

interface Result {
  label: string
  sub: string
  path: string
  group: '页面' | '任务' | '素材'
}

const results = computed<Result[]>(() => {
  const kw = q.value.trim().toLowerCase()
  const pageHits = pages
    .filter((p) => !kw || p.label.toLowerCase().includes(kw))
    .slice(0, 5)
    .map((p) => ({ label: p.label, sub: p.path, path: p.path, group: '页面' as const }))

  if (!kw) return pageHits

  const taskHits = data.tasks
    .filter((t) => t.assetName.toLowerCase().includes(kw) || t.id.toLowerCase().includes(kw))
    .slice(0, 4)
    .map((t) => ({
      label: t.assetName,
      sub: `${t.id} · ${t.status === 'running' ? '处理中' : t.status === 'completed' ? '已完成' : t.status}`,
      path: `/tasks/${t.id}`,
      group: '任务' as const
    }))

  const assetHits = data.assets
    .filter((a) => a.name.toLowerCase().includes(kw) || a.tags.some((tag) => tag.includes(kw)))
    .slice(0, 4)
    .map((a) => ({
      label: a.name,
      sub: `${a.width}×${a.height} · ${a.codec}`,
      path: `/library/${a.id}`,
      group: '素材' as const
    }))

  return [...pageHits, ...taskHits, ...assetHits]
})

watch(results, () => {
  active.value = 0
})

watch(
  () => app.commandOpen,
  async (v) => {
    if (v) {
      q.value = ''
      active.value = 0
      await nextTick()
      inputRef.value?.focus()
    }
  }
)

function go(r: Result | undefined) {
  if (!r) return
  router.push(r.path)
  app.commandOpen = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    active.value = Math.min(results.value.length - 1, active.value + 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    active.value = Math.max(0, active.value - 1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    go(results.value[active.value])
  } else if (e.key === 'Escape') {
    app.commandOpen = false
  }
}

function globalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    app.commandOpen = !app.commandOpen
  }
}

onMounted(() => window.addEventListener('keydown', globalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', globalKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="cmdk">
      <div v-if="app.commandOpen" class="overlay" @mousedown.self="app.commandOpen = false">
        <div class="palette" @keydown="onKey">
          <div class="search-row">
            <Search :size="16" class="s-icon" />
            <input
              ref="inputRef"
              v-model="q"
              class="input-bare"
              placeholder="搜索素材、任务、页面或操作…"
              @keydown="onKey"
            />
            <span class="esc">ESC</span>
          </div>
          <div class="results">
            <template v-if="results.length">
              <button
                v-for="(r, i) in results"
                :key="r.group + r.path"
                class="result"
                :class="{ active: i === active }"
                @mouseenter="active = i"
                @click="go(r)"
              >
                <component
                  :is="r.group === '任务' ? ListVideo : r.group === '素材' ? FileVideo : ArrowRight"
                  :size="14"
                  class="r-icon"
                />
                <div class="r-main">
                  <div class="r-label ellipsis">{{ r.label }}</div>
                  <div class="r-sub mono ellipsis">{{ r.sub }}</div>
                </div>
                <span class="r-group">{{ r.group }}</span>
                <CornerDownLeft v-if="i === active" :size="13" class="enter" />
              </button>
            </template>
            <div v-else class="no-hit">
              没有匹配「{{ q }}」的结果
              <span>试试搜索素材名称、任务 ID 或页面关键词</span>
            </div>
          </div>
          <div class="foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
            <span><kbd>↵</kbd> 打开</span>
            <span><kbd>esc</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 12, 0.6);
  backdrop-filter: blur(3px);
  z-index: 2500;
  display: flex;
  justify-content: center;
  padding-top: 12vh;
}
.palette {
  width: 600px;
  max-width: 92vw;
  height: fit-content;
  max-height: 68vh;
  background: var(--bg-panel);
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  box-shadow: var(--shadow-pop);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 50px;
  border-bottom: 1px solid var(--border-subtle);
  flex: none;
}
.s-icon {
  color: var(--text-3);
  flex: none;
}
.input-bare {
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--text-1);
}
.input-bare::placeholder {
  color: var(--text-3);
}
.esc {
  font-size: 9.5px;
  font-family: var(--font-mono);
  color: var(--text-3);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 5px;
}
.results {
  overflow-y: auto;
  padding: 6px;
  flex: 1;
}
.result {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 7px;
  text-align: left;
}
.result.active {
  background: var(--primary-soft);
}
.r-icon {
  color: var(--text-3);
  flex: none;
}
.result.active .r-icon {
  color: var(--primary);
}
.r-main {
  flex: 1;
  min-width: 0;
}
.r-label {
  font-size: 13px;
  color: var(--text-1);
}
.r-sub {
  font-size: 10.5px;
  color: var(--text-3);
  margin-top: 1px;
}
.r-group {
  font-size: 10px;
  color: var(--text-3);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 5px;
  flex: none;
}
.enter {
  color: var(--primary);
  flex: none;
}
.no-hit {
  padding: 34px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-2);
}
.no-hit span {
  display: block;
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--text-3);
}
.foot {
  display: flex;
  gap: 16px;
  padding: 8px 14px;
  border-top: 1px solid var(--border-subtle);
  font-size: 10.5px;
  color: var(--text-3);
  flex: none;
}
kbd {
  font-family: var(--font-mono);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 0 4px;
  margin-right: 3px;
  font-size: 9.5px;
}
.cmdk-enter-active,
.cmdk-leave-active {
  transition: opacity 0.15s var(--ease);
}
.cmdk-enter-active .palette,
.cmdk-leave-active .palette {
  transition: transform 0.18s var(--ease);
}
.cmdk-enter-from,
.cmdk-leave-to {
  opacity: 0;
}
.cmdk-enter-from .palette,
.cmdk-leave-to .palette {
  transform: translateY(-8px) scale(0.99);
}
</style>
