export function validatePacket(packet) {
  if (!packet) return false;

  if (isNaN(packet.soilPercent)) return false;
  if (isNaN(packet.soilRaw)) return false;
  if (isNaN(packet.batteryPercent)) return false;
  if (isNaN(packet.solarVoltage)) return false;
  if (isNaN(packet.batteryVoltage)) return false;

  return true;
}
