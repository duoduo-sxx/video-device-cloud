import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Drawer, Form, Input, Progress, Select, Table, Tag } from 'antd';
import { CloudUploadOutlined, InboxOutlined, PauseCircleOutlined, PlayCircleOutlined, RedoOutlined, CloseOutlined } from '@ant-design/icons';
import { PageHeader, Panel } from '@/components/ui';
import { getAssets } from '@/mock/db';
import { PIPELINES } from '@/mock/seed/pipelines';
import { fmtBytes, fmtDuration, mulberry32 } from '@/utils/format';

type UpStatus = 'validating' | 'uploading' | 'paused' | 'transcoding' | 'done' | 'failed';

interface UpItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: UpStatus;
  speed: number;
  instant?: boolean;
  error?: string;
}

const STATUS_TEXT: Record<UpStatus, string> = {
  validating: '校验中',
  uploading: '上传中',
  paused: '已暂停',
  transcoding: '转码中',
  done: '完成',
  failed: '失败',
};

const STATUS_BADGE: Record<UpStatus, string> = {
  validating: 'queued',
  uploading: 'running',
  paused: 'warning',
  transcoding: 'running',
  done: 'success',
  failed: 'failed',
};

const DEMO_FILES: [string, number][] = [
  ['2026 秋季新品发布会-主会场.mp4', 12_684_000_000],
  ['产品演示-智能编排-4K.mp4', 3_284_000_000],
  ['客户访谈-零售增长复盘.wav', 486_000_000],
  ['抖音-秋季穿搭合集-竖版.mp4', 128_000_000],
  ['课程录屏-第10讲-模型评估.mp4', 2_140_000_000],
];

