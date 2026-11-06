import { useState } from 'react';
import { Bell, Building2, Lock, Plug, User } from 'lucide-react';
import { Button, Checkbox, Field, Input, Select, Switch, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { useAuth } from '@/store/auth';
import { ROLE_META } from '@/utils/constants';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

const TABS = [
  { key: 'profile', label: '基本资料', icon: User },
  { key: 'security', label: '安全设置', icon: Lock },
  { key: 'notify', label: '通知偏好', icon: Bell },
  { key: 'org', label: '企业信息', icon: Building2 },
  { key: 'dev', label: '开发者设置', icon: Plug },
];

export default function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user.name, phone: '13800138000', email: 'chenmo@xh-chain.cn', title: '内容中心负责人' });
  const [notify, setNotify] = useState({ audit: true, sign: true, judicial: true, weekly: false, sms: true, email: false });
  const [org, setOrg] = useState({ name: user.orgName, code: '91330106MA2GX8K21C', legal: '沈亦舟', addr: '浙江省杭州市西湖区文三路 98 号 3 层', industry: '文化创意' });

  return (
    <div className="page">
      <PageHeader title="账户设置" desc="管理个人资料、安全策略与通知偏好" />

      <div className="grid grid-cols-4 gap-4">
        <div className="card h-fit p-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[12.5px] transition-colors',
                  tab === t.key ? 'bg-[rgba(61,125,255,.12)] text-[var(--text-1)]' : 'text-[var(--text-2)] hover:bg-white/5',
                )}
              >
                <Icon size={14} className={tab === t.key ? 'text-[var(--brand-2)]' : 'text-[var(--text-3)]'} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="col-span-3 space-y-4">
          {tab === 'profile' && (
            <SectionCard title="基本资料" desc="这些信息会展示在存证证书与合同签署页">
              <div className="flex items-center gap-5">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#3D7DFF] to-[#22D3EE] text-[24px] font-medium text-white">
                  {user.name.slice(0, 1)}
                </span>
                <div>
                  <Button size="sm">更换头像</Button>
                  <div className="mt-1.5 text-[10.5px] text-[var(--text-3)]">支持 JPG / PNG，建议 200×200</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Tag tone="blue">{ROLE_META[user.role].label}</Tag>
                  <Tag tone="green">已实名认证</Tag>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4">
                <Field label="姓名"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="职位"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="手机号"><Input value={form.phone} disabled /></Field>
                <Field label="邮箱"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="链上 DID" className="col-span-2" hint="由实名认证时生成，不可修改">
                  <Input value="did:xh:0x3Fa2c81b7E4d09aC5f6128B7d4E9A0c6F8b2D1" disabled className="font-mono text-[11.5px]" />
                </Field>
              </div>
              <div className="mt-5 flex justify-end">
                <Button variant="primary" onClick={() => toast.success('资料已保存')}>保存修改</Button>
              </div>
            </SectionCard>
          )}

          {tab === 'security' && (
            <>
              <SectionCard title="登录安全">
                <div className="space-y-0">
                  {[
                    ['登录密码', '上次修改于 2026-06-12', '修改'],
                    ['手机验证', '已绑定 138****8000', '更换'],
                    ['两步验证', '未开启', '开启'],
                    ['登录设备', '3 台设备在线', '管理'],
                  ].map(([k, v, a]) => (
                    <div key={k} className="flex items-center justify-between border-b border-dashed border-white/[0.055] py-3 last:border-b-0">
                      <div>
                        <div className="text-[12.5px] text-[var(--text-1)]">{k}</div>
                        <div className="mt-0.5 text-[11px] text-[var(--text-3)]">{v}</div>
                      </div>
                      <Button size="sm" onClick={() => toast.success(`${k}操作已提交`)}>{a}</Button>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="操作保护">
                <div className="space-y-3">
                  <Switch checked onChange={() => undefined} label="删除存证 / 撤销权属时需要二次验证" />
                  <Switch checked onChange={() => undefined} label="导出数据时需要短信验证" />
                  <Switch checked={false} onChange={() => undefined} label="异地登录时发送告警通知" />
                </div>
              </SectionCard>
            </>
          )}

          {tab === 'notify' && (
            <SectionCard title="通知偏好" desc="选择需要接收的通知类型与渠道">
              <div className="space-y-3">
                {[
                  ['audit', '审核结果通知', '权属登记、数据资产登记的审核结果'],
                  ['sign', '合同待签署提醒', '有合同等待你签署时提醒'],
                  ['judicial', '出证进度通知', '公证书 / 鉴定意见书的进度变化'],
                  ['weekly', '每周数据周报', '存证、确权与维权的数据摘要'],
                ].map(([k, t, d]) => (
                  <div key={k} className="flex items-center justify-between border-b border-dashed border-white/[0.055] py-3 last:border-b-0">
                    <div>
                      <div className="text-[12.5px] text-[var(--text-1)]">{t}</div>
                      <div className="mt-0.5 text-[11px] text-[var(--text-3)]">{d}</div>
                    </div>
                    <Switch checked={notify[k as keyof typeof notify]} onChange={(v) => setNotify({ ...notify, [k]: v })} />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="label">接收渠道</div>
                <div className="flex gap-6">
                  <Checkbox checked={notify.sms} onChange={(v) => setNotify({ ...notify, sms: v })} label="短信" />
                  <Checkbox checked={notify.email} onChange={(v) => setNotify({ ...notify, email: v })} label="邮件" />
                  <Checkbox checked onChange={() => undefined} label="站内消息" />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button variant="primary" onClick={() => toast.success('通知偏好已保存')}>保存设置</Button>
              </div>
            </SectionCard>
          )}

          {tab === 'org' && (
            <SectionCard title="企业信息" desc="企业认证信息修改后需重新审核">
              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                <Field label="企业名称" className="col-span-2"><Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} /></Field>
                <Field label="统一社会信用代码"><Input value={org.code} disabled className="font-mono" /></Field>
                <Field label="法定代表人"><Input value={org.legal} onChange={(e) => setOrg({ ...org, legal: e.target.value })} /></Field>
                <Field label="所属行业">
                  <Select value={org.industry} onChange={(v) => setOrg({ ...org, industry: v })} options={['文化创意', '信息技术', '数据服务', '教育培训', '广告传媒'].map((x) => ({ value: x, label: x }))} />
                </Field>
                <Field label="企业规模">
                  <Select value="51-200 人" onChange={() => undefined} options={['1-50 人', '51-200 人', '201-500 人', '500 人以上'].map((x) => ({ value: x, label: x }))} />
                </Field>
                <Field label="注册地址" className="col-span-2"><Input value={org.addr} onChange={(e) => setOrg({ ...org, addr: e.target.value })} /></Field>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button onClick={() => toast.success('已提交变更申请，等待审核')}>提交变更</Button>
                <Button variant="primary" onClick={() => toast.success('企业信息已保存')}>保存</Button>
              </div>
            </SectionCard>
          )}

          {tab === 'dev' && (
            <SectionCard title="开发者设置" desc="用于接收平台事件回调">
              <div className="space-y-4">
                <Field label="回调地址" hint="存证确认、审核结果等事件将通过 POST 推送">
                  <Input defaultValue="https://api.shiguang-art.com/xh/callback" className="font-mono text-[11.5px]" />
                </Field>
                <Field label="回调密钥">
                  <div className="flex gap-2">
                    <Input defaultValue="whsec_8f2c4e91a3b7d05c6e9f" readOnly className="font-mono text-[11.5px]" />
                    <Button className="flex-none" onClick={() => toast.success('回调密钥已重置')}>重置</Button>
                  </div>
                </Field>
                <div>
                  <div className="label">订阅事件</div>
                  <div className="grid grid-cols-2 gap-2">
                    {['evidence.confirmed', 'evidence.failed', 'rights.registered', 'contract.completed', 'judicial.issued', 'asset.licensed'].map((e) => (
                      <Checkbox key={e} checked onChange={() => undefined} label={<span className="font-mono text-[11px]">{e}</span>} />
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
