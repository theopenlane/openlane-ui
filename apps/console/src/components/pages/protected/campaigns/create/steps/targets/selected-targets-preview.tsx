'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { normalizeEmail } from '@/lib/validators'
import { type CampaignTargetEntry } from './target-entry'

interface SelectedTargetsPreviewProps {
  title: string
  targets: CampaignTargetEntry[]
  onRemove: (email: string) => void
  onClearAll: () => void
}

export const SelectedTargetsPreview: React.FC<SelectedTargetsPreviewProps> = ({ title, targets, onRemove, onClearAll }) => (
  <div className="flex flex-col gap-2 rounded-md border border-border p-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">
        {title} ({targets.length})
      </span>
      {targets.length > 0 && (
        <Button variant="secondary" size="sm" type="button" onClick={onClearAll}>
          Clear all
        </Button>
      )}
    </div>

    {targets.length === 0 ? (
      <p className="py-4 text-center text-sm text-muted-foreground">No recipients selected yet. Check the boxes above to add them.</p>
    ) : (
      <ul className="max-h-56 overflow-y-auto">
        {targets.map((target) => (
          <li key={normalizeEmail(target.email)} className="flex items-center gap-2 border-b border-border px-1 py-1.5 last:border-b-0">
            <span className="flex min-w-0 flex-col">
              {target.fullName && <span className="truncate text-sm">{target.fullName}</span>}
              <span className="truncate text-xs text-muted-foreground">{target.email}</span>
            </span>
            <button type="button" aria-label={`Remove ${target.email}`} className="ml-auto shrink-0 cursor-pointer text-muted-foreground" onClick={() => onRemove(target.email)}>
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
)
