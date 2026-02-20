'use client'
import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { Check, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { toastStyles, type ToastVariants } from './toast.styles'

const { viewport, action, close, title: titleSlot, description: descriptionSlot, closeIcon } = toastStyles()

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> & { ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Viewport>> }) => (
  <ToastPrimitives.Viewport ref={ref} className={cn(viewport(), className)} {...props} />
)

interface TToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>, ToastVariants {
  title?: string
  description?: React.ReactNode | string
  ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Root>>
}

const Toast = ({ className, variant = 'default', title, description, ref, ...props }: TToastProps) => {
  const toastClass = toastStyles().toast({ variant }) // call the toast slot function

  const renderIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-toast-success-icon-border bg-toast-success-icon-muted">
            <Check className="text-toast-success-icon" width={20} />
          </div>
        )
      case 'warning':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-toast-warning-icon-border bg-toast-warning-icon-muted">
            <Info className="text-toast-warning-icon" width={20} />
          </div>
        )
      case 'info':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-toast-info-icon-border bg-toast-info-icon-muted">
            <Info className="text-toast-info-icon" width={20} />
          </div>
        )
      case 'info2':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-toast-info2-icon-border bg-toast-info2-icon-muted">
            <Info className="text-toast-info2-icon" width={20} />
          </div>
        )
      case 'error':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-toast-error-icon-border bg-toast-error-icon-muted">
            <TriangleAlert className="text-toast-error-icon" width={20} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <ToastPrimitives.Root ref={ref} className={cn('flex items-start space-x-1', toastClass, className)} {...props}>
      {renderIcon()}
      <div className="flex flex-col justify-center">
        {title && <div className={titleSlot()}>{title}</div>}
        {description && <div className={descriptionSlot()}>{description}</div>}
      </div>
      <ToastClose />
    </ToastPrimitives.Root>
  )
}

const ToastAction = ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action> & { ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Action>> }) => (
  <ToastPrimitives.Action ref={ref} className={cn(action(), className)} {...props} />
)

const ToastClose = ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close> & { ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Close>> }) => (
  <ToastPrimitives.Close ref={ref} className={cn(close(), className)} {...props}>
    <X className={cn(closeIcon())} />
  </ToastPrimitives.Close>
)

const ToastTitle = ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title> & { ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Title>> }) => (
  <ToastPrimitives.Title ref={ref} className={cn(titleSlot(), className)} {...props} />
)

const ToastDescription = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description> & { ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Description>> }) => (
  <ToastPrimitives.Description ref={ref} className={cn(descriptionSlot(), className)} {...props} />
)

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export { type ToastProps, type ToastActionElement, ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction }
