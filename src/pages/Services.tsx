import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Rate, Select, Table, Tabs, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PhoneOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { knowledgeService, serviceOrderService } from '../services';
import type { KnowledgeArticle, ServiceOrder } from '../types/models';
import { PRIORITY_LABEL, SERVICE_STATUS_LABEL } from '../constants/dict';
import { PageHeader, Panel, StatCard, StatusTag } from '../components/ui';
import { fmtDateTime } from '../utils/format';

const NOW = dayjs('2026-10-19 10:27:26');

function slaOf(order: ServiceOrder) {
  const deadline = dayjs(order.createdAt).add(order.slaResolveHours, 'hour');
  const hours = deadline.diff(NOW, 'minute') / 60;
  return { hours, overdue: hours < 0, deadline };
}

export default function Services() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [assign, setAssign] = useState<ServiceOrder | null>(null);
  const [assignee, setAssignee] = useState('王振国');
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [search, setSearch] = useState('');

  const load = () => serviceOrderService.list().then(setOrders);

  useEffect(() => {
    load();
    knowledgeService.list().then(setArticles);
  }, []);

  const slaStats = useMemo(() => {
    const closed = orders.filter((o) => o.resolvedAt);
    const onTime = closed.filter((o) => dayjs(o.resolvedAt!).isBefore(dayjs(o.createdAt).add(o.slaResolveHours, 'hour')));
    return {
      responseRate: 94.4,
      resolveRate: closed.length ? (onTime.length / closed.length) * 100 : 0,
      overdue: orders.filter((o) => slaOf(o).overdue && !o.resolvedAt).length,
      avgHours: 7.8,
    };
  }, [orders]);

  const columns: ColumnsType<ServiceOrder> = [
    { title: '工单号', dataIndex: 'code', width: 138, render: (v: string) => <span className="mono small">{v}</span> },
    { title: '服务对象', dataIndex: 'customer', width: 150 },
    { title: '问题描述', dataIndex: 'title', width: 250 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (v: string) => ({ FAULT: '故障', CONSULT: '咨询', TRAINING: '培训', REPAIR: '维修' }[v]),
    },
    { title: '优先级', dataIndex: 'priority', width: 80, render: (v: string) => <Tag bordered={false} color={v === 'P0' ? 'red' : v === 'P1' ? 'orange' : 'default'}>{PRIORITY_LABEL[v as 'P0']}</Tag> },
    {
      title: 'SLA 剩余',
      width: 130,
      render: (_, record) => {
        if (record.resolvedAt) return <span className="small muted">已解决</span>;
        const sla = slaOf(record);
        const color = sla.overdue ? '#f5222d' : sla.hours < 1 ? '#f5222d' : sla.hours < 4 ? '#faad14' : '#16a34a';
        return <span className="num" style={{ color }}>{sla.overdue ? `超期 ${Math.abs(sla.hours).toFixed(1)} h` : `${sla.hours.toFixed(1)} h`}</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: ServiceOrder['status']) => (
        <StatusTag
          text={SERVICE_STATUS_LABEL[v]}
          color={v === 'CLOSED' || v === 'RESOLVED' ? 'success' : v === 'NEW' ? 'error' : 'processing'}
        />
      ),
    },
    { title: '处理人', dataIndex: 'assignee', width: 90, render: (v?: string) => v ?? <span className="muted">待指派</span> },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => { setAssign(record); setAssignee(record.assignee ?? '王振国'); }}>
          {record.assignee ? '查看 / 转派' : '受理指派'}
        </Button>
      ),
    },
  ];

  const articleColumns: ColumnsType<KnowledgeArticle> = [
    { title: '标题', dataIndex: 'title', render: (v: string, r) => <a onClick={() => setArticle(r)}>{v}</a> },
    { title: '分类', dataIndex: 'category', width: 110, render: (v: string) => <Tag bordered={false}>{v}</Tag> },
    { title: '作者', dataIndex: 'author', width: 90 },
    { title: '更新时间', dataIndex: 'updatedAt', width: 120 },
    { title: '浏览', dataIndex: 'views', width: 80, sorter: (a, b) => a.views - b.views },
  ];

  return (
    <div className="page">
      <PageHeader
        title="技术服务"
        description="服务工单受理、SLA 履约看板与技术支持知识库"
        extra={<Button icon={<PhoneOutlined />} onClick={() => message.info('技术支持热线：010-6872-3040（工作日 8:30–17:30）')}>联系支持</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="响应达标率" value={slaStats.responseRate} unit="%" hint="目标 ≥ 95%" color="#16a34a" />
        <StatCard label="解决达标率" value={slaStats.resolveRate.toFixed(1)} unit="%" hint="目标 ≥ 90%" />
        <StatCard label="超期工单" value={slaStats.overdue} unit="单" hint="需立即升级处理" color="#f5222d" />
        <StatCard label="平均处理时长" value={slaStats.avgHours} unit="h" hint="较上月 -1.2 h" />
        <StatCard label="本月工单" value={orders.length} unit="单" hint="已解决 18 单" />
      </div>

      <Tabs
        items={[
          {
            key: 'orders',
            label: '服务工单',
            children: (
              <Panel flush>
                <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Input.Search placeholder="工单号 / 问题描述" allowClear style={{ width: 260 }} value={search} onChange={(e) => setSearch(e.target.value)} />
                  <Select allowClear placeholder="状态" style={{ width: 150 }} options={Object.entries(SERVICE_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
                  <div style={{ flex: 1 }} />
                  <Button type="primary" onClick={() => message.success('新建工单表单已打开（演示）')}>新建工单</Button>
                </div>
                <Table
                  rowKey="id"
                  size="middle"
                  columns={columns}
                  dataSource={orders.filter((o) => !search || o.title.includes(search) || o.code.includes(search))}
                  scroll={{ x: 1300 }}
                  pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                />
              </Panel>
            ),
          },
          {
            key: 'sla',
            label: 'SLA 看板',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Panel title="SLA 履约情况" sub="近 30 天">
                  <table className="spec-table">
                    <thead><tr><th>指标</th><th>目标</th><th>实际</th><th>达成</th></tr></thead>
                    <tbody>
                      <tr><th>4 小时响应率</th><td>≥ 95%</td><td className="value">94.4%</td><td><StatusTag text="未达标" color="warning" /></td></tr>
                      <tr><th>24 小时解决率</th><td>≥ 90%</td><td className="value">91.7%</td><td><StatusTag text="达标" color="success" /></td></tr>
                      <tr><th>紧急工单 8 小时解决率</th><td>≥ 85%</td><td className="value">88.2%</td><td><StatusTag text="达标" color="success" /></td></tr>
                      <tr><th>一次解决率</th><td>≥ 80%</td><td className="value">76.5%</td><td><StatusTag text="未达标" color="warning" /></td></tr>
                      <tr><th>客户满意度</th><td>≥ 4.5</td><td className="value">4.6</td><td><StatusTag text="达标" color="success" /></td></tr>
                    </tbody>
                  </table>
                  <div className="small muted" style={{ marginTop: 10 }}>
                    说明：响应达标率距目标差 0.6 个百分点，主要因 10 月 12 日两单夜间报修未及时受理，已调整值班表。
                  </div>
                </Panel>
                <Panel title="超期工单" sub="需升级处理">
                  {orders.filter((o) => slaOf(o).overdue && !o.resolvedAt).slice(0, 5).map((o) => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #eef2f7' }}>
                      <div>
                        <div style={{ fontSize: 13 }}>{o.title}</div>
                        <div className="small muted">{o.code} · {o.customer}</div>
                      </div>
                      <span className="over num">超期 {Math.abs(slaOf(o).hours).toFixed(1)} h</span>
                    </div>
                  ))}
                  {!orders.filter((o) => slaOf(o).overdue && !o.resolvedAt).length ? <div className="muted">当前无超期工单</div> : null}
                </Panel>
              </div>
            ),
          },
          {
            key: 'kb',
            label: '知识库',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
                <Panel flush>
                  <Table rowKey="id" size="middle" columns={articleColumns} dataSource={articles} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 篇` }} />
                </Panel>
                <Panel title="热门标签">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['六位置法', 'Allan 方差', '温度系数', '安装误差', '通信故障', '标定流程', '报告模板', 'MEMS'].map((tag) => (
                      <Tag key={tag} bordered={false} color="blue" style={{ cursor: 'pointer' }}>{tag}</Tag>
                    ))}
                  </div>
                  <div className="small muted" style={{ marginTop: 14, lineHeight: 2 }}>
                    知识库共 {articles.length} 篇，覆盖标定规范、故障排查、软件操作、原理科普与培训资料五个分类。
                    文章内容由标定测试室与质量保证部联合维护，每季度复核一次。
                  </div>
                </Panel>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={`工单受理 · ${assign?.code ?? ''}`}
        open={!!assign}
        onCancel={() => setAssign(null)}
        okText="确认指派"
        onOk={async () => {
          if (!assign) return;
          await serviceOrderService.update(assign.id, { status: 'ASSIGNED', assignee });
          message.success(`工单已指派给 ${assignee}`);
          setAssign(null);
          load();
        }}
      >
        {assign ? (
          <div>
            <div style={{ fontSize: 13, marginBottom: 8 }}>{assign.title}</div>
            <div className="small muted" style={{ lineHeight: 1.9, marginBottom: 12 }}>{assign.description}</div>
            <div className="kv" style={{ marginBottom: 12 }}>
              <dt>服务对象</dt><dd>{assign.customer}</dd>
              <dt>创建时间</dt><dd>{fmtDateTime(assign.createdAt)}</dd>
              <dt>SLA 要求</dt><dd>{assign.slaResponseHours} h 响应 / {assign.slaResolveHours} h 解决</dd>
              <dt>当前状态</dt><dd>{SERVICE_STATUS_LABEL[assign.status]}</dd>
            </div>
            <div className="small muted" style={{ marginBottom: 6 }}>指派工程师</div>
            <Select style={{ width: '100%' }} value={assignee} onChange={setAssignee} options={['王振国', '张启明', '陈立', '赵敏'].map((v) => ({ value: v, label: v }))} />
            <div className="small muted" style={{ margin: '12px 0 6px' }}>服务评价</div>
            <Rate disabled defaultValue={assign.satisfaction ?? 4} />
          </div>
        ) : null}
      </Modal>

      <Modal title={article?.title} open={!!article} onCancel={() => setArticle(null)} footer={null} width={680}>
        {article ? (
          <div>
            <div className="row-gap" style={{ marginBottom: 10 }}>
              <Tag bordered={false} color="blue">{article.category}</Tag>
              {article.tags.map((t) => <Tag key={t} bordered={false}>{t}</Tag>)}
              <span className="small muted">{article.author} · {article.updatedAt} · {article.views} 次浏览</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 2, whiteSpace: 'pre-wrap', color: '#3d4757' }}>{article.content}</div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
