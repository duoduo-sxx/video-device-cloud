import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Input, Segmented, Select, Slider, Tag, Tooltip, message } from 'antd'
import {
  ArrowLeftOutlined, BgColorsOutlined, CaretRightOutlined, CloudUploadOutlined, DeleteOutlined,
  ExpandOutlined, FileTextOutlined, HighlightOutlined, PauseOutlined, PlusOutlined,
  SoundOutlined, ThunderboltOutlined, ZoomInOutlined, ZoomOutOutlined,
} from '@ant-design/icons'
import { PageHeader, EmptyState } from '@/components/ui'
import { api } from '@/services'
import { fmtDuration, fmtDateTime } from '@/utils'
import type { MrScene } from '@/types'

type NodeType =
  | 'model.show' | 'model.highlight' | 'model.section' | 'model.explode'
  | 'ui.text' | 'ui.arrow' | 'audio.voice' | 'flow.wait'

interface TNode {
  id: string
  type: NodeType
  name: string
  track: 'model' | 'ui' | 'audio'
  start: number
  duration: number
  trigger: 'auto' | 'gaze' | 'gesture' | 'voice' | 'distance'
  target: string
  text?: string
}

const LIB: { type: NodeType; label: string; group: string; icon: React.ReactNode; track: TNode['track'] }[] = [
  { type: 'model.show', label: '模型出现', group: '视觉', icon: <ExpandOutlined />, track: 'model' },
  { type: 'model.highlight', label: '高亮描边', group: '视觉', icon: <HighlightOutlined />, track: 'model' },
  { type: 'model.section', label: '剖切', group: '视觉', icon: <BgColorsOutlined />, track: 'model' },
  { type: 'model.explode', label: '拆解', group: '视觉', icon: <ThunderboltOutlined />, track: 'model' },
  { type: 'ui.text', label: '文字卡片', group: '信息', icon: <FileTextOutlined />, track: 'ui' },
  { type: 'ui.arrow', label: '箭头指引', group: '信息', icon: <CaretRightOutlined />, track: 'ui' },
  { type: 'audio.voice', label: '语音讲解', group: '语音', icon: <SoundOutlined />, track: 'audio' },
  { type: 'flow.wait', label: '等待', group: '流程', icon: <PlusOutlined />, track: 'model' },
]

const TRACKS: { key: TNode['track']; name: string; color: string }[] = [
  { key: 'model', name: '模型动画', color: '#22D3EE' },
  { key: 'ui', name: '信息提示', color: '#6366F1' },
  { key: 'audio', name: '语音音效', color: '#34D399' },
]

