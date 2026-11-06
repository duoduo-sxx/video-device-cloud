import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { App, Button, Input, Progress, Select, Table, Tabs, Tag } from 'antd';
import { CopyOutlined, ReloadOutlined, RedoOutlined, StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PageHeader, Panel, StatusBadge } from '@/components/ui';
import { useTaskStore } from '@/stores/tasks';
import { CAP_NAMES } from '@/mock/seed/capabilities';
import { USERS } from '@/mock/seed/people';
import { GPU_NODES } from '@/mock/seed/misc';
import { fmtDateTime, fmtDuration, fmtRelative } from '@/utils/format';
import type { Task, TaskStatus, Priority } from '@/types';
import { getAsset } from '@/mock/db';

const TABS: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'queued', label: '排队中' },
  { key: 'running', label: '运行中' },
  { key: 'succeeded', label: '成功' },
  { key: 'failed', label: '失败' },
  { key: 'canceled', label: '已取消' },
];

export default function Tasks() {
  const nav = useNavigate();
  const { message, modal } = App.useApp();
  const [params] = useSearchParams();
  const tasks = useTaskStore((s) => s.tasks);
  const retry = useTaskStore((s) => s.retry);
  const cancel = useTaskStore((s) => s.cancel);
  const changePriority = useTaskStore((s) => s.setPriority);
  const [tab, setTab] = useState(params.get('status') || 'all');
  const [keyword, setKeyword] = useState('');
  const [cap, setCap] = useState('all');
  const [priority, setPriorityFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tasks.length };
    tasks.forEach((t) => {
      c[t.status] = (c[t.status] || 0) + 1;
    });
    return c;
  }, [tasks]);

  const list = useMemo(() => {
    return tasks.filter((t) => {
      if (tab !== 'all' && t.status !== tab) return false;
      if (cap !== 'all' && t.capability !== cap) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        const asset = getAsset(t.assetId);
        if (!t.name.toLowerCase().includes(k) && !t.id.toLowerCase().includes(k) && !(asset?.title || '').toLowerCase().includes(k)) return false;
      }
      return true;
    });
  }, [tasks, tab, cap, priority, keyword]);

  const doRetry = (t: Task) => {
    retry(t.id);
    message.success(`任务 ${t.id} 已重新排队`);
  };

  return (
    <div>
      <PageHeader
        title="任务中心"
        subtitle="任务进度实时刷新 · 支持重试、取消、调整优先级 · 失败任务可查看错误码与建议"
        actions={
          <>
            <Button icon={<ReloadOutlined />} onClick={() => message.success('列表已刷新')}>
              刷新
            </Button>
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => nav('/tools')}>
              发起新任务
            </Button>
          </>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 300px', alignItems: 'start' }}>
        <Panel noPad>
          <div style={{ padding: '0 16px' }}>
            <Tabs
              size="small"
              activeKey={tab}
              onChange={setTab}
              items={TABS.map((t) => ({
                key: t.key,
                label: (
                  <span>
                    {t.label}
                    <span style={{ marginLeft: 5, fontSize: 11, color: 'var(--text-tertiary)' }}>{counts[t.key] || 0}</span>
                  </span>
                ),
              }))}
            />
          </div>
          <div className="row wrap" style={{ gap: 8, padding: '0 16px 12px' }}>
            <Input allowClear placeholder="搜索任务 ID / 名称 / 素材" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 240 }} />
            <Select
              value={cap}
              onChange={setCap}
              style={{ width: 130 }}
              options={[{ value: 'all', label: '全部能力' }, ...Object.entries(CAP_NAMES).filter(([k]) => k !== 'cap_dubbing').map(([k, v]) => ({ value: k, label: v }))]}
            />
            <Select
              value={priority}
              onChange={setPriorityFilter}
              style={{ width: 110 }}
              options={[
                { value: 'all', label: '全部优先级' },
                { value: 'high', label: '高' },
                { value: 'medium', label: '中' },
                { value: 'low', label: '低' },
              ]}
            />
            {selected.length > 0 && (
              <>
                <span className="hint">已选 {selected.length} 项</span>
                <Button
                  size="small"
                  icon={<RedoOutlined />}
                  onClick={() => {
                    selected.forEach((id) => retry(id));
                    message.success(`已批量重试 ${selected.length} 个任务`);
                    setSelected([]);
                  }}
                >
                  批量重试
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => {
                    modal.confirm({
                      title: `确认取消 ${selected.length} 个任务？`,
                      content: '运行中的任务会被中断，已完成的部分结果将保留。',
                      onOk: () => {
                        selected.forEach((id) => cancel(id));
                        message.success('已取消');
                        setSelected([]);
                      },
                    });
                  }}
                >
                  批量取消
                </Button>
              </>
            )}
            <span className="hint" style={{ marginLeft: 'auto' }}>
              共 {list.length} 条 · 每 0.9 秒自动刷新
            </span>
          </div>

          <Table<Task>
            rowKey="id"
            size="middle"
            dataSource={list}
            rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as string[]) }}
            onRow={(r) => ({ onClick: () => nav(`/tasks/${r.id}`), style: { cursor: 'pointer' } })}
            pagination={{ pageSize: 12, size: 'small', showSizeChanger: true }}
            columns={[
              {
                title: '任务',
                width: 300,
                render: (_, r) => (
                  <div>
                    <div style={{ fontSize: 12.8 }}>{r.name}</div>
                    <div className="hint mono" style={{ fontSize: 10.5 }}>{r.id}</div>
                  </div>
                ),
              },
              { title: '能力', dataIndex: 'capability', width: 100, render: (v) => <span style={{ fontSize: 12 }}>{CAP_NAMES[v as keyof typeof CAP_NAMES]}</span> },
              { title: '状态', dataIndex: 'status', width: 90, render: (v: TaskStatus) => <StatusBadge status={v} /> },
              {
                title: '进度',
                width: 150,
                render: (_, r) => (
                  <div>
                    <Progress
                      percent={r.progress}
                      size="small"
                      showInfo={false}
                      strokeColor={r.status === 'failed' ? '#F87171' : r.status === 'succeeded' ? '#34D399' : '#5B6CFF'}
                    />
                    <div className="hint" style={{ fontSize: 10.5 }}>{r.stage}</div>
                  </div>
                ),
              },
              {
                title: '优先级',
                width: 96,
                render: (_, r) => (
                  <Select
                    size="small"
                    variant="borderless"
                    value={r.priority}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(v) => {
                      changePriority(r.id, v as Priority);
                      message.success('优先级已更新');
                    }}
                    style={{ width: 78 }}
                    options={[
                      { value: 'high', label: <Tag color="red" style={{ marginInlineEnd: 0 }}>高</Tag> },
                      { value: 'medium', label: <Tag color="orange" style={{ marginInlineEnd: 0 }}>中</Tag> },
                      { value: 'low', label: <Tag style={{ marginInlineEnd: 0 }}>低</Tag> },
                    ]}
                  />
                ),
              },
              { title: '创建人', width: 80, render: (_, r) => USERS.find((u) => u.id === r.createdBy)?.name },
              { title: '创建时间', width: 110, render: (_, r) => <span className="hint">{fmtDateTime(r.createdAt).slice(5)}</span> },
              { title: '耗时', width: 86, render: (_, r) => <span className="hint">{r.durationMs ? fmtDuration(r.durationMs / 1000) : '—'}</span> },
              {
                title: '',
                width: 92,
                render: (_, r) => (
                  <div className="row" style={{ gap: 2 }} onClick={(e) => e.stopPropagation()}>
                    {(r.status === 'failed' || r.status === 'canceled') && (
                      <Button size="small" type="text" icon={<RedoOutlined />} onClick={() => doRetry(r)} />
                    )}
                    {(r.status === 'running' || r.status === 'queued') && (
                      <Button size="small" type="text" danger icon={<StopOutlined />} onClick={() => cancel(r.id)} />
                    )}
                    <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => message.success('参数已复制到剪贴板')} />
                  </div>
                ),
              },
            ]}
          />
        </Panel>

        <div className="col" style={{ gap: 14 }}>
          <Panel title="队列概览" extra={<span className="hint">4 节点</span>}>
            <div className="col" style={{ gap: 10 }}>
              {GPU_NODES.map((n) => (
                <div key={n.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 9 }}>
                  <div className="row between" style={{ fontSize: 12 }}>
                    <span>{n.id}</span>
                    <span className="hint">{n.mem}</span>
                  </div>
                  <Progress percent={n.progress} size="small" showInfo={false} strokeColor={n.progress ? '#22D3EE' : '#2F3949'} />
                  <div className="hint" style={{ fontSize: 10.5 }}>{n.task}</div>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="row between" style={{ fontSize: 12.5 }}>
              <span className="text-sec">排队长度</span>
              <span>{counts.queued || 0} 个</span>
            </div>
            <div className="row between" style={{ fontSize: 12.5, marginTop: 4 }}>
              <span className="text-sec">预计等待</span>
              <span>4 分 20 秒</span>
            </div>
          </Panel>

          <Panel title="失败归因" extra={<a onClick={() => setTab('failed')}>查看失败</a>}>
            {[
              { code: 'E5003 显存不足', n: 4, p: 40 },
              { code: 'E4102 素材损坏', n: 3, p: 30 },
              { code: 'E5021 推理超时', n: 2, p: 20 },
              { code: 'E3305 对齐失败', n: 1, p: 10 },
            ].map((e) => (
              <div key={e.code} style={{ marginBottom: 8 }}>
                <div className="row between" style={{ fontSize: 11.5 }}>
                  <span>{e.code}</span>
                  <span className="hint">{e.n} 个</span>
                </div>
                <Progress percent={e.p} size="small" showInfo={false} strokeColor="#F87171" />
              </div>
            ))}
          </Panel>

          <Panel title="今日统计">
            <div className="col" style={{ gap: 6, fontSize: 12.5 }}>
              <div className="row between">
                <span className="text-sec">今日新建</span>
                <span>{tasks.filter((t) => t.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length}</span>
              </div>
              <div className="row between">
                <span className="text-sec">成功</span>
                <span>{counts.succeeded || 0}</span>
              </div>
              <div className="row between">
                <span className="text-sec">失败</span>
                <span>{counts.failed || 0}</span>
              </div>
              <div className="row between">
                <span className="text-sec">最近更新</span>
                <span className="hint">{fmtRelative(new Date().toISOString())}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
