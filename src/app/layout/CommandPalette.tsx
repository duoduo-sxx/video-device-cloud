import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, FileText, FolderKanban, LifeBuoy, Search } from 'lucide-react';
import { ALL_NAV_ITEMS } from '../nav';
import { projects, tickets } from '@/mock';

interface CmdItem {
  id: string;
  group: string;
  title: string;
  sub?: string;
  path: string;
  icon: typeof FileText;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo<CmdItem[]>(() => {
    const pages: CmdItem[] = ALL_NAV_ITEMS.map((n) => ({
      id: `page-${n.key}`,
      group: '页面',
      title: n.label,
      sub: n.path,
      path: n.path,
      icon: FileText,
    }));
    const projs: CmdItem[] = projects.map((p) => ({
      id: `proj-${p.id}`,
      group: '项目',
      title: p.name,
      sub: `${p.id} · ${p.code}`,
      path: `/projects/${p.id}`,
      icon: FolderKanban,
    }));
    const tks: CmdItem[] = tickets.slice(0, 40).map((t) => ({
      id: `tk-${t.id}`,
      group: '工单',
      title: t.title,
      sub: t.id,
      path: `/support/tickets/${t.id}`,
      icon: LifeBuoy,
    }));
    const all = [...pages, ...projs, ...tks];
    if (!q.trim()) return all.slice(0, 24);
    const kw = q.toLowerCase();
    return all.filter((i) => i.title.toLowerCase().includes(kw) || (i.sub ?? '').toLowerCase().includes(kw)).slice(0, 30);
  }, [q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  if (!open) return null;

  const grouped = items.reduce<Record<string, CmdItem[]>>((acc, item) => {
    (acc[item.group] = acc[item.group] ?? []).push(item);
    return acc;
  }, {});

  const flat = Object.values(grouped).flat();

  const go = (item: CmdItem) => {
    navigate(item.path);
    onClose();
  };

  return (
    <div className="np-cmdk-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="np-cmdk" onClick={(e) => e.stopPropagation()}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 16, top: 15, color: 'var(--np-text-tertiary)' }}
          />
          <input
            ref={inputRef}
            className="np-cmdk-input"
            style={{ paddingLeft: 42 }}
            placeholder="搜索页面、项目、工单号…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((v) => Math.min(v + 1, flat.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((v) => Math.max(v - 1, 0));
              }
              if (e.key === 'Enter') {
                const item = flat[active];
                if (item) go(item);
              }
            }}
          />
        </div>
        <div className="np-cmdk-list">
          {flat.length === 0 && <div className="np-cmdk-empty">没有匹配结果</div>}
          {Object.entries(grouped).map(([group, list]) => (
            <div key={group}>
              <div className="np-cmdk-group">{group}</div>
              {list.map((item) => {
                const idx = flat.indexOf(item);
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`np-cmdk-item ${idx === active ? 'active' : ''}`}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(item)}
                  >
                    <Icon size={14} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    {item.sub && (
                      <span style={{ fontSize: 11, color: 'var(--np-text-disabled)' }}>{item.sub}</span>
                    )}
                    {idx === active && <CornerDownLeft size={12} style={{ color: 'var(--np-text-tertiary)' }} />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
