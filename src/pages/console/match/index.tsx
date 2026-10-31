import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Download,
  GitCompare,
  Info,
  Plus,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Drawer, Progress, Tabs } from '@/components/ui/Overlay';
import { Field, FilterBar, SearchInput, Select } from '@/components/ui/Form';
import { MultiLine, RadarChartBox } from '@/components/charts';
import { useAppStore } from '@/store/appStore';
import { useCurrentTenant } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { MATCH_TASKS, MATCH_TREND, pairsOf } from '@/mocks/matches';
import { duration, money, num } from '@/lib/format';
import type { MatchTask } from '@/types';

const STRATEGY_LABEL: Record<string, string> = {
  rule: '规则匹配',
  vector: '向量相似',
  graph: '图谱关联',
};

/* ================= 匹配任务列表 ================= */
export function MatchTasks() {
  const navigate = useNavigate();
  const tenant = useCurrentTenant();
  const toast = useUIStore((s) => s.toast);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const rows = MATCH_TASKS.filter((t) => t.tenantId === tenant.id);

  const columns: Column<MatchTask>[] = [
    { key: 'name', title: '任务名称', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'datasetA', title: '数据集 A → B', width: 300, render: (r) => (
      <span className="flex items-center gap-1.5 text-xs text-ink-2">
        <span className="truncate">{r.datasetA}</span>
        <span className="text-ink-3">→</span>
        <span className="truncate">{r.datasetB}</span>
      </span>
    ) },
    { key: 'strategy', title: '策略', width: 100, render: (r) => <Badge tone="gray">{STRATEGY_LABEL[r.strategy]}</Badge> },
    { key: 'threshold', title: '阈值', width: 70, align: 'right', render: (r) => <span className="num text-ink-2">{r.threshold}</span> },
    { key: 'totalPairs', title: '匹配对', width: 100, align: 'right', sortable: true, sorter: (a, b) => a.totalPairs - b.totalPairs, render: (r) => <span className="num">{num(r.totalPairs)}</span> },
    {
      key: 'conf',
      title: '置信度分布',
      width: 180,
      render: (r) =>
        r.totalPairs === 0 ? (
          <span className="text-2xs text-ink-3">—</span>
        ) : (
          <div className="flex h-2 w-full overflow-hidden rounded-full">
            <span className="bg-success" style={{ width: `${(r.highConf / r.totalPairs) * 100}%` }} />
            <span className="bg-warning" style={{ width: `${(r.midConf / r.totalPairs) * 100}%` }} />
            <span className="bg-[#D0D5DD]" style={{ width: `${(r.lowConf / r.totalPairs) * 100}%` }} />
          </div>
        ),
    },
    { key: 'status', title: '状态', width: 90, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'op',
      title: '操作',
      width: 110,
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs text-primary hover:text-primary-hover" onClick={() => navigate(`/console/match/tasks/${r.id}`)}>
            结果
          </button>
          <button className="text-xs text-ink-2 hover:text-ink-1" onClick={() => toast('任务已重新执行', 'info')}>
            重跑
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="智能信息匹配"
        desc="基于统一社会信用代码、名称、地址与经营范围做实体对齐，按匹配对计费"
        actions={
          <>
            <Button icon={<Download size={14} />} onClick={() => toast('匹配结果已导出', 'info')}>
              导出结果
            </Button>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
              新建匹配任务
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="本月匹配对" value={num(rows.reduce((a, t) => a + t.totalPairs, 0))} unit="对" hint="7 个任务" tone="primary" />
        <StatCard label="高置信占比" value="78.6" unit="%" hint="置信度 > 0.9" tone="success" />
        <StatCard label="人工复核通过率" value="94.3" unit="%" hint="已复核 32.6%" />
        <StatCard label="本月费用" value={money(rows.reduce((a, t) => a + t.totalPairs, 0) * 0.22)} hint="按 ¥0.22/对" />
      </div>

      <Card pad={false}>
        <div className="p-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 个任务</span>}>
            <Select className="w-36" defaultValue="all">
              <option value="all">全部策略</option>
              <option>规则匹配</option>
              <option>向量相似</option>
              <option>图谱关联</option>
            </Select>
            <Select className="w-36" defaultValue="all">
              <option value="all">全部状态</option>
              <option>成功</option>
              <option>运行中</option>
              <option>失败</option>
            </Select>
          </FilterBar>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={8}
          onRowClick={(r) => navigate(`/console/match/tasks/${r.id}`)}
          emptyTitle="暂无匹配任务"
        />
      </Card>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="新建智能匹配任务"
        subtitle="选择双侧数据集并设定匹配策略"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                setOpen(false);
                toast(`任务「${name || '未命名匹配'}」已提交，预计 4 分钟完成`, 'info');
              }}
            >
              开始匹配
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="任务名称" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：供应商名录 × 外部工商库对齐"
              className="h-9 w-full rounded-ctl border border-line px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="数据集 A（左）" required>
              <Select defaultValue="供应商主数据_全量">
                <option>供应商主数据_全量</option>
                <option>客户与经销商名录</option>
                <option>物料主数据_标准版</option>
              </Select>
            </Field>
            <Field label="数据集 B（右）" required>
              <Select defaultValue="外部企业工商库_华北">
                <option>外部企业工商库_华北</option>
                <option>供应商主数据_全量</option>
                <option>客户与经销商名录</option>
              </Select>
            </Field>
          </div>
          <Field label="匹配策略" required hint="向量相似适合名称不完全一致的场景，规则匹配适合强主键场景">
            <Select defaultValue="vector">
              <option value="vector">向量相似（推荐）</option>
              <option value="rule">规则匹配</option>
              <option value="graph">图谱关联</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="判定阈值">
              <input defaultValue="0.70" className="num h-9 w-full rounded-ctl border border-line px-3 text-sm" />
            </Field>
            <Field label="字段映射">
              <Select defaultValue="auto">
                <option value="auto">自动推断</option>
                <option value="manual">手动指定</option>
              </Select>
            </Field>
          </div>
          <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2.5 text-2xs leading-relaxed text-ink-3">
            配对方式：以统一社会信用代码为强主键，名称相似度与地址相似度作为辅助特征加权。
            置信度高于阈值的结果将进入人工复核队列，按实际匹配对数计费 ¥0.22/对。
          </div>
        </div>
      </Drawer>
    </div>
  );
}

