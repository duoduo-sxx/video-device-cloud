import { useState } from 'react';
import { Bell, CheckCheck, CircleAlert, FileSignature, Info } from 'lucide-react';
import { Button, Tag } from '@/components/ui/core';
import { PageHeader } from '@/components/ui/page';
import { Tabs } from '@/components/ui/data';
import { db } from '@/mock/api';
import { fromNow } from '@/utils/format';
import { cn } from '@/utils/cn';

export default function Notifications() {
  const [tab, setTab] = useState('all');
  const [list, setList] = useState(db.notifications);

  const filtered = tab === 'all' ? list : list.filter((n) => n.type === tab);
  const unread = list.filter((n) => !n.read).length;

  const iconOf = (t: string) =>
    t === 'system' ? <Info size={14} className="text-[var(--brand-2)]" /> : t === 'audit' ? <CircleAlert size={14} className="text-[var(--warn)]" /> : <FileSignature size={14} className="text-[#9CC2FF]" />;

  return (
    <div className="page">
      <PageHeader
        title="消息中心"
        desc={`${unread} 条未读消息`}
        actions={<Button icon={<CheckCheck size={14} />} onClick={() => setList(list.map((n) => ({ ...n, read: true })))}>全部标为已读</Button>}
      />

      <div className="card">
        <div className="px-5 pt-4">
          <Tabs
            active={tab}
            onChange={setTab}
            items={[
              { key: 'all', label: '全部', count: list.length },
              { key: 'biz', label: '业务通知', count: list.filter((n) => n.type === 'biz').length },
              { key: 'audit', label: '审核结果', count: list.filter((n) => n.type === 'audit').length },
              { key: 'system', label: '系统消息', count: list.filter((n) => n.type === 'system').length },
            ]}
          />
        </div>
        <div>
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => setList(list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
              className={cn('flex w-full items-start gap-3.5 border-b border-[var(--stroke)] px-5 py-4 text-left transition-colors hover:bg-white/[0.03] last:border-b-0', !n.read && 'bg-[rgba(61,125,255,.035)]')}
            >
              <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-[7px] bg-white/5">{iconOf(n.type)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] text-[var(--text-1)]">{n.title}</span>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />}
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-3)]">{n.content}</p>
              </div>
              <span className="flex-none text-[10.5px] text-[var(--text-3)]">{fromNow(n.time)}</span>
            </button>
          ))}
          {!filtered.length && (
            <div className="py-20 text-center">
              <Bell size={28} className="mx-auto text-[var(--text-3)]" />
              <div className="mt-3 text-[12.5px] text-[var(--text-2)]">暂无消息</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Tag tone="gray">提示</Tag>
        <span className="text-[11px] text-[var(--text-3)]">消息保留 90 天，重要通知会同步发送短信。</span>
      </div>
    </div>
  );
}
