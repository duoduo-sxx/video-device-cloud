import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Progress, Select, Slider, Switch } from 'antd';
import { HolderOutlined, SoundOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PageHeader, Panel, Cover } from '@/components/ui';
import { Waveform } from '@/components/Waveform';
import { getAssets } from '@/mock/db';
import { useTaskStore } from '@/stores/tasks';
import { fmtDuration, hashString } from '@/utils/format';

const CHAIN_DEFAULT = [
  { id: 'c1', name: '降噪处理', desc: '抑制稳态噪声与风噪', on: true, param: 60 },
  { id: 'c2', name: '去混响', desc: '降低室内回声与尾音', on: true, param: 40 },
  { id: 'c3', name: '人声分离', desc: '拆分人声与伴奏轨', on: false, param: 0 },
  { id: 'c4', name: '响度归一化', desc: '目标 -14 LUFS（播客标准）', on: true, param: -14 },
  { id: 'c5', name: '人声美化', desc: 'EQ 提亮 + 轻压缩', on: true, param: 50 },
];

export default function AudioTool() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const assets = getAssets().filter((a) => a.type === 'audio' || a.type === 'video');
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [chain, setChain] = useState(CHAIN_DEFAULT);
  const [loudness, setLoudness] = useState(-9.2);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const dragId = useRef<string | null>(null);
  const enqueue = useTaskStore((s) => s.enqueue);
  const asset = assets.find((a) => a.id === assetId);

  const toggle = (id: string) => setChain((c) => c.map((x) => (x.id === id ? { ...x, on: !x.on } : x)));
  const setParam = (id: string, v: number) => setChain((c) => c.map((x) => (x.id === id ? { ...x, param: v } : x)));

  const run = () => {
    if (!asset) return message.warning('请先选择音轨');
    enqueue({ assetId, capability: 'cap_audio', params: { chain: chain.filter((c) => c.on).map((c) => c.name), loudness: -14 } });
    setRunning(true);
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 4 + Math.random() * 6);
        if (next > 100) return 100;
        return next;
      });
    }, 380);
    setTimeout(() => {
      clearInterval(t);
      setProgress(100);
      setRunning(false);
      setLoudness(-14);
      message.success('处理完成，已输出 -14.0 LUFS 音轨');
    }, 3600);
  };

  const activeCount = chain.filter((c) => c.on).length;

  return (
    <div>
      <PageHeader
        title="音频处理"
        subtitle="降噪 / 去混响 / 人声分离 / 响度归一化 / 人声美化 · 处理链可拖拽排序"
        actions={<Button onClick={() => nav('/tools')}>返回工具集</Button>}
      />

      <div className="grid" style={{ gridTemplateColumns: '320px minmax(0,1fr) 290px', alignItems: 'start' }}>
        <div className="col" style={{ gap: 14 }}>
          <Panel title="选择音轨">
            <Select
              showSearch
              value={assetId}
              onChange={setAssetId}
              style={{ width: '100%' }}
              optionFilterProp="label"
              options={assets.map((a) => ({ value: a.id, label: a.title }))}
            />
            <div className="hint" style={{ marginTop: 8 }}>
              {asset ? `${asset.format} · ${fmtDuration(asset.duration)} · ${asset.bitrateKbps} kbps` : '—'}
            </div>
          </Panel>

          <Panel title={`处理链（${activeCount} 个生效）`} extra={<span className="hint">拖动排序</span>}>
            <div className="col" style={{ gap: 8 }}>
              {chain.map((c, i) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => (dragId.current = c.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const from = chain.findIndex((x) => x.id === dragId.current);
                    if (from < 0 || from === i) return;
                    const next = [...chain];
                    const [moved] = next.splice(from, 1);
                    next.splice(i, 0, moved);
                    setChain(next);
                    dragId.current = null;
                  }}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '9px 10px',
                    background: c.on ? 'var(--bg-elevated)' : 'transparent',
                    opacity: c.on ? 1 : 0.55,
                    cursor: 'grab',
                  }}
                >
                  <div className="row between">
                    <div className="row" style={{ gap: 8 }}>
                      <HolderOutlined style={{ color: 'var(--text-tertiary)' }} />
                      <span style={{ fontSize: 12.5 }}>
                        {i + 1}. {c.name}
                      </span>
                    </div>
                    <Switch size="small" checked={c.on} onChange={() => toggle(c.id)} />
                  </div>
                  <div className="hint" style={{ margin: '2px 0 0 22px' }}>{c.desc}</div>
                  {c.on && c.id !== 'c3' && (
                    <div style={{ margin: '4px 0 0 22px' }}>
                      <Slider
                        min={c.id === 'c4' ? -24 : 0}
                        max={c.id === 'c4' ? -8 : 100}
                        value={c.param}
                        onChange={(v) => setParam(c.id, v)}
                        tooltip={{ formatter: (v) => (c.id === 'c4' ? `${v} LUFS` : `${v}`) }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="col" style={{ gap: 14 }}>
          <Panel title="波形对比" extra={<span className="hint">上：原始 · 下：处理后</span>}>
            <div style={{ padding: '6px 0' }}>
              <div className="hint" style={{ marginBottom: 4 }}>原始音轨</div>
              <Waveform seed={hashString(assetId) || 7} height={64} bars={180} color="var(--text-tertiary)" dim="var(--border)" />
              <div className="hint" style={{ margin: '12px 0 4px' }}>处理后（响度归一化 {loudness.toFixed(1)} LUFS）</div>
              <Waveform seed={(hashString(assetId) || 7) + 3} height={78} bars={180} color={running ? 'var(--accent)' : 'var(--success)'} dim="var(--border)" />
            </div>
            <div className="row" style={{ gap: 10, marginTop: 8 }}>
              <Button icon={<SoundOutlined />} onClick={() => message.info('正在试听处理后音频（演示为模拟播放）')}>
                试听处理后
              </Button>
              <Button onClick={() => message.info('正在 A/B 对比播放（演示为模拟）')}>A/B 对比</Button>
            </div>
          </Panel>

          <Panel title="响度监测">
            <div className="row between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 26 }} className="num">
                {loudness.toFixed(1)}
                <small style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 4 }}>LUFS</small>
              </span>
              <div style={{ textAlign: 'right' }}>
                <div className="hint">目标 -14.0 LUFS</div>
                <div style={{ fontSize: 12, color: Math.abs(loudness + 14) < 0.6 ? 'var(--success)' : 'var(--warning)' }}>
                  {Math.abs(loudness + 14) < 0.6 ? '已达标准' : `偏差 ${(loudness + 14).toFixed(1)} dB`}
                </div>
              </div>
            </div>
            <div style={{ position: 'relative', height: 26, background: 'var(--bg-hover)', borderRadius: 6, overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.min(100, Math.max(4, ((loudness + 30) / 30) * 100))}%`,
                  background: 'linear-gradient(90deg,#34D399,#FBBF24,#F87171)',
                  transition: 'width .4s',
                  opacity: 0.85,
                }}
              />
              <div style={{ position: 'absolute', left: `${((14 + 30) / 30) * 100}%`, top: 0, bottom: 0, width: 1.5, background: '#fff' }} />
              <div style={{ position: 'absolute', right: 8, top: 4, fontSize: 10.5, color: 'rgba(0,0,0,.55)' }}>-30 → 0 LUFS</div>
            </div>
            <div className="row between" style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-secondary)' }}>
              <span>峰值 -1.2 dBTP</span>
              <span>动态范围 9.4 LU</span>
              <span>真峰值合规</span>
            </div>
          </Panel>

          <Panel title="处理说明">
            <div className="col" style={{ gap: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <div>· 播客分发建议 -16 LUFS（Apple Podcasts）/ -14 LUFS（Spotify）</div>
              <div>· 人声分离会输出两条音轨：vocals.wav 与 accompaniment.wav</div>
              <div>· 降噪强度过大会产生「水声」伪影，语音素材建议 40–60</div>
            </div>
          </Panel>
        </div>

        <div className="col" style={{ gap: 14 }}>
          <Panel title="输出设置">
            <div className="col" style={{ gap: 10 }}>
              <div>
                <div className="hint" style={{ marginBottom: 4 }}>输出格式</div>
                <Select size="small" defaultValue="wav" style={{ width: '100%' }} options={[{ value: 'wav', label: 'WAV 48kHz / 24bit' }, { value: 'mp3', label: 'MP3 320kbps' }, { value: 'aac', label: 'AAC 256kbps' }]} />
              </div>
              <div className="row between" style={{ fontSize: 12.5 }}>
                <span className="text-sec">保留原始音轨</span>
                <Switch size="small" defaultChecked />
              </div>
              <div className="row between" style={{ fontSize: 12.5 }}>
                <span className="text-sec">输出去人声版</span>
                <Switch size="small" />
              </div>
              <div className="row between" style={{ fontSize: 12.5 }}>
                <span className="text-sec">分轨导出</span>
                <Switch size="small" defaultChecked />
              </div>
            </div>
            <div className="divider" />
            <div className="row between" style={{ fontSize: 12.5 }}>
              <span className="text-sec">预估耗时</span>
              <span>{asset ? Math.max(1, Math.round(asset.duration / 60 / 4)) : 0} 分钟</span>
            </div>
            <Button type="primary" block icon={<ThunderboltOutlined />} style={{ marginTop: 12 }} onClick={run} loading={running}>
              {running ? '处理中…' : '开始处理'}
            </Button>
            {running && <Progress percent={Math.round(progress)} size="small" style={{ marginTop: 10 }} strokeColor="#38BDF8" />}
          </Panel>

          <Panel title="当前素材">
            {asset ? (
              <>
                <Cover index={asset.cover} height={92} label={asset.project} />
                <div style={{ fontSize: 12.5, marginTop: 8 }}>{asset.title}</div>
                <div className="hint">{fmtDuration(asset.duration)} · {asset.codec} · {asset.bitrateKbps} kbps</div>
              </>
            ) : (
              <div className="hint">未选择素材</div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
