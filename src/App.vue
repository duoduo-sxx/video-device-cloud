<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import CommandPalette from '@/components/layout/CommandPalette.vue'
import NotificationDrawer from '@/components/layout/NotificationDrawer.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import { useTaskSimulator } from '@/composables/useTaskSimulator'

useTaskSimulator()
</script>

<template>
  <div class="shell">
    <AppSidebar />
    <div class="main">
      <AppHeader />
      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="route" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
    <CommandPalette />
    <NotificationDrawer />
    <ToastHost />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--bg-app);
}
.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.content {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.route-enter-active,
.route-leave-active {
  transition: opacity 0.18s var(--ease), transform 0.18s var(--ease);
}
.route-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.route-leave-to {
  opacity: 0;
}
</style>
