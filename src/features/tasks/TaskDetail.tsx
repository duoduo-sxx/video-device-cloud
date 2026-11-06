import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App, Button, Progress, Segmented, Tag, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CopyOutlined,
  DownloadOutlined,
  LoadingOutlined,
  RedoOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { PageHeader, Panel, StatusBadge } from '@/components/ui';
import { useTaskStore } from '@/stores/tasks';
import { buildStages, buildLogs } from '@/mock/seed/tasks';
import { CAP_NAMES, ERROR_CODES } from '@/mock/seed/capabilities';
import { USERS } from '@/mock/seed/people';
import { getAsset } from '@/mock/db';
import { fmtBytes, fmtDateTime, fmtDuration } from '@/utils/format';

export default function TaskDetail() {
  const { taskId = '' } = useParams();
  const nav = useNavigate();
  const { message, modal } = App.useApp();
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const retry = useTaskStore((s) => s.retry);
  const cancel = useTaskStore((s) => s.cancel);
  const [speed, setSpeed] = useState<string | number>('实时');
  const [copied, setCopied] = useState(false);

  if (!task) {
    return (
      <div>
        <PageHeader title="任务不存在" subtitle="该任务可能已被清理，或链接已失效。" actions={<Button onClick={() => nav('/tasks')}>返回任务中心</Button>} />
        <Panel>任务 ID：{taskId}</Panel>
      </div>
    );
  }

  const asset = getAsset(task.assetId);
  const stages = buildStages(task);
  const logs = buildLogs(task);
  const errorMeta = ERROR_CODES.find((e) => e.code === task.errorCode);

  return (
    <div>
      <PageHeader
        title={
          <span className="row" style={{ gap: 10 }}>
            <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={() => nav('/tasks')} />
            {task.name}
            <StatusBadge status={task.status} />
          </span>
        }
        subtitle={
          <span className="row" style={{ gap: 10 }}>
            <span className="mono" style={{ fontSize: 12 }}>{task.id}</span>
            <span>·</span>
            <span>{CAP_NAMES[task.capability]}</span>
            <span>·</span>
            <span>{USERS.find((u) => u.id === task.createdBy)?.name} 创建于 {fmtDateTime(task.createdAt)}</span>
            <span>·</span>
            <span>节点 {task.node}</span>
          </span>
        }
        actions={
          <>
            {(task.status === 'failed' || task.status === 'canceled') && (
              <Button type="primary" icon={<RedoOutlined />} onClick={() => { retry(task.id); message.success('任务已重新排队'); }}>
                重试
              </Button>
            )}
            {(task.status === 'running' || task.status === 'queued') && (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={() =>
                  modal.confirm({
                    title: '确认取消该任务？',
                    content: '已完成的阶段结果会保留，未完成部分将丢弃。',
                    okText: '取消任务',
                    okButtonProps: { danger: true },
                    onOk: () => {
                      cancel(task.id);
                      message.success('任务已取消');
                    },
                  })
                }
              >
                取消任务
              </Button>
            )}
            <Button icon={<CopyOutlined />} onClick={() => { setCopied(true); message.success('任务 ID 已复制'); setTimeout(() => setCopied(false), 1500); }}>
              {copied ? '已复制' : '复制 ID'}
            </Button>
          </>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 320px', alignItems: 'start' }}>
        <div className="col" style={{ gap: 14 }}>
          <Panel>
            <div className="row" style={{ gap: 24, alignItems: 'center' }}>
              <Progress
                type="circle"
                percent={task.progress}
                size={112}
                strokeColor={task.status === 'failed' ? '#F87171' : task.status === 'succeeded' ? '#34D399' : '#5B6CFF'}
                format={(p) => (
                  <span style={{ fontSize: 22 }} className="num">
                    {p}
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>%</span>
                  </span>
                )}
              />
              <div className="grow">
                <div className="row" style={{ gap: 20, marginBottom: 10 }}>
                  <div>
                    <div className="hint">当前阶段</div>
                    <div style={{ fontSize: 14 }}>{task.stage}</div>
                  </div>
                  <div>
                    <div className="hint">已耗时</div>
                    <div style={{ fontSize: 14 }}>{task.durationMs ? fmtDuration(task.durationMs / 1000) : '—'}</div>
                  </div>
                  <div>
                    <div className="hint">优先级</div>
                    <div style={{ fontSize: 14 }}>{task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}</div>
                  </div>
                  <div>
                    <div className="hint">处理节点</div>
                    <div style={{ fontSize: 14 }}>{task.node}</div>
                  </div>
                </div>
                <div className="col" style={{ gap: 7 }}>
                  {stages.map((s) => (
                    <div key={s.name} className="row" style={{ gap: 8, fontSize: 12.5 }}>
                      {s.status === 'done' ? (
                        <CheckCircleFilled style={{ color: 'var(--success)' }} />
                      ) : s.status === 'failed' ? (
                        <CloseCircleFilled style={{ color: 'var(--danger)' }} />
                      ) : s.status === 'running' ? (
                        <LoadingOutlined style={{ color: 'var(--accent)' }} />
                      ) : (
                        <span style={{ width: 14, height: 14, borderRadius: 7, border: '1px solid var(--border-strong)', display: 'inline-block' }} />
                      )}
                      <span style={{ color: s.status === 'wait' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{s.name}</span>
                      <span className="hint" style={{ marginLeft: 'auto' }}>
                        {(s.ms / 1000).toFixed(1)}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {task.status === 'failed' && (
            <Panel title="失败原因" extra={<Tag color="red">{task.errorCode}</Tag>}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>{task.errorMessage}</div>
              <div className="hint" style={{ marginBottom: 12 }}>建议操作：{errorMeta?.advice || '检查素材与参数后重试。'}</div>
              <div className="row" style={{ gap: 8 }}>
                <Button type="primary" size="small" icon={<RedoOutlined />} onClick={() => { retry(task.id); message.success('已重试'); }}>
                  立即重试
                </Button>
                <Button size="small" onClick={() => nav(`/assets/${task.assetId}`)}>
                  查看素材
                </Button>
              </div>
            </Panel>
          )}

          <Panel
            title="运行日志"
            extra={
              <div className="row" style={{ gap: 8 }}>
                <Segmented size="small" value={speed} onChange={setSpeed} options={['实时', '全部']} />
                <Button size="small" icon={<DownloadOutlined />} onClick={() => message.success('日志已导出（demo.log）')}>
                  下载
                </Button>
              </div>
            }
          >
            <div className="logview">
              {logs.slice(0, speed === '全部' ? logs.length : 14).map((l, i) => (
                <div key={i}>
                  <span className="ts">{l.ts}</span>
                  <span className={l.level}>{l.level.padEnd(5, ' ')}</span>
                  <span style={{ marginLeft: 6 }}>{l.text}</span>
                </div>
              ))}
            </div>
            <div className="hint" style={{ marginTop: 8 }}>
              共 {logs.length} 行日志 · 支持 Cmd+F 页内搜索
            </div>
          </Panel>

          <Panel title="产物" extra={<span className="hint">{task.outputs.length} 个文件</span>}>
            {task.outputs.length === 0 ? (
              <div className="hint">任务尚未产出文件。{task.status === 'running' ? '通常在进度 90% 后开始写入。' : ''}</div>
            ) : (
              task.outputs.map((o) => (
                <div key={o.name} className="row between" style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="row" style={{ gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--bg-hover)', display: 'grid', placeItems: 'center', fontSize: 11 }}>
                      {o.name.split('.').pop()?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.8 }}>{o.name}</div>
                      <div className="hint">{fmtBytes(o.sizeBytes)} · {o.kind}</div>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <Button size="small" onClick={() => nav(`/assets/${task.assetId}`)}>
                      预览
                    </Button>
                    <Button size="small" icon={<DownloadOutlined />} onClick={() => message.success('已开始下载（演示）')}>
                      下载
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Panel>
        </div>

        <div className="col" style={{ gap: 14 }}>
          <Panel title="关联素材">
            {asset ? (
              <div className="clickable" onClick={() => nav(`/assets/${asset.id}`)}>
                <div className={`cover cover-${asset.cover}`} style={{ height: 96, borderRadius: 6 }}>
                  <span className="cover-label">{asset.project}</span>
                </div>
                <div style={{ fontSize: 12.8, marginTop: 8 }}>{asset.title}</div>
                <div className="hint">
                  {asset.width}×{asset.height} · {fmtDuration(asset.duration)} · {fmtBytes(asset.sizeBytes)}
                </div>
              </div>
            ) : (
              <div className="hint">素材已删除</div>
            )}
          </Panel>

          <Panel title="参数快照" extra={<a onClick={() => message.success('参数 JSON 已复制')}>复制</a>}>
            <pre
              className="mono"
              style={{
                margin: 0,
                fontSize: 11,
                lineHeight: 1.75,
                color: 'var(--text-secondary)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: 10,
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(task.params, null, 2)}
            </pre>
          </Panel>

          <Panel title="时间线">
            <div className="col" style={{ gap: 10, fontSize: 12 }}>
              {[
                ['创建', task.createdAt],
                ['开始', task.startedAt],
                ['完成', task.finishedAt],
              ].map(([k, v]) => (
                <div key={k} className="row between">
                  <span className="text-sec">{k}</span>
                  <span className="hint">{v ? fmtDateTime(v) : '—'}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="相关操作">
            <div className="col" style={{ gap: 6 }}>
              <Button size="small" block onClick={() => nav(`/assets/${task.assetId}`)}>
                查看素材详情
              </Button>
              <Button size="small" block onClick={() => nav('/pipelines')}>
                查看所属流水线
              </Button>
              <Tooltip title="复制参数到工具页后可修改重跑">
                <Button size="small" block onClick={() => nav('/tools')}>
                  用相同参数新建任务
                </Button>
              </Tooltip>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
