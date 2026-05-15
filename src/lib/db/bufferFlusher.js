import { getDb, hasMongoConfig } from './mongo.js';
import { addLog } from '../store/logsStore.js';
import { setLatestData } from '../store/latestData.js';

const buffer = [];
let flushing = false;

export function pushPacket(packet) {
  buffer.push({ packet, ts: new Date() });
}

export function clearPacketBuffer() {
  buffer.length = 0;
}

async function flushBuffer() {
  if (!hasMongoConfig()) return;
  if (flushing) return;
  if (buffer.length === 0) return;

  flushing = true;
  const items = buffer.splice(0, buffer.length);

  try {
    const db = await getDb();

    const docs = items.map(({ packet, ts }) => ({
      // Overwrite incoming Arduino timestamp with server receive time (ms)
      // include serverReceivedAt in payload so UI can show backend post time
      payload: { ...packet, timestamp: ts.getTime(), serverReceivedAt: ts.toISOString() },
      createdAt: ts,
    }));

    if (docs.length > 0) {
      await db.collection('history_data').insertMany(docs);

      // Update latest_data with the most recent packet from this batch
      const last = docs[docs.length - 1].payload;
      await db.collection('latest_data').updateOne(
        { key: 'latest' },
        {
          $set: { key: 'latest', payload: last, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );

      // Inform store layer (in-memory) about the latest saved packet
      try {
        await setLatestData(last);
      } catch (e) {
        // setLatestData persists too, but we've already written latest; ignore errors
      }

      await addLog('DB', `Flushed ${docs.length} packets to MongoDB`);
    }
  } catch (err) {
    console.error(
      'Buffer flush failed:',
      err && err.message ? err.message : err,
    );
    await addLog(
      'ERROR',
      `Buffer flush failed: ${err && err.message ? err.message : String(err)}`,
    );
    // On failure, push items back to buffer head to retry
    buffer.unshift(...items);
  } finally {
    flushing = false;
  }
}

// Flush every 10 seconds
setInterval(() => {
  void flushBuffer();
}, 10000);

export default { pushPacket, flushBuffer };
