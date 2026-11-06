import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Dropdown, Input, Menu, Popover, Select, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import {
  BellOutlined, BoxPlotOutlined, BugOutlined, CloudServerOutlined,
  DashboardOutlined, DeploymentUnitOutlined,
  FundProjectionScreenOutlined, MenuFoldOutlined, MenuUnfoldOutlined, NodeIndexOutlined,
  SearchOutlined, SettingOutlined, TeamOutlined, UserOutlined,
} from '@ant-design/icons'
import { useAuth, useUI, type ModuleKey } from '@/stores'
import { ROLES } from '@/mock'
import { api } from '@/services'
import { fromNow } from '@/utils'

const ROUTE_META: Record<string, { title: string; parent?: string }> = {
  '/': { title: '总览驾驶舱' },
  '/data/tasks': { title: '采集任务', parent: '数据采集' },
  '/data/datasets': { title: '数据集管理', parent: '数据采集' },
  '/data/quality': { title: '质量与精度', parent: '数据采集' },
  '/recon/viewer': { title: '三维查看器', parent: '三维复刻' },
  '/recon/assets': { title: '模型资产', parent: '三维复刻' },
  '/recon/compare': { title: '偏差对比', parent: '三维复刻' },
  '/recon/publish': { title: '场景发布', parent: '三维复刻' },
  '/mr/devices': { title: '设备管理', parent: 'MR 虚实交互' },
  '/mr/calibration': { title: '空间标定', parent: 'MR 虚实交互' },
  '/mr/authoring': { title: '交互编排', parent: 'MR 虚实交互' },
  '/mr/collab': { title: '远程协同', parent: 'MR 虚实交互' },
  '/mr/sessions': { title: '会话记录', parent: 'MR 虚实交互' },
  '/inspect/plans': { title: '巡检计划', parent: '巡检运维' },
  '/inspect/records': { title: '巡检记录', parent: '巡检运维' },
  '/inspect/defects': { title: '缺陷管理', parent: '巡检运维' },
  '/tickets': { title: '工单中心' },
  '/service/catalog': { title: '服务目录', parent: '技术服务' },
  '/service/orders': { title: '服务订单', parent: '技术服务' },
  '/service/delivery': { title: '交付与验收', parent: '技术服务' },
  '/service/knowledge': { title: '知识库', parent: '技术服务' },
  '/system/org': { title: '组织架构', parent: '系统管理' },
  '/system/users': { title: '用户管理', parent: '系统管理' },
  '/system/roles': { title: '角色权限', parent: '系统管理' },
  '/system/logs': { title: '操作日志', parent: '系统管理' },
  '/system/settings': { title: '参数设置', parent: '系统管理' },
}

