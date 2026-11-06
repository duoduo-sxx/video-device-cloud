import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App, Button, Input, Modal, Select, Space, Tag, Tooltip } from 'antd';
import {
  AlignCenterOutlined,
  CheckOutlined,
  DownloadOutlined,
  NodeIndexOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  ScissorOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { PageHeader, Panel, EmptyState } from '@/components/ui';
import { MockPlayer, useMockPlayback } from '@/components/MockPlayer';
import { Waveform } from '@/components/Waveform';
import { getAsset, saveSubtitleTrack } from '@/mock/db';
import { useCurrentUser } from '@/stores/app';
import type { SubtitleLine, SubtitleTrack } from '@/types';
import { clamp, fmtTimecode, fmtDuration, hashString, parseTimecode } from '@/utils/format';

const STYLES = [
  { id: 'style_std', name: '标准白字黑边', font: 26, stroke: 2, bg: 'transparent' },
  { id: 'style_variety', name: '综艺描边', font: 30, stroke: 4, bg: 'transparent' },
  { id: 'style_minimal', name: '极简下划', font: 24, stroke: 0, bg: 'rgba(0,0,0,.35)' },
  { id: 'style_bilingual', name: '双语上下', font: 22, stroke: 2, bg: 'rgba(0,0,0,.28)' },
];

function toSrt(lines: SubtitleLine[]): string {
  return lines
    .map((l, i) => `${i + 1}\n${fmtTimecode(l.start)} --> ${fmtTimecode(l.end)}\n${l.text}\n`)
    .join('\n');
}

export default function SubtitleWorkshop() {
  const { assetId = '' } = useParams();
  const nav = useNavigate();
  const { message, modal } = App.useApp();
  const user = useCurrentUser();
  const asset = getAsset(assetId);
  const dur = Math.max(1, asset?.duration || 100);

  const [tracks, setTracks] = useState<SubtitleTrack[]>(() => (asset ? JSON.parse(JSON.stringify(asset.subtitleTracks)) : []));
  const [activeId, setActiveId] = useState(tracks[0]?.id || '');
  const [selectedId, setSelectedId] = useState(tracks[0]?.lines[0]?.id || '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [history, setHistory] = useState<SubtitleTrack[][]>([]);
  const [styleId, setStyleId] = useState(tracks[0]?.styleId || 'style_std');
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const pb = useMockPlayback(dur, tracks[0]?.lines[0]?.start || 0);
  const track = tracks.find((t) => t.id === activeId);
  const lines = track?.lines || [];
  const selected = lines.find((l) => l.id === selectedId);
  const style = STYLES.find((s) => s.id === styleId) || STYLES[0];

  const bodyRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; mode: 'move' | 'left' | 'right'; startX: number; s: number; e: number; width: number } | null>(null);

  const pushHistory = useCallback(() => {
    setHistory((h) => [JSON.parse(JSON.stringify(tracks)), ...h].slice(0, 10));
  }, [tracks]);

  const mutate = useCallback(
    (updater: (list: SubtitleLine[]) => SubtitleLine[]) => {
      pushHistory();
      setTracks((prev) => prev.map((t) => (t.id === activeId ? { ...t, lines: updater(t.lines) } : t)));
      setDirty(true);
    },
    [activeId, pushHistory],
  );

  const save = useCallback(() => {
    if (!track || !asset) return;
    const next = { ...track, version: track.version + 1, updatedAt: new Date().toISOString(), updatedBy: user.id, styleId };
    saveSubtitleTrack(asset.id, next);
    setTracks((prev) => prev.map((t) => (t.id === next.id ? next : t)));
    setDirty(false);
    message.success(`已保存 v${next.version}`);
  }, [track, asset, styleId, user.id, message]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Escape') setEditingId(null);
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        pb.toggle();
      } else if (e.key === 'ArrowLeft') {
        pb.seek(pb.time - 0.5);
      } else if (e.key === 'ArrowRight') {
        pb.seek(pb.time + 0.5);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = lines.findIndex((l) => l.id === selectedId);
        const next = lines[clamp(idx + (e.key === 'ArrowUp' ? -1 : 1), 0, lines.length - 1)];
        if (next) {
          setSelectedId(next.id);
          pb.seek(next.start);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dt = ((e.clientX - d.startX) / d.width) * dur;
      setTracks((prev) =>
        prev.map((t) => {
          if (t.id !== activeId) return t;
          return {
            ...t,
            lines: t.lines.map((l) => {
              if (l.id !== d.id) return l;
              if (d.mode === 'move') {
                const len = d.e - d.s;
                const start = clamp(d.s + dt, 0, dur - len);
                return { ...l, start: Number(start.toFixed(2)), end: Number((start + len).toFixed(2)) };
              }
              if (d.mode === 'left') return { ...l, start: Number(clamp(d.s + dt, 0, l.end - 0.4).toFixed(2)) };
              return { ...l, end: Number(clamp(d.e + dt, l.start + 0.4, dur).toFixed(2)) };
            }),
          };
        }),
      );
      setDirty(true);
    };
    const onUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [activeId, dur]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      setTracks(h[0]);
      setDirty(true);
      return h.slice(1);
    });
  }, []);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const stats = useMemo(() => {
    const low = lines.filter((l) => l.confidence < 0.85).length;
    const long = lines.filter((l) => l.text.length > 24).length;
    const fast = lines.filter((l) => l.end - l.start < 1.2).length;
    return { low, long, fast, reviewed: lines.filter((l) => l.reviewed).length };
  }, [lines]);

  if (!asset) return <Panel>素材不存在。</Panel>;

  const seekByClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pb.seek(((e.clientX - rect.left) / rect.width) * dur);
  };

  const splitLine = () => {
    if (!selected) return;
    const mid = Number(((selected.start + selected.end) / 2).toFixed(2));
    mutate((list) => {
      const idx = list.findIndex((l) => l.id === selected.id);
      const a = { ...selected, end: mid };
      const b = { ...selected, id: `${selected.id}_s${Date.now()}`, start: mid, text: selected.text.slice(Math.floor(selected.text.length / 2)), reviewed: false };
      const c = { ...a, text: selected.text.slice(0, Math.floor(selected.text.length / 2)) || selected.text };
      return [...list.slice(0, idx), c, b, ...list.slice(idx + 1)].map((l, i) => ({ ...l, index: i + 1 }));
    });
    message.success('已按时间中点拆分');
  };

  const mergeNext = () => {
    if (!selected) return;
    const idx = lines.findIndex((l) => l.id === selected.id);
    const next = lines[idx + 1];
    if (!next) return message.warning('已是最后一句');
    mutate((list) => {
      const merged: SubtitleLine = { ...selected, end: next.end, text: `${selected.text}${next.text}`, reviewed: false };
      return [...list.slice(0, idx), merged, ...list.slice(idx + 2)].map((l, i) => ({ ...l, index: i + 1 }));
    });
  };

  const exportSrt = () => {
    const content = toSrt(lines);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${asset.title.slice(0, 20)}_${track?.language || 'zh'}_v${track?.version || 1}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${lines.length} 行字幕`);
  };

  const aiRealign = () => {
    mutate((list) =>
      list.map((l) => {
        const len = clamp(l.text.length * 0.19, 1.2, 6);
        return { ...l, end: Number(Math.min(l.start + len, dur).toFixed(2)) };
      }),
    );
    message.success('已按语速重新对齐时间轴，共调整 ' + lines.length + ' 行');
  };

  const aiRepunct = () => {
    mutate((list) => list.map((l) => ({ ...l, text: l.text.replace(/，$/, '。').replace(/([。！？])\1+/, '$1') })));
    message.success('已重新断句，修正重复标点');
  };

  const doReplace = () => {
    if (!findText) return message.warning('请输入要查找的内容');
    let count = 0;
    mutate((list) =>
      list.map((l) => {
        if (!l.text.includes(findText)) return l;
        count += l.text.split(findText).length - 1;
        return { ...l, text: l.text.split(findText).join(replaceText) };
      }),
    );
    setReplaceOpen(false);
    message.success(`已替换 ${count} 处`);
  };

  return (
    <div>
      <PageHeader
        title={
          <span className="row" style={{ gap: 10 }}>
            字幕工坊
            {dirty && <span style={{ width: 7, height: 7, borderRadius: 4, background: 'var(--warning)', display: 'inline-block' }} title="有未保存修改" />}
          </span>
        }
        subtitle={`${asset.title} · ${track?.language === 'en' ? '英文' : track?.language === 'bi' ? '双语' : '中文'} v${track?.version} · ${lines.length} 行 · ${fmtDuration(dur)}`}
        actions={
          <>
            <Tooltip title="Cmd/Ctrl + Z">
              <Button icon={<UndoOutlined />} onClick={undo} disabled={!history.length}>
                撤销
              </Button>
            </Tooltip>
            <Button icon={<DownloadOutlined />} onClick={exportSrt}>
              导出 SRT
            </Button>
            <Button type="primary" icon={<CheckOutlined />} onClick={save} disabled={!dirty}>
              保存
            </Button>
          </>
        }
      />

      <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
        <Button size="small" icon={<NodeIndexOutlined />} onClick={aiRealign}>
          AI 重新对齐
        </Button>
        <Button size="small" icon={<AlignCenterOutlined />} onClick={aiRepunct}>
          AI 重新断句
        </Button>
        <Button size="small" onClick={() => setReplaceOpen(true)}>
          批量替换
        </Button>
        <Button size="small" icon={<ScissorOutlined />} onClick={splitLine}>
          拆分
        </Button>
        <Button size="small" onClick={mergeNext}>
          合并下一句
        </Button>
        <Button size="small" icon={<PlayCircleOutlined />} onClick={() => pb.seek(selected?.start || 0)}>
          定位当前句
        </Button>
        <div className="spacer" style={{ flex: 1 }} />
        <span className="hint">快捷键：Space 播放 · ←/→ ±0.5s · ↑/↓ 上下句 · Cmd+S 保存</span>
      </div>

      <div className="sub-editor">
        {/* 左：轨道 */}
        <div className="col" style={{ gap: 12 }}>
          <Panel title="字幕轨" className="tight">
            <div className="col" style={{ gap: 6 }}>
              {tracks.map((t) => (
                <div
                  key={t.id}
                  className="row between clickable"
                  onClick={() => {
                    setActiveId(t.id);
                    setSelectedId(t.lines[0]?.id || '');
                  }}
                  style={{
                    padding: '7px 9px',
                    borderRadius: 7,
                    border: `1px solid ${t.id === activeId ? 'var(--brand)' : 'var(--border)'}`,
                    background: t.id === activeId ? 'var(--brand-soft)' : 'transparent',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12.5 }}>{t.language === 'zh' ? '中文' : t.language === 'en' ? '英文' : '双语'}</div>
                    <div className="hint">v{t.version} · {t.lines.length} 行</div>
                  </div>
                  <Button
                    size="small"
                    type="text"
                    onClick={(e) => {
                      e.stopPropagation();
                      const copy: SubtitleTrack = { ...JSON.parse(JSON.stringify(t)), id: `${t.id}_c${Date.now()}`, version: 1, updatedAt: new Date().toISOString() };
                      setTracks([...tracks, copy]);
                      message.success('已复制字幕轨');
                    }}
                  >
                    复制
                  </Button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="样式模板" className="tight">
            <div className="col" style={{ gap: 6 }}>
              {STYLES.map((s) => (
                <div
                  key={s.id}
                  className="row between clickable"
                  onClick={() => {
                    setStyleId(s.id);
                    setDirty(true);
                  }}
                  style={{
                    padding: '6px 9px',
                    borderRadius: 7,
                    border: `1px solid ${styleId === s.id ? 'var(--brand)' : 'var(--border)'}`,
                    fontSize: 12,
                  }}
                >
                  {s.name}
                  {styleId === s.id && <CheckOutlined style={{ color: 'var(--brand)' }} />}
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="col" style={{ gap: 8, fontSize: 12 }}>
              <div className="row between">
                <span className="text-sec">字号</span>
                <span>{style.font}px</span>
              </div>
              <div className="row between">
                <span className="text-sec">描边</span>
                <span>{style.stroke}px</span>
              </div>
              <div className="row between">
                <span className="text-sec">位置</span>
                <span>底部居中</span>
              </div>
            </div>
          </Panel>

          <Panel title="质量检查" className="tight">
            <div className="col" style={{ gap: 7, fontSize: 12 }}>
              <div className="row between">
                <span className="text-sec">低置信度</span>
                <Tag color={stats.low > 0 ? 'warning' : 'default'} style={{ marginInlineEnd: 0 }}>{stats.low} 行</Tag>
              </div>
              <div className="row between">
                <span className="text-sec">长句（&gt;24 字）</span>
                <Tag color={stats.long > 0 ? 'warning' : 'default'} style={{ marginInlineEnd: 0 }}>{stats.long} 行</Tag>
              </div>
              <div className="row between">
                <span className="text-sec">时长过短</span>
                <Tag color={stats.fast > 0 ? 'warning' : 'default'} style={{ marginInlineEnd: 0 }}>{stats.fast} 行</Tag>
              </div>
              <div className="row between">
                <span className="text-sec">已校对</span>
                <span>{stats.reviewed} / {lines.length}</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* 中：播放器 + 时间轴 + 列表 */}
        <div className="col" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 12, alignItems: 'stretch' }}>
            <div style={{ width: 260, flex: '0 0 260px' }}>
              <MockPlayer
                duration={dur}
                title={asset.title}
                cover={asset.cover}
                time={pb.time}
                playing={pb.playing}
                onToggle={pb.toggle}
                onSeek={pb.seek}
                compact
                height={146}
              />
            </div>
            <div
              className="panel"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: 186,
                background: selected ? 'linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.75))' : 'var(--bg-panel)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  color: '#fff',
                  fontSize: style.font,
                  lineHeight: 1.5,
                  textShadow: style.stroke
                    ? `${style.stroke}px 0 0 #000, 0 ${style.stroke}px 0 #000, -${style.stroke}px 0 0 #000, 0 -${style.stroke}px 0 #000`
                    : 'none',
                  background: style.bg,
                  padding: '4px 12px',
                  borderRadius: 4,
                  maxWidth: '92%',
                }}
              >
                {selected?.text || '选择一句字幕开始编辑'}
              </div>
              <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 10.5, color: 'rgba(255,255,255,.4)' }}>
                {selected ? `${fmtTimecode(selected.start)} → ${fmtTimecode(selected.end)}` : ''}
              </div>
            </div>
          </div>

          <div className="tl">
            <div className="tl-ruler" ref={bodyRef}>
              {Array.from({ length: Math.floor(dur / 30) + 1 }, (_, i) => (
                <span key={i} style={{ left: `${((i * 30) / dur) * 100}%` }}>
                  {fmtDuration(i * 30)}
                </span>
              ))}
            </div>
            <div className="tl-body" onClick={seekByClick}>
              <div style={{ position: 'absolute', inset: '4px 0 4px 0', opacity: 0.28 }}>
                <Waveform seed={hashString(asset.id)} progress={pb.time / dur} height={76} bars={220} />
              </div>
              {lines.map((l) => (
                <div
                  key={l.id}
                  className={`tl-block ${l.id === selectedId ? 'active' : ''}`}
                  style={{ left: `${(l.start / dur) * 100}%`, width: `${Math.max(0.4, ((l.end - l.start) / dur) * 100)}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(l.id);
                    pb.seek(l.start);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                    dragRef.current = { id: l.id, mode: 'move', startX: e.clientX, s: l.start, e: l.end, width: rect.width };
                    setSelectedId(l.id);
                  }}
                >
                  <span
                    className="tl-handle"
                    style={{ left: 0 }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const rect = (e.currentTarget.parentElement?.parentElement as HTMLElement).getBoundingClientRect();
                      dragRef.current = { id: l.id, mode: 'left', startX: e.clientX, s: l.start, e: l.end, width: rect.width };
                    }}
                  />
                  {l.text.slice(0, 14)}
                  <span
                    className="tl-handle"
                    style={{ right: 0 }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const rect = (e.currentTarget.parentElement?.parentElement as HTMLElement).getBoundingClientRect();
                      dragRef.current = { id: l.id, mode: 'right', startX: e.clientX, s: l.start, e: l.end, width: rect.width };
                    }}
                  />
                </div>
              ))}
              <div className="tl-play" style={{ left: `${(pb.time / dur) * 100}%` }} />
            </div>
          </div>

          <Panel
            noPad
            title={`字幕列表（${lines.length} 行）`}
            extra={<span className="hint">双击文本可直接编辑 · 点击时间码跳转</span>}
          >
            <div style={{ maxHeight: 340, overflowY: 'auto', padding: '0 12px 12px' }}>
              <div className="sub-row" style={{ color: 'var(--text-tertiary)', fontSize: 11, cursor: 'default' }}>
                <span>#</span>
                <span>时间码</span>
                <span>文本</span>
                <span>置信度</span>
                <span />
              </div>
              {lines.map((l) => (
                <div
                  key={l.id}
                  className={`sub-row ${l.id === selectedId ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedId(l.id);
                    pb.seek(l.start);
                  }}
                >
                  <span className="hint">{l.index}</span>
                  <span
                    className="tc clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      pb.seek(l.start);
                      setSelectedId(l.id);
                    }}
                  >
                    {fmtTimecode(l.start)} → {fmtTimecode(l.end).slice(0, 8)}
                  </span>
                  {editingId === l.id ? (
                    <Input
                      size="small"
                      autoFocus
                      defaultValue={l.text}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== l.text) mutate((list) => list.map((x) => (x.id === l.id ? { ...x, text: v, reviewed: true } : x)));
                        setEditingId(null);
                      }}
                      onPressEnter={(e) => {
                        const v = (e.target as HTMLInputElement).value.trim();
                        if (v) mutate((list) => list.map((x) => (x.id === l.id ? { ...x, text: v, reviewed: true } : x)));
                        setEditingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                  ) : (
                    <span onDoubleClick={() => setEditingId(l.id)} style={{ fontSize: 12.5 }}>
                      {l.text}
                    </span>
                  )}
                  <span style={{ color: l.confidence < 0.85 ? 'var(--warning)' : 'var(--text-tertiary)', fontSize: 11 }}>
                    {(l.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="row" style={{ gap: 2 }}>
                    {!l.reviewed && <span title="未校对" style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--warning)' }} />}
                  </span>
                </div>
              ))}
              {lines.length === 0 && (
                <EmptyState title="暂无字幕" desc="可先发起语音转写，再回到此处精修。" action={<Button onClick={() => nav('/tools/asr')}>去转写</Button>} />
              )}
            </div>
          </Panel>
        </div>

        {/* 右：检查器 */}
        <div className="col" style={{ gap: 12 }}>
          <Panel title="当前句" className="tight">
            {!selected ? (
              <div className="hint">未选中字幕行。</div>
            ) : (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <div>
                  <div className="hint" style={{ marginBottom: 4 }}>文本</div>
                  <Input.TextArea
                    key={selected.id}
                    defaultValue={selected.text}
                    autoSize={{ minRows: 2, maxRows: 5 }}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTracks((prev) =>
                        prev.map((t) => (t.id === activeId ? { ...t, lines: t.lines.map((l) => (l.id === selected.id ? { ...l, text: v } : l)) } : t)),
                      );
                      setDirty(true);
                    }}
                  />
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div className="hint" style={{ marginBottom: 4 }}>开始</div>
                    <Input
                      size="small"
                      defaultValue={fmtTimecode(selected.start)}
                      key={`s-${selected.id}-${selected.start}`}
                      onBlur={(e) => {
                        const v = parseTimecode(e.target.value);
                        if (v === null) return message.error('时间码格式应为 00:00:00,000');
                        mutate((list) => list.map((l) => (l.id === selected.id ? { ...l, start: Math.min(v, l.end - 0.4) } : l)));
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="hint" style={{ marginBottom: 4 }}>结束</div>
                    <Input
                      size="small"
                      defaultValue={fmtTimecode(selected.end)}
                      key={`e-${selected.id}-${selected.end}`}
                      onBlur={(e) => {
                        const v = parseTimecode(e.target.value);
                        if (v === null) return message.error('时间码格式应为 00:00:00,000');
                        mutate((list) => list.map((l) => (l.id === selected.id ? { ...l, end: Math.max(v, l.start + 0.4) } : l)));
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="hint" style={{ marginBottom: 4 }}>说话人</div>
                  <Select
                    size="small"
                    value={selected.speaker}
                    style={{ width: '100%' }}
                    onChange={(v) => mutate((list) => list.map((l) => (l.id === selected.id ? { ...l, speaker: v } : l)))}
                    options={['主讲人', '主持人', '嘉宾 B', '画外音'].map((s) => ({ value: s, label: s }))}
                  />
                </div>
                <div className="row between" style={{ fontSize: 12 }}>
                  <span className="text-sec">置信度</span>
                  <Tag color={selected.confidence < 0.85 ? 'warning' : 'green'} style={{ marginInlineEnd: 0 }}>
                    {(selected.confidence * 100).toFixed(1)}%
                  </Tag>
                </div>
                <Button size="small" block icon={<CheckOutlined />} onClick={() => mutate((list) => list.map((l) => (l.id === selected.id ? { ...l, reviewed: true } : l)))}>
                  标记为已校对
                </Button>
              </Space>
            )}
          </Panel>

          <Panel title="AI 建议" className="tight">
            <div className="col" style={{ gap: 9, fontSize: 12 }}>
              {stats.fast > 0 && (
                <div style={{ borderLeft: '2px solid var(--warning)', paddingLeft: 8 }}>
                  检测到 {stats.fast} 行时长不足 1.2 秒，建议合并或延长停留时间。
                  <div style={{ marginTop: 4 }}>
                    <Button size="small" type="link" style={{ padding: 0 }} onClick={() => { aiRealign(); }}>
                      一键修正
                    </Button>
                  </div>
                </div>
              )}
              {stats.long > 0 && (
                <div style={{ borderLeft: '2px solid var(--brand)', paddingLeft: 8 }}>
                  {stats.long} 行超过 24 字，移动端观看会折行，建议每行不超过 18 字。
                </div>
              )}
              {stats.low > 0 && (
                <div style={{ borderLeft: '2px solid var(--danger)', paddingLeft: 8 }}>
                  {stats.low} 行置信度低于 85%，多为专有名词，建议加入热词表后重新转写。
                </div>
              )}
              <div style={{ borderLeft: '2px solid var(--success)', paddingLeft: 8 }}>
                术语一致性检查通过：「端侧推理」出现 6 次，写法统一。
              </div>
            </div>
          </Panel>

          <Panel title="操作历史" className="tight" extra={<span className="hint">{history.length}/10</span>}>
            <div className="col" style={{ gap: 7, fontSize: 11.5, color: 'var(--text-secondary)' }}>
              {history.length === 0 && <span className="hint">暂无撤销记录</span>}
              {history.slice(0, 6).map((_, i) => (
                <div key={i} className="row between">
                  <span>编辑字幕（{i + 1} 步前）</span>
                  <span className="hint">{lines.length} 行</span>
                </div>
              ))}
            </div>
            {history.length > 0 && (
              <Button size="small" block icon={<RedoOutlined />} style={{ marginTop: 8 }} onClick={undo}>
                撤销上一步
              </Button>
            )}
          </Panel>
        </div>
      </div>

      <Modal
        title="批量替换"
        open={replaceOpen}
        onCancel={() => setReplaceOpen(false)}
        onOk={doReplace}
        okText="替换全部"
        cancelText="取消"
      >
        <div className="col" style={{ gap: 10 }}>
          <Input placeholder="查找内容" value={findText} onChange={(e) => setFindText(e.target.value)} />
          <Input placeholder="替换为" value={replaceText} onChange={(e) => setReplaceText(e.target.value)} />
          <div className="hint">将作用于当前字幕轨的全部 {lines.length} 行，可用撤销回退。</div>
        </div>
      </Modal>

      <Modal
        title="离开字幕工坊？"
        open={false}
        onOk={() => nav(-1)}
        onCancel={() => undefined}
      >
        当前有未保存的修改。
      </Modal>
    </div>
  );
}
