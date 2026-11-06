import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Drawer, Input, Table, Tag, Tree, message } from 'antd';
import { CloudDownloadOutlined, DatabaseOutlined, LockOutlined } from '@ant-design/icons';
import { PageHeader, StatusTag } from '../../components/base';
import { DATASETS } from '../../mock/seed';
import { useDataStore } from '../../store/dataStore';
import { CLASSIFICATION } from '../../constants/dict';
import type { Dataset } from '../../types';
import { fmtBytes, fmtShortTime } from '../../utils/format';

const DOMAINS = ['交易', '用户', '营销', '供应链', '风控', '财务', '其他'];

export default function Catalog() {
  const navigate = useNavigate();
  const jobs = useDataStore((s) => s.jobs);
  const [domain, setDomain] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [active, setActive] = useState<Dataset | null>(null);

  const filtered = useMemo(
    () =>
      DATASETS.filter((d) => {
        if (domain !== '全部' && d.domain !== domain) return false;
        if (keyword && !d.name.includes(keyword)) return false;
        return true;
      }),
    [domain, keyword],
  );

  const relatedJobs = useMemo(
    () => (active ? jobs.filter((j) => j.datasetId === active.id || j.name.includes(active.name)).slice(0, 5) : []),
    [active, jobs],
  );

  return (
    <div>
      <PageHeader
        title="数据资产目录"
        desc="按业务域组织的可传输数据集，含分级、字段与血缘信息"
        actions={<span className="muted">共 {DATASETS.length} 个数据集 · 其中敏感 {DATASETS.filter((d) => d.classification === 'sensitive').length} 个</span>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '232px minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <div className="cf-card" style={{ padding: 12 }}>
          <div className="cf-card-title" style={{ padding: '4px 8px 8px' }}>业务域</div>
          <Tree
            selectedKeys={[domain]}
            onSelect={(keys) => setDomain((keys[0] as string) ?? '全部')}
            treeData={[
              {
                title: `全部数据集（${DATASETS.length}）`,
                key: '全部',
                icon: <DatabaseOutlined />,
                children: DOMAINS.map((d) => ({
                  title: `${d}（${DATASETS.filter((x) => x.domain === d).length}）`,
                  key: d,
                })),
              },
            ]}
            defaultExpandAll
            blockNode
          />
        </div>

        <div className="cf-card" style={{ padding: 16 }}>
          <div className="table-toolbar">
            <Input.Search
              allowClear
              placeholder="搜索数据集名称"
              style={{ width: 260 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <span className="muted">共 {filtered.length} 条</span>
          </div>

          <Table
            className="cf-table"
            rowKey="id"
            size="middle"
            dataSource={filtered}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
            onRow={(r) => ({ onClick: () => setActive(r), style: { cursor: 'pointer' } })}
            columns={[
              {
                title: '数据集',
                key: 'name',
                width: 260,
                render: (_, r) => (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      {r.classification === 'sensitive' && <LockOutlined style={{ color: '#DC2626' }} />}
                      {r.name}
                    </div>
                    <div className="muted mono" style={{ marginTop: 2 }}>{r.id} · {r.location}</div>
                  </div>
                ),
              },
              { title: '业务域', dataIndex: 'domain', width: 90 },
              {
                title: '类型',
                dataIndex: 'type',
                width: 96,
                render: (v: Dataset['type']) => (
                  <span className="chip">{v === 'structured' ? '结构化' : v === 'file' ? '文件' : '对象'}</span>
                ),
              },
              { title: '数据量', dataIndex: 'sizeBytes', width: 100, render: (v: number) => fmtBytes(v), sorter: (a, b) => a.sizeBytes - b.sizeBytes },
              { title: '文件数', dataIndex: 'fileCount', width: 100, render: (v: number) => v.toLocaleString() },
              { title: '更新频率', dataIndex: 'updateFreq', width: 90 },
              { title: '负责人', dataIndex: 'owner', width: 88 },
              {
                title: '分级',
                dataIndex: 'classification',
                width: 88,
                render: (v: Dataset['classification']) => <StatusTag {...CLASSIFICATION[v]} dot={false} />,
              },
              { title: '被引用', dataIndex: 'referencedJobs', width: 80, render: (v: number) => `${v} 个任务` },
              {
                title: '操作',
                key: 'action',
                width: 110,
                fixed: 'right',
                render: (_, r) => (
                  <Button
                    type="link"
                    size="small"
                    icon={<CloudDownloadOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (r.classification === 'sensitive') {
                        message.warning('该数据集为敏感级别，需审批通过后执行');
                      }
                      navigate('/jobs/new');
                    }}
                  >
                    发起传输
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </div>

      <Drawer open={!!active} onClose={() => setActive(null)} width={680} title={active?.name}>
        {active && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <StatusTag {...CLASSIFICATION[active.classification]} dot={false} />
              <Tag bordered={false}>{active.domain}</Tag>
              <Tag bordered={false}>{active.updateFreq}更新</Tag>
              <span className="chip">{active.id}</span>
            </div>

            <div className="grid grid-3" style={{ marginBottom: 16 }}>
              <div className="cf-card" style={{ padding: 14 }}>
                <div className="muted">数据量</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{fmtBytes(active.sizeBytes)}</div>
              </div>
              <div className="cf-card" style={{ padding: 14 }}>
                <div className="muted">文件数</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{active.fileCount.toLocaleString()}</div>
              </div>
              <div className="cf-card" style={{ padding: 14 }}>
                <div className="muted">负责人</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{active.owner}</div>
              </div>
            </div>

            <div className="section-title">存储位置</div>
            <div className="cf-card" style={{ padding: 12, marginBottom: 16 }}>
              <span className="mono" style={{ fontSize: 12 }}>{active.location}</span>
            </div>

            <div className="section-title">字段预览</div>
            {active.fields ? (
              <Table
                className="cf-table"
                rowKey="name"
                size="small"
                pagination={false}
                dataSource={active.fields}
                columns={[
                  { title: '字段名', dataIndex: 'name', render: (v) => <span className="mono">{v}</span> },
                  { title: '类型', dataIndex: 'type', render: (v) => <span className="muted">{v}</span> },
                  { title: '中文名', dataIndex: 'cnName' },
                  {
                    title: '敏感',
                    dataIndex: 'sensitive',
                    width: 80,
                    render: (v: boolean) => (v ? <Tag color="red" bordered={false}>敏感</Tag> : <span className="muted">否</span>),
                  },
                ]}
              />
            ) : (
              <div className="cf-card muted" style={{ padding: 16 }}>文件类数据集不提供字段级预览</div>
            )}

            <div className="section-title" style={{ marginTop: 20 }}>数据血缘</div>
            <div className="cf-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="muted" style={{ marginBottom: 6 }}>上游</div>
                  <div className="chip" style={{ display: 'block', marginBottom: 6 }}>ods_{active.domain}_raw</div>
                  <div className="chip" style={{ display: 'block' }}>dim_calendar</div>
                </div>
                <div style={{ color: 'var(--text-3)' }}>→</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div className="muted" style={{ marginBottom: 6 }}>当前</div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--primary-weak)',
                      border: '1px solid #2563EB33',
                      fontSize: 12,
                      color: '#2563EB',
                    }}
                  >
                    {active.name}
                  </div>
                </div>
                <div style={{ color: 'var(--text-3)' }}>→</div>
                <div style={{ flex: 1 }}>
                  <div className="muted" style={{ marginBottom: 6 }}>下游</div>
                  <div className="chip" style={{ display: 'block', marginBottom: 6 }}>dws_{active.domain}_summary</div>
                  <div className="chip" style={{ display: 'block' }}>ads_report_daily</div>
                </div>
              </div>
            </div>

            <div className="section-title" style={{ marginTop: 20 }}>最近传输记录</div>
            {relatedJobs.length === 0 ? (
              <div className="cf-card muted" style={{ padding: 16 }}>暂无传输记录</div>
            ) : (
              relatedJobs.map((j) => (
                <div key={j.id} className="list-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${j.id}`)}>
                  <div>
                    <div style={{ fontSize: 13 }}>{j.name}</div>
                    <div className="muted">{j.id} · {fmtShortTime(j.createdAt)}</div>
                  </div>
                  <span className="muted">{fmtBytes(j.totalBytes)}</span>
                </div>
              ))
            )}

            <Button
              type="primary"
              block
              style={{ marginTop: 20 }}
              icon={<CloudDownloadOutlined />}
              onClick={() => {
                if (active.classification === 'sensitive') message.warning('该数据集为敏感级别，需审批通过后执行');
                navigate('/jobs/new');
              }}
            >
              用该数据集创建传输任务
            </Button>
          </>
        )}
      </Drawer>
    </div>
  );
}
