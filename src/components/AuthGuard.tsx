import type { ReactNode } from 'react';
import { useUiStore, type Role } from '../store/uiStore';

const RANK: Record<Role, number> = { viewer: 0, operator: 1, admin: 2 };

/** 按角色隐藏写操作：viewer 全部隐藏，operator 不可见系统管理 */
export default function AuthGuard({
  role = 'operator',
  children,
}: {
  role?: Role;
  children: ReactNode;
}) {
  const current = useUiStore((s) => s.role);
  if (RANK[current] < RANK[role]) return null;
  return <>{children}</>;
}

export const canWrite = (current: Role): boolean => RANK[current] >= 1;
