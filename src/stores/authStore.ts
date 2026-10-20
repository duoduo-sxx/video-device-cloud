import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoleId } from '@/types/enums';
import { users } from '@/mock';

export interface SessionUser {
  id: string;
  name: string;
  enName: string;
  email: string;
  role: RoleId;
  title: string;
}

const DEMO_ACCOUNTS: { role: RoleId; userId: string; title: string }[] = [
  { role: 'pm', userId: 'U-002', title: '项目经理 · 深海迷航' },
  { role: 'director', userId: 'U-001', title: '项目总监' },
  { role: 'client_dev', userId: 'U-005', title: '客户端开发 · Cocos' },
  { role: 'qa', userId: 'U-021', title: '测试工程师' },
  { role: 'ops', userId: 'U-026', title: '发布运维' },
  { role: 'artist', userId: 'U-016', title: '美术设计 · UI' },
  { role: 'dev', userId: 'U-012', title: '工具链与 CI' },
  { role: 'finance', userId: 'U-028', title: '财务' },
  { role: 'admin', userId: 'U-030', title: '系统管理员' },
  { role: 'client', userId: 'C-U-001', title: '客户 · 云跃网络' },
];

export const demoAccounts = DEMO_ACCOUNTS.map((a) => {
  const u = users.find((x) => x.id === a.userId);
  return {
    role: a.role,
    userId: a.userId,
    title: a.title,
    name: u?.name ?? '邓斯远',
    email: u?.email ?? 'dengsy@yunyue-tech.com',
  };
});

function buildSession(role: RoleId): SessionUser {
  const acc = DEMO_ACCOUNTS.find((a) => a.role === role) ?? DEMO_ACCOUNTS[0];
  const u = users.find((x) => x.id === acc.userId);
  return {
    id: acc.userId,
    name: u?.name ?? '邓斯远',
    enName: u?.enName ?? 'Deng',
    email: u?.email ?? 'dengsy@yunyue-tech.com',
    role,
    title: acc.title,
  };
}

interface AuthState {
  user: SessionUser | null;
  login: (role: RoleId) => void;
  logout: () => void;
  switchRole: (role: RoleId) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: buildSession('pm'),
      login: (role) => set({ user: buildSession(role) }),
      logout: () => set({ user: null }),
      switchRole: (role) => set({ user: buildSession(role) }),
    }),
    { name: 'np.auth' },
  ),
);

const ROLE_MENU_ACCESS: Record<RoleId, string[]> = {
  admin: ['*'],
  director: ['dashboard', 'projects', 'delivery', 'quality', 'analytics', 'assets', 'support', 'org', 'settings'],
  pm: ['dashboard', 'projects', 'delivery', 'quality', 'analytics', 'assets', 'support', 'org'],
  client_dev: ['dashboard', 'projects', 'delivery', 'quality', 'assets'],
  dev: ['dashboard', 'projects', 'delivery', 'quality', 'assets', 'support'],
  artist: ['dashboard', 'projects', 'assets'],
  qa: ['dashboard', 'projects', 'quality', 'delivery'],
  ops: ['dashboard', 'projects', 'delivery', 'quality', 'analytics'],
  finance: ['dashboard', 'org'],
  client: ['dashboard', 'projects', 'support'],
};

export function canAccess(role: RoleId | undefined, menuKey: string): boolean {
  if (!role) return false;
  const list = ROLE_MENU_ACCESS[role];
  if (!list) return false;
  if (list.includes('*')) return true;
  return list.includes(menuKey);
}

export function isReadOnly(role: RoleId | undefined): boolean {
  return role === 'client' || role === 'finance' || role === 'director';
}
