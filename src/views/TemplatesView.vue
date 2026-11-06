<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Copy, Plus, Sparkles, Trash2, TrendingUp, Users } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseDrawer from '@/components/ui/BaseDrawer.vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { capabilityMap } from '@/mock/capabilities'
import type { Template } from '@/types'

const data = useDataStore()
const app = useAppStore()
const router = useRouter()

const drawer = ref(false)
const current = ref<Template | null>(null)

const official = computed(() => data.templates.filter((t) => t.author === '官方'))
const mine = computed(() => data.templates.filter((t) => t.author === '我的'))

function open(t: Template) {
  current.value = t
  drawer.value = true
}

function use(t: Template) {
  router.push({ path: '/tasks/new', query: { template: t.id } })
}

function duplicate(t: Template) {
  data.addTemplate({
    name: `${t.name}（副本）`,
    description: t.description,
    pipeline: t.pipeline,
    avgGain: t.avgGain
  })
  app.toast('success', '模板已复制', '副本已加入「我的模板」')
}

function remove(t: Template) {
  data.db.templates = data.db.templates.filter((x) => x.id !== t.id)
  drawer.value = false
  app.toast('success', '模板已删除', t.name)
}
</script>

<template>
  <div class="page">
    <PageHeader title="模板中心" desc="预置方案已按场景调好参数，可直接复用或另存为自己的模板">
      <button class="btn btn-primary" @click="router.push('/tasks/new')"><Plus :size="14" /> 新建任务</button>
    </PageHeader>

    <div class="section-label">
      官方模板 <span class="cnt">{{ official.length }}</span>
    </div>
    <div class="tpl-grid">
      <article v-for="t in official" :key="t.id" class="tpl card card-hover" @click="open(t)">
        <div
          class="cover"
          :style="{ background: `linear-gradient(135deg, ${t.cover[0]}, ${t.cover[1]})` }"
        >
          <div class="cover-grid" />
          <span class="badge-official"><Sparkles :size="9" /> 官方</span>
          <div class="cover-icons">
            <span v-for="(p, i) in t.pipeline.slice(0, 4)" :key="p.capabilityId" class="ci">
              {{ capabilityMap[p.capabilityId].shortName }}
              <ArrowRight v-if="i < Math.min(3, t.pipeline.length - 1)" :size="8" />
            </span>
          </div>
        </div>
        <div class="tpl-body">
          <div class="tpl-name">{{ t.name }}</div>
          <div class="tpl-desc clamp-2">{{ t.description }}</div>
          <div class="tags">
            <span v-for="tag in t.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="tpl-foot">
            <span class="stat"><TrendingUp :size="11" /> +{{ t.avgGain }}</span>
            <span class="stat"><Users :size="11" /> {{ t.usageCount }} 次</span>
            <span class="spacer" />
            <span class="use-hint">使用 <ArrowRight :size="11" /></span>
          </div>
        </div>
      </article>
    </div>

    <div class="section-label" style="margin-top: 24px">
      我的模板 <span class="cnt">{{ mine.length }}</span>
    </div>
    <div v-if="mine.length" class="tpl-grid">
      <article v-for="t in mine" :key="t.id" class="tpl card card-hover" @click="open(t)">
        <div class="cover" :style="{ background: `linear-gradient(135deg, ${t.cover[0]}, ${t.cover[1]})` }">
          <div class="cover-grid" />
          <span class="badge-official mine">我的</span>
          <div class="cover-icons">
            <span v-for="(p, i) in t.pipeline.slice(0, 4)" :key="p.capabilityId" class="ci">
              {{ capabilityMap[p.capabilityId].shortName }}
              <ArrowRight v-if="i < Math.min(3, t.pipeline.length - 1)" :size="8" />
            </span>
          </div>
        </div>
        <div class="tpl-body">
          <div class="tpl-name">{{ t.name }}</div>
          <div class="tpl-desc clamp-2">{{ t.description }}</div>
          <div class="tags">
            <span v-for="tag in t.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="tpl-foot">
            <span class="stat"><TrendingUp :size="11" /> +{{ t.avgGain }}</span>
            <span class="stat"><Users :size="11" /> {{ t.usageCount }} 次</span>
            <span class="spacer" />
            <span class="use-hint">使用 <ArrowRight :size="11" /></span>
          </div>
        </div>
      </article>
    </div>
    <div v-else class="empty-mine">
      还没有自定义模板。在新建任务的最后一步勾选「保存为模板」即可创建。
    </div>

    <BaseDrawer v-model="drawer" :title="current?.name ?? ''" :desc="current?.description" :width="620">
      <div v-if="current" class="detail">
        <div class="meta-row">
          <div class="meta-item">
            <span class="ml">平均提升</span>
            <span class="mv num">+{{ current.avgGain }}</span>
          </div>
          <div class="meta-item">
            <span class="ml">使用次数</span>
            <span class="mv num">{{ current.usageCount }}</span>
          </div>
          <div class="meta-item">
            <span class="ml">能力数量</span>
            <span class="mv num">{{ current.pipeline.length }}</span>
          </div>
          <div class="meta-item">
            <span class="ml">作者</span>
            <span class="mv">{{ current.author }}</span>
          </div>
        </div>

        <div class="d-title">处理流水线</div>
        <div class="steps">
          <div v-for="(p, i) in current.pipeline" :key="p.capabilityId" class="step">
            <div class="step-head">
              <span class="s-idx">{{ i + 1 }}</span>
              <span class="s-name">{{ capabilityMap[p.capabilityId].name }}</span>
              <span class="s-cat">{{ capabilityMap[p.capabilityId].category }}</span>
            </div>
            <div class="params">
              <div v-for="(v, k) in p.params" :key="k" class="p-row">
                <span class="p-k">{{ k }}</span>
                <span class="p-v num">{{ typeof v === 'boolean' ? (v ? '开启' : '关闭') : v }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button v-if="current?.author === '我的'" class="btn btn-danger" @click="remove(current)">
          <Trash2 :size="13" /> 删除
        </button>
        <button class="btn btn-ghost" @click="duplicate(current!)"><Copy :size="13" /> 复制为我的模板</button>
        <button class="btn btn-primary" @click="use(current!)">立即使用</button>
      </template>
    </BaseDrawer>
  </div>
</template>

<style scoped>
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-2);
  margin-bottom: 12px;
  font-weight: 500;
}
.cnt {
  font-size: 10.5px;
  color: var(--text-3);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0 5px;
  line-height: 16px;
}
.tpl-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.tpl {
  overflow: hidden;
  cursor: pointer;
}
.cover {
  height: 108px;
  position: relative;
  overflow: hidden;
}
.cover-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 18px 18px;
  mask-image: radial-gradient(120% 100% at 20% 0%, #000, transparent 75%);
}
.badge-official {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9.5px;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 4px;
  padding: 1px 6px;
  backdrop-filter: blur(4px);
}
.badge-official.mine {
  background: rgba(79, 124, 255, 0.28);
  border-color: rgba(79, 124, 255, 0.4);
}
.cover-icons {
  position: absolute;
  left: 10px;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.ci {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.82);
  background: rgba(6, 9, 15, 0.4);
  border-radius: 3px;
  padding: 1px 4px;
}
.tpl-body {
  padding: 13px 14px 12px;
}
.tpl-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-1);
}
.tpl-desc {
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.6;
  margin-top: 5px;
  min-height: 35px;
}
.tags {
  display: flex;
  gap: 4px;
  margin-top: 9px;
  flex-wrap: wrap;
}
.tags .tag {
  height: 18px;
  font-size: 9.5px;
  padding: 0 5px;
}
.tpl-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 11px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
  font-size: 10px;
  color: var(--text-3);
}
.stat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.spacer {
  flex: 1;
}
.use-hint {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--primary);
  opacity: 0;
  transition: opacity 0.14s;
}
.tpl:hover .use-hint {
  opacity: 1;
}
.empty-mine {
  padding: 28px;
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
  border: 1px dashed var(--border-strong);
  border-radius: 10px;
}
.detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.meta-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: 9px;
  overflow: hidden;
}
.meta-item {
  background: var(--bg-card);
  padding: 11px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.ml {
  font-size: 10px;
  color: var(--text-3);
}
.mv {
  font-size: 15px;
  color: var(--text-1);
  font-weight: 500;
}
.d-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-1);
}
.steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.step {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--bg-card);
}
.step-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.s-idx {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 9px;
  display: grid;
  place-items: center;
  font-weight: 600;
}
.s-name {
  font-size: 12px;
  color: var(--text-1);
  font-weight: 500;
}
.s-cat {
  font-size: 9.5px;
  color: var(--text-3);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 0 4px;
}
.params {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 16px;
  padding-left: 24px;
}
.p-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 10.5px;
}
.p-k {
  color: var(--text-3);
  font-family: var(--font-mono);
}
.p-v {
  color: var(--text-2);
  text-align: right;
}
@media (max-width: 1320px) {
  .tpl-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
