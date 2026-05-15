import { getLogs } from '@/lib/store/logsStore';

export default async function handler(req, res) {
  try {
    const logs = await getLogs();
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to load logs' });
  }
}
