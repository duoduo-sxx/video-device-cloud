<script setup lang="ts">
import { computed, ref } from 'vue'
import { BookOpen, Clock, Eye, Search, ThumbsUp } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import { kbArticles } from '@/mock/kb'
import { useAppStore } from '@/stores/app'

const app = useAppStore()

const keyword = ref('')
const category = ref('全部')
const activeId = ref(kbArticles[0].id)

const categories = computed(() => {
  const set = new Set(kbArticles.map((a) => a.category))
  return ['全部', ...Array.from(set)]
})

const list = computed(() =>
  kbArticles
    .filter((a) => category.value === '全部' || a.category === category.value)
    .filter((a) => {
      const kw = keyword.value.trim()
      return !kw || a.title.includes(kw) || a.summary.includes(kw)
    })
)

const active = computed(() => kbArticles.find((a) => a.id === activeId.value) ?? list.value[0])

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+?)`/g, '<code>$1</code>')
}

function mdToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inCode = false
  let codeBuf: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let tableBuf: string[] = []

  const flushList = () => {
    if (listType) {
      out.push(`</${listType}>`)
      listType = null
    }
  }
  const flushTable = () => {
    if (!tableBuf.length) return
    const rows = tableBuf.map((r) =>
      r
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim())
    )
    if (rows.length >= 2) {
      const head = rows[0]
      const body = rows.slice(2)
      out.push(
        '<div class="md-table"><table><thead><tr>' +
          head.map((h) => `<th>${inline(h)}</th>`).join('') +
          '</tr></thead><tbody>' +
          body.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
          '</tbody></table></div>'
      )
    }
    tableBuf = []
  }

  lines.forEach((raw) => {
    const line = raw.trimEnd()
    if (line.startsWith('```')) {
      flushList()
      flushTable()
      if (inCode) {
        out.push(`<pre><code>${codeBuf.join('\n')}</code></pre>`)
        codeBuf = []
        inCode = false
      } else {
        inCode = true
      }
      return
    }
    if (inCode) {
      codeBuf.push(raw)
      return
    }
    if (line.startsWith('|')) {
      flushList()
      tableBuf.push(line)
      return
    }
    flushTable()
    if (!line.trim()) {
      flushList()
      return
    }
    const h = line.match(/^(#{2,4})\s+(.*)$/)
    if (h) {
      flushList()
      const level = h[1].length
      out.push(`<h${level + 1}>${inline(h[2])}</h${level + 1}>`)
      return
    }
    const ul = line.match(/^[-*]\s+(.*)$/)
    if (ul) {
      if (listType !== 'ul') {
        flushList()
        out.push('<ul>')
        listType = 'ul'
      }
      out.push(`<li>${inline(ul[1])}</li>`)
      return
    }
    const ol = line.match(/^\d+\.\s+(.*)$/)
    if (ol) {
      if (listType !== 'ol') {
        flushList()
        out.push('<ol>')
        listType = 'ol'
      }
      out.push(`<li>${inline(ol[1])}</li>`)
      return
    }
    flushList()
    out.push(`<p>${inline(line)}</p>`)
  })
  flushList()
  flushTable()
  if (inCode && codeBuf.length) out.push(`<pre><code>${codeBuf.join('\n')}</code></pre>`)
  return out.join('\n')
}

const html = computed(() => (active.value ? mdToHtml(active.value.content) : ''))
</script>

