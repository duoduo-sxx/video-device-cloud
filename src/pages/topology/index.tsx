import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Drawer, Descriptions, Switch, Tag } from 'antd';
import { MinusOutlined, PauseCircleOutlined, PlayCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageHeader, StatusTag } from '../../components/base';
import { LINKS, NODES } from '../../mock/seed';
import { LINK_STATUS, NODE_STATUS } from '../../constants/dict';
import { fmtBytes } from '../../utils/format';
import type { NodeItem } from '../../types';

const CARD_W = 240;
const CARD_H = 44;

const STATUS_COLOR: Record<string, string> = {
  excellent: '#16A34A',
  good: '#2563EB',
  congested: '#D97706',
  down: '#DC2626',
};

export default function Topology() {
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  const [picked, setPicked] = useState<NodeItem | null>(null);

  const groups = useMemo(() => {
    const edge = NODES.filter((n) => n.type === 'edge');
    const core = NODES.filter((n) => n.type !== 'edge' && !['NODE-HK-01', 'NODE-SG-01', 'NODE-FRA-01'].includes(n.id));
    const overseas = NODES.filter((n) => ['NODE-HK-01', 'NODE-SG-01', 'NODE-FRA-01'].includes(n.id));
    return [
      { title: '边缘节点', x: 30, nodes: edge },
      { title: '区域云 / 自建机房', x: 400, nodes: core },
      { title: '中转 / 海外归档', x: 770, nodes: overseas },
    ];
  }, []);

  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    groups.forEach((g) => {
      g.nodes.forEach((n, i) => {
        map[n.id] = { x: g.x, y: 70 + i * 54 };
      });
    });
    return map;
  }, [groups]);

  const connected = useMemo(() => {
    if (!hover) return new Set<string>();
    const s = new Set<string>([hover]);
    LINKS.forEach((l) => {
      if (l.sourceNodeId === hover) s.add(l.targetNodeId);
      if (l.targetNodeId === hover) s.add(l.sourceNodeId);
    });
    return s;
  }, [hover]);

  return (
    <div>
      <PageHeader title="网络拓扑" desc="边缘 → 区域云 → 中转归档的抽象链路视图（非地理地图）" />

      <div className="topo-wrap">
        <div className="topo-toolbar">
          <Button size="small" icon={<MinusOutlined />} onClick={() => setScale((s) => Math.max(0.7, s - 0.1))} />
          <Button size="small" icon={<PlusOutlined />} onClick={() => setScale((s) => Math.min(1.4, s + 0.1))} />
          <Button size="small" icon={<ReloadOutlined />} onClick={() => setScale(1)} />
          <Button
            size="small"
            icon={animate ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => setAnimate((v) => !v)}
          >
            {animate ? '暂停动效' : '播发动效'}
          </Button>
        </div>

        <div style={{ overflow: 'auto' }}>
          <svg viewBox="0 0 1060 620" style={{ width: '100%', minWidth: 900, height: 620, transform: `scale(${scale})`, transformOrigin: 'top left', transition: 'transform .18s' }}>
            {groups.map((g) => (
              <text key={g.title} x={g.x} y={36} fontSize="12" fill="var(--text-3)">
                {g.title}（{g.nodes.length}）
              </text>
            ))}

            {LINKS.map((l) => {
              const s = positions[l.sourceNodeId];
              const t = positions[l.targetNodeId];
              if (!s || !t) return null;
              const sx = s.x < t.x ? s.x + CARD_W : s.x;
              const tx = t.x > s.x ? t.x : t.x + CARD_W;
              const sy = s.y + CARD_H / 2;
              const ty = t.y + CARD_H / 2;
              const mx = (sx + tx) / 2;
              const active = !hover || (connected.has(l.sourceNodeId) && connected.has(l.targetNodeId));
              return (
                <path
                  key={l.id}
                  d={`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`}
                  fill="none"
                  stroke={STATUS_COLOR[l.status]}
                  strokeWidth={l.status === 'down' ? 1.4 : 1 + l.utilizationPct / 45}
                  strokeDasharray={l.status === 'down' ? '4 4' : animate ? '5 6' : undefined}
                  className={animate && l.status !== 'down' ? 'topo-flow' : undefined}
                  opacity={active ? (l.status === 'down' ? 0.9 : 0.55) : 0.12}
                  style={{ transition: 'opacity .15s' }}
                />
              );
            })}

            {groups.map((g) =>
              g.nodes.map((n) => {
                const p = positions[n.id];
                const dim = hover ? !connected.has(n.id) : false;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${p.x},${p.y})`}
                    style={{ cursor: 'pointer', opacity: dim ? 0.35 : 1, transition: 'opacity .15s' }}
                    onMouseEnter={() => setHover(n.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setPicked(n)}
                  >
                    <rect
                      width={CARD_W}
                      height={CARD_H}
                      rx="8"
                      fill="var(--card)"
                      stroke={n.status === 'offline' ? '#DC2626' : n.status === 'degraded' ? '#D97706' : '#E5E9F2'}
                      strokeWidth="1"
                    />
                    <circle cx="14" cy={CARD_H / 2} r="4" fill={NODE_STATUS[n.status].color} />
                    <text x="26" y="19" fontSize="12" fill="var(--text-1)">
                      {n.name.length > 15 ? `${n.name.slice(0, 15)}…` : n.name}
                    </text>
                    <text x="26" y="34" fontSize="10" fill="var(--text-3)">
                      {n.provider} · {fmtBytes((n.throughputMbps * 1e6) / 8)}/s
                    </text>
                  </g>
                );
              }),
            )}
          </svg>
        </div>

        <div className="topo-legend">
          <span><i style={{ width: 18, height: 2, background: '#16A34A', display: 'inline-block' }} /> 优</span>
          <span><i style={{ width: 18, height: 2, background: '#2563EB', display: 'inline-block' }} /> 良</span>
          <span><i style={{ width: 18, height: 2, background: '#D97706', display: 'inline-block' }} /> 拥塞</span>
          <span><i style={{ width: 18, height: 2, background: '#DC2626', display: 'inline-block' }} /> 中断（虚线）</span>
          <span>线宽表示当前承载流量</span>
          <span>连线流动方向为数据传输方向</span>
        </div>
      </div>

      <Drawer open={!!picked} onClose={() => setPicked(null)} width={420} title={picked?.name}>
        {picked && (
          <>
            <Descriptions column={1} size="small" colon={false} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="节点 ID">{picked.id}</Descriptions.Item>
              <Descriptions.Item label="状态"><StatusTag {...NODE_STATUS[picked.status]} /></Descriptions.Item>
              <Descriptions.Item label="区域">{picked.region}</Descriptions.Item>
              <Descriptions.Item label="云厂商">{picked.provider}</Descriptions.Item>
              <Descriptions.Item label="公网 IP">{picked.publicIp}</Descriptions.Item>
              <Descriptions.Item label="带宽 / 吞吐">
                {(picked.bandwidthMbps / 1000).toFixed(1)} Gbps / {(picked.throughputMbps / 1000).toFixed(2)} Gbps
              </Descriptions.Item>
              <Descriptions.Item label="健康分">{picked.healthScore}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginBottom: 12 }}>
              {picked.tags.map((t) => <Tag key={t} bordered={false}>{t}</Tag>)}
            </div>
            <Button type="primary" block onClick={() => navigate(`/nodes/${picked.id}`)}>
              查看节点详情
            </Button>
            <div className="muted" style={{ marginTop: 16 }}>
              相关链路 {LINKS.filter((l) => l.sourceNodeId === picked.id || l.targetNodeId === picked.id).length} 条
            </div>
          </>
        )}
      </Drawer>

      <div className="cf-card" style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="cf-card-title">动态流量动效</div>
          <div className="muted" style={{ marginTop: 4 }}>开启后连线按数据流向流动，用于演示与投屏</div>
        </div>
        <Switch checked={animate} onChange={setAnimate} />
      </div>
    </div>
  );
}
