import { useMemo, useState } from 'react'
import { Button, Input, Modal, Select, Switch, Table, Tag, message } from 'antd'
import {
  ApartmentOutlined, CheckOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined,
  SafetyCertificateOutlined, SettingOutlined,
} from '@ant-design/icons'
import { Field, PageHeader, SectionCard } from '@/components/ui'
import { api, resetAll } from '@/services'
import { ROLES } from '@/mock'
import { fmtDateTime } from '@/utils'
import type { RoleId } from '@/types'
import { useAuth, useUI, type ModuleKey } from '@/stores'

export function Org() {
  const orgs = api.orgsAll()
  const [active, setActive] = useState('D00')
  const users = api.users.all()
  const members = users.filter((u) => {
    const dept = orgs.find((o) => o.name === u.dept)
    return dept?.id === active || active === 'D00'
  })

  return (
    <div>
      <PageHeader title="组织架构" desc="维护公司、部门与班组三级结构，部门与用户、角色关联，用于数据权限隔离。" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => message.success('已创建部门（模拟）')}>新建部门</Button>} />
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-4">
          <SectionCard title={<span className="flex items-center gap-2"><ApartmentOutlined /> 组织结构</span>} bodyStyle={{ padding: 8 }}>
            {orgs.map((o) => (
              <div
                key={o.id}
                onClick={() => setActive(o.id)}
                style={{
                  padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12.3,
                  paddingLeft: o.parentId === null ? 10 : o.parentId === 'D00' ? 24 : 40,
                  background: active === o.id ? 'rgba(34,211,238,0.1)' : 'transparent',
                  color: active === o.id ? 'var(--brand)' : 'var(--text-secondary)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>{o.name}</span>
                <span className="num" style={{ fontSize: 10.5, opacity: 0.7 }}>{o.memberCount}</span>
              </div>
            ))}
          </SectionCard>
        </div>
        <div className="col-span-8">
          <SectionCard title={`成员（${members.length}）`} padding={0} bodyStyle={{ padding: 0 }}>
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={members}
              columns={[
                { title: '姓名', dataIndex: 'name', width: 90 },
                { title: '岗位', dataIndex: 'title', width: 140 },
                { title: '部门', dataIndex: 'dept' },
                { title: '账号', dataIndex: 'account', width: 120, render: (v: string) => <span className="num" style={{ fontSize: 11.5 }}>{v}</span> },
                { title: '角色', dataIndex: 'roleId', width: 110, render: (v: RoleId) => <Tag style={{ fontSize: 10 }}>{ROLES.find((r) => r.id === v)?.name}</Tag> },
                { title: '最后登录', dataIndex: 'lastLogin', width: 130, render: (v: string) => fmtDateTime(v) },
              ]}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export function Users() {
  const users = api.users.all()
  const [tick, setTick] = useState(0)
  const [kw, setKw] = useState('')

  const list = useMemo(() => {
    void tick
    return users.filter((u) => !kw || u.name.includes(kw) || u.account.includes(kw))
  }, [users, kw, tick])

  return (
    <div>
      <PageHeader
        title="用户管理"
        desc="账号与角色绑定，禁用账号后立即失效。手机号统一脱敏展示，完整信息需管理员二次授权查看。"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => message.success('已创建用户（模拟）')}>新建用户</Button>}
      />
      <SectionCard
        padding={0}
        bodyStyle={{ padding: 0 }}
        title={<Input.Search size="small" placeholder="搜索姓名或账号" allowClear style={{ width: 220 }} onSearch={setKw} onChange={(e) => !e.target.value && setKw('')} />}
        extra={<span style={{ fontSize: 11 }}>共 {list.length} 人</span>}
      >
        <Table
          size="middle"
          rowKey="id"
          dataSource={list}
          pagination={{ pageSize: 12, size: 'small' }}
          columns={[
            { title: '姓名', dataIndex: 'name', width: 90 },
            { title: '账号', dataIndex: 'account', width: 130, render: (v: string) => <span className="num" style={{ color: 'var(--brand)' }}>{v}</span> },
            { title: '手机号', dataIndex: 'phone', width: 130, render: (v: string) => <span className="num" style={{ fontSize: 11.5 }}>{v}</span> },
            { title: '部门', dataIndex: 'dept', width: 140 },
            { title: '岗位', dataIndex: 'title', width: 140 },
            { title: '角色', dataIndex: 'roleId', width: 120, render: (v: RoleId) => <Tag style={{ fontSize: 10 }}>{ROLES.find((r) => r.id === v)?.name}</Tag> },
            { title: '最后登录', dataIndex: 'lastLogin', width: 130, render: (v: string) => fmtDateTime(v) },
            {
              title: '状态', dataIndex: 'status', width: 80,
              render: (v: string, r) => (
                <Switch
                  size="small"
                  checked={v === 'ACTIVE'}
                  onChange={(c) => { api.users.update(r.id, { status: c ? 'ACTIVE' : 'DISABLED' }); setTick((x) => x + 1); message.success(c ? '账号已启用' : '账号已禁用') }}
                />
              ),
            },
            { title: '操作', width: 110, render: (_, r) => <a style={{ fontSize: 11.5 }} onClick={() => message.success(`已向 ${r.name} 发送密码重置链接`)}>重置密码</a> },
          ]}
        />
      </SectionCard>
    </div>
  )
}

