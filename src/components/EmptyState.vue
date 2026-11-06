<template>
  <div class="empty">
    <svg viewBox="0 0 120 80" width="96" height="64" fill="none">
      <rect x="18" y="26" width="84" height="10" rx="4" fill="#EEF1F6" />
      <rect x="18" y="40" width="84" height="10" rx="4" fill="#F4F6FA" />
      <rect x="18" y="54" width="84" height="10" rx="4" fill="#EEF1F6" />
      <circle cx="27" cy="31" r="2" fill="#C9D3E0" />
      <circle cx="27" cy="45" r="2" fill="#C9D3E0" />
      <circle cx="27" cy="59" r="2" fill="#C9D3E0" />
      <path d="M46 31h34M46 45h24M46 59h30" stroke="#D9E1EC" stroke-width="3" stroke-linecap="round" />
    </svg>
    <div class="empty-text">{{ text || '暂无数据' }}</div>
    <div v-if="desc" class="empty-desc">{{ desc }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text?: string; desc?: string }>()
</script>

<style scoped>
.empty {
  padding: 26px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.empty-text {
  font-size: 13px;
  color: var(--neutral-600);
}

.empty-desc {
  font-size: 12px;
  color: var(--neutral-400);
}
</style>
