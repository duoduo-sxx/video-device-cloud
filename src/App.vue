<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const app = useAppStore()
const user = useUserStore()

const watermarkText = computed(() => `${user.nickname} · ${user.userInfo?.tenantName || '平台'}`)
</script>

<template>
  <router-view />
  <div v-if="app.watermark && user.isLogin" class="vc-watermark">
    <div class="vc-watermark__inner">
      <span v-for="i in 48" :key="i">{{ watermarkText }}</span>
    </div>
  </div>
</template>

<style scoped>
.vc-watermark {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9;
  overflow: hidden;
  opacity: 0.5;
}

.vc-watermark__inner {
  display: flex;
  flex-wrap: wrap;
  width: 200%;
  height: 200%;
  transform: rotate(-22deg) translate(-25%, -25%);
  gap: 56px 40px;
}

.vc-watermark__inner span {
  font-size: 13px;
  color: rgba(120, 130, 150, 0.13);
  white-space: nowrap;
}
</style>
