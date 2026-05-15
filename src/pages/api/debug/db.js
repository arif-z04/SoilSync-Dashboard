import { getDb, hasMongoConfig, deserializePayload } from '@/lib/db/mongo';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!hasMongoConfig()) {
    return res.status(500).json({
      ok: false,
      connected: false,
      error: 'MongoDB is not configured',
    });
  }

  try {
    const db = await getDb();

    const [latestDoc, historyDocs, logDocs, historyCount, logCount] =
      await Promise.all([
        db.collection('latest_data').findOne({ key: 'latest' }),
        db
          .collection('history_data')
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray(),
        db
          .collection('logs_data')
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray(),
        db.collection('history_data').estimatedDocumentCount(),
        db.collection('logs_data').estimatedDocumentCount(),
      ]);

    return res.status(200).json({
      ok: true,
      connected: true,
      dbName: process.env.DB_NAME || null,
      latest: latestDoc?.payload ? deserializePayload(latestDoc.payload) : null,
      history: historyDocs
        .map((doc) => deserializePayload(doc.payload))
        .filter(Boolean),
      logs: logDocs
        .map((doc) => deserializePayload(doc.payload))
        .filter(Boolean),
      counts: {
        history: historyCount,
        logs: logCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      connected: false,
      error: error.message || 'Failed to read MongoDB',
    });
  }
}
