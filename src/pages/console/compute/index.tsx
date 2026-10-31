import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Cpu,
  Gauge,
  HardDrive,
  Play,
  Plus,
  RotateCw,
  Square,
  Thermometer,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Overlay';
import { FilterBar, Radio, Select } from '@/components/ui/Form';
import { Progress } from '@/components/ui/Overlay';
import { MultiLine, BarChartH } from '@/components/charts';
import { useAppStore } from '@/store/appStore';
import { useCurrentTenant } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { COMPUTE_SPECS, QUOTAS, instanceMetrics, instancesOf } from '@/mocks/compute';
import { money, num, qty } from '@/lib/format';
import { round2 } from '@/lib/calc';
import type { ComputeInstance } from '@/types';

/* ================= 资源规格 ================= */
export function ComputeResources() {
  const navigate = useNavigate();
  const toast = useUIStore((s) => s.toast);

  return (
    <div>
      <PageHeader
        title="算力资源规格"
        desc="GPU 资源池按区域分布，预留实例享包月折扣，按量实例按卡·时计费、按秒计量"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/console/compute/instances')}>
            创建实例
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {COMPUTE_SPECS.map((s) => {
          const used = s.allocatedCards / s.totalCards;
          const remain = s.totalCards - s.allocatedCards;
          return (
            <Card key={s.id} className="transition-shadow hover:shadow-pop">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Cpu size={17} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink-1">{s.gpuModel}</div>
                    <div className="mt-0.5 text-2xs text-ink-3">{s.region} / {s.zone}</div>
                  </div>
                </div>
                <Badge tone={s.status === 'available' ? 'green' : s.status === 'tight' ? 'amber' : 'gray'} dot>
                  {s.status === 'available' ? '资源充足' : s.status === 'tight' ? '资源紧张' : '已售罄'}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ['显存', `${s.memoryGB} GB`],
                  ['单卡算力', `${s.computeTFLOPS} TFLOPS`],
                  ['在线卡数', `${s.totalCards}`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-ctl bg-[#F9FAFB] px-2.5 py-2">
                    <div className="text-2xs text-ink-3">{k}</div>
                    <div className="num mt-0.5 text-xs font-medium text-ink-1">{v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-2xs">
                  <span className="text-ink-3">分配率</span>
                  <span className="num text-ink-2">
                    {s.allocatedCards} / {s.totalCards} 卡 · 剩余 {remain} 卡
                  </span>
                </div>
                <Progress value={used * 100} tone={used > 0.85 ? 'warning' : 'primary'} height={5} />
              </div>

              <div className="mt-4 flex items-end justify-between border-t border-line pt-3.5">
                <div>
                  <div className="num text-xl font-semibold text-ink-1">
                    {money(s.unitPrice)}
                    <span className="ml-1 text-2xs font-normal text-ink-3">/ 卡·时</span>
                  </div>
                  <div className="mt-0.5 text-2xs text-ink-3">包月预留可享 8 折</div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={s.status === 'soldout'}
                  onClick={() => {
                    navigate('/console/compute/instances');
                    toast(`已选择 ${s.gpuModel}，请继续完成创建`, 'info');
                  }}
                >
                  创建实例
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <CardHeader title="区域与可用区" desc="跨区部署可获得更低的网络时延；跨区数据同步不计费" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            ['华北 2（北京）', 'cn-north-2a / 2b', '624 卡', '主训练区'],
            ['华东 1（苏州）', 'cn-east-1a / 1b', '320 卡', '推理与国产化'],
            ['华南 1（深圳）', 'cn-south-1a', '512 卡', '推理为主'],
          ].map(([r, z, c, d]) => (
            <div key={r} className="rounded-ctl border border-line px-3.5 py-3">
              <div className="text-sm font-medium text-ink-1">{r}</div>
              <div className="mt-1 text-2xs text-ink-3">{z}</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="num text-ink-1">{c}</span>
                <Badge tone="gray">{d}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ================= 实例列表 ================= */
export function ComputeInstances() {
  const navigate = useNavigate();
  const tenant = useCurrentTenant();
  const instances = useAppStore((s) => s.instances);
  const addInstance = useAppStore((s) => s.addInstance);
  const setStatus = useAppStore((s) => s.setInstanceStatus);
  const toast = useUIStore((s) => s.toast);

  const [open, setOpen] = useState(false);
  const [specId, setSpecId] = useState('SPEC-A100');
  const [image, setImage] = useState('PyTorch 2.4 / CUDA 12.4');
  const [cards, setCards] = useState(8);
  const [hours, setHours] = useState(24);
  const [mode, setMode] = useState<'usage' | 'reserved'>('usage');

  const rows = instances.filter((i) => i.tenantId === tenant.id);
  const running = rows.filter((i) => i.status === 'running');
  const spec = COMPUTE_SPECS.find((s) => s.id === specId)!;
  const price = mode === 'reserved' ? round2(spec.unitPrice * 0.8) : spec.unitPrice;
  const estimate = round2(price * cards * hours);

  function create() {
    const id = `INS-20261031-${String(1500 + rows.length)}`;
    const inst: ComputeInstance = {
      id,
      tenantId: tenant.id,
      specId,
      specName: spec.gpuModel,
      image,
      cardCount: cards,
      billingMode: mode,
      region: `${spec.region} / ${spec.zone}`,
      status: 'creating',
      createdAt: '2026-10-31T23:45:00',
      hoursUsed: 0,
      monthlyCost: 0,
    };
    addInstance(inst);
    setOpen(false);
    toast(`实例 ${id} 正在创建，预计 40 秒后就绪`, 'info');
    setTimeout(() => {
      setStatus(id, 'running');
      toast(`实例 ${id} 已启动`);
    }, 3000);
  }

  const columns: Column<ComputeInstance>[] = [
    { key: 'id', title: '实例 ID', width: 180, render: (r) => <span className="num text-xs">{r.id}</span> },
    { key: 'specName', title: '规格', width: 168 },
    { key: 'image', title: '镜像', width: 180, render: (r) => <span className="text-xs text-ink-2">{r.image}</span> },
    { key: 'cardCount', title: '卡数', width: 64, align: 'right', render: (r) => <span className="num">{r.cardCount}</span> },
    {
      key: 'billingMode',
      title: '计费方式',
      width: 92,
      render: (r) => <Badge tone={r.billingMode === 'reserved' ? 'purple' : 'gray'}>{r.billingMode === 'reserved' ? '包月预留' : '按量'}</Badge>,
    },
    { key: 'hoursUsed', title: '已运行', width: 90, align: 'right', render: (r) => <span className="num text-ink-2">{num(r.hoursUsed)} h</span> },
    { key: 'status', title: '状态', width: 88, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'monthlyCost', title: '本月费用', width: 110, align: 'right', render: (r) => <span className="num font-medium">{money(r.monthlyCost)}</span> },
    {
      key: 'op',
      title: '操作',
      width: 150,
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs text-primary hover:text-primary-hover" onClick={() => navigate(`/console/compute/instances/${r.id}`)}>
            监控
          </button>
          {r.status === 'running' && (
            <button
              className="text-xs text-ink-2 hover:text-ink-1"
              onClick={() => {
                setStatus(r.id, 'stopped');
                toast(`实例 ${r.id} 已停止`, 'info');
              }}
            >
              停止
            </button>
          )}
          {r.status === 'stopped' && (
            <button
              className="text-xs text-success hover:underline"
              onClick={() => {
                setStatus(r.id, 'running');
                toast(`实例 ${r.id} 已启动`);
              }}
            >
              启动
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="算力实例"
        desc="预留实例按月结算，按量实例按卡·时结算；停机后按量实例不再计费，预留实例仍占用配额"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            新建实例
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="运行中实例" value={String(running.length)} unit="台" hint={`共 ${rows.length} 台`} />
        <StatCard label="占用 GPU" value={String(running.reduce((a, i) => a + i.cardCount, 0))} unit="卡" hint="含包月与按量" tone="primary" />
        <StatCard label="本月卡时" value={num(running.reduce((a, i) => a + i.hoursUsed, 0))} unit="卡·时" hint="截至 10-30" />
        <StatCard label="本月算力费用" value={money(rows.reduce((a, i) => a + i.monthlyCost, 0))} hint="不含税" tone="success" />
      </div>

      <Card pad={false}>
        <div className="px-4 pt-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 台实例</span>}>
            <Select className="w-32" defaultValue="all">
              <option value="all">全部规格</option>
              {COMPUTE_SPECS.map((s) => (
                <option key={s.id}>{s.gpuModel}</option>
              ))}
            </Select>
            <Select className="w-32" defaultValue="all">
              <option value="all">全部状态</option>
              <option>运行中</option>
              <option>已停止</option>
            </Select>
          </FilterBar>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={8}
          onRowClick={(r) => navigate(`/console/compute/instances/${r.id}`)}
          emptyTitle="还没有算力实例"
          emptyDesc="创建第一个实例，开始运行你的训练或推理任务"
          emptyAction={
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              新建实例
            </Button>
          }
        />
      </Card>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="新建算力实例"
        subtitle="选择规格 → 选择镜像 → 配置资源与时长"
        width={600}
        footer={
          <>
            <div className="mr-auto text-xs text-ink-3">
              预计费用 <span className="num text-base font-semibold text-ink-1">{money(estimate)}</span>
              <span className="ml-1">
                （{cards} 卡 × {hours} 时 × {money(price)}）
              </span>
            </div>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button variant="primary" onClick={create}>
              确认创建
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <div className="mb-2 text-xs font-medium text-ink-2">1. 选择规格</div>
            <div className="grid grid-cols-2 gap-2">
              {COMPUTE_SPECS.filter((s) => s.status !== 'soldout').map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSpecId(s.id)}
                  className={`rounded-ctl border px-3 py-2.5 text-left transition-colors ${
                    specId === s.id ? 'border-primary bg-primary-soft' : 'border-line hover:bg-[#FCFCFD]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-1">{s.gpuModel}</span>
                    {specId === s.id && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <div className="num mt-1 text-2xs text-ink-3">
                    {s.memoryGB}G · {money(s.unitPrice)}/卡·时
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-ink-2">2. 选择镜像</div>
            <Select value={image} onChange={(e) => setImage(e.target.value)}>
              <option>PyTorch 2.4 / CUDA 12.4</option>
              <option>TensorFlow 2.16 / CUDA 12.4</option>
              <option>vLLM 0.6 推理镜像</option>
              <option>基础 CUDA 12.4</option>
              <option>自定义镜像（从镜像仓库拉取）</option>
            </Select>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-ink-2">3. 配置资源与时长</div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-2xs text-ink-3">卡数</span>
                <div className="flex items-center gap-2">
                  <button
                    className="h-9 w-9 rounded-ctl border border-line text-ink-2 hover:bg-[#F9FAFB]"
                    onClick={() => setCards(Math.max(1, cards - 1))}
                  >
                    −
                  </button>
                  <input
                    value={cards}
                    onChange={(e) => setCards(Math.max(1, Number(e.target.value) || 1))}
                    className="num h-9 w-full rounded-ctl border border-line text-center text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    className="h-9 w-9 rounded-ctl border border-line text-ink-2 hover:bg-[#F9FAFB]"
                    onClick={() => setCards(cards + 1)}
                  >
                    +
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-2xs text-ink-3">时长（小时）</span>
                <input
                  value={hours}
                  onChange={(e) => setHours(Math.max(1, Number(e.target.value) || 1))}
                  className="num h-9 w-full rounded-ctl border border-line px-3 text-sm focus:border-primary focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-3 space-y-2">
              <Radio
                checked={mode === 'usage'}
                onChange={() => setMode('usage')}
                label="按量计费"
                desc="按卡·时结算，随时释放，适合短期任务"
              />
              <Radio
                checked={mode === 'reserved'}
                onChange={() => setMode('reserved')}
                label="包月预留（8 折）"
                desc={`单价 ${money(round2(spec.unitPrice * 0.8))}/卡·时，需承诺至少 720 小时`}
              />
            </div>
          </div>

          <div className="rounded-ctl bg-[#F9FAFB] px-3.5 py-3">
            <div className="text-2xs font-medium text-ink-2">费用预估</div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-3">规格单价</span>
                <span className="num text-ink-1">{money(price)} / 卡·时</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">卡数 × 时长</span>
                <span className="num text-ink-1">{cards} × {hours} = {cards * hours} 卡·时</span>
              </div>
              <div className="flex justify-between border-t border-line pt-1.5">
                <span className="text-ink-2">合计（不含税）</span>
                <span className="num font-semibold text-primary">{money(estimate)}</span>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

/* ================= 实例监控 ================= */
export function InstanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const instances = useAppStore((s) => s.instances);
  const inst = instances.find((i) => i.id === id);
  const metrics = useMemo(() => (id ? instanceMetrics(id) : []), [id]);

  if (!inst) {
    return (
      <div className="py-20 text-center text-sm text-ink-2">
        实例不存在，<button className="link" onClick={() => navigate('/console/compute/instances')}>返回列表</button>
      </div>
    );
  }

  const series = [
    { key: 'util', name: 'GPU 利用率（%）', icon: Activity, unit: '%', color: 'text-primary' },
    { key: 'mem', name: '显存占用（%）', icon: HardDrive, unit: '%', color: 'text-cyanx' },
    { key: 'temp', name: '温度（℃）', icon: Thermometer, unit: '℃', color: 'text-warning' },
    { key: 'power', name: '功耗（W）', icon: Zap, unit: 'W', color: 'text-[#7C3AED]' },
  ];

  return (
    <div>
      <button
        onClick={() => navigate('/console/compute/instances')}
        className="mb-3 inline-flex items-center gap-1 text-xs text-ink-2 hover:text-ink-1"
      >
        <ArrowLeft size={13} /> 返回实例列表
      </button>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="num text-xl font-semibold text-ink-1">{inst.id}</h1>
            <StatusBadge status={inst.status} />
          </div>
          <p className="mt-1.5 text-sm text-ink-2">
            {inst.specName} · {inst.cardCount} 卡 · {inst.image}
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon={<RotateCw size={14} />}>重启</Button>
          <Button icon={<Square size={14} />} disabled={inst.status !== 'running'}>
            停止
          </Button>
          <Button variant="primary" icon={<Play size={14} />} disabled={inst.status === 'running'}>
            启动
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="GPU 平均利用率" value="76.4" unit="%" hint="近 24 小时" tone="primary" />
        <StatCard label="显存占用" value="68.2" unit="%" hint="峰值 92.1%" />
        <StatCard label="最高温度" value="71" unit="℃" hint="阈值 85℃" />
        <StatCard label="本月费用" value={money(inst.monthlyCost)} hint={`已运行 ${num(inst.hoursUsed)} 卡·时`} tone="success" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {series.slice(0, 2).map((s) => (
          <Card key={s.key}>
            <CardHeader title={s.name} desc="近 24 小时，每 30 分钟采样" extra={<s.icon size={15} className={s.color} />} />
            <div className="mt-3">
              <MultiLine
                data={metrics}
                xKey="t"
                height={200}
                series={[{ key: s.key, name: s.name }]}
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="实例配置" />
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {[
              ['实例 ID', inst.id],
              ['规格', inst.specName],
              ['镜像', inst.image],
              ['卡数', `${inst.cardCount} 卡`],
              ['计费方式', inst.billingMode === 'reserved' ? '包月预留' : '按量计费'],
              ['区域', inst.region],
              ['创建时间', inst.createdAt.slice(0, 16).replace('T', ' ')],
              ['单价', inst.billingMode === 'reserved' ? '¥54.40 / 卡·时（8 折）' : '¥12.00 / 卡·时'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-ink-3">{k}</div>
                <div className="mt-1 text-ink-1">{v}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="计费明细" desc="本账期累计" />
          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-2">卡·时用量</span>
              <span className="num text-ink-1">{num(inst.hoursUsed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-2">单价</span>
              <span className="num text-ink-1">{inst.billingMode === 'reserved' ? '¥54.40' : '¥12.00'}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2.5">
              <span className="text-ink-2">金额（不含税）</span>
              <span className="num font-semibold text-primary">{money(inst.monthlyCost)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ink-3">税额（6%）</span>
              <span className="num text-ink-2">{money(round2(inst.monthlyCost * 0.06))}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================= 配额与预留 ================= */
export function ComputeQuota() {
  const tenant = useCurrentTenant();
  const rows = QUOTAS.filter((q) => q.tenantId === tenant.id);

  return (
    <div>
      <PageHeader title="配额与预留" desc="包月预留额度按自然月结算，未用完的额度不结转、不退款" />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="预留总卡数" value={String(rows.reduce((a, r) => a + r.cards, 0))} unit="卡" hint="4 个规格" />
        <StatCard label="已使用" value={String(rows.reduce((a, r) => a + r.usedCards, 0))} unit="卡" tone="primary" />
        <StatCard label="配额利用率" value="67.5" unit="%" hint="低于 80% 建议下调预留" tone="warning" />
      </div>

      <Card className="mb-4">
        <CardHeader title="预留配额明细" desc="到期前 30 天可申请续期或调整卡数" extra={<Gauge size={15} className="text-ink-3" />} />
        <div className="mt-4 space-y-4">
          {rows.map((q) => (
            <div key={q.id}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-ink-1">{q.specName}</span>
                <span className="num text-ink-2">
                  {q.usedCards} / {q.cards} 卡 · 到期 {q.expireAt}
                </span>
              </div>
              <Progress value={(q.usedCards / q.cards) * 100} height={6} tone={q.usedCards / q.cards > 0.85 ? 'warning' : 'primary'} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="配额消耗趋势" desc="近 8 周卡·时消耗" />
        <div className="mt-4">
          <BarChartH
            data={[
              { week: 'W36', hours: 2680 },
              { week: 'W37', hours: 3120 },
              { week: 'W38', hours: 2940 },
              { week: 'W39', hours: 3480 },
              { week: 'W40', hours: 3260 },
              { week: 'W41', hours: 3620 },
              { week: 'W42', hours: 3840 },
              { week: 'W43', hours: 3268 },
            ]}
            labelKey="week"
            valueKey="hours"
            height={220}
            money={false}
          />
        </div>
      </Card>
    </div>
  );
}
