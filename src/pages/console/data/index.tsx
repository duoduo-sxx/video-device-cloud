import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDot,
  Database,
  Download,
  FileSpreadsheet,
  HardDrive,
  Play,
  Plus,
  RotateCw,
  Square,
  Table2,
  Upload,
} from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Drawer, Progress, Tabs } from '@/components/ui/Overlay';
import { FilterBar, Field, SearchInput, Select, Textarea } from '@/components/ui/Form';
import { RadarChartBox } from '@/components/charts';
import { useCurrentTenant } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { DATA_JOBS, DATA_SOURCES, DATASETS, PREVIEW_ROWS, datasetOf } from '@/mocks/data';
import { duration, money, num } from '@/lib/format';
import type { DataJob, DataSource } from '@/types';

/* ================= 数据加工任务 ================= */
export function DataJobs() {
  const navigate = useNavigate();
  const tenant = useCurrentTenant();
  const toast = useUIStore((s) => s.toast);
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(false);
  const [jobName, setJobName] = useState('');
  const [dsId, setDsId] = useState('DSET-001');
  const [selectedOps, setSelectedOps] = useState<string[]>(['clean', 'dedupe']);

  const rows = DATA_JOBS.filter((j) => j.tenantId === tenant.id).filter(
    (j) => tab === 'all' || j.status === tab,
  );

  const OP_LIST = [
    ['clean', '数据清洗', '去空格、统一编码、修正非法字符'],
    ['dedupe', '去重', '按主键与相似度双策略识别重复'],
    ['standard', '字段标准化', '日期格式、单位换算、枚举对齐'],
    ['mask', '敏感信息脱敏', '证件号、手机号、银行卡掩码'],
    ['label', 'AI 预标注', '预标注置信度低于阈值转人工'],
    ['etl', '多源 ETL 合并', '字段对齐、冲突消解、合并入库'],
  ];

  const columns: Column<DataJob>[] = [
    { key: 'name', title: '任务名称', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'datasetName', title: '数据集', width: 180, render: (r) => <span className="text-xs text-ink-2">{r.datasetName}</span> },
    {
      key: 'operators',
      title: '算子',
      width: 200,
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.operators.slice(0, 3).map((o) => (
            <span key={o.name} className="rounded bg-[#F2F4F7] px-1.5 py-0.5 text-2xs text-ink-2">
              {o.name}
            </span>
          ))}
          {r.operators.length > 3 && <span className="text-2xs text-ink-3">+{r.operators.length - 3}</span>}
        </div>
      ),
    },
    { key: 'inputRows', title: '输入行数', width: 110, align: 'right', sortable: true, sorter: (a, b) => a.inputRows - b.inputRows, render: (r) => <span className="num text-ink-2">{num(r.inputRows)}</span> },
    { key: 'durationMs', title: '耗时', width: 90, align: 'right', render: (r) => <span className="num text-ink-2">{r.durationMs ? duration(r.durationMs) : '—'}</span> },
    { key: 'cost', title: '费用', width: 100, align: 'right', render: (r) => <span className="num">{money(r.cost)}</span> },
    {
      key: 'status',
      title: '状态',
      width: 110,
      render: (r) =>
        r.status === 'running' ? (
          <div className="w-24">
            <StatusBadge status={r.status} />
            <div className="mt-1">
              <Progress value={r.progress} height={3} />
            </div>
          </div>
        ) : (
          <StatusBadge status={r.status} />
        ),
    },
    {
      key: 'op',
      title: '操作',
      width: 110,
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs text-primary hover:text-primary-hover" onClick={() => navigate(`/console/data/jobs/${r.id}`)}>
            详情
          </button>
          <button className="text-xs text-ink-2 hover:text-ink-1" onClick={() => toast(`任务 ${r.name} 已重新提交`, 'info')}>
            重跑
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="数据加工任务"
        desc="场景服务层：多源数据清洗、去重、脱敏、标注与 ETL 合并，按处理条数计费"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            新建任务
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="本月任务数" value={String(DATA_JOBS.length)} unit="个" hint="成功 5 / 运行 1 / 失败 1" />
        <StatCard label="处理数据量" value="1,024" unit="万行" hint="较上月 +12.4%" tone="primary" />
        <StatCard label="平均耗时" value="4.2" unit="分钟" hint="P50，含排队时间" />
        <StatCard label="本月费用" value={money(DATA_JOBS.reduce((a, j) => a + j.cost, 0))} hint="不含税" tone="success" />
      </div>

      <Card pad={false}>
        <div className="px-4 pt-2">
          <Tabs
            tabs={[
              { key: 'all', label: '全部', count: DATA_JOBS.length },
              { key: 'running', label: '运行中', count: DATA_JOBS.filter((j) => j.status === 'running').length },
              { key: 'success', label: '成功', count: DATA_JOBS.filter((j) => j.status === 'success').length },
              { key: 'failed', label: '失败', count: DATA_JOBS.filter((j) => j.status === 'failed').length },
              { key: 'waiting', label: '排队中', count: DATA_JOBS.filter((j) => j.status === 'waiting').length },
            ]}
            active={tab}
            onChange={setTab}
            className="mb-3"
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={8}
          onRowClick={(r) => navigate(`/console/data/jobs/${r.id}`)}
          emptyTitle="暂无任务"
          emptyDesc="新建一个数据加工任务，把原始数据变成可用的数据集"
        />
      </Card>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="新建数据加工任务"
        subtitle="选择数据集 → 勾选算子 → 配置参数"
        width={600}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                setOpen(false);
                toast(`任务「${jobName || '未命名任务'}」已提交，正在排队`, 'info');
              }}
            >
              提交任务
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="任务名称" required>
            <input
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="例如：供应商名录清洗与去重"
              className="h-9 w-full rounded-ctl border border-line px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
            />
          </Field>

          <Field label="输入数据集" required>
            <Select value={dsId} onChange={(e) => setDsId(e.target.value)}>
              {DATASETS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}（{num(d.rowCount)} 行）
                </option>
              ))}
            </Select>
          </Field>

          <div>
            <div className="mb-2 text-xs font-medium text-ink-2">加工算子（按勾选顺序执行）</div>
            <div className="space-y-1.5">
              {OP_LIST.map(([k, name, desc]) => {
                const checked = selectedOps.includes(k);
                return (
                  <button
                    key={k}
                    onClick={() =>
                      setSelectedOps(checked ? selectedOps.filter((x) => x !== k) : [...selectedOps, k])
                    }
                    className={`flex w-full items-start gap-2.5 rounded-ctl border px-3 py-2.5 text-left transition-colors ${
                      checked ? 'border-primary bg-primary-soft' : 'border-line hover:bg-[#FCFCFD]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? 'border-primary bg-primary' : 'border-[#D0D5DD]'
                      }`}
                    >
                      {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block text-xs font-medium text-ink-1">{name}</span>
                      <span className="mt-0.5 block text-2xs text-ink-3">{desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="输出数据集名称">
            <input
              placeholder="默认在原数据集名称后追加 _out"
              className="h-9 w-full rounded-ctl border border-line px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
            />
          </Field>

          <div className="rounded-ctl bg-[#F9FAFB] px-3.5 py-3 text-2xs leading-relaxed text-ink-2">
            预估处理 {num(datasetOf(dsId)?.rowCount ?? 0)} 行，按 ¥0.012/条 计费，预计费用{' '}
            <span className="num font-medium text-ink-1">
              {money((datasetOf(dsId)?.rowCount ?? 0) * 0.012)}
            </span>
            。实际以处理成功条数结算。
          </div>
        </div>
      </Drawer>
    </div>
  );
}

/* ================= 任务详情 ================= */
export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useUIStore((s) => s.toast);
  const [tab, setTab] = useState('log');
  const job = DATA_JOBS.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="py-20 text-center text-sm text-ink-2">
        任务不存在，<button className="link" onClick={() => navigate('/console/data/jobs')}>返回列表</button>
      </div>
    );
  }

  const statusColor = (s: string) =>
    s === 'success'
      ? 'border-success bg-success-soft text-success'
      : s === 'running'
        ? 'border-primary bg-primary-soft text-primary'
        : s === 'failed'
          ? 'border-danger bg-danger-soft text-danger'
          : 'border-line bg-[#F9FAFB] text-ink-3';

  return (
    <div>
      <button
        onClick={() => navigate('/console/data/jobs')}
        className="mb-3 inline-flex items-center gap-1 text-xs text-ink-2 hover:text-ink-1"
      >
        <ArrowLeft size={13} /> 返回任务列表
      </button>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-ink-1">{job.name}</h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="mt-1.5 text-sm text-ink-2">
            <span className="num">{job.id}</span> ｜ 数据集 {job.datasetName} ｜ 开始于{' '}
            {job.startedAt.slice(0, 16).replace('T', ' ')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon={<RotateCw size={14} />} onClick={() => toast('任务已重新提交', 'info')}>
            重跑
          </Button>
          <Button icon={<Square size={14} />} disabled={job.status !== 'running'}>
            停止
          </Button>
          <Button icon={<Download size={14} />} onClick={() => toast('产出数据集已导出', 'info')}>
            导出结果
          </Button>
        </div>
      </div>

      {/* 进度 */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-ink-1">
            {job.status === 'running' ? '正在执行' : job.status === 'success' ? '执行完成' : job.status === 'failed' ? '执行失败' : '等待资源'}
          </div>
          <span className="num text-sm text-ink-2">{Math.round(job.progress)}%</span>
        </div>
        <div className="mt-2.5">
          <Progress
            value={job.progress}
            height={8}
            tone={job.status === 'failed' ? 'danger' : job.status === 'success' ? 'success' : 'primary'}
          />
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="输入行数" value={num(job.inputRows)} hint={job.datasetName} />
        <StatCard label="输出行数" value={num(job.outputRows)} hint={`过滤 ${num(job.inputRows - job.outputRows)} 行`} tone="primary" />
        <StatCard label="耗时" value={job.durationMs ? duration(job.durationMs) : '—'} hint={`${job.operators.length} 个算子`} />
        <StatCard label="费用" value={money(job.cost)} hint="按成功处理条数计费" tone="success" />
      </div>

      {/* 算子流水线 */}
      <Card className="mb-4">
        <CardHeader title="算子流水线" desc="按执行顺序编排，失败时保留中间结果便于排查" />
        <div className="mt-5 flex flex-wrap items-stretch gap-y-4">
          <div className="flex items-center">
            <div className="flex h-[74px] w-[132px] flex-col justify-center rounded-ctl border border-line bg-[#F9FAFB] px-3">
              <div className="text-2xs text-ink-3">输入</div>
              <div className="mt-1 text-xs font-medium text-ink-1">{job.datasetName}</div>
              <div className="num mt-0.5 text-2xs text-ink-3">{num(job.inputRows)} 行</div>
            </div>
            <ArrowRight size={16} className="mx-1.5 shrink-0 text-ink-3" />
          </div>

          {job.operators.map((op) => (
            <div key={op.name} className="flex items-center">
              <div className={`flex h-[74px] w-[150px] flex-col justify-center rounded-ctl border px-3 ${statusColor(op.status)}`}>
                <div className="flex items-center gap-1.5">
                  <CircleDot size={11} />
                  <span className="text-xs font-medium">{op.name}</span>
                </div>
                <div className="num mt-1 text-2xs opacity-80">
                  {op.status === 'success' ? duration(op.costMs) : op.status === 'running' ? '执行中…' : '等待'}
                </div>
              </div>
              <ArrowRight size={16} className="mx-1.5 shrink-0 text-ink-3" />
            </div>
          ))}

          <div className="flex h-[74px] w-[132px] flex-col justify-center rounded-ctl border border-primary/30 bg-primary-soft px-3">
            <div className="text-2xs text-primary/70">输出</div>
            <div className="mt-1 text-xs font-medium text-primary">{job.datasetName}_out</div>
            <div className="num mt-0.5 text-2xs text-primary/70">{num(job.outputRows)} 行</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 md:grid-cols-3">
          {job.operators.map((op) => (
            <div key={op.name} className="rounded-ctl bg-[#F9FAFB] px-3 py-2">
              <div className="text-2xs font-medium text-ink-2">{op.name}</div>
              <div className="mt-1 text-2xs leading-relaxed text-ink-3">{op.detail}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <Card pad={false}>
        <div className="px-4 pt-2">
          <Tabs
            tabs={[
              { key: 'log', label: '运行日志', count: job.logs.length },
              { key: 'quality', label: '数据质量' },
              { key: 'preview', label: '产出预览' },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        {tab === 'log' && (
          <div className="p-4">
            <div className="max-h-[380px] overflow-y-auto rounded-ctl bg-[#0B1220] p-4 font-mono text-[11.5px] leading-[1.9]">
              {job.logs.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span className="shrink-0 text-[#475569]">{l.time.slice(11)}</span>
                  <span
                    className={`w-12 shrink-0 ${
                      l.level === 'ERROR' ? 'text-[#F87171]' : l.level === 'WARN' ? 'text-[#FBBF24]' : 'text-[#60A5FA]'
                    }`}
                  >
                    {l.level}
                  </span>
                  <span className="text-[#C7D2E4]">{l.msg}</span>
                </div>
              ))}
              {job.status === 'running' && (
                <div className="mt-1 flex gap-2 text-[#64748B]">
                  <span className="w-2 animate-pulse">▊</span>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'quality' && (
          <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-ink-1">质量评分雷达</div>
              <RadarChartBox data={job.quality} height={260} />
            </div>
            <div className="space-y-4 pt-4">
              {job.quality.map((q) => (
                <div key={q.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-ink-2">{q.label}</span>
                    <span className="num font-medium text-ink-1">{q.score}</span>
                  </div>
                  <Progress value={q.score} height={5} tone={q.score >= 90 ? 'success' : q.score >= 80 ? 'primary' : 'warning'} />
                </div>
              ))}
              <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2.5 text-2xs leading-relaxed text-ink-3">
                综合得分 {Math.round(job.quality.reduce((a, q) => a + q.score, 0) / job.quality.length)} 分。
                低于 80 分的维度建议追加校验规则或补充数据源。
              </div>
            </div>
          </div>
        )}

        {tab === 'preview' && (
          <div className="overflow-x-auto p-4">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#F9FAFB] text-ink-2">
                  {Object.keys(PREVIEW_ROWS[0]).map((k) => (
                    <th key={k} className="whitespace-nowrap border border-line px-2.5 py-2 text-left font-medium">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PREVIEW_ROWS.map((r, i) => (
                  <tr key={i} className="hover:bg-[#FCFCFD]">
                    {Object.values(r).map((v, j) => (
                      <td key={j} className="whitespace-nowrap border border-line px-2.5 py-1.5 text-ink-1">
                        {String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-2xs text-ink-3">仅展示前 10 行，完整结果已写入数据集 {job.datasetName}_out</div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ================= 数据集 ================= */
export function Datasets() {
  const tenant = useCurrentTenant();
  const toast = useUIStore((s) => s.toast);
  const [kw, setKw] = useState('');
  const rows = DATASETS.filter((d) => d.tenantId === tenant.id).filter((d) => !kw || d.name.includes(kw));

  const columns: Column<(typeof DATASETS)[number]>[] = [
    { key: 'name', title: '数据集名称', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'rowCount', title: '行数', width: 120, align: 'right', sortable: true, sorter: (a, b) => a.rowCount - b.rowCount, render: (r) => <span className="num">{num(r.rowCount)}</span> },
    { key: 'fieldCount', title: '字段数', width: 80, align: 'right', render: (r) => <span className="num text-ink-2">{r.fieldCount}</span> },
    { key: 'version', title: '版本', width: 120, render: (r) => <span className="num text-xs text-ink-2">{r.version}</span> },
    {
      key: 'qualityScore',
      title: '质量分',
      width: 90,
      align: 'right',
      render: (r) => (
        <Badge tone={r.qualityScore >= 90 ? 'green' : r.qualityScore >= 80 ? 'blue' : 'amber'}>{r.qualityScore}</Badge>
      ),
    },
    { key: 'updatedAt', title: '更新时间', width: 150, render: (r) => <span className="num text-xs text-ink-2">{r.updatedAt.slice(0, 16).replace('T', ' ')}</span> },
    {
      key: 'op',
      title: '操作',
      width: 120,
      align: 'right',
      render: () => (
        <div className="flex justify-end gap-2">
          <button className="text-xs text-primary" onClick={() => toast('字段结构已展开', 'info')}>
            字段
          </button>
          <button className="text-xs text-ink-2" onClick={() => toast('已导出样本 1000 行', 'info')}>
            采样
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="数据集管理"
        desc="统一管理加工前后的数据集版本、字段结构与质量评分"
        actions={
          <Button variant="primary" icon={<Upload size={14} />} onClick={() => toast('请先接入数据源，再从数据源创建数据集', 'info')}>
            上传数据
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="数据集" value={String(rows.length)} unit="个" hint="含 2 个加工产出" />
        <StatCard label="总行数" value={wan(rows.reduce((a, d) => a + d.rowCount, 0))} unit="行" tone="primary" />
        <StatCard label="平均质量分" value={String(Math.round(rows.reduce((a, d) => a + d.qualityScore, 0) / rows.length))} unit="分" hint="满分 100" />
        <StatCard label="存储占用" value="486" unit="GB" hint="含版本快照" />
      </div>

      <Card pad={false}>
        <div className="p-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 个数据集</span>}>
            <SearchInput value={kw} onChange={setKw} placeholder="搜索数据集名称" className="w-64" />
            <Select className="w-36" defaultValue="all">
              <option value="all">全部来源</option>
              {DATA_SOURCES.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </Select>
          </FilterBar>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={8} emptyTitle="暂无数据集" />
      </Card>

      <Card className="mt-4">
        <CardHeader title="字段结构示例" desc="供应商主数据_全量" extra={<Table2 size={15} className="text-ink-3" />} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F9FAFB] text-ink-2">
              <tr>
                <th className="px-3 py-2 text-left font-medium">字段名</th>
                <th className="px-3 py-2 text-left font-medium">类型</th>
                <th className="px-3 py-2 text-left font-medium">说明</th>
                <th className="px-3 py-2 text-left font-medium">允许为空</th>
              </tr>
            </thead>
            <tbody>
              {DATASETS[0].schema.map((f) => (
                <tr key={f.field} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-primary">{f.field}</td>
                  <td className="px-3 py-2 text-ink-2">{f.type}</td>
                  <td className="px-3 py-2 text-ink-2">{f.desc}</td>
                  <td className="px-3 py-2">{f.nullable ? '是' : '否'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ================= 数据源 ================= */
export function DataSources() {
  const tenant = useCurrentTenant();
  const toast = useUIStore((s) => s.toast);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'mysql' | 'oss' | 'api' | 'file'>('mysql');
  const rows = DATA_SOURCES.filter((d) => d.tenantId === tenant.id);

  const typeMeta: Record<string, { label: string; icon: typeof Database }> = {
    mysql: { label: '数据库', icon: Database },
    oss: { label: '对象存储', icon: HardDrive },
    api: { label: 'API 接口', icon: RotateCw },
    file: { label: '文件归档', icon: FileSpreadsheet },
  };

  const columns: Column<DataSource>[] = [
    { key: 'name', title: '数据源名称', render: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: 'type',
      title: '类型',
      width: 110,
      render: (r) => <Badge tone="gray">{typeMeta[r.type].label}</Badge>,
    },
    { key: 'host', title: '连接地址', render: (r) => <span className="font-mono text-xs text-ink-2">{r.host}</span> },
    { key: 'tables', title: '表数量', width: 80, align: 'right', render: (r) => <span className="num text-ink-2">{r.tables || '—'}</span> },
    { key: 'lastSyncAt', title: '最近同步', width: 150, render: (r) => <span className="num text-xs text-ink-2">{r.lastSyncAt.slice(0, 16).replace('T', ' ')}</span> },
    { key: 'status', title: '状态', width: 100, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'op',
      title: '操作',
      width: 120,
      align: 'right',
      render: () => (
        <div className="flex justify-end gap-2">
          <button className="text-xs text-primary" onClick={() => toast('已触发同步任务', 'info')}>
            同步
          </button>
          <button className="text-xs text-ink-2" onClick={() => toast('连接测试通过', 'info')}>
            测试
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="数据源接入"
        desc="支持数据库直连、对象存储、开放 API 与文件归档四类连接器"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            新建连接
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Object.entries(typeMeta).map(([k, v]) => (
          <button
            key={k}
            onClick={() => {
              setType(k as typeof type);
              setOpen(true);
            }}
            className="flex items-center gap-3 rounded-card border border-line bg-white px-4 py-3.5 text-left shadow-card transition-colors hover:border-primary-ring"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2F4F7] text-ink-2">
              <v.icon size={16} />
            </span>
            <div>
              <div className="text-sm font-medium text-ink-1">{v.label}</div>
              <div className="mt-0.5 text-2xs text-ink-3">
                {rows.filter((r) => r.type === k).length} 个连接
              </div>
            </div>
          </button>
        ))}
      </div>

      <Card pad={false}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={8}
          emptyTitle="还没有数据源"
          emptyDesc="接入第一个数据源，开始把企业数据变成可用资产"
        />
      </Card>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="新建数据源连接"
        subtitle={`类型：${typeMeta[type].label}`}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                setOpen(false);
                toast('连接已创建，正在做连通性校验', 'info');
              }}
            >
              保存并测试
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="连接名称" required>
            <input
              placeholder="例如：SAP ERP 生产库"
              className="h-9 w-full rounded-ctl border border-line px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
            />
          </Field>
          {type === 'mysql' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="主机地址" required>
                  <input placeholder="10.24.8.31" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
                <Field label="端口" required>
                  <input defaultValue="3306" className="num h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
              </div>
              <Field label="数据库名" required>
                <input placeholder="hengrui_prod" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="用户名" required>
                  <input placeholder="readonly_user" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
                <Field label="密码" required>
                  <input type="password" placeholder="••••••••" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
              </div>
            </>
          )}
          {type === 'oss' && (
            <>
              <Field label="存储桶地址" required>
                <input placeholder="oss-cn-beijing/hr-vendor-raw" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
              </Field>
              <Field label="AccessKey ID" required>
                <input placeholder="LTAI5t..." className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
              </Field>
            </>
          )}
          {type === 'api' && (
            <>
              <Field label="接口地址" required>
                <input placeholder="https://mes.example.com/openapi/v2" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
              </Field>
              <Field label="认证方式">
                <Select defaultValue="bearer">
                  <option value="bearer">Bearer Token</option>
                  <option value="apikey">API Key Header</option>
                  <option value="basic">Basic Auth</option>
                </Select>
              </Field>
            </>
          )}
          {type === 'file' && (
            <>
              <Field label="归档路径" required>
                <input placeholder="s3://hr-quality-archive/2026" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
              </Field>
              <Field label="文件格式">
                <Select defaultValue="parquet">
                  <option value="parquet">Parquet</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON Lines</option>
                </Select>
              </Field>
            </>
          )}
          <Field label="同步策略">
            <Select defaultValue="daily">
              <option value="daily">每日 02:00 全量同步</option>
              <option value="hourly">每小时增量同步</option>
              <option value="manual">仅手动触发</option>
            </Select>
          </Field>
          <Field label="备注">
            <Textarea placeholder="说明该数据源的用途与责任人" />
          </Field>
        </div>
      </Drawer>
    </div>
  );
}

function wan(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(2)} 亿`;
  return `${(v / 10000).toFixed(0)} 万`;
}
