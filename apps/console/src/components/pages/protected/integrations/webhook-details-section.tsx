'use client'

import React from 'react'
import { Button } from '@repo/ui/button'

type WebhookDetails = {
  endpointUrl: string
  secret: string
}

type WebhookDetailsSectionProps = {
  details: WebhookDetails
  onDismiss: () => void
}

const WebhookDetailsSection = ({ details, onDismiss }: WebhookDetailsSectionProps) => {
  return (
    <section className="mb-8">
      <h3 className="mb-3 text-base uppercase tracking-widest">Webhook Configuration</h3>
      <div className="max-w-lg rounded-md border border-amber-500/30 bg-amber-50/50 p-6 dark:bg-amber-950/20">
        <p className="mb-4 text-xs text-muted-foreground">These values are shown only once. Copy them now and configure them in your provider.</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Webhook URL</label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-1.5 text-xs break-all">{details.endpointUrl}</code>
              <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(details.endpointUrl)}>
                Copy
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Webhook Secret</label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-1.5 text-xs break-all">{details.secret}</code>
              <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(details.secret)}>
                Copy
              </Button>
            </div>
          </div>
        </div>
        <Button type="button" variant="transparent" size="sm" className="mt-4" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </section>
  )
}

export default WebhookDetailsSection
