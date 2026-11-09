import React, { useState } from 'react';
import { Form, Input, Button, Card, Select, message, Space } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as api from '@/api';
import { useAppStore } from '@/store/app';
import { ROLE_LABELS } from '@/constants';
import type { RoleKey } from '@/types';

function genCaptcha(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const [captcha, setCaptcha] = useState(genCaptcha());
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { account: string; password: string; captcha: string; role: RoleKey }) => {
    if (values.captcha.toUpperCase() !== captcha) {
      message.error('验证码不正确');
      setCaptcha(genCaptcha());
      return;
    }
    setLoading(true);
    const res = await api.login(values.account, values.password, values.role);
    setLoading(false);
    if (res.code === 0) {
      login(res.data);
      message.success(`欢迎回来，${res.data.name}（${ROLE_LABELS[res.data.role]}）`);
      navigate('/');
    }
  };

  return (
    <div
      style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563EB 50%, #38bdf8 100%)',
      }}
    >
      <Card style={{ width: 420, borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2563EB' }}>IIUP 智能交互与理解平台</div>
          <div style={{ color: '#999', marginTop: 4, fontSize: 12 }}>Intelligent Interaction & Understanding Platform</div>
        </div>
        <Form onFinish={onFinish} initialValues={{ role: 'admin', account: 'admin', password: '123456' }} size="large">
          <Form.Item name="account" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="账号（任意非空即可）" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码（任意非空即可）" />
          </Form.Item>
          <Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }]}>
            <Space.Compact style={{ width: '100%' }}>
              <Input prefix={<SafetyOutlined />} placeholder="验证码" />
              <Button
                style={{ width: 110, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 4, fontSize: 16 }}
                onClick={() => setCaptcha(genCaptcha())}
              >
                {captcha}
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="role" label="登录角色（演示用）" rules={[{ required: true }]}>
            <Select
              options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>登 录</Button>
          </Form.Item>
          <div style={{ color: '#bbb', fontSize: 12, textAlign: 'center' }}>演示环境：数据全部为本地 Mock，可随意体验</div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
