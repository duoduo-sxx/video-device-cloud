import { useState } from 'react';
import { CheckCircle2, EyeOff, Send, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Overlay';
import { Modal } from '@/components/ui/Overlay';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/appStore';
import { useAuthStore, hasPerm } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ACCOUNT_MAP } from '@/mocks/platforms';
import { SUGGESTION_TYPE_LABEL, SUGGESTION_STATUS_LABEL, type Suggestion, type SuggestionStatus } from '@/types';
import { num, pct } from '@/lib/format';

const TYPES: Array<{ key: string; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'budget', label: '预算调整' },
  { key: 'targeting', label: '定向优化' },
  { key: 'creative', label: '素材优化' },
  { key: 'bid', label: '出价调整' },
  { key: 'landing', label: '落地页' },
];

export default function Suggestions() {
  const suggestions = useAppStore((s) => s.suggestions);
  const dispatch = useAppStore((s) => s.dispatch);
  const ignore = useAppStore((s) => s.ignore);
  const toast = useUIStore((s) => s.toast);
  const user = useAuthStore((s) => s.user);
  const canDispatch = hasPerm(user.role, 'suggest.dispatch');

  const [type, setType] = useState('all');
  const [status, setStatus] = useState<'all' | SuggestionStatus>('all');
  const [target, setTarget] = useState<Suggestion | null>(null);

  const filtered = suggestions.filter(
    (s) => (type === 'all' || s.type === type) && (status === 'all' || s.status === status),
  );

  const counts = {
    all: suggestions.length,
    pending: suggestions.filter((s) => s.status === 'pending').length,
    adopted: suggestions.filter((s) => s.status === 'adopted').length,
    dispatched: suggestions.filter((s) => s.status === 'dispatched').length,
    ignored: suggestions.filter((s) => s.status === 'ignored').length,
  };

  const totalImpact = filtered
    .filter((s) => s.status !== 'ignored')
    .reduce(
      (acc, s) => ({
        conv: acc.conv + s.impact.conversions,
        cpa: acc.cpa + (s.impact.cpa < 0 ? s.impact.cpa : 0),
      }),
      { conv: 0, cpa: 0 },
    );

  return (
    <>
      <PageHeader
        title="优化建议"
        desc="由异常诊断与模型共同产出，每条建议都带「数据依据 → 建议动作 → 预估影响 → 置信度」，采纳后自动生成变更单下发平台"
        breadcrumb="优化执行 / 优化建议"
        actions={
          <>
            <Badge tone="amber">待处理 {counts.pending}</Badge>
            <Badge tone="blue">已下发 {counts.dispatched}</Badge>
          </>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { key: 'all', label: '全部', count: counts.all },
              { key: 'pending', label: '待处理', count: counts.pending },
              { key: 'adopted', label: '已采纳', count: counts.adopted },
              { key: 'dispatched', label: '已下发', count: counts.dispatched },
              { key: 'ignored', label: '已忽略', count: counts.ignored },
            ]}
            active={status}
            onChange={(k) => setStatus(k as typeof status)}
          />
          <div className="flex items-center gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`rounded-full px-2.5 py-1 text-2xs transition-colors ${
                  type === t.key ? 'bg-primary text-white' : 'bg-[#F2F4F7] text-ink-2 hover:bg-[#E9ECF1]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-2xs text-ink-2">
          <span>
            当前筛选：<span className="font-medium text-ink-1">{filtered.length}</span> 条建议
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp size={12} className="text-success" />
            预计新增转化 <span className="num font-medium text-success">+{num(Math.max(0, totalImpact.conv))}</span> 单
          </span>
          <span className="flex items-center gap-1">
            预计 CPA 变化 <span className="num font-medium text-success">{totalImpact.cpa.toFixed(1)}%</span>
          </span>
          <span className="ml-auto text-ink-3">
            权限：{canDispatch ? `${user.name}（${user.role === 'lead' ? '投放负责人' : '优化师'}）可下发` : '只读身份不可下发'}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filtered.map((s) => (
          <Card key={s.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="blue">{SUGGESTION_TYPE_LABEL[s.type]}</Badge>
                  <StatusBadge status={s.status} label={SUGGESTION_STATUS_LABEL[s.status]} />
                  <span className="num text-2xs text-ink-3">{s.id}</span>
                </div>
                <h3 className="mt-2 text-sm font-semibold leading-snug text-ink-1">{s.title}</h3>
                <div className="mt-1 text-2xs text-ink-3">
                  {ACCOUNT_MAP[s.accountId]?.name ?? s.accountId} · {s.target}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-2xs text-ink-3">置信度</div>
                <div className={`num text-lg font-semibold ${s.confidence >= 0.85 ? 'text-success' : s.confidence >= 0.7 ? 'text-primary' : 'text-warning'}`}>
                  {pct(s.confidence, 0)}
                </div>
              </div>
            </div>

            <p className="mt-3 rounded-ctl bg-[#F9FAFB] px-3 py-2 text-xs leading-relaxed text-ink-2">
              {s.problem}
            </p>

            <div className="mt-3">
              <div className="mb-1.5 text-2xs font-medium text-ink-3">数据依据</div>
              <div className="grid grid-cols-2 gap-1.5">
                {s.evidence.map((e) => (
                  <div key={e.label} className="rounded-ctl border border-line px-2 py-1.5">
                    <div className="text-2xs text-ink-3">{e.label}</div>
                    <div className="num text-xs font-medium text-ink-1">{e.value}</div>
                    {e.compare && <div className="num text-2xs text-ink-3">{e.compare}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-ctl border border-primary-ring bg-primary-soft/60 px-3 py-2">
              <div className="text-2xs font-medium text-primary">建议动作</div>
              <div className="mt-0.5 text-xs leading-relaxed text-ink-1">{s.action}</div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-2xs text-ink-2">
              <span className="flex items-center gap-1">
                <Sparkles size={11} className="text-primary" />
                预估转化 <span className="num font-medium text-ink-1">{s.impact.conversions > 0 ? `+${s.impact.conversions}` : s.impact.conversions}</span> 单
              </span>
              <span>
                CPA <span className="num font-medium text-success">{s.impact.cpa}%</span>
              </span>
              <span>
                ROI <span className="num font-medium text-success">+{s.impact.roi}</span>
              </span>
            </div>
            <div className="mt-2 text-2xs leading-relaxed text-ink-3">{s.impact.note}</div>

            <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
              {s.status === 'pending' || s.status === 'adopted' ? (
                <>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Send size={13} />}
                    disabled={!canDispatch}
                    onClick={() => setTarget(s)}
                  >
                    采纳并下发
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<CheckCircle2 size={13} />}
                    onClick={() => {
                      useAppStore.getState().setSuggestionStatus(s.id, 'adopted');
                      toast('已采纳，可在「变更单」中跟踪下发状态', 'success');
                    }}
                  >
                    仅采纳
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    icon={<EyeOff size={13} />}
                    onClick={() => {
                      ignore(s.id);
                      toast('已忽略该建议', 'info');
                    }}
                  >
                    忽略
                  </Button>
                </>
              ) : s.status === 'dispatched' ? (
                <div className="flex items-center gap-1.5 text-2xs text-cyanx">
                  <Send size={12} /> 已下发至 {ACCOUNT_MAP[s.accountId]?.platform ? '投放平台' : '平台'}，等待生效回执
                </div>
              ) : (
                <div className="text-2xs text-ink-3">该建议已忽略，不再参与预算计算</div>
              )}
              <span className="ml-auto num text-2xs text-ink-3">{s.createdAt.slice(5, 16).replace('T', ' ')}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title="确认下发变更"
        subtitle="下发后将调用平台 API 修改投放设置，可在变更单中追踪回执"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setTarget(null)}>
              取消
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Send size={14} />}
              onClick={() => {
                if (!target) return;
                dispatch(target.id, user.name);
                setTarget(null);
                toast(`变更已下发：${target.target}`, 'success');
              }}
            >
              确认下发
            </Button>
          </>
        }
      >
        {target && (
          <div className="space-y-3 text-xs">
            <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2">
              <div className="text-2xs text-ink-3">变更对象</div>
              <div className="mt-0.5 font-medium text-ink-1">{target.target}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-ctl border border-line px-3 py-2">
                <div className="text-2xs text-ink-3">投放账户</div>
                <div className="mt-0.5 text-ink-1">{ACCOUNT_MAP[target.accountId]?.name}</div>
              </div>
              <div className="rounded-ctl border border-line px-3 py-2">
                <div className="text-2xs text-ink-3">建议类型</div>
                <div className="mt-0.5 text-ink-1">{SUGGESTION_TYPE_LABEL[target.type]}</div>
              </div>
            </div>
            <div className="rounded-ctl border border-line px-3 py-2">
              <div className="text-2xs text-ink-3">将执行的变更</div>
              <div className="mt-1 leading-relaxed text-ink-1">{target.action}</div>
            </div>
            <div className="rounded-ctl border border-warning/30 bg-warning-soft px-3 py-2 text-2xs leading-relaxed text-warning">
              提示：该操作会真实修改平台投放设置。本演示环境不会调用外部接口，仅生成变更单记录。
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
