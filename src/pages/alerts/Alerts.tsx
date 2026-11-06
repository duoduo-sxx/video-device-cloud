import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertOutlined, CheckOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { LevelTag } from '../../components/StatusTag';
import EmptyState from '../../components/EmptyState';
import { alertService } from '../../services';
import type { Alert, AlertRule, AlertStatus } from '../../types';
import { formatRelative } from '../../utils/format';
import { toast } from '../../utils/feedback';
import { useAuthStore } from '../../store/useAuthStore';

const STATUS_META: Record<AlertStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#EF4444' },
  processing: { label: '处理中', color: '#1668FF' },
  resolved: { label: '已恢复', color: '#00B894' },
};

export default function Alerts() {
  const { name } = useAuthStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<AlertStatus | undefined>();
  const [detail, setDetail] = useState<Alert | undefined>();
  const [ruleOpen, setRuleOpen] = useState(false);
  const [silenceFor, setSilenceFor] = useState<Alert | undefined>();
  const [silenceHours, setSilenceHours] = useState(1);
  const [form] = Form.useForm();

  const load = async () => {
    const [a, r] = await Promise.all([alertService.list(), alertService.rules()]);
    setAlerts(a);
    setRules(r);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(
    () => ({
      critical: alerts.filter((a) => a.level === 'critical' && a.status !== 'resolved').length,
      warning: alerts.filter((a) => a.level === 'warning' && a.status !== 'resolved').length,
      info: alerts.filter((a) => a.level === 'info' && a.status !== 'resolved').length,
    }),
    [alerts],
  );

  const filtered = useMemo(
    () =>
      alerts.filter((a) => {
        if (levelFilter && a.level !== levelFilter) return false;
        if (statusFilter && a.status !== statusFilter) return false;
        return true;
      }),
    [alerts, levelFilter, statusFilter],
  );

  const act = async (alert: Alert, kind: 'claim' | 'resolve') => {
    if (kind === 'claim') {
      await alertService.claim(alert.id, name);
      toast.success('已认领该告警');
    } else {
      await alertService.resolve(alert.id);
      toast.success('已标记为恢复');
    }
    await load();
    setDetail(undefined);
  };

  const columns: ColumnsType<Alert> = [
    { title: '级别', dataIndex: 'level', width: 84, render: (v) => <LevelTag level={v} /> },
    {
      title: '告警标题',
      dataIndex: 'title',
      render: (v, r) => (
        <div className="stack">
          <span className="link" style={{ fontSize: 13 }} onClick={() => setDetail(r)}>
            {v}
          </span>
          <span className="mono" style={{ fontSize: 11, color: '#8A99B0' }}>{r.id}</span>
        </div>
      ),
    },
    { title: '告警对象', dataIndex: 'target', width: 230, render: (v) => <span style={{ fontSize: 12.5 }}>{v}</span> },
    { title: '当前值 / 阈值', key: 'value', width: 150, render: (_, r) => <span className="num" style={{ fontSize: 12.5 }}>{r.value} <span style={{ color: '#B0BCCD' }}>/ {r.threshold}</span></span> },
    { title: '触发时间', dataIndex: 'triggeredAt', width: 120, render: (v) => <span style={{ fontSize: 12 }}>{formatRelative(v)}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: AlertStatus, r) => (
        <Tag style={{ color: STATUS_META[v].color, background: `${STATUS_META[v].color}14`, borderColor: `${STATUS_META[v].color}33`, marginInlineEnd: 0 }}>
          {r.silenced && v !== 'resolved' ? '已静默' : STATUS_META[v].label}
        </Tag>
      ),
    },
    { title: '处理人', dataIndex: 'assignee', width: 90, render: (v) => v ?? <span style={{ color: '#B0BCCD' }}>—</span> },
    {
      title: '操作',
      key: 'act',
      width: 160,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 10 }}>
          {r.status === 'pending' ? (
            <span className="link" style={{ fontSize: 12.5 }} onClick={() => act(r, 'claim')}>
              认领
            </span>
          ) : null}
          {r.status !== 'resolved' ? (
            <>
              <span
                className="link"
                style={{ fontSize: 12.5, color: '#8A99B0' }}
                onClick={() => {
                  setSilenceFor(r);
                  setSilenceHours(1);
                }}
              >
                静默
              </span>
              <span className="link" style={{ fontSize: 12.5 }} onClick={() => act(r, 'resolve')}>
                恢复
              </span>
            </>
          ) : (
            <span style={{ fontSize: 12, color: '#B0BCCD' }}>已关闭</span>
          )}
        </div>
      ),
    },
  ];

  const ruleColumns: ColumnsType<AlertRule> = [
    { title: '规则名称', dataIndex: 'name' },
    { title: '监控指标', dataIndex: 'metric', width: 150, render: (v) => <span className="mono" style={{ fontSize: 12 }}>{v}</span> },
    { title: '触发条件', key: 'cond', width: 190, render: (_, r) => <span style={{ fontSize: 12.5 }}>{r.operator} {r.threshold} · {r.duration}</span> },
    { title: '级别', dataIndex: 'level', width: 84, render: (v) => <LevelTag level={v} /> },
    { title: '通知渠道', dataIndex: 'channels', width: 180, render: (v: string[]) => v.map((c) => <Tag key={c} style={{ marginInlineEnd: 4, fontSize: 10.5 }}>{c}</Tag>) },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 80,
      render: (v: boolean, r) => (
        <Switch
          size="small"
          checked={v}
          onChange={async () => {
            await alertService.toggleRule(r.id);
            await load();
            toast.success('规则状态已更新');
          }}
        />
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="告警中心"
        description="统一收敛通道、节点与任务异常，按级别分级处置，支持认领、静默与自动恢复"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRuleOpen(true)}>
            新建规则
          </Button>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard title="严重告警" value={String(counts.critical)} unit="条" deltaLabel="需 30 分钟内响应" icon={<AlertOutlined />} iconColor="#EF4444" iconBg="#FDECEC" />
        <StatCard title="警告告警" value={String(counts.warning)} unit="条" deltaLabel="建议当日处理" icon={<AlertOutlined />} iconColor="#F59E0B" iconBg="#FFF6E6" />
        <StatCard title="提示告警" value={String(counts.info)} unit="条" deltaLabel="观察即可" icon={<AlertOutlined />} iconColor="#1668FF" iconBg="#EAF1FF" />
        <StatCard title="今日已恢复" value={String(alerts.filter((a) => a.status === 'resolved').length)} unit="条" deltaLabel="自动恢复占比 62%" icon={<CheckOutlined />} iconColor="#00B894" iconBg="#E6F8F3" />
      </div>

      <div className="panel flush">
        <Tabs
          style={{ padding: '8px 20px 0' }}
          items={[
            {
              key: 'list',
              label: '告警列表',
              children: (
                <div>
                  <div className="toolbar" style={{ padding: '4px 20px 14px' }}>
                    <Select
                      allowClear
                      placeholder="级别"
                      style={{ width: 110 }}
                      value={levelFilter}
                      onChange={setLevelFilter}
                      options={[
                        { value: 'critical', label: '严重' },
                        { value: 'warning', label: '警告' },
                        { value: 'info', label: '提示' },
                      ]}
                    />
                    <Select
                      allowClear
                      placeholder="状态"
                      style={{ width: 120 }}
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={[
                        { value: 'pending', label: '待处理' },
                        { value: 'processing', label: '处理中' },
                        { value: 'resolved', label: '已恢复' },
                      ]}
                    />
                    <span style={{ fontSize: 12.5, color: '#8A99B0' }}>共 {filtered.length} 条告警</span>
                  </div>
                  <Table<Alert>
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={filtered}
                    pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                    locale={{ emptyText: <EmptyState title="暂无告警" description="当前筛选条件下没有告警记录" /> }}
                  />
                </div>
              ),
            },
            {
              key: 'rules',
              label: `告警规则（${rules.length}）`,
              children: (
                <div style={{ paddingBottom: 12 }}>
                  <Table<AlertRule>
                    rowKey="id"
                    size="middle"
                    loading={loading}
                    columns={ruleColumns}
                    dataSource={rules}
                    pagination={false}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      <Drawer
        title={detail ? `告警详情 · ${detail.id}` : ''}
        open={!!detail}
        onClose={() => setDetail(undefined)}
        width={520}
        extra={
          detail && detail.status !== 'resolved' ? (
            <Button size="small" type="primary" onClick={() => act(detail, 'resolve')}>
              标记恢复
            </Button>
          ) : null
        }
      >
        {detail ? (
          <>
            <div style={{ marginBottom: 14 }}>
              <LevelTag level={detail.level} />
              <span style={{ marginLeft: 8, fontSize: 15, fontWeight: 600 }}>{detail.title}</span>
            </div>
            <Descriptions column={1} size="small" labelStyle={{ color: '#8A99B0', width: 90 }}>
              <Descriptions.Item label="告警对象">{detail.target}</Descriptions.Item>
              <Descriptions.Item label="触发规则">{detail.ruleId}</Descriptions.Item>
              <Descriptions.Item label="当前值">{detail.value}</Descriptions.Item>
              <Descriptions.Item label="阈值">{detail.threshold}</Descriptions.Item>
              <Descriptions.Item label="首次触发">{new Date(detail.triggeredAt).toLocaleString('zh-CN', { hour12: false })}</Descriptions.Item>
              <Descriptions.Item label="持续时长">{detail.durationMin} 分钟</Descriptions.Item>
              <Descriptions.Item label="处理人">{detail.assignee ?? '未认领'}</Descriptions.Item>
            </Descriptions>

            <div className="section-title" style={{ marginTop: 20 }}>
              告警说明
            </div>
            <div style={{ fontSize: 12.5, color: '#5A6B87', lineHeight: 1.9 }}>{detail.description}</div>

            <div className="section-title" style={{ marginTop: 20 }}>
              处理时间线
            </div>
            <div style={{ fontSize: 12.5, color: '#5A6B87', lineHeight: 2.1 }}>
              <div>
                <span className="dot" style={{ background: '#EF4444', marginRight: 8 }} />
                {formatRelative(detail.triggeredAt)} 触发告警
              </div>
              {detail.assignee ? (
                <div>
                  <span className="dot" style={{ background: '#1668FF', marginRight: 8 }} />
                  由 {detail.assignee} 认领并开始排查
                </div>
              ) : null}
              {detail.status === 'resolved' ? (
                <div>
                  <span className="dot" style={{ background: '#00B894', marginRight: 8 }} />
                  指标回落，告警自动关闭
                </div>
              ) : (
                <div>
                  <span className="dot" style={{ background: '#D5DEEC', marginRight: 8 }} />
                  等待恢复
                </div>
              )}
            </div>
          </>
        ) : null}
      </Drawer>

      <Modal
        title={`静默告警 ${silenceFor?.id ?? ''}`}
        open={!!silenceFor}
        onCancel={() => setSilenceFor(undefined)}
        onOk={async () => {
          if (silenceFor) {
            await alertService.silence(silenceFor.id, silenceHours);
            await load();
            toast.success(`已静默 ${silenceHours} 小时`);
          }
          setSilenceFor(undefined);
        }}
        okText="确认静默"
        width={420}
      >
        <div style={{ fontSize: 12.5, color: '#5A6B87', margin: '12px 0' }}>静默期间不再发送通知，但告警记录仍会保留。</div>
        <Radio.Group value={silenceHours} onChange={(e) => setSilenceHours(e.target.value)}>
          <Radio.Button value={1}>1 小时</Radio.Button>
          <Radio.Button value={4}>4 小时</Radio.Button>
          <Radio.Button value={24}>24 小时</Radio.Button>
        </Radio.Group>
      </Modal>

      <Drawer title="新建告警规则" open={ruleOpen} onClose={() => setRuleOpen(false)} width={480}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ operator: '>', level: 'warning', duration: '5', channels: ['站内信'], enabled: true }}
          onFinish={async (values) => {
            const next: AlertRule = {
              id: `RULE-0${rules.length + 1}`,
              name: values.name,
              metric: values.metric,
              operator: values.operator,
              threshold: values.threshold,
              duration: `持续 ${values.duration} 分钟`,
              level: values.level,
              channels: values.channels,
              enabled: values.enabled,
            };
            setRules([...rules, next]);
            setRuleOpen(false);
            form.resetFields();
            toast.success('告警规则已创建');
          }}
        >
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="例如：通道丢包率告警" />
          </Form.Item>
          <Form.Item name="metric" label="监控指标" rules={[{ required: true, message: '请选择监控指标' }]}>
            <Select
              options={[
                { value: 'packetLoss', label: '通道丢包率' },
                { value: 'bandwidth', label: '带宽水位' },
                { value: 'latency', label: '链路延迟' },
                { value: 'diskUsage', label: '节点磁盘使用率' },
                { value: 'taskFailure', label: '任务连续失败次数' },
              ]}
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
            <Form.Item name="operator" label="比较符">
              <Select options={['>', '>=', '<', '<='].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item name="threshold" label="阈值" rules={[{ required: true, message: '请输入阈值' }]}>
              <Input placeholder="例如 1.0%" />
            </Form.Item>
          </div>
          <Form.Item name="duration" label="持续时长（分钟）">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="level" label="告警级别">
            <Radio.Group>
              <Radio value="critical">严重</Radio>
              <Radio value="warning">警告</Radio>
              <Radio value="info">提示</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="channels" label="通知渠道">
            <Select mode="multiple" options={[{ value: '站内信' }, { value: '邮件' }, { value: 'Webhook' }]} />
          </Form.Item>
          <Form.Item name="enabled" label="立即启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            创建规则
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}
