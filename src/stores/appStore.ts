import { create } from 'zustand'
import type { Role, SessionUser } from '@/types'
import { DEMO_ACCOUNTS } from '@/mock/db'

export interface Settings {
  systemName: string
  language: string
  timezone: string
  tts: boolean
  voice: string
  speed: number
  sensitivity: number
  confirmHighRisk: boolean
  undoWindow: number
  channels: string[]
  alertSound: boolean
  quietStart: string
  quietEnd: string
  refreshInterval: number
  failRate: number
}

const DEFAULT_SETTINGS: Settings = {
  systemName: '沉浸式智能控制人机交互系统',
  language: '简体中文',
  timezone: 'Asia/Shanghai (UTC+8)',
  tts: true,
  voice: '清朗男声',
  speed: 55,
  sensitivity: 68,
  confirmHighRisk: true,
  undoWindow: 5,
  channels: ['站内', '邮件'],
  alertSound: true,
  quietStart: '23:00',
  quietEnd: '07:00',
  refreshInterval: 10,
  failRate: 0,
}

interface AppState {
  theme: 'dark' | 'light'
  collapsed: boolean
  focusMode: boolean
  user: SessionUser | null
  settings: Settings
  setTheme: (t: 'dark' | 'light') => void
  toggleTheme: () => void
  toggleCollapsed: () => void
  toggleFocus: () => void
  login: (role: Role) => void
  useAccount: (account: string) => boolean
  logout: () => void
  updateSettings: (patch: Partial<Settings>) => void
  resetSettings: () => void
}

const readTheme = (): 'dark' | 'light' => {
  const t = localStorage.getItem('ice.theme')
  return t === 'light' ? 'light' : 'dark'
}

const readUser = (): SessionUser | null => {
  try {
    const raw = localStorage.getItem('ice.user')
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

const readSettings = (): Settings => {
  try {
    const raw = localStorage.getItem('ice.settings')
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const applyTheme = (t: 'dark' | 'light') => {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('ice.theme', t)
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: readTheme(),
  collapsed: localStorage.getItem('ice.collapsed') === '1',
  focusMode: false,
  user: readUser(),
  settings: readSettings(),
  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },
  toggleCollapsed: () => {
    const next = !get().collapsed
    localStorage.setItem('ice.collapsed', next ? '1' : '0')
    set({ collapsed: next })
  },
  toggleFocus: () => set({ focusMode: !get().focusMode }),
  login: (role) => {
    const found = DEMO_ACCOUNTS.find((u) => u.role === role) ?? DEMO_ACCOUNTS[0]
    localStorage.setItem('ice.user', JSON.stringify(found))
    set({ user: found })
  },
  useAccount: (account) => {
    const found = DEMO_ACCOUNTS.find((u) => u.account === account)
    if (!found) return false
    localStorage.setItem('ice.user', JSON.stringify(found))
    set({ user: found })
    return true
  },
  logout: () => {
    localStorage.removeItem('ice.user')
    set({ user: null })
  },
  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch }
    localStorage.setItem('ice.settings', JSON.stringify(next))
    set({ settings: next })
  },
  resetSettings: () => {
    localStorage.setItem('ice.settings', JSON.stringify(DEFAULT_SETTINGS))
    set({ settings: DEFAULT_SETTINGS })
  },
}))
