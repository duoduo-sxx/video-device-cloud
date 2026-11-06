import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, Modal, Progress, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { calibrationService, deviceService, planService, stationService } from '../services';
import type { CalibrationPlan, CalibrationTask, Device, Station } from '../types/models';
import { CALIB_STATUS_COLOR, CALIB_STATUS_LABEL, CONCLUSION_LABEL } from '../constants/dict';
import { PageHeader, Panel, StatusTag } from '../components/ui';
import { fmtDateTime } from '../utils/format';

export default function CalibrationList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<CalibrationTask[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [planId, setPlanId] = useState<string>();
  const [plans, setPlans] = useState<CalibrationPlan[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    calibrationService
      .list({ keyword, statuses, planId, page, pageSize })
      .then((res) => {
        setTasks(res.list);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [keyword, statuses, planId, page, pageSize]);
  useEffect(() => {
    planService.list().then(setPlans);
    deviceService.all().then(setDevices);
    stationService.list().then(setStations);
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => { map[t.status] = (map[t.status] ?? 0) + 1; });
    return map;
  }, [tasks]);

  const columns: ColumnsType<CalibrationTask> = [
    { title: '任务号', dataIndex: 'code', width: 142, fixed: 'left', render: (v: string) => <a onClick={() => navigate(`/calibration/${tasks.find((t) => t.code === v)?.id ?? ''}`)}>{v}</a> },
    {
      title: '设备',
      dataIndex: 'deviceCode',
      width: 178,
      render: (_, record) => (
        <div>
          <div className="mono" style={{ fontSize: 12 }}>{record.deviceCode}</div>
          <div className="small muted">{record.deviceModel}</div>
        </div>
      ),
    },
    { title: '标定方案', dataIndex: 'planName', width: 168 },
    { title: '台位', dataIndex: 'stationName', width: 158 },
    { title: '温度点', dataIndex: 'tempPoints', width: 112, render: (v: number[]) => (v.length > 1 ? `${v.length} 点（${v[0]}~${v[v.length - 1]}℃）` : `${v[0]} ℃`) },
    { title: '执行人', dataIndex: 'operator', width: 90 },
    { title: '计划时间', dataIndex: 'plannedStart', width: 156, render: (v: string) => fmtDateTime(v), sorter: (a, b) => a.plannedStart.localeCompare(b.plannedStart) },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 138,
      render: (v: number) => <Progress percent={v} size="small" strokeColor={v === 100 ? '#16a34a' : '#1668dc'} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (v: CalibrationTask['status']) => <StatusTag text={CALIB_STATUS_LABEL[v]} color={CALIB_STATUS_COLOR[v]} />,
    },
    {
      title: '结论',
      dataIndex: 'conclusion',
      width: 88,
      render: (v: CalibrationTask['conclusion']) => (
        <StatusTag text={CONCLUSION_LABEL[v]} color={v === 'PASS' ? 'success' : v === 'FAIL' ? 'error' : 'default'} />
      ),
    },
    {
      title: '操作',
      width: 168,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          {record.status === 'RUNNING' ? <Button type="link" size="small" onClick={() => navigate(`/calibration/${record.id}`)}>继续执行</Button> : null}
          {record.status === 'REVIEWING' ? <Button type="link" size="small" onClick={() => navigate(`/calibration/${record.id}/result`)}>去审核</Button> : null}
          {record.status === 'COMPLETED' || record.status === 'FAILED' ? <Button type="link" size="small" onClick={() => navigate(`/calibration/${record.id}/result`)}>查看结果</Button> : null}
          {record.status === 'PENDING' ? <Button type="link" size="small" onClick={() => navigate(`/calibration/${record.id}`)}>开始</Button> : null}
          <Button type="link" size="small" onClick={() => { form.setFieldsValue({ deviceId: record.deviceId, planId: record.planId, operator: record.operator, remark: `复制自 ${record.code}` }); setOpen(true); }}>复制</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="标定与参数辨识"
        description="覆盖六位置、二十四位置、速率与温度循环标定，解算零偏、标度因数与安装误差"
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建标定任务</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {(['RUNNING', 'REVIEWING', 'COMPLETED', 'FAILED'] as const).map((key) => (
          <div className="stat-card" key={key} onClick={() => { setStatuses([key]); setPage(1); }}>
            <div className="stat-label"><span>{CALIB_STATUS_LABEL[key]}</span></div>
            <div className="stat-value" style={{ fontSize: 24 }}>
              {key === 'RUNNING' ? 8 : key === 'REVIEWING' ? 4 : key === 'COMPLETED' ? 26 : 4}
              <span className="stat-unit">项</span>
            </div>
            <div className="stat-foot">点击筛选该状态任务</div>
          </div>
        ))}
        <div className="stat-card" onClick={() => { setStatuses([]); setPage(1); }}>
          <div className="stat-label"><span>全部任务</span></div>
          <div className="stat-value" style={{ fontSize: 24 }}>{total}<span className="stat-unit">项</span></div>
          <div className="stat-foot">当前筛选 {Object.values(counts).reduce((a, b) => a + b, 0)} 项</div>
        </div>
      </div>

      <Panel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Input.Search placeholder="任务号 / 设备编号" allowClear style={{ width: 220 }} value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
          <Select mode="multiple" allowClear placeholder="任务状态" style={{ minWidth: 180 }} value={statuses} onChange={(v) => { setStatuses(v); setPage(1); }} options={Object.entries(CALIB_STATUS_LABEL).map(([value, label]) => ({ value, label }))} maxTagCount={1} />
          <Select allowClear placeholder="标定方案" style={{ minWidth: 190 }} value={planId} onChange={(v) => { setPlanId(v); setPage(1); }} options={plans.map((p) => ({ value: p.id, label: p.name }))} />
          <Button onClick={() => { setKeyword(''); setStatuses([]); setPlanId(undefined); setPage(1); }}>重置</Button>
        </div>
      </Panel>

      <Panel flush>
        <Table
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={tasks}
          scroll={{ x: 1600 }}
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
        />
      </Panel>

      <Panel title="标定方案库" sub={`${plans.length} 套方案`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{ border: '1px solid #eef2f7', borderRadius: 6, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13 }}>{plan.name}</strong>
                <Tag bordered={false} color="blue">{plan.positions.length} 位置</Tag>
              </div>
              <div className="small muted" style={{ marginTop: 6, minHeight: 54, lineHeight: 1.7 }}>{plan.description}</div>
              <div className="small" style={{ marginTop: 6, color: '#8a94a6' }}>
                驻留 {plan.dwellSeconds} s · 判稳阈值 {plan.stabilityThreshold} °/h · 预计 {plan.estimatedMinutes} min
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal
        title="新建标定任务"
        open={open}
        onCancel={() => setOpen(false)}
        width={560}
        okText="创建并进入执行"
        onOk={async () => {
          const values = await form.validateFields();
          const task = await calibrationService.create({
            ...values,
            plannedStart: values.plannedStart?.format('YYYY-MM-DD HH:mm:ss'),
          });
          message.success(`任务 ${task.code} 已创建`);
          setOpen(false);
          form.resetFields();
          load();
          navigate(`/calibration/${task.id}`);
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ tempPoint: 20, operator: '张启明', reviewer: '李慧' }}>
          <Form.Item label="标定设备" name="deviceId" rules={[{ required: true, message: '请选择设备' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="按编号或型号搜索"
              options={devices.filter((d) => d.type !== 'MAG').map((d) => ({ value: d.id, label: `${d.code} · ${d.model}` }))}
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="标定方案" name="planId" rules={[{ required: true, message: '请选择方案' }]}>
              <Select options={plans.map((p) => ({ value: p.id, label: p.name }))} />
            </Form.Item>
            <Form.Item label="使用台位" name="stationId" rules={[{ required: true, message: '请选择台位' }]}>
              <Select options={stations.filter((s) => s.status !== 'MAINTAIN').map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }))} />
            </Form.Item>
            <Form.Item label="执行人" name="operator" rules={[{ required: true, message: '请选择执行人' }]}>
              <Select options={['张启明', '王振国', '赵敏', '周文博'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item label="审核人" name="reviewer" rules={[{ required: true, message: '请选择审核人' }]}>
              <Select options={['李慧', '郑海涛', '孙倩'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item label="计划开始时间" name="plannedStart" rules={[{ required: true, message: '请选择时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} defaultValue={dayjs('2026-10-20 09:00')} />
            </Form.Item>
            <Form.Item label="温度点（℃）" name="tempPoint">
              <Select options={[20, 0, 40, -40, 70].map((v) => ({ value: v, label: `${v} ℃` }))} />
            </Form.Item>
          </div>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="如：批产抽检，重点关注零偏重复性" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
