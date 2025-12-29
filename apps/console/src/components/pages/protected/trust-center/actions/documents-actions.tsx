import { Switch } from '@repo/ui/switch'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteTrustCenterDoc, useUpdateTrustCenterDoc } from '@/lib/graphql-hooks/trust-center'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Droplet, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@repo/ui/button'
import { Document, Page } from 'react-pdf'
import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
type DocumentActionsProps = {
  documentId: string
  watermarkEnabled: boolean
  filePresignedURL?: string
}

const DocumentActions = ({ documentId, watermarkEnabled, filePresignedURL }: DocumentActionsProps) => {
  const { mutateAsync: deleteDocument } = useDeleteTrustCenterDoc()
  const { mutateAsync: updateDocument } = useUpdateTrustCenterDoc()
  const { successNotification, errorNotification } = useNotification()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isWatermarkEnabled, setWatermarkEnabled] = useState(watermarkEnabled ?? false)
  const queryClient = useQueryClient()
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [numPages, setNumPages] = useState<number>()

  const handleDeleteDocument = async () => {
    try {
      await deleteDocument({ deleteTrustCenterDocId: documentId })
      successNotification({
        title: 'Document deleted successfully',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const handleToggleWatermarkEnabled = async (enabled: boolean) => {
    try {
      await updateDocument({ updateTrustCenterDocId: documentId, input: { watermarkingEnabled: enabled } })
      successNotification({
        title: 'Document updated successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'docs'] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const openPreview = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!filePresignedURL) return

    const encodedUrl = encodeURI(filePresignedURL)

    const res = await fetch(encodedUrl)
    const buffer = await res.arrayBuffer()

    // Force PDF type (macOS-safe)
    const pdfBlob = new Blob([buffer], { type: 'application/pdf' })

    setPreviewBlob(pdfBlob)
  }

  return (
    <div className="flex items-center gap-2">
      {/* <Button
        onClick={async (e) => {
          e.stopPropagation()

          if (!filePresignedURL) return

          const encodedUrl = encodeURI(filePresignedURL)

          const response = await fetch(encodedUrl)
          const blob = await response.blob()

          const blobUrl = URL.createObjectURL(blob)

          window.open(blobUrl, '_blank')
        }}
        variant="secondary"
        icon={<Eye size={16} strokeWidth={2} />}
        iconPosition="left"
      >
        Preview
      </Button> */}
      <Button onClick={openPreview} variant="secondary" icon={<Eye size={16} strokeWidth={2} />} iconPosition="left">
        Preview
      </Button>
      {previewBlob && numPages && (
        <Document file={previewBlob} onLoadSuccess={({ numPages }) => setNumPages(numPages)} loading="Loading PDF...">
          {Array.from({ length: numPages }, (_, i) => (
            <Page key={i} pageNumber={i + 1} width={900} />
          ))}
        </Document>
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center bg-homepage-card-item border border-switch-bg-inactive rounded-md w-8 h-8 cursor-pointer"
          >
            <MoreHorizontal size={16} />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="min-w-[15px] bg-homepage-card-item border border-switch-bg-inactive">
          <DropdownMenuItem
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onSelect={(e) => {
              e.preventDefault()
              setIsDeleteDialogOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onSelect={(e) => {
              e.preventDefault()
            }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2">
              <Droplet size={16} />
              <label className="text-sm">Watermark</label>
              <Switch
                checked={isWatermarkEnabled}
                onCheckedChange={(checked) => {
                  setWatermarkEnabled(checked)
                  handleToggleWatermarkEnabled(checked)
                }}
              />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteDocument}
          title={`Delete document?`}
          description={<>Are you sure you want to delete this document? This action cannot be undone. Deleting this document will remove it from all associated records.</>}
        />
      </div>
    </div>
  )
}

export default DocumentActions
