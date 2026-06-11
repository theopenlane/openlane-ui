'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { HTML_DOCUMENT_SANITIZE_CONFIG, useHtmlPurifier } from '@/lib/html/sanitize-html'
import { getProviderIcon } from '@/lib/integrations/utils'
import { resolvePolicyIntegrationProvider } from '@/components/pages/protected/policies/view/fields/policy-integration-providers'

type Props = {
  policy: InternalPolicyByIdFragment
}

const IntegrationDocumentView: React.FC<Props> = ({ policy }) => {
  const purifier = useHtmlPurifier()
  const contents = policy.liveExternalContents
  const integration = policy.integrations?.edges?.find((edge) => edge?.node)?.node ?? null
  const providerName = integration?.name || integration?.family || 'integration'
  const provider = resolvePolicyIntegrationProvider(integration)
  const sourceUrl = provider?.buildSourceUrl(policy) ?? null
  const sanitizedDocument = useMemo(() => (contents ? purifier.sanitize(contents, HTML_DOCUMENT_SANITIZE_CONFIG) : ''), [purifier, contents])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Image src={getProviderIcon(providerName)} alt={`${providerName} icon`} width={20} height={20} className="shrink-0 object-contain" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{providerName}</p>
              <Badge variant="secondary">Read-only</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Managed by integration — edit the document in {providerName}.</p>
          </div>
        </div>
        {sourceUrl && (
          <Button variant="outline" icon={<ExternalLink size={14} />} iconPosition="left" onClick={() => window.open(sourceUrl, '_blank', 'noopener,noreferrer')}>
            Open in {providerName}
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
