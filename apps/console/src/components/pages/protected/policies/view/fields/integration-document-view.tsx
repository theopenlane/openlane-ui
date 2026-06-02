'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { HTML_SANITIZE_CONFIG, useHtmlPurifier } from '@/lib/html/sanitize-html'
import { getProviderIcon } from '@/lib/integrations/utils'

type Props = {
  policy: InternalPolicyByIdFragment
}

const PROVIDER_NAME = 'Google Drive'

const IntegrationDocumentView: React.FC<Props> = ({ policy }) => {
  const purifier = useHtmlPurifier()
  const contents = policy.liveExternalContents
  const sourceUrl = policy.url
  const sanitizedDocument = useMemo(() => (contents ? purifier.sanitize(contents, { ...HTML_SANITIZE_CONFIG, WHOLE_DOCUMENT: true }) : ''), [purifier, contents])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Image src={getProviderIcon(PROVIDER_NAME)} alt={`${PROVIDER_NAME} icon`} width={20} height={20} className="shrink-0 object-contain" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{PROVIDER_NAME}</p>
              <Badge variant="secondary">Read-only</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Managed by integration — edit the document in {PROVIDER_NAME}.</p>
          </div>
        </div>
        {sourceUrl && (
          <Button variant="outline" icon={<ExternalLink size={14} />} iconPosition="left" onClick={() => window.open(sourceUrl, '_blank', 'noopener,noreferrer')}>
            Open in {PROVIDER_NAME}
          </Button>
        )}
      </div>

      {contents ? (
        <iframe
          srcDoc={sanitizedDocument}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          className="h-[80vh] w-full rounded-md border bg-white"
          title={`${policy.name} document`}
        />
      ) : (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <p>No document contents available. The integration may still be syncing.</p>
        </div>
      )}
    </div>
  )
}

export default IntegrationDocumentView
