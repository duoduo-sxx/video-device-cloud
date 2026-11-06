import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Segmented, Select, Table, Tag, message } from 'antd'
import {
  ArrowLeftOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PlusOutlined, WarningOutlined,
} from '@ant-design/icons'
import EChart from '@/components/charts/EChart'
import { EmptyState, MetricRow, PageHeader, SectionCard, StatusTag } from '@/components/ui'
import { api } from '@/services'
import { DEFECT_STATUS, fmtDate, fmtDateTime, fmtNum } from '@/utils'

export function Plans() {
  const nav = useNavigate()
  const plans = api.plans.all()
  const [view, setView] = useState<'list' | 'calendar'>('list')

  return (
    <div>
      <PageHeader
        title="巡检计划"
        desc="按周期配置巡检路线与检查项，路线点位与三维场景绑定，巡检结果自动关联缺陷与工单。"
        extra={
          <>
            <Segmented size="small" value={view} onChange={(v) => setView(v as 'list')} options={[{ value: 'list', label: '列表' }, { value: 'calendar', label: '日历' }]} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => message.success('已创建巡检计划草稿')}>新建计划</Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3" style={{ marginBottom: 12 }}>
        <MetricRow items={[
          { label: '计划总数', value: plans.length },
          { label: '执行中', value: plans.filter((p) => p.status === 'ACTIVE').length, color: 'var(--ok)' },
          { label: '平均完成率', value: `${Math.round(plans.reduce((s, p) => s + p.completion, 0) / plans.length)}%` },
          { label: '本期未执行', value: 2, color: 'var(--danger)' },
        ]} />
      </div>

      {view === 'calendar' ? <CalendarView /> : (
        <SectionCard padding={0} bodyStyle={{ padding: 0 }} title="巡检计划列表" extra={<span style={{ fontSize: 11 }}>共 {plans.length} 条</span>}>
          <Table
            size="middle"
            rowKey="id"
            dataSource={plans}
            pagination={{ pageSize: 10, size: 'small' }}
            onRow={(r) => ({ onClick: () => nav(`/inspect/plans/${r.id}`), style: { cursor: 'pointer' } })}
            columns={[
              { title: '编号', dataIndex: 'id', width: 88, render: (v: string) => <span className="num" style={{ color: 'var(--brand)' }}>{v}</span> },
              { title: '计划名称', dataIndex: 'name' },
              { title: '周期', dataIndex: 'cycle', width: 80, render: (v: string) => <Tag style={{ fontSize: 10.5 }}>{v}</Tag> },
              { title: '点位数', dataIndex: 'pointCount', width: 80, align: 'right' },
              { title: '负责人', dataIndex: 'owner', width: 80 },
              { title: '下次执行', dataIndex: 'nextRun', width: 110, render: (v: string) => fmtDate(v) },
              { title: '完成率', dataIndex: 'completion', width: 120, render: (v: number) => <span className="num" style={{ color: v < 70 ? 'var(--warn)' : 'var(--ok)' }}>{v}%</span> },
              {
                title: '状态', dataIndex: 'status', width: 86,
                render: (v: string) => <Tag color={v === 'ACTIVE' ? 'green' : v === 'PAUSED' ? 'gold' : 'default'} style={{ fontSize: 10.5 }}>{v === 'ACTIVE' ? '执行中' : v === 'PAUSED' ? '已暂停' : '已完成'}</Tag>,
              },
              { title: '', width: 60, render: () => <span style={{ fontSize: 11.5, color: 'var(--brand)' }}>详情</span> },
            ]}
          />
        </SectionCard>
      )}
    </div>
  )
}

