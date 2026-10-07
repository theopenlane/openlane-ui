'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Separator } from '@repo/ui/separator'
import { SectionCard } from './section-card'
import { EmptyState } from './empty-state'
import { VendorLogo } from './vendor-logo'
import type { ScanSummaryItem } from './types'

type ConfirmGroupProps = {
  title: string
  items: ScanSummaryItem[]
  onEdit: () => void
}

export const ConfirmGroup = ({ title, items, onEdit }: ConfirmGroupProps) => (
  <SectionCard
    title={title}
    count={items.length}
    collapsible
    defaultOpen={false}
    titleAction={
      <Button
        variant="secondary"
        onClick={(event) => {
          event.stopPropagation()
          onEdit()
        }}
      >
        Edit
      </Button>
    }
  >
    {items.length === 0 ? (
      <EmptyState message="None selected." />
    ) : (
      items.map((item, index) => (
        <React.Fragment key={item.id}>
          <div className="flex items-start gap-3 px-6 py-3">
            {item.logoUrl !== undefined ? <VendorLogo name={item.name} logoUrl={item.logoUrl} /> : null}
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.name}</p>
              {item.description ? <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p> : null}
              {item.linkedVendorNames?.length ? <p className="mt-1 text-xs text-muted-foreground">Vendors: {item.linkedVendorNames.join(', ')}</p> : null}
            </div>
          </div>
          {index < items.length - 1 ? <Separator separatorClass="bg-border" /> : null}
        </React.Fragment>
      ))
    )}
  </SectionCard>
)
