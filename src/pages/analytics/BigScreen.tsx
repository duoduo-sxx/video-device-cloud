import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import * as api from '@/api';
import type { MetricPoint, Session } from '@/types';

const C = { bg: '#0b1530', panel: 'rgba(20,42,84,.55)', border: 'rgba(80,140,255,.3)', accent: '#38bdf8', text: '#cfe3ff', dim: '#6f8cbf' };

const useChart = (ref: React.RefObject<HTMLDivElement>, option: echarts.EChartsOption, deps: unknown[]) => {
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption(option);
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); chart.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

const RollingNumber: React.FC<{ value: number; suffix?: string }> = ({ value, suffix }) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1200);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span style={{ fontSize: 34, fontWeight: 700, color: C.accent, fontFamily: 'monospace' }}>{shown.toLocaleString()}{suffix}</span>;
};

const BigScreen: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [liveMsgs, setLiveMsgs] = useState<{ time: string; text: string; intent: string }[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getMetrics().then((r) => setMetrics(r.data));
    api.listSessions().then((r) => setSessions(r.data));
  }, []);

  // 实时消息模拟滚动
  useEffect(() => {
    const pool = [
      { text: '我的退款什么时候到账', intent: '退款申请' },
      { text: '帮我查一下这个月账单', intent: '账单查询' },
      { text: '最近有什么优惠活动', intent: '会员活动' },
      { text: '系统一直报错怎么办', intent: '技术支持' },
      { text: '我要转人工客服', intent: '转人工' },
      { text: '你们的智能客服多少钱', intent: '价格咨询' },
    ];
    const timer = setInterval(() => {
      const p = pool[Math.floor(Math.random() * pool.length)];
      const now = new Date();
      setLiveMsgs((msgs) => [{ time: now.toLocaleTimeString('zh-CN', { hour12: false }), text: p.text, intent: p.intent }, ...msgs].slice(0, 12));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const last = metrics[metrics.length - 1];

  const lineOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis', backgroundColor: C.panel, borderColor: C.border, textStyle: { color: C.text } },
    legend: { data: ['会话量', '消息量'], textStyle: { color: C.dim }, top: 0, right: 8 },
    grid: { left: 46, right: 16, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: metrics.map((m) => m.date.slice(5)), axisLine: { lineStyle: { color: C.border } }, axisLabel: { color: C.dim } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(80,140,255,.12)' } }, axisLabel: { color: C.dim } },
    series: [
      { name: '会话量', type: 'line', smooth: true, symbol: 'none', data: metrics.map((m) => m.sessions), lineStyle: { color: '#38bdf8', width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(56,189,248,.35)' }, { offset: 1, color: 'rgba(56,189,248,0)' }] } as never } },
      { name: '消息量', type: 'line', smooth: true, symbol: 'none', data: metrics.map((m) => m.messages), lineStyle: { color: '#a78bfa', width: 2 } },
    ],
  };

  const intentDist: Record<string, number> = {};
  sessions.forEach((s) => s.messages.forEach((m) => { if (m.intent) intentDist[m.intent] = (intentDist[m.intent] ?? 0) + 1; }));
  const topIntents = Object.entries(intentDist).sort((a, b) => b[1] - a[1]).slice(0, 7);

  const pieOption: echarts.EChartsOption = {
    tooltip: { backgroundColor: C.panel, borderColor: C.border, textStyle: { color: C.text } },
    series: [{
      type: 'pie', radius: ['48%', '70%'], center: ['50%', '52%'],
      label: { color: C.dim, formatter: '{b}\n{d}%' },
      data: topIntents.map(([name, value], i) => ({ name, value, itemStyle: { color: ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#f472b6', '#60a5fa'][i] } })),
    }],
  };

  const barOption: echarts.EChartsOption = {
    tooltip: { backgroundColor: C.panel, borderColor: C.border, textStyle: { color: C.text } },
    grid: { left: 90, right: 24, top: 10, bottom: 24 },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(80,140,255,.12)' } }, axisLabel: { color: C.dim } },
    yAxis: { type: 'category', data: ['小程序', '电话', 'Web', 'App'], axisLabel: { color: C.dim } },
    series: [{
      type: 'bar', data: [42, 28, 61, 49], barWidth: 14,
      itemStyle: { borderRadius: 6, color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#2563EB' }, { offset: 1, color: '#38bdf8' }] } as never },
    }],
  };

  useChart(lineRef, lineOption, [metrics]);
  useChart(pieRef, pieOption, [sessions]);
  useChart(barRef, barOption, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 20, color: C.text }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: 8, color: C.accent }}>智能交互运营监控大屏</span>
        <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>INTELLIGENT INTERACTION MONITORING · 数据每小时自动刷新（模拟）</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 14 }}>
        {/* 左列 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="bigscreen-card">
            <div className="bigscreen-title">意图命中分布</div>
            <div ref={pieRef} style={{ height: 260 }} />
          </div>
          <div className="bigscreen-card" style={{ flex: 1 }}>
            <div className="bigscreen-title">渠道来源</div>
            <div ref={barRef} style={{ height: 200 }} />
          </div>
        </div>
        {/* 中列 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            {[
              { label: '累计会话数', value: metrics.reduce((s, m) => s + m.sessions, 0) },
              { label: '今日消息数', value: last?.messages ?? 0 },
              { label: '意图命中率', value: Math.round(last?.hitRate ?? 0), suffix: '%' },
              { label: '用户满意度', value: 94, suffix: '%' },
            ].map((k) => (
              <div key={k.label} className="bigscreen-card" style={{ textAlign: 'center' }}>
                <div style={{ color: C.dim, fontSize: 13 }}>{k.label}</div>
                <RollingNumber value={k.value} suffix={k.suffix} />
              </div>
            ))}
          </div>
          <div className="bigscreen-card" style={{ flex: 1 }}>
            <div className="bigscreen-title">近 30 天交互趋势</div>
            <div ref={lineRef} style={{ height: 320 }} />
          </div>
        </div>
        {/* 右列 */}
        <div className="bigscreen-card">
          <div className="bigscreen-title">实时消息流</div>
          <div style={{ overflow: 'hidden', height: 460 }}>
            {liveMsgs.map((m, i) => (
              <div key={`${m.time}-${i}`} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px dashed rgba(80,140,255,.15)', fontSize: 13, animation: 'fadeIn .5s' }}>
                <span style={{ color: C.dim, fontFamily: 'monospace', fontSize: 12 }}>{m.time}</span>
                <span style={{ flex: 1 }}>{m.text}</span>
                <span style={{ color: '#38bdf8', fontSize: 12 }}>[{m.intent}]</span>
              </div>
            ))}
            {liveMsgs.length === 0 && <div style={{ color: C.dim, textAlign: 'center', marginTop: 60 }}>等待实时消息接入…</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BigScreen;
