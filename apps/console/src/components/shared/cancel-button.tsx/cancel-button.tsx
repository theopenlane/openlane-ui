import { Button, type ButtonVariants } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { XIcon } from 'lucide-react'
import React from 'react'
type CancelButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  title?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  variant?: ButtonVariants['variant']
}

export const CancelButton = ({ onClick, title = 'Cancel', type = 'button', disabled, className, variant = 'secondary' }: CancelButtonProps) => {
  return (
    <Button disabled={disabled} onClick={onClick} variant={variant} type={type} iconPosition="left" className={cn('h-8 px-2', className)} icon={<XIcon size={16} />}>
      {title}
    </Button>
  )
}
