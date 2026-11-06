<script setup lang="ts">
withDefaults(defineProps<{ title: string; desc?: string; icon?: string }>(), { desc: '' })
</script>

<template>
  <div class="empty">
    <div class="art">
      <svg viewBox="0 0 120 90" width="120" height="90" fill="none">
        <rect x="14" y="20" width="92" height="56" rx="8" stroke="var(--border-strong)" stroke-width="1.2" />
        <path d="M14 34h92" stroke="var(--border-strong)" stroke-width="1.2" />
        <circle cx="24" cy="27" r="2.2" fill="var(--border-strong)" />
        <circle cx="32" cy="27" r="2.2" fill="var(--border-strong)" />
        <path d="M48 42l24 13-24 13V42z" fill="var(--border-strong)" opacity="0.55" />
        <path d="M14 76l20-16 14 11 18-16 30 21" stroke="var(--primary)" stroke-width="1.2" opacity="0.5" />
      </svg>
    </div>
    <div class="title">{{ title }}</div>
    <div v-if="desc" class="desc">{{ desc }}</div>
    <div class="actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 20px;
  text-align: center;
}
.art {
  margin-bottom: 16px;
  opacity: 0.9;
}
.title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 6px;
}
.desc {
  font-size: 12.5px;
  color: var(--text-3);
  max-width: 340px;
  line-height: 1.7;
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.actions:empty {
  display: none;
}
</style>
