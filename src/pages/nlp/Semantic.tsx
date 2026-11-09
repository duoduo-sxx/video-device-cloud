import React, { useMemo, useState } from 'react';
import { Card, Input, Button, Tag, Progress, Space, Alert, Table, Tabs, List, Typography, Empty, Popconfirm } from 'antd';
import { SendOutlined, ClearOutlined, DownloadOutlined, ExperimentOutlined, HistoryOutlined } from '@ant-design/icons';
import * as api from '@/api';
import { useAppStore } from '@/store/app';
import type { AnalysisResult, Entity } from '@/types';

const ENTITY_COLORS: Record<Entity['type'], string> = {
  时间: '#7c3aed', 金额: '#d97706', 电话: '#0d9488', 订单号: '#2563EB', 产品: '#db2777', 地点: '#16a34a',
};

const HighlightedText: React.FC<{ text: string; entities: Entity[] }> = ({ text, entities }) => {
  const spans = useMemo(() => {
    const marks = entities
      .map((e) => ({ ...e, start: text.indexOf(e.text) }))
      .filter((e) => e.start >= 0)
      .sort((a, b) => a.start - b.start);
    const out: React.ReactNode[] = [];
    let cursor = 0;
    marks.forEach((m, i) => {
      if (m.start < cursor) return;
      if (m.start > cursor) out.push(<span key={`t${i}`}>{text.slice(cursor, m.start)}</span>);
      out.push(
        <span key={`e${i}`} style={{ borderBottom: `2px solid ${ENTITY_COLORS[m.type]}`, color: ENTITY_COLORS[m.type], fontWeight: 600 }}>
          {m.text}
          <sub style={{ fontSize: 9, marginLeft: 1 }}>{m.type}</sub>
        </span>,
      );
      cursor = m.start + m.text.length;
    });
    if (cursor < text.length) out.push(<span key="tail">{text.slice(cursor)}</span>);
    return out;
  }, [text, entities]);
  return <span>{spans}</span>;
};

const SentimentTag: React.FC<{ s: AnalysisResult }> = ({ s }) => (
  <Tag color={s.sentiment === '负面' ? 'volcano' : s.sentiment === '正面' ? 'green' : 'default'}>
    {s.sentiment} {Math.round(s.sentimentScore * 100)} 分
  </Tag>
);

const ResultCard: React.FC<{ r: AnalysisResult }> = ({ r }) => (
  <Card size="small" style={{ marginBottom: 16 }}>
    <Alert
      type={r.sensitive.length ? 'error' : 'info'}
      showIcon
      style={{ marginBottom: 12 }}
      message={r.sensitive.length ? `检测到敏感词：${r.sensitive.join('、')}` : '语义分析完成'}
      description={<Typography.Text strong style={{ fontSize: 15 }}><HighlightedText text={r.text} entities={r.entities} /></Typography.Text>}
    />
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 260px' }}>
        <Typography.Text type="secondary">意图识别（Top3）</Typography.Text>
        {r.candidates.map((c) => (
          <div key={c.name} style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>{c.name}{c.name === r.mainIntent && <Tag color="blue" style={{ marginLeft: 6 }}>主意图</Tag>}</span>
              <span>{c.confidence}%</span>
            </div>
            <Progress percent={c.confidence} showInfo={false} size="small" strokeColor={c.confidence > 70 ? '#2563EB' : '#d97706'} />
          </div>
        ))}
      </div>
      <div style={{ flex: '1 1 220px' }}>
        <Typography.Text type="secondary">情感分析</Typography.Text>
        <div style={{ marginTop: 8 }}><SentimentTag s={r} /></div>
        <Typography.Text type="secondary">关键词</Typography.Text>
        <div style={{ marginTop: 6 }}>
          {r.keywords.length ? r.keywords.map((k) => <Tag key={k}>{k}</Tag>) : <span style={{ color: '#bbb', fontSize: 12 }}>无</span>}
        </div>
        <Typography.Text type="secondary">实体抽取</Typography.Text>
        <div style={{ marginTop: 6 }}>
          {r.entities.length ? r.entities.map((e, i) => <Tag key={i} color={ENTITY_COLORS[e.type] === '#2563EB' ? 'geekblue' : 'default'}>{e.type}·{e.text}</Tag>) : <span style={{ color: '#bbb', fontSize: 12 }}>未识别到实体</span>}
        </div>
      </div>
    </div>
  </Card>
);

