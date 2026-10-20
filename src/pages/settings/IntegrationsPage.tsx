import { useMemo, useState } from 'react';
import { Button, Input, message } from 'antd';
import { CheckCircle2, ExternalLink, Link2, Plug, Search, Settings2 } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/layout';
import { StatusTag } from '@/components/ui';

interface Integration {
  id: string;
  name: string;
  category: '代码与流水线' | '协作与通知' | '监控与告警' | '云与存储';
  desc: string;
  connected: boolean;
  account?: string;
  lastSync?: string;
  scopes: string[];
  initial: string;
  color: string;
}

const INTEGRATIONS: Integration[] = [
  { id: 'gitlab', name: 'GitLab', category: '代码与流水线', desc: '拉取提交记录、分支与 MR 状态，自动关联构建', connected: true, account: 'yunyue-tech/game-delivery', lastSync: '2 分钟前', scopes: ['repo:read', 'pipeline:write'], initial: 'GL', color: '#FC6D26' },
  { id: 'jenkins', name: 'Jenkins', category: '代码与流水线', desc: '触发打包流水线，回传构建阶段与日志', connected: true, account: 'ci.yunyue-tech.com', lastSync: '刚刚', scopes: ['job:build', 'log:read'], initial: 'JK', color: '#D33833' },
  { id: 'github', name: 'GitHub', category: '代码与流水线', desc: '同步开源仓库与 Issue', connected: false, scopes: ['repo:read'], initial: 'GH', color: '#24292F' },
  { id: 'wecom', name: '企业微信', category: '协作与通知', desc: '推送构建、工单与发布通知到群机器人', connected: true, account: '云跃交付组 · 群机器人', lastSync: '1 分钟前', scopes: ['webhook'], initial: '企', color: '#2F7DF6' },
  { id: 'dingtalk', name: '钉钉', category: '协作与通知', desc: '审批流与日程同步', connected: false, scopes: ['approval:read'], initial: '钉', color: '#0089FF' },
  { id: 'feishu', name: '飞书', category: '协作与通知', desc: '多维表格与审批同步', connected: false, scopes: ['bitable:read'], initial: '飞', color: '#00D6B9' },
  { id: 'sentry', name: 'Sentry', category: '监控与告警', desc: '拉取前端异常聚合，回写缺陷单', connected: true, account: 'org: yunyue / project: webgame', lastSync: '5 分钟前', scopes: ['event:read', 'issue:write'], initial: 'SE', color: '#362D59' },
  { id: 'prometheus', name: 'Prometheus', category: '监控与告警', desc: '采集 CDN 与网关指标，映射到性能看板', connected: false, scopes: ['metrics:read'], initial: 'PM', color: '#E6522C' },
  { id: 'tencentcloud', name: '腾讯云 COS', category: '云与存储', desc: '制品与资源包存储，生成 CDN 预热任务', connected: true, account: 'ap-shanghai · game-artifact', lastSync: '12 分钟前', scopes: ['cos:put', 'cdn:purge'], initial: 'COS', color: '#006EFF' },
  { id: 'qiniu', name: '七牛云', category: '云与存储', desc: '海外资源分发', connected: false, scopes: ['cdn:purge'], initial: 'QN', color: '#00A0E9' },
];

export default function IntegrationsPage() {
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState(INTEGRATIONS);

  const groups = useMemo(() => {
    const map = new Map<string, Integration[]>();
    list
      .filter((i) => (keyword ? i.name.includes(keyword) || i.desc.includes(keyword) : true))
      .forEach((i) => {
        const arr = map.get(i.category) ?? [];
        arr.push(i);
        map.set(i.category, arr);
      });
    return [...map.entries()];
  }, [list, keyword]);

  const connectedCount = list.filter((i) => i.connected).length;

  const toggle = (id: string) => {
    setList((prev) => prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)));
    const target = list.find((i) => i.id === id);
    message.success(target?.connected ? `已断开 ${target.name}` : `已连接 ${target?.name}`);
  };

  return (
    <div className="np-page">
      <PageHeader
        title="集成管理"
        desc={`${connectedCount} / ${list.length} 个服务已连接 · 所有凭据加密存储，仅用于本工作空间`}
        actions={
          <>
            <Input
              allowClear
              prefix={<Search size={13} style={{ color: 'var(--np-text-tertiary)' }} />}
              placeholder="搜索服务"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 200 }}
            />
            <Button icon={<Plug size={13} />}>自定义集成</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">已连接</div>
          <div className="np-stat-value">{connectedCount}</div>
          <div className="np-stat-foot">共 {list.length} 个可用集成</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">同步正常</div>
          <div className="np-stat-value" style={{ color: 'var(--np-success)' }}>
            {list.filter((i) => i.connected && i.lastSync).length}
          </div>
          <div className="np-stat-foot">最近 15 分钟内均有同步</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">待授权</div>
          <div className="np-stat-value">{list.filter((i) => !i.connected).length}</div>
          <div className="np-stat-foot">点击卡片即可连接</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">Webhook 事件</div>
          <div className="np-stat-value">1,284</div>
          <div className="np-stat-foot">今日接收</div>
        </div>
      </div>

      {groups.map(([category, items]) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <SectionCard title={category} sub={`${items.filter((i) => i.connected).length} / ${items.length} 已连接`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {items.map((i) => (
                <div
                  key={i.id}
                  style={{
                    border: `1px solid ${i.connected ? 'var(--np-border-strong)' : 'var(--np-border)'}`,
                    borderRadius: 8,
                    padding: '13px 14px',
                    background: 'var(--np-bg-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        background: i.color,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10.5,
                        fontWeight: 600,
                        flexShrink: 0,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {i.initial}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{i.name}</span>
                        {i.connected && <CheckCircle2 size={12} style={{ color: 'var(--np-success)' }} />}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }} className="np-truncate">
                        {i.connected ? i.account : '未连接'}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, lineHeight: 1.65, color: 'var(--np-text-secondary)', minHeight: 38 }}>{i.desc}</div>

                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {i.scopes.map((s) => (
                      <span
                        key={s}
                        className="np-mono-sm"
                        style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: 'var(--np-bg-subtle)', color: 'var(--np-text-tertiary)' }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    {i.connected ? (
                      <>
                        <StatusTag label={`同步 ${i.lastSync}`} tone="success" dot={false} />
                        <div style={{ flex: 1 }} />
                        <Button size="small" type="text" icon={<Settings2 size={12} />} onClick={() => toggle(i.id)}>
                          断开
                        </Button>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1 }} />
                        <Button size="small" icon={<Link2 size={12} />} onClick={() => toggle(i.id)}>
                          连接
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      ))}

      <SectionCard title="Webhook 接收配置" sub="供外部系统回调">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)', marginBottom: 4 }}>回调地址</div>
            <div
              className="np-mono-sm"
              style={{ padding: '8px 10px', background: 'var(--np-bg-subtle)', borderRadius: 6, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span className="np-truncate" style={{ flex: 1 }}>
                https://hook.nexusplay.cn/ws/yunyue/ci-events
              </span>
              <Button size="small" type="text" icon={<ExternalLink size={11} />} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['build.success', 'build.failed', 'release.online', 'release.rejected', 'ticket.created', 'crash.new_group'].map((e) => (
              <span
                key={e}
                className="np-mono-sm"
                style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 4, border: '1px solid var(--np-border)', color: 'var(--np-text-secondary)' }}
              >
                {e}
              </span>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
