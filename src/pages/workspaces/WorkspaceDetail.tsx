import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Button,
  Input,
  Modal,
  Result,
  Select,
  Table,
  Tabs,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  LockOutlined,
  PlusOutlined,
  TeamOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { workspaceService } from '../../services';
import type { Dataset, Member, Workspace, WorkspaceRole } from '../../types';
import { formatRelative } from '../../utils/format';
import { toast } from '../../utils/feedback';
import { useAuthStore } from '../../store/useAuthStore';

const ROLE_LABEL: Record<WorkspaceRole, string> = { owner: '所有者', editor: '可编辑', viewer: '只读' };
const AVATAR_COLORS = ['#1668FF', '#00B894', '#7C5CFF', '#F59E0B', '#0EA5E9', '#EF4444'];

export default function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { name } = useAuthStore();
  const [ws, setWs] = useState<Workspace | undefined>();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState<string>();
  const [comment, setComment] = useState('');
  const [activities, setActivities] = useState<{ user: string; action: string; target: string; time: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const [w, ds] = await Promise.all([workspaceService.get(id), workspaceService.datasets(id)]);
      setWs(w);
      setDatasets(ds);
      setMembers(w?.members ?? []);
      setActivities([
        { user: '周野', action: '上传了新数据集', target: '订单事实表 v3.2', time: new Date(Date.now() - 3600_000).toISOString() },
        { user: '张沐', action: '引用了数据集', target: '模型特征快照', time: new Date(Date.now() - 7200_000).toISOString() },
        { user: '苏芮', action: '修改了成员权限', target: '李澈 → 只读', time: new Date(Date.now() - 86400_000).toISOString() },
        { user: '林清', action: '创建了传输任务', target: '华东1-新加坡 订单库增量同步', time: new Date(Date.now() - 172800_000).toISOString() },
      ]);
      setLoading(false);
    })();
  }, [id]);

  const myRole = useMemo(() => members.find((m) => m.name === name)?.role, [members, name]);
  const canEdit = myRole !== 'viewer';

  if (!loading && !ws) {
    return (
      <div className="page">
        <Result status="404" title="空间不存在" subTitle="该协同空间可能已被删除。" extra={<Button type="primary" onClick={() => navigate('/workspaces')}>返回列表</Button>} />
      </div>
    );
  }

  const dsColumns: ColumnsType<Dataset> = [
    {
      title: '数据集',
      dataIndex: 'name',
      render: (v, r) => (
        <div className="stack">
          <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
          <span className="mono" style={{ fontSize: 11, color: '#8A99B0' }}>{r.id}</span>
        </div>
      ),
    },
    { title: '类型', dataIndex: 'type', width: 130 },
    { title: '来源节点', dataIndex: 'sourceNode', width: 140, render: (v) => <span className="mono" style={{ fontSize: 12 }}>{v}</span> },
    { title: '大小', dataIndex: 'sizeGB', width: 100, render: (v) => <span className="num">{v} GB</span> },
    {
      title: '版本',
      dataIndex: 'version',
      width: 90,
      render: (v, r) => (
        <span>
          {v} {r.sensitive ? <Tag color="error" style={{ marginInlineEnd: 0, fontSize: 10 }}>涉敏</Tag> : null}
        </span>
      ),
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 120, render: (v) => <span style={{ fontSize: 12 }}>{formatRelative(v)}</span> },
    {
      title: '操作',
      key: 'act',
      width: 120,
      render: (_, r) => (
        <span className="link" style={{ fontSize: 12.5 }} onClick={() => toast.success(`已开始下载 ${r.name}（演示）`)}>
          <DownloadOutlined /> 下载
        </span>
      ),
    },
  ];

  const memberColumns: ColumnsType<Member> = [
    {
      title: '成员',
      dataIndex: 'name',
      render: (v, r, i) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={28} style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], fontSize: 12 }}>
            {v.slice(0, 1)}
          </Avatar>
          <div className="stack">
            <span style={{ fontSize: 13 }}>{v}</span>
            <span style={{ fontSize: 11, color: '#8A99B0' }}>{r.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: '空间角色',
      dataIndex: 'role',
      width: 150,
      render: (v: WorkspaceRole, r) =>
        r.role === 'owner' ? (
          <Tag color="gold" style={{ marginInlineEnd: 0 }}>所有者</Tag>
        ) : (
          <Select
            size="small"
            value={v}
            style={{ width: 100 }}
            disabled={!canEdit}
            options={[
              { value: 'editor', label: '可编辑' },
              { value: 'viewer', label: '只读' },
            ]}
            onChange={(next) => {
              setMembers((prev) => prev.map((m) => (m.email === r.email ? { ...m, role: next } : m)));
              toast.success(`已将 ${r.name} 设为${ROLE_LABEL[next]}`);
            }}
          />
        ),
    },
    { title: '加入时间', dataIndex: 'joinedAt', width: 140, render: (v) => <span style={{ fontSize: 12 }}>{formatRelative(v)}</span> },
    {
      title: '操作',
      key: 'act',
      width: 90,
      render: (_, r) =>
        r.role === 'owner' ? (
          <span style={{ fontSize: 12, color: '#B0BCCD' }}>—</span>
        ) : (
          <span
            className="link"
            style={{ fontSize: 12.5, color: canEdit ? '#EF4444' : '#C9D6E8' }}
            onClick={() => {
              if (!canEdit) {
                toast.warning('你在此空间没有管理权限');
                return;
              }
              Modal.confirm({
                title: `移除成员 ${r.name}？`,
                content: '移除后该成员将立即失去空间内所有数据集的访问权限。',
                okText: '确认移除',
                okButtonProps: { danger: true },
                cancelText: '取消',
                onOk: () => {
                  setMembers((prev) => prev.filter((m) => m.email !== r.email));
                  toast.success('成员已移除');
                },
              });
            }}
          >
            移除
          </span>
        ),
    },
  ];

  return (
    <div className="page">
      <div style={{ marginBottom: 14 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/workspaces')} style={{ paddingLeft: 0 }}>
          返回协同空间
        </Button>
      </div>

      <PageHeader
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {ws?.name ?? '加载中…'}
            {ws ? (
              <Tag style={{ marginInlineEnd: 0, fontSize: 11 }} icon={ws.visibility === 'public' ? <UnlockOutlined /> : <LockOutlined />}>
                {ws.visibility === 'public' ? '公开空间' : '私有空间'}
              </Tag>
            ) : null}
          </span>
        }
        description={ws?.description}
        extra={
          <>
            {!canEdit ? <Tag color="warning" style={{ marginInlineEnd: 0 }}>只读权限</Tag> : null}
            <Button icon={<CloudUploadOutlined />} disabled={!canEdit} onClick={() => toast.info('上传数据集（演示占位）')}>
              上传数据集
            </Button>
            <Button type="primary" icon={<PlusOutlined />} disabled={!canEdit} onClick={() => setInviteOpen(true)}>
              邀请成员
            </Button>
          </>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard title="成员" value={String(members.length)} unit="人" deltaLabel={`${members.filter((m) => m.role === 'editor').length} 人可编辑`} icon={<TeamOutlined />} />
        <StatCard title="数据集" value={String(datasets.length)} unit="个" deltaLabel="本周新增 2 个" icon={<DatabaseOutlined />} iconColor="#7C5CFF" iconBg="#F1EEFF" />
        <StatCard title="容量使用" value={((ws?.usedGB ?? 0) / 1024).toFixed(2)} unit="TB" deltaLabel={`配额 ${((ws?.quotaGB ?? 0) / 1024).toFixed(0)} TB`} icon={<CloudUploadOutlined />} iconColor="#F59E0B" iconBg="#FFF6E6" />
        <StatCard title="本月传输" value="3.2" unit="TB" delta={8.4} icon={<DownloadOutlined />} iconColor="#00B894" iconBg="#E6F8F3" />
      </div>

      <div className="panel">
        <Tabs
          items={[
            {
              key: 'datasets',
              label: `数据集（${datasets.length}）`,
              children: (
                <Table<Dataset>
                  rowKey="id"
                  size="middle"
                  loading={loading}
                  columns={dsColumns}
                  dataSource={datasets}
                  pagination={{ pageSize: 6, size: 'small' }}
                />
              ),
            },
            {
              key: 'members',
              label: `成员（${members.length}）`,
              children: (
                <Table<Member>
                  rowKey="email"
                  size="middle"
                  columns={memberColumns}
                  dataSource={members}
                  pagination={false}
                />
              ),
            },
            {
              key: 'activity',
              label: '协作动态',
              children: (
                <div style={{ maxWidth: 820 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <Avatar size={30} style={{ background: '#1668FF', flex: '0 0 auto' }}>
                      {name.slice(0, 1)}
                    </Avatar>
                    <Input.TextArea
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="分享进展、提出数据问题，或 @ 成员…"
                      disabled={!canEdit}
                    />
                    <Button
                      type="primary"
                      disabled={!canEdit || !comment.trim()}
                      onClick={() => {
                        setActivities((prev) => [
                          { user: name, action: '发表了动态', target: comment.trim(), time: new Date().toISOString() },
                          ...prev,
                        ]);
                        setComment('');
                        toast.success('动态已发布');
                      }}
                    >
                      发布
                    </Button>
                  </div>

                  {activities.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 18, position: 'relative' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Avatar size={30} style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], fontSize: 12 }}>
                          {a.user.slice(0, 1)}
                        </Avatar>
                        {i !== activities.length - 1 ? (
                          <div style={{ width: 1, flex: 1, background: '#EEF2F8', marginTop: 6 }} />
                        ) : null}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5 }}>
                          <b style={{ fontWeight: 500 }}>{a.user}</b>
                          <span style={{ color: '#8A99B0' }}> {a.action} </span>
                          <span style={{ color: '#1668FF' }}>{a.target}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#B0BCCD', marginTop: 4 }}>{formatRelative(a.time)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title="邀请成员"
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        onOk={() => {
          if (!inviteName) {
            toast.warning('请选择要邀请的成员');
            return;
          }
          if (members.some((m) => m.name === inviteName)) {
            toast.warning('该成员已在空间中');
            return;
          }
          setMembers((prev) => [
            ...prev,
            { name: inviteName, email: `${inviteName}@xinglan-tech.com`, role: 'viewer', joinedAt: new Date().toISOString() },
          ]);
          setInviteName(undefined);
          setInviteOpen(false);
          toast.success(`已邀请 ${inviteName} 加入空间`);
        }}
        okText="发送邀请"
        destroyOnClose
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12.5, color: '#5A6B87', marginBottom: 8 }}>选择成员（默认授予只读权限，可在成员列表中调整）</div>
          <Select
            style={{ width: '100%' }}
            placeholder="按姓名搜索"
            showSearch
            value={inviteName}
            onChange={setInviteName}
            options={['张沐', '李澈', '王砚', '赵岑', '钱屿', '孙禾', '吴桐', '许知远']
              .filter((n) => !members.some((m) => m.name === n))
              .map((n) => ({ value: n, label: n }))}
          />
        </div>
      </Modal>
    </div>
  );
}
