import type { ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/utils/cn';
import { fmtTime } from '@/utils/format';

/* --------------------------------- 印章 ----------------------------------- */

export function SealStamp({ text = '星火链证存证专用章', size = 92 }: { text?: string; size?: number }) {
  return (
    <div
      className="relative flex flex-none items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full border-[2.5px]"
        style={{ borderColor: 'rgba(200,32,52,.78)' }}
      />
      <div
        className="absolute inset-[6px] rounded-full border"
        style={{ borderColor: 'rgba(200,32,52,.55)' }}
      />
      <div className="text-center" style={{ color: 'rgba(200,32,52,.86)' }}>
        <div style={{ fontSize: size * 0.2, lineHeight: 1 }}>★</div>
        <div style={{ fontSize: size * 0.105, marginTop: size * 0.03, letterSpacing: 1 }}>星火链证</div>
      </div>
      <div
        className="absolute whitespace-nowrap"
        style={{
          bottom: size * 0.09,
          fontSize: size * 0.072,
          color: 'rgba(200,32,52,.8)',
          letterSpacing: 0.4,
        }}
      >
        {text.replace('星火链证', '')}
      </div>
    </div>
  );
}

/* -------------------------------- 证书卡片 -------------------------------- */

export function CertificateCard({
  kind = 'evidence',
  no,
  title,
  ownerName,
  hash,
  blockHeight,
  txHash,
  issuedAt,
  extra,
}: {
  kind?: 'evidence' | 'rights' | 'asset';
  no: string;
  title: string;
  ownerName: string;
  hash: string;
  blockHeight: number;
  txHash: string;
  issuedAt: string;
  extra?: { label: string; value: string }[];
}) {
  const head =
    kind === 'evidence'
      ? '区块链电子数据存证证书'
      : kind === 'rights'
        ? '作品权属登记证书'
        : '数据资产登记凭证';
  const en =
    kind === 'evidence'
      ? 'BLOCKCHAIN ELECTRONIC DATA ATTESTATION'
      : kind === 'rights'
        ? 'COPYRIGHT OWNERSHIP REGISTRATION'
        : 'DATA ASSET REGISTRATION';

  return (
    <div className="relative overflow-hidden rounded-[10px] border border-[rgba(34,211,238,.28)] bg-[#FBFAF7] p-7 text-[#1B2432] shadow-[0_20px_50px_-24px_rgba(0,0,0,.9)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 12%, rgba(34,211,238,.10), transparent 42%), radial-gradient(circle at 88% 88%, rgba(61,125,255,.08), transparent 40%)',
        }}
      />
      <div className="pointer-events-none absolute inset-[10px] rounded-[6px] border border-[#B9C6D6]" />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] tracking-[2.5px] text-[#77869B]">XH-CHAIN · 星火联盟链</div>
            <div className="mt-1.5 text-[9.5px] tracking-[1.4px] text-[#9AA8BF]">CERTIFICATE NO. {no}</div>
          </div>
          <div className="flex items-center gap-1.5 text-[#1B2432]">
            <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#1B2432] text-[10px] font-bold text-white">
              XH
            </span>
            <span className="text-[10.5px] font-semibold tracking-wide">星火链证</span>
          </div>
        </div>

        <div className="mt-7 text-center">
          <h3 className="text-[19px] font-semibold tracking-[3px] text-[#16202E]">{head}</h3>
          <div className="mt-1 text-[8.5px] tracking-[1.6px] text-[#93A1B5]">{en}</div>
          <div className="mx-auto mt-3 h-px w-24 bg-[#C6D2DF]" />
        </div>

        <div className="mt-6 space-y-[9px] text-[11.5px] leading-relaxed text-[#3A4757]">
          <Row k="标 的 名 称" v={title} />
          <Row k="权 利 人" v={ownerName} />
          <Row k="数 字 指 纹" v={hash} mono />
          <Row k="区 块 高 度" v={`#${blockHeight.toLocaleString()}（星火联盟链主网）`} mono />
          <Row k="交 易 哈 希" v={txHash} mono />
          {extra?.map((e) => (
            <Row key={e.label} k={e.label} v={e.value} />
          ))}
          <Row k="签 发 时 间" v={fmtTime(issuedAt)} />
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div className="text-[9.5px] leading-[1.8] text-[#7D8CA1]">
            本证书由星火链证技术服务中心签发
            <br />
            可访问 verify.xh-chain.cn 输入证书编号核验
            <br />
            数据一经上链，不可篡改
          </div>
          <div className="flex items-end gap-3">
            <div className="rounded-[4px] border border-[#D3DDE8] bg-white p-1.5">
              <QRCodeSVG value={`https://verify.xh-chain.cn/${no}`} size={54} fgColor="#16202E" bgColor="#FFFFFF" />
            </div>
            <SealStamp size={78} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 border-b border-dashed border-[#DCE4EC] pb-[7px]">
      <span className="w-[68px] flex-none text-[10px] tracking-[0.5px] text-[#8794A8]">{k}</span>
      <span className={cn('min-w-0 flex-1 break-all', mono && 'font-mono text-[10.5px]')}>{v}</span>
    </div>
  );
}

