import { useEffect, useState } from 'react';
import { Button, Descriptions, Input, Modal, Select, Tabs, Tag, message } from 'antd';
import { CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { alarmService } from '../services';
import type { Alarm } from '../types/models';
import {
  ALARM_LEVEL_COLOR,
  ALARM_LEVEL_LABEL,
  ALARM_STATUS_LABEL,
  ALARM_TYPE_LABEL,
} from '../constants/dict';
import { PageHeader, Panel, StatCard, StatusTag } from '../components/ui';
import { fmtDateTime, fromNow } from '../utils/format';

export default function Alarms() {
  const [list, setList] = useState<Alarm[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ open: 0, processing: 0, today: 0, avgCloseHours: 0 });
  const [levels, setLevels] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<Alarm | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [handling, setHandling] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState('张启明');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    alarmService.list({ levels, statuses, keyword, pageSize: 100 }).then((res) => {
      setList(res.list);
      setTotal(res.total);
      setSelected((prev) => prev ?? res.list[0] ?? null);
    }).finally(() => setLoading(false));
    alarmService.stats().then(setStats);
  };

  useEffect(load, [levels, statuses, keyword]);

  const handle = async (status: Alarm['status'], text?: string) => {
    if (!selected) return;
    await alarmService.handle(selected.id, status, text);
    const updated = await alarmService.list({ pageSize: 100 });
    setList(updated.list);
    setSelected(updated.list.find((a) => a.id === selected.id) ?? null);
    alarmService.stats().then(setStats);
    message.success(status === 'CLOSED' ? '告警已闭环' : '告警已确认');
  };

  return (
    <div className="page">
      <PageHeader
        title="告警中心"
        description="零偏超限、温度异常、通信中断与校准到期的统一告警与闭环处置"
        extra={<Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="待确认" value={stats.open} unit="条" hint="需 30 分钟内响应" color="#f5222d" onClick={() => setStatuses(['OPEN'])} />
        <StatCard label="处理中" value={stats.processing} unit="条" hint="平均处置 2.4 h" onClick={() => setStatuses(['PROCESSING'])} />
        <StatCard label="今日新增" value={stats.today} unit="条" hint="较昨日 -2" />
        <StatCard label="平均闭环时长" value={stats.avgCloseHours} unit="h" hint="目标 ≤ 8 h" color="#16a34a" />
      </div>

      <Tabs
        items={[
          {
            key: 'list',
            label: '告警处置',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, alignItems: 'start' }}>
                <Panel title="告警列表" sub={`共 ${total} 条`}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <Input.Search placeholder="设备编号 / 告警内容" allowClear style={{ width: 200 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                    <Select mode="multiple" allowClear placeholder="等级" style={{ minWidth: 140 }} value={levels} onChange={setLevels} options={Object.entries(ALARM_LEVEL_LABEL).map(([value, label]) => ({ value, label }))} maxTagCount={1} />
                    <Select mode="multiple" allowClear placeholder="状态" style={{ minWidth: 140 }} value={statuses} onChange={setStatuses} options={Object.entries(ALARM_STATUS_LABEL).map(([value, label]) => ({ value, label }))} maxTagCount={1} />
                  </div>
                  <div style={{ maxHeight: 560, overflow: 'auto' }}>
                    {list.map((alarm) => (
                      <div
                        key={alarm.id}
                        onClick={() => setSelected(alarm)}
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: '10px 8px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: selected?.id === alarm.id ? '#f0f8ff' : undefined,
                          borderBottom: '1px solid #f5f7fa',
                        }}
                      >
                        <span className="alarm-bar" style={{ background: ALARM_LEVEL_COLOR[alarm.level] }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ color: ALARM_LEVEL_COLOR[alarm.level], fontSize: 11 }}>{ALARM_LEVEL_LABEL[alarm.level]}</span>
                            <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alarm.title}</span>
                          </div>
                          <div className="small muted" style={{ marginTop: 3 }}>
                            {alarm.deviceCode} · {ALARM_TYPE_LABEL[alarm.type]} · {fromNow(alarm.triggeredAt)}
                          </div>
                        </div>
                        <StatusTag
                          text={ALARM_STATUS_LABEL[alarm.status]}
                          color={alarm.status === 'OPEN' ? 'error' : alarm.status === 'PROCESSING' ? 'processing' : alarm.status === 'ACKED' ? 'warning' : 'success'}
                        />
                      </div>
                    ))}
                    {!list.length ? <div className="muted" style={{ padding: 20, textAlign: 'center' }}>当前筛选下无告警</div> : null}
                  </div>
                </Panel>

                <Panel title="告警详情" sub={selected?.code}>
                  {selected ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <span style={{ width: 32, height: 32, borderRadius: 8, background: `${ALARM_LEVEL_COLOR[selected.level]}18`, color: ALARM_LEVEL_COLOR[selected.level], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                          {ALARM_LEVEL_LABEL[selected.level].slice(0, 1)}
                        </span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.title}</div>
                          <div className="small muted">{ALARM_LEVEL_LABEL[selected.level]} · {ALARM_TYPE_LABEL[selected.type]} · {ALARM_STATUS_LABEL[selected.status]}</div>
                        </div>
                      </div>

                      <Descriptions column={2} size="small" bordered>
                        <Descriptions.Item label="告警编号" span={2}><span className="mono">{selected.code}</span></Descriptions.Item>
                        <Descriptions.Item label="设备">{selected.deviceCode}</Descriptions.Item>
                        <Descriptions.Item label="指标">{selected.metric ?? '—'}</Descriptions.Item>
                        <Descriptions.Item label="触发值">
                          <span className="over">{selected.value ?? '—'} {selected.unit}</span>
                        </Descriptions.Item>
                        <Descriptions.Item label="阈值">{selected.threshold ?? '—'} {selected.unit}</Descriptions.Item>
                        <Descriptions.Item label="触发时间" span={2}>{fmtDateTime(selected.triggeredAt)}</Descriptions.Item>
                        <Descriptions.Item label="持续时长" span={2}>{selected.durationMinutes} min</Descriptions.Item>
                        <Descriptions.Item label="处置人" span={2}>{selected.assignee ?? '未指派'}</Descriptions.Item>
                      </Descriptions>

                      <div style={{ marginTop: 14, fontSize: 13, fontWeight: 500 }}>处置时间线</div>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
                          <span className="timeline-dot" style={{ background: '#f5222d' }} />
                          <div className="small">告警触发 · {fmtDateTime(selected.triggeredAt)}</div>
                        </div>
                        {selected.ackedAt ? (
                          <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
                            <span className="timeline-dot" style={{ background: '#1677ff' }} />
                            <div className="small">已确认 · {fmtDateTime(selected.ackedAt)} · {selected.assignee}</div>
                          </div>
                        ) : null}
                        {selected.closedAt ? (
                          <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
                            <span className="timeline-dot" style={{ background: '#16a34a' }} />
                            <div className="small">已闭环 · {fmtDateTime(selected.closedAt)}</div>
                          </div>
                        ) : null}
                      </div>

                      {selected.handling ? (
                        <div style={{ marginTop: 10, padding: 10, background: '#fafbfd', borderRadius: 6, fontSize: 12, lineHeight: 1.8, color: '#5a6577' }}>
                          处置意见：{selected.handling}
                        </div>
                      ) : null}

                      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button icon={<CheckOutlined />} disabled={selected.status !== 'OPEN'} onClick={() => handle('ACKED')}>确认告警</Button>
                        <Button onClick={() => setAssignOpen(true)}>指派处理</Button>
                        <Button type="primary" danger disabled={selected.status === 'CLOSED'} onClick={() => setCloseOpen(true)}>关闭告警</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="muted">请选择左侧告警查看详情</div>
                  )}
                </Panel>
              </div>
            ),
          },
          {
            key: 'rules',
            label: '规则配置',
            children: (
              <Panel title="告警规则" sub="4 条启用中">
                <table className="spec-table">
                  <thead><tr><th>规则名称</th><th>类型</th><th>触发条件</th><th>等级</th><th>通知方式</th><th>状态</th><th>操作</th></tr></thead>
                  <tbody>
                    {[
                      ['零偏稳定性超限', '阈值型', '零偏稳定性 > 0.05 °/h 持续 3 个采样窗口', '严重', '站内 + 邮件', '启用'],
                      ['温度通道异常', '突变型', '单点跳变 > 5σ 或偏差 > 1.5 ℃', '一般', '站内', '启用'],
                      ['采集链路中断', '离线型', '连续 120 s 无心跳', '紧急', '站内 + 短信', '启用'],
                      ['校准证书到期', '阈值型', '校准有效期剩余 ≤ 30 天', '一般', '站内', '启用'],
                      ['数据缺失率偏高', '趋势型', '缺失率连续 3 次上升且 > 0.2%', '提示', '站内', '停用'],
                    ].map((row) => (
                      <tr key={row[0]}>
                        <td>{row[0]}</td><td>{row[1]}</td><td className="muted">{row[2]}</td>
                        <td><Tag bordered={false} color={row[3] === '紧急' ? 'red' : row[3] === '严重' ? 'orange' : 'gold'}>{row[3]}</Tag></td>
                        <td>{row[4]}</td>
                        <td><Tag bordered={false} color={row[5] === '启用' ? 'success' : 'default'}>{row[5]}</Tag></td>
                        <td><a onClick={() => message.success('规则编辑面板已打开（演示）')}>编辑</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            ),
          },
        ]}
      />

      <Modal
        title="关闭告警"
        open={closeOpen}
        onCancel={() => setCloseOpen(false)}
        okText="确认闭环"
        onOk={async () => {
          if (handling.trim().length < 10) {
            message.error('处置意见不少于 10 个字');
            return;
          }
          await handle('CLOSED', handling);
          setCloseOpen(false);
          setHandling('');
        }}
      >
        <div className="small muted" style={{ marginBottom: 6 }}>处置意见（必填，不少于 10 字）</div>
        <Input.TextArea rows={4} value={handling} onChange={(e) => setHandling(e.target.value)} placeholder="如：已核对原始数据，重新执行零偏测试后指标恢复至 0.037 °/h，判定为温度波动导致的短时漂移。" />
      </Modal>

      <Modal
        title="指派处理人"
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        okText="确认指派"
        onOk={async () => {
          if (!selected) return;
          await alarmService.handle(selected.id, 'PROCESSING');
          setAssignOpen(false);
          message.success(`已指派给 ${assignee}`);
          load();
        }}
      >
        <div className="small muted" style={{ marginBottom: 6 }}>处理人</div>
        <Select style={{ width: '100%' }} value={assignee} onChange={setAssignee} options={['张启明', '王振国', '陈立', '赵敏', '周文博'].map((v) => ({ value: v, label: v }))} />
      </Modal>
    </div>
  );
}
