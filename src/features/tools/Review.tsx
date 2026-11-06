import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Progress, Select, Tag } from 'antd';
import { CheckOutlined, CloseOutlined, EyeInvisibleOutlined, StopOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { PageHeader, Panel, StatusBadge } from '@/components/ui';
import { MockPlayer, useMockPlayback } from '@/components/MockPlayer';
import { Waveform } from '@/components/Waveform';
import { getAssets, getFindings, patchFinding } from '@/mock/db';
import { fmtTimecode, hashString, fmtDuration } from '@/utils/format';
import type { ReviewFinding } from '@/types';

const DIM_TEXT: Record<string, string> = { porn: '涉黄', violence: '暴力画面', politics: '涉政', terror: '暴恐', sensitive_word: '敏感词', logo: '第三方 Logo' };
const LEVEL_TEXT = { high: '高危', medium: '中危', low: '低危' } as const;
const LEVEL_BADGE = { high: 'failed', medium: 'warning', low: 'queued' } as const;

export default function Review() {
  const nav = useNavigate();
  const { message, modal } = App.useApp();
  const assets = useMemo(() => getAssets().filter((a) => a.type === 'video'), []);
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const asset = assets.find((a) => a.id === assetId)!;
  const [findings, setFindings] = useState<ReviewFinding[]>(() => getFindings().filter((f) => f.assetId === assets[0]?.id));
  const [currentId, setCurrentId] = useState(findings[0]?.id || '');
  const [filter, setFilter] = useState('all');
  const pb = useMockPlayback(asset?.duration || 100, findings[0]?.start || 0);

  const all = useMemo(() => getFindings().filter((f) => f.assetId === assetId), [assetId]);
  const list = all.filter((f) => (filter === 'all' ? true : filter === 'pending' ? !f.handled : f.level === filter));
  const handled = all.filter((f) => f.handled).length;
  const current = all.find((f) => f.id === currentId) || list[0];

  const switchAsset = (id: string) => {
    setAssetId(id);
    const next = getFindings().filter((f) => f.assetId === id);
    setFindings(next);
    setCurrentId(next[0]?.id || '');
    pb.seek(next[0]?.start || 0);
  };

  const act = (f: ReviewFinding, action: 'pass' | 'delete' | 'mask' | 'whitelist') => {
    patchFinding(f.id, { handled: true, action });
    setFindings(getFindings().filter((x) => x.assetId === assetId));
    const label = { pass: '已通过', delete: '已删除片段', mask: '已打码', whitelist: '已加入白名单' }[action];
    message.success(`${fmtTimecode(f.start)} ${DIM_TEXT[f.dimension]} · ${label}`);
    const idx = all.findIndex((x) => x.id === f.id);
    const next = all[idx + 1];
    if (next) {
      setCurrentId(next.id);
      pb.seek(next.start);
    }
  };

  const submit = () => {
    const pending = all.filter((f) => !f.handled).length;
    if (pending > 0) {
      modal.confirm({
        title: `还有 ${pending} 个风险点未处置`,
        content: '未处置的风险点将按「转人工」处理，是否继续提交？',
        okText: '继续提交',
        cancelText: '返回处置',
        onOk: () => message.success('审核结论已提交：转人工复核'),
      });
      return;
    }
    message.success('审核通过，素材已标记为可分发');
  };

  if (!asset) return <Panel>暂无待审核素材。</Panel>;

  return (
    <div>
      <PageHeader
        title="内容审核"
        subtitle="画面 / 语音 / 文字三模态识别 · 风险时间轴打点 · 支持快捷键 J/K 切换、A 通过、R 打回"
        actions={
          <>
            <Select
              value={assetId}
              onChange={switchAsset}
              style={{ width: 260 }}
              options={assets.slice(0, 12).map((a) => ({ value: a.id, label: a.title }))}
            />
            <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={submit}>
              提交结论
            </Button>
          </>
        }
      />

      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="panel tight">
          <div className="hint">待审素材</div>
          <div style={{ fontSize: 22 }} className="num">12</div>
          <div className="hint">3 条高风险</div>
        </div>
        <div className="panel tight">
          <div className="hint">当前素材风险点</div>
          <div style={{ fontSize: 22 }} className="num">{all.length}</div>
          <div className="hint">{all.filter((f) => f.level === 'high').length} 条高危</div>
        </div>
        <div className="panel tight">
          <div className="hint">已处置</div>
          <div style={{ fontSize: 22 }} className="num">{handled} / {all.length}</div>
          <Progress percent={all.length ? Math.round((handled / all.length) * 100) : 0} showInfo={false} size="small" strokeColor="#34D399" />
        </div>
        <div className="panel tight">
          <div className="hint">平均处置耗时</div>
          <div style={{ fontSize: 22 }} className="num">1.8 <small style={{ fontSize: 12 }}>分钟/条</small></div>
          <div className="hint">低于团队均值 2.4 分钟</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.7fr) 360px', alignItems: 'start' }}>
        <div className="col" style={{ gap: 14 }}>
          <MockPlayer
            duration={asset.duration}
            title={asset.title}
            cover={asset.cover}
            time={pb.time}
            playing={pb.playing}
            onToggle={pb.toggle}
            onSeek={pb.seek}
          />

          <Panel title="风险时间轴" extra={<span className="hint">点击标记跳转到对应画面</span>}>
            <div style={{ position: 'relative', padding: '18px 0 6px' }}>
              <div style={{ position: 'relative', height: 6, background: 'var(--bg-hover)', borderRadius: 3 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(pb.time / asset.duration) * 100}%`, background: 'var(--brand)', borderRadius: 3, opacity: 0.5 }} />
                {all.map((f) => (
                  <div
                    key={f.id}
                    title={`${DIM_TEXT[f.dimension]} ${fmtTimecode(f.start)}`}
                    onClick={() => {
                      setCurrentId(f.id);
                      pb.seek(f.start);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${(f.start / asset.duration) * 100}%`,
                      top: -5,
                      width: 3,
                      height: 16,
                      borderRadius: 2,
                      cursor: 'pointer',
                      background: f.handled ? 'var(--success)' : f.level === 'high' ? 'var(--danger)' : f.level === 'medium' ? 'var(--warning)' : '#94A3B8',
                      transform: f.id === currentId ? 'scale(1.6)' : 'none',
                      boxShadow: f.id === currentId ? '0 0 0 2px rgba(255,255,255,.18)' : 'none',
                    }}
                  />
                ))}
                <div style={{ position: 'absolute', left: `${(pb.time / asset.duration) * 100}%`, top: -8, bottom: -8, width: 1, background: 'var(--text-primary)' }} />
              </div>
              <div className="row between" style={{ marginTop: 10, fontSize: 11, color: 'var(--text-tertiary)' }}>
                <span>00:00</span>
                <span>{fmtDuration(asset.duration / 3)}</span>
                <span>{fmtDuration((asset.duration / 3) * 2)}</span>
                <span>{fmtDuration(asset.duration)}</span>
              </div>
            </div>
            <div style={{ marginTop: 6 }}>
              <Waveform seed={hashString(asset.id)} progress={pb.time / asset.duration} height={36} bars={200} />
            </div>
            <div className="row wrap" style={{ gap: 12, marginTop: 10, fontSize: 11.5, color: 'var(--text-secondary)' }}>
              <span className="row" style={{ gap: 5 }}><i style={{ width: 8, height: 8, background: 'var(--danger)', borderRadius: 2, display: 'inline-block' }} />高危</span>
              <span className="row" style={{ gap: 5 }}><i style={{ width: 8, height: 8, background: 'var(--warning)', borderRadius: 2, display: 'inline-block' }} />中危</span>
              <span className="row" style={{ gap: 5 }}><i style={{ width: 8, height: 8, background: '#94A3B8', borderRadius: 2, display: 'inline-block' }} />低危</span>
              <span className="row" style={{ gap: 5 }}><i style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: 2, display: 'inline-block' }} />已处置</span>
            </div>
          </Panel>

          <Panel title="当前风险点" extra={current && <StatusBadge status={current.handled ? 'succeeded' : 'pending_review'} text={current.handled ? '已处置' : '待处置'} />}>
            {!current ? (
              <div className="hint">该素材未发现风险点。</div>
            ) : (
              <div>
                <div className="row" style={{ gap: 10, marginBottom: 10 }}>
                  <div className={`cover cover-${asset.cover}`} style={{ width: 128, height: 72, borderRadius: 6, flex: '0 0 128px' }}>
                    <span className="cover-label">{fmtTimecode(current.start)}</span>
                  </div>
                  <div className="grow">
                    <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                      <span className={`badge ${LEVEL_BADGE[current.level]}`}>{LEVEL_TEXT[current.level]}</span>
                      <b style={{ fontSize: 13 }}>{DIM_TEXT[current.dimension]}</b>
                      <span className="hint">置信度 {(current.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{current.snippet}</div>
                    <div className="hint">建议：{current.suggestion}</div>
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <Button icon={<CheckOutlined />} onClick={() => act(current, 'pass')} disabled={current.handled}>通过</Button>
                  <Button icon={<StopOutlined />} danger onClick={() => act(current, 'delete')} disabled={current.handled}>删除片段</Button>
                  <Button icon={<EyeInvisibleOutlined />} onClick={() => act(current, 'mask')} disabled={current.handled}>打码</Button>
                  <Button icon={<CloseOutlined />} onClick={() => act(current, 'whitelist')} disabled={current.handled}>加白名单</Button>
                  <div className="spacer" style={{ flex: 1 }} />
                  <Button type="text" onClick={() => nav(`/assets/${asset.id}`)}>查看素材详情 →</Button>
                </div>
              </div>
            )}
          </Panel>
        </div>

        <Panel
          title={`风险点列表（${list.length}）`}
          extra={
            <Select
              size="small"
              value={filter}
              onChange={setFilter}
              style={{ width: 96 }}
              options={[
                { value: 'all', label: '全部' },
                { value: 'pending', label: '待处置' },
                { value: 'high', label: '高危' },
                { value: 'medium', label: '中危' },
                { value: 'low', label: '低危' },
              ]}
            />
          }
          noPad
        >
          <div style={{ maxHeight: 620, overflowY: 'auto', padding: '0 12px 12px' }}>
            {list.map((f) => (
              <div
                key={f.id}
                className="clickable"
                onClick={() => {
                  setCurrentId(f.id);
                  pb.seek(f.start);
                }}
                style={{
                  padding: '9px 8px',
                  borderRadius: 7,
                  marginBottom: 4,
                  border: `1px solid ${f.id === currentId ? 'var(--brand)' : 'transparent'}`,
                  background: f.id === currentId ? 'var(--brand-soft)' : 'transparent',
                  opacity: f.handled ? 0.6 : 1,
                }}
              >
                <div className="row between" style={{ gap: 6 }}>
                  <span className="row" style={{ gap: 6 }}>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--accent)' }}>{fmtTimecode(f.start)}</span>
                    <span style={{ fontSize: 12.5 }}>{DIM_TEXT[f.dimension]}</span>
                  </span>
                  <Tag color={f.level === 'high' ? 'red' : f.level === 'medium' ? 'orange' : 'default'} style={{ marginInlineEnd: 0, fontSize: 10 }}>
                    {LEVEL_TEXT[f.level]}
                  </Tag>
                </div>
                <div className="hint" style={{ marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.snippet}</div>
                <div className="row between" style={{ marginTop: 4 }}>
                  <span className="hint">置信度 {(f.confidence * 100).toFixed(0)}%</span>
                  {f.handled ? <span style={{ fontSize: 10.5, color: 'var(--success)' }}>已处置</span> : <a style={{ fontSize: 10.5 }}>处置</a>}
                </div>
              </div>
            ))}
            {list.length === 0 && <div className="hint" style={{ padding: 20, textAlign: 'center' }}>没有符合筛选条件的风险点</div>}
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
            <Button block type="primary" ghost onClick={submit}>
              提交审核结论
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
