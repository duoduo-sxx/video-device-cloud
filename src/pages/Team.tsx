import { useMemo, useState } from 'react'
import { Check, Minus, UserPlus } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Avatar, Badge, Button, Input, Modal, Panel, SearchInput, Select, Switch, Tabs } from '../components/ui'
import { DataTable, type Column } from '../components/table'
import type { TeamMember } from '../types'
import { cn } from '../lib/utils'

type TabKey = 'members' | 'roles'

const permissions = [
  '查看工作台与报表',
  '查看素材与任务',
  '创建转换任务',
  '修改算法参数',
  '暂停 / 取消任务',
  '质检放行与退回',
  '管理项目与订单',
  '处理技术服务工单',
  '管理节点与调度',
  '管理成员与权限',
  '导出账单与清单',
]

const matrix: Record<string, boolean[]> = {
  管理员: [true, true, true, true, true, true, true, true, true, true, true],
  制片: [true, true, true, true, true, true, true, true, false, false, true],
  操作员: [true, true, true, true, true, true, false, false, false, false, true],
  只读: [true, true, false, false, false, false, false, false, false, false, false],
}

const roleTone: Record<TeamMember['role'], 'violet' | 'primary' | 'info' | 'neutral'> = {
  管理员: 'violet',
  制片: 'primary',
  操作员: 'info',
  只读: 'neutral',
}

export default function Team() {
  const team = useDataStore((s) => s.team)
  const projects = useDataStore((s) => s.projects)
  const jobs = useDataStore((s) => s.jobs)
  const toast = useAppStore((s) => s.toast)

  const [tab, setTab] = useState<TabKey>('members')
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const [invited, setInvited] = useState<TeamMember[]>([])
  const [inviting, setInviting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: '操作员' as TeamMember['role'] })

  const all = useMemo(() => [...invited, ...team], [invited, team])

  const rows = all.filter((m) => {
    if (role !== 'all' && m.role !== role) return false
    if (query && !m.name.includes(query) && !m.email.includes(query)) return false
    return true
  })

  const columns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: '成员',
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={m.name} hue={m.avatarHue} size={28} />
          <div>
            <div className="text-[12.5px] text-ink">{m.name}</div>
            <div className="text-[10.5px] text-dim">{m.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'role', header: '角色', render: (m) => <Badge tone={roleTone[m.role]}>{m.role}</Badge> },
    { key: 'phone', header: '电话', render: (m) => <span className="mono text-[11.5px] text-muted">{m.phone}</span> },
    {
      key: 'online',
      header: '状态',
      render: (m) => (
        <span className="flex items-center gap-1.5 text-[11.5px]">
          <span className={cn('h-1.5 w-1.5 rounded-full', m.online ? 'bg-success' : 'bg-[#3a4250]')} />
          <span className={m.online ? 'text-muted' : 'text-dim'}>{m.online ? '在线' : '离线'}</span>
        </span>
      ),
    },
    {
      key: 'projects',
      header: '负责项目',
      align: 'right',
      render: (m) => <span className="mono text-[11.5px] text-muted">{projects.filter((p) => p.ownerId === m.id).length}</span>,
    },
    {
      key: 'jobs',
      header: '今日处理',
      align: 'right',
      sortValue: (m) => m.jobsToday,
      render: (m) => <span className="mono text-[11.5px] text-ink">{jobs.filter((j) => j.operatorId === m.id).length}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (m) => (
        <Button size="sm" variant="ghost" onClick={() => toast('info', '已发送权限变更申请', `${m.name} 的角色调整需管理员二次确认`)}>
          管理
        </Button>
      ),
    },
  ]

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="团队与权限"
        desc="四类角色对应不同的操作边界。质检放行与计费导出默认仅管理员与制片可用。"
        actions={
          <Button variant="primary" icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setInviting(true)}>
            邀请成员
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          className="border-b-0"
          items={[
            { key: 'members', label: '成员', count: all.length },
            { key: 'roles', label: '角色权限' },
          ]}
        />
        {tab === 'members' && (
          <div className="flex items-center gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="搜索姓名或邮箱" className="w-[220px]" />
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-[120px]">
              <option value="all">全部角色</option>
              {['管理员', '制片', '操作员', '只读'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {tab === 'members' ? (
        <Panel className="overflow-hidden">
          <DataTable columns={columns} rows={rows} pageSize={12} emptyTitle="没有匹配的成员" />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <Panel className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line text-[10.5px] text-dim">
                  <th className="px-4 py-2.5 text-left font-normal">权限项</th>
                  {['管理员', '制片', '操作员', '只读'].map((r) => (
                    <th key={r} className="px-4 py-2.5 text-center font-normal">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((p, i) => (
                  <tr key={p} className="border-b border-line-subtle last:border-0">
                    <td className="px-4 py-2.5 text-[12px] text-ink">{p}</td>
                    {['管理员', '制片', '操作员', '只读'].map((r) => (
                      <td key={r} className="px-4 py-2.5 text-center">
                        {matrix[r][i] ? (
                          <Check className="mx-auto h-3.5 w-3.5 text-success" />
                        ) : (
                          <Minus className="mx-auto h-3.5 w-3.5 text-[#2f3644]" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <div className="space-y-4">
            <Panel className="p-5">
              <div className="mb-3 text-[13px] text-ink">角色说明</div>
              <div className="space-y-3 text-[11.5px] leading-5 text-muted">
                <div>
                  <div className="text-ink">管理员</div>
                  <div className="text-dim">全部权限，含成员、计费与节点调度。建议仅 2 人持有。</div>
                </div>
                <div>
                  <div className="text-ink">制片</div>
                  <div className="text-dim">项目、订单、质检放行。不能修改成员与节点。</div>
                </div>
                <div>
                  <div className="text-ink">操作员</div>
                  <div className="text-dim">创建与操作任务、提交质检，不能放行。</div>
                </div>
                <div>
                  <div className="text-ink">只读</div>
                  <div className="text-dim">仅查看，适合客户对接人或实习生。</div>
                </div>
              </div>
            </Panel>
            <Panel className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] text-ink">安全策略</span>
                <Badge tone="success">已启用</Badge>
              </div>
              <div className="space-y-3">
                {[
                  ['敏感操作二次确认', true],
                  ['质检放行需双人复核', false],
                  ['异地登录提醒', true],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between">
                    <span className="text-[11.5px] text-muted">{label}</span>
                    <Switch checked={Boolean(value)} onChange={() => toast('info', '策略已更新', '变更将在下次登录生效')} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      <Modal
        open={inviting}
        onClose={() => setInviting(false)}
        title="邀请成员"
        desc="邀请后成员会收到邮件，首次登录需设置密码与二次验证。"
        footer={
          <>
            <Button onClick={() => setInviting(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!form.name.trim() || !form.email.includes('@')) {
                  toast('error', '请填写姓名与有效邮箱')
                  return
                }
                setInvited((prev) => [
                  {
                    id: `usr_new_${Date.now()}`,
                    name: form.name,
                    role: form.role,
                    email: form.email,
                    phone: '待完善',
                    online: false,
                    jobsToday: 0,
                    avatarHue: Math.round(Math.random() * 360),
                  },
                  ...prev,
                ])
                toast('success', '邀请已发送', `${form.email} 将以${form.role}身份加入`)
                setInviting(false)
                setForm({ name: '', email: '', role: '操作员' })
              }}
            >
              发送邀请
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11.5px] text-muted">姓名</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如：黎川" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11.5px] text-muted">邮箱</label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@spacescape.io" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11.5px] text-muted">角色</label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as TeamMember['role'] })}>
              {['管理员', '制片', '操作员', '只读'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
