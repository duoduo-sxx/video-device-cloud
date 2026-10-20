import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Switch } from 'antd';
import { Activity, ArrowDownRight, ArrowUpRight, Radio, Users, Wallet } from 'lucide-react';
import { CHANNELS } from '@/types/enums';
import type { ChannelId } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { BaseChart } from '@/components/BaseChart';
import { Progress } from '@/components/ui';
import { byChannel, dailyTotals, projectName, realtimeBase } from '@/mock';
import { formatInt, formatMoney } from '@/utils/format';

interface Event {
  id: string;
  time: string;
  type: 'pay' | 'register' | 'level' | 'share' | 'error';
  channel: ChannelId;
  projectId: string;
  detail: string;
  amount?: number;
  region: string;
}

const EVENT_META = {
  pay: { label: '支付', color: 'var(--np-success)' },
  register: { label: '注册', color: 'var(--np-primary-500)' },
  level: { label: '通关', color: 'var(--np-info)' },
  share: { label: '分享', color: 'var(--np-purple, #8B5CF6)' },
  error: { label: '异常', color: 'var(--np-danger)' },
} as const;

const REGIONS = ['广东', '江苏', '浙江', '山东', '四川', '河南', '北京', '上海', '福建', '湖北'];
const PRODUCTS = [
  { id: 'PRJ-2026-006', name: '深海迷航' },
  { id: 'PRJ-2025-032', name: '三国烽火连城' },
  { id: 'PRJ-2025-028', name: '萌宠消消乐' },
  { id: 'PRJ-2025-019', name: '星际远征' },
  { id: 'PRJ-2025-041', name: '纸上江湖' },
];

