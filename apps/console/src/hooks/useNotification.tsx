import { GqlError } from '@/types'
import { useToast } from '@repo/ui/use-toast'
import React, { useCallback } from 'react'

const defaultDuration = 5000

type TSuccessProps = {
  title?: string
  description?: string | React.ReactNode
  variant?: 'default' | 'info' | 'info2' | 'warning' | 'error' | 'success'
  duration?: number
}

export type TErrorProps = {
  title?: string
  description?: string
  gqlError?: GqlError
  variant?: 'default' | 'info' | 'info2' | 'warning' | 'error' | 'success'
  duration?: number
}

export function useNotification() {
  const { toast } = useToast()

  const handleShowNotification = useCallback(
    (title?: string, description?: string | React.ReactNode, variant: 'default' | 'info' | 'info2' | 'warning' | 'error' | 'success' = 'default', duration?: number) => {
      toast({
        variant,
        duration,
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
      })
    },
    [toast],
  )

  const handleSuccess = useCallback(
    (props: TSuccessProps) => {
      handleShowNotification(props.title ?? undefined, props.description ?? undefined, 'success', props.duration ?? defaultDuration)
    },
    [handleShowNotification],
  )

  const handleWarning = useCallback(
    (props: TSuccessProps) => {
      handleShowNotification(props.title ?? undefined, props.description ?? undefined, 'warning', props.duration ?? defaultDuration)
    },
    [handleShowNotification],
  )

  const handleInfo = useCallback(
    (props: TSuccessProps) => {
      handleShowNotification(props.title ?? undefined, props.description ?? undefined, 'info', props.duration ?? defaultDuration)
    },
    [handleShowNotification],
  )

  const handleInfo2 = useCallback(
    (props: TSuccessProps) => {
      handleShowNotification(props.title ?? undefined, props.description ?? undefined, 'info2', props.duration ?? defaultDuration)
    },
    [handleShowNotification],
  )

  const handleError = useCallback(
    (props: TErrorProps) => {
      let description = props.description ?? ''
      if (props.gqlError) {
        const messages: string[] = []

        if (props.gqlError.graphQLErrors) {
          props.gqlError.graphQLErrors.forEach((graphQLError) => {
            const path = graphQLError.path?.join('.') ?? ''
            messages.push(path + ' ' + graphQLError.message)
          })
        }

        if (props.gqlError.networkError) {
          messages.push(props.gqlError.networkError.message)
        }

        description = messages.join('\n')
      }

      handleShowNotification(props.title, description, 'error')
    },
    [handleShowNotification],
  )

  return {
    successNotification: handleSuccess,
    errorNotification: handleError,
    warningNotification: handleWarning,
    infoNotification: handleInfo,
    info2Notification: handleInfo2,
  }
}
