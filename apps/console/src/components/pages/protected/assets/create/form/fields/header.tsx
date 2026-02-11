import { useNotification } from '@/hooks/useNotification'
import { Button } from '@repo/ui/button'
import { SheetHeader } from '@repo/ui/sheet'
import { LinkIcon, PanelRightClose, Pencil } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React from 'react'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import DeleteDialog from '../../dialog/delete-dialog'

interface AssetsSheetHeaderProps {
  close: () => void
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  isPending: boolean
  name?: string | null
  isEditAllowed: boolean
}

const AssetsSheetHeader = ({ close, isEditing, setIsEditing, isPending, name, isEditAllowed }: AssetsSheetHeaderProps) => {
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
              <CancelButton disabled={isPending} onClick={() => setIsEditing(false)}></CancelButton>
              <SaveButton form="editAsset" disabled={isPending} isSaving={isPending} />
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
          {name && id && <DeleteDialog assetName={name} assetId={id} />}
        </div>
      </div>
    </SheetHeader>
  )
}

export default AssetsSheetHeader
