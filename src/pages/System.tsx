import { useEffect, useState } from 'react';
import { Avatar, Button, Input, Modal, Select, Table, Tabs, Tag, Tree, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SafetyOutlined } from '@ant-design/icons';
import { systemService } from '../services';
import type { AuditLog, User } from '../types/models';
import { ROLE_LABEL } from '../constants/dict';
import { PageHeader, Panel, StatusTag } from '../components/ui';
import { fmtDateTime } from '../utils/format';

const PERMISSION_TREE = [
  {
    title: '总览驾驶舱',
    key: 'dashboard',
    children: [{ title: '查看', key: 'dashboard:view' }],
  },
  {
    title: '设备管理',
    key: 'devices',
    children: [
      { title: '查看设备', key: 'devices:view' },
      { title: '新增 / 编辑', key: 'devices:edit' },
      { title: '状态变更', key: 'devices:status' },
      { title: '导出台账', key: 'devices:export' },
    ],
  },
  {
    title: '标定与辨识',
    key: 'calibration',
    children: [
      { title: '查看任务', key: 'calibration:view' },
      { title: '创建任务', key: 'calibration:create' },
      { title: '执行标定', key: 'calibration:execute' },
      { title: '审核参数', key: 'calibration:review' },
      { title: '下发参数', key: 'calibration:deploy' },
    ],
  },
  {
    title: '数据分析',
    key: 'analysis',
    children: [
      { title: '查看分析', key: 'analysis:view' },
      { title: '导出结果', key: 'analysis:export' },
    ],
  },
  {
    title: '运行管理',
    key: 'ops',
    children: [
      { title: '任务管理', key: 'tasks:manage' },
      { title: '告警处置', key: 'alarms:handle' },
      { title: '报告归档', key: 'reports:archive' },
    ],
  },
  {
    title: '系统管理',
    key: 'system',
    children: [
      { title: '用户管理', key: 'system:user' },
      { title: '角色权限', key: 'system:role' },
      { title: '审计日志', key: 'system:audit' },
    ],
  },
];

const ROLES = [
  { name: '系统管理员', key: 'ADMIN', count: 1, desc: '全部模块与系统配置权限', color: 'red' },
  { name: '标定工程师', key: 'CALIB_ENGINEER', count: 2, desc: '标定执行、参数解算与下发', color: 'blue' },
  { name: '试验工程师', key: 'TEST_ENGINEER', count: 4, desc: '设备、采集、任务与报告', color: 'cyan' },
  { name: '数据分析师', key: 'ANALYST', count: 2, desc: '分析、回放与轨迹，只读设备', color: 'purple' },
  { name: '质量审核员', key: 'REVIEWER', count: 2, desc: '标定审核、报告与告警', color: 'gold' },
  { name: '只读访客', key: 'GUEST', count: 1, desc: '仅查看驾驶舱与报告', color: 'default' },
];

