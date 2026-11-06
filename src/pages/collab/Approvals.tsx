import { useMemo, useState } from 'react';
import { Button, Drawer, Input, Modal, Segmented, Tag, Timeline, message } from 'antd';
import { CheckOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { PageHeader, StatusTag, UserAvatar } from '../../components/base';
import { useDataStore } from '../../store/dataStore';
import { useUiStore } from '../../store/uiStore';
import { APPROVAL_STATUS, APPROVAL_TYPE, RISK_LEVEL } from '../../constants/dict';
import type { Approval } from '../../types';
import { fmtCountdown, fmtShortTime, relTime } from '../../utils/format';

export default function Approvals() {
  const approvals = useDataStore((s) => s.approvals);
  const updateApproval = useDataStore((s) => s.updateApproval);
  const role = useUiStore((s) => s.role);
  const [tab, setTab] = useState('pending');
  const [active, setActive] = useState<Approval | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');

  const list = useMemo(() => {
    if (tab === 'pending') return approvals.filter((a) => a.status === 'pending');
    if (tab === 'mine') return approvals.filter((a) => a.applicant === '周雨桐');
    return approvals.filter((a) => a.status !== 'pending');
  }, [approvals, tab]);

  const counts = useMemo(
    () => ({
      pending: approvals.filter((a) => a.status === 'pending').length,
      mine: approvals.filter((a) => a.applicant === '周雨桐').length,
      done: approvals.filter((a) => a.status !== 'pending').length,
    }),
    [approvals],
  );

  const decide = (a: Approval, ok: boolean) => {
    updateApproval(a.id, {
      status: ok ? 'approved' : 'rejected',
      currentNode: '流程结束',
      history: a.history.map((h) =>
        h.action === 'pending'
          ? { ...h, action: ok ? 'pass' : 'reject', approver: '陈屿', comment: ok ? comment || '同意' : reason, time: new Date().toISOString() }
          : h,
      ),
    });
    setActive(null);
    setComment('');
    setReason('');
    message.success(ok ? '已通过该申请' : '已驳回该申请');
  };

  return (
    <div>
      <PageHeader
        title="审批中心"
        desc="跨域传输、敏感数据、带宽提升与连接器开通的审批流"
        actions={
          <div className="muted">
            平均审批时长 <b style={{ color: 'var(--text-1)' }}>42 分钟</b> · 今日已处理 <b style={{ color: 'var(--text-1)' }}>12</b> 单
          </div>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as string)}
          options={[
            { value: 'pending', label: `待我审批 ${counts.pending}` },
            { value: 'mine', label: `我发起的 ${counts.mine}` },
            { value: 'done', label: `已处理 ${counts.done}` },
          ]}
        />
      </div>

      <div className="grid grid-2">
        {list.map((a) => {
          const left = Math.max(0, (new Date(a.slaDeadline).getTime() - Date.now()) / 1000);
          return (
            <div key={a.id} className="cf-card" style={{ cursor: 'pointer' }} onClick={() => setActive(a)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{a.title}</div>
                <StatusTag {...APPROVAL_STATUS[a.status]} dot={false} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
                <UserAvatar name={a.applicant} size={24} />
                <span style={{ fontSize: 13 }}>{a.applicant}</span>
                <span className="muted">{a.dept}</span>
                <span className="muted" style={{ marginLeft: 'auto' }}>{relTime(a.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <StatusTag {...APPROVAL_TYPE[a.type]} dot={false} />
                <StatusTag {...RISK_LEVEL[a.riskLevel]} dot={false} />
                {a.jobRef && <span className="chip">{a.jobRef}</span>}
              </div>
              <div className="muted" style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>
                {a.reason.length > 46 ? `${a.reason.slice(0, 46)}…` : a.reason}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: 10 }}>
                <span className="muted">
                  当前节点：{a.currentNode}
                </span>
                {a.status === 'pending' ? (
                  <span style={{ fontSize: 12, color: left < 3600 ? '#DC2626' : 'var(--text-2)' }}>
                    <ClockCircleOutlined /> 剩 {fmtCountdown(left)}
                  </span>
                ) : (
                  <span className="muted">{fmtShortTime(a.createdAt)}</span>
                )}
              </div>
            </div>
          );
        })}
        {list.length === 0 && <div className="cf-card muted" style={{ gridColumn: 'span 2', textAlign: 'center', padding: 40 }}>该分类下暂无审批单</div>}
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        width={620}
        title={active?.title}
        footer={
          active?.status === 'pending' && role !== 'viewer' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button danger icon={<CloseOutlined />} onClick={() => setRejectOpen(true)}>
                驳回
              </Button>
              <Button type="primary" icon={<CheckOutlined />} onClick={() => active && decide(active, true)}>
                通过
              </Button>
            </div>
          ) : null
        }
      >
        {active && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <StatusTag {...APPROVAL_STATUS[active.status]} dot={false} />
              <StatusTag {...APPROVAL_TYPE[active.type]} dot={false} />
              <StatusTag {...RISK_LEVEL[active.riskLevel]} dot={false} />
              {active.jobRef && <Tag bordered={false} color="blue">{active.jobRef}</Tag>}
            </div>

            <div className="cf-card" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <UserAvatar name={active.applicant} size={32} />
                <div>
                  <div style={{ fontSize: 13 }}>{active.applicant} · {active.dept}</div>
                  <div className="muted">提交于 {fmtShortTime(active.createdAt)}</div>
                </div>
              </div>
              <div className="kv" style={{ marginBottom: 12 }}>
                <span className="kv-label">申请理由</span>
                <span className="kv-value" style={{ lineHeight: 1.8 }}>{active.reason}</span>
              </div>
              <div className="kv">
                <span className="kv-label">影响评估</span>
                <span className="kv-value">{active.impact}</span>
              </div>
            </div>

            <div className="section-title">审批流程</div>
            <Timeline
              items={active.history.map((h) => ({
                color: h.action === 'pass' ? 'green' : h.action === 'reject' ? 'red' : 'gray',
                children: (
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{h.node}</span>
                      <span className="muted">{h.approver}</span>
                    </div>
                    {h.comment && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{h.comment}</div>}
                    <div className="muted" style={{ marginTop: 2 }}>
                      {h.time ? fmtShortTime(h.time) : '等待处理'}
                    </div>
                  </div>
                ),
              }))}
            />

            {active.status === 'pending' && (
              <div className="cf-card" style={{ padding: 16 }}>
                <div className="muted" style={{ marginBottom: 8 }}>审批意见（可选）</div>
                <Input.TextArea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="填写审批意见…" />
              </div>
            )}
          </>
        )}
      </Drawer>

      <Modal
        open={rejectOpen}
        title="驳回申请"
        okText="确认驳回"
        okButtonProps={{ danger: true, disabled: reason.trim().length < 4 }}
        onCancel={() => setRejectOpen(false)}
        onOk={() => active && decide(active, false)}
      >
        <p style={{ fontSize: 13 }}>驳回后申请人需修改并重新提交，请填写驳回原因（至少 4 个字）。</p>
        <Input.TextArea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="如：数据范围过大，请拆分后重新提交" />
      </Modal>
    </div>
  );
}
