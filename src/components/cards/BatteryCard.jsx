'use client';

import { Battery, BatteryCharging } from 'lucide-react';

export function BatteryCard({ data }) {
  if (!data) return null;

  const getBatteryColor = (percent) => {
    if (percent >= 66) return 'text-emerald-600';
    if (percent >= 33) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getBatteryProgressColor = (percent) => {
    if (percent >= 66) return 'bg-emerald-500';
    if (percent >= 33) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="p-2 bg-purple-50 rounded-lg">
          <Battery className="w-5 h-5 text-purple-600" />
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Power</span>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Capacity</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-bold tracking-tighter ${getBatteryColor(data.batteryPercent)}`}>
              {data.batteryPercent}
            </span>
            <span className="text-xl font-semibold text-slate-400">%</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${getBatteryProgressColor(data.batteryPercent)}`}
            style={{ width: `${data.batteryPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Battery Voltage</span>
          <span className="font-mono text-slate-600 font-semibold">{data.batteryVoltage.toFixed(2)}V</span>
        </div>
      </div>
    </div>
  );
}
