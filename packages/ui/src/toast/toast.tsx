'use client'
import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { Check, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { toastStyles, type ToastVariants } from './toast.styles'

const { viewport, action, close, title: titleSlot, description: descriptionSlot, closeIcon } = toastStyles()

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Viewport>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport ref={ref} className={cn(viewport(), className)} {...props} />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

interface TToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>, ToastVariants {
  title?: string
  description?: React.ReactNode | string
}

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, TToastProps>(({ className, variant = 'default', title, description, ...props }, ref) => {
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
})

Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Action>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action ref={ref} className={cn(action(), className)} {...props} />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Close>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close ref={ref} className={cn(close(), className)} {...props}>
    <X className={cn(closeIcon())} />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Title>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn(titleSlot(), className)} {...props} />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Description>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn(descriptionSlot(), className)} {...props} />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export { type ToastProps, type ToastActionElement, ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction }
