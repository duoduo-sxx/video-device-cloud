import { useState } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page';
import { API_ENDPOINTS } from '@/utils/constants';
import { cn } from '@/utils/cn';

const SECTIONS = [
  { id: 'overview', title: '接入概览' },
  { id: 'auth', title: '鉴权与签名' },
  { id: 'evidence', title: '存证接口' },
  { id: 'verify', title: '核验接口' },
  { id: 'rights', title: '确权接口' },
  { id: 'errors', title: '错误码' },
  { id: 'limits', title: '限流与配额' },
];

const ERRORS = [
  ['0', '成功', '请求已正确处理'],
  ['400', '参数错误', '缺少必填字段或字段格式不正确'],
  ['401', '签名校验失败', 'AK 不存在、时间戳过期或签名不匹配'],
  ['403', '无权限', '当前套餐不含该接口或密钥已禁用'],
  ['404', '资源不存在', '存证编号 / 权属编号不存在'],
  ['429', '超出 QPS 限制', '请降低并发或申请提额'],
  ['500', '内部错误', '服务端异常，可携带 requestId 提交工单'],
  ['1001', '文件哈希格式错误', '需为 0x 开头的 64 位十六进制字符串'],
  ['1002', '重复存证', '同一哈希已存证，返回已有记录'],
];

