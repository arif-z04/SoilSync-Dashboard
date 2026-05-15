export function parsePacket(line) {
  const parts = line.trim().split('|');

  if (parts.length !== 8) {
    return null;
  }
  const rawTs = Number(parts[0]);
  let timestamp = null;

  // Normalize timestamp: Arduino may send seconds (common) or milliseconds.
  // If value is missing or zero, keep null so UI shows 'No time'.
  if (!Number.isNaN(rawTs) && rawTs > 0) {
    // Heuristic: values less than 1e12 are very likely seconds, convert to ms.
    timestamp = rawTs < 1e12 ? rawTs * 1000 : rawTs;
  }

  return {
    timestamp,
    soilPercent: Number(parts[1]),
    soilRaw: Number(parts[2]),
    status: parts[3],
    batteryPercent: Number(parts[4]),
    solarStatus: parts[5],
    solarVoltage: Number(parts[6]),
    batteryVoltage: Number(parts[7]),
  };
}
