import { useEffect, useMemo, useState } from 'react';
import { Button, Descriptions, Drawer, Modal, Progress, Segmented, Tag } from 'antd';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  PoweroffOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { nodeService } from '../../services';
import type { CloudNode } from '../../types';
import { CHANNELS, REGIONS, regionShort } from '../../mock/base';
import { formatRelative } from '../../utils/format';
import { toast } from '../../utils/feedback';

const TYPE_META: Record<string, { label: string; fill: string; stroke: string; text: string }> = {
  source: { label: '源节点', fill: '#E6F1FB', stroke: '#85B7EB', text: '#185FA5' },
  relay: { label: '中转', fill: '#EEEDFE', stroke: '#AFA9EC', text: '#534AB7' },
  target: { label: '目标', fill: '#E1F5EE', stroke: '#9FE1CB', text: '#0F6E56' },
  edge: { label: '边缘', fill: '#FAEEDA', stroke: '#FAC775', text: '#854F0B' },
};

export default function Nodes() {
  const [nodes, setNodes] = useState<CloudNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'card' | 'topo'>('card');
  const [detail, setDetail] = useState<CloudNode | undefined>();
  const [hover, setHover] = useState<string | null>(null);

  const load = async () => {
    const data = await nodeService.list();
    setNodes(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const online = nodes.filter((n) => n.online).length;
    const capacity = nodes.reduce((s, n) => s + n.capacityTB, 0);
    const used = nodes.reduce((s, n) => s + n.usedTB, 0);
    return { online, capacity, used, ratio: capacity ? Math.round((used / capacity) * 100) : 0 };
  }, [nodes]);

  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    REGIONS.forEach((region, ci) => {
      const list = nodes.filter((n) => n.region === region.name);
      list.forEach((n, ri) => {
        map[n.id] = { x: 100 + ci * 180, y: 96 + ri * 76 };
      });
    });
    return map;
  }, [nodes]);

  const edges = useMemo(
    () =>
      CHANNELS.map((c) => {
        const a = positions[c.sourceNodeId];
        const b = positions[c.targetNodeId];
        if (!a || !b) return null;
        return { id: c.id, a, b, active: c.status !== 'disabled', weight: c.usedMbps / 300, s: c.sourceNodeId, t: c.targetNodeId };
      }).filter(Boolean) as {
        id: string;
        a: { x: number; y: number };
        b: { x: number; y: number };
        active: boolean;
        weight: number;
        s: string;
        t: string;
      }[],
    [positions],
  );

  const toggleNode = (node: CloudNode) => {
    Modal.confirm({
      title: node.online ? `下线节点 ${node.name}？` : `上线节点 ${node.name}？`,
      content: node.online
        ? '下线后该节点承载的进行中任务将自动迁移至备用节点，可能产生短暂延迟。'
        : '上线后节点将重新加入调度池，并开始接收新任务。',
      okText: node.online ? '确认下线' : '确认上线',
      okButtonProps: { danger: node.online },
      cancelText: '取消',
      onOk: async () => {
        await nodeService.toggle(node.id);
        await load();
        toast.success(node.online ? '节点已下线' : '节点已上线');
      },
    });
  };

  const detailChannels = CHANNELS.filter((c) => c.sourceNodeId === detail?.id || c.targetNodeId === detail?.id);

  return (
    <div className="page">
      <PageHeader
        title="云端节点"
        description="管理参与传输的源、目标、中转与边缘节点，实时掌握容量与负载"
        extra={
          <>
            <Segmented
              value={view}
              onChange={(v) => setView(v as 'card' | 'topo')}
              options={[
                { value: 'card', icon: <AppstoreOutlined />, label: '卡片' },
                { value: 'topo', icon: <ApartmentOutlined />, label: '拓扑' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>
              刷新
            </Button>
          </>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard title="节点总数" value={String(nodes.length)} unit="个" deltaLabel={`在线 ${stats.online} · 离线 ${nodes.length - stats.online}`} icon={<CloudServerOutlined />} />
        <StatCard title="总容量" value={stats.capacity.toFixed(2)} unit="PB" deltaLabel="跨 6 个区域" icon={<CloudServerOutlined />} iconColor="#7C5CFF" iconBg="#F1EEFF" />
        <StatCard title="已用容量" value={`${(stats.used / 1024).toFixed(2)}`} unit="PB" deltaLabel={`使用率 ${stats.ratio}%`} icon={<CloudServerOutlined />} iconColor="#F59E0B" iconBg="#FFF6E6" />
        <StatCard title="平均负载" value={String(Math.round(nodes.filter((n) => n.online).reduce((s, n) => s + n.cpu, 0) / Math.max(1, stats.online)))} unit="%" deltaLabel="CPU 均值（在线节点）" icon={<CloudServerOutlined />} iconColor="#00B894" iconBg="#E6F8F3" />
      </div>

      {view === 'card' ? (
        <div className="grid grid-4" style={{ gap: 14 }}>
          {nodes.map((n) => {
            const meta = TYPE_META[n.type];
            return (
              <div className="node-card" key={n.id} onClick={() => setDetail(n)} style={{ cursor: 'pointer', opacity: n.online ? 1 : 0.68 }}>
                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span className="dot" style={{ background: n.online ? '#00B894' : '#EF4444' }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{n.name}</span>
                  </div>
                  <Tag style={{ marginInlineEnd: 0, fontSize: 10, color: meta.text, background: meta.fill, borderColor: meta.stroke }}>
                    {meta.label}
                  </Tag>
                </div>
                <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 5 }}>
                  {regionShort(n.region)} · {n.zone} · {n.ip}
                </div>
                {n.online ? (
                  <div style={{ marginTop: 12 }}>
                    {[
                      { label: 'CPU', value: n.cpu },
                      { label: '内存', value: n.mem },
                      { label: '磁盘', value: Math.round((n.usedTB / n.capacityTB) * 100) },
                    ].map((m) => (
                      <div className="metric-line" key={m.label}>
                        <span style={{ width: 28 }}>{m.label}</span>
                        <span className="bar">
                          <i
                            style={{
                              width: `${m.value}%`,
                              background: m.value > 85 ? '#EF4444' : m.value > 70 ? '#F59E0B' : '#1668FF',
                            }}
                          />
                        </span>
                        <span className="num" style={{ width: 32, textAlign: 'right' }}>
                          {m.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 14, fontSize: 12, color: '#EF4444' }}>节点离线 · 最后心跳 {formatRelative(n.lastHeartbeat)}</div>
                )}
                <div className="flex-between" style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #EEF2F8', fontSize: 11, color: '#8A99B0' }}>
                  <span>{n.channelCount} 条通道</span>
                  <span>{n.usedTB} / {n.capacityTB} TB</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">
              节点拓扑
              <span className="panel-sub">连线代表数据通道，粗细表示流量</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {Object.entries(TYPE_META).map(([key, m]) => (
                <span key={key} className="legend-dot">
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: m.fill, border: `1px solid ${m.stroke}` }} />
                  {m.label}
                </span>
              ))}
            </div>
          </div>
          <div className="topo-canvas">
            <svg viewBox="0 0 1180 440" width="100%" style={{ display: 'block' }}>
              {REGIONS.map((r, i) => (
                <text key={r.key} x={100 + i * 180} y={30} textAnchor="middle" fontSize="11.5" fill="#8A99B0">
                  {r.short}
                </text>
              ))}
              {REGIONS.map((r, i) => (
                <line key={`sep-${r.key}`} x1={10 + i * 180} y1={44} x2={10 + i * 180} y2={430} stroke="#F0F4FA" strokeDasharray="3 4" />
              ))}

              {edges.map((e) => {
                const midX = (e.a.x + e.b.x) / 2;
                const path = `M ${e.a.x} ${e.a.y + 22} C ${midX} ${e.a.y + 22}, ${midX} ${e.b.y + 22}, ${e.b.x} ${e.b.y + 22}`;
                const highlighted = !hover || e.s === hover || e.t === hover;
                return (
                  <path
                    key={e.id}
                    d={path}
                    fill="none"
                    stroke={e.active ? '#1668FF' : '#C9D6E8'}
                    strokeWidth={Math.max(1, Math.min(3.6, e.weight))}
                    opacity={hover ? (highlighted ? 0.55 : 0.1) : 0.22}
                    strokeDasharray={e.active ? undefined : '4 4'}
                  />
                );
              })}

              {nodes.map((n) => {
                const p = positions[n.id];
                if (!p) return null;
                const meta = TYPE_META[n.type];
                const dim = hover && hover !== n.id ? 0.45 : 1;
                return (
                  <g
                    key={n.id}
                    className="topo-node"
                    onMouseEnter={() => setHover(n.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setDetail(n)}
                    opacity={dim}
                  >
                    <rect
                      x={p.x - 66}
                      y={p.y}
                      width={132}
                      height={44}
                      rx={9}
                      fill={n.online ? meta.fill : '#F4F6FA'}
                      stroke={n.online ? meta.stroke : '#D5DEEC'}
                      strokeWidth={0.8}
                    />
                    <circle cx={p.x - 54} cy={p.y + 14} r={3} fill={n.online ? '#00B894' : '#EF4444'} />
                    <text x={p.x - 46} y={p.y + 18} fontSize="11" fill="#0F172A" fontWeight="500">
                      {n.name}
                    </text>
                    <text x={p.x - 54} y={p.y + 34} fontSize="10" fill="#8A99B0">
                      {meta.label} · CPU {n.online ? `${n.cpu}%` : '—'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#8A99B0' }}>
            提示：悬停节点可高亮其关联通道，点击节点查看资源明细。
          </div>
        </div>
      )}

      <Drawer
        title={detail ? `${detail.name} · ${detail.id}` : ''}
        open={!!detail}
        onClose={() => setDetail(undefined)}
        width={560}
        extra={
          detail ? (
            <Button danger={detail.online} size="small" icon={<PoweroffOutlined />} onClick={() => toggleNode(detail)}>
              {detail.online ? '下线节点' : '上线节点'}
            </Button>
          ) : null
        }
      >
        {detail ? (
          <>
            <Descriptions column={2} size="small" labelStyle={{ color: '#8A99B0', width: 88 }}>
              <Descriptions.Item label="区域">{detail.region}</Descriptions.Item>
              <Descriptions.Item label="可用区">{detail.zone}</Descriptions.Item>
              <Descriptions.Item label="类型">{TYPE_META[detail.type].label}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <span style={{ color: detail.online ? '#00B894' : '#EF4444' }}>{detail.online ? '在线' : '离线'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="内网 IP">{detail.ip}</Descriptions.Item>
              <Descriptions.Item label="版本">{detail.version}</Descriptions.Item>
              <Descriptions.Item label="容量">
                {detail.usedTB} / {detail.capacityTB} TB
              </Descriptions.Item>
              <Descriptions.Item label="最后心跳">{formatRelative(detail.lastHeartbeat)}</Descriptions.Item>
            </Descriptions>

            <div className="section-title" style={{ marginTop: 22 }}>
              资源使用
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-around', padding: '8px 0' }}>
              {[
                { label: 'CPU', percent: detail.cpu, color: '#1668FF' },
                { label: '内存', percent: detail.mem, color: '#7C5CFF' },
                { label: '磁盘', percent: Math.round((detail.usedTB / detail.capacityTB) * 100), color: '#00B894' },
              ].map((m) => (
                <Progress
                  key={m.label}
                  type="circle"
                  size={92}
                  percent={m.percent}
                  strokeColor={m.color}
                  format={(p) => (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 600 }}>{p}%</div>
                      <div style={{ fontSize: 10.5, color: '#8A99B0' }}>{m.label}</div>
                    </div>
                  )}
                />
              ))}
            </div>

            <div className="section-title" style={{ marginTop: 22 }}>
              承载通道（{detailChannels.length}）
            </div>
            <div className="panel" style={{ padding: '4px 16px' }}>
              {detailChannels.map((c, i) => (
                <div key={c.id} className="flex-between" style={{ padding: '10px 0', borderBottom: i === detailChannels.length - 1 ? 'none' : '1px dashed #EEF2F8', fontSize: 12.5 }}>
                  <span>{c.name}</span>
                  <span className="num" style={{ color: '#5A6B87' }}>
                    {c.usedMbps} / {c.bandwidthMbps} Mbps
                  </span>
                </div>
              ))}
            </div>

            <div className="section-title" style={{ marginTop: 22 }}>
              最近事件
            </div>
            <div style={{ fontSize: 12.5, color: '#5A6B87', lineHeight: 2 }}>
              <div>· 心跳检测通过，配置版本 {detail.version}</div>
              <div>· 承载任务分片校验完成，无异常</div>
              <div>· 带宽水位达到 68%，未触发限流</div>
            </div>
          </>
        ) : null}
      </Drawer>
    </div>
  );
}
