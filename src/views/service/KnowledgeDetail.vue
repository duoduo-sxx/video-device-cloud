<template>
  <div class="page" v-loading="loading">
    <div class="back-row">
      <el-button link :icon="ArrowLeft" @click="router.push('/service/knowledge')">返回知识库</el-button>
    </div>

    <div class="article-layout" v-if="article">
      <div class="card article">
        <div class="a-head">
          <el-tag size="small" effect="plain">{{ article.categoryName }}</el-tag>
          <h1>{{ article.title }}</h1>
          <div class="a-meta">
            <span>{{ article.author }}</span>
            <span class="dot" />
            <span>更新于 {{ formatDate(article.updatedAt) }}</span>
            <span class="dot" />
            <span>{{ article.views }} 次浏览</span>
            <span class="dot" />
            <span>{{ article.helpful }} 人觉得有用</span>
          </div>
          <div class="a-tags">
            <span v-for="t in article.tags" :key="t" class="tag">{{ t }}</span>
          </div>
        </div>

        <div class="markdown" v-html="html" />

        <div class="a-foot">
          <span class="muted tiny">这篇文档对你有帮助吗？</span>
          <el-button size="small" :icon="Star" @click="helpful">有帮助（{{ article.helpful + liked }}）</el-button>
          <el-button size="small" @click="ElMessage.info('已记录反馈，我们会持续优化内容')">需要补充</el-button>
        </div>
      </div>

      <div class="side">
        <div class="card">
          <div class="side-title">目录</div>
          <div class="toc">
            <div v-for="(h, i) in headings" :key="i" class="toc-item" @click="scrollTo(i)">{{ h }}</div>
            <div v-if="!headings.length" class="tiny muted">暂无目录</div>
          </div>
        </div>
        <div class="card">
          <div class="side-title">相关文章</div>
          <div class="rel-list">
            <div v-for="r in related" :key="r.id" class="rel-item" @click="router.push(`/service/knowledge/${r.id}`)">
              <div class="rel-title">{{ r.title }}</div>
              <div class="tiny muted">{{ r.categoryName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Star } from '@element-plus/icons-vue'
import { getKnowledge, getKnowledgeList } from '@/api'
import type { KnowledgeArticle } from '@/types'
import { formatDate } from '@/utils/format'
import { renderMarkdown } from '@/utils/markdown'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const article = ref<KnowledgeArticle>()
const related = ref<KnowledgeArticle[]>([])
const liked = ref(0)

const html = computed(() => (article.value ? renderMarkdown(article.value.content) : ''))

const headings = computed(() => {
  if (!article.value) return []
  return article.value.content
    .split('\n')
    .filter((l) => /^##\s+/.test(l))
    .map((l) => l.replace(/^##\s+/, '').trim())
})

function helpful() {
  liked.value += 1
  ElMessage.success('感谢反馈')
}

function scrollTo(index: number) {
  const nodes = document.querySelectorAll('.markdown h2')
  nodes[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  const a = await getKnowledge(String(route.params.id))
  article.value = a
  if (a) {
    const list = await getKnowledgeList({ category: a.category, page: 1, pageSize: 4 })
    related.value = list.list.filter((x) => x.id !== a.id).slice(0, 3)
  }
  loading.value = false
})
</script>

<style scoped>
.back-row {
  margin-bottom: -8px;
}

.article-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 16px;
  align-items: start;
}

.article {
  padding: 28px 34px 22px;
}

.a-head h1 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.45;
  margin: 12px 0 10px;
  color: var(--neutral-900);
}

.a-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--neutral-400);
}

.dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #c9d3e0;
}

.a-tags {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.tag {
  font-size: 11px;
  color: #1668dc;
  background: #eef5ff;
  border-radius: 3px;
  padding: 2px 7px;
}

.a-foot {
  margin-top: 30px;
  padding-top: 16px;
  border-top: 1px solid var(--divider);
  display: flex;
  align-items: center;
  gap: 10px;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 76px;
}

.side-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: 10px;
}

.toc-item {
  font-size: 12.5px;
  color: var(--neutral-600);
  padding: 5px 0 5px 10px;
  border-left: 2px solid var(--divider);
  cursor: pointer;
  line-height: 1.5;
}

.toc-item:hover {
  color: var(--brand-600);
  border-left-color: var(--brand-600);
}

.rel-item {
  padding: 8px 6px;
  border-radius: 6px;
  cursor: pointer;
}

.rel-item:hover {
  background: #f5f8fd;
}

.rel-title {
  font-size: 12.5px;
  color: var(--neutral-700);
  line-height: 1.55;
  margin-bottom: 2px;
}

.markdown {
  margin-top: 22px;
  font-size: 13.5px;
  line-height: 1.9;
  color: var(--neutral-700);
}

.markdown :deep(h2) {
  font-size: 16px;
  font-weight: 600;
  color: var(--neutral-900);
  margin: 26px 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--divider);
}

.markdown :deep(h3) {
  font-size: 14px;
  font-weight: 600;
  margin: 18px 0 8px;
}

.markdown :deep(p) {
  margin: 8px 0;
}

.markdown :deep(ul),
.markdown :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.markdown :deep(li) {
  margin: 4px 0;
}

.markdown :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 12.5px;
}

.markdown :deep(th) {
  background: #f7f9fc;
  text-align: left;
  font-weight: 500;
  color: var(--neutral-600);
}

.markdown :deep(th),
.markdown :deep(td) {
  border: 1px solid var(--border);
  padding: 8px 12px;
}

.markdown :deep(pre) {
  background: #0f1c2e;
  color: #d7e3f4;
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.7;
  margin: 12px 0;
}

.markdown :deep(code) {
  font-family: ui-monospace, Menlo, monospace;
  background: #f1f4f9;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
}

.markdown :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.markdown :deep(blockquote) {
  margin: 12px 0;
  padding: 10px 14px;
  background: #f7faff;
  border-left: 3px solid #1668dc;
  color: var(--neutral-600);
}
</style>
