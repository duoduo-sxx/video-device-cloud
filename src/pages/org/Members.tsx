import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Avatar, Button, Field, Input, Select, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SearchInput } from '@/components/ui/page';
import { DataTable, type Column } from '@/components/ui/data';
import { Modal, ConfirmDialog } from '@/components/ui/overlay';
import { db, mockApi } from '@/mock/api';
import { DEPARTMENTS, ROLE_META } from '@/utils/constants';
import { fmtTime, maskPhone } from '@/utils/format';
import type { Member, RoleCode } from '@/types';
import { toast } from 'sonner';

export default function Members() {
  const [rows, setRows] = useState<Member[]>([]);
  const [kw, setKw] = useState('');
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', role: 'creator', dept: '内容中心' });

  useEffect(() => {
    mockApi.org.members().then(setRows);
  }, []);

  const columns: Column<Member>[] = [
    {
      key: 'name',
      title: '成员',
      render: (m) => (
        <div className="flex items-center gap-2.5 py-2">
          <Avatar name={m.name} color={m.avatarColor} size={28} />
          <div>
            <div className="text-[12.5px] text-[var(--text-1)]">{m.name}</div>
            <div className="text-[10.5px] text-[var(--text-3)]">{m.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'phone', title: '手机号', width: 132, render: (m) => <span className="font-mono text-[11.5px]">{maskPhone(m.phone)}</span> },
    { key: 'role', title: '角色', width: 116, render: (m) => <Tag tone={ROLE_META[m.role].tone}>{ROLE_META[m.role].label}</Tag> },
    { key: 'dep', title: '部门', width: 110, render: (m) => <span className="text-[11.5px]">{m.department}</span> },
    { key: 'status', title: '状态', width: 92, render: (m) => <StatusPill label={m.status === 'active' ? '正常' : '已停用'} tone={m.status === 'active' ? 'green' : 'gray'} /> },
    { key: 'login', title: '最近登录', width: 152, render: (m) => <span className="font-mono text-[11.5px] text-[var(--text-3)]">{fmtTime(m.lastLoginAt)}</span> },
    { key: 'join', title: '加入时间', width: 116, render: (m) => <span className="font-mono text-[11.5px] text-[var(--text-3)]">{fmtTime(m.joinedAt).slice(0, 10)}</span> },
    {
      key: 'op',
      title: '操作',
      width: 120,
      render: (m) => (
        <div className="flex gap-2">
          <button
            className="text-[11.5px] text-[var(--text-3)] hover:text-[var(--text-1)]"
            onClick={() => {
              setRows(rows.map((x) => (x.id === m.id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x)));
              toast.success('成员状态已更新');
            }}
          >
            {m.status === 'active' ? '停用' : '启用'}
          </button>
          <button className="text-[11.5px] text-[var(--danger)] hover:underline" onClick={() => setRemove(m)}>移除</button>
        </div>
      ),
    },
  ];

  const list = kw ? rows.filter((m) => m.name.includes(kw) || m.department.includes(kw) || m.phone.includes(kw)) : rows;

  return (
    <div className="page">
      <PageHeader
        title="成员管理"
        desc={`${db.members.filter((m) => m.status === 'active').length} 名成员 · 最多可添加 50 人`}
        actions={<Button variant="primary" icon={<UserPlus size={14} />} onClick={() => setOpen(true)}>邀请成员</Button>}
      />

      <div className="card">
        <div className="border-b border-[var(--stroke)] px-5 py-4">
          <div className="flex items-center gap-3">
            <SearchInput value={kw} onChange={setKw} placeholder="搜索姓名 / 手机号 / 部门" className="w-[300px]" />
            <div className="ml-auto flex items-center gap-2 text-[11px] text-[var(--text-3)]">
              {(Object.keys(ROLE_META) as RoleCode[]).map((r) => (
                <span key={r} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--${r === 'platform_admin' ? 'violet' : 'brand'})` }} />
                  {ROLE_META[r].label} {rows.filter((m) => m.role === r).length}
                </span>
              ))}
            </div>
          </div>
        </div>
        <DataTable columns={columns} rows={list} rowKey={(m) => m.id} />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="邀请成员"
        desc="被邀请人将收到短信通知，接受后即可加入本组织"
        width={460}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!form.name.trim() || !/^1[3-9]\d{9}$/.test(form.phone)) return toast.error('请填写姓名与有效手机号');
                setRows([
                  {
                    id: `u-${rows.length + 1}`,
                    name: form.name,
                    avatarColor: '#22D3EE',
                    phone: form.phone,
                    email: `user${rows.length + 1}@xh-chain.cn`,
                    role: form.role as RoleCode,
                    department: form.dept,
                    status: 'active',
                    lastLoginAt: new Date().toISOString(),
                    joinedAt: new Date().toISOString(),
                  },
                  ...rows,
                ]);
                setOpen(false);
                toast.success(`邀请已发送至 ${form.phone}`);
                setForm({ name: '', phone: '', role: 'creator', dept: '内容中心' });
              }}
            >
              发送邀请
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="姓名" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="成员真实姓名" />
          </Field>
          <Field label="手机号" required>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="用于接收邀请短信" maxLength={11} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="角色" required>
              <Select
                value={form.role}
                onChange={(v) => setForm({ ...form, role: v })}
                options={(Object.keys(ROLE_META) as RoleCode[]).map((r) => ({ value: r, label: ROLE_META[r].label }))}
              />
            </Field>
            <Field label="部门">
              <Select value={form.dept} onChange={(v) => setForm({ ...form, dept: v })} options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} />
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        onConfirm={() => {
          if (remove) {
            setRows(rows.filter((m) => m.id !== remove.id));
            toast.success(`已移除成员 ${remove.name}`);
          }
        }}
        title="移除成员"
        confirmText="确认移除"
        danger
        desc={remove ? `移除后 ${remove.name} 将无法访问本组织数据，其创建的存证与权属记录仍保留在组织中。` : ''}
      />
    </div>
  );
}
