'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@theopenlane/ui/lib/utils'

export const LoadingSpinner: React.FC<{ label?: string; className?: string }> = ({ label = 'Loading', className }) => (
  <div role="status" aria-live="polite" aria-busy="true" aria-label={label} className={cn('flex h-96 w-full items-center justify-center', className)}>
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
  </div>
)
