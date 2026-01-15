'use client'

import { useWebSocketClient } from '@/providers/websocket-provider'
import { useEffect, useRef } from 'react'

interface UseSubscriptionOptions<TData> {
  query: string
  variables?: Record<string, unknown>
  onData: (data: TData) => void
  onError?: (error: unknown) => void
}

export function useSubscription<TData>({ query, variables, onData, onError }: UseSubscriptionOptions<TData>) {
  const { client, isConnected } = useWebSocketClient()

  const onDataRef = useRef(onData)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onDataRef.current = onData
    onErrorRef.current = onError
  }, [onData, onError])

  useEffect(() => {
    if (!client) return

    const unsubscribe = client.subscribe(
      {
        query,
        variables,
      },
      {
        next: ({ data }: { data?: TData | null }) => {
          if (data) {
            onDataRef.current(data)
          }
        },
        error: (err: unknown) => {
          if (onErrorRef.current) onErrorRef.current(err)
          else console.error('Subscription error:', err)
        },
        complete: () => {},
      },
    )

    return () => {
      unsubscribe()
    }
  }, [client, query, variables])

  return { isConnected }
}
