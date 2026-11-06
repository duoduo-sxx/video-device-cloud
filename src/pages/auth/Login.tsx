import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import { Button, Checkbox, Input } from '@/components/ui/core';
import { useAuth } from '@/store/auth';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXY3456789';

export default function Login() {
  const nav = useNavigate();
  const login = useAuth((s) => s.login);
  const [account, setAccount] = useState('13800138000');
  const [password, setPassword] = useState('demo1234');
  const [captcha, setCaptcha] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ account?: string; password?: string; captcha?: string }>({});
  const [seed, setSeed] = useState(0);

  const code = useMemo(() => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += CAPTCHA_CHARS[(i * 7 + seed * 13 + 5) % CAPTCHA_CHARS.length];
    }
    return s;
  }, [seed]);

  const submit = () => {
    const e: typeof errors = {};
    if (!account.trim()) e.account = '请输入手机号或邮箱';
    if (!password) e.password = '请输入登录密码';
    else if (password.length < 6) e.password = '密码长度不少于 6 位';
    if (!captcha) e.captcha = '请输入验证码';
    else if (captcha.toUpperCase() !== code) e.captcha = '验证码不正确，请重新输入';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setTimeout(() => {
      login();
      nav('/dashboard');
    }, 800);
  };

  return (
    <div className="flex min-h-screen">
      {/* 左侧品牌区 */}
      <div className="relative flex w-[55%] flex-col justify-between overflow-hidden border-r border-[var(--stroke)] px-14 py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(700px 420px at 30% 20%, rgba(61,125,255,.22), transparent 60%), radial-gradient(600px 380px at 75% 75%, rgba(34,211,238,.14), transparent 60%)',
          }}
        />
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.5]" viewBox="0 0 760 900" preserveAspectRatio="none">
          <defs>
            <linearGradient id="line" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3D7DFF" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {[
            [120, 180, 320, 300],
            [320, 300, 240, 470],
            [320, 300, 520, 380],
            [240, 470, 460, 560],
            [520, 380, 460, 560],
            [460, 560, 620, 660],
          ].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#line)" strokeWidth="1" strokeDasharray="5 5" style={{ animation: `dashFlow ${5 + i}s linear infinite` }} />
          ))}
          {[
            [120, 180, 5],
            [320, 300, 7],
            [240, 470, 5],
            [520, 380, 6],
            [460, 560, 8],
            [620, 660, 5],
          ].map(([cx, cy, r], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill="#22D3EE" opacity="0.85" />
              <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="#22D3EE" strokeOpacity="0.22" />
            </g>
          ))}
        </svg>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#3D7DFF] to-[#22D3EE] shadow-[0_0_28px_rgba(61,125,255,.55)]">
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.6" />
                <rect x="14" y="3" width="7" height="7" rx="1.6" />
                <rect x="3" y="14" width="7" height="7" rx="1.6" />
                <rect x="14" y="14" width="7" height="7" rx="1.6" />
                <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" />
              </svg>
            </div>
            <div>
              <div className="text-[15px] font-semibold tracking-[0.3px]">星火链证</div>
              <div className="font-mono text-[9.5px] tracking-[2.2px] text-[var(--text-3)]">XH-CHAIN ATTESTATION</div>
            </div>
          </div>

          <h1 className="mt-16 max-w-[560px] text-[38px] font-semibold leading-[1.32] tracking-[-0.5px]">
            创作即确权，
            <br />
            <span className="bg-gradient-to-r from-[#3D7DFF] via-[#38BDF8] to-[#22D3EE] bg-clip-text text-transparent">
              证据可自证
            </span>
            。
          </h1>

          <div className="mt-10 space-y-4">
            {[
              ['秒级上链存证', '文件哈希与时间戳同步写入联盟链，全程可追溯'],
              ['权属全链留痕', '登记、共有、转让、许可四类事件形成不可篡改的证据链'],
              ['司法链直连', '对接公证处与司法鉴定机构，一键申请出证'],
            ].map(([t, d]) => (
              <div key={t} className="flex items-start gap-3">
                <span className="mt-[3px] flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[rgba(34,211,238,.14)] text-[9px] text-[var(--brand-2)]">
                  <Check size={10} strokeWidth={3} />
                </span>
                <div>
                  <div className="text-[13px] text-[var(--text-1)]">{t}</div>
                  <div className="mt-0.5 text-[11.5px] text-[var(--text-3)]">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[11px] text-[var(--text-3)]">
          星火联盟链 XH-Chain · 7 节点 · PBFT 共识 · 浙ICP备2026008821号-3
        </div>
      </div>

      {/* 右侧表单 */}
      <div className="relative flex w-[45%] items-center justify-center px-10">
        <div className="w-[400px]">
          <h2 className="text-[22px] font-semibold tracking-[-0.2px]">欢迎回来</h2>
          <p className="mt-1.5 text-[12.5px] text-[var(--text-3)]">登录后管理你的存证、权属与取证任务</p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="label">账号</label>
              <Input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                invalid={!!errors.account}
                prefix={<Smartphone size={13} />}
                placeholder="手机号 / 邮箱"
              />
              {errors.account && <div className="err">{errors.account}</div>}
            </div>

            <div>
              <label className="label">密码</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                invalid={!!errors.password}
                prefix={<Lock size={13} />}
                placeholder="请输入登录密码"
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              {errors.password && <div className="err">{errors.password}</div>}
            </div>

            <div>
              <label className="label">图形验证码</label>
              <div className="flex gap-2.5">
                <Input
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  invalid={!!errors.captcha}
                  placeholder="请输入右侧字符"
                  maxLength={4}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <button
                  type="button"
                  onClick={() => setSeed((s) => s + 1)}
                  className="group flex h-[34px] w-[104px] flex-none items-center justify-center gap-1 rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] font-mono text-[15px] tracking-[3px] text-[var(--brand-2)]"
                  title="点击刷新"
                >
                  {code.split('').map((c, i) => (
                    <span key={i} style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (4 + i * 2)}deg)` }}>
                      {c}
                    </span>
                  ))}
                  <RefreshCw size={11} className="ml-0.5 text-[var(--text-3)] opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </div>
              {errors.captcha && <div className="err">{errors.captcha}</div>}
            </div>

            <div className="flex items-center justify-between">
              <Checkbox checked={remember} onChange={setRemember} label="记住登录状态" />
              <button className="text-[12px] text-[var(--brand-2)] hover:underline">忘记密码？</button>
            </div>

            <Button variant="primary" className="h-[38px] w-full" onClick={submit} loading={loading}>
              登录
              {!loading && <ArrowRight size={14} />}
            </Button>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-[var(--stroke)]" />
              <span className="text-[11px] text-[var(--text-3)]">或</span>
              <div className="h-px flex-1 bg-[var(--stroke)]" />
            </div>

            <Button className="h-[38px] w-full" onClick={() => nav('/register')}>
              注册新账号
            </Button>
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-lg border border-[rgba(61,125,255,.22)] bg-[rgba(61,125,255,.07)] px-3 py-2.5">
            <ShieldCheck size={13} className="mt-0.5 flex-none text-[var(--brand-2)]" />
            <p className="text-[11.5px] leading-relaxed text-[var(--text-2)]">
              演示环境：账号 <span className="font-mono text-[var(--text-1)]">13800138000</span>，密码{' '}
              <span className="font-mono text-[var(--text-1)]">demo1234</span>，验证码已按当前字符填写即可。
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] text-[var(--text-3)]">
            登录即代表同意
            <a className="mx-1 text-[var(--text-2)] hover:underline" href="#/support">《服务协议》</a>
            与
            <a className="mx-1 text-[var(--text-2)] hover:underline" href="#/support">《隐私政策》</a>
          </p>
          <p className="mt-2 text-center text-[11px] text-[var(--text-3)]">
            还没有企业账号？<Link to="/register" className="text-[var(--brand-2)] hover:underline">申请企业接入</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
