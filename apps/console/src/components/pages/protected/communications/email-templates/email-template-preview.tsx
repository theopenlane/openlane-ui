'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useHtmlPurifier, HTML_DOCUMENT_SANITIZE_CONFIG } from '@/lib/html/sanitize-html'
import { Callout } from '@/components/shared/callout/callout'

const MIN_PREVIEW_HEIGHT = 240

interface EmailTemplatePreviewProps {
  previewHtml: string
  isFetching: boolean
  errorMessage?: string | null
  isCatalogDrift: boolean
  selectedKey: string
}

export const EmailTemplatePreview: React.FC<EmailTemplatePreviewProps> = ({ previewHtml, isFetching, errorMessage, isCatalogDrift, selectedKey }) => {
  const purifier = useHtmlPurifier()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const [frameHeight, setFrameHeight] = useState(MIN_PREVIEW_HEIGHT)

  const sanitizedPreview = useMemo(() => {
    if (!previewHtml) return ''
    return purifier.sanitize(previewHtml, HTML_DOCUMENT_SANITIZE_CONFIG)
  }, [previewHtml, purifier])

  const syncFrameHeight = useCallback(() => {
    const root = frameRef.current?.contentDocument?.documentElement
    if (!root) return
    setFrameHeight(Math.max(Math.ceil(root.getBoundingClientRect().height), MIN_PREVIEW_HEIGHT))
  }, [])

  const handleFrameLoad = useCallback(() => {
    observerRef.current?.disconnect()
    const root = frameRef.current?.contentDocument?.documentElement
    if (!root) return
    syncFrameHeight()
    const observer = new ResizeObserver(syncFrameHeight)
    observer.observe(root)
    observerRef.current = observer
  }, [syncFrameHeight])

  useEffect(() => () => observerRef.current?.disconnect(), [])

  if (errorMessage) {
    return (
      <Callout variant="danger" compact>
        Could not render preview: {errorMessage}
      </Callout>
    )
  }

  if (sanitizedPreview) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-white">
          {isFetching && (
            <div className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
              <Loader2 size={12} className="animate-spin" />
              Updating
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <iframe
              ref={frameRef}
              srcDoc={sanitizedPreview}
              title="Email template preview"
              sandbox="allow-same-origin"
              onLoad={handleFrameLoad}
              style={{ height: frameHeight }}
              className="block w-full"
            />
          </div>
        </div>
        <p className="mt-2 shrink-0 text-xs text-muted-foreground">Live preview — updates as you edit the configuration above. Unfilled fields fall back to demo values.</p>
      </div>
    )
  }

  if (isCatalogDrift) {
    return (
      <Callout variant="warning" compact>
        This template uses the catalog key <span className="font-mono">{selectedKey}</span>, which is no longer available, so it can&apos;t be previewed.
      </Callout>
    )
  }

  return <p className="text-sm text-muted-foreground">Select a template to preview it.</p>
}
