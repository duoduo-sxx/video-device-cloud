import { useState } from 'react'
import { Save, ShieldCheck } from 'lucide-react'
import { PageHeader, Panel } from '@/components/common'
import { Button, Tag } from '@/components/ui/primitives'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { MODULE_PERMISSIONS } from '@/constants/nav'
import { ROLE_LABEL } from '@/constants/enums'
import { cn } from '@/utils/misc'
import type { Role } from '@/types'

const ROLES: Role[] = ['operator', 'engineer', 'manager', 'guest']

const DEFAULT: Record<Role, string[]> = {
  manager: MODULE_PERMISSIONS.map((m) => m.key),
  operator: ['dashboard', 'interaction', 'devices', 'scenes', 'tasks', 'alerts', 'service', 'analytics', 'settings'],
  engineer: ['dashboard', 'interaction', 'devices', 'scenes', 'tasks', 'alerts', 'service', 'analytics', 'audit', 'settings'],
  guest: ['dashboard', 'interaction', 'devices', 'service', 'about'],
}

export default function Roles() {
  const db = useDataStore((s) => s.db)
  const toast = useUIStore((s) => s.toast)
  const [matrix, setMatrix] = useState<Record<Role, string[]>>(DEFAULT)
  const [dirty, setDirty] = useState(false)

  const toggle = (role: Role, key: string) => {
    setMatrix((m) => ({
      ...m,
      [role]: m[role].includes(key) ? m[role].filter((x) => x !== key) : [...m[role], key],
    }))
    setDirty(true)
  }

  return (
    <>
      <PageHeader
        title="权限矩阵"
        sub="按模块配置各角色的访问权限，保存后立即生效"
        actions={
          <Button
            variant="primary"
            icon={<Save size={14} />}
            disabled={!dirty}
            onClick={() => {
              setDirty(false)
              toast('success', '权限已保存', '角色可访问的模块已同步（演示环境仅提示）')
            }}
          >
            保存变更
          </Button>
        }
      />

      {dirty && (
        <div className="mb-3 rounded-card border border-warn/35 bg-warn/[0.07] px-3.5 py-2.5 flex items-center gap-2 text-xs text-warn">
          <ShieldCheck size={13} />
          存在未保存的权限变更，刷新页面将丢失
        </div>
      )}

      <Panel bodyClass="p-0" className="flex-1 min-h-0">
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-panel2">
                <th className="h-11 px-4 text-left text-xs font-medium text-ink-soft border-b border-subtle w-[220px]">功能模块</th>
                {ROLES.map((r) => (
                  <th key={r} className="h-11 px-4 text-center text-xs font-medium text-ink-soft border-b border-subtle">
                    <div>{ROLE_LABEL[r]}</div>
                    <div className="text-[10px] text-ink-mute num mt-0.5">{matrix[r].length} / {MODULE_PERMISSIONS.length}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULE_PERMISSIONS.map((m) => (
                <tr key={m.key} className="border-b border-subtle hover:bg-brand/[0.03] transition-colors">
                  <td className="h-11 px-4 text-sm text-ink">{m.label}</td>
                  {ROLES.map((r) => {
                    const checked = matrix[r].includes(m.key)
                    const locked = r === 'manager'
                    return (
                      <td key={r} className="h-11 px-4 text-center">
                        <button
                          disabled={locked}
                          onClick={() => toggle(r, m.key)}
                          aria-label={`${ROLE_LABEL[r]} - ${m.label}`}
                          className={cn(
                            'w-4 h-4 rounded border inline-flex items-center justify-center transition-colors',
                            checked ? 'bg-brand border-brand' : 'border-strong bg-panel2',
                            locked && 'opacity-60 cursor-not-allowed',
                          )}
                        >
                          {checked && (
                            <svg viewBox="0 0 12 12" className="w-3 h-3 text-canvas" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2.5 6.2L4.8 8.5L9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="h-11 px-4 flex items-center justify-between border-t border-subtle text-2xs text-ink-mute">
          <span>中心主管默认拥有全部模块权限，不可取消</span>
          <span className="num">当前账号数：{db.users.length}</span>
        </div>
      </Panel>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-2xs text-ink-mute">角色说明：</span>
        {ROLES.map((r) => (
          <Tag key={r} color={r === 'manager' ? 'var(--success)' : r === 'engineer' ? 'var(--accent)' : r === 'operator' ? 'var(--brand)' : 'var(--warning)'}>
            {ROLE_LABEL[r]}
          </Tag>
        ))}
      </div>
    </>
  )
}
