'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react'
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

  const clientRef = useRef<Client | null>(null)
  const lastTokenRef = useRef<string | null>(null)

  const disposeClient = useCallback(() => {
    if (clientRef.current) {
      console.log('[WS] dispose client')
      clientRef.current.dispose()
    }
    clientRef.current = null
    setClient(null)
    setIsConnected(false)
  }, [])

  const resetConnection = useCallback(() => {
    console.log('[WS] manual reset')
    setHasFatalError(false)
    setError(null)
    lastTokenRef.current = null
    disposeClient()
  }, [disposeClient])

  useEffect(() => {
    if (status !== 'authenticated' || !token || !websocketGQLUrl || hasFatalError) {
      console.log('[WS] skip init', {
        status,
        hasToken: Boolean(token),
        hasFatalError,
      })
      disposeClient()
      return
    }

    if (lastTokenRef.current === token && clientRef.current) {
      console.log('[WS] reuse existing client')
      return
    }

    lastTokenRef.current = token

    console.log('[WS] create client (lazy)')

    const wsClient = createClient({
      url: websocketGQLUrl,
      lazy: true,
      retryAttempts: 5,
      keepAlive: 20_000,
      connectionParams: async () => ({
        Authorization: `Bearer ${token}`,
      }),
    })

    const unsubConnected = wsClient.on('connected', () => {
      console.log('[WS] socket connected')
      setIsConnected(true)
      setError(null)
      setHasFatalError(false)
    })

    const unsubClosed = wsClient.on('closed', (event) => {
      const reason = (event as CloseEvent)?.reason?.toLowerCase?.() ?? ''
      console.warn('[WS] socket closed', reason || 'no reason')
      setIsConnected(false)

      if (reason.includes('terminated') || reason.includes('unauthorized') || reason.includes('forbidden')) {
        console.error('[WS] fatal close reason')
        setHasFatalError(true)
        setError(reason || 'fatal websocket close')
      }
    })

    const unsubError = wsClient.on('error', (err) => {
      console.error('[WS] protocol error', err)
      setIsConnected(false)
    })

    clientRef.current = wsClient
    setClient(wsClient)

    return () => {
      console.log('[WS] cleanup')
      unsubConnected()
      unsubClosed()
      unsubError()
      disposeClient()
    }
  }, [token, status, hasFatalError, disposeClient])

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
