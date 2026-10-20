import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Input } from 'antd';
import { FileText, FolderOpen, Plus, Search, Share2 } from 'lucide-react';
import type { Project } from '@/types/models';
import { SectionCard } from '@/components/layout';
import { Avatar, EmptyState, StatusTag } from '@/components/ui';
import { userName } from '@/mock';
import { formatDate } from '@/utils/format';

interface Doc {
  id: string;
  folder: string;
  title: string;
  ownerId: string;
  updatedAt: string;
  version: string;
  status: 'draft' | 'reviewing' | 'published';
  blocks: { h?: string; p?: string; list?: string[] }[];
}

function buildDocs(project: Project): Doc[] {
  return [
    {
      id: 'D-01',
      folder: '立项与合同',
      title: `${project.name} 项目章程`,
      ownerId: project.managerId,
      updatedAt: '2026-10-16 09:24',
      version: 'v1.4',
      status: 'published',
      blocks: [
        { h: '项目背景', p: `${project.name}（${project.id}）为 ${project.engine === 'cocos' ? 'Cocos Creator' : project.engine === 'laya' ? 'LayaAir' : project.engine === 'phaser' ? 'Phaser' : project.engine === 'pixijs' ? 'PixiJS' : project.engine === 'unity' ? 'Unity WebGL' : 'Egret'} 技术栈的跨平台网页游戏项目，需同时覆盖 ${project.platforms.length} 个渠道，首包体积与冷启动时长是最大的技术约束。` },
        { h: '目标', list: ['按合同节点完成 3 个里程碑交付', '首包体积控制在渠道限制的 85% 以内', '冷启动 ≤ 3s（中端机型）', '上线后 30 日崩溃率 < 0.5%'] },
        { h: '范围边界', p: '本期不含编辑器工具链改造、不含海外支付通道对接；渠道 SDK 由我方统一封装，客户侧只需提供 AppID 与密钥。' },
      ],
    },
    {
      id: 'D-02',
      folder: '技术方案',
      title: '分包与资源加载方案',
      ownerId: 'U-004',
      updatedAt: '2026-10-18 17:02',
      version: 'v2.1',
      status: 'reviewing',
      blocks: [
        { h: '首包策略', p: '首包仅保留引擎运行时、登录场景与公共 UI 图集，其余按场景拆为 4 个分包，配合 CDN 预热。' },
        { h: '关键指标', list: ['首包 gzip 后 ≤ 3.4MB（微信限制 4MB）', '首屏可交互 ≤ 2.6s', '分包懒加载失败自动重试 2 次'] },
        { h: '遗留问题', p: '低端机（骁龙 6 系以下）首帧仍偏高，需要在 v2.2 引入纹理压缩（ASTC）后再评估。' },
      ],
    },
    {
      id: 'D-03',
      folder: '技术方案',
      title: '渠道 SDK 封装规范',
      ownerId: 'U-005',
      updatedAt: '2026-10-13 11:40',
      version: 'v1.8',
      status: 'published',
      blocks: [
        { h: '统一接口', p: '对外只暴露 login / pay / share / reportEvent 四个方法，内部按渠道分发，业务层不感知渠道差异。' },
        { h: '异常约定', list: ['支付取消返回 code=1001，不弹错误提示', '登录失败统一抛 ChannelError，由业务层降级为游客态', '所有回调必须幂等'] },
      ],
    },
    {
      id: 'D-04',
      folder: '合规',
      title: '各渠道提审材料清单',
      ownerId: 'U-026',
      updatedAt: '2026-10-11 15:18',
      version: 'v3.0',
      status: 'published',
      blocks: [
        { h: '通用材料', list: ['软件著作权证书扫描件', 'ICP 备案截图', '游戏自审自查报告', '未成年人保护方案说明'] },
        { h: '渠道差异', p: '抖音要求额外提供内容安全承诺书；支付宝要求提供资金结算说明；海外平台需补充隐私政策英文版与 GDPR 数据处理附录。' },
      ],
    },
    {
      id: 'D-05',
      folder: '测试',
      title: '兼容性测试报告（第一轮）',
      ownerId: 'U-014',
      updatedAt: '2026-10-17 20:35',
      version: 'v1.0',
      status: 'draft',
      blocks: [
        { h: '覆盖情况', p: '覆盖 14 款机型 × 8 个用例，共 112 个组合，通过 96 个，部分通过 9 个，失败 4 个，未测 3 个。' },
        { h: '主要问题', list: ['Redmi Note 12 上音频需用户手势后才可播放', 'iOS 16 以下弱网首次加载黑屏超过 3s', '华为 nova 11 支付回调偶发丢失'] },
      ],
    },
    {
      id: 'D-06',
      folder: '上线',
      title: '上线检查清单',
      ownerId: 'U-027',
      updatedAt: '2026-10-19 08:12',
      version: 'v1.2',
      status: 'reviewing',
      blocks: [
        { h: '发布前', list: ['质量门禁全部通过', '灰度方案与回滚脚本确认', '客服话术与 FAQ 同步', '监控告警阈值配置完成'] },
        { h: '发布中', p: '按 5% → 30% → 100% 三档放量，每档观察 2 小时，核心指标（崩溃率、支付成功率、次留）任意一项劣化超过 15% 立即回滚。' },
        { h: '发布后', p: '24 小时内输出首日数据快报，48 小时内完成复盘会。' },
      ],
    },
    {
      id: 'D-07',
      folder: '会议纪要',
      title: '10-15 客户周会纪要',
      ownerId: project.managerId,
      updatedAt: '2026-10-15 18:50',
      version: 'v1.0',
      status: 'published',
      blocks: [
        { h: '决议', list: ['首包超限问题由我方在 10-22 前给出压缩方案', '客户侧 10-20 前补齐 3 项资质材料', '二期新增玩法需求进入需求池，不在本期范围'] },
        { h: '待办', p: '我方：分包方案（负责人 张启明，10-22）；客户：资质材料（负责人 王女士，10-20）。' },
      ],
    },
  ];
}

