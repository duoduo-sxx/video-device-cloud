import { useEffect, useRef, useState } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Camera,
  SkipBack,
  SkipForward,
  Settings2,
} from 'lucide-react'
import type { SceneSegment, VideoItem } from '../types'
import { usePlayer } from '../stores'
import { cn, formatDuration, formatTimecode } from '../lib/utils'
import { toast, Tooltip } from './ui'

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

export default function VideoPlayer({
  video,
  scenes,
  onCapture,
  className,
}: {
  video: VideoItem
  scenes?: SceneSegment[]
  onCapture?: (t: number) => void
  className?: string
}) {
  const {
    currentTime,
    playing,
    rate,
    volume,
    muted,
    setDuration,
    toggle,
    seek,
    step,
    setRate,
    setVolume,
    toggleMute,
  } = usePlayer()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [rateOpen, setRateOpen] = useState(false)
  const [hovering, setHovering] = useState(true)
  const hideTimer = useRef<number | null>(null)

  useEffect(() => {
    setDuration(video.duration)
  }, [video.id, video.duration, setDuration])

  const currentScene = scenes?.find((s) => currentTime >= s.start && currentTime < s.end) ?? scenes?.[0]
  const thumb = currentScene?.thumbnailUrl ?? video.coverUrl
  const pct = video.duration ? (currentTime / video.duration) * 100 : 0

  const showControls = () => {
    setHovering(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setHovering(false), 2600)
  }

  const toggleFullscreen = () => {
    const el = wrapRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.().catch(() => toast('当前环境不支持全屏', 'error'))
  }

  const capture = () => {
    onCapture?.(currentTime)
    toast(`已截取 ${formatTimecode(currentTime)} 的画面`, 'success')
  }

  return (
    <div
      ref={wrapRef}
      className={cn('group relative overflow-hidden rounded-card bg-[#0B0E14]', className)}
      onMouseMove={showControls}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={thumb}
          alt=""
          className="h-full w-full object-cover"
          style={{
            animation: playing ? 'kenburns 22s ease-in-out infinite alternate' : 'none',
            transform: playing ? undefined : 'scale(1)',
            transition: 'opacity .2s',
          }}
          onError={(e) => {
            const el = e.currentTarget
            el.style.opacity = '0'
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

        <div className="pointer-events-none absolute right-3 top-3 rounded bg-black/45 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-white/80">
          {formatTimecode(currentTime)}
        </div>
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/75">
            {video.width}×{video.height} · {video.fps}fps
          </span>
          {currentScene && (
            <span className="rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/75">
              镜头 {currentScene.index} · {currentScene.shotType} · {currentScene.cameraMove}
            </span>
          )}
        </div>

        {!playing && (
          <button
            onClick={toggle}
            className="absolute inset-0 flex items-center justify-center"
            aria-label="播放"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#111827] shadow-xl transition-transform hover:scale-105">
              <Play size={22} className="ml-0.5" fill="currentColor" />
            </span>
          </button>
        )}

        {currentScene && playing && (
          <div className="pointer-events-none absolute bottom-16 left-3 max-w-[70%] rounded bg-black/45 px-2 py-1 text-[11px] leading-4 text-white/85">
            {currentScene.description}
          </div>
        )}
      </div>

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 transition-opacity duration-200',
          hovering || !playing ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div
          className="group/bar relative mb-1.5 h-4 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            seek(((e.clientX - rect.left) / rect.width) * video.duration)
          }}
        >
          <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/20">
            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/bar:opacity-100"
            style={{ left: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-2 text-white/80">
          <button onClick={toggle} className="rounded p-1 hover:bg-white/10 hover:text-white">
            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>
          <Tooltip content="后退 5 秒">
            <button onClick={() => step(-5)} className="rounded p-1 hover:bg-white/10 hover:text-white">
              <SkipBack size={14} />
            </button>
          </Tooltip>
          <Tooltip content="前进 5 秒">
            <button onClick={() => step(5)} className="rounded p-1 hover:bg-white/10 hover:text-white">
              <SkipForward size={14} />
            </button>
          </Tooltip>

          <span className="num ml-0.5 font-mono text-[11px] text-white/85">
            {formatDuration(currentTime, true)}
            <span className="mx-0.5 text-white/35">/</span>
            {formatDuration(video.duration, true)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <button onClick={toggleMute} className="rounded p-1 hover:bg-white/10 hover:text-white">
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="hidden w-16 sm:block"
              style={{ background: 'rgba(255,255,255,.25)' }}
            />

            <div className="relative">
              <button
                onClick={() => setRateOpen((v) => !v)}
                className="flex items-center gap-0.5 rounded px-1.5 py-1 text-[11px] hover:bg-white/10 hover:text-white"
              >
                {rate}x
              </button>
              {rateOpen && (
                <div className="absolute bottom-full right-0 z-30 mb-1 w-20 overflow-hidden rounded-md border border-line bg-elevated py-1 shadow-xl">
                  {RATES.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRate(r)
                        setRateOpen(false)
                      }}
                      className={cn(
                        'block w-full px-2 py-1 text-left text-[11px] hover:bg-hover',
                        r === rate ? 'text-brand' : 'text-t2',
                      )}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Tooltip content="截帧">
              <button onClick={capture} className="rounded p-1 hover:bg-white/10 hover:text-white">
                <Camera size={14} />
              </button>
            </Tooltip>
            <Tooltip content="全屏">
              <button onClick={toggleFullscreen} className="rounded p-1 hover:bg-white/10 hover:text-white">
                <Maximize size={14} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PlayerPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-card border border-line bg-subtle">
      <Settings2 size={22} className="text-t3" />
      <p className="text-xs text-t3">{title}</p>
    </div>
  )
}
