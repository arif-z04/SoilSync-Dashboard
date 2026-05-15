export function normalizeTimestamp(timestamp) {
  if (timestamp == null || timestamp === '') return null;

  if (timestamp instanceof Date) {
    const time = timestamp.getTime();
    return Number.isNaN(time) ? null : time;
  }

  const numericTimestamp = Number(timestamp);

  if (Number.isFinite(numericTimestamp) && numericTimestamp > 0) {
    return numericTimestamp < 1e12 ? numericTimestamp * 1000 : numericTimestamp;
  }

  const parsedTimestamp = Date.parse(timestamp);
  return Number.isFinite(parsedTimestamp) && parsedTimestamp > 0
    ? parsedTimestamp
    : null;
}

function createDate(timestamp) {
  const normalizedTimestamp = normalizeTimestamp(timestamp);
  return normalizedTimestamp === null ? null : new Date(normalizedTimestamp);
}

export function formatTime(timestamp, fallback = 'No time') {
  const date = createDate(timestamp);
  if (!date) return fallback;

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatBangladeshTime(timestamp) {
  const date = createDate(timestamp);
  if (!date) return 'No time';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatBangladeshDateTime(timestamp) {
  const date = createDate(timestamp);
  if (!date) return 'No time';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDate(timestamp) {
  const date = createDate(timestamp);
  if (!date) return 'No date';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function formatDateTime(timestamp) {
  const date = createDate(timestamp);
  if (!date) return 'No time';

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
