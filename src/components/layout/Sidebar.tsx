import { NavLink, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Hexagon, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { NAV_GROUPS } from '@/constants/nav'
import { ROLE_LABEL } from '@/constants/enums'
import { useAppStore } from '@/stores/appStore'
import { useDataStore } from '@/stores/dataStore'
import { cn } from '@/utils/misc'
import { Avatar } from '@/components/common'
import { IconButton, Tooltip } from '@/components/ui/primitives'

export function Sidebar() {
  const { collapsed, toggleCollapsed, user, logout } = useAppStore()
  const db = useDataStore((s) => s.db)
  const location = useLocation()
  const openAlerts = db.alerts.filter((a) => a.status !== 'closed' && a.status !== 'recovered').length
  const pendingTasks = db.tasks.filter((t) => t.status === 'pending').length
  const pendingTickets = db.tickets.filter((t) => t.status === 'pending').length

  const badges: Record<string, number> = { alerts: openAlerts, tasks: pendingTasks, tickets: pendingTickets }

  const isActive = (path: string) => {
    const [p, q] = path.split('?')
    if (q) return location.pathname === p && location.search.includes(q)
    if (p === '/service') return location.pathname === '/service' && !location.search.includes('tab=kb')
    if (p === '/') return location.pathname === '/'
    if (p === '/service/tickets') return location.pathname.startsWith(p)
    return location.pathname === p || location.pathname.startsWith(p + '/')
  }

  return (
    <aside
      className={cn(
        'relative z-30 flex flex-col bg-panel border-r border-subtle transition-[width] duration-200 shrink-0',
        collapsed ? 'w-16' : 'w-[220px]',
      )}
    >
      <div className={cn('flex items-center h-14 shrink-0 border-b border-subtle', collapsed ? 'px-3 justify-center' : 'px-4 gap-2.5')}>
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-brand/25 to-accent/20 border border-brand/30 flex items-center justify-center shrink-0">
          <Hexagon size={16} className="text-brand" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink leading-tight truncate">智能控制中枢</div>
            <div className="text-2xs text-ink-mute leading-tight">ICE Platform</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.roles || (user && i.roles.includes(user.role)))
          if (!items.length) return null
          return (
            <div key={group.key}>
              {!collapsed && (
                <div className="px-2 mb-1.5 text-2xs text-ink-mute tracking-wider">{group.label}</div>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  const badge = item.badge ? badges[item.badge] : 0
                  const node = (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      className={cn(
                        'group relative flex items-center h-9 rounded-ctrl transition-colors duration-150 focus-ring',
                        collapsed ? 'justify-center' : 'px-2.5 gap-2.5',
                        active ? 'bg-brand/[0.12] text-brand' : 'text-ink-soft hover:bg-panel2 hover:text-ink',
                      )}
                    >
                      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-brand" />}
                      <Icon size={16} className="shrink-0" />
                      {!collapsed && <span className="text-sm truncate flex-1">{item.label}</span>}
                      {!collapsed && badge > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-bad/85 text-white text-2xs num flex items-center justify-center">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                      {collapsed && badge > 0 && (
                        <span className="absolute top-1.5 right-2.5 w-1.5 h-1.5 rounded-full bg-bad" />
                      )}
                    </NavLink>
                  )
                  return collapsed ? (
                    <Tooltip key={item.key} content={item.label}>
                      {node}
                    </Tooltip>
                  ) : (
                    node
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-subtle p-2">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1 rounded-ctrl hover:bg-panel2 transition-colors">
            <Avatar name={user.name} color={user.avatarColor} size={30} />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-ink truncate">{user.name}</div>
              <div className="text-2xs text-ink-mute truncate">{ROLE_LABEL[user.role]}</div>
            </div>
            <Tooltip content="退出登录">
              <button onClick={logout} aria-label="退出登录" className="text-ink-mute hover:text-bad transition-colors">
                <LogOut size={14} />
              </button>
            </Tooltip>
          </div>
        )}
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between px-1')}>
          {!collapsed && (
            <NavLink
              to="/settings"
              className="flex items-center gap-1.5 text-2xs text-ink-mute hover:text-ink transition-colors"
            >
              <SettingsIcon size={13} />
              系统设置
            </NavLink>
          )}
          <IconButton label={collapsed ? '展开导航' : '收起导航'} onClick={toggleCollapsed}>
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </IconButton>
        </div>
      </div>
    </aside>
  )
}
