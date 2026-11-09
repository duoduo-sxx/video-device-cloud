import React, { useEffect, useState } from 'react';
import { Card, Tabs, Table, Tag, Button, Space, Radio, Select, Input, Modal, message, Statistic, Row, Col, Empty, Typography } from 'antd';
import { FlagOutlined, AuditOutlined, RadarChartOutlined, CheckOutlined, RightOutlined } from '@ant-design/icons';
import * as api from '@/api';
import { ChartCard } from '@/components/ChartCard';
import * as echarts from 'echarts';
import type { Annotation, Badcase, Message, Session } from '@/types';

// ---------------- 对话标注 ----------------
const AnnotateTab: React.FC<{ sessions: Session[] }> = ({ sessions }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { result: string; errorType?: string; note?: string }>>({});
  const [saved, setSaved] = useState(0);

  const loadOne = async () => {
    const pool = sessions.filter((s) => s.messages.some((m) => m.role === 'bot'));
    const s = pool[Math.floor(Math.random() * pool.length)] ?? null;
    setSession(s);
    setDrafts({});
  };
  useEffect(() => { void loadOne(); /* eslint-disable-next-line */ }, [sessions.length]);

  const submit = async () => {
    if (!session) return;
    const annotations: Annotation[] = Object.entries(drafts).map(([msgId, d]) => ({
      id: `a${Date.now()}${msgId}`, sessionId: session.id, msgId,
      result: d.result as Annotation['result'], errorType: d.errorType, note: d.note,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    }));
    for (const a of annotations) await api.saveAnnotation(a);
    message.success(`已提交 ${annotations.length} 条标注`);
    setSaved((n) => n + annotations.length);
    void loadOne();
  };

  const botMsgs: Message[] = session?.messages.filter((m) => m.role === 'bot') ?? [];

  return (
    <div style={{ maxWidth: 900 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={loadOne}>换一条会话</Button>
        <Typography.Text type="secondary">累计已标注 {saved} 条</Typography.Text>
      </Space>
      {session ? (
        <>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Tag color="blue">会话 {session.id}</Tag>
              <Tag>{session.userName}</Tag>
              <Tag>{session.channel}</Tag>
              <span style={{ color: '#999', fontSize: 12 }}>{session.createdAt}</span>
            </Space>
            <div style={{ marginTop: 10 }}>
              {session.messages.map((m) => (
                <div key={m.id} style={{ margin: '6px 0' }}>
                  <Tag color={m.role === 'user' ? 'geekblue' : 'green'}>{m.role === 'user' ? session.userName : '小智'}</Tag>
                  <span>{m.content}</span>
                </div>
              ))}
            </div>
          </Card>
          {botMsgs.map((m, i) => {
            const d = drafts[m.id] ?? { result: '正确' };
            return (
              <Card key={m.id} size="small" title={`第 ${i + 1} 轮机器人回复`} style={{ marginBottom: 12 }}>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>「{m.content.slice(0, 60)}…」</div>
                <Space wrap>
                  <Radio.Group value={d.result} onChange={(e) => setDrafts((ds) => ({ ...ds, [m.id]: { ...d, result: e.target.value } }))}
                    options={['正确', '部分正确', '错误'].map((v) => ({ value: v, label: v }))} optionType="button" buttonStyle="solid" size="small" />
                  {d.result !== '正确' && (
                    <Select size="small" placeholder="错误类型" style={{ width: 140 }} value={d.errorType}
                      onChange={(v) => setDrafts((ds) => ({ ...ds, [m.id]: { ...d, errorType: v } }))}
                      options={['意图误识别', '知识缺失', '话术不当', '其他'].map((v) => ({ value: v, label: v }))} />
                  )}
                  <Input size="small" placeholder="备注（可选）" style={{ width: 200 }} value={d.note}
                    onChange={(e) => setDrafts((ds) => ({ ...ds, [m.id]: { ...d, note: e.target.value } }))} />
                </Space>
              </Card>
            );
          })}
          <Button type="primary" icon={<CheckOutlined />} onClick={submit}>提交标注</Button>
        </>
      ) : <Empty />}
    </div>
  );
};

// ---------------- Badcase ----------------
const BadcaseTab: React.FC = () => {
  const [list, setList] = useState<Badcase[]>([]);
  const [detail, setDetail] = useState<Badcase | null>(null);
  const load = async () => (await api.getBadcases().then((r) => setList(r.data)));
  useEffect(() => { void load(); }, []);

  const setStatus = async (b: Badcase, status: Badcase['status']) => {
    await api.updateBadcase(b.id, { status });
    message.success(`已标记为「${status}」`);
    await load();
  };

  return (
    <>
      <Table
        size="small"
        rowKey="id"
        dataSource={list}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: '编号', dataIndex: 'id', width: 90 },
          { title: '问题摘要', dataIndex: 'summary', ellipsis: true },
          { title: '错误类型', dataIndex: 'type', width: 110, render: (v) => <Tag color="volcano">{v}</Tag> },
          { title: '负责人', dataIndex: 'owner', width: 90 },
          { title: '状态', dataIndex: 'status', width: 100, render: (v: Badcase['status']) => <Tag color={v === '已解决' ? 'green' : v === '处理中' ? 'blue' : 'orange'}>{v}</Tag> },
          { title: '创建时间', dataIndex: 'createdAt', width: 160 },
          {
            title: '操作', width: 180,
            render: (_: unknown, r: Badcase) => (
              <Space>
                <Button size="small" type="link" onClick={() => setDetail(r)}>详情</Button>
                {r.status === '待处理' && <Button size="small" icon={<RightOutlined />} onClick={() => setStatus(r, '处理中')}>开始处理</Button>}
                {r.status === '处理中' && <Button size="small" icon={<CheckOutlined />} onClick={() => setStatus(r, '已解决')}>解决</Button>}
              </Space>
            ),
          },
        ]}
      />
      <Modal open={!!detail} title={`Badcase 详情 ${detail?.id}`} footer={null} onCancel={() => setDetail(null)}>
        {detail && (
          <>
            <p><b>问题摘要：</b>{detail.summary}</p>
            <p><b>错误类型：</b><Tag color="volcano">{detail.type}</Tag></p>
            <p><b>状态：</b><Tag color="blue">{detail.status}</Tag> <b>负责人：</b>{detail.owner}</p>
            <p><b>来源会话：</b>{detail.sessionId}（可在对话中心按标题搜索定位）</p>
            <p><b>创建时间：</b>{detail.createdAt}</p>
          </>
        )}
      </Modal>
    </>
  );
};

