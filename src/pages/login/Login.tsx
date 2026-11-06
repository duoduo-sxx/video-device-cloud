import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Fingerprint, Hexagon, Layers, Mic, ShieldCheck, Sparkles } from 'lucide-react'
import { Button, Input } from '@/components/ui/primitives'
import { useAppStore } from '@/stores/appStore'
import { useUIStore } from '@/stores/uiStore'
import { DEMO_ACCOUNTS } from '@/mock/db'
import { ROLE_DESC, ROLE_LABEL } from '@/constants/enums'
import { cn } from '@/utils/misc'
import type { Role } from '@/types'

const CAPS = [
  { icon: Mic, title: '多模态交互', desc: '语音、文字、快捷指令统一入口' },
  { icon: Layers, title: '统一控制', desc: '52 台在管设备、8 个预设场景' },
  { icon: ShieldCheck, title: '全链路服务', desc: '告警处置到工单闭环追踪' },
]

export default function Login() {
  const navigate = useNavigate()
  const useAccount = useAppStore((s) => s.useAccount)
  const toast = useUIStore((s) => s.toast)
  const [account, setAccount] = useState('operator')
  const [password, setPassword] = useState('123456')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const submit = (acc: string, pwd: string) => {
    setError('')
    if (acc.trim().length < 4) return setError('账号至少 4 个字符')
    if (pwd.length < 6) return setError('密码至少 6 位')
    setLoading(acc)
    window.setTimeout(() => {
      const ok = useAccount(acc)
      setLoading(null)
      if (!ok) {
        setError('账号或密码不正确，请使用下方演示账号')
        return
      }
      toast('success', '登录成功', '正在进入智能控制中枢')
      navigate('/', { replace: true })
    }, 780)
  }

  return (
    <div className="h-full flex bg-canvas overflow-hidden">
      <div className="relative hidden lg:flex flex-col justify-between w-[54%] p-14 overflow-hidden border-r border-subtle">
        <div className="absolute inset-0 app-grid-bg opacity-70" />
        <div className="absolute inset-0 overflow-hidden ambient" />
        <div
          className="absolute -right-24 top-1/3 w-[420px] h-[420px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, var(--brand), transparent 65%)' }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand/25 to-accent/20 border border-brand/30 flex items-center justify-center">
            <Hexagon size={18} className="text-brand" />
          </div>
          <div>
            <div className="text-sm text-ink font-medium">ICE Platform</div>
            <div className="text-2xs text-ink-mute">沉浸式智能控制中枢</div>
          </div>
        </div>

        <div className="relative max-w-[520px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full border border-brand/30 bg-brand/[0.08] text-2xs text-brand mb-5">
              <Sparkles size={11} />
              v2.4.1 · 意图引擎已升级
            </div>
            <h1 className="text-[38px] leading-[1.25] font-medium text-ink tracking-tight">
              沉浸式智能控制
              <br />
              人机交互系统
            </h1>
            <p className="text-sm text-ink-soft mt-4 leading-relaxed">
              用一句话下达意图，系统完成解析、确认与执行。
              <br />
              覆盖设备控制、场景编排、异常处置与技术服务全链路。
            </p>
          </motion.div>

          <div className="mt-10 space-y-3">
            {CAPS.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                className="flex items-center gap-3"
              >
                <span className="w-8 h-8 rounded-md bg-panel border border-strong flex items-center justify-center text-brand shrink-0">
                  <c.icon size={14} />
                </span>
                <div>
                  <div className="text-xs text-ink">{c.title}</div>
                  <div className="text-2xs text-ink-mute">{c.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between text-2xs text-ink-mute">
          <span>Build 20261019 · 演示环境</span>
          <span>© 2026 ICE Center</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[380px]"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Hexagon size={18} className="text-brand" />
            <span className="text-sm text-ink">ICE Platform</span>
          </div>

          <h2 className="text-2xl font-medium text-ink">登录控制台</h2>
          <p className="text-xs text-ink-soft mt-1.5">使用值班账号，或选择下方演示角色直接进入</p>

          <form
            className="mt-7 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              submit(account, password)
            }}
          >
            <div>
              <span className="block text-xs text-ink-soft mb-1.5">账号</span>
              <Input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="请输入账号"
                autoComplete="username"
                className={cn(error && 'border-bad')}
              />
            </div>
            <div>
              <span className="block text-xs text-ink-soft mb-1.5">密码</span>
              <div className="relative">
                <Input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  className={cn(error && 'border-bad', 'pr-9')}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? '隐藏密码' : '显示密码'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink transition-colors"
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-ink-soft cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-[var(--brand)]" />
                记住我
              </label>
              <span className="text-xs text-ink-mute">忘记密码请联系管理员</span>
            </div>

            {error && <div className="text-xs text-bad">{error}</div>}

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading === account}>
              登录
              <ArrowRight size={15} />
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-2xs text-ink-mute">演示角色 · 一键进入</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((u) => (
              <button
                key={u.account}
                onClick={() => submit(u.account, '123456')}
                disabled={!!loading}
                className={cn(
                  'group text-left p-2.5 rounded-card border border-strong bg-panel hover:border-brand/45 hover:bg-panel2 transition-all',
                  loading === u.account && 'border-brand/60',
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center text-[9px]"
                    style={{ background: `${u.avatarColor}22`, color: u.avatarColor }}
                  >
                    {u.name.slice(-1)}
                  </span>
                  <span className="text-xs text-ink">{ROLE_LABEL[u.role as Role]}</span>
                </div>
                <div className="text-[10px] text-ink-mute leading-relaxed line-clamp-2">{ROLE_DESC[u.role as Role]}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-1.5 text-2xs text-ink-mute">
            <Fingerprint size={11} />
            演示环境：所有数据均为本地模拟，不涉及真实设备
          </div>
        </motion.div>
      </div>
    </div>
  )
}
