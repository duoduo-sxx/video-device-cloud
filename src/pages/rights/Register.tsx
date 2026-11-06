import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Boxes,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  FileCode2,
  PenTool,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button, Checkbox, Field, Input, RadioCard, Select, Tag, Textarea } from '@/components/ui/core';
import { Descriptions, Steps } from '@/components/ui/data';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { db, injectRights, mockApi } from '@/mock/api';
import { ORGS, PERSONS, PERSONS as PEOPLE, RIGHT_SCOPES, SUB_CATEGORIES } from '@/utils/constants';
import type { RightsCategory, RightsRecord } from '@/types';
import { useData } from '@/store/data';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

const CATS: { key: RightsCategory; icon: typeof PenTool; desc: string; who: string }[] = [
  { key: 'copyright', icon: PenTool, desc: '文字、美术、摄影、视听等原创作品', who: '创作者 / 内容机构' },
  { key: 'patent', icon: Briefcase, desc: '发明、实用新型与外观设计专利', who: '研发型企业' },
  { key: 'trademark', icon: BadgeCheck, desc: '商品商标与服务商标专用权', who: '品牌方' },
  { key: 'software', icon: FileCode2, desc: '计算机软件著作权登记', who: '技术团队' },
  { key: 'data_asset', icon: Database, desc: '数据集、数据模型与数据产品', who: '数据服务商' },
  { key: 'trade_secret', icon: Boxes, desc: '技术秘密与经营秘密', who: '全类型企业' },
];

