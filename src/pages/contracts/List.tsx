import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus2, PenLine } from 'lucide-react';
import { Avatar, Button, HashText, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SearchInput } from '@/components/ui/page';
import { DataTable, Pagination, Tabs, type Column } from '@/components/ui/data';
import { mockApi } from '@/mock/api';
import { CONTRACT_STATUS } from '@/utils/constants';
import { fmtMoney, fmtTime } from '@/utils/format';
import type { Contract, ContractStatus } from '@/types';

export default function Contracts() {
  const nav = useNavigate();
  const [tab, setTab] = useState('all');
  const [kw, setKw] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    mockApi.contract.list(page, pageSize, tab).then((r) => {
      setRows(kw ? r.list.filter((c) => c.title.includes(kw) || c.id.includes(kw)) : r.list);
      setTotal(r.total);
      setLoading(false);
    });
  }, [page, pageSize, tab, kw]);

  const columns: Column<Contract>[] = useMemo(
    () => [
      { key: 'id', title: '合同编号', width: 128, render: (r) => <span className="font-mono text-[11.5px] text-[var(--text-2)]">{r.id}</span> },
      {
        key: 'title',
        title: '合同名称',
        render: (r) => (
          <div className="py-2">
            <div className="truncate text-[12.5px] text-[var(--text-1)]">{r.title}</div>
            <div className="mt-0.5 text-[11px] text-[var(--text-3)]">{r.category} · {r.createdBy} 发起</div>
          </div>
        ),
      },
      {
        key: 'signers',
        title: '签署方',
        width: 156,
        render: (r) => (
          <div className="flex items-center">
            {r.signers.slice(0, 3).map((s, i) => (
              <span key={s.id} style={{ marginLeft: i === 0 ? 0 : -6 }}>
                <Avatar name={s.name} color={['#3D7DFF', '#22D3EE', '#8B5CF6'][i % 3]} size={22} />
              </span>
            ))}
            <span className="ml-1.5 text-[11px] text-[var(--text-3)]">{r.signers.length} 方</span>
          </div>
        ),
      },
      { key: 'amount', title: '合同金额', width: 116, align: 'right', render: (r) => <span className="num text-[12px]">{fmtMoney(r.amount)}</span> },
      { key: 'status', title: '状态', width: 96, render: (r) => <StatusPill label={CONTRACT_STATUS[r.status].label} tone={CONTRACT_STATUS[r.status].tone} /> },
      { key: 'created', title: '创建时间', width: 150, render: (r) => <span className="font-mono text-[11.5px]">{fmtTime(r.createdAt)}</span> },
      { key: 'expire', title: '截止时间', width: 150, render: (r) => <span className="font-mono text-[11.5px] text-[var(--text-3)]">{fmtTime(r.expireAt)}</span> },
      {
        key: 'op',
        title: '操作',
        width: 96,
        render: (r) => (
          <button className="text-[11.5px] text-[var(--brand-2)] hover:underline" onClick={(e) => { e.stopPropagation(); nav(`/contracts/${r.id}`); }}>
            {r.status === 'signing' ? '去签署' : '查看'}
          </button>
        ),
      },
    ],
    [nav],
  );

  const count = (k: string) => (k === 'all' ? 86 : dbCount(k));

  return (
    <div className="page">
      <PageHeader
        title="电子合同"
        desc="基于模板发起合同、多方在线签署，签署完成自动存证并支持验签"
        actions={
          <>
            <Button icon={<PenLine size={14} />} onClick={() => nav('/contracts/templates')}>从模板发起</Button>
            <Button variant="primary" icon={<FilePlus2 size={14} />} onClick={() => nav('/contracts/templates')}>新建合同</Button>
          </>
        }
      />

      <div className="card">
        <div className="px-5 pt-4">
          <Tabs
            active={tab}
            onChange={(k) => { setTab(k); setPage(1); }}
            items={[
              { key: 'all', label: '全部', count: 86 },
              { key: 'signing', label: '签署中', count: 15 },
              { key: 'pending', label: '待发起', count: 7 },
              { key: 'completed', label: '已完成', count: 53 },
              { key: 'draft', label: '草稿', count: 5 },
              { key: 'expired', label: '已过期', count: 4 },
            ]}
          />
          <div className="py-4">
            <SearchInput value={kw} onChange={(v) => { setKw(v); setPage(1); }} placeholder="搜索合同名称 / 编号" className="w-[300px]" />
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(r) => r.id}
          onRowClick={(r) => nav(`/contracts/${r.id}`)}
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="card card-pad">
          <div className="card-title mb-2">签署流程</div>
          <div className="space-y-2 text-[11.5px] leading-relaxed text-[var(--text-2)]">
            {['选模板 → 填变量 → 生成合同', '配置签署方与签署顺序', '各方实名签署（顺序签 / 并行签）', '全部签署完成后自动存证'].map((t, i) => (
              <div key={t} className="flex gap-2">
                <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-white/6 text-[9px]">{i + 1}</span>
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <div className="card-title mb-2">法律效力</div>
          <p className="text-[11.5px] leading-relaxed text-[var(--text-3)]">
            依据《电子签名法》第十四条，可靠的电子签名与手写签名或盖章具有同等法律效力。平台采用实名认证 + 数字证书 + 链上时间戳三重保障。
          </p>
        </div>
        <div className="card card-pad">
          <div className="card-title mb-2">合同哈希</div>
          <p className="text-[11.5px] leading-relaxed text-[var(--text-3)]">
            合同定稿后计算全文哈希并写入联盟链，任何一方修改合同文本都会导致验签失败。示例：
            <HashText value="0x5c81d2e9a4b7f03c6d1e8a2b5c9d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d" head={8} tail={6} />
          </p>
        </div>
      </div>
    </div>
  );
}

function dbCount(key: string) {
  const map: Record<string, number> = { signing: 15, pending: 7, completed: 53, draft: 5, expired: 4, cancelled: 2 };
  return map[key] ?? 0;
}
