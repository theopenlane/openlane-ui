import { useToast } from '@repo/ui/use-toast'
import { useEffect, useState } from 'react'
import { CombinedError } from 'urql'

export function useGQLErrorToast() {
  const { toast } = useToast()
  const [title, setTitle] = useState('API Error')
  const [error, setError] = useState<CombinedError | null>(null)

  const toastGQLError = ({ title, error }: { title: string; error: CombinedError }) => {
    setTitle(title)
    setError(error)
  }

  useEffect(() => {
    if (!error) return

    console.error(error)

    const messages: string[] = []

    if (error.graphQLErrors) {
      error.graphQLErrors.forEach((graphQLError) => {
        const path = graphQLError.path?.join('.') ?? ''
        messages.push(path + ' ' + graphQLError.message)
      })
    }

    if (error.networkError) {
      messages.push(error.networkError.message)
    }

    toast({
      title: title,
      variant: 'destructive',
      description: messages.join('\n'),
    })
  }, [error])

  return { toastGQLError }
}
