import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HashText, Tag } from '@/components/ui/core';
import { PageHeader, SearchInput } from '@/components/ui/page';
import { DataTable, Pagination, type Column } from '@/components/ui/data';
import { mockApi } from '@/mock/api';
import { TX_TYPE } from '@/utils/constants';
import { fmtTime } from '@/utils/format';
import type { Transaction } from '@/types';

export default function Txs() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [kw, setKw] = useState('');

  useEffect(() => {
    setLoading(true);
    mockApi.chain.txs(page, pageSize).then((r) => {
      setRows(kw ? r.list.filter((t) => t.hash.includes(kw) || t.bizId.includes(kw) || t.bizTitle.includes(kw)) : r.list);
      setTotal(r.total);
      setLoading(false);
    });
  }, [page, pageSize, kw]);

  const columns: Column<Transaction>[] = [
    { key: 'hash', title: '交易哈希', width: 196, render: (t) => <HashText value={t.hash} head={12} tail={8} /> },
    { key: 'type', title: '类型', width: 104, render: (t) => <Tag tone={TX_TYPE[t.type].tone}>{TX_TYPE[t.type].label}</Tag> },
    {
      key: 'biz',
      title: '关联业务',
      render: (t) => (
        <div className="py-2">
          <div className="truncate text-[12px] text-[var(--text-1)]">{t.bizTitle}</div>
          <div className="mt-0.5 font-mono text-[10.5px] text-[var(--text-3)]">{t.bizId}</div>
        </div>
      ),
    },
    {
      key: 'block',
      title: '区块',
      width: 124,
      render: (t) => <span className="font-mono text-[11.5px] text-[var(--brand-2)]">#{t.blockHeight.toLocaleString()}</span>,
    },
    { key: 'from', title: '发起地址', width: 156, render: (t) => <HashText value={t.from} head={8} tail={6} /> },
    { key: 'status', title: '状态', width: 82, render: (t) => <Tag tone={t.status === 'success' ? 'green' : 'red'}>{t.status === 'success' ? '成功' : '失败'}</Tag> },
    { key: 'conf', title: '确认数', width: 88, align: 'right', render: (t) => <span className="num text-[11.5px]">{t.confirmations.toLocaleString()}</span> },
    { key: 'time', title: '时间', width: 152, render: (t) => <span className="font-mono text-[11.5px]">{fmtTime(t.timestamp)}</span> },
  ];

  return (
    <div className="page">
      <PageHeader title="交易浏览" desc="链上全部交易记录，覆盖存证、确权、合同、授权与资产登记五类业务" />

      <div className="mb-4 grid grid-cols-5 gap-3">
        {[
          { k: '存证上链', v: '62%', c: '#22D3EE' },
          { k: '权属确权', v: '21%', c: '#3D7DFF' },
          { k: '合同存证', v: '9%', c: '#8B5CF6' },
          { k: '授权许可', v: '6%', c: '#2DD4A7' },
          { k: '资产登记', v: '2%', c: '#F5B544' },
        ].map((i) => (
          <div key={i.k} className="card px-4 py-3">
            <div className="text-[10.5px] text-[var(--text-3)]">{i.k}</div>
            <div className="num mt-1 text-[18px] font-semibold" style={{ color: i.c }}>{i.v}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="border-b border-[var(--stroke)] px-5 py-4">
          <SearchInput value={kw} onChange={setKw} placeholder="搜索交易哈希 / 业务编号" className="w-[340px] font-mono" />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(t) => t.hash}
          onRowClick={(t) => nav(`/chain/tx/${t.hash}`)}
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />}
        />
      </div>
    </div>
  );
}
