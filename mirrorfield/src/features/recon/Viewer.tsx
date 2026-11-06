import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, Modal, Segmented, Slider, Tag, Tooltip, Tree, message } from 'antd'
import type { TreeDataNode } from 'antd'
import {
  AimOutlined, BgColorsOutlined, CameraOutlined, ColumnHeightOutlined, CompressOutlined,
  DeleteOutlined, EnvironmentOutlined, EyeInvisibleOutlined, EyeOutlined, FullscreenOutlined,
  HighlightOutlined, InfoCircleOutlined, LoadingOutlined, ShareAltOutlined,
} from '@ant-design/icons'
import { ParkViewer, type LayerKey, type MeasureResult, type PickInfo, type PointMode, type ToolMode, type ViewerStats } from '@/three/ParkViewer'
import { buildSceneNodes, BUILDINGS } from '@/mock/scene'
import { api } from '@/services'
import { toCrs } from '@/utils'

const LAYERS: { key: LayerKey; name: string; desc: string }[] = [
  { key: 'mesh', name: '实景模型', desc: '倾斜摄影重建成果' },
  { key: 'pointcloud', name: '点云', desc: '地面站扫描点云' },
  { key: 'bim', name: 'BIM 模型', desc: '设计模型线框' },
  { key: 'pipe', name: '管线', desc: '架空管廊' },
  { key: 'annotation', name: '标注', desc: '场景标注点' },
  { key: 'route', name: '巡检路线', desc: '巡检点位与路径' },
  { key: 'underground', name: '地下管网', desc: '地下 3 m 管网' },
  { key: 'env', name: '环境', desc: '道路、水体、绿化' },
]

const TOOLS: { key: ToolMode; name: string; icon: React.ReactNode; hint: string }[] = [
  { key: 'select', name: '选择', icon: <AimOutlined />, hint: '点选建筑查看属性' },
  { key: 'measure', name: '测量', icon: <ColumnHeightOutlined />, hint: '连续点击测量，双击结束并计算面积' },
  { key: 'section', name: '剖切', icon: <CompressOutlined />, hint: '拖动滑块剖切模型' },
  { key: 'annotate', name: '标注', icon: <HighlightOutlined />, hint: '点击模型表面添加标注' },
  { key: 'compare', name: '对比', icon: <BgColorsOutlined />, hint: '实景与 BIM 模型对比' },
  { key: 'walk', name: '漫游', icon: <EnvironmentOutlined />, hint: 'WASD 移动，第一人称视角' },
]

