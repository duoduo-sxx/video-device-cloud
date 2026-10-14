<script setup lang="ts">
interface Props {
  description?: string
  tips?: string
  actionText?: string
  size?: number
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  size: 90
})

defineEmits<{ (e: 'action'): void }>()
</script>

<template>
  <div class="empty-state">
    <el-empty :image-size="size" :description="description">
      <template #description>
        <div class="empty-state__desc">
          <p class="empty-state__title">{{ description }}</p>
          <p v-if="tips" class="empty-state__tips">{{ tips }}</p>
        </div>
      </template>
      <el-button v-if="actionText" type="primary" plain @click="$emit('action')">{{ actionText }}</el-button>
    </el-empty>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 12px 0;
}

.empty-state__title {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.empty-state__tips {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