export default function DocsPage() {
  const { project } = useOutletContext<{ project: Project }>();
  const docs = useMemo(() => buildDocs(project), [project]);
  const [activeId, setActiveId] = useState(docs[0]?.id ?? '');
  const [keyword, setKeyword] = useState('');

  const active = docs.find((d) => d.id === activeId) ?? docs[0];
  const folders = useMemo(() => {
    const map = new Map<string, Doc[]>();
    docs
      .filter((d) => (keyword ? d.title.includes(keyword) : true))
      .forEach((d) => {
        const arr = map.get(d.folder) ?? [];
        arr.push(d);
        map.set(d.folder, arr);
      });
    return [...map.entries()];
  }, [docs, keyword]);

  const STATUS = {
    draft: { label: '草稿', tone: 'default' as const },
    reviewing: { label: '评审中', tone: 'warning' as const },
    published: { label: '已发布', tone: 'success' as const },
  };

  return (
    <div className="np-page" style={{ paddingTop: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '264px 1fr', gap: 16, alignItems: 'start' }}>
        <SectionCard
          title="文档目录"
          sub={`${docs.length} 篇`}
          extra={
            <Button size="small" type="text" icon={<Plus size={14} />} />
          }
          bodyStyle={{ padding: '6px 10px 12px' }}
        >
          <Input
            size="small"
            allowClear
            prefix={<Search size={13} style={{ color: 'var(--np-text-tertiary)' }} />}
            placeholder="搜索文档"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          {folders.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--np-text-tertiary)', padding: '16px 4px' }}>没有匹配的文档</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {folders.map(([folder, items]) => (
                <div key={folder}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      color: 'var(--np-text-tertiary)',
                      marginBottom: 4,
                      paddingLeft: 4,
                    }}
                  >
                    <FolderOpen size={12} />
                    {folder}
                  </div>
                  {items.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => setActiveId(d.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 8px',
                        borderRadius: 5,
                        cursor: 'pointer',
                        fontSize: 12.5,
                        background: d.id === active?.id ? 'var(--np-primary-50)' : 'transparent',
                        color: d.id === active?.id ? 'var(--np-primary-700, var(--np-primary-600))' : 'var(--np-text-secondary)',
                      }}
                    >
                      <FileText size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                      <span className="np-truncate" style={{ flex: 1 }} title={d.title}>
                        {d.title}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {active ? (
          <SectionCard
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {active.title}
                <StatusTag label={STATUS[active.status].label} tone={STATUS[active.status].tone} dot={false} />
              </span>
            }
            sub={`${active.folder} · ${active.version}`}
            extra={
              <>
                <Button size="small" icon={<Share2 size={13} />}>
                  分享
                </Button>
                <Button size="small">编辑</Button>
              </>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, fontSize: 12, color: 'var(--np-text-tertiary)' }}>
              <Avatar name={userName(active.ownerId)} size={22} />
              {userName(active.ownerId)} · 更新于 {formatDate(active.updatedAt, 'YYYY-MM-DD HH:mm')}
            </div>

            <div style={{ maxWidth: 760 }}>
              {active.blocks.map((b, i) => (
                <div key={i} style={{ marginBottom: 18 }}>
                  {b.h && (
                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{b.h}</h3>
                  )}
                  {b.p && (
                    <p style={{ fontSize: 13, lineHeight: 1.95, color: 'var(--np-text-secondary)', margin: 0 }}>{b.p}</p>
                  )}
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
          </SectionCard>
        ) : (
          <SectionCard title="文档">
            <EmptyState title="选择左侧文档" desc="或新建一篇文档开始协作" />
          </SectionCard>
        )}
      </div>
    </div>
  );
}
