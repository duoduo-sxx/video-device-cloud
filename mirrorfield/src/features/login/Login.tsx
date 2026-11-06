import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Form, Input, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '@/stores'

export default function Login() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const submit = () => {
    setLoading(true)
    setTimeout(() => {
      login('张伟', 'R1')
      setLoading(false)
      message.success('登录成功，正在进入工作台')
      nav('/')
    }, 600)
  }

  return (
    <div className="flex h-screen" style={{ background: '#070B14' }}>
      <div className="flex-1 relative overflow-hidden" style={{ borderRight: '1px solid rgba(148,163,184,0.12)' }}>
        <div className="absolute inset-0 grid-bg opacity-60" />
        <svg viewBox="0 0 800 800" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <g stroke="url(#lg)" fill="none" strokeWidth="1.2" opacity="0.85">
            <path d="M180 470 L400 350 L620 470 L400 590 Z" />
            <path d="M180 470 L180 300 L400 180 L620 300 L620 470" />
            <path d="M400 590 L400 420" />
            <path d="M400 350 L400 180" />
            <path d="M180 300 L400 420 L620 300" opacity=".45" />
            <path d="M250 505 L250 375 L330 330" opacity=".5" />
            <path d="M550 505 L550 375 L470 330" opacity=".5" />
          </g>
          <g fill="#22D3EE">
            {[[180, 470], [400, 350], [620, 470], [400, 590], [180, 300], [400, 180], [620, 300], [400, 420]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i === 1 ? 4 : 2.4} opacity={0.9}>
                <animate attributeName="opacity" values="0.35;1;0.35" dur={`${2.4 + i * 0.2}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
          <g stroke="#22D3EE" strokeWidth="1" opacity="0.18">
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={i} x1={0} y1={620 + i * 11} x2={800} y2={620 + i * 11} />
            ))}
          </g>
        </svg>
        <div style={{ position: 'absolute', left: 56, top: 56 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.24em', color: '#22D3EE', marginBottom: 18 }}>MIRRORFIELD PLATFORM</div>
          <h1 style={{ fontSize: 34, fontWeight: 600, color: '#E6EDF7', lineHeight: 1.3, margin: 0 }}>
            三维复刻与 MR<br />虚实交互系统
          </h1>
          <p style={{ color: '#93A4BE', fontSize: 13, lineHeight: 1.9, marginTop: 18, maxWidth: 420 }}>
            实景采集 · 三维复刻 · 模型治理 · 场景发布 · MR 虚实叠加 · 运维闭环
            <br />
            同时承载三维复刻技术服务的订单、交付与验收管理。
          </p>
        </div>
        <div style={{ position: 'absolute', left: 56, bottom: 48, display: 'flex', gap: 32 }}>
          {[
            ['2.6 km²', '园区复刻面积'],
            ['62.4 亿', '点云总量'],
            ['±3 cm', '平面中误差'],
            ['18 台', 'MR 终端接入'],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="num" style={{ fontSize: 18, fontWeight: 600, color: '#22D3EE' }}>{v}</div>
              <div style={{ fontSize: 11, color: '#5D6E8A', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: 460, background: '#0E1526', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 320 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#E6EDF7' }}>登录工作台</div>
          <div style={{ fontSize: 12, color: '#5D6E8A', marginTop: 8, marginBottom: 28 }}>
            演示账号已预填，直接点击登录即可进入
          </div>
          <Form layout="vertical" initialValues={{ account: 'admin', password: '123456' }} onFinish={submit}>
            <Form.Item name="account" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
              <Input size="large" prefix={<UserOutlined />} placeholder="admin" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password size="large" prefix={<LockOutlined />} placeholder="123456" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ marginTop: 8 }}>
              登 录
            </Button>
          </Form>
          <div className="flex items-center justify-between" style={{ marginTop: 18, fontSize: 11.5, color: '#5D6E8A' }}>
            <span>当前为演示环境，数据全部为模拟</span>
            <a onClick={() => nav('/')} style={{ color: '#22D3EE', cursor: 'pointer' }}>访客进入</a>
          </div>
        </div>
      </div>
    </div>
  )
}
