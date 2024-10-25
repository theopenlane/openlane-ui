import { useEffect, useState } from 'react'
import { CombinedError } from 'urql'

export const useGqlError = (error?: CombinedError) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([])

  useEffect(() => {
    if (error) {
      const messages: string[] = []

      if (error.graphQLErrors) {
        error.graphQLErrors.forEach((graphQLError) => {
          messages.push(graphQLError.message)
        })
      }

      if (error.networkError) {
        messages.push(error.networkError.message)
      }

      setErrorMessages(messages)
    }
  }, [error])

  return {
    errorMessages,
  }
}
