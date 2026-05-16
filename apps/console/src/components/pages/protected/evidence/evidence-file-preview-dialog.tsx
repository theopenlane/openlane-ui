import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Download } from 'lucide-react'
import { fileDownload } from '@/components/shared/lib/export.ts'
import { useNotification } from '@/hooks/useNotification'
import type { TFile } from '@/components/shared/file-table/columns'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
const PDF_EXTENSIONS = ['.pdf']

// Resolves the file extension from the backend-provided field, falling back to
// parsing the filename. Older file records were persisted with an empty
// providedFileExtension (backend bug), so deriving from providedFileName keeps
// the preview action working for those historical rows.
export const resolveFileExtension = (file: Pick<TFile, 'providedFileExtension' | 'providedFileName'>): string => {
  const fromField = file.providedFileExtension?.trim()
  if (fromField) return fromField.toLowerCase()

  const name = file.providedFileName ?? ''
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return ''
  return name.slice(dot).toLowerCase()
}

export const isPreviewableFile = (file: Pick<TFile, 'providedFileExtension' | 'providedFileName'>): boolean => {
  const ext = resolveFileExtension(file)
  return IMAGE_EXTENSIONS.includes(ext) || PDF_EXTENSIONS.includes(ext)
}

type TEvidenceFilePreviewDialogProps = {
  file: TFile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TPdfPreviewState = { status: 'idle' | 'loading' | 'error'; blobUrl: string | null }

const EvidenceFilePreviewDialog: React.FC<TEvidenceFilePreviewDialogProps> = ({ file, open, onOpenChange }) => {
  const { errorNotification } = useNotification()

  const extension = file ? resolveFileExtension(file) : ''
  const isImage = IMAGE_EXTENSIONS.includes(extension)
  const isPdf = PDF_EXTENSIONS.includes(extension)
  const url = file?.presignedURL || ''

  const [pdf, setPdf] = useState<TPdfPreviewState>({ status: 'idle', blobUrl: null })

  // PDFs cannot be rendered via a direct <iframe src={presignedURL}>:
  //   - The disk-storage dev backend sets X-Frame-Options: SAMEORIGIN, blocking cross-origin embeds.
  //   - The S3 prod provider signs URLs with Content-Disposition: attachment, which forces download.
  // Both are bypassed by fetching the bytes (CORS-governed, already permitted) and embedding via
  // a blob: URL with a PDF MIME type.
  useEffect(() => {
    if (!open || !isPdf || !url) {
      return
    }

    let cancelled = false
    let createdBlobUrl: string | null = null

    setPdf({ status: 'loading', blobUrl: null })

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' })
        createdBlobUrl = URL.createObjectURL(pdfBlob)
        setPdf({ status: 'idle', blobUrl: createdBlobUrl })
      })
      .catch(() => {
        if (cancelled) return
        setPdf({ status: 'error', blobUrl: null })
      })

    return () => {
      cancelled = true
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl)
    }
  }, [open, isPdf, url])

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-275 h-[85vh] flex flex-col gap-3 p-4">
        <DialogHeader className="pr-10">
          <DialogTitle className="truncate" title={file.providedFileName}>
            {file.providedFileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden rounded border bg-background-secondary flex items-center justify-center">
          {isImage && url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={file.providedFileName} className="max-w-full max-h-full object-contain" />
          )}
          {isPdf && pdf.status === 'loading' && <p className="text-sm">Loading preview…</p>}
          {isPdf && pdf.status === 'error' && <p className="text-sm">Failed to load preview. Try downloading the file instead.</p>}
          {isPdf && pdf.blobUrl && <iframe src={pdf.blobUrl} title={file.providedFileName} className="w-full h-full border-0" />}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" icon={<Download />} iconPosition="left" onClick={() => fileDownload(url, file.providedFileName, errorNotification)} disabled={!url}>
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EvidenceFilePreviewDialog