const MODULES: { key: ModuleKey; name: string }[] = [
  { key: 'dashboard', name: '总览驾驶舱' },
  { key: 'data', name: '数据采集' },
  { key: 'recon', name: '三维复刻' },
  { key: 'mr', name: 'MR 虚实交互' },
  { key: 'inspect', name: '巡检运维' },
  { key: 'ticket', name: '工单中心' },
  { key: 'service', name: '技术服务' },
  { key: 'system', name: '系统管理' },
]

export function Roles() {
  const { roleId } = useAuth()
  const [active, setActive] = useState<RoleId>('R2')

  return (
    <div>
      <PageHeader
        title="角色权限"
        desc="按功能模块配置查看与编辑权限。修改后立即影响左侧菜单与页面按钮，无需重新登录。"
        extra={<Button type="primary" icon={<CheckOutlined />} onClick={() => message.success('权限已保存并即时生效')}>保存权限</Button>}
      />
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-3">
          <SectionCard title="角色" bodyStyle={{ padding: 6 }}>
            {ROLES.map((r) => (
              <div
                key={r.id}
                onClick={() => setActive(r.id)}
                style={{
                  padding: '10px', borderRadius: 6, cursor: 'pointer',
                  background: active === r.id ? 'rgba(34,211,238,0.1)' : 'transparent',
                  borderLeft: `2px solid ${active === r.id ? 'var(--brand)' : 'transparent'}`,
                }}
              >
                <div style={{ fontSize: 12.5, color: active === r.id ? 'var(--brand)' : 'var(--text-primary)' }}>
                  {r.name}
                  {roleId === r.id && <Tag style={{ fontSize: 9, marginLeft: 6 }}>当前</Tag>}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 3 }}>{r.desc}</div>
              </div>
            ))}
          </SectionCard>
        </div>
        <div className="col-span-9">
          <SectionCard title={<span className="flex items-center gap-2"><SafetyCertificateOutlined /> 权限矩阵 · {ROLES.find((r) => r.id === active)?.name}</span>} padding={0} bodyStyle={{ padding: 0 }}>
            <Table
              size="middle"
              rowKey="key"
              pagination={false}
              dataSource={MODULES}
              columns={[
                { title: '模块', dataIndex: 'name', width: 200 },
                {
                  title: '查看', width: 120, align: 'center',
                  render: (_, r) => {
                    const p = ROLES.find((x) => x.id === active)?.perms[r.key]
                    return <Switch size="small" checked={p === 'r' || p === 'rw'} onChange={() => message.success('权限变更已暂存，点击保存生效')} />
                  },
                },
                {
                  title: '编辑', width: 120, align: 'center',
                  render: (_, r) => {
                    const p = ROLES.find((x) => x.id === active)?.perms[r.key]
                    return <Switch size="small" checked={p === 'rw'} onChange={() => message.success('权限变更已暂存，点击保存生效')} />
                  },
                },
                {
                  title: '生效范围', render: (_, r) => {
                    const p = ROLES.find((x) => x.id === active)?.perms[r.key]
                    return <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{p === 'rw' ? '查看 + 新增 / 编辑 / 删除' : p === 'r' ? '仅查看，写操作隐藏' : '菜单不展示'}</span>
                  },
                },
              ]}
            />
          </SectionCard>
          <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.8 }}>
            说明：权限在 UI 层真实生效。无权限的菜单不会渲染，写操作按钮置灰并提示缺少的权限项。可在顶栏切换角色验证效果。
          </div>
        </div>
      </div>
    </div>
  )
}