const SEED: TNode[] = [
  { id: 'n1', type: 'model.show', name: '机组整体浮现', track: 'model', start: 0, duration: 6, trigger: 'auto', target: 'A-03 / 3 号机组' },
  { id: 'n2', type: 'ui.text', name: '欢迎语', track: 'ui', start: 2, duration: 8, trigger: 'auto', target: '屏幕固定', text: '装配车间三 · 3 号机组巡检引导' },
  { id: 'n3', type: 'audio.voice', name: '开场讲解', track: 'audio', start: 3, duration: 12, trigger: 'auto', target: '男声 · 正常语速', text: '请沿黄色引导线前行，注意脚下管线。' },
  { id: 'n4', type: 'model.highlight', name: '高亮配电柜', track: 'model', start: 16, duration: 6, trigger: 'gaze', target: 'A-03 / 配电柜 P-03' },
  { id: 'n5', type: 'ui.text', name: '配电柜说明', track: 'ui', start: 17, duration: 9, trigger: 'gaze', target: '跟随物体', text: '配电柜 P-03｜额定 400 A｜当前负载 61%' },
  { id: 'n6', type: 'model.section', name: '柜体剖切', track: 'model', start: 28, duration: 10, trigger: 'gesture', target: 'A-03 / 配电柜 P-03' },
  { id: 'n7', type: 'audio.voice', name: '内部结构讲解', track: 'audio', start: 29, duration: 14, trigger: 'gesture', target: '女声 · 稍慢', text: '剖切后可查看母排与断路器布置，注意保持安全距离。' },
  { id: 'n8', type: 'ui.arrow', name: '指向母排', track: 'ui', start: 34, duration: 6, trigger: 'auto', target: '母排 A 段' },
  { id: 'n9', type: 'model.explode', name: '机组拆解', track: 'model', start: 46, duration: 12, trigger: 'gesture', target: 'A-03 / 3 号机组' },
  { id: 'n10', type: 'ui.text', name: '拆解说明', track: 'ui', start: 48, duration: 10, trigger: 'auto', target: '屏幕固定', text: '共 6 个可拆解模块，拆解顺序：外壳 → 联轴器 → 叶轮' },
  { id: 'n11', type: 'audio.voice', name: '拆解讲解', track: 'audio', start: 49, duration: 16, trigger: 'auto', target: '男声 · 正常语速', text: '检修时请先断电挂牌，确认叶轮完全停转后再拆卸联轴器护罩。' },
  { id: 'n12', type: 'flow.wait', name: '等待手势确认', track: 'model', start: 64, duration: 8, trigger: 'gesture', target: '确认继续' },
  { id: 'n13', type: 'model.highlight', name: '高亮渗漏点', track: 'model', start: 76, duration: 10, trigger: 'voice', target: 'A-03 / 屋面东南角' },
  { id: 'n14', type: 'ui.text', name: '缺陷说明', track: 'ui', start: 77, duration: 11, trigger: 'auto', target: '跟随物体', text: '屋面东南角防水收口开裂 1.2 m，已转工单 WO-20260188' },
  { id: 'n15', type: 'audio.voice', name: '缺陷讲解', track: 'audio', start: 78, duration: 13, trigger: 'auto', target: '女声 · 正常语速', text: '该位置下方为低压配电柜，雨天需重点观察，必要时做临时封堵。' },
  { id: 'n16', type: 'ui.arrow', name: '指向工单', track: 'ui', start: 92, duration: 6, trigger: 'auto', target: '工单入口' },
  { id: 'n17', type: 'model.show', name: '巡检路线显示', track: 'model', start: 104, duration: 12, trigger: 'auto', target: 'A-03 / 路线 R-08' },
  { id: 'n18', type: 'ui.text', name: '结束语', track: 'ui', start: 120, duration: 10, trigger: 'auto', target: '屏幕固定', text: '本次引导结束，共 6 个检查点，已完成 4 个' },
]

