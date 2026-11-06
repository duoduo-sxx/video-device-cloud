import { useEffect, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, KeyRound, Plus } from 'lucide-react';
import { Button, CopyButton, Field, Input, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { DataTable, type Column } from '@/components/ui/data';
import { Modal } from '@/components/ui/overlay';
import { mockApi } from '@/mock/api';
import { fmtTime, maskKey } from '@/utils/format';
import type { ApiKey } from '@/types';
import { toast } from 'sonner';

export default function ServiceKeys() {
  const [rows, setRows] = useState<ApiKey[]>([]);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<ApiKey | null>(null);
  const [name, setName] = useState('');
  const [show, setShow] = useState<Record<string, boolean>>({});

  useEffect(() => {
    mockApi.org.keys().then(setRows);
  }, []);

  const create = () => {
    if (!name.trim()) return toast.error('请填写密钥名称');
    const k: ApiKey = {
      id: `k${rows.length + 1}`,
      name,
      accessKey: `AK${Array.from({ length: 18 }).map(() => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('')}`,
      secretKey: `sk_live_${Array.from({ length: 20 }).map(() => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('')}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      callCount: 0,
    };
    setRows([k, ...rows]);
    setCreated(k);
    setOpen(false);
    setName('');
  };

  const columns: Column<ApiKey>[] = [
    {
      key: 'name',
      title: '密钥名称',
      render: (r) => (
        <div className="py-2">
          <div className="text-[12.5px] text-[var(--text-1)]">{r.name}</div>
          <div className="mt-0.5 font-mono text-[10.5px] text-[var(--text-3)]">{r.id}</div>
        </div>
      ),
    },
    {
      key: 'ak',
      title: 'AccessKey',
      width: 260,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11.5px] text-[var(--text-2)]">{r.accessKey}</span>
          <CopyButton value={r.accessKey} size={11} />
        </div>
      ),
    },
    {
      key: 'sk',
      title: 'SecretKey',
      width: 240,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11.5px] text-[var(--text-3)]">{show[r.id] ? r.secretKey : maskKey(r.secretKey)}</span>
          <button className="text-[var(--text-3)] hover:text-[var(--text-1)]" onClick={() => setShow({ ...show, [r.id]: !show[r.id] })}>
            {show[r.id] ? <EyeOff size={11} /> : <Eye size={11} />}
          </button>
        </div>
      ),
    },
    { key: 'status', title: '状态', width: 92, render: (r) => <StatusPill label={r.status === 'active' ? '启用' : '已禁用'} tone={r.status === 'active' ? 'green' : 'gray'} /> },
    { key: 'calls', title: '累计调用', width: 106, align: 'right', render: (r) => <span className="num text-[11.5px]">{r.callCount.toLocaleString()}</span> },
    { key: 'last', title: '最近调用', width: 152, render: (r) => <span className="font-mono text-[11.5px] text-[var(--text-3)]">{r.lastUsedAt ? fmtTime(r.lastUsedAt) : '—'}</span> },
    { key: 'created', title: '创建时间', width: 152, render: (r) => <span className="font-mono text-[11.5px]">{fmtTime(r.createdAt)}</span> },
    {
      key: 'op',
      title: '操作',
      width: 108,
      render: (r) => (
        <div className="flex gap-2">
          <button
            className="text-[11.5px] text-[var(--text-3)] hover:text-[var(--text-1)]"
            onClick={() => {
              setRows(rows.map((x) => (x.id === r.id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x)));
              toast.success('密钥状态已更新');
            }}
          >
            {r.status === 'active' ? '禁用' : '启用'}
          </button>
          <button className="text-[11.5px] text-[var(--danger)] hover:underline" onClick={() => { setRows(rows.filter((x) => x.id !== r.id)); toast.success('密钥已删除'); }}>
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="密钥管理"
        desc="AccessKey 用于标识调用方，SecretKey 用于签名，切勿泄露或在客户端明文存储"
        actions={<Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>创建密钥</Button>}
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-[rgba(245,181,68,.28)] bg-[rgba(245,181,68,.06)] px-4 py-3">
        <AlertTriangle size={14} className="mt-0.5 flex-none text-[var(--warn)]" />
        <div className="text-[11.5px] leading-relaxed text-[var(--text-2)]">
          SecretKey 仅在创建时完整显示一次，请妥善保存。如怀疑泄露，请立即禁用并重新创建。
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      </div>

      <SectionCard className="mt-4" title="签名示例" desc="所有请求需在 Header 中携带签名">
        <pre className="overflow-x-auto rounded-[9px] border border-[var(--stroke)] bg-[#070C15] p-4 font-mono text-[11px] leading-relaxed text-[var(--text-2)]">
{`POST /v1/evidence HTTP/1.1
Host: api.xh-chain.cn
Content-Type: application/json
X-XH-AccessKey: AK7F3A9C2E4B81D05C6A
X-XH-Timestamp: 1792370431
X-XH-Nonce: 8f2c4e91a3
X-XH-Signature: 3f9a2c7e1b8d04a6c5e2f7b9d3a1c4e6f8b0d2a4c6e8f0b1d3a5c7e9f2b4d6a8

{"title":"...","fileHash":"0x7f3a..."}`}
        </pre>
      </SectionCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="创建密钥"
        desc="密钥将拥有调用全部开放接口的权限"
        width={460}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button variant="primary" onClick={create}>创建</Button>
          </>
        }
      >
        <Field label="密钥名称" required hint="建议按环境与用途命名，如「生产环境 · 存证服务」">
          <Input value={name} onChange={(e) => setName(e.target.value)} prefix={<KeyRound size={13} />} placeholder="输入密钥名称" />
        </Field>
      </Modal>

      <Modal
        open={!!created}
        onClose={() => setCreated(null)}
        title="密钥创建成功"
        desc="请立即复制并妥善保存 SecretKey，关闭后将无法再次查看"
        width={520}
        footer={<Button variant="primary" onClick={() => setCreated(null)}>我已保存</Button>}
      >
        {created && (
          <div className="space-y-3">
            <div className="rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-3">
              <div className="mb-1 text-[10.5px] text-[var(--text-3)]">AccessKey</div>
              <div className="flex items-center gap-2">
                <span className="flex-1 break-all font-mono text-[11.5px] text-[var(--text-1)]">{created.accessKey}</span>
                <CopyButton value={created.accessKey} />
              </div>
            </div>
            <div className="rounded-[9px] border border-[rgba(245,181,68,.35)] bg-[rgba(245,181,68,.06)] px-3.5 py-3">
              <div className="mb-1 text-[10.5px] text-[var(--warn)]">SecretKey（仅显示一次）</div>
              <div className="flex items-center gap-2">
                <span className="flex-1 break-all font-mono text-[11.5px] text-[#F7CB7A]">{created.secretKey}</span>
                <CopyButton value={created.secretKey} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag tone="green">已启用</Tag>
              <span className="text-[11px] text-[var(--text-3)]">创建时间 {fmtTime(created.createdAt)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
