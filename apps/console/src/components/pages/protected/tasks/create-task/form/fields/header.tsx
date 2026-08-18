import { useNotification } from '@/hooks/useNotification'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { SheetHeader } from '@repo/ui/sheet'
import { Copy, LayoutTemplate, LinkIcon, PanelRightClose, Pencil, Trash2, X } from 'lucide-react'
import React from 'react'
import DeleteTaskDialog from '../../dialog/delete-task-dialog'
import Menu from '@/components/shared/menu/menu'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

const MENU_ITEM_CLASS = 'flex items-center gap-2 px-1 bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
const ICON_SIZE = 16

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
  isTemplate: boolean
  onTemplateChange: (isTemplate: boolean) => void
  onUseTemplate: () => void
}

const TasksSheetHeader = ({
  close,
  isEditing,
  setIsEditing,
  isPending,
  title,
  isEditAllowed,
  id,
  onDuplicate,
  canDuplicate,
  sharePath,
  onDeleted,
  isTemplate,
  onTemplateChange,
  onUseTemplate,
}: TasksSheetHeaderProps) => {
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PanelRightClose aria-label="Close detail sheet" size={ICON_SIZE} className="cursor-pointer" onClick={close} />
          {isTemplate && (
            <Badge variant="blue" className="gap-1">
              Template
              {isEditAllowed && !isEditing && (
                <button type="button" aria-label="Remove template" className="cursor-pointer" onClick={() => onTemplateChange(false)}>
                  <X size={12} />
                </button>
              )}
            </Badge>
          )}
        </div>
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <div className="flex gap-2">
              <CancelButton disabled={isPending} onClick={() => setIsEditing(false)}></CancelButton>
              <SaveButton form="editTask" disabled={isPending} isSaving={isPending} />
            </div>
          ) : (
            <>
              {isTemplate && (
                <Button icon={<LayoutTemplate />} iconPosition="left" variant="secondary" onClick={onUseTemplate} disabled={!canDuplicate}>
                  Use template
                </Button>
              )}
              {isEditAllowed && (
                <Button icon={<Pencil />} iconPosition="left" variant="secondary" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
              {!isTemplate && isEditAllowed && (
                <Button icon={<LayoutTemplate />} iconPosition="left" variant="secondary" onClick={() => onTemplateChange(true)}>
                  Save as template
                </Button>
              )}
              <Menu
                closeOnSelect
                content={(closeMenu) => (
                  <>
                    <button
                      type="button"
                      className={MENU_ITEM_CLASS}
                      onClick={() => {
                        handleCopyLink()
                        closeMenu()
                      }}
                    >
                      <LinkIcon size={ICON_SIZE} />
                      <span>Copy link</span>
                    </button>
                    <button
                      type="button"
                      className={MENU_ITEM_CLASS}
                      disabled={!canDuplicate}
                      onClick={() => {
                        onDuplicate()
                        closeMenu()
                      }}
                    >
                      <Copy size={ICON_SIZE} />
                      <span>Duplicate</span>
                    </button>
                    {title && id && (
                      <DeleteTaskDialog
                        taskName={title}
                        taskId={id}
                        onDeleted={onDeleted}
                        renderTrigger={(openDialog) => (
                          <button
                            type="button"
                            className={`${MENU_ITEM_CLASS} text-destructive`}
                            onClick={() => {
                              openDialog()
                              closeMenu()
                            }}
                          >
                            <Trash2 size={ICON_SIZE} />
                            <span>Delete</span>
                          </button>
                        )}
                      />
                    )}
                  </>
                )}
              />
            </>
          )}
        </div>
      </div>
    </SheetHeader>
  )
}

export default TasksSheetHeader
