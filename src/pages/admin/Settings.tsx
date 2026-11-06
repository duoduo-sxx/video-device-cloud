import { Button, Divider, Form, Input, InputNumber, Select, Switch, Tabs, Tag, message } from 'antd';
import { PageHeader } from '../../components/base';

export default function Settings() {
  const [baseForm] = Form.useForm();
  const [transferForm] = Form.useForm();
  const [notifyForm] = Form.useForm();

  const save = (name: string) => message.success(`${name}已保存`);

  return (
    <div>
      <PageHeader title="系统设置" desc="平台基础信息、传输默认参数、通知渠道与许可状态" />

      <div className="cf-card">
        <Tabs
          items={[
            {
              key: 'base',
              label: '基础信息',
              children: (
                <Form
                  form={baseForm}
                  layout="vertical"
                  style={{ maxWidth: 560 }}
                  initialValues={{
                    name: '数据云端协同优化传输平台',
                    shortName: 'CloudFlow',
                    timezone: 'Asia/Shanghai',
                    retention: 180,
                    pageSize: 20,
                    density: 'middle',
                  }}
                  onFinish={() => save('基础信息')}
                >
                  <Form.Item name="name" label="平台名称">
                    <Input />
                  </Form.Item>
                  <Form.Item name="shortName" label="产品代号">
                    <Input />
                  </Form.Item>
                  <Form.Item name="timezone" label="默认时区">
                    <Select options={['Asia/Shanghai', 'Asia/Singapore', 'Europe/Berlin', 'America/Los_Angeles'].map((v) => ({ value: v, label: v }))} />
                  </Form.Item>
                  <Form.Item name="retention" label="日志保留天数（天）" extra="审计日志与传输日志的默认保留周期">
                    <InputNumber min={30} max={730} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="density" label="默认表格密度">
                    <Select options={[{ value: 'small', label: '紧凑' }, { value: 'middle', label: '标准' }, { value: 'large', label: '宽松' }]} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">
                    保存设置
                  </Button>
                </Form>
              ),
            },
            {
              key: 'transfer',
              label: '传输默认参数',
              children: (
                <Form
                  form={transferForm}
                  layout="vertical"
                  style={{ maxWidth: 560 }}
                  initialValues={{ concurrency: 16, chunk: '64MB', checksum: 'CRC32C', protocol: 'QUIC', resume: true, limit: 8000, autoRetry: true }}
                  onFinish={() => save('传输默认参数')}
                >
                  <Form.Item name="concurrency" label="默认并发分片数">
                    <InputNumber min={1} max={64} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="chunk" label="默认分片大小">
                    <Select options={['8MB', '16MB', '32MB', '64MB'].map((v) => ({ value: v, label: v }))} />
                  </Form.Item>
                  <Form.Item name="protocol" label="默认传输协议">
                    <Select options={[{ value: 'QUIC', label: 'QUIC' }, { value: 'TCP', label: 'TCP' }]} />
                  </Form.Item>
                  <Form.Item name="checksum" label="默认校验算法">
                    <Select options={['CRC32C', 'SHA256', 'MD5'].map((v) => ({ value: v, label: v }))} />
                  </Form.Item>
                  <Form.Item name="limit" label="单任务带宽上限（Mbps）">
                    <InputNumber min={100} max={20000} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="resume" label="默认开启断点续传" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="autoRetry" label="失败自动重试" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">
                    保存设置
                  </Button>
                </Form>
              ),
            },
            {
              key: 'notify',
              label: '通知渠道',
              children: (
                <Form
                  form={notifyForm}
                  layout="vertical"
                  style={{ maxWidth: 560 }}
                  initialValues={{ smtp: 'smtp.cloudflow.cn', port: 465, sender: 'alert@cloudflow.cn', webhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=****', sms: true }}
                  onFinish={() => save('通知渠道')}
                >
                  <div className="section-title">邮件（SMTP）</div>
                  <Form.Item name="smtp" label="SMTP 服务器">
                    <Input />
                  </Form.Item>
                  <Form.Item name="port" label="端口">
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="sender" label="发件人">
                    <Input />
                  </Form.Item>
                  <Divider />
                  <div className="section-title">Webhook</div>
                  <Form.Item name="webhook" label="Webhook 地址">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item name="sms" label="启用短信通道" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">
                    保存并发送测试消息
                  </Button>
                </Form>
              ),
            },
            {
              key: 'license',
              label: '许可信息',
              children: (
                <div style={{ maxWidth: 640 }}>
                  <div className="grid grid-2" style={{ gap: 16, marginBottom: 16 }}>
                    <div className="cf-card" style={{ padding: 16 }}>
                      <div className="muted">授权主体</div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>云枢数据科技有限公司</div>
                    </div>
                    <div className="cf-card" style={{ padding: 16 }}>
                      <div className="muted">授权版本</div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>Enterprise v2.4.1</div>
                    </div>
                    <div className="cf-card" style={{ padding: 16 }}>
                      <div className="muted">到期时间</div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>2027-09-30</div>
                    </div>
                    <div className="cf-card" style={{ padding: 16 }}>
                      <div className="muted">节点数上限</div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>50（已用 18）</div>
                    </div>
                  </div>
                  <Tag color="green" bordered={false}>授权有效</Tag>
                  <span className="muted" style={{ marginLeft: 8 }}>距离到期还有 346 天，请在到期前 30 天完成续期。</span>
                  <Divider />
                  <div className="muted" style={{ lineHeight: 1.9 }}>
                    许可绑定硬件指纹：9F2C-78A1-4E6B-D013<br />
                    当前在线节点 18 / 50，最大并发传输任务 500，支持的连接器类型 8 种。
                  </div>
                  <Button style={{ marginTop: 16 }} onClick={() => message.info('已复制许可信息')}>
                    复制许可信息
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
