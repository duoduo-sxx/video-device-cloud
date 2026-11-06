import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NotificationItem } from '../types';
import { NOTIFICATIONS } from '../mock/seed';

export type Role = 'admin' | 'operator' | 'viewer';
export type ThemeMode = 'light' | 'dark';

export const ROLE_USER: Record<Role, { name: string; dept: string; color: string }> = {
  admin: { name: '陈屿', dept: '数据平台部 · 平台管理员', color: '#2563EB' },
  operator: { name: '林书禾', dept: '基础架构部 · 运维工程师', color: '#06B6D4' },
  viewer: { name: '沈亦舟', dept: '数据平台部 · 只读访客', color: '#64748B' },
};

interface UiState {
  theme: ThemeMode;
  role: Role;
  collapsed: boolean;
  notifications: NotificationItem[];
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  setRole: (r: Role) => void;
  toggleCollapsed: () => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      role: 'admin',
      collapsed: false,
      notifications: NOTIFICATIONS,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setRole: (role) => set({ role }),
      toggleCollapsed: () => set({ collapsed: !get().collapsed }),
      markAllRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
      markRead: (id) =>
        set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }),
    }),
    { name: 'cf-ui-v1' },
  ),
);
