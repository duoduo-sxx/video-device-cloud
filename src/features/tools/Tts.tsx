import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Input, Progress, Select, Slider, Switch, Tag } from 'antd';
import { CustomerServiceOutlined, PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PageHeader, Panel } from '@/components/ui';
import { Waveform } from '@/components/Waveform';
import { useTaskStore } from '@/stores/tasks';
import { fmtDuration } from '@/utils/format';

const VOICES = [
  { id: 'v01', name: '林知夏', lang: '中文女声', tag: '亲和', desc: '品牌片 / 口播', color: '#5B6CFF' },
  { id: 'v02', name: '陈默', lang: '中文男声', tag: '沉稳', desc: '纪录片 / 新闻', color: '#22D3EE' },
  { id: 'v03', name: '苏晚', lang: '中文女声', tag: '活力', desc: '短视频 / 带货', color: '#F472B6' },
  { id: 'v04', name: '周衍', lang: '中文男声', tag: '磁性', desc: '广告 / 宣传片', color: '#A78BFA' },
  { id: 'v05', name: '许知意', lang: '中文女声', tag: '温柔', desc: '课程 / 有声书', color: '#34D399' },
  { id: 'v06', name: '李择', lang: '中文男声', tag: '新闻', desc: '播报 / 资讯', color: '#FBBF24' },
  { id: 'v07', name: 'Emma', lang: '英语女声', tag: '自然', desc: '海外投放', color: '#38BDF8' },
  { id: 'v08', name: 'James', lang: '英语男声', tag: '专业', desc: '企业介绍', color: '#C084FC' },
  { id: 'v09', name: '阿怡', lang: '粤语女声', tag: '亲切', desc: '本地化内容', color: '#FB923C' },
  { id: 'v10', name: '小满', lang: '童声', tag: '可爱', desc: '亲子 / 动画', color: '#4ADE80' },
  { id: 'v11', name: '陆沉', lang: '中文男声', tag: '情感', desc: '情感解说', color: '#818CF8' },
  { id: 'v12', name: '林知夏·客服', lang: '中文女声', tag: '标准', desc: '智能客服', color: '#94A3B8' },
];

