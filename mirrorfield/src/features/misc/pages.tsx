import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'

function Shell({ code, title, desc, children }: { code: string; title: string; desc: string; children?: React.ReactNode }) {
  const nav = useNavigate()
  return (
    <div style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="220" height="160" viewBox="0 0 220 160">
        <defs>
          <linearGradient id="ng" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <g stroke="url(#ng)" fill="none" strokeWidth="1.2">
          <path d="M60 110 L110 82 L160 110 L110 138 Z" />
          <path d="M60 110 L60 66 L110 38 L160 66 L160 110" />
          <path d="M110 138 L110 96" />
          <path d="M110 82 L110 38" opacity="0.5" />
          <path d="M60 66 L110 96 L160 66" opacity="0.35" />
        </g>
        <circle cx="110" cy="82" r="3" fill="#22D3EE" />
      </svg>
      <div className="num" style={{ fontSize: 44, fontWeight: 600, color: 'var(--brand)', letterSpacing: '0.04em', marginTop: 12 }}>{code}</div>
      <div style={{ fontSize: 16, fontWeight: 500, marginTop: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, maxWidth: 420, textAlign: 'center', lineHeight: 1.8 }}>{desc}</div>
      <div className="flex gap-2" style={{ marginTop: 20 }}>
        {children}
        <Button onClick={() => nav(-1)}>返回上一页</Button>
      </div>
    </div>
  )
}

export function NotFound() {
  const nav = useNavigate()
  return (
    <Shell code="404" title="页面不存在" desc="链接可能已失效，或该页面已迁移。请从工作台重新进入。">
      <Button type="primary" onClick={() => nav('/')}>返回工作台</Button>
    </Shell>
  )
}

export function Forbidden() {
  const nav = useNavigate()
  return (
    <Shell code="403" title="没有访问权限" desc="当前角色无权访问该模块。可在顶栏切换角色，或联系平台管理员调整权限配置。">
      <Button type="primary" onClick={() => nav('/')}>返回工作台</Button>
    </Shell>
  )
}

export default { NotFound, Forbidden }
