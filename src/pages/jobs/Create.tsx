import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Slider,
  Steps,
  Switch,
  Tag,
  message,
} from 'antd';
import {
  ApiOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { PageHeader, KV } from '../../components/base';
import { useDataStore } from '../../store/dataStore';
import { DATASETS, NODES } from '../../mock/seed';
import { testConnection } from '../../services/api';
import { fmtBytes, fmtDuration } from '../../utils/format';
import type { TransferJob } from '../../types';
import { STORAGE_TYPE } from '../../constants/dict';

const storageOf = (path: string): TransferJob['source']['storageType'] => {
  if (path.startsWith('oss')) return 'OSS';
  if (path.startsWith('obs')) return 'OBS';
  if (path.startsWith('s3')) return 'S3';
  if (path.startsWith('hdfs')) return 'HDFS';
  if (path.startsWith('sftp')) return 'SFTP';
  return 'NAS';
};

export default function JobCreate() {
  const navigate = useNavigate();
  const policies = useDataStore((s) => s.policies);
  const addJob = useDataStore((s) => s.addJob);
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [testing, setTesting] = useState<'src' | 'dst' | null>(null);
  const [testResult, setTestResult] = useState<{ src?: string; dst?: string }>({});

  const values = Form.useWatch([], form) ?? {};
  const dataset = DATASETS.find((d) => d.id === values.datasetId);
  const estBytes = dataset?.sizeBytes ?? 1024 ** 4 * 0.86;
  const estSeconds = estBytes / (486 * 1024 ** 2);

  const nodeOptions = useMemo(
    () =>
      NODES.filter((n) => n.status !== 'offline').map((n) => ({
        value: n.id,
        label: `${n.name} · ${n.provider}`,
      })),
    [],
  );

  const fieldsOfStep: string[][] = [
    ['sourceNodeId', 'sourcePath', 'targetNodeId', 'targetPath'],
    ['incremental'],
    [],
    ['name', 'priority', 'runMode'],
  ];

  const next = async () => {
    try {
      await form.validateFields(fieldsOfStep[step]);
      setStep((s) => Math.min(3, s + 1));
    } catch {
      /* 校验失败由表单提示 */
    }
  };

  const doTest = async (which: 'src' | 'dst') => {
    const path = which === 'src' ? values.sourcePath : values.targetPath;
    setTesting(which);
    const res = await testConnection(path ?? '');
    setTesting(null);
    setTestResult((r) => ({
      ...r,
      [which]: res.ok ? `${res.message} · RTT ${res.rttMs}ms` : res.message,
    }));
    if (!res.ok) message.error(res.message);
  };

  const submit = async () => {
    try {
      await form.validateFields();
    } catch {
      message.error('请检查必填项');
      return;
    }
    const srcNode = NODES.find((n) => n.id === values.sourceNodeId)!;
    const dstNode = NODES.find((n) => n.id === values.targetNodeId)!;
    const id = `JOB-20261019-${String(1100 + Math.floor(Math.random() * 200))}`;
    const job: TransferJob = {
      id,
      name: values.name,
      source: {
        nodeId: srcNode.id,
        nodeName: srcNode.name,
        region: srcNode.region,
        provider: srcNode.provider,
        storageType: storageOf(values.sourcePath),
        path: values.sourcePath,
      },
      target: {
        nodeId: dstNode.id,
        nodeName: dstNode.name,
        region: dstNode.region,
        provider: dstNode.provider,
        storageType: storageOf(values.targetPath),
        path: values.targetPath,
      },
      datasetId: values.datasetId,
      totalBytes: dataset?.sizeBytes ?? 1024 ** 4 * 0.86,
      transferredBytes: 0,
      fileCount: dataset?.fileCount ?? 12800,
      priority: values.priority,
      status: 'queued',
      progress: 0,
      speedBps: 0,
      etaSeconds: Math.round(estSeconds),
      protocol: values.protocol ?? 'QUIC',
      encryption: values.encryption ?? 'TLS1.3',
      checksum: values.checksum ?? 'CRC32C',
      policyIds: values.policyIds ?? ['POL-0031'],
      concurrency: values.concurrency ?? 16,
      schedule:
        values.runMode === 'cron'
          ? { mode: 'cron', cron: values.cron ?? '0 2 * * *' }
          : values.runMode === 'once'
            ? { mode: 'once', runAt: values.runAt?.toISOString?.() }
            : { mode: 'now' },
      retryCount: 0,
      createdAt: new Date().toISOString(),
      owner: '陈屿',
      dept: '数据平台部',
      tags: values.tags ?? ['新建任务'],
      compressedRatio: 2.4,
    };
    addJob(job);
    message.success('任务已创建，正在排队');
    setTimeout(() => navigate(`/jobs/${id}`), 400);
  };

  return (
    <div>
      <PageHeader title="新建传输任务" desc="四步完成端点、数据、优化策略与调度配置" />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 16, alignItems: 'start' }}>
        <div className="cf-card">
          <Steps
            current={step}
            size="small"
            style={{ marginBottom: 24 }}
            items={[
              { title: '选择端点' },
              { title: '选择数据' },
              { title: '传输与优化' },
              { title: '调度确认' },
            ]}
          />

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              incremental: 'full',
              concurrency: 16,
              chunkSize: '64MB',
              resume: true,
              protocol: 'QUIC',
              checksum: 'CRC32C',
              encryption: 'TLS1.3',
              policyIds: ['POL-0031', 'POL-0012', 'POL-0008'],
              bandwidthMode: 'limit',
              bandwidthLimit: 8000,
              runMode: 'now',
              priority: 'P1',
              name: '上海OSS→北京OBS 用户行为日志每日同步',
              tags: ['每日同步', '核心链路'],
            }}
            style={{ maxWidth: 720 }}
          >
            <div style={{ display: step === 0 ? 'block' : 'none' }}>
              <div className="section-title">源端</div>
              <Form.Item name="sourceNodeId" label="源连接器" rules={[{ required: true, message: '请选择源连接器' }]}>
                <Select showSearch options={nodeOptions} placeholder="选择源端节点 / 连接器" />
              </Form.Item>
              <Form.Item
                name="sourcePath"
                label="源路径"
                rules={[{ required: true, message: '请输入源路径' }]}
                extra="支持 oss:// / obs:// / s3:// / hdfs:// / sftp:// 前缀"
              >
                <Input placeholder="oss://datalake/dwd/user_behavior/dt=20261018/" />
              </Form.Item>
              <div style={{ marginBottom: 20 }}>
                <Button
                  size="small"
                  icon={<ApiOutlined />}
                  loading={testing === 'src'}
                  onClick={() => doTest('src')}
                >
                  测试连通性
                </Button>
                {testResult.src && (
                  <span style={{ marginLeft: 10, fontSize: 12, color: testResult.src.includes('正常') ? '#16A34A' : '#DC2626' }}>
                    {testResult.src.includes('正常') && <CheckCircleFilled style={{ marginRight: 4 }} />}
                    {testResult.src}
                  </span>
                )}
              </div>

              <Divider style={{ margin: '8px 0 16px' }} />
              <div className="section-title">目标端</div>
              <Form.Item
                name="targetNodeId"
                label="目标连接器"
                rules={[
                  { required: true, message: '请选择目标连接器' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || value !== getFieldValue('sourceNodeId')) return Promise.resolve();
                      return Promise.reject(new Error('目标端不能与源端相同'));
                    },
                  }),
                ]}
              >
                <Select showSearch options={nodeOptions} placeholder="选择目标端节点 / 连接器" />
              </Form.Item>
              <Form.Item name="targetPath" label="目标路径" rules={[{ required: true, message: '请输入目标路径' }]}>
                <Input placeholder="obs://dw-archive/dwd/user_behavior/dt=20261018/" />
              </Form.Item>
              <div>
                <Button
                  size="small"
                  icon={<ApiOutlined />}
                  loading={testing === 'dst'}
                  onClick={() => doTest('dst')}
                >
                  测试连通性
                </Button>
                {testResult.dst && (
                  <span style={{ marginLeft: 10, fontSize: 12, color: testResult.dst.includes('正常') ? '#16A34A' : '#DC2626' }}>
                    {testResult.dst}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: step === 1 ? 'block' : 'none' }}>
              <Form.Item name="datasetId" label="从数据资产目录选择">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="选择数据集（可选）"
                  options={DATASETS.map((d) => ({
                    value: d.id,
                    label: `${d.name} · ${fmtBytes(d.sizeBytes)} · ${d.fileCount.toLocaleString()} 文件`,
                  }))}
                />
              </Form.Item>
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message={`预估数据量 ${fmtBytes(estBytes)} · 文件数 ${(dataset?.fileCount ?? 12800).toLocaleString()} · 平均文件 ${fmtBytes((dataset?.sizeBytes ?? 1024 ** 4 * 0.86) / (dataset?.fileCount ?? 12800))}`}
              />
              <Form.Item name="incremental" label="同步模式">
                <Radio.Group>
                  <Radio.Button value="full">全量</Radio.Button>
                  <Radio.Button value="mtime">增量（按 mtime）</Radio.Button>
                  <Radio.Button value="checksum">增量（按 checksum）</Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Alert
                type="success"
                showIcon
                message="增量（按 checksum）"
                description="对比源端与目标端内容指纹，仅传输新增或变更对象；首次执行会回退为全量扫描。"
              />
            </div>

            <div style={{ display: step === 2 ? 'block' : 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="concurrency" label="并发分片数">
                  <Slider min={1} max={64} marks={{ 1: '1', 16: '16', 32: '32', 64: '64' }} />
                </Form.Item>
                <Form.Item name="chunkSize" label="分片大小">
                  <Radio.Group>
                    {['8MB', '16MB', '32MB', '64MB'].map((s) => (
                      <Radio.Button key={s} value={s}>
                        {s}
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </Form.Item>
                <Form.Item name="protocol" label="传输协议">
                  <Select
                    options={[
                      { value: 'QUIC', label: 'QUIC（推荐，弱网更优）' },
                      { value: 'TCP', label: 'TCP' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="checksum" label="校验算法">
                  <Select
                    options={[
                      { value: 'CRC32C', label: 'CRC32C（低开销）' },
                      { value: 'SHA256', label: 'SHA256（高可靠）' },
                      { value: 'MD5', label: 'MD5' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="encryption" label="传输加密">
                  <Select
                    options={[
                      { value: 'TLS1.3', label: 'TLS 1.3' },
                      { value: 'SM4', label: '国密 SM4' },
                      { value: 'none', label: '不加密' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="resume" label="断点续传" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </div>

              <Form.Item name="policyIds" label="优化策略">
                <Select
                  mode="multiple"
                  placeholder="选择生效的优化策略"
                  options={policies.map((p) => ({ value: p.id, label: p.name }))}
                />
              </Form.Item>
              <Alert
                style={{ marginBottom: 16 }}
                type="warning"
                showIcon
                message="预估提速 +38%，节省流量 42%"
                description="Zstd-19 压缩 + CDC 去重 + 智能选路组合生效；实际收益以任务完成后统计为准。"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="bandwidthMode" label="带宽限制">
                  <Radio.Group>
                    <Radio value="none">不限速</Radio>
                    <Radio value="limit">指定上限</Radio>
                    <Radio value="offpeak">错峰</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item name="bandwidthLimit" label="上限（Mbps）">
                  <InputNumber min={100} max={20000} step={100} style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </div>

            <div style={{ display: step === 3 ? 'block' : 'none' }}>
              <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
                <Input />
              </Form.Item>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="runMode" label="执行方式">
                  <Radio.Group>
                    <Radio.Button value="now">立即执行</Radio.Button>
                    <Radio.Button value="once">定时一次</Radio.Button>
                    <Radio.Button value="cron">周期执行</Radio.Button>
                  </Radio.Group>
                </Form.Item>
                <Form.Item name="priority" label="优先级">
                  <Select options={['P0', 'P1', 'P2', 'P3'].map((p) => ({ value: p, label: p }))} />
                </Form.Item>
              </div>
              <Form.Item name="cron" label="Cron 表达式" extra="常用预设：每天 02:00 → 0 2 * * *，每周一 03:00 → 0 3 * * 1">
                <Select
                  allowClear
                  placeholder="0 2 * * *（每天 02:00）"
                  options={[
                    { value: '0 2 * * *', label: '每天 02:00' },
                    { value: '0 3 * * 1', label: '每周一 03:00' },
                    { value: '0 4 1 * *', label: '每月 1 日 04:00' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="tags" label="标签">
                <Select mode="tags" placeholder="回车添加标签" tokenSeparators={[',']} />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="补充说明，便于团队协作" />
              </Form.Item>
            </div>
          </Form>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button icon={<ArrowLeftOutlined />} disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              上一步
            </Button>
            {step < 3 ? (
              <Button type="primary" onClick={next}>
                下一步 <ArrowRightOutlined />
              </Button>
            ) : (
              <Button type="primary" icon={<CloudUploadOutlined />} onClick={submit}>
                提交任务
              </Button>
            )}
          </div>
        </div>

        <div className="cf-card" style={{ position: 'sticky', top: 0 }}>
          <div className="cf-card-title" style={{ marginBottom: 12 }}>
            配置摘要
          </div>
          <div className="side-panel">
            <KV
              label="源 → 目标"
              value={
                <span style={{ fontSize: 12 }}>
                  {NODES.find((n) => n.id === values.sourceNodeId)?.name ?? '未选择'}
                  <br />→ {NODES.find((n) => n.id === values.targetNodeId)?.name ?? '未选择'}
                </span>
              }
            />
            <KV label="存储类型" value={
              <span>
                {values.sourcePath ? <Tag bordered={false} color={STORAGE_TYPE[storageOf(values.sourcePath)].color}>{storageOf(values.sourcePath)}</Tag> : '—'}
                {values.targetPath ? <Tag bordered={false} color={STORAGE_TYPE[storageOf(values.targetPath)].color}>{storageOf(values.targetPath)}</Tag> : null}
              </span>
            } />
            <KV label="预估数据量" value={fmtBytes(estBytes)} />
            <KV label="文件数" value={(dataset?.fileCount ?? 12800).toLocaleString()} />
            <KV label="并发 / 分片" value={`${values.concurrency ?? 16} 并发 · ${values.chunkSize ?? '64MB'}`} />
            <KV label="优化策略" value={`${(values.policyIds ?? []).length} 条`} />
            <KV label="预计耗时" value={fmtDuration(estSeconds)} />
            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
              <div className="muted" style={{ marginBottom: 6 }}>提交后将进入调度队列，可在任务详情页查看实时进度。</div>
              <Tag color="blue">预计 10 秒内开始</Tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
