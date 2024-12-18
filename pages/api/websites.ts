import { NextApiRequest, NextApiResponse } from 'next';
import { getCertificateInfo } from '@/lib/ssl';
import { addWebsite } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const certInfo = await getCertificateInfo(url);
      
      // Add the website to the database regardless of certificate status
      const website = await addWebsite({
        url,
        issuer: certInfo.issuer,
        validFrom: certInfo.validFrom.toISOString(),
        validTo: certInfo.validTo.toISOString(),
        lastChecked: new Date().toISOString(),
        status: certInfo.status,
        statusDetails: certInfo.statusDetails
      });

      res.status(200).json(website);
    } catch (error) {
      // If there's a certificate error, still try to add the website but with error status
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const website = await addWebsite({
        url,
        issuer: 'Unknown',
        validFrom: new Date().toISOString(),
        validTo: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        status: 'error',
        statusDetails: errorMessage
      });

      // Return 200 since we successfully added the website, even though there was a cert error
      res.status(200).json(website);
    }
  } catch (error) {
    console.error('Failed to process request:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to add website' 
    });
  }
} 