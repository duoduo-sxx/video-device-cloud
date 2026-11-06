<script setup lang="ts">
defineProps<{ title: string; desc?: string; eyebrow?: string }>()
</script>

<template>
  <div class="page-head">
    <div class="left">
      <div v-if="eyebrow" class="eyebrow">{{ eyebrow }}</div>
      <h1>{{ title }}</h1>
      <p v-if="desc" class="desc">{{ desc }}</p>
    </div>
    <div class="actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 6px;
  font-weight: 500;
}
h1 {
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--text-1);
  line-height: 1.2;
}
.desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-2);
  max-width: 680px;
  line-height: 1.6;
}
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
  padding-bottom: 2px;
}
.actions:empty {
  display: none;
}
</style>
