import { useState } from 'react'
import type { Device, Space } from '@/types'
import { DEVICE_STATUS_COLOR } from '@/constants/enums'

export function SpaceMap({
  spaces,
  devices,
  onSelect,
  onlyAlert,
}: {
  spaces: Space[]
  devices: Device[]
  onSelect: (id: string) => void
  onlyAlert?: boolean
}) {
  const [hover, setHover] = useState<Device | null>(null)
  const visible = onlyAlert ? devices.filter((d) => d.status === 'warning' || d.status === 'offline') : devices

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 1000 560" className="w-full h-full" role="img" aria-label="空间设备分布图">
        <defs>
          <pattern id="mapgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border-subtle)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1000" height="560" fill="url(#mapgrid)" opacity="0.5" />

        {spaces.map((s) => (
          <g key={s.id}>
            <rect
              x={s.map.x}
              y={s.map.y}
              width={s.map.w}
              height={s.map.h}
              rx={12}
              fill="var(--map-fill)"
              stroke="var(--border-strong)"
              strokeWidth={1}
            />
            <text x={s.map.x + 14} y={s.map.y + 22} fill="var(--text-secondary)" fontSize="12" fontWeight={500}>
              {s.name}
            </text>
            <text x={s.map.x + 14} y={s.map.y + 38} fill="var(--text-muted)" fontSize="10">
              {s.building} {s.floor > 0 ? `${s.floor}F` : 'B1'} · {s.deviceCount} 台
            </text>
          </g>
        ))}

        {visible.map((d) => {
          const color = DEVICE_STATUS_COLOR[d.status]
          const isAlert = d.status === 'warning'
          return (
            <g
              key={d.id}
              transform={`translate(${d.position.x}, ${d.position.y})`}
              className="cursor-pointer"
              onClick={() => onSelect(d.id)}
              onMouseEnter={() => setHover(d)}
              onMouseLeave={() => setHover(null)}
            >
              {isAlert && <circle r={11} fill={color} opacity={0.18} className="animate-softPulse" />}
              <circle r={9} fill="transparent" />
              <circle r={4.5} fill={color} stroke="var(--bg-base)" strokeWidth={1.5} />
              {d.status === 'online' && <circle r={4.5} fill="none" stroke={color} strokeWidth={0.6} opacity={0.5} />}
            </g>
          )
        })}

        {hover && (
          <g transform={`translate(${Math.min(hover.position.x + 10, 860)}, ${Math.max(hover.position.y - 34, 8)})`}>
            <rect
              x={0}
              y={0}
              rx={6}
              width={hover.name.length * 11 + 78}
              height={30}
              fill="var(--bg-elevated)"
              stroke="var(--border-strong)"
              strokeWidth={0.8}
            />
            <text x={9} y={13} fill="var(--text-primary)" fontSize="10.5" fontWeight={500}>
              {hover.name}
            </text>
            <text x={9} y={24} fill="var(--text-muted)" fontSize="9">
              {hover.code} · {hover.ip}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
