import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Segmented, Switch, Tag } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { policyService } from '../../services';
import type { Policy } from '../../types';
import { toast } from '../../utils/feedback';

export default function Policies() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await policyService.list();
    setPolicies(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = async (p: Policy) => {
    await policyService.toggle(p.id);
    await load();
    toast.success(`策略「${p.name}」已${p.enabled ? '停用' : '启用'}`);
  };

  const remove = (p: Policy) => {
    if (p.refTaskCount > 0) {
      toast.error(`「${p.name}」正被 ${p.refTaskCount} 个任务引用，无法删除`);
      return;
    }
    Modal.confirm({
      title: `删除策略「${p.name}」？`,
      content: '删除后不可恢复，正在使用该策略的任务不受影响。',
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await policyService.remove(p.id);
        await load();
        toast.success('策略已删除');
      },
    });
  };

  const copy = async (p: Policy) => {
    await policyService.save({ ...p, id: '', name: `${p.name} - 副本`, refTaskCount: 0 });
    await load();
    toast.success('已复制为新策略');
  };

  const totalRef = policies.reduce((sum, p) => sum + p.refTaskCount, 0);
  const avgSaving = policies.length ? Math.round(policies.reduce((s, p) => s + p.savingPercent, 0) / policies.length) : 0;

  return (
    <div className="page">
      <PageHeader
        title="优化策略"
        description="集中管理压缩、去重、分片与重试参数，策略变更前可先通过预估面板验证收益"
        extra={
          <>
            <Segmented options={['全部策略', '仅启用']} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/policies/new')}>
              新建策略
            </Button>
          </>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard title="策略总数" value={String(policies.length)} unit="个" deltaLabel="覆盖 7 类场景" icon={<SlidersOutlined />} />
        <StatCard title="被引用任务" value={String(totalRef)} unit="个" deltaLabel="全部进行中与历史任务" icon={<SlidersOutlined />} iconColor="#7C5CFF" iconBg="#F1EEFF" />
        <StatCard title="平均节省流量" value={`${avgSaving}`} unit="%" deltaLabel="较默认策略" icon={<SlidersOutlined />} iconColor="#00B894" iconBg="#E6F8F3" />
        <StatCard title="停用策略" value={String(policies.filter((p) => !p.enabled).length)} unit="个" deltaLabel="不参与新任务调度" icon={<SlidersOutlined />} iconColor="#8A99B0" iconBg="#F1F5FB" />
      </div>

      {!loading && policies.length === 0 ? (
        <div className="panel">
          <EmptyState title="暂无优化策略" description="创建第一个策略，把传输参数沉淀为可复用的模板" action={<Button type="primary" onClick={() => navigate('/policies/new')}>新建策略</Button>} />
        </div>
      ) : (
        <div className="grid grid-2">
          {policies.map((p) => (
            <div className="panel" key={p.id} style={{ opacity: p.enabled ? 1 : 0.72 }}>
              <div className="flex-between" style={{ marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                    <Tag style={{ marginInlineEnd: 0, fontSize: 10.5 }}>{p.scene}</Tag>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#8A99B0', marginTop: 4 }} className="mono">
                    {p.id} · 被 {p.refTaskCount} 个任务引用
                  </div>
                </div>
                <Switch size="small" checked={p.enabled} onChange={() => toggle(p)} />
              </div>

              <div className="policy-param">
                {p.compression === 'none' ? '不压缩' : `${p.compression} L${p.level}`} ·{' '}
                {p.dedup === 'block' ? `块级去重 ${p.blockSizeMB}MB` : p.dedup === 'file' ? '文件级去重' : '无去重'} ·{' '}
                {p.chunkSizeMB}MB 分片 · {p.concurrency} 并发
                <br />
                限速 {p.rateLimitMbps === 0 ? '不限' : `${p.rateLimitMbps} Mbps`} · 重试 {p.retry} 次 · 断点续传
                {p.resume ? '开启' : '关闭'} · 校验 {p.checksum}
              </div>

              <div className="flex-between" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #EEF2F8' }}>
                <div>
                  <span style={{ fontSize: 11.5, color: '#8A99B0' }}>预估节省流量 </span>
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#00B894' }}>{p.savingPercent}%</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => navigate(`/policies/${p.id}/edit`)}>
                    编辑
                  </Button>
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copy(p)}>
                    复制
                  </Button>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(p)}>
                    删除
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
