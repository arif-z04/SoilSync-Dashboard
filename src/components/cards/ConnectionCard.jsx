'use client';

import { Signal } from 'lucide-react';

export function ConnectionCard({ data }) {
  const isConnected = data !== null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-2 rounded-lg ${isConnected ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <Signal className={`w-5 h-5 ${isConnected ? 'text-emerald-500' : 'text-rose-500'}`} />
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Network</span>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Signal</p>
        <div className="flex items-center gap-2">
          <div className={`text-2xl font-bold tracking-tight ${isConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isConnected ? 'Stable' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2">
        <div className={`flex-1 h-1.5 rounded-full ${isConnected ? 'bg-emerald-100' : 'bg-rose-100'} overflow-hidden`}>
          <div className={`h-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'} w-full`} />
        </div>
        <span className={`text-[10px] font-bold ${isConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isConnected ? 'LIVE' : 'LOST'}
        </span>
      </div>
    </div>
  );
}
