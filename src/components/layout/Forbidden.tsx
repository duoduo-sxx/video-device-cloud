import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROLE_MAP } from '@/mocks/roles';
import Button from '../ui/Button';
import { SCOPE_META, type Scope } from './nav';

export default function Forbidden({
  need,
  scope = 'console',
}: {
  need: string;
  scope?: Scope;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user ? ROLE_MAP[user.role] : null;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
        <ShieldAlert size={26} className="text-danger" />
      </div>
      <div className="num text-2xl font-semibold text-ink-1">403</div>
      <div className="mt-2 text-sm font-medium text-ink-1">当前身份无权访问该页面</div>
      <div className="mt-2 max-w-md text-xs leading-relaxed text-ink-3">
        你的身份是「{role?.name ?? '未登录'}」，缺少权限点 <code className="rounded bg-[#F2F4F7] px-1 py-0.5 text-ink-2">{need}</code>。
        财务数据与开票能力仅对企业管理员、客户财务开放。如需访问，请联系企业管理员调整角色。
      </div>
      <div className="mt-6 flex gap-2">
        <Button variant="primary" icon={<ArrowLeft size={14} />} onClick={() => navigate(SCOPE_META[scope].home)}>
          返回工作台
        </Button>
      </div>
    </div>
  );
}