export default function Upload() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const [items, setItems] = useState<UpItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [metaFor, setMetaFor] = useState<UpItem | null>(null);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);
  const autoOpened = useRef(false);

  const addFiles = useCallback(
    (names: { name: string; size: number }[]) => {
      const assets = getAssets();
      const list: UpItem[] = names.map((f, i) => {
        const dup = assets.find((a) => a.title.startsWith(f.name.replace(/\.[^.]+$/, '').slice(0, 12)));
        return {
          id: `up_${Date.now()}_${i}`,
          name: f.name,
          size: f.size,
          progress: dup ? 100 : 0,
          status: dup ? 'done' : 'validating',
          speed: 0,
          instant: !!dup,
        };
      });
      setItems((prev) => [...list, ...prev]);
      if (list.some((l) => l.instant)) message.info('检测到重复文件，已秒传并跳过上传');
    },
    [message],
  );

  useEffect(() => {
    timer.current = window.setInterval(() => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.status === 'done' || it.status === 'failed' || it.status === 'paused') return it;
          if (it.status === 'validating') {
            const rnd = mulberry32(it.id.length + it.name.length);
            return { ...it, status: 'uploading', progress: 2, speed: 8 + rnd() * 10 };
          }
          if (it.status === 'transcoding') {
            const next = it.progress + 9;
            return next >= 100 ? { ...it, progress: 100, status: 'done' } : { ...it, progress: next };
          }
          const step = 3 + Math.random() * 6;
          const progress = Math.min(100, it.progress + step);
          if (progress >= 100) return { ...it, progress: 98, status: 'transcoding' };
          return { ...it, progress, speed: 9 + Math.random() * 7 };
        }),
      );
    }, 700);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    if (autoOpened.current) return;
    const done = items.find((i) => i.status === 'done' && !i.instant);
    if (done) {
      autoOpened.current = true;
      setMetaFor(done);
    }
  }, [items]);

  const pause = (id: string) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, status: i.status === 'paused' ? 'uploading' : 'paused' } : i)));

  const retry = (id: string) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, status: 'uploading', progress: 6, error: undefined } : i)));

  const remove = (id: string) => setItems((p) => p.filter((i) => i.id !== id));

  const uploadBytes = items.reduce((s, i) => s + (i.size * i.progress) / 100, 0);
  const totalBytes = items.reduce((s, i) => s + i.size, 0);

  return (
    <div>
      <PageHeader
        title="上传中心"
        subtitle="支持断点续传、分片校验与秒传去重 · 单文件上限 20 GB · 上传完成后可自动触发流水线"
        actions={
          <>
            <Button onClick={() => addFiles(DEMO_FILES.map(([name, size]) => ({ name, size })))}>载入示例文件</Button>
            <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => inputRef.current?.click()}>
              选择文件
            </Button>
          </>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px', alignItems: 'start' }}>
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const files = Array.from(e.dataTransfer.files);
              if (files.length) addFiles(files.map((f) => ({ name: f.name, size: f.size })));
              else addFiles(DEMO_FILES.map(([name, size]) => ({ name, size })));
            }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragging ? 'var(--brand)' : 'var(--border-strong)'}`,
              background: dragging ? 'var(--brand-soft)' : 'var(--bg-panel)',
              borderRadius: 10,
              padding: '42px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all .15s',
              marginBottom: 14,
            }}
          >
            <InboxOutlined style={{ fontSize: 40, color: 'var(--brand)' }} />
            <div style={{ fontSize: 15, marginTop: 12 }}>把音视频文件拖到这里，或点击选择</div>
            <div className="hint" style={{ marginTop: 6 }}>
              支持 MP4 / MOV / MKV / MP3 / WAV / AAC / FLAC，单文件最大 20 GB，最多同时上传 5 个
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) addFiles(files.map((f) => ({ name: f.name, size: f.size })));
              e.target.value = '';
            }}
          />

          <Panel
            title={`上传队列（${items.length}）`}
            extra={
              <span className="hint">
                已传输 {fmtBytes(uploadBytes)} / {fmtBytes(totalBytes)}
              </span>
            }
            noPad
          >
            <Table
              rowKey="id"
              size="middle"
              dataSource={items}
              pagination={false}
              locale={{ emptyText: '队列为空，拖入文件或点击「载入示例文件」' }}
              columns={[
                {
                  title: '文件',
                  render: (_, r) => (
                    <div>
                      <div style={{ fontSize: 12.8 }}>{r.name}</div>
                      <div className="hint">
                        {fmtBytes(r.size)} {r.instant && '· 秒传'}
                      </div>
                    </div>
                  ),
                },
                {
                  title: '状态',
                  width: 90,
                  render: (_, r) => <span className={`badge ${STATUS_BADGE[r.status]}`}>{STATUS_TEXT[r.status]}</span>,
                },
                {
                  title: '进度',
                  width: 210,
                  render: (_, r) => (
                    <div>
                      <Progress
                        percent={Math.round(r.progress)}
                        size="small"
                        showInfo={false}
                        strokeColor={r.status === 'failed' ? '#F87171' : r.status === 'done' ? '#34D399' : '#5B6CFF'}
                      />
                      <div className="hint">
                        {r.status === 'uploading' ? `${r.speed.toFixed(1)} MB/s · 剩余 ${Math.max(1, Math.round((100 - r.progress) / 2))} 秒` : r.status === 'done' ? '已完成并入库' : r.status === 'transcoding' ? '转码生成多码率版本' : '—'}
                      </div>
                    </div>
                  ),
                },
                {
                  title: '操作',
                  width: 190,
                  render: (_, r) => (
                    <div className="row" style={{ gap: 4 }}>
                      {(r.status === 'uploading' || r.status === 'paused') && (
                        <Button size="small" type="text" icon={r.status === 'paused' ? <PlayCircleOutlined /> : <PauseCircleOutlined />} onClick={() => pause(r.id)}>
                          {r.status === 'paused' ? '继续' : '暂停'}
                        </Button>
                      )}
                      {r.status === 'failed' && (
                        <Button size="small" type="text" icon={<RedoOutlined />} onClick={() => retry(r.id)}>
                          重试
                        </Button>
                      )}
                      {r.status === 'done' && (
                        <Button size="small" type="text" onClick={() => setMetaFor(r)}>
                          补录信息
                        </Button>
                      )}
                      <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => remove(r.id)} />
                    </div>
                  ),
                },
              ]}
            />
          </Panel>
        </div>

        <div className="col" style={{ gap: 14 }}>
          <Panel title="上传规范">
            <div className="col" style={{ gap: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <div>· 推荐编码 H.264 / H.265，音频 AAC 48 kHz</div>
              <div>· 4K 素材建议码率 ≥ 12 Mbps</div>
              <div>· 单文件不超过 20 GB，超长素材请先分段</div>
              <div>· 命名规范：项目名-内容-版本，例：发布会-主会场-v3</div>
              <div>· 上传后自动进行容器校验与首帧提取</div>
            </div>
          </Panel>
          <Panel title="存储配额">
            <div className="row between" style={{ fontSize: 13, marginBottom: 6 }}>
              <span>12.4 TB / 20 TB</span>
              <span className="hint">62%</span>
            </div>
            <Progress percent={62} showInfo={false} strokeColor="#5B6CFF" />
            <div className="hint" style={{ marginTop: 8 }}>
              剩余 7.6 TB，按当前速率预计可用 118 天。
            </div>
          </Panel>
          <Panel title="本次会话">
            <div className="col" style={{ gap: 6, fontSize: 12.5 }}>
              <div className="row between">
                <span className="text-sec">文件数</span>
                <span>{items.length}</span>
              </div>
              <div className="row between">
                <span className="text-sec">已完成</span>
                <span>{items.filter((i) => i.status === 'done').length}</span>
              </div>
              <div className="row between">
                <span className="text-sec">失败</span>
                <span>{items.filter((i) => i.status === 'failed').length}</span>
              </div>
              <div className="row between">
                <span className="text-sec">总大小</span>
                <span>{fmtBytes(totalBytes)}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Drawer
        title="补录素材信息"
        width={460}
        open={!!metaFor}
        onClose={() => setMetaFor(null)}
        extra={
          <Button
            type="primary"
            onClick={async () => {
              const v = await form.validateFields();
              message.success(`「${v.title}」已入库，标签 ${v.tags?.length || 0} 个`);
              setMetaFor(null);
              form.resetFields();
            }}
          >
            保存并入库
          </Button>
        }
      >
        <div className="hint" style={{ marginBottom: 14 }}>
          文件：{metaFor?.name} · {fmtBytes(metaFor?.size || 0)} · 预计时长 {fmtDuration((metaFor?.size || 0) / 220000)}
        </div>
        <Form form={form} layout="vertical" initialValues={{ project: '2026 春季新品发布', visibility: 'team', pipeline: 'none', tags: ['发布会', '4K'] }}>
          <Form.Item name="title" label="素材标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="例：2026 秋季新品发布会 - 主会场全程" />
          </Form.Item>
          <Form.Item name="project" label="所属项目">
            <Select
              options={['2026 春季新品发布', '品牌资产库', '电商投放素材', '数据分析课程', '客户交付'].map((p) => ({ value: p, label: p }))}
            />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入后回车添加" options={['发布会', '4K', '品牌', '双语', '竖版', '课程'].map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="visibility" label="可见性">
            <Select
              options={[
                { value: 'team', label: '团队可见' },
                { value: 'group', label: '资源组可见' },
                { value: 'private', label: '仅自己' },
              ]}
            />
          </Form.Item>
          <Form.Item name="pipeline" label="自动执行流水线" extra="上传完成后自动进入编排流程，可在流水线页修改">
            <Select
              options={[{ value: 'none', label: '不自动执行' }, ...PIPELINES.map((p) => ({ value: p.id, label: p.name }))]}
            />
          </Form.Item>
        </Form>
        <div className="hint">保存后可在「媒体资产」中查看，并直接发起转写、字幕或审核。</div>
        <div style={{ marginTop: 12 }}>
          <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => nav('/assets')}>
            前往媒体资产 →
          </Tag>
        </div>
      </Drawer>
    </div>
  );
}
