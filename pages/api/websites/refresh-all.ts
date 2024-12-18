import { NextApiRequest, NextApiResponse } from 'next';
import { openDb, Website } from '@/lib/db';
import { getCertificateInfo } from '@/lib/ssl';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await openDb();
    const websites = await db.all('SELECT * FROM websites');
    
    const updatedWebsites = await Promise.all(
      websites.map(async (website: Website) => {
        try {
          const certInfo = await getCertificateInfo(website.url);
          await db.run(`
            UPDATE websites 
            SET lastChecked = ?, status = ?, validFrom = ?, validTo = ?
            WHERE url = ?
          `, [
            new Date().toISOString(),
            certInfo.status,
            certInfo.validFrom.toISOString(),
            certInfo.validTo.toISOString(),
            website.url
          ]);
          return { ...website, ...certInfo };
        } catch (error) {
          console.error(`Failed to refresh certificate for ${website.url}:`, error);
          return website;
        }
      })
    );

    res.status(200).json(updatedWebsites);
  } catch (error) {
    console.error('Failed to refresh all certificates:', error);
    res.status(500).json({ error: 'Failed to refresh certificates' });
  }
} 