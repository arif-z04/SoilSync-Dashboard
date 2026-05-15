import { getDb, hasMongoConfig } from '../db/mongo.js';
import { clearHistoryLocal } from '../store/historyStore.js';
import { clearLatestDataLocal } from '../store/latestData.js';
import { clearLogsLocal } from '../store/logsStore.js';
import { clearPacketBuffer } from '../db/bufferFlusher.js';

export async function clearAllData() {
  clearPacketBuffer();
  clearHistoryLocal();
  clearLatestDataLocal();
  clearLogsLocal();

  if (!hasMongoConfig()) {
    return {
      ok: true,
      cleared: { history: 0, latest: 0, logs: 0 },
      mongo: false,
    };
  }

  const db = await getDb();

  const [historyResult, latestResult, logsResult] = await Promise.all([
    db.collection('history_data').deleteMany({}),
    db.collection('latest_data').deleteOne({ key: 'latest' }),
    db.collection('logs_data').deleteMany({}),
  ]);

  return {
    ok: true,
    cleared: {
      history: historyResult.deletedCount || 0,
      latest: latestResult.deletedCount || 0,
      logs: logsResult.deletedCount || 0,
    },
    mongo: true,
  };
}