export function List() {
  const nav = useNavigate()
  const scenes = api.scenes.all()
  return (
    <div>
      <PageHeader
        title="交互编排"
        desc="用时间轴与触发器定义 MR 交互流程：模型出现、剖切、拆解、文字卡片、语音讲解与手势跳转。编排完成可预览并发布到终端。"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => message.success('已创建空白编排，正在打开编辑器')}>新建编排</Button>}
      />
      <div className="grid grid-cols-4 gap-3">
        {scenes.slice(0, 8).map((s) => (
          <div key={s.id} className="card card-hover" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => nav(`/mr/authoring/${s.id}`)}>
            <div style={{ height: 104, background: `linear-gradient(135deg, ${s.cover} 0%, #0b1626 100%)`, position: 'relative' }}>
              <svg viewBox="0 0 300 104" style={{ width: '100%', height: '100%' }}>
                <g stroke="rgba(255,255,255,0.35)" fill="none" strokeWidth="1">
                  <path d="M40 86 L90 62 L140 74 L196 54 L256 68" opacity="0.7" />
                  <rect x="96" y="46" width="34" height="34" opacity="0.6" />
                  <rect x="150" y="34" width="26" height="46" opacity="0.45" />
                  <rect x="200" y="52" width="18" height="28" opacity="0.4" />
                </g>
                <circle cx="248" cy="24" r="3" fill="#fff" opacity="0.8" />
              </svg>
              <Tag style={{ position: 'absolute', right: 8, top: 8, fontSize: 9.5, marginInlineEnd: 0, background: 'rgba(7,11,20,0.6)', border: 'none', color: '#E6EDF7' }}>
                {s.status === 'PUBLISHED' ? '已发布' : s.status === 'DRAFT' ? '草稿' : '已下线'}
              </Tag>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 12.8, fontWeight: 500, lineHeight: 1.5, height: 38, overflow: 'hidden' }}>{s.name}</div>
              <div className="flex items-center justify-between" style={{ marginTop: 8, fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                <span>{s.nodeCount} 节点</span>
                <span className="num">{fmtDuration(s.duration)}</span>
                <span>{s.version}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                更新 {fmtDateTime(s.updatedAt).slice(5, 16)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Editor() {
  const { id } = useParams()
  const nav = useNavigate()
  const scene = api.scenes.get(id ?? '')
  const [nodes, setNodes] = useState<TNode[]>(SEED)
  const [selectedId, setSelectedId] = useState<string>('n1')
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [status, setStatus] = useState<MrScene['status']>(scene?.status ?? 'DRAFT')
  const [name, setName] = useState(scene?.name ?? '未命名编排')
  const total = Math.max(130, ...nodes.map((n) => n.start + n.duration)) + 10
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; x: number; start: number } | null>(null)

  const selected = nodes.find((n) => n.id === selectedId)

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setTime((v) => {
        if (v >= total) {
          setPlaying(false)
          return 0
        }
        return v + 0.2
      })
    }, 100)
    return () => clearInterval(t)
  }, [playing, total])

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return
      const dx = e.clientX - drag.current.x
      const pxPerSec = (trackRef.current?.clientWidth ?? 600) / total / zoom
      const next = Math.max(0, Math.round(drag.current.start + dx / pxPerSec))
      setNodes((list) => list.map((n) => (n.id === drag.current?.id ? { ...n, start: next } : n)))
    }
    const up = () => (drag.current = null)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [total, zoom])

  const active = useMemo(
    () => nodes.filter((n) => time >= n.start && time < n.start + n.duration),
    [nodes, time],
  )
  const textNode = active.find((n) => n.type === 'ui.text')
  const highlight = active.some((n) => n.type === 'model.highlight')
  const sectionNode = active.find((n) => n.type === 'model.section')
  const explodeNode = active.find((n) => n.type === 'model.explode')
  const voiceNode = active.find((n) => n.type === 'audio.voice')
  const sectionProgress = sectionNode ? Math.min(1, (time - sectionNode.start) / sectionNode.duration) : 0
  const explodeProgress = explodeNode ? Math.min(1, (time - explodeNode.start) / explodeNode.duration) : 0

  const addNode = (type: NodeType) => {
    const lib = LIB.find((l) => l.type === type)!
    const n: TNode = {
      id: `n${Date.now()}`,
      type,
      name: lib.label,
      track: lib.track,
      start: Math.round(time),
      duration: type === 'flow.wait' ? 5 : 8,
      trigger: 'auto',
      target: 'A-03 / 3 号机组',
      text: type === 'ui.text' ? '在此输入卡片文案' : type === 'audio.voice' ? '在此输入讲解词，时长按语速自动估算' : undefined,
    }
    setNodes((l) => [...l, n])
    setSelectedId(n.id)
  }

  const update = (patch: Partial<TNode>) => {
    setNodes((l) => l.map((n) => (n.id === selectedId ? { ...n, ...patch } : n)))
  }

  const save = () => {
    localStorage.setItem(`mirrorfield.authoring.${id}`, JSON.stringify(nodes))
    if (scene) api.scenes.update(scene.id, { name, nodeCount: nodes.length, duration: total - 10 })
    message.success('编排已保存')
  }

  if (!scene) return <EmptyState text="编排不存在" action={<Button onClick={() => nav('/mr/authoring')}>返回列表</Button>} />

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#05080F' }}>
      <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 34 }} />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          variant="borderless"
          style={{ width: 260, fontSize: 13, fontWeight: 500, padding: 0 }}
        />
        <Tag color={status === 'PUBLISHED' ? 'green' : status === 'DRAFT' ? 'default' : 'red'} style={{ fontSize: 10 }}>
          {status === 'PUBLISHED' ? '已发布' : status === 'DRAFT' ? '草稿' : '已下线'}
        </Tag>
        <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{scene.id} · {nodes.length} 节点 · {fmtDuration(total)}</span>
        <div style={{ flex: 1 }} />
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => nav('/mr/authoring')}>返回</Button>
        <Button size="small" onClick={save}>保存</Button>
        <Button size="small" onClick={() => { setPlaying(true); setTime(0) }}>预览</Button>
        <Button size="small" type="primary" icon={<CloudUploadOutlined />} onClick={() => { setStatus('PUBLISHED'); api.scenes.update(scene.id, { status: 'PUBLISHED', name }); message.success('已发布到 14 台在线终端') }}>发布</Button>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ width: 208, borderRight: '1px solid var(--border)', overflow: 'auto', padding: 10 }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 8, letterSpacing: '0.05em' }}>节点库 · 点击添加</div>
          {['视觉', '信息', '语音', '流程'].map((g) => (
            <div key={g} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', padding: '4px 2px' }}>{g}</div>
              {LIB.filter((l) => l.group === g).map((l) => (
                <div
                  key={l.type}
                  onClick={() => addNode(l.type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '7px 8px', borderRadius: 6, cursor: 'pointer',
                    fontSize: 11.5, color: 'var(--text-secondary)', border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                >
                  <span style={{ color: TRACKS.find((t) => t.key === l.track)?.color, fontSize: 12 }}>{l.icon}</span>
                  {l.label}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: 12, gap: 10 }}>
          <div style={{ flex: 1, position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'linear-gradient(180deg,#0b1626 0%,#16243a 46%,#0d1726 100%)' }}>
            <PreviewScene highlight={highlight} sectionProgress={sectionProgress} explodeProgress={explodeProgress} />

            {textNode && (
              <div className="glass" style={{ position: 'absolute', left: 24, bottom: 24, maxWidth: 360, padding: '12px 14px' }}>
                <div style={{ fontSize: 12.5, lineHeight: 1.7 }}>{textNode.text}</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6 }}>{textNode.target}</div>
              </div>
            )}

            {voiceNode && (
              <div className="glass" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 18, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, color: '#34D399' }}><SoundOutlined /></span>
                <div className="flex items-end gap-0.5" style={{ height: 16 }}>
                  {Array.from({ length: 22 }).map((_, i) => (
                    <span key={i} className="pulse-dot" style={{ width: 2, height: 4 + ((i * 7) % 13), background: '#34D399', borderRadius: 1, animationDelay: `${i * 0.06}s` }} />
                  ))}
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{voiceNode.text?.slice(0, 18)}…</span>
              </div>
            )}

            <div style={{ position: 'absolute', left: 12, top: 12, fontSize: 9.5, color: 'rgba(147,164,190,0.8)' }}>
              <Tag style={{ fontSize: 9, background: 'rgba(7,11,20,0.6)', border: 'none', color: '#93A4BE' }}>预览</Tag>
              虚拟层叠加 · 模拟第一视角
            </div>
            <div style={{ position: 'absolute', right: 12, top: 12, fontSize: 9.5, color: 'rgba(147,164,190,0.7)' }}>
              {active.length} 个节点激活
            </div>

            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 34, background: 'rgba(7,11,20,0.7)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10 }}>
              <Button
                size="small"
                type="text"
                icon={playing ? <PauseOutlined /> : <CaretRightOutlined />}
                onClick={() => setPlaying(!playing)}
                style={{ color: '#22D3EE' }}
              />
              <span className="num" style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{fmtDuration(Math.round(time))} / {fmtDuration(total)}</span>
              <div style={{ flex: 1, height: 3, background: 'rgba(148,163,184,0.2)', borderRadius: 2, position: 'relative' }}>
                <div style={{ width: `${(time / total) * 100}%`, height: '100%', background: '#22D3EE', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ width: 300, borderLeft: '1px solid var(--border)', overflow: 'auto', padding: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 10 }}>节点属性</div>
          {!selected && <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>在时间轴上选择一个节点</div>}
          {selected && (
            <div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>名称</div>
                <Input size="small" value={selected.name} onChange={(e) => update({ name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2" style={{ marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>开始（s）</div>
                  <Input size="small" type="number" value={selected.start} onChange={(e) => update({ start: Math.max(0, Number(e.target.value)) })} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>时长（s）</div>
                  <Input size="small" type="number" value={selected.duration} onChange={(e) => update({ duration: Math.max(1, Number(e.target.value)) })} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>触发条件</div>
                <Select
                  size="small"
                  value={selected.trigger}
                  onChange={(v) => update({ trigger: v })}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'auto', label: '自动播放' },
                    { value: 'gaze', label: '凝视 2 秒' },
                    { value: 'gesture', label: '手势点击' },
                    { value: 'voice', label: '语音关键词' },
                    { value: 'distance', label: '距离小于 2 m' },
                  ]}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>目标对象</div>
                <Input size="small" value={selected.target} onChange={(e) => update({ target: e.target.value })} />
              </div>
              {(selected.type === 'ui.text' || selected.type === 'audio.voice') && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>文案 / 讲解词</div>
                  <Input.TextArea rows={4} value={selected.text} onChange={(e) => update({ text: e.target.value })} style={{ fontSize: 11.5 }} />
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>约 {Math.ceil((selected.text?.length ?? 0) / 4.5)} 秒（按 4.5 字/秒）</div>
                </div>
              )}
              {selected.type === 'model.section' && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>剖切方向</div>
                  <Segmented size="small" block options={['X 轴', 'Y 轴', 'Z 轴']} />
                </div>
              )}
              {selected.type === 'model.explode' && (
                <div style={{ marginBottom: 10 }}>
                  <div className="flex justify-between" style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                    <span>拆解间距</span><span className="num">1.4 m</span>
                  </div>
                  <Slider min={0.2} max={3} step={0.1} defaultValue={1.4} />
                </div>
              )}
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <Button
                  size="small"
                  danger
                  block
                  icon={<DeleteOutlined />}
                  onClick={() => { setNodes((l) => l.filter((n) => n.id !== selected.id)); setSelectedId('') }}
                >
                  删除节点
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 186, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 34, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>时间轴</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>拖动节点调整起始时间 · 点击定位播放头</span>
          <div style={{ flex: 1 }} />
          <Tooltip title="缩小"><Button size="small" type="text" icon={<ZoomOutOutlined />} onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} /></Tooltip>
          <span className="num" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{Math.round(zoom * 100)}%</span>
          <Tooltip title="放大"><Button size="small" type="text" icon={<ZoomInOutlined />} onClick={() => setZoom((z) => Math.min(4, z + 0.25))} /></Tooltip>
          <span className="num" style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginLeft: 8 }}>{fmtDuration(Math.round(time))}</span>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'auto' }}>
          <div style={{ width: 78, flexShrink: 0, borderRight: '1px solid var(--border)' }}>
            <div style={{ height: 20, borderBottom: '1px solid var(--border)' }} />
            {TRACKS.map((t) => (
              <div key={t.key} style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 10, fontSize: 10.5, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, background: t.color }} />
                {t.name}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: 600, position: 'relative' }} ref={trackRef}>
            <div
              style={{ height: 20, borderBottom: '1px solid var(--border)', position: 'relative', cursor: 'pointer' }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                setTime(Math.max(0, ((e.clientX - r.left) / r.width) * total))
              }}
            >
              {Array.from({ length: Math.floor(total / 10) + 1 }).map((_, i) => (
                <span key={i} className="num" style={{ position: 'absolute', left: `${((i * 10) / total) * 100}%`, fontSize: 9, color: 'var(--text-tertiary)', transform: 'translateX(2px)' }}>{i * 10}s</span>
              ))}
            </div>

            {TRACKS.map((tr) => (
              <div key={tr.key} style={{ height: 40, borderBottom: '1px solid var(--border)', position: 'relative', background: 'rgba(148,163,184,0.02)' }}>
                {nodes.filter((n) => n.track === tr.key).map((n) => (
                  <div
                    key={n.id}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      setSelectedId(n.id)
                      drag.current = { id: n.id, x: e.clientX, start: n.start }
                    }}
                    style={{
                      position: 'absolute', left: `${(n.start / total) * 100}%`, width: `${Math.max(2, (n.duration / total) * 100)}%`,
                      top: 6, height: 28, borderRadius: 4, cursor: 'grab',
                      background: selectedId === n.id ? `${tr.color}44` : `${tr.color}22`,
                      border: `1px solid ${selectedId === n.id ? tr.color : `${tr.color}66`}`,
                      color: tr.color, fontSize: 9.5, display: 'flex', alignItems: 'center', padding: '0 6px',
                      overflow: 'hidden', whiteSpace: 'nowrap', userSelect: 'none',
                    }}
                  >
                    {n.name}
                  </div>
                ))}
              </div>
            ))}

            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(time / total) * 100}%`, width: 1, background: '#F87171', pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', top: 0, left: -3, width: 7, height: 7, background: '#F87171', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewScene({ highlight, sectionProgress, explodeProgress }: { highlight: boolean; sectionProgress: number; explodeProgress: number }) {
  const off = explodeProgress * 26
  return (
    <svg viewBox="0 0 700 460" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
      <rect x="0" y="0" width="700" height="200" fill="#0d1a2b" />
      <rect x="30" y="110" width="190" height="90" fill="#122436" />
      <rect x="510" y="100" width="160" height="100" fill="#11212f" />
      <path d="M0 200 L700 200 L700 460 L0 460 Z" fill="#091119" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1="0" y1={200 + Math.pow(i / 11, 2) * 260} x2="700" y2={200 + Math.pow(i / 11, 2) * 260} stroke="rgba(34,211,238,0.09)" />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={i} x1="350" y1="200" x2={350 + (i - 4) * 260} y2="460" stroke="rgba(34,211,238,0.09)" />
      ))}

      <g transform="translate(300,236)">
        <g opacity="0.95">
          <path d="M0 60 L60 26 L120 60 L120 130 L0 130 Z" fill="rgba(34,211,238,0.10)" stroke="#22D3EE" strokeWidth="1.4" />
          <path d="M0 60 L60 26 L120 60 L60 94 Z" fill="rgba(34,211,238,0.18)" stroke="#22D3EE" strokeWidth="1.4" />
          <path d="M60 94 L60 130" stroke="#22D3EE" strokeWidth="1.2" opacity="0.7" />
        </g>
        <g transform={`translate(${off * 0.4}, ${-off * 0.5})`}>
          <rect x="14" y="-46" width="92" height="24" fill="rgba(148,163,184,0.2)" stroke={highlight ? '#FBBF24' : 'rgba(148,163,184,0.5)'} strokeWidth={highlight ? 2 : 1} />
          <text x="18" y="-30" fontSize="9" fill={highlight ? '#FBBF24' : '#93A4BE'}>外壳 / 联轴器护罩</text>
        </g>
        <g transform={`translate(${-off}, 0)`}>
          <rect x="-6" y="6" width="26" height="70" fill="rgba(148,163,184,0.14)" stroke="rgba(148,163,184,0.4)" />
        </g>
        <g transform={`translate(${off}, 0)`}>
          <rect x="100" y="6" width="26" height="70" fill="rgba(148,163,184,0.14)" stroke="rgba(148,163,184,0.4)" />
        </g>

        {sectionProgress > 0 && (
          <g>
            <clipPath id="sec">
              <rect x={-20} y={-60} width={sectionProgress * 170} height={220} />
            </clipPath>
            <g clipPath="url(#sec)">
              <rect x="-6" y="6" width="132" height="70" fill="rgba(99,102,241,0.18)" stroke="#6366F1" strokeWidth="1" />
              {[0, 1, 2].map((i) => (
                <rect key={i} x={4 + i * 26} y="16" width="18" height="48" fill="rgba(34,211,238,0.25)" stroke="#22D3EE" strokeWidth="0.8" />
              ))}
            </g>
            <line x1={sectionProgress * 150 - 20} y1="-60" x2={sectionProgress * 150 - 20} y2="160" stroke="#F87171" strokeWidth="1.4" strokeDasharray="4 3" />
          </g>
        )}
      </g>

      <g opacity="0.55">
        <rect x="470" y="290" width="90" height="110" fill="#152539" stroke="rgba(148,163,184,0.25)" />
        <text x="476" y="284" fontSize="9" fill="#5D6E8A">配电柜 P-03</text>
      </g>

      <g opacity="0.7">
        <rect x="16" y="16" width="160" height="34" rx="4" fill="rgba(7,11,20,0.7)" stroke="rgba(148,163,184,0.25)" />
        <text x="26" y="32" fontSize="9" fill="#93A4BE">A-03 装配车间三</text>
        <text x="26" y="44" fontSize="8" fill="#5D6E8A">HoloLens 2 · 模拟预览</text>
      </g>
    </svg>
  )
}

export default { List, Editor }
