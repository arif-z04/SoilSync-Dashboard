import { clearAllData } from './clearAllData.js';

const DHAKA_TIME_ZONE = 'Asia/Dhaka';
const SECONDS_IN_DAY = 24 * 60 * 60;

let clearTimer = null;
let schedulerStarted = false;

function getDhakaTimeParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DHAKA_TIME_ZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now);

  const getNumber = (type) =>
    Number(parts.find((part) => part.type === type)?.value || '0');

  return {
    hour: getNumber('hour'),
    minute: getNumber('minute'),
    second: getNumber('second'),
  };
}

function getMsUntilNextDhakaMidnight(now = new Date()) {
  const { hour, minute, second } = getDhakaTimeParts(now);
  const elapsedSeconds = hour * 3600 + minute * 60 + second;
  const remainingSecondsRaw =
    (SECONDS_IN_DAY - elapsedSeconds) % SECONDS_IN_DAY;
  const remainingSeconds =
    remainingSecondsRaw === 0 ? SECONDS_IN_DAY : remainingSecondsRaw;

  return remainingSeconds * 1000 - now.getMilliseconds();
}

async function runScheduledClear() {
  try {
    const result = await clearAllData();
    console.log('[DailyClear] Completed at Dhaka 12:00 AM', result.cleared);
  } catch (error) {
    console.error(
      '[DailyClear] Failed:',
      error && error.message ? error.message : error,
    );
  } finally {
    scheduleNextDhakaMidnightClear();
  }
}

function scheduleNextDhakaMidnightClear() {
  if (clearTimer) {
    clearTimeout(clearTimer);
  }

  const delay = getMsUntilNextDhakaMidnight();

  clearTimer = setTimeout(() => {
    void runScheduledClear();
  }, delay);

  console.log(
    `[DailyClear] Next clear scheduled in ${Math.round(delay / 1000)} seconds (Asia/Dhaka midnight).`,
  );
}

export function startDailyDhakaMidnightClearScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  scheduleNextDhakaMidnightClear();
}
