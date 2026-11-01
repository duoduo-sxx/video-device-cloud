import { useState, type ReactNode } from 'react';
import { Bell, Database, RotateCcw, Users } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Form';
import Button from '@/components/ui/Button';
import { ROLE_MAP, USERS, useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ACCOUNTS, BRAND, PLATFORMS } from '@/mocks/platforms';
import { num } from '@/lib/format';

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.toast);
  const [rules, setRules] = useState({
    cpaUp: true,
    volumeDrop: true,
    materialFatigue: true,
    quality: true,
    autoDispatch: false,
  });
  const [threshold, setThreshold] = useState({ cpa: 15, drop: 20, fatigue: 0.6 });

  return (
    <>
      <PageHeader
        title="系统设置"
        desc="成员权限、监控阈值与同步配置；阈值直接决定异常诊断的灵敏度，调太松会漏，调太紧会吵"
        breadcrumb="报表与设置 / 系统设置"
        actions={<Badge tone="blue">所属：{BRAND.owner}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="团队成员" desc="演示环境可切换身份体验权限差异" />
          <div className="mt-3 space-y-2">
            {USERS.map((u) => (
              <div
                key={u.id}
                className={`flex items-center gap-2.5 rounded-ctl border px-3 py-2 ${
                  user.id === u.id ? 'border-primary-ring bg-primary-soft' : 'border-line'
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-2xs font-semibold text-white">
                  {u.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-ink-1">
                    {u.name}
                    <span className="ml-1.5 text-2xs font-normal text-ink-3">{ROLE_MAP[u.role].name}</span>
                  </div>
                  <div className="truncate text-2xs text-ink-3">{u.title}</div>
                </div>
                {user.id === u.id && <Badge tone="blue">当前</Badge>}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-ctl bg-[#F9FAFB] px-3 py-2 text-2xs leading-relaxed text-ink-2">
            <span className="inline-flex items-center gap-1 font-medium text-ink-1">
              <Users size={11} /> 权限差异
            </span>
            <div className="mt-1">
              投放负责人与优化师可下发变更、调预算；数据分析师为只读，不能修改投放设置（在「优化建议」页下按钮会置灰）。
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="监控阈值" desc="触发异常诊断的条件" />
          <div className="mt-3 space-y-3">
            <ThresholdRow
              label="CPA 上浮阈值"
              value={threshold.cpa}
              unit="%"
              onChange={(v) => setThreshold((t) => ({ ...t, cpa: v }))}
              hint="近 3 日 CPA 环比超过该值即告警"
            />
            <ThresholdRow
              label="掉量阈值"
              value={threshold.drop}
              unit="%"
              onChange={(v) => setThreshold((t) => ({ ...t, drop: v }))}
              hint="近 3 日消耗环比下滑超过该值即告警"
            />
            <ThresholdRow
              label="素材疲劳阈值"
              value={threshold.fatigue}
              unit=""
              step={0.05}
              onChange={(v) => setThreshold((t) => ({ ...t, fatigue: v }))}
              hint="疲劳度超过该值建议替换素材"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<RotateCcw size={12} />}
              onClick={() => {
                setThreshold({ cpa: 15, drop: 20, fatigue: 0.6 });
                toast('已恢复默认阈值', 'info');
              }}
            >
              恢复默认
            </Button>
            <Button size="sm" variant="primary" onClick={() => toast('阈值已保存，下次调度生效', 'success')}>
              保存
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="告警与自动化" desc="哪些问题需要推给人、哪些可以自动处理" />
          <div className="mt-3 space-y-3">
            <ToggleRow
              icon={<Bell size={13} />}
              label="CPA 异常上涨提醒"
              desc="推送至企业微信"
              checked={rules.cpaUp}
              onChange={(v) => setRules((r) => ({ ...r, cpaUp: v }))}
            />
            <ToggleRow
              icon={<Bell size={13} />}
              label="账户掉量提醒"
              desc="推送至优化师待办"
              checked={rules.volumeDrop}
              onChange={(v) => setRules((r) => ({ ...r, volumeDrop: v }))}
            />
            <ToggleRow
              icon={<Bell size={13} />}
              label="素材疲劳提醒"
              desc="疲劳度超阈值时提醒换素材"
              checked={rules.materialFatigue}
              onChange={(v) => setRules((r) => ({ ...r, materialFatigue: v }))}
            />
            <ToggleRow
              icon={<Database size={13} />}
              label="数据质量告警"
              desc="质检未通过时阻断模型训练"
              checked={rules.quality}
              onChange={(v) => setRules((r) => ({ ...r, quality: v }))}
            />
            <ToggleRow
              icon={<Bell size={13} />}
              label="自动下发变更"
              desc="置信度 > 90% 的建议直接执行（谨慎开启）"
              checked={rules.autoDispatch}
              onChange={(v) => {
                setRules((r) => ({ ...r, autoDispatch: v }));
                if (v) toast('自动下发已开启，建议先在低预算计划上试点', 'warning');
              }}
            />
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="同步配置" desc="各平台数据拉取频率与重试策略" />
        <div className="mt-3 overflow-hidden rounded-ctl border border-line">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#FCFCFD] text-left text-2xs text-ink-3">
                <th className="px-3 py-2 font-normal">平台</th>
                <th className="px-3 py-2 font-normal">账户数</th>
                <th className="px-3 py-2 font-normal">同步频率</th>
                <th className="px-3 py-2 font-normal">数据延迟</th>
                <th className="px-3 py-2 font-normal">口径说明</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORMS.map((p, i) => (
                <tr key={p.code} className="border-t border-line/60">
                  <td className="px-3 py-2 text-ink-1">{p.name}</td>
                  <td className="num px-3 py-2 text-ink-2">{ACCOUNTS.filter((a) => a.platform === p.code).length}</td>
                  <td className="px-3 py-2 text-ink-2">{i === 5 ? '每小时' : '每日 08:00'}</td>
                  <td className="px-3 py-2 text-ink-2">{i === 5 ? '约 6 小时' : i === 0 ? '约 30 分钟' : '约 2 小时'}</td>
                  <td className="px-3 py-2 text-2xs text-ink-3">{p.caliber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-2xs text-ink-3">
          <span>共 {num(ACCOUNTS.length)} 个账户接入，失败自动重试 3 次（间隔 5 / 15 / 30 分钟）</span>
          <Button size="sm" variant="secondary" onClick={() => toast('已提交配置，下次调度生效', 'success')}>
            保存同步配置
          </Button>
        </div>
      </Card>
    </>
  );
}

function ThresholdRow({
  label,
  value,
  unit,
  step = 1,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  step?: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-1">{label}</span>
        <span className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            step={step}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="num h-7 w-16 rounded-ctl border border-line px-2 text-right text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
          />
          {unit && <span className="text-2xs text-ink-3">{unit}</span>}
        </span>
      </div>
      <div className="mt-0.5 text-2xs text-ink-3">{hint}</div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  desc,
  checked,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-line/60 pb-2.5 last:border-0 last:pb-0">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-medium text-ink-1">
          <span className="text-ink-3">{icon}</span>
          {label}
        </div>
        <div className="mt-0.5 text-2xs text-ink-3">{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
