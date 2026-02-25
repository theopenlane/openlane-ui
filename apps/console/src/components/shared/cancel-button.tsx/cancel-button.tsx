import { Button } from '@repo/ui/button'
import { XIcon } from 'lucide-react'
import React from 'react'
type CancelButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  title?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
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

export const CancelButton = ({ onClick, title = 'Cancel', type = 'button', disabled, className, variant = 'secondary' }: CancelButtonProps) => {
  return (
    <Button disabled={disabled} onClick={onClick} variant={variant} type={type} iconPosition="left" className={`h-8 px-2! ${className}`} icon={<XIcon />}>
      {title}
    </Button>
  )
}
