import React from 'react'
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

const EvidenceFilePreviewDialog: React.FC<TEvidenceFilePreviewDialogProps> = ({ file, open, onOpenChange }) => {
  const { errorNotification } = useNotification()

  if (!file) return null

  const extension = resolveFileExtension(file)
  const isImage = IMAGE_EXTENSIONS.includes(extension)
  const isPdf = PDF_EXTENSIONS.includes(extension)
  const url = file.presignedURL || ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[1100px] h-[85vh] flex flex-col gap-3 p-4">
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
          {isPdf && url && <iframe src={url} title={file.providedFileName} className="w-full h-full border-0" />}
          {!isImage && !isPdf && <p className="text-sm">Preview is not available for this file type.</p>}
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
