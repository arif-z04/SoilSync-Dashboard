'use client';

import { getSoilStatusColor, getSoilStatusBg } from '@/lib/chartData';
import { History } from 'lucide-react';
import { formatBangladeshDateTime } from '@/lib/utils';
import { useState } from 'react';

export function DataTable({ history }) {
  const valid = (history || []).filter(Boolean);
  // Pagination: 10 items per page, latest items already first in `valid`
  const ITEMS_PER_PAGE = 10;
  const [page, setPage] = useState(0);

  if (valid.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(valid.length / ITEMS_PER_PAGE));
  const displayData = valid.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Historical Data
          </h3>
          <p className="text-sm font-medium text-slate-500">
            Last 10 received packets from Arduino
          </p>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          <History className="w-5 h-5 text-slate-600" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                Timestamp
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">
                Soil %
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                Condition
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">
                Battery
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">
                Solar V
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">
                Raw ADC
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayData.map((row, idx) => (
              <tr
                key={idx}
                className="group transition-colors hover:bg-slate-50/80"
              >
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                  <div className="flex flex-col">
                    <span>
                      Sensor: {formatBangladeshDateTime(row.timestamp)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      Posted:{' '}
                      {row.serverReceivedAt
                        ? formatBangladeshDateTime(row.serverReceivedAt)
                        : '—'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-bold text-slate-900">
                    {row.soilPercent}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getSoilStatusBg(row.status)} ${getSoilStatusColor(row.status)}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-slate-900">
                      {row.batteryPercent}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {row.batteryVoltage.toFixed(2)}V
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`text-sm font-bold ${row.solarStatus === 'ON' ? 'text-amber-600' : 'text-slate-950'}`}
                  >
                    {typeof row.solarVoltage === 'number'
                      ? row.solarVoltage.toFixed(2)
                      : row.solarVoltage}
                    V
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-mono text-slate-500 font-medium">
                  {row.soilRaw}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Showing {Math.min(valid.length, page * ITEMS_PER_PAGE + 1)}-
          {Math.min(valid.length, (page + 1) * ITEMS_PER_PAGE)} of{' '}
          {valid.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 rounded bg-slate-100 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <div className="text-sm text-slate-700">
            Page {page + 1} / {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 rounded bg-slate-100 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
