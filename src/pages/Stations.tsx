import { useEffect, useState } from 'react';
import { Button, Progress, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, ToolOutlined } from '@ant-design/icons';
import { stationService } from '../services';
import type { Station } from '../types/models';
import { STATION_TYPE_LABEL } from '../constants/dict';
import { PageHeader, Panel, StatusTag } from '../components/ui';
import { fmtDate } from '../utils/format';

export default function Stations() {
  const [list, setList] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    stationService.list().then(setList).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const columns: ColumnsType<Station> = [
    { title: '台位编号', dataIndex: 'code', width: 100 },
    { title: '名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', render: (v) => STATION_TYPE_LABEL[v as string] },
    { title: '精度 / 技术指标', dataIndex: 'accuracy' },
    {
      title: '当前承载设备',
      dataIndex: 'currentDeviceCode',
      render: (v?: string) => (v ? <span className="mono">{v}</span> : <span className="muted">空闲</span>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: Station['status']) => (
        <StatusTag text={v === 'BUSY' ? '占用' : v === 'IDLE' ? '空闲' : '维护'} color={v === 'BUSY' ? 'processing' : v === 'IDLE' ? 'default' : 'error'} />
      ),
    },
    {
      title: '近 90 天利用率',
      dataIndex: 'utilization',
      width: 168,
      render: (v: number) => <Progress percent={Math.round(v * 100)} size="small" strokeColor={v > 0.8 ? '#faad14' : '#1668dc'} />,
    },
    { title: '校准有效期至', dataIndex: 'validUntil', width: 128, render: (v: string) => fmtDate(v) },
  ];

  return (
    <div className="page">
      <PageHeader
        title="台位与工装"
        description="转台、温控箱与静基座的使用状态、精度指标与校准有效期"
        extra={<Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
        {list.map((station) => (
          <Panel key={station.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="quick-icon" style={{ width: 28, height: 28, fontSize: 13 }}><ToolOutlined /></span>
                  <strong style={{ fontSize: 14 }}>{station.code}</strong>
                </div>
                <div className="small muted" style={{ marginTop: 6 }}>{station.name}</div>
              </div>
              <StatusTag
                text={station.status === 'BUSY' ? '占用' : station.status === 'IDLE' ? '空闲' : '维护'}
                color={station.status === 'BUSY' ? 'processing' : station.status === 'IDLE' ? 'default' : 'error'}
              />
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#5a6577' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>利用率</span><span className="num">{Math.round(station.utilization * 100)}%</span>
              </div>
              <Progress percent={Math.round(station.utilization * 100)} size="small" showInfo={false} strokeColor={station.utilization > 0.8 ? '#faad14' : '#1668dc'} />
              <div style={{ marginTop: 8 }}>
                承载设备：{station.currentDeviceCode ? <span className="mono">{station.currentDeviceCode}</span> : '—'}
              </div>
              <div style={{ marginTop: 2 }}>校准至 {station.validUntil}</div>
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="台位台账" sub={`${list.length} 个台位`} flush>
        <Table
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={false}
          onRow={(record) => ({
            onClick: () => message.info(`${record.code} 当前${record.status === 'BUSY' ? '被占用' : '空闲'}，可在此查看占用任务`),
          })}
          style={{ cursor: 'pointer' }}
        />
      </Panel>

      <Panel title="占用说明">
        <div className="small" style={{ lineHeight: 2, color: '#5a6577' }}>
          <div>· 转台与温控箱为标定关键资源，标定任务创建时按方案自动匹配；温控方案优先占用 W-01 / W-02。</div>
          <div>· 台位校准有效期到期前 30 天将在告警中心生成提醒，超期后台位自动置为「维护」且不可被新任务占用。</div>
          <div>· 静基座工位 T-01 ~ T-04 仅用于六位置静态标定，不允许承载动态试验。</div>
          <Tag bordered={false} color="blue" style={{ marginTop: 6 }}>提示：双击台位行可查看该台位近 30 天占用甘特图</Tag>
        </div>
      </Panel>
    </div>
  );
}
