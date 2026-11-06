import { useMemo, useState } from 'react';
import { Input, Segmented, Select, Table, Tag } from 'antd';
import { PageHeader } from '../../components/base';
import TableToolbar from '../../components/TableToolbar';
import { AUDIT_LOGS, USERS } from '../../mock/seed';
import { exportCsv, fmtTime } from '../../utils/format';

export default function Audit() {
  const [keyword, setKeyword] = useState('');
  const [user, setUser] = useState<string | undefined>();
  const [result, setResult] = useState<string>('all');

  const filtered = useMemo(
    () =>
      AUDIT_LOGS.filter((l) => {
        if (user && l.user !== user) return false;
        if (result !== 'all' && l.result !== result) return false;
        if (keyword && !l.action.includes(keyword) && !l.object.includes(keyword) && !l.user.includes(keyword)) return false;
        return true;
      }),
    [keyword, user, result],
  );

  const exportRows = filtered.map((l) => ({
    时间: fmtTime(l.time),
    操作人: l.user,
    动作: l.action,
    对象: l.object,
    来源IP: l.ip,
    结果: l.result === 'success' ? '成功' : '失败',
  }));

  return (
    <div>
      <PageHeader title="审计日志" desc="记录平台内所有写操作的完整留痕，保留 180 天" />

      <div className="cf-card" style={{ padding: 16 }}>
        <TableToolbar
          search={keyword}
          onSearch={setKeyword}
          placeholder="搜索操作人、动作或对象"
          filters={
            <>
              <Segmented
                value={result}
                onChange={(v) => setResult(v as string)}
                options={[
                  { value: 'all', label: '全部结果' },
                  { value: 'success', label: '成功' },
                  { value: 'failed', label: '失败' },
                ]}
              />
              <Select
                allowClear
                showSearch
                placeholder="操作人"
                style={{ width: 140 }}
                value={user}
                onChange={setUser}
                options={USERS.map((u) => ({ value: u.name, label: u.name }))}
              />
            </>
          }
          exportRows={exportRows}
          exportName="审计日志.csv"
        />

        <Table
          className="cf-table"
          rowKey="id"
          size="middle"
          dataSource={filtered}
          pagination={{ pageSize: 12, showTotal: (t) => `共 ${t} 条` }}
          expandable={{
            expandedRowRender: (r) => (
              <pre
                style={{
                  margin: 0,
                  fontSize: 12,
                  lineHeight: 1.7,
                  background: 'var(--table-head)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 12,
                  overflow: 'auto',
                  color: 'var(--text-2)',
                }}
              >
                {JSON.stringify(r.detail, null, 2)}
              </pre>
            ),
          }}
          columns={[
            {
              title: '时间',
              dataIndex: 'time',
              width: 180,
              render: (v: string) => <span className="mono">{fmtTime(v)}</span>,
            },
            { title: '操作人', dataIndex: 'user', width: 110 },
            { title: '动作', dataIndex: 'action', width: 180 },
            { title: '对象', dataIndex: 'object', width: 220, render: (v: string) => <span className="mono">{v}</span> },
            { title: '来源 IP', dataIndex: 'ip', width: 140, render: (v: string) => <span className="mono">{v}</span> },
            {
              title: '结果',
              dataIndex: 'result',
              width: 90,
              render: (v: 'success' | 'failed') => (
                <Tag bordered={false} color={v === 'success' ? 'green' : 'red'}>
                  {v === 'success' ? '成功' : '失败'}
                </Tag>
              ),
            },
            {
              title: '详情',
              key: 'detail',
              width: 100,
              render: () => <span className="muted">展开查看</span>,
            },
          ]}
        />
      </div>

      <div className="cf-card" style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <Input readOnly value="审计日志已开启防篡改存储（WORM），任何修改都会被记录" style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', padding: 0 }} />
      </div>
    </div>
  );
}
