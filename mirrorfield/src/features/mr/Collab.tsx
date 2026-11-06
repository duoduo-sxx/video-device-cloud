import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Button, Modal, Tag, message } from 'antd'
import {
  BorderOutlined, ClearOutlined, HighlightOutlined, MessageOutlined, MutedOutlined,
  RadiusSettingOutlined, RedoOutlined, StepBackwardOutlined, TeamOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'

type Mark = { id: string; tool: string; x1: number; y1: number; x2: number; y2: number; color: string; text?: string }

export default function Collab() {
  const nav = useNavigate()
  const [tool, setTool] = useState<'arrow' | 'circle' | 'pen' | 'text' | 'laser'>('arrow')
  const [marks, setMarks] = useState<Mark[]>([
    { id: 'm1', tool: 'circle', x1: 246, y1: 226, x2: 350, y2: 356, color: '#FBBF24', text: '压板松动' },
  ])
  const [drawing, setDrawing] = useState<Mark | null>(null)
  const [seconds, setSeconds] = useState(754)
  const [recording, setRec] = useState(false)
  const [synced, setSynced] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const [muted, setMuted] = useState(false)
  const [whiteboard, setWhiteboard] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const pos = (e: React.MouseEvent) => {
    const r = stageRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const down = (e: React.MouseEvent) => {
    if (tool === 'text') {
      const p = pos(e)
      setMarks((m) => [...m, { id: `m${Date.now()}`, tool: 'text', x1: p.x, y1: p.y, x2: p.x, y2: p.y, color: '#22D3EE', text: '注意此处' }])
      afterSync()
      return
    }
    const p = pos(e)
    setDrawing({ id: `m${Date.now()}`, tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, color: tool === 'laser' ? '#F87171' : '#FBBF24' })
  }

  const move = (e: React.MouseEvent) => {
    if (!drawing) return
    const p = pos(e)
    setDrawing({ ...drawing, x2: p.x, y2: p.y })
  }

  const up = () => {
    if (drawing) {
      setMarks((m) => [...m, drawing])
      setDrawing(null)
      afterSync()
    }
  }

  const afterSync = () => {
    setSynced(true)
    setTimeout(() => setSynced(false), 2200)
  }

  const finish = () => {
    setEndOpen(false)
    message.success('会话已结束，正在生成回放文件')
    setTimeout(() => nav('/mr/sessions'), 600)
  }

  return (
    <div style={{ height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column', margin: -20 }}>
      <div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', borderBottom: '1px solid var(--border)' }}>
        <Tag color="red" style={{ marginInlineEnd: 0, fontSize: 10 }}>● REC</Tag>
        <span style={{ fontSize: 13, fontWeight: 500 }}>SC-20261019-004</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>装配车间 A-03 · 现场第一视角</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>已连接 {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>
        <div style={{ flex: 1 }} />
        <span className="num" style={{ fontSize: 11.5, color: 'var(--ok)' }}>链路稳定 · 端到端 48 ms</span>
        <Button size="small" danger onClick={() => setEndOpen(true)}>结束会话</Button>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: '0 0 62%', padding: 14, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div
            ref={stageRef}
            onMouseDown={down}
            onMouseMove={move}
            onMouseUp={up}
            onMouseLeave={up}
            style={{
              position: 'relative', flex: 1, borderRadius: 10, overflow: 'hidden', cursor: 'crosshair',
              background: 'linear-gradient(180deg,#0b1626 0%,#16243a 46%,#0d1726 100%)', border: '1px solid var(--border)',
            }}
          >
            <SceneBackdrop />
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              {[...marks, ...(drawing ? [drawing] : [])].map((m) => (
                <MarkShape key={m.id} m={m} />
              ))}
            </svg>

            {synced && (
              <div className="glass" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 14, padding: '6px 12px', fontSize: 11, color: 'var(--brand)' }}>
                已同步至现场终端（延迟 280 ms）
              </div>
            )}

            <div style={{ position: 'absolute', left: 12, top: 12, fontSize: 10, color: 'rgba(147,164,190,0.8)', background: 'rgba(7,11,20,0.6)', padding: '4px 8px', borderRadius: 4 }}>
              现场 · 张伟（HoloLens 2） · 电量 72%
            </div>

            <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
              <span style={{ fontSize: 9.5, color: 'var(--ok)', background: 'rgba(7,11,20,0.6)', padding: '3px 7px', borderRadius: 4 }}>锚点已锁定 AN-007</span>
              <span style={{ fontSize: 9.5, color: 'rgba(147,164,190,0.8)', background: 'rgba(7,11,20,0.6)', padding: '3px 7px', borderRadius: 4 }}>空间标定 RMS 12 mm</span>
            </div>

            <div style={{ position: 'absolute', left: 12, bottom: 12, fontSize: 10, color: 'rgba(147,164,190,0.7)' }}>
              模拟画面 · 非真实摄像头输入
            </div>
          </div>

          <div className="glass" style={{ marginTop: 10, height: 46, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
            {[
              { k: 'arrow', i: <BorderOutlined />, t: '箭头' },
              { k: 'circle', i: <RadiusSettingOutlined />, t: '圈选' },
              { k: 'pen', i: <HighlightOutlined />, t: '画笔' },
              { k: 'text', i: <MessageOutlined />, t: '文字' },
              { k: 'laser', i: <StepBackwardOutlined />, t: '激光笔' },
            ].map((x) => (
              <button
                key={x.k}
                onClick={() => setTool(x.k as 'arrow')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer',
                  border: `1px solid ${tool === x.k ? 'rgba(34,211,238,0.5)' : 'var(--border)'}`,
                  background: tool === x.k ? 'rgba(34,211,238,0.12)' : 'transparent',
                  color: tool === x.k ? 'var(--brand)' : 'var(--text-secondary)',
                }}
              >
                {x.i} {x.t}
              </button>
            ))}
            <span style={{ width: 1, height: 18, background: 'var(--border)' }} />
            <Button size="small" type="text" icon={<ClearOutlined />} onClick={() => setMarks([])}>清空</Button>
            <Button size="small" type="text" icon={<RedoOutlined />} onClick={() => setMarks((m) => m.slice(0, -1))}>撤销</Button>
            <div style={{ flex: 1 }} />
            <Button size="small" type="text" icon={<TeamOutlined />} onClick={() => setWhiteboard(true)}>白板</Button>
            <Button
              size="small"
              danger={recording}
              icon={<VideoCameraOutlined />}
              onClick={() => { setRec(!recording); message.success(recording ? '录制已结束，文件已保存' : '开始录制') }}
            >
              {recording ? '停止录制' : '录制'}
            </Button>
            <Button size="small" type="text" icon={<MutedOutlined />} onClick={() => setMuted(!muted)} style={{ color: muted ? 'var(--danger)' : undefined }}>
              {muted ? '已静音' : '静音'}
            </Button>
          </div>
        </div>

        <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div className="card" style={{ flex: '0 0 auto', padding: 14 }}>
            <div className="flex items-center gap-3">
              <Avatar size={44} style={{ background: 'rgba(99,102,241,0.2)', color: '#A5B4FC' }}>周</Avatar>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>周建国 <Tag color="purple" style={{ fontSize: 9.5, marginLeft: 4 }}>远程专家</Tag></div>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 3 }}>结构专业 · 已接入 12:38</div>
              </div>
              <div style={{ flex: 1 }} />
              <div className="flex items-end gap-0.5" style={{ height: 18 }}>
                {[6, 12, 9, 16, 11, 14, 7, 13].map((h, i) => (
                  <span key={i} className="pulse-dot" style={{ width: 2, height: h, background: '#34D399', borderRadius: 1, animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
            </div>
            <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: 'rgba(148,163,184,0.05)', fontSize: 11.5, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              "屋面东南角那个位置我看到裂缝了，你往右走两步，我圈一下给你。这个位置对应图纸 3-3 剖面，建议先做临时封堵，等雨停再整体处理。"
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 8 }}>实时语音转写 · 置信度 0.96</div>
          </div>

          <div className="card" style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>标注与批注</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{marks.length} 条</span>
            </div>
            <div style={{ flex: 1, overflow: 'auto', marginTop: 8 }}>
              {marks.length === 0 && <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>暂无标注，使用左侧工具在画面上绘制</div>}
              {marks.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="num" style={{ fontSize: 10, color: 'var(--text-tertiary)', width: 18 }}>{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5 }}>{m.tool === 'arrow' ? '箭头指示' : m.tool === 'circle' ? '圈选区域' : m.tool === 'pen' ? '手绘批注' : m.tool === 'text' ? '文字标注' : '激光指示'}{m.text ? ` · ${m.text}` : ''}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>周建国 · 已同步至现场</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ flex: '0 0 auto', padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>参会人员（3）</div>
            {[
              ['张伟', '现场 · HoloLens 2', '#22D3EE'],
              ['周建国', '专家 · Web 端', '#6366F1'],
              ['何静', '记录 · 平板', '#34D399'],
            ].map(([n, r, c]) => (
              <div key={n} className="flex items-center gap-2" style={{ padding: '5px 0' }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: c }} />
                <span style={{ fontSize: 11.5 }}>{n}</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        title="结束会话"
        open={endOpen}
        onCancel={() => setEndOpen(false)}
        onOk={finish}
        okText="结束并生成回放"
        width={440}
      >
        <div style={{ fontSize: 12.5, lineHeight: 2 }}>
          <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>会话时长</span><span className="num">12:45</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>标注数量</span><span className="num">{marks.length} 个</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>截图</span><span className="num">3 张</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>录制文件</span><span className="num">{recording ? '1 个（进行中）' : '1 个 · 186 MB'}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>参与人</span><span>张伟、周建国、何静</span></div>
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-tertiary)' }}>结束后将生成会话记录，标注与录制文件可在会话记录中回放。</div>
      </Modal>

      <Modal title="协同白板" open={whiteboard} onCancel={() => setWhiteboard(false)} footer={null} width={720}>
        <div style={{ height: 380, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(7,11,20,0.5)', position: 'relative', overflow: 'hidden' }}>
          <svg viewBox="0 0 680 380" style={{ width: '100%', height: '100%' }}>
            <g stroke="rgba(148,163,184,0.15)"><line x1="0" y1="95" x2="680" y2="95" /><line x1="0" y1="190" x2="680" y2="190" /><line x1="0" y1="285" x2="680" y2="285" /></g>
            <rect x="60" y="60" width="220" height="120" fill="none" stroke="#22D3EE" strokeWidth="1.5" />
            <text x="60" y="50" fontSize="11" fill="#93A4BE">屋面平面（局部）</text>
            <circle cx="180" cy="120" r="22" fill="none" stroke="#F87171" strokeWidth="2" />
            <text x="210" y="118" fontSize="11" fill="#F87171">渗漏点</text>
            <path d="M180 142 L180 230 L340 230" stroke="#FBBF24" strokeWidth="1.5" fill="none" markerEnd="url(#a3)" />
            <defs><marker id="a3" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#FBBF24" /></marker></defs>
            <text x="200" y="222" fontSize="11" fill="#FBBF24">对应 3-3 剖面</text>
            <rect x="380" y="180" width="200" height="80" fill="none" stroke="rgba(148,163,184,0.4)" strokeDasharray="4 3" />
            <text x="380" y="172" fontSize="11" fill="#93A4BE">临时封堵范围</text>
          </svg>
        </div>
        <div className="flex justify-end gap-2" style={{ marginTop: 12 }}>
          <Button onClick={() => setWhiteboard(false)}>关闭</Button>
          <Button type="primary" onClick={() => { message.success('白板已保存到会话附件'); setWhiteboard(false) }}>保存到会话</Button>
        </div>
      </Modal>
    </div>
  )
}

function MarkShape({ m }: { m: Mark }) {
  if (m.tool === 'arrow' || m.tool === 'laser') {
    const ang = Math.atan2(m.y2 - m.y1, m.x2 - m.x1)
    const len = Math.hypot(m.x2 - m.x1, m.y2 - m.y1)
    const hx = m.x2 - Math.cos(ang) * 10
    const hy = m.y2 - Math.sin(ang) * 10
    return (
      <g opacity={m.tool === 'laser' ? 0.9 : 1}>
        <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={m.color} strokeWidth={m.tool === 'laser' ? 2 : 2} strokeLinecap="round" />
        <polygon points={`${m.x2},${m.y2} ${hx - Math.sin(ang) * 5},${hy + Math.cos(ang) * 5} ${hx + Math.sin(ang) * 5},${hy - Math.cos(ang) * 5}`} fill={m.color} />
        {len < 4 && <circle cx={m.x1} cy={m.y1} r="6" fill="none" stroke={m.color} strokeWidth="2" />}
      </g>
    )
  }
  if (m.tool === 'circle') {
    const cx = (m.x1 + m.x2) / 2
    const cy = (m.y1 + m.y2) / 2
    const rx = Math.abs(m.x2 - m.x1) / 2
    const ry = Math.abs(m.y2 - m.y1) / 2
    return (
      <g>
        <ellipse cx={cx} cy={cy} rx={Math.max(rx, 4)} ry={Math.max(ry, 4)} fill="rgba(251,191,36,0.08)" stroke={m.color} strokeWidth="2" />
        {m.text && (
          <g>
            <rect x={m.x2 + 4} y={m.y1 - 4} width={m.text.length * 12 + 12} height="20" rx="3" fill="rgba(7,11,20,0.85)" />
            <text x={m.x2 + 10} y={m.y1 + 10} fontSize="11" fill={m.color}>{m.text}</text>
          </g>
        )}
      </g>
    )
  }
  if (m.tool === 'text') {
    return (
      <g>
        <rect x={m.x1} y={m.y1 - 14} width={(m.text?.length ?? 4) * 12 + 14} height="22" rx="3" fill="rgba(34,211,238,0.16)" stroke="#22D3EE" />
        <text x={m.x1 + 7} y={m.y1 + 1} fontSize="11" fill="#22D3EE">{m.text}</text>
      </g>
    )
  }
  return <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={m.color} strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" />
}

function SceneBackdrop() {
  return (
    <svg viewBox="0 0 700 460" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
      <rect width="700" height="200" fill="#0d1a2b" />
      <rect x="40" y="112" width="180" height="88" fill="#122436" />
      <rect x="500" y="96" width="170" height="104" fill="#11212f" />
      <rect x="250" y="128" width="150" height="72" fill="#0f1f2e" />
      <g opacity="0.5">
        <rect x="60" y="130" width="60" height="26" fill="#0a1826" />
        <rect x="140" y="130" width="60" height="26" fill="#0a1826" />
        <rect x="520" y="120" width="50" height="24" fill="#0a1826" />
      </g>
      <path d="M0 200 L700 200 L700 460 L0 460 Z" fill="#091119" />
      {Array.from({ length: 12 }).map((_, i) => {
        const y = 200 + Math.pow(i / 11, 2) * 260
        return <line key={i} x1="0" y1={y} x2="700" y2={y} stroke="rgba(34,211,238,0.11)" strokeWidth="1" />
      })}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={i} x1="350" y1="200" x2={350 + (i - 4) * 260} y2="460" stroke="rgba(34,211,238,0.11)" strokeWidth="1" />
      ))}
      <rect x="236" y="248" width="112" height="150" fill="#16283c" stroke="rgba(148,163,184,0.35)" />
      <rect x="236" y="270" width="112" height="3" fill="rgba(148,163,184,0.3)" />
      <rect x="236" y="322" width="112" height="3" fill="rgba(148,163,184,0.3)" />
      <circle cx="262" cy="300" r="3" fill="#F87171" />
      <circle cx="262" cy="352" r="3" fill="#34D399" />
      <text x="248" y="242" fontSize="9" fill="#5D6E8A">配电柜 P-03</text>
      <rect x="470" y="286" width="96" height="112" fill="#152539" stroke="rgba(148,163,184,0.25)" />
      <text x="476" y="280" fontSize="9" fill="#5D6E8A">检修平台</text>
      <ellipse cx="350" cy="200" rx="520" ry="60" fill="rgba(34,211,238,0.03)" />
    </svg>
  )
}
