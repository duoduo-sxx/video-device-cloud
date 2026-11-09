import React, { useEffect, useRef, useState } from 'react';
import { Card, Tabs, Button, Slider, Select, Input, Space, Typography, Tag, Progress, message } from 'antd';
import {
  AudioOutlined, SoundOutlined, PlayCircleOutlined, PauseCircleOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import * as api from '@/api';

// 伪波形组件
const Waveform: React.FC<{ active: boolean; seed: number[] }> = ({ active, seed }) => (
  <div style={{ display: 'flex', alignItems: 'center', height: 60, justifyContent: 'center' }}>
    {seed.map((h, i) => (
      <span
        key={i}
        className="wave-bar"
        style={{
          height: Math.max(6, h * 0.6),
          animationDelay: `${i * 0.05}s`,
          animationPlayState: active ? 'running' : 'paused',
          opacity: active ? 1 : 0.25,
        }}
      />
    ))}
  </div>
);

const TtsTab: React.FC = () => {
  const [text, setText] = useState('您好，欢迎使用智能交互与理解平台，我们的语义引擎可以精准识别您的每一个问题。');
  const [voice, setVoice] = useState('女声·温柔');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [synthing, setSynthing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const synthesize = async () => {
    if (!text.trim()) return message.warning('请输入要合成的文本');
    setSynthing(true);
    const res = await api.ttsSynthesize(text, { voice, rate, pitch });
    setSynthing(false);
    setWaveform(res.data.waveform);
    setDuration(res.data.duration);
    message.success('合成完成（模拟音频，仅演示）');
    play();
  };

  const play = () => {
    setPlaying(true);
    setProgress(0);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 100 / (duration * 10);
        if (next >= 100) {
          clearInterval(timer.current!);
          setPlaying(false);
          return 100;
        }
        return next;
      });
    }, 100);
  };

  const stop = () => {
    setPlaying(false);
    if (timer.current) clearInterval(timer.current);
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Card size="small" title={<span><SoundOutlined /> 文本转语音 TTS（模拟）</span>}>
        <Input.TextArea rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={200} showCount />
        <Space style={{ marginTop: 16 }} wrap size={40}>
          <div>
            <Typography.Text type="secondary">音色</Typography.Text>
            <div><Select style={{ width: 160 }} value={voice} onChange={setVoice}
              options={['女声·温柔', '男声·沉稳', '童声·活泼', '女声·新闻'].map((v) => ({ value: v, label: v }))} /></div>
          </div>
          <div>
            <Typography.Text type="secondary">语速 {rate.toFixed(1)}x</Typography.Text>
            <Slider style={{ width: 160 }} min={0.5} max={2} step={0.1} value={rate} onChange={setRate} />
          </div>
          <div>
            <Typography.Text type="secondary">音调 {pitch.toFixed(1)}</Typography.Text>
            <Slider style={{ width: 160 }} min={0.5} max={2} step={0.1} value={pitch} onChange={setPitch} />
          </div>
        </Space>
        <div style={{ marginTop: 20 }}>
          <Button type="primary" icon={<ThunderboltOutlined />} loading={synthing} onClick={synthesize}>合成语音</Button>
        </div>
        {waveform.length > 0 && (
          <Card size="small" style={{ marginTop: 16 }}>
            <Waveform active={playing} seed={waveform} />
            <Progress percent={Math.round(progress)} size="small" strokeColor="#2563EB" />
            <Space style={{ marginTop: 8 }}>
              {playing
                ? <Button icon={<PauseCircleOutlined />} onClick={stop}>暂停</Button>
                : <Button icon={<PlayCircleOutlined />} onClick={play}>播放</Button>}
              <Tag>时长约 {duration.toFixed(1)}s</Tag>
              <Tag>音色：{voice}</Tag>
            </Space>
          </Card>
        )}
      </Card>
    </div>
  );
};

const AsrTab: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [segments, setSegments] = useState<api.AsrSegment[]>([]);
  const seed = Array.from({ length: 60 }, (_, i) => 30 + Math.abs(Math.sin(i * 1.7)) * 60);

  const start = async () => {
    setRecording(true);
    setSegments([]);
    const res = await api.asrRecognize();
    setRecording(false);
    setSegments(res.data);
    message.success('识别完成（模拟，未使用真实麦克风）');
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Card size="small" title={<span><AudioOutlined /> 语音转文字 ASR（模拟）</span>}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Button
            type={recording ? 'default' : 'primary'}
            shape="circle"
            size="large"
            icon={<AudioOutlined style={{ fontSize: 28 }} />}
            style={{ width: 72, height: 72, boxShadow: recording ? '0 0 0 8px rgba(220,38,38,.15)' : undefined }}
            onClick={start}
            disabled={recording}
          />
          <div style={{ marginTop: 16, color: recording ? '#dc2626' : '#999' }}>
            {recording ? '正在聆听并识别中…（约 3 秒）' : '点击麦克风开始模拟识别'}
          </div>
          <Waveform active={recording} seed={seed} />
        </div>
        {segments.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {segments.map((s, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px dashed rgba(128,128,128,.2)' }}>
                <Tag>{s.time}</Tag>
                <span>
                  {s.text.split('').map((ch, j) =>
                    s.lowConfidenceWords.some((w) => s.text.slice(Math.max(0, j - 2), j + 2).includes(w) && w.includes(ch)) ? (
                      <span key={j} style={{ color: '#999', borderBottom: '1px dotted #999' }}>{ch}</span>
                    ) : (
                      <span key={j}>{ch}</span>
                    ),
                  )}
                </span>
                <Tag style={{ marginLeft: 8 }} color="default">置信 94%</Tag>
              </div>
            ))}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>灰色虚线下划线标记为低置信度词，点击可人工校对（演示）</Typography.Text>
          </div>
        )}
      </Card>
    </div>
  );
};

const VoiceDemo: React.FC = () => (
  <Card size="small">
    <Tabs
      items={[
        { key: 'tts', label: '语音合成 TTS', children: <TtsTab /> },
        { key: 'asr', label: '语音识别 ASR', children: <AsrTab /> },
      ]}
    />
  </Card>
);

export default VoiceDemo;
