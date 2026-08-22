import { Button, type ButtonVariants } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
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
  variant?: ButtonVariants['variant']
}

export const SaveButton = ({ onClick, title = 'Save', savingTitle = 'Saving...', type = 'submit', disabled, isSaving = false, form, className, variant = 'primary' }: SaveButtonProps) => {
  return (
    <Button disabled={disabled} form={form} onClick={onClick} variant={variant} type={type} iconPosition="left" className={cn('h-8 px-2', className)} icon={<SaveIcon size={16} />}>
      {isSaving ? savingTitle : title}
    </Button>
  )
}
