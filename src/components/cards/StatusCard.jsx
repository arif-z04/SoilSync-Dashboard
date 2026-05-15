'use client';

import { Activity } from 'lucide-react';

export function StatusCard({ data }) {
  if (!data) return null;

  const formatTime = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="p-2 bg-slate-50 rounded-lg">
          <Activity className="w-5 h-5 text-slate-600" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Active
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">
          Sync Time
        </p>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {formatTime(data.timestamp)}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Buffer Health</span>
            <span className="text-emerald-500">Optimal</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full ${i < 5 ? 'bg-emerald-500' : 'bg-emerald-200 opacity-50'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
