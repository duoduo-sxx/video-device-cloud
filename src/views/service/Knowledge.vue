<template>
  <div class="page">
    <PageHeader title="知识库" desc="故障案例、操作手册、最佳实践与产品文档，支撑一线快速定位问题">
      <template #actions>
        <el-button :icon="EditPen" @click="ElMessage.info('演示环境：文章编辑入口仅对工程师开放')">投稿</el-button>
      </template>
    </PageHeader>

    <div class="kb-layout">
      <div class="side card">
        <div class="side-title">分类</div>
        <div
          v-for="c in categories"
          :key="c.key"
          class="cat-item"
          :class="{ active: query.category === c.key }"
          @click="selectCategory(c.key)"
        >
          <el-icon :size="15">
            <component :is="iconOf(c.key)" />
          </el-icon>
          <span>{{ c.name }}</span>
          <span class="cat-count">{{ countOf(c.key) }}</span>
        </div>

        <div class="side-title" style="margin-top: 18px">热门标签</div>
        <div class="tags">
          <span v-for="t in tags" :key="t" class="tag" :class="{ active: query.tag === t }" @click="selectTag(t)">{{ t }}</span>
        </div>
      </div>

      <div class="main">
        <div class="card search-card">
          <el-input v-model="query.keyword" size="large" placeholder="搜索标题、摘要或标签，如「扩容」「多路径」" :prefix-icon="Search" clearable @keyup.enter="search" />
          <el-button type="primary" size="large" @click="search">搜索</el-button>
        </div>

        <div class="card flush" v-loading="loading">
          <div class="kb-list">
            <div v-for="k in rows" :key="k.id" class="kb-row" @click="router.push(`/service/knowledge/${k.id}`)">
              <div class="kb-main">
                <div class="kb-head">
                  <span class="kb-title">{{ k.title }}</span>
                  <el-tag size="small" effect="plain">{{ k.categoryName }}</el-tag>
                </div>
                <div class="kb-summary">{{ k.summary }}</div>
                <div class="kb-meta">
                  <span class="tag-mini" v-for="t in k.tags" :key="t">{{ t }}</span>
                  <span class="muted">{{ k.author }}</span>
                  <span class="muted">·</span>
                  <span class="muted">{{ k.views }} 浏览</span>
                  <span class="muted">·</span>
                  <span class="muted">{{ k.helpful }} 人觉得有用</span>
                  <span class="muted">·</span>
                  <span class="muted">更新于 {{ formatDate(k.updatedAt) }}</span>
                </div>
              </div>
              <div class="kb-side">
                <div class="kb-num num">{{ k.views }}</div>
                <div class="tiny muted">浏览量</div>
              </div>
            </div>
          </div>
          <EmptyState v-if="!loading && !rows.length" text="没有找到相关文章" desc="试试更换关键词或分类" />
          <div class="pager">
            <el-pagination
              v-model:current-page="query.page"
              v-model:page-size="query.pageSize"
              :total="total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="load"
              @size-change="search"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EditPen, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getKnowledgeList } from '@/api'
import type { KnowledgeArticle } from '@/types'
import { formatDate } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const rows = ref<KnowledgeArticle[]>([])
const total = ref(0)
const all = ref<KnowledgeArticle[]>([])

const categories = [
  { key: 'all', name: '全部文章' },
  { key: 'fault', name: '故障案例' },
  { key: 'manual', name: '操作手册' },
  { key: 'best', name: '最佳实践' },
  { key: 'faq', name: 'FAQ' },
  { key: 'doc', name: '产品文档' }
]

const tags = ['容量', '性能', '硬件', '复制', '备份', '多路径', '华为', '浪潮', '宏杉', 'NetApp']

const query = reactive({ keyword: '', category: 'all', tag: '', page: 1, pageSize: 10 })

function iconOf(key: string) {
  return { all: 'Collection', fault: 'Warning', manual: 'Notebook', best: 'Star', faq: 'ChatDotRound', doc: 'Document' }[key] ?? 'Document'
}

function countOf(key: string) {
  if (key === 'all') return all.value.length
  return all.value.filter((k) => k.category === key).length
}

async function load() {
  loading.value = true
  const res = await getKnowledgeList({ ...query })
  rows.value = res.list
  total.value = res.total
  loading.value = false
}

function search() {
  query.page = 1
  load()
}

function selectCategory(key: string) {
  query.category = key
  query.page = 1
  load()
}

function selectTag(tag: string) {
  query.tag = query.tag === tag ? '' : tag
  query.page = 1
  load()
}

onMounted(async () => {
  await load()
  const res = await getKnowledgeList({ page: 1, pageSize: 999 })
  all.value = res.list
})
</script>

<style scoped>
.kb-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.side {
  padding: 16px 12px;
}

.side-title {
  font-size: 12px;
  color: var(--neutral-400);
  padding: 0 8px 8px;
}

.cat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--neutral-600);
  cursor: pointer;
}

.cat-item:hover {
  background: #f5f8fd;
}

.cat-item.active {
  background: #e8f1ff;
  color: var(--brand-600);
  font-weight: 500;
}

.cat-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--neutral-400);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 8px;
}

.tag {
  font-size: 11.5px;
  color: var(--neutral-600);
  background: #f1f3f7;
  border-radius: 4px;
  padding: 3px 8px;
  cursor: pointer;
}

.tag:hover {
  background: #e8f1ff;
  color: #1668dc;
}

.tag.active {
  background: #1668dc;
  color: #fff;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
}

.kb-list {
  display: flex;
  flex-direction: column;
}

.kb-row {
  display: flex;
  gap: 18px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--divider);
  cursor: pointer;
  transition: background 0.14s ease;
}

.kb-row:hover {
  background: #fafcff;
}

.kb-main {
  flex: 1;
  min-width: 0;
}

.kb-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kb-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-900);
}

.kb-row:hover .kb-title {
  color: var(--brand-600);
}

.kb-summary {
  font-size: 12.5px;
  color: var(--neutral-600);
  line-height: 1.7;
  margin: 6px 0 8px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.kb-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  flex-wrap: wrap;
}

.tag-mini {
  background: #f4f7fb;
  color: #5b6675;
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 10.5px;
}

.kb-side {
  width: 64px;
  text-align: right;
  flex: none;
}

.kb-num {
  font-size: 17px;
  font-weight: 600;
  color: var(--neutral-700);
}
</style>
