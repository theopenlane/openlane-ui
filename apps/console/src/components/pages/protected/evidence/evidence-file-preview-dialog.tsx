import React, { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { fileDownload } from '@/components/shared/lib/export.ts'
import { useNotification } from '@/hooks/useNotification'
import type { TFile } from '@/components/shared/file-table/columns'
import { isImageFile, isPdfFile } from '@/components/shared/file-preview/preview-mime'
import { usePdfBlobPreview, type TPdfPreviewState } from '@/components/shared/file-preview/use-pdf-blob-preview'

type TEvidenceFilePreviewDialogProps = {
  file: TFile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PdfBody: React.FC<{ state: TPdfPreviewState; title: string }> = ({ state, title }) => {
  switch (state.status) {
    case 'loading':
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading preview…
        </div>
      )
    case 'error':
      return <p className="text-sm text-muted-foreground">Failed to load preview. Try downloading the file instead.</p>
    case 'ready':
      // No sandbox attribute: Chrome renders PDFs via PDFium, which is already
      // sandboxed at the process level. An iframe sandbox="" disables the
      // viewer because PDFium needs scripts + same-origin to run.
      return <iframe src={`${state.blobUrl}#toolbar=0`} title={title} className="w-full h-full" style={{ border: 'none' }} />
    case 'idle':
      return null
  }
}

const EvidenceFilePreviewDialog: React.FC<TEvidenceFilePreviewDialogProps> = ({ file, open, onOpenChange }) => {
  const { errorNotification } = useNotification()
  const url = file?.presignedURL || ''
  const pdf = usePdfBlobPreview(url, open && !!file && isPdfFile(file))

  useEffect(() => {
    if (pdf.status === 'error') {
      errorNotification({
        title: 'Unable to preview file',
        description: 'The PDF could not be loaded. Try downloading it instead.',
      })
    }
  }, [pdf.status, errorNotification])

  if (!file) return null

  const showImage = isImageFile(file) && !!url
  const showPdf = isPdfFile(file)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-275 h-[85vh] flex flex-col gap-3 p-4">
        <DialogHeader className="pr-10">
          <DialogTitle className="truncate" title={file.providedFileName}>
            {file.providedFileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden rounded border bg-background-secondary flex items-center justify-center">
          {showImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={file.providedFileName} className="max-w-full max-h-full object-contain" />
          )}
          {showPdf && <PdfBody state={pdf} title={file.providedFileName} />}
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
