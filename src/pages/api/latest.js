import { getLatestData } from '@/lib/store/latestData';

export default async function handler(req, res) {
  try {
    const latestData = await getLatestData();
    res.status(200).json(latestData);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || 'Failed to load latest data' });
  }
}
