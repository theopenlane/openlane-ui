import { useNotification } from '@/hooks/useNotification'
import { Button } from '@repo/ui/button'
import { SheetHeader } from '@repo/ui/sheet'
import { LinkIcon, PanelRightClose, Pencil } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React from 'react'
import DeleteTaskDialog from '../../dialog/delete-task-dialog'
import { SaveButton } from '@/components/shared/save-button/save-button'

interface TasksSheetHeaderProps {
  close: () => void
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  isPending: boolean
  title?: string | null
  isEditAllowed: boolean
}

const TasksSheetHeader = ({ close, isEditing, setIsEditing, isPending, title, isEditAllowed }: TasksSheetHeaderProps) => {
  const { successNotification, errorNotification } = useNotification()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const handleCopyLink = () => {
    if (!id) {
      return
    }

    const url = `${window.location.origin}${window.location.pathname}?id=${id}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        successNotification({
          title: 'Link copied to clipboard',
        })
      })
      .catch(() => {
        errorNotification({
          title: 'Failed to copy link',
        })
      })
  }

  return (
    <SheetHeader>
      <div className="flex items-center justify-between">
        <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={close} />
        <div className="flex justify-end gap-2">
          <Button icon={<LinkIcon />} iconPosition="left" variant="secondary" onClick={handleCopyLink}>
            Copy link
          </Button>
          {isEditing ? (
            <div className="flex gap-2">
              <Button disabled={isPending} type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <SaveButton form="editTask" disabled={isPending} isSaving={isPending} />
            </div>
          ) : (
            <>
              {isEditAllowed && (
                <Button icon={<Pencil />} iconPosition="left" variant="secondary" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </>
          )}
          {title && id && <DeleteTaskDialog taskName={title} taskId={id} />}
        </div>
      </div>
    </SheetHeader>
  )
}

export default TasksSheetHeader
