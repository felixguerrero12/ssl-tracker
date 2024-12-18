'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../../components/ui/dialog"
import CertificateDetails from "./CertificateDetails"

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  certificate: any | null
  loading?: boolean
  error?: string | null
}

export default function CertificateModal({ 
  isOpen, 
  onClose, 
  certificate, 
  loading, 
  error 
}: CertificateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-6">
        <DialogClose onClick={onClose} />
        <DialogHeader>
          <DialogTitle>Certificate Details</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600">
            {error}
          </div>
        ) : certificate ? (
          <CertificateDetails certificate={certificate} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
} 