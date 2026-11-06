import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Dropdown,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  message,
  type TableColumnsType,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  MoreOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RedoOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { PageHeader, StatusTag } from '../../components/base';
import TableToolbar, { useColumnSetting } from '../../components/TableToolbar';
import AuthGuard, { canWrite } from '../../components/AuthGuard';
import { useDataStore } from '../../store/dataStore';
import { useUiStore } from '../../store/uiStore';
import { JOB_STATUS, PRIORITY, REGIONS, STORAGE_TYPE } from '../../constants/dict';
import type { TransferJob } from '../../types';
import { exportCsv, fmtBytes, fmtDuration, fmtShortTime, fmtSpeed } from '../../utils/format';

export default function JobList() {
  const navigate = useNavigate();
  const jobs = useDataStore((s) => s.jobs);
  const updateJobs = useDataStore((s) => s.updateJobs);
  const removeJobs = useDataStore((s) => s.removeJobs);
  const role = useUiStore((s) => s.role);

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string[]>([]);
  const [priority, setPriority] = useState<string | undefined>();
  const [srcRegion, setSrcRegion] = useState<string | undefined>();
  const [dstRegion, setDstRegion] = useState<string | undefined>();
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState('');

  const filtered = useMemo(
    () =>
      jobs.filter((j) => {
        if (keyword && !j.name.includes(keyword) && !j.id.toLowerCase().includes(keyword.toLowerCase())) return false;
        if (status.length && !status.includes(j.status)) return false;
        if (priority && j.priority !== priority) return false;
        if (srcRegion && j.source.region !== srcRegion) return false;
        if (dstRegion && j.target.region !== dstRegion) return false;
        return true;
      }),
    [jobs, keyword, status, priority, srcRegion, dstRegion],
  );

  const counts = useMemo(() => {
    const c = { running: 0, queued: 0, failed: 0 };
    jobs.forEach((j) => {
      if (j.status === 'running') c.running += 1;
      if (j.status === 'queued') c.queued += 1;
      if (j.status === 'failed') c.failed += 1;
    });
    return c;
  }, [jobs]);

  const act = (id: string, patch: Partial<TransferJob>, text: string) => {
    updateJobs([id], patch);
    message.success(text);
  };

  const batch = (patch: Partial<TransferJob>, text: string) => {
    updateJobs(selected, patch);
    message.success(`${text}（${selected.length} 个任务）`);
    setSelected([]);
  };

  const columns: TableColumnsType<TransferJob> = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 168,
      render: (v: string) => <span className="mono">{v}</span>,
    },
    {
      title: '任务名称',
      key: 'name',
      width: 300,
      render: (_, r) => (
        <div style={{ minWidth: 0 }}>
          <div className="link-text ellipsis" onClick={() => navigate(`/jobs/${r.id}`)}>
            {r.name}
          </div>
          <div className="muted ellipsis" style={{ marginTop: 2 }}>
            {r.source.storageType} → {r.target.storageType} · {r.owner}
          </div>
        </div>
      ),
    },
    {
      title: '源端',
      key: 'source',
      width: 190,
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13 }}>{r.source.region}</div>
          <div style={{ marginTop: 2 }}>
            <Tag bordered={false} color={STORAGE_TYPE[r.source.storageType].color} style={{ fontSize: 11 }}>
              {r.source.storageType}
            </Tag>
            <span className="muted">{r.source.provider}</span>
          </div>
        </div>
      ),
    },
    {
      title: '目标端',
      key: 'target',
      width: 190,
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13 }}>{r.target.region}</div>
          <div style={{ marginTop: 2 }}>
            <Tag bordered={false} color={STORAGE_TYPE[r.target.storageType].color} style={{ fontSize: 11 }}>
              {r.target.storageType}
            </Tag>
            <span className="muted">{r.target.provider}</span>
          </div>
        </div>
      ),
    },
    {
      title: '数据量',
      dataIndex: 'totalBytes',
      key: 'totalBytes',
      width: 104,
      sorter: (a, b) => a.totalBytes - b.totalBytes,
      render: (v: number, r) => (
        <div>
          <div>{fmtBytes(v)}</div>
          <div className="muted">{r.fileCount.toLocaleString()} 文件</div>
        </div>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 82,
      render: (v: TransferJob['priority']) => (
        <span style={{ color: PRIORITY[v].color, fontWeight: 600, fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 104,
      render: (v: TransferJob['status']) => <StatusTag {...JOB_STATUS[v]} />,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 160,
      sorter: (a, b) => a.progress - b.progress,
      render: (v: number, r) => (
        <div>
          <Progress
            percent={Number(v.toFixed(1))}
            size="small"
            status={r.status === 'failed' ? 'exception' : r.status === 'success' ? 'success' : 'active'}
            strokeColor={r.status === 'paused' ? '#94A3B8' : undefined}
            showInfo={false}
            style={{ margin: 0 }}
          />
          <div className="muted" style={{ marginTop: 2 }}>
            {v.toFixed(1)}% · {fmtBytes(r.transferredBytes)}
          </div>
        </div>
      ),
    },
    {
      title: '实时速率',
      dataIndex: 'speedBps',
      key: 'speedBps',
      width: 104,
      render: (v: number) => <span style={{ fontSize: 13 }}>{fmtSpeed(v)}</span>,
    },
    {
      title: '开始时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 116,
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
      render: (v: string) => <span className="muted">{fmtShortTime(v)}</span>,
    },
    {
      title: 'ETA',
      dataIndex: 'etaSeconds',
      key: 'etaSeconds',
      width: 96,
      render: (v: number, r) =>
        r.status === 'running' ? <span>{fmtDuration(v)}</span> : <span className="muted">—</span>,
    },
    {
      title: '策略',
      key: 'policy',
      width: 130,
      render: (_, r) => (
        <span className="chip" title={r.policyIds.join('、')}>
          {r.policyIds.length ? `${r.policyIds.length} 条策略` : '未绑定'}
        </span>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'owner',
      key: 'owner',
      width: 88,
    },
    {
      title: '操作',
      key: 'action',
      width: 132,
      fixed: 'right',
      render: (_, r) => {
        const writable = canWrite(role);
        return (
          <Space size={0}>
            <Button type="link" size="small" style={{ paddingInline: 4 }} onClick={() => navigate(`/jobs/${r.id}`)}>
              详情
            </Button>
            {writable && (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    r.status === 'running'
                      ? { key: 'pause', icon: <PauseCircleOutlined />, label: '暂停' }
                      : { key: 'resume', icon: <PlayCircleOutlined />, label: '恢复' },
                    { key: 'retry', icon: <RedoOutlined />, label: '重试' },
                    { key: 'clone', icon: <CopyOutlined />, label: '克隆' },
                    { type: 'divider' },
                    { key: 'cancel', icon: <StopOutlined />, label: '取消任务', danger: true },
                    { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
                  ],
                  onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation();
                    if (key === 'pause') act(r.id, { status: 'paused', speedBps: 0 }, '任务已暂停');
                    if (key === 'resume') act(r.id, { status: 'running' }, '任务已恢复传输');
                    if (key === 'retry') {
                      act(r.id, { status: 'retrying' }, '已提交重试');
                      setTimeout(() => updateJobs([r.id], { status: 'running', retryCount: r.retryCount + 1 }), 1500);
                    }
                    if (key === 'clone') {
                      const clone: TransferJob = {
                        ...r,
                        id: `JOB-20261019-${String(1043 + Math.floor(Math.random() * 60)).padStart(4, '0')}`,
                        name: `${r.name}（副本）`,
                        status: 'queued',
                        progress: 0,
                        transferredBytes: 0,
                        speedBps: 0,
                        etaSeconds: 0,
                        createdAt: new Date().toISOString(),
                        finishedAt: undefined,
                      };
                      useDataStore.getState().addJob(clone);
                      message.success('已克隆任务并加入队列');
                    }
                    if (key === 'cancel') act(r.id, { status: 'canceled', speedBps: 0 }, '任务已取消');
                    if (key === 'delete') {
                      setDeleteIds([r.id]);
                      setConfirmText('');
                    }
                  },
                }}
              >
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];

  const { columns: visibleColumns, node: columnSetting } = useColumnSetting(columns);

  const exportRows = filtered.map((j) => ({
    任务ID: j.id,
    任务名称: j.name,
    源区域: j.source.region,
    目标区域: j.target.region,
    数据量: fmtBytes(j.totalBytes),
    文件数: j.fileCount,
    优先级: j.priority,
    状态: JOB_STATUS[j.status].label,
    进度: `${j.progress}%`,
    速率: fmtSpeed(j.speedBps),
    创建时间: fmtShortTime(j.createdAt),
    创建人: j.owner,
  }));

  return (
    <div>
      <PageHeader
        title="传输任务"
        desc="统一编排跨云、跨域与边缘到中心的数据传输任务"
        actions={
          <AuthGuard>
            <Button icon={<DownloadOutlined />} onClick={() => exportCsv('传输任务.csv', exportRows)}>
              导出
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/jobs/new')}>
              新建传输任务
            </Button>
          </AuthGuard>
        }
      />

      <div className="cf-card" style={{ padding: 16 }}>
        <div className="table-stat-bar">
          <span>共 <b>{jobs.length}</b> 个任务</span>
          <span>运行中 <b className="blue-text">{counts.running}</b></span>
          <span>排队 <b className="warning-text">{counts.queued}</b></span>
          <span>失败 <b className="danger-text">{counts.failed}</b></span>
          <span>今日累计 <b>12.86 TB</b></span>
        </div>

        <TableToolbar
          search={keyword}
          onSearch={setKeyword}
          placeholder="搜索任务名称或任务ID"
          filters={
            <>
              <Select
                mode="multiple"
                allowClear
                placeholder="状态"
                style={{ minWidth: 168 }}
                value={status}
                onChange={setStatus}
                maxTagCount="responsive"
                options={Object.entries(JOB_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
              />
              <Select
                allowClear
                placeholder="优先级"
                style={{ width: 110 }}
                value={priority}
                onChange={setPriority}
                options={Object.keys(PRIORITY).map((k) => ({ value: k, label: k }))}
              />
              <Select
                allowClear
                showSearch
                placeholder="源区域"
                style={{ width: 150 }}
                value={srcRegion}
                onChange={setSrcRegion}
                options={REGIONS.map((r) => ({ value: r, label: r }))}
              />
              <Select
                allowClear
                showSearch
                placeholder="目标区域"
                style={{ width: 150 }}
                value={dstRegion}
                onChange={setDstRegion}
                options={REGIONS.map((r) => ({ value: r, label: r }))}
              />
            </>
          }
          extra={columnSetting}
          exportRows={exportRows}
          exportName="传输任务.csv"
          onRefresh={() => message.success('列表已刷新')}
        />

        {selected.length > 0 && (
          <div
            style={{
              marginBottom: 10,
              padding: '8px 12px',
              background: 'var(--primary-weak)',
              border: '1px solid #2563EB33',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 13 }}>已选 {selected.length} 项</span>
            <Space>
              <Button size="small" icon={<PauseCircleOutlined />} onClick={() => batch({ status: 'paused', speedBps: 0 }, '已批量暂停')}>
                批量暂停
              </Button>
              <Button size="small" icon={<RedoOutlined />} onClick={() => batch({ status: 'retrying' }, '已批量重试')}>
                批量重试
              </Button>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => { setDeleteIds(selected); setConfirmText(''); }}>
                批量删除
              </Button>
            </Space>
          </div>
        )}

        <Table
          className="cf-table"
          rowKey="id"
          size="middle"
          columns={visibleColumns}
          dataSource={filtered}
          scroll={{ x: 1720 }}
          rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as string[]) }}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (t) => `共 ${t} 条` }}
          locale={{ emptyText: <span className="muted">暂无符合条件的任务</span> }}
        />
      </div>

      <Modal
        open={deleteIds.length > 0}
        title="删除传输任务"
        okText="确认删除"
        okButtonProps={{ danger: true, disabled: confirmText !== 'DELETE' }}
        onCancel={() => setDeleteIds([])}
        onOk={() => {
          removeJobs(deleteIds);
          message.success(`已删除 ${deleteIds.length} 个任务`);
          setDeleteIds([]);
          setSelected([]);
        }}
      >
        <p style={{ fontSize: 13 }}>
          删除后任务记录与传输日志将不可恢复，共 <b>{deleteIds.length}</b> 个任务。请输入 <b>DELETE</b> 确认。
        </p>
        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
      </Modal>
    </div>
  );
}
