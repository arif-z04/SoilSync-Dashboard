'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatChartData } from '@/lib/chartData';
import ChartTooltip from './ChartTooltip';

export function SolarChart({ history }) {
  const valid = (history || []).filter(Boolean);
  if (valid.length === 0) return null;

  const data = formatChartData(valid);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Solar Voltage
          </h3>
          <p className="text-sm font-medium text-slate-500">
            Charging input from the solar panel
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-sm border border-amber-100">
          <span className="text-sm font-bold">V</span>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip content={<ChartTooltip unit="V" />} />
            {data.map((d, i) => (
              <ReferenceLine
                key={`ref-so-${i}`}
                x={d.time}
                stroke="#e2e8f0"
                strokeDasharray="2 2"
                strokeOpacity={0.8}
                ifOverflow="extendDomain"
              />
            ))}
            <Area
              type="monotone"
              dataKey="solarVoltage"
              stroke="#d97706"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSolar)"
              activeDot={{ r: 6, strokeWidth: 0, fill: '#b45309' }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
