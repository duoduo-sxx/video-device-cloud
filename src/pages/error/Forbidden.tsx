import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/core';
import { useAuth, canAccess } from '@/store/auth';
import { ROLE_META } from '@/utils/constants';

export default function Forbidden() {
  const nav = useNavigate();
  const user = useAuth((s) => s.user);

  return (
    <div className="flex flex-col items-center justify-center py-28">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(255,92,122,.3)] bg-[rgba(255,92,122,.08)]">
        <ShieldAlert size={26} className="text-[var(--danger)]" />
      </div>
      <div className="mt-5 text-[16px] text-[var(--text-1)]">没有访问权限</div>
      <p className="mt-2 max-w-[420px] text-center text-[12px] leading-relaxed text-[var(--text-3)]">
        当前角色「{ROLE_META[user.role].label}」无权访问该页面。你可以切换演示角色，或联系企业管理员为你分配权限。
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={() => nav(-1)}>返回上一页</Button>
        <Button variant="primary" onClick={() => nav('/dashboard')}>回到工作台</Button>
      </div>
      <div className="mt-4 text-[10.5px] text-[var(--text-3)]">
        权限校验函数示例：canAccess(role, ['org_admin']) = {String(canAccess(user.role, ['org_admin']))}
      </div>
    </div>
  );
}
