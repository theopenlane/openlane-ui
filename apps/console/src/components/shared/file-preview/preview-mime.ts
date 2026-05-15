import type { TFile } from '@/components/shared/file-table/columns'

type PreviewableFormat = {
  mime: string
  extensions: readonly string[]
  kind: 'pdf' | 'image'
}

// Single source of truth for previewable formats. SVG renders safely via
// <img> (no script execution), but rendering it via <iframe> or <object>
// would expose embedded JavaScript — do not change the render target without
// re-evaluating.
const PREVIEWABLE_FORMATS: readonly PreviewableFormat[] = [
  { mime: 'application/pdf', extensions: ['.pdf'], kind: 'pdf' },
  { mime: 'image/png', extensions: ['.png'], kind: 'image' },
  { mime: 'image/jpeg', extensions: ['.jpg', '.jpeg'], kind: 'image' },
  { mime: 'image/gif', extensions: ['.gif'], kind: 'image' },
  { mime: 'image/webp', extensions: ['.webp'], kind: 'image' },
  { mime: 'image/bmp', extensions: ['.bmp'], kind: 'image' },
  { mime: 'image/x-icon', extensions: ['.ico'], kind: 'image' },
  { mime: 'image/svg+xml', extensions: ['.svg'], kind: 'image' },
]

export const PDF_MIME_TYPE = 'application/pdf'

const EXTENSION_TO_FORMAT = new Map<string, PreviewableFormat>(PREVIEWABLE_FORMATS.flatMap((fmt) => fmt.extensions.map((ext) => [ext, fmt] as const)))
const MIME_TO_FORMAT = new Map<string, PreviewableFormat>(PREVIEWABLE_FORMATS.map((fmt) => [fmt.mime, fmt]))

type FileShape = Pick<TFile, 'providedFileExtension' | 'providedFileName' | 'detectedMimeType'>

// Resolves the file extension from the backend-provided field, falling back
// to parsing the filename. Older file records were persisted with an empty
// providedFileExtension (backend bug), so deriving from providedFileName
// keeps the preview action working for those historical rows.
export const resolveFileExtension = (file: Pick<TFile, 'providedFileExtension' | 'providedFileName'>): string => {
  const fromField = file.providedFileExtension?.trim()
  if (fromField) return fromField.toLowerCase()

  const name = file.providedFileName ?? ''
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return ''
  return name.slice(dot).toLowerCase()
}

// Returns the previewable format for a file, preferring the server-detected
// MIME (authoritative — from magic-byte detection on the upload pipeline)
// and falling back to extension-based inference for legacy rows where
// detectedMimeType isn't populated. Returns null if not previewable.
const resolveFormat = (file: FileShape): PreviewableFormat | null => {
  const detected = file.detectedMimeType?.trim().toLowerCase()
  if (detected) return MIME_TO_FORMAT.get(detected) ?? null

  return EXTENSION_TO_FORMAT.get(resolveFileExtension(file)) ?? null
}

export const isPdfFile = (file: FileShape): boolean => resolveFormat(file)?.kind === 'pdf'
export const isImageFile = (file: FileShape): boolean => resolveFormat(file)?.kind === 'image'
export const isPreviewableFile = (file: FileShape): boolean => resolveFormat(file) !== null
