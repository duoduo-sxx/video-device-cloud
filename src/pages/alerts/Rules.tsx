import { useState } from 'react';
import { Button, Drawer, Form, Input, InputNumber, Select, Switch, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader, StatusTag } from '../../components/base';
import AuthGuard from '../../components/AuthGuard';
import { useDataStore } from '../../store/dataStore';
import { ALERT_LEVEL } from '../../constants/dict';
import type { AlertRule } from '../../types';
import { fmtShortTime } from '../../utils/format';

export default function AlertRules() {
  const rules = useDataStore((s) => s.rules);
  const toggleRule = useDataStore((s) => s.toggleRule);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [rows, setRows] = useState<AlertRule[]>(rules);

  return (
    <div>
      <PageHeader
        title="告警规则"
        desc="定义监控对象、阈值、持续时间与通知渠道"
        actions={
          <AuthGuard>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setOpen(true);
              }}
            >
              新建规则
            </Button>
          </AuthGuard>
        }
      />

      <div className="cf-card" style={{ padding: 16 }}>
        <div className="table-stat-bar">
          <span>共 <b>{rows.length}</b> 条规则</span>
          <span>启用 <b className="success-text">{rows.filter((r) => r.enabled).length}</b></span>
          <span>停用 <b>{rows.filter((r) => !r.enabled).length}</b></span>
          <span>覆盖对象：节点 / 链路 / 任务 / 系统</span>
        </div>

        <Table
          className="cf-table"
          rowKey="id"
          size="middle"
          dataSource={rows}
          pagination={false}
          columns={[
            { title: '规则名称', dataIndex: 'name', width: 220 },
            { title: '监控对象', dataIndex: 'targetType', width: 100 },
            { title: '指标', dataIndex: 'metric', width: 140 },
            {
              title: '条件',
              key: 'condition',
              width: 180,
              render: (_, r) => (
                <span style={{ fontSize: 13 }}>
                  {r.metric} {r.operator} <b>{r.threshold}</b>
                </span>
              ),
            },
            { title: '持续时间', dataIndex: 'duration', width: 120 },
            {
              title: '级别',
              dataIndex: 'level',
              width: 80,
              render: (v: AlertRule['level']) => <StatusTag {...ALERT_LEVEL[v]} dot={false} />,
            },
            {
              title: '通知渠道',
              dataIndex: 'channels',
              width: 180,
              render: (v: string[]) => (
                <>
                  {v.map((c) => (
                    <Tag key={c} bordered={false} style={{ marginBottom: 2 }}>
                      {c}
                    </Tag>
                  ))}
                </>
              ),
            },
            {
              title: '启用',
              dataIndex: 'enabled',
              width: 80,
              render: (v: boolean, r) => (
                <Switch
                  size="small"
                  checked={v}
                  onChange={(checked) => {
                    toggleRule(r.id, checked);
                    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, enabled: checked } : x)));
                    message.success(`规则已${checked ? '启用' : '停用'}`);
                  }}
                />
              ),
            },
            {
              title: '更新时间',
              dataIndex: 'updatedAt',
              width: 120,
              render: (v: string) => <span className="muted">{fmtShortTime(v)}</span>,
            },
            {
              title: '操作',
              key: 'action',
              width: 120,
              fixed: 'right',
              render: (_, r) => (
                <AuthGuard>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      form.setFieldsValue(r);
                      setOpen(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => {
                      setRows((prev) => prev.filter((x) => x.id !== r.id));
                      message.success('规则已删除');
                    }}
                  >
                    删除
                  </Button>
                </AuthGuard>
              ),
            },
          ]}
        />
      </div>

      <Drawer
        open={open}
        width={560}
        title="告警规则配置"
        onClose={() => setOpen(false)}
        extra={
          <Button
            type="primary"
            onClick={async () => {
              const v = await form.validateFields();
              message.success('规则已保存并生效');
              setOpen(false);
              setRows((prev) => [
                {
                  id: `RULE-${String(100 + prev.length)}`,
                  name: v.name,
                  targetType: v.targetType,
                  metric: v.metric,
                  operator: v.operator,
                  threshold: `${v.threshold} %`,
                  duration: v.duration,
                  level: v.level,
                  channels: v.channels,
                  enabled: true,
                  updatedAt: new Date().toISOString(),
                },
                ...prev,
              ]);
            }}
          >
            保存
          </Button>
        }
      >
        <Form form={form} layout="vertical" initialValues={{ targetType: '链路', operator: '>', duration: '连续 3 分钟', level: 'P2', channels: ['邮件'] }}>
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="如：链路丢包率超阈值" />
          </Form.Item>
          <Form.Item name="targetType" label="监控对象">
            <Select options={['链路', '节点', '任务', '系统'].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="metric" label="监控指标" rules={[{ required: true, message: '请选择指标' }]}>
            <Select
              options={['丢包率', '连通性', '心跳', '磁盘使用率', 'CPU 使用率', '内存使用率', '校验失败率', '传输速率', '排队任务数', '证书剩余有效期'].map((v) => ({ value: v, label: v }))}
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
            <Form.Item name="operator" label="运算符">
              <Select options={['>', '>=', '<', '<=', '='].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item name="threshold" label="阈值（%）" rules={[{ required: true, message: '请输入阈值' }]}>
              <InputNumber min={0} max={100000} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="duration" label="持续时间">
            <Select options={['立即', '连续 1 分钟', '连续 3 分钟', '连续 5 分钟', '连续 10 分钟'].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="level" label="告警级别">
            <Select options={['P0', 'P1', 'P2', 'P3'].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="channels" label="通知渠道">
            <Select mode="multiple" options={['邮件', '短信', 'Webhook', '企业微信'].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="静默时间段">
            <Select allowClear placeholder="可选，如 02:00-06:00 变更窗口" options={[{ value: 'night', label: '02:00 - 06:00' }]} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
