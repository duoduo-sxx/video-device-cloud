import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      className="np-page"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '62vh', gap: 14 }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'var(--np-primary-50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Compass size={28} style={{ color: 'var(--np-primary-500)' }} />
      </div>
      <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em' }}>404</div>
      <div style={{ fontSize: 13.5, color: 'var(--np-text-secondary)' }}>这个页面不存在，或者已经被归档了</div>
      <div style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)', marginTop: -6 }}>
        检查一下地址栏，或者从下面的入口重新开始
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <Button icon={<ArrowLeft size={13} />} onClick={() => navigate(-1)}>
          返回上一页
        </Button>
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          回到工作台
        </Button>
      </div>
    </div>
  );
}
