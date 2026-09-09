import { Button, type ButtonProps } from '@theopenlane/ui/button'
import { SaveIcon } from 'lucide-react'
type SaveButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  title?: string
  savingTitle?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  isSaving?: boolean
  form?: string
  className?: string
  variant?: ButtonProps['variant']
}

export const SaveButton = ({
  onClick,
  title = 'Save Changes',
  savingTitle = 'Saving Changes...',
  type = 'submit',
  disabled,
  isSaving = false,
  form,
  className,
  variant = 'primary',
}: SaveButtonProps) => {
  return (
    <Button disabled={disabled} form={form} onClick={onClick} variant={variant} type={type} iconPosition="left" className={`h-8 px-2 ${className}`} icon={<SaveIcon />}>
      {isSaving ? savingTitle : title}
    </Button>
  )
}
