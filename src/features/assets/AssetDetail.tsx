import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App, Button, Drawer, Input, Tabs, Tag, Progress } from 'antd';
import {
  DownloadOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ScissorOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { PageHeader, Panel, StatusBadge, KV } from '@/components/ui';
import { MockPlayer, useMockPlayback } from '@/components/MockPlayer';
import { Waveform } from '@/components/Waveform';
import { getAsset, patchAsset, getFindings } from '@/mock/db';
import { USERS } from '@/mock/seed/people';
import { CAP_NAMES } from '@/mock/seed/capabilities';
import { useTaskStore } from '@/stores/tasks';
import { fmtBytes, fmtDateTime, fmtDuration, fmtRelative, fmtTimecode, hashString, mulberry32 } from '@/utils/format';

const LEVEL_TEXT = { high: '高危', medium: '中危', low: '低危' } as const;
const DIM_TEXT: Record<string, string> = { porn: '涉黄', violence: '暴力画面', politics: '涉政', terror: '暴恐', sensitive_word: '敏感词', logo: '第三方 Logo' };

export default function AssetDetail() {
  const { assetId = '' } = useParams();
  const nav = useNavigate();
  const { message } = App.useApp();
  const asset = getAsset(assetId);
  const tasks = useTaskStore((s) => s.tasks);
  const [tags, setTags] = useState<string[]>(asset?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState('');

  const pb = useMockPlayback(asset?.duration || 100, 12);

  const findings = useMemo(() => getFindings().filter((f) => f.assetId === assetId), [assetId]);

  const chapters = useMemo(() => {
    if (!asset) return [];
    const rnd = mulberry32(hashString(asset.id) ^ 0x77);
    const n = Math.min(6, Math.max(3, Math.floor(asset.duration / 600)));
    const names = ['开场与背景', '核心能力发布', '现场演示', '客户案例', '价格与权益', '答疑与收尾'];
    return Array.from({ length: n }, (_, i) => ({
      index: i + 1,
      title: names[i % names.length],
      start: Math.round((asset.duration / n) * i),
      duration: Math.round(asset.duration / n),
      summary: [
        '介绍本场发布的背景与行业趋势，给出三个关键判断。',
        '发布核心能力，重点说明端侧推理延迟与多模态对齐方案。',
        '现场演示实际拍摄素材的处理流程，包含转写与字幕生成。',
        '分享两家客户的落地数据，平均效率提升 4.2 倍。',
        '公布版本与权益，说明企业版与 API 计费方式。',
        '回答线上与现场提问，补充成本与合规细节。',
      ][i % 6],
      cover: (i + rnd() * 8) % 8,
    }));
  }, [asset]);

  if (!asset) {
    return <Panel>素材不存在或已被删除。</Panel>;
  }

  const transcript = asset.subtitleTracks[0]?.lines.slice(0, 26) || [];

  const relatedTasks = tasks.filter((t) => t.assetId === asset.id).slice(0, 8);

  const addTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    if (tags.includes(v)) {
      message.warning('该标签已存在');
      return;
    }
    const next = [...tags, v];
    setTags(next);
    patchAsset(asset.id, { tags: next });
    setTagInput('');
    message.success(`已添加标签「${v}」`);
  };

  return (
    <div>
      <PageHeader
        title={
          <span className="row" style={{ gap: 10 }}>
            {asset.title}
            <StatusBadge status={asset.status} />
          </span>
        }
        subtitle={
          <span className="row" style={{ gap: 10 }}>
            <span>{asset.project}</span>
            <span>·</span>
            <span className="num">{asset.duration ? fmtDuration(asset.duration) : '—'}</span>
            <span>·</span>
            <span>{asset.width ? `${asset.width}×${asset.height}` : asset.format}</span>
            <span>·</span>
            <span>{fmtBytes(asset.sizeBytes)}</span>
            <span>·</span>
            <span>更新于 {fmtRelative(asset.updatedAt)}</span>
          </span>
        }
        actions={
          <>
            <Button icon={<DownloadOutlined />} onClick={() => message.success('已创建下载任务（演示环境不产生真实文件）')}>
              下载
            </Button>
            <Button icon={<EditOutlined />} onClick={() => nav(`/tools/subtitle/${asset.id}`)}>
              字幕工坊
            </Button>
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => nav('/tools/asr')}>
              发起处理
            </Button>
          </>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.9fr) minmax(280px, 1fr)', alignItems: 'start' }}>
        <div>
          <MockPlayer
            duration={asset.duration || 100}
            title={asset.title}
            cover={asset.cover}
            time={pb.time}
            playing={pb.playing}
            onToggle={pb.toggle}
            onSeek={pb.seek}
          />
          <div style={{ marginTop: 8 }}>
            <Waveform seed={hashString(asset.id)} progress={pb.time / Math.max(1, asset.duration)} height={40} bars={160} />
          </div>

          <Panel style={{ marginTop: 14 }} noPad>
            <Tabs
              style={{ padding: '0 16px' }}
              defaultActiveKey="transcript"
              items={[
                {
                  key: 'transcript',
                  label: `转写文本 ${transcript.length ? `(${asset.subtitleTracks[0].lines.length})` : ''}`,
                  children: (
                    <div style={{ maxHeight: 340, overflowY: 'auto', paddingBottom: 12 }}>
                      {transcript.length === 0 && <div className="hint" style={{ padding: 24 }}>该素材尚未转写，可前往「语音转写」发起处理。</div>}
                      {transcript.map((l) => (
                        <div
                          key={l.id}
                          className="row clickable"
                          style={{ gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}
                          onClick={() => {
                            pb.seek(l.start);
                            pb.setPlaying(false);
                          }}
                        >
                          <span className="mono-time" style={{ color: 'var(--accent)', fontSize: 11.5, flex: '0 0 64px' }}>
                            {fmtTimecode(l.start).slice(3, 12)}
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', flex: '0 0 48px' }}>{l.speaker}</span>
                          <span style={{ flex: 1, fontSize: 13 }}>{l.text}</span>
                          <Tag color={l.confidence < 0.85 ? 'warning' : 'default'} style={{ marginInlineEnd: 0, fontSize: 10.5 }}>
                            {(l.confidence * 100).toFixed(0)}%
                          </Tag>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'subtitle',
                  label: `字幕轨 (${asset.subtitleTracks.length})`,
                  children: (
                    <div style={{ paddingBottom: 16 }}>
                      {asset.subtitleTracks.map((t) => (
                        <div key={t.id} className="row between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontSize: 13 }}>
                              {t.language === 'zh' ? '中文' : t.language === 'en' ? '英文' : '双语'} · v{t.version}
                              <span className="chip" style={{ marginLeft: 8 }}>
                                {t.lines.length} 行
                              </span>
                            </div>
                            <div className="hint">
                              {t.updatedBy.replace('u_', 'U')} 更新于 {fmtRelative(t.updatedAt)}
                            </div>
                          </div>
                          <div className="row" style={{ gap: 6 }}>
                            <Button size="small" onClick={() => message.success('已导出 SRT（演示）')}>
                              导出
                            </Button>
                            <Button size="small" type="primary" ghost onClick={() => nav(`/tools/subtitle/${asset.id}`)}>
                              编辑
                            </Button>
                          </div>
                        </div>
                      ))}
                      {asset.subtitleTracks.length === 0 && <div className="hint" style={{ padding: '16px 0' }}>暂无字幕轨。</div>}
                    </div>
                  ),
                },
                {
                  key: 'ai',
                  label: 'AI 分析',
                  children: (
                    <div style={{ paddingBottom: 16 }}>
                      <div className="hint" style={{ margin: '10px 0 8px' }}>
                        章节（{chapters.length}）
                      </div>
                      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 10 }}>
                        {chapters.map((c) => (
                          <div key={c.index} className="row clickable" style={{ gap: 10, border: '1px solid var(--border)', borderRadius: 8, padding: 8 }} onClick={() => pb.seek(c.start)}>
                            <div className={`cover cover-${c.cover}`} style={{ width: 64, height: 40, borderRadius: 5, flex: '0 0 64px' }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12.5 }}>
                                {c.index}. {c.title}
                              </div>
                              <div className="hint">{fmtDuration(c.start)} 起 · {Math.round(c.duration / 60)} 分钟</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="divider" />
                      <div className="hint" style={{ marginBottom: 6 }}>摘要</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                        本场发布围绕「端侧实时多模态」展开，重点公布了推理延迟、字幕对齐与企业级编排能力。整体信息密度较高，适合切分为 6 个章节与 12 条短视频。
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 10px' }}>
                        现场演示部分可信度最高，建议作为投放主素材；价格章节涉及具体折扣，分发前需经审核确认。
                      </p>
                      <div className="hint" style={{ marginBottom: 6 }}>关键词</div>
                      <div className="row wrap" style={{ gap: 6 }}>
                        {['端侧推理', '多模态', '字幕对齐', '编排', '实时', '企业版', '定价', '客户案例', '延迟', '合规'].map((k, i) => (
                          <span key={k} className="chip" style={{ fontSize: 11 + (4 - i) * 0.6 }}>
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'review',
                  label: `审核 (${findings.length})`,
                  children: (
                    <div style={{ paddingBottom: 16 }}>
                      {findings.length === 0 && <div className="hint" style={{ padding: '16px 0' }}>尚未发起内容审核。</div>}
                      {findings.map((f) => (
                        <div key={f.id} className="row between" style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ minWidth: 0 }}>
                            <div className="row" style={{ gap: 8 }}>
                              <span className="badge failed" style={{ fontSize: 11 }}>{LEVEL_TEXT[f.level]}</span>
                              <span style={{ fontSize: 13 }}>{DIM_TEXT[f.dimension]}</span>
                              <span className="mono-time hint">{fmtTimecode(f.start)}</span>
                            </div>
                            <div className="hint" style={{ marginTop: 3 }}>{f.snippet}</div>
                          </div>
                          <Button size="small" onClick={() => nav('/tools/review')}>去处理</Button>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'version',
                  label: '版本 (3)',
                  children: (
                    <div style={{ paddingBottom: 16 }}>
                      {[3, 2, 1].map((v, i) => (
                        <div key={v} className="row between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontSize: 13 }}>
                              v{v} {i === 0 && <span className="chip" style={{ marginLeft: 6 }}>当前</span>}
                            </div>
                            <div className="hint">{i === 0 ? '重新对齐时间轴，修正 12 处断句' : i === 1 ? '术语表纠错，替换 8 处表述' : '初次生成'}</div>
                          </div>
                          <span className="hint">{['李思颖', '张明远', '系统'][i]} · {fmtRelative(new Date(Date.now() - i * 26 * 3600_000).toISOString())}</span>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'tasks',
                  label: `关联任务 (${relatedTasks.length})`,
                  children: (
                    <div style={{ paddingBottom: 16 }}>
                      {relatedTasks.length === 0 && <div className="hint" style={{ padding: '16px 0' }}>暂无关联任务。</div>}
                      {relatedTasks.map((t) => (
                        <div key={t.id} className="row between clickable" style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }} onClick={() => nav(`/tasks/${t.id}`)}>
                          <div>
                            <div style={{ fontSize: 13 }}>{CAP_NAMES[t.capability]} · {t.name.split(' - ')[0]}</div>
                            <div className="hint">{t.id} · {fmtRelative(t.createdAt)}</div>
                          </div>
                          <div className="row" style={{ gap: 10, width: 150 }}>
                            <Progress percent={t.progress} size="small" showInfo={false} style={{ width: 80 }} strokeColor={t.status === 'failed' ? '#F87171' : '#5B6CFF'} />
                            <StatusBadge status={t.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </Panel>
        </div>

        <div className="col" style={{ gap: 14 }}>
          <Panel title="元信息">
            <KV
              items={[
                ['编码格式', asset.codec],
                ['封装格式', asset.format],
                ['码率', asset.bitrateKbps ? `${asset.bitrateKbps} kbps` : '—'],
                ['帧率', asset.frameRate ? `${asset.frameRate} fps` : '—'],
                ['色彩空间', 'BT.709 / SDR'],
                ['音轨', 'AAC 48 kHz 立体声'],
                ['文件大小', fmtBytes(asset.sizeBytes)],
                ['MD5', <span className="mono" style={{ fontSize: 11 }}>{asset.md5}</span>],
                ['创建时间', fmtDateTime(asset.createdAt)],
                ['存储位置', 'oss://mf-prod/media/2026/'],
              ]}
            />
          </Panel>

          <Panel title="标签" extra={<span className="hint">{tags.length} 个</span>}>
            <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
              {tags.map((t) => (
                <Tag key={t} closable onClose={() => {
                  const next = tags.filter((x) => x !== t);
                  setTags(next);
                  patchAsset(asset.id, { tags: next });
                }} style={{ marginInlineEnd: 0 }}>
                  {t}
                </Tag>
              ))}
            </div>
            <div className="row" style={{ gap: 6 }}>
              <Input size="small" placeholder="新增标签" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onPressEnter={addTag} />
              <Button size="small" icon={<PlusOutlined />} onClick={addTag} />
            </div>
          </Panel>

          <Panel title="AI 处理概览">
            <div className="col" style={{ gap: 8 }}>
              {asset.capabilities.length === 0 && <span className="hint">尚未进行 AI 处理</span>}
              {asset.capabilities.map((c) => (
                <div key={c} className="row between" style={{ fontSize: 12.5 }}>
                  <span>{CAP_NAMES[c]}</span>
                  <span className="badge success"><span className="dot" />已完成</span>
                </div>
              ))}
            </div>
            <div className="divider" />
            <Button block icon={<ScissorOutlined />} onClick={() => nav(`/tools/subtitle/${asset.id}`)}>
              打开字幕工坊
            </Button>
          </Panel>

          <Panel title="评论" extra={<a onClick={() => setCommentOpen(true)}>写评论</a>}>
            <div className="col" style={{ gap: 12 }}>
              {[
                { u: '李思颖', t: '00:12:40', c: '这段语速偏快，字幕建议拆成两行。', time: '2 小时前' },
                { u: '张明远', t: '00:48:12', c: '英文轨的术语要统一成 "on-device inference"。', time: '昨天' },
                { u: '陈雨桐', t: '01:02:05', c: '价格部分已过审，可以对外。', time: '3 天前' },
              ].map((c, i) => (
                <div key={i} className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--brand-soft)', color: 'var(--brand-hover)', display: 'grid', placeItems: 'center', fontSize: 11, flex: '0 0 24px' }}>
                    {c.u.slice(0, 1)}
                  </div>
                  <div>
                    <div style={{ fontSize: 12 }}>
                      {c.u} <span className="mono hint">{c.t}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{c.c}</div>
                    <div className="hint">{c.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Drawer
        title="发表评论"
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
        width={420}
        extra={
          <Button
            type="primary"
            onClick={() => {
              if (!comment.trim()) {
                message.warning('请输入评论内容');
                return;
              }
              message.success(`评论已发布，锚点 ${fmtDuration(pb.time)}`);
              setComment('');
              setCommentOpen(false);
            }}
          >
            发布
          </Button>
        }
      >
        <div className="hint" style={{ marginBottom: 10 }}>
          当前播放位置 <span className="mono">{fmtDuration(pb.time)}</span>，评论将挂载到该时间点
        </div>
        <Input.TextArea rows={5} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="输入评论，支持 @ 成员" />
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          <Button size="small" icon={<PlayCircleOutlined />} onClick={() => pb.seek(pb.time)}>
            从当前位置预览
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
