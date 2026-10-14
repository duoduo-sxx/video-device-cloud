<script setup lang="ts">
import { computed } from 'vue'
import { copyText } from '@/utils/download'

interface Props {
  data: any
  height?: number
  showCopy?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), { height: 260, showCopy: true })

const text = computed(() => {
  try {
    return JSON.stringify(props.data, null, 2)
  } catch {
    return String(props.data)
  }
})

/** 轻量语法高亮 */
const html = computed(() => {
  return text.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
      let cls = 'num'
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'key' : 'str'
      else if (/true|false/.test(match)) cls = 'bool'
      else if (/null/.test(match)) cls = 'null'
      return `<span class="jv-${cls}">${match}</span>`
    })
})
</script>

<template>
  <div class="json-viewer">
    <div v-if="title || showCopy" class="json-viewer__head">
      <span class="json-viewer__title">{{ title }}</span>
      <el-button v-if="showCopy" link type="primary" size="small" @click="copyText(text, '已复制响应内容')">
        <el-icon><component :is="'DocumentCopy'" /></el-icon>
        复制
      </el-button>
    </div>
    <pre class="json-viewer__body" :style="{ maxHeight: height + 'px' }" v-html="html" />
  </div>
</template>

<style scoped>
.json-viewer {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.json-viewer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.json-viewer__body {
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre;
  color: var(--el-text-color-primary);
}

.json-viewer__body :deep(.jv-key) {
  color: #1677ff;
}

.json-viewer__body :deep(.jv-str) {
  color: #0f6e56;
}

.json-viewer__body :deep(.jv-num) {
  color: #993c1d;
}

.json-viewer__body :deep(.jv-bool) {
  color: #854f0b;
}

.json-viewer__body :deep(.jv-null) {
  color: #888780;
}
</style>