/* ================= 匹配结果 ================= */
export function MatchTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pairs = useAppStore((s) => s.pairs);
  const reviewPair = useAppStore((s) => s.reviewPair);
  const reviewPairs = useAppStore((s) => s.reviewPairs);
  const toast = useUIStore((s) => s.toast);

  const task = MATCH_TASKS.find((t) => t.id === id);
  const [band, setBand] = useState<'all' | 'high' | 'mid' | 'low'>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [kw, setKw] = useState('');

  const taskPairs = useMemo(() => (id ? pairsOf(id) : []), [id, pairs]);

  const filtered = useMemo(() => {
    return taskPairs
      .filter((p) => {
        if (band === 'high') return p.confidence >= 0.9;
        if (band === 'mid') return p.confidence >= 0.7 && p.confidence < 0.9;
        if (band === 'low') return p.confidence < 0.7;
        return true;
      })
      .filter((p) => !kw || JSON.stringify(p.left).includes(kw) || JSON.stringify(p.right).includes(kw));
  }, [taskPairs, band, kw]);

  if (!task) {
    return (
      <div className="py-20 text-center text-sm text-ink-2">
        任务不存在，<button className="link" onClick={() => navigate('/console/match/tasks')}>返回列表</button>
      </div>
    );
  }

  const high = taskPairs.filter((p) => p.confidence >= 0.9).length;
  const mid = taskPairs.filter((p) => p.confidence >= 0.7 && p.confidence < 0.9).length;
  const low = taskPairs.filter((p) => p.confidence < 0.7).length;
  const reviewed = taskPairs.filter((p) => p.reviewStatus !== 'pending').length;

  return (
    <div>
      <button
        onClick={() => navigate('/console/match/tasks')}
        className="mb-3 inline-flex items-center gap-1 text-xs text-ink-2 hover:text-ink-1"
      >
        <ArrowLeft size={13} /> 返回匹配任务
      </button>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-ink-1">{task.name}</h1>
            <StatusBadge status={task.status} />
            <Badge tone="gray">{STRATEGY_LABEL[task.strategy]}</Badge>
          </div>
          <p className="mt-1.5 text-sm text-ink-2">
            {task.datasetA} → {task.datasetB} ｜ 阈值 {task.threshold} ｜ 创建于 {task.createdAt.slice(0, 16).replace('T', ' ')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon={<Download size={14} />} onClick={() => toast('匹配结果已导出 CSV', 'info')}>
            导出
          </Button>
          <Button
            variant="primary"
            icon={<CheckCheck size={14} />}
            disabled={selected.length === 0}
            onClick={() => {
              reviewPairs(selected, 'approved');
              toast(`已批量通过 ${selected.length} 条匹配结果`);
              setSelected([]);
            }}
          >
            批量通过 {selected.length > 0 && `(${selected.length})`}
          </Button>
        </div>
      </div>

      {/* 分档卡 */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <button onClick={() => setBand('all')} className="text-left">
          <Card className={band === 'all' ? 'border-primary ring-1 ring-primary-ring' : ''}>
            <div className="text-xs text-ink-2">全部匹配对</div>
            <div className="num mt-2 text-2xl font-semibold text-ink-1">{num(taskPairs.length)}</div>
            <div className="mt-1 text-xs text-ink-3">已复核 {reviewed} 条</div>
          </Card>
        </button>
        {[
          { k: 'high' as const, label: '高置信（> 0.9）', v: high, tone: 'text-success' },
          { k: 'mid' as const, label: '待复核（0.7 - 0.9）', v: mid, tone: 'text-warning' },
          { k: 'low' as const, label: '低置信（< 0.7）', v: low, tone: 'text-ink-2' },
        ].map((b) => (
          <button key={b.k} onClick={() => setBand(b.k)} className="text-left">
            <Card className={band === b.k ? 'border-primary ring-1 ring-primary-ring' : ''}>
              <div className="text-xs text-ink-2">{b.label}</div>
              <div className={`num mt-2 text-2xl font-semibold ${b.tone}`}>{num(b.v)}</div>
              <div className="mt-1 text-xs text-ink-3">{((b.v / taskPairs.length) * 100).toFixed(1)}% 占比</div>
            </Card>
          </button>
        ))}
      </div>

      <Card pad={false}>
        <div className="p-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">当前 {filtered.length} 条</span>}>
            <SearchInput value={kw} onChange={setKw} placeholder="搜索企业名称或信用代码" className="w-72" />
            <button
              className="rounded-ctl border border-line px-3 py-1.5 text-xs text-ink-2 hover:bg-[#F9FAFB]"
              onClick={() => setSelected(filtered.filter((p) => p.reviewStatus === 'pending').map((p) => p.id))}
            >
              全选当前页待复核
            </button>
          </FilterBar>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] text-xs text-ink-2">
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-primary"
                    checked={selected.length > 0 && selected.length === filtered.filter((p) => p.reviewStatus === 'pending').length}
                    onChange={(e) =>
                      setSelected(e.target.checked ? filtered.filter((p) => p.reviewStatus === 'pending').map((p) => p.id) : [])
                    }
                  />
                </th>
                <th className="px-3 py-2.5 text-left font-medium">数据集 A</th>
                <th className="w-56 px-3 py-2.5 text-left font-medium">匹配判定</th>
                <th className="px-3 py-2.5 text-left font-medium">数据集 B</th>
                <th className="w-24 px-3 py-2.5 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((p) => {
                const tone =
                  p.confidence >= 0.9 ? 'text-success' : p.confidence >= 0.7 ? 'text-warning' : 'text-ink-2';
                const ring =
                  p.confidence >= 0.9 ? '#15803D' : p.confidence >= 0.7 ? '#B45309' : '#98A2B3';
                return (
                  <tr key={p.id} className="align-top hover:bg-[#FCFCFD]">
                    <td className="border-t border-line px-3 py-3">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-primary"
                        checked={selected.includes(p.id)}
                        onChange={(e) =>
                          setSelected(e.target.checked ? [...selected, p.id] : selected.filter((x) => x !== p.id))
                        }
                        disabled={p.reviewStatus !== 'pending'}
                      />
                    </td>
                    <td className="border-t border-line px-3 py-3">
                      <div className="text-sm font-medium text-ink-1">{p.left.名称}</div>
                      <div className="mt-1 space-y-0.5 text-2xs text-ink-3">
                        <div>编码 {p.left.编码}</div>
                        <div>
                          {p.left.注册地} · 法定代表人 {p.left.法定代表人}
                        </div>
                      </div>
                    </td>
                    <td className="border-t border-line px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-10 w-10 shrink-0">
                          <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#F2F4F7" strokeWidth="3" />
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke={ring}
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={`${p.confidence * 94.2} 94.2`}
                            />
                          </svg>
                          <span className={`num absolute inset-0 flex items-center justify-center text-2xs font-semibold ${tone}`}>
                            {(p.confidence * 100).toFixed(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-2xs leading-relaxed text-ink-2">{p.basis}</div>
                          {p.reviewStatus !== 'pending' && (
                            <Badge tone={p.reviewStatus === 'approved' ? 'green' : 'red'} className="mt-1">
                              {p.reviewStatus === 'approved' ? '已通过' : '已驳回'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="border-t border-line px-3 py-3">
                      <div className="text-sm font-medium text-ink-1">{p.right.企业名称}</div>
                      <div className="mt-1 space-y-0.5 font-mono text-2xs text-ink-3">
                        <div>{p.right.统一社会信用代码}</div>
                        <div>
                          成立 {p.right.成立日期} · 注册资本 {p.right.注册资本}
                        </div>
                      </div>
                    </td>
                    <td className="border-t border-line px-3 py-3">
                      {p.reviewStatus === 'pending' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              reviewPair(p.id, 'approved');
                              toast('已通过');
                            }}
                            className="rounded p-1.5 text-success hover:bg-success-soft"
                            title="通过"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button
                            onClick={() => {
                              reviewPair(p.id, 'rejected');
                              toast('已驳回', 'info');
                            }}
                            className="rounded p-1.5 text-danger hover:bg-danger-soft"
                            title="驳回"
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          {p.reviewStatus === 'approved' ? (
                            <Check size={15} className="text-success" />
                          ) : (
                            <X size={15} className="text-danger" />
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-ink-3">
          <span>
            显示前 20 条 / 共 <span className="num text-ink-2">{filtered.length}</span> 条
            {selected.length > 0 && <span className="ml-2 text-primary">已选 {selected.length} 条</span>}
          </span>
          <span className="flex items-center gap-1">
            <Info size={12} /> 置信度由「信用代码一致性 + 名称相似度 + 地址相似度」加权得出
          </span>
        </div>
      </Card>
    </div>
  );
}

/* ================= 效果分析 ================= */
export function MatchAnalysis() {
  const tenant = useCurrentTenant();
  const rows = MATCH_TASKS.filter((t) => t.tenantId === tenant.id && t.totalPairs > 0);

  const byStrategy = ['rule', 'vector', 'graph'].map((s) => {
    const list = rows.filter((r) => r.strategy === s);
    const pairs = list.reduce((a, r) => a + r.totalPairs, 0);
    return { name: STRATEGY_LABEL[s], pairs, tasks: list.length };
  });

  return (
    <div>
      <PageHeader title="匹配效果分析" desc="按策略与时间维度评估召回、准确率与人工复核通过率" />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="平均召回率" value="94.0" unit="%" hint="近 8 周，环比 +2.1pp" tone="success" />
        <StatCard label="平均准确率" value="96.0" unit="%" hint="高置信区间抽样验证" tone="primary" />
        <StatCard label="人工复核通过率" value="95.0" unit="%" hint="已复核 12,840 条" />
        <StatCard label="单位匹配成本" value="¥0.22" hint="含向量化与打分" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="效果趋势" desc="召回率 / 准确率 / 复核通过率，按周统计" />
          <div className="mt-3">
            <MultiLine
              data={MATCH_TREND}
              xKey="week"
              percent
              height={280}
              series={[
                { key: 'recall', name: '召回率' },
                { key: 'precision', name: '准确率' },
                { key: 'approve', name: '复核通过率' },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="策略效果对比" />
          <div className="mt-3">
            <RadarChartBox
              data={[
                { label: '准确率', score: 96 },
                { label: '召回率', score: 94 },
                { label: '覆盖率', score: 88 },
                { label: '可解释性', score: 92 },
                { label: '成本效率', score: 85 },
              ]}
              height={230}
            />
          </div>
          <div className="mt-2 space-y-2">
            {byStrategy.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="text-ink-2">{s.name}</span>
                <span className="num text-ink-1">
                  {num(s.pairs)} 对 / {s.tasks} 个任务
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="任务效果明细" desc="按匹配对数量排序" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] text-xs text-ink-2">
              <tr>
                <th className="px-3 py-2 text-left font-medium">任务</th>
                <th className="px-3 py-2 text-left font-medium">策略</th>
                <th className="px-3 py-2 text-right font-medium">匹配对</th>
                <th className="px-3 py-2 text-left font-medium" style={{ width: 220 }}>
                  置信度分布
                </th>
                <th className="px-3 py-2 text-right font-medium">复核进度</th>
                <th className="px-3 py-2 text-right font-medium">费用</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .sort((a, b) => b.totalPairs - a.totalPairs)
                .map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-3 py-2.5">{r.name}</td>
                    <td className="px-3 py-2.5 text-xs text-ink-2">{STRATEGY_LABEL[r.strategy]}</td>
                    <td className="num px-3 py-2.5 text-right">{num(r.totalPairs)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex h-2 w-full overflow-hidden rounded-full">
                        <span className="bg-success" style={{ width: `${(r.highConf / r.totalPairs) * 100}%` }} />
                        <span className="bg-warning" style={{ width: `${(r.midConf / r.totalPairs) * 100}%` }} />
                        <span className="bg-[#D0D5DD]" style={{ width: `${(r.lowConf / r.totalPairs) * 100}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16">
                          <Progress value={(r.reviewedCount / r.totalPairs) * 100} height={4} />
                        </div>
                        <span className="num text-2xs text-ink-2">
                          {((r.reviewedCount / r.totalPairs) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="num px-3 py-2.5 text-right">{money(r.totalPairs * 0.22)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