export function Logs() {
  const logs = api.logs.all()
  const [module, setModule] = useState<string>()
  const [kw, setKw] = useState('')
  const list = useMemo(
    () => logs.filter((l) => (!module || l.module === module) && (!kw || l.userName.includes(kw) || l.action.includes(kw) || l.target.includes(kw))),
    [logs, module, kw],
  )

  return (
    <div>
      <PageHeader title="操作日志" desc="记录关键业务操作，保留 180 天，支持按模块、用户与关键词检索。" extra={<Button icon={<DeleteOutlined />} onClick={() => message.success('已清理 90 天前的日志（模拟）')}>清理历史</Button>} />
      <SectionCard
        padding={0}
        bodyStyle={{ padding: 0 }}
        title={
          <div className="flex items-center gap-2">
            <Input.Search size="small" placeholder="搜索用户、操作、对象" allowClear style={{ width: 250 }} onSearch={setKw} onChange={(e) => !e.target.value && setKw('')} />
            <Select size="small" placeholder="全部模块" allowClear style={{ width: 130 }} onChange={setModule} options={['总览', '数据采集', '三维复刻', 'MR 交互', '巡检', '工单', '技术服务', '系统'].map((x) => ({ value: x, label: x }))} />
            <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>共 {list.length} 条</span>
          </div>
        }
      >
        <Table
          size="small"
          rowKey="id"
          dataSource={list}
          pagination={{ pageSize: 15, size: 'small' }}
          columns={[
            { title: '时间', dataIndex: 'createdAt', width: 140, render: (v: string) => <span className="num" style={{ fontSize: 11.5 }}>{fmtDateTime(v)}</span> },
            { title: '用户', dataIndex: 'userName', width: 80 },
            { title: '模块', dataIndex: 'module', width: 90, render: (v: string) => <Tag style={{ fontSize: 9.5 }}>{v}</Tag> },
            { title: '操作', dataIndex: 'action', width: 150 },
            { title: '对象', dataIndex: 'target', ellipsis: true },
            { title: 'IP', dataIndex: 'ip', width: 110, render: (v: string) => <span className="num" style={{ fontSize: 11 }}>{v}</span> },
            { title: '结果', dataIndex: 'result', width: 70, render: (v: string) => <span style={{ fontSize: 11, color: v === '成功' ? 'var(--ok)' : 'var(--danger)' }}>{v}</span> },
          ]}
        />
      </SectionCard>
    </div>
  )
}

