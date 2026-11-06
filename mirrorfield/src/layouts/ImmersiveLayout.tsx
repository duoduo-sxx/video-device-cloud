import { Outlet, useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined } from '@ant-design/icons'

export default function ImmersiveLayout() {
  const nav = useNavigate()
  return (
    <div style={{ height: '100vh', background: '#05080F', position: 'relative', overflow: 'hidden' }}>
      <button
        onClick={() => nav(-1)}
        className="glass"
        style={{
          position: 'absolute', left: 16, top: 16, zIndex: 30, height: 32, padding: '0 12px',
          display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12,
        }}
      >
        <ArrowLeftOutlined /> 返回
      </button>
      <Outlet />
    </div>
  )
}
