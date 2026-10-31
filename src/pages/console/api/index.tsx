import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Drawer, Modal, Progress, Tabs } from '@/components/ui/Overlay';
import { Field, FilterBar, SearchInput, Select, Textarea, Toggle } from '@/components/ui/Form';
import { useCurrentTenant } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { API_KEYS, logsOf } from '@/mocks/api';
import { money, num } from '@/lib/format';
import type { ApiCallLog, ApiKey } from '@/types';

/* ================= 密钥管理 ================= */
export function ApiKeys() {
  const tenant = useCurrentTenant();
  const toast = useUIStore((s) => s.toast);
  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [keyName, setKeyName] = useState('');

  const rows = API_KEYS.filter((k) => k.tenantId === tenant.id);

  const columns: Column<ApiKey>[] = [
    { key: 'name', title: '密钥名称', render: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: 'maskedKey',
      title: 'Key',
      width: 280,
      render: (r) => (
        <span className="flex items-center gap-2 font-mono text-xs text-ink-2">
          {r.maskedKey}
          <button className="text-ink-3 hover:text-primary" onClick={() => toast('完整密钥仅在创建时展示一次', 'info')}>
            <Copy size={12} />
          </button>
        </span>
      ),
    },
    {
      key: 'quotaDaily',
      title: '日配额使用',
      width: 190,
      render: (r) => (
        <div>
          <div className="mb-1 flex justify-between text-2xs">
            <span className="num text-ink-2">{num(r.usedToday)}</span>
            <span className="num text-ink-3">/ {num(r.quotaDaily)}</span>
          </div>
          <Progress value={(r.usedToday / r.quotaDaily) * 100} height={4} tone={r.usedToday / r.quotaDaily > 0.8 ? 'warning' : 'primary'} />
        </div>
      ),
    },
    {
      key: 'ipWhitelist',
      title: 'IP 白名单',
      width: 130,
      render: (r) =>
        r.ipWhitelist.length ? (
          <span className="text-2xs text-ink-2">{r.ipWhitelist.length} 条</span>
        ) : (
          <span className="text-2xs text-ink-3">不限</span>
        ),
    },
    { key: 'lastUsedAt', title: '最近使用', width: 150, render: (r) => <span className="num text-xs text-ink-2">{r.lastUsedAt.slice(5, 16).replace('T', ' ')}</span> },
    { key: 'status', title: '状态', width: 90, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'op',
      title: '操作',
      width: 130,
      align: 'right',
      render: (r) =>
        r.status === 'active' ? (
          <div className="flex justify-end gap-2">
            <button className="text-xs text-primary" onClick={() => toast('配额调整已提交审批', 'info')}>
              配额
            </button>
            <button className="text-xs text-danger" onClick={() => toast(`密钥「${r.name}」已吊销`, 'info')}>
              吊销
            </button>
          </div>
        ) : (
          <span className="text-2xs text-ink-3">已失效</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="API 密钥"
        desc="密钥用于调用全部模型与数据服务，请勿写入前端代码或提交到代码仓库"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            创建密钥
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="有效密钥" value={String(rows.filter((r) => r.status === 'active').length)} unit="个" />
        <StatCard label="今日调用" value={num(rows.reduce((a, r) => a + r.usedToday, 0))} unit="token" tone="primary" />
        <StatCard label="日配额总量" value={num(rows.reduce((a, r) => a + r.quotaDaily, 0))} unit="token" />
        <StatCard label="异常请求（24h）" value="3" unit="次" hint="均为 429 限流" tone="warning" />
      </div>

      <Card pad={false}>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={8} emptyTitle="还没有 API 密钥" />
      </Card>

      <div className="mt-4 flex items-start gap-2 rounded-card border border-warning/20 bg-warning-soft px-5 py-4">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-warning" />
        <div className="text-2xs leading-relaxed text-warning">
          密钥泄露可能导致算力被盗用。建议为不同环境（生产/测试）分别创建密钥，并配置 IP 白名单；
          一旦发现异常调用，请立即吊销并重新创建。所有密钥操作都会记录在操作日志中。
        </div>
      </div>

      {/* 创建 */}
      <Drawer
        open={open}
        onClose={() => {
          setOpen(false);
          setReveal(null);
        }}
        title="创建 API 密钥"
        subtitle="密钥仅在创建后展示一次，请立即妥善保存"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                setReveal(`sk-live-hr-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 14)}`);
                toast('密钥创建成功，请立即复制保存');
              }}
            >
              创建
            </Button>
          </>
        }
      >
        {reveal ? (
          <div className="space-y-4">
            <div className="rounded-ctl border border-success/30 bg-success-soft px-3.5 py-3">
              <div className="text-2xs font-medium text-success">密钥已生成（仅此一次展示）</div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-white px-2.5 py-2 font-mono text-2xs text-ink-1">
                  {showSecret ? reveal : `${reveal.slice(0, 12)}${'•'.repeat(16)}`}
                </code>
                <button className="text-ink-3 hover:text-ink-1" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button className="text-primary" onClick={() => toast('密钥已复制到剪贴板', 'info')}>
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <Field label="密钥名称">
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="h-9 w-full rounded-ctl border border-line px-3 text-sm"
              />
            </Field>
            <div className="rounded-ctl bg-[#F9FAFB] px-3 py-2.5 text-2xs leading-relaxed text-ink-3">
              请将密钥配置为环境变量 <code className="rounded bg-white px-1">YUNSHU_API_KEY</code>，
              不要硬编码到代码或提交到版本库。
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="密钥名称" required hint="建议按「环境-用途」命名，如 生产环境-推理专用">
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="生产环境-推理专用"
                className="h-9 w-full rounded-ctl border border-line px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
              />
            </Field>
            <Field label="日调用配额（token）" required>
              <Select defaultValue="2000000">
                <option value="200000">20 万</option>
                <option value="1000000">100 万</option>
                <option value="2000000">200 万</option>
                <option value="5000000">500 万</option>
              </Select>
            </Field>
            <Field label="IP 白名单" hint="每行一个 CIDR 或 IP，留空表示不限制">
              <Textarea placeholder={'120.244.18.0/24\n39.156.66.21'} className="font-mono text-xs" />
            </Field>
            <div className="flex items-center justify-between rounded-ctl border border-line px-3 py-2.5">
              <div>
                <div className="text-xs text-ink-1">开启用量告警</div>
                <div className="mt-0.5 text-2xs text-ink-3">配额使用超过 80% 时发送邮件通知</div>
              </div>
              <Toggle checked onChange={() => {}} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ================= 调用日志 ================= */
export function ApiLogs() {
  const tenant = useCurrentTenant();
  const toast = useUIStore((s) => s.toast);
  const [kw, setKw] = useState('');
  const [status, setStatus] = useState('all');
  const [detail, setDetail] = useState<ApiCallLog | null>(null);

  const all = useMemo(() => logsOf(tenant.id), [tenant.id]);
  const rows = all
    .filter((l) => (status === 'all' ? true : status === 'ok' ? l.statusCode === 200 : l.statusCode !== 200))
    .filter((l) => !kw || l.requestId.includes(kw) || l.serviceName.includes(kw));

  const columns: Column<ApiCallLog>[] = [
    { key: 'requestId', title: '请求 ID', width: 190, render: (r) => <span className="font-mono text-2xs text-ink-2">{r.requestId}</span> },
    { key: 'serviceName', title: '服务', width: 210, render: (r) => <span className="text-xs">{r.serviceName}</span> },
    { key: 'apiKeyName', title: '密钥', width: 160, render: (r) => <span className="text-xs text-ink-2">{r.apiKeyName}</span> },
    {
      key: 'statusCode',
      title: '状态',
      width: 80,
      render: (r) => (
        <Badge tone={r.statusCode === 200 ? 'green' : r.statusCode === 429 ? 'amber' : 'red'}>{r.statusCode}</Badge>
      ),
    },
    { key: 'latencyMs', title: '耗时', width: 90, align: 'right', sortable: true, sorter: (a, b) => a.latencyMs - b.latencyMs, render: (r) => <span className="num text-ink-2">{r.latencyMs}ms</span> },
    { key: 'tokens', title: 'Token', width: 90, align: 'right', render: (r) => <span className="num text-ink-2">{r.tokens ? num(r.tokens) : '—'}</span> },
    { key: 'cost', title: '费用', width: 80, align: 'right', render: (r) => <span className="num">{money(r.cost)}</span> },
    { key: 'occurredAt', title: '时间', width: 150, render: (r) => <span className="num text-xs text-ink-2">{r.occurredAt.replace('T', ' ')}</span> },
    {
      key: 'op',
      title: '',
      width: 60,
      align: 'right',
      render: (r) => (
        <button className="text-xs text-primary" onClick={(e) => { e.stopPropagation(); setDetail(r); }}>
          详情
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="调用日志"
        desc="保留最近 30 天明细，可按请求 ID 追溯单次调用的计量与计费依据"
        actions={
          <Button icon={<Download size={14} />} onClick={() => toast('调用日志已导出 CSV', 'info')}>
            导出
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="近 14 天调用" value={num(all.length)} unit="次" />
        <StatCard label="成功率" value={((all.filter((l) => l.statusCode === 200).length / all.length) * 100).toFixed(2)} unit="%" tone="success" />
        <StatCard label="P95 延迟" value="1,462" unit="ms" hint="含多模态与图像生成" />
        <StatCard label="日均费用" value={money(all.reduce((a, l) => a + l.cost, 0) / 14)} tone="primary" />
      </div>

      <Card pad={false}>
        <div className="p-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 条</span>}>
            <SearchInput value={kw} onChange={setKw} placeholder="搜索请求 ID 或服务名" className="w-64" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32">
              <option value="all">全部状态</option>
              <option value="ok">成功</option>
              <option value="err">异常</option>
            </Select>
          </FilterBar>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={12}
          onRowClick={setDetail}
          emptyTitle="没有符合条件的调用"
        />
      </Card>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="调用详情"
        subtitle={detail?.requestId}
        width={640}
        footer={<Button onClick={() => setDetail(null)}>关闭</Button>}
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                ['请求 ID', detail.requestId],
                ['服务', detail.serviceName],
                ['密钥', detail.apiKeyName],
                ['来源 IP', detail.ip],
                ['状态码', String(detail.statusCode)],
                ['耗时', `${detail.latencyMs} ms`],
                ['Token', detail.tokens ? num(detail.tokens) : '—'],
                ['发生时间', detail.occurredAt.replace('T', ' ')],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-ink-3">{k}</div>
                  <div className="mt-1 font-mono text-ink-1">{v}</div>
                </div>
              ))}
            </div>

            <div className="rounded-ctl border border-line bg-[#F9FAFB] p-3.5 font-mono text-2xs leading-relaxed text-ink-2">
              {`POST /v1/invoke HTTP/1.1
Host: api.yunshu-ai.com
Authorization: Bearer sk-••••••••
Content-Type: application/json

{"model":"${detail.serviceName}","prompt":"...","temperature":0.3}

HTTP/1.1 ${detail.statusCode}
X-Request-Id: ${detail.requestId}
X-Usage-Tokens: ${detail.tokens}
X-Latency-Ms: ${detail.latencyMs}`}
            </div>

            <div className="flex items-center justify-between rounded-ctl bg-primary-soft px-3.5 py-2.5">
              <span className="text-xs text-primary">本次计费</span>
              <span className="num text-sm font-semibold text-primary">{money(detail.cost)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ================= 接入文档 ================= */
export function ApiDocs() {
  const toast = useUIStore((s) => s.toast);
  const [tab, setTab] = useState('quick');
  const [lang, setLang] = useState('curl');

  const code: Record<string, string> = {
    curl: `curl -X POST https://api.yunshu-ai.com/v1/invoke \\
  -H "Authorization: Bearer $YUNSHU_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "Qwen3-72B-Instruct",
    "messages": [{"role": "user", "content": "你好"}],
    "temperature": 0.3,
    "max_tokens": 512
  }'`,
    python: `import os, requests

resp = requests.post(
    "https://api.yunshu-ai.com/v1/invoke",
    headers={"Authorization": f"Bearer {os.environ['YUNSHU_API_KEY']}"},
    json={
        "model": "Qwen3-72B-Instruct",
        "messages": [{"role": "user", "content": "你好"}],
        "temperature": 0.3,
        "max_tokens": 512,
    },
    timeout=60,
)
print(resp.json()["data"]["content"])`,
    node: `const resp = await fetch('https://api.yunshu-ai.com/v1/invoke', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.YUNSHU_API_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'Qwen3-72B-Instruct',
    messages: [{ role: 'user', content: '你好' }],
    temperature: 0.3,
  }),
});
const data = await resp.json();
console.log(data.data.content);`,
  };

  return (
    <div>
      <PageHeader
        title="接入文档"
        desc="统一网关 https://api.yunshu-ai.com/v1，兼容 OpenAI SDK，仅需替换 base_url 与 api_key"
        actions={
          <Button icon={<Copy size={14} />} onClick={() => toast('Base URL 已复制', 'info')}>
            复制 Base URL
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <Card pad={false} className="xl:col-span-1">
          <div className="p-4">
            <Tabs
              tabs={[
                { key: 'quick', label: '快速开始' },
                { key: 'auth', label: '鉴权' },
                { key: 'billing', label: '计费' },
              ]}
              active={tab}
              onChange={setTab}
              className="mb-3"
            />
            <div className="space-y-2 text-xs">
              {[
                ['快速开始', '#quick'],
                ['鉴权方式', '#auth'],
                ['请求参数', '#params'],
                ['错误码', '#errors'],
                ['限流与配额', '#limit'],
                ['计费与结算', '#billing'],
              ].map(([label]) => (
                <div key={label} className="flex items-center gap-2 rounded px-2 py-1.5 text-ink-2 hover:bg-[#F9FAFB]">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-4 xl:col-span-3">
          <Card>
            <CardHeader title="快速开始" desc="三步完成第一次调用" extra={<BookOpen size={15} className="text-ink-3" />} />
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                ['1', '创建密钥', '在「API 密钥」页面创建，仅展示一次'],
                ['2', '配置环境变量', 'export YUNSHU_API_KEY=sk-live-...'],
                ['3', '发起调用', 'POST /v1/invoke，兼容 OpenAI SDK'],
              ].map(([n, t, d]) => (
                <div key={n} className="rounded-ctl border border-line px-3.5 py-3">
                  <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-primary text-2xs font-semibold text-white">
                    {n}
                  </span>
                  <div className="mt-2 text-xs font-medium text-ink-1">{t}</div>
                  <div className="mt-1 text-2xs leading-relaxed text-ink-3">{d}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="请求示例"
              extra={
                <div className="flex gap-1">
                  {['curl', 'python', 'node'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`rounded px-2.5 py-1 text-2xs uppercase transition-colors ${
                        lang === l ? 'bg-primary text-white' : 'bg-[#F2F4F7] text-ink-2'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              }
            />
            <pre className="mt-3 overflow-x-auto rounded-ctl bg-[#0B1220] p-4 font-mono text-[11.5px] leading-relaxed text-[#C7D2E4]">
              {code[lang]}
            </pre>
          </Card>

          <Card>
            <CardHeader title="错误码" />
            <div className="mt-3 overflow-hidden rounded-ctl border border-line">
              <table className="w-full text-xs">
                <thead className="bg-[#F9FAFB] text-ink-2">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">状态码</th>
                    <th className="px-3 py-2 text-left font-medium">含义</th>
                    <th className="px-3 py-2 text-left font-medium">处理建议</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['401', '鉴权失败', '检查 Authorization 头与密钥是否已吊销'],
                    ['403', '权限不足或 IP 不在白名单', '调整密钥的 IP 白名单配置'],
                    ['429', '超出 QPS 或日配额', '降低并发或申请提额'],
                    ['500', '模型服务内部错误', '自动重试 2 次后仍失败请联系支持'],
                    ['503', '模型服务暂不可用', '切换备用模型或稍后重试'],
                  ].map(([c, m, s]) => (
                    <tr key={c} className="border-t border-line">
                      <td className="num px-3 py-2 font-medium text-danger">{c}</td>
                      <td className="px-3 py-2 text-ink-1">{m}</td>
                      <td className="px-3 py-2 text-ink-2">{s}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="计费与结算" />
            <div className="mt-3 space-y-2 text-xs leading-relaxed text-ink-2">
              <p>· 按模型分别计价，输入与输出 token 分开计算，不足 1 千 token 按 1 千计。</p>
              <p>· 调用失败（4xx / 5xx）不计费；流式响应中途断开按已输出 token 计费。</p>
              <p>· 计量数据按小时汇总，实时扣减账户余额，月末生成账单后统一结算。</p>
              <p>· 结算周期为自然月，次月 5 日前完成对账确认，开具 6% 增值税专用发票。</p>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-ctl bg-[#F9FAFB] px-3.5 py-3">
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warning" />
              <span className="text-2xs leading-relaxed text-ink-3">
                当前为演示环境，接口地址与密钥均为模拟数据，真实调用不会产生任何费用。
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
