import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Users,
  ShieldCheck,
  FolderOpen,
  KeyRound,
  ScrollText,
  UserCog,
  Plus,
  Copy,
  Check,
  Trash2,
  Search as SearchIcon,
  HardDrive,
  Mail,
  Phone,
  Building2,
  Moon,
  Sun,
  Bell,
  Monitor,
} from 'lucide-react'
import type { AuditLog, UserItem, RoleKey } from '../types'
import { createUser, fetchApiKeys, fetchAuditLogs, fetchSpaces, fetchUsers, updateUser } from '../services'
import { PERMISSION_MODULES, rolePermissions } from '../mock/data'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  Field,
  PageHeader,
  Pagination,
  Progress,
  SearchInput,
  SectionTitle,
  Select,
  Skeleton,
  Switch,
  TagInput,
  Tabs,
  toast,
} from '../components/ui'
import { ROLE_LABEL } from '../constants'
import { cn, formatDate, formatNumber, relativeTime } from '../lib/utils'
import { useAuth, useUi } from '../stores'

const TABS = [
  { key: 'users', label: '用户管理' },
  { key: 'roles', label: '角色权限' },
  { key: 'spaces', label: '空间管理' },
  { key: 'api-keys', label: 'API 密钥' },
  { key: 'audit', label: '操作审计' },
  { key: 'profile', label: '个人中心' },
]

export default function Settings() {
  const { tab = 'users' } = useParams()
  const navigate = useNavigate()

  return (
    <div className="p-6">
      <PageHeader title="系统设置" desc="账号、权限、空间与接口的统一配置入口" />
      <Tabs className="mb-4" value={tab} onChange={(k) => navigate(`/settings/${k}`)} tabs={TABS} />
      {tab === 'users' && <UsersTab />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'spaces' && <SpacesTab />}
      {tab === 'api-keys' && <KeysTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'profile' && <ProfileTab />}
    </div>
  )
}

