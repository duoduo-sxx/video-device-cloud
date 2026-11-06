import { Boxes, ChevronRight, Cpu, Github, Hexagon, Mail, Phone, Server } from 'lucide-react'
import { PageHeader, Panel } from '@/components/common'
import { Button, Tag } from '@/components/ui/primitives'
import { CHANGELOG, LICENSES, VERSIONS } from '@/mock/seed/content'
import { useUIStore } from '@/stores/uiStore'

export default function About() {
  const toast = useUIStore((s) => s.toast)

  return (
    <>
      <PageHeader title="关于系统" sub="版本信息、更新日志与开源许可" />

      <div className="grid grid-cols-12 gap-3">
        <Panel className="col-span-5" bodyClass="p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-panel bg-gradient-to-br from-brand/25 to-accent/20 border border-brand/30 flex items-center justify-center shrink-0">
              <Hexagon size={22} className="text-brand" />
            </div>
            <div>
              <div className="text-md font-medium text-ink">沉浸式智能控制人机交互系统</div>
              <div className="text-2xs text-ink-mute mt-1">Immersive Intelligent Control & HMI Platform</div>
              <div className="flex items-center gap-1.5 mt-2">
                <Tag color="var(--brand)">v2.4.1</Tag>
                <Tag>Build 20261019</Tag>
                <Tag color="var(--success)">稳定版</Tag>
              </div>
            </div>
          </div>

          <p className="text-xs text-ink-soft leading-relaxed mt-4">
            面向指挥中心、沉浸式展厅与智慧楼宇的统一控制与人机交互中台。通过语音、文字与快捷指令驱动设备、
            场景与任务，并提供工单、远程协助与知识库构成的服务闭环。
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              [Cpu, '在管设备', '52 台'],
              [Boxes, '预设场景', '8 个'],
              [Server, '接入空间', '6 个'],
              [Github, '服务模块', '12 个'],
            ].map(([Icon, label, value]) => {
              const I = Icon as typeof Cpu
              return (
                <div key={String(label)} className="rounded-card border border-strong bg-panel2/60 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-mute">
                    <I size={11} />
                    {label as string}
                  </div>
                  <div className="num text-sm text-ink mt-1">{value as string}</div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-2xs text-ink-soft">
              <Phone size={11} className="text-ink-mute" />
              技术支持热线：400-820-6688（7×24）
            </div>
            <div className="flex items-center gap-2 text-2xs text-ink-soft">
              <Mail size={11} className="text-ink-mute" />
              support@ice-center.cn
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => toast('info', '检查更新', '当前已是最新版本 v2.4.1')}
          >
            检查更新
          </Button>
        </Panel>

        <Panel className="col-span-4" title="模块版本" bodyClass="p-3">
          <div className="space-y-2">
            {VERSIONS.map((v) => (
              <div key={v.module} className="flex items-center justify-between py-1.5 border-b border-subtle last:border-0">
                <span className="text-xs text-ink-soft font-mono">{v.module}</span>
                <div className="flex items-center gap-2">
                  <span className="num text-2xs text-ink">{v.version}</span>
                  <span className="num text-[10px] text-ink-mute">{v.updated}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="col-span-3" title="开源许可" bodyClass="p-3">
          <div className="space-y-1.5">
            {LICENSES.map((l) => (
              <div key={l.name} className="flex items-center justify-between">
                <span className="text-2xs text-ink-soft">{l.name}</span>
                <span className="text-[10px] text-ink-mute font-mono">{l.license}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="col-span-12" title="更新日志" bodyClass="p-4">
          <div className="relative pl-5">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border-strong)]" />
            <div className="space-y-4">
              {CHANGELOG.map((c, i) => (
                <div key={c.version} className="relative">
                  <span
                    className="absolute -left-[17px] top-1 w-[9px] h-[9px] rounded-full border-2"
                    style={{ background: 'var(--bg-panel)', borderColor: i === 0 ? 'var(--brand)' : 'var(--border-strong)' }}
                  />
                  <div className="flex items-center gap-2">
                    <span className="num text-xs text-ink">v{c.version}</span>
                    <span className="num text-2xs text-ink-mute">{c.date}</span>
                    {i === 0 && <Tag color="var(--brand)">当前版本</Tag>}
                  </div>
                  <ul className="mt-1.5 space-y-1">
                    {c.items.map((it) => (
                      <li key={it} className="flex items-start gap-1.5 text-2xs text-ink-soft leading-relaxed">
                        <ChevronRight size={10} className="mt-0.5 shrink-0 text-ink-mute" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </>
  )
}
