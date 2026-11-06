import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Film,
  Sparkles,
  Waves,
  Search,
  ShieldCheck,
  Scissors,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../stores'
import { ROLE_LABEL } from '../constants'
import { Button, Field, Input } from '../components/ui'
import type { RoleKey } from '../types'

const FEATURES = [
  { icon: Waves, title: '多模态解析', desc: '语音、画面、文字三通道同步理解' },
  { icon: Search, title: '语义检索', desc: '用一句话定位到具体的那一帧' },
  { icon: ShieldCheck, title: '内容审核', desc: '七类风险片段级定位与人工复核' },
  { icon: Scissors, title: '智能剪辑', desc: '自动挑高光，一键生成成片' },
]

export default function Login() {
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const [account, setAccount] = useState('chenyanzhou')
  const [pwd, setPwd] = useState('demo1234')
  const [loading, setLoading] = useState(false)

  const doLogin = (role: RoleKey) => {
    setLoading(true)
    setTimeout(() => {
      login(role)
      navigate('/dashboard')
    }, 520)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <div className="relative hidden w-[55%] overflow-hidden bg-[#0B1220] lg:block">
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at 40% 40%, black, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle at 40% 40%, black, transparent 72%)',
          }}
        />
        <div
          className="absolute -left-24 top-1/4 h-[420px] w-[420px] rounded-full opacity-30 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-20 right-0 h-[380px] w-[380px] rounded-full opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)' }}
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
              <Film size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Video Insight</div>
              <div className="text-[10px] tracking-wide text-white/40">CONTENT UNDERSTANDING PLATFORM</div>
            </div>
          </div>

          <div className="max-w-lg">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/70">
              <Sparkles size={11} className="text-[#7C3AED]" />
              多模态大模型驱动
            </div>
            <h1 className="text-[34px] font-medium leading-[1.25] tracking-tight text-white">
              视频智能化
              <br />
              内容理解与分析系统
            </h1>
            <p className="mt-4 max-w-md text-[13px] leading-6 text-white/55">
              把非结构化的视频，变成有目录、有标签、有摘要、能被搜索、能被复用的内容资产。
            </p>

            <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5">
              {FEATURES.map((f) => {
                const Icon = f.icon
                return (
                  <div key={f.title} className="flex gap-2.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5">
                      <Icon size={13} className="text-white/70" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white/85">{f.title}</div>
                      <div className="mt-0.5 text-[11px] leading-4 text-white/40">{f.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-white/30">
            <span>已处理视频 12,847 部</span>
            <span className="h-3 w-px bg-white/15" />
            <span>累计解析时长 4,268 小时</span>
            <span className="h-3 w-px bg-white/15" />
            <span>平均识别准确率 93.6%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[360px]">
          <div className="mb-7 lg:hidden">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
              <Film size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-medium text-t1">视频智能化内容理解与分析系统</h1>
          </div>

          <h2 className="text-xl font-medium tracking-tight text-t1">登录工作台</h2>
          <p className="mt-1 text-xs text-t3">使用演示账号直接进入，或选择下方身份体验不同权限</p>

          <form
            className="mt-6 space-y-3.5"
            onSubmit={(e) => {
              e.preventDefault()
              doLogin('admin')
            }}
          >
            <Field label="账号">
              <Input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="请输入账号"
                className="[&>input]:h-9"
              />
            </Field>
            <Field label="密码">
              <Input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="请输入密码"
                className="[&>input]:h-9"
              />
            </Field>
            <div className="flex items-center justify-between text-[11px]">
              <label className="flex items-center gap-1.5 text-t2">
                <input type="checkbox" defaultChecked className="accent-[var(--brand)]" />
                记住登录状态
              </label>
              <button type="button" className="text-brand hover:underline">
                忘记密码？
              </button>
            </div>
            <Button
              type="submit"
              variant="primary"
              className="h-9 w-full"
              loading={loading}
              icon={loading ? undefined : <ArrowRight size={14} />}
            >
              登录
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[10px] text-t3">演示身份一键进入</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ROLE_LABEL) as RoleKey[]).map((r) => (
              <button
                key={r}
                onClick={() => doLogin(r)}
                disabled={loading}
                className="group flex items-center justify-between rounded-ctl border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-brand hover:bg-brand-soft disabled:opacity-50"
              >
                <span className="text-xs text-t1 group-hover:text-brand">{ROLE_LABEL[r]}</span>
                {loading ? (
                  <Loader2 size={11} className="animate-spin text-t3" />
                ) : (
                  <ArrowRight size={11} className="text-t3 group-hover:text-brand" />
                )}
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-[10px] leading-4 text-t3">
            本系统为演示环境，全部数据为模拟数据，不涉及真实业务信息
          </p>
        </div>
      </div>
    </div>
  )
}
