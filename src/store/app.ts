import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/models';

interface AppState {
  user: User | null;
  collapsed: boolean;
  tabKeys: string[];
  login: (user: User) => void;
  logout: () => void;
  toggleCollapsed: () => void;
  pushTab: (key: string) => void;
  removeTab: (key: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      collapsed: false,
      tabKeys: ['/dashboard'],
      login: (user) => set({ user }),
      logout: () => set({ user: null, tabKeys: ['/dashboard'] }),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      pushTab: (key) =>
        set((state) => (state.tabKeys.includes(key) ? state : { tabKeys: [...state.tabKeys, key].slice(-8) })),
      removeTab: (key) =>
        set((state) => ({ tabKeys: state.tabKeys.filter((item) => item !== key) })),
    }),
    {
      name: 'inertial-sense-app',
      partialize: (state) => ({ user: state.user, collapsed: state.collapsed, tabKeys: state.tabKeys }),
    },
  ),
);