const Semantic: React.FC = () => {
  const pushHistory = useAppStore((s) => s.pushNlpHistory);
  const history = useAppStore((s) => s.nlpHistory);
  const clearHistory = useAppStore((s) => s.clearNlpHistory);
  const [text, setText] = useState('我上周三买的那台对话机器人设备坏了，订单号SD2026110301，我要申请退款，花的3280元什么时候能退回来？');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchRows, setBatchRows] = useState<{ key: number; text: string; intent: string; conf: number; sentiment: string }[]>([]);

  const doAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const res = await api.analyze(text);
    setLoading(false);
    setResult(res.data);
    pushHistory({ text: res.data.text.slice(0, 30), intent: res.data.mainIntent });
  };

  const doBatch = async () => {
    const lines = batchText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const rows: typeof batchRows = [];
    for (const line of lines.slice(0, 50)) {
      const r = await api.analyze(line);
      rows.push({ key: rows.length, text: line.slice(0, 40), intent: r.data.mainIntent, conf: r.data.confidence, sentiment: r.data.sentiment });
    }
    setBatchRows(rows);
  };

  const exportCsv = () => {
    const header = '文本,主意图,置信度,情感\n';
    const body = batchRows.map((r) => `"${r.text}",${r.intent},${r.conf}%,${r.sentiment}`).join('\n');
    const blob = new Blob(['\ufeff' + header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '批量语义分析结果.csv';
    a.click();
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Card size="small" title={<span><ExperimentOutlined /> 单句分析</span>} style={{ marginBottom: 16 }}>
        <Input.TextArea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入一句话，分析意图、实体、情感与敏感词…（试试：我昨天付的299元为什么还没到账）"
          showCount
          maxLength={300}
        />
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={doAnalyze}>开始分析</Button>
        </div>
      </Card>

      {result && <ResultCard r={result} />}

      <Tabs
        items={[
          {
            key: 'batch', label: <span><DownloadOutlined /> 批量分析</span>,
            children: (
              <>
                <Input.TextArea
                  rows={5}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder={'每行一句话，最多 50 行，例如：\n怎么申请退款\n这个月的账单怎么查\n你们家服务太差了'}
                />
                <Space style={{ marginTop: 12 }}>
                  <Button type="primary" onClick={doBatch}>批量分析</Button>
                  <Button icon={<DownloadOutlined />} onClick={exportCsv} disabled={batchRows.length === 0}>导出 CSV</Button>
                </Space>
                <Table
                  style={{ marginTop: 16 }}
                  size="small"
                  columns={[
                    { title: '文本', dataIndex: 'text' },
                    { title: '主意图', dataIndex: 'intent', render: (v) => <Tag color="blue">{v}</Tag> },
                    { title: '置信度', dataIndex: 'conf', render: (v) => `${v}%` },
                    { title: '情感', dataIndex: 'sentiment', render: (v) => <Tag color={v === '负面' ? 'volcano' : v === '正面' ? 'green' : 'default'}>{v}</Tag> },
                  ]}
                  dataSource={batchRows}
                  pagination={{ pageSize: 10 }}
                />
              </>
            ),
          },
          {
            key: 'history', label: <span><HistoryOutlined /> 分析历史</span>,
            children: history.length === 0 ? (
              <Empty description="暂无分析历史" />
            ) : (
              <>
                <Popconfirm title="确认清空全部历史？"><Button danger size="small" icon={<ClearOutlined />} onClick={clearHistory}>清空历史</Button></Popconfirm>
                <List
                  style={{ marginTop: 12 }}
                  size="small"
                  dataSource={history}
                  renderItem={(h) => (
                    <List.Item>
                      <span style={{ flex: 1 }}>{h.text}</span>
                      <Tag color="blue">{h.intent}</Tag>
                      <span style={{ color: '#999', fontSize: 12 }}>{h.time}</span>
                    </List.Item>
                  )}
                />
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Semantic;
