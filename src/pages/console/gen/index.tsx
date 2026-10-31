import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  RefreshCw,
  Sparkles,
  Wand2,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Drawer, Tabs } from '@/components/ui/Overlay';
import { Field, FilterBar, SearchInput, Select, Textarea } from '@/components/ui/Form';
import { useCurrentTenant } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { GEN_RECORDS, GEN_TEMPLATES } from '@/mocks/generations';
import { money, num } from '@/lib/format';
import { round2 } from '@/lib/calc';
import type { GenRecord } from '@/types';

/* ================= 生成工作台 ================= */
export function GenWorkbench() {
  const toast = useUIStore((s) => s.toast);
  const [tpl, setTpl] = useState(GEN_TEMPLATES[0].name);
  const [model, setModel] = useState('CopyGen-CN');
  const [count, setCount] = useState(3);
  const [style, setStyle] = useState('tmall');
  const [tone, setTone] = useState(0.7);
  const [prompt, setPrompt] = useState(
    '产品：M12×60 法兰面螺栓，材质 40Cr，10.9 级，表面达克罗涂层。\n核心卖点：抗拉强度 1040MPa；疲劳寿命提升 42%；盐雾 720 小时无红锈。\n目标平台：天猫；目标人群：新能源整车厂采购。',
  );
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<GenRecord[]>([]);

  const curTpl = GEN_TEMPLATES.find((t) => t.name === tpl)!;
  const unitPrice = curTpl.unit === '张' ? 1.2 : 2.6;
  const estimate = round2(unitPrice * count);

  function run() {
    setRunning(true);
    setResults([]);
    setTimeout(() => {
      const base = GEN_RECORDS.filter((g) => g.status === 'success').slice(0, count);
      setResults(
        base.map((g, i) => ({
          ...g,
          id: `GEN-NEW-${i + 1}`,
          template: tpl,
          modelName: model,
          createdAt: '2026-10-31T23:52:00',
          cost: unitPrice,
        })),
      );
      setRunning(false);
      toast(`已生成 ${count} 条内容，消耗 ${money(estimate)}`);
    }, 1000);
  }

  return (
    <div>
      <PageHeader
        title="内容生成"
        desc="场景服务层：基于领域模型批量生成商品文案、营销图与话术，按篇/张计费"
        actions={<Button icon={<Clock size={14} />}>生成记录</Button>}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="生成配置" desc="选择模板与模型，填写素材后执行" />
            <div className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="生成模板" required>
                  <Select value={tpl} onChange={(e) => setTpl(e.target.value)}>
                    {GEN_TEMPLATES.map((t) => (
                      <option key={t.name}>{t.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="使用模型" required>
                  <Select value={model} onChange={(e) => setModel(e.target.value)}>
                    <option>CopyGen-CN</option>
                    <option>Qwen3-72B-Instruct</option>
                    <option>Qwen3-14B-Chat</option>
                    <option>ImageGen-Mkt</option>
                  </Select>
                </Field>
              </div>

              <Field label="素材 / 需求描述" required hint="越具体，生成质量越高；建议包含产品参数、卖点、目标人群">
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[130px] text-xs" />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="平台风格">
                  <Select value={style} onChange={(e) => setStyle(e.target.value)}>
                    <option value="tmall">天猫</option>
                    <option value="jd">京东</option>
                    <option value="douyin">抖音</option>
                    <option value="xhs">小红书</option>
                  </Select>
                </Field>
                <Field label="生成数量">
                  <Select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                    {[1, 3, 5, 10, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} 条
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={`创意度：${tone}`}>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={tone}
                    onChange={(e) => setTone(Number(e.target.value))}
                    className="mt-3 w-full accent-primary"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-3">
                <div className="text-2xs text-ink-3">
                  预估消耗 <span className="num font-medium text-ink-1">{money(estimate)}</span>（{count} ×{' '}
                  {money(unitPrice)}）
                </div>
                <div className="flex gap-2">
                  <Button icon={<RefreshCw size={13} />} onClick={() => setPrompt('')}>
                    清空
                  </Button>
                  <Button variant="primary" icon={<Wand2 size={14} />} loading={running} onClick={run}>
                    开始生成
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="生成结果"
              desc={results.length ? `共 ${results.length} 条，均已通过内容安全校验` : '执行后在此查看结果'}
              extra={results.length ? <Badge tone="green">已完成</Badge> : undefined}
            />
            <div className="mt-3 space-y-3">
              {running &&
                Array.from({ length: count }).map((_, i) => (
                  <div key={i} className="rounded-ctl border border-line p-3.5">
                    <div className="skeleton h-3 w-1/3" />
                    <div className="mt-2 skeleton h-3 w-full" />
                    <div className="mt-1.5 skeleton h-3 w-4/5" />
                  </div>
                ))}
              {!running && results.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center rounded-ctl border border-dashed border-line">
                  <Sparkles size={22} className="text-ink-3" />
                  <div className="mt-2 text-xs text-ink-3">还没有生成结果</div>
                </div>
              )}
              {results.map((r) => (
                <div key={r.id} className="rounded-ctl border border-line p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-2xs text-ink-3">
                      <Badge tone="blue">{r.template}</Badge>
                      <span>{r.modelName}</span>
                      <span>·</span>
                      <span className="num">{r.latencyMs} ms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="num text-2xs text-ink-2">{money(r.cost)}</span>
                      <button className="text-ink-3 hover:text-primary" onClick={() => toast('已复制到剪贴板', 'info')}>
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-ink-1">{r.content}</pre>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="本月生成概览" />
            <div className="mt-4 space-y-3">
              <StatRow label="已生成" value={`${GEN_RECORDS.length} 条`} />
              <StatRow label="审核通过" value={`${GEN_RECORDS.filter((g) => g.status === 'success').length} 条`} />
              <StatRow label="被拦截" value={`${GEN_RECORDS.filter((g) => g.status === 'blocked').length} 条`} tone="danger" />
              <StatRow label="累计费用" value={money(GEN_RECORDS.reduce((a, g) => a + g.cost, 0))} />
            </div>
          </Card>

          <Card>
            <CardHeader title="模板说明" desc={curTpl.name} />
            <div className="mt-3 space-y-2 text-2xs leading-relaxed text-ink-2">
              <div className="flex gap-1.5">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-success" />
                单价 {money(unitPrice)} / {curTpl.unit}，不足 1 {curTpl.unit}按 1 {curTpl.unit}计费。
              </div>
              <div className="flex gap-1.5">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-success" />
                生成结果自动进入内容安全审核，命中敏感词将被拦截且不计费。
              </div>
              <div className="flex gap-1.5">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-success" />
                建议单批不超过 20 条，超出后建议走异步批量任务。
              </div>
              <div className="flex gap-1.5">
                <AlertTriangle size={12} className="mt-0.5 shrink-0 text-warning" />
                禁止生成绝对化用语、虚假承诺与贬低同行的内容。
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="最近生成" />
            <div className="mt-3 divide-y divide-line">
              {GEN_RECORDS.slice(0, 5).map((g) => (
                <div key={g.id} className="flex items-center gap-2 py-2">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      g.status === 'success' ? 'bg-success' : g.status === 'blocked' ? 'bg-danger' : 'bg-warning'
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate text-2xs text-ink-1">{g.template}</span>
                  <span className="num shrink-0 text-2xs text-ink-3">{g.createdAt.slice(5, 10)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-ink-3">{label}</span>
      <span className={`num font-medium ${tone === 'danger' ? 'text-danger' : 'text-ink-1'}`}>{value}</span>
    </div>
  );
}

/* ================= 生成记录 ================= */
export function GenRecords() {
  const tenant = useCurrentTenant();
  const toast = useUIStore((s) => s.toast);
  const [tab, setTab] = useState('all');
  const [kw, setKw] = useState('');
  const [detail, setDetail] = useState<GenRecord | null>(null);

  const rows = useMemo(
    () =>
      GEN_RECORDS.filter((g) => g.tenantId === tenant.id)
        .filter((g) => tab === 'all' || g.status === tab)
        .filter((g) => !kw || g.template.includes(kw) || g.content.includes(kw)),
    [tenant.id, tab, kw],
  );

  const columns: Column<GenRecord>[] = [
    { key: 'template', title: '模板', width: 170, render: (r) => <span className="font-medium">{r.template}</span> },
    { key: 'modelName', title: '模型', width: 190, render: (r) => <span className="text-xs text-ink-2">{r.modelName}</span> },
    { key: 'content', title: '内容摘要', render: (r) => <span className="line-clamp-1 text-xs text-ink-2">{r.content.replace(/\n/g, ' ')}</span> },
    { key: 'units', title: '数量', width: 80, align: 'right', render: (r) => <span className="num text-ink-2">{r.units}</span> },
    { key: 'latencyMs', title: '耗时', width: 90, align: 'right', render: (r) => <span className="num text-ink-2">{r.latencyMs}ms</span> },
    { key: 'cost', title: '费用', width: 90, align: 'right', render: (r) => <span className="num">{money(r.cost)}</span> },
    { key: 'status', title: '状态', width: 100, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', title: '生成时间', width: 140, render: (r) => <span className="num text-xs text-ink-2">{r.createdAt.slice(5, 16).replace('T', ' ')}</span> },
    {
      key: 'op',
      title: '操作',
      width: 90,
      align: 'right',
      render: (r) => (
        <button className="text-xs text-primary" onClick={(e) => { e.stopPropagation(); setDetail(r); }}>
          查看
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="生成记录"
        desc="所有内容生成任务的历史记录，含合规审核状态与计费明细"
        actions={
          <Button icon={<Download size={14} />} onClick={() => toast('生成记录已导出', 'info')}>
            导出
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="总生成量" value={String(GEN_RECORDS.length)} unit="条" hint="近 30 天" />
        <StatCard label="审核通过" value={String(GEN_RECORDS.filter((g) => g.status === 'success').length)} unit="条" tone="success" />
        <StatCard label="待审核" value={String(GEN_RECORDS.filter((g) => g.status === 'reviewing').length)} unit="条" tone="warning" />
        <StatCard label="被拦截" value={String(GEN_RECORDS.filter((g) => g.status === 'blocked').length)} unit="条" hint="不计费" tone="default" />
      </div>

      <Card pad={false}>
        <div className="px-4 pt-2">
          <Tabs
            tabs={[
              { key: 'all', label: '全部', count: GEN_RECORDS.length },
              { key: 'success', label: '成功' },
              { key: 'reviewing', label: '审核中' },
              { key: 'blocked', label: '已拦截' },
            ]}
            active={tab}
            onChange={setTab}
            className="mb-3"
          />
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 条</span>}>
            <SearchInput value={kw} onChange={setKw} placeholder="搜索模板或内容" className="w-64" />
            <Select className="w-40" defaultValue="all">
              <option value="all">全部模板</option>
              {GEN_TEMPLATES.map((t) => (
                <option key={t.name}>{t.name}</option>
              ))}
            </Select>
          </FilterBar>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={10}
          onRowClick={setDetail}
          emptyTitle="暂无生成记录"
          emptyDesc="前往内容生成工作台创建第一个生成任务"
        />
      </Card>

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title="生成详情"
        subtitle={detail ? `${detail.template} ｜ ${detail.modelName}` : ''}
        width={620}
        footer={
          <>
            <Button icon={<Copy size={14} />} onClick={() => toast('内容已复制', 'info')}>
              复制
            </Button>
            <Button variant="primary" icon={<RefreshCw size={14} />} onClick={() => toast('已重新提交生成', 'info')}>
              重新生成
            </Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={detail.status} />
              {detail.status === 'blocked' && (
                <span className="flex items-center gap-1 text-2xs text-danger">
                  <XCircle size={12} /> 命中「绝对化用语」策略，本次不计费
                </span>
              )}
              {detail.status === 'success' && (
                <span className="flex items-center gap-1 text-2xs text-success">
                  <CheckCircle2 size={12} /> 内容安全校验通过
                </span>
              )}
            </div>

            <div className="rounded-ctl border border-line p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-1">{detail.content}</pre>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                ['记录编号', detail.id],
                ['生成时间', detail.createdAt.replace('T', ' ')],
                ['模型', detail.modelName],
                ['模板', detail.template],
                ['消耗', `${detail.units} ${detail.unitLabel}`],
                ['费用', money(detail.cost)],
                ['耗时', `${detail.latencyMs} ms`],
                ['合规状态', detail.status === 'success' ? '通过' : detail.status === 'blocked' ? '已拦截' : '审核中'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-ink-3">{k}</div>
                  <div className="mt-1 text-ink-1">{v}</div>
                </div>
              ))}
            </div>

            <div className="num rounded-ctl bg-[#F9FAFB] px-3 py-2.5 text-2xs text-ink-2">
              费用计算：{detail.units} {detail.unitLabel} × {money(detail.cost / detail.units)} = {money(detail.cost)}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
