'use client'

import React, { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'

type CollapsibleSectionProps = {
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ label, children, defaultOpen = false, open: controlledOpen, onOpenChange }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const contentId = useId()
  const open = controlledOpen ?? uncontrolledOpen

  const toggle = () => {
    if (controlledOpen === undefined) setUncontrolledOpen(!open)
    onOpenChange?.(!open)
  }

  return (
    <div>
      <Button type="button" variant="link" className="gap-1 text-sm font-medium text-foreground" onClick={toggle} aria-expanded={open} aria-controls={contentId}>
        <ChevronDown className={cn('transition-transform', !open && '-rotate-90')} />
        {label}
      </Button>
      {open ? (
        <div id={contentId} className="mt-2">
          {children}
        </div>
      ) : null}
    </div>
  )
}

export default CollapsibleSection
