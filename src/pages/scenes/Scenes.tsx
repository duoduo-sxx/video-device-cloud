import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Play, Search, Sparkles, Sunrise, Presentation, Film, MoonStar, ShieldAlert, Leaf, Compass, LogOut, Layers } from 'lucide-react'
import dayjs from 'dayjs'
import { PageHeader, Panel, EmptyState } from '@/components/common'
import { Button, Input, Switch, Segmented, Tag } from '@/components/ui/primitives'
import { SceneRunner } from '@/components/biz/SceneRunner'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/misc'

const SCENE_ICONS: Record<string, typeof Sunrise> = {
  Sunrise,
  Presentation,
  Film,
  MoonStar,
  ShieldAlert,
  Leaf,
  Compass,
  LogOut,
}

export default function Scenes() {
  const db = useDataStore((s) => s.db)
  const toggleScene = useDataStore((s) => s.toggleSceneEnabled)
  const toast = useUIStore((s) => s.toast)
  const navigate = useNavigate()
  const [kw, setKw] = useState('')
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [running, setRunning] = useState<string | null>(null)

  const list = db.scenes.filter((s) => {
    if (filter === 'enabled' && !s.enabled) return false
    if (filter === 'disabled' && s.enabled) return false
    if (kw && !s.name.includes(kw) && !s.description.includes(kw)) return false
    return true
  })

  const scene = db.scenes.find((s) => s.id === running) ?? null

  return (
    <>
      <PageHeader
        title="场景编排"
        sub="将多台设备的动作组织为一个可一键触发的场景"
        actions={
          <>
            <Segmented
              options={[
                { label: '全部', value: 'all' },
                { label: '已启用', value: 'enabled' },
                { label: '已停用', value: 'disabled' },
              ]}
              value={filter}
              onChange={(v) => setFilter(v as typeof filter)}
            />
            <div className="w-[200px]">
              <Input icon={<Search size={13} />} placeholder="搜索场景" value={kw} onChange={(e) => setKw(e.target.value)} />
            </div>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        {list.map((s) => {
          const Icon = SCENE_ICONS[s.icon] ?? Sparkles
          const space = db.spaces.find((x) => x.id === s.spaceId)
          return (
            <div key={s.id} className="panel overflow-hidden flex flex-col group">
              <div className="relative h-[84px] bg-panel2/60 border-b border-subtle overflow-hidden">
                <div className="absolute inset-0 app-grid-bg opacity-60" />
                <div className="absolute inset-0 p-3 flex flex-wrap gap-1 content-start">
                  {Array.from({ length: Math.min(24, s.deviceCount * 2) }).map((_, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: i % 7 === 0 ? 'var(--brand)' : 'var(--border-strong)',
                        opacity: 0.4 + (i % 3) * 0.2,
                      }}
                    />
                  ))}
                </div>
                <span className="absolute top-2.5 right-2.5 w-8 h-8 rounded-card bg-panel/80 border border-strong flex items-center justify-center text-brand backdrop-blur-sm">
                  <Icon size={15} />
                </span>
                {s.riskLevel === 'high' && (
                  <span className="absolute top-2.5 left-2.5">
                    <Tag color="var(--danger)">高风险</Tag>
                  </span>
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => navigate(`/scenes/${s.id}`)} className="text-sm text-ink hover:text-brand transition-colors text-left truncate">
                    {s.name}
                  </button>
                  <Switch checked={s.enabled} onChange={() => toggleScene(s.id)} label="启用场景" />
                </div>
                <p className="text-2xs text-ink-mute mt-1.5 leading-relaxed line-clamp-2">{s.description}</p>

                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  {s.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                  <Tag>{space?.building} {space && space.floor > 0 ? `${space.floor}F` : 'B1'}</Tag>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-subtle text-2xs text-ink-mute num">
                  <span className="flex items-center gap-1"><Layers size={10} />{s.steps.length} 步</span>
                  <span>{s.deviceCount} 台</span>
                  <span>已用 {s.usedCount} 次</span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-ink-mute">
                    {s.lastRunAt ? `上次 ${dayjs(s.lastRunAt).format('MM-DD HH:mm')}` : '尚未执行'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Copy size={12} />}
                      onClick={() => toast('success', '已克隆场景', '副本已加入列表（演示未持久化）')}
                    >
                      克隆
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Play size={12} />}
                      disabled={!s.enabled}
                      onClick={() => setRunning(s.id)}
                    >
                      执行
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {list.length === 0 && (
          <div className="col-span-3">
            <Panel>
              <EmptyState title="没有符合条件的场景" desc="试试调整筛选条件或清空搜索" />
            </Panel>
          </div>
        )}
      </div>

      <SceneRunner
        scene={scene}
        onClose={() => setRunning(null)}
        onFinish={() => {
          if (scene) toast('success', '场景执行完成', `「${scene.name}」共 ${scene.steps.length} 个步骤`)
        }}
      />
    </>
  )
}
