import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { Button, Checkbox, Field, Input, RadioCard, Select, Tag, Textarea } from '@/components/ui/core';
import { Steps } from '@/components/ui/data';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { db } from '@/mock/api';
import { toast } from 'sonner';

export default function AssetsRegister() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '中文法律文书语料集（v2.4）',
    category: 'text',
    scale: '132.4 万条',
    volume: '9.2 GB',
    freq: '季度更新',
    source: '自有业务系统采集',
    desc: '由业务系统导出的裁判文书数据，已完成去标识化处理，保留案件类型、法院、案由等字段，用于法律大模型训练。',
    licenseScope: '模型训练、效果评测',
    region: '中国大陆',
    rightsId: db.rights[0]?.id ?? '',
    legal: false,
    noSensitive: false,
  });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const next = () => {
    if (step === 0 && !form.name.trim()) return toast.error('请填写资产名称');
    if (step === 2) {
      if (!form.legal) return toast.error('请确认数据来源合法性');
      if (!form.noSensitive) return toast.error('请确认已完成去标识化处理');
      toast.success('资产登记已提交，审核通过后签发登记凭证');
      return nav('/data-assets');
    }
    setStep(step + 1);
  };

  return (
    <div className="page">
      <PageHeader title="数据资产登记" desc="登记数据资产的规模、字段与权属，形成可用于流通与入表的确权凭证" actions={<Button onClick={() => nav('/data-assets')}>资产台账</Button>} />

      <div className="card mb-4 px-7 py-5">
        <Steps items={['基本信息', '数据描述', '权属与合规']} current={step} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <SectionCard title={['基本信息', '数据描述', '权属与合规'][step]} desc={['确认资产标识与规模', '说明数据结构与更新方式', '确认权属来源与合规声明'][step]}>
            {step === 0 && (
              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                <Field label="资产名称" required className="col-span-2">
                  <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
                </Field>
                <Field label="资产类型" required>
                  <Select
                    value={form.category}
                    onChange={(v) => set('category', v)}
                    options={[
                      { value: 'text', label: '文本数据' },
                      { value: 'image', label: '图像数据' },
                      { value: 'audio', label: '音频数据' },
                      { value: 'video', label: '视频数据' },
                      { value: 'structured', label: '结构化数据' },
                    ]}
                  />
                </Field>
                <Field label="更新频率">
                  <Select
                    value={form.freq}
                    onChange={(v) => set('freq', v)}
                    options={['实时更新', '每日增量', '月度更新', '季度更新', '一次性交付'].map((x) => ({ value: x, label: x }))}
                  />
                </Field>
                <Field label="数据规模" required>
                  <Input value={form.scale} onChange={(e) => set('scale', e.target.value)} placeholder="如：128.6 万条" />
                </Field>
                <Field label="存储量">
                  <Input value={form.volume} onChange={(e) => set('volume', e.target.value)} placeholder="如：8.6 GB" />
                </Field>
                <Field label="数据来源" className="col-span-2">
                  <Select
                    value={form.source}
                    onChange={(v) => set('source', v)}
                    options={['自有业务系统采集', '公开数据清洗', '合作方授权提供', '用户授权提交'].map((x) => ({ value: x, label: x }))}
                  />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Field label="数据描述" required>
                  <Textarea rows={5} value={form.desc} onChange={(e) => set('desc', e.target.value)} maxLength={500} />
                </Field>
                <Field label="字段结构" hint="可上传数据字典，或手动填写主要字段">
                  <div className="overflow-hidden rounded-[9px] border border-[var(--stroke)]">
                    <table className="table">
                      <thead>
                        <tr><th>字段名</th><th>类型</th><th>说明</th><th>脱敏</th></tr>
                      </thead>
                      <tbody>
                        {[
                          ['doc_id', 'string', '文书唯一标识', false],
                          ['case_type', 'enum', '案件类型', false],
                          ['party_name', 'string', '当事人名称', true],
                          ['id_number', 'string', '身份证号（哈希存储）', true],
                          ['content', 'text', '文书正文', false],
                        ].map(([n, t, d, m]) => (
                          <tr key={String(n)}>
                            <td><span className="font-mono text-[11.5px] text-[var(--brand-2)]">{n}</span></td>
                            <td><span className="text-[11.5px] text-[var(--text-3)]">{t}</span></td>
                            <td><span className="text-[11.5px]">{d}</span></td>
                            <td>{m ? <Tag tone="amber">已脱敏</Tag> : <Tag tone="gray">明文</Tag>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Field>
                <Field label="授权使用范围">
                  <Input value={form.licenseScope} onChange={(e) => set('licenseScope', e.target.value)} placeholder="如：模型训练、内部评测" />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Field label="关联权属" hint="数据资产需先完成权属登记，才能生成登记凭证">
                  <Select value={form.rightsId} onChange={(v) => set('rightsId', v)} options={db.rights.slice(0, 20).map((r) => ({ value: r.id, label: `${r.title} · ${r.id}` }))} />
                </Field>
                <Field label="使用地域">
                  <Select
                    value={form.region}
                    onChange={(v) => set('region', v)}
                    options={['中国大陆', '全球', '中国港澳台地区'].map((x) => ({ value: x, label: x }))}
                  />
                </Field>
                <div className="space-y-3 rounded-[10px] border border-[var(--stroke)] bg-[var(--bg-card-2)] p-4">
                  <Checkbox checked={form.legal} onChange={(v) => set('legal', v)} label="我承诺数据来源合法，已取得必要授权，不包含法律法规禁止流通的内容" />
                  <Checkbox checked={form.noSensitive} onChange={(v) => set('noSensitive', v)} label="我确认已完成去标识化处理，不含可识别个人身份的敏感信息" />
                  <Checkbox checked onChange={() => undefined} label="我同意平台对数据资产进行合规性抽查" />
                </div>
                <div className="rounded-lg border border-[rgba(245,181,68,.25)] bg-[rgba(245,181,68,.06)] px-3.5 py-3 text-[11.5px] leading-relaxed text-[var(--text-2)]">
                  登记信息与合规声明将一并上链，若后续发现数据来源违法，平台有权撤销登记并追究责任。
                </div>
              </div>
            )}
          </SectionCard>

          <div className="mt-4 flex justify-between">
            <Button icon={<ChevronLeft size={14} />} onClick={() => (step === 0 ? nav('/data-assets') : setStep(step - 1))}>
              {step === 0 ? '返回' : '上一步'}
            </Button>
            <Button variant="primary" onClick={next}>
              {step === 2 ? '提交登记' : '下一步'}
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <SectionCard title="登记收益">
            <div className="space-y-3 text-[11.5px] leading-relaxed text-[var(--text-2)]">
              {[
                '形成可核验的数据资产权属凭证，支撑数据入表与交易',
                '授权使用记录全程留痕，出现争议时可快速举证',
                '可通过开放 API 对外提供数据服务并计量计费',
              ].map((t) => (
                <div key={t} className="flex gap-2">
                  <Check size={13} className="mt-0.5 flex-none text-[var(--ok)]" />
                  {t}
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="合规提示">
            <p className="text-[11.5px] leading-relaxed text-[var(--text-3)]">
              依据《数据安全法》《个人信息保护法》，数据处理者应当对数据来源合法性负责。涉及个人信息的，需取得单独同意或完成匿名化处理后方可登记。
            </p>
          </SectionCard>
          <SectionCard title="预览">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[rgba(61,125,255,.12)] text-[#9CC2FF]"><Database size={17} /></span>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] text-[var(--text-1)]">{form.name}</div>
                <div className="text-[10.5px] text-[var(--text-3)]">{form.scale} · {form.volume}</div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
