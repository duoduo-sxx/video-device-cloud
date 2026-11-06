import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Download, KeyRound, Send, Terminal } from 'lucide-react';
import { Button, CopyButton, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { API_ENDPOINTS } from '@/utils/constants';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

const SDKS = [
  { lang: 'Java', ver: '1.8.2', date: '2026-09-28' },
  { lang: 'Go', ver: '1.4.0', date: '2026-09-14' },
  { lang: 'Node.js', ver: '2.1.3', date: '2026-10-02' },
  { lang: 'Python', ver: '1.6.4', date: '2026-08-30' },
];

const ENDPOINTS = API_ENDPOINTS;

export default function ServiceApi() {
  const nav = useNavigate();
  const [active, setActive] = useState(ENDPOINTS[0]);
  const [resp, setResp] = useState<string>('');
  const [sending, setSending] = useState(false);

  const send = () => {
    setSending(true);
    setResp('');
    setTimeout(() => {
      setSending(false);
      setResp(
        JSON.stringify(
          {
            code: 0,
            message: 'success',
            data: {
              evidenceId: 'EV-20261019-0038',
              txHash: '0x7f3a9c2e41b8d05c6a9e2f7b3d8a1c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
              blockHeight: 2486921,
              status: 'confirmed',
              createdAt: '2026-10-19T10:20:31+08:00',
            },
            requestId: 'req_8f2c4e91a3',
          },
          null,
          2,
        ),
      );
    }, 800);
  };

  return (
    <div className="page">
      <PageHeader
        title="API 接入"
        desc="通过开放接口将存证、核验、确权能力集成到自有业务系统，单账号最高 50 QPS"
        actions={
          <>
            <Button onClick={() => nav('/service/docs')}>查看文档</Button>
            <Button variant="primary" icon={<KeyRound size={14} />} onClick={() => nav('/service/keys')}>管理密钥</Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-4">
        {[
          { n: '01', t: '创建密钥', d: '在密钥管理页生成 AccessKey / SecretKey，SecretKey 仅显示一次' },
          { n: '02', t: '调用接口', d: '使用 AK/SK 签名请求，所有接口均为 HTTPS + JSON' },
          { n: '03', t: '查看存证', d: '通过返回的存证编号查询上链状态与证书' },
        ].map((s) => (
          <div key={s.n} className="card p-5">
            <div className="font-mono text-[11px] text-[var(--brand-2)]">{s.n}</div>
            <div className="mt-1.5 text-[13px] text-[var(--text-1)]">{s.t}</div>
            <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-3)]">{s.d}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <SectionCard title="接口清单" desc="共 8 个业务接口，超出 QPS 将返回 429">
            <div className="overflow-hidden rounded-[9px] border border-[var(--stroke)]">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 76 }}>方法</th>
                    <th style={{ width: 220 }}>路径</th>
                    <th>说明</th>
                    <th style={{ width: 76 }}>QPS</th>
                    <th style={{ width: 64 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map((e) => (
                    <tr key={e.path} className={cn('cursor-pointer', active.path === e.path && 'bg-[rgba(61,125,255,.06)]')} onClick={() => setActive(e)}>
                      <td><Tag tone={e.method === 'POST' ? 'green' : 'blue'}>{e.method}</Tag></td>
                      <td><span className="font-mono text-[11.5px] text-[var(--text-1)]">{e.path}</span></td>
                      <td><span className="text-[11.5px] text-[var(--text-2)]">{e.name}</span></td>
                      <td><span className="num text-[11.5px] text-[var(--text-3)]">{e.qps}</span></td>
                      <td><button className="text-[11px] text-[var(--brand-2)] hover:underline">调试</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="在线调试" desc={`${active.method} ${active.path}`} extra={<Button size="sm" variant="primary" icon={<Send size={12} />} onClick={send} loading={sending}>发送请求</Button>}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-2 text-[11.5px] text-[var(--text-3)]">请求参数</div>
                <pre className="rounded-[9px] border border-[var(--stroke)] bg-[#070C15] p-3.5 font-mono text-[11px] leading-relaxed text-[var(--text-2)]">
{`{
  "title": "山海拾遗_第三辑_插图.zip",
  "fileHash": "0x7f3a...9b0c",
  "fileSize": 26843512,
  "type": "design",
  "privacy": "private",
  "bizId": "ORDER-20261019-001"
}`}
                </pre>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-[11.5px] text-[var(--text-3)]">
                  <span>响应结果</span>
                  {resp && <CopyButton value={resp} />}
                </div>
                <pre className="h-[196px] overflow-auto rounded-[9px] border border-[var(--stroke)] bg-[#070C15] p-3.5 font-mono text-[11px] leading-relaxed">
                  {resp ? (
                    <span className="text-[#6EE7C7]">{resp}</span>
                  ) : (
                    <span className="text-[var(--text-3)]">{sending ? '请求发送中…' : '点击「发送请求」查看响应'}</span>
                  )}
                </pre>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="SDK 下载" desc="已封装签名与重试逻辑">
            <div className="space-y-2">
              {SDKS.map((s) => (
                <div key={s.lang} className="flex items-center gap-3 rounded-[8px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-2.5">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[6px] bg-white/5 font-mono text-[10px] text-[var(--text-2)]">
                    {s.lang.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-[var(--text-1)]">{s.lang}</div>
                    <div className="font-mono text-[10px] text-[var(--text-3)]">v{s.ver} · {s.date}</div>
                  </div>
                  <button className="text-[var(--text-3)] hover:text-[var(--brand-2)]" onClick={() => toast.success(`${s.lang} SDK 开始下载`)}>
                    <Download size={13} />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="接入信息">
            <div className="space-y-0">
              {[
                ['网关地址', 'https://api.xh-chain.cn'],
                ['鉴权方式', 'AK/SK + HMAC-SHA256'],
                ['数据格式', 'application/json'],
                ['超时时间', '10 秒'],
                ['重试策略', '幂等接口自动重试 2 次'],
              ].map(([k, v]) => (
                <div key={k} className="kv">
                  <span className="kv-k">{k}</span>
                  <span className="kv-v font-mono text-[11px]">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3 py-2">
              <Terminal size={12} className="text-[var(--brand-2)]" />
              <span className="flex-1 truncate font-mono text-[10.5px] text-[var(--text-2)]">npm i @xh-chain/sdk</span>
              <CopyButton value="npm i @xh-chain/sdk" size={12} />
            </div>
          </SectionCard>

          <div className="card card-pad">
            <div className="flex items-center gap-2 text-[12px] text-[var(--text-1)]">
              <Check size={13} className="text-[var(--ok)]" />
              本月免费额度剩余 51,680 次
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full w-[48%] rounded-full bg-gradient-to-r from-[#3D7DFF] to-[#22D3EE]" />
            </div>
            <div className="mt-1.5 text-[10.5px] text-[var(--text-3)]">超出后按 ¥0.02 / 次计费</div>
          </div>
        </div>
      </div>
    </div>
  );
}
