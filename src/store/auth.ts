import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoleCode } from '@/types';

interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: RoleCode;
  orgName: string;
  avatarColor: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser;
  login: () => void;
  logout: () => void;
  switchRole: (role: RoleCode) => void;
}

const baseUser: AuthUser = {
  id: 'u-2',
  name: '陈默',
  phone: '13800138000',
  email: 'chenmo@xh-chain.cn',
  role: 'org_admin',
  orgName: '杭州拾光文创有限公司',
  avatarColor: '#3D7DFF',
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: baseUser,
      login: () => set({ token: `demo.${Date.now()}` }),
      logout: () => set({ token: null }),
      switchRole: (role) => set((s) => ({ user: { ...s.user, role } })),
    }),
    { name: 'xh-auth' },
  ),
);

export function canAccess(role: RoleCode, allowed?: RoleCode[]) {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(role);
}
