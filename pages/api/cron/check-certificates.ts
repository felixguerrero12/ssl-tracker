import { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '@/lib/db';
import { getCertificateInfo } from '@/lib/ssl';
import { sendNotification } from '@/lib/notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Optional: Add authentication for cron jobs
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = await openDb();
    const websites = await db.all('SELECT * FROM websites');
    const results = [];

    for (const website of websites) {
      try {
        const certInfo = await getCertificateInfo(website.url);
        
        // Update the website status in the database
        await db.run(`
          UPDATE websites 
          SET issuer = ?, 
              validFrom = ?, 
              validTo = ?, 
              lastChecked = CURRENT_TIMESTAMP,
              status = ?,
              statusDetails = ?
          WHERE url = ?
        `, [
          certInfo.issuer,
          certInfo.validFrom.toISOString(),
          certInfo.validTo.toISOString(),
          certInfo.status,
          certInfo.statusDetails,
          website.url
        ]);

        // Send notification if certificate is expired or about to expire
        if (certInfo.status === 'expired' || certInfo.status === 'error') {
          await sendNotification({
            title: `SSL Certificate Issue for ${website.url}`,
            message: certInfo.statusDetails || 'Certificate needs attention',
            type: certInfo.status
          });
        }

        results.push({
          url: website.url,
          status: certInfo.status,
          details: certInfo.statusDetails
        });
      } catch (error) {
        console.error(`Error checking ${website.url}:`, error);
        results.push({
          url: website.url,
          status: 'error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error('Failed to check certificates:', error);
    res.status(500).json({ error: 'Failed to check certificates' });
  }
} 