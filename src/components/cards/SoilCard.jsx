'use client';

import { Droplets } from 'lucide-react';
import { getSoilStatusColor, getSoilStatusBg } from '@/lib/chartData';

export function SoilCard({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Droplets className="w-5 h-5 text-blue-600" />
        </div>
        <div
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getSoilStatusBg(
            data.status,
          )} ${getSoilStatusColor(data.status)}`}
        >
          {data.status}
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Moisture</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-slate-900 tracking-tighter">
            {data.soilPercent}
          </span>
          <span className="text-xl font-semibold text-slate-400">%</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Sensor Value</span>
          <span className="font-mono text-slate-600 font-semibold">{data.soilRaw}</span>
        </div>
      </div>
    </div>
  );
}