export default function ServiceDocs() {
  const [active, setActive] = useState('overview');

  return (
    <div className="page">
      <PageHeader title="开发文档" desc="Star Fire Chain Open API v1 · 最近更新 2026-10-12" />

      <div className="grid grid-cols-4 gap-4">
        <div className="card sticky top-[76px] h-fit p-3">
          <div className="flex items-center gap-1.5 px-2 pb-2 text-[11px] text-[var(--text-3)]">
            <BookOpen size={12} /> 目录
          </div>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                'flex w-full items-center gap-1.5 rounded-md px-2 py-[7px] text-left text-[12px] transition-colors',
                active === s.id ? 'bg-[rgba(61,125,255,.12)] text-[var(--text-1)]' : 'text-[var(--text-2)] hover:bg-white/5',
              )}
            >
              <ChevronRight size={11} className={active === s.id ? 'text-[var(--brand-2)]' : 'text-[var(--text-3)]'} />
              {s.title}
            </button>
          ))}
        </div>

        <div className="card col-span-3 p-7">
          {active === 'overview' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[17px] font-semibold">接入概览</h2>
                <p className="mt-2 text-[12.5px] leading-[2] text-[var(--text-2)]">
                  星火链证开放 API 提供存证、核验、确权、合同、取证与出证六类能力。所有接口使用 HTTPS 传输、JSON 编码，
                  通过 AccessKey / SecretKey 进行 HMAC-SHA256 签名鉴权。
                </p>
              </div>

              <div>
                <h3 className="text-[13.5px] font-medium">基础信息</h3>
                <div className="mt-2 overflow-hidden rounded-[9px] border border-[var(--stroke)]">
                  <table className="table">
                    <tbody>
                      {[
                        ['网关地址', 'https://api.xh-chain.cn'],
                        ['API 版本', 'v1'],
                        ['请求方法', 'GET / POST'],
                        ['Content-Type', 'application/json; charset=utf-8'],
                        ['默认超时', '10 秒'],
                        ['幂等性', '创建类接口支持 X-XH-Idempotency-Key'],
                      ].map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ width: 160 }}><span className="text-[11.5px] text-[var(--text-3)]">{k}</span></td>
                          <td><span className="font-mono text-[11.5px] text-[var(--text-1)]">{v}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-[13.5px] font-medium">快速开始</h3>
                <pre className="mt-2 overflow-x-auto rounded-[9px] border border-[var(--stroke)] bg-[#070C15] p-4 font-mono text-[11px] leading-relaxed text-[var(--text-2)]">
{`# 安装 SDK
npm i @xh-chain/sdk

# 初始化
import { XHClient } from '@xh-chain/sdk';

const client = new XHClient({
  accessKey: process.env.XH_AK,
  secretKey: process.env.XH_SK,
});

# 创建存证
const res = await client.evidence.create({
  title: '山海拾遗_第三辑_插图.zip',
  fileHash: '0x7f3a9c2e…',
  type: 'design',
});
console.log(res.evidenceId, res.txHash);`}
                </pre>
              </div>
            </div>
          )}

          {active === 'auth' && (
            <div className="space-y-5">
              <h2 className="text-[17px] font-semibold">鉴权与签名</h2>
              <p className="text-[12.5px] leading-[2] text-[var(--text-2)]">
                每个请求需在 Header 中携带 AccessKey、时间戳、随机串与签名。签名串为
                <code className="mx-1 rounded bg-white/6 px-1.5 py-0.5 font-mono text-[11px] text-[var(--brand-2)]">
                  METHOD + PATH + TIMESTAMP + NONCE + SHA256(BODY)
                </code>
                按顺序拼接后，用 SecretKey 做 HMAC-SHA256 并转十六进制。
              </p>
              <div className="overflow-hidden rounded-[9px] border border-[var(--stroke)]">
                <table className="table">
                  <thead>
                    <tr><th style={{ width: 190 }}>Header</th><th>说明</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ['X-XH-AccessKey', '创建密钥时生成的 AccessKey'],
                      ['X-XH-Timestamp', 'Unix 秒级时间戳，与服务器偏差不得超过 300 秒'],
                      ['X-XH-Nonce', '16 位随机字符串，5 分钟内不可重复'],
                      ['X-XH-Signature', 'HMAC-SHA256 签名结果（小写十六进制）'],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td><span className="font-mono text-[11.5px] text-[var(--brand-2)]">{k}</span></td>
                        <td><span className="text-[11.5px]">{v}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === 'evidence' && (
            <div className="space-y-4">
              <h2 className="text-[17px] font-semibold">存证接口</h2>
              {API_ENDPOINTS.filter((e) => e.path.includes('evidence')).map((e) => (
                <div key={e.path} className="rounded-[9px] border border-[var(--stroke)] p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[rgba(45,212,167,.14)] px-2 py-0.5 font-mono text-[10.5px] text-[#6EE7C7]">{e.method}</span>
                    <span className="font-mono text-[12px] text-[var(--text-1)]">{e.path}</span>
                    <span className="ml-auto text-[10.5px] text-[var(--text-3)]">QPS {e.qps}</span>
                  </div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--text-3)]">{e.desc}</p>
                  <pre className="mt-3 overflow-x-auto rounded-md bg-[#070C15] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--text-2)]">
{`{
  "title": "山海拾遗_第三辑_插图.zip",
  "fileHash": "0x7f3a9c2e41b8d05a…",
  "fileSize": 26843512,
  "type": "design",
  "privacy": "private",
  "tags": ["核心资产"]
}`}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {active === 'verify' && (
            <div className="space-y-4">
              <h2 className="text-[17px] font-semibold">核验接口</h2>
              <p className="text-[12.5px] leading-[2] text-[var(--text-2)]">
                传入文件哈希即可判断该内容是否已在链上存证，返回存证编号、上链时间与区块高度。接口不会上传原始文件。
              </p>
              <pre className="rounded-[9px] border border-[var(--stroke)] bg-[#070C15] p-4 font-mono text-[11px] leading-relaxed text-[var(--text-2)]">
{`POST /v1/verify/hash
{
  "hash": "0x7f3a9c2e41b8d05c6a9e2f7b3d8a1c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c"
}

→ 200 OK
{
  "code": 0,
  "data": {
    "matched": true,
    "evidenceId": "EV-20261019-0037",
    "blockHeight": 2486902,
    "confirmedAt": "2026-10-19T09:42:18+08:00"
  }
}`}
              </pre>
            </div>
          )}

          {active === 'rights' && (
            <div className="space-y-4">
              <h2 className="text-[17px] font-semibold">确权接口</h2>
              <p className="text-[12.5px] leading-[2] text-[var(--text-2)]">
                提交权属登记申请需先完成实名认证，并至少关联一条已确认的存证记录。接口返回登记编号，审核通过后状态变为 registered。
              </p>
              <pre className="rounded-[9px] border border-[var(--stroke)] bg-[#070C15] p-4 font-mono text-[11px] leading-relaxed text-[var(--text-2)]">
{`POST /v1/rights
{
  "title": "《山海拾遗·第三辑》插画集",
  "category": "copyright",
  "subCategory": "美术作品",
  "owner": { "type": "org", "name": "杭州拾光文创有限公司" },
  "evidenceIds": ["EV-20261019-0037"],
  "validFrom": "2026-10-19",
  "validTo": "2036-12-31"
}`}
              </pre>
            </div>
          )}

          {active === 'errors' && (
            <div className="space-y-4">
              <h2 className="text-[17px] font-semibold">错误码</h2>
              <div className="overflow-hidden rounded-[9px] border border-[var(--stroke)]">
                <table className="table">
                  <thead>
                    <tr><th style={{ width: 88 }}>Code</th><th style={{ width: 170 }}>含义</th><th>说明</th></tr>
                  </thead>
                  <tbody>
                    {ERRORS.map(([c, m, d]) => (
                      <tr key={c}>
                        <td><span className={cn('font-mono text-[11.5px]', c === '0' ? 'text-[var(--ok)]' : 'text-[var(--danger)]')}>{c}</span></td>
                        <td><span className="text-[11.5px] text-[var(--text-1)]">{m}</span></td>
                        <td><span className="text-[11.5px] text-[var(--text-3)]">{d}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === 'limits' && (
            <div className="space-y-4">
              <h2 className="text-[17px] font-semibold">限流与配额</h2>
              <div className="space-y-2 text-[12.5px] leading-[2] text-[var(--text-2)]">
                <p>· 免费版：单接口 5 QPS，每月 1,000 次调用。</p>
                <p>· 专业版：单接口 20 QPS，每月 100,000 次调用。</p>
                <p>· 企业版：单接口 50 QPS，调用量按合同约定，可申请独享通道。</p>
                <p>· 超出 QPS 返回 429，响应头 X-XH-Retry-After 给出建议重试秒数。</p>
                <p>· 批量存证单次最多 100 条，异步处理，通过批次号轮询结果。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
