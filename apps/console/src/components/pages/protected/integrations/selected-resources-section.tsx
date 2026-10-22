'use client'

import React from 'react'
import { FileText, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { type IntegrationSelectedResource } from '@/lib/integrations/types'
import { pluralizeWithCount } from '@/utils/strings'

type SelectedResourcesSectionProps = {
  resources: IntegrationSelectedResource[]
  canRemove: boolean
  isBusy: boolean
  onRemove: (resourceId: string) => void
}

const SelectedResourcesSection = ({ resources, canRemove, isBusy, onRemove }: SelectedResourcesSectionProps) => (
  <div className="flex min-w-0 flex-col gap-2">
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>DOCUMENTS</span>
      {resources.length > 0 ? <span>{pluralizeWithCount(resources.length, 'document')} selected</span> : null}
    </div>
    {resources.length === 0 ? (
      <p className="text-sm text-muted-foreground">No documents selected yet.</p>
    ) : (
      <div role="region" aria-label="Selected documents" tabIndex={0} className="max-h-48 overflow-y-auto rounded-md">
        <ul className="flex flex-col gap-1">
          {resources.map((resource) => {
            const label = resource.name || resource.id

            return (
              <li key={resource.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm">
                <span className="flex w-0 min-w-0 flex-1 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <TruncatedCell className="min-w-0" portal>
                    {label}
                  </TruncatedCell>
                </span>
                {canRemove ? (
                  <Button type="button" variant="icon" size="icon-xs" descriptiveTooltipText={`Remove ${label}`} disabled={isBusy} onClick={() => onRemove(resource.id)}>
                    <X />
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
    )}
  </div>
)

export default SelectedResourcesSection
