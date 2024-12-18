'use client'

import { useState, useEffect } from 'react'
import { Website } from '@/lib/db'
import { Button } from "@/components/ui/button"
import StatusBadge from './StatusBadge';
import CertificateModal from './CertificateModal';
import { Download } from 'lucide-react';

type FilterType = 'all' | 'valid' | 'expired' | 'error' | 'expiring';

export default function WebsiteList({ websites: initialWebsites, onWebsitesLoaded }: { websites: Website[], onWebsitesLoaded: (websites: Website[]) => void }) {
  const [websites, setWebsites] = useState<Website[]>(initialWebsites);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [certificateDetails, setCertificateDetails] = useState<any>(null);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState<string[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setWebsites(initialWebsites);
  }, [initialWebsites]);

  const handleExportCSV = () => {
    // Filter websites based on current filter
    const filteredWebsites = websites.filter(website => {
      if (filter === 'all') return true;
      if (filter === 'expiring') return isExpiringSoon(website.validTo);
      return website.status === filter;
    });

    // Create CSV content
    const headers = ['URL', 'Status', 'Valid Until', 'Last Checked', 'Issuer'];
    const csvContent = [
      headers.join(','),
      ...filteredWebsites.map(website => [
        website.url,
        getStatusWithExpiry(website),
        website.validTo ? new Date(website.validTo).toLocaleDateString() : 'N/A',
        website.lastChecked ? new Date(website.lastChecked).toLocaleDateString() : 'Never',
        website.issuer || 'N/A'
      ].join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const currentDate = new Date().toISOString().split('T')[0];
    link.download = `certificates_${filter}_${currentDate}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleRefreshAll = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/websites/refresh-all', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh certificates');
      }
      
      const updatedWebsites = await response.json();
      setWebsites(updatedWebsites);
      onWebsitesLoaded(updatedWebsites);
    } catch (error) {
      console.error('Error refreshing certificates:', error);
      setError('Failed to refresh certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSingle = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(prev => [...prev, url]);
    try {
      const response = await fetch('/api/websites/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh certificate');
      }
      
      const updatedWebsite = await response.json();
      const updatedWebsites = websites.map(w => w.url === url ? updatedWebsite : w);
      setWebsites(updatedWebsites);
      onWebsitesLoaded(updatedWebsites);
    } catch (error) {
      console.error('Error refreshing certificate:', error);
      setError('Failed to refresh certificate');
    } finally {
      setRefreshing(prev => prev.filter(u => u !== url));
    }
  };

  const handleDelete = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/websites/delete?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete website');
      }
      
      const updatedWebsites = websites.filter(w => w.url !== url);
      setWebsites(updatedWebsites);
      onWebsitesLoaded(updatedWebsites);
    } catch (error) {
      console.error('Error deleting website:', error);
      setError('Failed to delete website');
    }
  };

  const handleWebsiteSelect = async (website: Website) => {
    setSelectedWebsite(website);
    setLoadingCertificate(true);
    setError(null);
    setIsModalOpen(true);
    
    try {
      const response = await fetch('/api/certificates/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: website.url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch certificate details');
      }

      const certInfo = await response.json();
      setCertificateDetails(certInfo);
    } catch (error) {
      console.error('Failed to fetch certificate details:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setCertificateDetails(null);
    } finally {
      setLoadingCertificate(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWebsite(null);
    setCertificateDetails(null);
    setError(null);
  };

  const isExpiringSoon = (validTo: string | null) => {
    if (!validTo) return false;
    const expiryDate = new Date(validTo);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30; // 30 days threshold
  };

  const getStatusWithExpiry = (website: Website): string => {
    if (website.status === 'expired' || website.status === 'error') return website.status;
    if (isExpiringSoon(website.validTo)) return 'expiring';
    return website.status || 'unknown';
  };

  return (
    <div>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-green-500 text-white hover:bg-green-600' : ''}
            >
              All
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilter('valid')}
              className={filter === 'valid' ? 'bg-green-500 text-white hover:bg-green-600' : ''}
            >
              Valid
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilter('expiring')}
              className={filter === 'expiring' ? 'bg-green-500 text-white hover:bg-green-600' : ''}
            >
              Expiring Soon
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilter('expired')}
              className={filter === 'expired' ? 'bg-green-500 text-white hover:bg-green-600' : ''}
            >
              Expired
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilter('error')}
              className={filter === 'error' ? 'bg-green-500 text-white hover:bg-green-600' : ''}
            >
              Errors
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleRefreshAll} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh All'}
            </Button>
          </div>
        </div>

        {initialWebsites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No websites added yet.
          </div>
        ) : (
          <div className="border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Checked</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {initialWebsites
                  .filter(website => {
                    if (filter === 'all') return true;
                    if (filter === 'expiring') return isExpiringSoon(website.validTo);
                    return website.status === filter;
                  })
                  .map((website) => (
                    <tr 
                      key={website.url} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleWebsiteSelect(website)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="pointer-events-none">{website.url}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap pointer-events-none">
                        <StatusBadge status={getStatusWithExpiry(website)} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap pointer-events-none">
                        {website.validTo ? (
                          <span className={isExpiringSoon(website.validTo) ? 'text-amber-600 font-medium' : ''}>
                            {new Date(website.validTo).toLocaleDateString()}
                            {isExpiringSoon(website.validTo) && (
                              <span className="ml-2 text-xs">
                                ({Math.floor((new Date(website.validTo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                              </span>
                            )}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap pointer-events-none">
                        {website.lastChecked ? new Date(website.lastChecked).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefreshSingle(website.url, e);
                          }}
                          disabled={refreshing.includes(website.url)}
                        >
                          {refreshing.includes(website.url) ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(website.url, e);
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CertificateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedWebsite(null);
          setCertificateDetails(null);
          setError(null);
        }}
        certificate={certificateDetails}
        loading={loadingCertificate}
        error={error}
      />
    </div>
  );
}

