import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Input, Progress, Segmented, Select, Switch, Tag } from 'antd';
import { GlobalOutlined, PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PageHeader, Panel } from '@/components/ui';
import { Waveform } from '@/components/Waveform';
import { getAssets } from '@/mock/db';
import { useTaskStore } from '@/stores/tasks';
import { fmtTimecode } from '@/utils/format';

const PAIRS = [
  { from: 'zh', to: 'en', label: '中 → 英' },
  { from: 'zh', to: 'ja', label: '中 → 日' },
  { from: 'zh', to: 'ko', label: '中 → 韩' },
  { from: 'zh', to: 'es', label: '中 → 西' },
  { from: 'zh', to: 'ar', label: '中 → 阿' },
];

const EN = [
  'We brought on-device inference latency down to 38 milliseconds.',
  'Under real network conditions, the median first-token latency is 210 milliseconds.',
  'On the left is the previous generation, on the right is what we ship today.',
  'We made trade-offs across three dimensions: power, cost, and maintainability.',
  'Now let us look at a demo shot in the real world.',
  'The key to multimodality is aligning modalities into one semantic space.',
  'We tuned jointly with six hardware vendors.',
  'If you remember one thing: make it work first, then make it good.',
];

export default function Translate() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const assets = getAssets().filter((a) => a.type === 'video' || a.type === 'audio');
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [pair, setPair] = useState('zh-en');
  const [mode, setMode] = useState<'subtitle' | 'dub' | 'full'>('subtitle');
  const [style, setStyle] = useState('口语化');
  const [keepVoice, setKeepVoice] = useState(true);
  const [glossary, setGlossary] = useState<string[]>(['端侧推理 → on-device inference', '多模态 → multimodality']);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const enqueue = useTaskStore((s) => s.enqueue);
  const asset = assets.find((a) => a.id === assetId);
  const lines = asset?.subtitleTracks[0]?.lines.slice(0, 8) || [];

  const run = () => {
    if (!asset) return message.warning('请先选择素材');
    enqueue({ assetId, capability: mode === 'subtitle' ? 'cap_translate' : 'cap_dubbing', params: { pair, mode, style, keepVoice } });
    setRunning(true);
    setProgress(0);
    setDone(false);
    const t = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 3 + Math.random() * 5);
        if (next >= 100) {
          clearInterval(t);
          setTimeout(() => {
            setRunning(false);
            setDone(true);
            message.success('译配完成，共生成 ' + lines.length + ' 句字幕与配音块');
          }, 350);
        }
        return next;
      });
    }, 340);
  };

  return (
    <div>
      <PageHeader
        title="多语译配"
        subtitle="字幕翻译 + AI 配音 + 口型同步 · 支持术语表与音色保留"
        actions={<Button onClick={() => nav('/tools')}>返回工具集</Button>}
      />

      <Panel style={{ marginBottom: 14 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <Select showSearch value={assetId} onChange={setAssetId} style={{ width: 300 }} optionFilterProp="label" options={assets.map((a) => ({ value: a.id, label: a.title }))} />
          <Select value={pair} onChange={setPair} style={{ width: 110 }} options={PAIRS.map((p) => ({ value: `${p.from}-${p.to}`, label: p.label }))} />
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as 'subtitle' | 'dub' | 'full')}
            options={[
              { value: 'subtitle', label: '仅字幕' },
              { value: 'dub', label: '字幕 + 配音' },
              { value: 'full', label: '全流程（含口型）' },
            ]}
          />
          <Select value={style} onChange={setStyle} style={{ width: 110 }} options={['口语化', '正式', '营销', '学术'].map((s) => ({ value: s, label: s }))} />
          <div className="row" style={{ gap: 6, fontSize: 12.5 }}>
            <span className="text-sec">保留原音色</span>
            <Switch size="small" checked={keepVoice} onChange={setKeepVoice} />
          </div>
          <div style={{ flex: 1 }} />
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={run} loading={running}>
            {running ? '处理中…' : '开始译配'}
          </Button>
        </div>
        {(running || progress > 0) && <Progress percent={Math.round(progress)} size="small" style={{ marginTop: 10, maxWidth: 420 }} strokeColor="#A78BFA" />}
      </Panel>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 290px', alignItems: 'start' }}>
        <Panel
          title="逐句对照"
          extra={
            <span className="row" style={{ gap: 8 }}>
              <Tag color={done ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>{done ? '已生成译文' : '待处理'}</Tag>
              <a onClick={() => message.success('已导出双语 SRT')}>导出 SRT</a>
              <a onClick={() => message.success('已导出配音 WAV')}>导出配音</a>
            </span>
          }
          noPad
        >
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            {lines.length === 0 && <div className="hint" style={{ padding: 24 }}>该素材暂无字幕轨，请先生成字幕。</div>}
            {lines.map((l, i) => (
              <div key={l.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--accent)' }}>{fmtTimecode(l.start)}</span>
                  <span className="hint">{l.speaker}</span>
                  {done && <Tag color="purple" style={{ marginInlineEnd: 0, fontSize: 10 }}>已译</Tag>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 6 }}>{l.text}</div>
                {done ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 92px', gap: 10, alignItems: 'center' }}>
                    <Input size="small" defaultValue={`${EN[i % EN.length]}`} />
                    <button
                      onClick={() => message.info('试听该句配音（演示）')}
                      style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 6, height: 28, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <PlayCircleOutlined /> 0:{String(3 + i).padStart(2, '0')}
                    </button>
                  </div>
                ) : (
                  <div style={{ height: 28, borderRadius: 6, background: 'var(--bg-hover)', width: '70%' }} />
                )}
              </div>
            ))}
          </div>
        </Panel>

        <div className="col" style={{ gap: 14 }}>
          <Panel title="术语表" extra={<a onClick={() => message.info('术语表可在设置中维护')}>管理</a>}>
            <div className="col" style={{ gap: 6 }}>
              {glossary.map((g) => (
                <div key={g} className="row between" style={{ fontSize: 12 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g}</span>
                  <a style={{ flex: '0 0 auto', marginLeft: 8 }} onClick={() => setGlossary(glossary.filter((x) => x !== g))}>
                    移除
                  </a>
                </div>
              ))}
            </div>
            <Input
              size="small"
              placeholder="源词 → 译词，回车添加"
              style={{ marginTop: 10 }}
              onPressEnter={(e) => {
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) {
                  setGlossary([...glossary, v]);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <div className="hint" style={{ marginTop: 6 }}>术语表优先级高于模型默认译法，逐句生效。</div>
          </Panel>

          <Panel title="配音轨">
            <div className="row between" style={{ fontSize: 12.5, marginBottom: 6 }}>
              <span>{done ? '已生成 8 句' : '尚未生成'}</span>
              <span className="hint">{mode === 'subtitle' ? '仅字幕模式不生成配音' : '音色保留已开启'}</span>
            </div>
            <Waveform seed={done ? 42 : 3} height={54} bars={90} color={done ? 'var(--purple)' : 'var(--border-strong)'} />
            <div className="row" style={{ gap: 6, marginTop: 8 }}>
              <Button size="small" disabled={!done} icon={<PlayCircleOutlined />}>试听</Button>
              <Button size="small" disabled={!done} onClick={() => message.success('已导出 MP4 成片（演示）')}>导出成片</Button>
            </div>
          </Panel>

          <Panel title="语言覆盖">
            <div className="row wrap" style={{ gap: 6 }}>
              {['英语', '日语', '韩语', '西班牙语', '阿拉伯语', '法语', '德语', '葡萄牙语'].map((l) => (
                <Tag key={l} style={{ marginInlineEnd: 0 }}>{l}</Tag>
              ))}
            </div>
            <div className="hint" style={{ marginTop: 8 }}>口型同步仅支持英 / 日 / 韩 / 西，其他语种输出配音轨。</div>
          </Panel>

          <Panel title="计费">
            <div className="row" style={{ gap: 6, fontSize: 12.5 }}>
              <GlobalOutlined style={{ color: 'var(--purple)' }} />
              <span>字幕翻译 0.8 元/分钟</span>
            </div>
            <div className="hint" style={{ marginTop: 4 }}>配音另计 1.2 元/分钟，口型同步 3.6 元/分钟。</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
