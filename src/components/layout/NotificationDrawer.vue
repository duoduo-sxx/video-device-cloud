<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, Bell, CheckCheck, Headphones, Info } from 'lucide-vue-next'
import BaseDrawer from '@/components/ui/BaseDrawer.vue'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'
import { fromNow } from '@/composables/useFormat'

const app = useAppStore()
const data = useDataStore()
const router = useRouter()

const open = computed({
  get: () => app.notifOpen,
  set: (v: boolean) => (app.notifOpen = v)
})

const icons = { task: Bell, ticket: Headphones, system: Info }
const tints = { task: 'var(--primary)', ticket: 'var(--success)', system: 'var(--warning)' }

function openItem(id: string, link?: string) {
  data.markRead(id)
  if (link) {
    router.push(link)
    app.notifOpen = false
  }
}
</script>

<template>
  <BaseDrawer v-model="open" title="通知" desc="任务进度、工单回复与系统公告" :width="400">
    <div v-if="!data.notifications.length" class="empty">暂无通知</div>
    <div v-else class="list">
      <button
        v-for="n in data.notifications"
        :key="n.id"
        class="item"
        :class="{ unread: !n.read }"
        @click="openItem(n.id, n.link)"
      >
        <div class="ic" :style="{ color: tints[n.type], background: 'var(--bg-card-hover)' }">
          <component :is="icons[n.type]" :size="14" />
        </div>
        <div class="main">
          <div class="row between gap-8">
            <span class="t">{{ n.title }}</span>
            <span class="time">{{ fromNow(n.time) }}</span>
          </div>
          <p class="c">{{ n.content }}</p>
        </div>
        <span v-if="!n.read" class="dot" style="background: var(--primary)" />
      </button>
    </div>
    <template #footer>
      <button class="btn btn-ghost btn-sm" @click="data.markAllRead()">
        <CheckCheck :size="13" />
        全部标记为已读
      </button>
    </template>
  </BaseDrawer>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.item {
  display: flex;
  gap: 10px;
  padding: 12px 10px;
  border-radius: 8px;
  text-align: left;
  position: relative;
  border: 1px solid transparent;
}
.item:hover {
  background: var(--bg-card-hover);
}
.item.unread {
  background: var(--primary-soft);
  border-color: var(--primary-soft-2);
}
.ic {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  flex: none;
}
.main {
  flex: 1;
  min-width: 0;
}
.t {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-1);
}
.time {
  font-size: 10.5px;
  color: var(--text-3);
  flex: none;
}
.c {
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--text-3);
  line-height: 1.55;
}
.empty {
  padding: 40px;
  text-align: center;
  color: var(--text-3);
  font-size: 13px;
}
</style>
