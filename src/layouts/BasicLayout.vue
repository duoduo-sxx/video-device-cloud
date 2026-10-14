<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import SideMenu from './SideMenu.vue'
import HeaderBar from './HeaderBar.vue'
import TabBar from './TabBar.vue'
import GlobalSearch from './GlobalSearch.vue'

const app = useAppStore()

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    app.toggleSearch(true)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="layout">
    <div class="layout__body">
      <SideMenu />
      <div class="layout__main">
        <HeaderBar />
        <TabBar v-if="app.showTabs" />
        <div class="layout__content">
          <router-view v-slot="{ Component }">
            <transition name="vc-fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </div>
    <GlobalSearch />
  </div>
</template>

<style scoped>
.layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout__body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.layout__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.layout__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--vc-content-padding);
}
</style>
