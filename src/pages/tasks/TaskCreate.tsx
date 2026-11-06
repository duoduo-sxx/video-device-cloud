import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Steps,
  Switch,
  Tag,
} from 'antd';
import {
  CheckCircleFilled,
  CloudServerOutlined,
  DatabaseOutlined,
  FolderOutlined,
  HddOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import { CHANNELS, NODES, POLICIES } from '../../mock/base';
import { WORKSPACES as SPACES } from '../../mock/workspaces';
import { taskService } from '../../services';
import type { Priority, TransferTask } from '../../types';
import { formatBytes } from '../../utils/format';
import { toast } from '../../utils/feedback';

const SOURCE_TYPES = [
  { value: 'object', label: '对象存储', desc: 'S3 / OSS / COS', icon: <CloudServerOutlined /> },
  { value: 'db', label: '关系数据库', desc: 'MySQL / PostgreSQL', icon: <DatabaseOutlined /> },
  { value: 'fs', label: '文件系统', desc: 'NFS / 本地目录', icon: <FolderOutlined /> },
  { value: 'edge', label: '边缘节点', desc: '采集网关回传', icon: <HddOutlined /> },
];

export default function TaskCreate() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [sourceType, setSourceType] = useState('object');
  const [policyId, setPolicyId] = useState('PL-02');
  const [schedule, setSchedule] = useState<'immediate' | 'scheduled' | 'cron'>('immediate');
  const [submitting, setSubmitting] = useState(false);

  const policy = useMemo(() => POLICIES.find((p) => p.id === policyId)!, [policyId]);

  const nodeOptions = NODES.map((n) => ({
    value: n.id,
    label: `${n.name} · ${n.region} · ${n.online ? '在线' : '离线'}`,
    disabled: !n.online,
  }));

  const next = async () => {
    const fields =
      step === 0
        ? ['name']
        : ['sourceNodeId', 'sourcePath', 'targetNodeId', 'targetPath'];
    try {
      await form.validateFields(fields);
      const values = form.getFieldsValue();
      if (step === 1 && values.sourceNodeId === values.targetNodeId && values.sourcePath === values.targetPath) {
        toast.error('源与目标不能是同一节点的同一路径');
        return;
      }
      setStep(step + 1);
    } catch {
      /* 校验失败，错误已展示 */
    }
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const src = NODES.find((n) => n.id === values.sourceNodeId)!;
      const dst = NODES.find((n) => n.id === values.targetNodeId)!;
      const channel =
        CHANNELS.find((c) => c.sourceNodeId === src.id && c.targetNodeId === dst.id) ??
        CHANNELS.find((c) => c.sourceNodeId === src.id) ??
        CHANNELS[0];
      const payload: Partial<TransferTask> = {
        name: values.name,
        priority: values.priority as Priority,
        workspaceId: values.workspaceId,
        tags: values.tags ?? ['常规'],
        totalSize: 128 * 1024 ** 3,
        source: {
          nodeId: src.id,
          nodeName: src.name,
          region: src.region,
          protocol: channel.protocol,
          path: values.sourcePath,
        },
        target: {
          nodeId: dst.id,
          nodeName: dst.name,
          region: dst.region,
          protocol: channel.protocol,
          path: values.targetPath,
        },
        channelId: channel.id,
        channelName: channel.name,
        policyId: policy.id,
        policyName: policy.name,
        checksum: policy.checksum,
        schedule,
      };
      const task = await taskService.create(payload);
      toast.success('任务已创建并进入调度队列');
      navigate(`/tasks/${task.id}`);
    } catch {
      toast.error('请先补全必填信息');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 1120 }}>
      <PageHeader
        title="新建传输任务"
        description="三步完成配置：基本信息 → 数据与路径 → 优化策略与调度"
        extra={<Button onClick={() => navigate('/tasks')}>返回列表</Button>}
      />

      <div className="panel" style={{ marginBottom: 16, padding: '18px 24px' }}>
        <Steps
          current={step}
          items={[
            { title: '基本信息', description: '名称与归属' },
            { title: '数据与路径', description: '源与目标' },
            { title: '策略与调度', description: '优化参数' },
          ]}
        />
      </div>

      <div className="panel">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: '',
            priority: 'medium',
            sourceNodeId: 'ND-hz-01',
            sourcePath: 's3://prod-datalake/orders/',
            targetNodeId: 'ND-sg-01',
            targetPath: 's3://sg-archive/orders/',
            incremental: true,
          }}
        >
          {step === 0 ? (
            <>
              <div className="section-title">任务信息</div>
              <Row gutter={20}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="任务名称"
                    rules={[
                      { required: true, message: '请输入任务名称' },
                      { min: 2, max: 50, message: '名称长度需在 2-50 字之间' },
                    ]}
                  >
                    <Input placeholder="例如：华东1-新加坡 订单库增量同步" maxLength={50} showCount />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="priority" label="优先级">
                    <Radio.Group optionType="button" buttonStyle="solid">
                      <Radio.Button value="high">高</Radio.Button>
                      <Radio.Button value="medium">中</Radio.Button>
                      <Radio.Button value="low">低</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="workspaceId" label="所属协同空间">
                    <Select
                      allowClear
                      placeholder="不归属任何空间"
                      options={SPACES.map((w) => ({ value: w.id, label: `${w.name}（${w.id}）` }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="tags" label="标签" initialValue={['常规']}>
                    <Select mode="tags" placeholder="输入后回车创建标签" options={[
                      { value: '核心业务' }, { value: 'T+1' }, { value: '研发' }, { value: '合规' }, { value: '归档' },
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="description" label="任务描述">
                    <Input.TextArea rows={3} maxLength={200} showCount placeholder="补充说明该任务的业务背景、上下游依赖或注意事项" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="section-title">源数据类型</div>
              <div className="grid grid-4" style={{ marginBottom: 22 }}>
                {SOURCE_TYPES.map((t) => (
                  <div
                    key={t.value}
                    onClick={() => setSourceType(t.value)}
                    style={{
                      border: `1px solid ${sourceType === t.value ? '#1668FF' : '#E9EEF6'}`,
                      background: sourceType === t.value ? '#F5F9FF' : '#fff',
                      borderRadius: 10,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: sourceType === t.value ? '#1668FF' : '#5A6B87', fontSize: 16 }}>
                        {t.icon}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</span>
                      {sourceType === t.value ? <CheckCircleFilled style={{ marginLeft: 'auto', color: '#1668FF' }} /> : null}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 4 }}>{t.desc}</div>
                  </div>
                ))}
              </div>

              <div className="section-title">源与目标</div>
              <Row gutter={20}>
                <Col span={12}>
                  <Form.Item name="sourceNodeId" label="源节点" rules={[{ required: true, message: '请选择源节点' }]}>
                    <Select options={nodeOptions} showSearch optionFilterProp="label" />
                  </Form.Item>
                  <Form.Item
                    name="sourcePath"
                    label="源路径"
                    rules={[{ required: true, message: '请输入源路径' }]}
                    extra="支持通配符 *，目录需以 / 结尾"
                  >
                    <Input placeholder="s3://prod-datalake/orders/" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="targetNodeId" label="目标节点" rules={[{ required: true, message: '请选择目标节点' }]}>
                    <Select options={nodeOptions} showSearch optionFilterProp="label" />
                  </Form.Item>
                  <Form.Item
                    name="targetPath"
                    label="目标路径"
                    rules={[{ required: true, message: '请输入目标路径' }]}
                    extra="目标路径已存在同名文件时默认覆盖"
                  >
                    <Input placeholder="s3://sg-archive/orders/" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="incremental" label="增量传输" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="watermark" label="增量水位字段">
                    <Input placeholder="updated_at" disabled={!form.getFieldValue('incremental')} />
                  </Form.Item>
                </Col>
              </Row>

              <Collapse
                ghost
                items={[
                  {
                    key: 'filters',
                    label: <span style={{ fontSize: 13, color: '#5A6B87' }}>过滤规则（可选）</span>,
                    children: (
                      <Row gutter={20}>
                        <Col span={8}>
                          <Form.Item name="minSize" label="最小文件大小">
                            <InputNumber min={0} addonAfter="MB" style={{ width: '100%' }} placeholder="0" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="maxSize" label="最大文件大小">
                            <InputNumber min={0} addonAfter="GB" style={{ width: '100%' }} placeholder="不限制" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="suffix" label="包含后缀">
                            <Select mode="tags" placeholder=".parquet / .csv" options={[
                              { value: '.parquet' }, { value: '.csv' }, { value: '.jsonl' }, { value: '.tar.gz' },
                            ]} />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item name="exclude" label="排除路径">
                            <Select mode="tags" placeholder="输入通配符路径后回车，例如 /_SUCCESS 或 /tmp/*" />
                          </Form.Item>
                        </Col>
                      </Row>
                    ),
                  },
                ]}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="section-title">优化策略</div>
              <div className="grid grid-2" style={{ marginBottom: 20 }}>
                {POLICIES.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setPolicyId(p.id)}
                    style={{
                      border: `1px solid ${policyId === p.id ? '#1668FF' : '#E9EEF6'}`,
                      background: policyId === p.id ? '#F5F9FF' : '#fff',
                      borderRadius: 10,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    <div className="flex-between">
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</span>
                      {policyId === p.id ? <CheckCircleFilled style={{ color: '#1668FF' }} /> : <Tag style={{ marginInlineEnd: 0, fontSize: 10.5 }}>{p.scene}</Tag>}
                    </div>
                    <div className="policy-param" style={{ marginTop: 6 }}>
                      {p.compression} · {p.dedup === 'block' ? '块级去重' : p.dedup === 'file' ? '文件级去重' : '无去重'} · {p.chunkSizeMB}MB 分片 · {p.concurrency} 并发
                    </div>
                    <div style={{ fontSize: 11.5, color: '#00B894', marginTop: 4 }}>预估节省 {p.savingPercent}% 流量</div>
                  </div>
                ))}
              </div>

              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 22 }}
                message={`已选策略：${policy.name}`}
                description={`压缩 ${policy.compression}（级别 ${policy.level}） · 分片 ${policy.chunkSizeMB}MB · 并发 ${policy.concurrency} · 断点续传${policy.resume ? '开启' : '关闭'} · 校验 ${policy.checksum}`}
              />

              <div className="section-title">调度方式</div>
              <Radio.Group value={schedule} onChange={(e) => setSchedule(e.target.value)} style={{ marginBottom: 16 }}>
                <Radio value="immediate">立即执行</Radio>
                <Radio value="scheduled">定时执行</Radio>
                <Radio value="cron">周期执行</Radio>
              </Radio.Group>
              {schedule === 'scheduled' ? (
                <div style={{ maxWidth: 320, marginBottom: 8 }}>
                  <Input type="datetime-local" defaultValue="2026-10-20T02:00" />
                </div>
              ) : null}
              {schedule === 'cron' ? (
                <div style={{ maxWidth: 480, marginBottom: 8 }}>
                  <Input defaultValue="0 2 * * *" addonBefore="Cron" addonAfter="每天 02:00 执行" />
                </div>
              ) : null}

              <Divider style={{ margin: '20px 0' }} />

              <div className="section-title">完成后通知</div>
              <Select
                mode="multiple"
                defaultValue={['站内信']}
                style={{ maxWidth: 420 }}
                options={[{ value: '站内信' }, { value: '邮件' }, { value: 'Webhook' }]}
              />

              <div className="step-summary" style={{ marginTop: 24 }}>
                <div className="flex-between">
                  <span>预计传输数据量</span>
                  <b>{formatBytes(128 * 1024 ** 3)}</b>
                </div>
                <div className="flex-between">
                  <span>策略预估加速比</span>
                  <b style={{ color: '#00B894' }}>{((policy.concurrency / 4) * (policy.chunkSizeMB >= 64 ? 1.15 : 1)).toFixed(1)}x</b>
                </div>
                <div className="flex-between">
                  <span>预计节省流量</span>
                  <b>{policy.savingPercent}%（约 {formatBytes(128 * 1024 ** 3 * (policy.savingPercent / 100))}）</b>
                </div>
              </div>
            </>
          ) : null}
        </Form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid #EEF2F8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12.5, color: '#8A99B0' }}>
            第 {step + 1} / 3 步 · 所有配置可在任务详情中重新调整
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 ? <Button onClick={() => setStep(step - 1)}>上一步</Button> : <Button onClick={() => navigate('/tasks')}>取消</Button>}
            {step < 2 ? (
              <Button type="primary" onClick={next}>
                下一步
              </Button>
            ) : (
              <Button type="primary" loading={submitting} icon={<ThunderboltOutlined />} onClick={submit}>
                创建任务
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
