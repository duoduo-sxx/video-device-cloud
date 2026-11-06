import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, Plus } from 'lucide-react'
import { useDataStore } from '../store/data'
import { useAppStore } from '../store/app'
import { PageHeader } from '../components/layout'
import { Avatar, Badge, Button, EmptyState, Input, Modal, Panel, Progress, SearchInput, Select, Tabs } from '../components/ui'
import { daysLeft, formatDate, money } from '../lib/format'
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from '../lib/constants'
import { cn } from '../lib/utils'
import type { ProjectStatus } from '../types'

type TabKey = 'all' | ProjectStatus

export default function Projects() {
  const navigate = useNavigate()
  const projects = useDataStore((s) => s.projects)
  const clients = useDataStore((s) => s.clients)
  const team = useDataStore((s) => s.team)
  const createProject = useDataStore((s) => s.createProject)
  const addLog = useDataStore((s) => s.addLog)
  const toast = useAppStore((s) => s.toast)

  const [tab, setTab] = useState<TabKey>('all')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', clientId: 'cli_001', type: '纪录片', dueDate: '2026-12-15', budget: '36000', description: '' })

  const counts = (key: TabKey) => (key === 'all' ? projects.length : projects.filter((p) => p.status === key).length)

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        if (tab !== 'all' && p.status !== tab) return false
        if (type !== 'all' && p.type !== type) return false
        if (query && !p.name.includes(query) && !p.code.includes(query)) return false
        return true
      }),
    [projects, tab, type, query],
  )

  const submit = () => {
    if (!form.name.trim()) {
      toast('error', '请填写项目名称')
      return
    }
    const id = `prj_${Date.now()}`
    createProject({
      id,
      code: `PRJ-2026-0${21 + projects.length}`,
      name: form.name,
      clientId: form.clientId,
      type: form.type as '纪录片',
      status: 'draft',
      ownerId: 'usr_001',
      startDate: new Date().toISOString(),
      dueDate: new Date(form.dueDate).toISOString(),
      assetCount: 0,
      totalMinutes: 0,
      progress: 0,
      budgetCNY: Number(form.budget) || 0,
      spentCNY: 0,
      description: form.description,
      milestones: [
        { name: '素材接收与技审', date: form.dueDate, done: false },
        { name: '首批样片确认', date: form.dueDate, done: false },
        { name: '全量交付与验收', date: form.dueDate, done: false },
      ],
      deliverables: [],
    })
    addLog('project.create', form.name, { budget: form.budget })
    toast('success', '项目已创建', `${form.name} 已进入草稿状态`)
    setCreating(false)
    setForm({ ...form, name: '', description: '' })
  }

  return (
    <div className="animate-fadeUp">
      <PageHeader
        title="项目管理"
        desc="从素材接收到验收交付：每个项目的进度、预算、交付物与风险集中在一处。"
        actions={
          <Button variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreating(true)}>
            新建项目
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          className="border-b-0"
          items={[
            { key: 'all', label: '全部', count: counts('all') },
            { key: 'active', label: '进行中', count: counts('active') },
            { key: 'pending_acceptance', label: '待验收', count: counts('pending_acceptance') },
            { key: 'delivered', label: '已交付', count: counts('delivered') },
            { key: 'draft', label: '草稿', count: counts('draft') },
          ]}
        />
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="搜索项目名称或编号" className="w-[220px]" />
          <Select value={type} onChange={(e) => setType(e.target.value)} className="w-[120px]">
            <option value="all">全部类型</option>
            {['纪录片', '广告', '展陈', '文旅', '教育', '演出'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel>
          <EmptyState title="没有符合条件的项目" desc="调整筛选条件，或新建一个项目。" />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((p) => {
            const client = clients.find((c) => c.id === p.clientId)
            const owner = team.find((t) => t.id === p.ownerId)
            const left = daysLeft(p.dueDate)
            const risky = left <= 5 && p.progress < 80 && p.status === 'active'
            return (
              <Panel
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="cursor-pointer p-4 transition-colors hover:border-[#333c4c]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mono text-[10.5px] text-dim">{p.code}</div>
                    <div className="mt-1 truncate text-[14px] text-ink">{p.name}</div>
                  </div>
                  <Badge tone={PROJECT_STATUS_TONE[p.status]}>{PROJECT_STATUS_LABEL[p.status]}</Badge>
                </div>

                <div className="mt-2 flex items-center gap-2 text-[11px] text-dim">
                  <span className="rounded bg-[#1b212c] px-1.5 py-0.5">{p.type}</span>
                  <span>{client?.shortName}</span>
                  <span className="text-[#2a3140]">·</span>
                  <span>{p.totalMinutes} 分钟</span>
                </div>

                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
                    <span className="text-dim">完成度</span>
                    <span className="mono text-muted">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} tone={p.progress === 100 ? 'success' : risky ? 'warning' : 'primary'} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line-subtle pt-3">
                  <div>
                    <div className="text-[10px] text-dim">预算</div>
                    <div className="mono mt-0.5 text-[12px] text-ink">{money(p.budgetCNY)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-dim">已消耗</div>
                    <div className="mono mt-0.5 text-[12px] text-muted">{money(p.spentCNY)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-dim">交期</div>
                    <div className={cn('mono mt-0.5 text-[12px]', risky ? 'text-warning' : 'text-muted')}>
                      {formatDate(p.dueDate).slice(5)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {owner && <Avatar name={owner.name} hue={owner.avatarHue} size={22} />}
                    <span className="text-[10.5px] text-dim">{owner?.name}</span>
                  </div>
                  <span className={cn('flex items-center gap-1 text-[10.5px]', risky ? 'text-warning' : 'text-dim')}>
                    <CalendarClock className="h-3 w-3" />
                    {left >= 0 ? `剩余 ${left} 天` : `逾期 ${-left} 天`}
                  </span>
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="新建项目"
        desc="创建后可继续添加素材、创建转换任务并分配交付物。"
        footer={
          <>
            <Button onClick={() => setCreating(false)}>取消</Button>
            <Button variant="primary" onClick={submit}>
              创建项目
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11.5px] text-muted">项目名称</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如：《山海》第二季 空间化" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11.5px] text-muted">客户</label>
              <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] text-muted">类型</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {['纪录片', '广告', '展陈', '文旅', '教育', '演出'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] text-muted">交期</label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] text-muted">预算（元）</label>
              <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11.5px] text-muted">项目说明</label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="一句话说明交付要求" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
