<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  /** 是否使用卡片包裹内容 */
  card?: boolean
  noPadding?: boolean
}

withDefaults(defineProps<Props>(), { card: true, noPadding: false })
</script>

<template>
  <div class="vc-page-container">
    <div v-if="title || $slots.header" class="vc-page-header">
      <div class="vc-page-header__left">
        <h2 v-if="title" class="vc-page-header__title">{{ title }}</h2>
        <p v-if="subtitle" class="vc-page-header__subtitle">{{ subtitle }}</p>
      </div>
      <div class="vc-page-header__extra">
        <slot name="header" />
      </div>
    </div>
    <div :class="['vc-page-body', { 'is-card': card, 'no-padding': noPadding }]">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.vc-page-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vc-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.vc-page-header__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.vc-page-header__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.vc-page-header__extra {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.vc-page-body {
  min-height: 120px;
}

.vc-page-body.is-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
}

.vc-page-body.no-padding {
  padding: 0;
}
</style>
