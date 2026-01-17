import { InfoIcon } from 'lucide-react'
import React from 'react'

const SectionWarning = () => {
  return (
    <div className="border border-document-draft-border bg-infobox rounded-md p-4 mb-6">
      <div className="flex items-start gap-2">
        <InfoIcon className="text-brand-100 shrink-0 mt-0.5" size={16} />
        <div>
          <p className="text-sm">You have unpublished changes for this setting</p>
        </div>
      </div>
    </div>
  )
}

export default SectionWarning
