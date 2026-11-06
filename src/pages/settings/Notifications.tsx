import { useState } from 'react';
import { Button, Input, Select, Switch } from 'antd';
import { BellOutlined, MailOutlined, ApiOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../utils/feedback';

export default function Notifications() {
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(true);
  const [webhook, setWebhook] = useState(false);
  const [testing, setTesting] = useState(false);

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <PageHeader
        title="通知设置"
        description="配置告警与任务事件的通知渠道，变更即时生效"
        extra={
          <Button type="primary" onClick={() => toast.success('通知设置已保存')}>
            保存设置
          </Button>
        }
      />

      <div className="grid grid-3" style={{ alignItems: 'stretch' }}>
        <div className="panel">
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <div className="flex-center">
              <span style={{ width: 32, height: 32, borderRadius: 9, background: '#EAF1FF', color: '#1668FF', display: 'grid', placeItems: 'center' }}>
                <BellOutlined />
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>站内信</div>
                <div style={{ fontSize: 11.5, color: '#8A99B0' }}>控制台通知中心</div>
              </div>
            </div>
            <Switch checked={inApp} onChange={setInApp} />
          </div>
          <div style={{ fontSize: 12.5, color: '#5A6B87', lineHeight: 1.9 }}>
            所有告警与任务状态变更都会进入通知中心，未读消息在顶栏铃铛显示角标。
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#8A99B0', marginBottom: 6 }}>接收事件</div>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              defaultValue={['告警触发', '任务失败', '任务完成']}
              options={['告警触发', '告警恢复', '任务失败', '任务完成', '策略变更'].map((v) => ({ value: v, label: v }))}
            />
          </div>
        </div>

        <div className="panel">
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <div className="flex-center">
              <span style={{ width: 32, height: 32, borderRadius: 9, background: '#E6F8F3', color: '#00B894', display: 'grid', placeItems: 'center' }}>
                <MailOutlined />
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>邮件</div>
                <div style={{ fontSize: 11.5, color: '#8A99B0' }}>发送至成员企业邮箱</div>
              </div>
            </div>
            <Switch checked={email} onChange={setEmail} />
          </div>
          <div style={{ fontSize: 12.5, color: '#5A6B87', lineHeight: 1.9 }}>
            严重告警默认发送邮件，同一告警 30 分钟内不会重复发送。
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#8A99B0', marginBottom: 6 }}>接收人</div>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              defaultValue={['chenmo@xinglan-tech.com', 'linqing@xinglan-tech.com']}
              options={['chenmo@xinglan-tech.com', 'linqing@xinglan-tech.com', 'surui@xinglan-tech.com', 'qianyu@xinglan-tech.com'].map((v) => ({ value: v, label: v }))}
            />
          </div>
        </div>

        <div className="panel">
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <div className="flex-center">
              <span style={{ width: 32, height: 32, borderRadius: 9, background: '#F1EEFF', color: '#7C5CFF', display: 'grid', placeItems: 'center' }}>
                <ApiOutlined />
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Webhook</div>
                <div style={{ fontSize: 11.5, color: '#8A99B0' }}>推送到外部系统</div>
              </div>
            </div>
            <Switch checked={webhook} onChange={setWebhook} />
          </div>
          <div style={{ fontSize: 12.5, color: '#5A6B87', lineHeight: 1.9 }}>
            以 POST JSON 推送事件，支持企业微信、飞书与自建网关。
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#8A99B0', marginBottom: 6 }}>回调地址</div>
            <Input placeholder="https://your-domain.com/webhook/datarelay" disabled={!webhook} />
            <div style={{ fontSize: 12, color: '#8A99B0', margin: '12px 0 6px' }}>签名密钥</div>
            <Input.Password placeholder="用于校验请求来源" disabled={!webhook} />
            <Button
              block
              style={{ marginTop: 14 }}
              loading={testing}
              disabled={!webhook}
              onClick={() => {
                setTesting(true);
                setTimeout(() => {
                  setTesting(false);
                  toast.success('测试事件已发送，返回 200 OK');
                }, 1100);
              }}
            >
              发送测试事件
            </Button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <div className="panel-title">通知频率与静默</div>
        </div>
        <div className="grid grid-3" style={{ gap: 24 }}>
          <div>
            <div style={{ fontSize: 12.5, color: '#5A6B87', marginBottom: 8 }}>聚合发送间隔</div>
            <Select style={{ width: '100%' }} defaultValue="5" options={[
              { value: '0', label: '不聚合，实时发送' },
              { value: '5', label: '每 5 分钟聚合一次' },
              { value: '15', label: '每 15 分钟聚合一次' },
            ]} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: '#5A6B87', marginBottom: 8 }}>免打扰时段</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input defaultValue="22:00" />
              <Input defaultValue="08:00" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: '#5A6B87', marginBottom: 8 }}>严重告警绕过免打扰</div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>
    </div>
  );
}
