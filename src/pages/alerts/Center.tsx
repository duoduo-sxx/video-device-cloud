import { useMemo, useState } from 'react';
import { Button, Input, Modal, Segmented, Select, Table, Tag, message, type TableColumnsType } from 'antd';
import { CheckOutlined, ClockCircleOutlined, ExportOutlined } from '@ant-design/icons';
import { PageHeader, StatusTag } from '../../components/base';
import StatCard from '../../components/StatCard';
import EChart from '../../charts/EChart';
import TableToolbar, { useColumnSetting } from '../../components/TableToolbar';
import AuthGuard from '../../components/AuthGuard';
import { useDataStore } from '../../store/dataStore';
import { ALERT_LEVEL, ALERT_STATUS } from '../../constants/dict';
import type { AlertItem } from '../../types';
import { exportCsv, fmtDuration, fmtTime, relTime } from '../../utils/format';
import { sparkSeries } from '../../mock/seed';

const TYPES = ['链路中断', '链路质量劣化', '校验失败', '节点离线', '带宽超限', '证书过期', '容量告警', '速率跌零', '队列积压', '重传激增'];

export default function AlertCenter() {
  const alerts = useDataStore((s) => s.alerts);
  const updateAlert = useDataStore((s) => s.updateAlert);
  const [tab, setTab] = useState('firing');
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState<string | undefined>();
  const [ackTarget, setAckTarget] = useState<AlertItem | null>(null);
  const [note, setNote] = useState('');

  const stats = useMemo(() => {
    const firing = alerts.filter((a) => a.status === 'firing');
    return {
      firing: firing.length,
      p0: alerts.filter((a) => a.status === 'firing' && a.level === 'P0').length,
      p1: alerts.filter((a) => a.status === 'firing' && a.level === 'P1').length,
      p2: alerts.filter((a) => a.status === 'firing' && a.level === 'P2').length,
      p3: alerts.filter((a) => a.status === 'firing' && a.level === 'P3').length,
      today: alerts.filter((a) => new Date(a.firedAt).toDateString() === new Date().toDateString()).length,
      acked: alerts.filter((a) => a.status === 'acked').length,
    };
  }, [alerts]);

  const filtered = useMemo(
    () =>
      alerts.filter((a) => {
        if (tab !== 'all' && a.status !== tab) return false;
        if (keyword && !a.title.includes(keyword) && !a.targetName.includes(keyword)) return false;
        if (level && a.level !== level) return false;
        return true;
      }),
    [alerts, tab, keyword, level],
  );

  const ack = () => {
    if (!ackTarget) return;
    updateAlert(ackTarget.id, {
      status: 'acked',
      ackedBy: '陈屿',
      ackedAt: new Date().toISOString(),
    });
    message.success('告警已确认，已记录处理备注');
    setAckTarget(null);
    setNote('');
  };

  const columns: TableColumnsType<AlertItem> = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 72,
      render: (v: AlertItem['level']) => (
        <span
          style={{
            display: 'inline-block',
            minWidth: 34,
            textAlign: 'center',
            padding: '0 6px',
            borderRadius: 4,
            fontSize: 12,
            lineHeight: '20px',
            fontWeight: 600,
            color: '#fff',
            background: ALERT_LEVEL[v].color,
          }}
        >
          {v}
        </span>
      ),
    },
    {
      title: '告警标题',
      key: 'title',
      width: 320,
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13 }}>{r.title}</div>
          <div className="muted" style={{ marginTop: 2 }}>{r.type} · {r.id}</div>
        </div>
      ),
    },
    {
      title: '对象',
      dataIndex: 'targetName',
      key: 'targetName',
      width: 240,
      render: (v: string, r) => (
        <div>
          <div style={{ fontSize: 13 }}>{v}</div>
          <div className="muted">{r.targetType === 'node' ? '节点' : r.targetType === 'link' ? '链路' : r.targetType === 'job' ? '任务' : '系统'}</div>
        </div>
      ),
    },
    {
      title: '触发值 / 阈值',
      key: 'value',
      width: 180,
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          <span style={{ color: '#DC2626', fontWeight: 600 }}>{r.value}</span>
          <span className="muted"> vs {r.threshold}</span>
          <div className="muted">{r.metric}</div>
        </div>
      ),
    },
    {
      title: '触发时间',
      dataIndex: 'firedAt',
      key: 'firedAt',
      width: 120,
      render: (v: string) => (
        <div>
          <div style={{ fontSize: 12 }}>{relTime(v)}</div>
          <div className="muted">{fmtTime(v).slice(5, 16)}</div>
        </div>
      ),
    },
    {
      title: '持续时长',
      dataIndex: 'durationSec',
      key: 'durationSec',
      width: 100,
      render: (v: number) => fmtDuration(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 104,
      render: (v: AlertItem['status']) => <StatusTag {...ALERT_STATUS[v]} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 170,
      fixed: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 2 }}>
          {r.status === 'firing' && (
            <AuthGuard>
              <Button type="link" size="small" style={{ paddingInline: 4 }} icon={<CheckOutlined />} onClick={() => setAckTarget(r)}>
                确认
              </Button>
            </AuthGuard>
          )}
          <Button type="link" size="small" style={{ paddingInline: 4 }} icon={<ClockCircleOutlined />} onClick={() => message.success('已静默 1 小时')}>
            静默
          </Button>
          <Button type="link" size="small" style={{ paddingInline: 4 }} icon={<ExportOutlined />} onClick={() => message.info('已跳转至关联对象详情')}>
            处理
          </Button>
        </div>
      ),
    },
  ];

  const { columns: visibleColumns, node: columnSetting } = useColumnSetting(columns);

  const detailOption = {
    grid: { left: 4, right: 8, top: 10, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', boundaryGap: false, data: Array.from({ length: 30 }).map((_, i) => `-${30 - i}m`), axisLabel: { interval: 5 } },
    yAxis: { type: 'value', splitLine: { show: true } },
    series: [
      {
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: sparkSeries(77),
        areaStyle: { opacity: 0.12 },
        markLine: { silent: true, symbol: 'none', data: [{ yAxis: 52, lineStyle: { color: '#DC2626', type: 'dashed' } }], label: { formatter: '阈值', fontSize: 10 } },
      },
    ],
  };

  const exportRows = filtered.map((a) => ({
    级别: a.level,
    标题: a.title,
    类型: a.type,
    对象: a.targetName,
    触发值: a.value,
    阈值: a.threshold,
    状态: ALERT_STATUS[a.status].label,
    触发时间: fmtTime(a.firedAt),
  }));

  return (
    <div>
      <PageHeader
        title="告警中心"
        desc="链路、节点、任务与系统级异常的统一收敛与处置"
        actions={<Button onClick={() => exportCsv('告警清单.csv', exportRows)}>导出</Button>}
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard
          title="未恢复告警"
          value={String(stats.firing)}
          unit="条"
          color="#DC2626"
          footer={`P0 ${stats.p0} · P1 ${stats.p1} · P2 ${stats.p2} · P3 ${stats.p3}`}
          spark={sparkSeries(21)}
        />
        <StatCard title="今日新增" value={String(stats.today)} unit="条" footer="较昨日下降 12%" spark={sparkSeries(22)} />
        <StatCard title="平均恢复时长" value="14" unit="分钟" color="#16A34A" footer="近 7 天滚动平均" spark={sparkSeries(23)} />
        <StatCard title="已确认待恢复" value={String(stats.acked)} unit="条" color="#D97706" footer="值班工程师已介入" spark={sparkSeries(24)} />
      </div>

      <div className="cf-card" style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Segmented
            value={tab}
            onChange={(v) => setTab(v as string)}
            options={[
              { value: 'firing', label: `正在告警 ${stats.firing}` },
              { value: 'acked', label: `已确认 ${stats.acked}` },
              { value: 'resolved', label: `已恢复 ${alerts.filter((a) => a.status === 'resolved').length}` },
              { value: 'all', label: `全部 ${alerts.length}` },
            ]}
          />
        </div>

        <TableToolbar
          search={keyword}
          onSearch={setKeyword}
          placeholder="搜索告警标题或对象"
          filters={
            <Select
              allowClear
              placeholder="告警级别"
              style={{ width: 120 }}
              value={level}
              onChange={setLevel}
              options={Object.entries(ALERT_LEVEL).map(([k, v]) => ({ value: k, label: v.label }))}
            />
          }
          extra={columnSetting}
          exportRows={exportRows}
          exportName="告警清单.csv"
          onRefresh={() => message.success('告警已刷新')}
        />

        <Table
          className="cf-table"
          rowKey="id"
          size="middle"
          columns={visibleColumns}
          dataSource={filtered}
          scroll={{ x: 1480 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          expandable={{
            expandedRowRender: (r) => (
              <div style={{ padding: '4px 8px 12px' }}>
                <div className="grid grid-2" style={{ gap: 24 }}>
                  <div>
                    <div className="section-title">指标趋势（近 30 分钟）</div>
                    <EChart option={detailOption} height={180} />
                  </div>
                  <div>
                    <div className="section-title">处置建议</div>
                    <div className="cf-card" style={{ padding: 12, fontSize: 13, lineHeight: 1.8 }}>{r.suggestion}</div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                      <span className="muted">历史同类告警：近 7 天 {r.level === 'P0' ? 1 : 4} 次</span>
                      <span className="muted">规则：{r.metric} {r.threshold}</span>
                    </div>
                    {r.ackedBy && <div className="muted" style={{ marginTop: 8 }}>处理人：{r.ackedBy} · {relTime(r.ackedAt)}</div>}
                  </div>
                </div>
              </div>
            ),
          }}
        />
      </div>

      <Modal
        open={!!ackTarget}
        title="确认告警"
        okText="确认并记录"
        onCancel={() => setAckTarget(null)}
        onOk={ack}
      >
        <p style={{ fontSize: 13 }}>
          {ackTarget?.title} · <span className="muted">{ackTarget?.targetName}</span>
        </p>
        <Input.TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="填写处理备注，如：已切换备用链路" />
        <div className="muted" style={{ marginTop: 10 }}>确认后告警状态变为「已确认」，仍需在恢复后手动或自动关闭。</div>
      </Modal>

      <div className="cf-card" style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Tag color="orange" bordered={false}>提示</Tag>
        <span className="muted">
          告警类型覆盖：{TYPES.join('、')}；静默期间不再重复通知，但告警记录仍会保留。
        </span>
      </div>
    </div>
  );
}
