'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { createClient, Client } from 'graphql-ws'
import { useSession } from 'next-auth/react'
import { websocketGQLUrl } from '@repo/dally/auth'

interface WebSocketContextType {
  client: Client | null
  isConnected: boolean
  error: unknown | null
  resetConnection: () => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  client: null,
  isConnected: false,
  error: null,
  resetConnection: () => {},
})

export function useWebSocketClient() {
  return useContext(WebSocketContext)
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { data: session, status } = useSession()
  const token = session?.user?.accessToken

  const [client, setClient] = useState<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<unknown | null>(null)
  const [hasFatalError, setHasFatalError] = useState(false)
  const [clientToken, setClientToken] = useState<string | null>(null)

  const shouldSkip = status !== 'authenticated' || !token || !websocketGQLUrl || hasFatalError

  // Render-time state adjustment: create/clear client when deps change
  if (!shouldSkip && token && token !== clientToken) {
    setClientToken(token)
    setClient(
      createClient({
        url: websocketGQLUrl,
        lazy: true,
        retryAttempts: 5,
        keepAlive: 20_000,
        connectionParams: async () => ({
          Authorization: `Bearer ${token}`,
        }),
      }),
    )
  } else if (shouldSkip && clientToken !== null) {
    setClientToken(null)
    setClient(null)
    setIsConnected(false)
  }

  const resetConnection = useCallback(() => {
    console.log('[WS] manual reset')
    setHasFatalError(false)
    setError(null)
    setClient(null)
    setIsConnected(false)
    setClientToken(null)
  }, [])

  // Effect handles event subscriptions and cleanup only
  useEffect(() => {
    if (!client) return

    const unsubConnected = client.on('connected', () => {
      console.log('[WS] socket connected')
      setIsConnected(true)
      setError(null)
      setHasFatalError(false)
    })

    const unsubClosed = client.on('closed', (event) => {
      const reason = (event as CloseEvent)?.reason?.toLowerCase?.() ?? ''
      console.warn('[WS] socket closed', reason || 'no reason')
      setIsConnected(false)

      if (reason.includes('terminated') || reason.includes('unauthorized') || reason.includes('forbidden')) {
        console.error('[WS] fatal close reason')
        setHasFatalError(true)
        setError(reason || 'fatal websocket close')
      }
    })

    const unsubError = client.on('error', (err) => {
      console.error('[WS] protocol error', err)
      setIsConnected(false)
    })

    return () => {
      console.log('[WS] cleanup')
      unsubConnected()
      unsubClosed()
      unsubError()
      client.dispose()
    }
  }, [client])

  return (
    <WebSocketContext.Provider
      value={{
        client,
        isConnected,
        error,
        resetConnection,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}