function CalendarView() {
  const days = Array.from({ length: 35 }, (_, i) => i - 2)
  return (
    <SectionCard title={<span className="flex items-center gap-2"><CalendarOutlined /> 2026 年 10 月</span>} extra={<span style={{ fontSize: 11 }}>有计划的日期以点标记</span>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
          <div key={d} style={{ background: 'var(--bg-panel)', padding: '8px 0', textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)' }}>{d}</div>
        ))}
        {days.map((d, i) => {
          const valid = d >= 1 && d <= 31
          const hasPlan = [1, 3, 6, 8, 10, 13, 15, 17, 20, 22, 24, 27, 29].includes(d)
          return (
            <div key={i} style={{ background: 'var(--bg-elevated)', minHeight: 72, padding: 8, opacity: valid ? 1 : 0.3 }}>
              <div className="num" style={{ fontSize: 11.5, color: d === 19 ? 'var(--brand)' : 'var(--text-secondary)', fontWeight: d === 19 ? 600 : 400 }}>{valid ? d : ''}</div>
              {valid && hasPlan && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 9.5, padding: '2px 5px', borderRadius: 3, background: 'rgba(34,211,238,0.12)', color: 'var(--brand)', display: 'inline-block' }}>
                    {['装配巡检', '储罐区周检', '消防月检', '管廊巡检'][d % 4]}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

export function PlanDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const plan = api.plans.get(id ?? '')
  if (!plan) return <EmptyState text="计划不存在" action={<Button onClick={() => nav('/inspect/plans')}>返回</Button>} />
  const records = api.plans.records(plan.id)

  return (
    <div>
      <PageHeader
        title={plan.name}
        desc={`${plan.id} · ${plan.cycle} · 负责人 ${plan.owner} · 下次执行 ${fmtDate(plan.nextRun)}`}
        tags={<Tag color={plan.status === 'ACTIVE' ? 'green' : 'gold'}>{plan.status === 'ACTIVE' ? '执行中' : '已暂停'}</Tag>}
        extra={
          <>
            <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/inspect/plans')}>返回</Button>
            <Button type="primary" onClick={() => message.success('已生成今日巡检任务并推送至终端')}>立即执行</Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7">
          <SectionCard title="巡检路线" extra={<span style={{ fontSize: 11 }}>A-03 · 共 {plan.pointCount} 个点位</span>} padding={0} bodyStyle={{ padding: 0 }}>
            <svg viewBox="0 0 640 380" style={{ width: '100%', height: 380, background: 'radial-gradient(ellipse at 50% 40%, #10233a 0%, #070b14 75%)' }}>
              <defs>
                <pattern id="pg" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0H0V20" fill="none" stroke="rgba(148,163,184,0.07)" />
                </pattern>
              </defs>
              <rect width="640" height="380" fill="url(#pg)" />
              <rect x="120" y="90" width="260" height="150" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.3)" />
              <text x="130" y="82" fontSize="10" fill="#93A4BE">A-03 装配车间三（20,000 m²）</text>
              <rect x="410" y="150" width="120" height="90" fill="rgba(148,163,184,0.05)" stroke="rgba(148,163,184,0.2)" />
              <text x="418" y="144" fontSize="10" fill="#5D6E8A">配电房</text>
              {plan.points.slice(0, 8).map((p, i) => {
                const x = 150 + (i % 4) * 62
                const y = 120 + Math.floor(i / 4) * 90
                return (
                  <g key={p.seq}>
                    <circle cx={x} cy={y} r="11" fill="rgba(7,11,20,0.9)" stroke="#22D3EE" strokeWidth="1.4" />
                    <text x={x} y={y + 3.5} fontSize="9" fill="#22D3EE" textAnchor="middle">{p.seq}</text>
                    {i > 0 && <line x1={150 + ((i - 1) % 4) * 62} y1={120 + Math.floor((i - 1) / 4) * 90} x2={x} y2={y} stroke="rgba(34,211,238,0.45)" strokeWidth="1" strokeDasharray="3 2" />}
                  </g>
                )
              })}
              <g transform="translate(590,40)">
                <circle r="14" fill="rgba(7,11,20,0.8)" stroke="rgba(148,163,184,0.3)" />
                <path d="M0 -9 L4 6 L0 3 L-4 6 Z" fill="#22D3EE" />
              </g>
            </svg>
          </SectionCard>
        </div>
        <div className="col-span-5">
          <SectionCard title="点位清单" padding={0} bodyStyle={{ padding: 0 }} extra={<span style={{ fontSize: 11 }}>{plan.pointCount} 个</span>}>
            <div style={{ maxHeight: 380, overflow: 'auto' }}>
              {plan.points.map((p) => (
                <div key={p.seq} style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                  <span className="num" style={{ fontSize: 10.5, color: 'var(--brand)', width: 18 }}>{String(p.seq).padStart(2, '0')}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12 }}>{p.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{p.item}：{p.standard}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <SectionCard title="历史执行记录" padding={0} bodyStyle={{ padding: 0 }} extra={<span style={{ fontSize: 11 }}>{records.length} 次</span>}>
          <Table
            size="small"
            rowKey="id"
            dataSource={records}
            pagination={{ pageSize: 6, size: 'small' }}
            columns={[
              { title: '记录号', dataIndex: 'id', width: 100, render: (v: string) => <span className="num" style={{ color: 'var(--brand)' }}>{v}</span> },
              { title: '执行人', dataIndex: 'executor', width: 90 },
              { title: '开始时间', dataIndex: 'startAt', width: 140, render: (v: string) => fmtDateTime(v) },
              { title: '点位完成', width: 110, render: (_, r) => <span className="num">{r.pointDone}/{r.pointTotal}</span> },
              { title: '异常项', dataIndex: 'exceptions', width: 90, render: (v: number) => <span style={{ color: v ? 'var(--danger)' : 'var(--text-secondary)' }}>{v}</span> },
              { title: '照片', dataIndex: 'photos', width: 70, align: 'right' },
              { title: '结论', width: 90, render: (_, r) => (r.exceptions ? <Tag color="gold" style={{ fontSize: 10 }}>有异常</Tag> : <Tag color="green" style={{ fontSize: 10 }}>正常</Tag>) },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  )
}

export function Records() {
  const records = api.records.all().slice(0, 40)
  const [tab, setTab] = useState('timeline')

  return (
    <div>
      <PageHeader
        title="巡检记录"
        desc="记录每次巡检的点位打卡、现场照片与异常项，异常自动生成缺陷并进入工单流程。"
        extra={<Segmented size="small" value={tab} onChange={setTab} options={[{ value: 'timeline', label: '时间线' }, { value: 'table', label: '表格' }]} />}
      />

      <div className="grid grid-cols-4 gap-3" style={{ marginBottom: 12 }}>
        <MetricRow items={[
          { label: '记录总数', value: 186 },
          { label: '本月完成', value: 32, color: 'var(--brand)' },
          { label: '异常项', value: 48, color: 'var(--warn)' },
          { label: '平均耗时', value: '52 min' },
        ]} />
      </div>

      {tab === 'timeline' ? (
        <SectionCard title="最近巡检记录" bodyStyle={{ padding: '12px 18px' }}>
          {records.slice(0, 12).map((r, i) => {
            const plan = api.plans.get(r.planId)
            return (
              <div key={r.id} style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 132, flexShrink: 0, fontSize: 11, color: 'var(--text-tertiary)' }} className="num">{fmtDateTime(r.startAt)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: r.exceptions ? 'var(--warn)' : 'var(--ok)', marginTop: 5 }} />
                  {i !== 11 && <span style={{ width: 1, flex: 1, background: 'var(--border-strong)', marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: 16 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{plan?.name ?? r.planId}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{r.id}</span>
                    {r.exceptions > 0 && <Tag color="gold" style={{ fontSize: 9.5 }}>{r.exceptions} 项异常</Tag>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {r.executor} · 完成 {r.pointDone}/{r.pointTotal} 点位 · 照片 {r.photos} 张 · 耗时 {Math.round((new Date(r.endAt).getTime() - new Date(r.startAt).getTime()) / 60000)} 分钟
                  </div>
                </div>
              </div>
            )
          })}
        </SectionCard>
      ) : (
        <SectionCard padding={0} bodyStyle={{ padding: 0 }} title="全部记录">
          <Table
            size="small"
            rowKey="id"
            dataSource={records}
            pagination={{ pageSize: 12, size: 'small' }}
            columns={[
              { title: '记录号', dataIndex: 'id', width: 100, render: (v: string) => <span className="num" style={{ color: 'var(--brand)' }}>{v}</span> },
              { title: '计划', dataIndex: 'planId', width: 90 },
              { title: '执行人', dataIndex: 'executor', width: 90 },
              { title: '开始', dataIndex: 'startAt', width: 140, render: (v: string) => fmtDateTime(v) },
              { title: '点位', width: 100, render: (_, r) => <span className="num">{r.pointDone}/{r.pointTotal}</span> },
              { title: '异常', dataIndex: 'exceptions', width: 70, render: (v: number) => <span style={{ color: v ? 'var(--danger)' : undefined }}>{v}</span> },
              { title: '照片', dataIndex: 'photos', width: 70, align: 'right' },
            ]}
          />
        </SectionCard>
      )}
    </div>
  )
}

export function Defects() {
  const defects = api.defects.all()
  const [view, setView] = useState('board')
  const [type, setType] = useState<string>()
  const [level, setLevel] = useState<string>()

  const filtered = useMemo(
    () => defects.filter((d) => (!type || d.type === type) && (!level || d.level === level)),
    [defects, type, level],
  )
  const columns = ['NEW', 'CONFIRMED', 'PROCESSING', 'CLOSED']

  return (
    <div>
      <PageHeader
        title="缺陷管理"
        desc="缺陷来源于人工巡检与 AI 识别，按等级与状态闭环管理。AI 识别结果标注置信度，低于 70% 建议人工复核。"
        extra={
          <>
            <Select size="small" placeholder="全部类型" allowClear style={{ width: 120 }} onChange={setType} options={['渗漏', '锈蚀', '裂缝', '变形', '设备异常', '异物'].map((x) => ({ value: x, label: x }))} />
            <Select size="small" placeholder="全部等级" allowClear style={{ width: 110 }} onChange={setLevel} options={['I', 'II', 'III'].map((x) => ({ value: x, label: `${x} 级` }))} />
            <Segmented size="small" value={view} onChange={setView} options={[{ value: 'board', label: '看板' }, { value: 'stat', label: '统计' }]} />
          </>
        }
      />

      {view === 'board' ? (
        <div className="grid grid-cols-4 gap-3">
          {columns.map((c) => (
            <div key={c}>
              <div className="flex items-center justify-between" style={{ padding: '0 2px 8px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}><StatusTag map={DEFECT_STATUS} value={c} /></span>
                <span className="num" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{filtered.filter((d) => d.status === c).length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                {filtered.filter((d) => d.status === c).slice(0, 8).map((d) => (
                  <div key={d.id} className="card" style={{ padding: 12, cursor: 'pointer' }} onClick={() => message.info(`${d.id}：${d.description.slice(0, 30)}…`)}>
                    <div className="flex items-center justify-between">
                      <span className="num" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{d.id}</span>
                      <Tag color={d.level === 'I' ? 'red' : d.level === 'II' ? 'gold' : 'default'} style={{ fontSize: 9.5, marginInlineEnd: 0 }}>{d.level} 级</Tag>
                    </div>
                    <div style={{ fontSize: 12.3, marginTop: 7, fontWeight: 500 }}>{d.type}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>{d.location}</div>
                    {d.source === 'AI_RECOGNITION' && (
                      <div style={{ marginTop: 7, fontSize: 10, color: d.confidence > 0.9 ? 'var(--ok)' : d.confidence > 0.7 ? 'var(--warn)' : 'var(--text-tertiary)' }}>
                        AI 识别 · 置信度 {(d.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6 }}>{fmtDate(d.foundAt)} · {d.foundBy}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-5">
            <SectionCard title="缺陷类型分布">
              <EChart
                height={260}
                option={{
                  tooltip: { trigger: 'item' },
                  legend: { bottom: 0, itemWidth: 8, itemHeight: 8 },
                  series: [{
                    type: 'pie', radius: ['46%', '68%'], center: ['50%', '44%'],
                    label: { show: false },
                    data: api.stats.defectsByType(),
                  }],
                }}
              />
            </SectionCard>
          </div>
          <div className="col-span-7">
            <SectionCard title="月度新增与闭环">
              <EChart
                height={260}
                option={{
                  grid: { top: 28, right: 16, bottom: 26, left: 38 },
                  tooltip: { trigger: 'axis' },
                  legend: { top: 0, right: 0, itemWidth: 8, itemHeight: 8 },
                  xAxis: { type: 'category', data: ['5月', '6月', '7月', '8月', '9月', '10月'] },
                  yAxis: { type: 'value' },
                  series: [
                    { name: '新增', type: 'bar', barWidth: 12, data: [18, 26, 22, 31, 24, 27], itemStyle: { borderRadius: [2, 2, 0, 0] } },
                    { name: '闭环', type: 'bar', barWidth: 12, data: [14, 21, 25, 26, 29, 22], itemStyle: { borderRadius: [2, 2, 0, 0] } },
                  ],
                }}
              />
            </SectionCard>
          </div>
          <div className="col-span-12">
            <SectionCard title="区域热力" padding={0} bodyStyle={{ padding: 14 }}>
              <div className="grid grid-cols-8 gap-2">
                {['A-01', 'A-02', 'A-03', 'B-01', 'B-02', 'C-01', 'D-01', 'E-01', 'F-01', 'F-02', 'G-01', 'H-01', 'H-02', 'H-03', 'H-04', 'H-05'].map((code) => {
                  const n = defects.filter((d) => d.location.includes(code)).length
                  return (
                    <div key={code} style={{ padding: '12px 10px', borderRadius: 6, border: '1px solid var(--border)', background: `rgba(248,113,113,${Math.min(0.42, n / 30)})` }}>
                      <div style={{ fontSize: 11.5, fontWeight: 500 }}>{code}</div>
                      <div className="num" style={{ fontSize: 16, marginTop: 4 }}>{n}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-tertiary)' }}>处缺陷</div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          </div>
          <div className="col-span-12">
            <SectionCard title="关键指标" >
              <div className="grid grid-cols-4 gap-3">
                {[
                  ['未闭环缺陷', `${defects.filter((d) => d.status !== 'CLOSED').length}`, 'var(--warn)', <WarningOutlined key="w" />],
                  ['平均闭环时长', '4.6 天', 'var(--brand)', <ClockCircleOutlined key="c" />],
                  ['本月闭环率', '81.5%', 'var(--ok)', <CheckCircleOutlined key="k" />],
                  ['I 级缺陷', `${defects.filter((d) => d.level === 'I').length}`, 'var(--danger)', <WarningOutlined key="i" />],
                ].map(([l, v, c, icon]) => (
                  <div key={String(l)} style={{ padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}><span style={{ color: String(c) }}>{icon}</span>{l}</div>
                    <div className="num" style={{ fontSize: 22, fontWeight: 600, color: String(c), marginTop: 6 }}>{v}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <SectionCard title="缺陷明细" padding={0} bodyStyle={{ padding: 0 }} extra={<span style={{ fontSize: 11 }}>{fmtNum(filtered.length)} 条</span>}>
          <Table
            size="small"
            rowKey="id"
            dataSource={filtered.slice(0, 30)}
            pagination={{ pageSize: 8, size: 'small' }}
            columns={[
              { title: '编号', dataIndex: 'id', width: 92, render: (v: string) => <span className="num" style={{ color: 'var(--brand)' }}>{v}</span> },
              { title: '类型', dataIndex: 'type', width: 86 },
              { title: '等级', dataIndex: 'level', width: 64, render: (v: string) => <Tag color={v === 'I' ? 'red' : v === 'II' ? 'gold' : 'default'} style={{ fontSize: 9.5 }}>{v}</Tag> },
              { title: '位置', dataIndex: 'location', width: 260 },
              { title: '来源', dataIndex: 'source', width: 130, render: (v: string, r) => (v === 'AI_RECOGNITION' ? <span style={{ fontSize: 11, color: r.confidence > 0.9 ? 'var(--ok)' : 'var(--warn)' }}>AI {(r.confidence * 100).toFixed(0)}%</span> : <span style={{ fontSize: 11 }}>人工</span>) },
              { title: '状态', dataIndex: 'status', width: 88, render: (v: string) => <StatusTag map={DEFECT_STATUS} value={v} /> },
              { title: '发现时间', dataIndex: 'foundAt', width: 126, render: (v: string) => fmtDateTime(v) },
              { title: '处理人', dataIndex: 'foundBy', width: 80 },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  )
}
