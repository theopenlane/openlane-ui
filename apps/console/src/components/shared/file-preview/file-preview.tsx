'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Loader2, FileWarning, Download } from 'lucide-react'
import { Button } from '@repo/ui/button'
import type { File as GqlFile } from '@repo/codegen/src/schema'

type PreviewFile = Pick<GqlFile, 'presignedURL' | 'providedFileName' | 'providedFileExtension' | 'detectedMimeType'>

type Format = 'pdf' | 'markdown' | 'html' | 'docx' | 'text' | 'unsupported'
type FetchedFormat = 'pdf' | 'markdown' | 'html' | 'docx' | 'text'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'pdf'; blob: Blob }
  | { status: 'docx'; blob: Blob }
  | { status: 'markdown'; text: string }
  | { status: 'html'; text: string }
  | { status: 'text'; text: string }

const PREVIEW_FRAME_CLASS = 'h-[80vh] w-full overflow-hidden rounded-md border bg-muted'
const PREVIEW_SCROLL_CLASS = 'docx-preview-container overflow-auto rounded-md border bg-card p-4 [&_.docx-wrapper]:bg-transparent!'
const PROSE_CARD_CLASS = 'prose prose-sm dark:prose-invert max-w-none rounded-md border bg-card p-6'

// docx-preview's per-version defaults include renderAltChunks: true (executes embedded
// HTML — XSS surface) and useBase64URL: false (creates internal object URLs for images/
// fonts that we cannot revoke when the container is torn down). Opt into a known-safe
// option set so a library upgrade can't silently regress the threat model.
const DOCX_OPTIONS = {
  renderAltChunks: false,
  renderChanges: false,
  renderComments: false,
  experimental: false,
  useBase64URL: true,
}

export const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

// Pure half of sanitizeAnchors — split out so the security-critical predicate
// can be unit-tested without a DOM environment. Returns true only when the
// href resolves to a protocol on the allowlist; malformed URLs return false.
export const isSafeLinkHref = (href: string, baseOrigin: string): boolean => {
  let protocol: string
  try {
    protocol = new URL(href, baseOrigin).protocol
  } catch {
    return false
  }
  return SAFE_LINK_PROTOCOLS.has(protocol)
}

const FETCH_TIMEOUT_MS = 30_000

// Presigned URLs have a TTL. Once expired the storage backend returns 401/403;
// surface that distinctly so the user knows the fix is a page refresh, not a
// generic "the server is broken."
const EXPIRED_URL_MESSAGE = 'Preview link has expired. Refresh the page to load a new one.'

export const detectFormat = (mimeType: string | null | undefined, extension: string | null | undefined): Format => {
  const mime = (mimeType ?? '').toLowerCase()
  const ext = (extension ?? '').toLowerCase().replace(/^\./, '')

  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (mime === 'text/markdown' || mime === 'text/x-markdown' || ext === 'md' || ext === 'mdx' || ext === 'markdown') return 'markdown'
  if (mime === 'text/html' || ext === 'html' || ext === 'htm') return 'html'
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') return 'docx'
  if (mime.startsWith('text/plain') || ext === 'txt') return 'text'
  return 'unsupported'
}

type Props = {
  file: PreviewFile
}

const FilePreview: React.FC<Props> = ({ file }) => {
  const format = useMemo(() => detectFormat(file.detectedMimeType, file.providedFileExtension), [file.detectedMimeType, file.providedFileExtension])

  if (format === 'unsupported') {
    return <UnsupportedPreview file={file} />
  }

  return <FetchingPreview file={file} format={format} />
}

const FetchingPreview: React.FC<{ file: PreviewFile; format: FetchedFormat }> = ({ file, format }) => {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const url = file.presignedURL
    if (!url) {
      setState({ status: 'error', message: 'No preview URL is available for this file.' })
      return
    }

    setState({ status: 'loading' })
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) throw new Error(EXPIRED_URL_MESSAGE)
          throw new Error(`Failed to fetch file (HTTP ${res.status})`)
        }
        const fetched = await res.blob()
        if (cancelled) return

        if (format === 'pdf' || format === 'docx') {
          setState({ status: format, blob: fetched })
          return
        }
        const asText = await fetched.text()
        if (cancelled) return
        setState({ status: format, text: asText })
      } catch (err) {
        if (cancelled) return
        if (err instanceof DOMException && err.name === 'AbortError') {
          setState({ status: 'error', message: 'Preview timed out. The file may be too large or the network is slow.' })
          return
        }
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Failed to load file' })
      }
    }

    void load()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [file.presignedURL, format])

  switch (state.status) {
    case 'loading':
      return <LoadingSpinner />
    case 'error':
      return <InfoCard tone="error" message={state.message} action={<DownloadButton file={file} />} />
    case 'pdf':
      return <PdfPreview blob={state.blob} title={file.providedFileName} />
    case 'docx':
      return <DocxPreview blob={state.blob} />
    case 'markdown':
      return (
        <div className={PROSE_CARD_CLASS}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.text}</ReactMarkdown>
        </div>
      )
    case 'html':
      return <div className={PROSE_CARD_CLASS} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(state.text) }} />
    case 'text':
      return (
        <div className={PROSE_CARD_CLASS}>
          <pre className="whitespace-pre-wrap wrap-break-word font-mono text-sm">{state.text}</pre>
        </div>
      )
  }
}

