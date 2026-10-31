import { create } from 'zustand';
import type { RoleCode, User } from '@/types';
import { DEMO_IDENTITIES, USERS, TENANTS } from '@/mocks/tenants';

interface AuthState {
  user: User | null;
  tenantId: string;
  login: (role: RoleCode) => void;
  loginAs: (userId: string) => void;
  logout: () => void;
  switchRole: (role: RoleCode) => void;
}

const DEFAULT_USER = USERS[0];

export const useAuthStore = create<AuthState>((set) => ({
  user: DEFAULT_USER,
  tenantId: DEFAULT_USER.tenantId,

  login: (role) => {
    const demo = DEMO_IDENTITIES.find((d) => USERS.find((u) => u.id === d.userId)?.role === role);
    const u = demo ? USERS.find((x) => x.id === demo.userId) : USERS[0];
    if (u) set({ user: u, tenantId: u.tenantId });
  },

  loginAs: (userId) => {
    const u = USERS.find((x) => x.id === userId);
    if (u) set({ user: u, tenantId: u.tenantId });
  },

  logout: () => set({ user: null }),

  switchRole: (role) => {
    const demo = DEMO_IDENTITIES.find((d) => USERS.find((u) => u.id === d.userId)?.role === role);
    const u = demo ? USERS.find((x) => x.id === demo.userId) : undefined;
    if (u) set({ user: u, tenantId: u.tenantId });
  },
}));

export function useCurrentTenant() {
  const tenantId = useAuthStore((s) => s.tenantId);
  return TENANTS.find((t) => t.id === tenantId) ?? TENANTS[0];
}
