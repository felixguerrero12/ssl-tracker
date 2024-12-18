'use client'

import React from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      {children}
    </div>
  )
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

export function DialogContent({ className = '', children }: DialogContentProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative ${className}`}>
      {children}
    </div>
  )
}

export function DialogHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 border-b ${className}`} {...props} />
  )
}

export function DialogTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={`text-lg font-semibold ${className}`} {...props} />
  )
}

export function DialogClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
} 