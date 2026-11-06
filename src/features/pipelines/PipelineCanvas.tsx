import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App, Button, Input, Select, Tooltip } from 'antd';
import {
  ApiOutlined,
  ArrowLeftOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  ForkOutlined,
  MinusOutlined,
  PictureOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  ScissorOutlined,
  SoundOutlined,
  TranslationOutlined,
  VideoCameraOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { PageHeader, StatusBadge } from '@/components/ui';
import { PIPELINES } from '@/mock/seed/pipelines';
import { USERS } from '@/mock/seed/people';
import type { PipelineEdge, PipelineNode, NodeType } from '@/types';
import { clamp, fmtRelative } from '@/utils/format';

const TYPES: { type: NodeType; label: string; icon: React.ReactNode }[] = [
  { type: 'input', label: '输入素材', icon: <VideoCameraOutlined /> },
  { type: 'transcode', label: '转码', icon: <ApiOutlined /> },
  { type: 'asr', label: '语音转写', icon: <SoundOutlined /> },
  { type: 'subtitle', label: '字幕生成', icon: <EditOutlined /> },
  { type: 'translate', label: '翻译配音', icon: <TranslationOutlined /> },
  { type: 'clip', label: '智能剪辑', icon: <ScissorOutlined /> },
  { type: 'enhance', label: '画质增强', icon: <PictureOutlined /> },
  { type: 'review', label: '内容审核', icon: <SafetyCertificateOutlined /> },
  { type: 'branch', label: '条件分支', icon: <ForkOutlined /> },
  { type: 'manual', label: '人工处理', icon: <EditOutlined /> },
  { type: 'output', label: '输出', icon: <ExportOutlined /> },
];

const NODE_W = 168;
const NODE_H = 58;

export default function PipelineCanvas() {
  const { pipelineId = 'pl_01' } = useParams();
  const nav = useNavigate();
  const { message, modal } = App.useApp();
  const base = PIPELINES.find((p) => p.id === pipelineId) || PIPELINES[0];
  const [nodes, setNodes] = useState<PipelineNode[]>(() => JSON.parse(JSON.stringify(base.nodes)));
  const [edges, setEdges] = useState<PipelineEdge[]>(() => JSON.parse(JSON.stringify(base.edges)));
  const [selected, setSelected] = useState<string | null>(base.nodes[1]?.id || null);
  const [tf, setTf] = useState({ x: 0, y: 0, k: 0.92 });
  const [dirty, setDirty] = useState(false);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [version, setVersion] = useState(base.version);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (dragRef.current) {
        const { id, offX, offY } = dragRef.current;
        const nx = (e.clientX - rect.left - tf.x) / tf.k - offX;
        const ny = (e.clientY - rect.top - tf.y) / tf.k - offY;
        setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: Math.max(0, nx), y: Math.max(0, ny) } : n)));
        setDirty(true);
      } else if (panRef.current) {
        setTf((t) => ({ ...t, x: panRef.current!.tx + (e.clientX - panRef.current!.x), y: panRef.current!.ty + (e.clientY - panRef.current!.y) }));
      }
    };
    const up = () => {
      dragRef.current = null;
      panRef.current = null;
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [tf]);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const sel = nodes.find((n) => n.id === selected);

  const addNode = (type: NodeType) => {
    const meta = TYPES.find((t) => t.type === type)!;
    const id = `n_${Date.now()}`;
    const node: PipelineNode = {
      id,
      type,
      label: meta.label,
      x: 80 + (nodes.length % 4) * 40,
      y: 400 + Math.floor(nodes.length / 4) * 70,
      params: { 超时: '600s', 重试: 2, 失败策略: '中止' },
      status: 'idle',
    };
    setNodes([...nodes, node]);
    setSelected(id);
    setDirty(true);
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.from !== id && e.to !== id));
    setSelected(null);
    setDirty(true);
  };

  const connect = (from: string, to: string) => {
    if (from === to) return;
    if (edges.some((e) => e.from === from && e.to === to)) return;
    setEdges([...edges, { id: `e_${Date.now()}`, from, to }]);
    setDirty(true);
  };

  const save = () => {
    setVersion((v) => v + 1);
    setDirty(false);
    message.success(`流水线已保存为 v${version + 1}`);
  };

  const simulate = () => {
    if (running) return;
    const order = nodes.filter((n) => n.status !== undefined);
    if (order.length === 0) return;
    setRunning(true);
    setLogs([`[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 试运行开始，共 ${order.length} 个节点`]);
    let i = 0;
    const timer = setInterval(() => {
      if (i >= order.length) {
        clearInterval(timer);
        setRunning(false);
        setLogs((l) => [...l, `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 试运行完成，耗时 ${(order.length * 1.2).toFixed(1)} 秒，产出 1 个成片与 2 条字幕`]);
        message.success('试运行完成');
        return;
      }
      const id = order[i].id;
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'running' } : n)));
      setTimeout(() => {
        setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'done' } : n)));
        const n = nodeMap.get(id);
        setLogs((l) => [...l, `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] INFO 节点完成：${n?.label}（1.2s）`]);
      }, 700);
      i += 1;
    }, 950);
  };

  return (
    <div>
      <PageHeader
        title={
          <span className="row" style={{ gap: 10 }}>
            <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={() => nav('/pipelines')} />
            {base.name}
            <span className="chip" style={{ fontSize: 11 }}>v{version}</span>
            {dirty && <span title="有未保存修改" style={{ width: 7, height: 7, borderRadius: 4, background: 'var(--warning)' }} />}
          </span>
        }
        subtitle={`${base.description} · 负责人 ${USERS.find((u) => u.id === base.ownerId)?.name} · 更新于 ${fmtRelative(base.updatedAt)}`}
        actions={
          <>
            <Button onClick={() => nav(`/pipelines/${base.id}/runs`)}>运行记录</Button>
            <Button icon={<CaretRightOutlined />} onClick={simulate} loading={running}>
              试运行
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={save}>
              保存
            </Button>
          </>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: '186px minmax(0,1fr) 268px', alignItems: 'start' }}>
        <div className="panel tight">
          <div className="panel-head">
            <h3>节点库</h3>
          </div>
          <div className="col" style={{ gap: 4 }}>
            {TYPES.map((t) => (
              <div
                key={t.type}
                className="row clickable"
                onClick={() => addNode(t.type)}
                style={{ gap: 8, padding: '6px 8px', borderRadius: 6, fontSize: 12.5, border: '1px solid var(--border)' }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{t.icon}</span>
                {t.label}
                <PlusOutlined style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)' }} />
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="hint">点击添加节点；拖拽节点移动位置；选中节点后可编辑参数。</div>
        </div>

        <div>
          <div className="row between" style={{ marginBottom: 8 }}>
            <div className="row" style={{ gap: 6 }}>
              <Tooltip title="缩小">
                <Button size="small" icon={<ZoomOutOutlined />} onClick={() => setTf((t) => ({ ...t, k: clamp(t.k - 0.1, 0.4, 1.6) }))} />
              </Tooltip>
              <span className="hint" style={{ width: 42, textAlign: 'center' }}>{Math.round(tf.k * 100)}%</span>
              <Tooltip title="放大">
                <Button size="small" icon={<ZoomInOutlined />} onClick={() => setTf((t) => ({ ...t, k: clamp(t.k + 0.1, 0.4, 1.6) }))} />
              </Tooltip>
              <Button size="small" icon={<MinusOutlined />} onClick={() => setTf({ x: 0, y: 0, k: 0.92 })}>
                重置
              </Button>
            </div>
            <span className="hint">{nodes.length} 节点 · {edges.length} 连线 · 拖动空白区域可平移画布</span>
          </div>

          <div
            className="canvas"
            ref={canvasRef}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest('.node')) return;
              setSelected(null);
              panRef.current = { x: e.clientX, y: e.clientY, tx: tf.x, ty: tf.y };
            }}
            onDoubleClick={(e) => {
              if (!(e.target as HTMLElement).closest('.node')) setTf({ x: 0, y: 0, k: 0.92 });
            }}
          >
            <div style={{ position: 'absolute', inset: 0, transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.k})`, transformOrigin: '0 0' }}>
              <svg width="1400" height="900" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
                {edges.map((e) => {
                  const a = nodeMap.get(e.from);
                  const b = nodeMap.get(e.to);
                  if (!a || !b) return null;
                  const x1 = a.x + NODE_W;
                  const y1 = a.y + NODE_H / 2;
                  const x2 = b.x;
                  const y2 = b.y + NODE_H / 2;
                  const dx = Math.max(50, Math.abs(x2 - x1) * 0.5);
                  return (
                    <g key={e.id}>
                      <path d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`} stroke="var(--border-strong)" strokeWidth={1.6} fill="none" />
                      <circle cx={x2} cy={y2} r={3} fill="var(--border-strong)" />
                    </g>
                  );
                })}
              </svg>

              {nodes.map((n) => {
                const meta = TYPES.find((t) => t.type === n.type);
                return (
                  <div
                    key={n.id}
                    className={`node ${selected === n.id ? 'selected' : ''} ${n.status === 'running' ? 'active' : ''}`}
                    style={{ left: n.x, top: n.y }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const rect = canvasRef.current!.getBoundingClientRect();
                      dragRef.current = {
                        id: n.id,
                        offX: (e.clientX - rect.left - tf.x) / tf.k - n.x,
                        offY: (e.clientY - rect.top - tf.y) / tf.k - n.y,
                      };
                      setSelected(n.id);
                    }}
                  >
                    <div className="n-title">
                      <span style={{ color: n.status === 'done' ? 'var(--success)' : n.status === 'running' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                        {n.status === 'done' ? '✓' : meta?.icon}
                      </span>
                      {n.label}
                    </div>
                    <div className="n-sub">{String(n.params['说明'] || meta?.label)}</div>
                    {n.status === 'running' && (
                      <div style={{ height: 2, background: 'var(--accent)', marginTop: 4, borderRadius: 1, animation: 'pulse 1.2s infinite' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {logs.length > 0 && (
            <div className="panel" style={{ marginTop: 12 }}>
              <div className="panel-head">
                <h3>试运行日志</h3>
                <div className="extra">
                  <StatusBadge status={running ? 'running' : 'succeeded'} text={running ? '运行中' : '已完成'} />
                </div>
              </div>
              <div className="logview" style={{ maxHeight: 150 }}>
                {logs.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="panel tight">
          <div className="panel-head">
            <h3>节点属性</h3>
            {sel && (
              <div className="extra">
                <Button size="small" danger type="text" icon={<DeleteOutlined />} onClick={() => removeNode(sel.id)} />
              </div>
            )}
          </div>
          {!sel ? (
            <div className="hint">未选中节点。点击画布中的节点查看并编辑参数。</div>
          ) : (
            <div className="col" style={{ gap: 10 }}>
              <div>
                <div className="hint" style={{ marginBottom: 4 }}>节点名称</div>
                <Input
                  size="small"
                  value={sel.label}
                  onChange={(e) => {
                    setNodes(nodes.map((n) => (n.id === sel.id ? { ...n, label: e.target.value } : n)));
                    setDirty(true);
                  }}
                />
              </div>
              <div>
                <div className="hint" style={{ marginBottom: 4 }}>节点类型</div>
                <Input size="small" value={TYPES.find((t) => t.type === sel.type)?.label} disabled />
              </div>
              <div>
                <div className="hint" style={{ marginBottom: 4 }}>输入来源</div>
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  placeholder="选择上游节点"
                  value={edges.find((e) => e.to === sel.id)?.from}
                  onChange={(v) => {
                    setEdges([...edges.filter((e) => e.to !== sel.id), { id: `e_${Date.now()}`, from: v, to: sel.id }]);
                    setDirty(true);
                  }}
                  options={nodes.filter((n) => n.id !== sel.id).map((n) => ({ value: n.id, label: n.label }))}
                />
              </div>
              <div className="divider" style={{ margin: '4px 0' }} />
              <div>
                <div className="hint" style={{ marginBottom: 4 }}>超时</div>
                <Select size="small" style={{ width: '100%' }} defaultValue="600s" options={['120s', '300s', '600s', '1800s'].map((v) => ({ value: v, label: v }))} />
              </div>
              <div>
                <div className="hint" style={{ marginBottom: 4 }}>失败重试</div>
                <Select size="small" style={{ width: '100%' }} defaultValue={2} options={[0, 1, 2, 3].map((v) => ({ value: v, label: `${v} 次` }))} />
              </div>
              <div>
                <div className="hint" style={{ marginBottom: 4 }}>失败策略</div>
                <Select size="small" style={{ width: '100%' }} defaultValue="中止" options={['中止', '跳过', '走分支'].map((v) => ({ value: v, label: v }))} />
              </div>
              <div>
                <div className="hint" style={{ marginBottom: 4 }}>备注</div>
                <Input size="small" placeholder="例如：仅处理 ≥1080P 素材" />
              </div>
              <div className="divider" style={{ margin: '4px 0' }} />
              <Button size="small" block onClick={() => connect(edges.find((e) => e.to === sel.id)?.from || '', sel.id)}>
                重新连接上游
              </Button>
              <div className="hint">删除节点会同时移除相关连线，保存后生效。</div>
            </div>
          )}
        </div>
      </div>

      <div className="hint" style={{ marginTop: 10 }}>
        提示：未连接上游的节点在保存时会给出警告；试运行只做流程校验，不产生真实产物。
      </div>
    </div>
  );
}
