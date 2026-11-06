import { useState } from 'react'
import { AlertTriangle, Database, MonitorCog, RotateCcw, Save, Settings2, Volume2 } from 'lucide-react'
import { PageHeader, Panel } from '@/components/common'
import { Button, Field, Input, Segmented, Select, Slider, Switch, Tag } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/overlay'
import { useAppStore } from '@/stores/appStore'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/misc'

const TABS = [
  { key: 'general', label: '常规', icon: Settings2 },
  { key: 'interaction', label: '交互', icon: Volume2 },
  { key: 'alert', label: '告警', icon: AlertTriangle },
  { key: 'data', label: '数据', icon: Database },
] as const

export default function Settings() {
  const { settings, updateSettings, theme, setTheme, resetSettings } = useAppStore()
  const resetData = useDataStore((s) => s.reset)
  const db = useDataStore((s) => s.db)
  const toast = useUIStore((s) => s.toast)
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('general')
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <>
      <PageHeader title="系统设置" sub="修改后立即生效，并保存在本地" />

      <div className="flex gap-3 flex-1 min-h-0">
        <aside className="w-[180px] shrink-0">
          <div className="panel p-1.5 space-y-0.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'w-full flex items-center gap-2 h-9 px-2.5 rounded-ctrl text-xs transition-colors',
                  tab === t.key ? 'bg-brand/[0.1] text-brand' : 'text-ink-soft hover:bg-panel2 hover:text-ink',
                )}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="panel p-3 mt-3">
            <div className="text-2xs text-ink-mute mb-1">配置版本</div>
            <div className="num text-xs text-ink">2.4.1</div>
            <div className="text-[10px] text-ink-mute mt-2 leading-relaxed">
              设置保存在浏览器本地，重置演示数据不会影响当前配置。
            </div>
          </div>
        </aside>

        <Panel className="flex-1 min-w-0" bodyClass="p-5 overflow-auto">
          {tab === 'general' && (
            <div className="max-w-[560px] space-y-5">
              <Field label="系统名称">
                <Input value={settings.systemName} onChange={(e) => updateSettings({ systemName: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="界面语言">
                  <Select value={settings.language} onChange={(e) => updateSettings({ language: e.target.value })} className="w-full">
                    <option>简体中文</option>
                    <option>English</option>
                  </Select>
                </Field>
                <Field label="时区">
                  <Select value={settings.timezone} onChange={(e) => updateSettings({ timezone: e.target.value })} className="w-full">
                    <option>Asia/Shanghai (UTC+8)</option>
                    <option>Asia/Tokyo (UTC+9)</option>
                    <option>UTC</option>
                  </Select>
                </Field>
              </div>
              <Field label="界面主题" hint="深色适合长时间值守，浅色适合明亮环境">
                <Segmented
                  options={[
                    { label: '深色', value: 'dark' },
                    { label: '浅色', value: 'light' },
                  ]}
                  value={theme}
                  onChange={(v) => setTheme(v as 'dark' | 'light')}
                />
              </Field>
              <Field label="数据刷新频率">
                <Segmented
                  options={[
                    { label: '5 秒', value: 5 },
                    { label: '10 秒', value: 10 },
                    { label: '30 秒', value: 30 },
                    { label: '关闭', value: 0 },
                  ]}
                  value={settings.refreshInterval}
                  onChange={(v) => updateSettings({ refreshInterval: v })}
                />
              </Field>
              <div className="pt-2">
                <Button variant="primary" icon={<Save size={14} />} onClick={() => toast('success', '设置已保存')}>
                  保存设置
                </Button>
              </div>
            </div>
          )}

          {tab === 'interaction' && (
            <div className="max-w-[560px] space-y-5">
              <div className="flex items-center justify-between p-3.5 rounded-card border border-strong bg-panel2">
                <div>
                  <div className="text-xs text-ink">语音播报（TTS）</div>
                  <div className="text-2xs text-ink-mute mt-0.5">执行结果通过语音反馈</div>
                </div>
                <Switch checked={settings.tts} onChange={(v) => updateSettings({ tts: v })} label="语音播报" />
              </div>

              <Field label="播报音色">
                <Select value={settings.voice} onChange={(e) => updateSettings({ voice: e.target.value })} className="w-full">
                  <option>清朗男声</option>
                  <option>温和女声</option>
                  <option>沉稳播报</option>
                </Select>
              </Field>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink-soft">语速</span>
                  <span className="num text-2xs text-ink-mute">{settings.speed}%</span>
                </div>
                <Slider value={settings.speed} onChange={(v) => updateSettings({ speed: v })} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink-soft">语音识别灵敏度</span>
                  <span className="num text-2xs text-ink-mute">{settings.sensitivity}</span>
                </div>
                <Slider value={settings.sensitivity} onChange={(v) => updateSettings({ sensitivity: v })} accent="var(--accent)" />
                <p className="text-2xs text-ink-mute mt-1.5">数值越高越容易拾取轻声指令，但误触发概率也会上升。</p>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-card border border-strong bg-panel2">
                <div>
                  <div className="text-xs text-ink">高危指令二次确认</div>
                  <div className="text-2xs text-ink-mute mt-0.5">影响 5 台以上设备或应急类场景需确认</div>
                </div>
                <Switch checked={settings.confirmHighRisk} onChange={(v) => updateSettings({ confirmHighRisk: v })} label="二次确认" />
              </div>

              <Field label="撤销窗口时长">
                <Segmented
                  options={[
                    { label: '3 秒', value: 3 },
                    { label: '5 秒', value: 5 },
                    { label: '10 秒', value: 10 },
                  ]}
                  value={settings.undoWindow}
                  onChange={(v) => updateSettings({ undoWindow: v })}
                />
              </Field>

              <Button variant="primary" icon={<Save size={14} />} onClick={() => toast('success', '交互设置已保存')}>
                保存设置
              </Button>
            </div>
          )}

          {tab === 'alert' && (
            <div className="max-w-[560px] space-y-5">
              <Field label="通知渠道" hint="告警产生时通过所选渠道推送">
                <div className="flex gap-2">
                  {['站内', '邮件', '短信', '企业微信'].map((c) => {
                    const active = settings.channels.includes(c)
                    return (
                      <button
                        key={c}
                        onClick={() =>
                          updateSettings({
                            channels: active ? settings.channels.filter((x) => x !== c) : [...settings.channels, c],
                          })
                        }
                        className={cn(
                          'h-8 px-3 rounded-ctrl border text-xs transition-colors',
                          active ? 'border-brand/45 bg-brand/[0.1] text-brand' : 'border-strong bg-panel2 text-ink-soft',
                        )}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </Field>

              <div className="flex items-center justify-between p-3.5 rounded-card border border-strong bg-panel2">
                <div>
                  <div className="text-xs text-ink">告警提示音</div>
                  <div className="text-2xs text-ink-mute mt-0.5">新告警到达时播放提示音</div>
                </div>
                <Switch checked={settings.alertSound} onChange={(v) => updateSettings({ alertSound: v })} label="提示音" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="静默开始时间">
                  <Input type="time" value={settings.quietStart} onChange={(e) => updateSettings({ quietStart: e.target.value })} />
                </Field>
                <Field label="静默结束时间">
                  <Input type="time" value={settings.quietEnd} onChange={(e) => updateSettings({ quietEnd: e.target.value })} />
                </Field>
              </div>
              <p className="text-2xs text-ink-mute leading-relaxed">
                静默时段内 P2、P3 告警不推送通知，但仍会记录在告警列表中；P1 级告警始终推送。
              </p>

              <Button variant="primary" icon={<Save size={14} />} onClick={() => toast('success', '告警设置已保存')}>
                保存设置
              </Button>
            </div>
          )}

          {tab === 'data' && (
            <div className="max-w-[560px] space-y-5">
              <div className="rounded-card border border-strong bg-panel2 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MonitorCog size={14} className="text-brand" />
                  <span className="text-xs text-ink">演示数据状态</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    ['设备', db.devices.length],
                    ['告警', db.alerts.length],
                    ['工单', db.tickets.length],
                    ['任务', db.tasks.length],
                    ['指令记录', db.commands.length],
                    ['审计日志', db.audits.length],
                  ].map(([k, v]) => (
                    <div key={String(k)}>
                      <div className="text-[10px] text-ink-mute">{k}</div>
                      <div className="num text-sm text-ink">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink-soft">模拟故障率</span>
                  <span className="num text-2xs text-ink-mute">{settings.failRate}%</span>
                </div>
                <Slider value={settings.failRate} onChange={(v) => updateSettings({ failRate: v })} max={10} accent="var(--warning)" />
                <p className="text-2xs text-ink-mute mt-1.5">调高后场景执行会随机出现失败项，便于演示异常处置流程。</p>
              </div>

              <div className="rounded-card border border-bad/30 bg-bad/[0.05] p-4">
                <div className="text-xs text-ink mb-1">重置演示数据</div>
                <p className="text-2xs text-ink-mute leading-relaxed mb-3">
                  将清除本地保存的所有操作结果（设备状态、告警处置、工单进度等），恢复为初始种子数据。此操作不可撤销。
                </p>
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" icon={<RotateCcw size={13} />} onClick={() => setConfirmReset(true)}>
                    重置数据
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetSettings()
                      toast('success', '设置已恢复默认')
                    }}
                  >
                    恢复默认设置
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tag color="var(--success)">数据仅保存在本地</Tag>
                <Tag>无外部请求</Tag>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetData()
          toast('success', '演示数据已重置', '页面将在 1 秒后刷新')
          window.setTimeout(() => window.location.reload(), 900)
        }}
        title="确认重置演示数据？"
        desc="所有设备状态、告警处置记录、工单进度与审计日志将恢复到初始状态，且无法撤销。"
        confirmText="确认重置"
        danger
      />
    </>
  )
}