export default function Viewer() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const boxRef = useRef<HTMLDivElement>(null)
  const viewer = useRef<ParkViewer>()
  const toolRef = useRef<ToolMode>('select')

  const [ready, setReady] = useState(false)
  const [tool, setTool] = useState<ToolMode>('select')
  const [stats, setStats] = useState<ViewerStats>({ fps: 0, triangles: 0, calls: 0 })
  const [coords, setCoords] = useState(() => toCrs(0, 0, 0))
  const [selected, setSelected] = useState<PickInfo | null>(null)
  const [measures, setMeasures] = useState<MeasureResult[]>([])
  const [layerOn, setLayerOn] = useState<Record<string, boolean>>({
    mesh: true, pointcloud: false, bim: false, pipe: true, annotation: true, route: false, underground: false, env: true,
  })
  const [activeLayer, setActiveLayer] = useState<LayerKey>('mesh')
  const [opacity, setOpacity] = useState(100)
  const [clip, setClip] = useState(0)
  const [compare, setCompare] = useState(false)
  const [pointMode, setPointMode] = useState<PointMode>('elevation')
  const [pointSize, setPointSize] = useState(1.2)
  const [infoTab, setInfoTab] = useState<'attr' | 'measure' | 'annotate'>('attr')
  const [annoOpen, setAnnoOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [pendingPos, setPendingPos] = useState<[number, number, number]>([0, 20, 0])
  const [annoTitle, setAnnoTitle] = useState('')
  const [annoDesc, setAnnoDesc] = useState('')
  const [annoType, setAnnoType] = useState<'问题' | '说明' | '巡检点' | '设备信息'>('说明')
  const [annoId, setAnnoId] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState(api.annotations.all())
  const [treeOpen, setTreeOpen] = useState(true)
  const [layerOpen, setLayerOpen] = useState(true)

  const treeData: TreeDataNode[] = useMemo(() => {
    const nodes = buildSceneNodes()
    const roots = nodes.filter((n) => n.parentId === null)
    const build = (id: string): TreeDataNode[] =>
      nodes
        .filter((n) => n.parentId === id)
        .map((n) => ({ key: n.id, title: n.name, children: build(n.id) }))
    return roots.map((r) => ({ key: r.id, title: r.name, children: build(r.id) }))
  }, [])

  useEffect(() => {
    if (!boxRef.current) return
    const v = new ParkViewer(boxRef.current, {
      onPick: (info) => {
        if (toolRef.current === 'annotate' && info) {
          setPendingPos(info.position)
          setAnnoOpen(true)
          return
        }
        setSelected(info)
        setInfoTab('attr')
      },
      onMeasure: (m) => setMeasures((prev) => [m, ...prev].slice(0, 20)),
      onStats: setStats,
      onCoords: setCoords,
      onAnnotation: (id) => {
        setAnnoId(id)
        const a = api.annotations.all().find((x) => x.id === id)
        if (a) {
          setAnnoTitle(a.title)
          setAnnoDesc(a.desc)
          setAnnoType(a.type)
          setAnnoOpen(false)
          setInfoTab('annotate')
          setSelected(null)
        }
      },
    })
    viewer.current = v
    api.annotations.all().forEach((a) => v.addAnnotation({ id: a.id, title: a.title, color: a.color, pos: a.pos }))
    const t = setTimeout(() => setReady(true), 1100)
    const focus = params.get('focus')
    if (focus) setTimeout(() => v.focus(`bld-${focus}`), 1200)
    return () => {
      clearTimeout(t)
      v.dispose()
      viewer.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changeTool = useCallback((t: ToolMode) => {
    setTool(t)
    toolRef.current = t
    viewer.current?.setTool(t)
    if (t === 'compare') {
      setCompare(true)
      viewer.current?.setCompare(true)
    }
    if (t === 'section') {
      setClip(45)
      viewer.current?.setClip(45)
    }
  }, [])

  const toggleLayer = (key: LayerKey, on: boolean) => {
    setLayerOn((s) => ({ ...s, [key]: on }))
    viewer.current?.setLayer(key, on)
  }

  const doScreenshot = () => {
    const url = viewer.current?.screenshot()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `滨江园区-${Date.now()}.png`
    a.click()
    message.success('截图已保存')
  }

  const saveAnnotation = () => {
    if (!annoTitle.trim()) {
      message.warning('请填写标注标题')
      return
    }
    const b = BUILDINGS.find((x) => {
      const dx = x.x - pendingPos[0]
      const dz = x.z - pendingPos[2]
      return Math.abs(dx) < x.w / 2 && Math.abs(dz) < x.d / 2
    })
    const a = api.annotations.add({
      title: annoTitle,
      desc: annoDesc,
      type: annoType,
      pos: pendingPos,
      buildingCode: b?.code ?? 'A-01',
      color: annoType === '问题' ? '#F87171' : annoType === '巡检点' ? '#FBBF24' : '#22D3EE',
    })
    viewer.current?.addAnnotation({ id: a.id, title: a.title, color: a.color, pos: a.pos })
    setAnnotations(api.annotations.all())
    setAnnoOpen(false)
    setAnnoTitle('')
    setAnnoDesc('')
    message.success('标注已保存，可在标注列表中查看')
  }

  const delAnnotation = () => {
    if (!annoId) return
    api.annotations.remove(annoId)
    viewer.current?.removeAnnotation(annoId)
    setAnnotations(api.annotations.all())
    setAnnoId(null)
    message.success('标注已删除')
  }

  const current = annotations.find((a) => a.id === annoId)

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={boxRef} style={{ position: 'absolute', inset: 0 }} />

      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05080F', zIndex: 40, flexDirection: 'column', gap: 14 }}>
          <LoadingOutlined style={{ fontSize: 26, color: '#22D3EE' }} />
          <div style={{ fontSize: 12, color: '#93A4BE' }}>正在加载园区场景：地形 · 建筑 · 管线 · 标注</div>
          <div style={{ width: 240, height: 3, background: 'rgba(148,163,184,0.15)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '78%', height: '100%', background: '#22D3EE', animation: 'none' }} />
          </div>
        </div>
      )}

      {/* 顶部工具条 */}
      <div className="glass" style={{ position: 'absolute', left: 16, right: 16, top: 12, height: 46, zIndex: 20, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8 }}>
        <span style={{ width: 34 }} />
        <div style={{ fontSize: 13, fontWeight: 500 }}>滨江园区一期</div>
        <Tag style={{ fontSize: 10, marginInlineEnd: 0 }}>v2.4.1</Tag>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>|</span>
        <Segmented
          size="small"
          value={tool}
          onChange={(v) => changeTool(v as ToolMode)}
          options={TOOLS.map((t) => ({
            value: t.key,
            label: (
              <Tooltip title={`${t.name} · ${t.hint}`}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 4px', fontSize: 12 }}>
                  {t.icon} {t.name}
                </span>
              </Tooltip>
            ),
          }))}
        />
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{TOOLS.find((t) => t.key === tool)?.hint}</div>
        <Tooltip title="复位视角"><Button size="small" type="text" icon={<FullscreenOutlined />} onClick={() => viewer.current?.resetView()} /></Tooltip>
        <Tooltip title="截图"><Button size="small" type="text" icon={<CameraOutlined />} onClick={doScreenshot} /></Tooltip>
        <Tooltip title="分享"><Button size="small" type="text" icon={<ShareAltOutlined />} onClick={() => setShareOpen(true)} /></Tooltip>
        <Button size="small" type="primary" ghost onClick={() => nav('/recon/assets')}>资产管理</Button>
      </div>

      {/* 左侧面板 */}
      <div style={{ position: 'absolute', left: 16, top: 70, bottom: 46, width: 296, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="glass" style={{ flex: treeOpen ? 1 : 'none', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 500 }}>
            <span>场景树</span>
            <EyeOutlined style={{ fontSize: 11, color: 'var(--text-tertiary)', cursor: 'pointer' }} onClick={() => setTreeOpen(!treeOpen)} />
          </div>
          {treeOpen && (
            <div style={{ overflow: 'auto', padding: '6px 6px 10px', flex: 1 }}>
              <Tree
                treeData={treeData}
                defaultExpandedKeys={['root', 'zone-A', 'zone-B']}
                blockNode
                showLine={false}
                onSelect={(keys) => {
                  const k = String(keys[0] ?? '')
                  if (k.startsWith('bld-')) viewer.current?.focus(k)
                }}
                style={{ fontSize: 12, background: 'transparent' }}
              />
            </div>
          )}
        </div>

        <div className="glass" style={{ flex: layerOpen ? '0 0 auto' : 'none', maxHeight: 330, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 500 }}>
            <span>图层控制</span>
            <EyeInvisibleOutlined style={{ fontSize: 11, color: 'var(--text-tertiary)', cursor: 'pointer' }} onClick={() => setLayerOpen(!layerOpen)} />
          </div>
          {layerOpen && (
            <div style={{ overflow: 'auto', padding: '6px 12px 10px' }}>
              {LAYERS.map((l) => (
                <div
                  key={l.key}
                  onClick={() => { setActiveLayer(l.key); setOpacity(layerOn[l.key] ? 100 : 100) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderRadius: 5, cursor: 'pointer',
                    background: activeLayer === l.key ? 'rgba(34,211,238,0.1)' : 'transparent',
                  }}
                >
                  <span
                    onClick={(e) => { e.stopPropagation(); toggleLayer(l.key, !layerOn[l.key]) }}
                    style={{ width: 24, height: 14, borderRadius: 7, background: layerOn[l.key] ? 'var(--brand)' : 'rgba(148,163,184,0.3)', position: 'relative', flexShrink: 0, transition: 'background .15s' }}
                  >
                    <span style={{ position: 'absolute', top: 2, left: layerOn[l.key] ? 12 : 2, width: 10, height: 10, borderRadius: 5, background: '#070B14', transition: 'left .15s' }} />
                  </span>
                  <span style={{ fontSize: 12, flex: 1, color: layerOn[l.key] ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{l.name}</span>
                  <span style={{ fontSize: 9.5, color: 'var(--text-tertiary)' }}>{l.desc}</span>
                </div>
              ))}
              <div style={{ marginTop: 6, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <div className="flex justify-between" style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                  <span>{LAYERS.find((l) => l.key === activeLayer)?.name} 透明度</span>
                  <span className="num">{opacity}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  value={opacity}
                  onChange={(v) => { setOpacity(v); viewer.current?.setLayerOpacity(activeLayer, v) }}
                  tooltip={{ open: false }}
                />
                {activeLayer === 'pointcloud' && (
                  <div style={{ marginTop: 4 }}>
                    <Segmented
                      size="small"
                      block
                      value={pointMode}
                      onChange={(v) => { setPointMode(v as PointMode); viewer.current?.setPointMode(v as PointMode) }}
                      options={[{ value: 'elevation', label: '高程' }, { value: 'rgb', label: 'RGB' }, { value: 'intensity', label: '强度' }]}
                    />
                    <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>点大小</span>
                      <Slider min={0.5} max={4} step={0.1} value={pointSize} onChange={(v) => { setPointSize(v); viewer.current?.setPointSize(v) }} style={{ flex: 1 }} />
                    </div>
                  </div>
                )}
                {activeLayer === 'bim' && (
                  <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                    BIM 线框层用于与实景模型套合，配合「对比」工具查看偏差色谱。
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧面板 */}
      <div className="glass" style={{ position: 'absolute', right: 16, top: 70, bottom: 46, width: 316, zIndex: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
          {([['attr', '属性'], ['measure', `测量 ${measures.length}`], ['annotate', `标注 ${annotations.length}`]] as const).map(([k, label]) => (
            <div
              key={k}
              onClick={() => setInfoTab(k)}
              style={{
                flex: 1, textAlign: 'center', padding: '11px 0', fontSize: 12, cursor: 'pointer',
                color: infoTab === k ? 'var(--brand)' : 'var(--text-secondary)',
                borderBottom: infoTab === k ? '2px solid var(--brand)' : '2px solid transparent',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
          {infoTab === 'attr' && (
            selected ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{selected.nodeId}</div>
                <div style={{ marginTop: 14 }}>
                  {Object.entries(selected.meta).map(([k, v]) => (
                    <div key={k} className="flex justify-between" style={{ padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
                      <span className="num">{String(v)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 6, background: 'rgba(34,211,238,0.06)', fontSize: 11, lineHeight: 1.8 }}>
                  <div style={{ color: 'var(--text-tertiary)' }}>拾取坐标</div>
                  <div className="num">X {selected.position[0].toFixed(3)} · Y {selected.position[1].toFixed(3)} · Z {selected.position[2].toFixed(3)}</div>
                </div>
                <div className="grid grid-cols-3 gap-2" style={{ marginTop: 14 }}>
                  <Button size="small" onClick={() => nav('/recon/compare')}>偏差</Button>
                  <Button size="small" onClick={() => nav('/inspect/plans')}>巡检</Button>
                  <Button size="small" onClick={() => { setTool('annotate'); toolRef.current = 'annotate'; viewer.current?.setTool('annotate'); message.info('点击模型表面放置标注') }}>标注</Button>
                </div>
              </div>
            ) : (
              <SceneStats stats={stats} />
            )
          )}

          {infoTab === 'measure' && (
            measures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.9 }}>
                切换到「测量」工具<br />连续点击模型取点，双击结束
              </div>
            ) : (
              <div>
                <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  <span>共 {measures.length} 条结果</span>
                  <a onClick={() => { setMeasures([]); viewer.current?.clearMeasure() }}>清空</a>
                </div>
                {measures.map((m, i) => (
                  <div key={i} style={{ padding: '9px 10px', borderRadius: 6, border: '1px solid var(--border)', marginBottom: 6 }}>
                    <div className="flex justify-between">
                      <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{m.type}</span>
                      <span className="num" style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>{m.value}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 3 }}>{m.detail}</div>
                  </div>
                ))}
              </div>
            )
          )}

          {infoTab === 'annotate' && (
            <div>
              {current && (
                <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border-strong)', marginBottom: 12 }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{current.title}</span>
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={delAnnotation} />
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', margin: '4px 0 8px' }}>{current.id} · {current.type} · {current.buildingCode} · {current.createdBy}</div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.75, color: 'var(--text-secondary)' }}>{current.desc}</div>
                  <Button size="small" block style={{ marginTop: 10 }} onClick={() => nav('/tickets')}>转为工单</Button>
                </div>
              )}
              {annotations.map((a) => (
                <div
                  key={a.id}
                  onClick={() => { setAnnoId(a.id); viewer.current?.focus(`bld-${a.buildingCode}`) }}
                  style={{ display: 'flex', gap: 8, padding: '8px 6px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: a.color, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12 }}>{a.title}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{a.type} · {a.buildingCode}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {tool === 'section' && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px' }}>
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>
              <span>剖切位置</span><span className="num">{clip}%</span>
            </div>
            <Slider value={clip} onChange={(v) => { setClip(v); viewer.current?.setClip(v) }} />
          </div>
        )}
        {(tool === 'compare' || compare) && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 14px', fontSize: 10.5 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>BIM 线框</span>
              <span className="num" style={{ color: 'var(--brand)' }}>{compare ? '显示' : '隐藏'}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'linear-gradient(90deg,#1e3a8a,#22d3ee,#22c55e,#fbbf24,#dc2626)' }} />
            <div className="flex justify-between" style={{ color: 'var(--text-tertiary)', marginTop: 3 }}>
              <span>-50mm</span><span>0</span><span>+50mm</span>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 32, background: 'rgba(7,11,20,0.9)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px', fontSize: 10.5, color: 'var(--text-tertiary)', zIndex: 20 }}>
        <span className="num">X {coords.X}</span>
        <span className="num">Y {coords.Y}</span>
        <span className="num">Z {coords.Z}</span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span className="num">{coords.lat}°N {coords.lng}°E</span>
        <div style={{ flex: 1 }} />
        <span>CGCS2000 / 3-degree GK CM 120E</span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span className="num" style={{ color: stats.fps < 30 ? 'var(--danger)' : 'var(--ok)' }}>{stats.fps} FPS</span>
        <span className="num">{(stats.triangles / 10000).toFixed(1)} 万面</span>
        <span className="num">{stats.calls} drawcall</span>
      </div>

      {/* 标注/详情浮层 */}
      {annoId && current && (
        <div className="glass" style={{ position: 'absolute', right: 348, bottom: 46, width: 300, padding: 14, zIndex: 25 }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 13, fontWeight: 500, color: current.color }}>{current.title}</span>
            <a style={{ fontSize: 11 }} onClick={() => setAnnoId(null)}>关闭</a>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>{current.id} · {current.type} · {current.buildingCode}</div>
          <div style={{ fontSize: 11.5, lineHeight: 1.75, marginTop: 8, color: 'var(--text-secondary)' }}>{current.desc}</div>
          <div className="flex gap-2" style={{ marginTop: 12 }}>
            <Button size="small" block onClick={() => nav('/tickets')}>转工单</Button>
            <Button size="small" block danger onClick={delAnnotation}>删除</Button>
          </div>
        </div>
      )}

      {/* 新建标注 */}
      <Modal
        title="添加标注"
        open={annoOpen}
        onCancel={() => setAnnoOpen(false)}
        onOk={saveAnnotation}
        okText="保存标注"
        width={460}
      >
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 14 }}>
          落点坐标：X {pendingPos[0].toFixed(2)} · Y {pendingPos[1].toFixed(2)} · Z {pendingPos[2].toFixed(2)}（世界坐标，绑定到场景）
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 5 }}>标题</div>
          <Input value={annoTitle} onChange={(e) => setAnnoTitle(e.target.value)} placeholder="如：屋面东南角渗漏点" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 5 }}>类型</div>
          <Segmented block value={annoType} onChange={(v) => setAnnoType(v as '问题')} options={['问题', '说明', '巡检点', '设备信息']} />
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 5 }}>描述</div>
          <Input.TextArea rows={3} value={annoDesc} onChange={(e) => setAnnoDesc(e.target.value)} placeholder="描述问题现象、处理建议或设备信息" />
        </div>
      </Modal>

      <Modal title="分享场景" open={shareOpen} onCancel={() => setShareOpen(false)} footer={null} width={440}>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 8 }}>任何人通过此链接可查看当前场景（只读）</div>
        <Input readOnly value="https://mirrorfield.example.com/s/8F2K9M" />
        <div className="flex gap-2" style={{ marginTop: 12 }}>
          <Button type="primary" block onClick={() => { navigator.clipboard?.writeText('https://mirrorfield.example.com/s/8F2K9M'); message.success('链接已复制') }}>复制链接</Button>
          <Button block onClick={() => setShareOpen(false)}>关闭</Button>
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.8 }}>
          提示：分享链接为只读视图，不包含测量与标注编辑能力。如需协作，请使用 MR 远程协同。
        </div>
      </Modal>
    </div>
  )
}

function SceneStats({ stats }: { stats: ViewerStats }) {
  const kpi = api.stats.kpi()
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>滨江智能制造园区</div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>2.6 km² · 18 栋建筑 · 42,860 构件</div>
      <div className="grid grid-cols-2 gap-2" style={{ marginTop: 14 }}>
        {[
          ['三角面', '184.2 万'],
          ['纹理', '3.2 GB'],
          ['点云', '62.4 亿点'],
          ['精度', '±3.1 cm'],
          ['建筑', '18 栋'],
          ['管廊', '4.2 km'],
        ].map(([l, v]) => (
          <div key={l} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{l}</div>
            <div className="num" style={{ fontSize: 13, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.8 }}>
        <div className="flex justify-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
          <span>当前帧率</span><span className="num" style={{ color: stats.fps < 30 ? 'var(--danger)' : 'var(--ok)' }}>{stats.fps} FPS</span>
        </div>
        <div className="flex justify-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
          <span>drawcall</span><span className="num">{stats.calls}</span>
        </div>
        <div className="flex justify-between" style={{ padding: '6px 0' }}>
          <span>在线 MR 终端</span><span className="num">{kpi.online} / {kpi.devices}</span>
        </div>
      </div>
      <div style={{ marginTop: 14, padding: 10, borderRadius: 6, background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.16)', fontSize: 11, lineHeight: 1.75 }}>
        <InfoCircleOutlined style={{ color: 'var(--brand)', marginRight: 5 }} />
        双击建筑可快速聚焦。切换「漫游」后使用 W/A/S/D 移动，适合检查室内与管廊空间。
      </div>
    </div>
  )
}
