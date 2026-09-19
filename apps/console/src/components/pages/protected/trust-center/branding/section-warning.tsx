import { InfoIcon } from 'lucide-react'
import React from 'react'
import { cn } from '@repo/ui/lib/utils'

interface SectionWarningProps {
  message?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

const SectionWarning = ({ message = 'You have unpublished changes for this setting', icon, className }: SectionWarningProps) => {
  return (
    <div className={cn('border border-document-draft-border bg-infobox rounded-md p-4 mb-6', className)}>
      <div className="flex items-start gap-2">
        {icon ?? <InfoIcon className="text-brand-100 shrink-0 mt-0.5" size={16} />}
        <div>{typeof message === 'string' ? <p className="text-sm">{message}</p> : message}</div>
      </div>
    </div>
  )
}

export default SectionWarning