export function Settings() {
  const { theme, setTheme } = useUI()
  const [plane, setPlane] = useState(30)
  const [height, setHeight] = useState(50)
  const [rms, setRms] = useState(3)
  const [water, setWater] = useState(80)
  const [confirm, setConfirm] = useState(false)

  return (
    <div>
      <PageHeader title="参数设置" desc="配置精度阈值、SLA、存储告警水位与界面偏好。阈值变更会影响质检判定与告警触发。" extra={<Button type="primary" icon={<SettingOutlined />} onClick={() => message.success('设置已保存')}>保存设置</Button>} />
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7">
          <SectionCard title="精度阈值">
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: '平面中误差 (mm)', v: plane, set: setPlane, min: 10, max: 60 },
                { l: '高程中误差 (mm)', v: height, set: setHeight, min: 20, max: 100 },
                { l: '配准 RMS (mm)', v: rms, set: setRms, min: 1, max: 10 },
              ].map((x) => (
                <div key={x.l}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 5 }}>{x.l}</div>
                  <Input type="number" value={x.v} min={x.min} max={x.max} onChange={(e) => x.set(Number(e.target.value))} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-tertiary)' }}>当前配置：平面 ±{plane} mm，高程 ±{height} mm，标定 RMS ≤ {rms} mm。超出阈值的批次将自动标记为不合格。</div>
          </SectionCard>

          <div style={{ marginTop: 12 }}>
            <SectionCard title="告警与时限">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 5 }}>存储告警水位 (%)</div>
                  <Input type="number" value={water} onChange={(e) => setWater(Number(e.target.value))} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 5 }}>工单默认 SLA（小时）</div>
                  <Input type="number" defaultValue={72} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 5 }}>会话超时（分钟）</div>
                  <Input type="number" defaultValue={30} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 5 }}>日志保留（天）</div>
                  <Input type="number" defaultValue={180} />
                </div>
              </div>
            </SectionCard>
          </div>

          <div style={{ marginTop: 12 }}>
            <SectionCard title="演示数据">
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                当前数据存储于浏览器本地（键前缀 mirrorfield.），刷新不会丢失。如需恢复初始演示数据，可执行重置。
              </div>
              <div className="flex items-center gap-2" style={{ marginTop: 12 }}>
                <Button danger icon={<ReloadOutlined />} onClick={() => setConfirm(true)}>重置演示数据</Button>
                <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>将清空所有新增与修改，恢复种子数据</span>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="col-span-5">
          <SectionCard title="界面偏好">
            <Field label="主题">
              <Select size="small" value={theme} onChange={(v) => setTheme(v as 'dark')} style={{ width: 160 }} options={[{ value: 'dark', label: '深色（默认）' }, { value: 'light', label: '浅色' }]} />
            </Field>
            <Field label="语言">简体中文</Field>
            <Field label="每页条数">20 条</Field>
            <Field label="三维默认视角">园区全景</Field>
            <Field label="数字动画">开启</Field>
          </SectionCard>

          <div style={{ marginTop: 12 }}>
            <SectionCard title="系统信息">
              <Field label="版本">v2.4.1（2026-10-16）</Field>
              <Field label="坐标系">CGCS2000 / 3-degree GK CM 120E</Field>
              <Field label="高程基准">1985 国家高程基准</Field>
              <Field label="运行模式">纯前端 · 本地 Mock</Field>
              <Field label="构建方式">Vite HashRouter（可桌面封装）</Field>
            </SectionCard>
          </div>
        </div>
      </div>

      <Modal
        title="确认重置演示数据"
        open={confirm}
        onCancel={() => setConfirm(false)}
        onOk={() => { resetAll(); setConfirm(false); message.success('演示数据已重置，页面即将刷新'); setTimeout(() => location.reload(), 700) }}
        okText="确认重置"
        okButtonProps={{ danger: true }}
      >
        <div style={{ fontSize: 12.5, lineHeight: 1.9 }}>
          此操作将清空当前浏览器中保存的所有工单、标注、标定记录与订单变更，并恢复到初始种子数据。该操作不可撤销。
        </div>
      </Modal>
    </div>
  )
}

export default { Org, Users, Roles, Logs, Settings }