function makeEvent(seed: number): Event {
  const r = (n: number) => Math.abs(Math.sin(seed * n) * 10000) % 1;
  const types: Event['type'][] = ['pay', 'register', 'level', 'share', 'error'];
  const weights = [0.42, 0.26, 0.16, 0.11, 0.05];
  let acc = 0;
  const pick = r(1.7);
  let type: Event['type'] = 'pay';
  for (let i = 0; i < types.length; i += 1) {
    acc += weights[i];
    if (pick <= acc) {
      type = types[i];
      break;
    }
  }
  const chIds = Object.keys(CHANNELS) as ChannelId[];
  const channel = chIds[Math.floor(r(2.3) * chIds.length)] ?? 'wechat';
  const product = PRODUCTS[Math.floor(r(3.1) * PRODUCTS.length)] ?? PRODUCTS[0];
  const amount = type === 'pay' ? [6, 6, 12, 30, 68, 98, 128, 328][Math.floor(r(4.2) * 8)] ?? 6 : undefined;
  const details: Record<Event['type'], string> = {
    pay: `购买${['新手礼包', '月卡', '战令', '钻石 300', '限时特惠', '成长基金'][Math.floor(r(5.5) * 6)] ?? '道具'}`,
    register: `新用户注册，来源${['自然量', '买量', '分享拉新', '渠道推荐'][Math.floor(r(6.1) * 4)] ?? '自然量'}`,
    level: `通关第 ${Math.floor(r(7.3) * 40) + 3} 关`,
    share: `分享${['战绩', '排行榜', '邀请好友'][Math.floor(r(8.4) * 3)] ?? '战绩'}至${['微信', '抖音', 'QQ'][Math.floor(r(9.2) * 3)] ?? '微信'}`,
    error: `${['资源加载超时', '音频解码失败', '支付回调异常', 'WebGL 上下文丢失'][Math.floor(r(10.3) * 4)] ?? '未知异常'}`,
  };
  const now = new Date(2026, 9, 19, 13, 32, 0);
  const t = new Date(now.getTime() - seed * 4000);
  return {
    id: `EV-${seed}`,
    time: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`,
    type,
    channel,
    projectId: product.id,
    detail: details[type],
    amount,
    region: REGIONS[Math.floor(r(11.4) * REGIONS.length)] ?? '广东',
  };
}

export default function RealtimePage() {
  const [live, setLive] = useState(true);
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState<Event[]>(() => Array.from({ length: 14 }, (_, i) => makeEvent(i + 1)));
  const counter = useRef(15);

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      setTick((t) => t + 1);
      counter.current += 1;
      setEvents((prev) => [makeEvent(counter.current), ...prev].slice(0, 18));
    }, 2200);
    return () => clearInterval(timer);
  }, [live]);

  const online = realtimeBase + tick * 37 + Math.round(Math.sin(tick / 2) * 210);
  const todayDau = dailyTotals[dailyTotals.length - 1]?.dau ?? 0;
  const todayRevenue = dailyTotals[dailyTotals.length - 1]?.revenue ?? 0;
  const channels = useMemo(() => byChannel(7), []);

  const trend = useMemo(() => {
    const base = dailyTotals.slice(-1)[0]?.dau ?? 1000000;
    return Array.from({ length: 48 }, (_, i) => {
      const h = (13 - Math.floor(i / 4) + 24) % 24;
      const v = Math.round(base * (0.35 + 0.5 * Math.sin(((i + 6) / 48) * Math.PI)) * (1 + Math.sin(i) * 0.03));
      return { h: `${String(h).padStart(2, '0')}:00`, v };
    }).reverse();
  }, []);

  const onlineChart = useMemo(
    () => ({
      grid: { left: 4, right: 12, top: 16, bottom: 4, containLabel: true },
      xAxis: { type: 'category' as const, data: trend.map((t) => t.h), boundaryGap: false },
      yAxis: { type: 'value' as const, axisLabel: { formatter: (v: number) => `${Math.round(v / 10000)}万` } },
      tooltip: { trigger: 'axis' as const, valueFormatter: (v: unknown) => formatInt(Number(v)) },
      series: [
        {
          type: 'line' as const,
          data: trend.map((t) => t.v),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#4C8DFF' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(76,141,255,.22)' },
                { offset: 1, color: 'rgba(76,141,255,0)' },
              ],
            },
          },
        },
      ],
    }),
    [trend],
  );

  const payTotal = events.filter((e) => e.type === 'pay').reduce((s, e) => s + (e.amount ?? 0), 0);

  return (
    <div className="np-page">
      <PageHeader
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            实时数据
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 500,
                color: live ? 'var(--np-success)' : 'var(--np-text-tertiary)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: live ? 'var(--np-success)' : 'var(--np-text-disabled)',
                  boxShadow: live ? '0 0 0 3px rgba(23,178,106,.18)' : 'none',
                }}
              />
              {live ? 'LIVE' : '已暂停'}
            </span>
          </span>
        }
        desc={`数据延迟约 5 秒 · 最后更新 ${new Date(2026, 9, 19, 13, 32, tick * 2).toLocaleTimeString('zh-CN', { hour12: false })}`}
        actions={
          <>
            <span style={{ fontSize: 12, color: 'var(--np-text-tertiary)' }}>自动刷新</span>
            <Switch size="small" checked={live} onChange={setLive} />
            <Button icon={<Radio size={13} />} onClick={() => setTick(tick + 1)}>
              立即刷新
            </Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Activity size={13} /> 当前在线
            </span>
          </div>
          <div className="np-stat-value">{formatInt(online)}</div>
          <div className="np-stat-foot">
            <span style={{ color: 'var(--np-success)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <ArrowUpRight size={11} /> 12.4%
            </span>
            <span style={{ marginLeft: 6 }}>较一小时前</span>
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Users size={13} /> 今日活跃
            </span>
          </div>
          <div className="np-stat-value">{formatInt(todayDau)}</div>
          <div className="np-stat-foot">昨日同期 {formatInt(todayDau * 0.94)}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Wallet size={13} /> 今日流水
            </span>
          </div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>
            {formatMoney(todayRevenue, false)}
          </div>
          <div className="np-stat-foot">
            <span style={{ color: 'var(--np-danger)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <ArrowDownRight size={11} /> 3.1%
            </span>
            <span style={{ marginLeft: 6 }}>较昨日</span>
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">最近支付</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>
            {formatMoney(payTotal, false)}
          </div>
          <div className="np-stat-foot">来自最新 {events.filter((e) => e.type === 'pay').length} 笔订单</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <SectionCard title="在线人数曲线" sub="近 12 小时" extra={<span style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>5 分钟粒度</span>}>
            <BaseChart option={onlineChart} height={230} />
          </SectionCard>

          <SectionCard title="分渠道在线" sub={`${channels.length} 个渠道`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 26px' }}>
              {channels.map((c) => {
                const cur = Math.round(online * (c.dau / Math.max(1, channels.reduce((s, x) => s + x.dau, 0))));
                return (
                  <div key={c.channel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span>{CHANNELS[c.channel].name}</span>
                      <span className="np-num" style={{ color: 'var(--np-text-tertiary)' }}>
                        {formatInt(cur)}
                      </span>
                    </div>
                    <Progress value={(cur / Math.max(1, online)) * 100} height={5} />
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="实时事件流"
          sub={live ? '自动接收中' : '已暂停'}
          bodyStyle={{ padding: '4px 10px 10px', maxHeight: 560, overflowY: 'auto' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {events.map((e) => {
              const meta = EVENT_META[e.type];
              return (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '7px 4px',
                    borderBottom: '1px solid var(--np-border)',
                  }}
                >
                  <span className="np-mono-sm" style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', width: 52, flexShrink: 0, paddingTop: 3 }}>
                    {e.time}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                      color: meta.color,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {meta.label}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                      {projectName(e.projectId)} · {e.detail}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>
                      {CHANNELS[e.channel].short} · {e.region}
                    </div>
                  </div>
                  {e.amount && (
                    <span className="np-num" style={{ fontSize: 11.5, color: 'var(--np-success)', flexShrink: 0 }}>
                      ¥{e.amount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
