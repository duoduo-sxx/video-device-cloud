import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, MonitorSmartphone, Wrench, ClipboardCheck, GraduationCap, Code2, ShieldAlert } from 'lucide-react'
import { Modal } from '@/components/ui/overlay'
import { Button, Field, Input, Segmented, Select, Textarea } from '@/components/ui/primitives'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { useAppStore } from '@/stores/appStore'
import { SERVICE_CATALOG, TICKET_PRIORITY_LABEL } from '@/constants/enums'
import { cn } from '@/utils/misc'
import type { TicketPriority } from '@/types'

const ICONS: Record<string, typeof Wrench> = {
  MonitorSmartphone,
  Wrench,
  ClipboardCheck,
  GraduationCap,
  Code2,
  ShieldAlert,
}

const SLA: Record<string, number> = {
  远程协助: 240,
  现场支持: 240,
  系统巡检: 1440,
  操作培训: 2880,
  定制开发: 2880,
  应急保障: 120,
}

export function TicketWizard({ open, onClose, presetDeviceId }: { open: boolean; onClose: () => void; presetDeviceId?: string }) {
  const db = useDataStore((s) => s.db)
  const createTicket = useDataStore((s) => s.createTicket)
  const toast = useUIStore((s) => s.toast)
  const user = useAppStore((s) => s.user)
  const navigate = useNavigate()

  const preset = db.devices.find((d) => d.id === presetDeviceId)
  const [step, setStep] = useState(0)
  const [service, setService] = useState('远程协助')
  const [form, setForm] = useState({
    spaceId: preset?.spaceId ?? db.spaces[0].id,
    deviceId: preset?.id ?? '',
    priority: 'normal' as TicketPriority,
    title: '',
    description: '',
    expected: '4',
  })

  const reset = () => {
    setStep(0)
    setService('远程协助')
    setForm({ spaceId: db.spaces[0].id, deviceId: '', priority: 'normal', title: '', description: '', expected: '4' })
  }

  const devices = db.devices.filter((d) => d.spaceId === form.spaceId)
  const device = db.devices.find((d) => d.id === form.deviceId)

  const submit = () => {
    const id = createTicket({
      title: form.title || `${service}申请`,
      serviceType: service,
      priority: form.priority,
      deviceId: form.deviceId || undefined,
      deviceName: device?.name,
      description: form.description || `${db.spaces.find((s) => s.id === form.spaceId)?.name} 提出${service}需求。`,
      creator: user?.name ?? '张启明',
      slaMinutes: SLA[service] ?? 480,
    })
    toast('success', '工单已提交', `${id} 已进入受理队列`)
    onClose()
    reset()
    navigate(`/service/tickets/${id}`)
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose()
        reset()
      }}
      title="提交技术服务工单"
      desc="填写问题信息后，服务台将在承诺时效内响应"
      width={620}
      footer={
        <>
          {step > 0 && (
            <Button variant="ghost" icon={<ArrowLeft size={14} />} onClick={() => setStep(step - 1)}>
              上一步
            </Button>
          )}
          {step < 2 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)}>
              下一步
              <ArrowRight size={14} />
            </Button>
          ) : (
            <Button variant="primary" onClick={submit} icon={<Check size={14} />}>
              确认提交
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-center gap-2 mb-5">
        {['选择服务', '填写信息', '确认提交'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <span
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] num shrink-0',
                i <= step ? 'bg-brand text-canvas' : 'bg-panel2 text-ink-mute border border-strong',
              )}
            >
              {i < step ? <Check size={10} /> : i + 1}
            </span>
            <span className={cn('text-2xs', i <= step ? 'text-ink' : 'text-ink-mute')}>{s}</span>
            {i < 2 && <div className={cn('flex-1 h-px', i < step ? 'bg-brand/40' : 'bg-[var(--border-strong)]')} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="grid grid-cols-2 gap-2">
          {SERVICE_CATALOG.map((s) => {
            const Icon = ICONS[s.icon] ?? Wrench
            return (
              <button
                key={s.key}
                onClick={() => setService(s.name)}
                className={cn(
                  'text-left p-3 rounded-card border transition-all',
                  service === s.name ? 'border-brand/50 bg-brand/[0.07]' : 'border-strong bg-panel2/50 hover:border-brand/30',
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={service === s.name ? 'text-brand' : 'text-ink-mute'} />
                  <span className="text-xs text-ink">{s.name}</span>
                </div>
                <p className="text-2xs text-ink-mute mt-1.5 leading-relaxed">{s.desc}</p>
                <span className="inline-block text-[10px] text-brand mt-1.5">{s.sla}</span>
              </button>
            )
          })}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="所属空间">
              <Select value={form.spaceId} onChange={(e) => setForm({ ...form, spaceId: e.target.value, deviceId: '' })} className="w-full">
                {db.spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.building} {s.floor > 0 ? `${s.floor}F` : 'B1'} {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="关联设备">
              <Select value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} className="w-full">
                <option value="">不指定设备</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}（{d.code}）
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="紧急程度">
            <Segmented
              className="w-full"
              options={(['urgent', 'high', 'normal', 'low'] as TicketPriority[]).map((p) => ({ label: TICKET_PRIORITY_LABEL[p], value: p }))}
              value={form.priority}
              onChange={(v) => setForm({ ...form, priority: v })}
            />
          </Field>

          <Field label="问题标题" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="一句话描述问题，例如：指挥大屏右下单元黑屏" />
          </Field>

          <Field label="详细描述" hint="建议包含现象、发生时间、已尝试的处置动作">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="例如：今日 09:20 起，指挥大屏第 4 行第 3 个单元出现黑屏，重启发送卡后未恢复，同列其他单元正常。"
              rows={4}
            />
          </Field>

          <Field label="期望完成时限">
            <Select value={form.expected} onChange={(e) => setForm({ ...form, expected: e.target.value })} className="w-full">
              <option value="2">2 小时内</option>
              <option value="4">4 小时内</option>
              <option value="24">24 小时内</option>
              <option value="72">3 天内</option>
            </Select>
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="rounded-card border border-strong bg-panel2/60 divide-y divide-[var(--border-subtle)]">
            {[
              ['服务类型', service],
              ['所属空间', `${db.spaces.find((s) => s.id === form.spaceId)?.building} ${db.spaces.find((s) => s.id === form.spaceId)?.name}`],
              ['关联设备', device ? `${device.name}（${device.code}）` : '不指定'],
              ['紧急程度', TICKET_PRIORITY_LABEL[form.priority]],
              ['问题标题', form.title || '未填写'],
              ['期望时限', `${form.expected} 小时内`],
              ['提交人', user?.name ?? '张启明'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4 px-3 py-2">
                <span className="text-2xs text-ink-mute shrink-0">{k}</span>
                <span className="text-xs text-ink text-right">{v}</span>
              </div>
            ))}
          </div>
          <div className="rounded-card border border-warn/30 bg-warn/[0.06] p-3">
            <div className="text-2xs text-warn mb-1">提交后</div>
            <p className="text-2xs text-ink-soft leading-relaxed">
              工单将进入待受理队列，服务台会在 {SLA[service] ?? 480} 分钟内响应。你可以在「技术服务 → 工单」中查看进度并追加说明。
            </p>
          </div>
          <Field label="补充描述">
            <p className="text-xs text-ink-soft leading-relaxed">{form.description || '未填写'}</p>
          </Field>
        </div>
      )}
    </Modal>
  )
}
