import { useState } from 'react';
import { CircleAlert, CircleCheck, Clock, RefreshCw } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Overlay';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { SYNC_JOBS } from '@/mocks/pipeline';
import { ACCOUNT_MAP, PLATFORM_MAP } from '@/mocks/platforms';
import { useUIStore } from '@/store/uiStore';
import type { SyncJob } from '@/types';
import { duration as fmtDuration, num, qty } from '@/lib/format';

export default function Sync() {
  const [status, setStatus] = useState('all');
  const toast = useUIStore((s) => s.toast);

  const rows = SYNC_JOBS.filter((j) => status === 'all' || j.status === status);

  const columns: Column<SyncJob>[] = [
    {
      key: 'id',
      title: '任务',
      render: (r) => (
        <div>
          <div className="num text-xs font-medium text-ink-1">{r.id}</div>
          <div className="text-2xs text-ink-3">{r.type === 'full' ? '全量拉取' : '增量拉取'}</div>
        </div>
      ),
    },
    {
      key: 'account',
      title: '账户',
      render: (r) => (
        <div>
          <div className="text-xs text-ink-1">{ACCOUNT_MAP[r.accountId]?.name ?? r.accountId}</div>
          <div className="text-2xs text-ink-3">{PLATFORM_MAP[r.platform].name}</div>
        </div>
      ),
    },
    { key: 'status', title: '状态', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'rows',
      title: '拉取行数',
      align: 'right',
      sorter: (a, b) => a.rows - b.rows,
      render: (r) => <span className="num text-xs text-ink-1">{r.rows ? qty(r.rows) : '—'}</span>,
    },
    {
      key: 'duration',
      title: '耗时',
      align: 'right',
      render: (r) => <span className="num text-xs text-ink-2">{r.durationSec ? fmtDuration(r.durationSec * 1000) : '—'}</span>,
    },
    {
      key: 'watermark',
      title: '数据水位线',
      render: (r) => <span className="num text-2xs text-ink-2">{r.watermark}</span>,
    },
    {
      key: 'retry',
      title: '重试',
      align: 'right',
      render: (r) => <span className={`num text-xs ${r.retry > 0 ? 'text-danger' : 'text-ink-3'}`}>{r.retry}</span>,
    },
    {
      key: 'message',
      title: '说明',
      render: (r) =>
        r.message ? (
          <span className="text-2xs leading-relaxed text-danger">{r.message}</span>
        ) : (
          <span className="text-2xs text-ink-3">正常完成</span>
        ),
    },
    {
      key: 'action',
      title: '操作',
      align: 'right',
      render: (r) =>
        r.status === 'failed' ? (
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw size={12} />}
            onClick={() => toast('已触发重新授权引导：请在小红书聚光后台重新生成 access_token', 'warning')}
          >
            重试
          </Button>
        ) : (
          <span className="text-2xs text-ink-3">—</span>
        ),
    },
  ];

  const ok = SYNC_JOBS.filter((j) => j.status === 'success').length;
  const failed = SYNC_JOBS.filter((j) => j.status === 'failed').length;
  const running = SYNC_JOBS.filter((j) => j.status === 'running').length;
  const totalRows = SYNC_JOBS.reduce((s, j) => s + j.rows, 0);

  return (
    <>
      <PageHeader
        title="同步任务"
        desc="每日 08:00 起按账户并发拉取前一日数据，失败自动重试 3 次；水位线（watermark）用于断点续传，避免重复或漏数"
        breadcrumb="数据接入 / 同步任务"
        actions={
          <Button
            size="sm"
            variant="primary"
            icon={<RefreshCw size={13} />}
            onClick={() => toast('已提交全量补偿任务，预计 3 分钟后完成', 'success')}
          >
            触发补偿同步
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-2">
            <CircleCheck size={14} className="text-success" /> 成功
          </div>
          <div className="num mt-1 text-2xl font-semibold text-ink-1">{ok}</div>
          <div className="mt-0.5 text-2xs text-ink-3">拉取 {qty(totalRows)} 行</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-2">
            <CircleAlert size={14} className="text-danger" /> 失败
          </div>
          <div className="num mt-1 text-2xl font-semibold text-danger">{failed}</div>
          <div className="mt-0.5 text-2xs text-ink-3">ACC-501 授权过期</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-2">
            <RefreshCw size={14} className="text-primary" /> 同步中
          </div>
          <div className="num mt-1 text-2xl font-semibold text-primary">{running}</div>
          <div className="mt-0.5 text-2xs text-ink-3">千川账户拉取中</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-2">
            <Clock size={14} className="text-ink-3" /> 平均耗时
          </div>
          <div className="num mt-1 text-2xl font-semibold text-ink-1">
            {fmtDuration(
              (SYNC_JOBS.filter((j) => j.durationSec > 0).reduce((s, j) => s + j.durationSec, 0) /
                Math.max(1, SYNC_JOBS.filter((j) => j.durationSec > 0).length)) *
                1000,
            )}
          </div>
          <div className="mt-0.5 text-2xs text-ink-3">含平台限流等待</div>
        </Card>
      </div>

      <Card className="mb-4">
        <Tabs
          tabs={[
            { key: 'all', label: '全部', count: SYNC_JOBS.length },
            { key: 'success', label: '成功', count: ok },
            { key: 'failed', label: '失败', count: failed },
            { key: 'running', label: '同步中', count: running },
            { key: 'waiting', label: '排队中', count: SYNC_JOBS.filter((j) => j.status === 'waiting').length },
          ]}
          active={status}
          onChange={setStatus}
        />
      </Card>

      <Card pad={false}>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={12} />
      </Card>

      <Card className="mt-4">
        <CardHeader title="今日调度时间线" desc="同步完成 → 质检 → 数仓加工 → 模型推理" />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[
            ['08:00', 'ODS 抽取', 'success'],
            ['08:20', 'DWD 清洗', 'success'],
            ['08:40', 'DWS 汇总', 'success'],
            ['09:00', 'ADS 推理', 'success'],
            ['09:15', '建议生成', 'success'],
          ].map(([time, label, st], i, arr) => (
            <div key={label} className="flex items-center gap-2">
              <div className="rounded-ctl border border-line px-3 py-2">
                <div className="num text-2xs text-ink-3">{time}</div>
                <div className="text-xs font-medium text-ink-1">{label}</div>
              </div>
              {i < arr.length - 1 && <span className="text-ink-3">→</span>}
            </div>
          ))}
          <Badge tone="green" className="ml-2">
            全链路 75 分钟
          </Badge>
        </div>
        <div className="mt-3 text-2xs leading-relaxed text-ink-3">
          共 {num(SYNC_JOBS.length)} 个账户任务，其中 1 个失败（小红书授权过期）已从下游汇总中剔除，并在数据质量页标记影响行数。
        </div>
      </Card>
    </>
  );
}
