import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CaretRightOutlined,
  PauseOutlined,
  SoundOutlined,
  FullscreenOutlined,
  CameraOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import { App } from 'antd';
import { fmtDuration } from '@/utils/format';

export function useMockPlayback(duration: number, initialTime = 0) {
  const [time, setTime] = useState(initialTime);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setTime((t) => {
        if (t + 0.25 >= duration) {
          setPlaying(false);
          return duration;
        }
        return t + 0.25;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [playing, duration]);

  const seek = useCallback(
    (t: number) => setTime(Math.min(duration, Math.max(0, t))),
    [duration],
  );

  return { time, playing, setPlaying, toggle: () => setPlaying((p) => !p), seek, setTime };
}

export function MockPlayer({
  duration,
  title,
  cover = 0,
  time,
  playing,
  onToggle,
  onSeek,
  compact,
  height,
}: {
  duration: number;
  title: string;
  cover?: number;
  time: number;
  playing: boolean;
  onToggle: () => void;
  onSeek: (t: number) => void;
  compact?: boolean;
  height?: number;
}) {
  const { message } = App.useApp();
  const boxRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState('1080P');
  const pct = duration > 0 ? (time / duration) * 100 : 0;

  const onTrack = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  };

  return (
    <div className="player" ref={boxRef}>
      <div className={`stage cover-${cover % 8}`} style={height ? { height, aspectRatio: 'auto' } : undefined}>
        <div className="overlay-grain" />
        {!playing && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              zIndex: 3,
              cursor: 'pointer',
            }}
            onClick={onToggle}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(255,255,255,.16)',
                backdropFilter: 'blur(4px)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontSize: 20,
              }}
            >
              <CaretRightOutlined />
            </div>
          </div>
        )}
        <div className="big-title">{title}</div>
        <div style={{ position: 'absolute', left: 14, top: 12, zIndex: 3, color: 'rgba(255,255,255,.55)', fontSize: 11 }}>
          {quality} · H.264 · {compact ? '预览' : '在线播放'}
        </div>
      </div>
      <div className="ctrl">
        <div className="pbtn" onClick={onToggle}>
          {playing ? <PauseOutlined /> : <CaretRightOutlined />}
        </div>
        <span className="t">
          {fmtDuration(time)} / {fmtDuration(duration)}
        </span>
        <div className="track" onClick={onTrack}>
          <div className="bar" style={{ width: `${pct}%` }} />
          <div className="knob" style={{ left: `${pct}%` }} />
        </div>
        {!compact && (
          <>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{ background: 'transparent', color: 'rgba(255,255,255,.72)', border: 0, fontSize: 11, outline: 'none' }}
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                <option key={s} value={s} style={{ color: '#111' }}>
                  {s}x
                </option>
              ))}
            </select>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              style={{ background: 'transparent', color: 'rgba(255,255,255,.72)', border: 0, fontSize: 11, outline: 'none' }}
            >
              {['4K', '1080P', '720P'].map((q) => (
                <option key={q} value={q} style={{ color: '#111' }}>
                  {q}
                </option>
              ))}
            </select>
            <div className="pbtn" title="音量">
              <SoundOutlined />
            </div>
            <div className="pbtn" title="截图" onClick={() => message.success(`已截取 ${fmtDuration(time)} 画面（模拟）`)}>
              <CameraOutlined />
            </div>
            <div
              className="pbtn"
              title="全屏"
              onClick={() => {
                if (boxRef.current?.requestFullscreen) boxRef.current.requestFullscreen().catch(() => undefined);
              }}
            >
              <FullscreenOutlined />
            </div>
            <div className="pbtn" title="画中画" onClick={() => message.info('画中画为演示态，桌面端将支持独立窗口')}>
              <ExpandOutlined />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
