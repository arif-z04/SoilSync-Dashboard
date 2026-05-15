'use client';

import { Sun } from 'lucide-react';

export function SolarCard({ data }) {
  if (!data) return null;

  const isActive = data.solarStatus === 'ON';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-amber-50' : 'bg-slate-50'}`}>
          <Sun className={`w-5 h-5 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
        </div>
        <div
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            isActive
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isActive ? 'Charging' : 'Idle'}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Solar Input</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-slate-900 tracking-tighter">
            {typeof data.solarVoltage === 'number' ? data.solarVoltage.toFixed(2) : data.solarVoltage}
          </span>
          <span className="text-xl font-semibold text-slate-400">V</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Panel Status</span>
          <span className={`font-semibold ${isActive ? 'text-amber-600' : 'text-slate-500'}`}>
            {data.solarStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
