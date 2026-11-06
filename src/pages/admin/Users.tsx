import { useState } from 'react'
import { KeyRound, Plus, Search, UserX, UserCheck } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, Panel, Avatar } from '@/components/common'
import { Button, Field, Input, Select, Tag } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/overlay'
import { Table, type Column } from '@/components/ui/data'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { ROLE_LABEL } from '@/constants/enums'
import type { Role, User } from '@/types'

const ROLE_COLOR: Record<Role, string> = {
  operator: 'var(--brand)',
  engineer: 'var(--accent)',
  manager: 'var(--success)',
  guest: 'var(--warning)',
}

export default function Users() {
  const db = useDataStore((s) => s.db)
  const toast = useUIStore((s) => s.toast)
  const [kw, setKw] = useState('')
  const [editing, setEditing] = useState<User | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', account: '', role: 'operator' as Role, email: '', department: '运行值守部' })
  const [users, setUsers] = useState<User[]>(db.users)

  const persistUsers = (next: User[]) => {
    setUsers(next)
    useDataStore.setState((s) => ({ db: { ...s.db, users: next } }))
    useDataStore.getState().persist()
  }

  const list = users.filter((u) => !kw || u.name.includes(kw) || u.account.includes(kw) || u.department.includes(kw))

  const save = () => {
    if (!form.name || !form.account) return
    if (editing) {
      persistUsers(users.map((u) => (u.id === editing.id ? { ...u, ...form } : u)))
      toast('success', '用户已更新', form.name)
    } else {
      const colors = ['#22D3EE', '#7C5CFF', '#34D399', '#FBBF24', '#F472B6', '#60A5FA']
      persistUsers([
        ...users,
        {
          id: `U-${String(users.length + 1).padStart(3, '0')}`,
          ...form,
          phone: '138****0000',
          status: 'active',
          avatarColor: colors[users.length % colors.length],
          lastLoginAt: dayjs().format('YYYY-MM-DDTHH:mm:ssZ'),
          createdAt: dayjs().format('YYYY-MM-DD'),
        },
      ])
      toast('success', '用户已创建', form.name)
    }
    setEditing(null)
    setCreating(false)
    setForm({ name: '', account: '', role: 'operator', email: '', department: '运行值守部' })
  }

  const columns: Column<User>[] = [
    {
      key: 'name',
      title: '用户',
      render: (u) => (
        <div className="flex items-center gap-2">
          <Avatar name={u.name} color={u.avatarColor} size={26} />
          <div className="min-w-0">
            <div className="text-sm text-ink truncate">{u.name}</div>
            <div className="text-2xs text-ink-mute num">{u.account}</div>
          </div>
        </div>
      ),
    },
    { key: 'role', title: '角色', width: 110, render: (u) => <Tag color={ROLE_COLOR[u.role]}>{ROLE_LABEL[u.role]}</Tag> },
    { key: 'department', title: '部门', width: 130, render: (u) => <span className="text-xs text-ink-soft">{u.department}</span> },
    { key: 'email', title: '邮箱', width: 190, render: (u) => <span className="text-2xs text-ink-soft num">{u.email}</span> },
    { key: 'phone', title: '手机', width: 120, render: (u) => <span className="text-2xs text-ink-mute num">{u.phone}</span> },
    {
      key: 'status',
      title: '状态',
      width: 80,
      render: (u) => <Tag color={u.status === 'active' ? 'var(--success)' : 'var(--text-muted)'}>{u.status === 'active' ? '正常' : '已禁用'}</Tag>,
    },
    {
      key: 'lastLoginAt',
      title: '最后登录',
      width: 130,
      render: (u) => <span className="num text-2xs text-ink-mute">{dayjs(u.lastLoginAt).format('MM-DD HH:mm')}</span>,
    },
    {
      key: 'op',
      title: '操作',
      width: 150,
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          <button
            className="text-2xs text-brand hover:text-brand-deep"
            onClick={(e) => {
              e.stopPropagation()
              setEditing(u)
              setForm({ name: u.name, account: u.account, role: u.role, email: u.email, department: u.department })
            }}
          >
            编辑
          </button>
          <button
            className="text-2xs text-ink-mute hover:text-warn"
            onClick={(e) => {
              e.stopPropagation()
              toast('success', '密码已重置', '临时密码已发送至用户邮箱')
            }}
          >
            重置密码
          </button>
          <button
            className="text-2xs text-ink-mute hover:text-bad flex items-center gap-0.5"
            onClick={(e) => {
              e.stopPropagation()
              persistUsers(users.map((x) => (x.id === u.id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x)))
              toast('success', u.status === 'active' ? '账号已禁用' : '账号已启用', u.name)
            }}
          >
            {u.status === 'active' ? <UserX size={11} /> : <UserCheck size={11} />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="用户管理"
        sub={`共 ${users.length} 个账号 · ${users.filter((u) => u.status === 'active').length} 个启用中`}
        actions={
          <>
            <div className="w-[220px]">
              <Input icon={<Search size={13} />} placeholder="搜索姓名、账号或部门" value={kw} onChange={(e) => setKw(e.target.value)} />
            </div>
            <Button
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => {
                setCreating(true)
                setForm({ name: '', account: '', role: 'operator', email: '', department: '运行值守部' })
              }}
            >
              新建用户
            </Button>
          </>
        }
      />

      <Panel className="flex-1 min-h-0" bodyClass="p-0" title={undefined}>
        <div className="flex-1 overflow-auto">
          <Table columns={columns} rows={list} emptyText="没有匹配的用户" />
        </div>
        <div className="h-11 px-3 flex items-center justify-between border-t border-subtle text-2xs text-ink-mute">
          <span className="num">共 {list.length} 条</span>
          <span className="flex items-center gap-1">
            <KeyRound size={11} />
            密码策略：8 位以上，含大小写与数字，90 天强制更换
          </span>
        </div>
      </Panel>

      <Modal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        title={editing ? '编辑用户' : '新建用户'}
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setCreating(false); setEditing(null) }}>
              取消
            </Button>
            <Button variant="primary" onClick={save}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="姓名" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="真实姓名" />
            </Field>
            <Field label="登录账号" required>
              <Input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} placeholder="英文小写" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="角色">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="w-full">
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="部门">
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </Field>
          </div>
          <Field label="邮箱">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@ice-center.cn" />
          </Field>
          <p className="text-2xs text-ink-mute leading-relaxed">
            新建用户将收到初始密码邮件，首次登录需强制修改密码。角色权限可在「权限矩阵」中调整。
          </p>
        </div>
      </Modal>
    </>
  )
}
