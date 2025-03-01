import { useToast } from '@repo/ui/use-toast'
import { CombinedError } from 'urql'

type TSuccessProps = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

type TErrorProps = {
  title?: string
  description?: string
  gqlError?: CombinedError
  variant?: 'default' | 'destructive' | 'success'
}

export function useNotification() {
  const { toast } = useToast()

  const handleSuccess = (props: TSuccessProps) => {
    handleShowNotification(props.title ?? undefined, props.description ?? undefined, 'success')
  }

  const handleError = (props: TErrorProps) => {
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
  }

  const handleShowNotification = (title?: string, description?: string, variant: 'default' | 'destructive' | 'success' = 'default') => {
    toast({
      variant: variant,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    })
  }

  return {
    successNotification: (props: TSuccessProps) => handleSuccess(props),
    errorNotification: (props: TErrorProps) => handleError(props),
  }
}
