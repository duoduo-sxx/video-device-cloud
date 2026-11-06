import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HashText, Tag } from '@/components/ui/core';
import { PageHeader } from '@/components/ui/page';
import { DataTable, Pagination, type Column } from '@/components/ui/data';
import { db } from '@/mock/api';
import { fmtTime, fromNow } from '@/utils/format';
import type { Block } from '@/types';
import { cn } from '@/utils/cn';

export default function Blocks() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Block[]>(db.blocks.slice(0, 10));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [latest, setLatest] = useState(db.blocks[0].height);

  useEffect(() => {
    const t = setInterval(() => {
      setLatest((h) => h + 1);
      setPage((p) => {
        if (p === 1) {
          setRows((prev) => [
            {
              ...db.blocks[0],
              height: prev[0].height + 1,
              hash: db.blocks[(prev[0].height + 1) % 200].hash,
              parentHash: prev[0].hash,
              timestamp: new Date().toISOString(),
              txCount: 3 + ((prev[0].height + 1) % 3),
            },
            ...prev.slice(0, 9),
          ]);
        }
        return p;
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const columns: Column<Block>[] = [
    {
      key: 'height',
      title: '区块高度',
      width: 132,
      render: (b) => (
        <span className="font-mono text-[12px] text-[var(--brand-2)]">#{b.height.toLocaleString()}</span>
      ),
    },
    { key: 'hash', title: '区块哈希', width: 200, render: (b) => <HashText value={b.hash} head={12} tail={8} /> },
    { key: 'parent', title: '父哈希', width: 172, render: (b) => <HashText value={b.parentHash} head={8} tail={6} /> },
    { key: 'tx', title: '交易数', width: 92, align: 'center', render: (b) => <span className="num text-[12px]">{b.txCount}</span> },
    { key: 'node', title: '出块节点', width: 152, render: (b) => <span className="text-[11.5px]">{b.node}</span> },
    { key: 'cons', title: '共识', width: 82, render: () => <Tag tone="blue">PBFT</Tag> },
    { key: 'dur', title: '出块耗时', width: 96, align: 'right', render: (b) => <span className="num text-[11.5px] text-[var(--text-3)]">{b.duration}ms</span> },
    { key: 'size', title: '大小', width: 84, align: 'right', render: (b) => <span className="num text-[11.5px] text-[var(--text-3)]">{(b.size / 1024).toFixed(1)} KB</span> },
    {
      key: 'time',
      title: '时间',
      width: 168,
      render: (b) => (
        <div>
          <div className="font-mono text-[11.5px]">{fmtTime(b.timestamp)}</div>
          <div className="text-[10px] text-[var(--text-3)]">{fromNow(b.timestamp)}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="区块浏览"
        desc={`星火联盟链主网实时区块，当前高度 ${latest.toLocaleString()}，出块间隔 2.1 秒`}
        actions={<span className="flex items-center gap-1.5 text-[11.5px] text-[var(--ok)]"><span className="h-1.5 w-1.5 animate-[pulseDot_1.8s_ease-in-out_infinite] rounded-full bg-[var(--ok)]" />实时同步中</span>}
      />

      <div className="card">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(b) => String(b.height)}
          onRowClick={(b) => nav(`/chain/blocks/${b.height}`)}
          footer={<Pagination page={page} pageSize={pageSize} total={2486921} onChange={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />}
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {[
          ['出块间隔', '2.1 秒'],
          ['单块交易上限', '2,000 笔'],
          ['区块大小上限', '2 MB'],
          ['最终确定性', '一次确认'],
        ].map(([k, v]) => (
          <div key={k} className="card px-4 py-3">
            <div className="text-[10.5px] text-[var(--text-3)]">{k}</div>
            <div className="mt-1 text-[13px] text-[var(--text-1)]">{v}</div>
          </div>
        ))}
      </div>
      <div className={cn('mt-3 text-center text-[11px] text-[var(--text-3)]')}>
        仅展示最近 2,400 个区块的详细数据，更早的历史区块可通过区块高度直接查询
      </div>
    </div>
  );
}
