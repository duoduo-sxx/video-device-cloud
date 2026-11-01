import { Link } from 'react-router-dom';
import { CircleCheck, RefreshCw, Send } from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { useAppStore } from '@/store/appStore';
import { useUIStore } from '@/store/uiStore';
import { ACCOUNT_MAP } from '@/mocks/platforms';
import { CHANGE_STATUS_LABEL, SUGGESTION_TYPE_LABEL, type ChangeOrder } from '@/types';
import { num, pct } from '@/lib/format';

export default function Changes() {
  const changes = useAppStore((s) => s.changes);
  const retry = useAppStore((s) => s.retryChange);
  const toast = useUIStore((s) => s.toast);

  const effective = changes.filter((c) => c.status === 'effective');
  const withFeedback = changes.filter((c) => c.feedback);
  const avgDelta =
    withFeedback.length > 0
      ? withFeedback.reduce((s, c) => s + (c.feedback!.conversionsDelta ?? 0), 0) / withFeedback.length
      : 0;

  const columns: Column<ChangeOrder>[] = [
    {
      key: 'id',
      title: '变更单',
      render: (r) => (
        <div>
          <div className="num text-xs font-medium text-ink-1">{r.id}</div>
          <div className="text-2xs text-ink-3">
            {r.suggestionId ? `来自建议 ${r.suggestionId}` : '手工变更'}
          </div>
        </div>
      ),
    },
    { key: 'target', title: '变更对象', render: (r) => <span className="text-xs text-ink-1">{r.target}</span> },
    { key: 'type', title: '类型', render: (r) => <Badge tone="blue">{SUGGESTION_TYPE_LABEL[r.type]}</Badge> },
    {
      key: 'account',
      title: '账户',
      render: (r) => <span className="text-2xs text-ink-2">{ACCOUNT_MAP[r.accountId]?.name ?? r.accountId}</span>,
    },
    {
      key: 'before',
      title: '变更前 → 后',
      render: (r) => (
        <div className="max-w-[300px] text-2xs leading-relaxed">
          <div className="truncate text-ink-3">前：{r.before}</div>
          <div className="truncate text-ink-1">后：{r.after}</div>
        </div>
      ),
    },
    { key: 'status', title: '状态', render: (r) => <StatusBadge status={r.status} label={CHANGE_STATUS_LABEL[r.status]} /> },
    {
      key: 'feedback',
      title: '效果回收',
      align: 'right',
      render: (r) =>
        r.feedback ? (
          <div className="text-right">
            <div className="num text-xs font-medium text-success">
              转化 {r.feedback.conversionsDelta > 0 ? '+' : ''}
              {pct(r.feedback.conversionsDelta / 100, 1)}
            </div>
            <div className="num text-2xs text-ink-3">
              {r.feedback.days} 日 · CPA {r.feedback.cpaDelta}%
            </div>
          </div>
        ) : (
          <span className="text-2xs text-ink-3">{r.status === 'effective' ? '待回收' : '—'}</span>
        ),
    },
    { key: 'operator', title: '操作人', render: (r) => <span className="text-2xs text-ink-2">{r.operator}</span> },
    {
      key: 'action',
      title: '',
      align: 'right',
      render: (r) =>
        r.status === 'failed' ? (
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw size={12} />}
            onClick={() => {
              retry(r.id);
              toast('已重新提交，平台接口限流通常在 2 分钟内恢复', 'info');
            }}
          >
            重试
          </Button>
        ) : r.status === 'pending_approval' ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toast('已提醒投放负责人审批', 'info')}
          >
            催审批
          </Button>
        ) : (
          <CircleCheck size={14} className="ml-auto text-success" />
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="变更单"
        desc="建议采纳后并不算结束——必须下发到平台、拿到生效回执、回收 7 日效果，形成闭环"
        breadcrumb="优化执行 / 变更单"
        actions={
          <Link to="/optimize/suggestions" className="flex items-center gap-1 rounded-ctl bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-hover">
            <Send size={12} /> 去处理建议
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="变更单总数" value={String(changes.length)} unit="单" hint="本轮演示产生的全部变更" />
        <StatCard label="已生效" value={String(effective.length)} unit="单" tone="success" hint="拿到平台回执" />
        <StatCard
          label="待审批"
          value={String(changes.filter((c) => c.status === 'pending_approval').length)}
          unit="单"
          tone="warning"
          hint="需投放负责人在平台侧确认"
        />
        <StatCard
          label="平均转化提升"
          value={`+${avgDelta.toFixed(1)}`}
          unit="%"
          tone="success"
          hint={`基于 ${withFeedback.length} 单已回收效果`}
        />
      </div>

      <Card className="mb-4" pad={false}>
        <DataTable columns={columns} rows={changes} rowKey={(r) => r.id} pageSize={10} />
      </Card>

      <Card>
        <CardHeader title="效果回收明细" desc="变更生效后按 1/3/7 日做效果对比，避免「改完不验证」" />
        <div className="mt-3 space-y-2">
          {withFeedback.map((c) => (
            <div key={c.id} className="rounded-ctl border border-line px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="num text-2xs text-ink-3">{c.id}</span>
                  <span className="text-xs font-medium text-ink-1">{c.target}</span>
                </div>
                <span className="num text-2xs text-ink-3">{c.feedback!.days} 日效果</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Metric label="转化变化" value={`${c.feedback!.conversionsDelta > 0 ? '+' : ''}${c.feedback!.conversionsDelta}%`} good={c.feedback!.conversionsDelta > 0} />
                <Metric label="CPA 变化" value={`${c.feedback!.cpaDelta}%`} good={c.feedback!.cpaDelta < 0} />
                <Metric label="ROI 变化" value={`+${c.feedback!.roiDelta}`} good={c.feedback!.roiDelta > 0} />
              </div>
              <div className="mt-2 text-2xs leading-relaxed text-ink-3">{c.feedback!.note}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function Metric({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded-ctl bg-[#F9FAFB] px-2.5 py-1.5">
      <div className="text-2xs text-ink-3">{label}</div>
      <div className={`num mt-0.5 text-xs font-semibold ${good ? 'text-success' : 'text-danger'}`}>{value}</div>
    </div>
  );
}
