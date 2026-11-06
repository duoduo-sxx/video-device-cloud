import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { useAppStore } from '../store/app';
import { ROLE_LABEL } from '../constants/dict';

const DEMO = [
  { account: 'admin', name: '系统管理员' },
  { account: 'zhangqm', name: '张启明 · 标定工程师' },
  { account: 'chenli', name: '陈立 · 数据分析师' },
  { account: 'lihui', name: '李慧 · 质量审核员' },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const submit = async (values: { account: string; password: string }) => {
    setLoading(true);
    try {
      const user = await authService.login(values.account, values.password);
      login(user);
      message.success(`欢迎回来，${user.name}（${ROLE_LABEL[user.role]}）`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div>
          <div className="en">InertialSense Platform</div>
          <h1>惯性参数感知系统</h1>
          <div style={{ fontSize: 13, color: '#8aa4c2', letterSpacing: 2 }}>应用软件系统及技术服务</div>
          <p className="desc">
            面向光纤陀螺、MEMS 惯测单元与组合导航系统的测试标定、参数辨识、误差补偿与健康管理平台。
            覆盖设备台账、实时采集、六位置标定、Allan 方差分析与报告归档的完整链路。
          </p>
        </div>
        <div className="login-stats">
          <div>
            <div className="v">48</div>
            <div className="l">在册设备</div>
          </div>
          <div>
            <div className="v">42</div>
            <div className="l">标定任务</div>
          </div>
          <div>
            <div className="v">93.5%</div>
            <div className="l">一次合格率</div>
          </div>
          <div>
            <div className="v">99.2%</div>
            <div className="l">数据完整率</div>
          </div>
        </div>
      </div>

      <div className="login-form-wrap">
        <div className="login-form">
          <h2>登录</h2>
          <div className="sub">请使用单位统一账号登录，演示环境密码均为 123456</div>
          <Form form={form} layout="vertical" onFinish={submit} initialValues={{ account: 'admin', password: '123456' }}>
            <Form.Item name="account" rules={[{ required: true, message: '请输入账号' }]}>
              <Input size="large" prefix={<UserOutlined />} placeholder="账号" autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password size="large" prefix={<LockOutlined />} placeholder="密码" autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              登录系统
            </Button>
          </Form>

          <div className="demo-accounts">
            <div className="title">演示账号（点击填充）</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DEMO.map((item) => (
                <Button
                  key={item.account}
                  size="small"
                  onClick={() => form.setFieldsValue({ account: item.account, password: '123456' })}
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
