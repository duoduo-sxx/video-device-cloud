import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button, Checkbox, StatusPill } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { ROLE_META } from '@/utils/constants';
import type { RoleCode } from '@/types';
import { toast } from 'sonner';

const MODULES = [
  { key: 'dashboard', name: '工作台', acts: ['查看'] },
  { key: 'evidence', name: '存证中心', acts: ['查看', '创建', '撤销', '导出'] },
  { key: 'rights', name: '确权中心', acts: ['查看', '登记', '转让', '审核'] },
  { key: 'contract', name: '电子合同', acts: ['查看', '发起', '签署'] },
  { key: 'forensics', name: '取证维权', acts: ['查看', '取证', '出证', '审核'] },
  { key: 'asset', name: '数据资产', acts: ['查看', '登记', '授权'] },
  { key: 'service', name: '技术服务', acts: ['查看', '密钥管理'] },
  { key: 'org', name: '组织管理', acts: ['查看', '成员管理', '角色配置'] },
];

const DEFAULT_ON: Record<RoleCode, string[]> = {
  platform_admin: MODULES.flatMap((m) => m.acts.map((a) => `${m.key}:${a}`)),
  org_admin: MODULES.flatMap((m) => m.acts.map((a) => `${m.key}:${a}`)).filter((k) => !k.startsWith('org:角色配置') || true),
  creator: ['dashboard:查看', 'evidence:查看', 'evidence:创建', 'evidence:导出', 'rights:查看', 'rights:登记', 'contract:查看', 'contract:签署', 'forensics:查看', 'asset:查看'],
  legal: ['dashboard:查看', 'evidence:查看', 'rights:查看', 'contract:查看', 'contract:发起', 'contract:签署', 'forensics:查看', 'forensics:取证', 'forensics:出证', 'asset:查看'],
  auditor: ['dashboard:查看', 'evidence:查看', 'rights:查看', 'rights:审核', 'forensics:查看', 'forensics:审核', 'asset:查看'],
  viewer: ['dashboard:查看', 'evidence:查看', 'rights:查看', 'contract:查看', 'forensics:查看', 'asset:查看'],
};

export default function Roles() {
  const [role, setRole] = useState<RoleCode>('org_admin');
  const [on, setOn] = useState<Record<RoleCode, string[]>>(DEFAULT_ON);

  const toggle = (key: string) => {
    const cur = on[role];
    setOn({ ...on, [role]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] });
  };

  return (
    <div className="page">
      <PageHeader
        title="角色权限"
        desc="按角色配置功能权限，修改后立即对演示环境生效"
        actions={<Button variant="primary" onClick={() => toast.success('权限配置已保存')}>保存配置</Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          {(Object.keys(ROLE_META) as RoleCode[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`w-full rounded-[9px] border px-3.5 py-3 text-left transition-all ${
                role === r ? 'border-[rgba(61,125,255,.45)] bg-[rgba(61,125,255,.08)]' : 'border-[var(--stroke)] bg-[var(--bg-card)] hover:border-[var(--stroke-strong)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={13} className={role === r ? 'text-[var(--brand-2)]' : 'text-[var(--text-3)]'} />
                <span className="text-[12.5px] text-[var(--text-1)]">{ROLE_META[r].label}</span>
              </div>
              <div className="mt-1 text-[10.5px] leading-relaxed text-[var(--text-3)]">{ROLE_META[r].desc}</div>
              <div className="mt-1.5 text-[10px] text-[var(--text-3)]">{on[r].length} 项权限</div>
            </button>
          ))}
        </div>

        <SectionCard
          title={`${ROLE_META[role].label} · 权限矩阵`}
          desc="勾选后该角色可访问对应功能"
          className="col-span-3"
          extra={<StatusPill label={`已选 ${on[role].length} 项`} tone="blue" />}
        >
          <div className="space-y-4">
            {MODULES.map((m) => (
              <div key={m.key}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[12.5px] text-[var(--text-1)]">{m.name}</span>
                  <span className="text-[10px] text-[var(--text-3)]">{m.acts.length} 项操作</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-4 py-3">
                  {m.acts.map((a) => {
                    const key = `${m.key}:${a}`;
                    return <Checkbox key={key} checked={on[role].includes(key)} onChange={() => toggle(key)} label={a} />;
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-[rgba(61,125,255,.22)] bg-[rgba(61,125,255,.06)] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-[var(--text-2)]">
            权限变更会写入审计日志。平台运营角色拥有跨租户的链上治理权限，不可被企业管理员修改。
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
