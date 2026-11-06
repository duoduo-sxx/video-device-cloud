import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { App, Button, Checkbox, Dropdown, Input, Modal, Segmented, Select, Skeleton, Table } from 'antd';
import {
  AppstoreOutlined,
  DeleteOutlined,
  DownloadOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, Panel, StatusBadge, Cover, EmptyState } from '@/components/ui';
import { listAssets } from '@/services';
import { getAssets, patchAsset } from '@/mock/db';
import { USERS } from '@/mock/seed/people';
import { CAP_NAMES } from '@/mock/seed/capabilities';
import type { MediaAsset } from '@/types';
import { fmtBytes, fmtDuration, fmtRelative, fmtNum } from '@/utils/format';

const TYPE_LABEL: Record<string, string> = { video: '视频', audio: '音频', image: '图片', subtitle: '字幕', project: '工程' };
const CAP_OPTIONS = [
  { value: 'cap_asr', label: '已转写' },
  { value: 'cap_subtitle', label: '已出字幕' },
  { value: 'cap_enhance', label: '已增强' },
  { value: 'cap_review', label: '已审核' },
];

export default function Assets() {
  const nav = useNavigate();
  const { message, modal } = App.useApp();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [selected, setSelected] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  const [keyword, setKeyword] = useState(params.get('kw') || '');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState(params.get('status') || 'all');
  const [capability, setCapability] = useState('all');
  const [duration, setDuration] = useState('all');
  const [project, setProject] = useState('all');
  const [sort, setSort] = useState('recent');

  const projects = useMemo(() => Array.from(new Set(getAssets().map((a) => a.project))), []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listAssets({ keyword, type, status, capability, duration, project, sort, page, pageSize });
    setList(res.list);
    setTotal(res.total);
    setLoading(false);
  }, [keyword, type, status, capability, duration, project, sort, page, pageSize, tick]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) next.set('kw', keyword);
    if (status !== 'all') next.set('status', status);
    setParams(next, { replace: true });
  }, [keyword, status, setParams]);

  const selectedAssets = useMemo(() => getAssets().filter((a) => selected.includes(a.id)), [selected, list]);
  const selectedSeconds = selectedAssets.reduce((s, a) => s + a.duration, 0);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const batch = (label: string) => {
    message.success(`已提交「${label}」，共 ${selected.length} 个素材，可在任务中心查看进度`);
    setSelected([]);
  };

  const removeAsset = (ids: string[]) => {
    modal.confirm({
      title: `确认删除 ${ids.length} 个素材？`,
      content: '删除后将从项目与流水线中移除，关联的字幕轨与 AI 结果一并失效。此操作不可撤销。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        ids.forEach((id) => patchAsset(id, { status: 'archived' }));
        message.success(`已归档 ${ids.length} 个素材（演示环境不做物理删除）`);
        setSelected([]);
        setTick((t) => t + 1);
      },
    });
  };

  const columns: ColumnsType<MediaAsset> = [
    {
      title: '',
      width: 34,
      render: (_, r) => <Checkbox checked={selected.includes(r.id)} onChange={() => toggle(r.id)} onClick={(e) => e.stopPropagation()} />,
    },
    {
      title: '素材',
      render: (_, r) => (
        <div className="row" style={{ gap: 10 }}>
          <div className={`cover cover-${r.cover % 8}`} style={{ width: 56, height: 34, borderRadius: 5, flex: '0 0 56px' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>{r.title}</div>
            <div className="hint">{r.project}</div>
          </div>
        </div>
      ),
    },
    { title: '类型', dataIndex: 'type', width: 62, render: (v) => TYPE_LABEL[v] },
    { title: '时长', width: 76, render: (_, r) => <span className="num">{r.duration ? fmtDuration(r.duration) : '—'}</span> },
    { title: '分辨率', width: 96, render: (_, r) => (r.width ? `${r.width}×${r.height}` : '—') },
    { title: '大小', width: 78, render: (_, r) => <span className="num">{fmtBytes(r.sizeBytes)}</span> },
    { title: '状态', width: 88, render: (_, r) => <StatusBadge status={r.status} /> },
    {
      title: 'AI 处理',
      width: 130,
      render: (_, r) =>
        r.capabilities.length ? (
          <span className="row wrap" style={{ gap: 3 }}>
            {r.capabilities.slice(0, 2).map((c) => (
              <span key={c} className="chip">
                {CAP_NAMES[c]}
              </span>
            ))}
            {r.capabilities.length > 2 && <span className="chip">+{r.capabilities.length - 2}</span>}
          </span>
        ) : (
          <span className="hint">未处理</span>
        ),
    },
    { title: '创建人', width: 76, render: (_, r) => USERS.find((u) => u.id === r.ownerId)?.name },
    { title: '更新时间', width: 84, render: (_, r) => <span className="hint">{fmtRelative(r.updatedAt)}</span> },
    {
      title: '',
      width: 46,
      render: (_, r) => (
        <Dropdown
          menu={{
            items: [
              { key: 'asr', label: '发起语音转写' },
              { key: 'sub', label: '生成字幕' },
              { key: 'enh', label: '画质增强' },
              { key: 'rev', label: '内容审核' },
              { type: 'divider' },
              { key: 'del', label: '归档删除', danger: true },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === 'del') removeAsset([r.id]);
              else if (key === 'sub') nav(`/tools/subtitle/${r.id}`);
              else if (key === 'asr') nav('/tools/asr');
              else if (key === 'enh') nav('/tools/enhance');
              else nav('/tools/review');
            },
          }}
        >
          <Button type="text" size="small" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="媒体资产"
        subtitle={`共 ${fmtNum(total)} 个素材 · 覆盖 5 类资产 · 自动同步 AI 处理结果`}
        actions={
          <>
            <Button icon={<ReloadOutlined />} onClick={() => setTick((t) => t + 1)}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => message.success('已生成导出清单（CSV），请稍后到下载中心查看')}>
              导出清单
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => nav('/upload')}>
              上传素材
            </Button>
          </>
        }
      />

      <Panel style={{ marginBottom: 14 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <Input
            allowClear
            placeholder="搜索名称、标签、项目"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            style={{ width: 240 }}
          />
          <Select
            value={type}
            onChange={(v) => {
              setType(v);
              setPage(1);
            }}
            style={{ width: 110 }}
            options={[
              { value: 'all', label: '全部类型' },
              { value: 'video', label: '视频' },
              { value: 'audio', label: '音频' },
              { value: 'image', label: '图片' },
              { value: 'subtitle', label: '字幕' },
              { value: 'project', label: '工程' },
            ]}
          />
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            style={{ width: 110 }}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'ready', label: '已就绪' },
              { value: 'processing', label: '处理中' },
              { value: 'pending_review', label: '待审核' },
              { value: 'archived', label: '已归档' },
              { value: 'failed', label: '失败' },
            ]}
          />
          <Select
            value={capability}
            onChange={(v) => {
              setCapability(v);
              setPage(1);
            }}
            style={{ width: 118 }}
            options={[{ value: 'all', label: '全部能力' }, ...CAP_OPTIONS]}
          />
          <Select
            value={duration}
            onChange={(v) => {
              setDuration(v);
              setPage(1);
            }}
            style={{ width: 118 }}
            options={[
              { value: 'all', label: '全部时长' },
              { value: '<1m', label: '1 分钟以内' },
              { value: '1-5m', label: '1–5 分钟' },
              { value: '5-30m', label: '5–30 分钟' },
              { value: '>30m', label: '30 分钟以上' },
            ]}
          />
          <Select value={project} onChange={setProject} style={{ width: 160 }} options={[{ value: 'all', label: '全部项目' }, ...projects.map((p) => ({ value: p, label: p }))]} />
          <Select
            value={sort}
            onChange={setSort}
            style={{ width: 124 }}
            options={[
              { value: 'recent', label: '最近修改' },
              { value: 'duration', label: '按时长排序' },
              { value: 'size', label: '按大小排序' },
              { value: 'name', label: '按名称排序' },
            ]}
          />
          <div className="spacer" style={{ flex: 1 }} />
          <Segmented
            value={view}
            onChange={(v) => setView(v as 'grid' | 'list')}
            options={[
              { value: 'grid', icon: <AppstoreOutlined /> },
              { value: 'list', icon: <UnorderedListOutlined /> },
            ]}
          />
        </div>
      </Panel>

      {loading ? (
        <Panel>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Panel>
      ) : list.length === 0 ? (
        <Panel>
          <EmptyState
            title="没有匹配的素材"
            desc="试试调整筛选条件，或上传新的音视频文件开始处理。"
            action={
              <Button type="primary" onClick={() => nav('/upload')}>
                去上传
              </Button>
            }
          />
        </Panel>
      ) : view === 'grid' ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(232px, 1fr))' }}>
          {list.map((a) => {
            const owner = USERS.find((u) => u.id === a.ownerId);
            return (
              <div
                key={a.id}
                className="asset-card"
                onClick={() => nav(`/assets/${a.id}`)}
                style={selected.includes(a.id) ? { borderColor: 'var(--brand)', boxShadow: '0 0 0 2px var(--brand-soft)' } : undefined}
              >
                <div className={`thumb cover cover-${a.cover % 8}`}>
                  <span className="res">{a.width ? `${a.width}×${a.height}` : TYPE_LABEL[a.type]}</span>
                  <span className="dur">{a.duration ? fmtDuration(a.duration) : TYPE_LABEL[a.type]}</span>
                  <div style={{ position: 'absolute', left: 8, top: 30, zIndex: 3 }} onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.includes(a.id)} onChange={() => toggle(a.id)} />
                  </div>
                  <span className="cover-label">{a.project}</span>
                </div>
                <div className="body">
                  <div className="title">{a.title}</div>
                  <div className="row" style={{ gap: 5, marginBottom: 8 }}>
                    <StatusBadge status={a.status} />
                    {a.capabilities.length > 0 && (
                      <span className="chip" style={{ fontSize: 10.5 }}>
                        {a.capabilities.length} 项 AI 处理
                      </span>
                    )}
                  </div>
                  <div className="meta">
                    <span>{owner?.name}</span>
                    <span>·</span>
                    <span>{fmtBytes(a.sizeBytes)}</span>
                    <span>·</span>
                    <span>{fmtRelative(a.updatedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Panel noPad>
          <Table
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list}
            onRow={(r) => ({ onClick: () => nav(`/assets/${r.id}`), style: { cursor: 'pointer' } })}
            pagination={{ current: page, pageSize, total, showSizeChanger: true, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }}
          />
        </Panel>
      )}

      {view === 'grid' && total > pageSize && (
        <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
          <Button
            onClick={() => {
              setPage((p) => p + 1);
              setPageSize((s) => s + 24);
            }}
            disabled={list.length >= total}
          >
            加载更多（已显示 {list.length} / {total}）
          </Button>
        </div>
      )}

      {selected.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12.5 }}>
            已选 <b>{selected.length}</b> 项 · 合计时长 <b>{fmtDuration(selectedSeconds)}</b>
          </span>
          <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
          <Button size="small" onClick={() => batch('批量语音转写')}>
            批量转写
          </Button>
          <Button size="small" onClick={() => batch('批量生成字幕')}>
            批量出字幕
          </Button>
          <Button size="small" onClick={() => batch('批量内容审核')}>
            批量审核
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: 'pl1', label: '加入「发布会多语分发」' },
                { key: 'pl2', label: '加入「短视频一键成片」' },
                { key: 'pl3', label: '加入「课程字幕标准化」' },
              ],
              onClick: ({ key }) => batch(`加入流水线 ${key}`),
            }}
          >
            <Button size="small">加入流水线</Button>
          </Dropdown>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeAsset(selected)}>
            删除
          </Button>
          <Button size="small" type="text" onClick={() => setSelected([])}>
            取消
          </Button>
        </div>
      )}
    </div>
  );
}
