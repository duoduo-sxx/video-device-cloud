import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Progress, Select, Tag } from 'antd';
import { BulbOutlined, DownloadOutlined, ScissorOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PageHeader, Panel, Cover, EmptyState } from '@/components/ui';
import { getAssets } from '@/mock/db';
import { useTaskStore } from '@/stores/tasks';
import { fmtDuration, hashString, mulberry32 } from '@/utils/format';

const CHAPTER_TITLES = ['开场：为什么做端侧', '核心能力发布', '现场实拍演示', '客户案例与数据', '价格与权益', '答疑环节'];

export default function Insight() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const assets = getAssets().filter((a) => a.type === 'video');
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const enqueue = useTaskStore((s) => s.enqueue);
  const asset = assets.find((a) => a.id === assetId);

  const chapters = useMemo(() => {
    if (!asset) return [];
    const rnd = mulberry32(hashString(asset.id));
    const n = 6;
    return CHAPTER_TITLES.map((title, i) => ({
      title,
      start: Math.round((asset.duration / n) * i),
      summary: ['交代行业背景与三个判断。', '发布端侧推理与多模态对齐能力。', '现场处理一段 4K 素材，展示实时字幕。', '两家客户落地数据，效率提升 4.2 倍。', '公布企业版权益与 API 计费。', '回应成本、合规与私有化部署问题。'][i],
      score: 80 + Math.round(rnd() * 18),
      cover: (i + 2) % 8,
    }));
  }, [asset]);

  const covers = useMemo(() => (asset ? [9.2, 8.8, 8.5, 8.1, 7.8, 7.4] : []), [asset]);

  const analyze = () => {
    if (!asset) return;
    enqueue({ assetId, capability: 'cap_insight', params: { chapters: 6, keywords: 20 } });
    setAnalyzing(true);
    setDone(false);
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 4 + Math.random() * 6);
        if (next >= 100) {
          clearInterval(t);
          setTimeout(() => {
            setAnalyzing(false);
            setDone(true);
            message.success('分析完成：6 个章节、20 个关键词、6 张封面候选');
          }, 300);
        }
        return next;
      });
    }, 320);
  };

  return (
    <div>
      <PageHeader
        title="智能理解"
        subtitle="章节切分 · 摘要 · 关键词 · 封面推荐 · 精彩片段评分"
        actions={<Button onClick={() => nav('/tools')}>返回工具集</Button>}
      />

      <Panel style={{ marginBottom: 14 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <Select showSearch value={assetId} onChange={(v) => { setAssetId(v); setDone(false); setProgress(0); }} style={{ width: 340 }} optionFilterProp="label" options={assets.map((a) => ({ value: a.id, label: a.title }))} />
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={analyze} loading={analyzing}>
            {analyzing ? '分析中…' : done ? '重新分析' : '开始分析'}
          </Button>
          {done && <Button icon={<DownloadOutlined />} onClick={() => message.success('已导出分析报告（Markdown）')}>导出报告</Button>}
          <div style={{ flex: 1 }} />
          {asset && <span className="hint">{fmtDuration(asset.duration)} · {asset.width}×{asset.height} · {asset.codec}</span>}
        </div>
        {(analyzing || progress > 0) && <Progress percent={Math.round(progress)} size="small" style={{ marginTop: 10, maxWidth: 420 }} strokeColor="#C084FC" />}
      </Panel>

      {!done ? (
        <Panel>
          <EmptyState
            title={analyzing ? '正在理解素材内容…' : '尚未分析该素材'}
            desc={analyzing ? '正在执行语音识别、画面理解与语义分段，预计 2 分钟。' : '点击「开始分析」，自动生成章节、摘要、关键词与封面候选。'}
            action={
              !analyzing ? (
                <Button type="primary" icon={<BulbOutlined />} onClick={analyze}>
                  开始分析
                </Button>
              ) : undefined
            }
          />
        </Panel>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.6fr) 330px', alignItems: 'start' }}>
          <div className="col" style={{ gap: 14 }}>
            <Panel title="章节" extra={<span className="hint">{chapters.length} 个 · 点击跳转播放</span>}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {chapters.map((c, i) => (
                  <div key={c.title} className="clickable" style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <Cover index={c.cover} height={84} label={fmtDuration(c.start)} />
                    <div style={{ padding: '8px 9px' }}>
                      <div style={{ fontSize: 12.5 }}>{i + 1}. {c.title}</div>
                      <div className="hint" style={{ height: 32, overflow: 'hidden' }}>{c.summary}</div>
                      <div className="row between" style={{ marginTop: 4 }}>
                        <span className="hint">信息密度 {c.score}</span>
                        <a style={{ fontSize: 11 }}>定位</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="全局摘要" extra={<a onClick={() => message.success('摘要已复制')}>复制</a>}>
              <div className="col" style={{ gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0 }}>
                  <b style={{ color: 'var(--text-primary)' }}>背景：</b>
                  本次发布会围绕「端侧实时多模态」展开，面向企业内容团队，强调在弱网与隐私约束下的可用性，提出三个行业判断。
                </p>
                <p style={{ margin: 0 }}>
                  <b style={{ color: 'var(--text-primary)' }}>核心内容：</b>
                  现场公布了 38ms 端侧推理延迟、字幕时间轴对齐方案与十二节点可编排流水线；演示环节使用真实 4K 素材完成转写与双语字幕生成，总耗时 42 秒。
                </p>
                <p style={{ margin: 0 }}>
                  <b style={{ color: 'var(--text-primary)' }}>结论：</b>
                  产品完成度较高，适合内容团队批量生产；价格章节涉及具体折扣，对外分发前需经审核确认。
                </p>
              </div>
            </Panel>

            <Panel title="精彩片段" extra={<span className="hint">按爆点指数排序</span>}>
              <div className="col" style={{ gap: 8 }}>
                {[92, 87, 84, 81, 76].map((s, i) => (
                  <div key={i} className="row" style={{ gap: 10, border: '1px solid var(--border)', borderRadius: 8, padding: 9 }}>
                    <div className={`cover cover-${(i + 3) % 8}`} style={{ width: 88, height: 50, borderRadius: 5, flex: '0 0 88px' }}>
                      <span className="cover-label">{fmtDuration(chapters[i]?.start || 0)}</span>
                    </div>
                    <div className="grow">
                      <div className="row between">
                        <span style={{ fontSize: 12.5 }}>{['38ms 延迟演示', '4K 实时字幕', '客户数据：效率 4.2 倍', '多语译配现场', '价格公布'][i]}</span>
                        <span className="hint">{s} 分</span>
                      </div>
                      <Progress percent={s} showInfo={false} size="small" strokeColor="#FBBF24" />
                      <div className="hint">建议时长 45–60 秒 · 适合竖版分发</div>
                    </div>
                    <Button size="small" icon={<ScissorOutlined />} onClick={() => message.success('已加入「短视频一键成片」流水线')}>
                      一键成片
                    </Button>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="col" style={{ gap: 14 }}>
            <Panel title="封面候选" extra={<span className="hint">AI 评分</span>}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {covers.map((score, i) => (
                  <div key={i} className="clickable" onClick={() => message.success(`已设为封面（评分 ${score}）`)}>
                    <div style={{ position: 'relative' }}>
                      <div className={`cover cover-${(i + 1) % 8}`} style={{ height: 68, borderRadius: 6 }} />
                      <span style={{ position: 'absolute', right: 5, top: 5, fontSize: 10, background: 'rgba(0,0,0,.6)', color: '#fff', padding: '1px 5px', borderRadius: 4 }}>
                        {score}
                      </span>
                    </div>
                    <div className="hint" style={{ marginTop: 3 }}>{fmtDuration((asset?.duration || 0) * (0.08 + i * 0.13))}</div>
                  </div>
                ))}
              </div>
              <Button size="small" block style={{ marginTop: 8 }} icon={<DownloadOutlined />}>
                全部下载
              </Button>
            </Panel>

            <Panel title="关键词">
              <div className="row wrap" style={{ gap: 6 }}>
                {['端侧推理', '多模态', '字幕对齐', '实时', '编排', '企业版', '定价', '客户案例', '延迟', '合规', '私有化', 'AIGC', '课堂', '直播', '短视频', '效率', '成本', 'GPU', '弱网', '隐私'].map((k, i) => (
                  <Tag key={k} style={{ marginInlineEnd: 0, fontSize: 11 + Math.max(0, 3 - Math.floor(i / 5)) }}>
                    {k}
                  </Tag>
                ))}
              </div>
            </Panel>

            <Panel title="标签建议">
              <div className="row wrap" style={{ gap: 6 }}>
                {['发布会', '产品', '4K', '双语', '技术', '企业服务', 'AI', '实录'].map((t) => (
                  <Tag key={t} color="blue" style={{ marginInlineEnd: 0 }}>{t}</Tag>
                ))}
              </div>
              <Button size="small" block style={{ marginTop: 10 }} onClick={() => message.success('已将 8 个标签写入素材')}>
                应用到素材
              </Button>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
