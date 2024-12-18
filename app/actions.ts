'use server'

import { Website } from '@/lib/db';
import { openDb } from '@/lib/db';

export async function addWebsiteAction(url: string) {
  console.log('Starting addWebsiteAction for URL:', url);
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log('Sending request to:', `${apiUrl}/api/websites`);

    const response = await fetch(`${apiUrl}/api/websites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      console.error('Server response error:', data);
      throw new Error(data.error || `Failed to add website: ${response.statusText}`);
    }

    return { success: true, website: data };
  } catch (error) {
    console.error(`Error adding website ${url}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getWebsitesAction() {
  try {
    const db = await openDb();
    const websites = await db.all(`SELECT * FROM websites`);
    return websites;
  } catch (error) {
    console.error('Error fetching websites from database:', error);
    throw error;
  }
}

