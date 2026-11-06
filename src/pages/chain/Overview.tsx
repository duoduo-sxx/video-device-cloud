import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Blocks as BlocksIcon, Boxes, Cpu, Search, Server } from 'lucide-react';
import { Button, HashText, Input, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { DonutChart, TpsChart } from '@/components/charts';
import { db, mockApi } from '@/mock/api';
import { TX_TYPE } from '@/utils/constants';
import { fmtTime, fromNow, shortHash } from '@/utils/format';
import type { Block } from '@/types';
import { toast } from 'sonner';

export default function ChainOverview() {
  const nav = useNavigate();
  const [height, setHeight] = useState(db.blocks[0].height);
  const [blocks, setBlocks] = useState<Block[]>(db.blocks.slice(0, 8));
  const [tps, setTps] = useState<{ time: string; tps: number }[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    mockApi.chain.tpsSeries().then(setTps);
    const t = setInterval(() => {
      setHeight((h) => h + 1);
      setBlocks((prev) => {
        const next: Block = {
          ...db.blocks[0],
          height: prev[0].height + 1,
          hash: db.blocks[0].hash,
          parentHash: prev[0].hash,
          timestamp: new Date().toISOString(),
        };
        return [next, ...prev.slice(0, 7)];
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const txDist = useMemo(() => {
    const map = new Map<string, number>();
    db.txs.slice(0, 2400).forEach((t) => map.set(t.type, (map.get(t.type) ?? 0) + 1));
    const colors: Record<string, string> = {
      evidence: '#22D3EE',
      rights: '#3D7DFF',
      contract: '#8B5CF6',
      license: '#2DD4A7',
      asset: '#F5B544',
      other: '#63718A',
    };
    return Array.from(map.entries()).map(([k, v]) => ({
      name: TX_TYPE[k as keyof typeof TX_TYPE].label,
      value: v,
      color: colors[k] ?? '#63718A',
    }));
  }, []);

  const search = () => {
    const v = q.trim();
    if (!v) return;
    if (/^0x[0-9a-fA-F]{64}$/.test(v)) nav(`/chain/tx/${v}`);
    else if (/^\d+$/.test(v)) nav(`/chain/blocks/${v}`);
    else toast.error('请输入区块高度或 64 位交易哈希');
  };

  return (
    <div className="page">
      <PageHeader
        title="链上总览"
        desc="星火联盟链 XH-Chain · 7 节点 PBFT 共识 · 出块间隔 2.1 秒"
        actions={<Button onClick={() => nav('/chain/nodes')}>节点监控</Button>}
      />

      <div className="card mb-4 p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-[9px] bg-[rgba(34,211,238,.1)] ring-1 ring-[rgba(34,211,238,.3)]">
            <BlocksIcon size={16} className="text-[var(--brand-2)]" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-[pulseDot_1.8s_ease-in-out_infinite] rounded-full bg-[var(--ok)] ring-2 ring-[var(--bg-card)]" />
          </div>
          <div className="flex-1">
            <div className="text-[11.5px] text-[var(--text-3)]">全局搜索</div>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="输入区块高度 / 交易哈希 / 地址，回车查询"
              prefix={<Search size={13} />}
              className="mt-1 h-[38px] w-full font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {[
          { k: '当前区块高度', v: height.toLocaleString(), s: '实时递增', icon: BlocksIcon, c: '#22D3EE' },
          { k: '累计交易数', v: '9,612,486', s: '+186 / 分钟', icon: Activity, c: '#3D7DFF' },
          { k: '存证总量', v: '12,486', s: '本月 +1,204', icon: Boxes, c: '#8B5CF6' },
          { k: '活跃节点', v: '7 / 7', s: '全部在线', icon: Server, c: '#2DD4A7' },
          { k: '平均出块', v: '2.1s', s: 'PBFT', icon: Cpu, c: '#F5B544' },
          { k: '实时 TPS', v: '186.4', s: '峰值 342', icon: Activity, c: '#38BDF8' },
        ].map((i) => {
          const Icon = i.icon;
          return (
            <div key={i.k} className="card px-4 py-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] text-[var(--text-3)]">{i.k}</span>
                <Icon size={12} style={{ color: i.c }} />
              </div>
              <div className="num mt-1.5 text-[21px] font-semibold leading-none tracking-[-.02em]" style={{ color: i.c }}>
                {i.v}
              </div>
              <div className="mt-1 text-[10px] text-[var(--text-3)]">{i.s}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <SectionCard title="实时 TPS" desc="最近 60 分钟" className="col-span-2">
          <TpsChart data={tps} height={210} />
        </SectionCard>
        <SectionCard title="交易类型分布" desc="最近 2,400 笔交易">
          <DonutChart data={txDist} height={210} centerValue="9,600" centerLabel="样本交易" />
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <SectionCard
          title="最新区块"
          desc="每 3 秒出块，列表实时刷新"
          extra={<Button size="xs" onClick={() => nav('/chain/blocks')}>查看全部</Button>}
        >
          <div className="space-y-0">
            {blocks.map((b, i) => (
              <div
                key={`${b.height}-${i}`}
                onClick={() => nav(`/chain/blocks/${b.height}`)}
                className={`flex cursor-pointer items-center gap-3 border-b border-dashed border-white/[0.055] py-2.5 last:border-b-0 hover:bg-white/[0.02] ${i === 0 ? 'animate-[slideDown_.4s_ease-out]' : ''}`}
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[6px] bg-[rgba(34,211,238,.1)] text-[10px] text-[var(--brand-2)]">
                  #{String(b.height).slice(-3)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] text-[var(--text-1)]">#{b.height.toLocaleString()}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-[var(--text-3)]">{shortHash(b.hash, 14, 8)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10.5px] text-[var(--text-2)]">{b.txCount} 笔交易</div>
                  <div className="text-[10px] text-[var(--text-3)]">{fromNow(b.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="最新交易" desc="按时间倒序" extra={<Button size="xs" onClick={() => nav('/chain/txs')}>查看全部</Button>}>
          <div className="space-y-0">
            {db.txs.slice(0, 8).map((t) => (
              <div
                key={t.hash}
                onClick={() => nav(`/chain/tx/${t.hash}`)}
                className="flex cursor-pointer items-center gap-3 border-b border-dashed border-white/[0.055] py-2.5 last:border-b-0 hover:bg-white/[0.02]"
              >
                <Tag tone={TX_TYPE[t.type].tone}>{TX_TYPE[t.type].label}</Tag>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11.5px] text-[var(--text-1)]">{t.bizTitle}</div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-[var(--text-3)]">
                    <HashText value={t.hash} head={10} tail={6} />
                  </div>
                </div>
                <div className="text-right text-[10px] text-[var(--text-3)]">
                  <div>#{t.blockHeight.toLocaleString()}</div>
                  <div>{fromNow(t.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="mt-4" title="链运行状态">
        <div className="grid grid-cols-4 gap-4">
          {[
            ['共识算法', 'PBFT · 拜占庭容错', '可容忍 2 个节点故障'],
            ['出块节点', '4 个共识节点轮转', '北京 / 杭州 / 深圳 / 成都'],
            ['数据可用性', '全节点 + 灾备节点', '贵阳灾备实时同步'],
            ['司法节点', '2 个观察节点', '司法鉴定中心 / 公证处'],
          ].map(([k, v, s]) => (
            <div key={k} className="rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-4 py-3">
              <div className="text-[10.5px] text-[var(--text-3)]">{k}</div>
              <div className="mt-1 text-[12.5px] text-[var(--text-1)]">{v}</div>
              <div className="mt-0.5 text-[10px] text-[var(--text-3)]">{s}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <StatusPill label="链运行正常" tone="green" />
          <span className="text-[11px] text-[var(--text-3)]">
            最近一次出块 {fmtTime(blocks[0].timestamp)} · 共识耗时 {blocks[0].duration}ms
          </span>
        </div>
      </SectionCard>
    </div>
  );
}
