import { useRef, useState } from 'react'
import type { Asset } from '../types'
import { cn } from '../lib/utils'
import { formatDuration } from '../lib/format'
import { Pause, Play } from 'lucide-react'

function Motif({ motif, opacity = 0.5 }: { motif: Asset['thumb']['motif']; opacity?: number }) {
  const stroke = 'rgba(255,255,255,0.55)'
  return (
    <svg viewBox="0 0 160 90" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" style={{ opacity }} aria-hidden>
      {motif === 'mountain' && (
        <>
          <path d="M-10 78 L34 34 L58 58 L78 30 L112 70 L140 46 L170 78 Z" fill="rgba(255,255,255,0.10)" stroke={stroke} strokeWidth="0.8" />
          <path d="M20 90 L58 52 L86 80 L112 56 L160 92" fill="none" stroke={stroke} strokeWidth="0.6" opacity="0.7" />
          <circle cx="128" cy="22" r="7" fill="none" stroke={stroke} strokeWidth="0.8" />
        </>
      )}
      {motif === 'city' && (
        <>
          {[
            [10, 40, 18, 50],
            [32, 26, 14, 64],
            [50, 48, 20, 42],
            [74, 18, 16, 72],
            [94, 38, 22, 52],
            [120, 30, 14, 60],
            [138, 50, 18, 40],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill="rgba(255,255,255,0.06)" stroke={stroke} strokeWidth="0.6" />
          ))}
          <path d="M0 84 H160" stroke={stroke} strokeWidth="0.8" />
        </>
      )}
      {motif === 'portrait' && (
        <>
          <circle cx="80" cy="36" r="15" fill="rgba(255,255,255,0.08)" stroke={stroke} strokeWidth="0.8" />
          <path d="M50 90 C50 68 62 58 80 58 C98 58 110 68 110 90" fill="rgba(255,255,255,0.07)" stroke={stroke} strokeWidth="0.8" />
          <path d="M0 16 H160" stroke={stroke} strokeWidth="0.4" opacity="0.4" />
        </>
      )}
      {motif === 'museum' && (
        <>
          <path d="M28 34 L80 16 L132 34" fill="none" stroke={stroke} strokeWidth="0.9" />
          <path d="M36 34 V74 M56 34 V74 M80 34 V74 M104 34 V74 M124 34 V74" stroke={stroke} strokeWidth="0.7" />
          <path d="M28 74 H132 M22 80 H138" stroke={stroke} strokeWidth="0.8" />
        </>
      )}
      {motif === 'stage' && (
        <>
          <path d="M24 0 L52 90 M80 0 L80 90 M136 0 L108 90" stroke={stroke} strokeWidth="0.7" opacity="0.8" />
          <ellipse cx="80" cy="82" rx="46" ry="10" fill="rgba(255,255,255,0.07)" stroke={stroke} strokeWidth="0.6" />
          <circle cx="80" cy="40" r="3" fill={stroke} />
        </>
      )}
      {motif === 'sea' && (
        <>
          <path d="M0 56 C20 48 32 64 52 56 C72 48 84 64 104 56 C124 48 136 64 160 56" fill="none" stroke={stroke} strokeWidth="0.9" />
          <path d="M0 68 C20 60 32 76 52 68 C72 60 84 76 104 68 C124 60 136 76 160 68" fill="none" stroke={stroke} strokeWidth="0.7" opacity="0.7" />
          <path d="M0 80 C20 72 32 88 52 80 C72 72 84 88 104 80 C124 72 136 88 160 80" fill="none" stroke={stroke} strokeWidth="0.6" opacity="0.5" />
        </>
      )}
    </svg>
  )
}

export function AssetThumb({
  asset,
  className,
  showMeta = true,
  rounded = 'rounded-lg',
}: {
  asset: Asset
  className?: string
  showMeta?: boolean
  rounded?: string
}) {
  return (
    <div
      className={cn('relative overflow-hidden', rounded, className)}
      style={{ background: `linear-gradient(135deg, ${asset.thumb.from} 0%, ${asset.thumb.to} 100%)`, aspectRatio: '16 / 9' }}
    >
      <Motif motif={asset.thumb.motif} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.55) 100%)' }} />
      {showMeta && (
        <>
          <span className="absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white/85 backdrop-blur-sm">
            {asset.width >= 7000 ? '8K' : asset.width >= 3000 ? '4K' : '1080p'}
          </span>
          <span className="absolute right-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white/85 backdrop-blur-sm">
            {asset.codec.replace('ProRes ', 'PR ')}
          </span>
          <span className="mono absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90">
            {formatDuration(asset.durationSec)}
          </span>
        </>
      )}
    </div>
  )
}

