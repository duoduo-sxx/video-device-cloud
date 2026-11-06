import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Slider,
  Switch,
  Tag,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, ThunderboltOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import { policyService } from '../../services';
import type { Policy } from '../../types';
import { POLICIES } from '../../mock/base';
import { formatBytes, formatDuration } from '../../utils/format';
import { toast } from '../../utils/feedback';

const DEFAULTS: Policy = {
  id: '',
  name: '',
  scene: '日常增量同步',
  compression: 'zstd',
  level: 6,
  dedup: 'block',
  blockSizeMB: 8,
  chunkSizeMB: 64,
  concurrency: 16,
  rateLimitMbps: 800,
  retry: 3,
  resume: true,
  fec: false,
  checksum: 'SHA-256',
  refTaskCount: 0,
  savingPercent: 0,
  enabled: true,
};

const RATIO: Record<string, number> = { none: 1, gzip: 0.42, lz4: 0.58, zstd: 0.36 };
const DEDUP: Record<string, number> = { none: 0, file: 0.08, block: 0.22 };

const TOTAL_BYTES = 1.2 * 1024 ** 4;
const BASELINE_BANDWIDTH = 5000;
const BYTES_PER_SEC = BASELINE_BANDWIDTH * 0.125 * 1024 * 1024;

export default function PolicyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useState<Policy>(DEFAULTS);
  const [ready, setReady] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!id) return;
    const found = POLICIES.find((p) => p.id === id);
    if (found) setParams(found);
    setReady(true);
  }, [id]);

  const estimate = useMemo(() => {
    const ratio = Math.max(0.25, RATIO[params.compression] - (params.level - 5) * 0.005);
    const effective = TOTAL_BYTES * ratio * (1 - DEDUP[params.dedup]);
    const speedup = Math.min(params.concurrency / 4, 6) * (params.chunkSizeMB >= 64 ? 1.15 : 1);
    const baselineSec = TOTAL_BYTES / BYTES_PER_SEC;
    const newSec = effective / BYTES_PER_SEC / speedup;
    const cpu = 12 + params.level * 3 + (params.dedup === 'block' ? 18 : 0) + params.concurrency * 0.8;
    const savingBytes = TOTAL_BYTES - effective;
    const acceleration = baselineSec / newSec;
    return {
      ratio,
      effective,
      baselineSec,
      newSec,
      cpu: Math.min(96, Math.round(cpu)),
      savingBytes,
      acceleration,
      savingPercent: Math.round((savingBytes / TOTAL_BYTES) * 100),
      timePercent: Math.round((newSec / baselineSec) * 100),
      trafficPercent: Math.round((effective / TOTAL_BYTES) * 100),
    };
  }, [params]);

  const advice = useMemo(() => {
    if (params.concurrency >= 32 && params.rateLimitMbps > 0 && params.rateLimitMbps < 500) {
      return '当前限速较低，提升并发收益有限，建议优先放宽带宽上限。';
    }
    if (params.compression === 'none') {
      return '未启用压缩，文本与 JSON 类数据建议使用 zstd，可显著降低流量。';
    }
    if (params.dedup === 'none') {
      return '开启块级去重后，重复分片可直接秒传，适合周期性全量备份。';
    }
    if (estimate.cpu > 80) {
      return 'CPU 预估占用偏高，建议降低压缩级别至 6 或减少并发。';
    }
    return '当前参数组合较为均衡，适合大多数跨区传输场景。';
  }, [params]);

  const save = async () => {
    const values = await form.validateFields();
    if (!values.name) {
      toast.error('请填写策略名称');
      return;
    }
    setSaving(true);
    await policyService.save({ ...params, ...values, savingPercent: estimate.savingPercent });
    setSaving(false);
    toast.success('策略已保存');
    navigate('/policies');
  };

  if (!ready) return <div className="page">加载中…</div>;

  return (
    <div className="page" style={{ maxWidth: 1240 }}>
      <PageHeader
        title={id ? '编辑优化策略' : '新建优化策略'}
        description="参数调整会实时反映在右侧预估面板，保存后对新建任务生效"
        extra={
          <>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/policies')}>
              返回列表
            </Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>
              保存策略
            </Button>
          </>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', alignItems: 'start' }}>
        <div className="panel">
          <Form
            form={form}
            layout="vertical"
            initialValues={params}
            onValuesChange={(_, all) => setParams({ ...params, ...all })}
          >
            <div className="section-title">基础信息</div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="name" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}>
                  <Input placeholder="例如：跨境大文件传输" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="scene" label="适用场景">
                  <Select
                    options={[
                      '大文件跨区迁移', '日常增量同步', '带宽紧张链路', '跨境数据传输', '海量小文件',
                      '长期保留归档', '消息队列消费', '边缘节点回传',
                    ].map((v) => ({ value: v, label: v }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0 20px' }} />
            <div className="section-title">压缩</div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="compression" label="压缩算法">
                  <Radio.Group optionType="button" buttonStyle="solid">
                    <Radio.Button value="none">不压缩</Radio.Button>
                    <Radio.Button value="gzip">gzip</Radio.Button>
                    <Radio.Button value="lz4">lz4</Radio.Button>
                    <Radio.Button value="zstd">zstd</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="level" label={`压缩级别（${params.level}）`}>
                  <Slider min={1} max={9} marks={{ 1: '1', 5: '5', 9: '9' }} />
                </Form.Item>
              </Col>
            </Row>

            <div className="section-title">去重</div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="dedup" label="去重方式">
                  <Radio.Group>
                    <Radio value="none">关闭</Radio>
                    <Radio value="file">文件级</Radio>
                    <Radio value="block">块级</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="blockSizeMB" label="去重块大小">
                  <Select disabled={params.dedup !== 'block'} options={[4, 8, 16].map((v) => ({ value: v, label: `${v} MB` }))} />
                </Form.Item>
              </Col>
            </Row>

            <div className="section-title">并行传输</div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="chunkSizeMB" label={`分片大小（${params.chunkSizeMB} MB）`}>
                  <Slider min={16} max={128} step={16} marks={{ 16: '16', 64: '64', 128: '128' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="concurrency" label={`并发数（${params.concurrency}）`}>
                  <Slider min={1} max={64} marks={{ 1: '1', 16: '16', 32: '32', 64: '64' }} />
                </Form.Item>
              </Col>
            </Row>

            <div className="section-title">限速与可靠性</div>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="rateLimitMbps" label="带宽上限（Mbps，0 为不限）">
                  <InputNumber min={0} max={10000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="retry" label="失败重试次数">
                  <InputNumber min={0} max={10} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="checksum" label="校验方式">
                  <Select options={['none', 'MD5', 'SHA-256', 'CRC32C'].map((v) => ({ value: v, label: v }))} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="resume" label="断点续传" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="fec" label="弱网 FEC 纠错" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="enabled" label="启用策略" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>

        <div style={{ position: 'sticky', top: 76 }}>
          <div className="panel">
            <div className="panel-head" style={{ marginBottom: 8 }}>
              <div className="panel-title">
                <ThunderboltOutlined style={{ color: '#00B894' }} />
                预估效果
              </div>
              <Tag color="success" style={{ marginInlineEnd: 0 }}>
                实时计算
              </Tag>
            </div>
            <div style={{ fontSize: 11.5, color: '#8A99B0', lineHeight: 1.7, marginBottom: 12 }}>
              基准样本：1.2 TB / 8,600 个文件 / 5 Gbps 带宽
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="estimate-num">{estimate.acceleration.toFixed(1)}</span>
              <span style={{ fontSize: 14, color: '#5A6B87' }}>x 加速比</span>
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="flex-between" style={{ fontSize: 12, color: '#5A6B87' }}>
                <span>传输耗时</span>
                <span className="num">
                  <span style={{ color: '#A3B0C4', textDecoration: 'line-through' }}>{formatDuration(estimate.baselineSec)}</span>
                  {'  '}
                  <b style={{ color: '#0F172A' }}>{formatDuration(Math.round(estimate.newSec))}</b>
                </span>
              </div>
              <div className="compare-bar">
                <i style={{ width: `${estimate.timePercent}%`, background: '#1668FF' }} />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="flex-between" style={{ fontSize: 12, color: '#5A6B87' }}>
                <span>消耗流量</span>
                <span className="num">
                  <span style={{ color: '#A3B0C4', textDecoration: 'line-through' }}>1.2 TB</span>
                  {'  '}
                  <b style={{ color: '#0F172A' }}>{formatBytes(estimate.effective)}</b>
                </span>
              </div>
              <div className="compare-bar">
                <i style={{ width: `${estimate.trafficPercent}%`, background: '#00B894' }} />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="flex-between" style={{ fontSize: 12, color: '#5A6B87' }}>
                <span>CPU 占用</span>
                <span className="num">
                  <b style={{ color: estimate.cpu > 80 ? '#EF4444' : '#0F172A' }}>{estimate.cpu}%</b>
                </span>
              </div>
              <div className="compare-bar">
                <i style={{ width: `${estimate.cpu}%`, background: estimate.cpu > 80 ? '#EF4444' : '#7C5CFF' }} />
              </div>
            </div>

            <Divider style={{ margin: '18px 0 14px' }} />
            <div className="flex-between" style={{ fontSize: 12.5 }}>
              <span style={{ color: '#5A6B87' }}>节省流量</span>
              <b style={{ color: '#00B894' }}>
                {formatBytes(estimate.savingBytes)}（{estimate.savingPercent}%）
              </b>
            </div>
            <div className="flex-between" style={{ fontSize: 12.5, marginTop: 8 }}>
              <span style={{ color: '#5A6B87' }}>压缩后体积</span>
              <b>{(estimate.ratio * 100).toFixed(0)}%</b>
            </div>
          </div>

          <Alert
            style={{ marginTop: 12 }}
            type={estimate.cpu > 80 ? 'warning' : 'info'}
            showIcon
            message="优化建议"
            description={<span style={{ fontSize: 12.5, lineHeight: 1.8 }}>{advice}</span>}
          />

          <div className="panel" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12.5, color: '#5A6B87', lineHeight: 2 }}>
              <div className="flex-between">
                <span>压缩收益</span>
                <span className="num">{Math.round((1 - estimate.ratio) * 100)}%</span>
              </div>
              <div className="flex-between">
                <span>去重收益</span>
                <span className="num">{Math.round(DEDUP[params.dedup] * 100)}%</span>
              </div>
              <div className="flex-between">
                <span>并行收益</span>
                <span className="num">
                  {(((Math.min(params.concurrency / 4, 6) * (params.chunkSizeMB >= 64 ? 1.15 : 1)) - 1) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
