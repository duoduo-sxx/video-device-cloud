import { useMemo, useState } from 'react';
import { App, Button, Progress, Segmented, Table } from 'antd';
import { DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PageHeader, Panel } from '@/components/ui';
import { Chart, baseAxis, tooltipStyle } from '@/components/Chart';
import { usageByDay, usageRows, usageTotals } from '@/services';
import { CAP_NAMES } from '@/mock/seed/capabilities';
import { fmtMoney, fmtNum } from '@/utils/format';
import type { EChartsOption } from 'echarts';
import type { UsageRecord } from '@/types';

const CAP_COLOR: Record<string, string> = {
  cap_asr: '#5B6CFF',
  cap_subtitle: '#22D3EE',
  cap_translate: '#A78BFA',
  cap_review: '#FBBF24',
  cap_enhance: '#F472B6',
  cap_tts: '#34D399',
};

export default function Usage() {
  const { message } = App.useApp();
  const [days, setDays] = useState(30);
  const dayData = useMemo(() => usageByDay(days), [days]);
  const totals = useMemo(() => usageTotals(days), [days]);
  const rows = usageRows(120);

  const hours = totals.minutes / 60;
  const quota = 3000;
  const cost = totals.cost;
  const apiCalls = 128460;

  const stackOption: EChartsOption = {
    grid: { left: 46, right: 20, top: 26, bottom: 26 },
    tooltip: { trigger: 'axis', ...tooltipStyle() },
    legend: { show: false },
    xAxis: { type: 'category', data: dayData.map((d) => d.date.slice(5)), ...baseAxis() },
    yAxis: { type: 'value', name: '分钟', nameTextStyle: { color: 'var(--text-tertiary)', fontSize: 10 }, ...baseAxis() },
    series: Object.keys(CAP_COLOR).map((cap) => ({
      name: CAP_NAMES[cap as keyof typeof CAP_NAMES],
      type: 'bar',
      stack: 'total',
      barMaxWidth: 16,
      itemStyle: { color: CAP_COLOR[cap] },
      data: dayData.map((d) => d.byCap[cap] || 0),
    })),
  };

  const exportCsv = () => {
    const header = '日期,能力,数量,单位,单价,金额\n';
    const body = rows
      .map((r) => `${r.date},${CAP_NAMES[r.capability]},${r.amount},${r.unit},${r.price},${(r.amount * r.price).toFixed(2)}`)
      .join('\n');
    const blob = new Blob(['\ufeff' + header + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediaforge-usage-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${rows.length} 条用量明细`);
  };

  return (
    <div>
      <PageHeader
        title="用量与计费"
        subtitle="按能力统计处理时长、GPU 占用与 API 调用量 · 账单每月 1 日生成"
        actions={
          <>
            <Segmented size="small" value={days} onChange={(v) => setDays(v as number)} options={[{ label: '近 30 天', value: 30 }, { label: '近 90 天', value: 90 }]} />
            <Button icon={<DownloadOutlined />} onClick={exportCsv}>
              导出账单
            </Button>
          </>
        }
      />

      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="panel tight">
          <div className="hint">本月处理时长</div>
          <div style={{ fontSize: 25 }} className="num">
            {fmtNum(Math.round(hours))}<small style={{ fontSize: 12, color: 'var(--text-tertiary)' }}> 小时</small>
          </div>
          <Progress percent={Math.round((hours / quota) * 100)} showInfo={false} size="small" strokeColor="#5B6CFF" />
          <div className="hint">配额 {fmtNum(quota)} 小时 · 已用 {((hours / quota) * 100).toFixed(1)}%</div>
        </div>
        <div className="panel tight">
          <div className="hint">GPU 时长</div>
          <div style={{ fontSize: 25 }} className="num">486<small style={{ fontSize: 12, color: 'var(--text-tertiary)' }}> 小时</small></div>
          <div className="hint">增强类任务占 68% · 环比 +22%</div>
        </div>
        <div className="panel tight">
          <div className="hint">API 调用</div>
          <div style={{ fontSize: 25 }} className="num">{fmtNum(apiCalls)}</div>
          <div className="hint">成功率 99.2% · 429 限流 214 次</div>
        </div>
        <div className="panel tight">
          <div className="hint">本月预估费用</div>
          <div style={{ fontSize: 25 }} className="num">{fmtMoney(cost)}</div>
          <div className="hint">
            <span style={{ color: 'var(--warning)' }}>↑ 14%</span> 环比上月
          </div>
        </div>
      </div>

      <div className="grid split-2-1" style={{ marginBottom: 14 }}>
        <Panel
          title="按能力分布"
          extra={
            <div className="row wrap" style={{ gap: 10, fontSize: 11 }}>
              {Object.entries(CAP_COLOR).map(([cap, color]) => (
                <span key={cap} className="row" style={{ gap: 4 }}>
                  <i style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
                  {CAP_NAMES[cap as keyof typeof CAP_NAMES]}
                </span>
              ))}
            </div>
          }
        >
          <Chart option={stackOption} height={280} />
        </Panel>

        <Panel title="账单明细">
          <div className="col" style={{ gap: 12 }}>
            <div>
              <div className="row between" style={{ fontSize: 12.5 }}>
                <span className="text-sec">转写</span>
                <span>{fmtMoney(640 * 30 * 0.35)}</span>
              </div>
              <div className="row between" style={{ fontSize: 12.5 }}>
                <span className="text-sec">字幕</span>
                <span>{fmtMoney(420 * 30 * 0.2)}</span>
              </div>
              <div className="row between" style={{ fontSize: 12.5 }}>
                <span className="text-sec">翻译配音</span>
                <span>{fmtMoney(180 * 30 * 0.8)}</span>
              </div>
              <div className="row between" style={{ fontSize: 12.5 }}>
                <span className="text-sec">内容审核</span>
                <span>{fmtMoney(260 * 30 * 0.3)}</span>
              </div>
              <div className="row between" style={{ fontSize: 12.5 }}>
                <span className="text-sec">画质增强</span>
                <span>{fmtMoney(96 * 30 * 2.4)}</span>
              </div>
              <div className="row between" style={{ fontSize: 12.5 }}>
                <span className="text-sec">语音合成</span>
                <span>{fmtMoney(62 * 30 * 1.2)}</span>
              </div>
            </div>
            <div className="divider" style={{ margin: '2px 0' }} />
            <div className="row between">
              <span style={{ fontSize: 13 }}>合计（含税）</span>
              <span style={{ fontSize: 18 }} className="num">{fmtMoney(cost)}</span>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(251,191,36,.09)', fontSize: 11.5, color: 'var(--warning)' }}>
              <InfoCircleOutlined /> 预算告警阈值 80%，按当前速率预计 10 月 27 日触发。
            </div>
            <Button block onClick={() => message.success('已申请提升配额，商务将在 1 个工作日内联系')}>
              申请提升配额
            </Button>
          </div>
        </Panel>
      </div>

      <Panel title="用量明细" extra={<span className="hint">展示最近 {rows.length} 条</span>} noPad>
        <Table<UsageRecord>
          rowKey="id"
          size="small"
          dataSource={rows}
          pagination={{ pageSize: 10, size: 'small' }}
          columns={[
            { title: '日期', dataIndex: 'date', width: 110 },
            { title: '能力', dataIndex: 'capability', width: 120, render: (v) => CAP_NAMES[v as keyof typeof CAP_NAMES] },
            { title: '数量', dataIndex: 'amount', width: 100, render: (v, r) => <span className="num">{fmtNum(v)} {r.unit}</span> },
            { title: '单价', dataIndex: 'price', width: 100, render: (v) => `¥ ${v}` },
            { title: '金额', width: 110, render: (_, r) => <span className="num">{fmtMoney(r.amount * r.price)}</span> },
            { title: '关联任务', dataIndex: 'taskId', render: (v) => <span className="mono" style={{ fontSize: 11 }}>{v}</span> },
          ]}
        />
      </Panel>
    </div>
  );
}