<template>
  <div class="page kb-page">
    <PageHeader title="知识库" desc="调优经验、故障排查与接入指南，均由技术支持团队维护">
      <span class="tag"><BookOpen :size="11" /> {{ kbArticles.length }} 篇文档</span>
    </PageHeader>

    <div class="layout">
      <aside class="cats">
        <div class="c-label">文档分类</div>
        <button
          v-for="c in categories"
          :key="c"
          class="cat"
          :class="{ on: category === c }"
          @click="category = c"
        >
          {{ c }}
          <span class="c-cnt">{{ c === '全部' ? kbArticles.length : kbArticles.filter((a) => a.category === c).length }}</span>
        </button>
      </aside>

      <section class="mid">
        <div class="search">
          <Search :size="13" />
          <input v-model="keyword" placeholder="搜索文档标题或摘要" />
        </div>
        <div class="arts">
          <button
            v-for="a in list"
            :key="a.id"
            class="art"
            :class="{ on: active?.id === a.id }"
            @click="activeId = a.id"
          >
            <div class="a-cat">{{ a.category }}</div>
            <div class="a-title">{{ a.title }}</div>
            <div class="a-sum clamp-2">{{ a.summary }}</div>
            <div class="a-meta">
              <span><Eye :size="10" /> {{ a.views }}</span>
              <span>{{ a.updatedAt }}</span>
            </div>
          </button>
          <div v-if="!list.length" class="no-art">没有匹配的文档</div>
        </div>
      </section>

      <article v-if="active" class="doc card">
        <div class="doc-head">
          <div class="d-cat">{{ active.category }}</div>
          <h1 class="d-title">{{ active.title }}</h1>
          <div class="d-meta">
            <span><Clock :size="11" /> 更新于 {{ active.updatedAt }}</span>
            <i class="sep" />
            <span><Eye :size="11" /> {{ active.views }} 次阅读</span>
            <i class="sep" />
            <span>技术支持团队</span>
          </div>
        </div>
        <div class="md" v-html="html" />
        <div class="doc-foot">
          <span class="df-q">这篇文档对你有帮助吗？</span>
          <button class="btn btn-ghost btn-sm" @click="app.toast('success', '感谢反馈', '已记录你的评价')">
            <ThumbsUp :size="12" /> 有帮助
          </button>
          <button class="btn btn-subtle btn-sm" @click="app.toast('info', '已记录', '我们会补充这部分内容')">还需要补充</button>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.kb-page {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.layout {
  flex: 1;
  display: grid;
  grid-template-columns: 168px 300px minmax(0, 1fr);
  gap: 14px;
  min-height: 0;
}
.cats {
  padding-top: 2px;
}
.c-label {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
  padding: 6px 10px;
  font-weight: 500;
}
.cat {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 12px;
  color: var(--text-2);
  text-align: left;
  margin-bottom: 1px;
}
.cat:hover {
  background: var(--bg-card);
  color: var(--text-1);
}
.cat.on {
  background: var(--primary-soft);
  color: var(--primary);
}
.c-cnt {
  font-size: 10px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}
.cat.on .c-cnt {
  color: var(--primary);
  opacity: 0.75;
}
.mid {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--border);
  padding-right: 14px;
}
.search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text-3);
  flex: none;
  margin-bottom: 10px;
}
.search input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 12px;
  color: var(--text-1);
}
.search input::placeholder {
  color: var(--text-3);
}
.arts {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.art {
  display: block;
  width: 100%;
  text-align: left;
  padding: 11px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  margin-bottom: 2px;
}
.art:hover {
  background: var(--bg-card);
}
.art.on {
  background: var(--bg-card);
  border-color: var(--border);
}
.a-cat {
  font-size: 9.5px;
  color: var(--primary);
  opacity: 0.85;
}
.a-title {
  font-size: 12.5px;
  color: var(--text-1);
  margin-top: 4px;
  font-weight: 500;
  line-height: 1.45;
}
.a-sum {
  font-size: 10.5px;
  color: var(--text-3);
  line-height: 1.55;
  margin-top: 4px;
}
.a-meta {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  font-size: 9.5px;
  color: var(--text-3);
}
.a-meta span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.no-art {
  padding: 24px;
  text-align: center;
  font-size: 11.5px;
  color: var(--text-3);
}
.doc {
  overflow-y: auto;
  padding: 24px 30px 28px;
  min-height: 0;
}
.d-cat {
  font-size: 10.5px;
  color: var(--primary);
  margin-bottom: 8px;
}
.d-title {
  font-size: 21px;
  font-weight: 500;
  color: var(--text-1);
  letter-spacing: -0.02em;
  line-height: 1.35;
}
.d-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 10.5px;
  color: var(--text-3);
}
.d-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.sep {
  width: 1px;
  height: 9px;
  background: var(--border-strong);
}
.md {
  max-width: 740px;
  padding-top: 8px;
}
.doc-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 26px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
.df-q {
  font-size: 11.5px;
  color: var(--text-3);
  margin-right: 4px;
}
@media (max-width: 1280px) {
  .layout {
    grid-template-columns: 140px 260px minmax(0, 1fr);
  }
}
</style>

<style>
.md h3 {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-1);
  margin: 22px 0 10px;
  letter-spacing: -0.01em;
}
.md h4 {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-1);
  margin: 18px 0 8px;
}
.md h5 {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-2);
  margin: 14px 0 6px;
}
.md p {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.85;
  margin: 9px 0;
}
.md strong {
  color: var(--text-1);
  font-weight: 500;
}
.md code {
  font-family: var(--font-mono);
  font-size: 11.5px;
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1px 5px;
  color: var(--text-1);
}
.md pre {
  background: var(--bg-inset);
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 14px 16px;
  overflow-x: auto;
  margin: 12px 0;
}
.md pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 11.5px;
  line-height: 1.75;
  color: var(--text-2);
}
.md ul,
.md ol {
  margin: 9px 0 9px 2px;
  padding-left: 17px;
}
.md ul li {
  list-style: disc;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.8;
  margin: 3px 0;
}
.md ol li {
  list-style: decimal;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.8;
  margin: 4px 0;
}
.md li::marker {
  color: var(--text-3);
}
.md .md-table {
  margin: 14px 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.md table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}
.md th {
  text-align: left;
  font-weight: 500;
  color: var(--text-3);
  background: var(--bg-panel);
  padding: 8px 12px;
  font-size: 10.5px;
  border-bottom: 1px solid var(--border);
}
.md td {
  padding: 8px 12px;
  color: var(--text-2);
  border-bottom: 1px solid var(--border-subtle);
  line-height: 1.6;
}
.md tr:last-child td {
  border-bottom: none;
}
</style>
