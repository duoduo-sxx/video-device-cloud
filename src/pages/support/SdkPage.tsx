import { useMemo, useState } from 'react';
import { Button, Select, Table, Tabs, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircle2, Copy, Package, Terminal } from 'lucide-react';
import { CHANNELS } from '@/types/enums';
import type { ChannelId } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { StatusTag } from '@/components/ui';
import { formatInt } from '@/utils/format';

interface SdkVersion {
  version: string;
  date: string;
  size: number;
  status: 'stable' | 'beta' | 'deprecated';
  channels: ChannelId[];
  changes: string[];
  adoption: number;
}

const VERSIONS: SdkVersion[] = [
  {
    version: '3.4.2',
    date: '2026-10-12',
    size: 84.2,
    status: 'stable',
    channels: ['wechat', 'douyin', 'kuaishou', 'alipay', 'h5'],
    changes: ['修复微信小游戏支付回调偶发丢失', '新增分包预加载 API', '降低初始化耗时约 120ms'],
    adoption: 62,
  },
  {
    version: '3.4.0',
    date: '2026-09-18',
    size: 82.6,
    status: 'stable',
    channels: ['wechat', 'douyin', 'kuaishou', 'alipay', 'h5', 'webview'],
    changes: ['统一支付接口，支持支付宝新规', '埋点上报改为批量队列', '移除 jQuery 依赖'],
    adoption: 28,
  },
  {
    version: '3.5.0-beta.3',
    date: '2026-10-16',
    size: 88.7,
    status: 'beta',
    channels: ['wechat', 'douyin', 'facebook', 'telegram', 'poki', 'crazygames'],
    changes: ['支持 Facebook Instant Games 广告 API', '新增性能采样开关', '适配 Telegram Mini App 主题色'],
    adoption: 7,
  },
  {
    version: '3.3.8',
    date: '2026-07-02',
    size: 79.4,
    status: 'deprecated',
    channels: ['wechat', 'douyin', 'h5'],
    changes: ['最后维护版本，2026-12-31 停止支持'],
    adoption: 3,
  },
];

const ADAPTERS: { channel: ChannelId; version: string; updated: string; status: 'stable' | 'beta' | 'broken'; note: string }[] = [
  { channel: 'wechat', version: '3.4.2', updated: '2026-10-12', status: 'stable', note: '全部能力可用' },
  { channel: 'douyin', version: '3.4.2', updated: '2026-10-12', status: 'stable', note: '录屏分享需主体资质' },
  { channel: 'kuaishou', version: '3.4.1', updated: '2026-10-05', status: 'stable', note: '侧边栏拉起待适配' },
  { channel: 'alipay', version: '3.4.0', updated: '2026-09-18', status: 'stable', note: '支付需签约新协议' },
  { channel: 'facebook', version: '3.5.0-beta.3', updated: '2026-10-16', status: 'beta', note: '广告 API 联调中' },
  { channel: 'telegram', version: '3.5.0-beta.3', updated: '2026-10-16', status: 'beta', note: '仅支持 TON 支付' },
  { channel: 'poki', version: '3.5.0-beta.3', updated: '2026-10-16', status: 'beta', note: '需移除外部链接' },
  { channel: 'crazygames', version: '3.5.0-beta.3', updated: '2026-10-16', status: 'beta', note: 'SDK 加载需同步' },
  { channel: 'h5', version: '3.4.2', updated: '2026-10-12', status: 'stable', note: '自有站点，无审核' },
  { channel: 'webview', version: '3.4.0', updated: '2026-09-18', status: 'stable', note: '需 App 侧注入 JSBridge' },
];

const INSTALL_CODE = `# npm
npm i @nexusplay/sdk@3.4.2

# 或 CDN（微信小游戏建议本地打包，避免审核风险）
# https://cdn.nexusplay.cn/sdk/3.4.2/np.min.js

// 初始化（在游戏启动前调用）
import { NP } from '@nexusplay/sdk';

await NP.init({
  appId: 'wx8f2c1a9b4e6d7c30',
  channel: 'wechat',       // wechat | douyin | kuaishou | ...
  env: 'production',
  track: { batch: true, flushInterval: 5000 },
});

// 登录
const { openId, token } = await NP.login();

// 支付（内部自动分发到渠道）
await NP.pay({ orderId: '202610190001', amount: 6, product: '新手礼包' });

// 事件上报
NP.track('level_complete', { level: 12, duration: 184 });`;

