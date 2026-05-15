import { deserializePayload, getDb, hasMongoConfig } from '../db/mongo.js';

const history = [];

export function addHistory(data) {
  history.unshift(data);

  if (history.length > 1000) {
    history.pop();
  }

  if (!hasMongoConfig()) return;

  return persistHistory(data);
}

export function clearHistoryLocal() {
  history.length = 0;
}

export async function clearHistory() {
  clearHistoryLocal();

  if (!hasMongoConfig()) return;

  try {
    const db = await getDb();
    await db.collection('history_data').deleteMany({});
  } catch (error) {
    console.error('Failed to clear history data:', error.message || error);
    throw error;
  }
}

async function persistHistory(data) {
  try {
    const db = await getDb();
    await db.collection('history_data').insertOne({
      payload: data,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to persist history data:', error.message || error);
    throw error;
  }
}

export async function getHistory() {
  if (hasMongoConfig()) {
    try {
      const db = await getDb();
      const records = await db
        .collection('history_data')
        .find({})
        .sort({ createdAt: -1 })
        .limit(1000)
        .toArray();

      const parsed = records
        .map((record) => deserializePayload(record.payload))
        .filter(Boolean);

      if (parsed.length > 0) {
        history.length = 0;
        history.push(...parsed);
        return parsed;
      }
    } catch {
      // Fall back to the in-memory snapshot when MongoDB is unavailable.
    }
  }

  return history;
}
