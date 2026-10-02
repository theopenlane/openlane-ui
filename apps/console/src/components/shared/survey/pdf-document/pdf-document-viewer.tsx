'use client'

import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs, type DocumentProps } from 'react-pdf'
import { useDebounce } from '@uidotdev/usehooks'
import { ArrowDown, CircleCheck, ExternalLink } from 'lucide-react'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { cn } from '@repo/ui/lib/utils'
import { InfoCard } from '@/components/shared/file-preview/preview-chrome'
import { useElementSize } from '@/hooks/useElementSize'
import { SCROLL_TO_END_MESSAGE } from './pdf-document-model'

import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()

const RESIZE_SETTLE_MS = 150
const MAX_DEVICE_PIXEL_RATIO = 2
const PAGE_RENDER_MARGIN = '100% 0px'

type TPdfDocument = Parameters<NonNullable<DocumentProps['onLoadSuccess']>>[0]

const readPageAspectRatios = (pdf: TPdfDocument) =>
  Promise.all(
    Array.from({ length: pdf.numPages }, async (_, index) => {
      const page = await pdf.getPage(index + 1)
      const { width, height } = page.getViewport({ scale: 1 })
      return height / width
    }),
  )

export type TPdfDocumentViewerProps = {
  url: string
  title: string
  trackReading: boolean
  requireReading: boolean
  hasReachedEnd: boolean
  onReachedEnd: () => void
}

const PdfDocumentViewer = ({ url, title, trackReading, requireReading, hasReachedEnd, onReachedEnd }: TPdfDocumentViewerProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const endMarkerRef = useRef<HTMLDivElement>(null)
  const pageWidth = Math.floor(useDebounce(useElementSize(scrollContainerRef, 'content-box').width, RESIZE_SETTLE_MS))
  const [pageAspectRatios, setPageAspectRatios] = useState<number[] | null>(null)
  const [visiblePages, setVisiblePages] = useState<ReadonlySet<number>>(() => new Set())
  const [loadFailed, setLoadFailed] = useState(false)

  const isLaidOut = pageAspectRatios !== null && pageWidth > 0
  const isWatchingForEnd = trackReading && !hasReachedEnd && isLaidOut

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const endMarker = endMarkerRef.current
    if (!isWatchingForEnd || !scrollContainer || !endMarker) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onReachedEnd()
      },
      { root: scrollContainer },
    )
    observer.observe(endMarker)

    return () => observer.disconnect()
  }, [isWatchingForEnd, onReachedEnd])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!isLaidOut || !scrollContainer) return

    const observer = new IntersectionObserver(
      (entries) =>
        setVisiblePages((previous) => {
          const next = new Set(previous)
          entries.forEach((entry) => {
            const pageNumber = Number(entry.target.getAttribute('data-pdf-page'))
            if (entry.isIntersecting) next.add(pageNumber)
            else next.delete(pageNumber)
          })
          return next
        }),
      { root: scrollContainer, rootMargin: PAGE_RENDER_MARGIN },
    )
    scrollContainer.querySelectorAll('[data-pdf-page]').forEach((placeholder) => observer.observe(placeholder))

    return () => observer.disconnect()
  }, [isLaidOut, pageAspectRatios])

  const handleLoadSuccess = (pdf: TPdfDocument) => {
    readPageAspectRatios(pdf).then(setPageAspectRatios, () => setLoadFailed(true))
  }

  const handleLoadFailure = () => setLoadFailed(true)

  const openInNewTab = (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={loadFailed && trackReading ? onReachedEnd : undefined}
      className="inline-flex items-center gap-1 align-middle text-blue-500 hover:underline"
    >
      Open in a new tab
      <ExternalLink className="size-3.5 shrink-0" />
    </a>
  )

  const devicePixelRatio = Math.min(MAX_DEVICE_PIXEL_RATIO, window.devicePixelRatio)

  const loadFailureCard = (
    <InfoCard
      tone="error"
      message={trackReading ? 'This document could not be displayed here. Open it in a new tab to read it.' : 'This document could not be displayed here.'}
      action={openInNewTab}
    />
  )

  const pageLoadingSkeleton = <Skeleton className="h-[560px] w-full rounded-md" />

  const renderPages = () => {
    if (loadFailed) return loadFailureCard
    if (!isLaidOut) return pageLoadingSkeleton

    return pageAspectRatios.map((aspectRatio, index) => {
      const pageNumber = index + 1
      return (
        <div key={pageNumber} data-pdf-page={pageNumber} className="bg-white shadow-sm" style={{ width: pageWidth, height: Math.round(pageWidth * aspectRatio) }}>
          {visiblePages.has(pageNumber) && <Page pageNumber={pageNumber} width={pageWidth} devicePixelRatio={devicePixelRatio} loading={null} />}
        </div>
      )
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={scrollContainerRef}
        role="region"
        aria-label={title}
        tabIndex={0}
        className={cn(
          'overflow-y-auto rounded-md border bg-muted p-3 [scrollbar-gutter:stable] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          !loadFailed && 'h-[600px] max-h-[70vh]',
        )}
      >
        <Document
          file={url}
          suspense={false}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadFailure}
          onSourceError={handleLoadFailure}
          externalLinkTarget="_blank"
          externalLinkRel="noopener noreferrer"
          className="flex flex-col items-center gap-3"
          loading={pageLoadingSkeleton}
          error={loadFailureCard}
        >
          {renderPages()}
        </Document>
        <div ref={endMarkerRef} aria-hidden="true" className="h-px" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5" aria-live="polite">
          {hasReachedEnd ? (
            <>
              <CircleCheck size={16} className="text-success" />
              Marked as read.
            </>
          ) : (
            trackReading &&
            requireReading &&
            !loadFailed && (
              <>
                <ArrowDown size={16} />
                {SCROLL_TO_END_MESSAGE}
              </>
            )
          )}
        </span>
        {!loadFailed && openInNewTab}
      </div>
    </div>
  )
}

export default PdfDocumentViewer
