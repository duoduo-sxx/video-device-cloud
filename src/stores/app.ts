import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  type: ToastType
  title: string
  desc?: string
}

const THEME_KEY = 'vidclear.theme'
const SIDEBAR_KEY = 'vidclear.sidebar'

export const useAppStore = defineStore('app', () => {
  const storedTheme = (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY)) || 'dark'
  const theme = ref<'dark' | 'light'>(storedTheme === 'light' ? 'light' : 'dark')
  const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_KEY) === '1')
  const toasts = ref<Toast[]>([])
  const commandOpen = ref(false)
  const notifOpen = ref(false)
  const uploadPanelOpen = ref(false)

  function applyTheme() {
    document.documentElement.dataset.theme = theme.value
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  let toastSeq = 0
  function toast(type: ToastType, title: string, desc?: string) {
    const id = ++toastSeq
    toasts.value.push({ id, type, title, desc })
    window.setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 3200)
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  watch(theme, (v) => {
    localStorage.setItem(THEME_KEY, v)
    applyTheme()
  })
  watch(sidebarCollapsed, (v) => localStorage.setItem(SIDEBAR_KEY, v ? '1' : '0'))

  applyTheme()

  return {
    theme,
    sidebarCollapsed,
    toasts,
    commandOpen,
    notifOpen,
    uploadPanelOpen,
    toggleTheme,
    toggleSidebar,
    toast,
    dismissToast,
    applyTheme
  }
})
