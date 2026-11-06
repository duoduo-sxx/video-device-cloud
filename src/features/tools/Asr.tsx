import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Checkbox, Drawer, Input, Progress, Select, Slider, Switch, Tabs } from 'antd';
import { AudioOutlined, CheckCircleFilled, PlusOutlined } from '@ant-design/icons';
import { PageHeader, Panel, Cover } from '@/components/ui';
import { getAssets } from '@/mock/db';
import { useTaskStore } from '@/stores/tasks';
import { fmtDuration, fmtNum, fmtTimecode } from '@/utils/format';

const HOT_WORDS = ['端侧大模型', '多模态', 'AIGC', '具身智能', '算力调度'];

const STEPS = ['解析音轨', '声学模型', '语言模型', '标点与数字规整'];

export default function Asr() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const assets = useMemo(() => getAssets().filter((a) => a.type === 'video' || a.type === 'audio'), []);
  const [assetId, setAssetId] = useState<string>(assets[0]?.id || '');
  const [lang, setLang] = useState('zh');
  const [diar, setDiar] = useState(true);
  const [speakers, setSpeakers] = useState(2);
  const [punct, setPunct] = useState(true);
  const [hotwords, setHotwords] = useState<string[]>(HOT_WORDS);
  const [hotInput, setHotInput] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const enqueue = useTaskStore((s) => s.enqueue);

  const asset = assets.find((a) => a.id === assetId);
  const estSec = asset ? Math.round(asset.duration * 0.35) : 0;
  const cost = asset ? ((asset.duration / 60) * 0.35).toFixed(2) : '0.00';

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + Math.random() * 9 + 3);
        if (next >= 100) {
          clearInterval(t);
          setTimeout(() => {
            setRunning(false);
            setDone(true);
            message.success('转写完成，可进入字幕工坊精修');
          }, 320);
        }
        return next;
      });
    }, 420);
    return () => clearInterval(t);
  }, [running, message]);

  const submit = () => {
    if (!asset) {
      message.warning('请先选择要转写的素材');
      return;
    }
    enqueue({ assetId, capability: 'cap_asr', params: { language: lang, speakerDiarization: diar, speakerCount: speakers, hotwords } });
    setProgress(0);
    setDone(false);
    setRunning(true);
  };

  const addHot = () => {
    const v = hotInput.trim();
    if (!v) return;
    if (hotwords.includes(v)) return message.warning('该热词已存在');
    if (hotwords.length >= 50) return message.warning('热词上限为 50 个');
    setHotwords([...hotwords, v]);
    setHotInput('');
  };

  const stageIdx = Math.min(3, Math.floor(progress / 25));

  return (
    <div>
      <PageHeader
        title="语音转写"
        subtitle="高精度语音识别 · 说话人分离 · 热词增强 · 支持中 / 英 / 粤语"
        actions={<Button onClick={() => nav('/tools')}>返回工具集</Button>}
      />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px', alignItems: 'start' }}>
        <div className="col" style={{ gap: 14 }}>
          <Panel title="1. 选择素材" extra={<span className="hint">共 {assets.length} 个可处理素材</span>}>
            <div className="row wrap" style={{ gap: 10 }}>
              {assets.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  onClick={() => setAssetId(a.id)}
                  style={{
                    width: 168,
                    border: `1px solid ${assetId === a.id ? 'var(--brand)' : 'var(--border)'}`,
                    background: assetId === a.id ? 'var(--brand-soft)' : 'var(--bg-elevated)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  <Cover index={a.cover} height={72} label={a.project} />
                  <div style={{ padding: '7px 9px' }}>
                    <div style={{ fontSize: 12, height: 34, overflow: 'hidden' }}>{a.title}</div>
                    <div className="hint">
                      {fmtDuration(a.duration)} {a.capabilities.includes('cap_asr') && '· 已转写'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <Select
                showSearch
                value={assetId}
                onChange={setAssetId}
                style={{ flex: 1 }}
                optionFilterProp="label"
                options={assets.map((a) => ({ value: a.id, label: a.title }))}
              />
              <Button onClick={() => nav('/upload')}>上传新素材</Button>
            </div>
          </Panel>

          <Panel title="2. 转写参数">
            <div className="grid g2" style={{ gap: 18 }}>
              <div>
                <div className="hint" style={{ marginBottom: 6 }}>语种</div>
                <Select
                  value={lang}
                  onChange={setLang}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'zh', label: '中文（普通话）' },
                    { value: 'en', label: '英语' },
                    { value: 'yue', label: '粤语' },
                    { value: 'auto', label: '自动识别' },
                  ]}
                />
              </div>
              <div>
                <div className="hint" style={{ marginBottom: 6 }}>输出格式</div>
                <Select defaultValue="srt" style={{ width: '100%' }} options={[{ value: 'srt', label: 'SRT 字幕' }, { value: 'vtt', label: 'WebVTT' }, { value: 'txt', label: '纯文本' }]} />
              </div>
              <div>
                <div className="row between" style={{ marginBottom: 4 }}>
                  <span className="hint">说话人分离</span>
                  <Switch size="small" checked={diar} onChange={setDiar} />
                </div>
                {diar && (
                  <div>
                    <div className="row between" style={{ fontSize: 12 }}>
                      <span>预计人数</span>
                      <span>{speakers} 人</span>
                    </div>
                    <Slider min={2} max={8} value={speakers} onChange={setSpeakers} />
                  </div>
                )}
              </div>
              <div>
                <div className="hint" style={{ marginBottom: 8 }}>文本处理</div>
                <Checkbox checked={punct} onChange={(e) => setPunct(e.target.checked)}>
                  自动标点与数字规整
                </Checkbox>
                <div className="hint" style={{ marginTop: 4 }}>将"二零二六年"规整为"2026 年"</div>
              </div>
            </div>

            <div className="divider" />
            <div className="hint" style={{ marginBottom: 8 }}>热词表（{hotwords.length}/50）· 提升专有名词识别准确率</div>
            <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
              {hotwords.map((w) => (
                <span
                  key={w}
                  className="chip"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setHotwords(hotwords.filter((x) => x !== w))}
                  title="点击移除"
                >
                  {w} ×
                </span>
              ))}
            </div>
            <div className="row" style={{ gap: 6, maxWidth: 340 }}>
              <Input size="small" placeholder="添加热词后回车" value={hotInput} onChange={(e) => setHotInput(e.target.value)} onPressEnter={addHot} />
              <Button size="small" icon={<PlusOutlined />} onClick={addHot} />
            </div>
          </Panel>

          <Panel title="3. 预估与提交">
            <div className="grid g3" style={{ gap: 14, marginBottom: 14 }}>
              <div>
                <div className="hint">素材时长</div>
                <div style={{ fontSize: 18 }} className="num">{asset ? fmtDuration(asset.duration) : '—'}</div>
              </div>
              <div>
                <div className="hint">预估耗时</div>
                <div style={{ fontSize: 18 }} className="num">{fmtDuration(estSec)}</div>
              </div>
              <div>
                <div className="hint">预估消耗</div>
                <div style={{ fontSize: 18 }} className="num">¥ {cost}</div>
              </div>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <Button type="primary" size="large" icon={<AudioOutlined />} onClick={submit} disabled={!asset} loading={running}>
                {running ? '转写中…' : '开始转写'}
              </Button>
              {!asset && <span className="hint">请先选择素材</span>}
              {done && (
                <Button size="large" onClick={() => nav(`/tools/subtitle/${assetId}`)}>
                  进入字幕工坊精修
                </Button>
              )}
            </div>
          </Panel>
        </div>

        <div className="col" style={{ gap: 14 }}>
          <Panel title="任务概览">
            {!running && !done && (
              <div className="hint">提交后将在任务中心生成一条「语音转写」任务，可在任务详情查看日志与产物。</div>
            )}
            {(running || done) && (
              <>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{done ? '转写完成' : STEPS[stageIdx]}</span>
                  <span className="num" style={{ fontSize: 13 }}>{Math.round(progress)}%</span>
                </div>
                <Progress percent={Math.round(progress)} showInfo={false} strokeColor={done ? '#34D399' : '#5B6CFF'} />
                <div className="col" style={{ gap: 8, marginTop: 12 }}>
                  {STEPS.map((s, i) => (
                    <div key={s} className="row" style={{ gap: 8, fontSize: 12.5 }}>
                      {i < stageIdx || done ? (
                        <CheckCircleFilled style={{ color: 'var(--success)' }} />
                      ) : i === stageIdx ? (
                        <span className="badge running pulse" style={{ padding: '0 5px', height: 18 }}>
                          <span className="dot" />
                        </span>
                      ) : (
                        <span style={{ width: 14, height: 14, borderRadius: 7, border: '1px solid var(--border-strong)', display: 'inline-block' }} />
                      )}
                      <span style={{ color: i <= stageIdx || done ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{s}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel title="转写结果预览">
            {!done ? (
              <div className="hint">完成后在此显示前 3 段结果。</div>
            ) : (
              <div className="col" style={{ gap: 10 }}>
                {asset?.subtitleTracks[0]?.lines.slice(0, 3).map((l) => (
                  <div key={l.id} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 8 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--accent)' }}>{fmtTimecode(l.start)}</span>
                      <span className="hint">{l.speaker}</span>
                    </div>
                    <div style={{ fontSize: 12.5 }}>{l.text}</div>
                  </div>
                )) || <div className="hint">该素材暂无历史字幕轨</div>}
                <div className="hint" style={{ marginTop: 4 }}>
                  共识别 {asset?.subtitleTracks[0]?.lines.length || 0} 句 · 平均置信度 93.6%
                </div>
              </div>
            )}
          </Panel>

          <Panel title="近期转写">
            <Tabs
              size="small"
              items={[
                {
                  key: '1',
                  label: '本团队',
                  children: (
                    <div className="col" style={{ gap: 8, fontSize: 12 }}>
                      {assets.filter((a) => a.capabilities.includes('cap_asr')).slice(0, 5).map((a) => (
                        <div key={a.id} className="row between clickable" onClick={() => nav(`/assets/${a.id}`)}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>{a.title}</span>
                          <span className="hint">{fmtNum(a.subtitleTracks[0]?.lines.length || 0)} 句</span>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: '2',
                  label: '配额',
                  children: [
                    <div key="q">
                      <div className="row between" style={{ fontSize: 12.5, marginBottom: 4 }}>
                        <span>本月已用</span>
                        <span>486 / 1,200 分钟</span>
                      </div>
                      <Progress percent={40} showInfo={false} strokeColor="#22D3EE" />
                      <div className="hint" style={{ marginTop: 6 }}>企业版赠送 1,200 分钟/月，超出部分按 0.35 元/分钟计费。</div>
                    </div>,
                  ],
                },
              ]}
            />
          </Panel>
        </div>
      </div>

      <Drawer title="转写任务" open={running} onClose={() => setRunning(false)} width={380} maskClosable={false}>
        <div className="hint" style={{ marginBottom: 12 }}>任务已提交，离开页面不会中断处理。</div>
        <Progress percent={Math.round(progress)} strokeColor="#5B6CFF" />
        <div className="col" style={{ gap: 10, marginTop: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s} className="row between" style={{ fontSize: 12.5 }}>
              <span className={i <= stageIdx ? '' : 'text-ter'}>{s}</span>
              <span className="hint">{i < stageIdx ? '完成' : i === stageIdx ? '进行中' : '等待'}</span>
            </div>
          ))}
        </div>
        <div className="divider" />
        <Button block onClick={() => nav('/tasks')}>查看任务中心</Button>
      </Drawer>
    </div>
  );
}