const PdfPreview: React.FC<{ blob: Blob; title: string }> = ({ blob, title }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])

  if (!previewUrl) return <LoadingSpinner />

  return <iframe src={`${previewUrl}#toolbar=0`} className={PREVIEW_FRAME_CLASS} title={title} />
}

const DocxPreview: React.FC<{ blob: Blob }> = ({ blob }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [docxError, setDocxError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false
    const target = containerRef.current

    import('docx-preview')
      .then(async ({ renderAsync }) => {
        if (cancelled) return
        // docx-preview owns the container DOM; we deliberately bypass React
        // reconciliation here and clear via innerHTML for the same reason.
        target.innerHTML = ''
        await renderAsync(blob, target, undefined, DOCX_OPTIONS)
        if (cancelled) return
        sanitizeAnchors(target)
      })
      .catch((err: unknown) => {
        if (!cancelled) setDocxError(err instanceof Error ? err.message : 'Failed to render document')
      })

    return () => {
      cancelled = true
      target.innerHTML = ''
    }
  }, [blob])

  if (docxError) {
    return <InfoCard tone="error" message={`Could not render this Word document: ${docxError}`} />
  }

  return <div ref={containerRef} className={PREVIEW_SCROLL_CLASS} />
}

// docx-preview emits anchors verbatim from the document. A malicious .docx can carry
// javascript: hrefs or other unsafe schemes; force every link through isSafeLinkHref
// and neutralize tabnabbing on the survivors.
const sanitizeAnchors = (root: HTMLElement) => {
  for (const a of root.querySelectorAll('a')) {
    const href = a.getAttribute('href')
    if (!href) continue
    if (!isSafeLinkHref(href, window.location.origin)) {
      a.removeAttribute('href')
      continue
    }
    a.target = '_blank'
    a.rel = 'noreferrer noopener'
  }
}

const UnsupportedPreview: React.FC<{ file: PreviewFile }> = ({ file }) => {
  const ext = file.providedFileExtension.replace(/^\./, '').toLowerCase()
  const isLegacyDoc = ext === 'doc'
  return (
    <InfoCard
      tone="muted"
      message={
        <>
          <p className="font-medium">{isLegacyDoc ? 'Word 97-2003 (.doc) cannot be previewed in-browser.' : 'Preview not supported for this file type.'}</p>
          <p className="text-muted-foreground">
            {file.providedFileName}
            {ext ? ` (.${ext})` : ''}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {isLegacyDoc ? 'Re-save the document as .docx to enable in-browser preview, or download to view.' : 'Supported formats: PDF, Word (.docx), Markdown, HTML, Plain Text.'}
          </p>
        </>
      }
      action={<DownloadButton file={file} />}
    />
  )
}

const LoadingSpinner: React.FC = () => (
  <div role="status" aria-live="polite" aria-label="Loading file preview" className="flex h-96 w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
  </div>
)

type InfoCardProps = {
  tone: 'error' | 'muted'
  message: React.ReactNode
  action?: React.ReactNode
}

const InfoCard: React.FC<InfoCardProps> = ({ tone, message, action }) => (
  <div className="flex flex-col items-center gap-3 rounded-md border border-muted bg-muted/40 p-6 text-sm">
    <FileWarning className={tone === 'error' ? 'h-6 w-6 text-destructive' : 'h-6 w-6 text-muted-foreground'} />
    <div className="text-center">{message}</div>
    {action}
  </div>
)

const DownloadButton: React.FC<{ file: PreviewFile }> = ({ file }) => {
  if (!file.presignedURL) return null
  return (
    <Button asChild variant="secondary">
      <a href={file.presignedURL} download={file.providedFileName}>
        <Download className="h-4 w-4" />
        Download
      </a>
    </Button>
  )
}

export default FilePreview
