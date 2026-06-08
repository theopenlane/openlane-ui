import { useEffect, useState } from 'react'
import { PDF_MIME_TYPE } from './preview-mime'

export type TPdfPreviewState = { status: 'idle' } | { status: 'loading' } | { status: 'error' } | { status: 'ready'; blobUrl: string }

const IDLE: TPdfPreviewState = { status: 'idle' }
const LOADING: TPdfPreviewState = { status: 'loading' }
const ERROR: TPdfPreviewState = { status: 'error' }

// usePdfBlobPreview fetches a PDF from a presigned URL and exposes it as a
// blob: URL safe to embed in an <iframe>.
//
// The fetch+blob round-trip is required (not just convenient) because:
//   - The disk-storage dev backend sets X-Frame-Options: SAMEORIGIN, which
//     blocks cross-origin iframe embeds of the presigned URL.
//   - The S3/R2 providers have historically signed URLs with
//     Content-Disposition: attachment, which forces a download instead of
//     inline render.
// Both restrictions live on the original HTTP response and do not survive
// re-serving the bytes from a blob: URL.
//
// We also force the MIME type to application/pdf because some legacy uploads
// come back as application/octet-stream, and iframes will not render a blob:
// URL without a recognized PDF MIME.
//
// Once the backend ships inline-disposition for safe MIMEs and re-detects
// octet-stream at upload time, the call sites can be collapsed to
// <iframe src={presignedURL} /> and this hook can be deleted.
export const usePdfBlobPreview = (url: string, enabled: boolean): TPdfPreviewState => {
  const [state, setState] = useState<TPdfPreviewState>(IDLE)

  useEffect(() => {
    if (!enabled || !url) return

    let cancelled = false
    let createdBlobUrl: string | null = null

    setState(LOADING)

    fetch(url)
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
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl)
    }
  }, [enabled, url])

  return state
}
