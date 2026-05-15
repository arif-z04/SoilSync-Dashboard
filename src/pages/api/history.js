import { getHistory } from '@/lib/store/historyStore';

export default async function handler(req, res) {
  try {
    const history = await getHistory();
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to load history' });
  }
}
