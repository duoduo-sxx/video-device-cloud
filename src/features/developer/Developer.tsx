import { useMemo, useState } from 'react';
import { App, Button, Form, Input, Modal, Progress, Select, Table, Tabs, Tag } from 'antd';
import { ApiOutlined, CopyOutlined, DeleteOutlined, KeyOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { PageHeader, Panel, StatusBadge } from '@/components/ui';
import { Chart, baseAxis, tooltipStyle } from '@/components/Chart';
import { API_KEYS } from '@/mock/seed/people';
import { apiLogs } from '@/services';
import { fmtDateTime, fmtNum, fmtRelative } from '@/utils/format';
import type { ApiCallLog, ApiKey } from '@/types';
import type { EChartsOption } from 'echarts';

const ENDPOINTS = [
  { method: 'POST', path: '/v1/asr/transcribe', desc: '提交语音转写任务', price: '0.35 元/分钟' },
  { method: 'POST', path: '/v1/subtitle/generate', desc: '生成字幕轨（SRT/VTT/ASS）', price: '0.2 元/分钟' },
  { method: 'POST', path: '/v1/translate/subtitle', desc: '字幕翻译', price: '0.8 元/分钟' },
  { method: 'POST', path: '/v1/review/scan', desc: '提交内容审核任务', price: '0.3 元/分钟' },
  { method: 'POST', path: '/v1/enhance/video', desc: '提交画质增强任务', price: '2.4 元/分钟' },
  { method: 'GET', path: '/v1/tasks/{id}', desc: '查询任务状态与产物', price: '免费' },
  { method: 'GET', path: '/v1/assets', desc: '分页查询媒体资产', price: '免费' },
  { method: 'DELETE', path: '/v1/tasks/{id}', desc: '取消任务', price: '免费' },
];

const DEMO_RESPONSE: Record<number, string> = {
  200: `{
  "code": 0,
  "message": "ok",
  "data": {
    "taskId": "tsk_20261019_8f3a",
    "status": "queued",
    "estimatedSeconds": 132,
    "billing": { "unit": "minute", "quantity": 102.6 }
  }
}`,
  401: `{
  "code": 40101,
  "message": "invalid api key",
  "data": null
}`,
  429: `{
  "code": 42900,
  "message": "rate limit exceeded: 20 QPS",
  "data": { "retryAfter": 1 }
}`,
};

const SDK = [
  { name: 'Web / JS', version: '1.8.2', size: '42 KB', updated: '2026-09-28', install: 'npm i @mediaforge/sdk' },
  { name: 'Node.js', version: '1.8.2', size: '58 KB', updated: '2026-09-28', install: 'npm i @mediaforge/node' },
  { name: 'Python', version: '1.7.0', size: '76 KB', updated: '2026-09-12', install: 'pip install mediaforge' },
  { name: 'Java', version: '1.6.4', size: '128 KB', updated: '2026-08-30', install: 'implementation mediaforge:1.6.4' },
];

export default function Developer() {
  const { message, modal } = App.useApp();
  const [tab, setTab] = useState('keys');
  const [keys, setKeys] = useState<ApiKey[]>(API_KEYS);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState(ENDPOINTS[0].path);
  const [respCode, setRespCode] = useState(200);
  const [sending, setSending] = useState(false);

  const logs = useMemo(() => apiLogs(), []);
  const successRate = ((logs.filter((l) => l.status === 200).length / logs.length) * 100).toFixed(1);

  const qpsData = Array.from({ length: 24 }, (_, i) => ({ h: `${i}:00`, qps: Math.round(4 + Math.abs(Math.sin(i / 3)) * 14), err: Math.round(Math.abs(Math.cos(i / 4)) * 1.6) }));
  const qpsOption: EChartsOption = {
    grid: { left: 42, right: 42, top: 24, bottom: 26 },
    tooltip: { trigger: 'axis', ...tooltipStyle() },
    xAxis: { type: 'category', data: qpsData.map((d) => d.h), ...baseAxis() },
    yAxis: [{ type: 'value', name: 'QPS', ...baseAxis() }, { type: 'value', name: '错误率 %', ...baseAxis(), splitLine: { show: false } }],
    series: [
      { name: 'QPS', type: 'line', smooth: true, symbol: 'none', data: qpsData.map((d) => d.qps), lineStyle: { color: '#5B6CFF', width: 2 }, areaStyle: { color: 'rgba(91,108,255,.12)' } },
      { name: '错误率', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'none', data: qpsData.map((d) => d.err), lineStyle: { color: '#F87171', width: 1.5, type: 'dashed' } },
    ],
  };

  const createKey = async () => {
    const v = await form.validateFields();
    const key = `mf_live_${Math.random().toString(16).slice(2, 6)}${Math.random().toString(16).slice(2, 6)}`;
    setKeys([
      {
        id: `key_${Date.now()}`,
        name: v.name,
        masked: `${key.slice(0, 12)}••••${key.slice(-4)}`,
        scopes: v.scopes,
        qps: v.qps,
        createdAt: new Date().toISOString(),
        lastUsed: '—',
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 86400_000).toISOString(),
      },
      ...keys,
    ]);
    setNewKey(key);
  };

  return (
    <div>
      <PageHeader
        title="API 与技术服务"
        subtitle="8 个 OpenAPI 接口 · 支持同步与异步回调 · 按分钟计费，用量实时可查"
        actions={
          <>
            <Button onClick={() => message.success('已下载 OpenAPI 3.0 描述文件')}>下载 OpenAPI</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              创建 API Key
            </Button>
          </>
        }
      />

      <div className="grid g4" style={{ marginBottom: 14 }}>
        {[
          { label: '本月调用', value: fmtNum(128460), sub: '日均 4,282 次' },
          { label: '成功率', value: `${successRate}%`, sub: '失败主要为 429 限流' },
          { label: '平均延迟', value: '486 ms', sub: 'P95 1,240 ms' },
          { label: '有效 Key', value: String(keys.filter((k) => k.status !== 'revoked').length), sub: '1 个 7 天后过期' },
        ].map((m) => (
          <div key={m.label} className="metric" style={{ cursor: 'default' }}>
            <div className="label">{m.label}</div>
            <div className="value">{m.value}</div>
            <div className="delta">{m.sub}</div>
          </div>
        ))}
      </div>

      <Panel noPad>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          style={{ padding: '0 16px' }}
          items={[
            {
              key: 'keys',
              label: 'API Key',
              children: (
                <div style={{ paddingBottom: 16 }}>
                  <Table<ApiKey>
                    rowKey="id"
                    size="middle"
                    pagination={false}
                    dataSource={keys}
                    columns={[
                      { title: '名称', dataIndex: 'name', width: 160 },
                      {
                        title: 'Key',
                        dataIndex: 'masked',
                        render: (v) => (
                          <span className="row" style={{ gap: 6 }}>
                            <span className="mono" style={{ fontSize: 11.5 }}>{v}</span>
                            <CopyOutlined className="clickable" style={{ fontSize: 11, color: 'var(--text-tertiary)' }} onClick={() => message.success('已复制（演示为掩码）')} />
                          </span>
                        ),
                      },
                      { title: '权限', dataIndex: 'scopes', render: (v: string[]) => v.map((s) => <Tag key={s} style={{ marginInlineEnd: 4 }}>{s}</Tag>) },
                      { title: 'QPS', dataIndex: 'qps', width: 70 },
                      { title: '状态', dataIndex: 'status', width: 100, render: (v) => <StatusBadge status={v} /> },
                      { title: '最后使用', dataIndex: 'lastUsed', width: 110, render: (v) => <span className="hint">{v === '—' ? '从未使用' : fmtRelative(v)}</span> },
                      {
                        title: '',
                        width: 80,
                        render: (_, k) => (
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            disabled={k.status === 'revoked'}
                            onClick={() =>
                              modal.confirm({
                                title: `吊销「${k.name}」？`,
                                content: '吊销后使用该 Key 的调用将立即返回 401，无法恢复。',
                                okText: '吊销',
                                okButtonProps: { danger: true },
                                onOk: () => {
                                  setKeys((prev) => prev.map((x) => (x.id === k.id ? { ...x, status: 'revoked' } : x)));
                                  message.success('Key 已吊销');
                                },
                              })
                            }
                          />
                        ),
                      },
                    ]}
                  />
                  <div className="hint" style={{ padding: '10px 0 0' }}>
                    <KeyOutlined /> Key 仅在创建时完整展示一次；生产环境建议按服务拆分 Key 并设置 IP 白名单。
                  </div>
                </div>
              ),
            },
            {
              key: 'logs',
              label: '调用记录',
              children: (
                <div style={{ paddingBottom: 16 }}>
                  <Chart option={qpsOption} height={190} />
                  <Table<ApiCallLog>
                    rowKey="id"
                    size="small"
                    dataSource={logs.slice(0, 40)}
                    pagination={{ pageSize: 10, size: 'small' }}
                    columns={[
                      { title: '时间', dataIndex: 'time', width: 140, render: (v) => fmtDateTime(v) },
                      {
                        title: '接口',
                        dataIndex: 'endpoint',
                        render: (v) => {
                          const [method, path] = String(v).split(' ');
                          return (
                            <span className="row" style={{ gap: 6 }}>
                              <span className="chip" style={{ color: method === 'GET' ? 'var(--success)' : 'var(--brand-hover)' }}>{method}</span>
                              <span className="mono" style={{ fontSize: 11.5 }}>{path}</span>
                            </span>
                          );
                        },
                      },
                      {
                        title: '状态码',
                        dataIndex: 'status',
                        width: 86,
                        render: (v) => <span style={{ color: v === 200 ? 'var(--success)' : 'var(--danger)' }}>{v}</span>,
                      },
                      { title: '耗时', dataIndex: 'ms', width: 86, render: (v) => `${v} ms` },
                      { title: '请求 ID', dataIndex: 'requestId', width: 160, render: (v) => <span className="mono hint" style={{ fontSize: 10.5 }}>{v}</span> },
                      { title: 'IP', dataIndex: 'ip', width: 120 },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'debug',
              label: '在线调试',
              children: (
                <div style={{ paddingBottom: 16 }} className="grid g2">
                  <div className="col" style={{ gap: 10 }}>
                    <div>
                      <div className="hint" style={{ marginBottom: 4 }}>接口</div>
                      <Select value={endpoint} onChange={setEndpoint} style={{ width: '100%' }} options={ENDPOINTS.map((e) => ({ value: e.path, label: `${e.method} ${e.path}` }))} />
                    </div>
                    <div>
                      <div className="hint" style={{ marginBottom: 4 }}>Authorization</div>
                      <Input defaultValue="Bearer mf_live_7f3a••••9c2e" />
                    </div>
                    <div>
                      <div className="hint" style={{ marginBottom: 4 }}>Body</div>
                      <Input.TextArea
                        rows={8}
                        className="mono"
                        defaultValue={`{\n  "assetId": "ast_0012",\n  "language": "zh",\n  "speakerDiarization": true,\n  "hotwords": ["端侧大模型", "多模态"]\n}`}
                      />
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        loading={sending}
                        onClick={() => {
                          setSending(true);
                          setTimeout(() => {
                            setSending(false);
                            setRespCode(200);
                          }, 700);
                        }}
                      >
                        发送请求
                      </Button>
                      <Select value={respCode} onChange={setRespCode} style={{ width: 150 }} options={[{ value: 200, label: '200 成功' }, { value: 401, label: '401 鉴权失败' }, { value: 429, label: '429 限流' }]} />
                    </div>
                  </div>
                  <div>
                    <div className="hint" style={{ marginBottom: 4 }}>响应</div>
                    <pre className="mono" style={{ margin: 0, background: '#080a10', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 11.5, lineHeight: 1.7, color: '#9AA7BD', minHeight: 300 }}>
                      {DEMO_RESPONSE[respCode]}
                    </pre>
                    <div className="row" style={{ gap: 10, marginTop: 8, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      <span>状态 <b style={{ color: respCode === 200 ? 'var(--success)' : 'var(--danger)' }}>{respCode}</b></span>
                      <span>耗时 486 ms</span>
                      <span>请求 ID req_8f3a21c4</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'docs',
              label: '接口文档',
              children: (
                <div style={{ paddingBottom: 16 }}>
                  <div className="hint" style={{ marginBottom: 12 }}>
                    鉴权方式：请求头携带 <span className="mono">Authorization: Bearer &lt;API_KEY&gt;</span>，所有接口返回统一结构 {'{ code, message, data }'}。
                  </div>
                  <div className="col" style={{ gap: 8 }}>
                    {ENDPOINTS.map((e) => (
                      <div key={e.path} className="row between" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px' }}>
                        <div className="row" style={{ gap: 10 }}>
                          <span className="chip" style={{ color: e.method === 'GET' ? 'var(--success)' : e.method === 'DELETE' ? 'var(--danger)' : 'var(--brand-hover)' }}>{e.method}</span>
                          <span className="mono" style={{ fontSize: 12 }}>{e.path}</span>
                          <span className="hint">{e.desc}</span>
                        </div>
                        <span className="hint">{e.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="divider" />
                  <div className="hint" style={{ marginBottom: 8 }}>错误码</div>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {['40101 鉴权失败', '40301 无权限', '41002 参数错误', '42900 限流', '50003 内部错误'].map((c) => (
                      <span key={c} className="chip">{c}</span>
                    ))}
                  </div>
                  <div className="divider" />
                  <pre className="mono" style={{ margin: 0, background: '#080a10', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 11.5, lineHeight: 1.7, color: '#9AA7BD' }}>
{`curl -X POST https://api.mediaforge.cn/v1/asr/transcribe \\
  -H "Authorization: Bearer $MF_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"assetId":"ast_0012","language":"zh"}'`}
                  </pre>
                </div>
              ),
            },
            {
              key: 'sdk',
              label: 'SDK',
              children: (
                <div className="grid g4" style={{ gap: 12, paddingBottom: 20 }}>
                  {SDK.map((s) => (
                    <div key={s.name} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                      <div className="row between">
                        <span style={{ fontSize: 13 }}>{s.name}</span>
                        <Tag style={{ marginInlineEnd: 0, fontSize: 10 }}>v{s.version}</Tag>
                      </div>
                      <div className="hint" style={{ margin: '6px 0' }}>{s.size} · 更新于 {s.updated}</div>
                      <div className="mono" style={{ fontSize: 10.5, background: 'var(--bg-elevated)', padding: '5px 7px', borderRadius: 5, marginBottom: 8, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                        {s.install}
                      </div>
                      <Button size="small" block onClick={() => message.success('已复制安装命令')}>
                        复制命令
                      </Button>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Panel>

      <Modal
        title="创建 API Key"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          setNewKey(null);
        }}
        footer={
          newKey ? (
            <Button type="primary" onClick={() => { setCreateOpen(false); setNewKey(null); form.resetFields(); }}>
              我已保存
            </Button>
          ) : (
            <>
              <Button onClick={() => setCreateOpen(false)}>取消</Button>
              <Button type="primary" onClick={createKey}>
                创建
              </Button>
            </>
          )
        }
      >
        {newKey ? (
          <div>
            <div className="hint" style={{ marginBottom: 8 }}>请立即复制并妥善保存，此 Key 只展示一次。</div>
            <div className="mono" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: 10, fontSize: 12, wordBreak: 'break-all' }}>
              {newKey}
            </div>
            <Button size="small" icon={<CopyOutlined />} style={{ marginTop: 10 }} onClick={() => message.success('已复制到剪贴板')}>
              复制 Key
            </Button>
          </div>
        ) : (
          <Form form={form} layout="vertical" initialValues={{ scopes: ['转写', '字幕'], qps: 10 }}>
            <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入 Key 名称' }]}>
              <Input placeholder="例：内容中台-生产" />
            </Form.Item>
            <Form.Item name="scopes" label="权限范围">
              <Select mode="multiple" options={['转写', '字幕', '翻译', '配音', '审核', '增强', '查询'].map((s) => ({ value: s, label: s }))} />
            </Form.Item>
            <Form.Item name="qps" label="限流 QPS">
              <Select options={[5, 10, 20, 50].map((n) => ({ value: n, label: `${n} QPS` }))} />
            </Form.Item>
            <Form.Item name="ip" label="IP 白名单（可选）" extra="留空表示不限制来源 IP">
              <Input placeholder="10.24.8.0/24" />
            </Form.Item>
            <div className="hint">创建后可在表格中查看状态与最后使用时间。</div>
          </Form>
        )}
      </Modal>
    </div>
  );
}
