'use client'

import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@repo/ui/cardpanel'
import DocsLinkTooltip from './docs-link-tooltip'
import IntegrationCardIcons from './integration-card-icons'
import IntegrationTagList from './integration-tag-list'

type IntegrationCardShellProps = {
  providerSlug: string
  logoUrl?: string
  docsUrl?: string
  displayName: string
  tags: string[]
  description: string
  headerBadge?: React.ReactNode
  titleExtra?: React.ReactNode
  statusBadge?: React.ReactNode
  metadata?: React.ReactNode
  footer: React.ReactNode
}

const IntegrationCardShell = ({ providerSlug, logoUrl, docsUrl, displayName, tags, description, headerBadge, titleExtra, statusBadge, metadata, footer }: IntegrationCardShellProps) => {
  return (
    <Card className="relative flex h-full min-h-[300px] flex-col overflow-visible transition-all duration-200 hover:-translate-y-1 hover:border-primary">
      <CardHeader className="relative flex-row items-start gap-3 space-y-0 pb-3">
        {headerBadge}
        {docsUrl ? <DocsLinkTooltip href={docsUrl} label={displayName} /> : null}

        <div className="w-full">
          <div className="flex gap-4">
            <IntegrationCardIcons providerName={providerSlug} logoUrl={logoUrl} />

            <div className="flex min-w-0 flex-1 flex-col justify-center self-center">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate">{displayName}</span>
                {titleExtra}
              </div>
            </div>
          </div>

          {statusBadge ? <div className="mt-2 flex min-h-[22px]">{statusBadge}</div> : null}

          <div className="mb-1 mt-3 border-t pt-3">
            <IntegrationTagList tags={tags} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-[112px] flex-1 items-center pb-2 pt-4">
        <div className="w-full">
          <p className="line-clamp-3 text-sm text-muted-foreground">{description}</p>
          {metadata}
        </div>
      </CardContent>

      <CardFooter className="mt-auto gap-2 pt-0">{footer}</CardFooter>
    </Card>
  )
}

export default IntegrationCardShell
