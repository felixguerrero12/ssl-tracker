import { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const db = await openDb();
    await db.run('DELETE FROM websites WHERE url = ?', [url]);
    res.status(200).json({ message: 'Website deleted successfully' });
  } catch (error) {
    console.error('Failed to delete website:', error);
    res.status(500).json({ error: 'Failed to delete website' });
  }
} 