export default function SdkPage() {
  const [tab, setTab] = useState('guide');
  const [version, setVersion] = useState('3.4.2');
  const [copied, setCopied] = useState(false);

  const current = useMemo(() => VERSIONS.find((v) => v.version === version) ?? VERSIONS[0], [version]);

  const columns: ColumnsType<SdkVersion> = [
    {
      title: '版本',
      dataIndex: 'version',
      width: 140,
      render: (v: string, r) => (
        <div>
          <span className="np-mono-sm">{v}</span>
          {r.status === 'stable' && v === '3.4.2' && <StatusTag label="最新" tone="success" dot={false} style={{ marginLeft: 6 }} />}
        </div>
      ),
    },
    { title: '发布日期', dataIndex: 'date', width: 108, render: (v: string) => <span style={{ fontSize: 11.5 }}>{v}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 92,
      render: (v: SdkVersion['status']) => (
        <StatusTag
          label={v === 'stable' ? '稳定' : v === 'beta' ? '测试' : '废弃'}
          tone={v === 'stable' ? 'success' : v === 'beta' ? 'info' : 'default'}
        />
      ),
    },
    {
      title: '体积',
      dataIndex: 'size',
      width: 84,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{v} KB</span>,
    },
    {
      title: '支持渠道',
      dataIndex: 'channels',
      render: (v: ChannelId[]) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {v.map((c) => (
            <span
              key={c}
              style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: 'var(--np-bg-subtle)', color: 'var(--np-text-secondary)' }}
            >
              {CHANNELS[c].short}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: '采用率',
      dataIndex: 'adoption',
      width: 80,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 11.5 }}>{v}%</span>,
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="SDK 与接入"
        desc={`当前推荐版本 3.4.2 · ${ADAPTERS.filter((a) => a.status === 'stable').length} 个渠道适配器稳定 · ${formatInt(9)} 个项目已接入`}
        actions={
          <>
            <Select
              size="small"
              value={version}
              onChange={setVersion}
              style={{ width: 148 }}
              options={VERSIONS.map((v) => ({ value: v.version, label: v.version }))}
            />
            <Button>查看变更日志</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">推荐版本</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{VERSIONS[0]?.version}</div>
          <div className="np-stat-foot">{VERSIONS[0]?.date} 发布</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">SDK 体积</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{current?.size} <small>KB</small></div>
          <div className="np-stat-foot">gzip 后约 {current ? (current.size * 0.38).toFixed(1) : '—'} KB</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">渠道适配器</div>
          <div className="np-stat-value">{ADAPTERS.length}</div>
          <div className="np-stat-foot">{ADAPTERS.filter((a) => a.status === 'beta').length} 个处于测试</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">接入项目</div>
          <div className="np-stat-value">{formatInt(9)}</div>
          <div className="np-stat-foot">2 个项目仍在使用旧版</div>
        </div>
      </div>

      <SectionCard
        title="接入文档"
        extra={
          <Tabs
            size="small"
            activeKey={tab}
            onChange={setTab}
            items={[
              { key: 'guide', label: '快速接入' },
              { key: 'adapters', label: '渠道适配' },
              { key: 'changelog', label: '变更日志' },
            ]}
            style={{ marginBottom: -8 }}
          />
        }
      >
        {tab === 'guide' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--np-text-tertiary)' }}>
                <Terminal size={13} /> 三步完成接入
              </span>
              <Button
                size="small"
                icon={copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                onClick={() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                }}
              >
                {copied ? '已复制' : '复制代码'}
              </Button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: '14px 16px',
                background: 'var(--np-bg-subtle)',
                borderRadius: 8,
                fontSize: 11.5,
                lineHeight: 1.95,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: 'var(--np-text-secondary)',
                overflowX: 'auto',
              }}
            >
              {INSTALL_CODE}
            </pre>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                '小游戏渠道必须把 SDK 打进主包，禁止运行时从 CDN 拉取（审核会驳回）',
                'NP.init 必须在引擎启动前调用，否则支付与登录会拿不到渠道上下文',
                '所有 pay 调用需带业务侧订单号，服务端以该号做幂等',
                '埋点默认批量上报，离线场景会缓存到本地，恢复网络后补传',
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12, lineHeight: 1.7, color: 'var(--np-text-secondary)' }}>
                  <span style={{ color: 'var(--np-primary-500)', flexShrink: 0 }}>·</span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'adapters' && (
          <Table
            rowKey="channel"
            size="middle"
            pagination={false}
            dataSource={ADAPTERS}
            columns={[
              {
                title: '渠道',
                dataIndex: 'channel',
                render: (v: ChannelId) => <span style={{ fontSize: 12.5 }}>{CHANNELS[v].name}</span>,
              },
              {
                title: '适配器版本',
                dataIndex: 'version',
                width: 120,
                render: (v: string) => <span className="np-mono-sm">{v}</span>,
              },
              {
                title: '状态',
                dataIndex: 'status',
                width: 92,
                render: (v: string) => (
                  <StatusTag
                    label={v === 'stable' ? '稳定' : v === 'beta' ? '测试' : '异常'}
                    tone={v === 'stable' ? 'success' : v === 'beta' ? 'info' : 'danger'}
                  />
                ),
              },
              { title: '更新', dataIndex: 'updated', width: 108, render: (v: string) => <span style={{ fontSize: 11.5 }}>{v}</span> },
              {
                title: '备注',
                dataIndex: 'note',
                render: (v: string) => <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{v}</span>,
              },
            ]}
          />
        )}

        {tab === 'changelog' && (
          <Table
            rowKey="version"
            size="middle"
            pagination={false}
            dataSource={VERSIONS}
            columns={columns}
            scroll={{ x: 900 }}
            expandable={{
              expandedRowRender: (r) => (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.9, color: 'var(--np-text-secondary)' }}>
                  {r.changes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              ),
            }}
          />
        )}
      </SectionCard>

      <div style={{ marginTop: 16 }} className="np-grid-2">
        <SectionCard title="版本采用率" sub="按项目数">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {VERSIONS.map((v) => (
              <div key={v.version}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span className="np-mono-sm">{v.version}</span>
                  <span style={{ color: 'var(--np-text-tertiary)' }}>{v.adoption}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'var(--np-bg-subtle)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${v.adoption}%`,
                      height: '100%',
                      background: v.status === 'deprecated' ? 'var(--np-text-disabled)' : v.status === 'beta' ? 'var(--np-info)' : 'var(--np-success)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="包体影响" sub="SDK 占首包比例">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="38" fill="none" stroke="var(--np-bg-subtle)" strokeWidth="9" />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  fill="none"
                  stroke="var(--np-primary-500)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${(current ? (current.size / 1024 / 3.4) * 100 : 0) * 2.39} 239`}
                  transform="rotate(-90 48 48)"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600 }}>{current ? (current.size / 1024 / 3.4 * 100).toFixed(1) : '0'}%</span>
                <span style={{ fontSize: 10, color: 'var(--np-text-tertiary)' }}>首包占用</span>
              </div>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.9, color: 'var(--np-text-secondary)' }}>
              <div>微信首包上限 4MB，当前主包 3.4MB</div>
              <div>SDK 压缩后约 {current ? (current.size * 0.38 / 1024).toFixed(2) : '—'} MB</div>
              <Tooltip title="SDK 体积每增加 100KB，低端机冷启动平均多 80ms">
                <div style={{ color: 'var(--np-warning)', cursor: 'help' }}>继续增大需评估冷启动影响</div>
              </Tooltip>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <Button size="small" icon={<Package size={12} />}>下载 SDK</Button>
            <Button size="small">查看沙箱</Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
