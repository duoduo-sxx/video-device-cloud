import { useEffect, useMemo, useState } from 'react';
import { Button, Drawer, Dropdown, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DownOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deviceService } from '../services';
import type { Device, DeviceStatus, DeviceType } from '../types/models';
import {
  DEVICE_STATUS_COLOR,
  DEVICE_STATUS_LABEL,
  DEVICE_TYPE_LABEL,
  HEALTH_LEVEL_COLOR,
  HEALTH_LEVEL_LABEL,
} from '../constants/dict';
import { PageHeader, Panel, StatusTag } from '../components/ui';
import { calibRemainDays, fmtDate } from '../utils/format';

function downloadCsv(rows: Device[]) {
  const header = ['设备编号', '名称', '类型', '型号', '厂家', '序列号', '状态', '台位', '校准到期', '健康分'];
  const lines = rows.map((d) => [
    d.code,
    d.name,
    DEVICE_TYPE_LABEL[d.type],
    d.model,
    d.vendor,
    d.serialNo,
    DEVICE_STATUS_LABEL[d.status],
    d.stationName ?? '—',
    d.calibrationValidUntil,
    String(d.healthScore),
  ]);
  const csv = [header, ...lines].map((line) => line.map((cell) => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `设备台账_20261019.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DeviceList() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [data, setData] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState(params.get('kw') ?? '');
  const [statuses, setStatuses] = useState<string[]>(params.get('status') ? [params.get('status') as string] : []);
  const [types, setTypes] = useState<string[]>([]);
  const [vendor, setVendor] = useState<string>();
  const [calibFilter, setCalibFilter] = useState<'all' | 'soon' | 'expired'>('all');
  const [vendors, setVendors] = useState<string[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(['vendor', 'stationName', 'lastCalibration']);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    deviceService
      .list({ keyword, statuses, types, vendor, calibFilter, page, pageSize })
      .then((res) => {
        setData(res.list);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [keyword, statuses, types, vendor, calibFilter, page, pageSize]);
  useEffect(() => {
    deviceService.vendors().then(setVendors);
  }, []);

  const reset = () => {
    setKeyword('');
    setStatuses([]);
    setTypes([]);
    setVendor(undefined);
    setCalibFilter('all');
    setPage(1);
  };

  const changeStatus = (device: Device, status: DeviceStatus) => {
    Modal.confirm({
      title: `确认将 ${device.code} 变更为「${DEVICE_STATUS_LABEL[status]}」？`,
      content: '状态变更将同步到台位占用与可用任务列表，操作会记录审计日志。',
      okText: '确认变更',
      cancelText: '取消',
      onOk: async () => {
        await deviceService.updateStatus(device.id, status);
        message.success('设备状态已更新');
        load();
      },
    });
  };

  const columns: ColumnsType<Device> = [
    { title: '设备编号', dataIndex: 'code', width: 142, fixed: 'left', sorter: (a, b) => a.code.localeCompare(b.code) },
    {
      title: '设备名称 / 型号',
      dataIndex: 'name',
      width: 220,
      render: (_, record) => (
        <div>
          <div>{record.name}</div>
          <div className="small muted">{record.model} · {record.grade} 级</div>
        </div>
      ),
    },
    { title: '类型', dataIndex: 'type', width: 132, render: (v: DeviceType) => DEVICE_TYPE_LABEL[v] },
    { title: '厂家', dataIndex: 'vendor', width: 168 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      filters: Object.entries(DEVICE_STATUS_LABEL).map(([value, text]) => ({ value, text })),
      onFilter: (value, record) => record.status === value,
      render: (v: DeviceStatus) => <StatusTag text={DEVICE_STATUS_LABEL[v]} color={DEVICE_STATUS_COLOR[v]} />,
    },
    { title: '所在台位', dataIndex: 'stationName', width: 112, render: (v?: string) => v ?? <span className="muted">库房</span> },
    {
      title: '校准有效期',
      dataIndex: 'calibrationValidUntil',
      width: 136,
      sorter: (a, b) => a.calibrationValidUntil.localeCompare(b.calibrationValidUntil),
      render: (value: string) => {
        const days = calibRemainDays(value);
        const color = days < 0 ? '#f5222d' : days <= 30 ? '#faad14' : '#1f2733';
        return (
          <span style={{ color }} className="num">
            {value}
            <span className="small" style={{ marginLeft: 6 }}>
              {days < 0 ? `已过期 ${Math.abs(days)} 天` : days <= 30 ? `${days} 天后到期` : ''}
            </span>
          </span>
        );
      },
    },
    {
      title: '健康分',
      dataIndex: 'healthScore',
      width: 128,
      sorter: (a, b) => a.healthScore - b.healthScore,
      render: (score: number, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 44, height: 5, borderRadius: 3, background: '#eef2f7', overflow: 'hidden' }}>
            <div style={{ width: `${score}%`, height: '100%', background: HEALTH_LEVEL_COLOR[record.healthLevel] }} />
          </div>
          <span className="num" style={{ fontWeight: 500 }}>{score}</span>
          <span className="small" style={{ color: HEALTH_LEVEL_COLOR[record.healthLevel] }}>
            {HEALTH_LEVEL_LABEL[record.healthLevel]}
          </span>
        </div>
      ),
    },
    { title: '最近标定', dataIndex: 'calibratedAt', width: 110, render: (v: string) => fmtDate(v) },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => navigate(`/devices/${record.id}`)}>详情</Button>
          <Button type="link" size="small" onClick={() => navigate('/calibration')}>标定</Button>
          <Dropdown
            menu={{
              items: [
                { key: 'IN_USE', label: '设为在用', onClick: () => changeStatus(record, 'IN_USE') },
                { key: 'CALIBRATING', label: '设为校准中', onClick: () => changeStatus(record, 'CALIBRATING') },
                { key: 'REPAIRING', label: '送修', onClick: () => changeStatus(record, 'REPAIRING') },
                { key: 'IDLE', label: '闲置入库', onClick: () => changeStatus(record, 'IDLE') },
              ],
            }}
          >
            <Button type="link" size="small">更多 <DownOutlined style={{ fontSize: 9 }} /></Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  const filteredColumns = useMemo(() => {
    const extraKeys: Record<string, string> = { vendor: 'vendor', stationName: 'stationName', calibratedAt: 'lastCalibration' };
    return columns.filter((col) => {
      const key = String(('dataIndex' in col ? col.dataIndex : undefined) ?? '');
      const group = extraKeys[key];
      return group ? visibleKeys.includes(group) : true;
    });
  }, [columns, visibleKeys]);

  return (
    <div className="page">
      <PageHeader
        title="设备台账"
        description="在册惯性器件与测试设备全生命周期信息，支持按状态、类型、校准到期筛选"
        extra={
          <>
            <Button icon={<DownloadOutlined />} onClick={() => { downloadCsv(data); message.success(`已导出 ${data.length} 条记录`); }}>
              导出台账
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>新增设备</Button>
          </>
        }
      />

      <Panel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input.Search
            placeholder="设备编号 / 名称 / 型号"
            allowClear
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            onSearch={() => setPage(1)}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="设备类型"
            style={{ minWidth: 190 }}
            value={types}
            onChange={(v) => { setTypes(v); setPage(1); }}
            options={Object.entries(DEVICE_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
            maxTagCount={1}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="状态"
            style={{ minWidth: 160 }}
            value={statuses}
            onChange={(v) => { setStatuses(v); setPage(1); }}
            options={Object.entries(DEVICE_STATUS_LABEL).map(([value, label]) => ({ value, label }))}
            maxTagCount={1}
          />
          <Select
            allowClear
            placeholder="厂家"
            style={{ minWidth: 180 }}
            value={vendor}
            onChange={(v) => { setVendor(v); setPage(1); }}
            options={vendors.map((v) => ({ value: v, label: v }))}
          />
          <Select
            style={{ width: 150 }}
            value={calibFilter}
            onChange={(v) => { setCalibFilter(v); setPage(1); }}
            options={[
              { value: 'all', label: '校准到期：全部' },
              { value: 'soon', label: '30 天内到期' },
              { value: 'expired', label: '已过期' },
            ]}
          />
          <Button onClick={reset}>重置</Button>
          <div style={{ flex: 1 }} />
          <Dropdown
            trigger={['click']}
            dropdownRender={() => (
              <div style={{ background: '#fff', padding: 12, borderRadius: 6, boxShadow: '0 4px 16px rgba(16,30,54,0.12)' }}>
                {[
                  { key: 'vendor', label: '厂家' },
                  { key: 'stationName', label: '所在台位' },
                  { key: 'lastCalibration', label: '最近标定' },
                ].map((item) => (
                  <div key={item.key} style={{ padding: '4px 0' }}>
                    <a
                      onClick={() =>
                        setVisibleKeys((keys) =>
                          keys.includes(item.key) ? keys.filter((k) => k !== item.key) : [...keys, item.key],
                        )
                      }
                    >
                      {visibleKeys.includes(item.key) ? '☑' : '☐'} {item.label}
                    </a>
                  </div>
                ))}
              </div>
            )}
          >
            <Button icon={<SettingOutlined />}>列设置</Button>
          </Dropdown>
          <Button icon={<ReloadOutlined />} onClick={load} />
        </div>
      </Panel>

      <Panel flush>
        <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'space-between' }}>
          <div className="panel-title">设备列表</div>
          <span className="small muted">共 {total} 台，当前筛选 {data.length} 条</span>
        </div>
        <Table
          rowKey="id"
          size="middle"
          loading={loading}
          columns={filteredColumns}
          dataSource={data}
          scroll={{ x: 1500 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            style: { padding: '0 16px 12px' },
          }}
          onRow={(record) => ({ onDoubleClick: () => navigate(`/devices/${record.id}`) })}
        />
      </Panel>

      <Drawer
        title="新增设备"
        width={560}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>保存</Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: 'FOG_IMU', grade: 'A', model: 'HG-200A', vendor: '北辰惯性技术有限公司' }}
          onFinish={async (values) => {
            const device = await deviceService.create(values);
            message.success(`设备 ${device.code} 已创建，状态：在用`);
            setDrawerOpen(false);
            form.resetFields();
            setPage(1);
            load();
          }}
        >
          <Form.Item label="设备编号" name="code" rules={[{ required: true, message: '请输入设备编号' }]}>
            <Input placeholder="如 IMU-2026-0049" />
          </Form.Item>
          <Form.Item label="设备名称" name="name" rules={[{ required: true, message: '请输入设备名称' }]}>
            <Input placeholder="如 光纤陀螺惯性测量单元" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="设备类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
              <Select options={Object.entries(DEVICE_TYPE_LABEL).filter(([k]) => !['TURNTABLE', 'TEMP_CHAMBER'].includes(k)).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
            <Form.Item label="型号" name="model" rules={[{ required: true, message: '请输入型号' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="厂家" name="vendor" rules={[{ required: true, message: '请选择厂家' }]}>
              <Select options={['北辰惯性技术有限公司', '华航天元传感技术研究院', '中科感知微系统', '恒锐精密仪器', '星舆导航'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item label="精度等级" name="grade" rules={[{ required: true, message: '请选择等级' }]}>
              <Select options={['A', 'B', 'C'].map((v) => ({ value: v, label: `${v} 级` }))} />
            </Form.Item>
            <Form.Item label="出厂编号" name="serialNo" rules={[{ required: true, message: '请输入出厂编号' }]}>
              <Input placeholder="SN2026xxxxxx" />
            </Form.Item>
            <Form.Item label="责任人" name="owner" rules={[{ required: true, message: '请选择责任人' }]}>
              <Select options={['张启明', '李慧', '王振国', '陈立', '赵敏'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item label="零偏稳定性 (°/h)" name="bias" initialValue={0.03}>
              <InputNumber min={0.005} max={0.2} step={0.001} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="角度随机游走 (°/√h)" name="arw" initialValue={0.018}>
              <InputNumber min={0.005} max={0.1} step={0.001} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ background: '#fafbfd', border: '1px solid #eef2f7', borderRadius: 6, padding: 12, fontSize: 12, color: '#8a94a6' }}>
            保存后系统将自动生成设备档案、通道配置模板与校准有效期（默认 12 个月），可在设备详情中继续完善技术指标。
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
