import { NextApiRequest, NextApiResponse } from 'next';
import { getCertificateInfo } from '@/lib/ssl';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const url = req.method === 'POST' 
      ? req.body.url 
      : req.query.url;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const certInfo = await getCertificateInfo(url);
    res.status(200).json(certInfo);
  } catch (error) {
    console.error('Error checking certificate:', error);
    res.status(500).json({ 
      error: 'Failed to check certificate',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 