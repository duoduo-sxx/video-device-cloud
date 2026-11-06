import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Search, Sparkles } from 'lucide-react';
import { Button, Field, Input, Select, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { Modal } from '@/components/ui/overlay';
import { CONTRACT_TEMPLATES } from '@/utils/constants';
import { toast } from 'sonner';

export default function ContractTemplates() {
  const nav = useNavigate();
  const [kw, setKw] = useState('');
  const [picked, setPicked] = useState<(typeof CONTRACT_TEMPLATES)[number] | null>(null);
  const [form, setForm] = useState({ partyA: '杭州拾光文创有限公司', partyB: '北京云枢数据科技有限公司', amount: '86000', days: '30' });

  const list = CONTRACT_TEMPLATES.filter((t) => t.name.includes(kw) || t.category.includes(kw));

  return (
    <div className="page">
      <PageHeader
        title="合同模板库"
        desc="选择模板后填写变量即可生成合同，模板条款由法务团队维护并定期更新"
        actions={<Button onClick={() => nav('/contracts')}>我的合同</Button>}
      />

      <div className="card mb-4 flex items-center gap-3 px-5 py-4">
        <Input value={kw} onChange={(e) => setKw(e.target.value)} prefix={<Search size={13} />} placeholder="搜索模板名称或类别" className="w-[320px]" />
        <div className="ml-auto flex items-center gap-1.5 text-[11.5px] text-[var(--text-3)]">
          <BookOpen size={13} />
          共 {CONTRACT_TEMPLATES.length} 个模板 · 最近更新 2026-10-08
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {list.map((t) => (
          <div key={t.id} className="card group p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--stroke-strong)]">
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[rgba(61,125,255,.12)] text-[#9CC2FF] ring-1 ring-[rgba(61,125,255,.22)]">
                <FileText size={16} />
              </span>
              <Tag>{t.category}</Tag>
            </div>
            <div className="mt-3.5 text-[13px] font-medium text-[var(--text-1)]">{t.name}</div>
            <p className="mt-1.5 min-h-[52px] text-[11.5px] leading-relaxed text-[var(--text-3)]">{t.desc}</p>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--stroke)] pt-3">
              <div className="text-[10.5px] text-[var(--text-3)]">
                已使用 <span className="text-[var(--text-2)]">{t.usage}</span> 次 · 更新 {t.updatedAt}
              </div>
              <Button size="xs" variant="primary" onClick={() => setPicked(t)}>使用模板</Button>
            </div>
          </div>
        ))}
      </div>

      <SectionCard className="mt-4" title="模板使用说明">
        <div className="grid grid-cols-3 gap-6 text-[11.5px] leading-relaxed text-[var(--text-3)]">
          <div>
            <div className="mb-1 text-[12px] text-[var(--text-1)]">变量填充</div>
            模板中的当事人名称、金额、期限等以变量占位，生成时自动替换，避免手工改错。
          </div>
          <div>
            <div className="mb-1 text-[12px] text-[var(--text-1)]">条款可编辑</div>
            生成后可在签署前调整条款，修改记录会保留在合同版本历史中。
          </div>
          <div>
            <div className="mb-1 text-[12px] text-[var(--text-1)]">自动存证</div>
            全部签署完成后，合同全文哈希自动上链，生成不可篡改的签署证据。
          </div>
        </div>
      </SectionCard>

      <Modal
        open={!!picked}
        onClose={() => setPicked(null)}
        title={picked ? `发起合同 · ${picked.name}` : ''}
        desc="填写关键变量，系统将生成合同草稿并进入签署流程"
        width={560}
        footer={
          <>
            <Button onClick={() => setPicked(null)}>取消</Button>
            <Button
              variant="primary"
              icon={<Sparkles size={13} />}
              onClick={() => {
                toast.success(`已基于《${picked?.name}》生成合同草稿 CT-2026-0087`);
                setPicked(null);
                nav('/contracts');
              }}
            >
              生成合同
            </Button>
          </>
        }
      >
        {picked && (
          <div className="space-y-4">
            <Field label="甲方（权利人）" required>
              <Input value={form.partyA} onChange={(e) => setForm({ ...form, partyA: e.target.value })} />
            </Field>
            <Field label="乙方（使用方）" required>
              <Input value={form.partyB} onChange={(e) => setForm({ ...form, partyB: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="合同金额（元）">
                <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
              <Field label="签署期限">
                <Select
                  value={form.days}
                  onChange={(v) => setForm({ ...form, days: v })}
                  options={[
                    { value: '7', label: '7 天' },
                    { value: '15', label: '15 天' },
                    { value: '30', label: '30 天' },
                    { value: '60', label: '60 天' },
                  ]}
                />
              </Field>
            </div>
            <div className="rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-3 text-[11.5px] leading-relaxed text-[var(--text-3)]">
              合同将包含 {picked.category} 相关的标准条款，生成后可继续编辑。签署方需完成实名认证，签署行为将记录链上时间戳。
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
