import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Check, Lock, ShieldCheck, Smartphone, User } from 'lucide-react';
import { Button, Checkbox, Field, Input, RadioCard } from '@/components/ui/core';

export default function Register() {
  const nav = useNavigate();
  const [type, setType] = useState<'person' | 'org'>('org');
  const [form, setForm] = useState({ phone: '', code: '', password: '', password2: '', name: '', org: '', agree: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const e: Record<string, string> = {};
    if (!/^1[3-9]\d{9}$/.test(form.phone)) e.phone = '请输入有效的手机号';
    if (!/^\d{6}$/.test(form.code)) e.code = '请输入 6 位短信验证码';
    if (form.password.length < 8) e.password = '密码不少于 8 位，需包含字母与数字';
    if (form.password !== form.password2) e.password2 = '两次输入的密码不一致';
    if (!form.name.trim()) e.name = '请输入真实姓名';
    if (type === 'org' && !form.org.trim()) e.org = '请输入企业名称';
    if (!form.agree) e.agree = '请阅读并同意服务协议';
    setErrors(e);
    if (Object.keys(e).length) return;
    nav('/onboarding/verify');
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-[720px]">
        <button onClick={() => nav('/login')} className="mb-6 inline-flex items-center gap-1.5 text-[12px] text-[var(--text-3)] hover:text-[var(--text-1)]">
          <ArrowLeft size={13} /> 返回登录
        </button>

        <div className="card p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#3D7DFF] to-[#22D3EE]">
              <ShieldCheck size={17} className="text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-semibold">创建账号</h1>
              <p className="text-[12px] text-[var(--text-3)]">注册后可免费存证 20 条，无需绑定支付方式</p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <RadioCard
              checked={type === 'person'}
              onClick={() => setType('person')}
              title="个人创作者"
              desc="适用于个人作品存证与维权"
              icon={<User size={15} />}
            />
            <RadioCard
              checked={type === 'org'}
              onClick={() => setType('org')}
              title="企业 / 团队"
              desc="支持成员协作、批量存证与开票"
              icon={<Building2 size={15} />}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="手机号" required error={errors.phone}>
              <Input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="用于接收验证码与登录"
                prefix={<Smartphone size={13} />}
                invalid={!!errors.phone}
              />
            </Field>
            <Field label="短信验证码" required error={errors.code}>
              <div className="flex gap-2">
                <Input
                  value={form.code}
                  onChange={(e) => set('code', e.target.value)}
                  placeholder="6 位数字"
                  maxLength={6}
                  invalid={!!errors.code}
                  className="flex-1"
                />
                <Button
                  className="h-[34px] flex-none"
                  onClick={() => {
                    set('code', '860214');
                  }}
                >
                  获取验证码
                </Button>
              </div>
            </Field>
            <Field label="登录密码" required error={errors.password} hint="8 位以上，包含字母与数字">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="设置登录密码"
                prefix={<Lock size={13} />}
                invalid={!!errors.password}
              />
            </Field>
            <Field label="确认密码" required error={errors.password2}>
              <Input
                type="password"
                value={form.password2}
                onChange={(e) => set('password2', e.target.value)}
                placeholder="再次输入密码"
                prefix={<Lock size={13} />}
                invalid={!!errors.password2}
              />
            </Field>
            <Field label="真实姓名" required error={errors.name}>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="用于实名认证" invalid={!!errors.name} />
            </Field>
            {type === 'org' && (
              <Field label="企业名称" required error={errors.org}>
                <Input value={form.org} onChange={(e) => set('org', e.target.value)} placeholder="与营业执照一致" invalid={!!errors.org} />
              </Field>
            )}
          </div>

          <div className="mt-5">
            <Checkbox checked={form.agree} onChange={(v) => set('agree', v)} label={
              <span>
                我已阅读并同意 <span className="text-[var(--brand-2)]">《服务协议》</span> 与 <span className="text-[var(--brand-2)]">《隐私政策》</span>
              </span>
            } />
            {errors.agree && <div className="err">{errors.agree}</div>}
          </div>

          <Button variant="primary" className="mt-6 h-[38px] w-full" onClick={submit}>
            下一步：实名认证
          </Button>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11.5px] text-[var(--text-3)]">
            <Check size={11} className="text-[var(--ok)]" />
            已有账号？<Link to="/login" className="text-[var(--brand-2)] hover:underline">直接登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
