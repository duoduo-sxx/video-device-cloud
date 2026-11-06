import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import StatusTag from '../../components/StatusTag';
import EmptyState from '../../components/EmptyState';
import { taskService } from '../../services';
import type { Priority, TaskStatus, TransferTask } from '../../types';
import { TASK_STATUS_META } from '../../mock/tasks';
import { CHANNELS, regionShort } from '../../mock/base';
import { downloadCsv, formatBytes, formatShortTime, formatSpeed } from '../../utils/format';
import { toast } from '../../utils/feedback';

const PAGE_SIZE_OPTIONS = ['10', '20', '50'];

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: '高', color: '#EF4444' },
  medium: { label: '中', color: '#1668FF' },
  low: { label: '低', color: '#8A99B0' },
};

interface Filters {
  keyword: string;
  status: TaskStatus[];
  priority?: Priority;
  channelId?: string;
  range: '24h' | '7d' | '30d' | 'all';
}

const EMPTY_FILTERS: Filters = { keyword: '', status: [], range: 'all' };

export default function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TransferTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<React.Key[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [visibleCols, setVisibleCols] = useState<string[]>([
    'progress',
    'size',
    'speed',
    'route',
    'channel',
    'priority',
  ]);

  const load = async () => {
    const data = await taskService.list();
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    const windowMs =
      applied.range === '24h' ? 24 * 3600 * 1000 : applied.range === '7d' ? 7 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000;
    return tasks.filter((t) => {
      if (applied.keyword) {
        const kw = applied.keyword.toLowerCase();
        if (!t.name.toLowerCase().includes(kw) && !t.id.toLowerCase().includes(kw)) return false;
      }
      if (applied.status.length && !applied.status.includes(t.status)) return false;
      if (applied.priority && t.priority !== applied.priority) return false;
      if (applied.channelId && t.channelId !== applied.channelId) return false;
      if (applied.range !== 'all' && now - new Date(t.createdAt).getTime() > windowMs) return false;
      return true;
    });
  }, [tasks, applied]);

  const refresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    await load();
  };

  const changeStatus = async (id: string, status: TaskStatus, label: string) => {
    await taskService.setStatus(id, status);
    await load();
    toast.success(`任务已${label}`);
  };

  const batch = async (status: TaskStatus, label: string) => {
    if (!selected.length) return;
    const count = await taskService.batchStatus(selected.map(String), status);
    setSelected([]);
    await load();
    toast.success(`已${label} ${count} 个任务`);
  };

  const removeSelected = () => {
    if (!selected.length) return;
    Modal.confirm({
      title: `删除 ${selected.length} 个任务？`,
      content: '删除后任务记录与传输日志将无法恢复，已传输数据不受影响。',
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await taskService.remove(selected.map(String));
        setSelected([]);
        await load();
        toast.success('已删除选中任务');
      },
    });
  };

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ['任务ID', '任务名称', '状态', '进度', '数据量', '速率', '源节点', '目标节点', '通道', '创建时间'],
      ...filtered.map((t) => [
        t.id,
        t.name,
        TASK_STATUS_META[t.status].label,
        `${t.progress}%`,
        formatBytes(t.totalSize),
        formatSpeed(t.speedBps),
        t.source.nodeName,
        t.target.nodeName,
        t.channelName,
        formatShortTime(t.createdAt),
      ]),
    ];
    downloadCsv(`传输任务_${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('CSV 已开始下载');
  };

  const columns: ColumnsType<TransferTask> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      width: 250,
      fixed: 'left',
      render: (_, r) => (
        <div className="stack">
          <span className="link" style={{ fontWeight: 500 }} onClick={() => navigate(`/tasks/${r.id}`)}>
            {r.name}
          </span>
          <span style={{ fontSize: 11, color: '#8A99B0' }} className="mono">
            {r.id}
          </span>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      filters: Object.entries(TASK_STATUS_META).map(([value, meta]) => ({ text: meta.label, value })),
      onFilter: (value, record) => record.status === value,
      render: (s: TaskStatus) => <StatusTag status={s} />,
    },
    ...(visibleCols.includes('progress')
      ? [
          {
            title: '进度',
            dataIndex: 'progress',
            width: 148,
            sorter: (a: TransferTask, b: TransferTask) => a.progress - b.progress,
            render: (_: unknown, r: TransferTask) => (
              <Progress
                percent={r.progress}
                size="small"
                status={r.status === 'failed' ? 'exception' : r.status === 'success' ? 'success' : 'active'}
                strokeColor={r.status === 'paused' ? '#F59E0B' : r.status === 'success' ? '#00B894' : '#1668FF'}
                trailColor="#EEF2F8"
                format={(p) => <span style={{ fontSize: 11, color: '#5A6B87' }}>{p}%</span>}
              />
            ),
          },
        ]
      : []),
    ...(visibleCols.includes('size')
      ? [
          {
            title: '数据量',
            dataIndex: 'totalSize',
            width: 140,
            sorter: (a: TransferTask, b: TransferTask) => a.totalSize - b.totalSize,
            render: (_: unknown, r: TransferTask) => (
              <div className="stack">
                <span className="num" style={{ fontSize: 12.5 }}>
                  {formatBytes(r.transferredSize)}
                </span>
                <span className="num" style={{ fontSize: 11, color: '#8A99B0' }}>
                  / {formatBytes(r.totalSize)}
                </span>
              </div>
            ),
          },
        ]
      : []),
    ...(visibleCols.includes('speed')
      ? [
          {
            title: '速率',
            dataIndex: 'speedBps',
            width: 104,
            render: (v: number) => <span className="num" style={{ fontSize: 12.5 }}>{formatSpeed(v)}</span>,
          },
        ]
      : []),
    ...(visibleCols.includes('route')
      ? [
          {
            title: '源 → 目标',
            key: 'route',
            width: 196,
            render: (_: unknown, r: TransferTask) => (
              <div className="stack">
                <span style={{ fontSize: 12.5 }}>
                  {r.source.nodeName} <span style={{ color: '#B0BCCD' }}>→</span> {r.target.nodeName}
                </span>
                <span style={{ fontSize: 11, color: '#8A99B0' }}>
                  {regionShort(r.source.region)} · {regionShort(r.target.region)}
                </span>
              </div>
            ),
          },
        ]
      : []),
    ...(visibleCols.includes('channel')
      ? [
          {
            title: '通道',
            dataIndex: 'channelName',
            width: 168,
            render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span>,
          },
        ]
      : []),
    ...(visibleCols.includes('priority')
      ? [
          {
            title: '优先级',
            dataIndex: 'priority',
            width: 84,
            render: (p: Priority) => (
              <Tag
                style={{
                  color: PRIORITY_META[p].color,
                  background: `${PRIORITY_META[p].color}14`,
                  borderColor: `${PRIORITY_META[p].color}33`,
                  marginInlineEnd: 0,
                }}
              >
                {PRIORITY_META[p].label}
              </Tag>
            ),
          },
        ]
      : []),
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 118,
      sorter: (a, b) => (a.createdAt < b.createdAt ? -1 : 1),
      render: (v: string) => <span style={{ fontSize: 12, color: '#5A6B87' }}>{formatShortTime(v)}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: unknown, r: TransferTask) => (
        <Space size={4}>
          <span className="link" style={{ fontSize: 12.5 }} onClick={() => navigate(`/tasks/${r.id}`)}>
            详情
          </span>
          {r.status === 'running' ? (
            <Tooltip title="暂停">
              <span className="link" onClick={() => changeStatus(r.id, 'paused', '暂停')}>
                <PauseCircleOutlined />
              </span>
            </Tooltip>
          ) : null}
          {r.status === 'paused' || r.status === 'failed' ? (
            <Tooltip title={r.status === 'failed' ? '重试' : '恢复'}>
              <span
                className="link"
                onClick={() =>
                  changeStatus(r.id, 'running', r.status === 'failed' ? '重新投递' : '恢复')
                }
              >
                {r.status === 'failed' ? <RedoOutlined /> : <PlayCircleOutlined />}
              </span>
            </Tooltip>
          ) : null}
          <Tooltip title="取消">
            <span
              className="link"
              style={{ color: '#8A99B0' }}
              onClick={() =>
                Modal.confirm({
                  title: '取消该任务？',
                  content: '已传输的分片会保留，可稍后重新投递。',
                  okText: '确认取消',
                  cancelText: '再想想',
                  onOk: () => changeStatus(r.id, 'canceled', '取消'),
                })
              }
            >
              <DeleteOutlined />
            </span>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const columnMenu = {
    items: [
      {
        key: 'cols',
        label: (
          <div style={{ padding: '4px 2px', minWidth: 140 }} onClick={(e) => e.stopPropagation()}>
            {[
              { key: 'progress', label: '进度' },
              { key: 'size', label: '数据量' },
              { key: 'speed', label: '速率' },
              { key: 'route', label: '源 → 目标' },
              { key: 'channel', label: '通道' },
              { key: 'priority', label: '优先级' },
            ].map((c) => (
              <div key={c.key} style={{ padding: '5px 0' }}>
                <Checkbox
                  checked={visibleCols.includes(c.key)}
                  onChange={(e) =>
                    setVisibleCols((prev) =>
                      e.target.checked ? [...prev, c.key] : prev.filter((k) => k !== c.key),
                    )
                  }
                >
                  {c.label}
                </Checkbox>
              </div>
            ))}
          </div>
        ),
      },
    ],
  };

  return (
    <div className="page">
      <PageHeader
        title="传输任务"
        description="管理所有跨节点数据流转作业，支持批量调度、失败重试与全链路追踪"
        extra={
          <>
            <Button icon={<DownloadOutlined />} onClick={exportCsv}>
              导出
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tasks/new')}>
              新建任务
            </Button>
          </>
        }
      />

      <div className="filter-bar">
        <Space wrap size={[12, 12]} style={{ paddingBottom: 12 }}>
          <Input
            allowClear
            placeholder="搜索任务名称或 ID"
            style={{ width: 240 }}
            value={draft.keyword}
            onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="任务状态"
            style={{ minWidth: 200 }}
            value={draft.status}
            onChange={(v) => setDraft({ ...draft, status: v })}
            options={Object.entries(TASK_STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))}
            maxTagCount="responsive"
          />
          <Select
            allowClear
            placeholder="优先级"
            style={{ width: 110 }}
            value={draft.priority}
            onChange={(v) => setDraft({ ...draft, priority: v })}
            options={[
              { value: 'high', label: '高' },
              { value: 'medium', label: '中' },
              { value: 'low', label: '低' },
            ]}
          />
          <Select
            allowClear
            placeholder="数据通道"
            style={{ width: 200 }}
            value={draft.channelId}
            onChange={(v) => setDraft({ ...draft, channelId: v })}
            options={CHANNELS.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            style={{ width: 130 }}
            value={draft.range}
            onChange={(v) => setDraft({ ...draft, range: v })}
            options={[
              { value: 'all', label: '全部时间' },
              { value: '24h', label: '近 24 小时' },
              { value: '7d', label: '近 7 天' },
              { value: '30d', label: '近 30 天' },
            ]}
          />
          <Button
            onClick={() => {
              setDraft(EMPTY_FILTERS);
              setApplied(EMPTY_FILTERS);
            }}
          >
            重置
          </Button>
          <Button type="primary" ghost onClick={() => setApplied(draft)}>
            查询
          </Button>
        </Space>
      </div>

      <div className="panel flush">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEF2F8' }} className="toolbar">
          <Button
            icon={<PlayCircleOutlined />}
            disabled={!selected.length}
            onClick={() => batch('running', '启动')}
          >
            开始
          </Button>
          <Button
            icon={<PauseCircleOutlined />}
            disabled={!selected.length}
            onClick={() => batch('paused', '暂停')}
          >
            暂停
          </Button>
          <Button disabled={!selected.length} onClick={() => batch('canceled', '取消')}>
            取消
          </Button>
          <Button danger icon={<DeleteOutlined />} disabled={!selected.length} onClick={removeSelected}>
            删除
          </Button>
          <span style={{ fontSize: 12.5, color: '#8A99B0' }}>
            已选 {selected.length} 项 · 共 {filtered.length} 条
          </span>
          <div className="toolbar-right">
            <Dropdown menu={columnMenu} trigger={['click']} placement="bottomRight">
              <Button icon={<SettingOutlined />}>
                列设置 <DownOutlined style={{ fontSize: 9 }} />
              </Button>
            </Dropdown>
            <Button icon={<ReloadOutlined spin={loading} />} onClick={refresh}>
              刷新
            </Button>
          </div>
        </div>

        <Table<TransferTask>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1320 }}
          rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (total) => `共 ${total} 条任务`,
            onChange: (_, size) => setPageSize(size),
          }}
          locale={{
            emptyText: (
              <EmptyState
                title="暂无符合条件的任务"
                description="调整筛选条件，或创建一个新的传输任务"
                action={
                  <Button type="primary" onClick={() => navigate('/tasks/new')}>
                    新建任务
                  </Button>
                }
              />
            ),
          }}
        />
      </div>
    </div>
  );
}
