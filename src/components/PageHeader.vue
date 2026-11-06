<template>
  <div class="page-head">
    <div class="head-main">
      <div class="title-row">
        <h2>{{ title }}</h2>
        <slot name="tag" />
      </div>
      <div v-if="desc" class="desc">{{ desc }}</div>
    </div>
    <div class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; desc?: string }>()
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 2px 2px 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--neutral-900);
  letter-spacing: 0.2px;
}

.desc {
  margin-top: 5px;
  font-size: 13px;
  color: var(--neutral-400);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
</style>
