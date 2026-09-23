import { InfoIcon } from 'lucide-react'
import React from 'react'
import { cn } from '@repo/ui/lib/utils'

interface SectionWarningProps {
  message: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

const SectionWarning = ({ message, icon, className }: SectionWarningProps) => {
  return (
    <div className={cn('border border-document-draft-border bg-infobox rounded-md p-4 mb-6', className)}>
      <div className="flex items-start gap-2">
        {icon ?? <InfoIcon className="text-primary shrink-0 mt-0.5" size={16} />}
        <div>{typeof message === 'string' ? <p className="text-sm">{message}</p> : message}</div>
      </div>
    </div>
  )
}

export const UnpublishedChangesWarning = ({ previewUrl }: { previewUrl: string }) => (
  <SectionWarning
    message={
      <p className="text-sm">
        You have unpublished changes for this setting.
        {previewUrl && (
          <>
            {' '}
            See{' '}
            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
              Preview<span className="sr-only"> site (opens in a new tab)</span>
            </a>
            .
          </>
        )}
      </p>
    }
  />
)

export default SectionWarning
