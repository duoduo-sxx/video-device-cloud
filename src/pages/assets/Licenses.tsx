import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Unlock } from 'lucide-react';
import { Button, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SearchInput } from '@/components/ui/page';
import { DataTable, type Column } from '@/components/ui/data';
import { ConfirmDialog } from '@/components/ui/overlay';
import { db } from '@/mock/api';
import { fmtDate } from '@/utils/format';
import { toast } from 'sonner';

interface Row {
  id: string;
  assetId: string;
  assetName: string;
  licensee: string;
  scope: string;
  startAt: string;
  endAt: string;
  status: 'active' | 'expired' | 'revoked';
}

export default function AssetsLicenses() {
  const nav = useNavigate();
  const [kw, setKw] = useState('');
  const [rows, setRows] = useState<Row[]>(() =>
    db.assets.flatMap((a) =>
      a.licenses.map((l, i) => ({
        id: `${a.id}-L${i + 1}`,
        assetId: a.id,
        assetName: a.name,
        licensee: l.licensee,
        scope: l.scope,
        startAt: l.startAt,
        endAt: l.endAt,
        status: l.status,
      })),
    ),
  );
  const [revoke, setRevoke] = useState<Row | null>(null);

  const list = useMemo(() => rows.filter((r) => !kw || r.assetName.includes(kw) || r.licensee.includes(kw)), [rows, kw]);

  const columns: Column<Row>[] = [
    { key: 'id', title: '授权编号', width: 150, render: (r) => <span className="font-mono text-[11.5px] text-[var(--text-3)]">{r.id}</span> },
    {
      key: 'asset',
      title: '数据资产',
      render: (r) => (
        <div className="py-2">
          <div className="truncate text-[12.5px] text-[var(--text-1)]">{r.assetName}</div>
          <div className="mt-0.5 font-mono text-[10.5px] text-[var(--text-3)]">{r.assetId}</div>
        </div>
      ),
    },
    { key: 'licensee', title: '被授权方', width: 210, render: (r) => <span className="text-[12px]">{r.licensee}</span> },
    { key: 'scope', title: '授权范围', width: 120, render: (r) => <Tag>{r.scope}</Tag> },
    { key: 'start', title: '生效日期', width: 108, render: (r) => <span className="font-mono text-[11.5px]">{r.startAt}</span> },
    { key: 'end', title: '到期日期', width: 108, render: (r) => <span className="font-mono text-[11.5px]">{r.endAt}</span> },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (r) => <StatusPill label={r.status === 'active' ? '生效中' : r.status === 'expired' ? '已到期' : '已撤回'} tone={r.status === 'active' ? 'green' : r.status === 'expired' ? 'gray' : 'red'} />,
    },
    {
      key: 'op',
      title: '操作',
      width: 110,
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-[11.5px] text-[var(--brand-2)] hover:underline" onClick={() => nav(`/data-assets/${r.assetId}`)}>详情</button>
          {r.status === 'active' && (
            <button className="text-[11.5px] text-[var(--danger)] hover:underline" onClick={() => setRevoke(r)}>撤回</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="授权管理"
        desc="数据资产的对外授权记录，撤回后使用方将无法继续调用"
        actions={<Button variant="primary" icon={<Lock size={14} />} onClick={() => toast.success('已创建新的授权申请')}>新建授权</Button>}
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { k: '授权总数', v: rows.length, c: '#3D7DFF' },
          { k: '生效中', v: rows.filter((r) => r.status === 'active').length, c: '#2DD4A7' },
          { k: '已到期', v: rows.filter((r) => r.status === 'expired').length, c: '#63718A' },
          { k: '已撤回', v: rows.filter((r) => r.status === 'revoked').length, c: '#FF5C7A' },
        ].map((i) => (
          <div key={i.k} className="card px-5 py-4">
            <div className="text-[11.5px] text-[var(--text-3)]">{i.k}</div>
            <div className="num mt-1 text-[20px] font-semibold" style={{ color: i.c }}>{i.v}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="border-b border-[var(--stroke)] px-5 py-4">
          <SearchInput value={kw} onChange={setKw} placeholder="搜索资产名称 / 被授权方" className="w-[320px]" />
        </div>
        <DataTable columns={columns} rows={list} rowKey={(r) => r.id} />
      </div>

      <ConfirmDialog
        open={!!revoke}
        onClose={() => setRevoke(null)}
        onConfirm={() => {
          if (revoke) {
            setRows((prev) => prev.map((x) => (x.id === revoke.id ? { ...x, status: 'revoked' as const } : x)));
            toast.success(`已撤回对 ${revoke.licensee} 的授权`);
          }
        }}
        title="撤回授权"
        confirmText="确认撤回"
        danger
        desc={revoke ? `撤回后，${revoke.licensee} 将无法继续使用「${revoke.assetName}」，已产生的使用记录仍会保留在链上。` : ''}
      />

      <div className="mt-4 card card-pad flex items-center gap-3">
        <Unlock size={15} className="text-[var(--brand-2)]" />
        <p className="text-[11.5px] leading-relaxed text-[var(--text-3)]">
          授权与撤回操作均会写入链上授权合约，使用方通过 API 调用时会实时校验授权状态。已到期授权不会自动续期，需重新发起。
        </p>
      </div>
    </div>
  );
}
