'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addWebsiteAction } from '../actions'
import { Website } from '@/lib/db'

export default function AddWebsite({ onWebsiteAdded }: { onWebsiteAdded: (website: Website) => void }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('Submitting URL:', url);
      if (!url) {
        throw new Error('Please enter a URL');
      }

      // Basic URL validation
      try {
        const urlObj = new URL(url);
        if (!urlObj.protocol.startsWith('https')) {
          throw new Error('Please enter a valid URL starting with https://');
        }
      } catch (err) {
        throw new Error('Please enter a valid URL starting with https://');
      }

      console.log('Calling addWebsiteAction');
      const result = await addWebsiteAction(url);
      console.log('addWebsiteAction result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to add website');
      }

      setUrl('');
      onWebsiteAdded(result.website);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
              required
              pattern="https://.*"
              disabled={isLoading}
              className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Website'}
          </Button>
        </div>
        {error && (
            <p className="text-red-500 mt-2 text-sm">{error}</p>
        )}
      </form>
  )
}

