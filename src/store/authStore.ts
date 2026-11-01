import { create } from 'zustand';
import type { Role, RoleCode, User } from '@/types';

export const ROLES: Role[] = [
  {
    code: 'lead',
    name: '投放负责人',
    desc: '看全局、批预算、下发变更',
    permissions: ['suggest.dispatch', 'budget.edit', 'change.approve', 'account.manage'],
  },
  {
    code: 'optimizer',
    name: '优化师',
    desc: '看数据、采纳建议、执行变更',
    permissions: ['suggest.dispatch', 'budget.edit'],
  },
  {
    code: 'analyst',
    name: '数据分析师',
    desc: '只读：看数据与模型结果，不改投放',
    permissions: [],
  },
];

export const ROLE_MAP: Record<RoleCode, Role> = ROLES.reduce(
  (acc, r) => ({ ...acc, [r.code]: r }),
  {} as Record<RoleCode, Role>,
);

export const USERS: User[] = [
  { id: 'U-01', name: '陈默', role: 'lead', title: '品牌增长中心 · 投放负责人', avatar: '陈' },
  { id: 'U-02', name: '周雨', role: 'optimizer', title: '效果投放组 · 高级优化师', avatar: '周' },
  { id: 'U-03', name: '赵一诺', role: 'analyst', title: '数据科学组 · 数据分析师', avatar: '赵' },
];

export function hasPerm(role: RoleCode, need: string): boolean {
  return ROLE_MAP[role]?.permissions.includes(need) ?? false;
}

interface AuthState {
  user: User;
  switchUser: (id: string) => void;
  can: (perm: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: USERS[0],
  switchUser: (id) => {
    const u = USERS.find((x) => x.id === id);
    if (u) set({ user: u });
  },
  can: (perm) => hasPerm(get().user.role, perm),
}));

export const useCan = (perm: string) => useAuthStore((s) => hasPerm(s.user.role, perm));
