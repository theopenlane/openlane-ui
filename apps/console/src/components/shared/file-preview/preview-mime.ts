import type { TFile } from '@/components/shared/file-table/columns'

export type TPreviewKind = 'pdf' | 'image' | 'csv' | 'markdown' | 'html' | 'docx' | 'text'

type PreviewableFormat = {
  mimes: readonly string[]
  extensions: readonly string[]
  kind: TPreviewKind
}

// Single source of truth for previewable formats. SVG renders safely via
// <img> (no script execution), but rendering it via <iframe> or <object>
// would expose embedded JavaScript — do not change the render target without
// re-evaluating.
const PREVIEWABLE_FORMATS: readonly PreviewableFormat[] = [
  { mimes: ['application/pdf'], extensions: ['.pdf'], kind: 'pdf' },
  { mimes: ['image/png'], extensions: ['.png'], kind: 'image' },
  { mimes: ['image/jpeg'], extensions: ['.jpg', '.jpeg'], kind: 'image' },
  { mimes: ['image/gif'], extensions: ['.gif'], kind: 'image' },
  { mimes: ['image/webp'], extensions: ['.webp'], kind: 'image' },
  { mimes: ['image/bmp'], extensions: ['.bmp'], kind: 'image' },
  { mimes: ['image/x-icon'], extensions: ['.ico'], kind: 'image' },
  { mimes: ['image/svg+xml'], extensions: ['.svg'], kind: 'image' },
  { mimes: ['text/csv', 'text/tab-separated-values'], extensions: ['.csv', '.tsv'], kind: 'csv' },
  { mimes: ['text/markdown', 'text/x-markdown'], extensions: ['.md', '.mdx', '.markdown'], kind: 'markdown' },
  { mimes: ['text/html'], extensions: ['.html', '.htm'], kind: 'html' },
  { mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], extensions: ['.docx'], kind: 'docx' },
  { mimes: ['text/plain'], extensions: ['.txt'], kind: 'text' },
]

export const PDF_MIME_TYPE = 'application/pdf'

const EXTENSION_TO_KIND = new Map<string, TPreviewKind>(PREVIEWABLE_FORMATS.flatMap((fmt) => fmt.extensions.map((ext) => [ext, fmt.kind] as const)))
const MIME_TO_KIND = new Map<string, TPreviewKind>(PREVIEWABLE_FORMATS.flatMap((fmt) => fmt.mimes.map((mime) => [mime, fmt.kind] as const)))

const AMBIGUOUS_MIMES: ReadonlySet<string> = new Set(['text/plain', 'application/octet-stream'])

const KIND_CAPABILITIES = {
  pdf: { fetched: true, inlineDialog: true },
  image: { fetched: false, inlineDialog: true },
  csv: { fetched: true, inlineDialog: true },
  markdown: { fetched: true, inlineDialog: false },
  html: { fetched: true, inlineDialog: false },
  docx: { fetched: true, inlineDialog: false },
  text: { fetched: true, inlineDialog: false },
} as const satisfies Record<TPreviewKind, { fetched: boolean; inlineDialog: boolean }>

export type TFetchedPreviewKind = { [K in TPreviewKind]: (typeof KIND_CAPABILITIES)[K]['fetched'] extends true ? K : never }[TPreviewKind]

export type TPreviewFileShape = Pick<TFile, 'providedFileExtension' | 'providedFileName' | 'detectedMimeType'>

// Resolves the file extension from the backend-provided field, falling back
// to parsing the filename. Older file records were persisted with an empty
// providedFileExtension (backend bug), so deriving from providedFileName
// keeps the preview action working for those historical rows.
export const resolveFileExtension = (file: Pick<TFile, 'providedFileExtension' | 'providedFileName'>): string => {
  const fromField = file.providedFileExtension?.trim().toLowerCase()
  if (fromField) return fromField.startsWith('.') ? fromField : `.${fromField}`

  const name = file.providedFileName ?? ''
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return ''
  return name.slice(dot).toLowerCase()
}

const normalizeMimeType = (mimeType: string | null | undefined): string => (mimeType ?? '').split(';')[0].trim().toLowerCase()

export const resolveFileKind = (file: TPreviewFileShape): TPreviewKind | null => {
  const detected = normalizeMimeType(file.detectedMimeType)
  if (detected && !AMBIGUOUS_MIMES.has(detected)) return MIME_TO_KIND.get(detected) ?? null

  return EXTENSION_TO_KIND.get(resolveFileExtension(file)) ?? MIME_TO_KIND.get(detected) ?? null
}

export const isFetchedPreviewKind = (kind: TPreviewKind): kind is TFetchedPreviewKind => KIND_CAPABILITIES[kind].fetched

export const isPdfFile = (file: TPreviewFileShape): boolean => resolveFileKind(file) === 'pdf'
export const isImageFile = (file: TPreviewFileShape): boolean => resolveFileKind(file) === 'image'
export const isCsvFile = (file: TPreviewFileShape): boolean => resolveFileKind(file) === 'csv'

const canPreviewInDialog = (file: TPreviewFileShape): boolean => {
  const kind = resolveFileKind(file)

  return kind !== null && KIND_CAPABILITIES[kind].inlineDialog
}

export const canOpenFilePreviewDialog = (file: TPreviewFileShape & Pick<TFile, 'presignedURL'>): boolean => !!file.presignedURL && canPreviewInDialog(file)
