'use client';

import { formatBangladeshDateTime } from '@/lib/utils';

export function LatestDataCard({ data, loading }) {
  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Latest Raw Data
        </h3>
        <div className="space-y-2 text-sm text-slate-500">
          <p>Waiting for data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Latest Raw Data
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Sensor:{' '}
            {data.timestamp
              ? formatBangladeshDateTime(data.timestamp)
              : 'No timestamp'}
            <br />
            Posted:{' '}
            {data.serverReceivedAt
              ? formatBangladeshDateTime(data.serverReceivedAt)
              : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Soil Moisture %
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {data.soilPercent !== undefined
              ? data.soilPercent.toFixed(1)
              : '--'}
          </span>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Raw Value
          </span>
          <span className="text-2xl font-bold text-slate-700">
            {data.soilRaw !== undefined ? Math.round(data.soilRaw) : '--'}
          </span>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Battery (V)
          </span>
          <span className="text-2xl font-bold text-emerald-600">
            {data.batteryVoltage !== undefined
              ? data.batteryVoltage.toFixed(2)
              : '--'}
          </span>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Solar (V)
          </span>
          <span className="text-2xl font-bold text-amber-600">
            {data.solarVoltage !== undefined
              ? data.solarVoltage.toFixed(2)
              : '--'}
          </span>
        </div>
      </div>
    </div>
  );
}
