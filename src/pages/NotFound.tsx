import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ height: '100%', minHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="180" height="120" viewBox="0 0 180 120">
          <rect x="24" y="20" width="132" height="80" rx="8" fill="#f4f8ff" stroke="#85b7eb" strokeWidth="1.4" />
          <path d="M44 46h92M44 62h60M44 78h44" stroke="#b5d4f4" strokeWidth="4" strokeLinecap="round" />
          <circle cx="136" cy="82" r="16" fill="#fff" stroke="#f5222d" strokeWidth="2" />
          <path d="M130 76l12 12M142 76l-12 12" stroke="#f5222d" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 40, fontWeight: 600, color: '#1668dc', marginTop: 10 }}>404</div>
        <div style={{ fontSize: 15, marginTop: 6 }}>页面不存在或已被移除</div>
        <div className="small muted" style={{ marginTop: 6 }}>请检查地址是否正确，或返回总览驾驶舱继续操作。</div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button onClick={() => navigate(-1)}>返回上一页</Button>
          <Button type="primary" onClick={() => navigate('/dashboard')}>返回首页</Button>
        </div>
      </div>
    </div>
  );
}
