import { useEffect, useState } from 'react';
import { Cpu, HardDrive, MemoryStick, Network, Server } from 'lucide-react';
import { HashText, Progress, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { NodeTopology } from '@/components/business';
import { BarRankChart } from '@/components/charts';
import { mockApi } from '@/mock/api';
import type { ChainNode } from '@/types';

const ROLE: Record<ChainNode['role'], string> = { consensus: '共识节点', sync: '同步节点', backup: '灾备节点', observer: '观察节点' };

export default function Nodes() {
  const [nodes, setNodes] = useState<ChainNode[]>([]);

  useEffect(() => {
    mockApi.chain.nodes().then(setNodes);
    const t = setInterval(() => {
      setNodes((prev) => prev.map((n) => ({ ...n, cpu: Math.max(8, Math.min(88, n.cpu + Math.round((Math.random() - 0.5) * 6))) })));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="page">
      <PageHeader
        title="节点监控"
        desc="7 个节点实时运行状态，含 4 个共识节点、1 个灾备节点与 2 个司法观察节点"
        actions={<StatusPill label="全部节点在线" tone="green" />}
      />

      <div className="grid grid-cols-4 gap-3">
        {nodes.map((n) => (
          <div key={n.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[rgba(61,125,255,.12)] text-[#9CC2FF]">
                  <Server size={13} />
                </span>
                <div>
                  <div className="text-[12.5px] text-[var(--text-1)]">{n.name}</div>
                  <div className="text-[10px] text-[var(--text-3)]">{n.region} · {ROLE[n.role]}</div>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-[var(--ok)]">
                <span className="h-1.5 w-1.5 animate-[pulseDot_1.8s_ease-in-out_infinite] rounded-full bg-[var(--ok)]" />
                {n.status === 'online' ? '在线' : '同步中'}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {[
                { icon: Cpu, label: 'CPU', v: n.cpu },
                { icon: MemoryStick, label: '内存', v: n.memory },
                { icon: HardDrive, label: '磁盘', v: n.disk },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-3)]">
                      <span className="flex items-center gap-1"><Icon size={9} />{m.label}</span>
                      <span className="num">{m.v}%</span>
                    </div>
                    <div className="mt-1"><Progress value={m.v} height={3} tone={m.v > 75 ? 'danger' : 'brand'} /></div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[var(--stroke)] pt-2 text-[10px] text-[var(--text-3)]">
              <span>出块 {n.blocks.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Network size={9} />{n.latency}ms</span>
              <span>{n.version}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <SectionCard title="节点拓扑" desc="共识层与外围节点连接关系" className="col-span-2">
          <NodeTopology nodes={nodes.map((n) => ({ name: n.name.replace('节点', ''), status: n.status }))} />
          <div className="mt-2 flex items-center justify-center gap-4 text-[10.5px] text-[var(--text-3)]">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-2)]" />共识节点</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--text-3)]" />观察 / 灾备节点</span>
          </div>
        </SectionCard>

        <SectionCard title="出块分布" desc="近 1000 个区块的出块节点占比">
          <BarRankChart
            data={[
              { name: '北京主节点', value: 286 },
              { name: '杭州共识', value: 271 },
              { name: '深圳共识', value: 238 },
              { name: '成都共识', value: 205 },
            ]}
            height={200}
            color="#22D3EE"
          />
          <div className="mt-2 text-[10.5px] leading-relaxed text-[var(--text-3)]">
            4 个共识节点按权重轮流出块，出块权偏差 &lt; 8%，符合 PBFT 轮转预期。
          </div>
        </SectionCard>
      </div>

      <SectionCard className="mt-4" title="节点详情" desc="节点地址与运行参数">
        <div className="overflow-hidden rounded-[9px] border border-[var(--stroke)]">
          <table className="table">
            <thead>
              <tr>
                <th>节点名称</th>
                <th>角色</th>
                <th>节点地址</th>
                <th>区块高度</th>
                <th>版本</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => (
                <tr key={n.id}>
                  <td><span className="text-[12px] text-[var(--text-1)]">{n.name}</span></td>
                  <td><Tag tone={n.role === 'consensus' ? 'blue' : n.role === 'observer' ? 'violet' : 'gray'}>{ROLE[n.role]}</Tag></td>
                  <td><HashText value={n.address} head={12} tail={6} /></td>
                  <td><span className="num font-mono text-[11.5px] text-[var(--brand-2)]">{n.blocks.toLocaleString()}</span></td>
                  <td><span className="font-mono text-[11.5px] text-[var(--text-3)]">{n.version}</span></td>
                  <td><StatusPill label={n.status === 'online' ? '在线' : '同步中'} tone={n.status === 'online' ? 'green' : 'amber'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