export function DepthPreview({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)} style={{ aspectRatio: '16 / 9' }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(58% 68% at 48% 44%, #ff5ea8 0%, #ff8f6b 18%, #ffc857 34%, #7ce7b4 52%, #35b6f0 70%, #2b3fb0 86%, #131038 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background:
            'repeating-linear-gradient(115deg, rgba(0,0,0,.22) 0 1px, transparent 1px 4px), radial-gradient(40% 50% at 70% 66%, rgba(0,0,0,.45), transparent 70%)',
        }}
      />
      <div className="absolute inset-0 flex items-end justify-between p-2">
        <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/80">{label ?? '深度图 · 16bit 归一化'}</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-white/70">0.0</span>
          <div className="h-1.5 w-16 rounded-full" style={{ background: 'linear-gradient(90deg,#131038,#2b3fb0,#35b6f0,#7ce7b4,#ffc857,#ff8f6b,#ff5ea8)' }} />
          <span className="text-[9px] text-white/70">1.0</span>
        </div>
      </div>
    </div>
  )
}

export function CompareSlider({ asset, className }: { asset: Asset; className?: string }) {
  const [pos, setPos] = useState(48)
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const move = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    setPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)))
  }

  return (
    <div
      ref={ref}
      className={cn('relative select-none overflow-hidden rounded-lg', className)}
      style={{ aspectRatio: '16 / 9', cursor: 'ew-resize' }}
      onPointerDown={(e) => {
        dragging.current = true
        move(e.clientX)
      }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      <div className="absolute inset-0">
        <AssetThumb asset={asset} showMeta={false} rounded="rounded-none" className="h-full w-full" />
        <div className="absolute left-3 top-3 rounded bg-black/55 px-2 py-1 text-[10px] text-white/85">2D 原片</div>
      </div>
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <div style={{ width: `${(100 / Math.max(pos, 1)) * 100}%` }}>
          <DepthPreview className="w-full" />
        </div>
        <div className="absolute left-3 top-3 rounded bg-black/55 px-2 py-1 text-[10px] text-white/85">深度 / 视差示意</div>
      </div>
      <div className="absolute inset-y-0 w-px bg-white/70" style={{ left: `${pos}%` }}>
        <div className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/60">
          <span className="text-[10px] text-white">↔</span>
        </div>
      </div>
    </div>
  )
}

export function PlayerMock({
  asset,
  mode = '2d',
  className,
}: {
  asset: Asset
  mode?: '2d' | 'depth' | 'sbs'
  className?: string
}) {
  const [playing, setPlaying] = useState(false)
  const [t, setT] = useState(Math.round(asset.durationSec * 0.18))
  const raf = useRef<number>()

  const toggle = () => {
    if (playing) {
      setPlaying(false)
      if (raf.current) window.clearInterval(raf.current)
      return
    }
    setPlaying(true)
    raf.current = window.setInterval(() => {
      setT((v) => (v >= asset.durationSec ? 0 : v + 1))
    }, 1000)
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-line bg-black', className)}>
      <div className="relative" style={{ aspectRatio: '16 / 9' }}>
        {mode === 'depth' ? (
          <DepthPreview className="h-full w-full rounded-none" />
        ) : mode === 'sbs' ? (
          <div className="flex h-full w-full">
            <div className="h-full w-1/2 overflow-hidden border-r border-white/20">
              <AssetThumb asset={asset} showMeta={false} rounded="rounded-none" className="h-full w-full" />
            </div>
            <div className="h-full w-1/2 overflow-hidden">
              <AssetThumb asset={asset} showMeta={false} rounded="rounded-none" className="h-full w-full" />
            </div>
            <div className="absolute left-3 top-3 rounded bg-black/55 px-2 py-1 text-[10px] text-white/80">SBS · 左眼 / 右眼</div>
          </div>
        ) : (
          <AssetThumb asset={asset} showMeta={false} rounded="rounded-none" className="h-full w-full" />
        )}

        <button
          onClick={toggle}
          className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
          aria-label={playing ? '暂停' : '播放'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <div className="mono absolute right-3 top-3 rounded bg-black/55 px-2 py-1 text-[10px] text-white/85">{formatDuration(t)}</div>
      </div>
      <div className="flex items-center gap-3 bg-[#0d1017] px-3 py-2">
        <button onClick={toggle} className="text-muted hover:text-ink" aria-label="播放控制">
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <span className="mono text-[11px] text-muted">{formatDuration(t)}</span>
        <input
          type="range"
          min={0}
          max={asset.durationSec}
          value={t}
          onChange={(e) => setT(Number(e.target.value))}
          className="flex-1"
          aria-label="进度"
        />
        <span className="mono text-[11px] text-dim">{formatDuration(asset.durationSec)}</span>
      </div>
    </div>
  )
}
