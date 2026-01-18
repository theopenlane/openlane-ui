import { Button } from '@repo/ui/button'
import { SaveIcon } from 'lucide-react'
type SaveButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  title?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  isSaving?: boolean
  form?: string
  className?: string
  variant?:
    | 'primary'
    | 'secondary'
    | 'secondaryOutline'
    | 'icon'
    | 'iconButton'
    | 'sidebar'
    | 'transparent'
    | 'tag'
    | 'filled'
    | 'light'
    | 'outline'
    | 'outlineLight'
    | 'outlineInput'
    | 'outlineInputPadding'
    | 'redOutline'
    | 'white'
    | 'success'
    | 'destructive'
    | 'back'
}

export const SaveButton = ({ onClick, title = 'Save Changes', type = 'submit', disabled, isSaving = false, form, className, variant = 'primary' }: SaveButtonProps) => {
  return (
    <Button disabled={disabled} form={form} onClick={onClick} variant={variant} type={type} iconPosition="left" className={`h-8 px-2 ${className}`} icon={<SaveIcon />}>
      {isSaving ? 'Saving Changes...' : title}
    </Button>
  )
}
