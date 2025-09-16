import { GqlError } from '@/types'
import { useToast } from '@repo/ui/use-toast'
import React, { useCallback } from 'react'

type TSuccessProps = {
  title?: string
  description?: string | React.ReactNode
  variant?: 'default' | 'destructive' | 'success'
}

type TErrorProps = {
  title?: string
  description?: string
  gqlError?: GqlError
  variant?: 'default' | 'destructive' | 'success'
}

export function useNotification() {
  const { toast } = useToast()

  const handleShowNotification = useCallback(
    (title?: string, description?: string | React.ReactNode, variant: 'default' | 'destructive' | 'success' = 'default') => {
      toast({
        variant,
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
      })
    },
    [toast],
  )

  const handleSuccess = useCallback(
    (props: TSuccessProps) => {
      handleShowNotification(props.title ?? undefined, props.description ?? undefined, 'success')
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

      handleShowNotification(props.title, description, 'destructive')
    },
    [handleShowNotification],
  )

  return {
    successNotification: handleSuccess,
    errorNotification: handleError,
  }
}
