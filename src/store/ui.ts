import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '../lib/permissions'

interface UIState {
  role: Role
  setRole: (r: Role) => void
  collapsed: boolean
  toggleCollapsed: () => void
  commandOpen: boolean
  setCommandOpen: (v: boolean) => void
  notifyOpen: boolean
  setNotifyOpen: (v: boolean) => void
  assistantOpen: boolean
  setAssistantOpen: (v: boolean) => void
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      role: 'admin',
      setRole: (role) => set({ role }),
      collapsed: false,
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      notifyOpen: false,
      setNotifyOpen: (notifyOpen) => set({ notifyOpen }),
      assistantOpen: false,
      setAssistantOpen: (assistantOpen) => set({ assistantOpen }),
    }),
    { name: 'avrs-ui', partialize: (s) => ({ role: s.role, collapsed: s.collapsed }) },
  ),
)
