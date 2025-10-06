'use client'
import { Toast, ToastClose, ToastProvider, ToastViewport } from './toast'
import { useToast } from './use-toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant = 'default', ...props }) => (
        <Toast key={id} title={title} description={description} variant={variant} {...props}>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
