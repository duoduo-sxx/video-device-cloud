import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#F5F7FB',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 76, fontWeight: 700, color: '#1668FF', letterSpacing: -3, lineHeight: 1 }}>404</div>
        <div style={{ fontSize: 17, fontWeight: 600, marginTop: 16 }}>页面走丢了</div>
        <div style={{ fontSize: 13, color: '#7B8AA3', marginTop: 8, lineHeight: 1.8 }}>
          你访问的地址不存在，可能是链接已失效或权限已变更。
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            返回工作台
          </Button>
          <Button onClick={() => navigate(-1)}>返回上一页</Button>
        </div>
      </div>
    </div>
  );
}
