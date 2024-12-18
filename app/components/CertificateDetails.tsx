'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { certificateToHex } from '@/lib/ssl';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CertificateDetailsProps {
  certificate: {
    issuer: string;
    validFrom: string | Date;
    validTo: string | Date;
    status: string;
    statusDetails?: string;
    serialNumber: string;
    fingerprint: string;
    rawCertificate: string;
    subjectAltNames: string[];
    subject: {
      [key: string]: string | undefined;
    };
  };
}

export default function CertificateDetails({ certificate }: CertificateDetailsProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [format, setFormat] = useState<'base64' | 'hex'>('base64');
  const [showFingerprint, setShowFingerprint] = useState(false);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-background border rounded-lg p-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold">Basic Information</h3>
          <dl className="mt-2 space-y-2">
            <div>
              <dt className="text-sm font-medium">Issuer</dt>
              <dd className="text-sm">{certificate.issuer}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium">Valid From</dt>
              <dd className="text-sm">{formatDate(certificate.validFrom)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium">Valid To</dt>
              <dd className="text-sm">{formatDate(certificate.validTo)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium">Status</dt>
              <dd className="text-sm">{certificate.status}</dd>
            </div>
          </dl>
        </div>
        
        <div>
          <h3 className="font-semibold">Technical Details</h3>
          <dl className="mt-2 space-y-2">
            <div>
              <dt className="text-sm font-medium">Serial Number</dt>
              <dd className="text-sm font-mono break-all">{certificate.serialNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium flex items-center justify-between">
                Fingerprint
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFingerprint(!showFingerprint)}
                  className="p-0 h-6"
                >
                  {showFingerprint ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </dt>
              <dd className={`text-sm font-mono transition-all duration-200 overflow-hidden ${showFingerprint ? 'max-h-40' : 'max-h-0'}`}>
                <div className="break-all">{certificate.fingerprint}</div>
              </dd>
            </div>
            {certificate.subjectAltNames?.length > 0 && (
              <div>
                <dt className="text-sm font-medium">Subject Alternative Names</dt>
                <dd className="text-sm">{certificate.subjectAltNames.join(', ')}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? 'Hide' : 'Show'} Raw Certificate
          </Button>
          {showRaw && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormat(format === 'hex' ? 'base64' : 'hex')}
            >
              Show in {format === 'hex' ? 'Base64' : 'Hex'}
            </Button>
          )}
        </div>
        
        {showRaw && (
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs font-mono">
            {format === 'hex' ? certificateToHex(certificate.rawCertificate) : certificate.rawCertificate}
          </pre>
        )}
      </div>
    </div>
  );
} 