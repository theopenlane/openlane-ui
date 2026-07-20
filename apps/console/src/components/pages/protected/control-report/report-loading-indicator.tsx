'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

type ReportLoadingIndicatorProps = {
  loadedCount: number
  totalCount: number
  isRefetching: boolean
}

const buildLabel = ({ loadedCount, totalCount, isRefetching }: ReportLoadingIndicatorProps): string => {
  if (isRefetching) return 'Refreshing report…'
  if (totalCount > loadedCount) return `Loading controls… ${loadedCount} of ${totalCount}`
  return 'Loading controls…'
}

const ReportLoadingIndicator: React.FC<ReportLoadingIndicatorProps> = (props) => (
  <div role="status" className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
    <Loader2 size={14} className="animate-spin" aria-hidden />
    <span>{buildLabel(props)}</span>
  </div>
)

export default ReportLoadingIndicator