function UsersTab() {
  const [list, setList] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', account: '', role: 'analyst' as RoleKey, department: '', email: '', phone: '' })

  useEffect(() => {
    fetchUsers().then((u) => {
      setList(u)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(
    () =>
      list.filter(
        (u) =>
          (role === 'all' || u.role === role) &&
          (!q.trim() || u.name.includes(q.trim()) || u.account.includes(q.trim()) || u.email.includes(q.trim())),
      ),
    [list, q, role],
  )

  const submit = async () => {
    if (!form.name.trim() || !form.account.trim()) return toast('请填写姓名与账号', 'error')
    const u = await createUser({ ...form, status: 'active' })
    setList((l) => [...l, u])
    setOpen(false)
    setForm({ name: '', account: '', role: 'analyst', department: '', email: '', phone: '' })
    toast('用户已创建')
  }

  return (
    <>
      <Card className="mb-3 flex flex-wrap items-center gap-2 p-2.5">
        <SearchInput value={q} onChange={setQ} placeholder="搜索姓名、账号或邮箱…" className="w-[240px]" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-[132px]">
          <option value="all">全部角色</option>
          {(Object.keys(ROLE_LABEL) as RoleKey[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
        <span className="text-[11px] text-t3">
          共 <span className="num text-t2">{filtered.length}</span> 人，其中启用{' '}
          <span className="num text-t2">{filtered.filter((u) => u.status === 'active').length}</span> 人
        </span>
        <Button variant="primary" size="sm" className="ml-auto" icon={<Plus size={12} />} onClick={() => setOpen(true)}>
          新建用户
        </Button>
      </Card>

      {loading ? (
        <Skeleton className="h-[360px]" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-xs">
              <thead>
                <tr className="border-b border-line bg-subtle/50 text-left text-[11px] text-t3">
                  <th className="px-3 py-2 font-normal">用户</th>
                  <th className="px-2 py-2 font-normal">角色</th>
                  <th className="px-2 py-2 font-normal">部门</th>
                  <th className="px-2 py-2 font-normal">联系方式</th>
                  <th className="px-2 py-2 font-normal">最近登录</th>
                  <th className="px-2 py-2 font-normal">状态</th>
                  <th className="px-2 py-2 text-right font-normal">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-line/60 last:border-0 hover:bg-hover">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={u.avatarUrl}
                          alt=""
                          className="h-7 w-7 rounded-full bg-subtle object-cover"
                          onError={(e) => {
                            e.currentTarget.style.visibility = 'hidden'
                          }}
                        />
                        <div>
                          <div className="text-t1">{u.name}</div>
                          <div className="num text-[10px] text-t3">@{u.account}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <Select
                        value={u.role}
                        onChange={(e) => {
                          const r = e.target.value as RoleKey
                          updateUser(u.id, { role: r })
                          setList((l) => l.map((x) => (x.id === u.id ? { ...x, role: r } : x)))
                          toast(`${u.name} 的角色已调整为「${ROLE_LABEL[r]}」`)
                        }}
                        className="h-6 text-[11px]"
                      >
                        {(Object.keys(ROLE_LABEL) as RoleKey[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-2 py-2 text-[11px] text-t2">{u.department}</td>
                    <td className="px-2 py-2">
                      <div className="text-[10px] text-t2">{u.email}</div>
                      <div className="num text-[10px] text-t3">{u.phone}</div>
                    </td>
                    <td className="px-2 py-2 text-[10px] text-t3">{relativeTime(u.lastLoginAt)}</td>
                    <td className="px-2 py-2">
                      <Badge
                        color={u.status === 'active' ? 'var(--success)' : 'var(--text-tertiary)'}
                        bg={u.status === 'active' ? 'rgba(22,163,74,.1)' : 'var(--bg-subtle)'}
                        dot
                      >
                        {u.status === 'active' ? '启用' : '停用'}
                      </Badge>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Switch
                          checked={u.status === 'active'}
                          size="sm"
                          onChange={(v) => {
                            updateUser(u.id, { status: v ? 'active' : 'disabled' })
                            setList((l) => l.map((x) => (x.id === u.id ? { ...x, status: v ? 'active' : 'disabled' } : x)))
                            toast(v ? '账号已启用' : '账号已停用', 'info')
                          }}
                        />
                        <button
                          onClick={() => {
                            setList((l) => l.filter((x) => x.id !== u.id))
                            toast('已从列表移除（演示）', 'info')
                          }}
                          className="rounded p-1 text-t3 hover:text-danger"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="新建用户"
        desc="新用户默认启用，首次登录需要修改初始密码"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button variant="primary" onClick={submit}>
              创建
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="姓名" required>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
            />
          </Field>
          <Field label="账号" required>
            <input
              value={form.account}
              onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))}
              className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
            />
          </Field>
          <Field label="角色">
            <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as RoleKey }))} className="w-full">
              {(Object.keys(ROLE_LABEL) as RoleKey[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="部门">
            <input
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
            />
          </Field>
          <Field label="邮箱">
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
            />
          </Field>
          <Field label="手机号">
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
            />
          </Field>
        </div>
      </Dialog>
    </>
  )
}

function RolesTab() {
  const [matrix, setMatrix] = useState(rolePermissions)
  const [activeRole, setActiveRole] = useState<RoleKey>('admin')

  return (
    <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
      <Card className="p-2">
        <div className="mb-1.5 px-1.5 text-[10px] uppercase tracking-wide text-t3">角色</div>
        <div className="space-y-0.5">
          {(Object.keys(ROLE_LABEL) as RoleKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className={cn(
                'flex w-full items-center gap-2 rounded-ctl px-2 py-1.5 text-left text-[11px] transition-colors',
                activeRole === r ? 'bg-brand-soft font-medium text-brand' : 'text-t2 hover:bg-hover',
              )}
            >
              <ShieldCheck size={12} />
              <span className="flex-1">{ROLE_LABEL[r]}</span>
              <span className="num text-[10px] text-t3">{Object.values(matrix[r] ?? {}).filter(Boolean).length}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 rounded-ctl bg-subtle px-2 py-1.5 text-[10px] leading-4 text-t3">
          角色的操作权限作用于全部空间，空间级权限可在空间设置中单独覆盖。
        </div>
      </Card>

      <Card className="p-4">
        <SectionTitle
          title={`${ROLE_LABEL[activeRole]} · 操作权限`}
          desc="勾选后该角色可在对应模块执行相应操作"
          extra={
            <Button size="sm" onClick={() => toast('权限配置已保存')}>
              保存变更
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="border-b border-line text-[11px] text-t3">
                <th className="py-2 pr-2 text-left font-normal">模块</th>
                {['查看', '新建', '编辑', '删除', '导出'].map((a) => (
                  <th key={a} className="px-2 py-2 text-center font-normal">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MODULES.map((m, i) => (
                <tr key={m} className="border-b border-line/60 last:border-0">
                  <td className="py-2 pr-2 text-[11px] text-t1">{m}</td>
                  {['查看', '新建', '编辑', '删除', '导出'].map((a, j) => {
                    const disabled = a === '查看'
                    const key = `${m}-${a}`
                    const checked = disabled ? true : Boolean(matrix[activeRole]?.[a]) && (j === 0 || i % 2 === 0)
                    return (
                      <td key={a} className="px-2 py-2 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={checked}
                            onChange={() => {
                              if (disabled) return
                              setMatrix((mx) => ({ ...mx, [activeRole]: { ...mx[activeRole], [a]: !checked } }))
                              toast(`已${checked ? '取消' : '授予'}「${m} · ${a}」权限`, 'info')
                            }}
                          />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { label: '最小权限原则', desc: '默认只授予完成工作必需的权限。' },
            { label: '敏感操作二次确认', desc: '删除、导出与密钥管理需要二次确认。' },
            { label: '变更留痕', desc: '所有权限调整都会写入操作审计。' },
          ].map((t) => (
            <div key={t.label} className="rounded-ctl border border-line px-2.5 py-2">
              <div className="text-[11px] text-t1">{t.label}</div>
              <p className="mt-0.5 text-[10px] leading-4 text-t3">{t.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SpacesTab() {
  const [spaces, setSpaces] = useState<Awaited<ReturnType<typeof fetchSpaces>>>([])
  useEffect(() => {
    fetchSpaces().then(setSpaces)
  }, [])

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {spaces.map((s) => {
        const ratio = (s.used / s.quota) * 100
        return (
          <Card key={s.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <FolderOpen size={13} className="text-brand" />
                  <span className="text-xs font-medium text-t1">{s.name}</span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-t3">{s.desc}</p>
              </div>
              <Badge color={ratio > 80 ? 'var(--warning)' : 'var(--text-tertiary)'} bg="var(--bg-subtle)">
                {ratio > 80 ? '容量预警' : '正常'}
              </Badge>
            </div>

            <div className="mt-3 flex items-center gap-3 text-[10px] text-t3">
              <span className="flex items-center gap-1">
                <Users size={10} /> {s.memberCount} 名成员
              </span>
              <span className="flex items-center gap-1">
                <HardDrive size={10} /> {s.videoCount} 个视频
              </span>
            </div>

            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="text-t3">存储占用</span>
                <span className="num text-t2">
                  {s.used} / {s.quota} GB
                </span>
              </div>
              <Progress value={ratio} color={ratio > 80 ? 'var(--warning)' : 'var(--brand)'} height={4} />
            </div>

            <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-2.5">
              <Button size="sm" variant="ghost" onClick={() => toast('已打开空间成员配置（演示）', 'info')}>
                成员
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toast('已打开空间设置（演示）', 'info')}>
                设置
              </Button>
              <Button size="sm" variant="soft" className="ml-auto" onClick={() => toast('扩容申请已提交', 'info')}>
                扩容
              </Button>
            </div>
          </Card>
        )
      })}
      <button
        onClick={() => toast('演示环境暂不支持新建空间', 'info')}
        className="flex min-h-[190px] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong text-t3 transition-colors hover:border-brand hover:text-brand"
      >
        <Plus size={18} />
        <span className="text-xs">新建空间</span>
      </button>
    </div>
  )
}

function KeysTab() {
  const [keys, setKeys] = useState<Awaited<ReturnType<typeof fetchApiKeys>>>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['视频读取'])
  const [revealed, setRevealed] = useState<string[]>([])
  const [copied, setCopied] = useState('')

  useEffect(() => {
    fetchApiKeys().then(setKeys)
  }, [])

  const mask = (k: string) => `${k.slice(0, 12)}${'•'.repeat(18)}${k.slice(-4)}`

  return (
    <>
      <Card className="mb-3 flex items-center gap-3 p-3">
        <KeyRound size={16} className="text-brand" />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-t1">接口密钥</div>
          <p className="mt-0.5 text-[10px] leading-4 text-t3">
            用于服务端调用解析、检索与审核接口。密钥只在创建时完整展示一次，请妥善保存。
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setOpen(true)}>
          新建密钥
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead>
              <tr className="border-b border-line bg-subtle/50 text-left text-[11px] text-t3">
                <th className="px-3 py-2 font-normal">名称</th>
                <th className="px-2 py-2 font-normal">密钥</th>
                <th className="px-2 py-2 font-normal">权限范围</th>
                <th className="px-2 py-2 font-normal">创建时间</th>
                <th className="px-2 py-2 font-normal">最近使用</th>
                <th className="px-2 py-2 text-right font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-line/60 last:border-0 hover:bg-hover">
                  <td className="px-3 py-2">
                    <div className="text-t1">{k.name}</div>
                    <div className="num text-[10px] text-t3">{k.id}</div>
                  </td>
                  <td className="px-2 py-2">
                    <code className="num rounded bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-t2">
                      {revealed.includes(k.id) ? k.key : mask(k.key)}
                    </code>
                  </td>
                  <td className="px-2 py-2 text-[10px] text-t2">{k.scope}</td>
                  <td className="px-2 py-2 text-[10px] text-t3">{formatDate(k.createdAt, false)}</td>
                  <td className="px-2 py-2 text-[10px] text-t3">{relativeTime(k.lastUsed)}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setRevealed((r) => (r.includes(k.id) ? r.filter((x) => x !== k.id) : [...r, k.id]))}
                        className="rounded px-1.5 py-0.5 text-[10px] text-t2 hover:bg-hover"
                      >
                        {revealed.includes(k.id) ? '隐藏' : '显示'}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(k.key).then(
                            () => {
                              setCopied(k.id)
                              setTimeout(() => setCopied(''), 1500)
                            },
                            () => toast('当前环境不支持剪贴板', 'error'),
                          )
                        }}
                        className="rounded p-1 text-t3 hover:text-t1"
                      >
                        {copied === k.id ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      </button>
                      <button
                        onClick={() => {
                          setKeys((l) => l.map((x) => (x.id === k.id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x)))
                          toast('密钥状态已更新', 'info')
                        }}
                        className="rounded px-1.5 py-0.5 text-[10px] text-t3 hover:text-danger"
                      >
                        {k.status === 'active' ? '停用' : '启用'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="新建 API 密钥"
        desc="按最小必要原则选择权限范围"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!name.trim()) return toast('请填写密钥名称', 'error')
                const key = `sk-live-${Math.random().toString(16).slice(2, 18)}${Math.random().toString(16).slice(2, 18)}`
                setKeys((l) => [
                  {
                    id: `key_${String(l.length + 1).padStart(2, '0')}`,
                    name,
                    key,
                    scope: scopes.join('、') || '只读',
                    createdAt: new Date().toISOString(),
                    lastUsed: new Date().toISOString(),
                    status: 'active',
                  },
                  ...l,
                ])
                setOpen(false)
                setName('')
                toast('密钥已创建，请立即复制保存')
              }}
            >
              创建
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="密钥名称" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：生产环境解析服务"
              className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
            />
          </Field>
          <Field label="权限范围" hint="可多选，回车添加自定义范围">
            <TagInput value={scopes} onChange={setScopes} />
          </Field>
          <div className="rounded-ctl bg-warning/5 px-2.5 py-2 text-[10px] leading-4 text-warning">
            密钥泄露可能导致数据被未授权访问，建议按环境分别创建并定期轮换。
          </div>
        </div>
      </Dialog>
    </>
  )
}

function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [result, setResult] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 12

  useEffect(() => {
    fetchAuditLogs().then((l) => {
      setLogs(l)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) =>
          (result === 'all' || l.result === result) &&
          (!q.trim() || l.user.includes(q.trim()) || l.action.includes(q.trim()) || l.target.includes(q.trim())),
      ),
    [logs, q, result],
  )

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      <Card className="mb-3 flex flex-wrap items-center gap-2 p-2.5">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="搜索操作人、动作或对象…" className="w-[260px]" />
        <Select value={result} onChange={(e) => { setResult(e.target.value); setPage(1) }} className="w-[112px]">
          <option value="all">全部结果</option>
          <option value="成功">成功</option>
          <option value="失败">失败</option>
        </Select>
        <span className="text-[11px] text-t3">
          共 <span className="num text-t2">{filtered.length}</span> 条记录
        </span>
        <Button size="sm" className="ml-auto" icon={<ScrollText size={12} />} onClick={() => toast('审计日志已导出为 CSV')}>
          导出日志
        </Button>
      </Card>

      {loading ? (
        <Skeleton className="h-[420px]" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="border-b border-line bg-subtle/50 text-left text-[11px] text-t3">
                  <th className="px-3 py-2 font-normal">时间</th>
                  <th className="px-2 py-2 font-normal">操作人</th>
                  <th className="px-2 py-2 font-normal">动作</th>
                  <th className="px-2 py-2 font-normal">对象</th>
                  <th className="px-2 py-2 font-normal">IP</th>
                  <th className="px-2 py-2 text-right font-normal">结果</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((l) => (
                  <tr key={l.id} className="border-b border-line/60 last:border-0 hover:bg-hover">
                    <td className="num px-3 py-2 text-[10px] text-t3">{formatDate(l.time)}</td>
                    <td className="px-2 py-2 text-[11px] text-t1">{l.user}</td>
                    <td className="px-2 py-2 text-[11px] text-t2">{l.action}</td>
                    <td className="max-w-[240px] px-2 py-2">
                      <span className="line-clamp-1 text-[10px] text-t2">{l.target}</span>
                    </td>
                    <td className="num px-2 py-2 text-[10px] text-t3">{l.ip}</td>
                    <td className="px-2 py-2 text-right">
                      <Badge
                        color={l.result === '成功' ? 'var(--success)' : 'var(--danger)'}
                        bg={l.result === '成功' ? 'rgba(22,163,74,.1)' : 'rgba(220,38,38,.1)'}
                      >
                        {l.result}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 pb-3">
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} />
          </div>
        </Card>
      )}
    </>
  )
}

function ProfileTab() {
  const { user } = useAuth()
  const { theme, setTheme } = useUi()
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    department: user?.department ?? '',
  })
  const [notifyTask, setNotifyTask] = useState(true)
  const [notifyReview, setNotifyReview] = useState(true)
  const [notifySystem, setNotifySystem] = useState(false)

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3">
        <Card className="p-4">
          <SectionTitle title="基本信息" desc="修改后立即生效" />
          <div className="flex items-start gap-4">
            <img
              src={user?.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full bg-subtle object-cover"
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden'
              }}
            />
            <div className="grid flex-1 grid-cols-2 gap-3">
              <Field label="姓名">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Field label="部门">
                <input
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Field label="邮箱">
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Field label="手机号">
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
                />
              </Field>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" onClick={() => toast('已重置为上次保存的内容', 'info')}>
              重置
            </Button>
            <Button size="sm" variant="primary" onClick={() => toast('个人信息已保存')}>
              保存
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle title="安全设置" desc="建议每 90 天更换一次密码" />
          <div className="space-y-2">
            {[
              { icon: KeyRound, label: '登录密码', desc: '上次修改于 2026-08-12', action: '修改' },
              { icon: Monitor, label: '登录设备', desc: '当前 2 台设备在线，最近登录 IP 10.24.8.117', action: '管理' },
              { icon: ShieldCheck, label: '双因素认证', desc: '未开启，建议开启短信或 TOTP 验证', action: '开启' },
            ].map((r) => {
              const Icon = r.icon
              return (
                <div key={r.label} className="flex items-center gap-2.5 rounded-ctl border border-line px-2.5 py-2">
                  <Icon size={13} className="shrink-0 text-t3" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-t1">{r.label}</div>
                    <div className="text-[10px] text-t3">{r.desc}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => toast(`${r.label}：演示环境不执行真实操作`, 'info')}>
                    {r.action}
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <Card className="p-4">
          <SectionTitle title="外观" />
          <div className="flex items-center gap-2">
            {[
              { key: 'light' as const, label: '浅色', icon: Sun },
              { key: 'dark' as const, label: '深色', icon: Moon },
            ].map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1.5 rounded-ctl border px-2 py-3 text-[11px] transition-colors',
                    theme === t.key ? 'border-brand bg-brand-soft text-brand' : 'border-line text-t2 hover:bg-hover',
                  )}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle title="通知偏好" />
          <div className="space-y-2.5">
            {[
              { label: '解析任务完成', value: notifyTask, set: setNotifyTask, icon: Bell },
              { label: '新增违规待审', value: notifyReview, set: setNotifyReview, icon: ShieldCheck },
              { label: '系统公告', value: notifySystem, set: setNotifySystem, icon: Mail },
            ].map((n) => {
              const Icon = n.icon
              return (
                <div key={n.label} className="flex items-center gap-2">
                  <Icon size={12} className="text-t3" />
                  <span className="flex-1 text-[11px] text-t1">{n.label}</span>
                  <Switch checked={n.value} onChange={n.set} size="sm" />
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle title="账号信息" />
          <div className="space-y-1.5 text-[10px]">
            {[
              { icon: UserCog, label: '账号', value: user?.account ?? '—' },
              { icon: Building2, label: '组织', value: '视觉内容实验室' },
              { icon: Phone, label: '绑定手机', value: user?.phone ?? '—' },
              { icon: SearchIcon, label: '数据范围', value: '全部空间（管理员）' },
            ].map((r) => {
              const Icon = r.icon
              return (
                <div key={r.label} className="flex items-center gap-1.5">
                  <Icon size={10} className="text-t3" />
                  <span className="text-t3">{r.label}</span>
                  <span className="num ml-auto text-t2">{r.value}</span>
                </div>
              )
            })}
          </div>
          <Button size="sm" variant="danger" className="mt-3 w-full justify-center" onClick={() => toast('演示环境不执行注销', 'info')}>
            注销账号
          </Button>
        </Card>
      </div>
    </div>
  )
}
