import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Drawer, Input, Tabs, Tag } from 'antd';
import { ArrowRightOutlined, StarFilled, ThunderboltOutlined } from '@ant-design/icons';
import { PageHeader, Panel, Cover } from '@/components/ui';
import { TEMPLATES, USERS } from '@/mock/seed/people';
import type { Template } from '@/types';

export default function Templates() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const [cat, setCat] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [current, setCurrent] = useState<Template | null>(null);
  const cats = ['全部', '短视频', '播客', '课程', '会议', '电商', '其他'];

  const list = TEMPLATES.filter((t) => (cat === '全部' || t.category === cat) && (!keyword || t.name.includes(keyword) || t.description.includes(keyword)));

  return (
    <div>
      <PageHeader
        title="模板市场"
        subtitle="官方与团队沉淀的流水线模板，一键套用后可继续编排"
        actions={
          <>
            <Input.Search placeholder="搜索模板" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} />
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => message.info('已提交模板创建申请，可在流水线页手动新建')}>
              贡献模板
            </Button>
          </>
        }
      />

      <Tabs activeKey={cat} onChange={setCat} items={cats.map((c) => ({ key: c, label: c }))} />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 }}>
        {list.map((t) => (
          <div key={t.id} className="panel" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setCurrent(t)}>
            <div style={{ position: 'relative' }}>
              <Cover index={t.cover} height={112} label={t.category} />
              <span
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 3,
                  background: 'rgba(0,0,0,.55)',
                  color: '#fff',
                  fontSize: 10.5,
                  padding: '2px 6px',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <StarFilled style={{ color: '#FBBF24' }} />
                {t.rating}
              </span>
            </div>
            <div style={{ padding: '10px 12px 12px' }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.name}</div>
              <div className="hint" style={{ height: 36, overflow: 'hidden', margin: '4px 0 8px' }}>{t.description}</div>
              <div className="row wrap" style={{ gap: 4, marginBottom: 8 }}>
                {t.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="chip" style={{ fontSize: 10.5 }}>{tag}</span>
                ))}
              </div>
              <div className="row between hint">
                <span>{t.author}</span>
                <span>{t.uses} 次使用</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && <Panel><div className="hint" style={{ padding: 24, textAlign: 'center' }}>没有匹配的模板</div></Panel>}

      <Drawer
        width={480}
        open={!!current}
        onClose={() => setCurrent(null)}
        title={current?.name}
        extra={
          <Button
            type="primary"
            onClick={() => {
              message.success(`已套用模板「${current?.name}」，正在打开编排画布`);
              nav('/pipelines/pl_01');
            }}
          >
            一键套用
          </Button>
        }
      >
        {current && (
          <div>
            <Cover index={current.cover} height={160} label={current.category} />
            <div className="row" style={{ gap: 12, margin: '14px 0' }}>
              <div>
                <div className="hint">评分</div>
                <div className="row" style={{ gap: 4 }}>
                  <StarFilled style={{ color: '#FBBF24' }} /> {current.rating} <span className="hint">({current.reviews})</span>
                </div>
              </div>
              <div>
                <div className="hint">使用次数</div>
                <div>{current.uses}</div>
              </div>
              <div>
                <div className="hint">作者</div>
                <div>{USERS.find((u) => u.name === current.author)?.name || current.author}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{current.description}</p>
            <div className="divider" />
            <div className="hint" style={{ marginBottom: 8 }}>节点构成</div>
            <div className="col" style={{ gap: 6 }}>
              {current.nodeSummary.map((n, i) => (
                <div key={n} className="row" style={{ gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 9, background: 'var(--bg-hover)', display: 'grid', placeItems: 'center', fontSize: 10 }}>{i + 1}</span>
                  <span>{n}</span>
                  {i < current.nodeSummary.length - 1 && <ArrowRightOutlined style={{ fontSize: 9, color: 'var(--text-tertiary)' }} />}
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="hint" style={{ marginBottom: 6 }}>适用标签</div>
            <div className="row wrap" style={{ gap: 6 }}>
              {current.tags.map((t) => (
                <Tag key={t} style={{ marginInlineEnd: 0 }}>{t}</Tag>
              ))}
            </div>
            <div className="divider" />
            <div className="hint">套用后会生成一份独立副本，修改不会影响模板本身。</div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
