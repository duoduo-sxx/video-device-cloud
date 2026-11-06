<template>
  <div class="layout">
    <AppSidebar :collapsed="collapsed" />
    <div class="main" :class="{ collapsed }">
      <AppNavbar :collapsed="collapsed" @toggle="toggle" />
      <div class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppNavbar from './AppNavbar.vue'

const collapsed = ref(localStorage.getItem('soc.sidebar') === '1')

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem('soc.sidebar', collapsed.value ? '1' : '0')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: var(--bg-page);
}

.main {
  margin-left: 232px;
  min-height: 100vh;
  transition: margin-left 0.18s ease;
  display: flex;
  flex-direction: column;
}

.main.collapsed {
  margin-left: 64px;
}

.content {
  flex: 1;
  padding: 20px;
  max-width: 1760px;
  width: 100%;
}
</style>
