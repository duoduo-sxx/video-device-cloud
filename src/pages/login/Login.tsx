import { useState } from 'react';
import { Button, Form, Input, Select } from 'antd';
import { LockOutlined, SafetyCertificateOutlined, SwapOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import type { Role } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../utils/feedback';

const ROLE_OPTIONS = [
  { value: 'admin', label: '平台管理员' },
  { value: 'ops', label: '运维工程师' },
  { value: 'member', label: '业务成员' },
];

const NAME_BY_ROLE: Record<Role, string> = {
  admin: '陈默',
  ops: '林清',
  member: '许知远',
};

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const onFinish = (values: { username: string; password: string; role: Role }) => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      if (values.password !== '123456') {
        setError('账号或密码不正确，请重试');
        setShake(true);
        setTimeout(() => setShake(false), 450);
        return;
      }
      login(NAME_BY_ROLE[values.role], values.role);
      toast.success(`欢迎回来，${NAME_BY_ROLE[values.role]}`);
      navigate('/dashboard', { replace: true });
    }, 800);
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }}
          viewBox="0 0 720 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <g fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1">
            <path d="M-40 220 C 160 160, 300 300, 460 240 S 700 120, 800 190" />
            <path d="M-40 300 C 180 250, 320 380, 500 320 S 720 210, 820 280" />
            <path d="M-40 640 C 140 560, 340 700, 520 620 S 720 520, 820 600" />
            <path d="M-40 720 C 180 650, 320 780, 520 700 S 740 610, 840 690" />
          </g>
          <g fill="#3D82FF">
            <circle cx="160" cy="188" r="3.2" opacity="0.9" />
            <circle cx="460" cy="240" r="2.4" opacity="0.7" />
            <circle cx="520" cy="620" r="3" opacity="0.85" />
            <circle cx="320" cy="762" r="2.2" opacity="0.6" />
          </g>
          <g fill="#00B894">
            <circle cx="300" cy="300" r="2.4" opacity="0.8" />
            <circle cx="700" cy="190" r="2.8" opacity="0.7" />
          </g>
        </svg>

        <div className="login-left-inner">
          <div className="login-brand">
            <span className="app-logo-mark" style={{ width: 34, height: 34 }}>
              D
            </span>
            云枢 DataRelay
          </div>
          <div style={{ marginTop: 88 }}>
            <h1 className="login-headline">
              让每一份数据，
              <br />
              都在最优路径上流动
            </h1>
            <div className="login-sub">
              连接本地机房、边缘节点与多云环境，用压缩、去重与并行分片把传输时间压到最低，
              让跨团队的数据协作有迹可循。
            </div>
            <div className="login-points">
              <div className="login-point">
                <span className="login-point-icon">
                  <ThunderboltOutlined />
                </span>
                <div>
                  <b>智能加速</b>
                  <span>zstd 压缩 + 块级去重，平均节省 38% 流量</span>
                </div>
              </div>
              <div className="login-point">
                <span className="login-point-icon">
                  <SwapOutlined />
                </span>
                <div>
                  <b>全链路可观测</b>
                  <span>从通道水位到分片校验，每一跳都有数据</span>
                </div>
              </div>
              <div className="login-point">
                <span className="login-point-icon">
                  <SafetyCertificateOutlined />
                </span>
                <div>
                  <b>端到端合规</b>
                  <span>传输加密、敏感识别与全量审计留痕</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="login-foot">星澜科技 · 数据平台部 · 内部演示环境</div>
      </div>

      <div className="login-right">
        <div className={`login-card ${shake ? 'shake' : ''}`}>
          <h2>登录控制台</h2>
          <div className="login-hint">使用企业账号访问数据协同传输平台</div>
          <Form layout="vertical" initialValues={{ username: 'admin', password: '123456', role: 'admin' }} onFinish={onFinish}>
            <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
              <Input size="large" prefix={<UserOutlined style={{ color: '#8A99B0' }} />} placeholder="请输入企业账号" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password size="large" prefix={<LockOutlined style={{ color: '#8A99B0' }} />} placeholder="请输入登录密码" />
            </Form.Item>
            <Form.Item name="role" label="登录角色">
              <Select size="large" options={ROLE_OPTIONS} />
            </Form.Item>
            {error ? (
              <div style={{ color: '#EF4444', fontSize: 12.5, marginTop: -8, marginBottom: 12 }}>{error}</div>
            ) : null}
            <Button type="primary" size="large" htmlType="submit" block loading={loading} style={{ marginTop: 4, height: 42 }}>
              登录
            </Button>
          </Form>
          <div className="login-notice">
            演示账号 admin / 123456
            <br />
            本环境所有数据均为模拟，不连接真实生产系统
          </div>
        </div>
      </div>
    </div>
  );
}
