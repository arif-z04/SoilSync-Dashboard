import { MongoClient } from 'mongodb';

const mongoUri = normalizeMongoUri(process.env.MONGODB_URI);
const dbName = process.env.DB_NAME?.trim();

let clientPromise;

function normalizeMongoUri(uri) {
  if (!uri) return '';

  const cleaned = uri.trim().replace(/;+$/, '');

  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    return cleaned.slice(1, -1);
  }

  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    return cleaned.slice(1, -1);
  }

  return cleaned;
}

function getClientPromise() {
  if (!mongoUri || !dbName) {
    throw new Error('MongoDB is not configured');
  }

  if (!clientPromise) {
    const client = new MongoClient(mongoUri);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export function hasMongoConfig() {
  return Boolean(mongoUri && dbName);
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db(dbName);
}

export function serializePayload(payload) {
  return JSON.stringify(payload);
}

export function deserializePayload(payload) {
  if (payload == null) return null;

  if (typeof payload === 'string') {
    try {
      return normalizePayload(JSON.parse(payload));
    } catch {
      return null;
    }
  }

  return normalizePayload(payload);
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const normalizedPayload = { ...payload };

  if ('timestamp' in normalizedPayload) {
    normalizedPayload.timestamp = normalizeTimestampValue(normalizedPayload.timestamp);
  }

  if ('serverReceivedAt' in normalizedPayload) {
    normalizedPayload.serverReceivedAt =
      normalizeTimestampValue(normalizedPayload.serverReceivedAt) ??
      normalizedPayload.serverReceivedAt;
  }

  return normalizedPayload;
}

function normalizeTimestampValue(timestamp) {
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
