import { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '@/lib/db';
import { getCertificateInfo } from '@/lib/ssl';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const db = await openDb();
    const certInfo = await getCertificateInfo(url);
    
    await db.run(`
      UPDATE websites 
      SET issuer = ?, 
          validFrom = ?, 
          validTo = ?, 
          lastChecked = ?,
          status = ?,
          statusDetails = ?
      WHERE url = ?
    `, [
      certInfo.issuer,
      certInfo.validFrom.toISOString(),
      certInfo.validTo.toISOString(),
      new Date().toISOString(),
      certInfo.status,
      certInfo.statusDetails || null,
      url
    ]);

    const website = await db.get('SELECT * FROM websites WHERE url = ?', [url]);
    res.status(200).json(website);
  } catch (error) {
    console.error(`Failed to refresh certificate for ${url}:`, error);
    res.status(500).json({ error: 'Failed to refresh certificate' });
  }
} 