export default function BasicLayout() {
  const { collapsed, toggle, theme } = useUI()
  const { roleId, setRole, can, userName } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const items: MenuProps['items'] = useMemo(() => {
    type MenuItem = NonNullable<MenuProps['items']>[number] & { perm?: ModuleKey }
    const all: MenuItem[] = [
      { key: '/', icon: <DashboardOutlined />, label: '总览驾驶舱', perm: 'dashboard' },
      {
        key: 'data', icon: <CloudServerOutlined />, label: '数据采集', perm: 'data',
        children: [
          { key: '/data/tasks', label: '采集任务' },
          { key: '/data/datasets', label: '数据集管理' },
          { key: '/data/quality', label: '质量与精度' },
        ],
      },
      {
        key: 'recon', icon: <BoxPlotOutlined />, label: '三维复刻', perm: 'recon',
        children: [
          { key: '/recon/viewer', label: '三维查看器' },
          { key: '/recon/assets', label: '模型资产' },
          { key: '/recon/compare', label: '偏差对比' },
          { key: '/recon/publish', label: '场景发布' },
        ],
      },
      {
        key: 'mr', icon: <DeploymentUnitOutlined />, label: 'MR 虚实交互', perm: 'mr',
        children: [
          { key: '/mr/devices', label: '设备管理' },
          { key: '/mr/calibration', label: '空间标定' },
          { key: '/mr/authoring', label: '交互编排' },
          { key: '/mr/collab', label: '远程协同' },
          { key: '/mr/sessions', label: '会话记录' },
        ],
      },
      {
        key: 'inspect', icon: <NodeIndexOutlined />, label: '巡检运维', perm: 'inspect',
        children: [
          { key: '/inspect/plans', label: '巡检计划' },
          { key: '/inspect/records', label: '巡检记录' },
          { key: '/inspect/defects', label: '缺陷管理' },
        ],
      },
      { key: '/tickets', icon: <BugOutlined />, label: '工单中心', perm: 'ticket' },
      {
        key: 'service', icon: <FundProjectionScreenOutlined />, label: '技术服务', perm: 'service',
        children: [
          { key: '/service/catalog', label: '服务目录' },
          { key: '/service/orders', label: '服务订单' },
          { key: '/service/delivery', label: '交付与验收' },
          { key: '/service/knowledge', label: '知识库' },
        ],
      },
      {
        key: 'system', icon: <SettingOutlined />, label: '系统管理', perm: 'system',
        children: [
          { key: '/system/org', label: '组织架构' },
          { key: '/system/users', label: '用户管理' },
          { key: '/system/roles', label: '角色权限' },
          { key: '/system/logs', label: '操作日志' },
          { key: '/system/settings', label: '参数设置' },
        ],
      },
    ]
    return all
      .filter((m) => !m.perm || can(m.perm))
      .map(({ perm: _perm, ...rest }) => rest)
  }, [can, roleId])

  const meta = ROUTE_META[loc.pathname] ?? { title: '页面' }
  const openKey = loc.pathname.split('/')[1]

  const results = useMemo(() => {
    if (!q.trim()) return []
    const kw = q.trim()
    const d = api
    const r: { label: string; path: string; group: string }[] = []
    d.assets.all().filter((a) => a.name.includes(kw)).slice(0, 4).forEach((a) => r.push({ label: `${a.buildingCode} ${a.name}`, path: '/recon/assets', group: '模型资产' }))
    d.devices.all().filter((x) => x.name.includes(kw) || x.model.includes(kw)).slice(0, 3).forEach((x) => r.push({ label: `${x.name} · ${x.model}`, path: '/mr/devices', group: 'MR 设备' }))
    d.tickets.all().filter((t) => t.title.includes(kw) || t.id.includes(kw)).slice(0, 4).forEach((t) => r.push({ label: `${t.id} ${t.title}`, path: `/tickets/${t.id}`, group: '工单' }))
    d.orders.all().filter((o) => o.id.includes(kw) || o.client.includes(kw)).slice(0, 3).forEach((o) => r.push({ label: `${o.id} ${o.client}`, path: `/service/orders/${o.id}`, group: '服务订单' }))
    d.plans.all().filter((p) => p.name.includes(kw)).slice(0, 3).forEach((p) => r.push({ label: `${p.id} ${p.name}`, path: `/inspect/plans/${p.id}`, group: '巡检计划' }))
    return r.slice(0, 10)
  }, [q])

  const notifications = api.notifications.all()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      <aside
        style={{
          width: collapsed ? 64 : 232,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          transition: 'width .2s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="flex items-center gap-2.5" style={{ height: 56, padding: collapsed ? '0 18px' : '0 18px', borderBottom: '1px solid var(--border)' }}>
          <svg width="26" height="26" viewBox="0 0 32 32">
            <path d="M16 3l11 6.2v13.6L16 29 5 22.8V9.2z" fill="none" stroke="var(--brand)" strokeWidth="1.5" />
            <path d="M16 3v26M5 9.2l11 6.3 11-6.3" fill="none" stroke="var(--brand)" strokeWidth="1" opacity=".55" />
            <circle cx="16" cy="15.5" r="2.2" fill="var(--brand)" />
          </svg>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.06em' }}>镜域 MirrorField</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>三维复刻 · MR 虚实交互</div>
            </div>
          )}
        </div>

        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[loc.pathname]}
          defaultOpenKeys={collapsed ? [] : [openKey]}
          items={items}
          onClick={({ key }) => {
            if (String(key).startsWith('/')) nav(String(key))
          }}
          style={{ background: 'transparent', borderInlineEnd: 'none', flex: 1, overflowY: 'auto', paddingTop: 8, fontSize: 13 }}
        />

        <div style={{ borderTop: '1px solid var(--border)', padding: collapsed ? 10 : 14 }}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <Avatar size={30} style={{ background: 'rgba(34,211,238,0.16)', color: 'var(--brand)', fontSize: 12 }}>
                {userName.slice(0, 1)}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{userName}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{ROLES.find((r) => r.id === roleId)?.name}</div>
              </div>
            </div>
          ) : (
            <Avatar size={28} style={{ background: 'rgba(34,211,238,0.16)', color: 'var(--brand)', fontSize: 12 }}>{userName.slice(0, 1)}</Avatar>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="flex items-center gap-3 shrink-0"
          style={{ height: 56, padding: '0 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
        >
          <button onClick={toggle} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 15 }}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>

          <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            <span>工作台</span>
            <span>/</span>
            {meta.parent && (
              <>
                <span>{meta.parent}</span>
                <span>/</span>
              </>
            )}
            <span style={{ color: 'var(--text-primary)' }}>{meta.title}</span>
          </div>

          <div className="flex-1" />

          <div style={{ width: 300, position: 'relative' }}>
            <AutoCompleteSearch value={q} onChange={setQ} results={results} onPick={(p) => { setQ(''); nav(p) }} />
          </div>

          <Popover
            open={notifOpen}
            onOpenChange={setNotifOpen}
            trigger="click"
            placement="bottomRight"
            content={
              <div style={{ width: 340 }}>
                <div className="flex items-center justify-between" style={{ padding: '4px 2px 10px' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>通知中心</span>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11.5, cursor: 'pointer' }}
                    onClick={() => { api.notifications.markAllRead(); setNotifOpen(false) }}
                  >
                    全部已读
                  </button>
                </div>
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  {notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { api.notifications.markRead(n.id); setNotifOpen(false); nav(n.link) }}
                      style={{ padding: '9px 6px', borderTop: '1px solid var(--border)', cursor: 'pointer', display: 'flex', gap: 8 }}
                    >
                      <span
                        style={{
                          width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0,
                          background: n.read ? 'transparent' : n.type === '告警' ? 'var(--danger)' : 'var(--brand)',
                          border: n.read ? '1px solid var(--border-strong)' : 'none',
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.3, lineHeight: 1.5 }}>{n.title}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 3 }}>{n.type} · {fromNow(n.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <Badge count={unread} size="small" offset={[-2, 2]}>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, padding: '4px 6px' }}>
                <BellOutlined />
              </button>
            </Badge>
          </Popover>

          <Tooltip title="演示用角色切换，切换后菜单与按钮权限即时生效">
            <Select
              size="small"
              value={roleId}
              onChange={setRole}
              style={{ width: 138 }}
              options={ROLES.map((r) => ({ value: r.id, label: r.name }))}
              suffixIcon={<TeamOutlined />}
            />
          </Tooltip>

          <Dropdown
            menu={{
              items: [
                { key: 'profile', label: '个人资料', icon: <UserOutlined /> },
                { key: 'setting', label: '参数设置', icon: <SettingOutlined /> },
                { type: 'divider' },
                { key: 'logout', label: '退出登录' },
              ],
              onClick: ({ key }) => {
                if (key === 'logout') nav('/login')
                if (key === 'setting') nav('/system/settings')
              },
            }}
          >
            <Avatar size={28} style={{ background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', fontSize: 12, cursor: 'pointer' }}>
              {userName.slice(0, 1)}
            </Avatar>
          </Dropdown>
        </header>

        <main className="flex-1 min-h-0 overflow-auto" style={{ padding: 20 }}>
          <div className="fade-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function AutoCompleteSearch({
  value,
  onChange,
  results,
  onPick,
}: {
  value: string
  onChange: (v: string) => void
  results: { label: string; path: string; group: string }[]
  onPick: (path: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="搜索建筑、设备、工单、订单  ⌘K"
        prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
        size="small"
        style={{ height: 30, fontSize: 12, background: 'var(--bg-panel)' }}
        allowClear
      />
      {open && value.trim() && (
        <div
          className="glass"
          style={{ position: 'absolute', top: 36, left: 0, right: 0, maxHeight: 340, overflowY: 'auto', zIndex: 1200, padding: 6 }}
        >
          {results.length === 0 && <div style={{ padding: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>无匹配结果，试试建筑编号或工单号</div>}
          {results.map((r, i) => (
            <div
              key={`${r.path}-${i}`}
              onMouseDown={() => onPick(r.path)}
              style={{ padding: '7px 9px', borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 8 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 12.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', flexShrink: 0 }}>{r.group}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
