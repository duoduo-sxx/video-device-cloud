import { useState } from 'react'
import { Check, Copy, KeyRound, Plus, Shield, UserPlus, X } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Avatar, Badge, Button, Card, CardHeader, Divider, Input, Label, Select, Switch, Tabs } from '../components/ui'
import { PageHeader, Skeleton } from '../components/common'
import { PERMISSION_ITEMS, ROLE_META, can, type Role } from '../lib/permissions'
import { useUI } from '../store/ui'
import { dateTime } from '../lib/format'
import { cn } from '../lib/cn'

const ROLES: Role[] = ['admin', 'lead', 'engineer', 'qc', 'client']

export default function Settings() {
  const { data, loading } = useAsync(async () => ({ members: await api.listMembers(), logs: await api.listAuditLogs() }), [])
  const [tab, setTab] = useState('members')
  const role = useUI((s) => s.role)
  const [prefs, setPrefs] = useState({
    taskDone: true,
    recheckFail: true,
    slaWarn: true,
    weekly: false,
    sound: true,
    emailDigest: true,
  })

  const members = data?.members ?? []
  const logs = data?.logs ?? []

  return (
    <div>
      <PageHeader
        title="设置"
        desc="成员、权限、通知与集成。权限按动作粒度控制，客户角色仅能查看与自己相关的数据。"
        actions={
          <Button variant="primary">
            <UserPlus size={14} /> 邀请成员
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-9">
          <Card>
            <div className="px-5 pt-3">
              <Tabs
                value={tab}
                onChange={setTab}
                items={[
                  { key: 'members', label: '成员', count: members.length },
                  { key: 'permissions', label: '权限矩阵' },
                  { key: 'notify', label: '通知偏好' },
                  { key: 'integrations', label: '集成' },
                  { key: 'audit', label: '审计日志', count: logs.length },
                ]}
              />
            </div>

            {loading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-40" />
              </div>
            ) : tab === 'members' ? (
              <table className="w-full">
                <thead>
                  <tr className="border-y border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                    <th className="px-5 py-2 text-left font-normal">成员</th>
                    <th className="px-2 py-2 text-left font-normal">角色</th>
                    <th className="px-2 py-2 text-left font-normal">状态</th>
                    <th className="px-2 py-2 text-left font-normal">最近活跃</th>
                    <th className="px-5 py-2 text-right font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-2)]">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.name} seed={m.avatarSeed} size={28} />
                          <div>
                            <div className="text-[12.5px] text-[var(--text-1)]">
                              {m.name}
                              {m.role === role && <span className="ml-1.5 text-[10px] text-[var(--primary)]">当前身份</span>}
                            </div>
                            <div className="mono text-[10.5px] text-[var(--text-3)]">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="text-[11.5px] text-[var(--text-2)]">{ROLE_META[m.role].label}</div>
                        <div className="text-[10px] text-[var(--text-3)]">{m.title}</div>
                      </td>
                      <td className="px-2 py-2.5">
                        <Badge
                          color={m.status === 'active' ? 'var(--success)' : m.status === 'invited' ? 'var(--accent)' : 'var(--text-3)'}
                          bg={m.status === 'active' ? 'rgba(52,211,153,.12)' : m.status === 'invited' ? 'rgba(251,191,36,.12)' : 'rgba(110,125,144,.12)'}
                          dot
                        >
                          {m.status === 'active' ? '正常' : m.status === 'invited' ? '待接受邀请' : '已停用'}
                        </Badge>
                      </td>
                      <td className="mono px-2 py-2.5 text-[10.5px] text-[var(--text-3)]">
                        {m.status === 'invited' ? '—' : `${Math.max(1, (m.avatarSeed % 22) + 1)} 小时前`}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-[110px]">
                            <Select defaultValue={m.role} className="h-7 text-[11px]">
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_META[r].label}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <Button size="sm" variant="ghost">
                            停用
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : tab === 'permissions' ? (
              <div className="overflow-x-auto px-4 py-3">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-[var(--border)] px-2 py-2 text-left text-[11px] font-normal text-[var(--text-3)]">
                        动作 / 角色
                      </th>
                      {ROLES.map((r) => (
                        <th key={r} className="border-b border-[var(--border)] px-2 py-2 text-center text-[11px] font-normal text-[var(--text-3)]">
                          {ROLE_META[r].label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_ITEMS.map((item) => (
                      <tr key={item.action} className="hover:bg-[var(--bg-2)]">
                        <td className="border-b border-[var(--border)] px-2 py-2 text-[12px] text-[var(--text-1)]">{item.label}</td>
                        {ROLES.map((r) => {
                          const ok = can(r, item.action)
                          return (
                            <td key={r} className="border-b border-[var(--border)] px-2 py-2 text-center">
                              {ok ? (
                                <Check size={13} className="mx-auto text-[var(--success)]" />
                              ) : (
                                <X size={12} className="mx-auto text-[var(--text-3)] opacity-50" />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 text-[10.5px] text-[var(--text-3)]">
                  当前登录身份：{ROLE_META[role].label} · {ROLE_META[role].desc}
                </div>
              </div>
            ) : tab === 'notify' ? (
              <div className="px-5 py-4">
                <div className="mb-1 text-[12px] font-medium text-[var(--text-1)]">任务通知</div>
                <div className="divide-y divide-[var(--border)]">
                  {[
                    { key: 'taskDone', label: '检测 / 修复任务完成', desc: '任务进入待验收状态时通知相关人' },
                    { key: 'recheckFail', label: '复检未通过', desc: '残留缺陷超过阈值时立即通知工程师与质检' },
                    { key: 'slaWarn', label: '工单 SLA 预警', desc: '剩余时间不足 20% 时提醒负责人' },
                  ].map((p) => (
                    <div key={p.key} className="flex items-center justify-between py-2.5">
                      <div>
                        <div className="text-[12px] text-[var(--text-1)]">{p.label}</div>
                        <div className="text-[11px] text-[var(--text-3)]">{p.desc}</div>
                      </div>
                      <Switch
                        checked={prefs[p.key as keyof typeof prefs]}
                        onChange={(v) => setPrefs({ ...prefs, [p.key]: v })}
                      />
                    </div>
                  ))}
                </div>

                <div className="mb-1 mt-4 text-[12px] font-medium text-[var(--text-1)]">推送方式</div>
                <div className="divide-y divide-[var(--border)]">
                  {[
                    { key: 'sound', label: '桌面提示音', desc: '关键告警播放提示音' },
                    { key: 'emailDigest', label: '邮件摘要', desc: '每日 09:00 汇总昨日任务' },
                    { key: 'weekly', label: '周报推送', desc: '每周一发送质量周报' },
                  ].map((p) => (
                    <div key={p.key} className="flex items-center justify-between py-2.5">
                      <div>
                        <div className="text-[12px] text-[var(--text-1)]">{p.label}</div>
                        <div className="text-[11px] text-[var(--text-3)]">{p.desc}</div>
                      </div>
                      <Switch
                        checked={prefs[p.key as keyof typeof prefs]}
                        onChange={(v) => setPrefs({ ...prefs, [p.key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : tab === 'integrations' ? (
              <div className="grid grid-cols-2 gap-3 p-4">
                {[
                  { name: '对象存储（S3 兼容）', desc: '素材与产物落盘，支持分片上传与断点续传', status: '已连接', code: 'oss-cn-hangzhou' },
                  { name: '企业微信 / 钉钉', desc: '任务与告警推送至群机器人', status: '已连接', code: 'webhook' },
                  { name: 'SSO 单点登录', desc: 'OIDC 协议对接客户统一身份', status: '未配置', code: '—' },
                  { name: '媒体资产管理系统（MAM）', desc: '素材双向同步与元数据回写', status: '未配置', code: '—' },
                ].map((it) => (
                  <div key={it.name} className="rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-3">
                    <div className="flex items-start justify-between">
                      <div className="text-[12.5px] text-[var(--text-1)]">{it.name}</div>
                      <Badge
                        color={it.status === '已连接' ? 'var(--success)' : 'var(--text-3)'}
                        bg={it.status === '已连接' ? 'rgba(52,211,153,.12)' : 'rgba(167,180,196,.12)'}
                        dot
                      >
                        {it.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-[var(--text-3)]">{it.desc}</p>
                    <div className="mono mt-2 flex items-center justify-between rounded bg-[var(--bg-3)] px-2 py-1 text-[10px] text-[var(--text-2)]">
                      {it.code}
                      <Copy size={10} className="text-[var(--text-3)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-y border-[var(--border)] bg-[var(--bg-2)] text-[11px] text-[var(--text-3)]">
                    <th className="px-5 py-2 text-left font-normal">时间</th>
                    <th className="px-2 py-2 text-left font-normal">操作人</th>
                    <th className="px-2 py-2 text-left font-normal">动作</th>
                    <th className="px-2 py-2 text-left font-normal">对象</th>
                    <th className="px-5 py-2 text-right font-normal">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 24).map((l) => (
                    <tr key={l.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-2)]">
                      <td className="mono px-5 py-2 text-[10.5px] text-[var(--text-3)]">{dateTime(l.at)}</td>
                      <td className="px-2 py-2 text-[11.5px] text-[var(--text-1)]">{l.actor}</td>
                      <td className="px-2 py-2 text-[11.5px] text-[var(--text-2)]">{l.action}</td>
                      <td className="mono max-w-[280px] truncate px-2 py-2 text-[10.5px] text-[var(--text-3)]">{l.target}</td>
                      <td className="mono px-5 py-2 text-right text-[10.5px] text-[var(--text-3)]">{l.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="col-span-3 space-y-3">
          <Card>
            <CardHeader title="当前账号" />
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2.5">
                <Avatar name={ROLE_META[role].label} seed={role === 'admin' ? 11 : 33} size={36} />
                <div>
                  <div className="text-[12.5px] text-[var(--text-1)]">陈知远</div>
                  <div className="text-[11px] text-[var(--text-3)]">{ROLE_META[role].label} · 云溪广电内容技术中心</div>
                </div>
              </div>
              <Divider className="my-3" />
              <div className="space-y-2">
                <div>
                  <Label>姓名</Label>
                  <Input defaultValue="陈知远" />
                </div>
                <div>
                  <Label>邮箱</Label>
                  <Input defaultValue="chenzy@avrepair.cn" readOnly className="text-[var(--text-3)]" />
                </div>
                <Button variant="primary" className="w-full">
                  保存
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="安全" desc="登录与密钥" right={<Shield size={14} className="text-[var(--text-3)]" />} />
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <KeyRound size={13} className="text-[var(--text-3)]" />
                  <div>
                    <div className="text-[11.5px] text-[var(--text-1)]">双因素认证</div>
                    <div className="text-[10px] text-[var(--text-3)]">TOTP · 已绑定</div>
                  </div>
                </div>
                <Switch checked onChange={() => {}} />
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-2.5 py-2">
                <div>
                  <div className="text-[11.5px] text-[var(--text-1)]">API 密钥</div>
                  <div className="mono text-[10px] text-[var(--text-3)]">avrs_live_••••8f2c</div>
                </div>
                <Button size="sm" variant="ghost">
                  <Plus size={11} /> 新建
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="版本信息" />
            <div className="px-4 pb-4 text-[11px] text-[var(--text-3)]">
              <div className="flex justify-between py-1">
                <span>平台版本</span>
                <span className="mono text-[var(--text-2)]">v1.0.0</span>
              </div>
              <div className="flex justify-between py-1">
                <span>规则库</span>
                <span className="mono text-[var(--text-2)]">2026.09</span>
              </div>
              <div className="flex justify-between py-1">
                <span>算法包</span>
                <span className="mono text-[var(--text-2)]">17 个 · 已授权</span>
              </div>
              <div className={cn('mt-2 rounded-lg bg-[var(--bg-2)] px-2 py-1.5 leading-5')}>
                本演示环境数据全部为本地 Mock，不产生任何外部请求。
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
