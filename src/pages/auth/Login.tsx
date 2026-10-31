import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Cpu, Database, Hexagon, Layers, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { DEMO_IDENTITIES, USERS } from '@/mocks/tenants';
import { ROLE_MAP } from '@/mocks/roles';
import { SCOPE_META, type Scope } from '@/components/layout/nav';
import Button from '@/components/ui/Button';
import type { RoleCode } from '@/types';

function scopeOfRole(role: RoleCode): Scope {
  if (role === 'finance') return 'finance';
  if (role === 'ops' || role === 'ops_compute' || role === 'super_admin') return 'admin';
  return 'console';
}

export default function Login() {
  const navigate = useNavigate();
  const loginAs = useAuthStore((s) => s.loginAs);
  const [account, setAccount] = useState('chenli@hengrui-auto.com');
  const [pwd, setPwd] = useState('demo1234');
  const [loading, setLoading] = useState(false);

  function enter(userId: string) {
    loginAs(userId);
    const u = USERS.find((x) => x.id === userId);
    if (u) navigate(SCOPE_META[scopeOfRole(u.role)].home);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const matched = DEMO_IDENTITIES.find((d) => d.account === account);
    setTimeout(() => {
      setLoading(false);
      enter(matched?.userId ?? 'USR-0001');
    }, 500);
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* 品牌区 */}
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden bg-[#0B1220] p-12 lg:flex">
        {/* 背景网格 */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#3B82F6" strokeWidth="0.6" />
            </pattern>
            <radialGradient id="glow" cx="30%" cy="25%" r="60%">
              <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#0B1220" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glow2" cx="78%" cy="78%" r="50%">
              <stop offset="0%" stopColor="#0891B2" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0B1220" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#glow)" />
          <rect width="100%" height="100%" fill="url(#glow2)" />
        </svg>
        {/* 抽象数据节点 */}
        <svg className="absolute inset-0 h-full w-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#60A5FA" strokeWidth="0.8" fill="none" opacity="0.5">
            <path d="M120 620 L300 520 L480 560 L660 420 L820 470" />
            <path d="M120 620 L300 700 L520 660 L700 740" />
            <path d="M300 520 L520 660" />
            <path d="M480 560 L700 740" />
          </g>
          {[
            [120, 620],
            [300, 520],
            [480, 560],
            [660, 420],
            [820, 470],
            [300, 700],
            [520, 660],
            [700, 740],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.2" fill="#93C5FD" opacity="0.85" />
          ))}
        </svg>

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Hexagon size={19} className="text-white" strokeWidth={2.4} />
            </span>
            <div>
              <div className="text-sm font-semibold text-white">云枢智能科技</div>
              <div className="text-2xs text-[#64748B]">YUNSHU INTELLIGENCE</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <h1 className="max-w-lg text-3xl font-semibold leading-snug text-white">
            让算力、算法与数据
            <br />
            真正长成一条价值链
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#94A3B8]">
            以 GPU 资源池与自研模型为底座，提供数据处理、智能信息匹配与内容生成三类技术服务。
            按调用量计费，按月对账，开 6% 增值税专用发票。
          </p>

          <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
            {[
              { icon: Cpu, label: '算力资源', desc: '1,456 卡在线' },
              { icon: Layers, label: '算法模型', desc: '18 个模型服务' },
              { icon: Database, label: '数据服务', desc: '月处理 9.6 亿条' },
            ].map((f) => (
              <div key={f.label} className="rounded-lg border border-[#1E293B] bg-[#0F172A]/80 px-3 py-2.5">
                <f.icon size={15} className="text-[#60A5FA]" />
                <div className="mt-2 text-xs font-medium text-white">{f.label}</div>
                <div className="mt-0.5 text-2xs text-[#64748B]">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-2xs text-[#475569]">
          <ShieldCheck size={13} />
          等保三级 · ISO 27001 · 数据不出境
        </div>
      </div>

      {/* 表单区 */}
      <div className="flex flex-1 items-center justify-center px-8">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Hexagon size={19} className="text-white" strokeWidth={2.4} />
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-ink-1">登录控制台</h2>
          <p className="mt-1.5 text-sm text-ink-2">使用企业账号或下方演示身份进入系统</p>

          <form className="mt-7 space-y-4" onSubmit={submit}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-2">企业账号</span>
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="h-10 w-full rounded-ctl border border-line px-3 text-sm text-ink-1 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-2">密码</span>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="h-10 w-full rounded-ctl border border-line px-3 text-sm text-ink-1 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
              />
            </label>
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-2">
                <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-primary" />
                记住此设备
              </label>
              <span className="link text-xs">忘记密码？</span>
            </div>
            <Button type="submit" variant="primary" block loading={loading}>
              登录
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-2xs text-ink-3">一键体验</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_IDENTITIES.map((d) => {
              const u = USERS.find((x) => x.id === d.userId);
              if (!u) return null;
              const role = ROLE_MAP[u.role];
              return (
                <button
                  key={d.userId}
                  onClick={() => enter(u.id)}
                  className="group flex items-center gap-2 rounded-ctl border border-line px-2.5 py-2 text-left transition-colors hover:border-primary-ring hover:bg-primary-soft"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F2F4F7] text-2xs font-semibold text-ink-2 group-hover:bg-primary group-hover:text-white">
                    {u.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-2xs font-medium text-ink-1">{role.name}</span>
                    <span className="block truncate text-2xs text-ink-3">{u.name}</span>
                  </span>
                  <ArrowRight size={12} className="text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              );
            })}
          </div>

          <p className="mt-6 flex items-start gap-1.5 text-2xs leading-relaxed text-ink-3">
            <Check size={12} className="mt-0.5 shrink-0 text-success" />
            演示环境数据全部为模拟数据，所有操作仅在本机生效，不会产生真实调用与开票。
          </p>
        </div>
      </div>
    </div>
  );
}
