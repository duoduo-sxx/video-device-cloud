import React, { useMemo, useRef, useState } from 'react';
import { Card, Tabs, Table, Tag, Button, Switch, List, Avatar, Form, Input, Select, InputNumber, message, Typography, Space, Empty } from 'antd';
import { PlusOutlined, EditOutlined, RobotOutlined, NodeIndexOutlined, FieldBinaryOutlined, CommentOutlined } from '@ant-design/icons';
import { INTENTS } from '@/mock/intents';
import type { Intent } from '@/types';

// ---------------- 机器人 ----------------
const BOTS = [
  { id: 'b1', name: '小智', desc: '全场景通用客服机器人', kb: '主知识库', status: true, color: '#2563EB' },
  { id: 'b2', name: '小语', desc: '售前产品咨询机器人', kb: '产品咨询库', status: true, color: '#7c3aed' },
  { id: 'b3', name: '小退', desc: '售后退款专用机器人', kb: '售后知识库', status: false, color: '#d97706' },
];

const BotTab: React.FC = () => (
  <List
    grid={{ gutter: 16, column: 3 }}
    dataSource={BOTS}
    renderItem={(b) => (
      <List.Item>
        <Card size="small" actions={[<Button key="edit" type="link" icon={<EditOutlined />}>编辑</Button>]}>
          <Card.Meta
            avatar={<Avatar style={{ background: b.color }} size={48} icon={<RobotOutlined />} />}
            title={<Space>{b.name} <Switch checkedChildren="启用" unCheckedChildren="停用" defaultChecked={b.status} size="small" /></Space>}
            description={
              <>
                <div>{b.desc}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>绑定知识库：{b.kb}</div>
                <div style={{ fontSize: 12, color: '#999' }}>更新时间：本月</div>
              </>
            }
          />
        </Card>
      </List.Item>
    )}
  />
);

// ---------------- 意图 ----------------
const IntentTab: React.FC = () => {
  const [editing, setEditing] = useState<Intent | null>(null);
  const [form] = Form.useForm();
  return (
    <>
      <Table
        size="small"
        rowKey="id"
        dataSource={INTENTS}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: '意图名称', dataIndex: 'name', width: 140 },
          { title: '编码', dataIndex: 'code', width: 150, render: (v) => <Tag>{v}</Tag> },
          { title: '分组', dataIndex: 'group', width: 100 },
          { title: '示例问法', dataIndex: 'examples', ellipsis: true, render: (v: string[]) => v[0] },
          { title: '触发词数', width: 90, render: (_: unknown, r: Intent) => `${r.keywords.length} 个` },
          { title: '话术版本', width: 90, render: (_: unknown, r: Intent) => `${r.answers.length} 个` },
          {
            title: '状态', width: 90,
            render: (_: unknown, r: Intent) => <Switch size="small" defaultChecked={r.status === 'enabled'} />,
          },
          {
            title: '操作', width: 80,
            render: (_: unknown, r: Intent) => (
              <Button type="link" size="small" onClick={() => { setEditing(r); form.setFieldsValue(r); }}>编辑</Button>
            ),
          },
        ]}
      />
      <ModalLikeDrawer intent={editing} form={form} onClose={() => setEditing(null)} />
    </>
  );
};

const ModalLikeDrawer: React.FC<{ intent: Intent | null; form: ReturnType<typeof Form.useForm>[0]; onClose: () => void }> = ({ intent, form, onClose }) => (
  <Card
    title="意图编辑（抽屉）"
    style={{ display: intent ? 'block' : 'none', position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, zIndex: 1000, overflow: 'auto' }}
    extra={<Button onClick={onClose}>关闭</Button>}
  >
    <Form form={form} layout="vertical">
      <Form.Item name="name" label="意图名称"><Input /></Form.Item>
      <Form.Item name="code" label="意图编码"><Input /></Form.Item>
      <Form.Item name="keywords" label="触发词（tag 模式）"><Select mode="tags" open={false} suffixIcon={null} /></Form.Item>
      <Form.Item name="answers" label="回复话术（多版本，随机轮询）"><Select mode="tags" open={false} suffixIcon={null} /></Form.Item>
    </Form>
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>演示说明：保存仅在前端内存生效。</Typography.Text>
  </Card>
);

