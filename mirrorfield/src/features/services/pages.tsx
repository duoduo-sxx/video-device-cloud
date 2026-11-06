import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Drawer, Input, Progress, Select, Table, Tag, message } from 'antd'
import {
  ArrowLeftOutlined, BookOutlined, CalculatorOutlined, CheckCircleOutlined, CloudDownloadOutlined,
  FileDoneOutlined, FileProtectOutlined, FileTextOutlined, PlusOutlined, ScanOutlined,
  ToolOutlined, VideoCameraOutlined,
} from '@ant-design/icons'
import { EmptyState, Field, MetricRow, PageHeader, SectionCard, StatusTag } from '@/components/ui'
import { api } from '@/services'
import { ORDER_STATUS, fmtDate, fmtDateTime, fmtMoney } from '@/utils'
import type { ServiceItem } from '@/types'

const ICONS: Record<string, React.ReactNode> = {
  'SVC-MESH': <ScanOutlined />,
  'SVC-SCAN': <CalculatorOutlined />,
  'SVC-BIM': <FileProtectOutlined />,
  'SVC-MR': <VideoCameraOutlined />,
  'SVC-OPT': <ToolOutlined />,
  'SVC-OPS': <ToolOutlined />,
}

export function Catalog() {
  const [detail, setDetail] = useState<ServiceItem | null>(null)
  const catalog = api.serviceItemsAll()

  return (
    <div>
      <PageHeader
        title="服务目录"
        desc="面向园区的三维复刻技术服务清单，含单价、工期与交付标准。可发起订单，进入交付与验收流程。"
        extra={<Button icon={<FileTextOutlined />} onClick={() => message.success('服务手册已下载（模拟）')}>服务手册</Button>}
      />

      <div className="grid grid-cols-3 gap-3">
        {catalog.map((s) => (
          <div key={s.code} className="card card-hover" style={{ padding: 18, cursor: 'pointer' }} onClick={() => setDetail(s)}>
            <div className="flex items-start justify-between">
              <span style={{ fontSize: 22, color: 'var(--brand)' }}>{ICONS[s.code]}</span>
              <Tag style={{ fontSize: 10 }}>{s.code}</Tag>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 500, marginTop: 12 }}>{s.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.75, marginTop: 8, height: 60, overflow: 'hidden' }}>{s.desc}</div>
            <div className="flex items-end gap-1.5" style={{ marginTop: 8 }}>
              <span className="num" style={{ fontSize: 20, fontWeight: 600, color: 'var(--brand)' }}>{fmtMoney(s.price)}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', paddingBottom: 2 }}>/ {s.unit}</span>
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-tertiary)' }}>
              <span>工期 {s.duration}</span>
              <span style={{ color: 'var(--brand)' }}>查看详情 →</span>
            </div>
          </div>
        ))}
      </div>

      <Drawer title="服务详情" open={!!detail} width={520} onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <div style={{ fontSize: 22, color: 'var(--brand)' }}>{ICONS[detail.code]}</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 10 }}>{detail.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 }}>{detail.code} · 工期 {detail.duration}</div>
            <div style={{ marginTop: 16, fontSize: 12.5, lineHeight: 1.9, color: 'var(--text-secondary)' }}>{detail.desc}</div>

            <div className="grid grid-cols-2 gap-x-4" style={{ marginTop: 16 }}>
              <Field label="单价">{fmtMoney(detail.price)} / {detail.unit}</Field>
              <Field label="工期">{detail.duration}</Field>
              <Field label="交付标准" width={420}>{detail.standard}</Field>
            </div>

            <div style={{ marginTop: 18, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>交付物清单</div>
            {detail.deliverables.map((d) => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <CheckCircleOutlined style={{ color: 'var(--ok)', fontSize: 12 }} /> {d}
              </div>
            ))}

            <div style={{ marginTop: 18, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>历史案例</div>
            {['滨江智能制造园区一期（2.6 km²）', '江北物流园实景三维（1.4 km²）', '城东污水处理厂数字孪生（0.9 km²）'].map((c) => (
              <div key={c} style={{ fontSize: 11.5, color: 'var(--text-secondary)', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>{c}</div>
            ))}

            <Button type="primary" block style={{ marginTop: 20 }} onClick={() => message.success('已加入订单草稿，可在服务订单中确认')}>加入订单</Button>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export function Orders() {
  const nav = useNavigate()
  const [status, setStatus] = useState<string>()
  const orders = api.orders.all()
  const filtered = status ? orders.filter((o) => o.status === status) : orders
  const total = orders.reduce((s, o) => s + o.amount, 0)

  return (
    <div>
      <PageHeader
        title="服务订单"
        desc="管理三维复刻技术服务的合同、里程碑、回款与交付节点。逾期节点在总览驾驶舱同步告警。"
        extra={
          <>
            <Select size="small" placeholder="全部状态" allowClear style={{ width: 130 }} onChange={setStatus} options={Object.entries(ORDER_STATUS).map(([v, x]) => ({ value: v, label: x.label }))} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => message.success('已创建订单草稿')}>新建订单</Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3" style={{ marginBottom: 12 }}>
        <MetricRow items={[
          { label: '订单总数', value: orders.length },
          { label: '执行中', value: orders.filter((o) => o.status === 'RUNNING' || o.status === 'DELIVERING').length, color: 'var(--brand)' },
          { label: '已交付', value: orders.filter((o) => o.status === 'DONE').length, color: 'var(--ok)' },
          { label: '合同总额', value: fmtMoney(total) },
        ]} />
      </div>

      <SectionCard padding={0} bodyStyle={{ padding: 0 }} title="订单列表" extra={<span style={{ fontSize: 11 }}>{filtered.length} 条</span>}>
        <Table
          size="middle"
          rowKey="id"
          dataSource={filtered}
          pagination={{ pageSize: 10, size: 'small' }}
          onRow={(r) => ({ onClick: () => nav(`/service/orders/${r.id}`), style: { cursor: 'pointer' } })}
          columns={[
            { title: '订单号', dataIndex: 'id', width: 116, render: (v: string) => <span className="num" style={{ color: 'var(--brand)' }}>{v}</span> },
            { title: '客户', dataIndex: 'client', ellipsis: true },
            { title: '服务项', width: 100, render: (_, r) => <span style={{ fontSize: 11.5 }}>{r.items.length} 项</span> },
            { title: '合同额', dataIndex: 'amount', width: 120, align: 'right', render: (v: number) => <span className="num">{fmtMoney(v)}</span> },
            { title: '签约', dataIndex: 'signDate', width: 104 },
            { title: '交付', dataIndex: 'deliveryDate', width: 104, render: (v: string, r) => <span style={{ color: (r as { late?: boolean }).late ? 'var(--danger)' : undefined }}>{v}</span> },
            { title: '进度', dataIndex: 'progress', width: 120, render: (v: number) => <Progress percent={v} size="small" showInfo={false} strokeColor={v === 100 ? '#34D399' : '#22D3EE'} trailColor="rgba(148,163,184,0.15)" /> },
            { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <StatusTag map={ORDER_STATUS} value={v} /> },
            { title: '负责人', dataIndex: 'manager', width: 76 },
          ]}
        />
      </SectionCard>
    </div>
  )
}

export function OrderDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const order = api.orders.get(id ?? '')
  if (!order) return <EmptyState text="订单不存在" action={<Button onClick={() => nav('/service/orders')}>返回</Button>} />
  const deliverables = api.orders.deliverables(order.id)
  const late = (order as { late?: boolean }).late

  return (
    <div>
      <PageHeader
        title={order.client}
        desc={`${order.id} · 签约 ${order.signDate} · 交付 ${order.deliveryDate}${late ? '（逾期 5 天）' : ''} · 负责人 ${order.manager}`}
        tags={<StatusTag map={ORDER_STATUS} value={order.status} />}
        extra={
          <>
            <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/service/orders')}>返回</Button>
            <Button icon={<CloudDownloadOutlined />} onClick={() => message.success('合同与交付物清单已打包下载（模拟）')}>下载合同包</Button>
            <Button type="primary" onClick={() => nav('/service/delivery')}>去验收</Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3">
        <MetricRow items={[
          { label: '合同额', value: fmtMoney(order.amount) },
          { label: '已回款', value: fmtMoney(order.payments.filter((p) => p.status === '已回款').reduce((s, p) => s + p.amount, 0)), color: 'var(--ok)' },
          { label: '交付物', value: `${deliverables.length} 项` },
          { label: '总体进度', value: `${order.progress}%`, color: 'var(--brand)' },
        ]} />
      </div>

      <div className="grid grid-cols-12 gap-3" style={{ marginTop: 12 }}>
        <div className="col-span-8">
          <SectionCard title="里程碑" extra={<span style={{ fontSize: 11 }}>共 6 个节点</span>}>
            {order.milestones.map((m, i) => {
              const overdue = !m.done && new Date(m.date).getTime() < Date.now()
              return (
                <div key={m.name} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 0', borderBottom: i === order.milestones.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, background: m.done ? 'rgba(52,211,153,0.16)' : overdue ? 'rgba(248,113,113,0.14)' : 'rgba(148,163,184,0.1)', color: m.done ? 'var(--ok)' : overdue ? 'var(--danger)' : 'var(--text-tertiary)', border: `1px solid ${m.done ? 'rgba(52,211,153,0.4)' : overdue ? 'rgba(248,113,113,0.4)' : 'var(--border)'}` }}>
                    {m.done ? <CheckCircleOutlined /> : i + 1}
                  </span>
                  <span style={{ fontSize: 12.5, flex: 1 }}>{m.name}</span>
                  <span className="num" style={{ fontSize: 11.5, color: overdue ? 'var(--danger)' : 'var(--text-tertiary)' }}>{m.date}</span>
                  <span style={{ fontSize: 10.5, width: 64, textAlign: 'right', color: m.done ? 'var(--ok)' : overdue ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                    {m.done ? '已完成' : overdue ? '已逾期' : '待完成'}
                  </span>
                </div>
              )
            })}
          </SectionCard>

          <div style={{ marginTop: 12 }}>
            <SectionCard title="服务清单" padding={0} bodyStyle={{ padding: 0 }}>
              <Table
                size="small"
                pagination={false}
                rowKey="code"
                dataSource={order.items}
                columns={[
                  { title: '服务编码', dataIndex: 'code', width: 110, render: (v: string) => <span className="num">{v}</span> },
                  { title: '数量', dataIndex: 'qty', width: 80, align: 'right' },
                  { title: '单价', dataIndex: 'price', width: 110, align: 'right', render: (v: number) => <span className="num">{fmtMoney(v)}</span> },
                  { title: '小计', align: 'right', render: (_, r) => <span className="num" style={{ color: 'var(--brand)' }}>{fmtMoney(r.qty * r.price)}</span> },
                ]}
              />
            </SectionCard>
          </div>

          <div style={{ marginTop: 12 }}>
            <SectionCard title="交付物" padding={0} bodyStyle={{ padding: 0 }} extra={<span style={{ fontSize: 11 }}>{deliverables.length} 项</span>}>
              <Table
                size="small"
                pagination={false}
                rowKey="id"
                dataSource={deliverables.slice(0, 8)}
                columns={[
                  { title: '名称', dataIndex: 'name', ellipsis: true },
                  { title: '格式', dataIndex: 'format', width: 76, render: (v: string) => <Tag style={{ fontSize: 9.5 }}>{v}</Tag> },
                  { title: '大小', dataIndex: 'size', width: 86, align: 'right' },
                  { title: '版本', dataIndex: 'version', width: 70 },
                  { title: '验收', dataIndex: 'accepted', width: 76, render: (v: boolean) => (v ? <Tag color="green" style={{ fontSize: 9.5 }}>通过</Tag> : <Tag style={{ fontSize: 9.5 }}>待验收</Tag>) },
                ]}
              />
            </SectionCard>
          </div>
        </div>

        <div className="col-span-4">
          <SectionCard title="合同信息">
            <Field label="合同编号">{order.id.replace('SO', 'HT')}</Field>
            <Field label="客户">{order.client}</Field>
            <Field label="联系人">{order.contact}</Field>
            <Field label="付款方式">3 - 4 - 3</Field>
            <Field label="签约日期">{order.signDate}</Field>
            <Field label="交付日期"><span style={{ color: late ? 'var(--danger)' : undefined }}>{order.deliveryDate}</span></Field>
          </SectionCard>

          <div style={{ marginTop: 12 }}>
            <SectionCard title="回款记录">
              {order.payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between" style={{ padding: '9px 0', borderBottom: i === 2 ? 'none' : '1px solid var(--border)' }}>
                  <div>
                    <div className="num" style={{ fontSize: 12.5 }}>{fmtMoney(p.amount)}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 2 }}>第 {i + 1} 期 · {p.date}</div>
                  </div>
                  <Tag color={p.status === '已回款' ? 'green' : 'gold'} style={{ fontSize: 9.5 }}>{p.status}</Tag>
                </div>
              ))}
              <div className="flex justify-between" style={{ marginTop: 10, fontSize: 11.5 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>回款比例</span>
                <span className="num">{Math.round((order.payments.filter((p) => p.status === '已回款').reduce((s, p) => s + p.amount, 0) / order.amount) * 100)}%</span>
              </div>
            </SectionCard>
          </div>

          <div style={{ marginTop: 12 }}>
            <SectionCard title="风险提示">
              <div style={{ fontSize: 11.5, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                交付节点已逾期 5 天，主要原因是 A 区屋面纹理返工。建议与客户沟通顺延验收，并在本周内提交整改后的模型与精度报告。
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Delivery() {
  const orders = api.delivery.pending()
  const [activeId, setActiveId] = useState(orders[0]?.id ?? '')
  const order = api.orders.get(activeId)
  const deliverables = api.orders.deliverables(activeId)
  const [tick, setTick] = useState(0)
  const [conclusion, setConclusion] = useState('合格')
  const [note, setNote] = useState('模型精度、纹理完整性与交付物清单均符合合同约定，同意验收。')

  return (
    <div>
      <PageHeader title="交付与验收" desc="核对交付物完整性，填写验收意见并提交，验收通过后订单自动结项、回款计划同步更新。" />

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-3">
          <SectionCard title="待交付订单" bodyStyle={{ padding: 6 }} extra={<span style={{ fontSize: 11 }}>{orders.length}</span>}>
            {orders.slice(0, 10).map((o) => (
              <div
                key={o.id}
                onClick={() => setActiveId(o.id)}
                style={{
                  padding: '10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                  background: activeId === o.id ? 'rgba(34,211,238,0.1)' : 'transparent',
                  borderLeft: `2px solid ${activeId === o.id ? 'var(--brand)' : 'transparent'}`,
                }}
              >
                <div className="num" style={{ fontSize: 10.5, color: 'var(--brand)' }}>{o.id}</div>
                <div style={{ fontSize: 11.8, marginTop: 3, lineHeight: 1.5 }}>{o.client}</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3 }}>{fmtMoney(o.amount)} · {ORDER_STATUS[o.status].label}</div>
              </div>
            ))}
          </SectionCard>
        </div>

        <div className="col-span-9">
          {order && (
            <>
              <SectionCard
                title={<span>{order.client} · 交付物清单</span>}
                extra={<span style={{ fontSize: 11 }}>{deliverables.filter((d) => d.accepted).length} / {deliverables.length} 已验收</span>}
                padding={0}
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={deliverables}
                  pagination={{ pageSize: 8, size: 'small' }}
                  columns={[
                    { title: '交付物', dataIndex: 'name', ellipsis: true },
                    { title: '类型', dataIndex: 'type', width: 88 },
                    { title: '格式', dataIndex: 'format', width: 72, render: (v: string) => <Tag style={{ fontSize: 9.5 }}>{v}</Tag> },
                    { title: '大小', dataIndex: 'size', width: 86, align: 'right' },
                    { title: '版本', dataIndex: 'version', width: 66 },
                    { title: '上传时间', dataIndex: 'uploadedAt', width: 110, render: (v: string) => fmtDate(v) },
                    {
                      title: '验收', dataIndex: 'accepted', width: 96,
                      render: (v: boolean, r) => (
                        <a
                          style={{ fontSize: 11.5, color: v ? 'var(--ok)' : 'var(--brand)' }}
                          onClick={() => { api.orders.acceptDeliverable(r.id, !v); setTick((x) => x + 1); message.success(v ? '已取消验收' : '已标记验收通过') }}
                        >
                          {v ? '已通过' : '标记通过'}
                        </a>
                      ),
                    },
                  ]}
                />
                <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between" style={{ fontSize: 11.5, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>交付完整度</span>
                    <span className="num">{(deliverables.filter((d) => d.accepted).length / Math.max(1, deliverables.length) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress percent={Math.round((deliverables.filter((d) => d.accepted).length / Math.max(1, deliverables.length)) * 100)} showInfo={false} strokeColor="#34D399" trailColor="rgba(148,163,184,0.15)" />
                </div>
              </SectionCard>

              <div style={{ marginTop: 12 }}>
                <SectionCard title="验收单">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 5 }}>验收结论</div>
                      <Select value={conclusion} onChange={setConclusion} style={{ width: '100%' }} options={['合格', '整改后合格', '不合格'].map((x) => ({ value: x, label: x }))} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 5 }}>验收人</div>
                      <Input defaultValue="张伟" />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 5 }}>验收意见</div>
                    <Input.TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                  <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                      提交后将生成验收记录，并把订单状态更新为已完成。当前订单：{order.id}（{ORDER_STATUS[order.status].label}）
                    </div>
                    <Button
                      type="primary"
                      icon={<FileDoneOutlined />}
                      onClick={() => {
                        api.orders.approve(order.id, note)
                        setTick((x) => x + 1)
                        message.success('验收已提交，订单已结项，回款计划已更新')
                      }}
                    >
                      提交验收
                    </Button>
                  </div>
                </SectionCard>
              </div>
              <div style={{ marginTop: 8, fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                最后操作：{fmtDateTime(new Date().toISOString())}{tick > 0 ? '（本次会话内有更新）' : ''}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const DOCS = [
  { cat: '操作手册', items: [
    { t: '三维查看器使用手册 v2.4', s: '测量、剖切、标注、对比全流程操作说明', v: 1284, at: '2026-10-12' },
    { t: 'MR 交互编排指南', s: '节点类型、触发器与时间轴使用规范', v: 862, at: '2026-09-28' },
    { t: '巡检终端操作说明', s: 'HoloLens 2 / Pico 4 现场作业步骤', v: 641, at: '2026-09-05' },
  ] },
  { cat: '常见问题', items: [
    { t: '点云配准 RMS 超限如何排查', s: '标靶布设、遮挡、坐标系三方面排查清单', v: 412, at: '2026-10-06' },
    { t: '模型加载慢的常见原因', s: 'LOD、纹理压缩、drawcall 与网络四类问题', v: 388, at: '2026-09-19' },
  ] },
  { cat: '标准规范', items: [
    { t: 'GB/T 39612-2020 低空数字航摄与数据处理规范', s: '航摄参数、成果质量与检查方法', v: 226, at: '2026-08-02' },
    { t: 'CH/T 9015-2012 三维地理信息模型数据产品规范', s: '产品分级、精度指标与元数据要求', v: 198, at: '2026-08-02' },
    { t: 'GB/T 51301-2018 建筑信息模型设计交付标准', s: 'BIM 交付物深度与命名规则', v: 176, at: '2026-07-21' },
    { t: 'T/CAGIS 1-2019 空间三维模型数据格式（S3M）', s: '三维模型数据组织与交换格式', v: 154, at: '2026-07-21' },
  ] },
  { cat: '案例集', items: [
    { t: '滨江智能制造园区数字孪生实践', s: '2.6 km² 园区复刻与 MR 运维落地复盘', v: 967, at: '2026-10-16' },
    { t: '文保建筑数字化建档方法', s: '纺织厂旧址的测绘、建模与展陈', v: 524, at: '2026-09-11' },
  ] },
]

export function Knowledge() {
  const [cat, setCat] = useState('操作手册')
  const [q, setQ] = useState('')
  const current = DOCS.find((d) => d.cat === cat)!
  const list = current.items.filter((i) => !q || i.t.includes(q) || i.s.includes(q))

  return (
    <div>
      <PageHeader title="知识库" desc="操作手册、常见问题、标准规范与案例集，支持关键词检索。标准规范条目可直接引用到交付文档。" />
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-3">
          <SectionCard title="分类" bodyStyle={{ padding: 8 }}>
            {DOCS.map((d) => (
              <div key={d.cat} onClick={() => setCat(d.cat)} style={{ padding: '9px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, display: 'flex', justifyContent: 'space-between', background: cat === d.cat ? 'rgba(34,211,238,0.1)' : 'transparent', color: cat === d.cat ? 'var(--brand)' : 'var(--text-secondary)' }}>
                <span><BookOutlined style={{ marginRight: 6, fontSize: 11 }} />{d.cat}</span>
                <span className="num" style={{ fontSize: 10.5, opacity: 0.7 }}>{d.items.length}</span>
              </div>
            ))}
          </SectionCard>
        </div>
        <div className="col-span-9">
          <SectionCard title={<Input.Search placeholder="搜索文档标题或摘要" allowClear size="small" style={{ width: 280 }} onSearch={setQ} onChange={(e) => !e.target.value && setQ('')} />} extra={<span style={{ fontSize: 11 }}>{list.length} 篇</span>} padding={0} bodyStyle={{ padding: 0 }}>
            {list.map((d) => (
              <div key={d.t} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => message.info('文档预览已打开（模拟）')}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{d.t}</span>
                  <Tag style={{ fontSize: 9.5 }}>{d.at}</Tag>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 5 }}>{d.s}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 6 }}>浏览 {d.v} 次</div>
              </div>
            ))}
            {list.length === 0 && <EmptyState text="没有匹配的文档" />}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default { Catalog, Orders, OrderDetail, Delivery, Knowledge }
