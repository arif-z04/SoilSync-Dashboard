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
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  return payload;
}