// ---------------- 话术库 ----------------
const ScriptTab: React.FC = () => {
  const groups = useMemo(() => {
    const map = new Map<string, Intent[]>();
    INTENTS.forEach((i) => {
      const list = map.get(i.group) ?? [];
      list.push(i);
      map.set(i.group, list);
    });
    return [...map.entries()];
  }, []);
  return (
    <div>
      {groups.map(([group, intents]) => (
        <Card key={group} size="small" title={group} style={{ marginBottom: 12 }}>
          {intents.map((i) => (
            <div key={i.id} style={{ padding: '8px 0', borderBottom: '1px dashed rgba(128,128,128,.2)' }}>
              <Space>
                <FieldBinaryOutlined style={{ color: '#2563EB' }} />
                <Typography.Text strong>{i.name}</Typography.Text>
                <Tag color="blue">{i.code}</Tag>
                <Tag color="purple">轮询策略</Tag>
                <Tag>{i.answers.length} 个版本</Tag>
              </Space>
              <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
                {i.answers.map((a, idx) => <div key={idx}>v{idx + 1}：{a}</div>)}
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
};

// ---------------- 流程编排（展示级） ----------------
const FLOW_NODES = [
  { id: 'n1', type: '开始', name: '用户进入', desc: '会话开始触发', x: 60, y: 180, color: '#0d9488' },
  { id: 'n2', type: '意图判断', name: '意图识别', desc: '置信度 ≥ 60 直答，否则兜底', x: 260, y: 120, color: '#2563EB' },
  { id: 'n3', type: '回复', name: '知识回复', desc: '从知识库匹配答案回复', x: 480, y: 60, color: '#7c3aed' },
  { id: 'n4', type: '回复', name: '兜底话术', desc: '低置信度兜底引导', x: 480, y: 230, color: '#d97706' },
  { id: 'n5', type: '转人工', name: '转人工', desc: '用户主动或 2 次兜底后转人工', x: 700, y: 230, color: '#dc2626' },
  { id: 'n6', type: '结束', name: '会话结束', desc: '满意度回访后结束', x: 700, y: 80, color: '#6b7280' },
];
const FLOW_EDGES: [string, string][] = [['n1', 'n2'], ['n2', 'n3'], ['n2', 'n4'], ['n2', 'n5'], ['n3', 'n6'], ['n4', 'n6'], ['n5', 'n6']];

const FlowTab: React.FC = () => {
  const [nodes, setNodes] = useState(FLOW_NODES);
  const [selected, setSelected] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent, node: (typeof FLOW_NODES)[number]) => {
    e.preventDefault();
    dragRef.current = { id: node.id, dx: e.clientX - node.x, dy: e.clientY - node.y };
    setSelected(node.id);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setNodes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x: Math.max(0, e.clientX - d.dx), y: Math.max(0, e.clientY - d.dy) } : n)));
  };
  const onMouseUp = () => { dragRef.current = null; };

  const posOf = (id: string) => nodes.find((n) => n.id === id)!;
  const sel = nodes.find((n) => n.id === selected);

  return (
    <div
      style={{ position: 'relative', height: 480, border: '1px dashed rgba(128,128,128,.3)', borderRadius: 8, overflow: 'hidden', background: 'radial-gradient(rgba(128,128,128,.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {FLOW_EDGES.map(([a, b]) => {
          const pa = posOf(a); const pb = posOf(b);
          return (
            <line key={`${a}-${b}`} x1={pa.x + 90} y1={pa.y + 25} x2={pb.x} y2={pb.y + 25} stroke="#94a3b8" strokeWidth={2} markerEnd="url(#arrow)" />
          );
        })}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
          </marker>
        </defs>
      </svg>
      {nodes.map((n) => (
        <div
          key={n.id}
          onMouseDown={(e) => onMouseDown(e, n)}
          style={{
            position: 'absolute', left: n.x, top: n.y, width: 90, height: 50,
            background: n.color, color: '#fff', borderRadius: 8, cursor: 'grab',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: selected === n.id ? '0 0 0 3px rgba(37,99,235,.4)' : '0 2px 8px rgba(0,0,0,.2)',
            userSelect: 'none',
          }}
        >
          <strong style={{ fontSize: 12 }}>{n.name}</strong>
          <span style={{ fontSize: 10, opacity: 0.85 }}>{n.type}</span>
        </div>
      ))}
      <Card size="small" style={{ position: 'absolute', right: 16, top: 16, width: 220 }} title={<span><NodeIndexOutlined /> 节点属性</span>}>
        {sel ? (
          <>
            <div><b>{sel.name}</b>（{sel.type}）</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{sel.desc}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>坐标：x={Math.round(sel.x)}, y={Math.round(sel.y)}</div>
            <Input size="small" style={{ marginTop: 8 }} value={sel.name}
              onChange={(e) => setNodes((ns) => ns.map((n) => (n.id === sel.id ? { ...n, name: e.target.value } : n)))} />
          </>
        ) : (
          <Empty description="点击节点查看属性" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
};

const BotConfig: React.FC = () => (
  <Card size="small">
    <Tabs
      items={[
        { key: 'bots', label: <span><RobotOutlined /> 机器人</span>, children: <BotTab /> },
        { key: 'intents', label: <span><FieldBinaryOutlined /> 意图配置</span>, children: <IntentTab /> },
        { key: 'scripts', label: <span><CommentOutlined /> 话术库</span>, children: <ScriptTab /> },
        { key: 'flow', label: <span><NodeIndexOutlined /> 流程编排</span>, children: <FlowTab /> },
      ]}
    />
  </Card>
);

export default BotConfig;