export default function System() {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [role, setRole] = useState('CALIB_ENGINEER');
  const [checked, setChecked] = useState<string[]>(['dashboard:view', 'devices:view', 'calibration:view', 'calibration:create', 'calibration:execute', 'analysis:view']);

  useEffect(() => {
    systemService.users().then(setUsers);
    systemService.auditLogs().then(setLogs);
  }, []);

  const userColumns: ColumnsType<User> = [
    {
      title: '用户',
      dataIndex: 'name',
      width: 180,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={26} style={{ background: r.avatarColor, fontSize: 11 }}>{r.name.slice(0, 1)}</Avatar>
          <div>
            <div style={{ fontSize: 13 }}>{r.name}</div>
            <div className="small muted mono">{r.account}</div>
          </div>
        </div>
      ),
    },
    { title: '角色', dataIndex: 'role', width: 130, render: (v: string) => <Tag bordered={false} color={ROLES.find((r) => r.key === v)?.color}>{ROLE_LABEL[v]}</Tag> },
    { title: '部门', dataIndex: 'department', width: 160 },
    { title: '手机', dataIndex: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    { title: '最后登录', dataIndex: 'lastLoginAt', width: 160, render: (v: string) => fmtDateTime(v) },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <StatusTag text={v === 'ACTIVE' ? '启用' : '禁用'} color={v === 'ACTIVE' ? 'success' : 'default'} /> },
    {
      title: '操作',
      width: 150,
      render: (_, r) => (
        <>
          <Button type="link" size="small" onClick={() => message.info(`已打开 ${r.name} 的编辑面板`)}>编辑</Button>
          <Button type="link" size="small" onClick={() => message.success(`已向 ${r.name} 发送密码重置邮件`)}>重置密码</Button>
        </>
      ),
    },
  ];

  const logColumns: ColumnsType<AuditLog> = [
    { title: '时间', dataIndex: 'createdAt', width: 168, render: (v: string) => fmtDateTime(v) },
    { title: '操作人', dataIndex: 'user', width: 90 },
    { title: '模块', dataIndex: 'module', width: 110 },
    { title: '动作', dataIndex: 'action', width: 140 },
    { title: '对象', dataIndex: 'target', width: 160, render: (v: string) => <span className="mono small">{v}</span> },
    { title: 'IP', dataIndex: 'ip', width: 120 },
    { title: '耗时', dataIndex: 'costMs', width: 80, render: (v: number) => `${v} ms` },
    { title: '结果', dataIndex: 'result', width: 80, render: (v: string) => <StatusTag text={v === 'SUCCESS' ? '成功' : '失败'} color={v === 'SUCCESS' ? 'success' : 'error'} /> },
  ];

  return (
    <div className="page">
      <PageHeader
        title="系统管理"
        description="用户、角色权限、数据字典与审计日志管理"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>新增用户</Button>}
      />

      <Tabs
        items={[
          {
            key: 'users',
            label: '用户管理',
            children: (
              <Panel flush>
                <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 10 }}>
                  <Input.Search placeholder="姓名 / 账号" allowClear style={{ width: 240 }} />
                  <Select allowClear placeholder="角色" style={{ width: 150 }} options={ROLES.map((r) => ({ value: r.key, label: r.name }))} />
                  <div style={{ flex: 1 }} />
                  <span className="small muted" style={{ lineHeight: '32px' }}>共 {users.length} 个账号，{users.filter((u) => u.status === 'ACTIVE').length} 个启用</span>
                </div>
                <Table rowKey="id" size="middle" columns={userColumns} dataSource={users} pagination={{ pageSize: 10 }} scroll={{ x: 1300 }} />
              </Panel>
            ),
          },
          {
            key: 'roles',
            label: '角色权限',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
                <Panel title="角色列表" sub={`${ROLES.length} 个`}>
                  {ROLES.map((item) => (
                    <div
                      key={item.key}
                      onClick={() => setRole(item.key)}
                      style={{ padding: 10, borderRadius: 6, cursor: 'pointer', background: role === item.key ? '#f0f8ff' : undefined, marginBottom: 4 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Tag bordered={false} color={item.color}>{item.name}</Tag>
                        <span className="small muted">{item.count} 人</span>
                      </div>
                      <div className="small muted" style={{ marginTop: 4 }}>{item.desc}</div>
                    </div>
                  ))}
                </Panel>
                <Panel
                  title={`权限配置 · ${ROLES.find((r) => r.key === role)?.name}`}
                  sub="菜单 + 按钮级"
                  extra={
                    <Button
                      type="primary"
                      size="small"
                      icon={<SafetyOutlined />}
                      onClick={() => message.success(`已保存 ${ROLES.find((r) => r.key === role)?.name} 的权限配置，重新登录后生效`)}
                    >
                      保存
                    </Button>
                  }
                >
                  <Tree
                    checkable
                    defaultExpandAll
                    checkedKeys={checked}
                    onCheck={(keys) => setChecked((Array.isArray(keys) ? keys : keys.checked).map(String))}
                    treeData={PERMISSION_TREE}
                  />
                  <div className="small muted" style={{ marginTop: 12, lineHeight: 1.9 }}>
                    已勾选 {checked.length} 项权限。取消父级节点将同时取消其下所有子权限；按钮级权限控制页面内操作是否可见。
                  </div>
                </Panel>
              </div>
            ),
          },
          {
            key: 'dict',
            label: '数据字典',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
                <Panel title="字典类型">
                  {['设备类型', '设备状态', '标定方案', '告警类型', '任务类型', '结论判定'].map((item, i) => (
                    <div key={item} style={{ padding: '9px 10px', borderRadius: 6, background: i === 0 ? '#f0f8ff' : undefined, fontSize: 13, cursor: 'pointer' }}>
                      {item}
                    </div>
                  ))}
                </Panel>
                <Panel title="字典项 · 设备类型" extra={<Button size="small" icon={<PlusOutlined />} onClick={() => message.success('新增字典项（演示）')}>新增</Button>}>
                  <table className="spec-table">
                    <thead><tr><th>编码</th><th>名称</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>
                      {[
                        ['FOG_IMU', '光纤陀螺惯测单元'],
                        ['MEMS_IMU', 'MEMS 惯测单元'],
                        ['DTG', '动力调谐陀螺'],
                        ['ACC_SET', '加速度计组件'],
                        ['GNSS_INS', '组合导航系统'],
                        ['MAG', '三轴磁强计'],
                      ].map(([code, name], i) => (
                        <tr key={code}>
                          <td className="mono">{code}</td>
                          <td>{name}</td>
                          <td>{i + 1}</td>
                          <td><StatusTag text="启用" color="success" /></td>
                          <td><a onClick={() => message.info('编辑字典项（演示）')}>编辑</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
              </div>
            ),
          },
          {
            key: 'audit',
            label: '审计日志',
            children: (
              <Panel flush>
                <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 10 }}>
                  <Input.Search placeholder="操作人 / 对象" allowClear style={{ width: 240 }} />
                  <Select allowClear placeholder="模块" style={{ width: 150 }} options={['标定管理', '设备管理', '数据分析', '报告中心', '系统管理', '告警中心'].map((v) => ({ value: v, label: v }))} />
                  <div style={{ flex: 1 }} />
                  <span className="small muted" style={{ lineHeight: '32px' }}>仅展示最近 80 条，日志不可编辑</span>
                </div>
                <Table rowKey="id" size="small" columns={logColumns} dataSource={logs} pagination={{ pageSize: 12 }} scroll={{ x: 1100 }} />
              </Panel>
            ),
          },
        ]}
      />

      <Modal
        title="新增用户"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        okText="创建账号"
        onOk={() => {
          setAddOpen(false);
          message.success('账号已创建，初始密码已发送至预留手机号');
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>账号</div>
            <Input placeholder="如 wangfang" />
          </div>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>姓名</div>
            <Input placeholder="真实姓名" />
          </div>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>角色</div>
            <Select style={{ width: '100%' }} defaultValue="TEST_ENGINEER" options={ROLES.filter((r) => r.key !== 'ADMIN').map((r) => ({ value: r.key, label: r.name }))} />
          </div>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>部门</div>
            <Select style={{ width: '100%' }} defaultValue="第二研究室" options={['第二研究室', '标定测试室', '质量保证部', '数据分析组', '计量测试中心'].map((v) => ({ value: v, label: v }))} />
          </div>
        </div>
        <div className="small muted" style={{ marginTop: 12 }}>创建后系统将生成 12 位临时密码，首次登录需修改。</div>
      </Modal>
    </div>
  );
}
