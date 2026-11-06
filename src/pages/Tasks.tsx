import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Drawer, Input, Progress, Segmented, Select, Space, Table, Tag, Timeline, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { workTaskService } from '../services';
import type { WorkTask } from '../types/models';
import { PRIORITY_LABEL, TASK_STATUS_COLOR, TASK_STATUS_LABEL } from '../constants/dict';
import { PageHeader, Panel, StatusTag } from '../components/ui';
import { fmtDate, fmtDateTime } from '../utils/format';

const COLUMNS: WorkTask['status'][] = ['TODO', 'DOING', 'REVIEW', 'DONE'];

const PRIORITY_COLOR: Record<string, string> = { P0: 'red', P1: 'orange', P2: 'default' };

export default function Tasks() {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'kanban'>('kanban');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [detail, setDetail] = useState<WorkTask | null>(null);
  const [comment, setComment] = useState('');

  const load = () => {
    setLoading(true);
    workTaskService.list().then(setTasks).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (!keyword || t.title.includes(keyword) || t.code.includes(keyword)) &&
          (!status || t.status === status),
      ),
    [tasks, keyword, status],
  );

  const move = async (taskId: string, next: WorkTask['status']) => {
    await workTaskService.setStatus(taskId, next);
    message.success(`任务已移动至「${TASK_STATUS_LABEL[next]}」`);
    load();
  };

  const columns: ColumnsType<WorkTask> = [
    { title: '任务号', dataIndex: 'code', width: 136, render: (v: string) => <span className="mono small">{v}</span> },
    { title: '任务名称', dataIndex: 'title', width: 260, render: (v: string, r) => <a onClick={() => setDetail(r)}>{v}</a> },
    { title: '设备', dataIndex: 'deviceCode', width: 130 },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 86,
      render: (v: string) => <Tag bordered={false} color={PRIORITY_COLOR[v]}>{PRIORITY_LABEL[v as 'P0']}</Tag>,
    },
    { title: '负责人', dataIndex: 'owner', width: 90 },
    { title: '计划时间', dataIndex: 'plannedStart', width: 110, render: (v: string) => fmtDate(v) },
    { title: '进度', dataIndex: 'progress', width: 130, render: (v: number) => <Progress percent={v} size="small" /> },
    { title: '状态', dataIndex: 'status', width: 92, render: (v: WorkTask['status']) => <StatusTag text={TASK_STATUS_LABEL[v]} color={TASK_STATUS_COLOR[v]} /> },
    { title: '操作', width: 90, fixed: 'right', render: (_, r) => <Button type="link" size="small" onClick={() => setDetail(r)}>详情</Button> },
  ];

  return (
    <div className="page">
      <PageHeader
        title="任务与工单"
        description="标定、试验、研究任务的全流程跟踪，支持看板拖拽与执行记录留痕"
        extra={
          <>
            <Segmented value={view} onChange={(v) => setView(v as 'table' | 'kanban')} options={[{ value: 'kanban', label: '看板' }, { value: 'table', label: '列表' }]} />
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('新建任务表单已打开（演示）')}>新建任务</Button>
          </>
        }
      />

      <Panel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Input.Search placeholder="任务号 / 名称" allowClear style={{ width: 240 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Select allowClear placeholder="任务状态" style={{ width: 150 }} value={status} onChange={setStatus} options={Object.entries(TASK_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
          <div style={{ flex: 1 }} />
          <span className="small muted" style={{ lineHeight: '32px' }}>
            共 {filtered.length} 项 · 进行中 {tasks.filter((t) => t.status === 'DOING').length} 项 · 待审核 {tasks.filter((t) => t.status === 'REVIEW').length} 项
          </span>
        </div>
      </Panel>

      {view === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {COLUMNS.map((col) => (
            <div
              key={col}
              className="panel"
              style={{ minHeight: 420, padding: 12, background: '#fafbfd' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const taskId = e.dataTransfer.getData('text/plain');
                if (taskId) move(taskId, col);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  <span className="tag-dot" style={{ background: col === 'DOING' ? '#1677ff' : col === 'REVIEW' ? '#faad14' : col === 'DONE' ? '#16a34a' : '#bfbfbf' }} />
                  {TASK_STATUS_LABEL[col]}
                </div>
                <span className="small muted">{filtered.filter((t) => t.status === col).length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered
                  .filter((t) => t.status === col)
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                      onClick={() => setDetail(task)}
                      style={{ background: '#fff', border: '1px solid #e5e9f0', borderRadius: 6, padding: 12, cursor: 'grab' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span className="mono small muted">{task.code}</span>
                        <Tag bordered={false} color={PRIORITY_COLOR[task.priority]} style={{ marginInlineEnd: 0 }}>{PRIORITY_LABEL[task.priority]}</Tag>
                      </div>
                      <div style={{ fontSize: 13, margin: '6px 0', lineHeight: 1.5 }}>{task.title}</div>
                      <div className="small muted">{task.deviceCode}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <Progress percent={task.progress} size="small" showInfo={false} style={{ flex: 1 }} />
                        <span className="small muted num">{task.progress}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <span className="small muted">{fmtDate(task.plannedEnd)}</span>
                        <Avatar size={20} style={{ background: '#1668dc', fontSize: 10 }}>{task.owner.slice(0, 1)}</Avatar>
                      </div>
                    </div>
                  ))}
                {!filtered.filter((t) => t.status === col).length ? (
                  <div className="small muted" style={{ textAlign: 'center', padding: '30px 0', border: '1px dashed #e5e9f0', borderRadius: 6 }}>
                    拖拽任务到此列
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Panel flush>
          <Table
            rowKey="id"
            size="middle"
            loading={loading}
            columns={columns}
            dataSource={filtered}
            scroll={{ x: 1300 }}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          />
        </Panel>
      )}

      <Panel title="我的待办" sub="当前用户 · 张启明">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
          {tasks.filter((t) => t.owner === '张启明' && t.status !== 'DONE').slice(0, 4).map((task) => (
            <div key={task.id} style={{ border: '1px solid #eef2f7', borderRadius: 6, padding: 12, cursor: 'pointer' }} onClick={() => setDetail(task)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="small muted mono">{task.code}</span>
                <StatusTag text={TASK_STATUS_LABEL[task.status]} color={TASK_STATUS_COLOR[task.status]} />
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>{task.title}</div>
              <div className="small muted" style={{ marginTop: 4 }}>截止 {fmtDate(task.plannedEnd)} · 进度 {task.progress}%</div>
            </div>
          ))}
        </div>
      </Panel>

      <Drawer
        title={detail ? `${detail.code} · ${detail.title}` : ''}
        width={520}
        open={!!detail}
        onClose={() => setDetail(null)}
        extra={
          detail ? (
            <Space>
              <Button size="small" onClick={() => move(detail.id, 'DOING')}>开始</Button>
              <Button size="small" onClick={() => move(detail.id, 'REVIEW')}>提交审核</Button>
              <Button size="small" type="primary" onClick={() => move(detail.id, 'DONE')}>完成</Button>
            </Space>
          ) : null
        }
      >
        {detail ? (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <StatusTag text={TASK_STATUS_LABEL[detail.status]} color={TASK_STATUS_COLOR[detail.status]} />
              <Tag bordered={false} color={PRIORITY_COLOR[detail.priority]}>{PRIORITY_LABEL[detail.priority]}</Tag>
              <Tag bordered={false}>{detail.deviceCode}</Tag>
            </div>
            <div className="kv" style={{ marginBottom: 16 }}>
              <dt>负责人</dt><dd>{detail.owner}</dd>
              <dt>参与人</dt><dd>{detail.participants.join('、')}</dd>
              <dt>计划开始</dt><dd>{fmtDateTime(detail.plannedStart)}</dd>
              <dt>计划结束</dt><dd>{fmtDateTime(detail.plannedEnd)}</dd>
              <dt>实际开始</dt><dd>{detail.actualStart ? fmtDateTime(detail.actualStart) : '—'}</dd>
              <dt>进度</dt><dd><Progress percent={detail.progress} size="small" style={{ width: 180 }} /></dd>
            </div>
            <div className="small muted" style={{ marginBottom: 16 }}>{detail.description}</div>

            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>执行记录</div>
            <Timeline
              items={detail.logs.map((log) => ({
                children: (
                  <div>
                    <div style={{ fontSize: 13 }}>{log.action}</div>
                    <div className="small muted">{log.user} · {fmtDateTime(log.time)}</div>
                  </div>
                ),
              }))}
            />

            <div style={{ fontSize: 13, fontWeight: 500, margin: '16px 0 8px' }}>评论（{detail.comments.length}）</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input.TextArea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="补充执行情况，如：第三位置已复测通过" />
              <Button
                type="primary"
                onClick={async () => {
                  if (comment.trim().length < 2) {
                    message.warning('请输入评论内容');
                    return;
                  }
                  await workTaskService.comment(detail.id, comment.trim());
                  const updated = await workTaskService.detail(detail.id);
                  if (updated) setDetail(updated);
                  setComment('');
                  message.success('评论已提交');
                  load();
                }}
              >
                提交
              </Button>
            </div>
            <div style={{ marginTop: 10 }}>
              {detail.comments.map((c) => (
                <div key={c.time + c.content} style={{ padding: '8px 0', borderBottom: '1px dashed #eef2f7' }}>
                  <div style={{ fontSize: 13 }}>{c.content}</div>
                  <div className="small muted">{c.user} · {fmtDateTime(c.time)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
