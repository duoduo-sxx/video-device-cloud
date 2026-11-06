import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Maximize2, Minus, Plus } from 'lucide-react';
import { Button, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { db } from '@/mock/api';
import { RIGHTS_CATEGORY } from '@/utils/constants';
import { cn } from '@/utils/cn';

interface GNode {
  id: string;
  label: string;
  type: 'work' | 'owner' | 'coOwner' | 'evidence' | 'licensee' | 'package';
  x: number;
  y: number;
}

const TYPE_COLOR: Record<GNode['type'], string> = {
  work: '#3D7DFF',
  owner: '#22D3EE',
  coOwner: '#2DD4A7',
  evidence: '#8B5CF6',
  licensee: '#F5B544',
  package: '#FF5C7A',
};

const TYPE_LABEL: Record<GNode['type'], string> = {
  work: '作品',
  owner: '权利人',
  coOwner: '共有人',
  evidence: '关联存证',
  licensee: '被许可方',
  package: '证据包',
};

export default function RightsGraph() {
  const nav = useNavigate();
  const [current, setCurrent] = useState(db.rights[0].id);
  const [zoom, setZoom] = useState(1);
  const [hidden, setHidden] = useState<GNode['type'][]>([]);
  const [active, setActive] = useState<GNode | null>(null);

  const record = db.rights.find((r) => r.id === current) ?? db.rights[0];

  const { nodes, edges } = useMemo(() => {
    const cx = 340;
    const cy = 250;
    const list: GNode[] = [{ id: 'work', label: record.title, type: 'work', x: cx, y: cy }];

    const evidences = record.evidenceIds
      .map((eid) => db.evidences.find((e) => e.id === eid))
      .filter(Boolean)
      .slice(0, 5);

    const groups: { type: GNode['type']; items: { id: string; label: string }[] }[] = [
      { type: 'owner', items: [{ id: 'owner', label: record.owner.name }] },
      { type: 'coOwner', items: record.coOwners.map((c, i) => ({ id: `co-${i}`, label: c.name })) },
      { type: 'evidence', items: evidences.map((e) => ({ id: `ev-${e!.id}`, label: e!.title.slice(0, 14) })) },
      { type: 'licensee', items: [{ id: 'lic-1', label: '上海砚山文化传播' }, { id: 'lic-2', label: '广州南澜品牌管理' }] },
      { type: 'package', items: [{ id: 'pkg-1', label: 'PK-2026-0031 证据包' }] },
    ];

    const perRing = groups.map((g) => g.items.length);
    const total = perRing.reduce((s, n) => s + n, 0);
    let angle = -Math.PI / 2;
    const step = (Math.PI * 2) / Math.max(1, total);

    groups.forEach((g) => {
      g.items.forEach((it) => {
        const radius = g.type === 'owner' || g.type === 'coOwner' ? 118 : 186;
        list.push({
          id: it.id,
          label: it.label,
          type: g.type,
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius * 0.82,
        });
        angle += step;
      });
    });

    const e = list.slice(1).map((n) => ({ from: 'work', to: n.id }));
    return { nodes: list, edges: e };
  }, [record]);

  const visible = nodes.filter((n) => !hidden.includes(n.type));

  return (
    <div className="page">
      <PageHeader
        title="权属图谱"
        desc="以作品为中心，展示权利人、共有人、关联存证、被许可方与证据包之间的关系网络"
        actions={
          <select
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="h-[34px] w-[300px] rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3 text-[12px] text-[var(--text-1)] outline-none"
          >
            {db.rights.slice(0, 40).map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} · {r.id}
              </option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <div className="card col-span-3 relative overflow-hidden" style={{ minHeight: 560 }}>
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <Tag tone={RIGHTS_CATEGORY[record.category].tone}>{RIGHTS_CATEGORY[record.category].label}</Tag>
            <Tag>{record.id}</Tag>
          </div>

          <div className="absolute right-4 top-4 z-10 flex flex-col gap-1.5">
            <button className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--stroke)] bg-[var(--bg-card-2)] text-[var(--text-2)] hover:text-[var(--text-1)]" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}>
              <Plus size={13} />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--stroke)] bg-[var(--bg-card-2)] text-[var(--text-2)] hover:text-[var(--text-1)]" onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}>
              <Minus size={13} />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--stroke)] bg-[var(--bg-card-2)] text-[var(--text-2)] hover:text-[var(--text-1)]" onClick={() => setZoom(1)}>
              <Maximize2 size={12} />
            </button>
          </div>

          <svg viewBox="0 0 680 500" className="h-full w-full" style={{ transform: `scale(${zoom})`, transition: 'transform .2s' }}>
            <defs>
              <radialGradient id="workGlow">
                <stop offset="0%" stopColor="#3D7DFF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3D7DFF" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="340" cy="250" r="120" fill="url(#workGlow)" opacity="0.7" />

            {edges.map((e, i) => {
              const a = nodes.find((n) => n.id === e.from)!;
              const b = nodes.find((n) => n.id === e.to)!;
              if (hidden.includes(b.type)) return null;
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={active && active.id !== b.id ? 'rgba(255,255,255,.08)' : 'rgba(34,211,238,.28)'}
                  strokeWidth="1"
                  strokeDasharray="3 4"
                  style={{ animation: 'dashFlow 4s linear infinite' }}
                />
              );
            })}

            {visible.map((n) => {
              const color = TYPE_COLOR[n.type];
              const isWork = n.type === 'work';
              const isActive = active?.id === n.id;
              return (
                <g key={n.id} onClick={() => setActive(n)} style={{ cursor: 'pointer' }}>
                  <circle cx={n.x} cy={n.y} r={isWork ? 34 : 20} fill="rgba(6,10,18,.9)" stroke={color} strokeWidth={isActive ? 2 : 1} />
                  <circle cx={n.x} cy={n.y} r={isWork ? 26 : 14} fill={`${color}22`} />
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={isWork ? 10 : 8} fill="#E8EEF9">
                    {TYPE_LABEL[n.type].slice(0, 2)}
                  </text>
                  <text x={n.x} y={n.y + (isWork ? 50 : 34)} textAnchor="middle" fontSize="9" fill={isActive ? '#22D3EE' : '#9AA8BF'}>
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-4 left-4 flex flex-wrap gap-3">
            {(Object.keys(TYPE_LABEL) as GNode['type'][]).map((t) => {
              const off = hidden.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => setHidden(off ? hidden.filter((x) => x !== t) : [...hidden, t])}
                  className={cn('flex items-center gap-1.5 text-[11px] transition-opacity', off && 'opacity-40')}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: TYPE_COLOR[t] }} />
                  <span className="text-[var(--text-2)]">{TYPE_LABEL[t]}</span>
                  {off ? <EyeOff size={10} className="text-[var(--text-3)]" /> : <Eye size={10} className="text-[var(--text-3)]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <SectionCard title="节点详情" desc="点击图中节点查看详情">
            {active ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLOR[active.type] }} />
                  <Tag tone={active.type === 'work' ? 'blue' : 'gray'}>{TYPE_LABEL[active.type]}</Tag>
                </div>
                <div className="text-[13px] text-[var(--text-1)]">{active.label}</div>
                <div className="space-y-0">
                  <div className="kv"><span className="kv-k">节点 ID</span><span className="kv-v font-mono text-[11px]">{active.id}</span></div>
                  <div className="kv"><span className="kv-k">关系</span><span className="kv-v">{active.type === 'work' ? '中心节点' : `与作品 ${record.id} 关联`}</span></div>
                  <div className="kv"><span className="kv-k">状态</span><span className="kv-v">已上链确认</span></div>
                </div>
                <Button size="sm" className="w-full" onClick={() => nav(`/rights/${record.id}`)}>查看权属详情</Button>
              </div>
            ) : (
              <div className="py-8 text-center text-[11.5px] text-[var(--text-3)]">尚未选择节点</div>
            )}
          </SectionCard>

          <SectionCard title="关系统计">
            <div className="space-y-2.5">
              {[
                ['权利人', 1],
                ['共有人', record.coOwners.length],
                ['关联存证', record.evidenceIds.length],
                ['被许可方', 2],
                ['关联证据包', 1],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text-3)]">{k}</span>
                  <span className="num text-[var(--text-1)]">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="图谱说明">
            <p className="text-[11.5px] leading-relaxed text-[var(--text-3)]">
              图谱数据来自链上权属登记合约与授权合约的关联关系，每条连线均对应一笔已确认的链上交易。点击图例可隐藏对应类型的节点。
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
