import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  Copy,
  Cpu,
  Gauge,
  Play,
  Search,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Field, Select, Textarea } from '@/components/ui/Form';
import { Tabs } from '@/components/ui/Overlay';
import { BarChartH } from '@/components/charts';
import { useUIStore } from '@/store/uiStore';
import { MODELS } from '@/mocks/models';
import { money, num } from '@/lib/format';
import { round2 } from '@/lib/calc';
import type { ModelType } from '@/types';

const TYPE_LABEL: Record<ModelType, string> = {
  text: '文本生成',
  embedding: '向量表示',
  multimodal: '多模态',
  audio: '语音',
  structured: '结构化',
};

const TYPE_TONE: Record<ModelType, 'blue' | 'cyan' | 'purple' | 'amber' | 'green'> = {
  text: 'blue',
  embedding: 'cyan',
  multimodal: 'purple',
  audio: 'amber',
  structured: 'green',
};

/* ================= 模型市场 ================= */
export function ModelMarket() {
  const navigate = useNavigate();
  const [type, setType] = useState<'all' | ModelType>('all');
  const [kw, setKw] = useState('');
  const toast = useUIStore((s) => s.toast);

  const rows = useMemo(
    () =>
      MODELS.filter((m) => m.status !== 'offline')
        .filter((m) => type === 'all' || m.type === type)
        .filter((m) => !kw || m.name.toLowerCase().includes(kw.toLowerCase()) || m.vendor.includes(kw)),
    [type, kw],
  );

  const counts = MODELS.filter((m) => m.status !== 'offline').reduce(
    (acc, m) => ({ ...acc, [m.type]: (acc[m.type] ?? 0) + 1 }),
    {} as Record<string, number>,
  );

  return (
    <div>
      <PageHeader
        title="模型市场"
        desc="算法模型层：按 token / 次 / 分钟计费，支持在线试用与私有化部署"
        actions={
          <Button variant="primary" icon={<Sparkles size={14} />} onClick={() => navigate('/console/models/playground')}>
            去试用台
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="在线模型" value={String(MODELS.filter((m) => m.status === 'online').length)} unit="个" hint="含 2 个公测模型" />
        <StatCard label="本月调用" value="6.28" unit="万 token" hint="较上月 +18.6%" tone="primary" />
        <StatCard label="平均延迟" value="436" unit="ms" hint="P50，全部模型加权" />
        <StatCard label="可用性" value="99.94" unit="%" hint="近 30 天，未触发 SLA 赔付" tone="success" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(['all', 'text', 'embedding', 'multimodal', 'audio', 'structured'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              type === t ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2 hover:bg-[#F9FAFB]'
            }`}
          >
            {t === 'all' ? '全部模型' : TYPE_LABEL[t]}
            <span className="num ml-1 text-2xs text-ink-3">
              {t === 'all' ? MODELS.filter((m) => m.status !== 'offline').length : counts[t] ?? 0}
            </span>
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="搜索模型名称或供应商"
            className="h-8 w-56 rounded-ctl border border-line pl-8 pr-3 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {rows.map((m) => (
          <Card key={m.id} className="flex flex-col transition-shadow hover:shadow-pop">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2F4F7] text-ink-2">
                  <Box size={16} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink-1">{m.name}</div>
                  <div className="mt-0.5 text-2xs text-ink-3">
                    {m.vendor} · {m.version}
                  </div>
                </div>
              </div>
              <Badge tone={TYPE_TONE[m.type]}>{TYPE_LABEL[m.type]}</Badge>
            </div>

            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-2">{m.intro}</p>

            <div className="mt-3 flex flex-wrap gap-1">
              {m.capabilityTags.slice(0, 3).map((t) => (
                <span key={t} className="rounded bg-[#F9FAFB] px-1.5 py-0.5 text-2xs text-ink-2">
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-line pt-3 text-2xs">
              <div>
                <div className="text-ink-3">上下文</div>
                <div className="num mt-0.5 font-medium text-ink-1">{m.contextWindow}</div>
              </div>
              <div>
                <div className="text-ink-3">QPS 限制</div>
                <div className="num mt-0.5 font-medium text-ink-1">{m.qpsLimit}</div>
              </div>
              <div>
                <div className="text-ink-3">平均延迟</div>
                <div className="num mt-0.5 font-medium text-ink-1">{m.avgLatency}ms</div>
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <span className="num text-base font-semibold text-ink-1">{money(m.inputPrice)}</span>
                <span className="ml-1 text-2xs text-ink-3">/ 千 token</span>
              </div>
              <div className="flex gap-1.5">
                {m.status === 'beta' && <Badge tone="amber">公测</Badge>}
                <Button size="sm" onClick={() => navigate(`/console/models/${m.id}`)}>
                  详情
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    navigate('/console/models/playground');
                    toast(`已选择 ${m.name}，可直接试用`, 'info');
                  }}
                >
                  试用
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ================= 模型详情 ================= */
export function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useUIStore((s) => s.toast);
  const [lang, setLang] = useState('curl');
  const m = MODELS.find((x) => x.id === id);

  if (!m) {
    return (
      <div className="py-20 text-center text-sm text-ink-2">
        模型不存在，<button className="link" onClick={() => navigate('/console/models')}>返回市场</button>
      </div>
    );
  }

  const snippets: Record<string, string> = {
    curl: `curl https://api.yunshu-ai.com/v1/models/${m.id}/invoke \\
  -H "Authorization: Bearer $YUNSHU_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "请从以下合同中提取甲方、乙方与付款账期",
    "temperature": 0.3,
    "max_tokens": 1024,
    "response_format": "json_object"
  }'`,
    python: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.yunshu-ai.com/v1",
    api_key=os.environ["YUNSHU_API_KEY"],
)

resp = client.chat.completions.create(
    model="${m.name}",
    messages=[{"role": "user", "content": "请从以下合同中提取甲方、乙方与付款账期"}],
    temperature=0.3,
    max_tokens=1024,
)
print(resp.choices[0].message.content)`,
    node: `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.yunshu-ai.com/v1',
  apiKey: process.env.YUNSHU_API_KEY,
});

const resp = await client.chat.completions.create({
  model: '${m.name}',
  messages: [{ role: 'user', content: '请从以下合同中提取甲方、乙方与付款账期' }],
  temperature: 0.3,
});
console.log(resp.choices[0].message.content);`,
  };

  return (
    <div>
      <button
        onClick={() => navigate('/console/models')}
        className="mb-3 inline-flex items-center gap-1 text-xs text-ink-2 hover:text-ink-1"
      >
        <ArrowLeft size={13} /> 返回模型市场
      </button>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-ink-1">{m.name}</h1>
                  <StatusBadge status={m.status} />
                  <Badge tone={TYPE_TONE[m.type]}>{TYPE_LABEL[m.type]}</Badge>
                </div>
                <p className="mt-1.5 text-sm text-ink-2">
                  {m.vendor} · {m.version} · 服务编号 {m.serviceItemId}
                </p>
              </div>
              <Button icon={<Star size={14} />} onClick={() => toast('已加入收藏', 'info')}>
                收藏
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {m.capabilityTags.map((t) => (
                <span key={t} className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-2xs text-ink-2">
                  {t}
                </span>
              ))}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-2">{m.intro}</p>
          </Card>

          <Card>
            <CardHeader title="计费规则" desc="按输入与输出 token 分别计价，不足 1 千 token 按 1 千计" />
            <div className="mt-3 overflow-hidden rounded-ctl border border-line">
              <table className="w-full text-sm">
                <thead className="bg-[#F9FAFB] text-xs text-ink-2">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">计费项</th>
                    <th className="px-3 py-2 text-right font-medium">单价</th>
                    <th className="px-3 py-2 text-left font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-line">
                    <td className="px-3 py-2.5">输入 token</td>
                    <td className="num px-3 py-2.5 text-right">{money(m.inputPrice)} / 千 token</td>
                    <td className="px-3 py-2.5 text-xs text-ink-2">包含 prompt 与 system 内容</td>
                  </tr>
                  <tr className="border-t border-line">
                    <td className="px-3 py-2.5">输出 token</td>
                    <td className="num px-3 py-2.5 text-right">
                      {m.outputPrice > 0 ? `${money(m.outputPrice)} / 千 token` : '不单独计费'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-ink-2">
                      {m.outputPrice > 0 ? '生成内容按实际输出长度计费' : '已包含在输入计价中'}
                    </td>
                  </tr>
                  <tr className="border-t border-line">
                    <td className="px-3 py-2.5">免费额度</td>
                    <td className="num px-3 py-2.5 text-right">10 万 token / 月</td>
                    <td className="px-3 py-2.5 text-xs text-ink-2">每租户每自然月重置</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="请求参数" desc="未填写的参数将使用默认值" />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F9FAFB] text-xs text-ink-2">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">参数名</th>
                    <th className="px-3 py-2 text-left font-medium">类型</th>
                    <th className="px-3 py-2 text-left font-medium">必填</th>
                    <th className="px-3 py-2 text-left font-medium">默认值</th>
                    <th className="px-3 py-2 text-left font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {m.params.map((p) => (
                    <tr key={p.name} className="border-t border-line">
                      <td className="px-3 py-2.5 font-mono text-xs text-primary">{p.name}</td>
                      <td className="px-3 py-2.5 text-xs text-ink-2">{p.type}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {p.required ? <Badge tone="red">必填</Badge> : <span className="text-ink-3">否</span>}
                      </td>
                      <td className="num px-3 py-2.5 text-xs text-ink-2">{p.def}</td>
                      <td className="px-3 py-2.5 text-xs text-ink-2">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="调用示例"
              extra={
                <Button
                  size="sm"
                  icon={<Copy size={13} />}
                  onClick={() => toast('示例代码已复制', 'info')}
                >
                  复制
                </Button>
              }
            />
            <div className="mt-3">
              <div className="mb-2 flex gap-1">
                {['curl', 'python', 'node'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`rounded px-2.5 py-1 text-2xs uppercase transition-colors ${
                      lang === l ? 'bg-primary text-white' : 'bg-[#F2F4F7] text-ink-2 hover:bg-[#E9EDF3]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <pre className="overflow-x-auto rounded-ctl bg-[#0B1220] p-4 font-mono text-[11.5px] leading-relaxed text-[#C7D2E4]">
                {snippets[lang]}
              </pre>
            </div>
          </Card>

          <Card>
            <CardHeader title="能力评测" desc="与同参数规模模型的横向对比（百分制）" />
            <div className="mt-3">
              <BarChartH data={m.benchmark} labelKey="label" valueKey="score" height={200} money={false} />
            </div>
          </Card>
        </div>

        {/* 侧栏 */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <div className="text-xs text-ink-3">按量计价</div>
            <div className="num mt-1.5 text-3xl font-semibold text-ink-1">{money(m.inputPrice)}</div>
            <div className="mt-0.5 text-xs text-ink-3">元 / 千 token</div>

            <div className="mt-4 space-y-2.5 border-t border-line pt-4 text-xs">
              {[
                ['QPS 限制', `${m.qpsLimit} 次/秒`],
                ['SLA 可用性', m.sla],
                ['平均延迟', `${m.avgLatency} ms`],
                ['上下文窗口', m.contextWindow],
                ['部署区域', '华北 2 / 华东 1'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-ink-3">{k}</span>
                  <span className="num text-ink-1">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <Button variant="primary" block icon={<Play size={14} />} onClick={() => navigate('/console/models/playground')}>
                去试用台试用
              </Button>
              <Button block icon={<Gauge size={14} />} onClick={() => toast('提额申请已提交，客户成功将在 1 个工作日内联系你', 'info')}>
                申请提升 QPS
              </Button>
              <Button block icon={<BookOpen size={14} />} onClick={() => navigate('/console/api/docs')}>
                查看接入文档
              </Button>
            </div>

            <div className="mt-4 rounded-ctl bg-[#F9FAFB] px-3 py-2.5 text-2xs leading-relaxed text-ink-3">
              <Check size={11} className="mr-1 inline text-success" />
              已通过内容安全合规检测，输出内容将经过敏感词与价值观校验。
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= 试用台 ================= */
const DEMO_OUTPUT = `{
  "甲方": "恒锐新能源汽车零部件有限公司",
  "乙方": "宁波精锐汽车紧固件有限公司",
  "合同编号": "HR-PO-2026-0914",
  "付款账期": "验收合格后 60 个自然日",
  "结算方式": "银行转账",
  "质保期": "24 个月",
  "违约条款": "逾期交付按合同总额 0.5%/日计违约金，上限 15%"
}`;

export function Playground() {
  const toast = useUIStore((s) => s.toast);
  const [modelId, setModelId] = useState('MDL-01');
  const [prompt, setPrompt] = useState(
    '请从以下合同片段中提取甲方、乙方、合同编号、付款账期、结算方式、质保期与违约条款，以 JSON 输出：\n\n"本合同由恒锐新能源汽车零部件有限公司（甲方）与宁波精锐汽车紧固件有限公司（乙方）签订，合同编号 HR-PO-2026-0914……"',
  );
  const [temp, setTemp] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState<{ latency: number; inTok: number; outTok: number; cost: number } | null>(null);

  const model = MODELS.find((m) => m.id === modelId)!;

  function run() {
    setRunning(true);
    setOutput('');
    setStats(null);
    const inTok = Math.round(prompt.length * 1.4);
    const outTok = 182;
    setTimeout(() => {
      setOutput(DEMO_OUTPUT);
      setRunning(false);
      setStats({
        latency: model.avgLatency + 120,
        inTok,
        outTok,
        cost: round2(((inTok + outTok) / 1000) * model.inputPrice),
      });
      toast('生成完成');
    }, 900);
  }

  return (
    <div>
      <PageHeader
        title="模型试用台"
        desc="在控制台直接测试模型能力，消耗计入真实账单；单次请求上限 8K token"
        actions={<Button icon={<BookOpen size={14} />}>查看文档</Button>}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="输入" desc="选择模型并填写 prompt" />
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="模型" required>
                  <Select value={modelId} onChange={(e) => setModelId(e.target.value)}>
                    {MODELS.filter((m) => m.status !== 'offline').map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="响应格式">
                  <Select defaultValue="json">
                    <option value="text">纯文本</option>
                    <option value="json">JSON 对象</option>
                  </Select>
                </Field>
              </div>

              <Field label="Prompt" required hint={`${prompt.length} 字符，约 ${Math.round(prompt.length * 1.4)} token`}>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[160px] font-mono text-xs" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={`温度 Temperature：${temp}`}>
                  <input
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.1}
                    value={temp}
                    onChange={(e) => setTemp(Number(e.target.value))}
                    className="mt-2 w-full accent-primary"
                  />
                </Field>
                <Field label="最大输出 token">
                  <input
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value) || 0)}
                    className="num h-9 w-full rounded-ctl border border-line px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-3">
                <div className="text-2xs text-ink-3">
                  预估消耗 {money(round2(((prompt.length * 1.4) / 1000) * model.inputPrice))} · 余额充足
                </div>
                <Button variant="primary" icon={<Play size={14} />} loading={running} onClick={run}>
                  运行
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="输出"
              desc={stats ? `耗时 ${stats.latency}ms · 输入 ${num(stats.inTok)} / 输出 ${num(stats.outTok)} token` : '点击运行查看结果'}
              extra={
                output ? (
                  <Button size="sm" icon={<Copy size={13} />} onClick={() => toast('结果已复制', 'info')}>
                    复制
                  </Button>
                ) : undefined
              }
            />
            <div className="mt-3">
              {running ? (
                <div className="space-y-2 rounded-ctl bg-[#F9FAFB] p-4">
                  <div className="skeleton h-3 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-3 w-5/6" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              ) : output ? (
                <pre className="overflow-x-auto rounded-ctl bg-[#0B1220] p-4 font-mono text-[11.5px] leading-relaxed text-[#A5F3FC]">
                  {output}
                </pre>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-ctl border border-dashed border-line text-xs text-ink-3">
                  尚未运行，填写 Prompt 后点击「运行」
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="本次消耗" />
            {stats ? (
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-3">输入 token</span>
                  <span className="num text-ink-1">{num(stats.inTok)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3">输出 token</span>
                  <span className="num text-ink-1">{num(stats.outTok)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3">耗时</span>
                  <span className="num text-ink-1">{stats.latency} ms</span>
                </div>
                <div className="flex justify-between border-t border-line pt-2.5">
                  <span className="text-ink-2">费用（不含税）</span>
                  <span className="num font-semibold text-primary">{money(stats.cost)}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 py-8 text-center text-xs text-ink-3">运行后显示计量结果</div>
            )}
          </Card>

          <Card>
            <CardHeader title="当前模型" />
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-3">名称</span>
                <span className="text-ink-1">{model.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">上下文</span>
                <span className="num text-ink-1">{model.contextWindow}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">QPS</span>
                <span className="num text-ink-1">{model.qpsLimit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">SLA</span>
                <span className="num text-ink-1">{model.sla}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 rounded-ctl bg-primary-soft px-3 py-2 text-2xs text-primary">
              <Zap size={12} /> 已开启流式输出与自动重试
            </div>
          </Card>

          <Card>
            <CardHeader title="试用建议" />
            <div className="mt-3 space-y-2 text-2xs leading-relaxed text-ink-2">
              <div className="flex gap-1.5">
                <ChevronRight size={12} className="mt-0.5 shrink-0 text-primary" />
                结构化抽取建议将 temperature 设为 0.1 至 0.3，并指定 response_format。
              </div>
              <div className="flex gap-1.5">
                <ChevronRight size={12} className="mt-0.5 shrink-0 text-primary" />
                长文本请分段处理，单次超过上下文窗口会被截断且仍按全额计费。
              </div>
              <div className="flex gap-1.5">
                <ChevronRight size={12} className="mt-0.5 shrink-0 text-primary" />
                需要更高并发请提交提额申请，或使用专用实例避免共享池限流。
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
