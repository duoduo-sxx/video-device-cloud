import { Button, Form, InputNumber, Select, Switch } from 'antd';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../utils/feedback';

export default function Params() {
  const [form] = Form.useForm();

  return (
    <div className="page" style={{ maxWidth: 980 }}>
      <PageHeader
        title="系统参数"
        description="调整平台级的调度与保留策略，保存后对新建任务生效，不影响运行中任务"
        extra={
          <Button
            type="primary"
            onClick={async () => {
              await form.validateFields();
              toast.success('系统参数已保存，下次新建任务生效');
            }}
          >
            保存参数
          </Button>
        }
      />

      <div className="panel">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            maxConcurrency: 64,
            defaultChunk: 64,
            defaultRetry: 3,
            logRetention: 180,
            sla: 99.95,
            timeout: 720,
            autoRetry: true,
            coldArchive: true,
          }}
        >
          <div className="section-title">调度与并发</div>
          <div className="grid grid-3" style={{ gap: 20 }}>
            <Form.Item name="maxConcurrency" label="单任务最大并发数" extra="超过该值的策略配置将被截断">
              <InputNumber min={1} max={256} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="defaultChunk" label="默认分片大小（MB）">
              <Select options={[16, 32, 64, 128].map((v) => ({ value: v, label: `${v} MB` }))} />
            </Form.Item>
            <Form.Item name="defaultRetry" label="默认失败重试次数">
              <InputNumber min={0} max={10} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="timeout" label="任务超时时间（分钟）" extra="超时后任务自动标记失败">
              <InputNumber min={10} max={2880} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="sla" label="SLA 目标（%）">
              <InputNumber min={90} max={100} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="logRetention" label="日志保留天数">
              <InputNumber min={7} max={3650} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="section-title" style={{ marginTop: 8 }}>
            行为开关
          </div>
          <div style={{ maxWidth: 640 }}>
            <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px dashed #EEF2F8' }}>
              <div>
                <div style={{ fontSize: 13 }}>失败自动重试</div>
                <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 2 }}>按重试间隔指数退避，最大 5 次</div>
              </div>
              <Form.Item name="autoRetry" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>
            <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px dashed #EEF2F8' }}>
              <div>
                <div style={{ fontSize: 13 }}>冷热分层自动转储</div>
                <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 2 }}>超过 90 天未访问的数据集自动转入冷存储</div>
              </div>
              <Form.Item name="coldArchive" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>
            <div className="flex-between" style={{ padding: '12px 0' }}>
              <div>
                <div style={{ fontSize: 13 }}>秒传指纹库</div>
                <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 2 }}>命中已有内容指纹时跳过实际传输</div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Form>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <div className="panel-title">
            当前生效配置
            <span className="panel-sub">只读 · 用于核对</span>
          </div>
        </div>
        <div className="code-block">
          {`{
  "scheduler": { "maxConcurrency": 64, "defaultChunkMB": 64, "timeoutMin": 720 },
  "reliability": { "autoRetry": true, "maxRetry": 5, "backoff": "exponential" },
  "storage": { "logRetentionDays": 180, "coldArchiveAfterDays": 90 },
  "sla": { "target": 99.95, "window": "30d" }
}`}
        </div>
      </div>
    </div>
  );
}
