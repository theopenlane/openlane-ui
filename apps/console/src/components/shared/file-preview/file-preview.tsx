'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download } from 'lucide-react'
import { Button } from '@repo/ui/button'
import type { File as GqlFile } from '@repo/codegen/src/schema'
import { HTML_SANITIZE_CONFIG, isSafeLinkHref, useHtmlPurifier } from '@/lib/html/sanitize-html'
import CsvPreview from '@/components/shared/file-preview/csv-preview'
import { isFetchedPreviewKind, resolveFileKind, type TFetchedPreviewKind, type TPreviewFileShape } from '@/components/shared/file-preview/preview-mime'
import { InfoCard, LoadingSpinner } from '@/components/shared/file-preview/preview-chrome'

export { isSafeLinkHref, SAFE_LINK_PROTOCOLS } from '@/lib/html/sanitize-html'

type PreviewFile = Pick<GqlFile, 'presignedURL' | 'providedFileName' | 'providedFileExtension' | 'detectedMimeType'>

type FetchedFormat = TFetchedPreviewKind
type Format = FetchedFormat | 'unsupported'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'pdf'; blob: Blob }
  | { status: 'docx'; blob: Blob }
  | { status: 'markdown'; text: string }
  | { status: 'html'; text: string }
  | { status: 'text'; text: string }
  | { status: 'csv'; text: string }

const PREVIEW_FRAME_CLASS = 'h-[80vh] w-full overflow-hidden rounded-md border bg-muted'
const PREVIEW_SCROLL_CLASS = 'docx-preview-container overflow-auto rounded-md border bg-card p-4 [&_.docx-wrapper]:bg-transparent!'
const PROSE_CARD_CLASS = 'prose prose-sm dark:prose-invert max-w-none rounded-md border bg-card p-6'

const DOCX_OPTIONS = {
  renderAltChunks: false,
  renderChanges: false,
  renderComments: false,
  experimental: false,
  useBase64URL: true,
}

const FETCH_TIMEOUT_MS = 30_000

const EXPIRED_URL_MESSAGE = 'Preview link has expired. Refresh the page to load a new one.'

const NETWORK_ERROR_MESSAGE = "Couldn't load preview. The file may be unavailable from this environment. Try downloading it instead."

const isNetworkError = (err: unknown): boolean => err instanceof TypeError && /failed to fetch/i.test(err.message)

export const detectFormat = (file: TPreviewFileShape): Format => {
  const kind = resolveFileKind(file)

  return kind && isFetchedPreviewKind(kind) ? kind : 'unsupported'
}

type Props = {
  file: PreviewFile
}

const FilePreview: React.FC<Props> = ({ file }) => {
  const { detectedMimeType, providedFileExtension, providedFileName } = file
  const format = useMemo(() => detectFormat({ detectedMimeType, providedFileExtension, providedFileName }), [detectedMimeType, providedFileExtension, providedFileName])

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
        if (isNetworkError(err)) {
          setState({ status: 'error', message: NETWORK_ERROR_MESSAGE })
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
      return <DocxPreview blob={state.blob} file={file} />
    case 'markdown':
      return (
        <div className={PROSE_CARD_CLASS}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.text}</ReactMarkdown>
        </div>
      )
    case 'html':
      return <HtmlPreview text={state.text} />
    case 'csv':
      return <CsvPreview text={state.text} />
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

const DocxPreview: React.FC<{ blob: Blob; file: PreviewFile }> = ({ blob, file }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [docxError, setDocxError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false
    const target = containerRef.current

    import('docx-preview')
      .then(async ({ renderAsync }) => {
        if (cancelled) return

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
    return <InfoCard tone="error" message={`Could not render this Word document: ${docxError}`} action={<DownloadButton file={file} />} />
  }

  return <div ref={containerRef} className={PREVIEW_SCROLL_CLASS} />
}

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

const HtmlPreview: React.FC<{ text: string }> = ({ text }) => {
  const purifier = useHtmlPurifier()

  const html = useMemo(() => purifier.sanitize(text, HTML_SANITIZE_CONFIG), [purifier, text])

  return <div className={PROSE_CARD_CLASS} dangerouslySetInnerHTML={{ __html: html }} />
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
            {isLegacyDoc ? 'Re-save the document as .docx to enable in-browser preview, or download to view.' : 'Supported formats: PDF, Word (.docx), CSV, Markdown, HTML, Plain Text.'}
          </p>
        </>
      }
      action={<DownloadButton file={file} />}
    />
  )
}

const triggerDownload = (file: PreviewFile) => {
  if (!file.presignedURL) return
  const a = document.createElement('a')
  a.href = file.presignedURL
  a.download = file.providedFileName
  a.rel = 'noreferrer noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export const DownloadButton: React.FC<{ file: PreviewFile; variant?: 'secondary' | 'outline' }> = ({ file, variant = 'secondary' }) => {
  if (!file.presignedURL) return null
  return (
    <Button variant={variant} icon={<Download className="h-4 w-4" />} iconPosition="left" onClick={() => triggerDownload(file)}>
      Download
    </Button>
  )
}

export default FilePreview
