import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Select, Slider, Switch, Progress } from 'antd';
import { ExperimentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PageHeader, Panel, Cover } from '@/components/ui';
import { getAssets } from '@/mock/db';
import { useTaskStore } from '@/stores/tasks';
import { fmtBytes, fmtDuration } from '@/utils/format';

const CASES = [
  { title: '2013 品牌片 · 标清修复', before: '720×576 · 有划痕与噪点', after: '3840×2160 · 去噪 + 插帧', cover: 5, params: '2x / 去噪 45 / 60fps' },
  { title: '夜间发布会 · 暗部提亮', before: '1080P · 暗部噪点明显', after: '4K · HDR + 降噪', cover: 0, params: '2x / 去噪 30 / HDR' },
  { title: '运动镜头 · 拖影修复', before: '1080P · 快速移动拖影', after: '4K · 去模糊 + 插帧', cover: 1, params: '4x / 去模糊 / 60fps' },
  { title: '口播素材 · 皮肤细节', before: '1080P · 压缩块效应', after: '4K · 细节增强', cover: 3, params: '2x / 细节 60' },
];

export default function Enhance() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const assets = getAssets().filter((a) => a.type === 'video');
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [scale, setScale] = useState(2);
  const [denoise, setDenoise] = useState(35);
  const [deblur, setDeblur] = useState(true);
  const [interp, setInterp] = useState(true);
  const [hdr, setHdr] = useState(false);
  const [restore, setRestore] = useState(false);
  const [split, setSplit] = useState(52);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const enqueue = useTaskStore((s) => s.enqueue);
  const asset = assets.find((a) => a.id === assetId);

  const submit = () => {
    if (!asset) return message.warning('请先选择素材');
    enqueue({ assetId, capability: 'cap_enhance', params: { scale, denoise, deblur, interp, hdr }, priority: 'high' });
    setRunning(true);
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 3 + Math.random() * 5);
        if (next >= 100) {
          clearInterval(t);
          setTimeout(() => {
            setRunning(false);
            message.success('增强完成，可在任务详情查看产物');
          }, 400);
        }
        return next;
      });
    }, 500);
  };

  const est = asset ? Math.round((asset.duration * 4.2 + 60) / 60) : 0;

  return (
    <div>
      <PageHeader
        title="画质增强"
        subtitle="超分 / 去噪 / 去模糊 / 插帧 / HDR / 老片修复 · 支持前后对比预览"
        actions={<Button onClick={() => nav('/tools')}>返回工具集</Button>}
      />

      <div className="grid" style={{ gridTemplateColumns: '300px minmax(0,1fr) 290px', alignItems: 'start' }}>
        <div className="col" style={{ gap: 14 }}>
          <Panel title="素材">
            <Select
              showSearch
              value={assetId}
              onChange={setAssetId}
              style={{ width: '100%' }}
              optionFilterProp="label"
              options={assets.map((a) => ({ value: a.id, label: a.title }))}
            />
            <div className="hint" style={{ marginTop: 8 }}>
              {asset ? `${asset.width}×${asset.height} · ${fmtDuration(asset.duration)} · ${fmtBytes(asset.sizeBytes)}` : '—'}
            </div>
          </Panel>

          <Panel title="增强参数">
            <div className="col" style={{ gap: 14 }}>
              <div>
                <div className="hint" style={{ marginBottom: 6 }}>超分倍数</div>
                <div className="row" style={{ gap: 6 }}>
                  {[2, 4].map((s) => (
                    <Button key={s} size="small" type={scale === s ? 'primary' : 'default'} onClick={() => setScale(s)} style={{ flex: 1 }}>
                      {s}x
                    </Button>
                  ))}
                </div>
                <div className="hint" style={{ marginTop: 4 }}>
                  输出 {asset ? `${asset.width! * scale}×${asset.height! * scale}` : '—'}
                </div>
              </div>
              <div>
                <div className="row between" style={{ fontSize: 12, marginBottom: 2 }}>
                  <span className="text-sec">去噪强度</span>
                  <span>{denoise}</span>
                </div>
                <Slider value={denoise} onChange={setDenoise} />
              </div>
              {[
                { label: '去模糊', v: deblur, set: setDeblur, hint: '修复压缩与运动模糊' },
                { label: '插帧 30→60fps', v: interp, set: setInterp, hint: '提升运动流畅度' },
                { label: 'HDR 色调映射', v: hdr, set: setHdr, hint: '暗部提亮，高光不过曝' },
                { label: '老片修复', v: restore, set: setRestore, hint: '去划痕、去闪烁、色彩还原' },
              ].map((o) => (
                <div key={o.label} className="row between">
                  <div>
                    <div style={{ fontSize: 12.5 }}>{o.label}</div>
                    <div className="hint">{o.hint}</div>
                  </div>
                  <Switch size="small" checked={o.v} onChange={o.set} />
                </div>
              ))}
              <div>
                <div className="hint" style={{ marginBottom: 6 }}>输出编码</div>
                <Select size="small" defaultValue="h265" style={{ width: '100%' }} options={[{ value: 'h265', label: 'H.265 / HEVC（推荐）' }, { value: 'h264', label: 'H.264 / AVC' }, { value: 'prores', label: 'ProRes 422 HQ' }]} />
              </div>
            </div>
          </Panel>
        </div>

        <div className="col" style={{ gap: 14 }}>
          <Panel
            title="前后对比"
            extra={<span className="hint">拖动中间分割线对比 · 左为原片，右为增强后</span>}
          >
            <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9' }}>
              <Cover index={asset?.cover || 0} height={0} />
              <div style={{ position: 'absolute', inset: 0 }}>
                <div className={`cover cover-${asset?.cover || 0}`} style={{ position: 'absolute', inset: 0, filter: 'saturate(.6) contrast(.82) blur(1.2px)' }} />
                <div
                  className={`cover cover-${asset?.cover || 0}`}
                  style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${split}%)`, filter: 'saturate(1.12) contrast(1.08)' }}
                />
                <div style={{ position: 'absolute', left: `${split}%`, top: 0, bottom: 0, width: 2, background: '#fff', boxShadow: '0 0 8px rgba(0,0,0,.5)' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%,-50%)',
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      background: 'rgba(255,255,255,.92)',
                      color: '#111',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12,
                      cursor: 'ew-resize',
                    }}
                  >
                    ⇔
                  </div>
                </div>
                <span style={{ position: 'absolute', left: 12, top: 10, color: '#fff', fontSize: 11, background: 'rgba(0,0,0,.45)', padding: '2px 7px', borderRadius: 4 }}>原片</span>
                <span style={{ position: 'absolute', right: 12, top: 10, color: '#fff', fontSize: 11, background: 'rgba(0,0,0,.45)', padding: '2px 7px', borderRadius: 4 }}>增强后 {scale}x</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'ew-resize' }}
                />
              </div>
            </div>
            <div className="row between" style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>细节保留度 <b style={{ color: 'var(--success)' }}>+38%</b></span>
              <span>噪点下降 <b style={{ color: 'var(--success)' }}>-62%</b></span>
              <span>预估画质评分 <b style={{ color: 'var(--accent)' }}>4.6 / 5</b></span>
            </div>
          </Panel>

          <Panel title="修复案例" extra={<a>查看更多案例 →</a>}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {CASES.map((c) => (
                <div key={c.title} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ position: 'relative', height: 74 }}>
                    <div className={`cover cover-${c.cover}`} style={{ position: 'absolute', inset: 0, filter: 'blur(1px) saturate(.6)' }} />
                    <div className={`cover cover-${c.cover}`} style={{ position: 'absolute', inset: 0, clipPath: 'inset(0 0 0 50%)' }} />
                  </div>
                  <div style={{ padding: 8 }}>
                    <div style={{ fontSize: 12 }}>{c.title}</div>
                    <div className="hint">{c.params}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="col" style={{ gap: 14 }}>
          <Panel title="任务预估">
            <div className="col" style={{ gap: 9, fontSize: 12.5 }}>
              <div className="row between">
                <span className="text-sec">预估耗时</span>
                <span>{est} 分钟</span>
              </div>
              <div className="row between">
                <span className="text-sec">GPU 占用</span>
                <span>{scale === 4 ? '18.6 GB' : '9.4 GB'}</span>
              </div>
              <div className="row between">
                <span className="text-sec">预估消耗</span>
                <span>¥ {((asset?.duration || 0) / 60 * 2.4).toFixed(2)}</span>
              </div>
              <div className="row between">
                <span className="text-sec">输出大小</span>
                <span>{asset ? fmtBytes(asset.sizeBytes * (scale === 4 ? 1.6 : 1.2)) : '—'}</span>
              </div>
            </div>
            {scale === 4 && (
              <div style={{ marginTop: 10, padding: '7px 9px', borderRadius: 6, background: 'rgba(251,191,36,.1)', fontSize: 11.5, color: 'var(--warning)' }}>
                4x 超分需要 18.6 GB 显存，当前 GPU-03 仅剩 15.2 GB，建议使用 GPU-01 或改为 2x。
              </div>
            )}
            <Button type="primary" block icon={<ThunderboltOutlined />} style={{ marginTop: 12 }} onClick={submit} loading={running}>
              {running ? '增强中…' : '开始增强'}
            </Button>
            {running && <Progress percent={Math.round(progress)} size="small" style={{ marginTop: 10 }} strokeColor="#F472B6" />}
            <div className="hint" style={{ marginTop: 8 }}>
              任务提交后可离开页面，处理完成后会收到通知。
            </div>
          </Panel>

          <Panel title="能力提示">
            <div className="col" style={{ gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <ExperimentOutlined style={{ color: 'var(--purple)', marginTop: 3 }} />
                <span>2x 超分适合 1080P → 4K 分发；4x 更适合标清素材修复，成本约为 2x 的 2.6 倍。</span>
              </div>
              <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <ExperimentOutlined style={{ color: 'var(--accent)', marginTop: 3 }} />
                <span>去噪强度超过 60 会损失皮肤纹理，人像素材建议 30–40。</span>
              </div>
              <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <ExperimentOutlined style={{ color: 'var(--success)', marginTop: 3 }} />
                <span>插帧对 24/25fps 素材效果最明显，但会显著增加编码耗时。</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
