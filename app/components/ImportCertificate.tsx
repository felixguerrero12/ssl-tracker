import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ImportCertificate() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    const formData = new FormData()
    formData.append('certificate', file)

    try {
      const response = await fetch('/api/websites/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to import certificate')
      }

      setFile(null)
      // Handle success (e.g., refresh website list)
    } catch (error) {
      setError('Failed to import certificate')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex gap-2">
        <Input
          type="file"
          accept=".pem,.crt,.cer"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="flex-1"
        />
        <Button type="submit" disabled={!file}>
          Import Certificate
        </Button>
      </div>
      {error && (
        <p className="text-red-500 mt-2 text-sm">{error}</p>
      )}
    </form>
  )
} 