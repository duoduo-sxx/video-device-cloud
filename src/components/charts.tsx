import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

const axisStyle = { fontSize: 11, fill: 'var(--text-muted)' }

function ChartTooltip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean
  payload?: { name?: string; value?: number | string; color?: string }[]
  label?: string
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-[#141821] px-3 py-2" style={{ boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
      <div className="mb-1 text-[11px] text-dim">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px] text-ink">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}</span>
          <span className="mono ml-auto">
            {typeof p.value === 'number' ? p.value.toLocaleString('zh-CN') : p.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TrendArea({
  data,
  dataKey,
  name,
  suffix,
  height = 220,
  color = 'var(--chart-1)',
}: {
  data: { label: string; value: number }[]
  dataKey?: string
  name: string
  suffix?: string
  height?: number
  color?: string
}) {
  const id = `grad-${(dataKey ?? name).replace(/\W/g, '')}`
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border-subtle)" vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} interval={4} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<ChartTooltip suffix={suffix} />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="value"
            name={name}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DonutChart({
  data,
  height = 200,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color?: string }[]
  height?: number
  centerLabel?: string
  centerValue?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius="66%" outerRadius="92%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
              {data.map((d, i) => (
                <Cell key={d.name} fill={d.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip suffix="%" />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="mono text-[18px] text-ink">{centerValue ?? total}</div>
          <div className="mt-0.5 text-[10px] text-dim">{centerLabel ?? '合计'}</div>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-[12px]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-muted">{d.name}</span>
            <span className="mono ml-auto text-ink">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MiniBars({ data, height = 120, color = 'var(--chart-1)' }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-subtle)" vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
          <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Sparkline({
  values,
  color = 'var(--accent)',
  width = 96,
  height = 26,
}: {
  values: number[]
  color?: string
  width?: number
  height?: number
}) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = Math.max(1, max - min)
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * (width - 2) + 1},${height - 2 - ((v - min) / span) * (height - 4)}`)
    .join(' ')
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