export default function Tts() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const [text, setText] = useState(
    '这次我们把端侧推理的延迟压到了 38 毫秒，基本做到了实时响应。接下来请看一段实际拍摄的演示。',
  );
  const [voiceId, setVoiceId] = useState('v01');
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [emotion, setEmotion] = useState(60);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ voice: string; duration: number } | null>(null);
  const enqueue = useTaskStore((s) => s.enqueue);
  const voice = VOICES.find((v) => v.id === voiceId)!;
  const chars = text.replace(/\s/g, '').length;
  const estSec = Math.round(chars / 5.2 + 1);

  const generate = () => {
    if (!text.trim()) return message.warning('请输入要合成的文本');
    enqueue({ assetId: 'ast_0001', capability: 'cap_tts', params: { voice: voice.name, speed, chars } });
    setGenerating(true);
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 8 + Math.random() * 10);
        if (next >= 100) {
          clearInterval(t);
          setTimeout(() => {
            setGenerating(false);
            setResult({ voice: voice.name, duration: estSec });
            message.success('合成完成，已生成试听音频');
          }, 300);
        }
        return next;
      });
    }, 300);
  };

  return (
    <div>
      <PageHeader
        title="语音合成"
        subtitle="12 种音色 · 多情感与语速控制 · 支持从字幕轨导入与 SSML 简易标记"
        actions={<Button onClick={() => nav('/tools')}>返回工具集</Button>}
      />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.35fr) minmax(0,1fr) 280px', alignItems: 'start' }}>
        <Panel title="合成文本" extra={<span className="hint">{chars} 字 · 预估 {fmtDuration(estSec)}</span>}>
          <Input.TextArea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入需要合成的文本，单次最多 5,000 字"
            showCount
            maxLength={5000}
          />
          <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
            <Button size="small" onClick={() => setText((t) => `${t}<break time="500ms"/>`)}>
              插入停顿
            </Button>
            <Button size="small" onClick={() => setText((t) => `<emphasis level="strong">${t}</emphasis>`)}>
              强调标记
            </Button>
            <Button size="small" onClick={() => setText((t) => `<prosody rate="slow">${t}</prosody>`)}>
              语速标记
            </Button>
            <Button size="small" onClick={() => message.success('已从字幕轨「发布会主会场 中文 v3」导入 26 句')}>
              从字幕轨导入
            </Button>
            <Button size="small" onClick={() => setText('')}>
              清空
            </Button>
          </div>
          <div className="hint" style={{ marginTop: 8 }}>
            支持 SSML 子集：break / emphasis / prosody / say-as。标记不计入实际播报内容。
          </div>
        </Panel>

        <Panel title="音色库" extra={<span className="hint">共 12 个</span>}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', gap: 8, maxHeight: 470, overflowY: 'auto' }}>
            {VOICES.map((v) => (
              <div
                key={v.id}
                onClick={() => setVoiceId(v.id)}
                style={{
                  border: `1px solid ${voiceId === v.id ? 'var(--brand)' : 'var(--border)'}`,
                  background: voiceId === v.id ? 'var(--brand-soft)' : 'var(--bg-elevated)',
                  borderRadius: 8,
                  padding: '9px 10px',
                  cursor: 'pointer',
                }}
              >
                <div className="row between">
                  <div className="row" style={{ gap: 7 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 12, background: `${v.color}2a`, color: v.color, display: 'grid', placeItems: 'center', fontSize: 11 }}>
                      {v.name.slice(0, 1)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5 }}>{v.name}</div>
                      <div className="hint" style={{ fontSize: 10.5 }}>{v.lang}</div>
                    </div>
                  </div>
                  <PlayCircleOutlined
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      message.info(`试听音色「${v.name}」（演示为模拟播放）`);
                    }}
                  />
                </div>
                <div className="row" style={{ gap: 4, marginTop: 6 }}>
                  <Tag style={{ marginInlineEnd: 0, fontSize: 10 }}>{v.tag}</Tag>
                  <span className="hint" style={{ fontSize: 10.5 }}>{v.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="col" style={{ gap: 14 }}>
          <Panel title="合成参数">
            <div className="col" style={{ gap: 12 }}>
              <div>
                <div className="row between" style={{ fontSize: 12 }}>
                  <span className="text-sec">语速</span>
                  <span>{speed.toFixed(2)}x</span>
                </div>
                <Slider min={0.5} max={2} step={0.05} value={speed} onChange={setSpeed} />
              </div>
              <div>
                <div className="row between" style={{ fontSize: 12 }}>
                  <span className="text-sec">音调</span>
                  <span>{pitch > 0 ? `+${pitch}` : pitch}</span>
                </div>
                <Slider min={-12} max={12} value={pitch} onChange={setPitch} />
              </div>
              <div>
                <div className="row between" style={{ fontSize: 12 }}>
                  <span className="text-sec">情感强度</span>
                  <span>{emotion}</span>
                </div>
                <Slider value={emotion} onChange={setEmotion} />
              </div>
              <div>
                <div className="hint" style={{ marginBottom: 4 }}>输出格式</div>
                <Select size="small" defaultValue="wav" style={{ width: '100%' }} options={[{ value: 'wav', label: 'WAV 48kHz' }, { value: 'mp3', label: 'MP3 320kbps' }, { value: 'aac', label: 'AAC 256kbps' }]} />
              </div>
              <div className="row between" style={{ fontSize: 12.5 }}>
                <span className="text-sec">生成字幕时间轴</span>
                <Switch size="small" defaultChecked />
              </div>
            </div>
            <Button type="primary" block icon={<ThunderboltOutlined />} style={{ marginTop: 14 }} onClick={generate} loading={generating}>
              {generating ? '合成中…' : '开始合成'}
            </Button>
            {generating && <Progress percent={Math.round(progress)} size="small" style={{ marginTop: 10 }} showInfo={false} />}
          </Panel>

          <Panel title="当前音色">
            <div className="row" style={{ gap: 10 }}>
              <CustomerServiceOutlined style={{ fontSize: 22, color: voice.color }} />
              <div>
                <div style={{ fontSize: 13 }}>{voice.name}</div>
                <div className="hint">{voice.lang} · {voice.tag} · {voice.desc}</div>
              </div>
            </div>
            <div className="divider" />
            <div className="hint">适合场景：{voice.desc}。情感强度建议 50–70，语速 0.95–1.05 更自然。</div>
          </Panel>

          {result && (
            <Panel title="生成结果">
              <div className="row between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12.5 }}>{result.voice} · {fmtDuration(result.duration)}</span>
                <a>下载</a>
              </div>
              <Waveform seed={chars * 7} height={44} bars={90} color="var(--success)" />
              <div className="row" style={{ gap: 6, marginTop: 8 }}>
                <Button size="small" icon={<PlayCircleOutlined />} onClick={() => message.info('正在播放合成结果（演示）')}>
                  播放
                </Button>
                <Button size="small" onClick={generate}>
                  重新生成
                </Button>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
