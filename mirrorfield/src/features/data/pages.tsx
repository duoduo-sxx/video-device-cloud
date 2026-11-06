import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button, Drawer, Form, Input, InputNumber, Select, Table, Tabs, Tag, Upload, message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ArrowLeftOutlined, CloudUploadOutlined, DownloadOutlined,
  FileTextOutlined, PlusOutlined, ReloadOutlined,
} from '@ant-design/icons'
import { PageHeader, SectionCard, StatusTag, Field, MetricRow, EmptyState } from '@/components/ui'
import EChart from '@/components/charts/EChart'
import { api } from '@/services'
import { QUALITY, TASK_STATUS, TASK_TYPE, fmtDate, fmtDateTime, fmtNum, downloadText, toCsv } from '@/utils'
import type { CollectTask } from '@/types'

export function Tasks() {
  const nav = useNavigate()
  const [kw, setKw] = useState('')
  const [status, setStatus] = useState<string>()
  const [type, setType] = useState<string>()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [tick, setTick] = useState(0)

  const data = useMemo(() => api.tasks.list({ kw, status, type, page, pageSize: 12 }), [kw, status, type, page, tick])

  const columns: ColumnsType<CollectTask> = [
    {
      title: '任务编号', dataIndex: 'id', width: 118, fixed: 'left',
      render: (v: string) => <span className="num" style={{ color: 'var(--brand)' }}>{v}</span>,
    },
    { title: '任务名称', dataIndex: 'name', ellipsis: true },
    { title: '类型', dataIndex: 'type', width: 132, render: (v: string) => <span style={{ fontSize: 12 }}>{TASK_TYPE[v]}</span> },
    { title: '采集区域', dataIndex: 'area', width: 180, ellipsis: true },
    { title: '计划日期', dataIndex: 'plannedStart', width: 100, render: (v: string) => fmtDate(v) },
    { title: '数据量', dataIndex: 'dataSize', width: 82, align: 'right' },
    { title: '质检', dataIndex: 'quality', width: 74, render: (v: string) => <StatusTag map={QUALITY} value={v} /> },
    { title: '状态', dataIndex: 'status', width: 88, render: (v: string) => <StatusTag map={TASK_STATUS} value={v} /> },
    { title: '负责人', dataIndex: 'owner', width: 76 },
  ]

  return (
    <div>
      <PageHeader
        title="采集任务"
        desc="统一管理无人机倾斜摄影、地面站扫描、手持 SLAM 与全景拍摄任务。任务成果经质检后进入三维复刻流程。"
        extra={
          <>
            <Button icon={<DownloadOutlined />} onClick={() => downloadText('采集任务.csv', toCsv(data.list.map((t) => ({ 编号: t.id, 名称: t.name, 类型: TASK_TYPE[t.type], 区域: t.area, 数据量: t.dataSize, 状态: TASK_STATUS[t.status].label, 负责人: t.owner }))))}>
              导出
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建采集任务</Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3" style={{ marginBottom: 12 }}>
        <MetricRow
          items={[
            { label: '任务总数', value: api.tasks.all().length },
            { label: '进行中', value: api.tasks.all().filter((t) => t.status === 'RUNNING' || t.status === 'PROCESSING').length, color: 'var(--brand)' },
            { label: '质检不合格', value: api.tasks.all().filter((t) => t.quality === 'FAIL').length, color: 'var(--danger)' },
            { label: '累计数据量', value: '3.42 TB' },
          ]}
        />
      </div>

      <SectionCard
        padding={0}
        bodyStyle={{ padding: 0 }}
        title={
          <div className="flex items-center gap-2" style={{ fontWeight: 400 }}>
            <Input.Search placeholder="搜索任务名称、编号、区域" allowClear style={{ width: 240 }} size="small" onSearch={setKw} onChange={(e) => !e.target.value && setKw('')} />
            <Select size="small" placeholder="全部状态" allowClear style={{ width: 120 }} onChange={setStatus} options={Object.entries(TASK_STATUS).map(([v, x]) => ({ value: v, label: x.label }))} />
            <Select size="small" placeholder="全部类型" allowClear style={{ width: 150 }} onChange={setType} options={Object.entries(TASK_TYPE).map(([v, l]) => ({ value: v, label: l }))} />
            <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>共 {data.total} 条</span>
          </div>
        }
        extra={<Button size="small" type="text" icon={<ReloadOutlined />} onClick={() => setTick((t) => t + 1)} />}
      >
        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={data.list}
          scroll={{ x: 1080 }}
          onRow={(r) => ({ onClick: () => nav(`/data/tasks/${r.id}`), style: { cursor: 'pointer' } })}
          pagination={{ current: page, pageSize: 12, total: data.total, onChange: setPage, showSizeChanger: false, size: 'small' }}
        />
      </SectionCard>

      <Drawer
        title="新建采集任务"
        open={open}
        width={620}
        onClose={() => setOpen(false)}
        extra={<Button type="primary" onClick={() => form.submit()}>创建任务</Button>}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: 'UAV_OBLIQUE', area: 'A 区 智能装配 · A-01 装配车间一', deviceId: 'DEV-UAV-001', pilot: '李强', altitude: 120, gsd: 1.5, forward: 80, side: 70 }}
          onFinish={(v) => {
            api.tasks.create({
              name: v.name,
              type: v.type,
              area: v.area,
              deviceId: v.deviceId,
              pilot: v.pilot,
              remark: v.remark,
              params: { altitude: v.altitude, gsd: v.gsd, forwardOverlap: v.forward, sideOverlap: v.side, photos: 0 },
            })
            message.success('采集任务已创建，已通知作业组')
            setOpen(false)
            form.resetFields()
            setTick((t) => t + 1)
          }}
        >
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请填写任务名称' }]}>
            <Input placeholder="如：A 区屋面倾斜摄影补拍" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="type" label="采集类型" rules={[{ required: true }]}>
              <Select options={Object.entries(TASK_TYPE).map(([v, l]) => ({ value: v, label: l }))} />
            </Form.Item>
            <Form.Item name="area" label="采集区域" rules={[{ required: true }]}>
              <Select options={['A 区 智能装配 · A-01 装配车间一', 'A 区 智能装配 · A-03 装配车间三', 'B 区 精密加工 · B-02 精密加工中心二', 'D 区 综合动力 · D-01 综合动力站', 'E 区 220kV 变电站', 'F 区 物流仓储 · F-01 物流仓储一', 'G 滨江码头', 'H 文保建筑 · 滨江纺织厂旧址'].map((x) => ({ value: x, label: x }))} />
            </Form.Item>
            <Form.Item name="deviceId" label="使用设备">
              <Select options={['DEV-UAV-001 大疆 M350 RTK', 'DEV-UAV-003 大疆 M350 RTK', 'DEV-SCN-001 FARO Focus Premium', 'DEV-SCN-002 徕卡 RTC360', 'DEV-SLM-001 LiGrip H120', 'DEV-PANO-001 Insta360 Pro 2'].map((x) => ({ value: x.split(' ')[0], label: x }))} />
            </Form.Item>
            <Form.Item name="pilot" label="作业负责人">
              <Select options={['李强', '吴磊', '谢涛', '徐斌'].map((x) => ({ value: x, label: x }))} />
            </Form.Item>
            <Form.Item name="altitude" label="航高（m）">
              <InputNumber min={50} max={300} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="gsd" label="GSD（cm/px）">
              <InputNumber min={0.5} max={5} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="forward" label="航向重叠度（%）">
              <InputNumber min={60} max={90} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="side" label="旁向重叠度（%）">
              <InputNumber min={60} max={90} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="作业条件、协调事项、空域申请编号等" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export function TaskDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const task = api.tasks.get(id ?? '')
  if (!task) return <EmptyState text="任务不存在或已被删除" action={<Button onClick={() => nav('/data/tasks')}>返回列表</Button>} />

  const checkPoints = Array.from({ length: 24 }, (_, i) => ({
    id: `CP${String(i + 1).padStart(3, '0')}`,
    dx: Number((Math.sin(i * 1.7) * 2.2).toFixed(1)),
    dy: Number((Math.cos(i * 2.1) * 2.4).toFixed(1)),
    dz: Number((Math.sin(i * 0.9 + 1) * 3.1).toFixed(1)),
  }))
  const exceeds = checkPoints.filter((p) => Math.abs(p.dx) > 3 || Math.abs(p.dz) > 5).length

  return (
    <div>
      <PageHeader
        title={task.name}
        desc={`${task.id} · ${TASK_TYPE[task.type]} · ${task.area} · 负责人 ${task.owner}`}
        tags={<StatusTag map={TASK_STATUS} value={task.status} />}
        extra={
          <>
            <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/data/tasks')}>返回</Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={() => message.success('任务包已开始下载（模拟）')}>下载成果包</Button>
          </>
        }
      />

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview', label: '概览',
            children: (
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-7">
                  <SectionCard title="航线与作业范围" extra={<span style={{ fontSize: 11 }}>比例尺 1:2000 · 上北</span>} padding={10}>
                    <FlightMap />
                  </SectionCard>
                </div>
                <div className="col-span-5">
                  <SectionCard title="采集参数">
                    <div className="grid grid-cols-2 gap-x-4">
                      <Field label="采集类型">{TASK_TYPE[task.type]}</Field>
                      <Field label="采集区域">{task.area}</Field>
                      <Field label="设备编号">{task.deviceId}</Field>
                      <Field label="作业负责人">{task.pilot}</Field>
                      <Field label="计划开始">{fmtDateTime(task.plannedStart)}</Field>
                      <Field label="计划结束">{fmtDateTime(task.plannedEnd)}</Field>
                      <Field label="实际完成">{task.actualEnd ? fmtDateTime(task.actualEnd) : '—'}</Field>
                      <Field label="数据量">{task.dataSize}</Field>
                      {task.params.altitude && <Field label="航高">{task.params.altitude} m</Field>}
                      {task.params.gsd && <Field label="GSD">{task.params.gsd} cm/px</Field>}
                      {task.params.forwardOverlap && <Field label="重叠度">{task.params.forwardOverlap}% / {task.params.sideOverlap}%</Field>}
                      {task.params.photos !== undefined && <Field label="影像数">{fmtNum(task.params.photos)} 张</Field>}
                    </div>
                    <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.18)', fontSize: 12, lineHeight: 1.7 }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>天气与空域：</span>晴，22℃，东南风 3 级，能见度 12 km；空域申请 A-2026-1014 已批准，有效期至 2026-10-20。
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>作业备注：</span>{task.remark || '无'}
                    </div>
                  </SectionCard>
                </div>
              </div>
            ),
          },
          {
            key: 'result', label: '成果',
            children: (
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                  <SectionCard title="成果文件" extra={<span style={{ fontSize: 11 }}>{task.dataSize}</span>} padding={0} bodyStyle={{ padding: 0 }}>
                    <Table
                      size="small"
                      pagination={false}
                      rowKey="name"
                      dataSource={[
                        { name: '原始影像 / IMG_0001-1284', type: 'JPG', size: '62.4 GB', check: '已校验' },
                        { name: 'POS 数据 / pos.csv', type: 'CSV', size: '186 KB', check: '已校验' },
                        { name: '空三报告 / AT_report.pdf', type: 'PDF', size: '12.8 MB', check: '已校验' },
                        { name: '密集点云 / dense.las', type: 'LAS', size: '18.2 GB', check: '已校验' },
                        { name: '模型切片 / osgb/Level_18', type: 'OSGB', size: '5.6 GB', check: '待校验' },
                      ]}
                      columns={[
                        { title: '文件', dataIndex: 'name', render: (v: string) => <span style={{ fontSize: 12 }}><FileTextOutlined style={{ color: 'var(--text-tertiary)', marginRight: 8 }} />{v}</span> },
                        { title: '格式', dataIndex: 'type', width: 80, render: (v: string) => <Tag style={{ fontSize: 10.5 }}>{v}</Tag> },
                        { title: '大小', dataIndex: 'size', width: 100, align: 'right' },
                        { title: '校验', dataIndex: 'check', width: 90, render: (v: string) => <span style={{ color: v === '已校验' ? 'var(--ok)' : 'var(--warn)', fontSize: 12 }}>{v}</span> },
                      ]}
                    />
                  </SectionCard>
                </div>
                <div className="col-span-4">
                  <SectionCard title="上传成果">
                    <Upload.Dragger
                      multiple
                      beforeUpload={() => false}
                      onChange={() => message.success('文件已加入上传队列（模拟）')}
                      style={{ background: 'rgba(148,163,184,0.03)', borderColor: 'var(--border-strong)' }}
                    >
                      <p style={{ fontSize: 26, color: 'var(--brand)', margin: '6px 0' }}><CloudUploadOutlined /></p>
                      <p style={{ fontSize: 12.5 }}>拖拽文件到此处上传</p>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>支持 LAS / OSGB / JPG / CSV，单文件 ≤ 20 GB</p>
                    </Upload.Dragger>
                  </SectionCard>
                </div>
              </div>
            ),
          },
          {
            key: 'quality', label: '质检',
            children: (
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-7">
                  <SectionCard title="检查点残差（共 128 点，显示前 24 点）" extra={<Tag color={exceeds ? 'red' : 'green'}>{exceeds ? `${exceeds} 点超限` : '全部合格'}</Tag>} padding={0} bodyStyle={{ padding: 0 }}>
                    <Table
                      size="small"
                      pagination={false}
                      rowKey="id"
                      dataSource={checkPoints}
                      columns={[
                        { title: '点号', dataIndex: 'id', width: 90 },
                        { title: 'ΔX (cm)', dataIndex: 'dx', align: 'right', render: (v: number) => <span style={{ color: Math.abs(v) > 3 ? 'var(--danger)' : undefined }}>{v}</span> },
                        { title: 'ΔY (cm)', dataIndex: 'dy', align: 'right', render: (v: number) => <span style={{ color: Math.abs(v) > 3 ? 'var(--danger)' : undefined }}>{v}</span> },
                        { title: 'ΔZ (cm)', dataIndex: 'dz', align: 'right', render: (v: number) => <span style={{ color: Math.abs(v) > 5 ? 'var(--danger)' : undefined }}>{v}</span> },
                        { title: '结论', width: 80, render: (_: unknown, r) => (Math.abs(r.dx) > 3 || Math.abs(r.dz) > 5 ? <Tag color="red" style={{ fontSize: 10.5 }}>超限</Tag> : <Tag color="green" style={{ fontSize: 10.5 }}>合格</Tag>) },
                      ]}
                    />
                  </SectionCard>
                </div>
                <div className="col-span-5">
                  <SectionCard title="覆盖率热力">
                    <CoverageMap />
                    <div className="flex items-center gap-4" style={{ marginTop: 12, fontSize: 11, color: 'var(--text-tertiary)' }}>
                      <span><span style={{ color: 'var(--ok)' }}>■</span> &gt; 95%</span>
                      <span><span style={{ color: 'var(--warn)' }}>■</span> 85% ~ 95%</span>
                      <span><span style={{ color: 'var(--danger)' }}>■</span> &lt; 85%（3 处）</span>
                    </div>
                  </SectionCard>
                  <div style={{ marginTop: 12 }}>
                    <SectionCard title="精度结论">
                      <MetricRow items={[
                        { label: '平面中误差', value: '2.4 cm', color: 'var(--ok)' },
                        { label: '高程中误差', value: '3.1 cm', color: 'var(--ok)' },
                        { label: '粗差率', value: '0.00%' },
                        { label: '结论', value: '合格', color: 'var(--ok)' },
                      ]} />
                    </SectionCard>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'log', label: '日志',
            children: (
              <SectionCard title="任务时间线">
                <div style={{ paddingLeft: 8 }}>
                  {[
                    ['2026-10-14 08:12', '创建任务', '张伟 指派采集任务，设备 DEV-UAV-003 已锁定'],
                    ['2026-10-14 08:31', '设备起飞', '起飞点 A 区北侧空地，航高 120 m，5 个架次'],
                    ['2026-10-14 11:42', '作业完成', '实际飞行 3 小时 11 分，拍摄 1284 张，含补拍'],
                    ['2026-10-14 12:05', '数据回传', '回传 86.4 GB，校验通过'],
                    ['2026-10-14 15:20', '质检发起', '抽样 128 个检查点，检查点残差中误差 2.4 cm'],
                    ['2026-10-15 09:06', '质检通过', '除 3 处屋面纹理缺失外，整体合格'],
                  ].map(([t, a, d], i, arr) => (
                    <div key={t} className="flex gap-3" style={{ paddingBottom: i === arr.length - 1 ? 0 : 18 }}>
                      <div style={{ width: 130, fontSize: 11.5, color: 'var(--text-tertiary)', flexShrink: 0 }} className="num">{t}</div>
                      <div style={{ width: 9, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 4, background: 'var(--brand)', marginTop: 4 }} />
                        {i !== arr.length - 1 && <span style={{ flex: 1, width: 1, background: 'var(--border-strong)', marginTop: 4 }} />}
                      </div>
                      <div style={{ fontSize: 12.5 }}>
                        <div style={{ fontWeight: 500 }}>{a}</div>
                        <div style={{ color: 'var(--text-secondary)', marginTop: 3 }}>{d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ),
          },
        ]}
      />
    </div>
  )
}

function FlightMap() {
  const pts = Array.from({ length: 14 }, (_, i) => {
    const row = Math.floor(i / 7)
    const col = i % 7
    const x = 60 + col * 68
    const y = 90 + row * 110
    return { x, y: row % 2 === 0 ? y : y + 60 }
  })
  return (
    <svg viewBox="0 0 560 300" style={{ width: '100%', height: 300, background: 'rgba(7,11,20,0.5)', borderRadius: 8 }}>
      <defs>
        <pattern id="gridp" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="560" height="300" fill="url(#gridp)" />
      <path d="M60 40 L500 40 L520 120 L500 260 L60 260 Z" fill="rgba(34,211,238,0.06)" stroke="#22D3EE" strokeWidth="1.2" strokeDasharray="4 3" />
      <path d="M110 100 L190 60 L300 70 L400 120 L440 200 L330 240 L200 230 L120 180 Z" fill="rgba(99,102,241,0.14)" stroke="#6366F1" strokeWidth="1" />
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#22D3EE" strokeWidth="1.1" opacity="0.9" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#070B14" stroke="#22D3EE" strokeWidth="1.4" />
          <text x={p.x + 7} y={p.y + 4} fontSize="9" fill="#5D6E8A">{i + 1}</text>
        </g>
      ))}
      <g transform="translate(500,80)">
        <circle r="15" fill="rgba(7,11,20,0.8)" stroke="rgba(148,163,184,0.3)" />
        <path d="M0 -9 L4 6 L0 3 L-4 6 Z" fill="#22D3EE" />
        <text y="26" fontSize="9" fill="#93A4BE" textAnchor="middle">N</text>
      </g>
      <g transform="translate(60,278)">
        <line x1="0" y1="0" x2="70" y2="0" stroke="#93A4BE" strokeWidth="1.5" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="#93A4BE" />
        <line x1="70" y1="-4" x2="70" y2="4" stroke="#93A4BE" />
        <text x="35" y="-5" fontSize="9" fill="#93A4BE" textAnchor="middle">100 m</text>
      </g>
      <text x="72" y="72" fontSize="10" fill="#93A4BE">A-03 装配车间三</text>
    </svg>
  )
}

