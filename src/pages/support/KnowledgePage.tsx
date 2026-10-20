import { useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import { BookOpen, ChevronRight, Search, ThumbsUp } from 'lucide-react';
import type { KnowledgeNode } from '@/mock';
import { PageHeader, SectionCard } from '@/components/layout';
import { StatusTag } from '@/components/ui';
import { knowledgeTree } from '@/mock';

const ARTICLES: Record<string, { body: { h: string; p?: string; list?: string[] }[]; views: number; helpful: number; updated: string; owner: string }> = {
  quickstart: {
    views: 2841,
    helpful: 214,
    updated: '2026-10-14',
    owner: '张启明',
    body: [
      { h: '准备材料', list: ['渠道 AppID 与密钥（找客户要，不要自己在开放平台注册）', '游戏包体 zip（不超过渠道首包限制）', '软著与备案材料扫描件'] },
      { h: '接入步骤', p: '先按《SDK 与接入》完成 NP.init，然后在中台「新建项目」录入渠道与包体限制，把返回的项目 ID 填进构建配置。首次构建会自动生成渠道适配层。' },
      { h: '常见阻塞', list: ['微信侧未配置服务器域名，导致登录回调失败', '包体内含运行时 CDN 拉取脚本，审核直接驳回', '支付未带业务订单号，回调查不到订单'] },
    ],
  },
  auth: {
    views: 1632,
    helpful: 138,
    updated: '2026-10-09',
    owner: '李睿',
    body: [
      { h: '账号打通方式', p: '通过渠道静默登录拿到 openId，再由我方服务端换取内部 uid。客户已有账号体系时，用手机号做二次绑定，避免一人多号。' },
      { h: 'token 策略', list: ['accessToken 有效期 2 小时，refreshToken 30 天', 'refresh 失败要静默降级为游客态，不弹错误', '同一 openId 在新设备登录需踢掉旧会话'] },
    ],
  },
  pay: {
    views: 3105,
    helpful: 267,
    updated: '2026-10-16',
    owner: '王楚',
    body: [
      { h: '下单流程', p: '业务侧先调我方服务端下单拿 orderId，再调 NP.pay 拉起渠道收银台。渠道回调到我方服务端校验金额与签名，成功后给客户端推消息。' },
      { h: '必须注意', list: ['金额以分为单位，禁止浮点', '同一 orderId 重复回调必须幂等', '客户端不信任支付结果，以服务端查询为准', '退款走渠道后台，我方只记录状态'] },
      { h: '失败排查', p: 'code=1001 是用户取消，不要重试也不要提示错误；code=2003 是签名失败，检查密钥是否为当前环境；code=5001 是渠道限流，退避 3 秒重试。' },
    ],
  },
  track: {
    views: 1204,
    helpful: 96,
    updated: '2026-09-30',
    owner: '陈默',
    body: [
      { h: '事件规范', p: '事件名采用 snake_case，参数不超过 20 个，禁止嵌套对象。所有事件必须带 projectId、channel、version 三个公共属性。' },
      { h: '上报策略', list: ['默认 5 秒批量上报，单批最多 50 条', '离线缓存上限 500 条，超出丢弃最旧', '页面隐藏时立即 flush'] },
    ],
  },
  wechat: {
    views: 4210,
    helpful: 382,
    updated: '2026-10-11',
    owner: '赵一鸣',
    body: [
      { h: '审核红线', list: ['首包 ≤ 4MB，总包 ≤ 20MB（分包合计）', '禁止运行时从外部域名加载 JS', '不得出现未过审的支付、抽奖、诱导分享', '未成年人保护提示必须在首次进入时展示'] },
      { h: '提审材料', p: '需要软著、ICP 备案、自审报告、未成年人保护方案。材料不齐会被打回，一次打回平均多等 2 天。' },
      { h: '常见驳回', list: ['包体超限（占驳回量 42%）', '诱导分享文案', '首次进入无防沉迷提示', '支付未接入微信官方收银台'] },
    ],
  },
  douyin: {
    views: 2760,
    helpful: 241,
    updated: '2026-10-08',
    owner: '赵一鸣',
    body: [
      { h: '合规清单', list: ['内容安全承诺书', '实名与防沉迷接入', '录屏分享需主体资质', '广告变现需接入穿山甲'] },
      { h: '技术约束', p: '首包 6MB，支持分包；启动需在 3 秒内出画面，否则会被降权。' },
    ],
  },
  overseas: {
    views: 986,
    helpful: 74,
    updated: '2026-09-22',
    owner: 'Rebecca',
    body: [
      { h: '平台差异', list: ['CrazyGames：不允许外链，SDK 需同步加载', 'Poki：审核约 8 小时，禁止自建登录', 'Facebook：需 App Review，广告 API 单独申请', 'Telegram：仅支持 TON 支付，无内购抽成'] },
      { h: '合规', p: '必须有英文隐私政策与 Cookie 提示，GDPR 区域需提供数据删除入口。' },
    ],
  },
};

export default function KnowledgePage() {
  const [activeKey, setActiveKey] = useState('quickstart');
  const [keyword, setKeyword] = useState('');

  const articles = useMemo(() => {
    const out: { key: string; title: string; folder: string }[] = [];
    const walk = (nodes: KnowledgeNode[], folder = '') => {
      nodes.forEach((n) => {
        if (n.children) walk(n.children, n.title);
        else out.push({ key: n.key, title: n.title, folder });
      });
    };
    walk(knowledgeTree);
    return out;
  }, []);

  const filtered = keyword ? articles.filter((a) => a.title.includes(keyword)) : articles;
  const active = ARTICLES[activeKey];
  const activeTitle = articles.find((a) => a.key === activeKey)?.title ?? '';

  return (
    <div className="np-page">
      <PageHeader
        title="知识库"
        desc={`${articles.length} 篇文档 · 覆盖接入、渠道合规与线上排障 · 由技术支持团队维护`}
        actions={
          <>
            <Input
              allowClear
              prefix={<Search size={13} style={{ color: 'var(--np-text-tertiary)' }} />}
              placeholder="搜索文档"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 220 }}
            />
            <Button type="primary">新建文档</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '252px 1fr 232px', gap: 16, alignItems: 'start' }}>
        <SectionCard title="目录" bodyStyle={{ padding: '8px 10px 14px' }}>
          {knowledgeTree.map((group) => (
            <div key={group.key} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--np-text-tertiary)', padding: '2px 4px 4px' }}>
                <BookOpen size={11} />
                {group.title}
              </div>
              {group.children?.map((c) => {
                const visible = !keyword || filtered.some((f) => f.key === c.key);
                if (!visible) return null;
                return (
                  <div
                    key={c.key}
                    onClick={() => setActiveKey(c.key)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 5,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      background: c.key === activeKey ? 'var(--np-primary-50)' : 'transparent',
                      color: c.key === activeKey ? 'var(--np-primary-700, var(--np-primary-600))' : 'var(--np-text-secondary)',
                    }}
                  >
                    {c.title}
                  </div>
                );
              })}
            </div>
          ))}
        </SectionCard>

        <SectionCard
          title={activeTitle}
          sub={active ? `更新于 ${active.updated} · ${active.owner} 维护` : undefined}
          extra={
            <Button size="small" icon={<ThumbsUp size={12} />}>
              有帮助
            </Button>
          }
        >
          {active ? (
            <div style={{ maxWidth: 720 }}>
              {active.body.map((b, i) => (
                <div key={i} style={{ marginBottom: 18 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 7px' }}>{b.h}</h3>
                  {b.p && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.95, color: 'var(--np-text-secondary)' }}>{b.p}</p>}
                  {b.list && (
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 2, color: 'var(--np-text-secondary)' }}>
                      {b.list.map((li, j) => (
                        <li key={j}>{li}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: 'var(--np-text-tertiary)' }}>该文档正文尚未录入</div>
          )}
        </SectionCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="文档数据">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--np-text-tertiary)' }}>阅读量</span>
                <span className="np-num">{active?.views ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--np-text-tertiary)' }}>有帮助</span>
                <span className="np-num">{active?.helpful ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--np-text-tertiary)' }}>最近更新</span>
                <span>{active?.updated ?? '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--np-text-tertiary)' }}>维护人</span>
                <span>{active?.owner ?? '—'}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="热门文档">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(ARTICLES)
                .sort((a, b) => b[1].views - a[1].views)
                .slice(0, 5)
                .map(([k, v]) => (
                  <div
                    key={k}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}
                    onClick={() => setActiveKey(k)}
                  >
                    <span className="np-truncate" style={{ flex: 1, color: 'var(--np-text-secondary)' }}>
                      {articles.find((a) => a.key === k)?.title ?? k}
                    </span>
                    <span className="np-num" style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>{v.views}</span>
                    <ChevronRight size={11} style={{ color: 'var(--np-text-disabled)' }} />
                  </div>
                ))}
            </div>
          </SectionCard>

          <SectionCard title="需要更多帮助">
            <div style={{ fontSize: 12, lineHeight: 1.85, color: 'var(--np-text-secondary)' }}>
              文档没解决？提交工单，P2 级别 4 小时内响应。
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <Button size="small" type="primary">提交工单</Button>
              <StatusTag label="技术支持在线" tone="success" />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
