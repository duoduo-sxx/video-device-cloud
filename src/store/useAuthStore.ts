import { create } from 'zustand';
import type { Role } from '../types';

const TOKEN_KEY = 'datarelay_token';
const ROLE_KEY = 'datarelay_role';
const NAME_KEY = 'datarelay_name';

const readRole = (): Role => {
  const saved = localStorage.getItem(ROLE_KEY);
  return saved === 'admin' || saved === 'ops' || saved === 'member' ? saved : 'admin';
};

interface AuthState {
  token: string | null;
  role: Role;
  name: string;
  login: (name: string, role: Role) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  role: readRole(),
  name: localStorage.getItem(NAME_KEY) ?? '陈默',
  login: (name, role) => {
    localStorage.setItem(TOKEN_KEY, `mock-token-${Date.now()}`);
    localStorage.setItem(ROLE_KEY, role);
    localStorage.setItem(NAME_KEY, name);
    set({ token: `mock-token-${Date.now()}`, role, name });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null });
  },
  switchRole: (role) => {
    localStorage.setItem(ROLE_KEY, role);
    set({ role });
  },
}));
