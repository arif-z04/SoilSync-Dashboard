import React from 'react';

export default function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 p-3 text-sm shadow-xl shadow-slate-200/80 backdrop-blur">
      <div className="mb-2 text-xs font-semibold text-slate-500">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: p.color }}
          />
          <div className="font-semibold text-slate-700">
            {p.name || p.dataKey}:{' '}
          </div>
          <div className="ml-1 font-semibold text-slate-950">
            {p.value}
            {unit || ''}
          </div>
        </div>
      ))}
    </div>
  );
}
