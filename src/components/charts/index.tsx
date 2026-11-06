import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const axisStyle = { fontSize: 10.5, fill: '#63718A' } as const;

const tooltipStyle = {
  background: '#131C2E',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  fontSize: 12,
  color: '#E8EEF9',
  boxShadow: '0 16px 32px -16px rgba(0,0,0,.9)',
  padding: '8px 10px',
} as const;

export function TrendAreaChart({
  data,
  keys,
  height = 260,
  xKey = 'date',
}: {
  data: Record<string, string | number>[];
  keys: { key: string; name: string; color: string }[];
  height?: number;
  xKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {keys.map((k) => (
            <linearGradient key={k.key} id={`grad-${k.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={k.color} stopOpacity={0.34} />
              <stop offset="100%" stopColor={k.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} dy={6} interval="preserveStartEnd" />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={44} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9AA8BF', fontSize: 11 }} />
        {keys.map((k) => (
          <Area
            key={k.key}
            type="monotone"
            dataKey={k.key}
            name={k.name}
            stroke={k.color}
            strokeWidth={2}
            fill={`url(#grad-${k.key})`}
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  height = 220,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="66%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            verticalAlign="bottom"
            height={28}
            iconType="circle"
            iconSize={6}
            formatter={(v) => <span style={{ color: '#9AA8BF', fontSize: 11 }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="num text-[22px] font-semibold leading-none text-[var(--text-1)]">{centerValue}</div>
          <div className="mt-1 text-[11px] text-[var(--text-3)]">{centerLabel}</div>
        </div>
      )}
    </div>
  );
}

export function BarRankChart({
  data,
  height = 220,
  color = '#3D7DFF',
  xKey = 'name',
  yKey = 'value',
}: {
  data: Record<string, string | number>[];
  height?: number;
  color?: string;
  xKey?: string;
  yKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey={xKey}
          tick={{ ...axisStyle, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={96}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
        <Bar dataKey={yKey} fill={color} radius={[0, 3, 3, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TpsChart({ data, height = 200 }: { data: { time: string; tps: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="time" tick={axisStyle} axisLine={false} tickLine={false} interval={11} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="tps" name="TPS" stroke="#22D3EE" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
