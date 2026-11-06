import { useState } from 'react';
import { App, Button, Form, Input, Radio, Select, Slider, Switch, Tabs, Tag } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { PageHeader, Panel } from '@/components/ui';
import { useAppStore } from '@/stores/app';
import { resetDemoData } from '@/mock/db';

const EVENTS = ['任务完成', '任务失败', '审核命中高风险', '配额达到 80%', 'API Key 即将过期', '成员加入'];

export default function Settings() {
  const { message, modal } = App.useApp();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [tab, setTab] = useState('general');
  const [compact, setCompact] = useState(false);
  const [notify, setNotify] = useState({ email: true, inapp: true, webhook: false });

  const save = () => message.success('设置已保存，部分配置将在下次任务生效');

  return (
    <div>
      <PageHeader
        title="系统设置"
        subtitle="团队信息、外观、处理引擎、存储策略、通知与集成配置"
        actions={
          <>
            <Button icon={<ReloadOutlined />} onClick={() => modal.confirm({
              title: '重置演示数据？',
              content: '将清除本地保存的字幕修改、标签与审核处置记录，并恢复初始 Mock 数据。',
              okText: '重置',
              okButtonProps: { danger: true },
              onOk: () => {
                resetDemoData();
                message.success('已重置，正在刷新…');
                setTimeout(() => window.location.reload(), 600);
              },
            })}>
              重置演示数据
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={save}>
              保存设置
            </Button>
          </>
        }
      />

      <Panel noPad>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          tabPosition="left"
          style={{ padding: '8px 16px', minHeight: 520 }}
          items={[
            {
              key: 'general',
              label: '通用',
              children: (
                <Form layout="vertical" style={{ maxWidth: 520 }}>
                  <Form.Item label="团队名称">
                    <Input defaultValue="MediaForge 内容中台" />
                  </Form.Item>
                  <Form.Item label="默认项目">
                    <Select defaultValue="2026 春季新品发布" options={['2026 春季新品发布', '品牌资产库', '电商投放素材', '数据分析课程'].map((p) => ({ value: p, label: p }))} />
                  </Form.Item>
                  <Form.Item label="时区">
                    <Select defaultValue="Asia/Shanghai" options={[{ value: 'Asia/Shanghai', label: '(GMT+8) 中国标准时间' }, { value: 'UTC', label: '(GMT+0) UTC' }]} />
                  </Form.Item>
                  <Form.Item label="界面语言">
                    <Select defaultValue="zh-CN" options={[{ value: 'zh-CN', label: '简体中文' }, { value: 'en-US', label: 'English（部分）' }]} />
                  </Form.Item>
                  <Form.Item label="默认可见性" extra="新建素材时的默认权限，可在单个素材上覆盖">
                    <Radio.Group defaultValue="team">
                      <Radio value="team">团队可见</Radio>
                      <Radio value="group">资源组可见</Radio>
                      <Radio value="private">仅自己</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'appearance',
              label: '外观',
              children: (
                <div style={{ maxWidth: 560 }}>
                  <div className="hint" style={{ marginBottom: 8 }}>主题</div>
                  <div className="row" style={{ gap: 10, marginBottom: 20 }}>
                    {[
                      { key: 'dark', label: '深色（默认）', bg: '#0B0E14', panel: '#171C26' },
                      { key: 'light', label: '浅色', bg: '#F5F7FA', panel: '#FFFFFF' },
                    ].map((t) => (
                      <div
                        key={t.key}
                        onClick={() => setTheme(t.key as 'dark' | 'light')}
                        style={{
                          width: 150,
                          border: `1.5px solid ${theme === t.key ? 'var(--brand)' : 'var(--border)'}`,
                          borderRadius: 8,
                          padding: 8,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ background: t.bg, borderRadius: 5, padding: 6, height: 64, border: '1px solid rgba(128,128,128,.2)' }}>
                          <div style={{ background: t.panel, height: 10, borderRadius: 3, marginBottom: 4 }} />
                          <div style={{ background: t.panel, height: 10, width: '70%', borderRadius: 3, marginBottom: 4 }} />
                          <div style={{ background: '#5B6CFF', height: 8, width: '40%', borderRadius: 3 }} />
                        </div>
                        <div className="row between" style={{ marginTop: 6 }}>
                          <span style={{ fontSize: 12 }}>{t.label}</span>
                          {theme === t.key && <Tag color="blue" style={{ marginInlineEnd: 0, fontSize: 10 }}>当前</Tag>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="row between" style={{ marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 13 }}>紧凑模式</div>
                      <div className="hint">减小表格行高与间距，单屏显示更多数据</div>
                    </div>
                    <Switch checked={compact} onChange={(v) => { setCompact(v); message.success(v ? '已开启紧凑模式' : '已关闭紧凑模式'); }} />
                  </div>
                  <div className="row between">
                    <div>
                      <div style={{ fontSize: 13 }}>动效</div>
                      <div className="hint">任务进度光效与页面过渡动画</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              ),
            },
            {
              key: 'engine',
              label: '处理引擎',
              children: (
                <Form layout="vertical" style={{ maxWidth: 560 }}>
                  <Form.Item label="默认转写模型">
                    <Select defaultValue="mf-asr-v3" options={[
                      { value: 'mf-asr-v3', label: 'MF-ASR v3（推荐，中文准确率 96.8%）' },
                      { value: 'mf-asr-v2', label: 'MF-ASR v2（兼容旧接口）' },
                      { value: 'whisper-lg', label: 'Whisper Large（多语场景）' },
                    ]} />
                  </Form.Item>
                  <Form.Item label="默认增强模型">
                    <Select defaultValue="mf-sr-v2" options={[{ value: 'mf-sr-v2', label: 'MF-SR v2（细节增强）' }, { value: 'mf-sr-v1', label: 'MF-SR v1（速度优先）' }]} />
                  </Form.Item>
                  <Form.Item label="并发任务数">
                    <Slider defaultValue={4} max={8} marks={{ 1: '1', 4: '4', 8: '8' }} />
                  </Form.Item>
                  <Form.Item label="GPU 调度策略">
                    <Radio.Group defaultValue="balanced">
                      <Radio value="balanced">均衡</Radio>
                      <Radio value="fast">速度优先</Radio>
                      <Radio value="cost">成本优先</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label="结果缓存">
                    <Switch defaultChecked />
                    <span className="hint" style={{ marginLeft: 8 }}>相同素材与参数复用 7 天内的结果</span>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'storage',
              label: '存储',
              children: (
                <Form layout="vertical" style={{ maxWidth: 520 }}>
                  <Form.Item label="本地缓存上限">
                    <Select defaultValue="20" options={[5, 10, 20, 50].map((n) => ({ value: String(n), label: `${n} GB` }))} />
                  </Form.Item>
                  <Form.Item label="临时文件保留">
                    <Select defaultValue="7" options={[1, 3, 7, 30].map((n) => ({ value: String(n), label: `${n} 天` }))} />
                  </Form.Item>
                  <Form.Item label="自动清理">
                    <Switch defaultChecked />
                    <span className="hint" style={{ marginLeft: 8 }}>每天 03:00 清理超期的中间产物</span>
                  </Form.Item>
                  <Form.Item label="归档策略" extra="超过指定天数未访问的素材自动转低频存储">
                    <Select defaultValue="90" options={[30, 60, 90, 180].map((n) => ({ value: String(n), label: `${n} 天后归档` }))} />
                  </Form.Item>
                  <div className="panel" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="row between" style={{ fontSize: 12.5 }}>
                      <span>当前占用</span>
                      <span>12.4 TB / 20 TB</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, marginTop: 6 }}>
                      <div style={{ width: '62%', height: '100%', background: 'var(--brand)', borderRadius: 3 }} />
                    </div>
                    <div className="hint" style={{ marginTop: 6 }}>其中中间产物 2.8 TB，可清理释放。</div>
                  </div>
                </Form>
              ),
            },
            {
              key: 'notify',
              label: '通知',
              children: (
                <div style={{ maxWidth: 600 }}>
                  <div className="row" style={{ gap: 24, marginBottom: 18 }}>
                    {[
                      { key: 'email' as const, label: '邮件' },
                      { key: 'inapp' as const, label: '站内' },
                      { key: 'webhook' as const, label: 'Webhook' },
                    ].map((c) => (
                      <div key={c.key} className="row" style={{ gap: 6 }}>
                        <Switch size="small" checked={notify[c.key]} onChange={(v) => setNotify({ ...notify, [c.key]: v })} />
                        <span style={{ fontSize: 12.5 }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ color: 'var(--text-tertiary)' }}>
                        <th style={{ textAlign: 'left', fontWeight: 400, padding: '6px 0' }}>事件</th>
                        <th style={{ fontWeight: 400 }}>邮件</th>
                        <th style={{ fontWeight: 400 }}>站内</th>
                        <th style={{ fontWeight: 400 }}>Webhook</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EVENTS.map((e, i) => (
                        <tr key={e} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '9px 0' }}>{e}</td>
                          <td style={{ textAlign: 'center' }}><Switch size="small" defaultChecked={i !== 5} /></td>
                          <td style={{ textAlign: 'center' }}><Switch size="small" defaultChecked /></td>
                          <td style={{ textAlign: 'center' }}><Switch size="small" defaultChecked={i === 1 || i === 2} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ),
            },
            {
              key: 'integration',
              label: '集成',
              children: (
                <Form layout="vertical" style={{ maxWidth: 560 }}>
                  <Form.Item label="Webhook 地址" extra="任务状态变更时向该地址 POST JSON 事件">
                    <Input defaultValue="https://hooks.example.com/mediaforge/events" />
                  </Form.Item>
                  <Form.Item label="回调签名密钥">
                    <Input.Password defaultValue="whsec_9f3a2b81c47d" visibilityToggle />
                  </Form.Item>
                  <Form.Item label="重试策略">
                    <Select defaultValue="3" options={[0, 1, 3, 5].map((n) => ({ value: String(n), label: `失败重试 ${n} 次（指数退避）` }))} />
                  </Form.Item>
                  <Form.Item label="事件类型">
                    <Select mode="multiple" defaultValue={['task.succeeded', 'task.failed', 'review.high_risk']} options={['task.created', 'task.succeeded', 'task.failed', 'review.high_risk', 'quota.warning'].map((e) => ({ value: e, label: e }))} />
                  </Form.Item>
                  <Button onClick={() => message.success('测试事件已发送，返回 200（模拟）')}>发送测试事件</Button>
                </Form>
              ),
            },
          ]}
        />
      </Panel>
    </div>
  );
}
