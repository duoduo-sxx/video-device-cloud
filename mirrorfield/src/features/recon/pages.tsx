import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button, Drawer, Input, Pagination, Select, Slider, Switch, Table, Tag, message,
} from 'antd'
import {
  ArrowLeftOutlined, CheckOutlined, CloudDownloadOutlined, ExportOutlined,
  LinkOutlined, QrcodeOutlined, SyncOutlined,
} from '@ant-design/icons'
import { EmptyState, Field, MetricRow, PageHeader, SectionCard } from '@/components/ui'
import EChart from '@/components/charts/EChart'
import { api } from '@/services'
import { ASSET_STATUS, fmtDate, fmtDateTime, fmtNum, downloadText, toCsv } from '@/utils'
import type { Asset } from '@/types'

const FORMAT_COLOR: Record<string, string> = {
  OSGB: '#22D3EE', '3D Tiles': '#6366F1', LAS: '#34D399', IFC: '#FBBF24', glTF: '#F472B6',
}

function AssetThumb({ code, format }: { code: string; format: string }) {
  const seed = code.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  const h = 40 + (seed % 40)
  return (
    <div style={{ height: 92, borderRadius: 8, position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #0d1b2e 0%, #0a1421 100%)' }}>
      <svg viewBox="0 0 200 92" style={{ width: '100%', height: '100%' }}>
        <g opacity="0.9">
          <path d="M0 78 L40 62 L80 70 L120 56 L160 64 L200 52 L200 92 L0 92 Z" fill="rgba(34,211,238,0.08)" />
          <rect x="52" y={78 - h} width="34" height={h} fill="rgba(148,163,184,0.16)" stroke="rgba(148,163,184,0.35)" strokeWidth="0.8" />
          <rect x="96" y={78 - h * 0.7} width="26" height={h * 0.7} fill="rgba(148,163,184,0.12)" stroke="rgba(148,163,184,0.3)" strokeWidth="0.8" />
          <rect x="130" y={78 - h * 1.15} width="20" height={h * 1.15} fill="rgba(148,163,184,0.1)" stroke="rgba(148,163,184,0.28)" strokeWidth="0.8" />
          {[0, 1, 2].map((i) => (
            <line key={i} x1="52" y1={70 - h + i * (h / 3)} x2="86" y2={70 - h + i * (h / 3)} stroke="rgba(34,211,238,0.3)" strokeWidth="0.6" />
          ))}
        </g>
      </svg>
      <span style={{ position: 'absolute', left: 8, bottom: 6, fontSize: 10, color: 'rgba(230,237,247,0.75)', letterSpacing: '0.04em' }}>{code}</span>
      <span style={{ position: 'absolute', right: 8, top: 8, fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: `${FORMAT_COLOR[format] ?? '#22D3EE'}22`, color: FORMAT_COLOR[format] ?? '#22D3EE' }}>{format}</span>
    </div>
  )
}

export function Assets() {
  const nav = useNavigate()
  const [kw, setKw] = useState('')
  const [format, setFormat] = useState<string>()
  const [status, setStatus] = useState<string>()
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<Asset | null>(null)

  const data = useMemo(() => api.assets.list({ kw, format, status, page, pageSize: 18 }), [kw, format, status, page])
  const all = api.assets.all()

  return (
    <div>
      <PageHeader
        title="模型资产"
        desc="管理实景模型、点云、BIM 与轻量化成果。资产可发布为 MR 场景，也可作为偏差对比的基准。"
        extra={
          <>
            <Button icon={<CloudDownloadOutlined />} onClick={() => downloadText('模型资产.csv', toCsv(data.list.map((a) => ({ 编号: a.id, 名称: a.name, 格式: a.format, 三角面: a.triangles, 体积: a.size, 状态: ASSET_STATUS[a.status].label }))))}>导出</Button>
            <Button type="primary" icon={<SyncOutlined />} onClick={() => message.success('已提交轻量化队列，预计 12 分钟完成')}>批量轻量化</Button>
          </>
        }
      />

      <div className="grid grid-cols-5 gap-3" style={{ marginBottom: 12 }}>
        <MetricRow items={[
          { label: '资产总数', value: all.length },
          { label: '已发布', value: all.filter((a) => a.status === 'PUBLISHED').length, color: 'var(--ok)' },
          { label: '轻量化中', value: all.filter((a) => a.status === 'OPTIMIZING').length, color: 'var(--brand)' },
          { label: '总三角面', value: '1.84 亿' },
        ]} />
        <SectionCard padding={12}>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>平均压缩率</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 600, color: 'var(--ok)', marginTop: 4 }}>91.6%</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>较静态发布提升 4.2%</div>
        </SectionCard>
      </div>

      <SectionCard
        padding={0}
        bodyStyle={{ padding: 14 }}
        title={
          <div className="flex items-center gap-2" style={{ fontWeight: 400 }}>
            <Input.Search size="small" placeholder="搜索资产名称或建筑编号" allowClear style={{ width: 240 }} onSearch={setKw} onChange={(e) => !e.target.value && setKw('')} />
            <Select size="small" placeholder="全部格式" allowClear style={{ width: 130 }} onChange={setFormat} options={Object.keys(FORMAT_COLOR).map((x) => ({ value: x, label: x }))} />
            <Select size="small" placeholder="全部状态" allowClear style={{ width: 120 }} onChange={setStatus} options={Object.entries(ASSET_STATUS).map(([v, x]) => ({ value: v, label: x.label }))} />
            <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>共 {data.total} 条</span>
          </div>
        }
        extra={<span style={{ fontSize: 11 }}>按更新时间倒序</span>}
      >
        <div className="grid grid-cols-6 gap-3">
          {data.list.map((a) => (
            <div key={a.id} className="card card-hover" style={{ padding: 8, cursor: 'pointer' }} onClick={() => setDetail(a)}>
              <AssetThumb code={a.buildingCode} format={a.format} />
              <div style={{ fontSize: 11.8, marginTop: 8, lineHeight: 1.5, height: 34, overflow: 'hidden' }}>{a.name}</div>
              <div className="flex items-center justify-between" style={{ marginTop: 6, fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                <span className="num">{fmtNum(a.triangles)} 面</span>
                <span>{a.size}</span>
              </div>
              <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
                <Tag color={a.status === 'PUBLISHED' ? 'green' : a.status === 'OPTIMIZING' ? 'cyan' : 'default'} style={{ fontSize: 10, marginInlineEnd: 0 }}>
                  {ASSET_STATUS[a.status].label}
                </Tag>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>LOD{a.lods}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end" style={{ marginTop: 14 }}>
          <Pagination size="small" current={page} pageSize={18} total={data.total} onChange={setPage} showSizeChanger={false} showTotal={(t) => `共 ${t} 个资产`} />
        </div>
      </SectionCard>

      <Drawer title="资产详情" open={!!detail} width={560} onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <AssetThumb code={detail.buildingCode} format={detail.format} />
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 16 }}>{detail.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6 }}>{detail.id} · {detail.zone}</div>

            <div className="grid grid-cols-2 gap-x-4" style={{ marginTop: 18 }}>
              <Field label="格式">{detail.format}</Field>
              <Field label="版本">{detail.version}</Field>
              <Field label="三角面">{fmtNum(detail.triangles)}</Field>
              <Field label="体积">{detail.size}</Field>
              <Field label="LOD 层级">{detail.lods} 级</Field>
              <Field label="复刻精度">{detail.precision}</Field>
              <Field label="压缩率">{detail.optimizeRate}</Field>
              <Field label="更新时间">{fmtDate(detail.updatedAt)}</Field>
            </div>

            <div style={{ marginTop: 18, marginBottom: 8, fontSize: 13, fontWeight: 500 }}>构件清单（前 8 条）</div>
            <Table
              size="small"
              pagination={false}
              rowKey="id"
              dataSource={[
                { id: 'IFC-WALL-01', name: '外墙-预制混凝土', count: 186 },
                { id: 'IFC-ROOF-02', name: '屋面-压型钢板', count: 64 },
                { id: 'IFC-WIN-03', name: '外窗-断桥铝', count: 128 },
                { id: 'IFC-DOOR-04', name: '工业门-卷帘', count: 12 },
              ]}
              columns={[
                { title: '编码', dataIndex: 'id', width: 130, render: (v: string) => <span className="num" style={{ fontSize: 11.5 }}>{v}</span> },
                { title: '构件类型', dataIndex: 'name' },
                { title: '数量', dataIndex: 'count', align: 'right', width: 70 },
              ]}
            />

            <div style={{ marginTop: 18, marginBottom: 8, fontSize: 13, fontWeight: 500 }}>版本历史</div>
            {['v2.4.1  2026-10-16  王芳  修复屋面纹理缺失', 'v2.4.0  2026-09-28  徐斌  补充东立面细节', 'v2.3.2  2026-08-11  王芳  轻量化参数优化'].map((v) => (
              <div key={v} style={{ fontSize: 11.5, color: 'var(--text-secondary)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>{v}</div>
            ))}

            <div className="flex gap-2" style={{ marginTop: 20 }}>
              <Button type="primary" block onClick={() => nav(`/recon/assets/${detail.id}/optimize`)}>查看轻量化流水线</Button>
              <Button block onClick={() => nav(`/recon/viewer?focus=${detail.buildingCode}`)}>在三维中查看</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

const STAGES = [
  { name: '原始导入', size: '1.21 GB', tri: '8,420,000', note: 'OSGB + 纹理 3.2 GB', delta: '—' },
  { name: '冗余面剔除', size: '842 MB', tri: '5,610,000', note: '共面合并、背面剔除、孔洞修补', delta: '-32.4%' },
  { name: '纹理压缩', size: '268 MB', tri: '5,610,000', note: 'KTX2 / Basis Universal，4K→2K', delta: '-68.2%' },
  { name: 'LOD 生成', size: '96 MB', tri: '1,820,000', note: 'LOD0-3 四级，误差 ≤ 2 px', delta: '-64.2%' },
  { name: '实例化合并', size: '68 MB', tri: '1,820,000', note: 'drawcall 1,842 → 214', delta: '-29.2%' },
  { name: '发布校验', size: '68 MB', tri: '1,820,000', note: '加载耗时 12.4 s → 1.8 s', delta: '通过' },
]

export function Optimize() {
  const { id } = useParams()
  const nav = useNavigate()
  const asset = api.assets.get(id ?? '')
  if (!asset) return <EmptyState text="资产不存在" action={<Button onClick={() => nav('/recon/assets')}>返回资产列表</Button>} />

  return (
    <div>
      <PageHeader
        title={`轻量化流水线 · ${asset.name}`}
        desc={`${asset.id} · 原始体积 1.21 GB · 目标：压缩率 ≥ 85%，首屏加载 ≤ 2 s。流程全自动执行，可回滚到任一阶段。`}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => nav('/recon/assets')}>返回</Button>}
      />

      <div className="grid grid-cols-4 gap-3">
        <SectionCard><div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>压缩率</div><div className="num" style={{ fontSize: 30, fontWeight: 600, color: 'var(--ok)', marginTop: 4 }}>94.4%</div><div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>1.21 GB → 68 MB</div></SectionCard>
        <SectionCard><div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>三角面削减</div><div className="num" style={{ fontSize: 30, fontWeight: 600, marginTop: 4 }}>78.4%</div><div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>842 万 → 182 万</div></SectionCard>
        <SectionCard><div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>drawcall</div><div className="num" style={{ fontSize: 30, fontWeight: 600, color: 'var(--brand)', marginTop: 4 }}>214</div><div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>优化前 1,842</div></SectionCard>
        <SectionCard><div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>首屏加载</div><div className="num" style={{ fontSize: 30, fontWeight: 600, color: 'var(--ok)', marginTop: 4 }}>1.8 s</div><div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>优化前 12.4 s</div></SectionCard>
      </div>

      <div className="grid grid-cols-12 gap-3" style={{ marginTop: 12 }}>
        <div className="col-span-7">
          <SectionCard title="处理阶段" padding={0} bodyStyle={{ padding: '14px 16px' }}>
            {STAGES.map((s, i) => (
              <div key={s.name} style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 13, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i === STAGES.length - 1 ? 'rgba(52,211,153,0.16)' : 'rgba(34,211,238,0.12)',
                    border: `1px solid ${i === STAGES.length - 1 ? 'rgba(52,211,153,0.45)' : 'rgba(34,211,238,0.35)'}`,
                    color: i === STAGES.length - 1 ? 'var(--ok)' : 'var(--brand)', fontSize: 11,
                  }}>
                    {i === STAGES.length - 1 ? <CheckOutlined /> : i + 1}
                  </div>
                  {i !== STAGES.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border-strong)', margin: '4px 0' }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: i === STAGES.length - 1 ? 0 : 16 }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                    <span className="num" style={{ fontSize: 11.5, color: s.delta === '通过' ? 'var(--ok)' : 'var(--text-tertiary)' }}>{s.delta}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>{s.note}</div>
                  <div className="flex gap-5" style={{ marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                    <span className="num">体积 {s.size}</span>
                    <span className="num">三角面 {s.tri}</span>
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>
        </div>
        <div className="col-span-5">
          <SectionCard title="体积与面数对比">
            <EChart
              height={240}
              option={{
                grid: { top: 30, right: 16, bottom: 26, left: 46 },
                tooltip: { trigger: 'axis' },
                legend: { top: 0, right: 0, itemWidth: 8, itemHeight: 8 },
                xAxis: { type: 'category', data: STAGES.map((s) => s.name.slice(0, 4)), axisLabel: { interval: 0, fontSize: 9.5, rotate: 20 } },
                yAxis: [
                  { type: 'value', name: 'MB', nameTextStyle: { fontSize: 10 } },
                  { type: 'value', name: '万面', nameTextStyle: { fontSize: 10 }, splitLine: { show: false } },
                ],
                series: [
                  { name: '体积 (MB)', type: 'bar', data: [1210, 842, 268, 96, 68, 68], barWidth: 14, itemStyle: { borderRadius: [2, 2, 0, 0] } },
                  { name: '三角面 (万)', type: 'line', yAxisIndex: 1, data: [842, 561, 561, 182, 182, 182], smooth: true, symbolSize: 4 },
                ],
              }}
            />
          </SectionCard>
          <div style={{ marginTop: 12 }}>
            <SectionCard title="执行日志" bodyStyle={{ padding: 12, background: 'rgba(7,11,20,0.5)', borderRadius: '0 0 10px 10px' }}>
              <pre style={{ margin: 0, fontSize: 10.5, lineHeight: 1.85, color: 'var(--text-secondary)', fontFamily: 'SFMono-Regular, Menlo, monospace', maxHeight: 208, overflow: 'auto' }}>
{`[09:12:04] load osgb ............ 1.21 GB
[09:12:19] mesh simplify ....... -32.4%
[09:13:02] texture pack ........ KTX2 268 MB
[09:13:41] lod generate ........ LOD0-3
[09:14:08] instance merge ...... 214 calls
[09:14:22] validate ............ PASS
[09:14:22] total elapsed ....... 138 s`}
              </pre>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Compare() {
  const [threshold, setThreshold] = useState(30)
  const [split, setSplit] = useState(50)
  const [onlyOver, setOnlyOver] = useState(false)

  const overPoints = Array.from({ length: 24 }, (_, i) => ({
    id: `DP-${String(i + 1).padStart(4, '0')}`,
    building: ['A-01', 'A-02', 'A-03', 'B-01', 'B-02', 'D-01'][i % 6],
    x: 3453210.456 + (i * 13.4) % 320,
    y: 40512880.132 - (i * 21.7) % 280,
    dev: Number((32 + ((i * 17) % 46) - 20).toFixed(1)),
    component: ['屋面', '外墙', '雨棚', '设备基础', '女儿墙'][i % 5],
  })).filter((p) => Math.abs(p.dev) >= threshold)

  return (
    <div>
      <PageHeader
        title="偏差对比"
        desc="实景三维模型与 BIM 设计模型套合分析，按偏差色谱标注超限区域，支持导出精度检验报告。"
        extra={<Button type="primary" icon={<ExportOutlined />} onClick={() => message.success('偏差报告已生成，包含 6 页图表与结论')}>生成报告</Button>}
      />

      <div className="grid grid-cols-4 gap-3">
        <MetricRow items={[
          { label: '平均偏差', value: '12.3 mm', color: 'var(--ok)' },
          { label: '最大正偏', value: '+47.8 mm', color: 'var(--warn)' },
          { label: '最大负偏', value: '-38.2 mm', color: 'var(--warn)' },
          { label: '超限点占比', value: '2.4%', color: 'var(--danger)' },
        ]} />
      </div>

      <div className="grid grid-cols-12 gap-3" style={{ marginTop: 12 }}>
        <div className="col-span-8">
          <SectionCard
            title="偏差色谱"
            extra={
              <div className="flex items-center gap-3" style={{ fontSize: 11 }}>
                <span>阈值 ±{threshold} mm</span>
                <Switch size="small" checked={onlyOver} onChange={setOnlyOver} />
                <span style={{ color: 'var(--text-tertiary)' }}>只看超限</span>
              </div>
            }
            padding={0}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ position: 'relative', height: 380, background: 'radial-gradient(ellipse at 50% 30%, #10233a 0%, #070b14 70%)', overflow: 'hidden' }}>
              <svg viewBox="0 0 800 380" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="devg" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="28%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#22c55e" />
                    <stop offset="72%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                  <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M20 0H0V20" fill="none" stroke="rgba(148,163,184,0.08)" />
                  </pattern>
                </defs>
                <rect width="800" height="380" fill="url(#grid2)" />
                <g opacity={onlyOver ? 0.18 : 1}>
                  {[
                    { x: 120, y: 220, w: 150, h: 90, r: 0 },
                    { x: 320, y: 180, w: 120, h: 130, r: 0 },
                    { x: 500, y: 240, w: 180, h: 70, r: 0 },
                    { x: 250, y: 260, w: 60, h: 50, r: 0 },
                  ].map((b, i) => (
                    <g key={i}>
                      <path d={`M${b.x} ${b.y} l${b.w} 0 l0 ${b.h} l${-b.w} 0 z`} fill="url(#devg)" opacity="0.72" style={{ mixBlendMode: 'screen' }} />
                      <path d={`M${b.x} ${b.y} l0 ${b.h} l${b.w} 0`} stroke="rgba(255,255,255,0.35)" fill="none" strokeWidth="1" />
                      <text x={b.x + 6} y={b.y - 6} fontSize="10" fill="#93A4BE">{['A-01', 'A-02', 'A-03', 'B-02'][i]}</text>
                    </g>
                  ))}
                </g>
                {onlyOver && overPoints.slice(0, 12).map((p, i) => (
                  <circle key={p.id} cx={140 + (i % 6) * 100} cy={210 + Math.floor(i / 6) * 90} r="4" fill="#f87171" stroke="#fff" strokeWidth="1" />
                ))}
                <g transform="translate(690,60)">
                  <circle r="16" fill="rgba(7,11,20,0.8)" stroke="rgba(148,163,184,0.3)" />
                  <path d="M0 -10 L4.5 7 L0 3.5 L-4.5 7 Z" fill="#22D3EE" />
                </g>
              </svg>

              <div className="glass" style={{ position: 'absolute', left: 14, top: 14, padding: '8px 12px', fontSize: 11 }}>
                <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>对比模型</div>
                <div>实景 MA-0231 <span style={{ color: 'var(--text-tertiary)' }}>vs</span> BIM MA-0188</div>
              </div>

              <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12 }}>
                <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg,#1e3a8a,#22d3ee,#22c55e,#fbbf24,#dc2626)' }} />
                <div className="flex justify-between" style={{ fontSize: 9.5, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  <span className="num">-50 mm</span><span className="num">-25</span><span className="num">0</span><span className="num">+25</span><span className="num">+50 mm</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
              <Slider value={split} onChange={setSplit} tooltip={{ formatter: (v) => `擦除 ${v}%` }} />
              <div className="flex items-center justify-between" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                <span>实景模型</span>
                <span>滑块控制擦除比例（{split}%）</span>
                <span>BIM 模型</span>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="col-span-4">
          <SectionCard title="偏差分布" extra={<span style={{ fontSize: 11 }}>20 个区间</span>}>
            <EChart
              height={180}
              option={{
                grid: { top: 12, right: 10, bottom: 24, left: 36 },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: ['-50', '-40', '-30', '-20', '-10', '0', '10', '20', '30', '40', '50'], axisLabel: { fontSize: 9 } },
                yAxis: { type: 'value', axisLabel: { fontSize: 9 } },
                series: [{
                  type: 'bar', barWidth: '72%',
                  data: [2, 6, 14, 32, 78, 142, 96, 41, 18, 7, 3],
                  itemStyle: {
                    borderRadius: [2, 2, 0, 0],
                    color: (p: { dataIndex: number }) => ['#1e3a8a', '#1d4ed8', '#0ea5e9', '#22d3ee', '#34d399', '#22c55e', '#a3e635', '#fbbf24', '#f59e0b', '#f97316', '#dc2626'][p.dataIndex],
                  },
                }],
              }}
            />
          </SectionCard>

          <div style={{ marginTop: 12 }}>
            <SectionCard title="阈值设置">
              <Slider value={threshold} min={10} max={50} step={5} onChange={setThreshold} marks={{ 10: '10', 20: '20', 30: '30', 50: '50' }} />
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 22, lineHeight: 1.7 }}>
                当前阈值 ±{threshold} mm，超限点 {overPoints.length} 个，占全部检查点的 2.4%。超限区域集中在 A-03 屋面女儿墙与 D-01 设备基础。
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <SectionCard title={`超限点清单（${overPoints.length}）`} padding={0} bodyStyle={{ padding: 0 }} extra={<Button size="small" type="text" onClick={() => downloadText('超限点.csv', toCsv(overPoints.map((p) => ({ 点号: p.id, 建筑: p.building, X: p.x.toFixed(3), Y: p.y.toFixed(3), 偏差: p.dev, 构件: p.component }))))}>导出 CSV</Button>}>
          <Table
            size="small"
            rowKey="id"
            pagination={{ pageSize: 8, size: 'small' }}
            dataSource={overPoints}
            columns={[
              { title: '点号', dataIndex: 'id', width: 100, render: (v: string) => <span className="num" style={{ color: 'var(--brand)' }}>{v}</span> },
              { title: '所属建筑', dataIndex: 'building', width: 100 },
              { title: 'X', dataIndex: 'x', align: 'right', render: (v: number) => <span className="num" style={{ fontSize: 11.5 }}>{v.toFixed(3)}</span> },
              { title: 'Y', dataIndex: 'y', align: 'right', render: (v: number) => <span className="num" style={{ fontSize: 11.5 }}>{v.toFixed(3)}</span> },
              { title: '偏差', dataIndex: 'dev', align: 'right', width: 90, render: (v: number) => <span style={{ color: Math.abs(v) > 40 ? 'var(--danger)' : 'var(--warn)' }}>{v > 0 ? '+' : ''}{v} mm</span> },
              { title: '构件', dataIndex: 'component', width: 110 },
              { title: '处理', width: 90, render: () => <a style={{ fontSize: 11.5 }}>转工单</a> },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  )
}

export function Publish() {
  const [layers, setLayers] = useState<string[]>(['实景模型', '管线', '标注', '环境'])
  const [access, setAccess] = useState('public')
  const [name, setName] = useState('滨江园区一期 · 交付版')
  const versions = [
    { v: 'v2.4.1', at: '2026-10-16 15:40', by: '王芳', note: '修复 A-03 屋面纹理缺失，更新标注 3 条', current: true },
    { v: 'v2.4.0', at: '2026-09-28 10:12', by: '徐斌', note: '补充东立面细节，点云重采样' },
    { v: 'v2.3.2', at: '2026-08-11 16:20', by: '王芳', note: '轻量化参数优化，加载耗时降至 1.8 s' },
    { v: 'v2.3.0', at: '2026-07-02 09:30', by: '林嘉怡', note: 'BIM 模型更新至 LOD350' },
  ]
  const allLayers = ['实景模型', '点云', 'BIM 模型', '管线', '标注', '巡检路线', '地下管网', '环境']

  return (
    <div>
      <PageHeader
        title="场景发布"
        desc="配置对外可见的图层与初始视角，生成分享链接与二维码。发布版本可回滚，回滚不影响已有分享链接。"
        extra={<Button type="primary" icon={<CloudDownloadOutlined />} onClick={() => message.success('场景已发布，分享链接已更新')}>发布当前配置</Button>}
      />

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7">
          <SectionCard title="场景配置">
            <div className="grid grid-cols-2 gap-x-4">
              <div style={{ gridColumn: '1 / span 2' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 6 }}>场景名称</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 18, fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 8 }}>包含图层</div>
            <div className="grid grid-cols-4 gap-2">
              {allLayers.map((l) => {
                const on = layers.includes(l)
                return (
                  <div
                    key={l}
                    onClick={() => setLayers(on ? layers.filter((x) => x !== l) : [...layers, l])}
                    style={{
                      padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                      border: `1px solid ${on ? 'rgba(34,211,238,0.45)' : 'var(--border)'}`,
                      background: on ? 'rgba(34,211,238,0.1)' : 'transparent',
                      color: on ? 'var(--brand)' : 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    {l}
                    {on && <CheckOutlined style={{ fontSize: 10 }} />}
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 18, fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 8 }}>初始视角</div>
            <div className="grid grid-cols-3 gap-2">
              {['园区全景', 'A 区装配车间', '文保建筑'].map((v, i) => (
                <div key={v} style={{
                  padding: '10px', borderRadius: 6, fontSize: 12, textAlign: 'center', cursor: 'pointer',
                  border: `1px solid ${i === 0 ? 'rgba(34,211,238,0.45)' : 'var(--border)'}`,
                  background: i === 0 ? 'rgba(34,211,238,0.1)' : 'transparent',
                  color: i === 0 ? 'var(--brand)' : 'var(--text-secondary)',
                }}>{v}</div>
              ))}
            </div>

            <div style={{ marginTop: 18, fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 8 }}>访问权限</div>
            <Select value={access} onChange={setAccess} style={{ width: 260 }} options={[
              { value: 'public', label: '公开访问（任何人可查看）' },
              { value: 'password', label: '密码访问（需输入访问码）' },
              { value: 'restricted', label: '指定人员（白名单 12 人）' },
            ]} />

            <div style={{ marginTop: 18, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(148,163,184,0.03)' }}>
              <div className="flex items-center gap-2" style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                <LinkOutlined /> 分享链接
              </div>
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                <Input readOnly value="https://mirrorfield.example.com/s/8F2K9M" size="small" />
                <Button size="small" onClick={() => message.success('链接已复制到剪贴板')}>复制</Button>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 8 }}>有效期至 2027-10-19 · 访问码 {access === 'password' ? 'MF-2026' : '不需要'}</div>
            </div>
          </SectionCard>
        </div>

        <div className="col-span-5">
          <SectionCard title="预览" extra={<span style={{ fontSize: 11 }}>移动端</span>}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 236, border: '8px solid #1a2438', borderRadius: 26, overflow: 'hidden', background: '#070B14' }}>
                <div style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--text-tertiary)' }}>9:41</div>
                <div style={{ height: 300, position: 'relative', background: 'radial-gradient(ellipse at 50% 40%, #13324d 0%, #070b14 75%)' }}>
                  <svg viewBox="0 0 200 300" style={{ width: '100%', height: '100%' }}>
                    <path d="M0 230 L50 200 L70 240 L110 190 L150 210 L200 180 L200 300 L0 300 Z" fill="#0d1b2e" />
                    <rect x="60" y="150" width="44" height="80" fill="#16324a" stroke="rgba(34,211,238,0.4)" />
                    <rect x="116" y="170" width="32" height="60" fill="#122a3f" stroke="rgba(34,211,238,0.3)" />
                    <circle cx="100" cy="60" r="3" fill="#22D3EE" />
                  </svg>
                  <div style={{ position: 'absolute', left: 10, top: 10, color: '#E6EDF7', fontSize: 11, fontWeight: 500 }}>{name}</div>
                  <div style={{ position: 'absolute', left: 10, top: 28, color: '#93A4BE', fontSize: 8.5 }}>滨江智能制造园区 · 2.6 km²</div>
                  <div style={{ position: 'absolute', left: 10, bottom: 10, display: 'flex', gap: 4 }}>
                    {layers.slice(0, 3).map((l) => (
                      <span key={l} style={{ fontSize: 8, padding: '2px 5px', borderRadius: 3, background: 'rgba(34,211,238,0.15)', color: '#22D3EE' }}>{l}</span>
                    ))}
                  </div>
                </div>
                <div style={{ padding: 10, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                  <div style={{ fontSize: 9, color: '#5D6E8A', lineHeight: 1.6 }}>三维复刻与 MR 虚实交互系统<br />技术支持：云图空间信息技术</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <div style={{ padding: 8, background: '#fff', borderRadius: 6 }}>
                <div
                  style={{
                    width: 96, height: 96,
                    backgroundImage:
                      'linear-gradient(90deg,#000 25%,transparent 25%,transparent 50%,#000 50%,#000 75%,transparent 75%),linear-gradient(#000 25%,transparent 25%,transparent 50%,#000 50%,#000 75%,transparent 75%)',
                    backgroundSize: '12px 12px', opacity: 0.85,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-center gap-1" style={{ marginTop: 8, fontSize: 10.5, color: 'var(--text-tertiary)' }}>
              <QrcodeOutlined /> 扫码在移动端打开
            </div>
          </SectionCard>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <SectionCard title="版本快照" padding={0} bodyStyle={{ padding: 0 }} extra={<span style={{ fontSize: 11 }}>保留最近 10 个版本</span>}>
          <Table
            size="middle"
            rowKey="v"
            pagination={false}
            dataSource={versions}
            columns={[
              { title: '版本', dataIndex: 'v', width: 100, render: (v: string, r) => <span className="num" style={{ color: r.current ? 'var(--brand)' : 'var(--text-primary)' }}>{v} {r.current && <Tag color="cyan" style={{ fontSize: 9.5, marginLeft: 4 }}>当前</Tag>}</span> },
              { title: '发布时间', dataIndex: 'at', width: 150 },
              { title: '发布人', dataIndex: 'by', width: 90 },
              { title: '说明', dataIndex: 'note' },
              { title: '操作', width: 130, render: (_, r) => (r.current ? <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>—</span> : <a style={{ fontSize: 12 }} onClick={() => message.success(`已回滚至 ${r.v}`)}>回滚到此版本</a>) },
            ]}
          />
        </SectionCard>
      </div>

      <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--text-tertiary)' }}>
        发布时间：{fmtDateTime(new Date().toISOString())} · 当前场景包含 {layers.length} 个图层 · 共享范围 {access === 'public' ? '公开' : access === 'password' ? '密码访问' : '指定人员'}
      </div>
    </div>
  )
}

export default { Assets, Optimize, Compare, Publish }
