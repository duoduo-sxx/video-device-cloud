import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Building2, CreditCard, UploadCloud, User } from 'lucide-react';
import { Button, Field, Input, RadioCard, StatusPill } from '@/components/ui/core';
import { PageHeader } from '@/components/ui/page';
import { Steps } from '@/components/ui/data';
import { toast } from 'sonner';

export default function Verify() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<'person' | 'org'>('org');
  const [form, setForm] = useState({ name: '陈默', idNo: '330106199203124518', org: '', code: '', legal: '' });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const next = () => {
    if (step === 1) {
      if (type === 'org') {
        if (!form.org.trim()) return toast.error('请输入企业名称');
        if (!/^[0-9A-Z]{18}$/.test(form.code)) return toast.error('统一社会信用代码需为 18 位大写字母或数字');
      }
    }
    if (step < 2) setStep(step + 1);
    else {
      toast.success('实名认证已提交，预计 2 小时内完成审核');
      nav('/dashboard');
    }
  };

  return (
    <div className="mx-auto max-w-[880px] px-6 py-10">
      <PageHeader title="实名认证" desc="完成认证后才能进行权属登记与司法出证，信息仅用于链上身份标识" />
      <div className="card p-7">
        <Steps items={['选择主体类型', '填写认证信息', '完成']} current={step} />

        <div className="mt-8">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <RadioCard
                checked={type === 'person'}
                onClick={() => setType('person')}
                title="个人实名"
                desc="需提供姓名与身份证号，适用于个人创作者"
                icon={<User size={16} />}
              />
              <RadioCard
                checked={type === 'org'}
                onClick={() => setType('org')}
                title="企业实名"
                desc="需提供营业执照与法人信息，支持对公转账与开票"
                icon={<Building2 size={16} />}
              />
              <div className="col-span-2 mt-2 rounded-[10px] border border-[rgba(34,211,238,.22)] bg-[rgba(34,211,238,.05)] p-4 text-[12px] leading-relaxed text-[var(--text-2)]">
                认证通过后，系统会为你的主体生成唯一的链上身份标识（DID），后续所有存证与确权记录都会与该 DID 绑定，形成完整的证据链。
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              {type === 'org' ? (
                <>
                  <Field label="企业名称" required className="col-span-2">
                    <Input value={form.org} onChange={(e) => set('org', e.target.value)} placeholder="与营业执照完全一致" />
                  </Field>
                  <Field label="统一社会信用代码" required>
                    <Input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="18 位代码" maxLength={18} />
                  </Field>
                  <Field label="法定代表人" required>
                    <Input value={form.legal} onChange={(e) => set('legal', e.target.value)} placeholder="法人姓名" />
                  </Field>
                  <Field label="营业执照" required className="col-span-2" hint="支持 JPG / PNG / PDF，单文件不超过 10MB">
                    <div
                      className="flex cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-[var(--stroke-strong)] bg-[var(--bg-card-2)] py-8 transition-colors hover:border-[rgba(61,125,255,.5)]"
                      onClick={() => toast.success('已选择 营业执照_杭州拾光文创.jpg')}
                    >
                      <UploadCloud size={22} className="text-[var(--text-3)]" />
                      <div className="mt-2 text-[12.5px] text-[var(--text-2)]">点击上传营业执照</div>
                      <div className="mt-1 text-[11px] text-[var(--text-3)]">系统将自动识别企业名称与统一社会信用代码</div>
                    </div>
                  </Field>
                </>
              ) : (
                <>
                  <Field label="真实姓名" required>
                    <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
                  </Field>
                  <Field label="身份证号" required>
                    <Input value={form.idNo} onChange={(e) => set('idNo', e.target.value)} maxLength={18} />
                  </Field>
                  <Field label="身份证人像面" required className="col-span-2">
                    <div
                      className="flex cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-[var(--stroke-strong)] bg-[var(--bg-card-2)] py-8 hover:border-[rgba(61,125,255,.5)]"
                      onClick={() => toast.success('已选择 身份证人像面.jpg')}
                    >
                      <CreditCard size={22} className="text-[var(--text-3)]" />
                      <div className="mt-2 text-[12.5px] text-[var(--text-2)]">点击上传身份证人像面</div>
                    </div>
                  </Field>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(45,212,167,.12)] ring-1 ring-[rgba(45,212,167,.35)]">
                <BadgeCheck size={26} className="text-[var(--ok)]" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold">认证材料已提交</h3>
              <p className="mt-1.5 max-w-[420px] text-center text-[12px] leading-relaxed text-[var(--text-3)]">
                我们已收到你的认证材料，审核通过后将生成链上身份标识，并通过站内消息通知你。
              </p>
              <div className="mt-5 flex items-center gap-3 rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-4 py-3 text-[12px]">
                <span className="text-[var(--text-3)]">认证主体</span>
                <span>{type === 'org' ? form.org || '杭州拾光文创有限公司' : form.name}</span>
                <StatusPill label="审核中" tone="amber" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <Button onClick={() => (step === 0 ? nav('/login') : setStep(step - 1))}>
            {step === 0 ? '返回登录' : '上一步'}
          </Button>
          <Button variant="primary" onClick={next}>
            {step === 2 ? '进入工作台' : '下一步'}
          </Button>
        </div>
      </div>
    </div>
  );
}
