import { normalizeTimestamp } from './utils.js';

export const formatChartData = (history) => {
  const filtered = (history || [])
    .filter(Boolean)
    .slice()
    .sort((left, right) => {
      const leftTime = normalizeTimestamp(left.timestamp) ?? 0;
      const rightTime = normalizeTimestamp(right.timestamp) ?? 0;

      return leftTime - rightTime;
    });

  return filtered.map((item, index) => ({
    time: normalizeTimestamp(item.timestamp)
      ? new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date(normalizeTimestamp(item.timestamp)))
      : String(index),
    soilPercent: Number(item.soilPercent ?? 0),
    soilRaw: Number(item.soilRaw ?? 0),
    batteryVoltage: Number(item.batteryVoltage ?? 0),
    batteryPercent: Number(item.batteryPercent ?? 0),
    solarVoltage: Number(item.solarVoltage ?? 0),
  }));
};

export const getSoilStatusColor = (status) => {
  switch (status) {
    case 'WET':
      return 'text-blue-600';
    case 'MID':
      return 'text-yellow-600';
    case 'DRY':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const getSoilStatusBg = (status) => {
  switch (status) {
    case 'WET':
      return 'bg-blue-100';
    case 'MID':
      return 'bg-yellow-100';
    case 'DRY':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
};

export const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'WET':
      return 'bg-blue-500';
    case 'MID':
      return 'bg-yellow-500';
    case 'DRY':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const formatTime = (timestamp, fallback = 'No time') => {
  const normalizedTimestamp = normalizeTimestamp(timestamp);
  if (normalizedTimestamp === null) return fallback;

  return new Date(normalizedTimestamp).toLocaleTimeString();
};
