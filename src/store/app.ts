import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  kind: ToastKind
  title: string
  desc?: string
}

interface AppState {
  sidebarCollapsed: boolean
  commandOpen: boolean
  notificationsOpen: boolean
  toasts: ToastItem[]
  toggleSidebar: () => void
  setCommandOpen: (v: boolean) => void
  setNotificationsOpen: (v: boolean) => void
  toast: (kind: ToastKind, title: string, desc?: string) => void
  dismissToast: (id: string) => void
}

let seq = 0

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandOpen: false,
      notificationsOpen: false,
      toasts: [],
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandOpen: (v) => set({ commandOpen: v }),
      setNotificationsOpen: (v) => set({ notificationsOpen: v }),
      toast: (kind, title, desc) => {
        const id = `t_${++seq}_${Date.now()}`
        set((s) => ({ toasts: [...s.toasts, { id, kind, title, desc }] }))
        window.setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
        }, 3200)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'spacescape:v1:app',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
)