// ---------------- 评测任务 ----------------
const EvalTab: React.FC = () => {
  const radarOption: echarts.EChartsOption = {
    tooltip: {},
    radar: {
      indicator: [
        { name: '意图准确率', max: 100 }, { name: '实体召回率', max: 100 }, { name: '回复相关性', max: 100 },
        { name: '话术规范性', max: 100 }, { name: '响应时效', max: 100 }, { name: '用户满意度', max: 100 },
      ],
      splitArea: { areaStyle: { color: ['rgba(37,99,235,.04)', 'rgba(37,99,235,.08)'] } },
    },
    series: [{
      type: 'radar',
      data: [
        { value: [92, 85, 90, 88, 76, 94], name: '本月评测', itemStyle: { color: '#2563EB' }, areaStyle: { opacity: 0.2 } },
        { value: [88, 81, 87, 84, 72, 90], name: '上月评测', itemStyle: { color: '#0d9488' } },
      ],
    }],
    legend: { bottom: 0 },
  };
  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: '意图准确率 F1', value: '91.2%' }, { label: '实体召回率', value: '85.0%' },
          { label: '评测任务数', value: 12 }, { label: '标注覆盖率', value: '86.4%' },
        ].map((c) => (
          <Col xs={12} md={6} key={c.label}><Card size="small"><Statistic title={c.label} value={c.value} /></Card></Col>
        ))}
      </Row>
      <Table
        size="small"
        rowKey="id"
        style={{ marginBottom: 16 }}
        pagination={false}
        dataSource={[
          { id: 'e1', name: '11 月常规评测', sample: '随机抽样 500 轮', status: '进行中', accuracy: '—', created: '本月' },
          { id: 'e2', name: '10 月常规评测', sample: '随机抽样 500 轮', status: '已完成', accuracy: '91.2%', created: '上月' },
          { id: 'e3', name: 'v2.3 模型回归评测', sample: '固定集 300 轮', status: '已完成', accuracy: '93.6%', created: '上月' },
        ]}
        columns={[
          { title: '任务名称', dataIndex: 'name' },
          { title: '抽样规则', dataIndex: 'sample' },
          { title: '状态', dataIndex: 'status', render: (v) => <Tag color={v === '进行中' ? 'blue' : 'green'}>{v}</Tag> },
          { title: '综合得分', dataIndex: 'accuracy' },
          { title: '创建时间', dataIndex: 'created' },
        ]}
      />
      <ChartCard title={<span><RadarChartOutlined /> 评测得分雷达图</span>} option={radarOption} height={340} />
    </div>
  );
};

const Quality: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => { api.listSessions().then((r) => setSessions(r.data)); }, []);
  return (
    <Card size="small">
      <Tabs
        items={[
          { key: 'annotate', label: <span><AuditOutlined /> 对话标注</span>, children: <AnnotateTab sessions={sessions} /> },
          { key: 'badcase', label: <span><FlagOutlined /> Badcase 管理</span>, children: <BadcaseTab /> },
          { key: 'eval', label: '评测任务', children: <EvalTab /> },
        ]}
      />
    </Card>
  );
};

export default Quality;
