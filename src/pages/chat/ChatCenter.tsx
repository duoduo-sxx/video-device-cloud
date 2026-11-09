import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card, List, Input, Button, Tag, Tooltip, Space, Empty, Dropdown, Popconfirm, Modal, Typography,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, SendOutlined, CopyOutlined, LikeOutlined, DislikeOutlined,
  RedoOutlined, StopOutlined, ExportOutlined, EditOutlined, DeleteOutlined, FlagOutlined,
  RobotOutlined, UserOutlined, FieldTimeOutlined, DownloadOutlined,
} from '@ant-design/icons';
import * as api from '@/api';
import { useAppStore } from '@/store/app';
import type { Message, Session } from '@/types';
import { analyzeText } from '@/mock/nlp';

const groupByDate = (sessions: Session[]) => {
  const today = new Date().toDateString();
  const yest = new Date(Date.now() - 86400000).toDateString();
  const groups: Record<string, Session[]> = { 今天: [], 昨天: [], 更早: [] };
  sessions.forEach((s) => {
    const d = new Date(s.updatedAt.replace(/-/g, '/')).toDateString();
    if (d === today) groups['今天'].push(s);
    else if (d === yest) groups['昨天'].push(s);
    else groups['更早'].push(s);
  });
  return groups;
};

const ChatCenter: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState<{ msgId: string; shown: string } | null>(null);
  const [renaming, setRenaming] = useState<Session | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const active = sessions.find((s) => s.id === activeId);

  const load = async (kw = keyword) => {
    const res = await api.listSessions(kw);
    setSessions(res.data);
    if (!res.data.find((s) => s.id === activeId)) setActiveId(res.data[0]?.id ?? '');
  };
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [active?.messages.length, streaming]);

  const messages = useMemo<Message[]>(() => {
    if (!active) return [];
    if (streaming) {
      const idx = active.messages.findIndex((m) => m.id === streaming.msgId);
      if (idx >= 0) {
        const clone = [...active.messages];
        clone[idx] = { ...clone[idx], content: streaming.shown };
        return clone;
      }
    }
    return active.messages;
  }, [active, streaming]);

  const doStream = (msg: Message) => {
    if (streamTimer.current) clearInterval(streamTimer.current);
    let i = 0;
    setStreaming({ msgId: msg.id, shown: '' });
    streamTimer.current = setInterval(() => {
      i += 1 + Math.floor(Math.random() * 3);
      const shown = msg.content.slice(0, i);
      if (i >= msg.content.length) {
        clearInterval(streamTimer.current!);
        streamTimer.current = null;
        setStreaming(null);
      } else {
        setStreaming({ msgId: msg.id, shown });
      }
    }, 18);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !active || streaming) return;
    setInput('');
    const res = await api.sendMessage(active.id, text, user?.name ?? '我');
    if (res.code === 0) {
      await load();
      doStream(res.data.botMsg);
    }
  };

  const stopStream = () => {
    if (streamTimer.current) clearInterval(streamTimer.current);
    streamTimer.current = null;
    setStreaming(null);
  };

  const regenerate = () => {
    if (!active || streaming) return;
    const lastUser = [...active.messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    void (async () => {
      const res = await api.sendMessage(active.id, lastUser.content, user?.name ?? '我');
      if (res.code === 0) {
        await load();
        doStream(res.data.botMsg);
      }
    })();
  };

  const handleRate = async (m: Message, fb: 'up' | 'down') => {
    if (!active) return;
    await api.rateMessage(active.id, m.id, fb);
    await load();
  };

  const newSession = async () => {
    const res = await api.createSession('新会话', user?.name ?? '我');
    await load();
    setActiveId(res.data.id);
  };

  const removeSession = async (id: string) => {
    await api.deleteSession(id);
    await load();
  };

  const exportMd = () => {
    if (!active) return;
    const md = `# 会话记录：${active.title}\n\n` +
      active.messages.map((m) => `**${m.role === 'user' ? active.userName : '小智机器人'}** (${m.time})\n\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `会话-${active.title}.md`;
    a.click();
  };

  const groups = groupByDate(sessions);
  const entities = useMemo(() => (active ? analyzeText(active.messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ')).entities : []), [active]);
  const intentsFlow = useMemo(
    () => (active ? active.messages.filter((m) => m.role === 'bot' && m.intent).map((m) => ({ intent: m.intent!, time: m.time, conf: m.confidence ?? 0 })) : []),
    [active],
  );

  const renderMsg = (m: Message) => {
    const isUser = m.role === 'user';
    const showCursor = streaming?.msgId === m.id;
    return (
      <div key={m.id} className={`chat-msg ${m.role}`}>
        {isUser ? (
          <>
            <div style={{ textAlign: 'right' }}>
              <div className="chat-bubble">{m.content}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{m.time}</div>
            </div>
            <AvatarUser />
          </>
        ) : (
          <>
            <AvatarBot />
            <div style={{ textAlign: 'left', maxWidth: '72%' }}>
              <div className="chat-bubble">
                <span className={showCursor ? 'cursor-blink' : ''}>{m.content}</span>
              </div>
              <Space size={6} wrap style={{ marginTop: 4 }}>
                {m.intent ? <Tag color="blue">{m.intent}</Tag> : <Tag color="orange">低置信度兜底</Tag>}
                {m.confidence != null && <Tag color={m.confidence > 70 ? 'green' : 'red'}>置信度 {m.confidence}%</Tag>}
                {m.latency != null && <Tag icon={<FieldTimeOutlined />}>{m.latency}ms</Tag>}
                {m.sentiment && <Tag color={m.sentiment === '负面' ? 'volcano' : m.sentiment === '正面' ? 'green' : 'default'}>{m.sentiment}</Tag>}
                <Tooltip title="复制"><CopyOutlined onClick={() => { navigator.clipboard.writeText(m.content); }} style={{ color: '#999' }} /></Tooltip>
                <Tooltip title="赞"><LikeOutlined onClick={() => handleRate(m, 'up')} style={{ color: m.feedback === 'up' ? '#2563EB' : '#999' }} /></Tooltip>
                <Tooltip title="踩"><DislikeOutlined onClick={() => handleRate(m, 'down')} style={{ color: m.feedback === 'down' ? '#cf1322' : '#999' }} /></Tooltip>
              </Space>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{m.time}</div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 120px)' }}>
      {/* 左：会话列表 */}
      <Card size="small" style={{ width: 280, display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, overflow: 'auto', padding: 8 }}>
        <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索会话" value={keyword}
            onChange={(e) => { setKeyword(e.target.value); void load(e.target.value); }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={newSession} title="新建会话" />
        </Space.Compact>
        {Object.entries(groups).map(([g, list]) =>
          list.length === 0 ? null : (
            <div key={g}>
              <div style={{ fontSize: 12, color: '#999', margin: '8px 4px' }}>{g}</div>
              <List
                size="small"
                dataSource={list}
                renderItem={(s) => (
                  <div
                    onClick={() => setActiveId(s.id)}
                    style={{
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                      background: s.id === activeId ? 'rgba(37,99,235,.12)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: s.id === activeId ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.title}</span>
                      <Dropdown
                        menu={{
                          items: [
                            { key: 'rename', icon: <EditOutlined />, label: '重命名', onClick: () => { setRenaming(s); setRenameValue(s.title); } },
                            { key: 'del', danger: true, icon: <DeleteOutlined />, label: '删除' },
                          ],
                          onClick: ({ key, domEvent }) => { domEvent.stopPropagation(); if (key === 'del') Modal.confirm({ title: '确认删除该会话？', onOk: () => removeSession(s.id), content: '删除后不可恢复（可通过头像菜单重置演示数据还原）' }); },
                        }}
                      >
                        <span onClick={(e) => e.stopPropagation()} style={{ color: '#999' }}>⋯</span>
                      </Dropdown>
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>{s.userName} · {s.channel} · {s.updatedAt.slice(5, 16)}</div>
                  </div>
                )}
              />
            </div>
          ),
        )}
      </Card>

      {/* 中：对话区 */}
      <Card size="small" style={{ flex: 1, display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
        <div style={{ borderBottom: '1px solid rgba(128,128,128,.2)', paddingBottom: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text strong>{active?.title ?? '选择一个会话'}</Typography.Text>
          <Space>
            <Button size="small" icon={<ExportOutlined />} onClick={exportMd} disabled={!active}>导出 Markdown</Button>
            <Button size="small" icon={<RedoOutlined />} onClick={regenerate} disabled={!active || !!streaming}>重新生成</Button>
            {streaming && <Button size="small" danger icon={<StopOutlined />} onClick={stopStream}>停止生成</Button>}
          </Space>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {messages.length === 0 ? (
            <Empty description="暂无消息，发送一条开始对话吧" style={{ marginTop: 80 }} />
          ) : (
            messages.map(renderMsg)
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ borderTop: '1px solid rgba(128,128,128,.2)', paddingTop: 8 }}>
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); void handleSend(); } }}
            maxLength={500}
            showCount
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: '#999' }}>内容由 Mock 意图库匹配生成，仅供演示</span>
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!input.trim() || !!streaming}>发送</Button>
          </div>
        </div>
      </Card>

      {/* 右：详情栏 */}
      <Card size="small" style={{ width: 260, overflow: 'auto' }} bodyStyle={{ padding: 12 }}>
        <Typography.Text strong>会话信息</Typography.Text>
        <div style={{ fontSize: 12, color: '#888', margin: '6px 0 12px' }}>
          <div>用户：{active?.userName ?? '-'}</div>
          <div>渠道：{active?.channel ?? '-'}</div>
          <div>创建：{active?.createdAt ?? '-'}</div>
          <div>消息数：{active?.messages.length ?? 0}</div>
        </div>
        <Typography.Text strong>识别实体</Typography.Text>
        <div style={{ margin: '6px 0 12px' }}>
          {entities.length === 0 ? <span style={{ color: '#bbb', fontSize: 12 }}>暂无</span> :
            entities.slice(0, 8).map((e, i) => <Tag key={i} color="geekblue">{e.type}：{e.text}</Tag>)}
        </div>
        <Typography.Text strong>意图流转</Typography.Text>
        <div style={{ margin: '6px 0 12px' }}>
          {intentsFlow.length === 0 ? <span style={{ color: '#bbb', fontSize: 12 }}>暂无</span> :
            intentsFlow.map((f, i) => (
              <div key={i} style={{ borderLeft: '2px solid #2563EB', paddingLeft: 8, marginBottom: 8, fontSize: 12 }}>
                <div>{f.intent} <Tag style={{ fontSize: 10 }} color="green">{f.conf}%</Tag></div>
                <div style={{ color: '#999' }}>{f.time}</div>
              </div>
            ))}
        </div>
        <Button block icon={<FlagOutlined />} disabled={!active}>标记为 Badcase</Button>
      </Card>

      <Modal
        open={!!renaming} title="重命名会话" okText="保存" cancelText="取消"
        onOk={async () => { if (renaming) { await api.updateSession(renaming.id, { title: renameValue }); setRenaming(null); await load(); } }}
        onCancel={() => setRenaming(null)}
      >
        <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} maxLength={30} />
      </Modal>
    </div>
  );
};

const AvatarBot = () => (
  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
    <RobotOutlined />
  </div>
);
const AvatarUser = () => (
  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0d9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 10, flexShrink: 0 }}>
    <UserOutlined />
  </div>
);

export default ChatCenter;