/* -------------------------------- 纸张容器 -------------------------------- */

export function DocPaper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[8px] border border-[#D5DEE8] bg-[#FCFCFA] px-9 py-8 text-[#1B2432] shadow-[0_20px_50px_-30px_rgba(0,0,0,.9)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DocSeal({ text = '杭州市西湖公证处', size = 96 }: { text?: string; size?: number }) {
  return (
    <div className="relative flex items-center justify-center opacity-90" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border-[2.5px]" style={{ borderColor: 'rgba(200,32,52,.75)' }} />
      <div className="absolute inset-[7px] rounded-full border" style={{ borderColor: 'rgba(200,32,52,.5)' }} />
      <div className="text-center" style={{ color: 'rgba(200,32,52,.85)' }}>
        <div style={{ fontSize: size * 0.19 }}>★</div>
        <div style={{ fontSize: size * 0.095, marginTop: 2, lineHeight: 1.3 }}>
          {text.slice(0, 4)}
          <br />
          {text.slice(4, 8)}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- 链上流程 -------------------------------- */

export function ChainFlow({
  steps,
}: {
  steps: { title: string; desc: string; done: boolean }[];
}) {
  return (
    <div className="flex items-stretch gap-0">
      {steps.map((s, i) => (
        <div key={s.title} className="flex flex-1 items-center">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                  s.done ? 'bg-[var(--brand-2)] text-[#04121a]' : 'bg-white/8 text-[var(--text-3)]',
                )}
              >
                {s.done ? '✓' : i + 1}
              </span>
              <span className={cn('text-[12px]', s.done ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]')}>{s.title}</span>
            </div>
            <div className="text-[11px] leading-relaxed text-[var(--text-3)]">{s.desc}</div>
          </div>
          {i < steps.length - 1 && (
            <div className="mx-3 h-px w-8 flex-none bg-gradient-to-r from-[rgba(34,211,238,.55)] to-[var(--stroke)]" />
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- 节点拓扑 ------------------------------- */

export function NodeTopology({ nodes }: { nodes: { name: string; status: string }[] }) {
  const cx = 300;
  const cy = 130;
  const r = 96;
  return (
    <svg viewBox="0 0 600 270" className="w-full">
      <defs>
        <radialGradient id="centerGlow">
          <stop offset="0%" stopColor="#3D7DFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#3D7DFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={70} fill="url(#centerGlow)" />
      {nodes.map((n, i) => {
        const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * (r + 62);
        const y = cy + Math.sin(angle) * (r + 20);
        const online = n.status === 'online';
        return (
          <g key={n.name}>
            <line
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={online ? 'rgba(34,211,238,.35)' : 'rgba(255,255,255,.12)'}
              strokeWidth="1"
              strokeDasharray="4 4"
              style={{ animation: 'dashFlow 3s linear infinite' }}
            />
            <circle cx={x} cy={y} r="5" fill={online ? '#22D3EE' : '#63718A'} />
            <circle cx={x} cy={y} r="10" fill="none" stroke={online ? 'rgba(34,211,238,.35)' : 'rgba(255,255,255,.15)'} />
            <text
              x={x}
              y={y + (Math.sin(angle) > 0 ? 22 : -14)}
              textAnchor="middle"
              fontSize="9.5"
              fill="#9AA8BF"
            >
              {n.name}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="26" fill="#0F1626" stroke="rgba(61,125,255,.5)" />
      <circle cx={cx} cy={cy} r="26" fill="none" stroke="rgba(61,125,255,.25)" strokeWidth="6" />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="9" fill="#E8EEF9">
        共识层
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="7.5" fill="#63718A">
        PBFT
      </text>
    </svg>
  );
}
