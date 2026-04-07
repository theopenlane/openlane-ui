'use client'

import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { type CampaignTargetsNodeNonNull } from '@/lib/graphql-hooks/campaign-target'
import { formatDate } from '@/utils/date'

interface RecipientDetailPanelProps {
  recipient: CampaignTargetsNodeNonNull
  onClose: () => void
}

export const RecipientDetailPanel: React.FC<RecipientDetailPanelProps> = ({ recipient, onClose }) => {
  return (
    <div>
      <Button variant="secondary" icon={<ArrowLeft size={14} />} iconPosition="left" onClick={onClose} className="mb-4">
        Back to Details
      </Button>

      <div className="rounded-md border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Recipient Overview</h3>

        <div className="flex flex-col gap-3">
          <div>
            <span className="text-xs text-muted-foreground">Name</span>
            <p className="text-sm">{recipient.fullName || '—'}</p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">Email</span>
            <p className="text-sm">{recipient.email}</p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">Status</span>
            <p className="text-sm">{recipient.completedAt ? 'Completed' : recipient.sentAt ? 'Sent' : 'Pending'}</p>
          </div>

          {recipient.sentAt && (
            <div>
              <span className="text-xs text-muted-foreground">Sent At</span>
              <p className="text-sm">{formatDate(recipient.sentAt as string)}</p>
            </div>
          )}

          {recipient.completedAt && (
            <div>
              <span className="text-xs text-muted-foreground">Completed At</span>
              <p className="text-sm">{formatDate(recipient.completedAt as string)}</p>
            </div>
          )}

          {recipient.createdAt && (
            <div>
              <span className="text-xs text-muted-foreground">Created At</span>
              <p className="text-sm">{formatDate(recipient.createdAt as string)}</p>
            </div>
          )}

          {recipient.updatedAt && (
            <div>
              <span className="text-xs text-muted-foreground">Last Updated</span>
              <p className="text-sm">{formatDate(recipient.updatedAt as string)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
