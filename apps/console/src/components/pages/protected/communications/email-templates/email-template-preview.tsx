'use client'

import React, { useMemo } from 'react'
import { Loader2, TriangleAlert } from 'lucide-react'
import { useHtmlPurifier, HTML_DOCUMENT_SANITIZE_CONFIG } from '@/lib/html/sanitize-html'

interface EmailTemplatePreviewProps {
  previewHtml: string
  isFetching: boolean
  errorMessage?: string | null
  isCatalogDrift: boolean
  selectedKey: string
}

export const EmailTemplatePreview: React.FC<EmailTemplatePreviewProps> = ({ previewHtml, isFetching, errorMessage, isCatalogDrift, selectedKey }) => {
  const purifier = useHtmlPurifier()

  const sanitizedPreview = useMemo(() => {
    if (!previewHtml) return ''
    return purifier.sanitize(previewHtml, HTML_DOCUMENT_SANITIZE_CONFIG)
  }, [previewHtml, purifier])

  if (errorMessage) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <TriangleAlert size={16} className="shrink-0 text-yellow-500" />
        <span>Could not render preview: {errorMessage}</span>
      </div>
    )
  }

  if (sanitizedPreview) {
    return (
      <>
        <div className="relative">
          {isFetching && (
            <div className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
              <Loader2 size={12} className="animate-spin" />
              Updating
            </div>
          )}
          <iframe srcDoc={sanitizedPreview} title="Email template preview" sandbox="" className="w-full h-150 rounded-md border border-border bg-white" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Live preview — updates as you edit the configuration above. Unfilled fields fall back to demo values.</p>
      </>
    )
  }

  if (isCatalogDrift) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <TriangleAlert size={16} className="shrink-0 text-yellow-500" />
        <span>
          This template uses the catalog key <span className="font-mono">{selectedKey}</span>, which is no longer available, so it can&apos;t be previewed.
        </span>
      </div>
    )
  }

  return <p className="text-sm text-muted-foreground">Select a template to preview it.</p>
}