function CoverageMap() {
  const cells = Array.from({ length: 120 }, (_, i) => {
    const v = i === 27 || i === 63 || i === 88 ? 78 : 86 + ((i * 13) % 14)
    return v
  })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: 3 }}>
      {cells.map((v, i) => (
        <div
          key={i}
          title={`覆盖 ${v}%`}
          style={{
            aspectRatio: '1',
            borderRadius: 2,
            background: v < 85 ? 'rgba(248,113,113,0.75)' : v < 95 ? 'rgba(251,191,36,0.7)' : 'rgba(52,211,153,0.55)',
          }}
        />
      ))}
    </div>
  )
}

export function Datasets() {
  const nav = useNavigate()
  const all = api.datasetsAll()
  const [active, setActive] = useState('全部')
  const cats = ['全部', '实景模型', '点云', 'BIM', '全景', '矢量']
  const list = active === '全部' ? all : all.filter((d) => d.type === active)

  return (
    <div>
      <PageHeader
        title="数据集管理"
        desc="按项目、数据类型、批次管理原始与成果数据，记录坐标系、精度、血缘关系与共享范围。"
        extra={<Button icon={<DownloadOutlined />} onClick={() => message.success('数据集清单已导出（模拟）')}>导出清单</Button>}
      />
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-3">
          <SectionCard title="数据类型" bodyStyle={{ padding: 8 }}>
            {cats.map((c) => (
              <div
                key={c}
                onClick={() => setActive(c)}
                style={{
                  padding: '9px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5,
                  background: active === c ? 'rgba(34,211,238,0.12)' : 'transparent',
                  color: active === c ? 'var(--brand)' : 'var(--text-secondary)',
                  display: 'flex', justifyContent: 'space-between',
                }}
              >
                <span>{c}</span>
                <span className="num" style={{ fontSize: 11, opacity: 0.7 }}>
                  {c === '全部' ? all.length : all.filter((d) => d.type === c).length}
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '0 10px 6px' }}>按项目</div>
              {api.projectsAll().slice(0, 4).map((p) => (
                <div key={p.id} style={{ padding: '7px 10px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {p.name.slice(0, 14)}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
        <div className="col-span-9">
          <div className="grid grid-cols-3 gap-3">
            {list.slice(0, 12).map((d) => (
              <div key={d.id} className="card card-hover" style={{ padding: 14 }}>
                <div className="flex items-center justify-between">
                  <Tag color="cyan" style={{ fontSize: 10.5 }}>{d.format}</Tag>
                  <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{d.scope}</span>
                </div>
                <div style={{ fontSize: 12.8, marginTop: 10, lineHeight: 1.5, height: 38, overflow: 'hidden' }}>{d.name}</div>
                <div className="flex items-center justify-between" style={{ marginTop: 10, fontSize: 11, color: 'var(--text-tertiary)' }}>
                  <span className="num">{d.size}</span>
                  <span className="num">{d.count}</span>
                </div>
                <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 9, fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                  {d.crs.split('/')[0]} · 更新 {fmtDate(d.updatedAt)}
                </div>
                <div className="flex gap-2" style={{ marginTop: 10 }}>
                  <Button size="small" type="primary" ghost block onClick={() => nav('/recon/viewer')}>预览</Button>
                  <Button size="small" block onClick={() => message.success(`开始下载 ${d.name}（模拟）`)}>下载</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Quality() {
  const points = Array.from({ length: 128 }, (_, i) => [
    Number((Math.sin(i * 1.3) * 2.6 + (i % 7 === 0 ? 2.2 : 0)).toFixed(2)),
    Number((Math.cos(i * 0.7) * 2.4).toFixed(2)),
  ])
  const batches = [
    { id: 'B-2026-08', name: 'A 区三栋车间', points: 168, plane: 2.1, height: 2.8, over: 0, result: '合格' },
    { id: 'B-2026-09', name: 'B 区精密加工', points: 128, plane: 2.4, height: 3.1, over: 0, result: '合格' },
    { id: 'B-2026-10', name: 'D 区动力站及储罐', points: 96, plane: 3.6, height: 4.8, over: 3, result: '整改后合格' },
    { id: 'B-2026-11', name: 'F 区物流仓储', points: 112, plane: 2.8, height: 3.4, over: 1, result: '合格' },
    { id: 'B-2026-12', name: 'H 区文保建筑', points: 84, plane: 1.6, height: 2.2, over: 0, result: '合格' },
    { id: 'B-2026-13', name: 'G 码头岸线', points: 76, plane: 3.9, height: 5.6, over: 4, result: '不合格' },
  ]

  return (
    <div>
      <PageHeader title="质量与精度" desc="以检查点残差、覆盖率与超限点占比评估三维复刻成果精度，超限批次自动触发复检。" />
      <MetricRow items={[
        { label: '检查点总数', value: '128' },
        { label: '平面中误差', value: '2.4 cm', color: 'var(--ok)' },
        { label: '高程中误差', value: '3.1 cm', color: 'var(--ok)' },
        { label: '粗差率', value: '0.00%' },
      ]} />

      <div className="grid grid-cols-12 gap-3" style={{ marginTop: 12 }}>
        <div className="col-span-7">
          <SectionCard title="检查点残差分布" extra={<span style={{ fontSize: 11 }}>阈值 ±3 cm</span>}>
            <EChart
              height={300}
              option={{
                grid: { top: 20, right: 20, bottom: 40, left: 46 },
                tooltip: { trigger: 'item' },
                xAxis: { type: 'value', name: 'ΔX (cm)', min: -8, max: 8, nameTextStyle: { fontSize: 10 }, nameLocation: 'middle', nameGap: 24 },
                yAxis: { type: 'value', name: 'ΔY (cm)', min: -8, max: 8, nameTextStyle: { fontSize: 10 } },
                series: [
                  { type: 'scatter', symbolSize: 7, data: points, itemStyle: { opacity: 0.75 } },
                  {
                    type: 'scatter', symbol: 'circle', silent: true,
                    data: [[0, 0]], symbolSize: 300,
                    itemStyle: { color: 'rgba(34,211,238,0.06)', borderColor: 'rgba(34,211,238,0.35)', borderWidth: 1 },
                  },
                ],
              }}
            />
          </SectionCard>
        </div>
        <div className="col-span-5">
          <SectionCard title="精度趋势（近 8 批次）">
            <EChart
              height={300}
              option={{
                grid: { top: 24, right: 20, bottom: 30, left: 42 },
                tooltip: { trigger: 'axis' },
                legend: { top: 0, right: 0 },
                xAxis: { type: 'category', data: ['B-06', 'B-07', 'B-08', 'B-09', 'B-10', 'B-11', 'B-12', 'B-13'] },
                yAxis: { type: 'value', name: 'cm', nameTextStyle: { fontSize: 10 } },
                series: [
                  { name: '平面中误差', type: 'line', smooth: true, data: [2.8, 2.6, 2.1, 2.4, 3.6, 2.8, 1.6, 3.9], symbolSize: 5 },
                  { name: '高程中误差', type: 'line', smooth: true, data: [3.4, 3.2, 2.8, 3.1, 4.8, 3.4, 2.2, 5.6], symbolSize: 5 },
                  {
                    name: '阈值', type: 'line', data: [5, 5, 5, 5, 5, 5, 5, 5], symbol: 'none',
                    lineStyle: { type: 'dashed', width: 1, color: '#F87171' }, itemStyle: { color: '#F87171' },
                  },
                ],
              }}
            />
          </SectionCard>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <SectionCard title="批次质检结论" padding={0} bodyStyle={{ padding: 0 }}>
          <Table
            size="middle"
            rowKey="id"
            pagination={false}
            dataSource={batches}
            columns={[
              { title: '批次', dataIndex: 'id', width: 110, render: (v: string) => <span className="num" style={{ color: 'var(--brand)' }}>{v}</span> },
              { title: '范围', dataIndex: 'name' },
              { title: '检查点', dataIndex: 'points', align: 'right', width: 90 },
              { title: '平面中误差', dataIndex: 'plane', align: 'right', width: 110, render: (v: number) => <span style={{ color: v > 3 ? 'var(--danger)' : 'var(--ok)' }}>{v} cm</span> },
              { title: '高程中误差', dataIndex: 'height', align: 'right', width: 110, render: (v: number) => <span style={{ color: v > 5 ? 'var(--danger)' : 'var(--ok)' }}>{v} cm</span> },
              { title: '超限点', dataIndex: 'over', align: 'right', width: 80, render: (v: number) => <span style={{ color: v ? 'var(--danger)' : 'var(--text-secondary)' }}>{v}</span> },
              { title: '结论', dataIndex: 'result', width: 110, render: (v: string) => <Tag color={v === '合格' ? 'green' : v === '不合格' ? 'red' : 'gold'} style={{ fontSize: 10.5 }}>{v}</Tag> },
              { title: '操作', width: 100, render: () => <a style={{ fontSize: 12 }}>查看报告</a> },
            ]}
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-3 gap-3" style={{ marginTop: 12 }}>
        {[
          { t: '复检任务', v: 3, d: 'B-2026-13 码头岸线高程超限 4 点，已排复检', c: 'var(--danger)' },
          { t: '待审核批次', v: 2, d: 'B-2026-14 与 B-2026-15 等待质量部审核', c: 'var(--warn)' },
          { t: '本月合格率', v: '94.2%', d: '较上月提升 1.8 个百分点', c: 'var(--ok)' },
        ].map((x) => (
          <SectionCard key={x.t}>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{x.t}</div>
            <div className="num" style={{ fontSize: 24, fontWeight: 600, color: x.c, marginTop: 6 }}>{x.v}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.6 }}>{x.d}</div>
          </SectionCard>
        ))}
      </div>
    </div>
  )
}

export default { Tasks, TaskDetail, Datasets, Quality }
