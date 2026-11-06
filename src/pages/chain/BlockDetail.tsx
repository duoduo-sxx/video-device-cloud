import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, HashText, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { DataTable, type Column } from '@/components/ui/data';
import { mockApi, db } from '@/mock/api';
import { TX_TYPE } from '@/utils/constants';
import { fmtTime } from '@/utils/format';
import type { Block, Transaction } from '@/types';

export default function BlockDetail() {
  const { height = '0' } = useParams();
  const nav = useNavigate();
  const [block, setBlock] = useState<Block | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    const h = Number(height);
    mockApi.chain.blockDetail(h).then((b) => {
      setBlock(b);
      // 用真实交易里接近该高度的记录模拟该块内交易
      const offset = Math.abs(b.height - 2486921);
      setTxs(Array.from({ length: b.txCount }).map((_, i) => {
        const idx = (offset * 3 + i) % 9600;
        return { ...mockApiTx(idx), blockHeight: b.height, timestamp: b.timestamp };
      }));
    });
  }, [height]);

  if (!block) return <div className="page"><div className="h-[400px] skel" /></div>;

  const columns: Column<Transaction>[] = [
    { key: 'hash', title: '交易哈希', width: 200, render: (t) => <HashText value={t.hash} head={12} tail={8} /> },
    { key: 'type', title: '类型', width: 104, render: (t) => <Tag tone={TX_TYPE[t.type].tone}>{TX_TYPE[t.type].label}</Tag> },
    {
      key: 'biz',
      title: '关联业务',
      render: (t) => (
        <div>
          <div className="truncate text-[11.5px] text-[var(--text-1)]">{t.bizTitle}</div>
          <div className="font-mono text-[10px] text-[var(--text-3)]">{t.bizId}</div>
        </div>
      ),
    },
    { key: 'from', title: '发起地址', width: 172, render: (t) => <HashText value={t.from} head={10} tail={6} /> },
    { key: 'status', title: '状态', width: 84, render: (t) => <Tag tone={t.status === 'success' ? 'green' : 'red'}>{t.status === 'success' ? '成功' : '失败'}</Tag> },
  ];

  return (
    <div className="page">
      <PageHeader
        back
        title={`区块 #${block.height.toLocaleString()}`}
        desc={`包含 ${block.txCount} 笔交易 · 由 ${block.node} 出块`}
        tag={<Tag tone="blue">PBFT 已确认</Tag>}
        actions={
          <>
            <Button icon={<ChevronLeft size={14} />} onClick={() => nav(`/chain/blocks/${block.height - 1}`)}>上一块</Button>
            <Button icon={<ChevronRight size={14} />} onClick={() => nav(`/chain/blocks/${block.height + 1}`)}>下一块</Button>
          </>
        }
      />

      <SectionCard title="区块头" className="mb-4">
        <div className="grid grid-cols-2 gap-x-8">
          {[
            ['区块高度', <span key="1" className="font-mono text-[12px] text-[var(--brand-2)]">#{block.height.toLocaleString()}</span>],
            ['区块哈希', <HashText key="2" value={block.hash} head={20} tail={12} />],
            ['父区块哈希', <HashText key="3" value={block.parentHash} head={20} tail={12} />],
            ['状态根', <HashText key="4" value={`0x${block.hash.slice(2, 50)}`} head={20} tail={12} />],
            ['交易根', <HashText key="5" value={`0x${block.hash.slice(10, 58)}`} head={20} tail={12} />],
            ['交易数量', <span key="6" className="num text-[12px]">{block.txCount} 笔</span>],
            ['出块节点', <span key="7" className="text-[12px]">{block.node}</span>],
            ['共识算法', <span key="8" className="text-[12px]">PBFT（4/7 节点签名）</span>],
            ['出块耗时', <span key="9" className="num text-[12px]">{block.duration} ms</span>],
            ['区块大小', <span key="10" className="num text-[12px]">{(block.size / 1024).toFixed(2)} KB</span>],
            ['时间戳', <span key="11" className="font-mono text-[12px]">{fmtTime(block.timestamp)}</span>],
            ['出块签名', <HashText key="12" value={`0x${block.parentHash.slice(2, 66)}`} head={20} tail={12} />],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex items-baseline gap-3 border-b border-dashed border-white/[0.055] py-3">
              <span className="w-[86px] flex-none text-[12px] text-[var(--text-3)]">{k}</span>
              <span className="min-w-0 flex-1 break-all text-[12px] text-[var(--text-1)]">{v}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="区块内交易" desc={`${block.txCount} 笔交易已打包并确认`}>
        <DataTable columns={columns} rows={txs} rowKey={(t) => t.hash} onRowClick={(t) => nav(`/chain/tx/${t.hash}`)} />
      </SectionCard>
    </div>
  );
}

function mockApiTx(idx: number): Transaction {
  // 直接复用全局 mock 池，保证跳转后能查到
  return db.txs[idx % db.txs.length];
}
