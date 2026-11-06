import { create } from 'zustand'
import type { ToastItem } from '@/types'
import { nanoid } from 'nanoid'

interface UIState {
  commandOpen: boolean
  notifOpen: boolean
  shortcutsOpen: boolean
  toasts: ToastItem[]
  setCommandOpen: (v: boolean) => void
  setNotifOpen: (v: boolean) => void
  setShortcutsOpen: (v: boolean) => void
  toast: (type: ToastItem['type'], title: string, desc?: string) => void
  dismiss: (id: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  commandOpen: false,
  notifOpen: false,
  shortcutsOpen: false,
  toasts: [],
  setCommandOpen: (v) => set({ commandOpen: v, notifOpen: false }),
  setNotifOpen: (v) => set({ notifOpen: v, commandOpen: false }),
  setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
  toast: (type, title, desc) => {
    const id = nanoid(6)
    set({ toasts: [...get().toasts, { id, type, title, desc }].slice(-4) })
    window.setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) })
    }, 3800)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))
