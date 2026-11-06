import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RoleId } from '@/types'
import { ROLES } from '@/mock'

export type ModuleKey = 'dashboard' | 'data' | 'recon' | 'mr' | 'inspect' | 'ticket' | 'service' | 'system'

interface AuthState {
  logged: boolean
  userName: string
  roleId: RoleId
  login: (name: string, roleId?: RoleId) => void
  logout: () => void
  setRole: (role: RoleId) => void
  can: (module: ModuleKey, mode?: 'r' | 'w') => boolean
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      logged: true,
      userName: '张伟',
      roleId: 'R1',
      login: (name, roleId = 'R1') => set({ logged: true, userName: name, roleId }),
      logout: () => set({ logged: false }),
      setRole: (roleId) => set({ roleId }),
      can: (module, mode = 'r') => {
        const role = ROLES.find((r) => r.id === get().roleId)
        if (!role) return false
        const p = role.perms[module]
        if (!p || p === 'none') return false
        return mode === 'r' ? p === 'r' || p === 'rw' : p === 'rw'
      },
    }),
    { name: 'mirrorfield.auth' },
  ),
)

interface UIState {
  collapsed: boolean
  theme: 'dark' | 'light'
  toggle: () => void
  setTheme: (t: 'dark' | 'light') => void
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      collapsed: false,
      theme: 'dark',
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'mirrorfield.ui' },
  ),
)
