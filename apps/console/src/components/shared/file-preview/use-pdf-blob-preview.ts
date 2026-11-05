import { useEffect, useState } from 'react'
import { PDF_MIME_TYPE } from './preview-mime'

export type TPdfPreviewState = { status: 'idle' } | { status: 'loading' } | { status: 'error' } | { status: 'ready'; blobUrl: string }

const IDLE: TPdfPreviewState = { status: 'idle' }
const LOADING: TPdfPreviewState = { status: 'loading' }
const ERROR: TPdfPreviewState = { status: 'error' }

// usePdfBlobPreview fetches a PDF from a presigned URL and exposes it as a blob: URL for PdfPreview to render.
//
// Fetching the bytes first keeps the preview independent of how the storage backend serves the file: the
// disk-storage dev backend sets X-Frame-Options: SAMEORIGIN, S3/R2 have signed URLs with
// Content-Disposition: attachment, and some legacy uploads come back as application/octet-stream. None of
// that carries over to a blob: URL, and the MIME type is forced to application/pdf.
export const usePdfBlobPreview = (url: string, enabled: boolean): TPdfPreviewState => {
  const [state, setState] = useState<TPdfPreviewState>(IDLE)

  useEffect(() => {
    if (!enabled || !url) return

    let cancelled = false
    let createdBlobUrl: string | null = null
    const controller = new AbortController()

    setState(LOADING)

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        const pdfBlob = blob.type === PDF_MIME_TYPE ? blob : new Blob([blob], { type: PDF_MIME_TYPE })
        const blobUrl = URL.createObjectURL(pdfBlob)

        // Cleanup may have fired between the await above and now; if so, the
        // local createdBlobUrl reference was already captured as null, so
        // revoke here to avoid leaking.
        if (cancelled) {
          URL.revokeObjectURL(blobUrl)
          return
        }

        createdBlobUrl = blobUrl
        setState({ status: 'ready', blobUrl })
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Error previewing PDF:', error)
        setState(ERROR)
      })

    return () => {
      cancelled = true
      controller.abort()
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl)
    }
  }, [enabled, url])

  return state
}
