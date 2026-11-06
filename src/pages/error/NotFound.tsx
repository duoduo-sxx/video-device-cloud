import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/core';

export default function NotFound() {
  const nav = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-28">
      <div className="text-[72px] font-semibold leading-none tracking-[-4px] text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,.22)' }}>
        404
      </div>
      <div className="mt-4 flex items-center gap-2 text-[14px] text-[var(--text-1)]">
        <Compass size={15} className="text-[var(--brand-2)]" />
        页面走丢了
      </div>
      <p className="mt-2 max-w-[360px] text-center text-[12px] leading-relaxed text-[var(--text-3)]">
        你访问的页面不存在，可能是链接已失效或地址输入有误。
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={() => nav(-1)}>返回上一页</Button>
        <Button variant="primary" onClick={() => nav('/dashboard')}>回到工作台</Button>
      </div>
    </div>
  );
}
