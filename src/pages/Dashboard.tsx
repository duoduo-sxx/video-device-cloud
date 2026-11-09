import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, List, Tag, Typography, Space, Button, Progress } from 'antd';
import {
  MessageOutlined, RiseOutlined, FallOutlined, ThunderboltOutlined, RobotOutlined,
  BookOutlined, ExperimentOutlined, BarChartOutlined, RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as api from '@/api';
import type { MetricPoint, Notice, Session, TodoItem } from '@/types';
import { ChartCard } from '@/components/ChartCard';
import * as echarts from 'echarts';
import { useAppStore } from '@/store/app';

const STAT_CONFIG = [
  { key: 'sessions', label: '今日会话量', icon: <MessageOutlined />, up: true },
  { key: 'messages', label: '今日消息量', icon: <MessageOutlined />, up: true },
  { key: 'hitRate', label: '意图命中率', icon: <ThunderboltOutlined />, up: true },
  { key: 'latency', label: '平均响应时长', icon: <RiseOutlined />, up: false },
  { key: 'bots', label: '在线机器人数', icon: <RobotOutlined />, up: true },
] as const;

const QUICK_ENTRIES = [
  { title: '智能对话', icon: <MessageOutlined />, path: '/chat', color: '#2563EB' },
  { title: '语义分析', icon: <ExperimentOutlined />, path: '/nlp', color: '#7c3aed' },
  { title: '知识库', icon: <BookOutlined />, path: '/knowledge', color: '#0d9488' },
  { title: '运营大屏', icon: <BarChartOutlined />, path: '/analytics/bigscreen', color: '#d97706' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [recent, setRecent] = useState<Session[]>([]);

  useEffect(() => {
    api.getMetrics().then((r) => setMetrics(r.data));
    api.getTodos().then((r) => setTodos(r.data));
    api.getNotices().then((r) => setNotices(r.data));
    api.getRecentSessions().then((r) => setRecent(r.data));
  }, []);

  const today = metrics[metrics.length - 1];
  const yesterday = metrics[metrics.length - 2];
  const cards = [
    { label: '今日会话量', value: today?.sessions ?? 0, delta: 6.8, icon: <MessageOutlined /> },
    { label: '今日消息量', value: today?.messages ?? 0, delta: 9.2, icon: <MessageOutlined /> },
    { label: '意图命中率', value: `${today?.hitRate ?? 0}%`, delta: 1.6, icon: <ThunderboltOutlined /> },
    { label: '平均响应时长', value: '0.8s', delta: -12.5, icon: <RiseOutlined /> },
    { label: '在线机器人数', value: 6, delta: 0, icon: <RobotOutlined /> },
  ];

  const trendOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['会话量', '消息量'], top: 4 },
    grid: { left: 48, right: 24, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: metrics.map((m) => m.date.slice(5)) },
    yAxis: { type: 'value' },
    series: [
      { name: '会话量', type: 'line', smooth: true, data: metrics.map((m) => m.sessions), itemStyle: { color: '#2563EB' }, areaStyle: { opacity: 0.15 } },
      { name: '消息量', type: 'line', smooth: true, yAxisIndex: 0, data: metrics.map((m) => m.messages), itemStyle: { color: '#7c3aed' } },
    ],
  };

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        你好，{user?.name} 👋 今天也是充满智能的一天
      </Typography.Title>

      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={12} md={8} lg={4} xl={4} key={c.label} style={{ flex: '1 1 0' }}>
            <Card size="small">
              <Statistic
                title={c.label}
                value={c.value}
                prefix={c.icon}
                valueStyle={{ fontSize: 22 }}
              />
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {c.delta === 0 ? (
                  <span style={{ color: '#999' }}>环比持平</span>
                ) : c.delta > 0 ? (
                  <span style={{ color: '#cf1322' }}><RiseOutlined /> 环比 +{c.delta}%</span>
                ) : (
                  <span style={{ color: '#3f8600' }}><FallOutlined /> 环比 {c.delta}%</span>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card size="small">
            <Space size={40} wrap>
              {QUICK_ENTRIES.map((e) => (
                <Button key={e.title} type="text" onClick={() => navigate(e.path)} icon={e.icon} style={{ color: e.color, fontWeight: 600, fontSize: 14 }}>
                  {e.title} <RightOutlined style={{ fontSize: 10 }} />
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <ChartCard title="近 30 天交互趋势" option={trendOption} height={300} />
        </Col>
        <Col xs={24} lg={10}>
          <Card size="small" title="今日待办" style={{ marginBottom: 16 }}>
            <List
              size="small"
              dataSource={todos}
              renderItem={(t) => (
                <List.Item
                  actions={[
                    <Tag color={t.status === '已完成' ? 'green' : t.status === '处理中' ? 'blue' : 'orange'}>{t.status}</Tag>,
                  ]}
                >
                  <span style={{ flex: 1 }}>{t.title}</span>
                  <span style={{ color: '#999', fontSize: 12, marginRight: 12 }}>{t.due}</span>
                </List.Item>
              )}
            />
          </Card>
          <Card size="small" title="系统公告">
            <List
              size="small"
              dataSource={notices}
              renderItem={(n) => (
                <List.Item>
                  <List.Item.Meta title={<span style={{ fontSize: 13 }}>{n.title}</span>} description={<span style={{ fontSize: 12 }}>{n.date} · {n.content}</span>} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" title="最近会话" style={{ marginTop: 16 }}
        extra={<Button type="link" size="small" onClick={() => navigate('/chat')}>进入对话中心</Button>}>
        <List
          size="small"
          dataSource={recent}
          renderItem={(s) => (
            <List.Item>
              <span>{s.userName} · {s.channel}</span>
              <span style={{ flex: 1, marginLeft: 16, color: '#666', fontSize: 12 }}>{s.title}</span>
              <span style={{ color: '#999', fontSize: 12 }}>{s.updatedAt}</span>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
