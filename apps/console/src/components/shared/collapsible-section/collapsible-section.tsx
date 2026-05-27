'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type CollapsibleSectionProps = {
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ label, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-sm font-medium" aria-expanded={open}>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`} />
        {label}
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  )
}

export default CollapsibleSection
