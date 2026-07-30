import { useNotification } from '@/hooks/useNotification'
import { Button } from '@repo/ui/button'
import { SheetHeader } from '@repo/ui/sheet'
import { Copy, LinkIcon, PanelRightClose, Pencil } from 'lucide-react'
import React from 'react'
import DeleteTaskDialog from '../../dialog/delete-task-dialog'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

interface TasksSheetHeaderProps {
  close: () => void
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  isPending: boolean
  title?: string | null
  isEditAllowed: boolean
  id: string | null
  onDuplicate: () => void
  canDuplicate: boolean
  sharePath: string
  onDeleted: () => void
}

const TasksSheetHeader = ({ close, isEditing, setIsEditing, isPending, title, isEditAllowed, id, onDuplicate, canDuplicate, sharePath, onDeleted }: TasksSheetHeaderProps) => {
  const { successNotification, errorNotification } = useNotification()

  const handleCopyLink = () => {
    if (!sharePath) {
      return
    }

    navigator.clipboard
      .writeText(`${window.location.origin}${sharePath}`)
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
              <CancelButton disabled={isPending} onClick={() => setIsEditing(false)}></CancelButton>
              <SaveButton form="editTask" disabled={isPending} isSaving={isPending} />
            </div>
          ) : (
            <>
              {isEditAllowed && (
                <Button icon={<Pencil />} iconPosition="left" variant="secondary" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
              <Button icon={<Copy />} iconPosition="left" variant="secondary" onClick={onDuplicate} disabled={!canDuplicate}>
                Duplicate
              </Button>
            </>
          )}
          {title && id && <DeleteTaskDialog taskName={title} taskId={id} onDeleted={onDeleted} />}
        </div>
      </div>
    </SheetHeader>
  )
}

export default TasksSheetHeader
