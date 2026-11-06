import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Drawer, Progress, Select, Steps, Table, Tag, message } from 'antd'
import {
  ApiOutlined, CheckCircleFilled, CloudDownloadOutlined, CompassOutlined,
  DeploymentUnitOutlined, MobileOutlined, PlayCircleOutlined, SyncOutlined, ThunderboltOutlined,
} from '@ant-design/icons'
import EChart from '@/components/charts/EChart'
import { Field, MetricRow, PageHeader, SectionCard, StatusTag } from '@/components/ui'
import { api } from '@/services'
import { DEVICE_STATUS, fmtDateTime, fmtDuration, fromNow } from '@/utils'
import type { Calibration as Cal, MrDevice } from '@/types'

export function Devices() {
  const [detail, setDetail] = useState<MrDevice | null>(null)
  const devices = api.devices.all()
  const online = devices.filter((d) => d.status === 'ONLINE').length

  return (
    <div>
      <PageHeader
        title="MR 设备管理"
        desc="管理接入园区的 MR 终端，监控在线状态、电量、空间锚点与固件版本。设备需完成空间标定后方可加载交互场景。"
        extra={
          <>
            <Button icon={<CloudDownloadOutlined />}>导出清单</Button>
            <Button type="primary" icon={<SyncOutlined />} onClick={() => message.success('已向 14 台在线设备下发同步指令')}>批量同步</Button>
          </>
        }
      />

      <div className="grid grid-cols-5 gap-3">
        <MetricRow items={[
          { label: '设备总数', value: devices.length },
          { label: '在线', value: online, color: 'var(--ok)' },
          { label: '离线', value: devices.filter((d) => d.status === 'OFFLINE').length, color: 'var(--danger)' },
          { label: '平均电量', value: `${Math.round(devices.reduce((s, d) => s + d.battery, 0) / devices.length)}%` },
        ]} />
        <SectionCard padding={12}>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>锚点总数</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 600, color: 'var(--brand)', marginTop: 4 }}>{devices.reduce((s, d) => s + d.anchors, 0)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>平均每台 {(devices.reduce((s, d) => s + d.anchors, 0) / devices.length).toFixed(1)} 个</div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-3 gap-3" style={{ marginTop: 12 }}>
        {devices.map((d) => (
          <div key={d.id} className="card card-hover" style={{ padding: 14, cursor: 'pointer' }} onClick={() => setDetail(d)}>
            <div className="flex items-start justify-between">
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 3 }}>{d.model} · {d.sn}</div>
              </div>
              <StatusTag map={DEVICE_STATUS} value={d.status} />
            </div>
            <div className="flex items-center gap-3" style={{ marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <div className="flex justify-between" style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 3 }}>
                  <span>电量</span><span className="num">{d.battery}%</span>
                </div>
                <Progress percent={d.battery} showInfo={false} size="small" strokeColor={d.battery < 20 ? '#F87171' : d.battery < 50 ? '#FBBF24' : '#34D399'} trailColor="rgba(148,163,184,0.15)" />
              </div>
              <div style={{ textAlign: 'right', fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                <div className="num">{d.anchors} 锚点</div>
                <div style={{ marginTop: 3 }}>{fromNow(d.lastSync)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--border)', fontSize: 10.5, color: 'var(--text-tertiary)' }}>
              <span>固件 {d.firmware}</span>
              <span style={{ color: 'var(--brand)' }}>查看详情 →</span>
            </div>
          </div>
        ))}
      </div>

      <Drawer title="设备详情" open={!!detail} width={520} onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{detail.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 5 }}>{detail.model} · {detail.sn}</div>
              </div>
              <StatusTag map={DEVICE_STATUS} value={detail.status} />
            </div>

            <div className="grid grid-cols-2 gap-x-4" style={{ marginTop: 18 }}>
              <Field label="固件版本">{detail.firmware}</Field>
              <Field label="当前电量">{detail.battery}%</Field>
              <Field label="所属场景">{api.scenes.get(detail.sceneId)?.name ?? '—'}</Field>
              <Field label="空间锚点">{detail.anchors} 个</Field>
              <Field label="上次同步">{fmtDateTime(detail.lastSync)}</Field>
              <Field label="序列号">{detail.sn}</Field>
            </div>

            <div style={{ marginTop: 20, marginBottom: 8, fontSize: 13, fontWeight: 500 }}>近 24 小时电量</div>
            <EChart
              height={140}
              option={{
                grid: { top: 10, right: 10, bottom: 20, left: 32 },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: ['08', '10', '12', '14', '16', '18', '20', '22', '00', '02'], axisLabel: { fontSize: 9 } },
                yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 9, formatter: '{value}%' } },
                series: [{ type: 'line', smooth: true, symbol: 'none', areaStyle: { opacity: 0.15 }, data: [100, 96, 88, 74, 62, 48, 38, 26, 14, 8] }],
              }}
            />

            <div style={{ marginTop: 18, marginBottom: 8, fontSize: 13, fontWeight: 500 }}>标定记录</div>
            {api.devices.calibrations(detail.id).slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center justify-between" style={{ padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 11.5 }}>
                <div>
                  <div>{c.method === 'MARKER' ? 'Marker 标定' : c.method === 'POINTCLOUD' ? '点云配准' : '三点对齐'}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{fmtDateTime(c.createdAt)} · {c.operator}</div>
                </div>
                <span className="num" style={{ color: c.pass ? 'var(--ok)' : 'var(--danger)' }}>RMS {c.rms} mm</span>
              </div>
            ))}

            <div style={{ marginTop: 18, marginBottom: 8, fontSize: 13, fontWeight: 500 }}>已安装应用</div>
            {[
              { n: '巡检引导 v2.3.1', s: '已安装', d: '2026-09-12' },
              { n: '设备拆解演示 v1.0.4', s: '已安装', d: '2026-08-30' },
              { n: '安全交底 v2.0.0', s: '待更新', d: '2026-10-08' },
            ].map((a) => (
              <div key={a.n} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 11.5 }}>
                <span>{a.n}</span>
                <span style={{ color: a.s === '已安装' ? 'var(--ok)' : 'var(--warn)', fontSize: 10.5 }}>{a.s} · {a.d}</span>
              </div>
            ))}

            <div className="flex gap-2" style={{ marginTop: 20 }}>
              <Button type="primary" block icon={<ApiOutlined />} onClick={() => message.success('已发起远程协同请求')}>发起协同</Button>
              <Button block icon={<ThunderboltOutlined />} onClick={() => message.success('已下发场景同步指令')}>同步场景</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export function Calibration() {
  const [step, setStep] = useState(0)
  const [method, setMethod] = useState<Cal['method']>('POINTCLOUD')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const nav = useNavigate()
  const devices = api.devices.all().filter((d) => d.status !== 'OFFLINE')
  const [deviceId, setDeviceId] = useState(devices[0]?.id ?? 'MR-001')

  const run = () => {
    setRunning(true)
    setProgress(0)
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer)
          setRunning(false)
          setDone(true)
          api.devices.addCalibration({ deviceId, method, rms: 12, maxError: 21, points: 26 })
          return 100
        }
        return p + 4
      })
    }, 90)
  }

  const residual = [
    ['CP-01', 6, -4, 3], ['CP-02', -8, 5, 2], ['CP-03', 4, 7, -6], ['CP-04', -3, -9, 4],
    ['CP-05', 11, 2, 5], ['CP-06', -17, 6, -8], ['CP-07', 2, -3, 9], ['CP-08', 7, 8, -4],
  ].map(([id, x, y, z]) => ({ id: String(id), x: Number(x), y: Number(y), z: Number(z), over: Math.abs(Number(x)) > 15 || Math.abs(Number(y)) > 15 || Math.abs(Number(z)) > 15 }))

  return (
    <div>
      <PageHeader
        title="空间标定"
        desc="将虚拟坐标系与真实空间配准，配准 RMS 控制在 15 mm 以内方可发布场景。支持 Marker、点云配准与三点手动对齐三种方式。"
        extra={<Tag color="cyan" style={{ marginInlineEnd: 0 }}>当前为模拟演示模式，未连接真实 MR 终端</Tag>}
      />

      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>标定设备</span>
        <Select
          size="small"
          value={deviceId}
          onChange={setDeviceId}
          style={{ width: 240 }}
          options={devices.map((d) => ({ value: d.id, label: `${d.name} · ${d.model}` }))}
        />
        <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>仅显示在线设备（离线设备无法发起标定）</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Steps
          size="small"
          current={step}
          items={[{ title: '选择标定方式' }, { title: '执行标定' }, { title: '结果与判定' }]}
          onChange={(s) => { if (s < step) setStep(s) }}
        />
      </div>

      {step === 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { m: 'MARKER' as const, name: '二维码 Marker 标定', acc: '±8 mm', time: '约 30 s', desc: '在场景固定位置布设 4 个 Marker，终端识别角点后自动求解位姿。适合固定工位与产线。', icon: <CompassOutlined />, tag: '推荐固定工位' },
            { m: 'POINTCLOUD' as const, name: '点云配准标定', acc: '±5 mm', time: '约 60 s', desc: '终端扫描现场点云与模型点云做 ICP 配准，精度最高。适合大空间与复杂结构。', icon: <DeploymentUnitOutlined />, tag: '精度最高' },
            { m: 'MANUAL' as const, name: '三点手动对齐', acc: '±25 mm', time: '约 15 s', desc: '手动选取三对同名点完成对齐，速度快但精度有限。适合快速演示与临时场景。', icon: <MobileOutlined />, tag: '快速演示' },
          ].map((x) => (
            <div
              key={x.m}
              className="card card-hover"
              onClick={() => setMethod(x.m)}
              style={{
                padding: 18, cursor: 'pointer',
                borderColor: method === x.m ? 'rgba(34,211,238,0.5)' : 'var(--border)',
                background: method === x.m ? 'rgba(34,211,238,0.05)' : 'var(--bg-elevated)',
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 22, color: 'var(--brand)' }}>{x.icon}</span>
                {method === x.m && <CheckCircleFilled style={{ color: 'var(--brand)' }} />}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 12 }}>{x.name}</div>
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                <Tag style={{ fontSize: 10 }}>{x.tag}</Tag>
                <Tag style={{ fontSize: 10 }}>精度 {x.acc}</Tag>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.75, marginTop: 10, minHeight: 62 }}>{x.desc}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>预计耗时 {x.time}</div>
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-8">
            <SectionCard title="终端第一视角（模拟）" extra={<span style={{ fontSize: 11 }}>{devices.find((d) => d.id === deviceId)?.name}</span>} padding={0} bodyStyle={{ padding: 0 }}>
              <FirstPerson markers={progress > 60 ? 4 : progress > 30 ? 3 : 1} />
            </SectionCard>
          </div>
          <div className="col-span-4">
            <SectionCard title="标定参数">
              <div className="grid grid-cols-2 gap-x-3">
                <Field label="标定方式">{method === 'MARKER' ? 'Marker' : method === 'POINTCLOUD' ? '点云配准' : '三点对齐'}</Field>
                <Field label="目标设备">{deviceId}</Field>
                <Field label="场景">装配车间 A-03</Field>
                <Field label="阈值">RMS ≤ 15 mm</Field>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="flex justify-between" style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                  <span>识别进度</span><span className="num">{progress}%</span>
                </div>
                <Progress percent={progress} showInfo={false} strokeColor="#22D3EE" trailColor="rgba(148,163,184,0.15)" />
              </div>
              <div className="grid grid-cols-2 gap-2" style={{ marginTop: 14 }}>
                {[
                  ['已识别点', `${Math.min(26, Math.round((progress / 100) * 26))}`],
                  ['当前 RMS', progress > 80 ? '12.0 mm' : progress > 40 ? '18.6 mm' : '—'],
                  ['配准点数', `${Math.min(26, Math.round((progress / 100) * 26))}`],
                  ['耗时', `${(progress * 0.48).toFixed(0)} s`],
                ].map(([l, v]) => (
                  <div key={l} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{l}</div>
                    <div className="num" style={{ fontSize: 14, marginTop: 3, color: 'var(--brand)' }}>{v}</div>
                  </div>
                ))}
              </div>
              <Button type="primary" block loading={running} onClick={run} style={{ marginTop: 16 }} icon={<PlayCircleOutlined />}>
                {running ? '标定进行中' : '开始标定'}
              </Button>
              <Button block style={{ marginTop: 8 }} onClick={() => setStep(0)}>重新选择方式</Button>
              {done && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', fontSize: 11.5, color: 'var(--ok)' }}>
                  标定完成，RMS 12.0 mm，判定合格。已写入标定记录。
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-7">
            <SectionCard title="配准结果" extra={<Tag color="green">合格</Tag>}>
              <div className="grid grid-cols-4 gap-2">
                {[
                  ['配准 RMS', '12.0 mm', 'var(--ok)'],
                  ['最大误差', '21.0 mm', 'var(--warn)'],
                  ['配准点数', '26', 'var(--brand)'],
                  ['总耗时', '48 s', 'var(--text-primary)'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ padding: '12px', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{l}</div>
                    <div className="num" style={{ fontSize: 20, fontWeight: 600, color: c, marginTop: 6 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="id"
                  dataSource={residual}
                  columns={[
                    { title: '点号', dataIndex: 'id', width: 80 },
                    { title: 'ΔX (mm)', dataIndex: 'x', align: 'right', render: (v: number) => <span style={{ color: Math.abs(v) > 15 ? 'var(--danger)' : undefined }}>{v}</span> },
                    { title: 'ΔY (mm)', dataIndex: 'y', align: 'right', render: (v: number) => <span style={{ color: Math.abs(v) > 15 ? 'var(--danger)' : undefined }}>{v}</span> },
                    { title: 'ΔZ (mm)', dataIndex: 'z', align: 'right', render: (v: number) => <span style={{ color: Math.abs(v) > 15 ? 'var(--danger)' : undefined }}>{v}</span> },
                    { title: '判定', width: 80, render: (_: unknown, r: { over: boolean }) => (r.over ? <Tag color="red" style={{ fontSize: 10 }}>超限</Tag> : <Tag color="green" style={{ fontSize: 10 }}>合格</Tag>) },
                  ]}
                />
              </div>
            </SectionCard>
          </div>
          <div className="col-span-5">
            <SectionCard title="判定与后续">
              <div style={{ fontSize: 12, lineHeight: 1.9, color: 'var(--text-secondary)' }}>
                本次标定共使用 26 个配准点，最大残差 21 mm，出现在车间东北角立柱区域。整体 RMS 12 mm，满足 15 mm 阈值要求，可以发布场景。
              </div>
              <div style={{ marginTop: 14, padding: 10, borderRadius: 6, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', fontSize: 11.5, lineHeight: 1.7 }}>
                建议：东北角立柱被设备遮挡，下次标定可补设 2 个 Marker，预计 RMS 可降至 9 mm 以内。
              </div>
              <div className="grid grid-cols-2 gap-2" style={{ marginTop: 16 }}>
                <Button onClick={() => message.success('标定报告已生成（PDF）')}>生成报告</Button>
                <Button type="primary" onClick={() => nav('/mr/authoring')}>去编排场景</Button>
              </div>
              <div style={{ marginTop: 10, fontSize: 10.5, color: 'var(--text-tertiary)' }}>标定记录已保存 · {fmtDateTime(new Date().toISOString())}</div>
            </SectionCard>
          </div>
        </div>
      )}

      {step > 0 && (
        <div className="flex gap-2" style={{ marginTop: 16 }}>
          <Button onClick={() => { setStep(0); setDone(false); setProgress(0) }}>上一步</Button>
          {step === 1 && <Button type="primary" disabled={!done} onClick={() => setStep(2)}>查看结果</Button>}
          {step === 2 && <Button type="primary" onClick={() => { setStep(0); setDone(false); setProgress(0) }}>完成并新建标定</Button>}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <SectionCard title="标定记录" padding={0} bodyStyle={{ padding: 0 }} extra={<span style={{ fontSize: 11 }}>共 96 条</span>}>
          <Table
            size="small"
            rowKey="id"
            dataSource={api.devices.all().flatMap((d) => api.devices.calibrations(d.id)).slice(0, 10)}
            pagination={{ pageSize: 6, size: 'small' }}
            columns={[
              { title: '记录号', dataIndex: 'id', width: 100, render: (v: string) => <span className="num" style={{ color: 'var(--brand)' }}>{v}</span> },
              { title: '设备', dataIndex: 'deviceId', width: 100 },
              { title: '方式', dataIndex: 'method', width: 100, render: (v: string) => ({ MARKER: 'Marker', POINTCLOUD: '点云配准', MANUAL: '三点对齐' }[v]) },
              { title: 'RMS', dataIndex: 'rms', align: 'right', width: 80, render: (v: number) => <span className="num" style={{ color: v <= 15 ? 'var(--ok)' : 'var(--danger)' }}>{v} mm</span> },
              { title: '最大误差', dataIndex: 'maxError', align: 'right', width: 90, render: (v: number) => <span className="num">{v} mm</span> },
              { title: '配准点', dataIndex: 'points', align: 'right', width: 70 },
              { title: '操作员', dataIndex: 'operator', width: 80 },
              { title: '时间', dataIndex: 'createdAt', width: 130, render: (v: string) => fmtDateTime(v) },
              { title: '结论', dataIndex: 'pass', width: 70, render: (v: boolean) => <Tag color={v ? 'green' : 'red'} style={{ fontSize: 10 }}>{v ? '合格' : '需重标'}</Tag> },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  )
}

function FirstPerson({ markers }: { markers: number }) {
  return (
    <div style={{ position: 'relative', height: 400, background: 'linear-gradient(180deg, #0b1626 0%, #16243a 46%, #0d1726 100%)', overflow: 'hidden' }}>
      <svg viewBox="0 0 800 400" style={{ width: '100%', height: '100%' }}>
        <rect x="0" y="0" width="800" height="180" fill="#0e1c2e" />
        <g opacity="0.5">
          <rect x="60" y="110" width="180" height="70" fill="#132538" />
          <rect x="560" y="100" width="190" height="80" fill="#132538" />
          <rect x="300" y="120" width="120" height="60" fill="#102032" />
        </g>
        <path d="M0 180 L800 180 L800 400 L0 400 Z" fill="#0a1320" />
        {Array.from({ length: 14 }).map((_, i) => {
          const y = 180 + Math.pow(i / 13, 2) * 220
          return <line key={i} x1="0" y1={y} x2="800" y2={y} stroke="rgba(34,211,238,0.10)" strokeWidth="1" />
        })}
        {Array.from({ length: 13 }).map((_, i) => {
          const x = 400 + (i - 6) * 110
          return <line key={i} x1="400" y1="180" x2={x * 1.9 - 360} y2="400" stroke="rgba(34,211,238,0.10)" strokeWidth="1" />
        })}
        <rect x="250" y="230" width="90" height="120" fill="#1a2c42" stroke="rgba(148,163,184,0.3)" />
        <rect x="470" y="250" width="70" height="100" fill="#17283c" stroke="rgba(148,163,184,0.25)" />
        <text x="266" y="222" fontSize="9" fill="#5D6E8A">配电柜 P-03</text>

        {[
          { x: 180, y: 200, id: 'M-01' },
          { x: 620, y: 190, id: 'M-02' },
          { x: 120, y: 300, id: 'M-03' },
          { x: 690, y: 290, id: 'M-04' },
        ].map((m, i) => (
          <g key={m.id} opacity={i < markers ? 1 : 0.25}>
            <rect x={m.x - 22} y={m.y - 22} width="44" height="44" fill="none" stroke={i < markers ? '#22D3EE' : '#64748B'} strokeWidth="1.5" />
            <rect x={m.x - 14} y={m.y - 14} width="28" height="28" fill={i < markers ? 'rgba(34,211,238,0.2)' : 'transparent'} />
            <text x={m.x - 16} y={m.y - 28} fontSize="8.5" fill={i < markers ? '#22D3EE' : '#64748B'}>{m.id} {i < markers ? '已识别' : '未识别'}</text>
          </g>
        ))}

        <g opacity="0.7">
          <rect x="16" y="16" width="150" height="34" rx="4" fill="rgba(7,11,20,0.75)" stroke="rgba(148,163,184,0.25)" />
          <text x="26" y="32" fontSize="9" fill="#93A4BE">A-03 装配车间三</text>
          <text x="26" y="44" fontSize="8" fill="#5D6E8A">HoloLens 2 · 电量 72%</text>
        </g>
        <g opacity="0.7">
          <rect x="640" y="16" width="144" height="34" rx="4" fill="rgba(7,11,20,0.75)" stroke="rgba(148,163,184,0.25)" />
          <text x="650" y="32" fontSize="9" fill="#22D3EE">锚点已锁定</text>
          <text x="650" y="44" fontSize="8" fill="#5D6E8A">AN-007 · 误差 6 mm</text>
        </g>
        <line x1="400" y1="186" x2="400" y2="200" stroke="#22D3EE" strokeWidth="1" opacity="0.6" />
        <line x1="388" y1="193" x2="412" y2="193" stroke="#22D3EE" strokeWidth="1" opacity="0.6" />
        <text x="404" y="176" fontSize="8" fill="#5D6E8A">视线中心</text>
      </svg>
      <div style={{ position: 'absolute', left: 16, bottom: 12, fontSize: 10, color: 'rgba(147,164,190,0.75)' }}>
        模拟画面：非真实摄像头输入，仅用于演示标定流程
      </div>
    </div>
  )
}

export function Sessions() {
  const sessions = api.sessions.all().slice(0, 60)
  const [play, setPlay] = useState<(typeof sessions)[number] & { scene: string } | null>(null)
  const [t, setT] = useState(32)

  const rows = useMemo(() => sessions.map((s) => ({ ...s, scene: api.scenes.get(s.sceneId)?.name ?? '—' })), [sessions])

  return (
    <div>
      <PageHeader
        title="会话记录"
        desc="记录每次远程协同的参与者、时长、标注数量与录制文件，支持按时间回放标注轨迹。"
        extra={<Button icon={<CloudDownloadOutlined />} onClick={() => message.success('会话清单已导出（模拟）')}>导出</Button>}
      />

      <div className="grid grid-cols-4 gap-3" style={{ marginBottom: 12 }}>
        <MetricRow items={[
          { label: '会话总数', value: 327 },
          { label: '平均时长', value: '18:32' },
          { label: '录制会话', value: api.sessions.all().filter((s) => s.recorded).length, color: 'var(--brand)' },
          { label: '标注总数', value: api.sessions.all().reduce((s, x) => s + x.annotations, 0) },
        ]} />
      </div>

      <SectionCard padding={0} bodyStyle={{ padding: 0 }} title="最近会话" extra={<span style={{ fontSize: 11 }}>显示最近 60 条</span>}>
        <Table
          size="small"
          rowKey="id"
          dataSource={rows}
          pagination={{ pageSize: 10, size: 'small' }}
          columns={[
            { title: '会话号', dataIndex: 'id', width: 130, render: (v: string) => <span className="num" style={{ color: 'var(--brand)' }}>{v}</span> },
            { title: '场景', dataIndex: 'scene', ellipsis: true },
            { title: '发起人', dataIndex: 'host', width: 90 },
            { title: '参与人', dataIndex: 'guests', width: 180, render: (v: string[]) => <span style={{ fontSize: 11.5 }}>{v.join('、')}</span> },
            { title: '开始时间', dataIndex: 'startAt', width: 130, render: (v: string) => fmtDateTime(v) },
            { title: '时长', dataIndex: 'duration', width: 80, align: 'right', render: (v: number) => <span className="num">{fmtDuration(v)}</span> },
            { title: '标注', dataIndex: 'annotations', width: 60, align: 'right' },
            { title: '录制', dataIndex: 'recorded', width: 70, render: (v: boolean) => (v ? <Tag color="cyan" style={{ fontSize: 10 }}>有</Tag> : <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>—</span>) },
            { title: '', width: 70, render: (_, r) => <a style={{ fontSize: 11.5 }} onClick={() => { setPlay(r); setT(20) }}>回放</a> },
          ]}
        />
      </SectionCard>

      <Drawer title="会话回放" open={!!play} width={720} onClose={() => setPlay(null)}>
        {play && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{play.scene}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 5 }}>{play.id} · {fmtDateTime(play.startAt)} · {fmtDuration(play.duration)} · 标注 {play.annotations} 个</div>
            <div style={{ position: 'relative', height: 360, marginTop: 16, borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(180deg,#0b1626,#16243a 46%,#0d1726)' }}>
              <FirstPerson markers={4} />
              {t > 20 && (
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 800 400">
                  <path d="M260 240 L330 210" stroke="#FBBF24" strokeWidth="2" markerEnd="url(#arr2)" />
                  <defs>
                    <marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                      <path d="M0 0 L8 4 L0 8" fill="#FBBF24" />
                    </marker>
                  </defs>
                  <text x="336" y="208" fontSize="11" fill="#FBBF24">此处压板松动</text>
                </svg>
              )}
            </div>
            <div style={{ marginTop: 14 }}>
              <Progress percent={Math.round((t / 290) * 100)} showInfo={false} strokeColor="#22D3EE" />
              <div className="flex items-center justify-between" style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                <span className="num">{fmtDuration(t)}</span>
                <span>拖动下方滑块模拟回放进度</span>
                <span className="num">{fmtDuration(290)}</span>
              </div>
              <input type="range" min={0} max={290} value={t} onChange={(e) => setT(Number(e.target.value))} style={{ width: '100%', marginTop: 8, accentColor: '#22D3EE' }} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
