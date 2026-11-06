import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  FileSignature,
  Fingerprint,
  Gavel,
  KeyRound,
  Link2,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { PageHeader, SectionCard, StatCard } from '@/components/ui/page';
import { Button, Tag } from '@/components/ui/core';
import { DonutChart, TrendAreaChart } from '@/components/charts';
import { Segmented } from '@/components/ui/data';
import { db } from '@/mock/api';
import { EVIDENCE_STATUS, EVIDENCE_TYPE, TX_TYPE } from '@/utils/constants';
import { fmtNum, fromNow, shortHash } from '@/utils/format';
import { useAuth } from '@/store/auth';
import { cn } from '@/utils/cn';

const QUICK = [
  { icon: UploadCloud, title: '快速存证', desc: '文件拖入即上链', path: '/evidence/create', color: '#3D7DFF' },
  { icon: ShieldCheck, title: '权属登记', desc: '为作品确立权属', path: '/rights/register', color: '#22D3EE' },
  { icon: Link2, title: '网页取证', desc: '固定侵权页面证据', path: '/forensics/web', color: '#8B5CF6' },
  { icon: FileSignature, title: '发起签署', desc: '多方电子合同', path: '/contracts/templates', color: '#2DD4A7' },
  { icon: Gavel, title: '申请出证', desc: '公证 / 司法鉴定', path: '/forensics/judicial', color: '#F5B544' },
  { icon: KeyRound, title: '接入 API', desc: '批量存证与集成', path: '/service/api', color: '#38BDF8' },
];

