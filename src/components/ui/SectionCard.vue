<script setup lang="ts">
withDefaults(defineProps<{ title?: string; desc?: string; noPad?: boolean; flush?: boolean }>(), {
  title: '',
  desc: '',
  noPad: false,
  flush: false
})
</script>

<template>
  <section class="sc" :class="{ flush }">
    <header v-if="title || $slots.actions" class="sc-head">
      <div class="sc-title-wrap">
        <h2 v-if="title" class="sc-title">{{ title }}</h2>
        <span v-if="desc" class="sc-desc">{{ desc }}</span>
      </div>
      <div class="sc-actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="sc-body" :class="{ nopad: noPad }">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.sc {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.flush {
  border: none;
  background: transparent;
  border-radius: 0;
}
.sc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  min-height: 54px;
}
.flush .sc-head {
  padding-left: 0;
  padding-right: 0;
}
.sc-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}
.sc-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-1);
  white-space: nowrap;
}
.sc-desc {
  font-size: 12px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sc-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.sc-actions:empty {
  display: none;
}
.sc-body {
  padding: 20px;
  flex: 1;
  min-width: 0;
}
.sc-body.nopad {
  padding: 0;
}
</style>
