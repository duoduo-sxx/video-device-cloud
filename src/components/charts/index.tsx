import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { money as fmtMoney, num as fmtNum } from '@/lib/format';

export const CHART_COLORS = ['#1D4ED8', '#0891B2', '#7C3AED', '#DB2777', '#EA580C', '#65A30D'];

const axisStyle = { fontSize: 11, fill: '#98A2B3' };

function TipBox({
  active,
  payload,
  label,
  money,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string }[];
  label?: string | number;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-ctl border border-line bg-white px-3 py-2 shadow-pop">
      <div className="mb-1 text-xs text-ink-3">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-2">{p.name}</span>
          <span className="num ml-auto font-medium text-ink-1">
            {money ? fmtMoney(Number(p.value ?? 0)) : fmtNum(Number(p.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- 单线面积图 ---------------- */
export function TrendArea({
  data,
  xKey,
  yKey,
  height = 220,
  color = '#1D4ED8',
  money = true,
  name = '金额',
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  money?: boolean;
  name?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.16} />
            <stop offset="100%" stopColor={color} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#F2F4F7" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={axisStyle}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => (v.length > 5 ? v.slice(5) : v)}
          minTickGap={18}
        />
        <YAxis
          tick={axisStyle}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (v >= 10000 ? `${Math.round(v / 10000)}万` : String(v))}
        />
        <Tooltip content={<TipBox money={money} />} />
        <Area
          type="monotone"
          dataKey={yKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${yKey})`}
          dot={false}
          activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------------- 多系列堆叠面积 ---------------- */
export function StackedArea({
  data,
  xKey,
  series,
  height = 260,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; name: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`sg-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.22} />
              <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="#F2F4F7" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={axisStyle}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => (v.length > 5 ? v.slice(5) : v)}
          minTickGap={20}
        />
        <YAxis
          tick={axisStyle}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (v >= 10000 ? `${Math.round(v / 10000)}万` : String(v))}
        />
        <Tooltip content={<TipBox money />} />
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stackId="1"
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={1.6}
            fill={`url(#sg-${s.key})`}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------------- 环形图 ---------------- */
export function Donut({
  data,
  height = 240,
  centerLabel,
  centerValue,
  money = true,
  innerRadius = 62,
}: {
  data: { name: string; value: number }[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  money?: boolean;
  innerRadius?: number;
}) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={86}
            paddingAngle={1.5}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<TipBox money={money} />} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xs text-ink-3">{centerLabel}</div>
          <div className="num mt-0.5 text-lg font-semibold text-ink-1">{centerValue}</div>
        </div>
      )}
    </div>
  );
}

/* ---------------- 纵向柱状 ---------------- */
export function BarChartV({
  data,
  xKey,
  yKey,
  height = 220,
  color = '#1D4ED8',
  money = true,
  name = '金额',
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  money?: boolean;
  name?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#F2F4F7" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis
          tick={axisStyle}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (v >= 10000 ? `${Math.round(v / 10000)}万` : String(v))}
        />
        <Tooltip content={<TipBox money={money} />} cursor={{ fill: '#F9FAFB' }} />
        <Bar dataKey={yKey} name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={34} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------------- 横向柱状（排行） ---------------- */
export function BarChartH({
  data,
  labelKey,
  valueKey,
  height = 200,
  money = true,
}: {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  height?: number;
  money?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="#F2F4F7" horizontal={false} />
        <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} hide />
        <YAxis
          type="category"
          dataKey={labelKey}
          tick={{ fontSize: 11, fill: '#475467' }}
          axisLine={false}
          tickLine={false}
          width={112}
        />
        <Tooltip content={<TipBox money={money} />} cursor={{ fill: '#F9FAFB' }} />
        <Bar dataKey={valueKey} fill="#1D4ED8" radius={[0, 4, 4, 0]} maxBarSize={16}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------------- 雷达图 ---------------- */
export function RadarChartBox({
  data,
  height = 240,
  color = '#1D4ED8',
}: {
  data: { label: string; score: number }[];
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#E4E7EC" />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: '#475467' }} />
        <Radar dataKey="score" stroke={color} fill={color} fillOpacity={0.16} strokeWidth={2} />
        <Tooltip content={<TipBox money={false} />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ---------------- 多线图 ---------------- */
export function MultiLine({
  data,
  xKey,
  series,
  height = 260,
  percent,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; name: string }[];
  height?: number;
  percent?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="#F2F4F7" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis
          tick={axisStyle}
          axisLine={false}
          tickLine={false}
          domain={percent ? [0.6, 1] : undefined}
          tickFormatter={(v: number) => (percent ? `${Math.round(v * 100)}%` : String(v))}
        />
        <Tooltip content={<TipBox money={false} />} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ---------------- 图例 ---------------- */
export function Legend({ items }: { items: { name: string; value?: string; color?: string }[] }) {
  return (
    <div className="mt-3 space-y-1.5">
      {items.map((it, i) => (
        <div key={it.name} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 shrink-0 rounded-sm"
            style={{ background: it.color ?? CHART_COLORS[i % CHART_COLORS.length] }}
          />
          <span className="truncate text-ink-2">{it.name}</span>
          {it.value && <span className="num ml-auto font-medium text-ink-1">{it.value}</span>}
        </div>
      ))}
    </div>
  );
}
