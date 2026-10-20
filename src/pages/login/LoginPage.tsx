import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, message } from 'antd';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { demoAccounts, useAuthStore } from '@/stores/authStore';
import { ROLES } from '@/types/enums';
import type { RoleId } from '@/types/enums';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [role, setRole] = useState<RoleId>('pm');
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState('nexusplay2026');
  const [loading, setLoading] = useState(false);

  const onRoleChange = (r: RoleId) => {
    setRole(r);
    const acc = demoAccounts.find((a) => a.role === r);
    if (acc) setEmail(acc.email);
  };

  const submit = () => {
    if (password.length < 6) {
      message.error('密码长度至少 6 位');
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      login(role);
      setLoading(false);
      message.success(`已以「${ROLES[role].label}」身份登录`);
      navigate('/dashboard');
    }, 420);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 品牌区 */}
      <div
        style={{
          width: '46%',
          minWidth: 460,
          position: 'relative',
          background: 'linear-gradient(148deg, #171B33 0%, #232A52 52%, #33265E 100%)',
          padding: '44px 52px',
          display: 'flex',
          flexDirection: 'column',
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 30% 40%, #000 20%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, #000 20%, transparent 78%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 380,
            height: 380,
            borderRadius: '50%',
            right: -120,
            bottom: -100,
            background: 'radial-gradient(circle, rgba(75,91,245,.42) 0%, transparent 68%)',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: '#4B5BF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M6 12.2 12.6 7l6.4 4.6v6.1L12.6 22 6 17.6z" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
              <circle cx="23" cy="20.5" r="3.2" fill="#9FE1CB" />
            </svg>
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>NexusPlay</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>研发交付平台</div>
          </div>
        </div>

        <div style={{ position: 'relative', marginTop: 'auto', marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              padding: '3px 9px',
              borderRadius: 20,
              background: 'rgba(255,255,255,.08)',
              color: 'rgba(255,255,255,.72)',
              marginBottom: 20,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#9FE1CB' }} />
            版本 v2.4 · 生产环境
          </div>
          <h1 style={{ fontSize: 34, lineHeight: 1.32, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            跨平台网页游戏
            <br />
            综合开发管理系统
          </h1>
          <p style={{ marginTop: 16, fontSize: 13.5, lineHeight: 1.85, color: 'rgba(255,255,255,.6)', maxWidth: 380 }}>
            从合同立项、需求拆解、构建出包，到十渠道发布、线上监控与客户工单——
            把一条完整的游戏交付链路收进同一个工作台。
          </p>
        </div>

        <div style={{ position: 'relative', display: 'flex', gap: 36, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.1)' }}>
          {[
            { v: '14', l: '在研与运维项目' },
            { v: '10', l: '覆盖发行渠道' },
            { v: '96.2%', l: 'SLA 达标率' },
          ].map((s) => (
            <div key={s.l}>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 表单区 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--np-bg-body)',
          padding: 32,
        }}
      >
        <div style={{ width: 368 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--np-text-primary)', margin: 0 }}>登录控制台</h2>
          <p style={{ fontSize: 13, color: 'var(--np-text-tertiary)', marginTop: 8, marginBottom: 28 }}>
            使用工作室邮箱登录，或选择演示身份快速体验。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--np-text-secondary)', display: 'block', marginBottom: 6 }}>
                演示身份
              </label>
              <Select
                value={role}
                onChange={onRoleChange}
                style={{ width: '100%' }}
                options={demoAccounts.map((a) => ({
                  value: a.role,
                  label: `${ROLES[a.role].label} · ${a.name}`,
                }))}
              />
              <div style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)', marginTop: 6 }}>
                {ROLES[role].desc}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--np-text-secondary)', display: 'block', marginBottom: 6 }}>
                邮箱
              </label>
              <Input
                size="large"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefix={<Mail size={14} style={{ color: 'var(--np-text-tertiary)' }} />}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--np-text-secondary)', display: 'block', marginBottom: 6 }}>
                密码
              </label>
              <Input.Password
                size="large"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onPressEnter={submit}
                prefix={<LockKeyhole size={14} style={{ color: 'var(--np-text-tertiary)' }} />}
              />
            </div>

            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={submit}
              style={{ height: 42, marginTop: 4 }}
              block
            >
              进入控制台
              <ArrowRight size={15} style={{ marginLeft: 6 }} />
            </Button>

            <div
              style={{
                fontSize: 11.5,
                color: 'var(--np-text-tertiary)',
                textAlign: 'center',
                lineHeight: 1.8,
                marginTop: 4,
              }}
            >
              本系统为演示环境，数据全部为本地 Mock
              <br />
              任意 6 位以上密码均可登录
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
