import { deserializePayload, getDb, hasMongoConfig } from '../db/mongo.js';

let latestData = null;

export function setLatestData(data) {
  latestData = data;

  if (!hasMongoConfig()) return;

  return persistLatestData(data);
}

export function setLatestDataLocal(data) {
  latestData = data;
}

export function clearLatestDataLocal() {
  latestData = null;
}

export async function clearLatestData() {
  clearLatestDataLocal();

  if (!hasMongoConfig()) return;

  try {
    const db = await getDb();
    await db.collection('latest_data').deleteOne({ key: 'latest' });
  } catch (error) {
    console.error('Failed to clear latest data:', error.message || error);
    throw error;
  }
}

async function persistLatestData(data) {
  try {
    const db = await getDb();
    await db.collection('latest_data').updateOne(
      { key: 'latest' },
      {
        $set: {
          key: 'latest',
          payload: data,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error('Failed to persist latest data:', error.message || error);
    throw error;
  }
}

export async function getLatestData() {
  if (hasMongoConfig()) {
    try {
      const db = await getDb();
      const record = await db
        .collection('latest_data')
        .findOne({ key: 'latest' });

      if (record?.payload) {
        const parsed = deserializePayload(record.payload);

        if (parsed) {
          // If DB record lacks serverReceivedAt (older records), prefer the in-memory
          // `latestData`'s serverReceivedAt set when the packet was received.
          if (!parsed.serverReceivedAt && latestData?.serverReceivedAt) {
            parsed.serverReceivedAt = latestData.serverReceivedAt;
          }

          latestData = parsed;
          return parsed;
        }
      }
    } catch {
      // Fall back to the in-memory snapshot when MongoDB is unavailable.
    }
  }

  return latestData;
}
