import { useEffect, useRef } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { getQueryErrorDescription } from '@/utils/graphQlErrorMatcher'

type TUseQueryErrorNotificationProps = {
  error: unknown
  description: string
}

export const useQueryErrorNotification = ({ error, description }: TUseQueryErrorNotificationProps) => {
  const { errorNotification } = useNotification()
  const notifiedMessageRef = useRef<string | null>(null)

  useEffect(() => {
    if (!error) {
      notifiedMessageRef.current = null
      return
    }

    const message = getQueryErrorDescription(error, description)

    if (notifiedMessageRef.current === message) {
      return
    }

    notifiedMessageRef.current = message
    errorNotification({ title: 'Error', description: message })
  }, [error, description, errorNotification])
}
