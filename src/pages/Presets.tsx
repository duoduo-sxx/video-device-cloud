import { useState } from 'react'
import { Copy, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Badge, Button, Drawer, Input, Modal, Panel, Select, Slider, Switch, Textarea } from '../components/ui'
import { defaultParams } from '../lib/calc'
import { formatDate } from '../lib/format'
import type { ConvertParams, Preset } from '../types'
import { cn } from '../lib/utils'

export default function Presets() {
  const presets = useDataStore((s) => s.presets)
  const savePreset = useDataStore((s) => s.savePreset)
  const deletePreset = useDataStore((s) => s.deletePreset)
  const setDefaultPreset = useDataStore((s) => s.setDefaultPreset)
  const toast = useAppStore((s) => s.toast)

  const [editing, setEditing] = useState<Preset | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleting, setDeleting] = useState<Preset | null>(null)
  const [compare, setCompare] = useState<string[]>([])

  const openNew = () => {
    const now = new Date().toISOString()
    setEditing({
      id: `prs_${Date.now()}`,
      name: '',
      scene: '',
      desc: '',
      params: defaultParams(),
      isDefault: false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    setIsNew(true)
  }

  const commit = () => {
    if (!editing) return
    if (!editing.name.trim()) {
      toast('error', '请填写预设名称')
      return
    }
    savePreset({ ...editing, updatedAt: new Date().toISOString() })
    toast('success', isNew ? '预设已创建' : '预设已更新', `${editing.name} 可在新建任务向导中直接套用`)
    setEditing(null)
    setIsNew(false)
  }

  const params: [keyof ConvertParams, string, number, number, string][] = [
    ['disparity', '视差强度', 0, 100, ''],
    ['convergence', '收敛面', -50, 50, ''],
    ['temporalSmooth', '时域平滑', 0, 100, ''],
    ['edgePreserve', '边缘保护', 0, 100, ''],
    ['depthDetail', '深度细节', 0, 100, ''],
  ]

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="参数预设"
        desc="把反复微调的参数固化成预设。新建任务时可直接套用，避免每次从零开始。"
        actions={
          <>
            <Button
              disabled={compare.length < 2}
              onClick={() => {
                if (compare.length >= 2) toast('info', '对比模式', `已选择 ${compare.length} 个预设，差异项将高亮`)
              }}
            >
              对比所选
            </Button>
            <Button variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={openNew}>
              新建预设
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {presets.map((p) => {
          const selectedForCompare = compare.includes(p.id)
          return (
            <Panel
              key={p.id}
              className={cn('flex flex-col p-4 transition-colors', selectedForCompare && 'border-primary/50')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] text-ink">{p.name}</span>
                    {p.isDefault && <Badge tone="primary">默认</Badge>}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-[#1b212c] px-1.5 py-0.5 text-[10px] text-dim">{p.scene}</span>
                    <span className="text-[10.5px] text-dim">用过 {p.usageCount} 次</span>
                  </div>
                </div>
                <button
                  onClick={() => setCompare((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id].slice(0, 3)))}
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px]',
                    selectedForCompare ? 'border-primary bg-primary text-white' : 'border-line text-transparent',
                  )}
                  aria-label="选择对比"
                >
                  ✓
                </button>
              </div>

              <p className="mt-2.5 min-h-[40px] text-[11.5px] leading-5 text-muted">{p.desc}</p>

              <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg border border-line-subtle bg-[#0e1118] p-2.5">
                {[
                  ['视差', p.params.disparity],
                  ['收敛', p.params.convergence],
                  ['平滑', p.params.temporalSmooth],
                ].map(([l, v]) => (
                  <div key={String(l)}>
                    <div className="text-[10px] text-dim">{l}</div>
                    <div className="mono mt-0.5 text-[13px] text-ink">{v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-3 text-[10.5px] text-dim">
                <span>{p.params.depthModel}</span>
                <span className="text-[#2a3140]">·</span>
                <span>更新于 {formatDate(p.updatedAt)}</span>
              </div>

              <div className="mt-3 flex items-center gap-1 border-t border-line-subtle pt-2.5">
                <Button size="sm" variant="ghost" icon={<Pencil className="h-3 w-3" />} onClick={() => { setEditing({ ...p }); setIsNew(false) }}>
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Copy className="h-3 w-3" />}
                  onClick={() => {
                    const copy: Preset = { ...p, id: `prs_${Date.now()}`, name: `${p.name} 副本`, isDefault: false, usageCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
                    savePreset(copy)
                    toast('success', '已复制预设', copy.name)
                  }}
                >
                  复制
                </Button>
                <div className="ml-auto flex items-center gap-1">
                  {!p.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Star className="h-3 w-3" />}
                      onClick={() => {
                        setDefaultPreset(p.id)
                        toast('success', '已设为默认预设', `新建任务将默认套用 ${p.name}`)
                      }}
                    >
                      设为默认
                    </Button>
                  )}
                  {!p.isDefault && (
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(p)} aria-label="删除预设">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          )
        })}

        <button
          onClick={openNew}
          className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line text-dim transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Plus className="h-5 w-5" />
          <span className="text-[12px]">新建预设</span>
        </button>
      </div>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? '新建预设' : '编辑预设'}
        width={480}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditing(null)}>取消</Button>
            <Button variant="primary" onClick={commit}>
              保存预设
            </Button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11.5px] text-muted">预设名称</label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="例如：纪录片柔和平移" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] text-muted">适用场景</label>
              <Input value={editing.scene} onChange={(e) => setEditing({ ...editing, scene: e.target.value })} placeholder="例如：纪录片 / 访谈" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] text-muted">说明</label>
              <Textarea rows={2} value={editing.desc} onChange={(e) => setEditing({ ...editing, desc: e.target.value })} placeholder="一句话说明这个预设解决什么问题" />
            </div>

            <div className="space-y-4 rounded-lg border border-line-subtle p-3">
              {params.map(([key, label, min, max]) => (
                <Slider
                  key={key}
                  label={label}
                  value={Number(editing.params[key])}
                  min={min}
                  max={max}
                  onChange={(v) => setEditing({ ...editing, params: { ...editing.params, [key]: v } })}
                />
              ))}
              <div>
                <label className="mb-1.5 block text-[11.5px] text-muted">深度模型</label>
                <Select
                  value={editing.params.depthModel}
                  onChange={(e) => setEditing({ ...editing, params: { ...editing.params, depthModel: e.target.value as ConvertParams['depthModel'] } })}
                >
                  <option value="SpaceScape-Depth V3">SpaceScape-Depth V3</option>
                  <option value="SpaceScape-Depth V2 Lite">SpaceScape-Depth V2 Lite</option>
                  <option value="MiDaS-Outdoor">MiDaS-Outdoor</option>
                  <option value="DepthPro-Studio">DepthPro-Studio</option>
                </Select>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={editing.params.faceProtect} onChange={(v) => setEditing({ ...editing, params: { ...editing.params, faceProtect: v } })} />
                  <span className="text-[11.5px] text-muted">人脸保护</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.params.deflicker} onChange={(v) => setEditing({ ...editing, params: { ...editing.params, deflicker: v } })} />
                  <span className="text-[11.5px] text-muted">去闪烁</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={editing.isDefault} onChange={(v) => setEditing({ ...editing, isDefault: v })} />
              <span className="text-[11.5px] text-muted">设为默认预设（全局唯一）</span>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="删除预设"
        desc="删除后无法恢复，已使用该预设的历史任务不受影响。"
        footer={
          <>
            <Button onClick={() => setDeleting(null)}>取消</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting) {
                  deletePreset(deleting.id)
                  toast('success', '预设已删除', deleting.name)
                }
                setDeleting(null)
              }}
            >
              确认删除
            </Button>
          </>
        }
      >
        <div className="rounded-md border border-line-subtle bg-[#0e1118] px-3 py-2 text-[12px] text-muted">
          {deleting?.name}
        </div>
      </Modal>
    </div>
  )
}
