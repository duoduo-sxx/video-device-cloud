import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Globe, Lock, Monitor, Smartphone } from 'lucide-react';
import { Button, Field, Input, Switch, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { mockApi } from '@/mock/api';
import { fmtTime } from '@/utils/format';
import type { ForensicsTask } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

const STEPS = ['环境检测', '页面加载', '内容固化', '生成证据'];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ForensicsWeb() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    url: 'https://shop.example-mall.com/item/8823661',
    name: '侵权商品详情页取证',
    region: '杭州',
    device: 'pc' as 'pc' | 'mobile',
    record: true,
    video: false,
  });
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<ForensicsTask | null>(null);

  const run = async () => {
    if (!/^https?:\/\/.+/.test(form.url)) return toast.error('请输入合法的网页地址');
    setResult(null);
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await sleep(700);
    }
    const t = await mockApi.forensics.createWeb({ url: form.url, name: form.name, region: form.region, device: form.device });
    setResult(t);
    setStep(4);
    toast.success(`取证完成：${t.id}`);
  };

  const running = step >= 0 && step < 4;

  return (
    <div className="page">
      <PageHeader
        title="网页取证"
        desc="固定网页内容、DOM 结构与访问时间，生成可用于司法举证的可信证据"
        actions={<Button onClick={() => nav('/forensics/tasks')}>取证任务</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-4">
          <SectionCard title="取证配置">
            <div className="space-y-4">
              <Field label="网页地址" required>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} prefix={<Globe size={13} />} className="font-mono text-[11.5px]" />
              </Field>
              <Field label="取证名称" required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="取证地域">
                <div className="grid grid-cols-4 gap-2">
                  {['北京', '上海', '广州', '杭州'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setForm({ ...form, region: r })}
                      className={cn(
                        'rounded-md border py-1.5 text-[11.5px] transition-all',
                        form.region === r
                          ? 'border-[rgba(61,125,255,.5)] bg-[rgba(61,125,255,.14)] text-[#9CC2FF]'
                          : 'border-[var(--stroke)] bg-[var(--bg-card-2)] text-[var(--text-2)]',
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="设备环境">
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { k: 'pc' as const, label: '桌面浏览器', icon: Monitor },
                    { k: 'mobile' as const, label: '移动端浏览器', icon: Smartphone },
                  ].map((d) => {
                    const Icon = d.icon;
                    return (
                      <button
                        key={d.k}
                        onClick={() => setForm({ ...form, device: d.k })}
                        className={cn(
                          'flex items-center gap-2 rounded-md border px-3 py-2 text-[11.5px] transition-all',
                          form.device === d.k
                            ? 'border-[rgba(34,211,238,.45)] bg-[rgba(34,211,238,.06)] text-[var(--text-1)]'
                            : 'border-[var(--stroke)] bg-[var(--bg-card-2)] text-[var(--text-2)]',
                        )}
                      >
                        <Icon size={13} /> {d.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <div className="flex items-center justify-between rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-2.5">
                <Switch checked={form.record} onChange={(v) => setForm({ ...form, record: v })} label="同步录屏" />
                <Switch checked={form.video} onChange={(v) => setForm({ ...form, video: v })} label="固化视频证据" />
              </div>
              <Button variant="primary" className="w-full" onClick={run} disabled={running} loading={running}>
                {running ? '取证进行中…' : '开始取证'}
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="取证说明">
            <ul className="space-y-2 text-[11.5px] leading-relaxed text-[var(--text-3)]">
              <li>· 系统会记录 URL、访问时间、IP 归属地、设备指纹等环境信息。</li>
              <li>· 页面快照包含 DOM 结构、样式、图片资源与截图，确保还原真实。</li>
              <li>· 动态内容（如滚动加载）建议开启录屏，形成完整操作轨迹。</li>
              <li>· 取证完成后可一键加入证据包并申请司法出证。</li>
            </ul>
          </SectionCard>
        </div>

        <div className="col-span-2 space-y-4">
          <SectionCard title="取证过程" desc="四阶段自动执行，全程记录环境与时间">
            <div className="grid grid-cols-4 gap-3">
              {STEPS.map((s, i) => {
                const done = step > i;
                const on = step === i;
                return (
                  <div
                    key={s}
                    className={cn(
                      'rounded-[9px] border px-3.5 py-3 transition-all',
                      done
                        ? 'border-[rgba(45,212,167,.3)] bg-[rgba(45,212,167,.05)]'
                        : on
                          ? 'border-[rgba(34,211,238,.5)] bg-[rgba(34,211,238,.07)]'
                          : 'border-[var(--stroke)] bg-[var(--bg-card-2)]',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                          done ? 'bg-[var(--ok)] text-[#04121a]' : on ? 'bg-[var(--brand-2)] text-[#04121a]' : 'bg-white/8 text-[var(--text-3)]',
                        )}
                      >
                        {done ? <Check size={10} /> : i + 1}
                      </span>
                      <span className={cn('text-[11.5px]', done || on ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]')}>{s}</span>
                    </div>
                    <div className="mt-1.5 text-[10px] text-[var(--text-3)]">
                      {i === 0 ? 'IP / UA / 时区' : i === 1 ? '请求完整页面' : i === 2 ? 'DOM + 截图' : '哈希 + 时间戳'}
                    </div>
                  </div>
                );
              })}
            </div>

            {step === -1 && (
              <div className="mt-4 flex h-[300px] items-center justify-center rounded-[10px] border border-dashed border-[var(--stroke)] bg-[var(--bg-card-2)] text-[12px] text-[var(--text-3)]">
                配置完成后点击「开始取证」，这里会展示页面快照
              </div>
            )}

            {running && (
              <div className="mt-4 flex h-[300px] flex-col items-center justify-center rounded-[10px] border border-[var(--stroke)] bg-[var(--bg-card-2)]">
                <Globe size={26} className="animate-pulse text-[var(--brand-2)]" />
                <div className="mt-3 text-[12.5px] text-[var(--text-2)]">{STEPS[step]}…</div>
                <div className="mt-1 font-mono text-[10.5px] text-[var(--text-3)]">{form.url}</div>
              </div>
            )}

            {result && step === 4 && (
              <>
                <div className="mt-4 overflow-hidden rounded-[10px] border border-[var(--stroke)]">
                  <div className="flex items-center gap-2 border-b border-[var(--stroke)] bg-[var(--bg-card-2)] px-3 py-2">
                    <span className="flex gap-1">
                      {['#FF5C7A', '#F5B544', '#2DD4A7'].map((c) => (
                        <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
                      ))}
                    </span>
                    <div className="ml-2 flex flex-1 items-center gap-1.5 rounded-md bg-[#070C15] px-2 py-1">
                      <Lock size={9} className="text-[var(--ok)]" />
                      <span className="truncate font-mono text-[10px] text-[var(--text-3)]">{form.url}</span>
                    </div>
                    <span className="font-mono text-[9.5px] text-[var(--text-3)]">{form.region} · {form.device === 'pc' ? '1440×900' : '390×844'}</span>
                  </div>
                  <div className="relative h-[240px] bg-gradient-to-br from-[#121A2A] to-[#0D1420] p-4">
                    <div className="flex gap-3">
                      <div className="h-16 w-16 rounded bg-white/8" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-white/10" />
                        <div className="h-2 w-1/3 rounded bg-white/6" />
                        <div className="h-2 w-1/2 rounded bg-white/6" />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-14 rounded bg-white/5" />
                      ))}
                    </div>
                    <div className="absolute bottom-2 right-3 font-mono text-[9.5px] text-[var(--text-3)]">
                      快照时间 {fmtTime(result.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[10px] border border-[rgba(45,212,167,.28)] bg-[rgba(45,212,167,.06)] px-4 py-3.5">
                  <div className="flex items-center gap-2 text-[12.5px] text-[#6EE7C7]">
                    <Check size={14} /> 取证完成，证据已固化
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-6">
                    {[
                      ['证据编号', result.id],
                      ['证据哈希', result.evidenceHash.slice(0, 26) + '…'],
                      ['文件大小', `${(result.fileSize / 1024 / 1024).toFixed(0)} MB`],
                      ['取证耗时', `${result.duration} 秒`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-baseline gap-3 py-1.5">
                        <span className="w-[64px] flex-none text-[11px] text-[var(--text-3)]">{k}</span>
                        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-[var(--text-1)]">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => nav('/forensics/packages')}>加入证据包</Button>
                    <Button size="sm" onClick={() => nav('/forensics/judicial')}>申请出证</Button>
                    <Button size="sm" onClick={() => nav('/forensics/tasks')}>查看任务列表</Button>
                  </div>
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard title="环境记录" desc="取证时的环境信息，将随证据一起固化">
            <div className="grid grid-cols-3 gap-3">
              {[
                ['取证地域', form.region],
                ['设备类型', form.device === 'pc' ? '桌面浏览器' : '移动端浏览器'],
                ['分辨率', form.device === 'pc' ? '1440 × 900' : '390 × 844'],
                ['IP 归属', '浙江杭州 · 电信'],
                ['User-Agent', 'Chrome 128 / macOS 14'],
                ['时区', 'UTC+8'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[8px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3 py-2.5">
                  <div className="text-[10.5px] text-[var(--text-3)]">{k}</div>
                  <div className="mt-0.5 truncate text-[11.5px] text-[var(--text-1)]">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-3)]">
              <Tag tone="green">可信环境</Tag>
              取证节点已通过时间源校准，误差 &lt; 50ms
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
