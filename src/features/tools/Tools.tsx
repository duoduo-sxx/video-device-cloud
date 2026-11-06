import { useNavigate } from 'react-router-dom';
import { Button, Tooltip } from 'antd';
import {
  AudioOutlined,
  BulbOutlined,
  ClearOutlined,
  FilterOutlined,
  FontSizeOutlined,
  PlaySquareOutlined,
  PictureOutlined,
  SafetyCertificateOutlined,
  ScanOutlined,
  ScissorOutlined,
  SoundOutlined,
  TranslationOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { PageHeader, Panel, StatusBadge } from '@/components/ui';
import { CAPABILITIES } from '@/mock/seed/capabilities';
import { getAssets } from '@/mock/db';
import { fmtNum, fmtDuration } from '@/utils/format';
import type { CapabilityId } from '@/types';

const ICONS: Record<string, React.ReactNode> = {
  audio: <AudioOutlined />,
  subtitle: <FontSizeOutlined />,
  translate: <TranslationOutlined />,
  sound: <SoundOutlined />,
  scissor: <ScissorOutlined />,
  picture: <PictureOutlined />,
  filter: <FilterOutlined />,
  safety: <SafetyCertificateOutlined />,
  bulb: <BulbOutlined />,
  scan: <ScanOutlined />,
  eraser: <ClearOutlined />,
  user: <PlaySquareOutlined />,
};

const ROUTE: Partial<Record<CapabilityId, string>> = {
  cap_asr: '/tools/asr',
  cap_subtitle: '/tools',
  cap_translate: '/tools/translate',
  cap_tts: '/tools/tts',
  cap_clip: '/tools',
  cap_enhance: '/tools/enhance',
  cap_audio: '/tools/audio',
  cap_review: '/tools/review',
  cap_insight: '/tools/insight',
  cap_ocr: '/tools',
  cap_watermark: '/tools',
  cap_dubbing: '/tools',
};

export default function Tools() {
  const nav = useNavigate();
  const assets = getAssets();
  const recent = assets.slice(0, 4);

  const open = (id: CapabilityId) => {
    if (id === 'cap_subtitle') {
      const target = assets.find((a) => a.type === 'video' && a.subtitleTracks.length > 0) || assets[0];
      nav(`/tools/subtitle/${target.id}`);
      return;
    }
    nav(ROUTE[id] || '/tools');
  };

  return (
    <div>
      <PageHeader
        title="智能工具集"
        subtitle="12 项音视频 AI 能力，可直接处理单个素材，也可编排进流水线批量执行"
        actions={<Button onClick={() => nav('/pipelines')}>编排成流水线</Button>}
      />

      <Panel style={{ marginBottom: 14 }} title="最近使用" extra={<span className="hint">点击直接继续上次的参数</span>}>
        <div className="grid g4" style={{ gap: 10 }}>
          {recent.map((a, i) => (
            <div
              key={a.id}
              className="row clickable"
              style={{ gap: 10, border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: 'var(--bg-elevated)' }}
              onClick={() => nav(`/assets/${a.id}`)}
            >
              <div className={`cover cover-${a.cover}`} style={{ width: 66, height: 42, borderRadius: 5, flex: '0 0 66px' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                <div className="hint">
                  {fmtDuration(a.duration)} · {['语音转写', '字幕生成', '内容审核', '智能理解'][i % 4]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
        {CAPABILITIES.map((c) => (
          <div
            key={c.id}
            className="panel"
            style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: c.status === 'soon' ? 0.72 : 1 }}
          >
            <div className="row" style={{ gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 18,
                  color: c.color,
                  background: `${c.color}1f`,
                  flex: '0 0 38px',
                }}
              >
                {ICONS[c.icon]}
              </div>
              <div className="grow">
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                  {c.status !== 'up' && <StatusBadge status={c.status} />}
                </div>
                <div className="hint" style={{ marginTop: 2 }}>
                  {c.formats}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', minHeight: 38 }}>{c.desc}</div>
            <div className="row between" style={{ borderTop: '1px solid var(--border)', paddingTop: 9, marginTop: 'auto' }}>
              <div className="row" style={{ gap: 14 }}>
                <div>
                  <div className="hint">本月调用</div>
                  <div style={{ fontSize: 13 }} className="num">
                    {fmtNum(c.monthlyCalls)}
                  </div>
                </div>
                <div>
                  <div className="hint">平均耗时</div>
                  <div style={{ fontSize: 13 }}>{c.avgDuration}</div>
                </div>
              </div>
              <Tooltip title={c.status === 'soon' ? '该能力正在内测，可先提交试用申请' : undefined}>
                <Button size="small" type={c.status === 'up' ? 'primary' : 'default'} ghost={c.status === 'up'} onClick={() => open(c.id)}>
                  {c.status === 'soon' ? '查看预告' : c.status === 'maintenance' ? '维护中' : '开始处理'}
                </Button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      <Panel style={{ marginTop: 14 }} title="能力说明">
        <div className="grid g4" style={{ gap: 14, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          <div>
            <b style={{ color: 'var(--text-primary)' }}>按量计费</b>
            <div>转写 0.35 元/分钟，字幕 0.2 元/分钟，增强 2.4 元/分钟。详见用量与计费。</div>
            <a onClick={() => nav('/usage')}>
              查看价目 <ArrowRightOutlined />
            </a>
          </div>
          <div>
            <b style={{ color: 'var(--text-primary)' }}>批量能力</b>
            <div>在媒体资产中多选素材，可批量发起转写、字幕与审核，单批上限 50 个。</div>
          </div>
          <div>
            <b style={{ color: 'var(--text-primary)' }}>结果可编辑</b>
            <div>所有 AI 结果均可人工精修，修改会生成新版本并保留完整历史。</div>
          </div>
          <div>
            <b style={{ color: 'var(--text-primary)' }}>API 调用</b>
            <div>全部能力均可通过 OpenAPI 调用，支持同步与异步（回调）两种模式。</div>
            <a onClick={() => nav('/developer')}>
              查看文档 <ArrowRightOutlined />
            </a>
          </div>
        </div>
      </Panel>
    </div>
  );
}
