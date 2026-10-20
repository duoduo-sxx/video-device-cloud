import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Input, InputNumber, Radio, Select, Switch, message } from 'antd';
import { Monitor, Moon, Palette, Save, Sun } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/layout';
import { StatusTag } from '@/components/ui';
import { useUiStore } from '@/stores/uiStore';
import type { ThemeMode } from '@/stores/uiStore';

export default function GeneralPage() {
  const { theme, setTheme, compact, setCompact, lang, setLang } = useUiStore();
  const [name, setName] = useState('云跃网络 · 游戏交付中台');
  const [landing, setLanding] = useState('dashboard');
  const [weekStart, setWeekStart] = useState('monday');
  const [workHours, setWorkHours] = useState(8);
  const [riskDays, setRiskDays] = useState(7);
  const [autoArchive, setAutoArchive] = useState(true);
  const [showWeekend, setShowWeekend] = useState(true);

  const themes: { key: ThemeMode; label: string; icon: ReactNode; desc: string }[] = [
    { key: 'light', label: '浅色', icon: <Sun size={15} />, desc: '默认，适合白天办公' },
    { key: 'dark', label: '深色', icon: <Moon size={15} />, desc: '低亮度环境更舒适' },
    { key: 'system', label: '跟随系统', icon: <Monitor size={15} />, desc: '按操作系统自动切换' },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="通用设置"
        desc="工作空间名称、外观、语言与排期规则"
        actions={
          <Button type="primary" icon={<Save size={13} />} onClick={() => message.success('设置已保存')}>
            保存设置
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="基本信息" sub="对全部成员可见">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520 }}>
              <Row label="工作空间名称" hint="显示在顶栏与导出文件名中">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Row>
              <Row label="默认落地页" hint="登录后首先打开的页面">
                <Select
                  value={landing}
                  onChange={setLanding}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'dashboard', label: '总览工作台' },
                    { value: 'work', label: '我的工作' },
                    { value: 'projects', label: '项目列表' },
                    { value: 'analytics/overview', label: '数据分析' },
                  ]}
                />
              </Row>
              <Row label="界面语言">
                <Radio.Group
                  value={lang}
                  onChange={(e) => setLang(e.target.value as 'zh-CN' | 'en-US')}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                  options={[
                    { value: 'zh-CN', label: '简体中文' },
                    { value: 'en-US', label: 'English' },
                  ]}
                />
              </Row>
            </div>
          </SectionCard>

          <SectionCard title="外观" extra={<Palette size={14} style={{ color: 'var(--np-text-tertiary)' }} />}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {themes.map((t) => {
                const active = theme === t.key;
                return (
                  <div
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: `1.5px solid ${active ? 'var(--np-primary-500)' : 'var(--np-border)'}`,
                      background: active ? 'var(--np-primary-50)' : 'var(--np-bg-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500 }}>
                      {t.icon}
                      {t.label}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', marginTop: 4 }}>{t.desc}</div>
                  </div>
                );
              })}
            </div>
            <Divider />
            <Row label="紧凑模式" hint="减小行高与间距，一屏显示更多数据">
              <Switch size="small" checked={compact} onChange={setCompact} />
            </Row>
            <div style={{ height: 12 }} />
            <Row label="日历显示周末" hint="关闭后周视图只显示工作日">
              <Switch size="small" checked={showWeekend} onChange={setShowWeekend} />
            </Row>
          </SectionCard>

          <SectionCard title="排期规则">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520 }}>
              <Row label="每周起始日">
                <Radio.Group
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  optionType="button"
                  size="small"
                  options={[
                    { value: 'monday', label: '周一' },
                    { value: 'sunday', label: '周日' },
                  ]}
                />
              </Row>
              <Row label="标准工时" hint="用于负载率与产能计算">
                <InputNumber min={4} max={12} value={workHours} onChange={(v) => setWorkHours(v ?? 8)} addonAfter="小时/天" style={{ width: 160 }} />
              </Row>
              <Row label="风险预警阈值" hint="距截止日少于此天数时标红">
                <InputNumber min={1} max={30} value={riskDays} onChange={(v) => setRiskDays(v ?? 7)} addonAfter="天" style={{ width: 160 }} />
              </Row>
              <Row label="归档项目自动隐藏" hint="归档超过 90 天的项目从列表中移除">
                <Switch size="small" checked={autoArchive} onChange={setAutoArchive} />
              </Row>
            </div>
          </SectionCard>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="当前配置摘要">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              {[
                { k: '主题', v: theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统' },
                { k: '语言', v: lang === 'zh-CN' ? '简体中文' : 'English' },
                { k: '紧凑模式', v: compact ? '开启' : '关闭' },
                { k: '标准工时', v: `${workHours} 小时/天` },
                { k: '周起始', v: weekStart === 'monday' ? '周一' : '周日' },
                { k: '预警阈值', v: `${riskDays} 天` },
              ].map((x) => (
                <div key={x.k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--np-text-tertiary)' }}>{x.k}</span>
                  <span>{x.v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="系统信息">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              {[
                { k: '版本', v: 'v1.0.0' },
                { k: '构建号', v: '20261019.3' },
                { k: '运行模式', v: '纯前端 · Mock 数据' },
                { k: '数据存储', v: 'localStorage' },
              ].map((x) => (
                <div key={x.k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--np-text-tertiary)' }}>{x.k}</span>
                  <span className="np-mono-sm">{x.v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--np-text-tertiary)' }}>服务状态</span>
                <StatusTag label="全部正常" tone="success" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="危险操作">
            <div style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)', lineHeight: 1.8, marginBottom: 10 }}>
              清空本地缓存会重置主题、看板拖动位置与筛选状态，不会影响 Mock 数据本身。
            </div>
            <Button
              danger
              size="small"
              onClick={() => {
                localStorage.clear();
                message.success('本地缓存已清空，刷新后生效');
              }}
            >
              清空本地缓存
            </Button>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 150, flexShrink: 0 }}>
        <div style={{ fontSize: 12.5 }}>{label}</div>
        {hint && <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', marginTop: 1 }}>{hint}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--np-border)', margin: '4px 0 14px' }} />;
}
