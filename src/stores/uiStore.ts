import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Lang = 'zh-CN' | 'en-US';

interface UiState {
  theme: ThemeMode;
  lang: Lang;
  collapsed: boolean;
  compact: boolean;
  slowNetwork: boolean;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  setLang: (l: Lang) => void;
  toggleCollapsed: () => void;
  setCompact: (v: boolean) => void;
  setSlowNetwork: (v: boolean) => void;
}

function applyTheme(theme: ThemeMode) {
  const resolved =
    theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
  document.documentElement.setAttribute('data-theme', resolved);
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      lang: 'zh-CN',
      collapsed: false,
      compact: false,
      slowNetwork: false,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
      setLang: (lang) => set({ lang }),
      toggleCollapsed: () => set({ collapsed: !get().collapsed }),
      setCompact: (compact) => set({ compact }),
      setSlowNetwork: (slowNetwork) => set({ slowNetwork }),
    }),
    {
      name: 'np.ui',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useUiStore((s) => s.theme);
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}