export default function RightsRegister() {
  const nav = useNavigate();
  const addRights = useData((s) => s.addRights);
  const [step, setStep] = useState(0);
  const [cat, setCat] = useState<RightsCategory>('copyright');
  const [form, setForm] = useState({
    title: '',
    subCategory: '美术作品',
    firstPublishAt: '2026-06-18',
    publishPlatform: '站酷 / 小红书',
    ownerType: 'person' as 'person' | 'org',
    ownerName: '陈默',
    idNo: '330106199203124518',
    phone: '13800138000',
    region: '中国大陆',
    validFrom: '2026-10-19',
    validTo: '2036-12-31',
    scopes: ['复制权', '信息网络传播权'] as string[],
    description: '系列原创插画作品，共 24 幅，已完成全部创作并首发于个人平台。',
    agree: false,
  });
  const [coOwners, setCoOwners] = useState<{ name: string; idNo: string; ratio: number }[]>([]);
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const evidences = useMemo(() => db.evidences.filter((e) => e.status === 'confirmed').slice(0, 12), []);
  const ratioTotal = 100 - coOwners.reduce((s, c) => s + c.ratio, 0);

  const next = () => {
    if (step === 1) {
      if (!form.title.trim()) return toast.error('请填写作品名称');
      if (form.ownerType === 'person' && !/^\d{17}[\dX]$/.test(form.idNo)) return toast.error('身份证号格式不正确');
      if (form.ownerType === 'org' && !/^[0-9A-Z]{18}$/.test(form.idNo)) return toast.error('统一社会信用代码需为 18 位');
      if (ratioTotal < 0) return toast.error('共有份额合计不能超过 100%');
      if (!form.scopes.length) return toast.error('请至少选择一项权利范围');
    }
    if (step === 2 && evidenceIds.length === 0) return toast.error('请至少关联 1 条存证记录');
    if (step === 3) return submit();
    setStep(step + 1);
  };

  const submit = async () => {
    if (!form.agree) return toast.error('请勾选真实性承诺');
    setSubmitting(true);
    const r = await mockApi.rights.create({
      title: form.title,
      category: cat,
      subCategory: form.subCategory,
      owner: {
        type: form.ownerType,
        name: form.ownerName,
        idNo: form.idNo,
        did: `did:xh:0x${Math.random().toString(16).slice(2, 42)}`,
        shareRatio: 100 - coOwners.reduce((s, c) => s + c.ratio, 0),
      },
      coOwners: coOwners.map((c, i) => ({
        type: 'person' as const,
        name: c.name,
        idNo: c.idNo,
        did: `did:xh:0x${i}${Math.random().toString(16).slice(2, 41)}`,
        shareRatio: c.ratio,
      })),
      rightScope: form.scopes,
      evidenceIds,
      validFrom: form.validFrom,
      validTo: form.validTo,
      region: form.region,
      firstPublishAt: form.firstPublishAt,
    });
    injectRights(r);
    addRights(r);
    setSubmitting(false);
    toast.success(`已提交审核：${r.id}`);
    nav('/rights');
  };

  return (
    <div className="page">
      <PageHeader
        title="权属登记"
        desc="为作品建立链上权属凭证，登记信息与关联存证共同构成完整的权利证明链"
        actions={<Button onClick={() => nav('/rights')}>权属管理</Button>}
      />

      <div className="card mb-4 px-7 py-5">
        <Steps items={['选择类型', '权属信息', '关联存证', '确认提交']} current={step} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          {step === 0 && (
            <SectionCard title="选择权属类型" desc="不同类型对应不同的登记材料与审查标准">
              <div className="grid grid-cols-2 gap-3">
                {CATS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <RadioCard
                      key={c.key}
                      checked={cat === c.key}
                      onClick={() => {
                        setCat(c.key);
                        set('subCategory', SUB_CATEGORIES[c.key][0]);
                      }}
                      title={SUB_CATEGORIES[c.key].length ? c.key === 'copyright' ? '著作权' : c.key === 'patent' ? '专利权' : c.key === 'trademark' ? '商标权' : c.key === 'software' ? '软件著作权' : c.key === 'data_asset' ? '数据资产' : '商业秘密' : ''}
                      desc={`${c.desc} · 适用于${c.who}`}
                      icon={<Icon size={16} />}
                    />
                  );
                })}
              </div>
            </SectionCard>
          )}

          {step === 1 && (
            <SectionCard title="填写权属信息" desc="信息将写入链上权属登记合约，请确保准确">
              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                <Field label="作品名称" required className="col-span-2">
                  <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="如：《山海拾遗·第三辑》插画集" maxLength={60} />
                </Field>
                <Field label="作品类别" required>
                  <Select
                    value={form.subCategory}
                    onChange={(v) => set('subCategory', v)}
                    options={SUB_CATEGORIES[cat].map((s) => ({ value: s, label: s }))}
                  />
                </Field>
                <Field label="首次发表日">
                  <Input type="date" value={form.firstPublishAt} onChange={(e) => set('firstPublishAt', e.target.value)} />
                </Field>
                <Field label="发表平台">
                  <Input value={form.publishPlatform} onChange={(e) => set('publishPlatform', e.target.value)} placeholder="如：站酷、小红书、个人网站" />
                </Field>
                <Field label="权利地域范围">
                  <Select
                    value={form.region}
                    onChange={(v) => set('region', v)}
                    options={[
                      { value: '中国大陆', label: '中国大陆' },
                      { value: '全球', label: '全球' },
                      { value: '中国港澳台地区', label: '中国港澳台地区' },
                    ]}
                  />
                </Field>

                <div className="col-span-2 my-1 h-px bg-[var(--stroke)]" />

                <Field label="权利人主体" required className="col-span-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { k: 'person' as const, t: '个人', d: '以自然人身份登记' },
                      { k: 'org' as const, t: '企业 / 组织', d: '以法人主体登记' },
                    ].map((o) => (
                      <button
                        key={o.k}
                        onClick={() => {
                          set('ownerType', o.k);
                          set('ownerName', o.k === 'person' ? '陈默' : ORGS[0]);
                          set('idNo', o.k === 'person' ? '330106199203124518' : '91330106MA2GX8K21C');
                        }}
                        className={cn(
                          'rounded-[9px] border px-3.5 py-2.5 text-left transition-all',
                          form.ownerType === o.k
                            ? 'border-[rgba(34,211,238,.5)] bg-[rgba(34,211,238,.06)]'
                            : 'border-[var(--stroke)] bg-[var(--bg-card-2)]',
                        )}
                      >
                        <div className="text-[12.5px] text-[var(--text-1)]">{o.t}</div>
                        <div className="mt-0.5 text-[10.5px] text-[var(--text-3)]">{o.d}</div>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label={form.ownerType === 'person' ? '姓名' : '企业名称'} required>
                  <Input value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
                </Field>
                <Field label={form.ownerType === 'person' ? '身份证号' : '统一社会信用代码'} required>
                  <Input value={form.idNo} onChange={(e) => set('idNo', e.target.value)} maxLength={18} className="font-mono" />
                </Field>
                <Field label="联系电话">
                  <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </Field>
                <div />

                <div className="col-span-2 my-1 h-px bg-[var(--stroke)]" />

                <Field label="权利范围" required className="col-span-2" hint="至少选择一项，将写入权属登记合约">
                  <div className="flex flex-wrap gap-2">
                    {RIGHT_SCOPES.map((s) => {
                      const on = form.scopes.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => set('scopes', on ? form.scopes.filter((x) => x !== s) : [...form.scopes, s])}
                          className={cn(
                            'rounded-md border px-2.5 py-1 text-[11.5px] transition-all',
                            on
                              ? 'border-[rgba(61,125,255,.5)] bg-[rgba(61,125,255,.14)] text-[#9CC2FF]'
                              : 'border-[var(--stroke)] bg-[var(--bg-card-2)] text-[var(--text-2)] hover:border-[var(--stroke-strong)]',
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="共有情况" className="col-span-2" hint={`剩余可分配份额 ${Math.max(0, ratioTotal)}%`}>
                  <div className="space-y-2">
                    {coOwners.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={c.name}
                          onChange={(e) => setCoOwners(coOwners.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))}
                          placeholder="共有人姓名"
                          className="w-[140px]"
                        />
                        <Input
                          value={c.idNo}
                          onChange={(e) => setCoOwners(coOwners.map((x, k) => (k === i ? { ...x, idNo: e.target.value } : x)))}
                          placeholder="身份证号"
                          className="flex-1 font-mono"
                          maxLength={18}
                        />
                        <Input
                          type="number"
                          value={c.ratio}
                          onChange={(e) => setCoOwners(coOwners.map((x, k) => (k === i ? { ...x, ratio: Number(e.target.value) } : x)))}
                          className="w-[92px]"
                          suffix={<span className="text-[11px] text-[var(--text-3)]">%</span>}
                        />
                        <button className="text-[var(--text-3)] hover:text-[var(--danger)]" onClick={() => setCoOwners(coOwners.filter((_, k) => k !== i))}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      icon={<Plus size={12} />}
                      onClick={() => setCoOwners([...coOwners, { name: '', idNo: '', ratio: 30 }])}
                    >
                      添加共有人
                    </Button>
                  </div>
                </Field>

                <Field label="有效期限" className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Input type="date" value={form.validFrom} onChange={(e) => set('validFrom', e.target.value)} className="w-[170px]" />
                    <span className="text-[11.5px] text-[var(--text-3)]">至</span>
                    <Input type="date" value={form.validTo} onChange={(e) => set('validTo', e.target.value)} className="w-[170px]" />
                  </div>
                </Field>

                <Field label="作品说明" className="col-span-2">
                  <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={300} />
                </Field>
              </div>
            </SectionCard>
          )}

          {step === 2 && (
            <SectionCard
              title="关联存证记录"
              desc="从已上链的存证中选择与该作品相关的证据，至少 1 条"
              extra={<span className="text-[11.5px] text-[var(--text-3)]">已选 {evidenceIds.length} 条</span>}
            >
              <div className="space-y-2">
                {evidences.map((e) => {
                  const on = evidenceIds.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => setEvidenceIds(on ? evidenceIds.filter((x) => x !== e.id) : [...evidenceIds, e.id])}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[9px] border px-3.5 py-3 text-left transition-all',
                        on
                          ? 'border-[rgba(34,211,238,.45)] bg-[rgba(34,211,238,.05)]'
                          : 'border-[var(--stroke)] bg-[var(--bg-card-2)] hover:border-[var(--stroke-strong)]',
                      )}
                    >
                      <Checkbox checked={on} onChange={() => undefined} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] text-[var(--text-1)]">{e.title}</div>
                        <div className="mt-0.5 flex gap-2 font-mono text-[10.5px] text-[var(--text-3)]">
                          <span>{e.id}</span>
                          <span>·</span>
                          <span>#{e.blockHeight.toLocaleString()}</span>
                        </div>
                      </div>
                      <Tag>{e.fileName.split('.').pop()?.toUpperCase()}</Tag>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 rounded-lg border border-[rgba(61,125,255,.22)] bg-[rgba(61,125,255,.06)] px-3.5 py-3 text-[11.5px] leading-relaxed text-[var(--text-2)]">
                关联存证后，权属登记会引用这些证据的哈希，形成「作品内容 → 存证时间 → 权属归属」的完整链条。审核通过后，权属证书上会同时展示证件编号与关联存证数量。
              </div>
            </SectionCard>
          )}

          {step === 3 && (
            <SectionCard title="确认提交" desc="请核对以下信息，提交后将进入审核流程">
              <Descriptions
                items={[
                  { label: '权属类型', value: CATS.find((c) => c.key === cat)?.key === 'copyright' ? '著作权' : cat },
                  { label: '作品名称', value: form.title || '—' },
                  { label: '作品类别', value: form.subCategory },
                  { label: '权利人', value: `${form.ownerName}（${form.ownerType === 'person' ? '个人' : '企业'}）` },
                  { label: '证件号码', value: <span className="font-mono">{form.idNo}</span> },
                  { label: '权利范围', value: form.scopes.join('、') || '—' },
                  { label: '关联存证', value: `${evidenceIds.length} 条` },
                  { label: '共有人', value: coOwners.length ? `${coOwners.length} 人` : '无' },
                  { label: '有效期', value: `${form.validFrom} 至 ${form.validTo}` },
                  { label: '权利地域', value: form.region },
                ]}
              />
              <div className="mt-4 rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] p-4">
                <Checkbox checked={form.agree} onChange={(v) => set('agree', v)} label="我承诺所提交的作品与权属信息真实、合法、有效，如有不实愿承担相应法律责任" />
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11.5px] text-[var(--text-3)]">
                <Check size={12} className="text-[var(--ok)]" />
                提交后预计 1 个工作日内完成审核，审核通过即自动上链并签发证书
              </div>
            </SectionCard>
          )}

          <div className="mt-4 flex justify-between">
            <Button icon={<ChevronLeft size={14} />} onClick={() => (step === 0 ? nav('/rights') : setStep(step - 1))}>
              {step === 0 ? '返回列表' : '上一步'}
            </Button>
            <Button variant="primary" onClick={next} loading={submitting}>
              {step === 3 ? '提交审核' : '下一步'}
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <SectionCard title="登记须知">
            <ul className="space-y-2.5 text-[11.5px] leading-relaxed text-[var(--text-2)]">
              <li>· 权属登记不替代官方登记（如版权局作品登记），但可作为创作时间与归属的初步证据。</li>
              <li>· 提交前请确保已对作品完成存证，未关联存证的申请将无法通过审核。</li>
              <li>· 共有人份额合计必须为 100%，系统会自动校验。</li>
              <li>· 审核通过后权属信息上链，任何变更都会生成新的链上记录，历史不可覆盖。</li>
            </ul>
          </SectionCard>

          <SectionCard title="审核流程">
            <div className="space-y-3">
              {[
                ['提交申请', '填写信息并关联存证'],
                ['形式审查', '核对材料完整性与格式'],
                ['实质审查', '核验权属真实性与唯一性'],
                ['上链确权', '写入权属合约并签发证书'],
              ].map(([t, d], i) => (
                <div key={t} className="flex gap-3">
                  <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/6 text-[10px] text-[var(--text-2)]">{i + 1}</span>
                  <div>
                    <div className="text-[12px] text-[var(--text-1)]">{t}</div>
                    <div className="text-[10.5px] text-[var(--text-3)]">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="常见问题">
            <div className="space-y-3 text-[11.5px] leading-relaxed">
              <div>
                <div className="text-[var(--text-1)]">个人可以登记企业作品吗？</div>
                <div className="mt-0.5 text-[var(--text-3)]">可以，但需提供权属来源说明，如委托创作合同或转让协议。</div>
              </div>
              <div>
                <div className="text-[var(--text-1)]">登记后还能修改吗？</div>
                <div className="mt-0.5 text-[var(--text-3)]">不能直接修改，需通过「变更登记」生成新版本记录，旧记录保留可查。</div>
              </div>
              <div>
                <div className="text-[var(--text-1)]">共有作品如何登记？</div>
                <div className="mt-0.5 text-[var(--text-3)]">在共有人栏填写各方姓名与份额，合计须为 100%。</div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
