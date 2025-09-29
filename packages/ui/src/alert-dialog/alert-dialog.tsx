import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { cn } from '../../lib/utils'
import { alertDialogStyles } from './alert-dialog.styles'
import { buttonStyles } from '../button/button'

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

const { overlay, content, header, footer, title, description } = alertDialogStyles({})

export function AlertDialogOverlay(props: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  const { className, ...rest } = props
  return <AlertDialogPrimitive.Overlay className={cn(overlay(), className)} {...rest} />
}

export function AlertDialogContent(props: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  const { className, ...rest } = props
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" />
      <AlertDialogPrimitive.Content className={cn(content(), className)} {...rest} />
    </AlertDialogPortal>
  )
}

export function AlertDialogHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={cn(header(), className)} {...rest} />
}

export function AlertDialogFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={cn(footer(), className)} {...rest} />
}

export function AlertDialogTitle(props: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  const { className, ...rest } = props
  return <AlertDialogPrimitive.Title className={cn(title(), className)} {...rest} />
}

export function AlertDialogDescription(props: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  const { className, ...rest } = props
  return <AlertDialogPrimitive.Description className={cn(description(), className)} {...rest} />
}

export function AlertDialogAction(props: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  const { className, ...rest } = props
  return <AlertDialogPrimitive.Action className={cn(buttonStyles(), className)} {...rest} />
}

export function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={cn(className)} {...props} />
}

export { AlertDialog, AlertDialogPortal, AlertDialogTrigger }
