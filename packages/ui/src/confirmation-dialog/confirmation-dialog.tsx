import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'

type ConfirmationAlertProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
}

export const ConfirmationDialog = ({ open, onOpenChange, onConfirm, title, description }: ConfirmationAlertProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || 'Are you absolutely sure?'}</AlertDialogTitle>
          <AlertDialogDescription>{description || 'This action cannot be undone.'}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={onConfirm}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onConfirm()
                }
              }}
            >
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
