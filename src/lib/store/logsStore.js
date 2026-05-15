import { deserializePayload, getDb, hasMongoConfig } from '../db/mongo.js';

const logs = [];

export function addLog(type, message) {
  const entry = {
    type,
    message,
    time: new Date().toISOString(),
  };

  logs.unshift(entry);

  if (logs.length > 500) {
    logs.pop();
  }

  if (!hasMongoConfig()) return;

  return persistLog(entry);
}

export function clearLogsLocal() {
  logs.length = 0;
}

export async function clearLogs() {
  clearLogsLocal();

  if (!hasMongoConfig()) return;

  try {
    const db = await getDb();
    await db.collection('logs_data').deleteMany({});
  } catch (error) {
    console.error('Failed to clear log entries:', error.message || error);
    throw error;
  }
}

async function persistLog(entry) {
  try {
    const db = await getDb();
    await db.collection('logs_data').insertOne({
      payload: entry,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to persist log entry:', error.message || error);
    throw error;
  }
}

export async function getLogs() {
  if (hasMongoConfig()) {
    try {
      const db = await getDb();
      const records = await db
        .collection('logs_data')
        .find({})
        .sort({ createdAt: -1 })
        .limit(500)
        .toArray();

      const parsed = records
        .map((record) => deserializePayload(record.payload))
        .filter(Boolean);

      if (parsed.length > 0) {
        logs.length = 0;
        logs.push(...parsed);
        return parsed;
      }
    } catch {
      // Fall back to the in-memory snapshot when MongoDB is unavailable.
    }
  }

  return logs;
}
