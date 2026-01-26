import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useState } from 'react'

type ConfirmationAlertProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description: React.ReactNode
  confirmationText?: string
  confirmationTextVariant?: 'filled' | 'white' | 'success' | 'light' | 'outline' | 'outlineLight' | 'outlineInput' | 'outlineInputPadding' | 'redOutline' | 'destructive' | 'back' | undefined
  showInput?: boolean
}

export const ConfirmationDialog = ({ open, onOpenChange, onConfirm, title, description, confirmationText, confirmationTextVariant, showInput }: ConfirmationAlertProps) => {
  const [confirmationValue, setConfirmationValue] = useState('')
  const isConfirmDisabled = showInput && confirmationValue.toUpperCase() !== 'DELETE'.toUpperCase()

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen && showInput) {
      setConfirmationValue('')
    }
  }

  function setIsOpen(arg0: boolean) {
    throw new Error('Function not implemented.')
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogOverlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" />
      <AlertDialogContent className="z-50 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title || 'Are you absolutely sure?'}</AlertDialogTitle>
          <AlertDialogDescription>{description || 'This action cannot be undone.'}</AlertDialogDescription>
        </AlertDialogHeader>
        {showInput && (
          <div className="mb-4 flex flex-col gap-2 text-left">
            <Label>
              To confirm, please type <b>DELETE</b> below:
            </Label>
            <Input onChange={(e) => setConfirmationValue(e.target.value)}></Input>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="secondary">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={confirmationTextVariant ?? 'destructive'}
              disabled={isConfirmDisabled}
              onClick={onConfirm}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onConfirm()
                }
              }}
            >
              {confirmationText ?? 'Delete'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
