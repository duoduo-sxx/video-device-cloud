import { useMemo, useState } from 'react';
import { Button, DatePicker, Input, Select, Table, Tag } from 'antd';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { App } from 'antd';
import { PageHeader, Panel, StatusBadge } from '@/components/ui';
import { auditLogs } from '@/services';
import { USERS } from '@/mock/seed/people';
import { fmtDateTime, fmtNum } from '@/utils/format';
import type { AuditLog } from '@/types';

export default function Audit() {
  const { message } = App.useApp();
  const logs = useMemo(() => auditLogs(), []);
  const [keyword, setKeyword] = useState('');
  const [action, setAction] = useState('all');
  const [user, setUser] = useState('all');
  const [result, setResult] = useState('all');

  const actions = Array.from(new Set(logs.map((l) => l.action)));

  const list = logs.filter((l) => {
    if (action !== 'all' && l.action !== action) return false;
    if (user !== 'all' && l.userId !== user) return false;
    if (result !== 'all' && l.result !== result) return false;
    if (keyword && !l.objectName.includes(keyword) && !l.ip.includes(keyword)) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="审计日志"
        subtitle={`近 30 天共 ${fmtNum(logs.length)} 条记录 · 覆盖 10 类操作 · 日志保留 180 天`}
        actions={
          <>
            <Button icon={<DownloadOutlined />} onClick={() => message.success(`已导出 ${list.length} 条审计记录（CSV）`)}>
              导出
            </Button>
          </>
        }
      />

      <Panel style={{ marginBottom: 14 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索对象名称或 IP" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 240 }} />
          <Select value={action} onChange={setAction} style={{ width: 140 }} options={[{ value: 'all', label: '全部动作' }, ...actions.map((a) => ({ value: a, label: a }))]} />
          <Select value={user} onChange={setUser} style={{ width: 150 }} options={[{ value: 'all', label: '全部操作人' }, ...USERS.map((u) => ({ value: u.id, label: u.name }))]} />
          <Select
            value={result}
            onChange={setResult}
            style={{ width: 120 }}
            options={[
              { value: 'all', label: '全部结果' },
              { value: 'success', label: '成功' },
              { value: 'failed', label: '失败' },
            ]}
          />
          <DatePicker.RangePicker style={{ width: 240 }} placeholder={['开始日期', '结束日期']} />
          <span className="hint" style={{ marginLeft: 'auto' }}>共 {list.length} 条</span>
        </div>
      </Panel>

      <Panel noPad>
        <Table<AuditLog>
          rowKey="id"
          size="middle"
          dataSource={list}
          pagination={{ pageSize: 12, size: 'small', showSizeChanger: true }}
          expandable={{
            expandedRowRender: (r) => (
              <div className="grid g2" style={{ gap: 12, padding: '4px 0 8px' }}>
                <div>
                  <div className="hint" style={{ marginBottom: 4 }}>变更前</div>
                  <pre className="mono" style={{ margin: 0, background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 6, padding: 10, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    {JSON.stringify(r.before || {}, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="hint" style={{ marginBottom: 4 }}>变更后</div>
                  <pre className="mono" style={{ margin: 0, background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.25)', borderRadius: 6, padding: 10, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    {JSON.stringify(r.after || {}, null, 2)}
                  </pre>
                </div>
              </div>
            ),
          }}
          columns={[
            { title: '时间', dataIndex: 'time', width: 150, render: (v) => fmtDateTime(v) },
            {
              title: '操作人',
              dataIndex: 'userId',
              width: 110,
              render: (v) => {
                const u = USERS.find((x) => x.id === v);
                return (
                  <span className="row" style={{ gap: 6 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 10, background: u?.avatarColor, color: '#fff', fontSize: 10, display: 'grid', placeItems: 'center' }}>
                      {u?.name.slice(0, 1)}
                    </span>
                    {u?.name}
                  </span>
                );
              },
            },
            { title: '动作', dataIndex: 'action', width: 120, render: (v) => <Tag style={{ marginInlineEnd: 0 }}>{v}</Tag> },
            { title: '对象类型', dataIndex: 'objectType', width: 100 },
            { title: '对象名称', dataIndex: 'objectName', render: (v) => <span style={{ fontSize: 12.5 }}>{v}</span> },
            { title: 'IP', dataIndex: 'ip', width: 130, render: (v) => <span className="mono hint" style={{ fontSize: 11 }}>{v}</span> },
            { title: '结果', dataIndex: 'result', width: 86, render: (v) => <StatusBadge status={v === 'success' ? 'succeeded' : 'failed'} text={v === 'success' ? '成功' : '失败'} /> },
          ]}
        />
      </Panel>

      <div className="hint" style={{ marginTop: 10, textAlign: 'center' }}>
        审计日志为只读，任何成员均无法删除或修改；导出内容包含完整操作链路。
      </div>
    </div>
  );
}
