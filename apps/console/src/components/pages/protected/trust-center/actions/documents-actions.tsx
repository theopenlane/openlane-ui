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

type DocumentActionsProps = {
  documentId: string
  watermarkEnabled: boolean
}

const DocumentActions = ({ documentId, watermarkEnabled }: DocumentActionsProps) => {
  const { mutateAsync: deleteDocument } = useDeleteTrustCenterDoc()
  const { mutateAsync: updateDocument } = useUpdateTrustCenterDoc()
  const { successNotification, errorNotification } = useNotification()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isWatermarkEnabled, setWatermarkEnabled] = useState(watermarkEnabled ?? false)
  const queryClient = useQueryClient()

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

  const handleSetWatermark = async (enabled: boolean) => {
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

  return (
    <div className="flex items-center gap-2">
      <Button onClick={(e) => e.stopPropagation()} variant="secondary" icon={<Eye size={16} strokeWidth={2} />} iconPosition="left">
        Preview
      </Button>
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
                  handleSetWatermark(checked)
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
