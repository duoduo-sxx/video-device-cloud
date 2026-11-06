import { useState } from 'react'
import { Check, Copy, Eye, EyeOff, KeyRound, RotateCcw, Trash2 } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Badge, Button, Input, KV, Panel, Select, Switch } from '../components/ui'
import { formatDate, formatDateTime } from '../lib/format'
import type { OutputFormat, OutputSpec } from '../types'
import { cn } from '../lib/utils'

type TabKey = 'profile' | 'notify' | 'defaults' | 'storage' | 'keys' | 'about'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: '个人资料' },
  { key: 'notify', label: '通知规则' },
  { key: 'defaults', label: '默认输出参数' },
  { key: 'storage', label: '存储与缓存' },
  { key: 'keys', label: 'API 密钥' },
  { key: 'about', label: '关于' },
]

export default function Settings() {
  const settings = useDataStore((s) => s.settings)
  const updateSettings = useDataStore((s) => s.updateSettings)
  const resetDemo = useDataStore((s) => s.resetDemo)
  const presets = useDataStore((s) => s.presets)
  const toast = useAppStore((s) => s.toast)
  const [tab, setTab] = useState<TabKey>('profile')
  const [visible, setVisible] = useState<string[]>([])

  return (
    <div className="animate-fadeUp">
      <PageHeader title="设置" desc="个人偏好、默认参数与集成密钥。所有设置保存在本机，不上传。" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        <Panel className="h-fit p-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex w-full items-center rounded-md px-3 py-2 text-left text-[12.5px] transition-colors',
                tab === t.key ? 'bg-[#182031] text-ink' : 'text-muted hover:bg-[#151a23] hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </Panel>

        <div className="space-y-4">
          {tab === 'profile' && (
            <Panel className="p-5">
              <div className="mb-4 text-[13px] text-ink">个人资料</div>
              <div className="grid max-w-[560px] grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[11.5px] text-muted">姓名</label>
                  <Input value={settings.profile.name} onChange={(e) => updateSettings({ profile: { ...settings.profile, name: e.target.value } })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] text-muted">邮箱</label>
                  <Input value={settings.profile.email} onChange={(e) => updateSettings({ profile: { ...settings.profile, email: e.target.value } })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] text-muted">时区</label>
                  <Select value={settings.profile.timezone} onChange={(e) => updateSettings({ profile: { ...settings.profile, timezone: e.target.value } })}>
                    <option>GMT+8 北京时间</option>
                    <option>GMT+9 东京时间</option>
                    <option>GMT+0 格林尼治</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] text-muted">角色</label>
                  <Input value="管理员" disabled />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="primary" onClick={() => toast('success', '资料已保存', '顶栏显示将同步更新')}>
                  保存修改
                </Button>
                <span className="text-[11px] text-dim">上次修改：{formatDate('2026-09-28')}</span>
              </div>
            </Panel>
          )}

          {tab === 'notify' && (
            <Panel className="p-5">
              <div className="mb-1 text-[13px] text-ink">通知规则</div>
              <div className="mb-4 text-[11px] text-dim">关闭后仅在通知中心保留，不发送邮件与桌面提醒。</div>
              <div className="max-w-[560px] divide-y divide-[#1a1f29]">
                {[
                  ['jobDone', '任务完成', '渲染与质检全部通过时提醒'],
                  ['jobFailed', '任务失败', '任意阶段失败或超时时立即提醒'],
                  ['slaBreach', '工单 SLA 超时', '超时与即将超时（剩余 20%）时提醒'],
                  ['deliveryDue', '交付到期提醒', '项目交期前 3 天每日提醒'],
                ].map(([key, label, desc]) => (
                  <div key={key} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-[12.5px] text-ink">{label}</div>
                      <div className="mt-0.5 text-[10.5px] text-dim">{desc}</div>
                    </div>
                    <Switch
                      checked={Boolean(settings.notifications[key as keyof typeof settings.notifications])}
                      onChange={(v) => {
                        updateSettings({ notifications: { ...settings.notifications, [key]: v } })
                        toast('success', v ? '已开启提醒' : '已关闭提醒', label as string)
                      }}
                    />
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {tab === 'defaults' && (
            <Panel className="p-5">
              <div className="mb-1 text-[13px] text-ink">默认输出参数</div>
              <div className="mb-4 text-[11px] text-dim">新建任务向导会使用这里的默认值。</div>
              <div className="grid max-w-[640px] grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[11.5px] text-muted">输出格式</label>
                  <Select
                    value={settings.defaults.format}
                    onChange={(e) => updateSettings({ defaults: { ...settings.defaults, format: e.target.value as OutputFormat } })}
                  >
                    <option value="MV-HEVC">MV-HEVC</option>
                    <option value="SBS-Full">SBS 全宽</option>
                    <option value="SBS-Half">SBS 半宽</option>
                    <option value="OU">上下 3D</option>
                    <option value="Anaglyph">红蓝立体</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] text-muted">分辨率</label>
                  <Select
                    value={settings.defaults.resolution}
                    onChange={(e) => updateSettings({ defaults: { ...settings.defaults, resolution: e.target.value as OutputSpec['resolution'] } })}
                  >
                    <option value="source">保持原始</option>
                    <option value="3840x2160">3840 × 2160</option>
                    <option value="7680x4320">7680 × 4320</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] text-muted">默认预设</label>
                  <Select
                    value={settings.defaults.presetId}
                    onChange={(e) => updateSettings({ defaults: { ...settings.defaults, presetId: e.target.value } })}
                  >
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] text-muted">容器</label>
                  <Input value=".mov（与格式绑定）" disabled />
                </div>
              </div>
              <Button className="mt-4" variant="primary" onClick={() => toast('success', '默认参数已保存', '下次新建任务生效')}>
                保存
              </Button>
            </Panel>
          )}

          {tab === 'storage' && (
            <Panel className="p-5">
              <div className="mb-3 text-[13px] text-ink">存储与缓存</div>
              <div className="max-w-[560px] divide-y divide-[#1a1f29]">
                <KV label="工作目录" mono>
                  {settings.storage.rootPath}
                </KV>
                <KV label="缓存占用" mono>
                  {settings.storage.cacheGB.toFixed(1)} GB
                </KV>
                <KV label="素材总量" mono>
                  {useDataStore.getState().assets.reduce((s, a) => s + a.sizeGB, 0).toFixed(1)} GB
                </KV>
                <KV label="已用配额" mono>
                  3.84 TB / 8 TB
                </KV>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => {
                    updateSettings({ storage: { ...settings.storage, cacheGB: 0 } })
                    toast('success', '缓存已清理', '释放 42.6 GB 空间')
                  }}
                >
                  清理缓存
                </Button>
                <Button
                  variant="ghost"
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  onClick={() => {
                    resetDemo()
                  }}
                >
                  重置演示数据
                </Button>
              </div>
              <div className="mt-2 text-[10.5px] leading-5 text-dim">
                重置会清除本机所有修改（任务进度、新建记录、设置项），并恢复初始演示数据。
              </div>
            </Panel>
          )}

          {tab === 'keys' && (
            <Panel className="p-5">
              <div className="mb-1 flex items-center gap-2 text-[13px] text-ink">
                <KeyRound className="h-3.5 w-3.5 text-dim" /> API 密钥
              </div>
              <div className="mb-4 text-[11px] text-dim">仅用于转码调度与客户门户集成。密钥创建后仅显示一次完整值。</div>
              <div className="space-y-2">
                {settings.apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center gap-3 rounded-lg border border-line-subtle px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] text-ink">{k.label}</div>
                      <div className="mono mt-0.5 text-[11px] text-dim">
                        {visible.includes(k.id) ? k.key : k.key.slice(0, 8) + '••••••••••••' + k.key.slice(-4)}
                      </div>
                    </div>
                    <span className="text-[10.5px] text-dim">最近使用 {k.lastUsedAt ? formatDateTime(k.lastUsedAt) : '未使用'}</span>
                    <button
                      onClick={() => setVisible((v) => (v.includes(k.id) ? v.filter((x) => x !== k.id) : [...v, k.id]))}
                      className="text-dim hover:text-ink"
                      aria-label="显示或隐藏密钥"
                    >
                      {visible.includes(k.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(k.key).catch(() => undefined)
                        toast('success', '密钥已复制', '请妥善保管，不要提交到代码仓库')
                      }}
                      className="text-dim hover:text-ink"
                      aria-label="复制密钥"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        updateSettings({ apiKeys: settings.apiKeys.filter((x) => x.id !== k.id) })
                        toast('warning', '密钥已吊销', k.label)
                      }}
                      className="text-dim hover:text-danger"
                      aria-label="吊销密钥"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                className="mt-4"
                onClick={() => {
                  const key = `sk_live_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`
                  updateSettings({
                    apiKeys: [
                      ...settings.apiKeys,
                      { id: `key_${Date.now()}`, label: `新密钥 ${settings.apiKeys.length + 1}`, key, createdAt: new Date().toISOString() },
                    ],
                  })
                  toast('success', '密钥已创建', '请立即复制保存，关闭后不可再次查看')
                }}
              >
                创建密钥
              </Button>
            </Panel>
          )}

          {tab === 'about' && (
            <Panel className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#3d7dff,#22d3ee)' }}>
                  <span className="text-[16px] font-semibold text-[#04121f]">S</span>
                </span>
                <div>
                  <div className="text-[14px] text-ink">SpaceScape Studio</div>
                  <div className="text-[11px] text-dim">空间视频转换系统及技术服务</div>
                </div>
                <Badge tone="success" className="ml-2">
                  <Check className="h-3 w-3" /> 已激活
                </Badge>
              </div>
              <div className="max-w-[560px] divide-y divide-[#1a1f29]">
                <KV label="版本" mono>
                  v1.0.0
                </KV>
                <KV label="构建号" mono>
                  20261019.1
                </KV>
                <KV label="许可" mono>
                  Enterprise · 12 席位
                </KV>
                <KV label="到期">{formatDate('2027-10-19')}</KV>
              </div>
              <div className="mt-4 text-[11px] leading-6 text-dim">
                第三方组件：React 18 · Vite 5 · Tailwind CSS 3.4 · Recharts 2.12 · Zustand 4.5 · lucide-react · date-fns 3.6。
                <br />
                本演示版本的全部数据均为本地 Mock，不含真实转码与上传能力。
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
