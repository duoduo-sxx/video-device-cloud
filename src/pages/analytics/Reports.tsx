import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, Radio, Space, Button, Tag } from 'antd';
import { DownloadOutlined, MessageOutlined, RiseOutlined, FallOutlined, ThunderboltOutlined } from '@ant-design/icons';
import * as api from '@/api';
import * as echarts from 'echarts';
import type { MetricPoint, Session } from '@/types';
import { ChartCard } from '@/components/ChartCard';

const Reports: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [range, setRange] = useState<'7' | '30'>('30');

  useEffect(() => {
    api.getMetrics().then((r) => setMetrics(r.data));
    api.listSessions().then((r) => setSessions(r.data));
  }, []);

  const shown = useMemo(() => (range === '7' ? metrics.slice(-7) : metrics), [metrics, range]);

  const intentDist = useMemo(() => {
    const counts = new Map<string, number>();
    sessions.forEach((s) =>
      s.messages.forEach((m) => { if (m.intent) counts.set(m.intent, (counts.get(m.intent) ?? 0) + 1); }));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  const exportCsv = () => {
    const header = '日期,会话量,消息量,命中率\n';
    const body = shown.map((m) => `${m.date},${m.sessions},${m.messages},${m.hitRate}%`).join('\n');
    const blob = new Blob(['\ufeff' + header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '交互运营报表.csv';
    a.click();
  };

  const trendOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['会话量', '消息量'] },
    grid: { left: 50, right: 30, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: shown.map((m) => m.date.slice(5)) },
    yAxis: [{ type: 'value' }, { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } }],
    series: [
      { name: '会话量', type: 'bar', data: shown.map((m) => m.sessions), itemStyle: { color: '#2563EB', borderRadius: 4 } },
      { name: '消息量', type: 'line', smooth: true, data: shown.map((m) => m.messages), itemStyle: { color: '#7c3aed' } },
      { name: '命中率', type: 'line', yAxisIndex: 1, smooth: true, data: shown.map((m) => m.hitRate), itemStyle: { color: '#0d9488' } },
    ],
  };

  const pieOption: echarts.EChartsOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 8, top: 'middle', type: 'scroll' },
    series: [{
      type: 'pie', radius: ['40%', '68%'], center: ['38%', '50%'],
      label: { show: false },
      data: intentDist.map((d, i) => ({ name: d.name, value: d.value })),
      color: ['#2563EB', '#7c3aed', '#0d9488', '#d97706', '#dc2626', '#db2777', '#16a34a', '#6b7280'],
    }],
  };

  const last = shown[shown.length - 1];
  const first = shown[0];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Radio.Group value={range} onChange={(e) => setRange(e.target.value)} optionType="button" buttonStyle="solid"
          options={[{ value: '7', label: '近 7 天' }, { value: '30', label: '近 30 天' }]} />
        <DatePicker.RangePicker size="middle" />
        <Button icon={<DownloadOutlined />} onClick={exportCsv}>导出 CSV</Button>
      </Space>

      <Row gutter={[16, 16]}>
        {[
          { label: '总会话量', value: shown.reduce((s, m) => s + m.sessions, 0), delta: 8.2 },
          { label: '总消息量', value: shown.reduce((s, m) => s + m.messages, 0), delta: 11.4 },
          { label: '平均命中率', value: `${(shown.reduce((s, m) => s + m.hitRate, 0) / shown.length).toFixed(1)}%`, delta: 1.2 },
          { label: '日均会话', value: Math.round(shown.reduce((s, m) => s + m.sessions, 0) / shown.length), delta: -2.1 },
        ].map((c) => (
          <Col xs={12} md={6} key={c.label}>
            <Card size="small">
              <Statistic title={c.label} value={c.value} />
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {c.delta > 0
                  ? <span style={{ color: '#cf1322' }}><RiseOutlined /> +{c.delta}%</span>
                  : <span style={{ color: '#3f8600' }}><FallOutlined /> {c.delta}%</span>}
                <span style={{ color: '#999', marginLeft: 8 }}>环比上一周期</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <ChartCard title="会话量 / 消息量 / 意图命中率" option={trendOption} height={340} />
        </Col>
        <Col xs={24} lg={8}>
          <ChartCard title="意图分布 Top8" option={pieOption} height={340} />
        </Col>
      </Row>

      <Card size="small" title="明细数据" style={{ marginTop: 16 }}>
        <Table
          size="small"
          rowKey="date"
          dataSource={[...shown].reverse()}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '日期', dataIndex: 'date' },
            { title: '会话量', dataIndex: 'sessions', render: (v) => <span><MessageOutlined style={{ color: '#2563EB', marginRight: 6 }} />{v}</span> },
            { title: '消息量', dataIndex: 'messages' },
            { title: '意图命中率', dataIndex: 'hitRate', render: (v) => <Tag color="green">{v}%</Tag> },
          ]}
        />
      </Card>
    </div>
  );
};

export default Reports;
