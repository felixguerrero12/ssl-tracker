import * as tls from 'tls';

interface TLSConfigInfo {
  protocol: string;
  cipher: string;
  isSecure: boolean;
  minimumRecommendedProtocol: string;
}

interface CertificateInfo {
  issuer: string;
  validFrom: Date;
  validTo: Date;
  status: 'valid' | 'expired' | 'error';
  statusDetails?: string;
  serialNumber: string;
  fingerprint: string;
  rawCertificate: string;
  subjectAltNames: string[];
  subject: {
    [key: string]: string | undefined;
  };
}

export async function getCertificateInfo(url: string): Promise<CertificateInfo> {
  return new Promise((resolve, reject) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const hostname = new URL(fullUrl).hostname;
      
      const socket = tls.connect({
        host: hostname,
        port: 443,
        rejectUnauthorized: false,
      }, () => {
        try {
          const cert = socket.getPeerCertificate(true);
          
          if (!cert || Object.keys(cert).length === 0) {
            socket.end();
            reject(new Error('No certificate received from server'));
            return;
          }

          const formattedSubject: { [key: string]: string | undefined } = {};
          if (cert.subject) {
            Object.entries(cert.subject).forEach(([key, value]) => {
              formattedSubject[key] = value?.toString();
            });
          }

          const certInfo: CertificateInfo = {
            issuer: formatDN(cert.issuer),
            validFrom: new Date(cert.valid_from),
            validTo: new Date(cert.valid_to),
            status: 'valid',
            serialNumber: cert.serialNumber || 'Unknown',
            fingerprint: cert.fingerprint || 'Unknown',
            rawCertificate: cert.raw?.toString('base64') || '',
            subjectAltNames: cert.subjectaltname ? 
              cert.subjectaltname.split(', ').map(san => san.replace(/^DNS:/, '')) : [],
            subject: formattedSubject
          };

          const now = new Date();
          if (now > new Date(cert.valid_to)) {
            certInfo.status = 'expired';
            certInfo.statusDetails = 'Certificate has expired';
          } else if (now < new Date(cert.valid_from)) {
            certInfo.status = 'error';
            certInfo.statusDetails = 'Certificate not yet valid';
          }

          socket.end();
          resolve(certInfo);
        } catch (error) {
          socket.end();
          reject(error);
        }
      });

      socket.on('error', (error) => {
        socket.end();
        reject(error);
      });

      socket.setTimeout(5000, () => {
        socket.end();
        reject(new Error('Connection timed out'));
      });
    } catch (error) {
      reject(error);
    }
  });
}

function formatDN(dn: any): string {
  if (!dn) return 'Unknown';
  if (typeof dn === 'string') return dn;
  
  return Object.entries(dn)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

export function certificateToHex(rawCert: string): string {
  try {
    if (!rawCert) return '';
    const buffer = Buffer.from(rawCert, 'base64');
    return buffer.toString('hex').match(/.{1,2}/g)?.join(' ') || '';
  } catch (error) {
    console.error('Error converting certificate to hex:', error);
    return '';
  }
}

export async function checkWebsite(url: string) {
    try {
        const certInfo = await getCertificateInfo(url);
        return {
            url,
            ...certInfo,
            lastChecked: new Date().toISOString()
        };
    } catch (error) {
        console.error('Failed to check website:', error);
        throw error;
    }
}

export async function checkTLSConfiguration(url: string, port?: number): Promise<TLSConfigInfo> {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const hostname = new URL(fullUrl).hostname;
    
    return new Promise((resolve, reject) => {
      const socket = tls.connect({
        host: hostname,
        port: port || 443,
        rejectUnauthorized: false,
      }, () => {
        try {
          const protocol = socket.getProtocol() || 'unknown';
          const cipher = socket.getCipher().name || 'unknown';
          
          socket.end();
          resolve({
            protocol,
            cipher,
            isSecure: !['TLSv1', 'TLSv1.1', 'unknown'].includes(protocol),
            minimumRecommendedProtocol: 'TLSv1.2'
          });
        } catch (error) {
          socket.end();
          reject(error);
        }
      });

      socket.on('error', (error) => {
        socket.end();
        reject(error);
      });

      socket.setTimeout(5000, () => {
        socket.end();
        reject(new Error('Connection timed out'));
      });
    });
  } catch (error) {
    console.error('Error checking TLS configuration:', error);
    throw error;
  }
}


interface BatchProcessingOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export async function batchProcessCertificates(
  urls: string[],
  options: BatchProcessingOptions = {}
): Promise<Map<string, CertificateInfo>> {
  const {
    batchSize = 10,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  const results = new Map<string, CertificateInfo>();
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchPromises = batch.map(async (url) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const info = await getCertificateInfo(url);
          results.set(url, info);
          break;
        } catch (error) {
          if (attempt === maxRetries - 1) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    });
    
    await Promise.all(batchPromises);
  }
  
  return results;
}