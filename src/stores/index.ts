import { create } from 'zustand'
import type { RoleKey, UserItem } from '../types'
import { users } from '../mock/data'

interface AuthState {
  user: UserItem | null
  role: RoleKey
  login: (role?: RoleKey) => void
  logout: () => void
  switchRole: (role: RoleKey) => void
}

const stored = (() => {
  try {
    const raw = localStorage.getItem('vi_auth')
    return raw ? (JSON.parse(raw) as { role?: RoleKey }) : null
  } catch {
    return null
  }
})()

function pickUser(role: RoleKey): UserItem {
  return users.find((u) => u.role === role && u.status === 'active') ?? users[0]
}

/** 首帧就恢复登录态，避免刷新后先跳到 /login 再回跳 */
const initialRole: RoleKey = stored?.role ?? 'admin'
const initialUser: UserItem | null = stored ? pickUser(initialRole) : null

export const useAuth = create<AuthState>((set) => ({
  user: initialUser,
  role: initialRole,
  login: (role) => {
    const r = role ?? useAuth.getState().role
    const u = pickUser(r)
    try {
      localStorage.setItem('vi_auth', JSON.stringify({ role: r, id: u.id }))
    } catch {
      /* ignore */
    }
    set({ user: u, role: r })
  },
  logout: () => {
    try {
      localStorage.removeItem('vi_auth')
    } catch {
      /* ignore */
    }
    set({ user: null })
  },
  switchRole: (role) => {
    const u = pickUser(role)
    try {
      localStorage.setItem('vi_auth', JSON.stringify({ role, id: u.id }))
    } catch {
      /* ignore */
    }
    set({ user: u, role })
  },
}))

interface UiState {
  collapsed: boolean
  theme: 'light' | 'dark'
  toggleCollapsed: () => void
  setTheme: (t: 'light' | 'dark') => void
  toggleTheme: () => void
}

const themeInit = (() => {
  try {
    const t = localStorage.getItem('vi_theme')
    if (t === 'light' || t === 'dark') return t
  } catch {
    /* ignore */
  }
  return 'light' as const
})()

export const useUi = create<UiState>((set, get) => ({
  collapsed: false,
  theme: themeInit,
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  setTheme: (t) => {
    try {
      localStorage.setItem('vi_theme', t)
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.theme = t
    set({ theme: t })
  },
  toggleTheme: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
}))

interface PlayerState {
  duration: number
  currentTime: number
  playing: boolean
  rate: number
  volume: number
  muted: boolean
  setDuration: (d: number) => void
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (t: number) => void
  step: (delta: number) => void
  setRate: (r: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  reset: () => void
}

let rafId: number | null = null
let lastTs = 0

function tick() {
  const s = usePlayer.getState()
  const now = performance.now()
  const delta = Math.min(0.1, (now - lastTs) / 1000)
  lastTs = now
  const next = s.currentTime + delta * s.rate
  if (next >= s.duration) {
    usePlayer.setState({ currentTime: s.duration, playing: false })
    rafId = null
    return
  }
  usePlayer.setState({ currentTime: next })
  rafId = requestAnimationFrame(tick)
}

export const usePlayer = create<PlayerState>((set, get) => ({
  duration: 0,
  currentTime: 0,
  playing: false,
  rate: 1,
  volume: 0.8,
  muted: false,
  setDuration: (d) => set({ duration: d }),
  play: () => {
    if (get().playing) return
    if (get().currentTime >= get().duration) set({ currentTime: 0 })
    set({ playing: true })
    lastTs = performance.now()
    if (rafId === null) rafId = requestAnimationFrame(tick)
  },
  pause: () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    set({ playing: false })
  },
  toggle: () => (get().playing ? get().pause() : get().play()),
  seek: (t) => {
    const d = get().duration
    set({ currentTime: Math.max(0, Math.min(d || t, t)) })
  },
  step: (delta) => {
    const { currentTime, duration } = get()
    set({ currentTime: Math.max(0, Math.min(duration, currentTime + delta)) })
  },
  setRate: (r) => set({ rate: r }),
  setVolume: (v) => set({ volume: v, muted: v === 0 }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  reset: () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    set({ duration: 0, currentTime: 0, playing: false, rate: 1 })
  },
}))
