import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoleKey, User } from '@/types';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  collapsed: boolean;
  nlpHistory: { id: string; text: string; intent: string; time: string }[];
  login: (user: User) => void;
  logout: () => void;
  toggleTheme: () => void;
  toggleCollapsed: () => void;
  pushNlpHistory: (item: { text: string; intent: string }) => void;
  clearNlpHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      theme: 'light',
      collapsed: false,
      nlpHistory: [],
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      pushNlpHistory: (item) =>
        set((s) => ({
          nlpHistory: [
            { ...item, id: `${Date.now()}`, time: new Date().toLocaleString('zh-CN', { hour12: false }) },
            ...s.nlpHistory,
          ].slice(0, 50),
        })),
      clearNlpHistory: () => set({ nlpHistory: [] }),
    }),
    { name: 'iiup_store' },
  ),
);