export default function Dashboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [range, setRange] = useState('30d');
  const [feed, setFeed] = useState(() =>
    db.txs.slice(0, 8).map((t) => ({
      key: t.hash,
      type: t.type,
      title: t.bizTitle,
      time: t.timestamp,
      height: t.blockHeight,
      hash: t.hash,
    })),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const src = db.evidences[Math.floor(Math.random() * 40)];
      setFeed((prev) => [
        {
          key: `live-${Date.now()}`,
          type: 'evidence' as const,
          title: src.title,
          time: new Date().toISOString(),
          height: db.blocks[0].height + Math.floor(Math.random() * 3),
          hash: src.txHash,
        },
        ...prev.slice(0, 7),
      ]);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  const trend = useMemo(() => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const now = Date.now();
    const buckets: { date: string; ev: number; rr: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      buckets.push({ date: d.toISOString().slice(5, 10), ev: 0, rr: 0 });
    }
    db.evidences.forEach((e) => {
      const diff = Math.floor((now - new Date(e.createdAt).getTime()) / 86400000);
      if (diff >= 0 && diff < days) buckets[days - 1 - diff].ev += 1;
    });
    db.rights.forEach((r) => {
      const diff = Math.floor((now - new Date(r.events[0].time).getTime()) / 86400000);
      if (diff >= 0 && diff < days) buckets[days - 1 - diff].rr += 1;
    });
    return buckets.map((b) => ({ ...b, ev: b.ev + 3, rr: b.rr + 1 }));
  }, [range]);

  const typeDist = useMemo(() => {
    const map = new Map<string, number>();
    db.evidences.forEach((e) => map.set(e.type, (map.get(e.type) ?? 0) + 1));
    const colors = ['#3D7DFF', '#8B5CF6', '#22D3EE', '#2DD4A7', '#F5B544', '#FF5C7A', '#38BDF8', '#9AA8BF', '#63718A'];
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k, v], i) => ({ name: EVIDENCE_TYPE[k as keyof typeof EVIDENCE_TYPE].label, value: v, color: colors[i % colors.length] }));
  }, []);

  const recent = db.evidences.slice(0, 5);
  const pending = [
    { title: '权属登记待审核', desc: '《山海拾遗·第三辑》插画集 等 2 项', tone: 'amber' as const, path: '/rights' },
    { title: '合同待签署', desc: '《青峦》系列摄影作品授权许可合同', tone: 'blue' as const, path: '/contracts' },
    { title: '出证材料待补充', desc: 'JD-2026-0018 缺少权利证明附件', tone: 'red' as const, path: '/forensics/judicial' },
    { title: '侵权线索待处置', desc: '命中 5 条疑似侵权链接，相似度 ≥ 85%', tone: 'violet' as const, path: '/forensics/monitor' },
  ];

  return (
    <div className="page">
      <PageHeader
        title={`${greeting()}，${user.name}`}
        desc={`${user.orgName} · 本月已存证 1,204 条，链上确认率 99.2%`}
        actions={
          <>
            <Button onClick={() => nav('/evidence/verify')}>哈希核验</Button>
            <Button variant="primary" icon={<UploadCloud size={14} />} onClick={() => nav('/evidence/create')}>
              快速存证
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-5 gap-4">
        <StatCard label="累计存证" value="12,486" unit="条" delta="+12.4%" up icon={<Fingerprint size={14} />} spark={[8, 12, 9, 16, 14, 20, 18, 24]} />
        <StatCard label="本月新增" value="1,204" unit="条" delta="+8.2%" up tone="cyan" icon={<UploadCloud size={14} />} spark={[12, 14, 11, 18, 16, 21, 19, 26]} />
        <StatCard label="已确权" value="3,172" unit="项" delta="+5.1%" up tone="green" icon={<ShieldCheck size={14} />} spark={[4, 6, 5, 8, 7, 9, 11, 13]} />
        <StatCard label="待出证" value="8" unit="单" hint="3 单已受理" tone="amber" icon={<Gavel size={14} />} spark={[2, 3, 2, 4, 3, 5, 4, 3]} />
        <StatCard label="维权进行中" value="5" unit="件" hint="本月新增 2 件" tone="violet" icon={<Link2 size={14} />} spark={[1, 1, 2, 2, 3, 3, 4, 5]} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <SectionCard
          title="存证与确权趋势"
          desc="按自然日统计的存证与确权数量"
          className="col-span-2"
          extra={
            <Segmented
              value={range}
              onChange={setRange}
              items={[
                { key: '7d', label: '近 7 天' },
                { key: '30d', label: '近 30 天' },
                { key: '90d', label: '近 90 天' },
              ]}
            />
          }
        >
          <TrendAreaChart
            data={trend}
            keys={[
              { key: 'ev', name: '存证数', color: '#3D7DFF' },
              { key: 'rr', name: '确权数', color: '#22D3EE' },
            ]}
            height={252}
          />
        </SectionCard>

        <SectionCard title="存证类型分布" desc="点击扇区可查看对应类型记录">
          <DonutChart data={typeDist} centerValue="12,486" centerLabel="存证总量" height={252} />
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <SectionCard
          title="链上实时动态"
          desc="星火联盟链 · 出块间隔 2.1s"
          extra={<span className="flex items-center gap-1.5 text-[11px] text-[var(--ok)]"><span className="h-1.5 w-1.5 animate-[pulseDot_1.8s_ease-in-out_infinite] rounded-full bg-[var(--ok)]" />实时</span>}
        >
          <div className="space-y-0">
            {feed.map((f, i) => (
              <div
                key={f.key}
                className={cn(
                  'flex items-center gap-3 border-b border-dashed border-white/[0.055] py-2 last:border-b-0',
                  i === 0 && 'animate-[slideDown_.4s_ease-out]',
                )}
              >
                <Tag tone={TX_TYPE[f.type].tone}>{TX_TYPE[f.type].label}</Tag>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] text-[var(--text-1)]">{f.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-[var(--text-3)]">
                    <span className="text-[var(--brand-2)]">{shortHash(f.hash, 6, 4)}</span>
                    <span>#{f.height.toLocaleString()}</span>
                  </div>
                </div>
                <span className="flex-none text-[10.5px] text-[var(--text-3)]">{fromNow(f.time)}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="待办事项" desc="4 项需要你处理" extra={<button onClick={() => nav('/notifications')} className="text-[11.5px] text-[var(--brand-2)] hover:underline">全部</button>}>
          <div className="space-y-2">
            {pending.map((p) => (
              <button
                key={p.title}
                onClick={() => nav(p.path)}
                className="group flex w-full items-start gap-3 rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-2.5 text-left transition-all hover:border-[var(--stroke-strong)] hover:bg-[var(--bg-hover)]"
              >
                <span className="mt-[6px] h-1.5 w-1.5 flex-none rounded-full" style={{ background: `var(--${p.tone === 'blue' ? 'brand' : p.tone === 'amber' ? 'warn' : p.tone === 'red' ? 'danger' : 'violet'})` }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] text-[var(--text-1)]">{p.title}</div>
                  <div className="mt-0.5 truncate text-[11px] text-[var(--text-3)]">{p.desc}</div>
                </div>
                <ArrowUpRight size={13} className="mt-1 flex-none text-[var(--text-3)] transition-colors group-hover:text-[var(--brand-2)]" />
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="近期存证" desc="最近 5 条存证记录" extra={<button onClick={() => nav('/evidence')} className="text-[11.5px] text-[var(--brand-2)] hover:underline">查看全部</button>}>
          <div className="space-y-2.5">
            {recent.map((e) => (
              <button key={e.id} onClick={() => nav(`/evidence/${e.id}`)} className="group flex w-full items-center gap-2.5 text-left">
                <span className="h-8 w-8 flex-none rounded-[7px] bg-[rgba(61,125,255,.1)] p-1.5 text-center text-[10px] text-[#9CC2FF]">
                  {EVIDENCE_TYPE[e.type].label.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] text-[var(--text-1)] group-hover:text-[var(--brand-2)]">{e.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-[var(--text-3)]">
                    <span className="font-mono">{e.id}</span>
                    <span>·</span>
                    <span>{fromNow(e.createdAt)}</span>
                  </div>
                </div>
                <Tag tone={EVIDENCE_STATUS[e.status].tone}>{EVIDENCE_STATUS[e.status].label}</Tag>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="快捷入口" desc="常用操作一键直达" className="mt-4">
        <div className="grid grid-cols-6 gap-3">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.title}
                onClick={() => nav(q.path)}
                className="group relative overflow-hidden rounded-[10px] border border-[var(--stroke)] bg-[var(--bg-card-2)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--stroke-strong)]"
              >
                <span
                  className="pointer-events-none absolute -right-4 -top-6 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-40"
                  style={{ background: q.color }}
                />
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-[8px]"
                  style={{ background: `${q.color}17`, color: q.color, boxShadow: `inset 0 0 0 1px ${q.color}30` }}
                >
                  <Icon size={15} />
                </span>
                <div className="mt-3 text-[12.5px] text-[var(--text-1)]">{q.title}</div>
                <div className="mt-0.5 text-[11px] text-[var(--text-3)]">{q.desc}</div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <SectionCard title="本月服务用量" className="col-span-1">
          <div className="space-y-4">
            {[
              { label: '存证条数', used: 1204, total: 1500, unit: '条' },
              { label: '司法出证', used: 3, total: 10, unit: '单' },
              { label: 'API 调用', used: 48320, total: 100000, unit: '次' },
            ].map((u) => (
              <div key={u.label}>
                <div className="flex items-baseline justify-between text-[11.5px]">
                  <span className="text-[var(--text-2)]">{u.label}</span>
                  <span className="num text-[var(--text-3)]">
                    <span className="text-[var(--text-1)]">{fmtNum(u.used)}</span> / {fmtNum(u.total)} {u.unit}
                  </span>
                </div>
                <div className="mt-1.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#3D7DFF] to-[#22D3EE]" style={{ width: `${(u.used / u.total) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="链上数据概览" className="col-span-2">
          <div className="grid grid-cols-4 gap-4">
            {[
              { k: '当前区块高度', v: db.blocks[0].height.toLocaleString(), s: '2.1s / 块' },
              { k: '累计交易数', v: '9,612,486', s: 'PBFT 共识' },
              { k: '活跃节点', v: '7 / 7', s: '含 2 个司法节点' },
              { k: '平均确认时间', v: '2.4s', s: '一次确认即终局' },
            ].map((i) => (
              <div key={i.k} className="rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-4 py-3">
                <div className="text-[11px] text-[var(--text-3)]">{i.k}</div>
                <div className="num mt-1 text-[18px] font-semibold tracking-[-.02em] text-[var(--text-1)]">{i.v}</div>
                <div className="mt-0.5 text-[10.5px] text-[var(--text-3)]">{i.s}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-[9px] border border-[rgba(34,211,238,.2)] bg-[rgba(34,211,238,.05)] px-4 py-3">
            <div className="text-[11.5px] leading-relaxed text-[var(--text-2)]">
              你的组织已接入 <span className="text-[var(--brand-2)]">北京互联网法院司法链</span>，存证数据可一键申请司法出证。
            </div>
            <Button size="sm" onClick={() => nav('/forensics/judicial')}>申请出证</Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 19) return '下午好';
  return '晚上好';
}
