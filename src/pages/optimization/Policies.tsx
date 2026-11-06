import { useMemo, useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Segmented,
  Select,
  Slider,
  Switch,
  message,
} from 'antd';
import { CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PageHeader, StatusTag } from '../../components/base';
import AuthGuard, { canWrite } from '../../components/AuthGuard';
import { useDataStore } from '../../store/dataStore';
import { useUiStore } from '../../store/uiStore';
import { POLICY_TYPE } from '../../constants/dict';
import type { Policy } from '../../types';
import { fmtShortTime } from '../../utils/format';

const TYPE_TABS = [
  { value: 'all', label: '全部' },
  { value: 'compression', label: '压缩' },
  { value: 'dedup', label: '去重' },
  { value: 'concurrency', label: '并发分片' },
  { value: 'routing', label: '智能选路' },
  { value: 'retry', label: '差错重传' },
];

export default function Policies() {
  const policies = useDataStore((s) => s.policies);
  const updatePolicy = useDataStore((s) => s.updatePolicy);
  const addPolicy = useDataStore((s) => s.addPolicy);
  const removePolicy = useDataStore((s) => s.removePolicy);
  const role = useUiStore((s) => s.role);
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Policy | null>(null);
  const [form] = Form.useForm();
  const type = Form.useWatch('type', form);

  const list = useMemo(() => (tab === 'all' ? policies : policies.filter((p) => p.type === tab)), [policies, tab]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: 'compression', level: 12, enabled: true, priority: 2 });
    setOpen(true);
  };

  const openEdit = (p: Policy) => {
    setEditing(p);
    form.setFieldsValue({ ...p, ...p.params, type: p.type });
    setOpen(true);
  };

  const save = async () => {
    const v = await form.validateFields();
    if (editing) {
      updatePolicy(editing.id, {
        name: v.name,
        type: v.type,
        description: v.description,
        scenes: v.scenes ?? [],
        enabled: v.enabled,
        priority: v.priority,
        params: { level: v.level ?? '-', algorithm: v.algorithm ?? '-' },
        updatedAt: new Date().toISOString(),
      });
      message.success('策略已更新');
    } else {
      addPolicy({
        id: `POL-${String(6000 + policies.length)}`,
        name: v.name,
        type: v.type,
        description: v.description,
        params: { level: v.level ?? '-', algorithm: v.algorithm ?? '-' },
        scenes: v.scenes ?? [],
        enabled: v.enabled ?? true,
        priority: v.priority ?? 2,
        hitCount: 0,
        speedupPct: 0,
        savePct: 0,
        updatedAt: new Date().toISOString(),
        owner: '陈屿',
      });
      message.success('策略已创建并生效');
    }
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="优化策略"
        desc="压缩、去重、并发、选路、重传五类策略的统一编排，按优先级依次生效"
        actions={
          <AuthGuard>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建策略
            </Button>
          </AuthGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as string)}
          options={TYPE_TABS.map((t) => ({
            value: t.value,
            label: `${t.label} ${t.value === 'all' ? policies.length : policies.filter((p) => p.type === t.value).length}`,
          }))}
        />
      </div>

      <div className="grid grid-2">
        {list.map((p) => (
          <div key={p.id} className="policy-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="chip" style={{ color: '#8B5CF6', borderColor: '#8B5CF633', background: '#8B5CF614' }}>
                    优先级 {p.priority}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <StatusTag {...POLICY_TYPE[p.type]} dot={false} />
                  <span className="muted" style={{ marginLeft: 8 }}>{p.id}</span>
                </div>
              </div>
              <AuthGuard>
                <Switch
                  size="small"
                  checked={p.enabled}
                  onChange={(v) => {
                    updatePolicy(p.id, { enabled: v });
                    message.success(`${p.name} 已${v ? '启用' : '停用'}`);
                  }}
                />
              </AuthGuard>
              {!canWrite(role) && <Switch size="small" checked={p.enabled} disabled />}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>{p.description}</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(p.params).slice(0, 4).map(([k, v]) => (
                <span key={k} className="chip">{`${k}: ${v}`}</span>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, borderTop: '1px dashed var(--border)', paddingTop: 10 }}>
              <div>
                <div className="muted">命中次数</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{p.hitCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="muted">平均提速</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: p.speedupPct > 0 ? '#16A34A' : 'var(--text-2)' }}>
                  {p.speedupPct > 0 ? `+${p.speedupPct}%` : '—'}
                </div>
              </div>
              <div>
                <div className="muted">节省流量</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: p.savePct > 0 ? '#2563EB' : 'var(--text-2)' }}>
                  {p.savePct > 0 ? `${p.savePct}%` : '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <div>
                {p.scenes.map((s) => (
                  <span key={s} className="chip" style={{ marginRight: 6 }}>{s}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="muted">{fmtShortTime(p.updatedAt)}</span>
                <AuthGuard>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p)} />
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      addPolicy({ ...p, id: `POL-${String(6100 + policies.length)}`, name: `${p.name}（副本）`, hitCount: 0 });
                      message.success('已复制策略');
                    }}
                  />
                  <Popconfirm title="确认删除该策略？" onConfirm={() => { removePolicy(p.id); message.success('策略已删除'); }}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </AuthGuard>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Drawer
        title={editing ? '编辑优化策略' : '新建优化策略'}
        open={open}
        width={640}
        onClose={() => setOpen(false)}
        extra={
          <Button type="primary" onClick={save}>
            保存
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}>
            <Input placeholder="如：大文件高压缩-Zstd19" />
          </Form.Item>
          <Form.Item name="type" label="策略类型" rules={[{ required: true }]}>
            <Select
              options={Object.entries(POLICY_TYPE).map(([k, v]) => ({ value: k, label: v.label }))}
              disabled={!!editing}
            />
          </Form.Item>
          <Form.Item name="description" label="策略说明">
            <Input.TextArea rows={3} placeholder="描述策略的适用场景与预期收益" />
          </Form.Item>
          <Form.Item name="scenes" label="适用场景">
            <Select mode="multiple" options={['日志同步', '归档冷备', '跨云迁移', '边缘回传', '小文件归集', '跨境同步'].map((s) => ({ value: s, label: s }))} />
          </Form.Item>

          {type === 'compression' && (
            <>
              <Form.Item name="algorithm" label="压缩算法" initialValue="zstd">
                <Select options={[{ value: 'zstd', label: 'Zstandard' }, { value: 'lz4', label: 'LZ4' }, { value: 'gzip', label: 'Gzip' }]} />
              </Form.Item>
              <Form.Item name="level" label="压缩级别" extra="级别越高压缩比越大，CPU 开销也越高">
                <Slider min={1} max={22} marks={{ 1: '1', 6: '6', 12: '12', 19: '19', 22: '22' }} />
              </Form.Item>
            </>
          )}
          {type === 'dedup' && (
            <Form.Item name="chunker" label="分块算法" initialValue="CDC">
              <Select options={[{ value: 'CDC', label: '内容定义分块 CDC' }, { value: 'fixed', label: '固定分块' }]} />
            </Form.Item>
          )}
          {type === 'concurrency' && (
            <Form.Item name="level" label="并发分片数" initialValue={16}>
              <InputNumber min={1} max={64} style={{ width: '100%' }} />
            </Form.Item>
          )}
          {type === 'routing' && (
            <Form.Item name="probeInterval" label="探测间隔" initialValue="30s">
              <Select options={[{ value: '30s', label: '30 秒' }, { value: '60s', label: '60 秒' }]} />
            </Form.Item>
          )}

          <Form.Item name="priority" label="优先级（数字越小越先生效）">
            <Select options={[1, 2, 3, 4, 5].map((p) => ({ value: p, label: `优先级 ${p}` }))} />
          </Form.Item>
          <Form.Item name="enabled" label="创建后立即启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>

      <div className="cf-card" style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <ThunderboltOutlined style={{ color: '#8B5CF6', fontSize: 18 }} />
        <span style={{ fontSize: 13 }}>
          当前生效策略 {policies.filter((p) => p.enabled).length} 条，按优先级依次叠加；存在冲突时高优先级策略的参数覆盖低优先级。
        </span>
      </div>
    </div>
  );
}
