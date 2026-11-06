import { create } from 'zustand';
import type { Notification } from '@/types';
import { NOTIFICATIONS, CURRENT_USER_ID, USERS } from '@/mock/seed/people';

type Theme = 'dark' | 'light';

interface AppState {
  theme: Theme;
  collapsed: boolean;
  currentUserId: string;
  notifications: Notification[];
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  toggleSider: () => void;
  setCurrentUser: (id: string) => void;
  markAllRead: () => void;
  pushNotification: (n: Omit<Notification, 'id' | 'time' | 'read'>) => void;
}

const savedTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('mf:theme')) as Theme | null;

export const useAppStore = create<AppState>((set, get) => ({
  theme: savedTheme || 'dark',
  collapsed: false,
  currentUserId: CURRENT_USER_ID,
  notifications: NOTIFICATIONS,
  setTheme: (theme) => {
    localStorage.setItem('mf:theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
  toggleSider: () => set((s) => ({ collapsed: !s.collapsed })),
  setCurrentUser: (currentUserId) => set({ currentUserId }),
  markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  pushNotification: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: `n_${Date.now()}`, time: new Date().toISOString(), read: false },
        ...s.notifications,
      ].slice(0, 30),
    })),
}));

export function useCurrentUser() {
  const id = useAppStore((s) => s.currentUserId);
  return USERS.find((u) => u.id === id) || USERS[0];
}
