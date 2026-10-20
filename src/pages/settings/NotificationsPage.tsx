import { useState } from 'react';
import { Button, Input, Segmented, Switch, message } from 'antd';
import { Bell, Mail, MessageSquare, MonitorSmartphone, Save } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/layout';
import { StatusTag } from '@/components/ui';

interface Rule {
  key: string;
  label: string;
  desc: string;
  channels: { inapp: boolean; email: boolean; im: boolean };
  level: 'all' | 'important' | 'none';
}

const DEFAULT_RULES: Rule[] = [
  { key: 'assign', label: '任务被指派给我', desc: '任务创建或转派时通知', channels: { inapp: true, email: true, im: true }, level: 'all' },
  { key: 'mention', label: '有人在评论中 @我', desc: '需求、缺陷、工单的评论', channels: { inapp: true, email: false, im: true }, level: 'all' },
  { key: 'build_fail', label: '构建失败', desc: '我触发的或我负责项目的构建', channels: { inapp: true, email: true, im: true }, level: 'important' },
  { key: 'release', label: '发布状态变更', desc: '提审、驳回、上线、回滚', channels: { inapp: true, email: false, im: true }, level: 'important' },
  { key: 'sla', label: '工单即将超时', desc: '剩余时限少于 30 分钟', channels: { inapp: true, email: true, im: true }, level: 'all' },
  { key: 'bug', label: '新缺陷指派', desc: '包含阻断/致命级别的缺陷', channels: { inapp: true, email: false, im: false }, level: 'important' },
  { key: 'weekly', label: '周报摘要', desc: '每周一 09:00 发送上周概览', channels: { inapp: false, email: true, im: false }, level: 'all' },
  { key: 'system', label: '系统维护通知', desc: '版本升级与计划内维护', channels: { inapp: true, email: false, im: true }, level: 'all' },
];

export default function NotificationsPage() {
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [quiet, setQuiet] = useState(true);
  const [quietRange, setQuietRange] = useState('22:00-09:00');
  const [digest, setDigest] = useState<'realtime' | 'hourly' | 'daily'>('realtime');

  const toggle = (key: string, ch: 'inapp' | 'email' | 'im') => {
    setRules((prev) => prev.map((r) => (r.key === key ? { ...r, channels: { ...r.channels, [ch]: !r.channels[ch] } } : r)));
  };

  const enabledCount = rules.filter((r) => r.channels.inapp || r.channels.email || r.channels.im).length;

  return (
    <div className="np-page">
      <PageHeader
        title="通知设置"
        desc={`${rules.length} 条通知规则 · ${enabledCount} 条已启用 · 免打扰 ${quiet ? '开启' : '关闭'}`}
        actions={
          <Button type="primary" icon={<Save size={13} />} onClick={() => message.success('通知偏好已保存')}>
            保存
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="通知规则" sub="按事件选择接收渠道" bodyStyle={{ paddingTop: 6 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 72px 72px 72px',
                gap: 8,
                padding: '8px 0',
                borderBottom: '1px solid var(--np-border)',
                fontSize: 11,
                color: 'var(--np-text-tertiary)',
              }}
            >
              <span>事件</span>
              <span style={{ textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <Bell size={10} /> 站内
              </span>
              <span style={{ textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <Mail size={10} /> 邮件
              </span>
              <span style={{ textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <MessageSquare size={10} /> 企业微信
              </span>
            </div>
            {rules.map((r) => (
              <div
                key={r.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 72px 72px 72px',
                  gap: 8,
                  alignItems: 'center',
                  padding: '11px 0',
                  borderBottom: '1px solid var(--np-border)',
                }}
              >
                <div>
                  <div style={{ fontSize: 12.5 }}>{r.label}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>{r.desc}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Switch size="small" checked={r.channels.inapp} onChange={() => toggle(r.key, 'inapp')} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Switch size="small" checked={r.channels.email} onChange={() => toggle(r.key, 'email')} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Switch size="small" checked={r.channels.im} onChange={() => toggle(r.key, 'im')} />
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="推送节奏">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
              <div>
                <div style={{ fontSize: 12.5, marginBottom: 6 }}>汇总频率</div>
                <Segmented
                  size="small"
                  value={digest}
                  onChange={(v) => setDigest(v as 'realtime' | 'hourly' | 'daily')}
                  options={[
                    { label: '实时', value: 'realtime' },
                    { label: '每小时汇总', value: 'hourly' },
                    { label: '每日汇总', value: 'daily' },
                  ]}
                />
                <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', marginTop: 5 }}>
                  非紧急通知会按此频率合并推送，紧急事件（P0 工单、构建失败）始终实时送达
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5 }}>免打扰时段</span>
                  <Switch size="small" checked={quiet} onChange={setQuiet} />
                </div>
                <Input value={quietRange} onChange={(e) => setQuietRange(e.target.value)} disabled={!quiet} style={{ width: 200 }} size="small" />
                <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', marginTop: 4 }}>
                  免打扰期间仅接收 P0 级别提醒
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="已绑定渠道">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { l: '站内通知', d: '浏览器内提醒', on: true, icon: <Bell size={13} /> },
                { l: '邮件', d: 'dengsy@yunyue-tech.com', on: true, icon: <Mail size={13} /> },
                { l: '企业微信', d: '已绑定 · 云跃交付组', on: true, icon: <MessageSquare size={13} /> },
                { l: '移动端推送', d: '未配置', on: false, icon: <MonitorSmartphone size={13} /> },
              ].map((x) => (
                <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--np-text-tertiary)' }}>{x.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}>{x.l}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }} className="np-truncate">
                      {x.d}
                    </div>
                  </div>
                  {x.on ? <StatusTag label="已启用" tone="success" dot={false} /> : <Button size="small">绑定</Button>}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="今日提醒" sub="按规则触发">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { t: '构建 #2841 失败', d: '深海迷航 · 3 分钟前', tone: 'danger' },
                { t: '工单 T-2026-0183 即将超时', d: '剩余 24 分钟', tone: 'warning' },
                { t: '需求 R-0142 已通过验收', d: '23 分钟前', tone: 'success' },
                { t: '@你 在缺陷 BUG-2026-0312 中', d: '1 小时前', tone: 'info' },
              ].map((x) => (
                <div key={x.t} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      marginTop: 6,
                      flexShrink: 0,
                      background:
                        x.tone === 'danger'
                          ? 'var(--np-danger)'
                          : x.tone === 'warning'
                            ? 'var(--np-warning)'
                            : x.tone === 'success'
                              ? 'var(--np-success)'
                              : 'var(--np-info)',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>{x.t}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>{x.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
