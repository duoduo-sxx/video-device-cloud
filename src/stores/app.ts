import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface TabItem {
  path: string
  title: string
  closable: boolean
}

const APP_KEY = 'vc_app_state'

interface AppState {
  collapsed: boolean
  theme: 'light' | 'dark'
  watermark: boolean
  showTabs: boolean
  density: 'default' | 'small' | 'large'
}

function read(): AppState {
  try {
    const raw = localStorage.getItem(APP_KEY)
    if (raw) return { collapsed: false, theme: 'light', watermark: true, showTabs: true, density: 'default', ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { collapsed: false, theme: 'light', watermark: true, showTabs: true, density: 'default' }
}

export const useAppStore = defineStore('app', () => {
  const initial = read()
  const sidebarCollapsed = ref(initial.collapsed)
  const theme = ref<'light' | 'dark'>(initial.theme)
  const watermark = ref(initial.watermark)
  const showTabs = ref(initial.showTabs)
  const density = ref<'default' | 'small' | 'large'>(initial.density)
  const visitedTabs = ref<TabItem[]>([])
  const globalSearchVisible = ref(false)

  function persist(): void {
    const state: AppState = {
      collapsed: sidebarCollapsed.value,
      theme: theme.value,
      watermark: watermark.value,
      showTabs: showTabs.value,
      density: density.value
    }
    localStorage.setItem(APP_KEY, JSON.stringify(state))
  }

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setTheme(t: 'light' | 'dark'): void {
    theme.value = t
    applyTheme()
  }

  function applyTheme(): void {
    const html = document.documentElement
    if (theme.value === 'dark') html.classList.add('dark')
    else html.classList.remove('dark')
  }

  function addTab(tab: TabItem): void {
    if (!tab.title) return
    const exists = visitedTabs.value.find((t) => t.path === tab.path)
    if (!exists) visitedTabs.value.push(tab)
  }

  function removeTab(path: string): string | null {
    const idx = visitedTabs.value.findIndex((t) => t.path === path)
    if (idx < 0) return null
    visitedTabs.value.splice(idx, 1)
    const next = visitedTabs.value[idx] || visitedTabs.value[idx - 1]
    return next ? next.path : '/dashboard'
  }

  function closeOtherTabs(path: string): void {
    visitedTabs.value = visitedTabs.value.filter((t) => t.path === path || !t.closable)
  }

  function toggleSearch(visible?: boolean): void {
    globalSearchVisible.value = visible ?? !globalSearchVisible.value
  }

  watch([sidebarCollapsed, theme, watermark, showTabs, density], persist)

  applyTheme()

  return {
    sidebarCollapsed,
    theme,
    watermark,
    showTabs,
    density,
    visitedTabs,
    globalSearchVisible,
    toggleSidebar,
    setTheme,
    applyTheme,
    addTab,
    removeTab,
    closeOtherTabs,
    toggleSearch
  }
})
