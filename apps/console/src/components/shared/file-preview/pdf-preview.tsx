'use client'

import React, { useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { cn } from '@repo/ui/lib/utils'
import { useElementSize } from '@/hooks/useElementSize'
import { InfoCard, LoadingSpinner } from '@/components/shared/file-preview/preview-chrome'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

// the same worker build the survey pdf question uses, so both share one pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()

type Props = {
  // source is the pdf itself or a url to it, such as a blob: url
  source: Blob | string
  title: string
  // className overrides the default preview height and frame
  className?: string
  // errorAction is shown when the pdf cannot be rendered, such as a download button
  errorAction?: React.ReactNode
}

// PdfPreview renders every page of a pdf on a themed background, fitted to the container width,
// instead of the browser's built-in viewer whose dark chrome ignores the app theme
const PdfPreview: React.FC<Props> = ({ source, title, className, errorAction }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(containerRef, 'content-box')
  const [pageCount, setPageCount] = useState(0)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <InfoCard tone="error" message="Could not render this PDF." action={errorAction} />
  }

  return (
    <div ref={containerRef} role="document" aria-label={title} className={cn('h-[80vh] w-full overflow-auto rounded-md border bg-muted p-4', className)}>
      <Document file={source} loading={<LoadingSpinner />} onLoadSuccess={({ numPages }) => setPageCount(numPages)} onLoadError={() => setFailed(true)} className="flex flex-col items-center gap-4">
        {width > 0 && Array.from({ length: pageCount }, (_, index) => <Page key={index + 1} pageNumber={index + 1} width={width} loading={null} className="shadow-sm" />)}
      </Document>
    </div>
  )
}

export default PdfPreview
