import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Progress, Switch, Tag } from 'antd';
import {
  ApiOutlined,
  ArrowRightOutlined,
  EditOutlined,
  ForkOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  SafetyCertificateOutlined,
  TranslationOutlined,
  ScissorOutlined,
  PictureOutlined,
  ExportOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { PageHeader, Panel, StatusBadge } from '@/components/ui';
import { PIPELINES } from '@/mock/seed/pipelines';
import { USERS } from '@/mock/seed/people';
import { fmtRelative } from '@/utils/format';
import type { NodeType } from '@/types';

const NODE_ICON: Record<string, React.ReactNode> = {
  input: <VideoCameraOutlined />,
  transcode: <ApiOutlined />,
  asr: <SoundOutlined />,
  subtitle: <EditOutlined />,
  translate: <TranslationOutlined />,
  dubbing: <SoundOutlined />,
  clip: <ScissorOutlined />,
  enhance: <PictureOutlined />,
  review: <SafetyCertificateOutlined />,
  output: <ExportOutlined />,
  branch: <ForkOutlined />,
  manual: <EditOutlined />,
};

export default function Pipelines() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(Object.fromEntries(PIPELINES.map((p) => [p.id, p.enabled])));

  return (
    <div>
      <PageHeader
        title="流水线"
        subtitle="把 AI 能力编排成可复用流程，支持手动、定时、上传触发与批量触发"
        actions={
          <>
            <Button onClick={() => nav('/templates')}>从模板创建</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => nav('/pipelines/pl_01')}>
              新建流水线
            </Button>
          </>
        }
      />

      <div className="grid g3" style={{ gap: 14 }}>
        {PIPELINES.map((p) => (
          <div key={p.id} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                  <Tag style={{ marginInlineEnd: 0, fontSize: 10 }}>v{p.version}</Tag>
                  {!enabled[p.id] && <span className="badge muted">已停用</span>}
                </div>
                <div className="hint" style={{ marginTop: 3 }}>{p.description}</div>
              </div>
              <Switch size="small" checked={enabled[p.id]} onChange={(v) => { setEnabled({ ...enabled, [p.id]: v }); message.success(`${p.name} 已${v ? '启用' : '停用'}`); }} />
            </div>

            <div className="row wrap" style={{ gap: 4, alignItems: 'center' }}>
              {p.nodes.slice(0, 5).map((n, i) => (
                <span key={n.id} className="row" style={{ gap: 3 }}>
                  <span
                    title={n.label}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12,
                      background: 'var(--bg-hover)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {NODE_ICON[n.type as NodeType]}
                  </span>
                  {i < Math.min(4, p.nodes.length - 1) && <ArrowRightOutlined style={{ fontSize: 9, color: 'var(--text-tertiary)' }} />}
                </span>
              ))}
              {p.nodes.length > 5 && <span className="hint">+{p.nodes.length - 5}</span>}
              <span className="hint" style={{ marginLeft: 4 }}>共 {p.nodes.length} 节点</span>
            </div>

            <div className="grid g3" style={{ gap: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div>
                <div className="hint">近 7 日运行</div>
                <div style={{ fontSize: 13 }}>{p.runs7d} 次</div>
              </div>
              <div>
                <div className="hint">成功率</div>
                <div style={{ fontSize: 13, color: p.successRate > 96 ? 'var(--success)' : 'var(--warning)' }}>{p.successRate}%</div>
              </div>
              <div>
                <div className="hint">平均耗时</div>
                <div style={{ fontSize: 13 }}>{p.avgDurationSec >= 60 ? `${Math.round(p.avgDurationSec / 60)} 分钟` : `${p.avgDurationSec} 秒`}</div>
              </div>
            </div>

            <div className="row between" style={{ marginTop: 'auto' }}>
              <div className="hint">
                {USERS.find((u) => u.id === p.ownerId)?.name} · {fmtRelative(p.updatedAt)} · {p.trigger}
              </div>
              <div className="row" style={{ gap: 4 }}>
                <Button size="small" type="text" icon={<HistoryOutlined />} onClick={() => nav(`/pipelines/${p.id}/runs`)}>
                  记录
                </Button>
                <Button size="small" type="primary" ghost onClick={() => nav(`/pipelines/${p.id}`)}>
                  编排
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Panel style={{ marginTop: 14 }} title="运行概览" extra={<a onClick={() => nav('/tasks')}>全部任务 →</a>}>
        <div className="grid g4" style={{ gap: 14 }}>
          {[
            { label: '今日运行', value: '86 次', sub: '成功率 97.7%' },
            { label: '运行中', value: '3 个', sub: '最长已运行 6 分 12 秒' },
            { label: '平均排队', value: '18 秒', sub: '较昨日 -32%' },
            { label: '失败待处理', value: '2 个', sub: '均为素材解析异常' },
          ].map((m) => (
            <div key={m.label}>
              <div className="hint">{m.label}</div>
              <div style={{ fontSize: 20 }} className="num">{m.value}</div>
              <div className="hint">{m.sub}</div>
            </div>
          ))}
        </div>
        <div className="divider" />
        <div className="col" style={{ gap: 8 }}>
          {[
            { name: '短视频一键成片', p: 72, status: 'running' },
            { name: '课程字幕标准化', p: 41, status: 'running' },
            { name: '发布会多语分发', p: 18, status: 'running' },
          ].map((r) => (
            <div key={r.name} className="row" style={{ gap: 12 }}>
              <span style={{ width: 160, fontSize: 12.5 }}>{r.name}</span>
              <Progress percent={r.p} size="small" showInfo={false} style={{ flex: 1 }} strokeColor="#22D3EE" />
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
