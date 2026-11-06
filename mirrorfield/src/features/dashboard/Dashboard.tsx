import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, Tooltip } from 'antd'
import {
  AlertOutlined, ApartmentOutlined, CloudServerOutlined, CompassOutlined, DeploymentUnitOutlined,
  FundOutlined, RightOutlined, ThunderboltOutlined,
} from '@ant-design/icons'
import EChart from '@/components/charts/EChart'
import { Meter, PageHeader, SectionCard, StatCard } from '@/components/ui'
import { api } from '@/services'
import { useAuth } from '@/stores'
import { fmtDateTime, fromNow } from '@/utils'
import { ParkViewer } from '@/three/ParkViewer'

const SPARKS = {
  projects: [3, 4, 3, 5, 4, 5, 6],
  area: [8.2, 8.8, 9.6, 10.4, 11.2, 12.1, 12.8],
  assets: [210, 248, 276, 302, 334, 362, 386],
  points: [48, 51, 54, 56, 58, 60, 62],
  online: [12, 15, 14, 16, 15, 16, 14],
  sessions: [212, 248, 265, 289, 301, 318, 327],
}

export default function Dashboard() {
  const nav = useNavigate()
  const { roleId, userName } = useAuth()
  const kpi = api.stats.kpi()
  const notifications = api.notifications.all().slice(0, 6)
  const devices = api.devices.all()
  const trend = api.stats.sessionTrend()
  const storage = api.stats.storage()
  const projList = api.projectsAll()

  const totalStorage = storage.reduce((s, x) => s + x.value, 0)
  const capacity = 8
  const waterline = (totalStorage / capacity) * 100

  const todo = [
    { tag: '待审核', text: 'A-03 车间轻量化成果（LOD3）', due: '10-20', color: 'var(--brand)' },
    { tag: '待处理', text: 'B-02 点云配准超限复检', due: '10-19', color: 'var(--danger)' },
    { tag: '待确认', text: '场景发布版本 v2.4.1 的分层配置', due: '10-21', color: 'var(--warn)' },
    { tag: '待回复', text: '客户关于精度报告的疑问（3 条）', due: '10-22', color: 'var(--text-secondary)' },
    { tag: '待提交', text: '本周复刻进度周报', due: '10-23', color: 'var(--text-secondary)' },
  ]

  return (
    <div>
      <PageHeader
        title="总览驾驶舱"
        desc={`当前登录 ${userName}，数据截至 ${fmtDateTime(new Date().toISOString())}。园区一期处于交付收尾阶段，2 项风险需要关注。`}
        extra={
          <>
            <Tag color="cyan" style={{ marginInlineEnd: 0 }}>滨江园区 · 一期</Tag>
            <Tag style={{ marginInlineEnd: 0 }}>近 30 天</Tag>
          </>
        }
      />

      <div className="grid grid-cols-6 gap-3">
        <StatCard label="在建项目" value={kpi.projects} unit="个" delta={20} hint="较上月" spark={SPARKS.projects} onClick={() => nav('/service/orders')} />
        <StatCard label="复刻面积" value={kpi.area} unit="km²" delta={5.2} hint="累计" spark={SPARKS.area} accent="var(--accent)" onClick={() => nav('/recon/assets')} />
        <StatCard label="模型资产" value={kpi.assets} unit="个" delta={6.6} hint="本月新增 24" spark={SPARKS.assets} accent="var(--ok)" onClick={() => nav('/recon/assets')} />
        <StatCard label="点云总量" value="62.4" unit="亿点" delta={5.2} hint="含 12 份成果" spark={SPARKS.points} accent="#A78BFA" onClick={() => nav('/data/datasets')} />
        <StatCard label="MR 设备在线" value={`${kpi.online}/${kpi.devices}`} delta={-11.1} hint="3 台离线" spark={SPARKS.online} accent="#FBBF24" onClick={() => nav('/mr/devices')} />
        <StatCard label="本周交互会话" value={kpi.sessions} unit="次" delta={12.8} hint="平均 18 分 32 秒" spark={SPARKS.sessions} accent="#F472B6" onClick={() => nav('/mr/sessions')} />
      </div>

      <div className="grid grid-cols-12 gap-3" style={{ marginTop: 12 }}>
        <div className="col-span-8">
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <CompassOutlined style={{ color: 'var(--brand)' }} /> 园区三维概览
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>拖拽旋转 · 点击建筑查看详情</span>
              </span>
            }
            extra={
              <span className="flex items-center gap-1" style={{ cursor: 'pointer', color: 'var(--brand)' }} onClick={() => nav('/recon/viewer')}>
                进入三维查看器 <RightOutlined style={{ fontSize: 10 }} />
              </span>
            }
            padding={0}
            bodyStyle={{ padding: 0 }}
          >
            <MiniPark onPick={() => nav('/recon/viewer')} />
            <div className="grid grid-cols-4" style={{ borderTop: '1px solid var(--border)' }}>
              {[
                ['建筑', '18 栋 / 42,860 构件'],
                ['管廊', '4.2 km / 26 km 管网'],
                ['复刻精度', '平面 ±3.1 cm'],
                ['场景版本', 'v2.4.1（10-16）'],
              ].map(([l, v]) => (
                <div key={l} style={{ padding: '10px 14px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{l}</div>
                  <div style={{ fontSize: 12.5, marginTop: 3 }}>{v}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="col-span-4">
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <AlertOutlined style={{ color: 'var(--danger)' }} /> 风险告警
              </span>
            }
            extra={<span style={{ fontSize: 11 }}>{notifications.length} 条待处理</span>}
            padding={0}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ maxHeight: 318, overflowY: 'auto' }}>
              {notifications.map((n, i) => (
                <div
                  key={n.id}
                  onClick={() => nav(n.link)}
                  style={{
                    padding: '11px 14px',
                    borderBottom: i === notifications.length - 1 ? 'none' : '1px solid var(--border)',
                    display: 'flex',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 3, borderRadius: 2, flexShrink: 0,
                      background: n.type === '告警' ? 'var(--danger)' : n.type === '待办' ? 'var(--warn)' : 'var(--brand)',
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.3, lineHeight: 1.55 }}>{n.title}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {n.type} · {fromNow(n.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3" style={{ marginTop: 12 }}>
        <div className="col-span-4">
          <SectionCard title={<span className="flex items-center gap-2"><ApartmentOutlined style={{ color: 'var(--accent)' }} /> 项目进度</span>} extra={<span style={{ fontSize: 11 }}>6 个项目</span>} bodyStyle={{ padding: '10px 0' }}>
            {projList.map((p) => (
              <div key={p.id} style={{ padding: '9px 16px' }}>
                <div className="flex items-center justify-between" style={{ fontSize: 12.3 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{p.name}</span>
                  <span className="num" style={{ color: p.overdue ? 'var(--danger)' : 'var(--text-secondary)' }}>{p.progress}%</span>
                </div>
                <div style={{ margin: '6px 0 4px' }}>
                  <Meter value={p.progress} color={p.overdue ? 'var(--danger)' : p.progress === 100 ? 'var(--ok)' : 'var(--brand)'} />
                </div>
                <div className="flex items-center justify-between" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                  <span>{p.stage} · {p.manager}</span>
                  <span style={{ color: p.overdue ? 'var(--danger)' : undefined }}>{p.overdue ? '已逾期 ' : ''}{p.endDate}</span>
                </div>
              </div>
            ))}
          </SectionCard>
        </div>

        <div className="col-span-4">
          <SectionCard title={<span className="flex items-center gap-2"><FundOutlined style={{ color: 'var(--brand)' }} /> 交互会话趋势</span>} extra={<span style={{ fontSize: 11 }}>近 30 天</span>} bodyStyle={{ padding: '8px 8px 0' }}>
            <EChart
              height={230}
              option={{
                grid: { top: 16, right: 12, bottom: 22, left: 36 },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: trend.map((t) => t.date), axisLabel: { interval: 6 } },
                yAxis: [{ type: 'value', name: '会话', nameTextStyle: { fontSize: 10 } }],
                series: [
                  {
                    type: 'line', name: '会话数', data: trend.map((t) => t.count), smooth: true,
                    symbol: 'none', lineStyle: { width: 1.8 },
                    areaStyle: {
                      color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(34,211,238,0.28)' }, { offset: 1, color: 'rgba(34,211,238,0)' }],
                      },
                    },
                  },
                ],
              }}
            />
          </SectionCard>
        </div>

        <div className="col-span-4">
          <SectionCard
            title={<span className="flex items-center gap-2"><DeploymentUnitOutlined style={{ color: 'var(--ok)' }} /> MR 设备在线</span>}
            extra={<span style={{ fontSize: 11 }}>在线 {kpi.online} / 离线 {kpi.devices - kpi.online}</span>}
          >
            <div className="grid grid-cols-6 gap-2">
              {devices.map((d) => (
                <Tooltip key={d.id} title={`${d.name} · ${d.model} · 电量 ${d.battery}%`}>
                  <div
                    onClick={() => nav('/mr/devices')}
                    style={{
                      border: '1px solid var(--border)', borderRadius: 6, padding: '7px 4px', cursor: 'pointer',
                      background: d.status === 'OFFLINE' ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.05)',
                    }}
                  >
                    <div className="flex items-center justify-center">
                      <span
                        className={d.status === 'ONLINE' ? 'pulse-dot' : ''}
                        style={{
                          width: 5, height: 5, borderRadius: 3,
                          background: d.status === 'ONLINE' ? 'var(--ok)' : d.status === 'OFFLINE' ? 'var(--danger)' : 'var(--warn)',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 9.5, textAlign: 'center', marginTop: 4, color: 'var(--text-secondary)' }}>{d.name.split('-')[0]}</div>
                    <div className="num" style={{ fontSize: 9, textAlign: 'center', color: 'var(--text-tertiary)' }}>{d.battery}%</div>
                  </div>
                </Tooltip>
              ))}
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: 12, fontSize: 11, color: 'var(--text-tertiary)' }}>
              <span><span style={{ color: 'var(--ok)' }}>●</span> 在线 {kpi.online}</span>
              <span><span style={{ color: 'var(--danger)' }}>●</span> 离线 {devices.filter((d) => d.status === 'OFFLINE').length}</span>
              <span><span style={{ color: 'var(--warn)' }}>●</span> 维护 {devices.filter((d) => d.status === 'MAINTAIN').length}</span>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3" style={{ marginTop: 12 }}>
        <div className="col-span-6">
          <SectionCard
            title={<span className="flex items-center gap-2"><CloudServerOutlined style={{ color: '#A78BFA' }} /> 存储占用</span>}
            extra={<span style={{ fontSize: 11 }}>总量 {totalStorage.toFixed(2)} TB / {capacity} TB</span>}
          >
            <div className="flex gap-1" style={{ height: 26, borderRadius: 6, overflow: 'hidden' }}>
              {storage.map((s, i) => (
                <Tooltip key={s.name} title={`${s.name} ${s.value.toFixed(2)} TB`}>
                  <div
                    style={{
                      width: `${(s.value / capacity) * 100}%`,
                      background: ['#22D3EE', '#6366F1', '#34D399', '#FBBF24', '#94A3B8'][i],
                      opacity: 0.85,
                    }}
                  />
                </Tooltip>
              ))}
              <div style={{ flex: 1, background: 'rgba(148,163,184,0.08)' }} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2" style={{ marginTop: 12 }}>
              {storage.map((s, i) => (
                <span key={s.name} className="flex items-center gap-1.5" style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: ['#22D3EE', '#6366F1', '#34D399', '#FBBF24', '#94A3B8'][i] }} />
                  {s.name}
                  <span className="num" style={{ color: 'var(--text-tertiary)' }}>{s.value < 0.01 ? `${(s.value * 1024).toFixed(0)} GB` : `${s.value.toFixed(2)} TB`}</span>
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: 14, fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>容量水位</span>
              <span className="num" style={{ color: waterline > 80 ? 'var(--danger)' : 'var(--warn)' }}>{waterline.toFixed(1)}%</span>
            </div>
            <div style={{ marginTop: 6 }}><Meter value={waterline} color={waterline > 80 ? 'var(--danger)' : 'var(--warn)'} /></div>
          </SectionCard>
        </div>

        <div className="col-span-6">
          <SectionCard title={<span className="flex items-center gap-2"><ThunderboltOutlined style={{ color: 'var(--warn)' }} /> 我的待办</span>} extra={<span style={{ fontSize: 11 }}>按当前角色：{roleId}</span>} bodyStyle={{ padding: '6px 0' }}>
            {todo.map((t) => (
              <div key={t.text} className="flex items-center gap-3" style={{ padding: '9px 16px', borderBottom: '1px solid var(--border)' }}>
                <Tag color="default" style={{ marginInlineEnd: 0, fontSize: 10.5, color: t.color, borderColor: 'transparent', background: 'rgba(148,163,184,0.08)' }}>{t.tag}</Tag>
                <span style={{ flex: 1, fontSize: 12.3 }}>{t.text}</span>
                <span className="num" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{t.due}</span>
                <RightOutlined style={{ fontSize: 10, color: 'var(--text-tertiary)' }} />
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function MiniPark({ onPick }: { onPick: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const cb = useRef(onPick)
  cb.current = onPick
  useEffect(() => {
    if (!ref.current) return
    const v = new ParkViewer(ref.current, { onPick: () => cb.current() }, { lite: true })
    return () => v.dispose()
  }, [])
  return <div ref={ref} style={{ width: '100%', height: 300 }} />
}
