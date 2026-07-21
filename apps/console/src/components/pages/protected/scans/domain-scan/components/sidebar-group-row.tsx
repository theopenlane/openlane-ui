'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { VendorLogo } from './vendor-logo'
import type { LinkableItem } from '../types'

type SidebarGroupRowProps = {
  title: string
  items: LinkableItem[]
  onEdit: () => void
}

export const SidebarGroupRow = ({ title, items, onEdit }: SidebarGroupRowProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div className="flex cursor-pointer items-center justify-between px-4 py-3 select-none" onClick={() => setOpen((value) => !value)}>
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
          <Badge variant="secondary">{items.length}</Badge>
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation()
              onEdit()
            }}
          >
            Edit
          </Button>
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`} />
        </div>
      </div>
      {open ? (
        <div className="space-y-3 px-4 pt-1 pb-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">None selected.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                {item.logoUrl !== undefined ? <VendorLogo name={item.name} logoUrl={item.logoUrl} /> : null}
                <span className="text-sm">{item.name}</span>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
